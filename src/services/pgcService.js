import db from '../config/db.js';
import * as pgcRepository from '../repositories/pgcRepository.js';
import { buscarPropuestaPorId } from '../repositories/propuestaRepository.js';
import { estaDentroDeLaEtapa, STAGES  } from '../validators/ciclosValidator.js';
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
    
    //aca se traen los archivos del pgc ya con su url firmada, si no tiene queda un arreglo vacio
    const archivos = await listarArchivosParaFicha(pgc.id_pgc);

    // 4. Devolver la respuesta (SIN nota ni comentarios de jurado)
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