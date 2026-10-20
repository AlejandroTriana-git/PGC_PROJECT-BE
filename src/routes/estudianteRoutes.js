import express from 'express';
import { listarEstudiantes } from '../controllers/estudianteController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/estudiantes:
 *   get:
 *     summary: Listar estudiantes del mismo ciclo
 *     description: Obtiene la lista de estudiantes que pertenecen al mismo ciclo académico que el usuario autenticado (ideal para el selector de integrantes al radicar propuesta).
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estudiantes obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_student:
 *                     type: integer
 *                     example: 2
 *                   id_user:
 *                     type: integer
 *                     example: 27
 *                   full_name:
 *                     type: string
 *                     example: "Juan David Morales Martinez"
 *                   mail_user:
 *                     type: string
 *                     example: "jdmoralesmartinez@cundinamarcau.edu.co"
 *       401:
 *         description: Token no proporcionado o inválido
 *       404:
 *         description: El usuario autenticado no es estudiante
 *       500:
 *         description: Error interno del servidor
 */
// GET /api/estudiantes
router.get('/', verificarToken, listarEstudiantes);

export default router;