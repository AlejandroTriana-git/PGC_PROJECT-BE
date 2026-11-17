import { jest } from '@jest/globals';

// Mockeamos el servicio
const mockPropuestaService = {
  crearPropuesta: jest.fn(),
  reenviarPropuesta: jest.fn(),
  obtenerUrlPdf: jest.fn(),
  verMiPropuesta: jest.fn(),
  listarPendientesPorCiclo: jest.fn(),
  aprobarPropuesta: jest.fn(),
  rechazarPropuesta: jest.fn(),
};
jest.unstable_mockModule('../src/services/propuestaService.js', () => mockPropuestaService);

// Importamos el controlador directamente (sin Express)
const propuestaController = await import('../src/controllers/propuestaController.js');

describe('propuestaController (Unitario Directo)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      usuario: { id: 1, rol: 'Estudiante' },
      body: {},
      params: {},
      query: {},
      file: { originalname: 'test.pdf' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test('crearPropuesta: responde 201 en éxito', async () => {
    mockPropuestaService.crearPropuesta.mockResolvedValue({ id_proposal: 1 });
    await propuestaController.crearPropuesta(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('crearPropuesta: responde 500 en error', async () => {
    mockPropuestaService.crearPropuesta.mockRejectedValue(new Error('DB Error'));
    await propuestaController.crearPropuesta(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('reenviarPropuesta: responde 200', async () => {
    mockPropuestaService.reenviarPropuesta.mockResolvedValue({ mensaje: 'ok' });
    await propuestaController.reenviarPropuesta(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('verPdfPropuesta: responde 200', async () => {
    mockPropuestaService.obtenerUrlPdf.mockResolvedValue({ url: 'http' });
    await propuestaController.verPdfPropuesta(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('verMiPropuesta: responde 200', async () => {
    mockPropuestaService.verMiPropuesta.mockResolvedValue({ id: 1 });
    await propuestaController.verMiPropuesta(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('listarPendientes: responde 400 si falta cycle', async () => {
    await propuestaController.listarPendientes(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('listarPendientes: responde 200 si hay cycle', async () => {
    req.query.cycle = 1;
    mockPropuestaService.listarPendientesPorCiclo.mockResolvedValue([]);
    await propuestaController.listarPendientes(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('aprobar: responde 200', async () => {
    mockPropuestaService.aprobarPropuesta.mockResolvedValue({ mensaje: 'ok' });
    await propuestaController.aprobar(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('rechazar: responde 400 si validación falla', async () => {
    req.body = {}; // Faltan datos para validarRechazo
    await propuestaController.rechazar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('rechazar: responde 200 en éxito', async () => {
    req.body = { comentario: 'Mal' };
    mockPropuestaService.rechazarPropuesta.mockResolvedValue({ mensaje: 'ok' });
    await propuestaController.rechazar(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});