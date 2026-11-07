import { act, render, screen } from '@testing-library/react-native';
import TeacherReviewScreen from '@/app/teacher/(tabs)/index';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: jest.fn(() => false),
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

/**
 * «Por escuchar» se movió a `teacher/(tabs)/index.tsx`: la pantalla real
 * sigue mostrando lo mismo que antes, con «Cerrar sesión».
 */
describe('«Por escuchar» en su nueva ruta', () => {
  it('muestra los pendientes del docente y «Cerrar sesión»', async () => {
    await render(
      <RepositoryProvider repositories={createMockRepositories({ delayMs: 0 })}>
        <TeacherReviewScreen />
      </RepositoryProvider>,
    );
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(screen.getByText('Por escuchar')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeOnTheScreen();
    expect(screen.queryByText('No pudimos cargar las actividades')).toBeNull();
  });
});
