import {
  act,
  render,
  screen,
  userEvent,
  within,
} from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { router } from 'expo-router';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { AssignmentError, StudentAccessError } from '@/data/studentErrors';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { leaveAssignedNotice, leaveLevelNotice } from '../assignmentNotice';
import { StudentDetailView } from '../components/StudentDetailView';
import { directorRoutes, teacherRoutes } from '../staffRoutes';
import { settle } from '@/test-utils/settle';

jest.mock('expo-router', () => ({
  // La pantalla está visible (recarga al volver la app al frente).
  useIsFocused: () => true,
  router: { push: jest.fn(), back: jest.fn() },
}));

/** «Volver a la pantalla» = llamar a lo que registró con useRefreshOnFocus. */
jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

function focusAgain() {
  // Al volver, la app ejecuta TODO lo registrado con useRefreshOnFocus:
  // los avisos de la pantalla y su recarga (useScreenRefresh).
  const onFocusAll = [
    ...new Set(jest.mocked(useRefreshOnFocus).mock.calls.map(([fn]) => fn)),
  ];
  if (onFocusAll.length === 0) {
    throw new Error('La pantalla no registró el foco');
  }
  const onFocus = () => onFocusAll.forEach((fn) => fn());
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

  it('«Por revisar (n)» abre sus actividades por revisar', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderDetail(createMockRepositories({ delayMs: 0 }));

    const button = screen.getByRole('button', {
      name: 'Por revisar: 1 actividad por revisar',
    });
    expect(within(button).getByText('Por revisar (1)')).toBeOnTheScreen();

    await user.press(button);
    expect(router.push).toHaveBeenCalledWith(
      teacherRoutes.review(mockStudent.id, 'Martín C.'),
    );
  });

  it('sin actividades por revisar no muestra «Por revisar»', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    repos.reviews.listPendingSummary = () => Promise.resolve([]);
    await renderDetail(repos);

    expect(screen.getByRole('header', { name: 'Martín C.' })).toBeOnTheScreen();
    expect(screen.queryByText(/^Por revisar/)).toBeNull();
  });

  it('al volver de asignar, avisa «¡Listo! … quedó asignada a …» y muestra la nueva', async () => {
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
    leaveAssignedNotice(mockStudent.id, 'Rutinas de la casa');
    await focusAgain();

    expect(
      screen.getByText(
        '¡Listo! La actividad «Rutinas de la casa» quedó asignada a Martín C.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getAllByText('Rutinas de la casa').length).toBeGreaterThan(0);
    // Se actualizó sin volver a «cargando».
    expect(screen.queryByText('Buscando sus datos…')).toBeNull();
  });

  it('«Cambiar nivel» abre la pantalla de niveles de su espacio', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderDetail(createMockRepositories({ delayMs: 0 }));

    const button = screen.getByRole('button', {
      name: 'Cambiar el nivel de sus juegos',
    });
    await user.press(button);
    expect(router.push).toHaveBeenCalledWith(
      teacherRoutes.levels(mockStudent.id),
    );
    expect(teacherRoutes.canRaiseLevels).toBe(false);
    expect(directorRoutes.canRaiseLevels).toBe(true);
  });

  it('al volver de «Cambiar nivel», avisa y muestra el nivel nuevo', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    await renderDetail(repos);
    expect(screen.getByLabelText('Memoria: Nivel 1')).toBeOnTheScreen();

    // Lo que deja la pantalla de niveles al guardar: el nivel nuevo y el aviso.
    jest
      .spyOn(repos.levels, 'getStudentLevels')
      .mockResolvedValueOnce([
        { gameId: 'memory', level: 3, completed: false, pendingReview: 0 },
      ]);
    leaveLevelNotice(mockStudent.id, 'Memoria quedó en el nivel 3.');
    await focusAgain();

    expect(screen.getByText('Memoria quedó en el nivel 3.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Memoria: Nivel 3')).toBeOnTheScreen();
  });

  it('«Grabaciones de voz» solo aparece si se pide (la ruta de la directora)', async () => {
    await renderDetail(createMockRepositories({ delayMs: 0 }));
    expect(screen.queryByText('Grabaciones de voz')).toBeNull();

    await render(
      <RepositoryProvider repositories={createMockRepositories({ delayMs: 0 })}>
        <StudentDetailView
          studentId={mockStudent.id}
          routes={directorRoutes}
          manageRecordings
        />
      </RepositoryProvider>,
    );
    await settle();
    expect(
      screen.getByRole('button', {
        name: 'Borrar todas sus grabaciones de voz',
      }),
    ).toBeOnTheScreen();
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

  it('P8: el porqué sale junto a esa asignación y se anuncia', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = createMockRepositories({ delayMs: 0 });
    jest
      .spyOn(repos.assignmentManagement, 'remove')
      .mockRejectedValue(new AssignmentError('hasAttempts'));
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    await renderDetail(repos);

    // La segunda asignación con «Quitar» es «Números».
    await user.press(screen.getAllByRole('button', { name: 'Quitar' })[1]!);
    await user.press(screen.getByRole('button', { name: 'Sí, quitar' }));
    await settle();

    const text = 'Ya empezó a practicarla; no se puede quitar.';
    // Se muestra una sola vez (no también arriba).
    expect(screen.getAllByText(text)).toHaveLength(1);
    expect(announce).toHaveBeenCalledWith(text);

    // Su tarjeta más cercana es la de «Números», no la de otra asignación.
    let row: ReturnType<typeof screen.getByText> | null =
      screen.getByText(text);
    while (row && within(row).queryAllByText('Números').length === 0) {
      row = row.parent;
    }
    if (!row) throw new Error('El mensaje no está en ninguna tarjeta');
    expect(within(row).queryAllByText('Colores')).toHaveLength(0);
    expect(within(row).queryAllByText('Cuentos')).toHaveLength(0);

    // Volver a tocar «Quitar» limpia el mensaje.
    await user.press(screen.getAllByRole('button', { name: 'Quitar' })[1]!);
    expect(screen.queryByText(text)).toBeNull();
    announce.mockRestore();
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
