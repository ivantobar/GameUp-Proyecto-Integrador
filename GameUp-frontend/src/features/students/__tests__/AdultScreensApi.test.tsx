import type { JSX, ReactNode } from 'react';
import { act, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import DirectorStudentsScreen from '@/app/director/(tabs)/index';
import DirectorReviewScreen from '@/app/director/(tabs)/review';
import DirectorSummaryScreen from '@/app/director/(tabs)/summary';
import GuardianPracticeScreen from '@/app/guardian/index';
import TeacherReviewScreen from '@/app/teacher/(tabs)/index';
import TeacherStudentsScreen from '@/app/teacher/(tabs)/students';
import TeacherStudentScreen from '@/app/teacher/student/[id]/index';
import TeacherStudentReviewScreen from '@/app/teacher/student/[id]/review';
import { AdultSurfaces } from '@/components/ui';
import { createHttpRepositories } from '@/data/http/createHttpRepositories';
import { createMemoryTokenStore } from '@/data/http/tokenStore';
import { mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import { createApiClient } from '@/services/api';
import { createFakeBackend, FAKE_API_URL } from '@/test-utils/fakeBackend';

jest.setTimeout(120000);

const ERROR_TITLES = [
  'No pudimos cargar a los estudiantes',
  'No pudimos cargar las actividades',
  'No pudimos cargar el resumen',
  'No pudimos cargar la práctica',
  'No tienes acceso a esta pantalla',
];

/**
 * Pantallas de los adultos con los repositorios HTTP REALES (cliente de la
 * API, DTO y mappers) contra el backend falso, con la sesión de cada rol y
 * dentro de `AdultSurfaces`, como en la app.
 */
async function openAs(
  email: string,
  Screen: () => JSX.Element,
  url = '/pantalla',
) {
  const backend = createFakeBackend();
  const tokens = createMemoryTokenStore(`token-de-prueba:${email}`);
  const api = createApiClient({
    baseUrl: FAKE_API_URL,
    getToken: tokens.get,
    fetchFn: backend.fetchFn,
  });
  const repositories = createHttpRepositories(api, tokens);
  await renderRouter(
    { pantalla: Screen, 'pantalla/[id]': Screen },
    {
      initialUrl: url,
      wrapper: ({ children }: { children: ReactNode }) => (
        <RepositoryProvider repositories={repositories}>
          <AdultSurfaces>{children}</AdultSurfaces>
        </RepositoryProvider>
      ),
    },
  );
  await act(async () => {
    await jest.runAllTimersAsync();
  });
  // De verdad pasó por la API, y la pantalla no cayó en error.
  expect(backend.requests.length).toBeGreaterThan(0);
  ERROR_TITLES.forEach((title) => {
    expect(screen.queryByText(title)).toBeNull();
  });
}

const TEACHER = 'docente@gameup.test';
const DIRECTOR = 'directora@gameup.test';
const GUARDIAN = 'acudiente@gameup.test';

describe('pantallas de la tallerista con datos de la API', () => {
  it('Por revisar: estudiantes con su cantidad, o «No hay nada por revisar»', async () => {
    await openAs(TEACHER, TeacherReviewScreen);
    const students = screen.queryAllByRole('button', {
      name: /actividad/,
    });
    const empty = screen.queryByText('No hay nada por revisar');
    expect(students.length > 0 || empty !== null).toBe(true);
  });

  it('Mis estudiantes: la lista con su progreso', async () => {
    await openAs(TEACHER, TeacherStudentsScreen);
    expect(screen.getByText('Mis estudiantes')).toBeOnTheScreen();
    expect(
      screen.getAllByRole('button', { name: /Progreso|progreso/ }).length,
    ).toBeGreaterThan(0);
  });

  it('detalle de un estudiante', async () => {
    await openAs(TEACHER, TeacherStudentScreen, `/pantalla/${mockStudent.id}`);
    expect(screen.getByText('Asignaciones')).toBeOnTheScreen();
  });

  it('revisión de un estudiante: sus actividades o «Revisaste todo»', async () => {
    await openAs(
      TEACHER,
      TeacherStudentReviewScreen,
      `/pantalla/${mockStudent.id}`,
    );
    const pending = screen.queryAllByRole('button', {
      name: /^Revisar la actividad de /,
    });
    const done = screen.queryByText(/^Revisaste todo/);
    // La primera tarjeta se abre sola (sin botón «Revisar»), así que basta
    // con ver «Lo logró» o el aviso de que no queda nada.
    const decide = screen.queryAllByRole('button', { name: 'Lo logró' });
    expect(pending.length + decide.length > 0 || done !== null).toBe(true);
  });
});

describe('pantallas de la directora con datos de la API', () => {
  it('Estudiantes: buscador y lista', async () => {
    await openAs(DIRECTOR, DirectorStudentsScreen);
    expect(screen.getByText('Estudiantes')).toBeOnTheScreen();
    expect(screen.getByTestId('buscar-estudiante')).toBeOnTheScreen();
  });

  it('Por validar', async () => {
    await openAs(DIRECTOR, DirectorReviewScreen);
    const students = screen.queryAllByRole('button', { name: /actividad/ });
    const empty = screen.queryByText('No hay nada por revisar');
    expect(students.length > 0 || empty !== null).toBe(true);
  });

  it('Resumen: las cinco cifras', async () => {
    await openAs(DIRECTOR, DirectorSummaryScreen);
    for (const key of [
      'students',
      'pendingReviews',
      'inProgress',
      'assigned',
      'completed',
    ]) {
      expect(screen.getByTestId(`resumen-${key}`)).toBeOnTheScreen();
    }
  });
});

describe('acudiente con datos de la API', () => {
  it('Practicar en casa: el sonido de la semana y los días', async () => {
    // La pantalla pregunta si hay a dónde volver mientras se dibuja; el
    // router de prueba aún no está listo en ese primer dibujo. Como en la
    // app recién iniciada la sesión: no hay pantalla anterior.
    const canGoBack = jest.spyOn(router, 'canGoBack').mockReturnValue(false);
    await openAs(GUARDIAN, GuardianPracticeScreen);
    canGoBack.mockRestore();
    expect(screen.getByText(/· esta semana: /)).toBeOnTheScreen();
    expect(screen.getByText('Días que practicaron')).toBeOnTheScreen();
  });
});
