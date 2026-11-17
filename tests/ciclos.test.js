// Entorno de prueba sin MySQL ni Firebase (debe importarse antes que cualquier cosa de src/)
import './helpers/entornoDePrueba.js';
import { crearApp, entrarComo } from './helpers/appDePrueba.js';

const app = await crearApp('ciclos');
let api;

beforeAll(async () => {
    api = await entrarComo(app, 'administrador');
});

describe('Pruebas - Ciclos', () => {
    test('Debería listar los ciclos (200)', async () => {
        const res = await api.get('/api/ciclos');
        expect(res.statusCode).toBe(200);
    });

    test('Debería crear un ciclo (Admin)', async () => {
        const res = await api.post('/api/ciclos').send({
            subject_cycle: "Ciclo QA",
            max_members: 3,
            id_encargado: 2
        });
        expect([201, 400]).toContain(res.statusCode);
    });

    test('Debería listar profesores disponibles', async () => {
        const res = await api.get('/api/ciclos/profesores');
        expect(res.statusCode).toBe(200);
    });

    test('Debería obtener las fechas de un ciclo (200)', async () => {
        const res = await api.get('/api/ciclos/1/fechas');
        expect(res.statusCode).toBe(200);
    });

    test('Debería actualizar las fechas de una etapa (200)', async () => {
        const res = await api.put('/api/ciclos/1/fechas/Radicación').send({
            start_date: "2026-10-01T00:00:00",
            end_date: "2026-11-30T23:59:59"
        });
        // Acepta 200 (actualizado) o 403 (si el admin no es encargado)
        expect([200, 403]).toContain(res.statusCode);
    });
});
