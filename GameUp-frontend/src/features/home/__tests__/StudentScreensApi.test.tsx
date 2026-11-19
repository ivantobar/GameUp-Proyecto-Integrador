import type { JSX, ReactNode } from 'react';
import { act, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import GamesScreen from '@/app/student/(tabs)/games';
import StudentHome from '@/app/student/(tabs)/index';
import ProgressScreen from '@/app/student/(tabs)/progress';
import LevelsScreen from '@/app/student/levels';
import TasksScreen from '@/app/student/tasks';
import { createHttpRepositories } from '@/data/http/createHttpRepositories';
import { createMemoryTokenStore } from '@/data/http/tokenStore';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import { createApiClient } from '@/services/api';
import { createFakeBackend, FAKE_API_URL } from '@/test-utils/fakeBackend';

jest.setTimeout(120000);

/**
 * Pantallas del estudiante con los repositorios HTTP REALES (cliente de la
 * API, DTO y mappers) contra el backend falso, que responde con la forma de
 * la API. Comprueba que el rediseño no rompe nada con datos de la API, no
 * solo con los datos simulados.
 */
async function openAsStudent(Screen: () => JSX.Element) {
  const backend = createFakeBackend();
  const tokens = createMemoryTokenStore(
    'token-de-prueba:estudiante@gameup.test',
  );
  const api = createApiClient({
    baseUrl: FAKE_API_URL,
    getToken: tokens.get,
    fetchFn: backend.fetchFn,
  });
  const repositories = createHttpRepositories(api, tokens);
  await renderRouter(
    { pantalla: Screen },
    {
      initialUrl: '/pantalla',
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
  // De verdad pasó por la API (no por los datos simulados).
  expect(backend.requests.length).toBeGreaterThan(0);
  expect(screen.queryByText('Vamos a intentarlo otra vez')).toBeNull();
}

describe('pantallas del estudiante con datos de la API', () => {
  it('Inicio: saludo y la tarea de la profe o los accesos', async () => {
    await openAsStudent(StudentHome);
    expect(screen.getByText(/^¡Hola, /)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Juegos\./ })).toBeOnTheScreen();
  });

  it('Juegos: las dos opciones', async () => {
    await openAsStudent(GamesScreen);
    expect(screen.getByText('¿Qué quieres hacer?')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: /^Tareas de mi profe/ }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: /^Jugar por niveles/ }),
    ).toBeOnTheScreen();
  });

  it('Jugar por niveles: cada juego de pensar con sus estrellas', async () => {
    await openAsStudent(LevelsScreen);
    expect(screen.getByText('¿A qué quieres jugar?')).toBeOnTheScreen();
    expect(
      screen.getAllByTestId('level-stars', { includeHiddenElements: true }),
    ).toHaveLength(4);
  });

  it('Tareas de mi profe: un tema por módulo, o «Hoy no tienes tareas»', async () => {
    await openAsStudent(TasksScreen);
    const withTasks = screen.queryByText('¿Qué tema quieres hacer?');
    const empty = screen.queryByText('Hoy no tienes tareas');
    expect(withTasks ?? empty).toBeOnTheScreen();
  });

  it('Mi progreso: cada tema con su porcentaje', async () => {
    await openAsStudent(ProgressScreen);
    expect(screen.getByText('Mi progreso')).toBeOnTheScreen();
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
  });
});
