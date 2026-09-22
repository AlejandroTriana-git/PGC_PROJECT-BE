import express from 'express';
import { crearPropuesta, reenviarPropuesta } from '../controllers/propuestaController.js';
import verificarToken from '../middlewares/autenticar.middleware.js';
import autorizarRoles from '../middlewares/role.middleware.js';
import {subirPdfPropuesta} from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// POST /api/propuestas (solo estudiantes)
router.post('/', verificarToken, autorizarRoles('estudiante'), subirPdfPropuesta, crearPropuesta);

// PATCH /api/propuestas/:id/reenviar (solo líder, si rechazada)
router.patch('/:id/reenviar', verificarToken, autorizarRoles('lider'), subirPdfPropuesta, reenviarPropuesta);

export default router;