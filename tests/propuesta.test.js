// Entorno de prueba sin MySQL ni Firebase. Los imports de src/ son dinámicos (await import)
// para que se carguen DESPUÉS de que el helper reemplace db.js y firebaseConfig.js.
import './helpers/entornoDePrueba.js';
import { usuariosPrueba } from './helpers/dbFalsa.js';
import request from 'supertest';
import express from 'express';
const { default: propuestaRoutes } = await import('../src/routes/propuestaRoutes.js');
const { default: authRoutes } = await import('../src/routes/authRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/propuestas', propuestaRoutes);

let tokenEstudiante = '';
let tokenEncargado = '';

beforeAll(async () => {
    // Login del Estudiante
    const loginEst = await request(app).post('/api/auth/login').send({
        correo: usuariosPrueba.estudiante.correo,
        contrasena: usuariosPrueba.estudiante.contrasena
    });
    tokenEstudiante = loginEst.body.token;

    // Login del Encargado de Ciclo
    const loginEnc = await request(app).post('/api/auth/login').send({
        correo: usuariosPrueba.profesor.correo,
        contrasena: usuariosPrueba.profesor.contrasena
    });
    tokenEncargado = loginEnc.body.token;
});

describe('Pruebas - Propuestas', () => {
    test('Debería bloquear el acceso sin token (401)', async () => {
        const res = await request(app).post('/api/propuestas').send({});
        expect(res.statusCode).toBe(401);
    });

    test('Debería listar propuestas del ciclo como Encargado (200)', async () => {
        const res = await request(app)
            .get('/api/propuestas?cycle=1')
            .set('Authorization', `Bearer ${tokenEncargado}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    test('Debería ver mi propuesta como Estudiante (200)', async () => {
        const res = await request(app)
            .get('/api/propuestas/mia')
            .set('Authorization', `Bearer ${tokenEstudiante}`);
        expect(res.statusCode).toBe(200);
    });

    test('Debería listar propuestas aprobadas sin PGC (200)', async () => {
        const res = await request(app)
            .get('/api/propuestas/aprobadas-sin-pgc')
            .set('Authorization', `Bearer ${tokenEstudiante}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});