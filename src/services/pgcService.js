import db from '../config/db.js';
import * as pgcRepository from '../repositories/pgcRepository.js';
import { buscarPropuestaPorId } from '../repositories/propuestaRepository.js';
import { estaDentroDeLaEtapa, STAGES, encontrarFechasEtapas } from '../validators/ciclosValidator.js';
import { RESULTADOS_POR_PAGINA } from '../validators/busquedaPgcValidator.js';
import { listarArchivosParaFicha } from './pgcArchivoService.js';

// ============================================
// ISSUE 1: Listar propuestas aprobadas sin PGC
// ============================================

export const listarPropuestasAprobadasSinPgc = async (id_usuario) => {
    const propuestas = await pgcRepository.listarPropuestasAprobadasSinPgc(id_usuario);
    return propuestas;
};

// ============================================
// ISSUE 2: Registrar PGC por medio de un SP
// ============================================

export const crearPgc = async (id_proposal, id_usuario) => {
    // 1. Buscar la propuesta (se necesita también para obtener id_cycle)
    const propuesta = await buscarPropuestaPorId(id_proposal);
    if (!propuesta) {
        throw { status: 404, mensaje: 'Propuesta no encontrada' };
    }

    // 2. Validar ventana de tiempo (regla reusable, se queda en JS)
    const dentroDeFecha = await estaDentroDeLaEtapa(
        propuesta.id_cycle,
        STAGES.REGISTRO_PGC
    );

    //aca si esta fuera de fecha se devuelve el rango habilitado para que el FE lo muestre
    if (!dentroDeFecha) {
        const fechas = await encontrarFechasEtapas(propuesta.id_cycle, STAGES.REGISTRO_PGC);
        throw {
            status: 400,
            mensaje: 'Fuera del rango de fechas de registro de PGC',
            ...(fechas && {
                fecha_inicio_registro_pgc: fechas.fechaInicio,
                fecha_fin_registro_pgc: fechas.fechaFin
            })
        };
    }

    // 3. Delegar el resto al SP
    const { id_pgc, codigo, mensaje } = await pgcRepository.crearPgc(
        id_proposal,
        id_usuario,
        dentroDeFecha
    );

    if (codigo !== 1) {
        throw { status: codigo, mensaje };
    }

    return { id_pgc, mensaje };
};

// ============================================
// ISSUE 3: Listar mis PGC
// ============================================

export const listarMisPgc = async (id_usuario) => {
    const pgcs = await pgcRepository.listarPgcPorUsuario(id_usuario);
    return pgcs;
};

// ============================================
// Ficha histórica del PGC (HU-05)
// ============================================

export const obtenerPgcPorId = async (id_pgc) => {
    //Hacer mediante sp
    
    // 1. Buscar el PGC traynedo categorias y los integrantes
    const {pgc, categorias, integrantes} = await pgcRepository.buscarPgcPorId(id_pgc);

    //aca si el pgc no existe se responde 404 en vez de reventar con un 500
    if (!pgc) {
        throw { status: 404, mensaje: 'PGC no encontrado' };
    }
    
    //aca se traen los archivos del pgc ya con su url firmada, si no tiene queda un arreglo vacio
    const archivos = await listarArchivosParaFicha(pgc.id_pgc);

    return {
        id_pgc: pgc.id_pgc,
        id_proposal: pgc.id_proposal,
        id_pgc_previous: pgc.id_pgc_previous,
        title_proposal: pgc.title_proposal,
        problem_proposal: pgc.problem_proposal,
        justification_proposal: pgc.justification_proposal,
        objectives_proposal: pgc.objectives_proposal,
        solution_proposal: pgc.solution_proposal,
        categorias: categorias,
        integrantes: integrantes,
        archivos: archivos,
        name_cycle: pgc.name_cycle,
        estado: pgc.state_pgc
    };
};

// ============================================
// HU-04: Buscador de PGC
// ============================================

export const buscarPgc = async (filtros) => {
    const limite         = RESULTADOS_POR_PAGINA;
    const desplazamiento = (filtros.pagina - 1) * limite;

    const { codigo, mensaje, total, filas, categorias } =
        await pgcRepository.buscarPgc(filtros, limite, desplazamiento);

    if (codigo !== 1) {
        throw { status: codigo, mensaje };
    }

    const total_paginas = Math.ceil(total / limite);

    // Repartimos categorías por propuesta
    const categorias_por_propuesta = {};
    for (const cat of categorias) {
        if (!categorias_por_propuesta[cat.id_proposal]) {
            categorias_por_propuesta[cat.id_proposal] = [];
        }
        categorias_por_propuesta[cat.id_proposal].push({
            id_category:   cat.id_category,
            name_category: cat.name_category
        });
    }

    return {
        resultados: filas.map((fila) => ({
            id_pgc:         fila.id_pgc,
            title_proposal: fila.title_proposal,
            name_cycle:     fila.name_cycle,
            categorias:     categorias_por_propuesta[fila.id_proposal] || [],
            estado:         fila.state_pgc
        })),
        pagina_actual:    filtros.pagina,
        total_paginas,
        total_resultados: total
    };
};

// ============================================
// HU-07: Calificación (BE#2)
// ============================================

// Listar PGCs pendientes de calificar
export const listarPgcPendientesDeCalificar = async (id_juror) => {
    const pgcs = await pgcRepository.listarPgcPendientesDeCalificar(id_juror);

    if (pgcs.length === 0) {
        return [];
    }

    const pgcsValidos = [];
    for (const pgc of pgcs) {
        const dentroDeFecha = await estaDentroDeLaEtapa(pgc.id_cycle, STAGES.CALIFICACION);
        if (dentroDeFecha) {
            pgcsValidos.push(pgc);
        }
    }

    return pgcsValidos;
};

// ============================================
// HU-07: Registrar calificación (ORDEN CORREGIDO)
// ============================================

export const calificarPgc = async (id_pgc, id_juror, data) => {
    const { grade, comment } = data;

    // 1. Validar campos
    if (grade === undefined || grade === null || !comment) {
        throw { status: 400, mensaje: 'Debe enviar grade y comment' };
    }

    // 2. Validar rango de la nota
    const nota = Number(grade);
    if (isNaN(nota) || nota < 0.0 || nota > 5.0) {
        throw { status: 400, mensaje: 'La nota debe estar entre 0.0 y 5.0' };
    }

    // 3. Buscar el PGC (el repositorio devuelve { pgc, categorias, integrantes }, aca solo se usa pgc)
    const { pgc } = await pgcRepository.buscarPgcPorId(id_pgc);
    if (!pgc) {
        throw { status: 404, mensaje: 'PGC no encontrado' };
    }

    // 4. Verificar que el usuario sea jurado del ciclo
    const esJurado = await pgcRepository.esJuradoDelCiclo(id_juror, pgc.id_cycle);
    if (!esJurado) {
        throw { status: 403, mensaje: 'No eres jurado de este ciclo' };
    }

    //aca si el pgc ya esta terminado no se deja calificar mas
    if (pgc.state_pgc === 'Terminado') {
        throw { status: 400, mensaje: 'Este PGC ya está terminado' };
    }

    // 5. Verificar ventana de "Calificación"
    const dentroDeFecha = await estaDentroDeLaEtapa(pgc.id_cycle, STAGES.CALIFICACION);
if (!dentroDeFecha) {
    const fechas = await encontrarFechasEtapas(pgc.id_cycle, STAGES.CALIFICACION);

    // Formatear las fechas como DD/MM/YYYY
    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        const d = new Date(fecha);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const anio = d.getFullYear();
        return `${dia}/${mes}/${anio}`;
    };

    const inicio = formatearFecha(fechas?.fechaInicio);  
    const fin = formatearFecha(fechas?.fechaFin);       

    throw {
        status: 400,
        mensaje: `Fuera del periodo de calificación (habilitado del ${inicio} al ${fin})`,
        fecha_inicio_calificacion: fechas?.fechaInicio, 
        fecha_fin_calificacion: fechas?.fechaFin         
    };
}

    // 6. Verificar que no haya calificado antes
    const yaCalifico = await pgcRepository.yaCalificoPgc(id_pgc, id_juror);
    if (yaCalifico) {
        throw { status: 400, mensaje: 'Ya calificaste este PGC' };
    }

    // 7. Insertar la calificación
    const id_jury_grade = await pgcRepository.crearCalificacion(id_pgc, id_juror, nota, comment);

    // 8. Auto-transición
    await verificarYMarcarTerminado(id_pgc, pgc.id_cycle);

    return { id_jury_grade, mensaje: 'Calificación registrada con éxito' };
};

// ============================================
// HU-07: Auto-transición
// ============================================

const verificarYMarcarTerminado = async (id_pgc, id_cycle) => {
    const totalJurados = await pgcRepository.contarJuradosDelCiclo(id_cycle);
    const totalCalificaciones = await pgcRepository.contarCalificacionesDelPgc(id_pgc);

    if (totalJurados > 0 && totalJurados === totalCalificaciones) {
        await pgcRepository.marcarPgcComoTerminado(id_pgc);
        console.log(`✅ PGC ${id_pgc} marcado como Terminado (${totalCalificaciones}/${totalJurados} notas)`);
    }
};

// ============================================
// HU-07: Vista consolidada
// ============================================

export const obtenerCalificaciones = async (id_pgc, id_usuario) => {
    //el repositorio devuelve { pgc, categorias, integrantes }, aca solo se usa pgc
    const { pgc } = await pgcRepository.buscarPgcPorId(id_pgc);
    if (!pgc) {
        throw { status: 404, mensaje: 'PGC no encontrado' };
    }

    const esEquipo = await pgcRepository.esDelEquipo(pgc.id_proposal, id_usuario);

    if (esEquipo) {
        //al equipo solo se le manda la nota global y los comentarios, no la nota de cada jurado
        const calificaciones = await pgcRepository.listarComentariosDelPgc(id_pgc);
        const promedio = await pgcRepository.calcularPromedioPgc(id_pgc);

        return {
            id_pgc: pgc.id_pgc,
            title_proposal: pgc.title_proposal,
            nota_global: promedio ? Number(Number(promedio).toFixed(2)) : null,
            estado: pgc.state_pgc,
            calificaciones: calificaciones
        };
    }

    const esJurado = await pgcRepository.esJuradoDelCiclo(id_usuario, pgc.id_cycle);

    if (esJurado) {
        const miCalificacion = await pgcRepository.buscarCalificacionDeJurado(id_pgc, id_usuario);

        return {
            id_pgc: pgc.id_pgc,
            title_proposal: pgc.title_proposal,
            estado: pgc.state_pgc,
            mi_calificacion: miCalificacion || null
        };
    }

    throw { status: 403, mensaje: 'No tienes permiso para ver las notas de este PGC' };
};

// ============================================
// HU-07: Listar PGCs calificados por el jurado logueado
// ============================================

export const listarPgcCalificadosPorJurado = async (id_juror) => {
    const pgcs = await pgcRepository.listarPgcCalificadosPorJurado(id_juror);
    return pgcs;
};