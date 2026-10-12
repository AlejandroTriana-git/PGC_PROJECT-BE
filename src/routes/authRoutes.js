import express from 'express';
import { login, logout } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
//aca no se usa verificarToken a proposito: el logout revisa el token por su cuenta, asi un segundo logout responde 200 y no 401
router.post('/logout', logout);

export default router;