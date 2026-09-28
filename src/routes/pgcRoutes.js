import express from 'express';
import { crearPgc, listarMisPgc } from '../controllers/pgcController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';

const router = express.Router();

// POST /api/pgc (registrar PGC)
router.post('/', verificarToken, crearPgc);

// GET /api/pgc/mine (listar mis PGC)
router.get('/mine', verificarToken, listarMisPgc);

export default router;