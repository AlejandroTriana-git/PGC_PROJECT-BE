import request from 'supertest';
import express from 'express';
import verificarToken from '../src/middlewares/autenticarMiddleware.js';

const app = express();
app.use(express.json());

app.get('/api/ciclos/1/documentos', verificarToken, (req, res) => {
    res.status(200).json({ mensaje: 'Acceso permitido' });
});

describe('Pruebas - Seguridad en Archivos de Ciclo', () => {
    test('Debería dar 401 sin token', async () => {
        const res = await request(app).get('/api/ciclos/1/documentos');
        expect(res.statusCode).toBe(401);
    });
});