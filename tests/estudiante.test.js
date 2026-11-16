import request from 'supertest';
import express from 'express';
import estudianteRoutes from '../src/routes/estudianteRoutes.js';
import authRoutes from '../src/routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/estudiantes', estudianteRoutes);

let token = '';

beforeAll(async () => {
    const login = await request(app).post('/api/auth/login').send({
        correo: "davidfernandogonzalez@cundinamarcau.edu.co",
        contrasena: "Estudiante123!"
    });
    token = login.body.token;
});

describe('Pruebas - Estudiantes', () => {
    test('Debería listar estudiantes del mismo ciclo (200)', async () => {
        const res = await request(app)
            .get('/api/estudiantes')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
    test('Debería listar estudiantes del ciclo (200)', async () => {
    const res = await request(app)
        .get('/api/estudiantes')
        .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
});
});