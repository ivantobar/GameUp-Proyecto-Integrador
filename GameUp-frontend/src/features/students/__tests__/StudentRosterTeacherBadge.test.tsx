import { act, render, screen } from '@testing-library/react-native';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { StudentRosterView } from '../components/StudentRosterView';
import { directorRoutes, teacherRoutes } from '../staffRoutes';

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

async function signedIn(email: string) {
  const repos = createMockRepositories({ delayMs: 0 });
  await act(async () => {
    const pending = repos.auth.signIn({ email, password: MOCK_PASSWORD });
    await jest.runAllTimersAsync();
    await pending;
  });
  return repos;
}

async function renderRoster(repos: Repositories, director: boolean) {
  await render(
    <RepositoryProvider repositories={repos}>
      <StudentRosterView
        title="Estudiantes"
        routes={director ? directorRoutes : teacherRoutes}
        emptyTitle="Sin estudiantes"
        showTeacherStatus={director}
      />
    </RepositoryProvider>,
  );
  // Primero llega la lista; después, lo de cada fila visible.
  await settle();
  await settle();
}

describe('etiqueta «Sin tallerista» en la lista', () => {
  it('la directora la ve solo en quien no tiene tallerista activa', async () => {
    await renderRoster(await signedIn('directora@gameup.test'), true);

    // Solo Lucía (estuvo con Carlos, hoy sin nadie).
    expect(screen.getAllByText('Sin tallerista')).toHaveLength(1);
    expect(
      screen.getByLabelText(/^Lucía R\.\. Sin tallerista\. /),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Martín C\.\. Progreso/)).toBeOnTheScreen();
  });

  it('en la lista del docente no aparece ni se consulta', async () => {
    const repos = await signedIn('docente@gameup.test');
    const list = jest.spyOn(repos.teacherLinks, 'listStudentTeachers');
    await renderRoster(repos, false);

    expect(screen.getByText('Martín C.')).toBeOnTheScreen();
    expect(screen.queryByText('Sin tallerista')).toBeNull();
    expect(list).not.toHaveBeenCalled();
  });

  it('si fallan esas consultas, la lista se ve igual y sin etiqueta', async () => {
    const repos = await signedIn('directora@gameup.test');
    repos.teacherLinks.listStudentTeachers = () =>
      Promise.reject(new Error('sin red'));
    await renderRoster(repos, true);

    expect(screen.getByText('Lucía R.')).toBeOnTheScreen();
    expect(screen.getByText('Martín C.')).toBeOnTheScreen();
    expect(screen.queryByText('Sin tallerista')).toBeNull();
    expect(
      screen.queryByText('No pudimos cargar a los estudiantes'),
    ).toBeNull();
  });
});
