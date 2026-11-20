import { act, render, screen } from '@testing-library/react-native';
import ProgressScreen from '@/app/student/(tabs)/progress';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import {
  ConnectionError,
  ForbiddenError,
  ServerError,
} from '@/services/apiErrors';
import { LoadErrorState } from '../LoadErrorState';

jest.mock('expo-router', () => ({
  // La pantalla está visible (recarga al volver la app al frente).
  useIsFocused: () => true,
  router: { replace: jest.fn(), navigate: jest.fn() },
}));
jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

const NO_ACCESS = 'No tienes acceso a esta pantalla';

describe('LoadErrorState', () => {
  it('ante un 403 dice que no tiene acceso y no ofrece reintentar', async () => {
    await render(
      <LoadErrorState
        error={new ForbiddenError()}
        title="No pudimos cargar a los estudiantes"
        message="Revisa la conexión."
        action={{ label: 'Intentar de nuevo', onPress: jest.fn() }}
      />,
    );

    expect(screen.getByText(NO_ACCESS)).toBeOnTheScreen();
    expect(screen.queryByText('Revisa la conexión.')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Intentar de nuevo' }),
    ).toBeNull();
  });

  it.each([
    ['sin red', new ConnectionError()],
    ['servidor caído', new ServerError('caído', 500)],
    ['sin detalle', undefined],
  ])(
    'con otro error (%s) muestra su texto y «Intentar de nuevo»',
    async (_name, error) => {
      await render(
        <LoadErrorState
          error={error}
          title="No pudimos cargar a los estudiantes"
          message="Revisa la conexión."
          action={{ label: 'Intentar de nuevo', onPress: jest.fn() }}
        />,
      );

      expect(
        screen.getByText('No pudimos cargar a los estudiantes'),
      ).toBeOnTheScreen();
      expect(
        screen.getByRole('button', { name: 'Intentar de nuevo' }),
      ).toBeOnTheScreen();
      expect(screen.queryByText(NO_ACCESS)).toBeNull();
    },
  );
});

describe('una pantalla real ante un 403 del backend', () => {
  it('«Mi progreso» dice que no tiene acceso, no «Vamos a intentarlo otra vez»', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.progress.getOfficialProgress = () =>
      Promise.reject(new ForbiddenError());
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await render(
      <RepositoryProvider repositories={repositories}>
        <ProgressScreen />
      </RepositoryProvider>,
    );
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(screen.getByText(NO_ACCESS)).toBeOnTheScreen();
    expect(screen.queryByText('Vamos a intentarlo otra vez')).toBeNull();
    warn.mockRestore();
  });
});
