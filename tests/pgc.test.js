import request from 'supertest';
import express from 'express';
import pgcRoutes from '../src/routes/pgcRoutes.js';
import authRoutes from '../src/routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/pgc', pgcRoutes);

let token = '';

beforeAll(async () => {
    // 1. Hacemos login para obtener el token
    const login = await request(app).post('/api/auth/login').send({
        correo: "davidfernandogonzalez@cundinamarcau.edu.co",
        contrasena: "Estudiante123!"
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
        correo: "omorera@cundinamarcau.edu.co",
        contrasena: "Profesor123!"
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
        correo: "omorera@cundinamarcau.edu.co",
        contrasena: "Profesor123!"
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
        correo: "omorera@cundinamarcau.edu.co",
        contrasena: "Profesor123!"
    });
    const tokenJurado = loginJurado.body.token;

    const res = await request(app)
        .get('/api/pgc/pendientes-calificacion')
        .set('Authorization', `Bearer ${tokenJurado}`);
    expect(res.statusCode).toBe(200);
});
});