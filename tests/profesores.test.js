import request from 'supertest';
import express from 'express';
import profesoresRoutes from '../src/routes/profesoresRoutes.js';
import authRoutes from '../src/routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/profesores', profesoresRoutes);

let tokenAdmin = '';

beforeAll(async () => {
    const loginAdmin = await request(app).post('/api/auth/login').send({
        correo: "admin@cundinamarcau.edu.co",
        contrasena: "Admin123!"
    });
    tokenAdmin = loginAdmin.body.token;
});

describe('Pruebas - Profesores', () => {
    test('Debería listar los profesores (200)', async () => {
        const res = await request(app)
            .get('/api/profesores')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});