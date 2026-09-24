import * as estudianteService from '../services/estudianteService.js';
import { buscarEstudiantePorId } from '../repositories/propuestaRepository.js';

const listarEstudiantes = async (req, res) => {
    try {
        const id_user = req.usuario.id;

        // Obtener id_cycle del estudiante directamente de la BD
        const estudiante = await buscarEstudiantePorId(id_user);
        if (!estudiante) {
            return res.status(404).json({ mensaje: 'El usuario no es estudiante' });
        }
        const id_cycle = estudiante.id_cycle;

        const estudiantes = await estudianteService.listarEstudiantesPorCiclo(id_cycle, id_user);

        res.status(200).json(estudiantes);
    } catch (error) {
        console.error('ERROR LISTAR ESTUDIANTES:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};

export { listarEstudiantes };