// Entorno de prueba sin MySQL ni Firebase. Los imports de src/ son dinámicos (await import)
// para que se carguen DESPUÉS de que el helper reemplace db.js y firebaseConfig.js.
import './helpers/entornoDePrueba.js';
import { usuariosPrueba } from './helpers/dbFalsa.js';
import request from 'supertest';
import express from 'express';
const { default: authRoutes } = await import('../src/routes/authRoutes.js');

// Creamos una mini-app para las pruebas
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Pruebas - Autenticación', () => {
    test('Login exitoso (200)', async () => {
        const res = await request(app).post('/api/auth/login').send({
            correo: usuariosPrueba.estudiante.correo,
            contrasena: usuariosPrueba.estudiante.contrasena
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('Login fallido - Contraseña incorrecta (401)', async () => {
        const res = await request(app).post('/api/auth/login').send({
            correo: usuariosPrueba.estudiante.correo,
            contrasena: `${usuariosPrueba.estudiante.contrasena}x` // distinta a la real
        });
        expect(res.statusCode).toBe(401);
    });
});