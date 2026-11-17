// Entorno de prueba sin MySQL ni Firebase (debe importarse antes que cualquier cosa de src/)
import './helpers/entornoDePrueba.js';
import request from 'supertest';
import { crearApp, entrarComo } from './helpers/appDePrueba.js';

const app = await crearApp('pgc');
let estudiante;
let jurado;

beforeAll(async () => {
    estudiante = await entrarComo(app, 'estudiante');
    jurado = await entrarComo(app, 'profesor');
});

describe('Pruebas - PGC', () => {
    test('Debería buscar PGCs (200)', async () => {
        const res = await estudiante.get('/api/pgc/search?q=inventario');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('resultados');
    });

    test('Debería obtener la ficha de un PGC (200)', async () => {
        const res = await estudiante.get('/api/pgc/1');
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
        const res = await jurado.post('/api/pgc/3/calificar').send({ grade: 10.0, comment: "Test" });
        expect(res.statusCode).toBe(400);
    });

    test('Debería fallar al calificar con nota negativa (400)', async () => {
        const res = await jurado.post('/api/pgc/3/calificar').send({ grade: -1, comment: "Test" });
        expect(res.statusCode).toBe(400);
    });

    test('Debería listar PGCs pendientes de calificar (200)', async () => {
        const res = await jurado.get('/api/pgc/pendientes-calificacion');
        expect(res.statusCode).toBe(200);
    });
});
