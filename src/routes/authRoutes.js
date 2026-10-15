import express from 'express';
import { login, logout } from '../controllers/authController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout (requiere el token para poder invalidarlo)
router.post('/logout', verificarToken, logout);

export default router;