import { act, render, screen, userEvent } from '@testing-library/react-native';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { OverviewView } from '../components/OverviewView';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function asDirector(): Promise<Repositories> {
  const repos = createMockRepositories({ delayMs: 0 });
  const pending = repos.auth.signIn({
    email: 'directora@gameup.test',
    password: MOCK_PASSWORD,
  });
  await jest.runAllTimersAsync();
  await pending;
  return repos;
}

async function renderOverview(repos: Repositories, wait = true) {
  await render(
    <RepositoryProvider repositories={repos}>
      <OverviewView />
    </RepositoryProvider>,
  );
  if (wait) await settle();
}

const figure = (key: string) => screen.getByTestId(`resumen-${key}`);

describe('Resumen de la directora', () => {
  it('mientras carga, lo dice', async () => {
    await renderOverview(createMockRepositories({ delayMs: 1000 }), false);

    expect(screen.getByText('Contando…')).toBeOnTheScreen();
    await settle();
  });

  it('listo: muestra las cifras de toda la fundación', async () => {
    await renderOverview(await asDirector());

    // 4 estudiantes; 4 pendientes; Martín, Valentina y Lucía con módulos.
    expect(figure('students')).toHaveProp(
      'accessibilityLabel',
      'Estudiantes: 4',
    );
    expect(figure('pendingReviews')).toHaveProp(
      'accessibilityLabel',
      'Por validar: 4',
    );
    expect(figure('inProgress')).toHaveProp(
      'accessibilityLabel',
      'Asignaciones en curso: 4',
    );
    expect(figure('assigned')).toHaveProp(
      'accessibilityLabel',
      'Asignaciones sin empezar: 1',
    );
    expect(figure('completed')).toHaveProp(
      'accessibilityLabel',
      'Asignaciones completadas: 1',
    );
  });

  it('si falla una cifra, esa tarjeta dice «No disponible» y las demás se ven', async () => {
    const repos = await asDirector();
    repos.overview.countPendingReviews = () =>
      Promise.reject(new Error('sin red'));

    await renderOverview(repos);

    expect(figure('pendingReviews')).toHaveProp(
      'accessibilityLabel',
      'Por validar: No disponible',
    );
    expect(figure('students')).toHaveProp(
      'accessibilityLabel',
      'Estudiantes: 4',
    );
    expect(screen.queryByText('No pudimos cargar el resumen')).toBeNull();
  });

  it('solo si fallan todas, error con «Intentar de nuevo»', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    const original = { ...repos.overview };
    const fail = () => Promise.reject(new Error('sin red'));
    repos.overview.countStudents = fail;
    repos.overview.countPendingReviews = fail;
    repos.overview.countAssignments = fail;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await renderOverview(repos);

    expect(screen.getByText('No pudimos cargar el resumen')).toBeOnTheScreen();

    // Vuelve la conexión: reintentar muestra las cifras.
    Object.assign(repos.overview, original);
    await user.press(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    await settle();
    expect(figure('students')).toHaveProp(
      'accessibilityLabel',
      'Estudiantes: 4',
    );
    warn.mockRestore();
  });
});
