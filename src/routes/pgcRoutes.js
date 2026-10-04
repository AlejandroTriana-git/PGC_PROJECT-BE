import express from 'express';
import { crearPgc, listarMisPgc, obtenerPgc } from '../controllers/pgcController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';
import autorizarRoles from '../middlewares/rolMiddleware.js';

const router = express.Router();

// POST /api/pgc (solo Estudiante)
router.post('/', verificarToken, autorizarRoles('Estudiante'), crearPgc);

// GET /api/pgc/mine (solo Estudiante)
router.get('/mine', verificarToken, autorizarRoles('Estudiante'), listarMisPgc);

// GET /api/pgc/:id (los 3 roles: Estudiante, Profesor, Administrador)
router.get('/:id', verificarToken, autorizarRoles('Estudiante', 'Profesor', 'Administrador'), obtenerPgc);

export default router;