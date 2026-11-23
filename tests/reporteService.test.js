import { jest } from '@jest/globals';

const mockPgcService = {
  obtenerInformeAvanceGeneral: jest.fn(),
  obtenerInformeAvancePorCiclos: jest.fn()
};
jest.unstable_mockModule('../src/services/pgcService.js', () => mockPgcService);

const reporteService = await import('../src/services/reporteService.js');

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

describe('reporteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generarInformeAvanceGeneralPdf', () => {
    test('genera un PDF (buffer no vacío) con los totales', async () => {
      mockPgcService.obtenerInformeAvanceGeneral.mockResolvedValue(totalesDePrueba);

      const buffer = await reporteService.generarInformeAvanceGeneralPdf();

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
      // Encabezado %PDF- identifica un PDF válido
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    test('propaga el error si el service de datos falla', async () => {
      mockPgcService.obtenerInformeAvanceGeneral.mockRejectedValue(new Error('fallo de bd'));

      await expect(reporteService.generarInformeAvanceGeneralPdf()).rejects.toThrow('fallo de bd');
    });
  });

  describe('generarInformeAvancePorCiclosPdf', () => {
    test('genera un PDF válido con varios ciclos', async () => {
      mockPgcService.obtenerInformeAvancePorCiclos.mockResolvedValue(porCicloDePrueba);

      const buffer = await reporteService.generarInformeAvancePorCiclosPdf();

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    test('genera un PDF válido aunque no haya ciclos', async () => {
      mockPgcService.obtenerInformeAvancePorCiclos.mockResolvedValue([]);

      const buffer = await reporteService.generarInformeAvancePorCiclosPdf();

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    test('propaga el error si el service de datos falla', async () => {
      mockPgcService.obtenerInformeAvancePorCiclos.mockRejectedValue(new Error('fallo de bd'));

      await expect(reporteService.generarInformeAvancePorCiclosPdf()).rejects.toThrow('fallo de bd');
    });
  });
});
