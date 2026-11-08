import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { AssignmentError, StudentAccessError } from '@/data/studentErrors';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { leaveAssignedNotice } from '../assignmentNotice';
import { StudentDetailView } from '../components/StudentDetailView';
import { teacherRoutes } from '../staffRoutes';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

/** «Volver a la pantalla» = llamar a lo que registró con useRefreshOnFocus. */
jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

function focusAgain() {
  const calls = jest.mocked(useRefreshOnFocus).mock.calls;
  const onFocus = calls[calls.length - 1]?.[0];
  if (!onFocus) throw new Error('La pantalla no registró el foco');
  return (async () => {
    // React aplica el cambio al salir de `act`; después se avanza el reloj.
    await act(async () => {
      onFocus();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });
  })();
}

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function renderDetail(repos: Repositories, studentId = mockStudent.id) {
  await render(
    <RepositoryProvider repositories={repos}>
      <StudentDetailView studentId={studentId} routes={teacherRoutes} />
    </RepositoryProvider>,
  );
  await settle();
}

describe('detalle del estudiante', () => {
  beforeEach(() => {
    jest.mocked(useRefreshOnFocus).mockClear();
    jest.mocked(router.push).mockClear();
  });

  it('muestra su progreso oficial, sus asignaciones y «Asignar actividad»', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderDetail(createMockRepositories({ delayMs: 0 }));

    expect(screen.getByRole('header', { name: 'Martín C.' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Colores, 80 por ciento')).toBeOnTheScreen();
    expect(screen.getByText('Sin empezar · 0 %')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Asignar actividad' }));
    expect(router.push).toHaveBeenCalledWith(
      teacherRoutes.assign(mockStudent.id),
    );
  });

  it('al volver de asignar, avisa «Actividad asignada» y muestra la nueva', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    await renderDetail(repos);

    // Lo que hace la pantalla de asignar (los simulados responden con setTimeout).
    await act(async () => {
      const pending = repos.assignmentManagement.assign({
        moduleId: 'routines',
        studentId: mockStudent.id,
      });
      await jest.runAllTimersAsync();
      await pending;
    });
    leaveAssignedNotice(mockStudent.id);
    await focusAgain();

    expect(screen.getByText('Actividad asignada')).toBeOnTheScreen();
    expect(screen.getAllByText('Rutinas de la casa').length).toBeGreaterThan(0);
    // Se actualizó sin volver a «cargando».
    expect(screen.queryByText('Buscando sus datos…')).toBeNull();
  });

  it('quitar pide confirmación y, al confirmar, actualiza la lista', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = createMockRepositories({ delayMs: 0 });
    const remove = jest.spyOn(repos.assignmentManagement, 'remove');
    await renderDetail(repos);

    // Solo «Cuentos» está sin empezar.
    await user.press(screen.getAllByRole('button', { name: 'Quitar' })[3]!);
    expect(
      screen.getByText('¿Quitar «Cuentos»? No se puede deshacer.'),
    ).toBeOnTheScreen();
    expect(remove).not.toHaveBeenCalled();

    await user.press(screen.getByRole('button', { name: 'Sí, quitar' }));
    await settle();

    expect(remove).toHaveBeenCalledWith('asig-demo-004');
    expect(screen.getByText('Quitaste «Cuentos».')).toBeOnTheScreen();
    expect(screen.queryByText('Sin empezar · 0 %')).toBeNull();
  });

  it('«Cancelar» no quita nada', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = createMockRepositories({ delayMs: 0 });
    const remove = jest.spyOn(repos.assignmentManagement, 'remove');
    await renderDetail(repos);

    await user.press(screen.getAllByRole('button', { name: 'Quitar' })[0]!);
    await user.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(remove).not.toHaveBeenCalled();
    expect(screen.queryByText(/No se puede deshacer/)).toBeNull();
  });

  it('si ya empezó a practicarla, lo dice (409 en DELETE)', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = createMockRepositories({ delayMs: 0 });
    jest
      .spyOn(repos.assignmentManagement, 'remove')
      .mockRejectedValue(new AssignmentError('hasAttempts'));
    await renderDetail(repos);

    await user.press(screen.getAllByRole('button', { name: 'Quitar' })[0]!);
    await user.press(screen.getByRole('button', { name: 'Sí, quitar' }));
    await settle();

    expect(
      screen.getByText('Ya empezó a practicarla; no se puede quitar.'),
    ).toBeOnTheScreen();
  });

  it('un estudiante ajeno (403/404) no se presenta como problema de conexión', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    repos.directory.getStudent = () => Promise.reject(new StudentAccessError());
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await renderDetail(repos, 'est-ajeno');

    expect(
      screen.getByText('No puedes ver a este estudiante'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Revisa la conexión.')).toBeNull();
    warn.mockRestore();
  });

  it('sin red, ofrece intentar de nuevo', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    repos.directory.getStudent = () => Promise.reject(new Error('sin red'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await renderDetail(repos);

    expect(screen.getByText('Revisa la conexión.')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Intentar de nuevo' }),
    ).toBeOnTheScreen();
    warn.mockRestore();
  });
});
