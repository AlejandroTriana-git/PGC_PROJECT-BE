import * as estudianteService from '../services/estudianteService.js';

const listarEstudiantes = async (req, res) => {
    try {
        const id_cycle = req.query.cycle;
        const id_user = req.usuario.id;

        if (!id_cycle) {
            return res.status(400).json({ mensaje: 'Debe especificar el ciclo (?cycle=X)' });
        }

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