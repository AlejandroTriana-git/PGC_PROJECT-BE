// Entorno de prueba sin MySQL ni Firebase. Los imports de src/ son dinámicos (await import)
// para que se carguen DESPUÉS de que el helper reemplace db.js y firebaseConfig.js.
import './helpers/entornoDePrueba.js';
import { usuariosPrueba } from './helpers/dbFalsa.js';
import request from 'supertest';
import express from 'express';
const { default: estudianteRoutes } = await import('../src/routes/estudianteRoutes.js');
const { default: authRoutes } = await import('../src/routes/authRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/estudiantes', estudianteRoutes);

let token = '';

beforeAll(async () => {
    const login = await request(app).post('/api/auth/login').send({
        correo: usuariosPrueba.estudiante.correo,
        contrasena: usuariosPrueba.estudiante.contrasena
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