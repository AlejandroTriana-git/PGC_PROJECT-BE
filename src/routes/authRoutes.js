import express from 'express';
import { login, logout } from '../controllers/authController.js';
import verificarToken from '../middlewares/autenticarMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica al usuario con correo y contraseña, y devuelve un token JWT.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contrasena
 *             properties:
 *               correo:
 *                 type: string
 *                 example: "estudiante@cundinamarcau.edu.co"
 *               contrasena:
 *                 type: string
 *                 example: "Estudiante123!"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 rol:
 *                   type: string
 *                 mensaje:
 *                   type: string
 *       400:
 *         description: Campos vacíos
 *       401:
 *         description: Contraseña incorrecta
 *       404:
 *         description: Correo no registrado
 */
// POST /api/auth/login
router.post('/login', login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Invalida el token JWT agregándolo a la lista negra.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 *       401:
 *         description: Token no proporcionado o inválido
 */
// POST /api/auth/logout (requiere el token para poder invalidarlo)
router.post('/logout', verificarToken, logout);

export default router;