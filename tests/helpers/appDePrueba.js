// ============================================================
// Helpers compartidos por los tests de rutas (supertest).
//
// Antes cada test repetia lo mismo: armar la app de express, hacer login y poner
// el header Authorization. Eso es lo que SonarCloud marcaba como codigo duplicado.
// Ahora esta logica vive aca y los tests solo dicen QUE rutas necesitan y COMO entran.
//
// IMPORTANTE: el test debe importar './entornoDePrueba.js' ANTES de llamar a crearApp,
// porque las rutas se cargan con import dinamico (asi toman la BD y Firebase falsos).
// ============================================================
import express from 'express';
import request from 'supertest';
import { usuariosPrueba } from './dbFalsa.js';

// nombre corto -> [prefijo de la URL, archivo de rutas]
const RUTAS = {
  ciclos: ['/api/ciclos', 'ciclosRoutes'],
  categorias: ['/api/categorias', 'categoriasRoutes'],
  estudiantes: ['/api/estudiantes', 'estudianteRoutes'],
  profesores: ['/api/profesores', 'profesoresRoutes'],
  propuestas: ['/api/propuestas', 'propuestaRoutes'],
  pgc: ['/api/pgc', 'pgcRoutes'],
};

// esta funcion arma una mini-app con las rutas de auth (para el login) mas las que se pidan
export const crearApp = async (...nombres) => {
  const app = express();
  app.use(express.json());

  const { default: authRoutes } = await import('../../src/routes/authRoutes.js');
  app.use('/api/auth', authRoutes);

  for (const nombre of nombres) {
    const [prefijo, archivo] = RUTAS[nombre];
    const { default: rutas } = await import(`../../src/routes/${archivo}.js`);
    app.use(prefijo, rutas);
  }
  return app;
};

// esta funcion hace login con un usuario de prueba ('estudiante', 'profesor' o 'administrador') y devuelve el token
export const iniciarSesion = async (app, rol) => {
  const { correo, contrasena } = usuariosPrueba[rol];
  const respuesta = await request(app).post('/api/auth/login').send({ correo, contrasena });
  return respuesta.body.token;
};

// esta funcion devuelve un cliente que ya manda el token en cada peticion: api.get(url), api.post(url)...
export const conSesion = (app, token) => {
  const cliente = (metodo) => (url) => request(app)[metodo](url).set('Authorization', `Bearer ${token}`);
  return {
    get: cliente('get'),
    post: cliente('post'),
    put: cliente('put'),
    patch: cliente('patch'),
    delete: cliente('delete'),
  };
};

// atajo: login + cliente con sesion en un solo paso
export const entrarComo = async (app, rol) => conSesion(app, await iniciarSesion(app, rol));
