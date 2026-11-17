import { jest } from '@jest/globals';

// Mock del bucket de Firebase (se debe crear ANTES del mock)
const mockFile = {
  save: jest.fn().mockResolvedValue(true),
  delete: jest.fn().mockResolvedValue(true),
  getSignedUrl: jest.fn().mockResolvedValue(['https://fake-url.com']),
};
const mockBucket = { file: jest.fn(() => mockFile) };

const mockPgcArchivoRepo = {
  buscarPgcPorId: jest.fn(),
  buscarIdStudentPorUsuario: jest.fn(),
  esIntegranteDePropuesta: jest.fn(),
  crear: jest.fn(),
  buscarPorId: jest.fn(),
  listarPorPgc: jest.fn(),
  actualizarTextos: jest.fn(),
  actualizar: jest.fn(),
  eliminar: jest.fn(),
};

jest.unstable_mockModule('../src/config/firebaseConfig.js', () => ({ default: mockBucket }));
jest.unstable_mockModule('../src/repositories/pgcArchivoRepository.js', () => mockPgcArchivoRepo);
jest.unstable_mockModule('../src/validators/ciclosValidator.js', () => ({
  estaDentroDeLaEtapa: jest.fn(),
  STAGES: { REGISTRO_PGC: 'Registro PGC' },
}));
jest.unstable_mockModule('../src/validators/archivoPgcValidator.js', () => ({
  FORMATOS_PERMITIDOS: { 'application/pdf': 'pdf' },
}));

const pgcArchivoService = await import('../src/services/pgcArchivoService.js');
const pgcArchivoRepository = mockPgcArchivoRepo;
const ciclosValidator = await import('../src/validators/ciclosValidator.js');
const bucket = mockBucket;

const pgcDB = { id_pgc: 1, id_proposal: 1, id_cycle: 1 };
const archivoDB = {
  id_pgc_file: 1, id_pgc: 1, title_file: 'Doc', desc_file: 'Desc', storage_path: 'pgc/1/1/1/x.pdf',
};
const archivoFE = { id_file: 1, title_file: 'Doc', desc_file: 'Desc', url_file: { url: 'https://fake-url.com', expira_en_segundos: 3600 } };
const archivoFile = { originalname: 'test.pdf', mimetype: 'application/pdf', buffer: Buffer.from('x') };

describe('pgcArchivoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bucket.file = jest.fn(() => mockFile);
    mockFile.save.mockResolvedValue(true);
    mockFile.delete.mockResolvedValue(true);
    mockFile.getSignedUrl.mockResolvedValue(['https://fake-url.com']);
    ciclosValidator.estaDentroDeLaEtapa.mockResolvedValue(true);
  });

  describe('subirArchivo', () => {
    test('sube archivo correctamente', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(5);
      pgcArchivoRepository.esIntegranteDePropuesta.mockResolvedValue(true);
      pgcArchivoRepository.crear.mockResolvedValue(1);
      pgcArchivoRepository.buscarPorId.mockResolvedValue(archivoDB);

      await expect(pgcArchivoService.subirArchivo(1, 2, archivoFile, { title_file: 'Doc', desc_file: 'Desc' }))
        .resolves.toEqual(archivoFE);
    });

    test('lanza 404 si el PGC no existe', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(null);
      await expect(pgcArchivoService.subirArchivo(1, 2, archivoFile, {}))
        .rejects.toMatchObject({ status: 404 });
    });

    test('lanza 403 si el usuario no es estudiante', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(null);
      await expect(pgcArchivoService.subirArchivo(1, 2, archivoFile, {}))
        .rejects.toMatchObject({ status: 403 });
    });

    test('lanza 403 si no es integrante', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(5);
      pgcArchivoRepository.esIntegranteDePropuesta.mockResolvedValue(false);
      await expect(pgcArchivoService.subirArchivo(1, 2, archivoFile, {}))
        .rejects.toMatchObject({ status: 403 });
    });

    test('lanza 400 si está fuera de la ventana', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(5);
      pgcArchivoRepository.esIntegranteDePropuesta.mockResolvedValue(true);
      ciclosValidator.estaDentroDeLaEtapa.mockResolvedValue(false);
      await expect(pgcArchivoService.subirArchivo(1, 2, archivoFile, {}))
        .rejects.toMatchObject({ status: 400 });
    });
  });

  describe('listarArchivos', () => {
    test('lista archivos mapeados', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(5);
      pgcArchivoRepository.esIntegranteDePropuesta.mockResolvedValue(true);
      pgcArchivoRepository.listarPorPgc.mockResolvedValue([archivoDB]);
      await expect(pgcArchivoService.listarArchivos(1, 2)).resolves.toEqual([archivoFE]);
    });

    test('lanza 403 si no es integrante', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(5);
      pgcArchivoRepository.esIntegranteDePropuesta.mockResolvedValue(false);
      await expect(pgcArchivoService.listarArchivos(1, 2)).rejects.toMatchObject({ status: 403 });
    });
  });

  test('listarArchivosParaFicha: lista sin verificar pertenencia', async () => {
    pgcArchivoRepository.listarPorPgc.mockResolvedValue([archivoDB]);
    await expect(pgcArchivoService.listarArchivosParaFicha(1)).resolves.toEqual([archivoFE]);
  });

  describe('reemplazarArchivo', () => {
    test('solo actualiza textos si no hay archivo nuevo', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(5);
      pgcArchivoRepository.esIntegranteDePropuesta.mockResolvedValue(true);
      pgcArchivoRepository.buscarPorId.mockResolvedValue(archivoDB);
      pgcArchivoRepository.actualizarTextos.mockResolvedValue(true);

      await expect(pgcArchivoService.reemplazarArchivo(1, 1, 2, null, { title_file: 'T', desc_file: 'D' }))
        .resolves.toBeDefined();
    });

    test('lanza 404 si el archivo no existe', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(5);
      pgcArchivoRepository.esIntegranteDePropuesta.mockResolvedValue(true);
      pgcArchivoRepository.buscarPorId.mockResolvedValue(null);
      await expect(pgcArchivoService.reemplazarArchivo(1, 1, 2, null, {}))
        .rejects.toMatchObject({ status: 404 });
    });

    test('lanza 404 si el archivo pertenece a otro pgc', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(5);
      pgcArchivoRepository.esIntegranteDePropuesta.mockResolvedValue(true);
      pgcArchivoRepository.buscarPorId.mockResolvedValue({ ...archivoDB, id_pgc: 99 });
      await expect(pgcArchivoService.reemplazarArchivo(1, 1, 2, null, {}))
        .rejects.toMatchObject({ status: 404 });
    });

    test('reemplaza con archivo nuevo y borra el viejo', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(5);
      pgcArchivoRepository.esIntegranteDePropuesta.mockResolvedValue(true);
      pgcArchivoRepository.buscarPorId.mockResolvedValue(archivoDB);
      pgcArchivoRepository.actualizar.mockResolvedValue(true);

      await pgcArchivoService.reemplazarArchivo(1, 1, 2, archivoFile, { title_file: 'T', desc_file: 'D' });
      expect(mockFile.save).toHaveBeenCalled();
      expect(pgcArchivoRepository.actualizar).toHaveBeenCalled();
    });
  });

  describe('eliminarArchivo', () => {
    test('elimina archivo de BD y Firebase', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(5);
      pgcArchivoRepository.esIntegranteDePropuesta.mockResolvedValue(true);
      pgcArchivoRepository.buscarPorId.mockResolvedValue(archivoDB);
      pgcArchivoRepository.eliminar.mockResolvedValue(true);

      await pgcArchivoService.eliminarArchivo(1, 1, 2);
      expect(pgcArchivoRepository.eliminar).toHaveBeenCalledWith(1);
    });

    test('lanza 404 si el archivo no existe', async () => {
      pgcArchivoRepository.buscarPgcPorId.mockResolvedValue(pgcDB);
      pgcArchivoRepository.buscarIdStudentPorUsuario.mockResolvedValue(5);
      pgcArchivoRepository.esIntegranteDePropuesta.mockResolvedValue(true);
      pgcArchivoRepository.buscarPorId.mockResolvedValue(null);
      await expect(pgcArchivoService.eliminarArchivo(1, 1, 2)).rejects.toMatchObject({ status: 404 });
    });
  });
});