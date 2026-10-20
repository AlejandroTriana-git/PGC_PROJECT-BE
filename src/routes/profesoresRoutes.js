import { Router } from 'express';
import verificarToken from '../middlewares/autenticarMiddleware.js';
import { listarProfesores } from '../controllers/profesoresController.js';

const router = Router();

/**
 * @swagger
 * /api/profesores:
 *   get:
 *     summary: Listar profesores disponibles
 *     description: Obtiene la lista de profesores para asignar como encargados o jurados. Permite filtrar por ciclo y excluir a los que ya tienen un rol asignado.
 *     tags: [Profesores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_cycle
 *         schema:
 *           type: integer
 *         description: ID del ciclo para filtrar
 *       - in: query
 *         name: excluirEncargado
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Poner "true" para excluir al encargado actual del ciclo
 *       - in: query
 *         name: excluirJurado
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Poner "true" para excluir a los jurados actuales del ciclo
 *     responses:
 *       200:
 *         description: Lista de profesores obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_user:
 *                     type: integer
 *                     example: 2
 *                   full_name:
 *                     type: string
 *                     example: "Oscar Morera"
 *                   mail_user:
 *                     type: string
 *                     example: "omorera@cundinamarcau.edu.co"
 *       401:
 *         description: Token no proporcionado o inválido
 *       500:
 *         description: Error interno del servidor
 */
// GET /api/profesores — lista profesores disponibles (acceso autenticado)
router.get('/', verificarToken, listarProfesores);

export default router;