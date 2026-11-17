// Entorno de prueba sin MySQL ni Firebase (debe importarse antes que cualquier cosa de src/)
import './helpers/entornoDePrueba.js';
import request from 'supertest';
import { crearApp, entrarComo } from './helpers/appDePrueba.js';

const app = await crearApp('propuestas');
let estudiante;
let encargado;

beforeAll(async () => {
    estudiante = await entrarComo(app, 'estudiante');
    encargado = await entrarComo(app, 'profesor');
});

describe('Pruebas - Propuestas', () => {
    test('Debería bloquear el acceso sin token (401)', async () => {
        const res = await request(app).post('/api/propuestas').send({});
        expect(res.statusCode).toBe(401);
    });

    test('Debería listar propuestas del ciclo como Encargado (200)', async () => {
        const res = await encargado.get('/api/propuestas?cycle=1');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    test('Debería ver mi propuesta como Estudiante (200)', async () => {
        const res = await estudiante.get('/api/propuestas/mia');
        expect(res.statusCode).toBe(200);
    });

    test('Debería listar propuestas aprobadas sin PGC (200)', async () => {
        const res = await estudiante.get('/api/propuestas/aprobadas-sin-pgc');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});
