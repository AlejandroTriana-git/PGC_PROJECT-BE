import { jest } from '@jest/globals';

// 1. Una función middleware genérica que solo pasa a la siguiente
const fakeMiddleware = (req, res, next) => {
  if (typeof next === 'function') next();
};

// 2. Una fábrica para autorizarRoles('Estudiante')
const fakeFactory = () => fakeMiddleware;

// 3. Middlewares de Autenticación
jest.unstable_mockModule('../../src/middlewares/autenticarMiddleware.js', () => ({
  verificarToken: fakeMiddleware,
  autenticar: fakeMiddleware,
  default: fakeMiddleware,
}));

// 4. Middlewares de Roles
jest.unstable_mockModule('../../src/middlewares/rolMiddleware.js', () => ({
  autorizarRoles: fakeFactory,
  autorizarRol: fakeFactory,
  verificarRol: fakeFactory,
  default: fakeMiddleware,
}));

// 5. Middlewares de Encargado
jest.unstable_mockModule('../../src/middlewares/autorizarEncargadoMiddleware.js', () => ({
  autorizarEncargadoDeCiclo: fakeFactory,
  autorizarEncargadoPropuesta: fakeFactory,
  default: fakeMiddleware,
}));

// 6. Middlewares de Subida de Archivos (AQUÍ ESTABA EL ERROR)
// Aseguramos que subirPdfPropuesta sea una función pura, NO un objeto
jest.unstable_mockModule('../../src/middlewares/uploadMiddleware.js', () => ({
  subirPdfPropuesta: fakeMiddleware,
  subirArchivoPgc: fakeMiddleware,
  subirArchivoCiclo: fakeMiddleware,
  subirPdfDocumento: fakeMiddleware,
  default: fakeMiddleware,
}));

// 7. Otros middlewares
jest.unstable_mockModule('../../src/middlewares/puedeVerPropuestaMiddleware.js', () => ({
  puedeVerPropuesta: fakeMiddleware,
  default: fakeMiddleware,
}));

jest.unstable_mockModule('../../src/middlewares/pertenecenciaCiclomiddleware.js', () => ({
  perteneceAlCiclo: fakeMiddleware,
  verificarPertenenciaCiclo: fakeMiddleware,
  default: fakeMiddleware,
}));