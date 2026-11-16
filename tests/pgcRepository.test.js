import { jest } from '@jest/globals';

const mockDb = { query: jest.fn() };
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockDb }));

const repo = await import('../src/repositories/pgcRepository.js');

const rows = (data) => [data, []];
const insertResult = (id) => [{ insertId: id, affectedRows: 1 }, []];

describe('pgcRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('listarPropuestasAprobadasSinPgc', async () => {
    mockDb.query.mockResolvedValue(rows([{ id: 1 }]));
    await expect(repo.listarPropuestasAprobadasSinPgc(5)).resolves.toHaveLength(1);
  });

  test('existePgcParaPropuesta: true/false', async () => {
    mockDb.query.mockResolvedValue(rows([{ c: 1 }]));
    await expect(repo.existePgcParaPropuesta(1)).resolves.toBe(true);
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.existePgcParaPropuesta(1)).resolves.toBe(false);
  });

  test('crearPgc: retorna insertId', async () => {
    mockDb.query.mockResolvedValue(insertResult(1));
    await expect(repo.crearPgc(mockDb, { id_cycle: 1, id_proposal: 1 })).resolves.toBe(1);
  });

  test('listarPgcPorUsuario', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_pgc: 1 }]));
    await expect(repo.listarPgcPorUsuario(5)).resolves.toHaveLength(1);
  });

  test('buscarPgcPorId', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_pgc: 1 }]));
    await expect(repo.buscarPgcPorId(1)).resolves.toEqual({ id_pgc: 1 });
  });

  test('buscarPgcPorId: undefined si no existe', async () => {
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.buscarPgcPorId(999)).resolves.toBeUndefined();
  });

  test('buscarCategoriasPropuesta', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_category: 1 }]));
    await expect(repo.buscarCategoriasPropuesta(1)).resolves.toHaveLength(1);
  });

  test('buscarIntegrantesPropuesta', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_user: 5 }]));
    await expect(repo.buscarIntegrantesPropuesta(1)).resolves.toHaveLength(1);
  });

  test('contarPgcBuscados', async () => {
    mockDb.query.mockResolvedValue(rows([{ total: 25 }]));
    await expect(repo.contarPgcBuscados({})).resolves.toBeDefined();
  });

  test('buscarPgcPaginados', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_pgc: 1 }]));
    await expect(repo.buscarPgcPaginados({}, 10, 0)).resolves.toHaveLength(1);
  });

  test('buscarCategoriasDeVariasPropuestas', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_proposal: 1, id_category: 10 }]));
    await expect(repo.buscarCategoriasDeVariasPropuestas([1])).resolves.toHaveLength(1);
  });

  test('listarPgcPendientesDeCalificar', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_pgc: 1 }]));
    await expect(repo.listarPgcPendientesDeCalificar(20)).resolves.toHaveLength(1);
  });

  test('esJuradoDelCiclo: true/false', async () => {
    mockDb.query.mockResolvedValue(rows([{ c: 1 }]));
    await expect(repo.esJuradoDelCiclo(20, 1)).resolves.toBe(true);
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.esJuradoDelCiclo(20, 1)).resolves.toBe(false);
  });

  test('yaCalificoPgc: true/false', async () => {
    mockDb.query.mockResolvedValue(rows([{ c: 1 }]));
    await expect(repo.yaCalificoPgc(1, 20)).resolves.toBe(true);
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.yaCalificoPgc(1, 20)).resolves.toBe(false);
  });

  test('crearCalificacion: retorna insertId', async () => {
    mockDb.query.mockResolvedValue(insertResult(99));
    await expect(repo.crearCalificacion(1, 20, 4.5, 'Bien')).resolves.toBe(99);
  });

  test('contarJuradosDelCiclo', async () => {
    mockDb.query.mockResolvedValue(rows([{ total: 3 }]));
    await expect(repo.contarJuradosDelCiclo(1)).resolves.toBeDefined();
  });

  test('contarCalificacionesDelPgc', async () => {
    mockDb.query.mockResolvedValue(rows([{ total: 2 }]));
    await expect(repo.contarCalificacionesDelPgc(1)).resolves.toBeDefined();
  });

  test('marcarPgcComoTerminado', async () => {
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }, []]);
    await expect(repo.marcarPgcComoTerminado(1)).resolves.toBeUndefined();
  });

  test('esDelEquipo: true/false', async () => {
    mockDb.query.mockResolvedValue(rows([{ c: 1 }]));
    await expect(repo.esDelEquipo(1, 5)).resolves.toBe(true);
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.esDelEquipo(1, 5)).resolves.toBe(false);
  });

  test('listarCalificacionesDelPgc', async () => {
    mockDb.query.mockResolvedValue(rows([{ grade: 4 }]));
    await expect(repo.listarCalificacionesDelPgc(1)).resolves.toHaveLength(1);
  });

  test('calcularPromedioPgc', async () => {
    mockDb.query.mockResolvedValue(rows([{ promedio: 4.5 }]));
    await expect(repo.calcularPromedioPgc(1)).resolves.toBeDefined();
  });

  test('buscarCalificacionDeJurado', async () => {
    mockDb.query.mockResolvedValue(rows([{ grade: 4 }]));
    await expect(repo.buscarCalificacionDeJurado(1, 20)).resolves.toEqual({ grade: 4 });
  });

  test('listarPgcCalificadosPorJurado', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_pgc: 1 }]));
    await expect(repo.listarPgcCalificadosPorJurado(20)).resolves.toHaveLength(1);
  });
});