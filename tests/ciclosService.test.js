import { jest } from '@jest/globals';

// Factory de mocks: cada función es un jest.fn()
const mockCiclosRepo = {
  listarTodos: jest.fn(),
  buscarPorId: jest.fn(),
  crear: jest.fn(),
  actualizar: jest.fn(),
  obtenerFechas: jest.fn(),
  actualizarFechas: jest.fn(),
};
const mockUsersRepo = {
  filtrarProfesores: jest.fn(),
  listarProfesores: jest.fn(),
};
const mockAsignacionesRepo = {
  existeAsignacionJurado: jest.fn(),
  asignarJurado: jest.fn(),
  quitarJurado: jest.fn(),
  listarJuradosPorCiclo: jest.fn(),
};

// ESM: unstable_mockModule con factory
jest.unstable_mockModule('../src/repositories/ciclosRepository.js', () => mockCiclosRepo);
jest.unstable_mockModule('../src/repositories/usuariosRepository.js', () => mockUsersRepo);
jest.unstable_mockModule('../src/repositories/asignacionesRepository.js', () => mockAsignacionesRepo);

// Import dinámico DESPUÉS de mockear
const ciclosService = await import('../src/services/ciclosService.js');
const cyclesRepository = mockCiclosRepo;
const usersRepository = mockUsersRepo;
const asignacionesRepository = mockAsignacionesRepo;

const cicloDB = { id_cycle: 1, name_cycle: '2024-2025', max_members: 5, id_person_charge: 10 };
const cicloFE = { id: 1, subject_cycle: '2024-2025', max_members: 5, id_encargado: 10 };

describe('ciclosService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('listarCiclos: mapea correctamente', async () => {
    cyclesRepository.listarTodos.mockResolvedValue([cicloDB]);
    await expect(ciclosService.listarCiclos()).resolves.toEqual([cicloFE]);
  });

  describe('crearCiclo', () => {
    const body = { subject_cycle: '2025', max_members: 3, id_encargado: 10 };

    test('crea si el encargado es profesor', async () => {
      usersRepository.filtrarProfesores.mockResolvedValue([{ id: 10 }]);
      cyclesRepository.crear.mockResolvedValue(1);
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      await expect(ciclosService.crearCiclo(body)).resolves.toEqual(cicloFE);
    });

    test('lanza 400 si el encargado no es profesor', async () => {
      usersRepository.filtrarProfesores.mockResolvedValue([]);
      await expect(ciclosService.crearCiclo(body)).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('editarCiclo', () => {
    const body = { subject_cycle: '2025', max_members: 3, id_encargado: 10 };

    test('edita correctamente', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      usersRepository.filtrarProfesores.mockResolvedValue([{ id: 10 }]);
      cyclesRepository.actualizar.mockResolvedValue(true);
      await expect(ciclosService.editarCiclo(1, body)).resolves.toEqual(cicloFE);
    });

    test('lanza 404 si el ciclo no existe', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(null);
      await expect(ciclosService.editarCiclo(999, body)).rejects.toMatchObject({ status: 404 });
    });

    test('lanza 400 si el encargado no es profesor', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      usersRepository.filtrarProfesores.mockResolvedValue([]);
      await expect(ciclosService.editarCiclo(1, body)).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('asignarJurados', () => {
    test('asigna un jurado nuevo', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      usersRepository.filtrarProfesores.mockResolvedValue([{ id: 20 }]);
      asignacionesRepository.existeAsignacionJurado.mockResolvedValue(false);
      await ciclosService.asignarJurados(1, 20);
      expect(asignacionesRepository.asignarJurado).toHaveBeenCalledWith(1, 20);
    });

    test('no duplica si ya está asignado', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      usersRepository.filtrarProfesores.mockResolvedValue([{ id: 20 }]);
      asignacionesRepository.existeAsignacionJurado.mockResolvedValue(true);
      await ciclosService.asignarJurados(1, 20);
      expect(asignacionesRepository.asignarJurado).not.toHaveBeenCalled();
    });

    test('lanza 404 si el ciclo no existe', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(null);
      await expect(ciclosService.asignarJurados(999, 20)).rejects.toMatchObject({ status: 404 });
    });

    test('lanza 400 si no envía jurados', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      await expect(ciclosService.asignarJurados(1, [])).rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si ids no son numéricos', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      await expect(ciclosService.asignarJurados(1, ['abc'])).rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si algún jurado no es profesor', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      usersRepository.filtrarProfesores.mockResolvedValue([{ id: 20 }]);
      await expect(ciclosService.asignarJurados(1, [20, 30])).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('quitarJurado', () => {
    test('quita el jurado', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      asignacionesRepository.quitarJurado.mockResolvedValue(true);
      await expect(ciclosService.quitarJurado(1, 20)).resolves.toEqual(cicloFE);
    });

    test('lanza 404 si el ciclo no existe', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(null);
      await expect(ciclosService.quitarJurado(999, 20)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('listarJuradosDeCiclo', () => {
    test('lista jurados', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      asignacionesRepository.listarJuradosPorCiclo.mockResolvedValue([{ id: 20 }]);
      await expect(ciclosService.listarJuradosDeCiclo(1)).resolves.toEqual([{ id: 20 }]);
    });

    test('lanza 404 si el ciclo no existe', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(null);
      await expect(ciclosService.listarJuradosDeCiclo(999)).rejects.toMatchObject({ status: 404 });
    });
  });

  test('listarProfesoresDisponibles: pasa filtros', async () => {
    usersRepository.listarProfesores.mockResolvedValue([{ id: 20 }]);
    await expect(ciclosService.listarProfesoresDisponibles(1, { excluirEncargado: true }))
      .resolves.toEqual([{ id: 20 }]);
  });

  describe('obtenerFechas', () => {
    test('retorna fechas si el ciclo existe', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      cyclesRepository.obtenerFechas.mockResolvedValue([{ stage: 'Radicación' }]);
      await expect(ciclosService.obtenerFechas(1)).resolves.toHaveLength(1);
    });

    test('lanza 404 si el ciclo no existe', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(null);
      await expect(ciclosService.obtenerFechas(999)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('actualizarFechas', () => {
    const fechasOk = { start_date: '2024-01-01', end_date: '2024-12-31' };

    test('actualiza correctamente', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      cyclesRepository.actualizarFechas.mockResolvedValue(true);
      await ciclosService.actualizarFechas(1, 'Radicación', fechasOk, 10);
      expect(cyclesRepository.actualizarFechas).toHaveBeenCalled();
    });

    test('lanza 404 si el ciclo no existe', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(null);
      await expect(ciclosService.actualizarFechas(999, 'Radicación', fechasOk, 10))
        .rejects.toMatchObject({ status: 404 });
    });

    test('lanza 400 si faltan fechas', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      await expect(ciclosService.actualizarFechas(1, 'Radicación', {}, 10))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si stage no es válido', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      await expect(ciclosService.actualizarFechas(1, 'StageFalso', fechasOk, 10))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 400 si start_date >= end_date', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      await expect(ciclosService.actualizarFechas(1, 'Radicación',
        { start_date: '2024-12-31', end_date: '2024-01-01' }, 10))
        .rejects.toMatchObject({ status: 400 });
    });

    test('lanza 404 si no hay fechas para esa etapa', async () => {
      cyclesRepository.buscarPorId.mockResolvedValue(cicloDB);
      cyclesRepository.actualizarFechas.mockResolvedValue(false);
      await expect(ciclosService.actualizarFechas(1, 'Radicación', fechasOk, 10))
        .rejects.toMatchObject({ status: 404 });
    });
  });
});