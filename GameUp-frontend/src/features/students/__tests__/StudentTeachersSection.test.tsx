import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD, mockStudent, mockTeacher } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { StudentAccessError } from '@/data/studentErrors';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { leaveTeacherNotice } from '../assignmentNotice';
import { StudentDetailView } from '../components/StudentDetailView';
import {
  assignTeacherRoute,
  directorRoutes,
  teacherRoutes,
} from '../staffRoutes';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

/** «Volver a la pantalla» = llamar a lo que registró con useRefreshOnFocus. */
async function focusAgain() {
  const calls = jest.mocked(useRefreshOnFocus).mock.calls;
  const onFocus = calls[calls.length - 1]?.[0];
  if (!onFocus) throw new Error('La pantalla no registró el foco');
  await act(async () => {
    onFocus();
  });
  await settle();
}

/** Repositorios simulados con la sesión de la directora. */
async function asDirector() {
  const repos = createMockRepositories({ delayMs: 0 });
  await act(async () => {
    const pending = repos.auth.signIn({
      email: 'directora@gameup.test',
      password: MOCK_PASSWORD,
    });
    await jest.runAllTimersAsync();
    await pending;
  });
  return repos;
}

async function renderDetail(
  repos: Repositories,
  { director = true, studentId = mockStudent.id } = {},
) {
  await render(
    <RepositoryProvider repositories={repos}>
      <StudentDetailView
        studentId={studentId}
        routes={director ? directorRoutes : teacherRoutes}
        manageTeachers={director}
      />
    </RepositoryProvider>,
  );
  await settle();
}

describe('«Tallerista a cargo» en el detalle del estudiante', () => {
  beforeEach(() => {
    jest.mocked(useRefreshOnFocus).mockClear();
    jest.mocked(router.push).mockClear();
  });

  it('la directora la ve, con el nombre y desde cuándo', async () => {
    await renderDetail(await asDirector());

    expect(
      screen.getByRole('header', { name: 'Tallerista a cargo' }),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Profe Laura. Desde el 3 de febrero'),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Quitar a Profe Laura' }),
    ).toBeOnTheScreen();
  });

  it('el docente no la ve ni se le pide nada al backend', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    const list = jest.spyOn(repos.teacherLinks, 'listStudentTeachers');
    await renderDetail(repos, { director: false });

    expect(screen.getByRole('header', { name: 'Martín C.' })).toBeOnTheScreen();
    expect(screen.queryByText('Tallerista a cargo')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Asignar tallerista' }),
    ).toBeNull();
    expect(list).not.toHaveBeenCalled();
  });

  it('sin tallerista activa dice «Sin tallerista» y muestra el historial', async () => {
    await renderDetail(await asDirector(), { studentId: 'est-demo-004' });

    expect(screen.getByText('Sin tallerista')).toBeOnTheScreen();
    expect(screen.getByText('Antes: Carlos Pérez.')).toBeOnTheScreen();
  });

  it('«Asignar tallerista» abre la lista; al volver, avisa y la muestra', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    await renderDetail(repos, { studentId: 'est-demo-004' });

    await user.press(
      screen.getByRole('button', { name: 'Asignar tallerista' }),
    );
    expect(router.push).toHaveBeenCalledWith(
      assignTeacherRoute('est-demo-004'),
    );

    // Lo que hace la pantalla de elegir tallerista.
    await act(async () => {
      const pending = repos.teacherLinks.assignTeacher(
        'est-demo-004',
        'doc-demo-002',
      );
      await jest.runAllTimersAsync();
      await pending;
    });
    leaveTeacherNotice('est-demo-004');
    await focusAgain();

    expect(screen.getByText('Tallerista asignada')).toBeOnTheScreen();
    expect(screen.getByText('Ana Gómez')).toBeOnTheScreen();
    expect(screen.queryByText('Sin tallerista')).toBeNull();
  });

  it('quitar pide confirmación y, al confirmar, la quita', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    const remove = jest.spyOn(repos.teacherLinks, 'removeTeacher');
    await renderDetail(repos);

    await user.press(
      screen.getByRole('button', { name: 'Quitar a Profe Laura' }),
    );
    expect(
      screen.getByText(
        '¿Quitar a Profe Laura? Ya no podrá ver a este estudiante.',
      ),
    ).toBeOnTheScreen();
    expect(remove).not.toHaveBeenCalled();

    await user.press(
      screen.getByRole('button', { name: 'Sí, quitar a Profe Laura' }),
    );
    await settle();

    expect(remove).toHaveBeenCalledWith(mockStudent.id, mockTeacher.id);
    expect(screen.getByText('Quitaste a Profe Laura.')).toBeOnTheScreen();
    expect(screen.getByText('Sin tallerista')).toBeOnTheScreen();
    expect(screen.getByText('Antes: Profe Laura.')).toBeOnTheScreen();
  });

  it('«Cancelar» no quita nada', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    const remove = jest.spyOn(repos.teacherLinks, 'removeTeacher');
    await renderDetail(repos);

    await user.press(
      screen.getByRole('button', { name: 'Quitar a Profe Laura' }),
    );
    await user.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(remove).not.toHaveBeenCalled();
    expect(screen.queryByText(/Ya no podrá ver/)).toBeNull();
  });

  it('si ya no estaba a cargo (DELETE 404), recarga sin mostrar error', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    await renderDetail(repos);
    const remove = jest.spyOn(repos.teacherLinks, 'removeTeacher');
    const list = jest.spyOn(repos.teacherLinks, 'listStudentTeachers');

    // Otra persona la quitó mientras la pantalla seguía abierta.
    await act(async () => {
      const pending = repos.teacherLinks.removeTeacher(
        mockStudent.id,
        mockTeacher.id,
      );
      await jest.runAllTimersAsync();
      await pending;
    });
    remove.mockClear();

    await user.press(
      screen.getByRole('button', { name: 'Quitar a Profe Laura' }),
    );
    await user.press(
      screen.getByRole('button', { name: 'Sí, quitar a Profe Laura' }),
    );
    await settle();

    await expect(remove.mock.results[0]?.value).resolves.toBe('notInCharge');
    expect(list).toHaveBeenCalled();
    expect(screen.getByText('Sin tallerista')).toBeOnTheScreen();
    expect(screen.queryByText(/No se pudo/)).toBeNull();
    expect(screen.queryByText(/No puedes/)).toBeNull();
    expect(screen.queryByText(/Quitaste/)).toBeNull();
  });

  it('si falla al quitar, lo dice sin cerrar la pantalla', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    jest
      .spyOn(repos.teacherLinks, 'removeTeacher')
      .mockRejectedValue(new Error('sin red'));
    await renderDetail(repos);

    await user.press(
      screen.getByRole('button', { name: 'Quitar a Profe Laura' }),
    );
    await user.press(
      screen.getByRole('button', { name: 'Sí, quitar a Profe Laura' }),
    );
    await settle();

    expect(
      screen.getByText(
        'No se pudo quitar. Revisa la conexión e inténtalo otra vez.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('Profe Laura')).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();
  });

  it('si la sección no carga, el resto del detalle se sigue viendo', async () => {
    const repos = await asDirector();
    repos.teacherLinks.listStudentTeachers = () =>
      Promise.reject(new StudentAccessError());
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await renderDetail(repos);

    expect(
      screen.getByText('No puedes ver quién tiene a cargo a este estudiante.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Progreso oficial')).toBeOnTheScreen();
    warn.mockRestore();
  });
});
