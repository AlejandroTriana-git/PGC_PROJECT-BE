import { Router } from 'express';
import verificarToken from '../middlewares/autenticarMiddleware.js';
import autorizarRoles from '../middlewares/rolMiddleware.js';
import { subirPdfDocumento } from '../middlewares/uploadMiddleware.js';
import * as lineamientoController from '../controllers/lineamientoController.js';

const router = Router();

//los lineamientos son globales (no dependen de un ciclo): los ve cualquier usuario con sesion
//y solo el Administrador los publica o sube una version nueva

/**
 * @swagger
 * /api/lineamientos:
 *   get:
 *     summary: Listar lineamientos vigentes
 *     description: Obtiene la última versión (vigente) de cada lineamiento global con su URL firmada. Requiere estar autenticado.
 *     tags: [Lineamientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de lineamientos vigentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_document:
 *                     type: integer
 *                     example: 1
 *                   title_file:
 *                     type: string
 *                     example: "Plantilla de radicación de propuesta de PGC"
 *                   version_label:
 *                     type: string
 *                     example: "V1.0"
 *                   url:
 *                     type: string
 *                     example: "https://storage.googleapis.com/..."
 *       401:
 *         description: Token no proporcionado o inválido
 */
// GET /api/lineamientos
router.get('/', verificarToken, lineamientoController.listar);

/**
 * @swagger
 * /api/lineamientos:
 *   post:
 *     summary: Subir un lineamiento (o nueva versión)
 *     description: Permite al Administrador subir un archivo PDF como lineamiento global. Si ya existe el título, se crea una nueva versión.
 *     tags: [Lineamientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title_file
 *               - version_label
 *               - archivo
 *             properties:
 *               title_file:
 *                 type: string
 *                 example: "Reglamento general de trabajos de grado"
 *               desc_file:
 *                 type: string
 *                 example: "Actualización de plazos"
 *               version_label:
 *                 type: string
 *                 example: "V2.0"
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Lineamiento publicado exitosamente
 *       400:
 *         description: Formato no válido o tamaño excedido
 *       403:
 *         description: Solo el Administrador puede subir lineamientos
 */
// POST /api/lineamientos (solo Administrador)
router.post('/', verificarToken, autorizarRoles('Administrador'), subirPdfDocumento, lineamientoController.crear);

/**
 * @swagger
 * /api/lineamientos/{title_file}/historial:
 *   get:
 *     summary: Ver historial de un lineamiento
 *     description: Devuelve todas las versiones de un lineamiento específico, basándose en su título.
 *     tags: [Lineamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: title_file
 *         required: true
 *         schema:
 *           type: string
 *         description: Título exacto del lineamiento (codificado en URL)
 *         example: "Reglamento%20general%20de%20trabajos%20de%20grado"
 *     responses:
 *       200:
 *         description: Historial de versiones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   version_label:
 *                     type: string
 *                     example: "V1.0"
 *                   uploaded_at:
 *                     type: string
 *                     format: date-time
 *                   uploaded_by:
 *                     type: string
 *                     example: "Diego Fernando Ramírez"
 *       401:
 *         description: Token no proporcionado o inválido
 */
// GET /api/lineamientos/:title_file/historial
router.get('/:title_file/historial', verificarToken, lineamientoController.historial);

export default router;