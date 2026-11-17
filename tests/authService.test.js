import { jest } from '@jest/globals';
import { randomBytes } from 'node:crypto';

//aca se prepara el entorno y se simulan los repositorios y bcrypt (no se usa BD real)
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.JWT_EXPIRES_IN = '2h';

const encontrarPorEmail = jest.fn();
const agregarTokenListaNegra = jest.fn();
const encontrarAsignacionesPorId = jest.fn();
const comparar = jest.fn();

jest.unstable_mockModule('../src/repositories/authRepository.js', () => ({ encontrarPorEmail, agregarTokenListaNegra }));
jest.unstable_mockModule('../src/repositories/asignacionesRepository.js', () => ({ encontrarAsignacionesPorId }));
jest.unstable_mockModule('bcryptjs', () => ({ default: { compare: comparar } }));

const { login, logout } = await import('../src/services/authService.js');

//esta funcion devuelve los datos de entrada del login con una clave generada al azar
const datosLogin = () => ({ correo: 'persona@example.com', contrasena: randomBytes(8).toString('hex') });

describe('authService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('login lanza 404 si el correo no existe', async () => {
    encontrarPorEmail.mockResolvedValue(null);
    await expect(login(datosLogin())).rejects.toMatchObject({ status: 404 });
  });

  test('login lanza 401 si la clave no coincide', async () => {
    encontrarPorEmail.mockResolvedValue({ password_user: 'hash' });
    comparar.mockResolvedValue(false);
    await expect(login(datosLogin())).rejects.toMatchObject({ status: 401 });
  });

  test('login exitoso devuelve token y deja id_cycle en null si no viene', async () => {
    encontrarPorEmail.mockResolvedValue({ id_user: 1, mail_user: 'a@example.com', name_role: 'Profesor', full_name: 'Ana', password_user: 'hash' });
    comparar.mockResolvedValue(true);
    encontrarAsignacionesPorId.mockResolvedValue({ encargado_de: [1], jurado_de: [] });

    const r = await login(datosLogin());
    expect(r.token).toBeDefined();
    expect(r.id_cycle).toBeNull();
    expect(r.encargado_de).toEqual([1]);
  });

  test('logout usa el exp del token cuando viene', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const r = await logout({ id: 1, exp }, 'tok');
    expect(agregarTokenListaNegra).toHaveBeenCalledWith(1, 'tok', new Date(exp * 1000));
    expect(r.mensaje).toMatch(/cerrada/i);
  });

  test('logout deja 1 dia por defecto si no viene exp', async () => {
    await logout({ id: 2 }, 'tok');
    const fecha = agregarTokenListaNegra.mock.calls[0][2];
    expect(fecha.getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
  });
});
