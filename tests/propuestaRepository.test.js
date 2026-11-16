import { jest } from '@jest/globals';
import { mockDb, mockConnection } from './helpers/mocks.js';

const repo = await import('../src/repositories/propuestaRepository.js');
const rows = (data) => [data, []];

describe('propuestaRepository Completo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getConnection.mockResolvedValue(mockConnection);
  });

  test('crearPropuesta', async () => {
    // CORREGIDO: mockResolvedValue debe devolver el objeto, no un arreglo
    mockConnection.query.mockResolvedValue([{ insertId: 1 }, []]);
    await expect(repo.crearPropuesta(mockConnection, {})).resolves.toBe(1);
  });

  test('insertarIntegrante', async () => {
    mockConnection.query.mockResolvedValue([[]]);
    await expect(repo.insertarIntegrante(mockConnection, 1, 1)).resolves.toBeUndefined();
  });

  test('buscarPropuestaActiva', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_proposal: 1 }]));
    await expect(repo.buscarPropuestaActiva(1, 1)).resolves.toBeDefined();
  });

  test('buscarEstudiantePorId', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_student: 1 }]));
    await expect(repo.buscarEstudiantePorId(1)).resolves.toBeDefined();
  });

  test('buscarCicloPorId', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_cycle: 1 }]));
    await expect(repo.buscarCicloPorId(1)).resolves.toBeDefined();
  });

  test('buscarPropuestaPorId', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_proposal: 1 }]));
    await expect(repo.buscarPropuestaPorId(1)).resolves.toBeDefined();
  });

  test('reenviarPropuesta', async () => {
    mockConnection.query.mockResolvedValue([[]]);
    await expect(repo.reenviarPropuesta(mockConnection, 1, {})).resolves.toBeUndefined();
  });

  test('esMiembroDePropuesta: true/false', async () => {
    mockDb.query.mockResolvedValue(rows([{ 1: 1 }]));
    await expect(repo.esMiembroDePropuesta(1, 1)).resolves.toBe(true);
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.esMiembroDePropuesta(1, 1)).resolves.toBe(false);
  });

  test('buscarPropuestaCompletaPorEstudiante', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[[]]]) 
      .mockResolvedValueOnce([[{ codigo: 1, mensaje: 'ok' }]]); 
    await expect(repo.buscarPropuestaCompletaPorEstudiante(1)).resolves.toBeDefined();
  });

  test('buscarPorId', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_proposal: 1 }]));
    await expect(repo.buscarPorId(1)).resolves.toBeDefined();
  });

  test('listarPorCicloYEstado', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_proposal: 1 }]));
    await expect(repo.listarPorCicloYEstado(1, 'Pendiente')).resolves.toHaveLength(1);
  });

  test('revisarPropuesta', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ codigo: 1, mensaje: 'ok', resubmit: 1 }]]);
    await expect(repo.revisarPropuesta(1, 1, 'APROBAR')).resolves.toHaveProperty('codigo');
  });

  test('eliminarIntegrantesPropuesta', async () => {
    mockConnection.query.mockResolvedValue([[]]);
    await expect(repo.eliminarIntegrantesPropuesta(mockConnection, 1)).resolves.toBeUndefined();
  });

  test('insertarCategoriaPropuesta', async () => {
    mockConnection.query.mockResolvedValue([[]]);
    await expect(repo.insertarCategoriaPropuesta(mockConnection, 1, 1)).resolves.toBeUndefined();
  });

  test('eliminarCategoriasPropuesta', async () => {
    mockConnection.query.mockResolvedValue([[]]);
    await expect(repo.eliminarCategoriasPropuesta(mockConnection, 1)).resolves.toBeUndefined();
  });
});