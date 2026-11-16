import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/authRoutes.js';

// Creamos una mini-app para las pruebas
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Pruebas - Autenticación', () => {
    test('Login exitoso (200)', async () => {
        const res = await request(app).post('/api/auth/login').send({
            correo: "davidfernandogonzalez@cundinamarcau.edu.co",
            contrasena: "Estudiante123!"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('Login fallido - Contraseña incorrecta (401)', async () => {
        const res = await request(app).post('/api/auth/login').send({
            correo: "davidfernandogonzalez@cundinamarcau.edu.co",
            contrasena: "malapassword"
        });
        expect(res.statusCode).toBe(401);
    });
});