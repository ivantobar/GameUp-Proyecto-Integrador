import type { ReactNode } from 'react';
import { act, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import FindMouthDone from '@/app/student/find-mouth/done';
import FindMouthScreen from '@/app/student/find-mouth/index';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';

// Cargar el router real la primera vez (sin caché de Babel) puede tardar
// más que el límite común de 30 s.
jest.setTimeout(90000);

/**
 * Pantallas reales de «Busca la boca» con el router real: el `actividadId`
 * de la ruta llega al juego y la pantalla final dice lo que corresponde.
 */
async function renderAt(url: string, repositories: Repositories) {
  await renderRouter(
    {
      'student/find-mouth/index': FindMouthScreen,
      'student/find-mouth/done': FindMouthDone,
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

describe('Busca la boca abierto desde una tarea', () => {
  it('pide la actividad de la ruta y juega solo sus vocales', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const getActivity = jest
      .spyOn(repositories.activities, 'getActivity')
      .mockResolvedValue({
        activityId: '9',
        gameId: 'findMouth',
        title: 'Busca la boca',
        vowels: ['a', 'o'],
      });

    await renderAt('/student/find-mouth?actividadId=9', repositories);

    expect(getActivity).toHaveBeenCalledWith('9');
    expect(screen.getByText('¿Qué boca hace este sonido?')).toBeOnTheScreen();
    // Una ronda por vocal de la actividad: 2 puntos de avance.
    expect(screen.getByLabelText('Vas en la 1 de 2')).toBeOnTheScreen();
  });

  it('si la actividad no carga, ofrece intentarlo de nuevo (sin error técnico)', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    jest
      .spyOn(repositories.activities, 'getActivity')
      .mockRejectedValue(new Error('sin red'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await renderAt('/student/find-mouth?actividadId=9', repositories);

    expect(screen.getByText('Vamos a intentarlo otra vez')).toBeOnTheScreen();
    expect(screen.queryByText(/sin red/)).toBeNull();
    warn.mockRestore();
  });
});

describe('pantalla final de Busca la boca', () => {
  const repositories = createMockRepositories({ delayMs: 0 });

  it('si llegó al docente, lo dice', async () => {
    await renderAt('/student/find-mouth/done?envio=review', repositories);
    expect(
      screen.getByText(
        'Tu profe va a revisar tu juego antes de sumarlo a tu progreso',
      ),
    ).toBeOnTheScreen();
  });

  it('juego libre: no habla de la profe', async () => {
    await renderAt('/student/find-mouth/done?envio=practice', repositories);
    expect(
      screen.getByText('Sigue practicando cuando quieras'),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/Tu profe/)).toBeNull();
    expect(screen.queryByText(/Para el adulto/)).toBeNull();
  });

  it('si no se pudo enviar: celebra igual y avisa solo al adulto', async () => {
    await renderAt(
      '/student/find-mouth/done?envio=notSent&vocales=2',
      repositories,
    );
    expect(screen.getByText('¡Lo lograste!')).toBeOnTheScreen();
    expect(screen.getByText('Escuchaste las 2 vocales')).toBeOnTheScreen();
    expect(
      screen.getByText(/Para el adulto: no pudimos enviar/),
    ).toBeOnTheScreen();
  });
});
