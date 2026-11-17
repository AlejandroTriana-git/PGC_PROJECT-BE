import { jest } from '@jest/globals';

//aca se simulan las dependencias del servicio de PGC
const repo = {};
for (const n of ['crearPgc', 'buscarPgcPorId', 'esJuradoDelCiclo', 'yaCalificoPgc', 'crearCalificacion',
  'contarJuradosDelCiclo', 'contarCalificacionesDelPgc', 'marcarPgcComoTerminado', 'esDelEquipo',
  'listarComentariosDelPgc', 'calcularPromedioPgc', 'buscarCalificacionDeJurado']) {
  repo[n] = jest.fn();
}
const buscarPropuestaPorId = jest.fn();
const estaDentroDeLaEtapa = jest.fn();
const encontrarFechasEtapas = jest.fn();
const listarArchivosParaFicha = jest.fn();

jest.unstable_mockModule('../src/repositories/pgcRepository.js', () => repo);
jest.unstable_mockModule('../src/repositories/propuestaRepository.js', () => ({ buscarPropuestaPorId }));
jest.unstable_mockModule('../src/validators/ciclosValidator.js', () => ({
  estaDentroDeLaEtapa, encontrarFechasEtapas, STAGES: { REGISTRO_PGC: 'Registro PGC', CALIFICACION: 'Calificacion' },
}));
jest.unstable_mockModule('../src/services/pgcArchivoService.js', () => ({ listarArchivosParaFicha }));

const servicio = await import('../src/services/pgcService.js');

const pgcBase = { id_pgc: 5, id_cycle: 2, id_proposal: 9, title_proposal: 'T', state_pgc: 'En curso' };

describe('pgcService ramas', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('crearPgc', () => {
    test('404 si la propuesta no existe', async () => {
      buscarPropuestaPorId.mockResolvedValue(null);
      await expect(servicio.crearPgc(1, 1)).rejects.toMatchObject({ status: 404 });
    });

    test('fuera de fecha incluye el rango habilitado', async () => {
      buscarPropuestaPorId.mockResolvedValue({ id_cycle: 2 });
      estaDentroDeLaEtapa.mockResolvedValue(false);
      encontrarFechasEtapas.mockResolvedValue({ fechaInicio: 'a', fechaFin: 'b' });
      await expect(servicio.crearPgc(1, 1)).rejects.toMatchObject({ status: 400, fecha_inicio_registro_pgc: 'a', fecha_fin_registro_pgc: 'b' });
    });

    test('fuera de fecha sin fechas configuradas no agrega rango', async () => {
      buscarPropuestaPorId.mockResolvedValue({ id_cycle: 2 });
      estaDentroDeLaEtapa.mockResolvedValue(false);
      encontrarFechasEtapas.mockResolvedValue(null);
      const error = await servicio.crearPgc(1, 1).catch((e) => e);
      expect(error.status).toBe(400);
      expect(error.fecha_inicio_registro_pgc).toBeUndefined();
    });

    test('lanza el codigo del SP cuando no es 1', async () => {
      buscarPropuestaPorId.mockResolvedValue({ id_cycle: 2 });
      estaDentroDeLaEtapa.mockResolvedValue(true);
      repo.crearPgc.mockResolvedValue({ codigo: 403, mensaje: 'no' });
      await expect(servicio.crearPgc(1, 1)).rejects.toMatchObject({ status: 403 });
    });
  });

  test('obtenerPgcPorId responde 404 si no existe', async () => {
    repo.buscarPgcPorId.mockResolvedValue({ pgc: null });
    await expect(servicio.obtenerPgcPorId(1)).rejects.toMatchObject({ status: 404 });
  });

  describe('calificarPgc', () => {
    test('400 si faltan datos', async () => {
      await expect(servicio.calificarPgc(5, 1, { grade: null, comment: 'x' })).rejects.toMatchObject({ status: 400 });
    });

    test('400 si la nota no es un numero', async () => {
      await expect(servicio.calificarPgc(5, 1, { grade: 'abc', comment: 'x' })).rejects.toMatchObject({ status: 400 });
    });

    test('400 si la nota se pasa de 5', async () => {
      await expect(servicio.calificarPgc(5, 1, { grade: 6, comment: 'x' })).rejects.toMatchObject({ status: 400 });
    });

    test('404 si el PGC no existe', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: null });
      await expect(servicio.calificarPgc(5, 1, { grade: 4, comment: 'x' })).rejects.toMatchObject({ status: 404 });
    });

    test('403 si no es jurado del ciclo', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: pgcBase });
      repo.esJuradoDelCiclo.mockResolvedValue(false);
      await expect(servicio.calificarPgc(5, 1, { grade: 4, comment: 'x' })).rejects.toMatchObject({ status: 403 });
    });

    test('400 si el PGC ya esta terminado', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: { ...pgcBase, state_pgc: 'Terminado' } });
      repo.esJuradoDelCiclo.mockResolvedValue(true);
      await expect(servicio.calificarPgc(5, 1, { grade: 4, comment: 'x' })).rejects.toMatchObject({ status: 400 });
    });

    test('fuera del periodo devuelve las fechas formateadas', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: pgcBase });
      repo.esJuradoDelCiclo.mockResolvedValue(true);
      estaDentroDeLaEtapa.mockResolvedValue(false);
      encontrarFechasEtapas.mockResolvedValue({ fechaInicio: '2026-03-05T12:00:00', fechaFin: '2026-04-10T12:00:00' });
      const error = await servicio.calificarPgc(5, 1, { grade: 4, comment: 'x' }).catch((e) => e);
      expect(error.mensaje).toContain('05/03/2026');
      expect(error.mensaje).toContain('10/04/2026');
    });

    test('fuera del periodo sin fechas configuradas deja el texto vacio', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: pgcBase });
      repo.esJuradoDelCiclo.mockResolvedValue(true);
      estaDentroDeLaEtapa.mockResolvedValue(false);
      encontrarFechasEtapas.mockResolvedValue(null);
      await expect(servicio.calificarPgc(5, 1, { grade: 4, comment: 'x' })).rejects.toMatchObject({ status: 400 });
    });

    test('400 si ya califico', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: pgcBase });
      repo.esJuradoDelCiclo.mockResolvedValue(true);
      estaDentroDeLaEtapa.mockResolvedValue(true);
      repo.yaCalificoPgc.mockResolvedValue(true);
      await expect(servicio.calificarPgc(5, 1, { grade: 4, comment: 'x' })).rejects.toMatchObject({ status: 400 });
    });

    test('califica y NO marca terminado si faltan notas', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: pgcBase });
      repo.esJuradoDelCiclo.mockResolvedValue(true);
      estaDentroDeLaEtapa.mockResolvedValue(true);
      repo.yaCalificoPgc.mockResolvedValue(false);
      repo.crearCalificacion.mockResolvedValue(7);
      repo.contarJuradosDelCiclo.mockResolvedValue(3);
      repo.contarCalificacionesDelPgc.mockResolvedValue(1);
      const r = await servicio.calificarPgc(5, 1, { grade: 4, comment: 'x' });
      expect(r.id_jury_grade).toBe(7);
      expect(repo.marcarPgcComoTerminado).not.toHaveBeenCalled();
    });
  });

  describe('obtenerCalificaciones', () => {
    test('404 si el PGC no existe', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: null });
      await expect(servicio.obtenerCalificaciones(5, 1)).rejects.toMatchObject({ status: 404 });
    });

    test('equipo sin promedio devuelve nota_global null', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: pgcBase });
      repo.esDelEquipo.mockResolvedValue(true);
      repo.listarComentariosDelPgc.mockResolvedValue([]);
      repo.calcularPromedioPgc.mockResolvedValue(null);
      const r = await servicio.obtenerCalificaciones(5, 1);
      expect(r.nota_global).toBeNull();
    });

    test('equipo con promedio lo redondea a 2 decimales', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: pgcBase });
      repo.esDelEquipo.mockResolvedValue(true);
      repo.listarComentariosDelPgc.mockResolvedValue([]);
      repo.calcularPromedioPgc.mockResolvedValue('4.3333');
      const r = await servicio.obtenerCalificaciones(5, 1);
      expect(r.nota_global).toBe(4.33);
    });

    test('jurado ve solo su calificacion', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: pgcBase });
      repo.esDelEquipo.mockResolvedValue(false);
      repo.esJuradoDelCiclo.mockResolvedValue(true);
      repo.buscarCalificacionDeJurado.mockResolvedValue(undefined);
      const r = await servicio.obtenerCalificaciones(5, 1);
      expect(r.mi_calificacion).toBeNull();
    });

    test('403 si no es equipo ni jurado', async () => {
      repo.buscarPgcPorId.mockResolvedValue({ pgc: pgcBase });
      repo.esDelEquipo.mockResolvedValue(false);
      repo.esJuradoDelCiclo.mockResolvedValue(false);
      await expect(servicio.obtenerCalificaciones(5, 1)).rejects.toMatchObject({ status: 403 });
    });
  });
});
