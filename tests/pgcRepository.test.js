import { jest } from '@jest/globals';
import { mockDb, mockConnection } from './helpers/mocks.js';

const repo = await import('../src/repositories/pgcRepository.js');
const rows = (data) => [data, []];

describe('pgcRepository Completo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getConnection.mockResolvedValue(mockConnection);
  });

  test('listarPropuestasAprobadasSinPgc', async () => {
    mockDb.query.mockResolvedValueOnce(rows([{ id_proposal: 1 }]))
                  .mockResolvedValueOnce(rows([]))
                  .mockResolvedValueOnce(rows([]));
    await expect(repo.listarPropuestasAprobadasSinPgc(1)).resolves.toHaveLength(1);
  });

  test('existePgcParaPropuesta', async () => {
    mockDb.query.mockResolvedValueOnce(rows([{ id_pgc: 1 }]));
    await expect(repo.existePgcParaPropuesta(1)).resolves.toBe(true);
  });

  test('crearPgc', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ id_pgc: 1, codigo: 1, mensaje: 'ok' }]]);
    await expect(repo.crearPgc(1, 1, true)).resolves.toBeDefined();
  });

  test('listarPgcPorUsuario', async () => {
    mockDb.query.mockResolvedValueOnce(rows([{ id_pgc: 1, id_proposal: 1 }]))
                  .mockResolvedValueOnce(rows([]))
                  .mockResolvedValueOnce(rows([]));
    await expect(repo.listarPgcPorUsuario(1)).resolves.toHaveLength(1);
  });

  test('buscarPgcPorId: existe', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[{ id_pgc: 1 }]])
      .mockResolvedValueOnce([[{ codigo: 1, mensaje: 'ok' }]]);
    await expect(repo.buscarPgcPorId(1)).resolves.toBeDefined();
  });

  test('buscarPgcPorId: no existe', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ codigo: 0, mensaje: 'No existe' }]]);
    const res = await repo.buscarPgcPorId(1);
    expect(res.codigo).toBe(0);
  });

  test('buscarPgc', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0, codigo: 1, mensaje: 'ok' }]]);
    await expect(repo.buscarPgc({}, 10, 0)).resolves.toBeDefined();
  });

  test('listarPgcPendientesDeCalificar', async () => {
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.listarPgcPendientesDeCalificar(1)).resolves.toEqual([]);
  });

  test('esJuradoDelCiclo', async () => {
    mockDb.query.mockResolvedValue(rows([{ 1: 1 }]));
    await expect(repo.esJuradoDelCiclo(1, 1)).resolves.toBe(true);
  });

  test('yaCalificoPgc', async () => {
    mockDb.query.mockResolvedValue(rows([{ 1: 1 }]));
    await expect(repo.yaCalificoPgc(1, 1)).resolves.toBe(true);
  });

  test('crearCalificacion', async () => {
    // CORREGIDO: El mock debe devolver un objeto, no un arreglo de objetos
    mockDb.query.mockResolvedValue([{ insertId: 1 }, []]);
    await expect(repo.crearCalificacion(1, 1, 4.5, 'ok')).resolves.toBe(1);
  });

  test('contarJuradosDelCiclo', async () => {
    mockDb.query.mockResolvedValue(rows([{ total: 2 }]));
    await expect(repo.contarJuradosDelCiclo(1)).resolves.toBe(2);
  });

  test('contarCalificacionesDelPgc', async () => {
    mockDb.query.mockResolvedValue(rows([{ total: 1 }]));
    await expect(repo.contarCalificacionesDelPgc(1)).resolves.toBe(1);
  });

  test('calcularPromedioPgc', async () => {
    mockDb.query.mockResolvedValue(rows([{ promedio: 4.5 }]));
    await expect(repo.calcularPromedioPgc(1)).resolves.toBe(4.5);
  });

  test('marcarPgcComoTerminado', async () => {
    mockDb.query.mockResolvedValue([[]]);
    await expect(repo.marcarPgcComoTerminado(1)).resolves.toBeUndefined();
  });

  test('esDelEquipo', async () => {
    mockDb.query.mockResolvedValue(rows([{ 1: 1 }]));
    await expect(repo.esDelEquipo(1, 1)).resolves.toBe(true);
  });

  test('listarComentariosDelPgc', async () => {
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.listarComentariosDelPgc(1)).resolves.toEqual([]);
  });

  test('buscarCalificacionDeJurado', async () => {
    mockDb.query.mockResolvedValue(rows([{ grade: 4.5 }]));
    await expect(repo.buscarCalificacionDeJurado(1, 1)).resolves.toBeDefined();
  });

  test('listarPgcCalificadosPorJurado', async () => {
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.listarPgcCalificadosPorJurado(1)).resolves.toEqual([]);
  });
});