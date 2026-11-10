import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import TeacherReviewScreen from '@/app/teacher/(tabs)/index';
import TeacherStudentReviewScreen from '@/app/teacher/student/[id]/review';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: jest.fn(() => false),
  },
  // El estudiante de ejemplo (mockStudent): Martín C.
  useLocalSearchParams: jest.fn(() => ({ id: 'est-demo-001' })),
}));
jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

async function renderScreen(element: React.ReactElement) {
  await render(
    <RepositoryProvider repositories={createMockRepositories({ delayMs: 0 })}>
      {element}
    </RepositoryProvider>,
  );
  await act(async () => {
    await jest.runAllTimersAsync();
  });
}

/**
 * «Por escuchar» (`teacher/(tabs)/index.tsx`): primero la lista de
 * estudiantes, con «Cerrar sesión»; cada uno abre
 * `teacher/student/[id]/review` con solo sus actividades.
 */
describe('«Por escuchar» de la tallerista', () => {
  it('la pestaña muestra a sus estudiantes con pendientes y «Cerrar sesión»', async () => {
    await renderScreen(<TeacherReviewScreen />);

    expect(screen.getByText('Por escuchar')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {
        name: 'Martín C., 1 actividad por revisar',
      }),
    ).toBeOnTheScreen();
    expect(screen.queryByText('No pudimos cargar las actividades')).toBeNull();
  });

  it('la ruta del estudiante muestra solo sus actividades y vuelve atrás', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderScreen(<TeacherStudentReviewScreen />);

    expect(mockStudent.id).toBe('est-demo-001');
    // Sin `name` en la ruta, el título lo toma de sus actividades.
    expect(screen.getByText('Por escuchar · Martín C.')).toBeOnTheScreen();
    expect(screen.queryByText(/Valentina G\./)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Volver' }));
    expect(router.back).toHaveBeenCalled();
  });
});
