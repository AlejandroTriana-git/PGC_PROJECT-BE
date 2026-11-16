import request from 'supertest';
import express from 'express';
import propuestaRoutes from '../src/routes/propuestaRoutes.js';
import pgcRoutes from '../src/routes/pgcRoutes.js';
import authRoutes from '../src/routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/propuestas', propuestaRoutes);
app.use('/api/pgc', pgcRoutes);

let tokenEstudiante = '';
let tokenEncargado = '';

beforeAll(async () => {
    const loginEst = await request(app).post('/api/auth/login').send({
        correo: "davidfernandogonzalez@cundinamarcau.edu.co",
        contrasena: "Estudiante123!"
    });
    tokenEstudiante = loginEst.body.token;

    const loginEnc = await request(app).post('/api/auth/login').send({
        correo: "omorera@cundinamarcau.edu.co",
        contrasena: "Profesor123!"
    });
    tokenEncargado = loginEnc.body.token;
});

describe('Pruebas Extra - Propuestas y PGC', () => {
    test('Debería fallar al radicar sin token (401)', async () => {
        const res = await request(app).post('/api/propuestas').send({});
        expect(res.statusCode).toBe(401);
    });

    test('Debería listar propuestas aprobadas sin PGC (200)', async () => {
        const res = await request(app)
            .get('/api/propuestas/aprobadas-sin-pgc')
            .set('Authorization', `Bearer ${tokenEstudiante}`);
        expect(res.statusCode).toBe(200);
    });

    test('Debería fallar al calificar con nota inválida (400)', async () => {
        const res = await request(app)
            .post('/api/pgc/3/calificar')
            .set('Authorization', `Bearer ${tokenEncargado}`)
            .send({ grade: 10.0, comment: "Test" });
        expect(res.statusCode).toBe(400);
    });
});