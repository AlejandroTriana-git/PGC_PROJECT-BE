// Entorno de prueba sin MySQL ni Firebase. Los imports de src/ son dinámicos (await import)
// para que se carguen DESPUÉS de que el helper reemplace db.js y firebaseConfig.js.
import './helpers/entornoDePrueba.js';
import request from 'supertest';

const { default: app } = await import('../src/app.js');

describe('Seguridad - cabeceras HTTP', () => {
    //esta prueba verifica que la API no revele que usa Express (S5689)
    test('No debe enviar la cabecera X-Powered-By', async () => {
        const res = await request(app).get('/ruta-que-no-existe');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });
});
