// Entorno de prueba sin MySQL ni Firebase (debe importarse antes que cualquier cosa de src/)
import './helpers/entornoDePrueba.js';
import request from 'supertest';
import { crearApp } from './helpers/appDePrueba.js';
import { usuariosPrueba } from './helpers/dbFalsa.js';

const app = await crearApp();
const { correo, contrasena } = usuariosPrueba.estudiante;

describe('Pruebas - Autenticación', () => {
    test('Login exitoso (200)', async () => {
        const res = await request(app).post('/api/auth/login').send({ correo, contrasena });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('Login fallido - Contraseña incorrecta (401)', async () => {
        const res = await request(app).post('/api/auth/login').send({ correo, contrasena: `${contrasena}x` });
        expect(res.statusCode).toBe(401);
    });
});
