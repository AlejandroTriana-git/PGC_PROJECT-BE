import express from 'express';
import { crearPropuesta, reenviarPropuesta, verPdfPropuesta, verMiPropuesta, listarPendientes, aprobar, rechazar } from '../controllers/propuestaController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';
import autorizarRoles from '../middlewares/rolMiddleware.js';
import { subirPdfPropuesta } from '../middlewares/uploadMiddleware.js';
import { puedeVerPropuesta } from '../middlewares/puedeVerPropuestaMiddleware.js';
import { autorizarEncargadoPropuesta } from '../middlewares/autorizarEncargadoMiddleware.js';

const router = express.Router();

// POST /api/propuestas (solo Estudiante)
router.post('/', verificarToken, autorizarRoles('Estudiante'), subirPdfPropuesta, crearPropuesta);

// PATCH /api/propuestas/:id/reenviar (solo Estudiante, si rechazada)
router.patch('/:id/reenviar', verificarToken, autorizarRoles('Estudiante'), subirPdfPropuesta, reenviarPropuesta);

// GET /api/propuestas/mia (ver mi propuesta — debe ir ANTES de /:idProposal/pdf)
router.get('/mia', verificarToken, verMiPropuesta);

// GET /api/propuestas?cycle=X&estado=Y (listar propuestas por ciclo y estado)
router.get('/', verificarToken, listarPendientes);

// PATCH /api/propuestas/:id/aprobar (encargado del ciclo)
router.patch('/:id/aprobar', verificarToken, autorizarEncargadoPropuesta(), aprobar);

// PATCH /api/propuestas/:id/rechazar (encargado del ciclo)
router.patch('/:id/rechazar', verificarToken, autorizarEncargadoPropuesta(), rechazar);

// GET /api/propuestas/:idProposal/pdf (miembros del equipo o encargado del ciclo)
router.get('/:idProposal/pdf', verificarToken, puedeVerPropuesta(), verPdfPropuesta);

export default router;