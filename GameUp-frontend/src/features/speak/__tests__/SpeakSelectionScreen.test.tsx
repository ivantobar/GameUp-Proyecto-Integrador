import { act, render, screen } from '@testing-library/react-native';
import SpeakSelectionScreen from '@/app/student/speak/index';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));
jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

/** Habla conmigo · selección: en el MVP solo hay vocales, sin pestañas. */
describe('selección de sonido de Habla conmigo', () => {
  it('muestra las cinco vocales y ninguna pestaña de sílabas o palabras', async () => {
    await render(
      <RepositoryProvider repositories={createMockRepositories({ delayMs: 0 })}>
        <SpeakSelectionScreen />
      </RepositoryProvider>,
    );
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    ['A', 'E', 'I', 'O', 'U'].forEach((letter) => {
      expect(
        screen.getByRole('button', { name: new RegExp(`^${letter}\\. `) }),
      ).toBeOnTheScreen();
    });
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(screen.queryByText('Sílabas')).toBeNull();
    expect(screen.queryByText('Palabras')).toBeNull();
  });
});
