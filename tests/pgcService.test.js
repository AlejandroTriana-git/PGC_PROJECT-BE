import { jest } from '@jest/globals';

// ---------- Mocks ----------
const mockDb = { getConnection: jest.fn() };

const mockPgcRepo = {
  listarPropuestasAprobadasSinPgc: jest.fn(),
  existePgcParaPropuesta: jest.fn(),
  crearPgc: jest.fn(),
  listarPgcPorUsuario: jest.fn(),
  buscarPgcPorId: jest.fn(),
  buscarCategoriasPropuesta: jest.fn(),
  buscarIntegrantesPropuesta: jest.fn(),
  contarPgcBuscados: jest.fn(),
  buscarPgcPaginados: jest.fn(),
  buscarCategoriasDeVariasPropuestas: jest.fn(),
  listarPgcPendientesDeCalificar: jest.fn(),
  esJuradoDelCiclo: jest.fn(),
  yaCalificoPgc: jest.fn(),
  crearCalificacion: jest.fn(),
  contarJuradosDelCiclo: jest.fn(),
  contarCalificacionesDelPgc: jest.fn(),
  marcarPgcComoTerminado: jest.fn(),
  esDelEquipo: jest.fn(),
  listarCalificacionesDelPgc: jest.fn(),
  calcularPromedioPgc: jest.fn(),
  buscarCalificacionDeJurado: jest.fn(),
  listarPgcCalificadosPorJurado: jest.fn(),
};

const mockPropuestaRepo = {
  buscarPropuestaPorId: jest.fn(),
  buscarEstudiantePorId: jest.fn(),
};

const mockCiclosValidator = {
  estaDentroDeLaEtapa: jest.fn(),
  STAGES: {
    REGISTRO_PGC: 'Registro PGC',
    CALIFICACION: 'Calificación',
  },
  encontrarFechasEtapas: jest.fn(),
};

const mockBusquedaValidator = {
  RESULTADOS_POR_PAGINA: 10,
};

const mockPgcArchivoService = {
  listarArchivosParaFicha: jest.fn(),
};

jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockDb }));
jest.unstable_mockModule('../src/repositories/pgcRepository.js', () => mockPgcRepo);
jest.unstable_mockModule('../src/repositories/propuestaRepository.js', () => mockPropuestaRepo);
jest.unstable_mockModule('../src/validators/ciclosValidator.js', () => mockCiclosValidator);
jest.unstable_mockModule('../src/validators/busquedaPgcValidator.js', () => mockBusquedaValidator);
jest.unstable_mockModule('../src/services/pgcArchivoService.js', () => mockPgcArchivoService);

const pgcService = await import('../src/services/pgcService.js');

// ---------- Datos base ----------
const pgcBase = {
  id_pgc: 1,
  id_proposal: 1,
  id_cycle: 1,
  id_pgc_previous: null,
  title_proposal: 'T',
  problem_proposal: 'P',
  justification_proposal: 'J',
  objectives_proposal: 'O',
  solution_proposal: 'S',
  name_cycle: '2024',
  state_pgc: 'En progreso',
};

describe('pgcService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCiclosValidator.estaDentroDeLaEtapa.mockResolvedValue(true);
    mockCiclosValidator.encontrarFechasEtapas.mockResolvedValue({
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      fechaInicio: '2024-01-01',
      fechaFin: '2024-12-31',
    });
    mockBusquedaValidator.RESULTADOS_POR_PAGINA = 10;
  });

  // ---------- listarPropuestasAprobadasSinPgc ----------
  describe('listarPropuestasAprobadasSinPgc', () => {
    test('retorna propuestas del repo', async () => {
      mockPgcRepo.listarPropuestasAprobadasSinPgc.mockResolvedValue([{ id: 1 }]);
      await expect(pgcService.listarPropuestasAprobadasSinPgc(5)).resolves.toEqual([{ id: 1 }]);
    });
  });

  // ---------- crearPgc ----------
  describe('crearPgc', () => {
    const propuesta = { id_proposal: 1, state_proposal: 'Aprobada', id_leader: 5, id_cycle: 1 };
    const lider = { id_student: 5 };

    test('crea el PGC correctamente', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuesta);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPgcRepo.existePgcParaPropuesta.mockResolvedValue(false);
      mockPgcRepo.crearPgc.mockResolvedValue(1);

      const res = await pgcService.crearPgc(1, 5);
      expect(res).toEqual({ id_pgc: 1, mensaje: 'PGC registrado exitosamente' });
    });

    test('lanza 404 si la propuesta no existe', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(null);
      await expect(pgcService.crearPgc(1, 5)).rejects.toMatchObject({ status: 404 });
    });

    test('lanza 400 si la propuesta no está aprobada', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue({ ...propuesta, state_proposal: 'Pendiente' });
      await expect(pgcService.crearPgc(1, 5)).rejects.toMatchObject({ status: 400 });
    });

    test('lanza 403 si no es el líder', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuesta);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue({ id_student: 99 });
      await expect(pgcService.crearPgc(1, 99)).rejects.toMatchObject({ status: 403 });
    });

    test('lanza 403 si el usuario no es estudiante', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuesta);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(null);
      await expect(pgcService.crearPgc(1, 5)).rejects.toMatchObject({ status: 403 });
    });

    test('lanza 400 si ya existe un PGC para la propuesta', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuesta);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPgcRepo.existePgcParaPropuesta.mockResolvedValue(true);
      await expect(pgcService.crearPgc(1, 5)).rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si está fuera de la ventana de Registro PGC', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuesta);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPgcRepo.existePgcParaPropuesta.mockResolvedValue(false);
      mockCiclosValidator.estaDentroDeLaEtapa.mockResolvedValue(false);

      await expect(pgcService.crearPgc(1, 5)).rejects.toMatchObject({
        status: 400,
        mensaje: 'Fuera del rango de fechas',
      });
    });

    test('lanza 400 fuera de fecha sin fechas (fechas null)', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuesta);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPgcRepo.existePgcParaPropuesta.mockResolvedValue(false);
      mockCiclosValidator.estaDentroDeLaEtapa.mockResolvedValue(false);
      mockCiclosValidator.encontrarFechasEtapas.mockResolvedValue(null);

      await expect(pgcService.crearPgc(1, 5)).rejects.toMatchObject({ status: 400 });
    });
  });

  // ---------- listarMisPgc ----------
  describe('listarMisPgc', () => {
    test('retorna los PGC del usuario', async () => {
      mockPgcRepo.listarPgcPorUsuario.mockResolvedValue([{ id_pgc: 1 }]);
      await expect(pgcService.listarMisPgc(5)).resolves.toEqual([{ id_pgc: 1 }]);
    });
  });

  // ---------- obtenerPgcPorId ----------
  describe('obtenerPgcPorId', () => {
    test('retorna la ficha completa', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.buscarCategoriasPropuesta.mockResolvedValue([{ id_category: 1 }]);
      mockPgcRepo.buscarIntegrantesPropuesta.mockResolvedValue([{ id_user: 5 }]);
      mockPgcArchivoService.listarArchivosParaFicha.mockResolvedValue([{ id_file: 1 }]);

      const res = await pgcService.obtenerPgcPorId(1);
      expect(res.id_pgc).toBe(1);
      expect(res.categorias).toHaveLength(1);
      expect(res.integrantes).toHaveLength(1);
      expect(res.archivos).toHaveLength(1);
      expect(res.estado).toBe('En progreso');
    });

    test('lanza 404 si el PGC no existe', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(null);
      await expect(pgcService.obtenerPgcPorId(999)).rejects.toMatchObject({ status: 404 });
    });
  });

  // ---------- buscarPgc ----------
  describe('buscarPgc', () => {
    const filtros = { pagina: 1 };

    test('retorna resultados paginados con categorías agrupadas', async () => {
      mockPgcRepo.contarPgcBuscados.mockResolvedValue(25);
      mockPgcRepo.buscarPgcPaginados.mockResolvedValue([
        { id_pgc: 1, id_proposal: 1, title_proposal: 'T', name_cycle: '2024', state_pgc: 'En progreso' },
        { id_pgc: 2, id_proposal: 2, title_proposal: 'T2', name_cycle: '2024', state_pgc: 'Terminado' },
      ]);
      mockPgcRepo.buscarCategoriasDeVariasPropuestas.mockResolvedValue([
        { id_proposal: 1, id_category: 10, name_category: 'A' },
        { id_proposal: 1, id_category: 11, name_category: 'B' },
      ]);

      const res = await pgcService.buscarPgc(filtros);
      expect(res.total_resultados).toBe(25);
      expect(res.total_paginas).toBe(3); // ceil(25/10)
      expect(res.resultados).toHaveLength(2);
      expect(res.resultados[0].categorias).toHaveLength(2);
      expect(res.resultados[1].categorias).toEqual([]);
    });

    test('retorna sin resultados', async () => {
      mockPgcRepo.contarPgcBuscados.mockResolvedValue(0);
      mockPgcRepo.buscarPgcPaginados.mockResolvedValue([]);
      mockPgcRepo.buscarCategoriasDeVariasPropuestas.mockResolvedValue([]);

      const res = await pgcService.buscarPgc(filtros);
      expect(res.resultados).toEqual([]);
      expect(res.total_paginas).toBe(0);
    });
  });

  // ---------- listarPgcPendientesDeCalificar ----------
  describe('listarPgcPendientesDeCalificar', () => {
    test('retorna [] si no hay pendientes', async () => {
      mockPgcRepo.listarPgcPendientesDeCalificar.mockResolvedValue([]);
      await expect(pgcService.listarPgcPendientesDeCalificar(5)).resolves.toEqual([]);
    });

    test('filtra solo los PGC dentro de la ventana de Calificación', async () => {
      mockPgcRepo.listarPgcPendientesDeCalificar.mockResolvedValue([
        { id_pgc: 1, id_cycle: 1 },
        { id_pgc: 2, id_cycle: 2 },
      ]);
      mockCiclosValidator.estaDentroDeLaEtapa
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const res = await pgcService.listarPgcPendientesDeCalificar(5);
      expect(res).toHaveLength(1);
      expect(res[0].id_pgc).toBe(1);
    });
  });

  // ---------- calificarPgc ----------
  describe('calificarPgc', () => {
    const data = { grade: 4.5, comment: 'Bien' };

    test('califica correctamente y auto-transiciona si todos calificaron', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(true);
      mockPgcRepo.yaCalificoPgc.mockResolvedValue(false);
      mockPgcRepo.crearCalificacion.mockResolvedValue(99);
      mockPgcRepo.contarJuradosDelCiclo.mockResolvedValue(2);
      mockPgcRepo.contarCalificacionesDelPgc.mockResolvedValue(2);
      mockPgcRepo.marcarPgcComoTerminado.mockResolvedValue(true);

      const res = await pgcService.calificarPgc(1, 20, data);
      expect(res.id_jury_grade).toBe(99);
      expect(mockPgcRepo.marcarPgcComoTerminado).toHaveBeenCalledWith(1);
    });

    test('califica pero no termina si faltan jurados', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(true);
      mockPgcRepo.yaCalificoPgc.mockResolvedValue(false);
      mockPgcRepo.crearCalificacion.mockResolvedValue(99);
      mockPgcRepo.contarJuradosDelCiclo.mockResolvedValue(3);
      mockPgcRepo.contarCalificacionesDelPgc.mockResolvedValue(1);

      await pgcService.calificarPgc(1, 20, data);
      expect(mockPgcRepo.marcarPgcComoTerminado).not.toHaveBeenCalled();
    });

    test('lanza 400 si falta grade', async () => {
      await expect(pgcService.calificarPgc(1, 20, { comment: 'x' }))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si falta comment', async () => {
      await expect(pgcService.calificarPgc(1, 20, { grade: 4 }))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si grade es NaN', async () => {
      await expect(pgcService.calificarPgc(1, 20, { grade: 'abc', comment: 'x' }))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si grade > 5', async () => {
      await expect(pgcService.calificarPgc(1, 20, { grade: 6, comment: 'x' }))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si grade < 0', async () => {
      await expect(pgcService.calificarPgc(1, 20, { grade: -1, comment: 'x' }))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 404 si el PGC no existe', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(null);
      await expect(pgcService.calificarPgc(999, 20, data))
        .rejects.toMatchObject({ status: 404 });
    });

    test('lanza 403 si no es jurado del ciclo', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(false);
      await expect(pgcService.calificarPgc(1, 20, data))
        .rejects.toMatchObject({ status: 403 });
    });

    test('lanza 400 si está fuera de la ventana de Calificación (con fechas)', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(true);
      mockCiclosValidator.estaDentroDeLaEtapa.mockResolvedValue(false);

      await expect(pgcService.calificarPgc(1, 20, data))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 fuera de ventana sin fechas (fechas null)', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(true);
      mockCiclosValidator.estaDentroDeLaEtapa.mockResolvedValue(false);
      mockCiclosValidator.encontrarFechasEtapas.mockResolvedValue(null);

      await expect(pgcService.calificarPgc(1, 20, data))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si ya calificó antes', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(true);
      mockPgcRepo.yaCalificoPgc.mockResolvedValue(true);
      await expect(pgcService.calificarPgc(1, 20, data))
        .rejects.toMatchObject({ status: 400 });
    });
  });

  // ---------- obtenerCalificaciones ----------
  describe('obtenerCalificaciones', () => {
    test('devuelve vista de equipo con promedio', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.esDelEquipo.mockResolvedValue(true);
      mockPgcRepo.listarCalificacionesDelPgc.mockResolvedValue([{ grade: 4 }, { grade: 5 }]);
      mockPgcRepo.calcularPromedioPgc.mockResolvedValue(4.5);

      const res = await pgcService.obtenerCalificaciones(1, 5);
      expect(res.nota_global).toBe(4.5);
      expect(res.calificaciones).toHaveLength(2);
    });

    test('devuelve vista de equipo con promedio null', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.esDelEquipo.mockResolvedValue(true);
      mockPgcRepo.listarCalificacionesDelPgc.mockResolvedValue([]);
      mockPgcRepo.calcularPromedioPgc.mockResolvedValue(null);

      const res = await pgcService.obtenerCalificaciones(1, 5);
      expect(res.nota_global).toBeNull();
    });

    test('devuelve vista de jurado con su calificación', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.esDelEquipo.mockResolvedValue(false);
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(true);
      mockPgcRepo.buscarCalificacionDeJurado.mockResolvedValue({ grade: 4 });

      const res = await pgcService.obtenerCalificaciones(1, 20);
      expect(res.mi_calificacion).toEqual({ grade: 4 });
    });

    test('devuelve vista de jurado con mi_calificacion null', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.esDelEquipo.mockResolvedValue(false);
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(true);
      mockPgcRepo.buscarCalificacionDeJurado.mockResolvedValue(null);

      const res = await pgcService.obtenerCalificaciones(1, 20);
      expect(res.mi_calificacion).toBeNull();
    });

    test('lanza 404 si el PGC no existe', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(null);
      await expect(pgcService.obtenerCalificaciones(999, 5))
        .rejects.toMatchObject({ status: 404 });
    });

    test('lanza 403 si no es equipo ni jurado', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue(pgcBase);
      mockPgcRepo.esDelEquipo.mockResolvedValue(false);
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(false);
      await expect(pgcService.obtenerCalificaciones(1, 99))
        .rejects.toMatchObject({ status: 403 });
    });
  });

  // ---------- listarPgcCalificadosPorJurado ----------
  describe('listarPgcCalificadosPorJurado', () => {
    test('retorna los PGC calificados', async () => {
      mockPgcRepo.listarPgcCalificadosPorJurado.mockResolvedValue([{ id_pgc: 1 }]);
      await expect(pgcService.listarPgcCalificadosPorJurado(20))
        .resolves.toEqual([{ id_pgc: 1 }]);
    });
  });
});