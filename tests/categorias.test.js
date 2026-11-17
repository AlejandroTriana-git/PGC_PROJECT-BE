// Entorno de prueba sin MySQL ni Firebase. Los imports de src/ son dinámicos (await import)
// para que se carguen DESPUÉS de que el helper reemplace db.js y firebaseConfig.js.
import './helpers/entornoDePrueba.js';
import { usuariosPrueba } from './helpers/dbFalsa.js';
import request from 'supertest';
import express from 'express';
const { default: categoriasRoutes } = await import('../src/routes/categoriasRoutes.js');
const { default: authRoutes } = await import('../src/routes/authRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);

let token = '';

beforeAll(async () => {
    // 1. Hacemos login para obtener el token
    const login = await request(app).post('/api/auth/login').send({
        correo: usuariosPrueba.estudiante.correo,
        contrasena: usuariosPrueba.estudiante.contrasena
    });
    token = login.body.token;
});

describe('Pruebas - Categorías', () => {
    test('Debería listar las categorías (200)', async () => {
        // 2. Enviamos el token en el header Authorization
        const res = await request(app)
            .get('/api/categorias')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});