import express from 'express';
import {
    crearPgc,
    listarMisPgc,
    obtenerPgc,
    listarPgcPendientesDeCalificar,
    calificarPgc,
    obtenerCalificaciones,
    listarPgcCalificadosPorJurado,
    buscarPgc
} from '../controllers/pgcController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';
import autorizarRoles from '../middlewares/rolMiddleware.js';
import verificarTokenOpcional from '../middlewares/autenticarOpcionalMiddleware.js';

const router = express.Router();

// POST /api/pgc (solo Estudiante)
router.post('/', verificarToken, autorizarRoles('Estudiante'), crearPgc);

// GET /api/pgc/search (publico: cualquiera, con o sin sesion, puede buscar en el catalogo)
router.get('/search', verificarTokenOpcional, buscarPgc);

// GET /api/pgc/mine (solo Estudiante)
router.get('/mine', verificarToken, autorizarRoles('Estudiante'), listarMisPgc);

// GET /api/pgc/pendientes-calificacion (solo Profesor/Jurado) — HU-07
router.get('/pendientes-calificacion', verificarToken, autorizarRoles('Profesor'), listarPgcPendientesDeCalificar);

// GET /api/pgc/calificados-por-mi (solo Profesor/Jurado) — HU-07
router.get('/calificados-por-mi', verificarToken, autorizarRoles('Profesor'), listarPgcCalificadosPorJurado);

// POST /api/pgc/:id_pgc/calificar (solo Profesor/Jurado) — HU-07
router.post('/:id_pgc/calificar', verificarToken, autorizarRoles('Profesor'), calificarPgc);

// GET /api/pgc/:id_pgc/calificaciones (Estudiante del equipo o Jurado) — HU-07
router.get('/:id_pgc/calificaciones', verificarToken, autorizarRoles('Estudiante', 'Profesor'), obtenerCalificaciones);

// GET /api/pgc/:id (publico: la ficha historica se puede ver sin iniciar sesion)
router.get('/:id', verificarTokenOpcional, obtenerPgc);

export default router;