import express from 'express';
import { getCategorias } from '../controllers/categoriasController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';

const router = express.Router();

// GET /api/categorias — lista el catálogo de categorías de proyecto
// Requiere sesión activa (el formulario de radicar ya la exige)
router.get('/', verificarToken, getCategorias);

export default router;