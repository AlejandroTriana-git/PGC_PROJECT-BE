import { jest } from '@jest/globals';

// 1. Mockeamos SOLO las dependencias de los middlewares
const mockCicloRepo = { usuarioPerteneceAlCiclo: jest.fn() };
jest.unstable_mockModule('../src/repositories/ciclosRepository.js', () => mockCicloRepo);

const mockAsigRepo = { esEncargadoDeCiclo: jest.fn(), obtenerCicloPropuesta: jest.fn() };
jest.unstable_mockModule('../src/repositories/asignacionesRepository.js', () => mockAsigRepo);

const mockPropRepo = { esMiembroDePropuesta: jest.fn() };
jest.unstable_mockModule('../src/repositories/propuestaRepository.js', () => mockPropRepo);

const mockPgcRepo = { esJuradoDelCiclo: jest.fn() };
jest.unstable_mockModule('../src/repositories/pgcRepository.js', () => mockPgcRepo);

// 2. Importamos los middlewares REALES
const { perteneceAlCiclo } = await import('../src/middlewares/pertenecenciaCiclomiddleware.js');
const { puedeVerPropuesta } = await import('../src/middlewares/puedeVerPropuestaMiddleware.js');

describe('Middlewares Nuevos', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { usuario: { id: 1, rol: 'Estudiante' }, params: { id: 1, idProposal: 1 } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  describe('perteneceAlCiclo', () => {
    test('401 si no hay usuario', async () => {
      req.usuario = null;
      await perteneceAlCiclo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('next si es Admin', async () => {
      req.usuario.rol = 'Administrador';
      await perteneceAlCiclo(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('403 si no pertenece', async () => {
      mockCicloRepo.usuarioPerteneceAlCiclo.mockResolvedValue(false);
      await perteneceAlCiclo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('next si pertenece', async () => {
      mockCicloRepo.usuarioPerteneceAlCiclo.mockResolvedValue(true);
      await perteneceAlCiclo(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('puedeVerPropuesta', () => {
    test('401 si no hay usuario', async () => {
      req.usuario = null;
      const mw = puedeVerPropuesta();
      await mw(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('next si es miembro', async () => {
      mockPropRepo.esMiembroDePropuesta.mockResolvedValue(true);
      const mw = puedeVerPropuesta();
      await mw(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('404 si propuesta no existe', async () => {
      mockPropRepo.esMiembroDePropuesta.mockResolvedValue(false);
      mockAsigRepo.obtenerCicloPropuesta.mockResolvedValue(null);
      const mw = puedeVerPropuesta();
      await mw(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('next si es encargado', async () => {
      mockPropRepo.esMiembroDePropuesta.mockResolvedValue(false);
      mockAsigRepo.obtenerCicloPropuesta.mockResolvedValue(1);
      mockAsigRepo.esEncargadoDeCiclo.mockResolvedValue(true);
      const mw = puedeVerPropuesta();
      await mw(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('next si es jurado', async () => {
      mockPropRepo.esMiembroDePropuesta.mockResolvedValue(false);
      mockAsigRepo.obtenerCicloPropuesta.mockResolvedValue(1);
      mockAsigRepo.esEncargadoDeCiclo.mockResolvedValue(false);
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(true);
      const mw = puedeVerPropuesta();
      await mw(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('403 si no es nadie', async () => {
      mockPropRepo.esMiembroDePropuesta.mockResolvedValue(false);
      mockAsigRepo.obtenerCicloPropuesta.mockResolvedValue(1);
      mockAsigRepo.esEncargadoDeCiclo.mockResolvedValue(false);
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(false);
      const mw = puedeVerPropuesta();
      await mw(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});