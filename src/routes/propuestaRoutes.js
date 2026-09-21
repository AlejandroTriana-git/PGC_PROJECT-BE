import express from 'express';
import { crearPropuesta, reenviarPropuesta } from '../controllers/propuestaController.js';
import verificarToken from '../middlewares/autenticar.middleware.js';

const router = express.Router();

// POST /api/propuestas (solo estudiantes)
router.post('/', verificarToken, crearPropuesta);

// PATCH /api/propuestas/:id/reenviar (solo líder, si rechazada)
router.patch('/:id/reenviar', verificarToken, reenviarPropuesta);

export default router;