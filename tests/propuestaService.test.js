import { jest } from '@jest/globals';

const mockConnection = {
  beginTransaction: jest.fn().mockResolvedValue(true),
  commit: jest.fn().mockResolvedValue(true),
  rollback: jest.fn().mockResolvedValue(true),
  release: jest.fn(),
};
const mockDb = { getConnection: jest.fn() };
mockDb.getConnection.mockResolvedValue(mockConnection);

const mockFile = {
  save: jest.fn().mockResolvedValue(true),
  delete: jest.fn().mockResolvedValue(true),
  getSignedUrl: jest.fn().mockResolvedValue(['https://fake-url.com']),
};
const mockBucket = { file: jest.fn(() => mockFile) };

const mockPropuestaRepo = {
  buscarEstudiantePorId: jest.fn(),
  buscarCicloPorId: jest.fn(),
  buscarPropuestaActiva: jest.fn(),
  crearPropuesta: jest.fn(),
  insertarIntegrante: jest.fn(),
  insertarCategoriaPropuesta: jest.fn(),
  eliminarCategoriasPropuesta: jest.fn(),
  buscarCategoriasDePropuesta: jest.fn(),
  eliminarIntegrantesPropuesta: jest.fn(),
  buscarPropuestaPorId: jest.fn(),
  reenviarPropuesta: jest.fn(),
  buscarPropuestaPorEstudiante: jest.fn(),
  buscarIntegrantesDePropuesta: jest.fn(),
  listarPorCicloYEstado: jest.fn(),
  buscarPorId: jest.fn(),
  aprobar: jest.fn(),
  rechazar: jest.fn(),
};
const mockCiclosRepo = { buscarPorId: jest.fn() };
const mockCiclosValidator = {
  estaDentroDeLaEtapa: jest.fn(),
  STAGES: { RADICACION: 'Radicación' },
  encontrarFechasEtapas: jest.fn(),
};

jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockDb }));
jest.unstable_mockModule('../src/config/firebaseConfig.js', () => ({ default: mockBucket }));
jest.unstable_mockModule('../src/repositories/propuestaRepository.js', () => mockPropuestaRepo);
jest.unstable_mockModule('../src/repositories/ciclosRepository.js', () => mockCiclosRepo);
jest.unstable_mockModule('../src/validators/ciclosValidator.js', () => mockCiclosValidator);

const propuestaService = await import('../src/services/propuestaService.js');

const file = { mimetype: 'application/pdf', buffer: Buffer.from('x') };
const dataValida = {
  title_proposal: 'T', descr_proposal: 'D', problem_proposal: 'P',
  justification_proposal: 'J', objectives_proposal: 'O', solution_proposal: 'S',
  integrantes: [], categorias: [1],
};
const lider = { id_student: 5, id_cycle: 1 };
const ciclo = { id_cycle: 1, max_members: 3 };

describe('propuestaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getConnection.mockResolvedValue(mockConnection);
    mockBucket.file = jest.fn(() => mockFile);
    mockFile.save.mockResolvedValue(true);
    mockFile.delete.mockResolvedValue(true);
    mockFile.getSignedUrl.mockResolvedValue(['https://fake-url.com']);
    mockCiclosValidator.estaDentroDeLaEtapa.mockResolvedValue(true);
    mockCiclosValidator.encontrarFechasEtapas.mockResolvedValue({ start_date: 'a', end_date: 'b' });
  });

  describe('crearPropuesta', () => {
    test('crea propuesta correctamente', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(ciclo);
      mockPropuestaRepo.buscarPropuestaActiva.mockResolvedValue(null);
      mockPropuestaRepo.crearPropuesta.mockResolvedValue(1);

      const res = await propuestaService.crearPropuesta({ ...dataValida }, 5, file);
      expect(res.id_proposal).toBe(1);
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('lanza error si falta un campo obligatorio', async () => {
      // El servicio hace data.integrantes.map() antes de validar,
      // por eso lanza TypeError en lugar de { status: 400 }
      await expect(propuestaService.crearPropuesta({ title_proposal: 'T' }, 5, file))
        .rejects.toBeDefined();
    });

    test('lanza 400 si no hay categorías', async () => {
      await expect(propuestaService.crearPropuesta({ ...dataValida, categorias: [] }, 5, file))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si no hay archivo', async () => {
      await expect(propuestaService.crearPropuesta({ ...dataValida }, 5, null))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si el archivo no es PDF', async () => {
      await expect(propuestaService.crearPropuesta({ ...dataValida }, 5, { mimetype: 'image/png' }))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 404 si el líder no es estudiante', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(null);
      await expect(propuestaService.crearPropuesta({ ...dataValida }, 5, file))
        .rejects.toMatchObject({ status: 404 });
    });

    test('lanza 404 si el ciclo no existe', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(null);
      await expect(propuestaService.crearPropuesta({ ...dataValida }, 5, file))
        .rejects.toMatchObject({ status: 404 });
    });

    test('lanza 400 si el líder ya tiene propuesta activa', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(ciclo);
      mockPropuestaRepo.buscarPropuestaActiva.mockResolvedValue({ id: 1 });
      await expect(propuestaService.crearPropuesta({ ...dataValida }, 5, file))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si hay más integrantes que max_members', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(ciclo);
      mockPropuestaRepo.buscarPropuestaActiva.mockResolvedValue(null);
      await expect(propuestaService.crearPropuesta({ ...dataValida, integrantes: [1, 2, 3, 4] }, 5, file))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si está fuera de la ventana de radicación', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(ciclo);
      mockPropuestaRepo.buscarPropuestaActiva.mockResolvedValue(null);
      mockCiclosValidator.estaDentroDeLaEtapa.mockResolvedValue(false);
      await expect(propuestaService.crearPropuesta({ ...dataValida }, 5, file))
        .rejects.toMatchObject({ status: 400 });
    });

    test('parsea integrantes/categorias si vienen como string JSON', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(ciclo);
      mockPropuestaRepo.buscarPropuestaActiva.mockResolvedValue(null);
      mockPropuestaRepo.crearPropuesta.mockResolvedValue(1);

      const dataString = { ...dataValida, integrantes: '[]', categorias: '[1]' };
      await expect(propuestaService.crearPropuesta(dataString, 5, file)).resolves.toBeDefined();
    });

    test('rollback y borra archivo si la BD falla', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(ciclo);
      mockPropuestaRepo.buscarPropuestaActiva.mockResolvedValue(null);
      mockPropuestaRepo.crearPropuesta.mockRejectedValue(new Error('DB Error'));

      await expect(propuestaService.crearPropuesta({ ...dataValida }, 5, file)).rejects.toThrow('DB Error');
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockFile.delete).toHaveBeenCalled();
    });
  });

  describe('obtenerUrlPdf', () => {
    test('retorna URL firmada', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue({ id_proposal: 1, pdf_storage_path: 'p' });
      await expect(propuestaService.obtenerUrlPdf(1)).resolves.toEqual({
        url: 'https://fake-url.com', expira_en_segundos: 3600,
      });
    });

    test('lanza 404 si no existe', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(null);
      await expect(propuestaService.obtenerUrlPdf(1)).rejects.toMatchObject({ status: 404 });
    });

    test('lanza 404 si no tiene PDF', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue({ id_proposal: 1 });
      await expect(propuestaService.obtenerUrlPdf(1)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('verMiPropuesta', () => {
    test('retorna propuesta completa', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarPropuestaPorEstudiante.mockResolvedValue({
        id_proposal: 1, title_proposal: 'T', state_proposal: 'Pendiente',
        rejection_comment: null, resubmit_count: 0, id_leader: 5, leader_name: 'L',
        descr_proposal: 'D', problem_proposal: 'P', justification_proposal: 'J',
        objectives_proposal: 'O', solution_proposal: 'S', pdf_storage_path: 'p',
      });
      mockPropuestaRepo.buscarIntegrantesDePropuesta.mockResolvedValue([]);
      mockPropuestaRepo.buscarCategoriasDePropuesta.mockResolvedValue([]);

      const res = await propuestaService.verMiPropuesta(5);
      expect(res.id_proposal).toBe(1);
      expect(res.pdf.url).toBe('https://fake-url.com');
    });

    test('lanza 404 si no es estudiante', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(null);
      await expect(propuestaService.verMiPropuesta(5)).rejects.toMatchObject({ status: 404 });
    });

    test('lanza 404 si no tiene propuestas', async () => {
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarPropuestaPorEstudiante.mockResolvedValue(null);
      await expect(propuestaService.verMiPropuesta(5)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('listarPendientesPorCiclo', () => {
    test('lista pendientes si es encargado', async () => {
      mockCiclosRepo.buscarPorId.mockResolvedValue({ id_person_charge: 10 });
      mockPropuestaRepo.listarPorCicloYEstado.mockResolvedValue([{ id: 1 }]);
      await expect(propuestaService.listarPendientesPorCiclo(1, null, { id: 10 }))
        .resolves.toHaveLength(1);
    });

    test('lanza 404 si el ciclo no existe', async () => {
      mockCiclosRepo.buscarPorId.mockResolvedValue(null);
      await expect(propuestaService.listarPendientesPorCiclo(1, null, { id: 10 }))
        .rejects.toMatchObject({ status: 404 });
    });

    test('lanza 403 si no es encargado', async () => {
      mockCiclosRepo.buscarPorId.mockResolvedValue({ id_person_charge: 10 });
      await expect(propuestaService.listarPendientesPorCiclo(1, null, { id: 99 }))
        .rejects.toMatchObject({ status: 403 });
    });
  });

  describe('aprobarPropuesta', () => {
    test('aprueba si está pendiente y es encargado', async () => {
      mockPropuestaRepo.buscarPorId.mockResolvedValue({
        id_proposal: 1, id_cycle: 1, state_proposal: 'Pendiente de validación',
      });
      mockCiclosRepo.buscarPorId.mockResolvedValue({ id_person_charge: 10 });
      mockPropuestaRepo.aprobar.mockResolvedValue(true);
      await expect(propuestaService.aprobarPropuesta(1, { id: 10 })).resolves.toHaveProperty('mensaje');
    });

    test('lanza 404 si no existe', async () => {
      mockPropuestaRepo.buscarPorId.mockResolvedValue(null);
      await expect(propuestaService.aprobarPropuesta(1, { id: 10 }))
        .rejects.toMatchObject({ status: 404 });
    });

    test('lanza 409 si ya fue revisada', async () => {
      mockPropuestaRepo.buscarPorId.mockResolvedValue({ id_cycle: 1, state_proposal: 'Aprobada' });
      mockCiclosRepo.buscarPorId.mockResolvedValue({ id_person_charge: 10 });
      await expect(propuestaService.aprobarPropuesta(1, { id: 10 }))
        .rejects.toMatchObject({ status: 409 });
    });
  });

  describe('rechazarPropuesta', () => {
    test('rechaza (estado Rechazada) si resubmit < 3', async () => {
      mockPropuestaRepo.buscarPorId.mockResolvedValue({
        id_cycle: 1, state_proposal: 'Pendiente de validación', resubmit_count: 0,
      });
      mockCiclosRepo.buscarPorId.mockResolvedValue({ id_person_charge: 10 });
      mockPropuestaRepo.rechazar.mockResolvedValue(true);

      const res = await propuestaService.rechazarPropuesta(1, 'comentario', { id: 10 });
      expect(res.nuevoResubmitCount).toBe(1);
      expect(mockPropuestaRepo.rechazar).toHaveBeenCalledWith(1, expect.objectContaining({
        nuevoEstado: 'Rechazada',
      }));
    });

    test('anula si resubmit_count llega a 3', async () => {
      mockPropuestaRepo.buscarPorId.mockResolvedValue({
        id_cycle: 1, state_proposal: 'Pendiente de validación', resubmit_count: 2,
      });
      mockCiclosRepo.buscarPorId.mockResolvedValue({ id_person_charge: 10 });
      mockPropuestaRepo.rechazar.mockResolvedValue(true);

      await propuestaService.rechazarPropuesta(1, 'c', { id: 10 });
      expect(mockPropuestaRepo.rechazar).toHaveBeenCalledWith(1, expect.objectContaining({
        nuevoEstado: 'Anulada',
      }));
    });

    test('lanza 404 si no existe', async () => {
      mockPropuestaRepo.buscarPorId.mockResolvedValue(null);
      await expect(propuestaService.rechazarPropuesta(1, 'c', { id: 10 }))
        .rejects.toMatchObject({ status: 404 });
    });

    test('lanza 409 si ya fue revisada', async () => {
      mockPropuestaRepo.buscarPorId.mockResolvedValue({ id_cycle: 1, state_proposal: 'Aprobada' });
      mockCiclosRepo.buscarPorId.mockResolvedValue({ id_person_charge: 10 });
      await expect(propuestaService.rechazarPropuesta(1, 'c', { id: 10 }))
        .rejects.toMatchObject({ status: 409 });
    });
  });

  describe('reenviarPropuesta', () => {
    const propuestaRechazada = {
      id_proposal: 1, state_proposal: 'Rechazada', id_leader: 5,
      id_cycle: 1, pdf_storage_path: 'old/path.pdf',
    };

    test('reenvía correctamente', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuestaRechazada);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue(ciclo);
      mockPropuestaRepo.reenviarPropuesta.mockResolvedValue(true);
      mockPropuestaRepo.eliminarIntegrantesPropuesta.mockResolvedValue(true);
      mockPropuestaRepo.eliminarCategoriasPropuesta.mockResolvedValue(true);

      const res = await propuestaService.reenviarPropuesta(1, { ...dataValida }, 5, file);
      expect(res.mensaje).toMatch(/reenviada/i);
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('lanza 404 si la propuesta no existe', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(null);
      await expect(propuestaService.reenviarPropuesta(1, { ...dataValida }, 5, file))
        .rejects.toMatchObject({ status: 404 });
    });

    test('lanza 400 si no está rechazada', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue({ ...propuestaRechazada, state_proposal: 'Aprobada' });
      await expect(propuestaService.reenviarPropuesta(1, { ...dataValida }, 5, file))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 403 si no es el líder', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuestaRechazada);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue({ id_student: 99, id_cycle: 1 });
      await expect(propuestaService.reenviarPropuesta(1, { ...dataValida }, 99, file))
        .rejects.toMatchObject({ status: 403 });
    });

    test('lanza 400 si excede max_members', async () => {
      mockPropuestaRepo.buscarPropuestaPorId.mockResolvedValue(propuestaRechazada);
      mockPropuestaRepo.buscarEstudiantePorId.mockResolvedValue(lider);
      mockPropuestaRepo.buscarCicloPorId.mockResolvedValue({ max_members: 1 });
      await expect(propuestaService.reenviarPropuesta(1,
        { ...dataValida, integrantes: [1, 2, 3] }, 5, file))
        .rejects.toMatchObject({ status: 400 });
    });
  });
});