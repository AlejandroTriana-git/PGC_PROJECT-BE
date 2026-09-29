import db from '../config/db.js';
import * as pgcRepository from '../repositories/pgcRepository.js';
import { buscarPropuestaPorId, buscarEstudiantePorId } from '../repositories/propuestaRepository.js';
import { estaDentroDeLaEtapa } from '../validators/ciclosValidator.js';

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
    const dentroDeFecha = await estaDentroDeLaEtapa(propuesta.id_cycle, 'Registro PGC');
    if (!dentroDeFecha) {
        const fechas = await pgcRepository.buscarFechasRegistroPgc(propuesta.id_cycle);
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