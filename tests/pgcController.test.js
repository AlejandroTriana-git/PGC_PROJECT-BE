import { jest } from '@jest/globals';

const mockPgcService = {
  listarPropuestasAprobadasSinPgc: jest.fn(),
  crearPgc: jest.fn(),
  listarMisPgc: jest.fn(),
  buscarPgc: jest.fn(),
  obtenerPgcPorId: jest.fn(),
  listarPgcPendientesDeCalificar: jest.fn(),
  calificarPgc: jest.fn(),
  obtenerCalificaciones: jest.fn(),
  listarPgcCalificadosPorJurado: jest.fn(),
};
jest.unstable_mockModule('../src/services/pgcService.js', () => mockPgcService);

jest.unstable_mockModule('../src/validators/busquedaPgcValidator.js', () => ({
  validarBusquedaPgc: jest.fn().mockReturnValue([]),
  normalizarFiltrosBusquedaPgc: jest.fn().mockReturnValue({}),
}));

const pgcController = await import('../src/controllers/pgcController.js');

describe('pgcController (Unitario Directo)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { usuario: { id: 1 }, body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  test('listarPropuestasAprobadasSinPgc: 200', async () => {
    mockPgcService.listarPropuestasAprobadasSinPgc.mockResolvedValue([]);
    await pgcController.listarPropuestasAprobadasSinPgc(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('crearPgc: 400 si no hay id_proposal', async () => {
    await pgcController.crearPgc(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('crearPgc: 201', async () => {
    req.body.id_proposal = 1;
    mockPgcService.crearPgc.mockResolvedValue({ id_pgc: 1 });
    await pgcController.crearPgc(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('listarMisPgc: 200', async () => {
    mockPgcService.listarMisPgc.mockResolvedValue([]);
    await pgcController.listarMisPgc(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('buscarPgc: 200', async () => {
    mockPgcService.buscarPgc.mockResolvedValue({});
    await pgcController.buscarPgc(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('obtenerPgc: 200', async () => {
    mockPgcService.obtenerPgcPorId.mockResolvedValue({});
    await pgcController.obtenerPgc(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('listarPgcPendientesDeCalificar: 200', async () => {
    mockPgcService.listarPgcPendientesDeCalificar.mockResolvedValue([]);
    await pgcController.listarPgcPendientesDeCalificar(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('calificarPgc: 201', async () => {
    mockPgcService.calificarPgc.mockResolvedValue({});
    await pgcController.calificarPgc(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('obtenerCalificaciones: 200', async () => {
    mockPgcService.obtenerCalificaciones.mockResolvedValue({});
    await pgcController.obtenerCalificaciones(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('listarPgcCalificadosPorJurado: 200', async () => {
    mockPgcService.listarPgcCalificadosPorJurado.mockResolvedValue([]);
    await pgcController.listarPgcCalificadosPorJurado(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});