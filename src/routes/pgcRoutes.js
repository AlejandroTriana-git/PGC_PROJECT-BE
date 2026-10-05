import express from 'express';
import { crearPgc, listarMisPgc } from '../controllers/pgcController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';
import autorizarRoles from '../middlewares/rolMiddleware.js';
import { buscarPgc } from '../controllers/pgcController.js';

const router = express.Router();

// POST /api/pgc (solo Estudiante)
router.post('/', verificarToken, autorizarRoles('Estudiante'), crearPgc);

// GET /api/pgc/search (Estudiante, Profesor, Administrador)
//esta ruta es el buscador de PGC y la validacion de los filtros se hace en el controller
//IMPORTANTE: va ANTES de cualquier ruta '/:id' (HU-05), si no express lee "search" como si fuera un id
router.get('/search', verificarToken, autorizarRoles('Estudiante', 'Profesor', 'Administrador'), buscarPgc);

// GET /api/pgc/mine (solo Estudiante)
router.get('/mine', verificarToken, autorizarRoles('Estudiante'), listarMisPgc);

export default router;