import express from 'express';
import { crearPgc, listarMisPgc, obtenerPgc, listarPgcPendientesDeCalificar, buscarPgc } from '../controllers/pgcController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';
import autorizarRoles from '../middlewares/rolMiddleware.js';

const router = express.Router();

// POST /api/pgc (solo Estudiante)
router.post('/', verificarToken, autorizarRoles('Estudiante'), crearPgc);

// GET /api/pgc/search (Estudiante, Profesor, Administrador)
//esta ruta es el buscador de PGC y la validacion de los filtros se hace en el controller
//IMPORTANTE: va ANTES de cualquier ruta '/:id' (HU-05), si no express lee "search" como si fuera un id
router.get('/search', verificarToken, autorizarRoles('Estudiante', 'Profesor', 'Administrador'), buscarPgc);

// GET /api/pgc/mine (solo Estudiante)
router.get('/mine', verificarToken, autorizarRoles('Estudiante'), listarMisPgc);

// ✅ GET /api/pgc/pending-grading (solo Profesor/Jurado) — HU-07
//IMPORTANTE: va ANTES de '/:id' para que express no lea "pending-grading" como un id
router.get('/pending-grading', verificarToken, autorizarRoles('Profesor'), listarPgcPendientesDeCalificar);

// GET /api/pgc/:id (los 3 roles: Estudiante, Profesor, Administrador)
router.get('/:id', verificarToken, autorizarRoles('Estudiante', 'Profesor', 'Administrador'), obtenerPgc);

export default router;