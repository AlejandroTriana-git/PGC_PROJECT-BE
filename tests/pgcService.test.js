import { jest } from '@jest/globals';
import './helpers/mocks.js';

const mockPgcRepo = {
  crearPgc: jest.fn(),
  buscarPgc: jest.fn(),
  buscarPgcPorId: jest.fn(),
  listarPropuestasAprobadasSinPgc: jest.fn(),
  listarPgcPorUsuario: jest.fn(),
  buscarCategoriasPropuesta: jest.fn(),
  buscarIntegrantesPropuesta: jest.fn(),
  buscarCategoriasDeVariasPropuestas: jest.fn(),
  listarPgcPendientesDeCalificar: jest.fn(),
  esJuradoDelCiclo: jest.fn(),
  yaCalificoPgc: jest.fn(),
  crearCalificacion: jest.fn(),
  contarJuradosDelCiclo: jest.fn(),
  contarCalificacionesDelPgc: jest.fn(),
  marcarPgcComoTerminado: jest.fn(),
  esDelEquipo: jest.fn(),
  listarComentariosDelPgc: jest.fn(),
  calcularPromedioPgc: jest.fn(),
  buscarCalificacionDeJurado: jest.fn(),
  listarPgcCalificadosPorJurado: jest.fn(),
  existePgcParaPropuesta: jest.fn(),
  obtenerConteosPorCiclo: jest.fn(),
};
jest.unstable_mockModule('../src/repositories/pgcRepository.js', () => mockPgcRepo);

const mockPropuestaRepo = { 
  buscarPropuestaPorId: jest.fn(), 
  buscarEstudiantePorId: jest.fn() 
};
jest.unstable_mockModule('../src/repositories/propuestaRepository.js', () => mockPropuestaRepo);

const mockCiclosValidator = {
  estaDentroDeLaEtapa: jest.fn(),
  STAGES: { REGISTRO_PGC: 'Registro PGC', CALIFICACION: 'Calificacion' },
  encontrarFechasEtapas: jest.fn(),
};
jest.unstable_mockModule('../src/validators/ciclosValidator.js', () => mockCiclosValidator);

jest.unstable_mockModule('../src/validators/busquedaPgcValidator.js', () => ({ RESULTADOS_POR_PAGINA: 10 }));
jest.unstable_mockModule('../src/services/pgcArchivoService.js', () => ({ listarArchivosParaFicha: jest.fn().mockResolvedValue([]) }));

const pgcService = await import('../src/services/pgcService.js');

describe('pgcService Completo', () => {
  beforeEach(() => {
    // 🔑 resetAllMocks limpia implementaciones (mockResolvedValue) y llamadas
    jest.resetAllMocks(); 
    mockCiclosValidator.estaDentroDeLaEtapa.mockResolvedValue(true);
  });

  describe('listarPropuestasAprobadasSinPgc', () => {
    test('retorna lista', async () => {
      mockPgcRepo.listarPropuestasAprobadasSinPgc.mockResolvedValue([{ id: 1 }]);
      await expect(pgcService.listarPropuestasAprobadasSinPgc(1)).resolves.toHaveLength(1);
    });
  });

  describe('crearPgc', () => {
    const propuesta = { id_proposal: 1, state_proposal: 'Aprobada', id_leader: 5, id_cycle: 1 };
    const lider = { id_student: 5 };

    test('crea correctamente', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuesta);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPgcRepo.existePgcParaPropuesta.mockResolvedValue(false);
      mockPgcRepo.crearPgc.mockResolvedValue({ id_pgc: 1, codigo: 1 }); 

      await expect(pgcService.crearPgc(1, 5)).resolves.toBeDefined();
    });

    test('lanza 404 si propuesta no existe', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(null);
      await expect(pgcService.crearPgc(1, 5)).rejects.toBeDefined();
    });

    test('lanza 400 si no está aprobada', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue({ ...propuesta, state_proposal: 'Pendiente' });
      await expect(pgcService.crearPgc(1, 5)).rejects.toBeDefined();
    });

    test('lanza 403 si no es líder', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuesta);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue({ id_student: 99 });
      await expect(pgcService.crearPgc(1, 99)).rejects.toBeDefined();
    });

    test('lanza 400 si ya existe PGC', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuesta);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPgcRepo.existePgcParaPropuesta.mockResolvedValue(true);
      await expect(pgcService.crearPgc(1, 5)).rejects.toBeDefined();
    });

    test('lanza 400 si está fuera de fecha', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuesta);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPgcRepo.existePgcParaPropuesta.mockResolvedValue(false);
      mockCiclosValidator.estaDentroDeLaEtapa.mockResolvedValue(false);
      await expect(pgcService.crearPgc(1, 5)).rejects.toBeDefined();
    });
  });

  describe('obtenerPgcPorId', () => {
    test('retorna ficha', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue({ pgc: { id_pgc: 1 }, categorias: [], integrantes: [] });
      await expect(pgcService.obtenerPgcPorId(1)).resolves.toBeDefined();
    });
    test('lanza 404', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue({ pgc: null });
      await expect(pgcService.obtenerPgcPorId(1)).rejects.toBeDefined();
    });
  });

  describe('buscarPgc', () => {
    test('retorna resultados', async () => {
      mockPgcRepo.buscarPgc.mockResolvedValue({ codigo: 1, filas: [], total: 0, categorias: [] });
      await expect(pgcService.buscarPgc({ pagina: 1 })).resolves.toHaveProperty('resultados');
    });
  });

  describe('listarPgcPendientesDeCalificar', () => {
    test('filtra por ventana de fechas', async () => {
      mockPgcRepo.listarPgcPendientesDeCalificar.mockResolvedValue([{ id_pgc: 1 }]);
      mockCiclosValidator.estaDentroDeLaEtapa.mockResolvedValue(true);
      await expect(pgcService.listarPgcPendientesDeCalificar(1)).resolves.toHaveLength(1);
    });
  });

  describe('calificarPgc', () => {
    const data = { grade: 4.5, comment: 'ok' };
    test('califica y auto-transiciona', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue({ pgc: { id_pgc: 1, id_cycle: 1 } });
      mockPgcRepo.esJuradoDelCiclo.mockResolvedValue(true);
      mockPgcRepo.yaCalificoPgc.mockResolvedValue(false);
      mockPgcRepo.crearCalificacion.mockResolvedValue(1);
      mockPgcRepo.contarJuradosDelCiclo.mockResolvedValue(2);
      mockPgcRepo.contarCalificacionesDelPgc.mockResolvedValue(2);
      await expect(pgcService.calificarPgc(1, 1, data)).resolves.toBeDefined();
      expect(mockPgcRepo.marcarPgcComoTerminado).toHaveBeenCalled();
    });
  });

  describe('obtenerCalificaciones', () => {
    test('retorna vista de equipo', async () => {
      mockPgcRepo.buscarPgcPorId.mockResolvedValue({ pgc: { id_pgc: 1, id_cycle: 1 } });
      mockPgcRepo.esDelEquipo.mockResolvedValue(true);
      mockPgcRepo.listarComentariosDelPgc.mockResolvedValue([]);
      mockPgcRepo.calcularPromedioPgc.mockResolvedValue(4.5);
      await expect(pgcService.obtenerCalificaciones(1, 1)).resolves.toBeDefined();
    });
  });

  describe('obtenerInformeAvanceGeneral', () => {
    test('suma los conteos de todos los ciclos en un solo totalizado', async () => {
      mockPgcRepo.obtenerConteosPorCiclo.mockResolvedValue([
        { id_cycle: 1, name_cycle: 'Fundamentación', total_propuestas: 3, pendientes: 1, aprobadas: 1, rechazadas: 1, anuladas: 0, pgc_registrados: 1, en_proceso: 0, terminados: 1 },
        { id_cycle: 2, name_cycle: 'Profundización', total_propuestas: 2, pendientes: 0, aprobadas: 2, rechazadas: 0, anuladas: 0, pgc_registrados: 2, en_proceso: 1, terminados: 1 }
      ]);

      const totales = await pgcService.obtenerInformeAvanceGeneral();

      expect(totales).toEqual({
        total_propuestas: 5,
        pendientes: 1,
        aprobadas: 3,
        rechazadas: 1,
        anuladas: 0,
        pgc_registrados: 3,
        en_proceso: 1,
        terminados: 2
      });
    });

    test('devuelve todo en 0 si no hay ciclos', async () => {
      mockPgcRepo.obtenerConteosPorCiclo.mockResolvedValue([]);
      await expect(pgcService.obtenerInformeAvanceGeneral()).resolves.toEqual({
        total_propuestas: 0,
        pendientes: 0,
        aprobadas: 0,
        rechazadas: 0,
        anuladas: 0,
        pgc_registrados: 0,
        en_proceso: 0,
        terminados: 0
      });
    });
  });

  describe('obtenerInformeAvancePorCiclos', () => {
    test('devuelve el conteo separado ciclo por ciclo', async () => {
      const porCiclo = [{ id_cycle: 1, name_cycle: 'Fundamentación', total_propuestas: 3 }];
      mockPgcRepo.obtenerConteosPorCiclo.mockResolvedValue(porCiclo);
      await expect(pgcService.obtenerInformeAvancePorCiclos()).resolves.toEqual(porCiclo);
    });
  });
});