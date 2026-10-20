import express from 'express';
import { getCategorias } from '../controllers/categoriasController.js';
// Al quitarle las llaves, le decimos a Node que importe el "export default"
import verificarTokenOpcional from '../middlewares/autenticarOpcionalMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Listar todas las categorías
 *     description: Obtiene el catálogo de categorías de proyecto (Web, Software, IoT, etc.). Es de acceso público para que el buscador funcione sin sesión.
 *     tags: [Categorías]
 *     responses:
 *       200:
 *         description: Lista de categorías obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_category:
 *                     type: integer
 *                     example: 1
 *                   name_category:
 *                     type: string
 *                     example: "Web"
 *       500:
 *         description: Error interno del servidor
 */
// GET /api/categorias — lista el catálogo de categorías de proyecto
// es publica porque el buscador de PGC la usa para el filtro y ese buscador se puede usar sin sesion
router.get('/', verificarTokenOpcional, getCategorias);

export default router;