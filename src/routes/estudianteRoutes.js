import express from 'express';
import { listarEstudiantes } from '../controllers/estudianteController.js';
import verificarToken from '../middlewares/autenticar.middleware.js';

const router = express.Router();

router.get('/', verificarToken, listarEstudiantes);

export default router;