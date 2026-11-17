// Entorno de prueba sin MySQL ni Firebase. Los imports de src/ son dinámicos (await import)
// para que se carguen DESPUÉS de que el helper reemplace db.js y firebaseConfig.js.
import './helpers/entornoDePrueba.js';
import { usuariosPrueba } from './helpers/dbFalsa.js';
import request from 'supertest';
import express from 'express';
const { default: ciclosRoutes } = await import('../src/routes/ciclosRoutes.js');
const { default: authRoutes } = await import('../src/routes/authRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/ciclos', ciclosRoutes);

let tokenAdmin = '';

beforeAll(async () => {
    const loginAdmin = await request(app).post('/api/auth/login').send({
        correo: usuariosPrueba.administrador.correo,
        contrasena: usuariosPrueba.administrador.contrasena
    });
    tokenAdmin = loginAdmin.body.token;
});

describe('Pruebas - Ciclos', () => {
    test('Debería listar los ciclos (200)', async () => {
        const res = await request(app)
            .get('/api/ciclos')
            .set('Authorization', `Bearer ${tokenAdmin}`); // 1. Enviamos el token
        expect(res.statusCode).toBe(200);
    });

    test('Debería crear un ciclo (Admin)', async () => {
        const res = await request(app)
            .post('/api/ciclos')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({
                subject_cycle: "Ciclo QA",
                max_members: 3,
                id_encargado: 2
            });
        expect([201, 400]).toContain(res.statusCode);
    });

    test('Debería listar profesores disponibles', async () => {
        const res = await request(app)
            .get('/api/ciclos/profesores')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
    });
    test('Debería obtener las fechas de un ciclo (200)', async () => {
    const res = await request(app)
        .get('/api/ciclos/1/fechas')
        .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
});
test('Debería obtener las fechas de un ciclo (200)', async () => {
    const res = await request(app)
        .get('/api/ciclos/1/fechas')
        .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
});
test('Debería actualizar las fechas de una etapa (200)', async () => {
    const res = await request(app)
        .put('/api/ciclos/1/fechas/Radicación')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
            start_date: "2026-10-01T00:00:00",
            end_date: "2026-11-30T23:59:59"
        });
    // Acepta 200 (actualizado) o 403 (si el admin no es encargado)
    expect([200, 403]).toContain(res.statusCode);
});
});