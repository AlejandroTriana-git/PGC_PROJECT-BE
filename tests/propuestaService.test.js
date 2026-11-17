import { jest } from '@jest/globals';
import { mockDb, mockConnection } from './helpers/mocks.js';

const mockPropuestaRepo = {
  buscarPropuestaPorId: jest.fn(),
  buscarEstudiantePorId: jest.fn(),
  buscarCicloPorId: jest.fn(),
  buscarPropuestaActiva: jest.fn(),
  crearPropuesta: jest.fn(),
  insertarIntegrante: jest.fn(),
  insertarCategoriaPropuesta: jest.fn(),
  revisarPropuesta: jest.fn(),
  eliminarCategoriasPropuesta: jest.fn(),
  eliminarIntegrantesPropuesta: jest.fn(),
  reenviarPropuesta: jest.fn(),
  buscarPropuestaCompletaPorEstudiante: jest.fn(),
};
jest.unstable_mockModule('../src/repositories/propuestaRepository.js', () => mockPropuestaRepo);

const mockCiclosRepo = { buscarPorId: jest.fn() };
jest.unstable_mockModule('../src/repositories/ciclosRepository.js', () => mockCiclosRepo);

const mockValidator = { estaDentroDeLaEtapa: jest.fn(), STAGES: { RADICACION: 'Radicacion' }, encontrarFechasEtapas: jest.fn() };
jest.unstable_mockModule('../src/validators/ciclosValidator.js', () => mockValidator);

const mockFileObj = { save: jest.fn(), delete: jest.fn(), getSignedUrl: jest.fn().mockResolvedValue(['url']) };
jest.unstable_mockModule('../src/config/firebaseConfig.js', () => ({ default: { file: jest.fn(() => mockFileObj) } }));

const service = await import('../src/services/propuestaService.js');

describe('propuestaService Completo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getConnection.mockResolvedValue(mockConnection);
    mockConnection.query.mockResolvedValue([[]]);
    mockValidator.estaDentroDeLaEtapa.mockResolvedValue(true);
    mockPropuestaRepo.buscarPropuestaActiva.mockResolvedValue(null); 
  });

  const data = { title_proposal: 'T', descr_proposal: 'D', problem_proposal: 'P', justification_proposal: 'J', objectives_proposal: 'O', solution_proposal: 'S', integrantes: [], categorias: [1] };
  const file = { mimetype: 'application/pdf', buffer: Buffer.from('x') };
  const lider = { id_student: 1, id_cycle: 1 };
  const ciclo = { id_cycle: 1, max_members: 5 };

  describe('crearPropuesta', () => {
    test('lanza error por falta de campos', async () => {
      await expect(service.crearPropuesta({}, 1, file)).rejects.toBeDefined();
    });

    test('lanza error por falta de PDF', async () => {
      await expect(service.crearPropuesta(data, 1, null)).rejects.toMatchObject({ status: 400 });
    });

    test('lanza 404 si líder no existe', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(null);
      await expect(service.crearPropuesta(data, 1, file)).rejects.toMatchObject({ status: 404 });
    });

    test('lanza 404 si ciclo no existe', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(null);
      await expect(service.crearPropuesta(data, 1, file)).rejects.toMatchObject({ status: 404 });
    });

    test('lanza 400 si propuesta activa', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(ciclo);
      mockPropuestaRepo.buscarPropuestaActiva.mockResolvedValue({}); 
      await expect(service.crearPropuesta(data, 1, file)).rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si excede max_members', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue({ ...ciclo, max_members: 0 });
      // CORREGIDO: Enviamos 1 integrante para que 1 > 0 sea true
      await expect(service.crearPropuesta({ ...data, integrantes: [1] }, 1, file)).rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 fuera de fecha', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(ciclo);
      mockValidator.estaDentroDeLaEtapa.mockResolvedValue(false);
      mockValidator.encontrarFechasEtapas.mockResolvedValue({ fechaInicio: 'A', fechaFin: 'B' });
      await expect(service.crearPropuesta(data, 1, file)).rejects.toMatchObject({ status: 400 });
    });

    test('lanza error si falla transacción', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(ciclo);
      mockPropuestaRepo.crearPropuesta.mockRejectedValue(new Error('DB Error'));
      await expect(service.crearPropuesta(data, 1, file)).rejects.toThrow('DB Error');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    test('crea propuesta exitosamente', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(ciclo);
      mockPropuestaRepo.crearPropuesta.mockResolvedValue(1);
      await expect(service.crearPropuesta(data, 1, file)).resolves.toBeDefined();
    });
  });

  describe('reenviarPropuesta', () => {
    test('404 si no existe', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(null);
      await expect(service.reenviarPropuesta(1, data, 1, file)).rejects.toMatchObject({ status: 404 });
    });
    test('400 si no está Rechazada', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue({ state_proposal: 'Aprobada' });
      await expect(service.reenviarPropuesta(1, data, 1, file)).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('aprobar/rechazar', () => {
    test('aprobarPropuesta retorna mensaje', async () => {
      mockPropuestaRepo.revisarPropuesta.mockResolvedValue({ codigo: 1, mensaje: 'ok' });
      await expect(service.aprobarPropuesta(1, { id: 1 })).resolves.toHaveProperty('mensaje');
    });
    test('rechazarPropuesta retorna mensaje', async () => {
      mockPropuestaRepo.revisarPropuesta.mockResolvedValue({ codigo: 1, mensaje: 'ok', nuevo_resubmit: 1 });
      await expect(service.rechazarPropuesta(1, 'comentario', { id: 1 })).resolves.toHaveProperty('mensaje');
    });
  });

  describe('verMiPropuesta', () => {
    test('retorna propuesta si existe', async () => {
      mockPropuestaRepo.buscarPropuestaCompletaPorEstudiante.mockResolvedValue({
        codigo: 1, propuesta: { id_proposal: 1, pdf_storage_path: 'p' }, integrantes: [], categorias: []
      });
      await expect(service.verMiPropuesta(1)).resolves.toBeDefined();
    });
  });
});