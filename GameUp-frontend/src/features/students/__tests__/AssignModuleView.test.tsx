import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { AssignmentError } from '@/data/studentErrors';
import { takeAssignedNotice } from '../assignmentNotice';
import { AssignModuleView } from '../components/AssignModuleView';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

/** 20 de noviembre de 2026, 11:30 p. m. en Bogotá (en UTC ya es el 21). */
const LATE_NIGHT_BOGOTA = Date.parse('2026-11-21T04:30:00.000Z');

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function renderAssign(repos: Repositories, studentId = mockStudent.id) {
  await render(
    <RepositoryProvider repositories={repos}>
      <AssignModuleView studentId={studentId} />
    </RepositoryProvider>,
  );
  await settle();
}

describe('Asignar actividad', () => {
  beforeEach(() => {
    jest.mocked(router.back).mockClear();
    jest.setSystemTime(LATE_NIGHT_BOGOTA);
  });

  it('marca «Ya asignado» y no ofrece módulos sin publicar', async () => {
    await renderAssign(createMockRepositories({ delayMs: 0 }));

    // Martín ya tiene Letras en curso.
    expect(
      screen.getByLabelText(/^Letras\. Lenguaje\. Ya asignado$/),
    ).toBeDisabled();
    expect(screen.queryByText('Borrador: sílabas')).toBeNull();
    // Sin elegir, «Asignar» no se puede tocar.
    expect(screen.getByRole('button', { name: 'Asignar' })).toBeDisabled();
  });

  it('envía el módulo, el estudiante y la fecha de Bogotá, y vuelve al detalle', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = createMockRepositories({ delayMs: 0 });
    const assign = jest.spyOn(repos.assignmentManagement, 'assign');
    await renderAssign(repos);

    await user.press(screen.getByTestId('modulo-routines'));
    await user.press(screen.getByRole('button', { name: /^Hoy/ }));
    await user.press(screen.getByRole('button', { name: 'Asignar' }));
    await settle();

    expect(assign).toHaveBeenCalledWith({
      moduleId: 'routines',
      studentId: mockStudent.id,
      suggestedDate: '2026-11-20',
    });
    expect(router.back).toHaveBeenCalledTimes(1);
    // El detalle mostrará «¡Listo! La actividad … quedó asignada» al volver.
    expect(takeAssignedNotice(mockStudent.id)).toBe('Rutinas de la casa');
  });

  it('tocar otra vez el módulo elegido lo deselecciona', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderAssign(createMockRepositories({ delayMs: 0 }));

    await user.press(screen.getByTestId('modulo-routines'));
    expect(screen.getByText('Elegido')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Asignar' })).toBeEnabled();

    await user.press(screen.getByTestId('modulo-routines'));
    expect(screen.queryByText('Elegido')).toBeNull();
    expect(screen.getByRole('button', { name: 'Asignar' })).toBeDisabled();
  });

  it('«Sin fecha» no envía fecha sugerida', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = createMockRepositories({ delayMs: 0 });
    const assign = jest.spyOn(repos.assignmentManagement, 'assign');
    await renderAssign(repos);

    await user.press(screen.getByTestId('modulo-routines'));
    await user.press(screen.getByRole('button', { name: 'Asignar' }));
    await settle();

    expect(assign).toHaveBeenCalledWith({
      moduleId: 'routines',
      studentId: mockStudent.id,
    });
    expect(assign.mock.calls[0]?.[0]).not.toHaveProperty('suggestedDate');
  });

  it.each([
    ['alreadyAssigned', 'Ese módulo ya está asignado y sin terminar.'],
    [
      'notAssignable',
      'No se puede asignar: el módulo no está publicado o la fecha ya pasó.',
    ],
    ['invalid', 'Revisa la fecha sugerida e inténtalo otra vez.'],
    ['notAllowed', 'Tu cuenta no puede asignar actividades.'],
    ['notFound', 'No encontramos a este estudiante o ese módulo.'],
  ] as const)(
    'si el backend responde %s, lo explica',
    async (problem, text) => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const repos = createMockRepositories({ delayMs: 0 });
      jest
        .spyOn(repos.assignmentManagement, 'assign')
        .mockRejectedValue(new AssignmentError(problem));
      await renderAssign(repos);

      await user.press(screen.getByTestId('modulo-routines'));
      await user.press(screen.getByRole('button', { name: 'Asignar' }));
      await settle();

      expect(screen.getByText(text)).toBeOnTheScreen();
      expect(screen.queryByText(/Revisa la conexión/)).toBeNull();
      expect(router.back).not.toHaveBeenCalled();
    },
  );

  it('sin red, sí habla de la conexión', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = createMockRepositories({ delayMs: 0 });
    jest
      .spyOn(repos.assignmentManagement, 'assign')
      .mockRejectedValue(new Error('sin red'));
    await renderAssign(repos);

    await user.press(screen.getByTestId('modulo-routines'));
    await user.press(screen.getByRole('button', { name: 'Asignar' }));
    await settle();

    expect(
      screen.getByText(
        'No se pudo asignar. Revisa la conexión e inténtalo otra vez.',
      ),
    ).toBeOnTheScreen();
  });
});

describe('Asignar actividad · qué trae el módulo elegido', () => {
  it('al elegir un módulo se ven sus actividades con su juego', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderAssign(createMockRepositories({ delayMs: 0 }));

    // Sin elegir no se ve ninguna lista.
    expect(screen.queryByText(/^Trae /)).toBeNull();

    await user.press(screen.getByTestId('modulo-routines'));
    await settle();

    expect(
      screen.getByRole('header', { name: 'Trae 4 actividades' }),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Al despertar, Secuenciar')).toBeOnTheScreen();
    expect(screen.getByText('Al despertar · 2')).toBeOnTheScreen();
    expect(screen.queryByText(/^Y \d+ más\.$/)).toBeNull();
  });

  it('al cambiar de módulo muestra solo las del nuevo, y resume las demás', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderAssign(createMockRepositories({ delayMs: 0 }), 'est-demo-002');

    await user.press(screen.getByTestId('modulo-routines'));
    await settle();
    expect(screen.getByText('Al despertar')).toBeOnTheScreen();

    await user.press(screen.getByTestId('modulo-numbers'));
    await settle();

    expect(
      screen.getByRole('header', { name: 'Trae 20 actividades' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Cuenta y empareja')).toBeOnTheScreen();
    // Se ven 6; las otras 14 se resumen.
    expect(screen.getByText('Y 14 más.')).toBeOnTheScreen();
    expect(screen.queryByText('Al despertar')).toBeNull();
  });

  it('mientras carga el nuevo módulo no quedan las del anterior', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = createMockRepositories({ delayMs: 0 });
    const real = repos.assignmentManagement.listModuleActivities;
    jest
      .spyOn(repos.assignmentManagement, 'listModuleActivities')
      .mockImplementation((moduleId) =>
        // «Números» no termina de cargar.
        moduleId === 'numbers' ? new Promise(() => {}) : real(moduleId),
      );
    await renderAssign(repos, 'est-demo-002');

    await user.press(screen.getByTestId('modulo-routines'));
    await settle();
    expect(screen.getByText('Al despertar')).toBeOnTheScreen();

    await user.press(screen.getByTestId('modulo-numbers'));
    await settle();
    expect(
      screen.getByText('Buscando las actividades de «Números»…'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Al despertar')).toBeNull();
    expect(screen.queryByText(/^Trae /)).toBeNull();
  });

  it('al quitar la selección se esconde la lista', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderAssign(createMockRepositories({ delayMs: 0 }));

    await user.press(screen.getByTestId('modulo-routines'));
    await settle();
    expect(screen.getByText('Al despertar')).toBeOnTheScreen();

    await user.press(screen.getByTestId('modulo-routines'));
    expect(screen.queryByText('Al despertar')).toBeNull();
    expect(screen.queryByText(/^Trae /)).toBeNull();
  });

  it('si no cargan, avisa, deja reintentar y se puede asignar igual', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = createMockRepositories({ delayMs: 0 });
    const real = repos.assignmentManagement.listModuleActivities;
    const list = jest
      .spyOn(repos.assignmentManagement, 'listModuleActivities')
      .mockRejectedValueOnce(new Error('sin red'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await renderAssign(repos);

    await user.press(screen.getByTestId('modulo-routines'));
    await settle();

    expect(
      screen.getByText(
        'No pudimos ver las actividades de «Rutinas de la casa». Igual puedes asignarlo.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Asignar' })).toBeEnabled();

    list.mockImplementation(real);
    await user.press(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    await settle();
    expect(
      screen.getByRole('header', { name: 'Trae 4 actividades' }),
    ).toBeOnTheScreen();
    warn.mockRestore();
  });

  it('un módulo sin actividades lo dice', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = createMockRepositories({ delayMs: 0 });
    jest
      .spyOn(repos.assignmentManagement, 'listModuleActivities')
      .mockResolvedValue([]);
    await renderAssign(repos);

    await user.press(screen.getByTestId('modulo-routines'));
    await settle();

    expect(
      screen.getByText('«Rutinas de la casa» todavía no tiene actividades.'),
    ).toBeOnTheScreen();
  });
});
