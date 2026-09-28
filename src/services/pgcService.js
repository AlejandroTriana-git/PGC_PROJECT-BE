import db from '../config/db.js';
import * as pgcRepository from '../repositories/pgcRepository.js';
import { buscarPropuestaPorId, buscarEstudiantePorId } from '../repositories/propuestaRepository.js';
import { validarFechaEtapa } from '../utils/validarFechaEtapa.js';

// ============================================
// ISSUE 1: Listar propuestas aprobadas sin PGC
// ============================================

export const listarPropuestasAprobadasSinPgc = async (id_usuario) => {
    const propuestas = await pgcRepository.listarPropuestasAprobadasSinPgc(id_usuario);
    return propuestas;
};

// ============================================
// ISSUE 2: Registrar PGC
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
    const fechas = await pgcRepository.buscarFechasRegistroPgc(propuesta.id_cycle);
    if (!fechas) {
        throw { status: 404, mensaje: 'No hay fechas configuradas para el registro de PGC en este ciclo' };
    }

    const dentroDeFecha = validarFechaEtapa(fechas.start_date, fechas.end_date);
    if (!dentroDeFecha) {
        throw {
            status: 400,
            mensaje: 'Fuera del rango de fechas',
            fecha_inicio_registro_pgc: fechas.start_date,
            fecha_fin_registro_pgc: fechas.end_date
        };
    }

    // 6. Crear el PGC (con transacción)
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const id_pgc = await pgcRepository.crearPgc(connection, {
            id_cycle: propuesta.id_cycle,
            id_proposal: id_proposal
        });

        await connection.commit();

        return { id_pgc, mensaje: 'PGC registrado exitosamente' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// ============================================
// ISSUE 3: Listar mis PGC
// ============================================

export const listarMisPgc = async (id_usuario) => {
    const pgcs = await pgcRepository.listarPgcPorUsuario(id_usuario);
    return pgcs;
};