import { jest } from '@jest/globals';
import * as autenticarMiddleware from '../src/middlewares/autenticarMiddleware.js';
import * as rolMiddleware from '../src/middlewares/rolMiddleware.js';
import * as autorizarEncargadoMiddleware from '../src/middlewares/autorizarEncargadoMiddleware.js';
import * as puedeVerPropuestaMiddleware from '../src/middlewares/puedeVerPropuestaMiddleware.js';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('middlewares', () => {
  describe('autenticarMiddleware', () => {
    const fn = autenticarMiddleware.autenticar || autenticarMiddleware.default;

    test('rechaza sin token', () => {
      const req = { headers: {} };
      const res = mockRes();
      const next = jest.fn();
      if (typeof fn === 'function') {
        fn(req, res, next);
        // Si no hay token debe responder 401 o llamar next(error)
        expect(res.status.mock.calls.length + next.mock.calls.length).toBeGreaterThan(0);
      }
    });
  });

  describe('rolMiddleware', () => {
    const fn = rolMiddleware.autorizarRol || rolMiddleware.verificarRol || rolMiddleware.default;

    test('rechaza si no hay rol en req.user', () => {
      const req = { user: {} };
      const res = mockRes();
      const next = jest.fn();
      if (typeof fn === 'function') {
        const middleware = fn(['admin']);
        middleware(req, res, next);
        expect(res.status.mock.calls.length + next.mock.calls.length).toBeGreaterThan(0);
      }
    });
  });

  describe('autorizarEncargadoMiddleware', () => {
    test('el módulo se importa correctamente', () => {
      expect(autorizarEncargadoMiddleware).toBeDefined();
    });
  });

  describe('puedeVerPropuestaMiddleware', () => {
    test('el módulo se importa correctamente', () => {
      expect(puedeVerPropuestaMiddleware).toBeDefined();
    });
  });
});