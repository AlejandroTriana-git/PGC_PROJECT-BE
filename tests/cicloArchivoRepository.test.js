import { jest } from '@jest/globals';
import { mockDb } from './helpers/mocks.js';

const repo = await import('../src/repositories/cicloArchivoRepository.js');
const rows = (data) => [data, []];

describe('cicloArchivoRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crearDocumento: retorna el ID insertado', async () => {
    mockDb.query.mockResolvedValue([{ insertId: 1 }, []]);
    const res = await repo.crearDocumento({
      idCiclo: 1, idUsuario: 2, docType: 'Lineamiento',
      titleFile: 'T', descFile: 'D', versionLabel: 'v1', storagePath: 'p',
    }, mockDb);
    
    // Tu compañero hizo que retorne 1 en lugar de undefined
    expect(res).toBe(1); 
  });

  test('obtenerDocumentosVigentes: retorna filas', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_cycle_document: 1 }]));
    await expect(repo.obtenerDocumentosVigentes(1, 'Rúbrica')).resolves.toHaveLength(1);
  });
});