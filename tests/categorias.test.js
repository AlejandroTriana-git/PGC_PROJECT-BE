import request from 'supertest';
import express from 'express';
import categoriasRoutes from '../src/routes/categoriasRoutes.js';
import authRoutes from '../src/routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);

let token = '';

beforeAll(async () => {
    // 1. Hacemos login para obtener el token
    const login = await request(app).post('/api/auth/login').send({
        correo: "davidfernandogonzalez@cundinamarcau.edu.co",
        contrasena: "Estudiante123!"
    });
    token = login.body.token;
});

describe('Pruebas - Categorías', () => {
    test('Debería listar las categorías (200)', async () => {
        // 2. Enviamos el token en el header Authorization
        const res = await request(app)
            .get('/api/categorias')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});