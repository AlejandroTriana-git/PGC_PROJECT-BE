import express from 'express';
import { listarPropuestasAprobadasSinPgc } from '../controllers/pgcController.js';
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

// GET /api/propuestas/mia (solo Estudiante)
router.get('/mia', verificarToken, autorizarRoles('Estudiante'), verMiPropuesta);

// GET /api/propuestas/aprobadas-sin-pgc (solo Estudiante)
router.get('/aprobadas-sin-pgc', verificarToken, autorizarRoles('Estudiante'), listarPropuestasAprobadasSinPgc);

// GET /api/propuestas?cycle=X&estado=Y (Estudiante, Profesor, Administrador)
router.get('/', verificarToken, autorizarRoles('Estudiante', 'Profesor', 'Administrador'), listarPendientes);

// PATCH /api/propuestas/:id/aprobar (encargado del ciclo)
router.patch('/:id/aprobar', verificarToken, autorizarEncargadoPropuesta(), aprobar);

// PATCH /api/propuestas/:id/rechazar (encargado del ciclo)
router.patch('/:id/rechazar', verificarToken, autorizarEncargadoPropuesta(), rechazar);

// GET /api/propuestas/:idProposal/pdf (miembros del equipo o encargado)
router.get('/:idProposal/pdf', verificarToken, puedeVerPropuesta(), verPdfPropuesta);

export default router;