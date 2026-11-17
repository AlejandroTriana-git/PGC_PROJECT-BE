// Entorno de prueba sin MySQL ni Firebase. Los imports de src/ son dinámicos (await import)
// para que se carguen DESPUÉS de que el helper reemplace db.js y firebaseConfig.js.
import './helpers/entornoDePrueba.js';
import { usuariosPrueba } from './helpers/dbFalsa.js';
import request from 'supertest';
import express from 'express';
const { default: pgcRoutes } = await import('../src/routes/pgcRoutes.js');
const { default: authRoutes } = await import('../src/routes/authRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/pgc', pgcRoutes);

let token = '';

beforeAll(async () => {
    // 1. Hacemos login para obtener el token
    const login = await request(app).post('/api/auth/login').send({
        correo: usuariosPrueba.estudiante.correo,
        contrasena: usuariosPrueba.estudiante.contrasena
    });
    token = login.body.token;
});

describe('Pruebas - PGC', () => {
    test('Debería buscar PGCs (200)', async () => {
        const res = await request(app)
            .get('/api/pgc/search?q=inventario')
            .set('Authorization', `Bearer ${token}`); // 2. Enviamos el token
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('resultados');
    });

    test('Debería obtener la ficha de un PGC (200)', async () => {
        const res = await request(app)
            .get('/api/pgc/1')
            .set('Authorization', `Bearer ${token}`); // 2. Enviamos el token
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id_pgc');
    });
    test('Debería fallar al calificar sin token (401)', async () => {
    const res = await request(app)
        .post('/api/pgc/3/calificar')
        .send({ grade: 4.0, comment: "Test" });
    expect(res.statusCode).toBe(401);
});

test('Debería fallar al calificar fuera de rango (400)', async () => {
    // Login como jurado
    const loginJurado = await request(app).post('/api/auth/login').send({
        correo: usuariosPrueba.profesor.correo,
        contrasena: usuariosPrueba.profesor.contrasena
    });
    const tokenJurado = loginJurado.body.token;

    const res = await request(app)
        .post('/api/pgc/3/calificar')
        .set('Authorization', `Bearer ${tokenJurado}`)
        .send({ grade: 10.0, comment: "Test" });
    expect(res.statusCode).toBe(400);
});
test('Debería fallar al calificar con nota inválida (400)', async () => {
    // Login como jurado
    const loginJurado = await request(app).post('/api/auth/login').send({
        correo: usuariosPrueba.profesor.correo,
        contrasena: usuariosPrueba.profesor.contrasena
    });
    const tokenJurado = loginJurado.body.token;

    const res = await request(app)
        .post('/api/pgc/3/calificar')
        .set('Authorization', `Bearer ${tokenJurado}`)
        .send({ grade: 10.0, comment: "Test" }); // Nota fuera de rango
    expect(res.statusCode).toBe(400);
});

test('Debería listar PGCs pendientes de calificar (200)', async () => {
    const loginJurado = await request(app).post('/api/auth/login').send({
        correo: usuariosPrueba.profesor.correo,
        contrasena: usuariosPrueba.profesor.contrasena
    });
    const tokenJurado = loginJurado.body.token;

    const res = await request(app)
        .get('/api/pgc/pendientes-calificacion')
        .set('Authorization', `Bearer ${tokenJurado}`);
    expect(res.statusCode).toBe(200);
});
});