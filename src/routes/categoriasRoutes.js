import express from 'express';
import { getCategorias } from '../controllers/categoriasController.js';
import verificarTokenOpcional from '../middlewares/autenticarOpcionalMiddleware.js';

const router = express.Router();

// GET /api/categorias — lista el catálogo de categorías de proyecto
// es publica porque el buscador de PGC la usa para el filtro y ese buscador se puede usar sin sesion
router.get('/', verificarTokenOpcional, getCategorias);

export default router;