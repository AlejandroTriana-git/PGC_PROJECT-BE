// Entorno de prueba sin MySQL ni Firebase (debe importarse antes que cualquier cosa de src/)
import './helpers/entornoDePrueba.js';
import { crearApp, entrarComo } from './helpers/appDePrueba.js';

const app = await crearApp('categorias');
let api;

beforeAll(async () => {
    api = await entrarComo(app, 'estudiante');
});

describe('Pruebas - Categorías', () => {
    test('Debería listar las categorías (200)', async () => {
        const res = await api.get('/api/categorias');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});
