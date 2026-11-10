import { act, fireEvent, render, screen } from '@testing-library/react-native';
import DirectorReviewScreen from '@/app/director/(tabs)/review';
import DirectorStudentsScreen from '@/app/director/(tabs)/index';
import DirectorStudentReviewScreen from '@/app/director/student/[id]/review';
import TeacherReviewScreen from '@/app/teacher/(tabs)/index';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: jest.fn(() => false),
  },
  useLocalSearchParams: jest.fn(() => ({
    id: 'est-demo-004',
    name: 'Lucía R.',
  })),
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

async function renderWith(element: React.ReactElement, repos: Repositories) {
  await render(
    <RepositoryProvider repositories={repos}>{element}</RepositoryProvider>,
  );
  await settle();
}

describe('pantallas de la directora', () => {
  it('«Por validar» es la lista de estudiantes de todos, sin el aviso de gestos de la tallerista', async () => {
    await renderWith(<DirectorReviewScreen />, await asDirector());

    expect(screen.getByText('Por validar')).toBeOnTheScreen();
    expect(screen.queryByText('Gestos de la fundación')).toBeNull();
    expect(
      screen.getByRole('button', {
        name: 'Lucía R., 1 actividad por revisar',
      }),
    ).toBeOnTheScreen();
  });

  it('«Por validar» de un estudiante muestra solo sus actividades', async () => {
    await renderWith(<DirectorStudentReviewScreen />, await asDirector());

    expect(screen.getByText('Por validar · Lucía R.')).toBeOnTheScreen();
    expect(screen.queryByText(/Martín C\./)).toBeNull();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeOnTheScreen();
  });

  it('«Por escuchar» de la tallerista conserva el aviso de gestos', async () => {
    await renderWith(
      <TeacherReviewScreen />,
      createMockRepositories({ delayMs: 0 }),
    );

    expect(screen.getByText('Por escuchar')).toBeOnTheScreen();
    expect(screen.getByText('Gestos de la fundación')).toBeOnTheScreen();
  });

  it('«Estudiantes» muestra a todos y busca por nombre', async () => {
    await renderWith(<DirectorStudentsScreen />, await asDirector());

    expect(screen.getByText('Lucía R.')).toBeOnTheScreen();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('buscar-estudiante'), 'lucia');
    });
    await settle();
    expect(screen.getByText('Lucía R.')).toBeOnTheScreen();
    expect(screen.queryByText('Martín C.')).toBeNull();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('buscar-estudiante'), 'zzz');
    });
    expect(
      screen.getByText('No encontramos a nadie con ese nombre'),
    ).toBeOnTheScreen();
  });
});
