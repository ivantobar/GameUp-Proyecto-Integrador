import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD, mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { ReviewQueueView } from '@/features/review/components/ReviewQueueView';

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

async function asTeacher(): Promise<Repositories> {
  const repos = createMockRepositories({ delayMs: 0 });
  const pending = repos.auth.signIn({
    email: 'docente@gameup.test',
    password: MOCK_PASSWORD,
  });
  await jest.runAllTimersAsync();
  await pending;
  return repos;
}

async function renderQueue(
  repos: Repositories,
  studentId = mockStudent.id,
  studentName?: string,
) {
  await render(
    <RepositoryProvider repositories={repos}>
      <ReviewQueueView
        title="Por escuchar"
        studentId={studentId}
        studentName={studentName}
      />
    </RepositoryProvider>,
  );
  await settle();
}

describe('«Por escuchar» de un estudiante', () => {
  beforeEach(() => {
    jest.mocked(router.back).mockClear();
  });

  it('pide solo sus actividades y lo dice en el título', async () => {
    const repos = await asTeacher();
    const list = jest.spyOn(repos.reviews, 'listPendingReviews');
    await renderQueue(repos);

    expect(list).toHaveBeenCalledWith(expect.any(String), mockStudent.id);
    expect(screen.getByText('Por escuchar · Martín C.')).toBeOnTheScreen();
    expect(screen.queryByText(/Valentina G\./)).toBeNull();
    expect(screen.queryByText(/Samuel O\./)).toBeNull();
    // Mismos filtros que antes.
    for (const label of ['Todas', 'Habla conmigo', 'Busca la boca']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
  });

  it('al revisarlo todo: «Revisaste todo de Martín C.» y «Listo» para volver', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderQueue(await asTeacher(), mockStudent.id, 'Martín C.');

    await user.press(screen.getByRole('button', { name: 'Lo logró' }));
    await settle();

    expect(screen.getByText('Revisaste todo de Martín C.')).toBeOnTheScreen();
    // El título conserva el nombre aunque ya no queden actividades.
    expect(screen.getByText('Por escuchar · Martín C.')).toBeOnTheScreen();
    expect(screen.queryByText('Todas')).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Listo' }));
    expect(router.back).toHaveBeenCalled();
  });

  it('el botón atrás vuelve a la lista', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderQueue(await asTeacher());

    await user.press(screen.getByRole('button', { name: 'Volver' }));
    expect(router.back).toHaveBeenCalled();
  });

  it('un estudiante ajeno no muestra nada de nadie', async () => {
    await renderQueue(await asTeacher(), 'est-ajeno');

    expect(screen.getByText('Revisaste todo')).toBeOnTheScreen();
    expect(screen.queryByText(/Martín C\./)).toBeNull();
  });
});
