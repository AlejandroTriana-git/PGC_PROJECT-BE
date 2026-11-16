import * as archivoPgcValidator from '../src/validators/archivoPgcValidator.js';
import * as busquedaPgcValidator from '../src/validators/busquedaPgcValidator.js';
import * as ciclosValidator from '../src/validators/ciclosValidator.js';
import * as loginValidator from '../src/validators/loginValidator.js';
import * as propuestasValidator from '../src/validators/propuestasValidator.js';

describe('validators', () => {
  // ---------- archivoPgcValidator ----------
  describe('archivoPgcValidator', () => {
    test('exporta constantes esperadas', () => {
      expect(archivoPgcValidator.FORMATOS_PERMITIDOS).toBeDefined();
      expect(archivoPgcValidator.MAX_DESCRIPCION_BYTES).toBeDefined();
      expect(archivoPgcValidator.MAX_TITULO_ARCHIVO).toBeDefined();
      expect(archivoPgcValidator.TAMANO_MAXIMO_BYTES).toBeDefined();
    });

    test('FORMATOS_PERMITIDOS incluye pdf', () => {
      expect(archivoPgcValidator.FORMATOS_PERMITIDOS).toHaveProperty('application/pdf');
    });

    describe('normalizarDatosArchivoPgc', () => {
      const fn = archivoPgcValidator.normalizarDatosArchivoPgc;

      test('normaliza title_file y desc_file (trim)', () => {
        const res = fn({ title_file: '  Hola  ', desc_file: '  Mundo  ' });
        expect(res.title_file).toBe('Hola');
        expect(res.desc_file).toBe('Mundo');
      });

      test('maneja campos vacíos', () => {
        const res = fn({ title_file: '', desc_file: '' });
        expect(res.title_file).toBeDefined();
        expect(res.desc_file).toBeDefined();
      });
    });

    describe('validarDatosArchivoPgc', () => {
      const fn = archivoPgcValidator.validarDatosArchivoPgc;

      test('acepta datos válidos', () => {
        const data = { title_file: 'Titulo', desc_file: 'Descripcion' };
        expect(() => fn(data)).not.toThrow();
      });
    });
  });

  // ---------- busquedaPgcValidator ----------
  describe('busquedaPgcValidator', () => {
    test('exporta RESULTADOS_POR_PAGINA numérico', () => {
      expect(typeof busquedaPgcValidator.RESULTADOS_POR_PAGINA).toBe('number');
      expect(busquedaPgcValidator.RESULTADOS_POR_PAGINA).toBeGreaterThan(0);
    });
  });

  // ---------- ciclosValidator ----------
  describe('ciclosValidator', () => {
    test('exporta STAGES con las 4 etapas', () => {
      expect(ciclosValidator.STAGES).toBeDefined();
      expect(ciclosValidator.STAGES).toEqual(expect.objectContaining({
        RADICACION: expect.any(String),
        REGISTRO_PGC: expect.any(String),
        SUSTENTACION: expect.any(String),
        CALIFICACION: expect.any(String),
      }));
    });

    test('estaDentroDeLaEtapa es función y retorna boolean', async () => {
      expect(typeof ciclosValidator.estaDentroDeLaEtapa).toBe('function');
      const res = await ciclosValidator.estaDentroDeLaEtapa(999999, 'Radicación');
      expect(typeof res).toBe('boolean');
    });

    test('encontrarFechasEtapas es función', () => {
      expect(typeof ciclosValidator.encontrarFechasEtapas).toBe('function');
    });
  });

  // ---------- loginValidator ----------
  describe('loginValidator', () => {
    test('el módulo se importa sin errores', () => {
      expect(loginValidator).toBeDefined();
    });
  });

  // ---------- propuestasValidator ----------
  describe('propuestasValidator', () => {
    const fn = propuestasValidator.validarRechazo;

    test('validarRechazo es función', () => {
      expect(typeof fn).toBe('function');
    });

    test('acepta comentario válido', () => {
      expect(() => fn('Comentario válido')).not.toThrow();
    });

    test('rechaza comentario undefined', () => {
      expect(() => fn(undefined)).toThrow();
    });

    test('rechaza comentario null', () => {
      expect(() => fn(null)).toThrow();
    });
  });
});