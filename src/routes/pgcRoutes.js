import express from 'express';
import {
    crearPgc,
    listarMisPgc,
    obtenerPgc,
    listarPgcPendientesDeCalificar,
    calificarPgc,
    obtenerCalificaciones,
    buscarPgc
} from '../controllers/pgcController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';
import autorizarRoles from '../middlewares/rolMiddleware.js';

const router = express.Router();

// POST /api/pgc (solo Estudiante)
router.post('/', verificarToken, autorizarRoles('Estudiante'), crearPgc);

// GET /api/pgc/search (Estudiante, Profesor, Administrador)
router.get('/search', verificarToken, autorizarRoles('Estudiante', 'Profesor', 'Administrador'), buscarPgc);

// GET /api/pgc/mine (solo Estudiante)
router.get('/mine', verificarToken, autorizarRoles('Estudiante'), listarMisPgc);

// GET /api/pgc/pending-grading (solo Profesor/Jurado) — HU-07
router.get('/pending-grading', verificarToken, autorizarRoles('Profesor'), listarPgcPendientesDeCalificar);

// POST /api/pgc/:id_pgc/grade (solo Profesor/Jurado) — HU-07
router.post('/:id_pgc/grade', verificarToken, autorizarRoles('Profesor'), calificarPgc);

// GET /api/pgc/:id_pgc/grades (Estudiante del equipo o Jurado) — HU-07
router.get('/:id_pgc/grades', verificarToken, autorizarRoles('Estudiante', 'Profesor'), obtenerCalificaciones);

// GET /api/pgc/:id (los 3 roles: Estudiante, Profesor, Administrador)
router.get('/:id', verificarToken, autorizarRoles('Estudiante', 'Profesor', 'Administrador'), obtenerPgc);

export default router;