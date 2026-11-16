import { jest } from '@jest/globals';

const mockDb = { query: jest.fn(), getConnection: jest.fn() };
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockDb }));

const repo = await import('../src/repositories/cicloArchivoRepository.js');

const rows = (data) => [data, []];
const insertResult = (id) => [{ insertId: id, affectedRows: 1 }, []];

describe('cicloArchivoRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crearDocumento', async () => {
    mockDb.query.mockResolvedValue(insertResult(1));
    await expect(repo.crearDocumento({
      idCiclo: 1, idUsuario: 2, docType: 'Lineamiento',
      titleFile: 'T', descFile: 'D', versionLabel: 'v1', storagePath: 'p',
    }, mockDb)).resolves.toBeUndefined();
  });

  test('obtenerDocumentosVigentes: retorna filas', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_cycle_document: 1 }]));
    await expect(repo.obtenerDocumentosVigentes(1, 'Lineamiento')).resolves.toHaveLength(1);
  });

  test('obtenerDocumentosVigentes: array vacío', async () => {
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.obtenerDocumentosVigentes(1, 'Rubrica')).resolves.toEqual([]);
  });

  test('obtenerHistorialDocumentosCiclo: retorna filas', async () => {
    mockDb.query.mockResolvedValue(rows([{ id: 1 }]));
    await expect(repo.obtenerHistorialDocumentosCiclo(1, 'T', 'Lineamiento')).resolves.toHaveLength(1);
  });

  test('obtenerTituloExistente: retorna título', async () => {
    mockDb.query.mockResolvedValue(rows([{ title_file: 'Existente' }]));
    await expect(repo.obtenerTituloExistente(1, 'Lineamiento', 'Existente')).resolves.toBe('Existente');
  });

  test('obtenerTituloExistente: null si no existe', async () => {
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.obtenerTituloExistente(1, 'Lineamiento', 'X')).resolves.toBeNull();
  });
});