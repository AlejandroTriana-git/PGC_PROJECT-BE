import { jest } from '@jest/globals';

const mockPgcArchivoService = {
  subirArchivo: jest.fn(),
  listarArchivos: jest.fn(),
  reemplazarArchivo: jest.fn(),
  eliminarArchivo: jest.fn(),
};
jest.unstable_mockModule('../src/services/pgcArchivoService.js', () => mockPgcArchivoService);

jest.unstable_mockModule('../src/validators/archivoPgcValidator.js', () => ({
  validarDatosArchivoPgc: jest.fn().mockReturnValue([]),
  normalizarDatosArchivoPgc: jest.fn().mockReturnValue({}),
}));

const controller = await import('../src/controllers/pgcArchivoController.js');

describe('pgcArchivoController (Unitario Directo)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { usuario: { id: 1 }, body: {}, params: {}, file: { originalname: 'test' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() };
  });

  test('subir: 201', async () => {
    mockPgcArchivoService.subirArchivo.mockResolvedValue({});
    await controller.subir(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('listar: 200', async () => {
    mockPgcArchivoService.listarArchivos.mockResolvedValue([]);
    await controller.listar(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('reemplazar: 200', async () => {
    mockPgcArchivoService.reemplazarArchivo.mockResolvedValue({});
    await controller.reemplazar(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('eliminar: 204', async () => {
    mockPgcArchivoService.eliminarArchivo.mockResolvedValue({});
    await controller.eliminar(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});