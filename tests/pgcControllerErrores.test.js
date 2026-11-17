import { jest } from '@jest/globals';

//aca se simula el servicio y el validador para probar solo los caminos de error del controlador
const servicio = {};
const NOMBRES = ['listarPropuestasAprobadasSinPgc', 'crearPgc', 'listarMisPgc', 'buscarPgc', 'obtenerPgcPorId',
  'listarPgcPendientesDeCalificar', 'calificarPgc', 'obtenerCalificaciones', 'listarPgcCalificadosPorJurado'];
for (const n of NOMBRES) servicio[n] = jest.fn();
const validarBusquedaPgc = jest.fn();

jest.unstable_mockModule('../src/services/pgcService.js', () => servicio);
jest.unstable_mockModule('../src/validators/busquedaPgcValidator.js', () => ({
  validarBusquedaPgc,
  normalizarFiltrosBusquedaPgc: jest.fn().mockReturnValue({}),
}));

const controlador = await import('../src/controllers/pgcController.js');

//esta funcion arma una respuesta falsa encadenable
const crearRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

//cada fila: funcion del controlador, funcion del servicio que usa
const CASOS = [
  ['listarPropuestasAprobadasSinPgc', 'listarPropuestasAprobadasSinPgc'],
  ['crearPgc', 'crearPgc'],
  ['listarMisPgc', 'listarMisPgc'],
  ['obtenerPgc', 'obtenerPgcPorId'],
  ['listarPgcPendientesDeCalificar', 'listarPgcPendientesDeCalificar'],
  ['calificarPgc', 'calificarPgc'],
  ['obtenerCalificaciones', 'obtenerCalificaciones'],
  ['listarPgcCalificadosPorJurado', 'listarPgcCalificadosPorJurado'],
];

describe('pgcController: manejo de errores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test.each(CASOS)('%s responde con el status del error controlado', async (fn, srv) => {
    servicio[srv].mockRejectedValue({ status: 418, mensaje: 'controlado' });
    const res = crearRes();
    await controlador[fn]({ usuario: { id: 1 }, body: { id_proposal: 1 }, params: {}, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'controlado' }));
  });

  test.each(CASOS)('%s responde 500 ante un error inesperado', async (fn, srv) => {
    servicio[srv].mockRejectedValue(new Error('falla interna'));
    const res = crearRes();
    await controlador[fn]({ usuario: { id: 1 }, body: { id_proposal: 1 }, params: {}, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error interno del servidor' });
  });

  test('crearPgc incluye las fechas cuando el error las trae', async () => {
    servicio.crearPgc.mockRejectedValue({ status: 400, mensaje: 'x', fecha_inicio_registro_pgc: 'a', fecha_fin_registro_pgc: 'b' });
    const res = crearRes();
    await controlador.crearPgc({ usuario: { id: 1 }, body: { id_proposal: 1 } }, res);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'x', fecha_inicio_registro_pgc: 'a', fecha_fin_registro_pgc: 'b' });
  });

  describe('buscarPgc', () => {
    test('400 si el validador devuelve errores', async () => {
      validarBusquedaPgc.mockReturnValue(['uno', 'dos']);
      const res = crearRes();
      await controlador.buscarPgc({ query: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'uno. dos' });
    });

    test('muestra el mensaje de un error controlado', async () => {
      validarBusquedaPgc.mockReturnValue([]);
      servicio.buscarPgc.mockRejectedValue({ status: 422, mensaje: 'controlado' });
      const res = crearRes();
      await controlador.buscarPgc({ query: {} }, res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'controlado' });
    });

    test('esconde el detalle de un error de la base de datos', async () => {
      validarBusquedaPgc.mockReturnValue([]);
      servicio.buscarPgc.mockRejectedValue(new Error('detalle sql'));
      const res = crearRes();
      await controlador.buscarPgc({ query: {} }, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error interno del servidor' });
    });
  });
});
