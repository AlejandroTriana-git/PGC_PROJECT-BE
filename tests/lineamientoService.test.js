import { jest } from '@jest/globals';
import { mockDb, mockConnection } from './helpers/mocks.js';

const mockRepo = {
  crear: jest.fn(),
  obtenerVigentes: jest.fn(),
  obtenerHistorial: jest.fn(),
  obtenerTituloExistente: jest.fn(),
  existeVersion: jest.fn(),
};
jest.unstable_mockModule('../src/repositories/lineamientoRepository.js', () => mockRepo);

const mockFileObj = { save: jest.fn(), delete: jest.fn(), getSignedUrl: jest.fn().mockResolvedValue(['url']) };
jest.unstable_mockModule('../src/config/firebaseConfig.js', () => ({ default: { file: jest.fn(() => mockFileObj) } }));

const service = await import('../src/services/lineamientoService.js');

describe('lineamientoService Completo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getConnection.mockResolvedValue(mockConnection);
  });

  describe('listarVigentes', () => {
    test('retorna lista con URLs', async () => {
      mockRepo.obtenerVigentes.mockResolvedValue([{ id_guideline_document: 1, storage_path: 'p' }]);
      const res = await service.listarVigentes();
      expect(res[0].url).toBe('url');
    });

    test('maneja error si falla la URL', async () => {
      mockRepo.obtenerVigentes.mockResolvedValue([{ id_guideline_document: 1, storage_path: 'p' }]);
      mockFileObj.getSignedUrl.mockRejectedValueOnce(new Error('Fallo URL'));
      const res = await service.listarVigentes();
      expect(res[0].url).toBeNull();
    });
  });

  describe('obtenerHistorial', () => {
    test('lanza error si falta el título', async () => {
      await expect(service.obtenerHistorial('')).rejects.toThrow('El título del documento es obligatorio');
    });
    test('retorna historial', async () => {
      mockRepo.obtenerHistorial.mockResolvedValue([{ id: 1 }]);
      await expect(service.obtenerHistorial('T')).resolves.toHaveLength(1);
    });
  });

  describe('crearLineamiento', () => {
    const file = { mimetype: 'application/pdf', buffer: Buffer.from('x') };
    const data = { title_file: 'T', version_label: '1.0', desc_file: 'D' };

    test('lanza error si no hay archivo', async () => {
      await expect(service.crearLineamiento(data, 1, null)).rejects.toThrow('El archivo PDF es obligatorio');
    });

    test('lanza error si no es PDF', async () => {
      await expect(service.crearLineamiento(data, 1, { mimetype: 'image/png' })).rejects.toThrow('El archivo debe ser PDF');
    });

    test('lanza error si versión es inválida', async () => {
      await expect(service.crearLineamiento({ ...data, version_label: 'abc' }, 1, file)).rejects.toThrow('La versión debe ser un número');
    });

    test('lanza error si falta título', async () => {
      await expect(service.crearLineamiento({ ...data, title_file: '' }, 1, file)).rejects.toThrow('El title_file es obligatorio');
    });

    test('lanza error si título es muy largo', async () => {
      await expect(service.crearLineamiento({ ...data, title_file: 'a'.repeat(151) }, 1, file)).rejects.toThrow('no puede superar los 150 caracteres');
    });

    test('lanza error si ya existe la versión', async () => {
      mockRepo.obtenerTituloExistente.mockResolvedValue('T');
      mockRepo.existeVersion.mockResolvedValue(true);
      await expect(service.crearLineamiento(data, 1, file)).rejects.toThrow('Ya existe una versión con ese label');
    });

    test('lanza error si falla subida a Firebase', async () => {
      mockRepo.obtenerTituloExistente.mockResolvedValue(null);
      mockRepo.existeVersion.mockResolvedValue(false);
      mockFileObj.save.mockRejectedValueOnce(new Error('Fallo Firebase'));
      await expect(service.crearLineamiento(data, 1, file)).rejects.toThrow('Error al subir el PDF');
    });

    test('lanza error y borra archivo si falla la BD', async () => {
      mockRepo.obtenerTituloExistente.mockResolvedValue(null);
      mockRepo.existeVersion.mockResolvedValue(false);
      mockFileObj.save.mockResolvedValue(true);
      mockRepo.crear.mockRejectedValueOnce(new Error('Fallo BD'));
      await expect(service.crearLineamiento(data, 1, file)).rejects.toThrow('Fallo BD');
      expect(mockFileObj.delete).toHaveBeenCalled();
    });

    test('crea exitosamente', async () => {
      mockRepo.obtenerTituloExistente.mockResolvedValue(null);
      mockRepo.existeVersion.mockResolvedValue(false);
      mockFileObj.save.mockResolvedValue(true);
      mockRepo.crear.mockResolvedValue(1);
      await expect(service.crearLineamiento(data, 1, file)).resolves.toBeUndefined();
    });
  });
});