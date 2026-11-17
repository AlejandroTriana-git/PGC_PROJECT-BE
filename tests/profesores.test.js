// Entorno de prueba sin MySQL ni Firebase (debe importarse antes que cualquier cosa de src/)
import './helpers/entornoDePrueba.js';
import { crearApp, entrarComo } from './helpers/appDePrueba.js';

const app = await crearApp('profesores');
let api;

beforeAll(async () => {
    api = await entrarComo(app, 'administrador');
});

describe('Pruebas - Profesores', () => {
    test('Debería listar los profesores (200)', async () => {
        const res = await api.get('/api/profesores');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});
