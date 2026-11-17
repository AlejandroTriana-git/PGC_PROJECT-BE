// Entorno de prueba sin MySQL ni Firebase (debe importarse antes que cualquier cosa de src/)
import './helpers/entornoDePrueba.js';
import { crearApp, entrarComo } from './helpers/appDePrueba.js';

const app = await crearApp('estudiantes');
let api;

beforeAll(async () => {
    api = await entrarComo(app, 'estudiante');
});

describe('Pruebas - Estudiantes', () => {
    test('Debería listar estudiantes del mismo ciclo (200)', async () => {
        const res = await api.get('/api/estudiantes');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});
