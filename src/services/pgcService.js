import db from '../config/db.js';
import * as pgcRepository from '../repositories/pgcRepository.js';
import { buscarPropuestaPorId, buscarEstudiantePorId } from '../repositories/propuestaRepository.js';
import { estaDentroDeLaEtapa, STAGES, encontrarFechasEtapas  } from '../validators/ciclosValidator.js';
import { RESULTADOS_POR_PAGINA } from '../validators/busquedaPgcValidator.js';

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
        //Se cambio a utilizar la funcion encontrarFechasEtapas para obtener las fechas de inicio y fin de la etapa de registro PGC
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

    // 6. Crear el PGC (SIN transacción)
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
// HU-04: Buscador de PGC
// ============================================

//esta funcion arma la respuesta del buscador con el formato que acordo el FE:
//{ resultados, pagina_actual, total_paginas, total_resultados }
//state_pgc sale como "estado" (mapeo de salida, el FE no ve el nombre de la columna)
export const buscarPgc = async (filtros) => {
    //primero se cuenta cuantos cumplen los filtros para saber cuantas paginas hay
    const total_resultados = Number(await pgcRepository.contarPgcBuscados(filtros));
    const total_paginas = Math.ceil(total_resultados / RESULTADOS_POR_PAGINA);
    //aca se calcula cuantos resultados se salta, en la pagina 1 ninguno, en la 2 salta 15, etc
    const desplazamiento = (filtros.pagina - 1) * RESULTADOS_POR_PAGINA;

    const filas = await pgcRepository.buscarPgcPaginados(filtros, RESULTADOS_POR_PAGINA, desplazamiento);

    //aca se piden las categorias de TODA la pagina juntas y despues se reparten por propuesta
    const categorias = await pgcRepository.buscarCategoriasDeVariasPropuestas(filas.map((fila) => fila.id_proposal));
    const categorias_por_propuesta = {};
    for (const categoria of categorias) {
        if (!categorias_por_propuesta[categoria.id_proposal]) categorias_por_propuesta[categoria.id_proposal] = [];
        categorias_por_propuesta[categoria.id_proposal].push({
            id_category: categoria.id_category,
            name_category: categoria.name_category,
        });
    }

    //aca se arma cada resultado con los nombres que espera el FE, si no tiene categorias queda un arreglo vacio
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