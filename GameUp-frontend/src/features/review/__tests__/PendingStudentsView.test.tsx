import {
  act,
  render,
  screen,
  userEvent,
  within,
} from '@testing-library/react-native';
import { router } from 'expo-router';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD, mockStudent, mockTeacher } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { PendingStudentsView } from '@/features/review/components/PendingStudentsView';
import { directorRoutes, teacherRoutes } from '@/features/students/staffRoutes';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));
/** «Volver a la pestaña» = llamar a lo que registró con useRefreshOnFocus. */
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

async function focusAgain() {
  const calls = jest.mocked(useRefreshOnFocus).mock.calls;
  const onFocus = calls[calls.length - 1]?.[0];
  if (!onFocus) throw new Error('La pantalla no registró el foco');
  await act(async () => {
    onFocus();
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

async function renderList(
  repos: Repositories,
  routes = teacherRoutes,
  showGestureNotice?: boolean,
) {
  await render(
    <RepositoryProvider repositories={repos}>
      <PendingStudentsView
        routes={routes}
        showGestureNotice={showGestureNotice}
      />
    </RepositoryProvider>,
  );
  await settle();
}

/** Nombres de las tarjetas, en orden. */
const cardNames = () =>
  screen
    .getAllByRole('button', { name: /actividad(es)? por revisar$/ })
    .map((card) => card.props.accessibilityLabel as string);

describe('«Por revisar»: primero se elige el estudiante', () => {
  beforeEach(() => {
    jest.mocked(useRefreshOnFocus).mockClear();
    jest.mocked(router.push).mockClear();
  });

  it('una tarjeta por estudiante con pendientes, primero quien más espera', async () => {
    await renderList(await signedIn('docente@gameup.test'));

    expect(screen.getByText('Por revisar')).toBeOnTheScreen();
    expect(
      screen.getByRole('header', { name: '3 estudiantes esperan' }),
    ).toBeOnTheScreen();
    expect(cardNames()).toEqual([
      'Samuel O., 1 actividad por revisar',
      'Valentina G., 1 actividad por revisar',
      'Martín C., 1 actividad por revisar',
    ]);
    // Lucía no está a cargo de la docente.
    expect(screen.queryByText('Lucía R.')).toBeNull();
    expect(screen.getByText('Gestos de la fundación')).toBeOnTheScreen();
  });

  it('la tarjeta muestra iniciales, nombre y cuántas actividades', async () => {
    await renderList(await signedIn('docente@gameup.test'));

    const card = screen.getByRole('button', {
      name: 'Martín C., 1 actividad por revisar',
    });
    expect(
      within(card).getByText('MC', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    expect(within(card).getByText('Martín C.')).toBeOnTheScreen();
    expect(within(card).getByText('1 actividad por revisar')).toBeOnTheScreen();
    expect(within(card).getByText(/^Espera desde/)).toBeOnTheScreen();
  });

  it('al tocar un estudiante abre solo sus actividades', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderList(await signedIn('docente@gameup.test'));

    await user.press(
      screen.getByRole('button', {
        name: 'Martín C., 1 actividad por revisar',
      }),
    );

    expect(router.push).toHaveBeenCalledWith(
      teacherRoutes.review(mockStudent.id, 'Martín C.'),
    );
  });

  it('al volver de un estudiante, se recarga: quien quedó al día desaparece', async () => {
    const repos = await signedIn('docente@gameup.test');
    await renderList(repos);

    const pending = repos.reviews.listPendingReviews(
      mockTeacher.id,
      mockStudent.id,
    );
    await settle();
    const [martin] = await pending;
    const validated = repos.reviews.validate(martin!.id);
    await settle();
    await validated;

    await focusAgain();

    expect(screen.queryByText('Martín C.')).toBeNull();
    expect(
      screen.getByRole('header', { name: '2 estudiantes esperan' }),
    ).toBeOnTheScreen();
  });

  it('sin pendientes: «No hay nada por revisar»', async () => {
    const repos = await signedIn('docente@gameup.test');
    repos.reviews.listPendingSummary = () => Promise.resolve([]);
    await renderList(repos);

    expect(
      screen.getByRole('header', { name: 'Todo revisado' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('No hay nada por revisar')).toBeOnTheScreen();
  });

  it('si falla, ofrece intentar de nuevo', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const repos = await signedIn('docente@gameup.test');
    repos.reviews.listPendingSummary = () =>
      Promise.reject(new Error('sin red'));
    await renderList(repos);

    expect(
      screen.getByText('No pudimos cargar las actividades'),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Intentar de nuevo' }),
    ).toBeOnTheScreen();
  });

  it('la directora ve a los estudiantes de todos, sin el aviso de gestos', async () => {
    await renderList(
      await signedIn('directora@gameup.test'),
      directorRoutes,
      false,
    );

    expect(screen.getByText('Por validar')).toBeOnTheScreen();
    expect(cardNames()[0]).toBe('Lucía R., 1 actividad por revisar');
    expect(cardNames()).toHaveLength(4);
    expect(screen.queryByText('Gestos de la fundación')).toBeNull();
  });
});
