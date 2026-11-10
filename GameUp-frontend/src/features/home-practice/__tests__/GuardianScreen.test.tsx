import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useVideoPlayer } from 'expo-video';
import GuardianPracticeScreen from '@/app/guardian/index';
import { NoLinkedStudentsError } from '@/data/guardianErrors';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import type { WeeklyPractice } from '@/data/types';
import { VIDEO_CREDIT, vowelVideos } from '@/features/speak/vowelVideos';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), canGoBack: jest.fn(() => false) },
  useIsFocused: () => true,
}));
jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

const student = (id: string, name: string) => ({
  id,
  displayName: name,
  initials: name.slice(0, 2).toUpperCase(),
});

/** Semana como la arma la API, sin sonido asignado y con retroalimentación. */
function apiWeek(id: string, name: string): WeeklyPractice {
  return {
    student: student(id, name),
    vowel: null,
    teacherNote: { text: 'Practiquen frente al espejo.', audioUri: null },
    practicedToday: false,
    days: [
      { date: '2026-11-02', practiced: true },
      { date: '2026-11-03', practiced: true },
    ],
    feedback: [
      {
        activityId: '3',
        title: 'Busca la boca',
        gameId: 'findMouth',
        status: 'rejected',
        text: 'Mira otra vez el gesto.',
      },
      {
        activityId: '7',
        title: 'Parejas de vocales',
        gameId: 'memory',
        status: 'validated',
        text: '¡Muy bien!',
      },
    ],
  };
}

async function renderScreen(repositories: Repositories) {
  await render(
    <RepositoryProvider repositories={repositories}>
      <GuardianPracticeScreen />
    </RepositoryProvider>,
  );
  await settle();
}

describe('«Practicar en casa» con la API', () => {
  beforeEach(() => {
    jest.mocked(router.replace).mockClear();
  });

  it('sin sonido asignado lo dice, y muestra la nota, la retroalimentación y los días', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.guardians.getWeeklyPractice = () =>
      Promise.resolve(apiWeek('5', 'Estrella P.'));

    await renderScreen(repositories);

    expect(
      screen.getByText('Estrella · esta semana: sin sonido asignado'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Así lo practican')).toBeNull();
    expect(screen.getByText('Practiquen frente al espejo.')).toBeOnTheScreen();
    expect(screen.getByText('Mira otra vez el gesto.')).toBeOnTheScreen();
    expect(screen.getByText('Practicar más')).toBeOnTheScreen();
    expect(screen.getByText('Lo logró')).toBeOnTheScreen();
    expect(
      screen.getByText('Esta semana practicaron 2 días.'),
    ).toBeOnTheScreen();
  });

  it('con sonido asignado, ▶ muestra el video de la profe', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.guardians.getWeeklyPractice = () =>
      Promise.resolve({ ...apiWeek('5', 'Estrella P.'), vowel: 'o' });
    const user = userEvent.setup();

    await renderScreen(repositories);
    expect(screen.getByText('Mira cómo lo hace la profe')).toBeOnTheScreen();
    await user.press(
      screen.getByRole('button', { name: 'Ver cómo lo hace la profe' }),
    );

    expect(
      screen.getByLabelText('La profe Consuelo hace el gesto de la O'),
    ).toBeOnTheScreen();
    expect(screen.getByText(VIDEO_CREDIT)).toBeOnTheScreen();
    expect(screen.queryByText(/Muy pronto/)).toBeNull();
  });

  it('al cambiar a un estudiante con otra vocal, carga el video de esa vocal', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.guardians.listStudents = () =>
      Promise.resolve([student('5', 'Estrella P.'), student('9', 'Luna R.')]);
    repositories.guardians.getWeeklyPractice = (_g: string, id?: string) =>
      Promise.resolve(
        id === '9'
          ? { ...apiWeek('9', 'Luna R.'), vowel: 'u' }
          : { ...apiWeek('5', 'Estrella P.'), vowel: 'a' },
      );
    const user = userEvent.setup();

    await renderScreen(repositories);
    await user.press(
      screen.getByRole('button', { name: 'Ver cómo lo hace la profe' }),
    );
    expect(
      screen.getByLabelText('La profe Consuelo hace el gesto de la A'),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Luna' }));
    await settle();

    // Tarjeta nueva (key={vowel}): vuelve al ▶ y luego muestra la U.
    expect(
      screen.queryByLabelText('La profe Consuelo hace el gesto de la A'),
    ).toBeNull();
    await user.press(
      screen.getByRole('button', { name: 'Ver cómo lo hace la profe' }),
    );
    expect(
      screen.getByLabelText('La profe Consuelo hace el gesto de la U'),
    ).toBeOnTheScreen();
    expect(jest.mocked(useVideoPlayer)).toHaveBeenLastCalledWith(
      vowelVideos.u,
      expect.any(Function),
    );
  });

  it('con varios estudiantes, elige a quién ver', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.guardians.listStudents = () =>
      Promise.resolve([student('5', 'Estrella P.'), student('9', 'Luna R.')]);
    const getWeek = jest.fn((_guardianId: string, studentId?: string) =>
      Promise.resolve(
        studentId === '9'
          ? apiWeek('9', 'Luna R.')
          : apiWeek('5', 'Estrella P.'),
      ),
    );
    repositories.guardians.getWeeklyPractice = getWeek;
    const user = userEvent.setup();

    await renderScreen(repositories);
    await user.press(screen.getByRole('button', { name: 'Luna' }));
    await settle();

    expect(getWeek).toHaveBeenLastCalledWith(expect.any(String), '9');
    expect(
      screen.getByText('Luna · esta semana: sin sonido asignado'),
    ).toBeOnTheScreen();
  });

  it('sin niños vinculados: estado vacío amable y «Cerrar sesión» visible', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.guardians.listStudents = () => Promise.resolve([]);
    repositories.guardians.getWeeklyPractice = () =>
      Promise.reject(new NoLinkedStudentsError());
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await renderScreen(repositories);

    expect(
      screen.getByText('Aún no tienes niños vinculados'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Pide a la Fundación que te vincule en ASISCO UP y vuelve a entrar.',
      ),
    ).toBeOnTheScreen();
    // No parece un fallo de red.
    expect(screen.queryByText('No pudimos cargar la práctica')).toBeNull();
    expect(screen.queryByText('Revisa la conexión.')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeOnTheScreen();
    warn.mockRestore();
  });

  it('«Cerrar sesión» olvida la sesión y vuelve a «Iniciar sesión»', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const signOut = jest.spyOn(repositories.auth, 'signOut');
    const user = userEvent.setup();

    await renderScreen(repositories);
    await user.press(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await settle();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/login');
  });
});
