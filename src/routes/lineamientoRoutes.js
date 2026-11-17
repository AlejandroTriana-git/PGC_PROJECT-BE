import { Router } from 'express';
import verificarToken from '../middlewares/autenticarMiddleware.js';
import autorizarRoles from '../middlewares/rolMiddleware.js';
import { subirPdfDocumento } from '../middlewares/uploadMiddleware.js';
import * as lineamientoController from '../controllers/lineamientoController.js';

const router = Router();

//los lineamientos son globales (no dependen de un ciclo): los ve cualquier usuario con sesion
//y solo el Administrador los publica o sube una version nueva

// GET /api/lineamientos
router.get('/', verificarToken, lineamientoController.listar);

// POST /api/lineamientos (solo Administrador)
router.post('/', verificarToken, autorizarRoles('Administrador'), subirPdfDocumento, lineamientoController.crear);

// GET /api/lineamientos/:title_file/historial
router.get('/:title_file/historial', verificarToken, lineamientoController.historial);

export default router;