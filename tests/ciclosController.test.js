import { jest } from '@jest/globals';

const mockCiclosService = {
  crearCiclo: jest.fn(),
  editarCiclo: jest.fn(),
  listarCiclos: jest.fn(),
  asignarJurados: jest.fn(),
  quitarJurado: jest.fn(),
  listarJuradosDeCiclo: jest.fn(),
  listarProfesoresDisponibles: jest.fn(),
  obtenerFechas: jest.fn(),
  actualizarFechas: jest.fn(),
};
jest.unstable_mockModule('../src/services/ciclosService.js', () => mockCiclosService);

// Mock del validador para que no bloquee las peticiones en los tests
jest.unstable_mockModule('../src/validators/ciclosValidator.js', () => ({
  validarCiclo: jest.fn().mockReturnValue([]), 
}));

const ciclosController = await import('../src/controllers/ciclosController.js');

describe('ciclosController (Unitario Directo)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { usuario: { id: 1 }, body: {}, params: {}, query: {} };
    res = { 
      status: jest.fn().mockReturnThis(), 
      json: jest.fn() 
    };
  });

  test('crear: responde 201', async () => {
    mockCiclosService.crearCiclo.mockResolvedValue({ id: 1 });
    await ciclosController.crear(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('editar: responde 200', async () => {
    mockCiclosService.editarCiclo.mockResolvedValue({ id: 1 });
    await ciclosController.editar(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('listar: responde 200', async () => {
    mockCiclosService.listarCiclos.mockResolvedValue([]);
    await ciclosController.listar(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('asignarJurados: responde con res.json', async () => {
    mockCiclosService.asignarJurados.mockResolvedValue({});
    await ciclosController.asignarJurados(req, res);
    // ✅ CORREGIDO: El controlador usa res.json() directamente
    expect(res.json).toHaveBeenCalled(); 
  });

  test('quitarJurado: responde con res.json', async () => {
    mockCiclosService.quitarJurado.mockResolvedValue({});
    await ciclosController.quitarJurado(req, res);
    // ✅ CORREGIDO: El controlador usa res.json() directamente
    expect(res.json).toHaveBeenCalled(); 
  });

  test('listarJurados: responde con res.json', async () => {
    mockCiclosService.listarJuradosDeCiclo.mockResolvedValue([]);
    await ciclosController.listarJurados(req, res);
    // ✅ CORREGIDO: El controlador usa res.json() directamente
    expect(res.json).toHaveBeenCalled(); 
  });

  test('listarProfesores: responde 200', async () => {
    mockCiclosService.listarProfesoresDisponibles.mockResolvedValue([]);
    await ciclosController.listarProfesores(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('obtenerFechas: responde 200', async () => {
    mockCiclosService.obtenerFechas.mockResolvedValue([]);
    await ciclosController.obtenerFechas(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('actualizarFechas: responde 200', async () => {
    mockCiclosService.actualizarFechas.mockResolvedValue({});
    await ciclosController.actualizarFechas(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});