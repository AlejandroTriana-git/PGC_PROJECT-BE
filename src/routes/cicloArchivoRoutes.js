import { Router } from "express";
import * as cicloArchivoController from "../controllers/cicloArchivoController.js";
import verificarToken from '../middlewares/autenticarMiddleware.js';       
import { subirPdfDocumento } from '../middlewares/uploadMiddleware.js';
import { perteneceAlCiclo } from '../middlewares/pertenecenciaCiclomiddleware.js';
import { autorizarEncargadoDeCiclo } from '../middlewares/autorizarEncargadoMiddleware.js';

const router = Router();

/**   
 * Estos sirven para archivos tipo rubrica 
**/

/**
 * @swagger
 * /api/ciclos/{id}/documentos/rubrica:
 *   post:
 *     summary: Subir rúbrica del ciclo
 *     description: Permite al encargado del ciclo subir un documento de tipo Rúbrica en PDF.
 *     tags: [Documentos de Ciclo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del ciclo
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title_file:
 *                 type: string
 *               desc_file:
 *                 type: string
 *               version_label:
 *                 type: string
 *                 example: "V1.0"
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Rúbrica creada exitosamente
 *       400:
 *         description: Datos inválidos o archivo no permitido
 *       403:
 *         description: No eres el encargado de este ciclo
 */
// Ruta para crear un nuevo archivo de tipo rubrica de ciclo
router.post('/:id/documentos/rubrica', verificarToken,  autorizarEncargadoDeCiclo(), subirPdfDocumento, cicloArchivoController.crearRubrica); 

/**
 * @swagger
 * /api/ciclos/{id}/documentos:
 *   get:
 *     summary: Listar documentos vigentes del ciclo
 *     description: Obtiene los documentos (como rúbricas) actuales de un ciclo específico.
 *     tags: [Documentos de Ciclo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del ciclo
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           example: "Rúbrica"
 *         description: Tipo de documento a filtrar
 *     responses:
 *       200:
 *         description: Lista de documentos
 *       401:
 *         description: Token inválido
 */
// Ruta para obtener archivos vigentes de un ciclo solo rubricas
router.get('/:id/documentos', verificarToken, perteneceAlCiclo, cicloArchivoController.obtenerDocumentosCiclo);

/**
 * @swagger
 * /api/ciclos/{id}/documentos/{title_file}/historial:
 *   get:
 *     summary: Ver historial de versiones de un documento
 *     description: Obtiene el historial de versiones de una rúbrica específica.
 *     tags: [Documentos de Ciclo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del ciclo
 *       - in: path
 *         name: title_file
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre exacto del documento
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           example: "Rúbrica"
 *     responses:
 *       200:
 *         description: Historial de versiones con metadatos
 *       401:
 *         description: Token inválido
 */
//Ruta para obteneer el historial de versiones de un documento puntual de tipo rubrica
router.get('/:id/documentos/:title_file/historial', verificarToken, perteneceAlCiclo, cicloArchivoController.obtenerHistoriaDocumentosCiclo);

export default router;