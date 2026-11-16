import { jest } from '@jest/globals';

// 1. Mocks de Base de Datos y Firebase
const mockConnection = {
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
};
const mockDb = { getConnection: jest.fn().mockResolvedValue(mockConnection) };
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockDb }));

const mockFile = { 
  save: jest.fn(), 
  delete: jest.fn(), 
  getSignedUrl: jest.fn().mockResolvedValue(['http://url']) 
};
const mockBucket = { file: jest.fn(() => mockFile) };
jest.unstable_mockModule('../src/config/firebaseConfig.js', () => ({ default: mockBucket }));

// 2. Mocks de Repositorios
const mockCicloRepo = { buscarPorId: jest.fn() };
jest.unstable_mockModule('../src/repositories/ciclosRepository.js', () => mockCicloRepo);

const mockCicloArchivoRepo = {
  obtenerTituloExistente: jest.fn(),
  crearDocumento: jest.fn(),
  obtenerDocumentosVigentes: jest.fn(),
  obtenerHistorialDocumentosCiclo: jest.fn(),
};
jest.unstable_mockModule('../src/repositories/cicloArchivoRepository.js', () => mockCicloArchivoRepo);

// 3. Importar el Servicio
const cicloArchivoService = await import('../src/services/cicloArchivoService.js');

describe('cicloArchivoService (Cobertura Alta)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getConnection.mockResolvedValue(mockConnection);
  });

  test('crearLineamiento: crea exitosamente', async () => {
    mockCicloRepo.buscarPorId.mockResolvedValue({ id_cycle: 1 });
    mockCicloArchivoRepo.obtenerTituloExistente.mockResolvedValue(null);
    mockCicloArchivoRepo.crearDocumento.mockResolvedValue(true);

    await cicloArchivoService.crearLineamiento(
      { title_file: 'T', version_label: 'v1' }, 1, 1, { buffer: 'x', mimetype: 'application/pdf' }
    );

    expect(mockCicloArchivoRepo.crearDocumento).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
  });

  test('crearRubrica: falla si ciclo no existe', async () => {
    mockCicloRepo.buscarPorId.mockResolvedValue(null);
    
    await expect(
      cicloArchivoService.crearRubrica({ title_file: 'T', version_label: 'v1' }, 1, 999, { mimetype: 'application/pdf' })
    ).rejects.toMatchObject({ status: 404 });
  });

  test('obtenerDocumentosCiclo: retorna lineamientos con URL', async () => {
    mockCicloRepo.buscarPorId.mockResolvedValue({ id_cycle: 1 });
    mockCicloArchivoRepo.obtenerDocumentosVigentes.mockResolvedValue([
      { id_cycle_document: 1, title_file: 'T', desc_file: 'D', version_label: 'v1', storage_path: 'p' }
    ]);

    const res = await cicloArchivoService.obtenerDocumentosCiclo(1, 'Lineamiento');
    expect(res).toHaveLength(1);
    expect(res[0].url).toBe('http://url');
  });

  test('obtenerDocumentosCiclo: retorna null si no hay rubrica', async () => {
    mockCicloRepo.buscarPorId.mockResolvedValue({ id_cycle: 1 });
    mockCicloArchivoRepo.obtenerDocumentosVigentes.mockResolvedValue([]);

    const res = await cicloArchivoService.obtenerDocumentosCiclo(1, 'Rubrica');
    expect(res).toBeNull();
  });

  test('obtenerDocumentosCiclo: falla si tipo es inválido', async () => {
    mockCicloRepo.buscarPorId.mockResolvedValue({ id_cycle: 1 });
    
    await expect(
      cicloArchivoService.obtenerDocumentosCiclo(1, 'Otro')
    ).rejects.toMatchObject({ status: 400 });
  });

  test('obtenerHistoriaDocumentosCiclo: retorna historial', async () => {
    mockCicloRepo.buscarPorId.mockResolvedValue({ id_cycle: 1 });
    mockCicloArchivoRepo.obtenerHistorialDocumentosCiclo.mockResolvedValue([{ id: 1 }]);

    const res = await cicloArchivoService.obtenerHistoriaDocumentosCiclo(1, 'T', 'Lineamiento');
    expect(res).toHaveLength(1);
  });

  test('obtenerHistoriaDocumentosCiclo: falla si falta title_file', async () => {
    mockCicloRepo.buscarPorId.mockResolvedValue({ id_cycle: 1 });
    
    await expect(
      cicloArchivoService.obtenerHistoriaDocumentosCiclo(1, null, 'Lineamiento')
    ).rejects.toMatchObject({ status: 400 });
  });
});