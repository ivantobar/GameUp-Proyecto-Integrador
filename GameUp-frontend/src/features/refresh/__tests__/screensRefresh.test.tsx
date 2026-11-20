import { act, render, screen, userEvent } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import StudentHome from '@/app/student/(tabs)/index';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD, mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import type { PendingReviewSummary } from '@/data/types';
import { PendingStudentsView } from '@/features/review/components/PendingStudentsView';
import { ReviewQueueView } from '@/features/review/components/ReviewQueueView';
import { teacherRoutes } from '@/features/students/staffRoutes';
import { settle } from '@/test-utils/settle';

jest.mock('expo-router', () => ({
  useIsFocused: () => true,
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
  },
}));
jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

/** Oyentes de AppState: para simular que la app va al fondo y vuelve. */
let appListeners: ((state: AppStateStatus) => void)[] = [];
beforeEach(() => {
  appListeners = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
    const fn = listener as (state: AppStateStatus) => void;
    appListeners.push(fn);
    return {
      remove: () => {
        appListeners = appListeners.filter((other) => other !== fn);
      },
    } as ReturnType<typeof AppState.addEventListener>;
  });
});

async function appGoesAwayAndBack() {
  await act(async () => {
    appListeners.forEach((fn) => fn('background'));
    appListeners.forEach((fn) => fn('active'));
  });
  await settle();
}

async function signedIn(email: string): Promise<Repositories> {
  const repos = createMockRepositories({ delayMs: 0 });
  const pending = repos.auth.signIn({ email, password: MOCK_PASSWORD });
  await jest.runAllTimersAsync();
  await pending;
  return repos;
}

const newSubmission: PendingReviewSummary = {
  student: { id: mockStudent.id, displayName: 'Martín C.', initials: 'MC' },
  pending: 1,
  oldestAt: '2026-11-19T15:00:00.000Z',
};

async function renderInbox(repos: Repositories) {
  await render(
    <RepositoryProvider repositories={repos}>
      <PendingStudentsView routes={teacherRoutes} showGestureNotice={false} />
    </RepositoryProvider>,
  );
  await settle();
}

/** El RefreshControl del ScrollView de la pantalla. */
const refreshControl = () =>
  (
    screen.getByTestId('screen-scroll').props as {
      refreshControl?: { props: { onRefresh: () => void } };
    }
  ).refreshControl;

describe('«Por escuchar»: lo nuevo aparece sin cerrar sesión', () => {
  it('el niño entrega y la tallerista lo ve al tocar «Actualizar»', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await signedIn('docente@gameup.test');
    jest
      .spyOn(repos.reviews, 'listPendingSummary')
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([newSubmission]);
    await renderInbox(repos);
    expect(screen.getByText('No hay nada por revisar')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Actualizar' }));
    await settle();
    expect(screen.getByText('Martín C.')).toBeOnTheScreen();
  });

  it('también al deslizar hacia abajo', async () => {
    const repos = await signedIn('docente@gameup.test');
    jest
      .spyOn(repos.reviews, 'listPendingSummary')
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([newSubmission]);
    await renderInbox(repos);

    await act(async () => refreshControl()?.props.onRefresh());
    await settle();
    expect(screen.getByText('Martín C.')).toBeOnTheScreen();
  });

  it('también al volver la app al frente', async () => {
    const repos = await signedIn('docente@gameup.test');
    jest
      .spyOn(repos.reviews, 'listPendingSummary')
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([newSubmission]);
    await renderInbox(repos);

    await appGoesAwayAndBack();
    expect(screen.getByText('Martín C.')).toBeOnTheScreen();
  });

  it('recargar varias veces seguidas hace UNA sola petición', async () => {
    const repos = await signedIn('docente@gameup.test');
    const list = jest.spyOn(repos.reviews, 'listPendingSummary');
    await renderInbox(repos);
    expect(list).toHaveBeenCalledTimes(1);

    await act(async () => {
      // Tres toques seguidos, antes de que llegue la respuesta.
      refreshControl()?.props.onRefresh();
      refreshControl()?.props.onRefresh();
      refreshControl()?.props.onRefresh();
    });
    await settle();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('si la recarga falla: aviso suave, y lo que se veía sigue', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const repos = await signedIn('docente@gameup.test');
    jest
      .spyOn(repos.reviews, 'listPendingSummary')
      .mockResolvedValueOnce([newSubmission])
      .mockRejectedValueOnce(new Error('sin red'))
      .mockResolvedValueOnce([newSubmission]);
    await renderInbox(repos);
    expect(screen.getByText('Martín C.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Actualizar' }));
    await settle();
    expect(screen.getByText('No pudimos actualizar')).toBeOnTheScreen();
    expect(screen.getByText('Martín C.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    await settle();
    expect(screen.queryByText('No pudimos actualizar')).toBeNull();
    warn.mockRestore();
  });
});

describe('pantallas del niño', () => {
  it('se pueden deslizar para recargar, pero no tienen botón «Actualizar»', async () => {
    const repos = await signedIn('estudiante@gameup.test');
    await render(
      <RepositoryProvider repositories={repos}>
        <StudentHome />
      </RepositoryProvider>,
    );
    await settle();
    expect(refreshControl()).toBeDefined();
    expect(screen.queryByTestId('header-refresh')).toBeNull();
  });
});

describe('revisión del estudiante: no se recarga sola en medio de algo', () => {
  async function renderQueue(repos: Repositories) {
    await render(
      <RepositoryProvider repositories={repos}>
        <ReviewQueueView title="Por revisar" studentId={mockStudent.id} />
      </RepositoryProvider>,
    );
    await settle();
  }

  it('con una indicación escrita sin enviar, espera; al borrarla, recarga', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await signedIn('docente@gameup.test');
    const list = jest.spyOn(repos.reviews, 'listPendingReviews');
    await renderQueue(repos);
    const before = list.mock.calls.length;

    // Abre «Practicar más» en una actividad que no exige escuchar antes.
    const practice = screen
      .getAllByRole('button', { name: 'Practicar más' })
      .find((button) => !button.props.accessibilityState?.disabled);
    if (!practice) throw new Error('No hay una actividad para practicar más');
    await user.press(practice);
    await user.type(screen.getByTestId('feedback-input'), 'Repetir con calma');

    await appGoesAwayAndBack();
    expect(list.mock.calls.length).toBe(before);

    await user.clear(screen.getByTestId('feedback-input'));
    await settle();
    expect(list.mock.calls.length).toBe(before + 1);
  });

  it('con una indicación sin enviar, deslizar sí recarga', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await signedIn('docente@gameup.test');
    const list = jest.spyOn(repos.reviews, 'listPendingReviews');
    await renderQueue(repos);
    const before = list.mock.calls.length;

    const practice = screen
      .getAllByRole('button', { name: 'Practicar más' })
      .find((button) => !button.props.accessibilityState?.disabled);
    if (!practice) throw new Error('No hay una actividad para practicar más');
    await user.press(practice);
    await user.type(screen.getByTestId('feedback-input'), 'Otra vez');

    await act(async () => refreshControl()?.props.onRefresh());
    await settle();
    expect(list.mock.calls.length).toBe(before + 1);
  });
});
