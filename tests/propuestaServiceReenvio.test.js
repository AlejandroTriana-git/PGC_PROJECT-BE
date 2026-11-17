import { jest } from '@jest/globals';
import { mockDb, mockConnection } from './helpers/mocks.js';

//aca se simulan el repositorio, el validador y firebase para probar reenviar y obtener el pdf
const repo = {};
for (const n of ['buscarPropuestaPorId', 'buscarEstudiantePorId', 'buscarCicloPorId', 'reenviarPropuesta',
  'insertarIntegrante', 'insertarCategoriaPropuesta', 'eliminarCategoriasPropuesta', 'eliminarIntegrantesPropuesta']) {
  repo[n] = jest.fn();
}
jest.unstable_mockModule('../src/repositories/propuestaRepository.js', () => repo);
jest.unstable_mockModule('../src/repositories/ciclosRepository.js', () => ({}));
jest.unstable_mockModule('../src/validators/ciclosValidator.js', () => ({
  estaDentroDeLaEtapa: jest.fn(), encontrarFechasEtapas: jest.fn(), STAGES: {},
}));

const archivo = { save: jest.fn(), delete: jest.fn(), getSignedUrl: jest.fn() };
jest.unstable_mockModule('../src/config/firebaseConfig.js', () => ({ default: { file: () => archivo } }));

const servicio = await import('../src/services/propuestaService.js');

const pdf = { mimetype: 'application/pdf', buffer: Buffer.from('x') };
const datos = () => ({
  title_proposal: 'T', descr_proposal: 'D', problem_proposal: 'P', justification_proposal: 'J',
  objectives_proposal: 'O', solution_proposal: 'S', integrantes: [2], categorias: [1],
});
const rechazada = { id_leader: 1, id_cycle: 3, state_proposal: 'Rechazada', pdf_storage_path: 'viejo.pdf' };

describe('propuestaService: reenviar y obtener pdf', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockDb.getConnection.mockResolvedValue(mockConnection);
    repo.buscarPropuestaPorId.mockResolvedValue(rechazada);
    repo.buscarEstudiantePorId.mockImplementation(async (id) => ({ id_student: id, id_cycle: 3 }));
    repo.buscarCicloPorId.mockResolvedValue({ max_members: 5 });
  });

  describe('reenviarPropuesta', () => {
    test('reenvia bien, acepta JSON en texto y borra el pdf viejo', async () => {
      const data = { ...datos(), integrantes: '[2]', categorias: '[1]' };
      const r = await servicio.reenviarPropuesta(10, data, 1, pdf);
      expect(r.mensaje).toMatch(/reenviada/i);
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(archivo.delete).toHaveBeenCalled();
    });

    test('403 si quien reenvia no es el lider', async () => {
      repo.buscarEstudiantePorId.mockResolvedValue({ id_student: 99 });
      await expect(servicio.reenviarPropuesta(10, datos(), 1, pdf)).rejects.toMatchObject({ status: 403 });
    });

    test('400 si excede el maximo de integrantes del ciclo', async () => {
      repo.buscarCicloPorId.mockResolvedValue({ max_members: 0 });
      await expect(servicio.reenviarPropuesta(10, datos(), 1, pdf)).rejects.toMatchObject({ status: 400 });
    });

    test('404 y rollback si un integrante no existe', async () => {
      repo.buscarEstudiantePorId.mockImplementation(async (id) => (id === 1 ? { id_student: 1 } : null));
      await expect(servicio.reenviarPropuesta(10, datos(), 1, pdf)).rejects.toMatchObject({ status: 404 });
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('400 si un integrante es de otro ciclo', async () => {
      repo.buscarEstudiantePorId.mockImplementation(async (id) => ({ id_student: id, id_cycle: id === 1 ? 3 : 8 }));
      await expect(servicio.reenviarPropuesta(10, datos(), 1, pdf)).rejects.toMatchObject({ status: 400 });
    });

    test('500 si falla la subida a firebase', async () => {
      archivo.save.mockRejectedValue({ code: 'x', message: 'falla' });
      await expect(servicio.reenviarPropuesta(10, datos(), 1, pdf)).rejects.toMatchObject({ status: 500 });
    });

    test('si no se puede borrar el pdf viejo no se rompe', async () => {
      archivo.delete.mockRejectedValue({ code: 'x' });
      const r = await servicio.reenviarPropuesta(10, datos(), 1, pdf);
      expect(r.mensaje).toBeDefined();
    });

    test('no intenta borrar si la propuesta no tenia pdf anterior', async () => {
      repo.buscarPropuestaPorId.mockResolvedValue({ ...rechazada, pdf_storage_path: null });
      await servicio.reenviarPropuesta(10, datos(), 1, pdf);
      expect(archivo.delete).not.toHaveBeenCalled();
    });

    test('400 si el archivo no es pdf', async () => {
      await expect(servicio.reenviarPropuesta(10, datos(), 1, { mimetype: 'image/png' })).rejects.toMatchObject({ status: 400 });
    });

    test('400 si faltan las categorias', async () => {
      await expect(servicio.reenviarPropuesta(10, { ...datos(), categorias: [] }, 1, pdf)).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('obtenerUrlPdf', () => {
    test('404 si la propuesta no existe', async () => {
      repo.buscarPropuestaPorId.mockResolvedValue(null);
      await expect(servicio.obtenerUrlPdf(1)).rejects.toMatchObject({ status: 404 });
    });

    test('404 si no tiene pdf adjunto', async () => {
      repo.buscarPropuestaPorId.mockResolvedValue({ pdf_storage_path: null });
      await expect(servicio.obtenerUrlPdf(1)).rejects.toMatchObject({ status: 404 });
    });

    test('500 si falla la url firmada', async () => {
      repo.buscarPropuestaPorId.mockResolvedValue({ pdf_storage_path: 'a.pdf' });
      archivo.getSignedUrl.mockRejectedValue({ code: 'x', message: 'falla' });
      await expect(servicio.obtenerUrlPdf(1)).rejects.toMatchObject({ status: 500 });
    });

    test('devuelve la url y su vigencia', async () => {
      repo.buscarPropuestaPorId.mockResolvedValue({ pdf_storage_path: 'a.pdf' });
      archivo.getSignedUrl.mockResolvedValue(['https://ejemplo.test/a.pdf']);
      const r = await servicio.obtenerUrlPdf(1);
      expect(r).toEqual({ url: 'https://ejemplo.test/a.pdf', expira_en_segundos: 3600 });
    });
  });
});
