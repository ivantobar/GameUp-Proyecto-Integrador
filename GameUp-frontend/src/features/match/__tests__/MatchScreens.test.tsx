import type { ReactNode } from 'react';
import { act, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import MatchDone from '@/app/student/match/done';
import MatchScreen from '@/app/student/match/index';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';

// Cargar el router real la primera vez (sin caché de Babel) puede tardar
// más que el límite común de 30 s.
jest.setTimeout(90000);

/**
 * Pantallas reales de Emparejar con el router real: el `actividadId` de la
 * ruta llega al juego y la pantalla final dice lo que corresponde. El envío
 * al terminar se prueba en `useGameFinish.test.tsx` (en el SDK 58 la
 * navegación imperativa va en una cola que Jest no procesa con el reloj
 * simulado).
 */
async function renderAt(url: string, repositories: Repositories) {
  await renderRouter(
    {
      'student/match/index': MatchScreen,
      'student/match/done': MatchDone,
    },
    {
      initialUrl: url,
      wrapper: ({ children }: { children: ReactNode }) => (
        <RepositoryProvider repositories={repositories}>
          {children}
        </RepositoryProvider>
      ),
    },
  );
  await act(async () => {
    await jest.runAllTimersAsync();
  });
}

describe('Emparejar abierto desde una tarea', () => {
  it('pide la actividad de la ruta y juega sus rondas', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const getActivity = jest
      .spyOn(repositories.activities, 'getActivity')
      .mockResolvedValue({
        activityId: '20',
        gameId: 'match',
        title: 'Emparejar',
        rounds: [
          {
            id: 'r0',
            question: '¿Cuál es igual al sol?',
            prompt: { id: 'r0-e', label: 'sol', text: 'sol' },
            options: [
              { id: 'r0-o0', label: 'luna', text: 'luna' },
              { id: 'r0-o1', label: 'sol', text: 'sol' },
            ],
            answerId: 'r0-o1',
          },
        ],
      });

    await renderAt('/student/match?actividadId=20', repositories);

    expect(getActivity).toHaveBeenCalledWith('20');
    expect(screen.getByText('¿Cuál es igual al sol?')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'luna' })).toBeOnTheScreen();
  });

  it('si la actividad no es de este juego, ofrece intentarlo de nuevo', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    jest.spyOn(repositories.activities, 'getActivity').mockResolvedValue({
      activityId: '8',
      gameId: 'speak',
      title: 'Di la a',
      vowel: 'a',
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await renderAt('/student/match?actividadId=8', repositories);

    expect(screen.getByText('Vamos a intentarlo otra vez')).toBeOnTheScreen();
    warn.mockRestore();
  });
});

describe('pantalla final de los juegos de «Pensar y recordar»', () => {
  const repositories = createMockRepositories({ delayMs: 0 });

  it('si llegó al docente, lo dice', async () => {
    await renderAt('/student/match/done?envio=review', repositories);
    expect(
      screen.getByText(
        'Tu profe va a revisar tu juego antes de sumarlo a tu progreso',
      ),
    ).toBeOnTheScreen();
  });

  it('juego libre: no habla de la profe', async () => {
    await renderAt('/student/match/done?envio=practice', repositories);
    expect(
      screen.getByText('Sigue practicando cuando quieras'),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/Tu profe/)).toBeNull();
  });

  it('si no se pudo enviar: celebra igual y avisa solo al adulto', async () => {
    await renderAt('/student/match/done?envio=notSent', repositories);
    expect(screen.getByText('¡Lo lograste!')).toBeOnTheScreen();
    expect(
      screen.getByText(/Para el adulto: no pudimos enviar/),
    ).toBeOnTheScreen();
  });
});
