import { jest } from '@jest/globals';

export const mockAuth = (req, res, next) => {
  if (typeof next === 'function') next();
};

const mockMiddlewareFactory = () => mockAuth;

const mockMulterFunction = (req, res, next) => {
  if (typeof next === 'function') next();
};

// Mock de la conexión a base de datos (con transacciones)
export const mockConnection = {
  query: jest.fn(),
  execute: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
};

export const mockDb = {
  query: jest.fn(),
  execute: jest.fn(),
  getConnection: jest.fn().mockResolvedValue(mockConnection),
};

jest.unstable_mockModule('../../src/config/db.js', () => ({ default: mockDb }));

jest.unstable_mockModule('../../src/middlewares/autenticarMiddleware.js', () => ({
  verificarToken: mockAuth,
  autenticar: mockAuth,
  default: mockAuth,
}));

jest.unstable_mockModule('../../src/middlewares/rolMiddleware.js', () => ({
  autorizarRoles: mockMiddlewareFactory,
  autorizarRol: mockMiddlewareFactory,
  verificarRol: mockMiddlewareFactory,
  default: mockAuth,
}));

jest.unstable_mockModule('../../src/middlewares/autorizarEncargadoMiddleware.js', () => ({
  autorizarEncargadoDeCiclo: mockMiddlewareFactory,
  autorizarEncargadoPropuesta: mockMiddlewareFactory,
  default: mockAuth,
}));

jest.unstable_mockModule('../../src/middlewares/puedeVerPropuestaMiddleware.js', () => ({
  puedeVerPropuesta: mockAuth,
  default: mockAuth,
}));

jest.unstable_mockModule('../../src/middlewares/pertenecenciaCiclomiddleware.js', () => ({
  perteneceAlCiclo: mockAuth,
  verificarPertenenciaCiclo: mockAuth,
  default: mockAuth,
}));

jest.unstable_mockModule('../../src/middlewares/uploadMiddleware.js', () => ({
  subirPdfPropuesta: mockMulterFunction,
  subirArchivoPgc: mockMulterFunction,
  subirArchivoCiclo: mockMulterFunction,
  subirPdfDocumento: mockMulterFunction,
  upload: mockMulterFunction,
  default: mockMulterFunction,
}));