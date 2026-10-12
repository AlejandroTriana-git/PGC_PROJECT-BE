import db from '../config/db.js';
import * as pgcRepository from '../repositories/pgcRepository.js';
import { buscarPropuestaPorId, buscarEstudiantePorId } from '../repositories/propuestaRepository.js';
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
// ISSUE 2: Registrar PGC (SIN transacción)
// ============================================

export const crearPgc = async (id_proposal, id_usuario) => {
    // 1. Buscar la propuesta
    const propuesta = await buscarPropuestaPorId(id_proposal);
    if (!propuesta) {
        throw { status: 404, mensaje: 'Propuesta no encontrada' };
    }

    // 2. Verificar que esté aprobada
    if (propuesta.state_proposal !== 'Aprobada') {
        throw { status: 400, mensaje: 'La propuesta no está aprobada' };
    }

    // 3. Verificar que el usuario sea el líder
    const lider = await buscarEstudiantePorId(id_usuario);
    if (!lider || lider.id_student !== propuesta.id_leader) {
        throw { status: 403, mensaje: 'Solo el líder puede registrar el PGC' };
    }

    // 4. Verificar que no exista un PGC para esa propuesta
    const existe = await pgcRepository.existePgcParaPropuesta(id_proposal);
    if (existe) {
        throw { status: 400, mensaje: 'Ya existe un PGC para esta propuesta' };
    }

    // 5. Verificar que esté dentro de la ventana "Registro PGC"
    const dentroDeFecha = await estaDentroDeLaEtapa(propuesta.id_cycle, STAGES.REGISTRO_PGC);
    if (!dentroDeFecha) {
        const fechas = await encontrarFechasEtapas(propuesta.id_cycle, STAGES.REGISTRO_PGC);
        throw {
            status: 400,
            mensaje: 'Fuera del rango de fechas',
            ...(fechas && {
                fecha_inicio_registro_pgc: fechas.start_date,
                fecha_fin_registro_pgc: fechas.end_date
            })
        };
    }

    // 6. Crear el PGC
    const id_pgc = await pgcRepository.crearPgc(db, {
        id_cycle: propuesta.id_cycle,
        id_proposal: id_proposal
    });

    return { id_pgc, mensaje: 'PGC registrado exitosamente' };
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
    const pgc = await pgcRepository.buscarPgcPorId(id_pgc);
    if (!pgc) {
        throw { status: 404, mensaje: 'PGC no encontrado' };
    }

    const categorias = await pgcRepository.buscarCategoriasPropuesta(pgc.id_proposal);
    const integrantes = await pgcRepository.buscarIntegrantesPropuesta(pgc.id_proposal);
    const archivos = await listarArchivosParaFicha(pgc.id_pgc);

    return {
        id_pgc: pgc.id_pgc,
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
    const total_resultados = Number(await pgcRepository.contarPgcBuscados(filtros));
    const total_paginas = Math.ceil(total_resultados / RESULTADOS_POR_PAGINA);
    const desplazamiento = (filtros.pagina - 1) * RESULTADOS_POR_PAGINA;

    const filas = await pgcRepository.buscarPgcPaginados(filtros, RESULTADOS_POR_PAGINA, desplazamiento);

    const categorias = await pgcRepository.buscarCategoriasDeVariasPropuestas(filas.map((fila) => fila.id_proposal));
    const categorias_por_propuesta = {};
    for (const categoria of categorias) {
        if (!categorias_por_propuesta[categoria.id_proposal]) categorias_por_propuesta[categoria.id_proposal] = [];
        categorias_por_propuesta[categoria.id_proposal].push({
            id_category: categoria.id_category,
            name_category: categoria.name_category,
        });
    }

    return {
        resultados: filas.map((fila) => ({
            id_pgc: fila.id_pgc,
            title_proposal: fila.title_proposal,
            name_cycle: fila.name_cycle,
            categorias: categorias_por_propuesta[fila.id_proposal] || [],
            estado: fila.state_pgc,
        })),
        pagina_actual: filtros.pagina,
        total_paginas,
        total_resultados,
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

    // 3. Buscar el PGC
    const pgc = await pgcRepository.buscarPgcPorId(id_pgc);
    if (!pgc) {
        throw { status: 404, mensaje: 'PGC no encontrado' };
    }

    // 4. Verificar que el usuario sea jurado del ciclo
    const esJurado = await pgcRepository.esJuradoDelCiclo(id_juror, pgc.id_cycle);
    if (!esJurado) {
        throw { status: 403, mensaje: 'No eres jurado de este ciclo' };
    }

    // 5. ✅ PRIMERO: Verificar ventana de "Calificación"
    const dentroDeFecha = await estaDentroDeLaEtapa(pgc.id_cycle, STAGES.CALIFICACION);
    if (!dentroDeFecha) {
        throw { status: 400, mensaje: 'El periodo de calificación ha finalizado' };
    }

    // 6. ✅ DESPUÉS: Verificar que no haya calificado antes
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
    const pgc = await pgcRepository.buscarPgcPorId(id_pgc);
    if (!pgc) {
        throw { status: 404, mensaje: 'PGC no encontrado' };
    }

    const esEquipo = await pgcRepository.esDelEquipo(pgc.id_proposal, id_usuario);

    if (esEquipo) {
        const calificaciones = await pgcRepository.listarCalificacionesDelPgc(id_pgc);
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