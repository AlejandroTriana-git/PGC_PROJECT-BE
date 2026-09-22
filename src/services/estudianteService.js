import * as estudianteRepository from '../repositories/estudianteRepository.js';
import { buscarEstudiantePorId } from '../repositories/propuestaRepository.js';

// Listar estudiantes por ciclo
export const listarEstudiantesPorCiclo = async (id_cycle, id_user) => {
    // 1. Buscar al líder para obtener su id_student
    const lider = await buscarEstudiantePorId(id_user);

    if (!lider) {
        throw { status: 404, mensaje: 'El usuario no es estudiante' };
    }

    // 2. Listar estudiantes del mismo ciclo
    const estudiantes = await estudianteRepository.listarEstudiantesPorCiclo(id_cycle, lider.id_student);

    return estudiantes;
};