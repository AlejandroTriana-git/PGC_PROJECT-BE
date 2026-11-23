import { jest } from '@jest/globals';

const mockMailConfig = {
  brevoApiKey: 'test-api-key',
  senderEmail: 'remitente@test.com',
  senderName: 'PGC Test',
};
jest.unstable_mockModule('../src/config/mailConfig.js', () => ({ default: mockMailConfig }));

const correoService = await import('../src/services/correoService.js');

describe('correoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMailConfig.brevoApiKey = 'test-api-key';
    mockMailConfig.senderEmail = 'remitente@test.com';
    mockMailConfig.senderName = 'PGC Test';
    global.fetch = jest.fn();
  });

  describe('enviarCorreoPropuestaAprobada', () => {
    test('envía el correo con los datos del líder', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const resultado = await correoService.enviarCorreoPropuestaAprobada({
        mail_user: 'lider@test.com',
        full_name: 'Lider Test',
        title_proposal: 'Mi propuesta',
      });

      expect(resultado).toEqual({ enviado: true });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, opciones] = global.fetch.mock.calls[0];
      expect(url).toBe('https://api.brevo.com/v3/smtp/email');
      const cuerpo = JSON.parse(opciones.body);
      expect(cuerpo.to).toEqual([{ email: 'lider@test.com' }]);
      expect(cuerpo.subject).toMatch(/aprobada/i);
      expect(cuerpo.htmlContent).toContain('Mi propuesta');
    });

    test('no intenta enviar si no hay datos', async () => {
      const resultado = await correoService.enviarCorreoPropuestaAprobada(null);
      expect(resultado).toEqual({ enviado: false, motivo: 'sin_datos' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('no intenta enviar si no hay destinatario', async () => {
      const resultado = await correoService.enviarCorreoPropuestaAprobada({ full_name: 'X', title_proposal: 'Y' });
      expect(resultado).toEqual({ enviado: false, motivo: 'sin_destinatario' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('no intenta enviar si falta BREVO_API_KEY', async () => {
      mockMailConfig.brevoApiKey = undefined;

      const resultado = await correoService.enviarCorreoPropuestaAprobada({
        mail_user: 'lider@test.com', full_name: 'L', title_proposal: 'T',
      });

      expect(resultado).toEqual({ enviado: false, motivo: 'sin_api_key' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('no intenta enviar si falta MAIL_SENDER', async () => {
      mockMailConfig.senderEmail = undefined;

      const resultado = await correoService.enviarCorreoPropuestaAprobada({
        mail_user: 'lider@test.com', full_name: 'L', title_proposal: 'T',
      });

      expect(resultado).toEqual({ enviado: false, motivo: 'sin_remitente' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('no relanza el error si Brevo responde con error (best-effort)', async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 401, text: async () => 'unauthorized' });

      const resultado = await correoService.enviarCorreoPropuestaAprobada({
        mail_user: 'lider@test.com', full_name: 'L', title_proposal: 'T',
      });

      expect(resultado.enviado).toBe(false);
      expect(resultado.motivo).toMatch(/Brevo HTTP 401/);
    });

    test('no relanza el error si fetch falla (red caída)', async () => {
      global.fetch.mockRejectedValue(new Error('fetch failed'));

      const resultado = await correoService.enviarCorreoPropuestaAprobada({
        mail_user: 'lider@test.com', full_name: 'L', title_proposal: 'T',
      });

      expect(resultado).toEqual({ enviado: false, motivo: 'fetch failed' });
    });
  });

  describe('enviarCorreoPropuestaRechazada', () => {
    test('usa el asunto de "rechazada" si no llegó al tercer rechazo', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      await correoService.enviarCorreoPropuestaRechazada(
        { mail_user: 'lider@test.com', full_name: 'L', title_proposal: 'T' },
        'Corrige el alcance',
        1
      );

      const [, opciones] = global.fetch.mock.calls[0];
      const cuerpo = JSON.parse(opciones.body);
      expect(cuerpo.subject).toMatch(/rechazada/i);
      expect(cuerpo.htmlContent).toContain('Corrige el alcance');
    });

    test('usa el asunto de "anulada" al llegar al tercer rechazo', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      await correoService.enviarCorreoPropuestaRechazada(
        { mail_user: 'lider@test.com', full_name: 'L', title_proposal: 'T' },
        'Comentario final',
        3
      );

      const [, opciones] = global.fetch.mock.calls[0];
      const cuerpo = JSON.parse(opciones.body);
      expect(cuerpo.subject).toMatch(/anulada/i);
    });

    test('no intenta enviar si no hay datos', async () => {
      const resultado = await correoService.enviarCorreoPropuestaRechazada(null, 'x', 1);
      expect(resultado).toEqual({ enviado: false, motivo: 'sin_datos' });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});