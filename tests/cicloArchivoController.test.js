import { jest } from '@jest/globals';

const mockCicloArchivoService = {
  crearLineamiento: jest.fn(),
  crearRubrica: jest.fn(),
  obtenerDocumentosCiclo: jest.fn(),
  obtenerHistoriaDocumentosCiclo: jest.fn(),
};
jest.unstable_mockModule('../src/services/cicloArchivoService.js', () => mockCicloArchivoService);

const controller = await import('../src/controllers/cicloArchivoController.js');

describe('cicloArchivoController (Unitario Directo)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { usuario: { id: 1 }, body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  test('crearLineamiento: 201', async () => {
    mockCicloArchivoService.crearLineamiento.mockResolvedValue({});
    await controller.crearLineamiento(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('crearRubrica: 201', async () => {
    mockCicloArchivoService.crearRubrica.mockResolvedValue({});
    await controller.crearRubrica(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('obtenerDocumentosCiclo: 200', async () => {
    mockCicloArchivoService.obtenerDocumentosCiclo.mockResolvedValue([]);
    await controller.obtenerDocumentosCiclo(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('obtenerHistoriaDocumentosCiclo: 200', async () => {
    mockCicloArchivoService.obtenerHistoriaDocumentosCiclo.mockResolvedValue([]);
    await controller.obtenerHistoriaDocumentosCiclo(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});