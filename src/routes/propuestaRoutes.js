import express from 'express';
import { crearPropuesta } from '../controllers/propuestaController.js';
import verificarToken from '../middlewares/autenticar.middleware.js';

const router = express.Router();

// POST /api/propuestas (solo estudiantes)
router.post('/', verificarToken, crearPropuesta);

export default router;
