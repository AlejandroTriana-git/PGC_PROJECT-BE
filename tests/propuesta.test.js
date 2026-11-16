import request from 'supertest';
import express from 'express';
import propuestaRoutes from '../src/routes/propuestaRoutes.js';
import authRoutes from '../src/routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/propuestas', propuestaRoutes);

let tokenEstudiante = '';
let tokenEncargado = '';

beforeAll(async () => {
    // Login del Estudiante
    const loginEst = await request(app).post('/api/auth/login').send({
        correo: "davidfernandogonzalez@cundinamarcau.edu.co",
        contrasena: "Estudiante123!"
    });
    tokenEstudiante = loginEst.body.token;

    // Login del Encargado de Ciclo
    const loginEnc = await request(app).post('/api/auth/login').send({
        correo: "omorera@cundinamarcau.edu.co",
        contrasena: "Profesor123!"
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