import * as pgcRepository from '../repositories/pgcRepository.js';

// Listar propuestas aprobadas sin PGC
export const listarPropuestasAprobadasSinPgc = async (id_usuario) => {
    const propuestas = await pgcRepository.listarPropuestasAprobadasSinPgc(id_usuario);
    return propuestas;
};