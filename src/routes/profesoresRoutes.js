import { Router } from 'express';
import verificarToken from '../middlewares/autenticarMiddleware.js';
import { listarProfesores } from '../controllers/profesoresController.js';

const router = Router();

// GET /api/profesores — lista profesores disponibles (acceso autenticado)
router.get('/', verificarToken, listarProfesores);

export default router;