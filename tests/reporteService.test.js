import { jest } from '@jest/globals';

const totalesDePrueba = {
  total_propuestas: 10,
  pendientes: 2,
  aprobadas: 5,
  rechazadas: 1,
  anuladas: 2,
  pgc_registrados: 4,
  en_proceso: 1,
  terminados: 3
};

const porCicloDePrueba = [
  { id_cycle: 1, name_cycle: 'Fundamentación', ...totalesDePrueba },
  { id_cycle: 2, name_cycle: 'Profundización', ...totalesDePrueba }
];

// PNG 1x1 válido, para que doc.image() no lo rechace en los tests que sí tienen logo
const PNG_DE_PRUEBA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR4XmNkaHD4z8DAwMAEIkAAABnoAcMusR76AAAAAElFTkSuQmCC',
  'base64'
);
const respuestaFetchConLogo = () => ({
  ok: true,
  arrayBuffer: async () => PNG_DE_PRUEBA.buffer.slice(PNG_DE_PRUEBA.byteOffset, PNG_DE_PRUEBA.byteOffset + PNG_DE_PRUEBA.byteLength)
});

// Cada test necesita su propia copia del modulo porque reporteService cachea el logo
// descargado en una variable interna (logoEnCache) — resetModules() evita que un test
// contamine al siguiente.
const cargarReporteService = async () => {
  jest.resetModules();
  const mockPgcService = {
    obtenerInformeAvanceGeneral: jest.fn().mockResolvedValue(totalesDePrueba),
    obtenerInformeAvancePorCiclos: jest.fn().mockResolvedValue(porCicloDePrueba)
  };
  jest.unstable_mockModule('../src/services/pgcService.js', () => mockPgcService);
  const reporteService = await import('../src/services/reporteService.js');
  return { reporteService, mockPgcService };
};

describe('reporteService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('generarInformeAvanceGeneralPdf', () => {
    test('genera un PDF (buffer no vacío) con los totales, con logo', async () => {
      global.fetch = jest.fn().mockResolvedValue(respuestaFetchConLogo());
      const { reporteService } = await cargarReporteService();

      const buffer = await reporteService.generarInformeAvanceGeneralPdf();

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
      // Encabezado %PDF- identifica un PDF válido
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('genera el PDF igual si no se pudo descargar el logo', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('sin internet'));
      const { reporteService } = await cargarReporteService();

      const buffer = await reporteService.generarInformeAvanceGeneralPdf();

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    test('propaga el error si el service de datos falla', async () => {
      global.fetch = jest.fn().mockResolvedValue(respuestaFetchConLogo());
      const { reporteService, mockPgcService } = await cargarReporteService();
      mockPgcService.obtenerInformeAvanceGeneral.mockRejectedValue(new Error('fallo de bd'));

      await expect(reporteService.generarInformeAvanceGeneralPdf()).rejects.toThrow('fallo de bd');
    });
  });

  describe('generarInformeAvancePorCiclosPdf', () => {
    test('genera un PDF válido con varios ciclos', async () => {
      global.fetch = jest.fn().mockResolvedValue(respuestaFetchConLogo());
      const { reporteService } = await cargarReporteService();

      const buffer = await reporteService.generarInformeAvancePorCiclosPdf();

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    test('genera un PDF válido aunque no haya ciclos', async () => {
      global.fetch = jest.fn().mockResolvedValue(respuestaFetchConLogo());
      const { reporteService, mockPgcService } = await cargarReporteService();
      mockPgcService.obtenerInformeAvancePorCiclos.mockResolvedValue([]);

      const buffer = await reporteService.generarInformeAvancePorCiclosPdf();

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    test('propaga el error si el service de datos falla', async () => {
      global.fetch = jest.fn().mockResolvedValue(respuestaFetchConLogo());
      const { reporteService, mockPgcService } = await cargarReporteService();
      mockPgcService.obtenerInformeAvancePorCiclos.mockRejectedValue(new Error('fallo de bd'));

      await expect(reporteService.generarInformeAvancePorCiclosPdf()).rejects.toThrow('fallo de bd');
    });
  });
});