import express from 'express';
import { crearPropuesta, reenviarPropuesta, verPdfPropuesta } from '../controllers/propuestaController.js';
import verificarToken from '../middlewares/autenticar.middleware.js';
import autorizarRoles from '../middlewares/role.middleware.js';
import {subirPdfPropuesta} from '../middlewares/uploadMiddleware.js';
import { puedeVerPropuesta } from '../middlewares/puedeVerPropuestaMiddleware.js';

const router = express.Router();

// POST /api/propuestas (solo estudiantes)
router.post('/', verificarToken, autorizarRoles('Estudiante'), subirPdfPropuesta, crearPropuesta);

// PATCH /api/propuestas/:id/reenviar (solo líder, si rechazada)
router.patch('/:id/reenviar', verificarToken, autorizarRoles('lider'), subirPdfPropuesta, reenviarPropuesta);

//GET /api/propuestas/:idProposal/pdf (solo miembros del equipo o encargado del ciclo)
router.get(
  '/propuestas/:idProposal/pdf',
  verificarToken,
  puedeVerPropuesta(),
  verPdfPropuesta
);
export default router;