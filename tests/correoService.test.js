import { jest } from '@jest/globals';

const mockTransportador = { sendMail: jest.fn() };
jest.unstable_mockModule('../src/config/mailConfig.js', () => ({ default: mockTransportador }));

const correoService = await import('../src/services/correoService.js');

describe('correoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enviarCorreoPropuestaAprobada', () => {
    test('envía el correo con los datos del líder', async () => {
      mockTransportador.sendMail.mockResolvedValue({});

      const resultado = await correoService.enviarCorreoPropuestaAprobada({
        mail_user: 'lider@test.com',
        full_name: 'Lider Test',
        title_proposal: 'Mi propuesta',
      });

      expect(resultado).toEqual({ enviado: true });
      expect(mockTransportador.sendMail).toHaveBeenCalledTimes(1);
      const correoEnviado = mockTransportador.sendMail.mock.calls[0][0];
      expect(correoEnviado.to).toBe('lider@test.com');
      expect(correoEnviado.subject).toMatch(/aprobada/i);
      expect(correoEnviado.html).toContain('Mi propuesta');
    });

    test('no intenta enviar si no hay datos', async () => {
      const resultado = await correoService.enviarCorreoPropuestaAprobada(null);
      expect(resultado).toEqual({ enviado: false, motivo: 'sin_datos' });
      expect(mockTransportador.sendMail).not.toHaveBeenCalled();
    });

    test('no intenta enviar si no hay destinatario', async () => {
      const resultado = await correoService.enviarCorreoPropuestaAprobada({ full_name: 'X', title_proposal: 'Y' });
      expect(resultado).toEqual({ enviado: false, motivo: 'sin_destinatario' });
      expect(mockTransportador.sendMail).not.toHaveBeenCalled();
    });

    test('no relanza el error si falla el envío (best-effort)', async () => {
      mockTransportador.sendMail.mockRejectedValue(new Error('SMTP caído'));

      const resultado = await correoService.enviarCorreoPropuestaAprobada({
        mail_user: 'lider@test.com', full_name: 'L', title_proposal: 'T'
      });

      expect(resultado).toEqual({ enviado: false, motivo: 'SMTP caído' });
    });
  });

  describe('enviarCorreoPropuestaRechazada', () => {
    test('usa el asunto de "rechazada" si no llegó al tercer rechazo', async () => {
      mockTransportador.sendMail.mockResolvedValue({});

      await correoService.enviarCorreoPropuestaRechazada(
        { mail_user: 'lider@test.com', full_name: 'L', title_proposal: 'T' },
        'Corrige el alcance',
        1
      );

      const correoEnviado = mockTransportador.sendMail.mock.calls[0][0];
      expect(correoEnviado.subject).toMatch(/rechazada/i);
      expect(correoEnviado.html).toContain('Corrige el alcance');
    });

    test('usa el asunto de "anulada" al llegar al tercer rechazo', async () => {
      mockTransportador.sendMail.mockResolvedValue({});

      await correoService.enviarCorreoPropuestaRechazada(
        { mail_user: 'lider@test.com', full_name: 'L', title_proposal: 'T' },
        'Comentario final',
        3
      );

      const correoEnviado = mockTransportador.sendMail.mock.calls[0][0];
      expect(correoEnviado.subject).toMatch(/anulada/i);
    });

    test('no intenta enviar si no hay datos', async () => {
      const resultado = await correoService.enviarCorreoPropuestaRechazada(null, 'x', 1);
      expect(resultado).toEqual({ enviado: false, motivo: 'sin_datos' });
      expect(mockTransportador.sendMail).not.toHaveBeenCalled();
    });
  });
});
