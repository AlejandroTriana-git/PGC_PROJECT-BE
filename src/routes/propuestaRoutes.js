import express from 'express';
import { listarPropuestasAprobadasSinPgc } from '../controllers/pgcController.js';
import { crearPropuesta, reenviarPropuesta, verPdfPropuesta, verMiPropuesta, listarPendientes, aprobar, rechazar } from '../controllers/propuestaController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';
import autorizarRoles from '../middlewares/rolMiddleware.js';
import { subirPdfPropuesta } from '../middlewares/uploadMiddleware.js';
import { puedeVerPropuesta } from '../middlewares/puedeVerPropuestaMiddleware.js';
import { autorizarEncargadoPropuesta } from '../middlewares/autorizarEncargadoMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/propuestas:
 *   post:
 *     summary: Radicar una propuesta
 *     description: Permite al Estudiante (líder) radicar una propuesta en su ciclo con su archivo PDF. Valida fechas, campos y cantidad de integrantes.
 *     tags: [Propuestas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title_proposal
 *               - descr_proposal
 *               - problem_proposal
 *               - justification_proposal
 *               - objectives_proposal
 *               - solution_proposal
 *               - id_cycle
 *               - integrantes
 *               - pdf
 *             properties:
 *               title_proposal:
 *                 type: string
 *                 example: "Plataforma de gestión"
 *               descr_proposal:
 *                 type: string
 *                 example: "Sistema web para..."
 *               problem_proposal:
 *                 type: string
 *               justification_proposal:
 *                 type: string
 *               objectives_proposal:
 *                 type: string
 *               solution_proposal:
 *                 type: string
 *               id_cycle:
 *                 type: integer
 *                 example: 1
 *               integrantes:
 *                 type: string
 *                 description: Arreglo de IDs en formato string
 *                 example: "[2, 3]"
 *               pdf:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Propuesta radicada exitosamente
 *       400:
 *         description: Faltan campos, fuera de fecha o integrantes inválidos (devuelve fechas si aplica)
 *       403:
 *         description: No eres estudiante
 */
// POST /api/propuestas (solo Estudiante)
router.post('/', verificarToken, autorizarRoles('Estudiante'), subirPdfPropuesta, crearPropuesta);

/**
 * @swagger
 * /api/propuestas/{id}/reenviar:
 *   patch:
 *     summary: Reenviar una propuesta rechazada
 *     description: Permite al líder corregir y reenviar una propuesta que fue rechazada.
 *     tags: [Propuestas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title_proposal:
 *                 type: string
 *               descr_proposal:
 *                 type: string
 *               problem_proposal:
 *                 type: string
 *               justification_proposal:
 *                 type: string
 *               objectives_proposal:
 *                 type: string
 *               solution_proposal:
 *                 type: string
 *               pdf:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Propuesta reenviada exitosamente
 *       400:
 *         description: La propuesta no está rechazada o ya alcanzó el límite de reenvíos
 *       403:
 *         description: Solo el líder puede reenviar
 */
// PATCH /api/propuestas/:id/reenviar (solo Estudiante, si rechazada)
router.patch('/:id/reenviar', verificarToken, autorizarRoles('Estudiante'), subirPdfPropuesta, reenviarPropuesta);

/**
 * @swagger
 * /api/propuestas/mia:
 *   get:
 *     summary: Ver el estado de mi propuesta
 *     description: Retorna la propuesta actual del estudiante logueado (incluyendo si fue rechazada y el comentario).
 *     tags: [Propuestas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detalle de la propuesta del estudiante
 *       404:
 *         description: No tienes propuestas registradas
 */
// GET /api/propuestas/mia (solo Estudiante)
router.get('/mia', verificarToken, autorizarRoles('Estudiante'), verMiPropuesta);

/**
 * @swagger
 * /api/propuestas/aprobadas-sin-pgc:
 *   get:
 *     summary: Listar propuestas aprobadas pendientes de registrar PGC
 *     description: Retorna las propuestas aprobadas del líder que aún no tienen un PGC creado.
 *     tags: [Propuestas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de propuestas aprobadas sin PGC
 */
// GET /api/propuestas/aprobadas-sin-pgc (solo Estudiante)
router.get('/aprobadas-sin-pgc', verificarToken, autorizarRoles('Estudiante'), listarPropuestasAprobadasSinPgc);

/**
 * @swagger
 * /api/propuestas:
 *   get:
 *     summary: Listar propuestas por ciclo y estado
 *     description: El encargado del ciclo visualiza las propuestas filtradas por ciclo y estado.
 *     tags: [Propuestas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cycle
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del ciclo a consultar
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           example: "Pendiente de validación"
 *     responses:
 *       200:
 *         description: Lista de propuestas
 *       400:
 *         description: Falta el parámetro cycle
 *       403:
 *         description: No eres el encargado de este ciclo
 */
// GET /api/propuestas?cycle=X&estado=Y (Estudiante, Profesor, Administrador)
router.get('/', verificarToken, autorizarRoles('Estudiante', 'Profesor', 'Administrador'), listarPendientes);

/**
 * @swagger
 * /api/propuestas/{id}/aprobar:
 *   patch:
 *     summary: Aprobar una propuesta
 *     description: Permite al encargado de ciclo aprobar una propuesta radicada.
 *     tags: [Propuestas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Propuesta aprobada correctamente
 *       403:
 *         description: No eres el encargado de este ciclo
 */
// PATCH /api/propuestas/:id/aprobar (encargado del ciclo)
router.patch('/:id/aprobar', verificarToken, autorizarEncargadoPropuesta(), aprobar);

/**
 * @swagger
 * /api/propuestas/{id}/rechazar:
 *   patch:
 *     summary: Rechazar una propuesta
 *     description: Permite al encargado de ciclo rechazar una propuesta, requiriendo un comentario obligatorio.
 *     tags: [Propuestas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comentario
 *             properties:
 *               comentario:
 *                 type: string
 *                 example: "El alcance es muy amplio, favor delimitar mejor el problema."
 *     responses:
 *       200:
 *         description: Propuesta rechazada (o anulada si es el 3er rechazo)
 *       400:
 *         description: Falta el comentario obligatorio
 *       403:
 *         description: No eres el encargado de este ciclo
 */
// PATCH /api/propuestas/:id/rechazar (encargado del ciclo)
router.patch('/:id/rechazar', verificarToken, autorizarEncargadoPropuesta(), rechazar);

/**
 * @swagger
 * /api/propuestas/{idProposal}/pdf:
 *   get:
 *     summary: Ver PDF de la propuesta
 *     description: Obtiene la URL firmada para visualizar el PDF original radicado en la propuesta.
 *     tags: [Propuestas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idProposal
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: URL del PDF obtenida correctamente
 *       403:
 *         description: No tienes permisos para ver esta propuesta
 *       404:
 *         description: Propuesta no encontrada
 */
// GET /api/propuestas/:idProposal/pdf (miembros del equipo o encargado)
router.get('/:idProposal/pdf', verificarToken, puedeVerPropuesta(), verPdfPropuesta);

export default router;