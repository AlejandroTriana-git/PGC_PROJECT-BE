import express from 'express';
import { crearPropuesta, reenviarPropuesta, verMiPropuesta } from '../controllers/propuestaController.js';
import verificarToken from '../middlewares/autenticar.middleware.js';

const router = express.Router();

// POST /api/propuestas (radicar propuesta)
router.post('/', verificarToken, crearPropuesta);

// GET /api/propuestas/mia (ver mi propuesta)
router.get('/mia', verificarToken, verMiPropuesta);

// PATCH /api/propuestas/:id/reenviar (reenviar propuesta)
router.patch('/:id/reenviar', verificarToken, reenviarPropuesta);

export default router;