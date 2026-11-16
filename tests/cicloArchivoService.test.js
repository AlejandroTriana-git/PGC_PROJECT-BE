import { jest } from '@jest/globals';
import { mockDb, mockConnection } from './helpers/mocks.js';

const mockRepo = {
  crearDocumento: jest.fn(),
  obtenerDocumentosVigentes: jest.fn(),
  obtenerHistorialDocumentosCiclo: jest.fn(),
  obtenerTituloExistente: jest.fn(),
};
jest.unstable_mockModule('../src/repositories/cicloArchivoRepository.js', () => mockRepo);

const mockCicloRepo = { buscarPorId: jest.fn() };
jest.unstable_mockModule('../src/repositories/ciclosRepository.js', () => mockCicloRepo);

const mockFileObj = { save: jest.fn(), delete: jest.fn(), getSignedUrl: jest.fn().mockResolvedValue(['url']) };
jest.unstable_mockModule('../src/config/firebaseConfig.js', () => ({ default: { file: jest.fn(() => mockFileObj) } }));

const service = await import('../src/services/cicloArchivoService.js');

describe('cicloArchivoService Completo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getConnection.mockResolvedValue(mockConnection);
    mockConnection.query.mockResolvedValue([{ insertId: 1 }]);
    mockCicloRepo.buscarPorId.mockResolvedValue({ id_cycle: 1 });
  });

  const file = { mimetype: 'application/pdf', buffer: Buffer.from('x') };
  const data = { title_file: 'T', version_label: 'v1', desc_file: 'D' };

  describe('crearRubrica', () => {
    test('crea correctamente', async () => {
      mockRepo.obtenerTituloExistente.mockResolvedValue(null);
      await expect(service.crearRubrica(data, 1, 1, file)).resolves.toBeUndefined();
    });
    test('lanza 404 si ciclo no existe', async () => {
      mockCicloRepo.buscarPorId.mockResolvedValue(null);
      await expect(service.crearRubrica(data, 1, 999, file)).rejects.toMatchObject({ status: 404 });
    });
    test('lanza 400 si no hay archivo', async () => {
      await expect(service.crearRubrica(data, 1, 1, null)).rejects.toMatchObject({ status: 400 });
    });
    test('lanza 409 si hay duplicado', async () => {
      mockRepo.obtenerTituloExistente.mockResolvedValue(null);
      const err = new Error('dup'); err.code = 'ER_DUP_ENTRY';
      mockRepo.crearDocumento.mockRejectedValue(err);
      await expect(service.crearRubrica(data, 1, 1, file)).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('obtenerDocumentosCiclo', () => {
    test('retorna lista con URL', async () => {
      mockRepo.obtenerDocumentosVigentes.mockResolvedValue([{ id_cycle_document: 1, storage_path: 'p' }]);
      const res = await service.obtenerDocumentosCiclo(1, 'Rúbrica');
      expect(res).toHaveLength(1);
    });
    test('retorna [] si no hay rúbricas', async () => {
      mockRepo.obtenerDocumentosVigentes.mockResolvedValue([]);
      // CORREGIDO: Tu compañero devuelve [] en lugar de null
      await expect(service.obtenerDocumentosCiclo(1, 'Rúbrica')).resolves.toEqual([]);
    });
    test('lanza 404 si ciclo no existe', async () => {
      mockCicloRepo.buscarPorId.mockResolvedValue(null);
      await expect(service.obtenerDocumentosCiclo(999, 'Rúbrica')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('obtenerHistoriaDocumentosCiclo', () => {
    test('retorna lista', async () => {
      mockRepo.obtenerHistorialDocumentosCiclo.mockResolvedValue([{ id: 1 }]);
      await expect(service.obtenerHistoriaDocumentosCiclo(1, 'T', 'Rúbrica')).resolves.toHaveLength(1);
    });
  });
});