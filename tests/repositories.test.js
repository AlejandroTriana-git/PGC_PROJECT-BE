import { jest } from '@jest/globals';

const mockDb = { query: jest.fn(), getConnection: jest.fn() };
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockDb }));

const pgcArchivoRepo = await import('../src/repositories/pgcArchivoRepository.js');

// Helper para simular respuesta de mysql2
const rows = (data) => [data, []];
const insertResult = (id) => [{ insertId: id, affectedRows: 1 }, []];

describe('pgcArchivoRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('buscarPgcPorId: retorna fila', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_pgc: 1 }]));
    await expect(pgcArchivoRepo.buscarPgcPorId(1)).resolves.toEqual({ id_pgc: 1 });
  });

  test('buscarPgcPorId: undefined si no existe', async () => {
    mockDb.query.mockResolvedValue(rows([]));
    await expect(pgcArchivoRepo.buscarPgcPorId(999)).resolves.toBeUndefined();
  });

  test('buscarIdStudentPorUsuario: retorna id', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_student: 5 }]));
    await expect(pgcArchivoRepo.buscarIdStudentPorUsuario(1)).resolves.toBe(5);
  });

  test('esIntegranteDePropuesta: true si existe', async () => {
    mockDb.query.mockResolvedValue(rows([{ c: 1 }]));
    await expect(pgcArchivoRepo.esIntegranteDePropuesta(1, 5)).resolves.toBe(true);
  });

  test('esIntegranteDePropuesta: false si no existe', async () => {
    mockDb.query.mockResolvedValue(rows([]));
    await expect(pgcArchivoRepo.esIntegranteDePropuesta(1, 5)).resolves.toBe(false);
  });

  test('crear: retorna insertId', async () => {
    mockDb.query.mockResolvedValue(insertResult(5));
    await expect(pgcArchivoRepo.crear({ id_pgc: 1 })).resolves.toBe(5);
  });

  test('buscarPorId: retorna fila', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_pgc_file: 1 }]));
    await expect(pgcArchivoRepo.buscarPorId(1)).resolves.toEqual({ id_pgc_file: 1 });
  });

  test('listarPorPgc: retorna array', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_pgc_file: 1 }, { id_pgc_file: 2 }]));
    await expect(pgcArchivoRepo.listarPorPgc(1)).resolves.toHaveLength(2);
  });

  test('actualizarTextos: ejecuta sin error', async () => {
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }, []]);
    await expect(pgcArchivoRepo.actualizarTextos(1, { title_file: 'T' })).resolves.toBeUndefined();
  });

  test('actualizar: ejecuta sin error', async () => {
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }, []]);
    await expect(pgcArchivoRepo.actualizar(1, { storage_path: 'p' })).resolves.toBeUndefined();
  });

  test('eliminar: ejecuta sin error', async () => {
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }, []]);
    await expect(pgcArchivoRepo.eliminar(1)).resolves.toBeUndefined();
  });
});