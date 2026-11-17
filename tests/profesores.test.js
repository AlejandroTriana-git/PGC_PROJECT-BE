// Entorno de prueba sin MySQL ni Firebase. Los imports de src/ son dinámicos (await import)
// para que se carguen DESPUÉS de que el helper reemplace db.js y firebaseConfig.js.
import './helpers/entornoDePrueba.js';
import { usuariosPrueba } from './helpers/dbFalsa.js';
import request from 'supertest';
import express from 'express';
const { default: profesoresRoutes } = await import('../src/routes/profesoresRoutes.js');
const { default: authRoutes } = await import('../src/routes/authRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/profesores', profesoresRoutes);

let tokenAdmin = '';

beforeAll(async () => {
    const loginAdmin = await request(app).post('/api/auth/login').send({
        correo: usuariosPrueba.administrador.correo,
        contrasena: usuariosPrueba.administrador.contrasena
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