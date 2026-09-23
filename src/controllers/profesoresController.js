import { listarProfesoresDisponibles } from '../services/ciclosService.js';

/**
 * GET /api/profesores
 * Devuelve la lista de profesores disponibles.
 * Query params opcionales:
 *   - id_cycle          : filtrar por ciclo
 *   - excluirEncargado  : "true" para excluir al encargado actual del ciclo
 *   - excluirJurado     : "true" para excluir a los jurados actuales del ciclo
 */
export async function listarProfesores(req, res) {
    try {
        const { id_cycle, excluirEncargado, excluirJurado } = req.query;
        const profesores = await listarProfesoresDisponibles(
            id_cycle ? Number(id_cycle) : undefined,
            {
                excluirEncargado: excluirEncargado === 'true',
                excluirJurado:    excluirJurado    === 'true',
            }
        );
        res.status(200).json(profesores);
    } catch (error) {
        console.error('ERROR LISTAR PROFESORES:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || error.message || 'Error interno del servidor',
        });
    }
}