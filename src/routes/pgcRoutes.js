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

/**
 * @swagger
 * /api/pgc:
 *   post:
 *     summary: Registrar un PGC
 *     description: Activa una propuesta aprobada como Proyecto de Gestión del Conocimiento (PGC).
 *     tags: [PGC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_proposal:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: PGC registrado exitosamente
 *       400:
 *         description: Error de validación (propuesta no aprobada o ya tiene PGC)
 *       403:
 *         description: No es el líder de la propuesta
 */
// POST /api/pgc (solo Estudiante)
router.post('/', verificarToken, autorizarRoles('Estudiante'), crearPgc);

/**
 * @swagger
 * /api/pgc/search:
 *   get:
 *     summary: Buscar PGCs (Público)
 *     description: Permite buscar PGCs con filtros opcionales sin requerir sesión.
 *     tags: [Buscador PGC]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Palabra clave en título o descripción
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: integer
 *       - in: query
 *         name: ciclo
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resultados paginados
 */
// GET /api/pgc/search (publico: cualquiera, con o sin sesion, puede buscar en el catalogo)
router.get('/search', verificarTokenOpcional, buscarPgc);

/**
 * @swagger
 * /api/pgc/mine:
 *   get:
 *     summary: Listar mis PGCs
 *     description: Devuelve los PGCs donde el estudiante logueado es líder o integrante.
 *     tags: [PGC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de PGCs del usuario
 */
// GET /api/pgc/mine (solo Estudiante)
router.get('/mine', verificarToken, autorizarRoles('Estudiante'), listarMisPgc);

/**
 * @swagger
 * /api/pgc/pendientes-calificacion:
 *   get:
 *     summary: Listar PGCs pendientes de calificar
 *     description: Devuelve los PGCs del ciclo donde el jurado aún no ha registrado su nota.
 *     tags: [Calificación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de PGCs pendientes
 */
// GET /api/pgc/pendientes-calificacion (solo Profesor/Jurado) — HU-07
router.get('/pendientes-calificacion', verificarToken, autorizarRoles('Profesor'), listarPgcPendientesDeCalificar);

/**
 * @swagger
 * /api/pgc/calificados-por-mi:
 *   get:
 *     summary: Listar PGCs calificados por mí
 *     description: Devuelve los PGCs que el jurado logueado ya calificó.
 *     tags: [Calificación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de PGCs calificados
 */
// GET /api/pgc/calificados-por-mi (solo Profesor/Jurado) — HU-07
router.get('/calificados-por-mi', verificarToken, autorizarRoles('Profesor'), listarPgcCalificadosPorJurado);

/**
 * @swagger
 * /api/pgc/{id_pgc}/calificar:
 *   post:
 *     summary: Calificar un PGC
 *     description: Registra la nota y el comentario del jurado. La nota debe estar entre 0.0 y 5.0.
 *     tags: [Calificación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_pgc
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grade:
 *                 type: number
 *                 example: 4.5
 *               comment:
 *                 type: string
 *                 example: "Excelente trabajo, muy bien documentado"
 *     responses:
 *       201:
 *         description: Calificación registrada
 *       400:
 *         description: Nota fuera de rango o fuera de ventana
 *       403:
 *         description: No eres jurado de este ciclo
 */
// POST /api/pgc/:id_pgc/calificar (solo Profesor/Jurado) — HU-07
router.post('/:id_pgc/calificar', verificarToken, autorizarRoles('Profesor'), calificarPgc);

/**
 * @swagger
 * /api/pgc/{id_pgc}/calificaciones:
 *   get:
 *     summary: Ver notas consolidadas
 *     description: El estudiante ve todas las notas y el promedio. El jurado solo ve su propia nota.
 *     tags: [Calificación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_pgc
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Objeto con las notas y metadatos
 *       403:
 *         description: No tienes permiso para ver este PGC
 */
// GET /api/pgc/:id_pgc/calificaciones (Estudiante del equipo o Jurado) — HU-07
router.get('/:id_pgc/calificaciones', verificarToken, autorizarRoles('Estudiante', 'Profesor'), obtenerCalificaciones);

/**
 * @swagger
 * /api/pgc/{id}:
 *   get:
 *     summary: Ver ficha de un PGC (Público)
 *     description: Retorna la información completa del PGC (problema, solución, integrantes, archivos, etc.).
 *     tags: [PGC]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ficha del PGC
 *       404:
 *         description: PGC no encontrado
 */
// GET /api/pgc/:id (publico: la ficha historica se puede ver sin iniciar sesion)
router.get('/:id', verificarTokenOpcional, obtenerPgc);

export default router;