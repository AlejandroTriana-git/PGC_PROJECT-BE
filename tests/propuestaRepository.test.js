import { jest } from '@jest/globals';

const mockDb = { query: jest.fn() };
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockDb }));

const repo = await import('../src/repositories/propuestaRepository.js');

const rows = (data) => [data, []];
const insertResult = (id) => [{ insertId: id, affectedRows: 1 }, []];

describe('propuestaRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crearPropuesta: retorna insertId', async () => {
    mockDb.query.mockResolvedValue(insertResult(1));
    await expect(repo.crearPropuesta(mockDb, { title_proposal: 'T' })).resolves.toBe(1);
  });

  test('insertarIntegrante', async () => {
    mockDb.query.mockResolvedValue(insertResult(1));
    // ✅ CAMBIO: esperar undefined porque la función no retorna nada
    await expect(repo.insertarIntegrante(mockDb, 1, 5)).resolves.toBeUndefined();
  });

  test('insertarCategoriaPropuesta', async () => {
    mockDb.query.mockResolvedValue(insertResult(1));
    // ✅ CAMBIO: esperar undefined
    await expect(repo.insertarCategoriaPropuesta(mockDb, 1, 10)).resolves.toBeUndefined();
  });

  test('eliminarCategoriasPropuesta', async () => {
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }, []]);
    await expect(repo.eliminarCategoriasPropuesta(mockDb, 1)).resolves.toBeUndefined();
  });

  test('eliminarIntegrantesPropuesta', async () => {
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }, []]);
    await expect(repo.eliminarIntegrantesPropuesta(mockDb, 1)).resolves.toBeUndefined();
  });

  test('buscarCategoriasDePropuesta', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_category: 1 }]));
    await expect(repo.buscarCategoriasDePropuesta(1)).resolves.toHaveLength(1);
  });

  test('buscarIntegrantesDePropuesta', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_user: 5 }]));
    await expect(repo.buscarIntegrantesDePropuesta(1)).resolves.toHaveLength(1);
  });

  test('buscarPropuestaPorId', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_proposal: 1 }]));
    await expect(repo.buscarPropuestaPorId(1)).resolves.toEqual({ id_proposal: 1 });
  });

  test('buscarPropuestaPorEstudiante', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_proposal: 1 }]));
    await expect(repo.buscarPropuestaPorEstudiante(5)).resolves.toEqual({ id_proposal: 1 });
  });

  test('buscarPropuestaActiva: true/false', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_proposal: 1 }]));
    await expect(repo.buscarPropuestaActiva(5, 1)).resolves.toEqual({ id_proposal: 1 });
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.buscarPropuestaActiva(5, 1)).resolves.toBeUndefined();
  });

  test('buscarEstudiantePorId', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_student: 5 }]));
    await expect(repo.buscarEstudiantePorId(1)).resolves.toEqual({ id_student: 5 });
  });

  test('buscarCicloPorId', async () => {
    mockDb.query.mockResolvedValue(rows([{ id_cycle: 1 }]));
    await expect(repo.buscarCicloPorId(1)).resolves.toEqual({ id_cycle: 1 });
  });

  test('listarPorCicloYEstado', async () => {
    mockDb.query.mockResolvedValue(rows([{ id: 1 }]));
    await expect(repo.listarPorCicloYEstado(1, 'Pendiente')).resolves.toHaveLength(1);
  });

  test('aprobar', async () => {
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }, []]);
    await expect(repo.aprobar(1, 10)).resolves.toBeUndefined();
  });

  test('rechazar', async () => {
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }, []]);
    await expect(repo.rechazar(1, { rejection_comment: 'x' })).resolves.toBeUndefined();
  });

  test('reenviarPropuesta', async () => {
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }, []]);
    await expect(repo.reenviarPropuesta(mockDb, 1, {})).resolves.toBeUndefined();
  });

  test('esMiembroDePropuesta: true/false', async () => {
    mockDb.query.mockResolvedValue(rows([{ c: 1 }]));
    await expect(repo.esMiembroDePropuesta(1, 5)).resolves.toBe(true);
    mockDb.query.mockResolvedValue(rows([]));
    await expect(repo.esMiembroDePropuesta(1, 5)).resolves.toBe(false);
  });
});