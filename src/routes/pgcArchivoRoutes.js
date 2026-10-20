import { Router } from "express";
import verificarToken from "../middlewares/autenticarMiddleware.js";
import { subirArchivoPgc } from "../middlewares/uploadMiddleware.js";
import * as pgcArchivoController from "../controllers/pgcArchivoController.js";

const router = Router();

/**
 * @swagger
 * /api/pgc/{id}/files:
 *   post:
 *     summary: Subir un archivo al PGC
 *     description: Permite al estudiante (líder o integrante) subir un archivo de evidencia en PDF, Word, Excel o Imagen (máx 10MB).
 *     tags: [Archivos PGC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del PGC
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title_file
 *               - desc_file
 *               - archivo
 *             properties:
 *               title_file:
 *                 type: string
 *                 example: "Documento de Arquitectura"
 *               desc_file:
 *                 type: string
 *                 example: "Diagrama de componentes del sistema"
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Archivo subido correctamente
 *       400:
 *         description: Archivo no enviado o formato inválido
 *       403:
 *         description: No perteneces al equipo o fuera de ventana
 */
// POST /api/pgc/:id/files
router.post("/:id/files", verificarToken, subirArchivoPgc, pgcArchivoController.subir);

/**
 * @swagger
 * /api/pgc/{id}/files:
 *   get:
 *     summary: Listar archivos del PGC
 *     description: Devuelve los archivos del PGC con su título, descripción y URL firmada para descargarlos.
 *     tags: [Archivos PGC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del PGC
 *     responses:
 *       200:
 *         description: Lista de archivos obtenida
 *       403:
 *         description: No perteneces a este PGC
 */
// GET /api/pgc/:id/files
router.get("/:id/files", verificarToken, pgcArchivoController.listar);

/**
 * @swagger
 * /api/pgc/{id}/files/{idArchivo}:
 *   put:
 *     summary: Reemplazar un archivo del PGC
 *     description: Permite actualizar los textos (title y desc). El archivo físico es opcional; si se envía, reemplaza al anterior.
 *     tags: [Archivos PGC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del PGC
 *       - in: path
 *         name: idArchivo
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del archivo a reemplazar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title_file
 *               - desc_file
 *             properties:
 *               title_file:
 *                 type: string
 *               desc_file:
 *                 type: string
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: (Opcional) Nuevo archivo físico
 *     responses:
 *       200:
 *         description: Archivo actualizado correctamente
 *       400:
 *         description: Faltan los textos obligatorios
 *       404:
 *         description: Archivo no encontrado
 */
// PUT /api/pgc/:id/files/:idArchivo
router.put("/:id/files/:idArchivo", verificarToken, subirArchivoPgc, pgcArchivoController.reemplazar);

/**
 * @swagger
 * /api/pgc/{id}/files/{idArchivo}:
 *   delete:
 *     summary: Eliminar un archivo del PGC
 *     description: Borra el archivo de la base de datos y de Firebase Storage.
 *     tags: [Archivos PGC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idArchivo
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Archivo eliminado sin contenido
 *       404:
 *         description: Archivo no encontrado
 */
// DELETE /api/pgc/:id/files/:idArchivo
router.delete("/:id/files/:idArchivo", verificarToken, pgcArchivoController.eliminar);

export default router;