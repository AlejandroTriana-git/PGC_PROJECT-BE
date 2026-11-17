// Entorno de prueba sin MySQL ni Firebase (debe importarse antes que cualquier cosa de src/)
import './helpers/entornoDePrueba.js';
import request from 'supertest';
import { crearApp, entrarComo } from './helpers/appDePrueba.js';

const app = await crearApp('propuestas', 'pgc');
let estudiante;
let encargado;

beforeAll(async () => {
    estudiante = await entrarComo(app, 'estudiante');
    encargado = await entrarComo(app, 'profesor');
});

describe('Pruebas Extra - Propuestas y PGC', () => {
    test('Debería fallar al radicar sin token (401)', async () => {
        const res = await request(app).post('/api/propuestas').send({});
        expect(res.statusCode).toBe(401);
    });

    test('Debería listar propuestas aprobadas sin PGC (200)', async () => {
        const res = await estudiante.get('/api/propuestas/aprobadas-sin-pgc');
        expect(res.statusCode).toBe(200);
    });

    test('Debería fallar al calificar con nota inválida (400)', async () => {
        const res = await encargado.post('/api/pgc/3/calificar').send({ grade: 10.0, comment: "Test" });
        expect(res.statusCode).toBe(400);
    });
});
