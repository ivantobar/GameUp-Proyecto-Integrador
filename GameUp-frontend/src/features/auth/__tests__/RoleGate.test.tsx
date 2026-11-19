import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { act, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import DirectorLayout from '@/app/director/_layout';
import GuardianLayout from '@/app/guardian/_layout';
import StudentLayout from '@/app/student/_layout';
import TeacherLayout from '@/app/teacher/_layout';
import type { AuthSession, UserRole } from '@/data/types';
import { roleRedirect } from '../RoleGate';
import { SessionProvider } from '../SessionProvider';

// Cargar el router real la primera vez puede tardar más de 30 s.
jest.setTimeout(90000);

const sessionOf = (role: UserRole): AuthSession => ({
  userId: `u-${role}`,
  role,
  displayName: 'Prueba',
});

describe('roleRedirect: a dónde lleva cada espacio', () => {
  const roles: UserRole[] = ['student', 'teacher', 'guardian', 'director'];
  const homes: Record<UserRole, string> = {
    student: '/student',
    teacher: '/teacher',
    guardian: '/guardian',
    director: '/director',
  };

  it.each(roles)(
    'sin sesión, el espacio de %s lleva a «Iniciar sesión»',
    (role) => {
      expect(roleRedirect(null, role)).toBe('/login');
    },
  );

  it.each(roles)('con sesión de %s, su propio espacio abre', (role) => {
    expect(roleRedirect(sessionOf(role), role)).toBeNull();
  });

  it.each(
    roles.flatMap((mine) =>
      roles.filter((other) => other !== mine).map((other) => [mine, other]),
    ),
  )(
    'con sesión de %s, el espacio de %s lleva a su propio inicio',
    (mine, other) => {
      expect(roleRedirect(sessionOf(mine), other)).toBe(homes[mine]);
    },
  );
});

const stub = (label: string) =>
  function StubScreen() {
    return <Text>{label}</Text>;
  };

/** Las cuatro entradas con sus guardas reales y pantallas de mentira. */
async function openWith(session: AuthSession | null, initialUrl: string) {
  await renderRouter(
    {
      login: stub('pantalla Iniciar sesión'),
      'student/_layout': StudentLayout,
      'student/index': stub('inicio del estudiante'),
      'teacher/_layout': TeacherLayout,
      'teacher/index': stub('inicio del docente'),
      'guardian/_layout': GuardianLayout,
      'guardian/index': stub('inicio del acudiente'),
      'director/_layout': DirectorLayout,
      'director/index': stub('inicio de la directora'),
    },
    {
      initialUrl,
      wrapper: ({ children }: { children: ReactNode }) => (
        <SessionProvider initialSession={session}>{children}</SessionProvider>
      ),
    },
  );
  await act(async () => {
    await jest.runOnlyPendingTimersAsync();
  });
}

describe('guarda de rol en los layouts (enlaces directos)', () => {
  it('sin sesión, abrir /director lleva a «Iniciar sesión»', async () => {
    await openWith(null, '/director');

    expect(screen.getByText('pantalla Iniciar sesión')).toBeOnTheScreen();
    expect(screen.queryByText('inicio de la directora')).toBeNull();
  });

  it('un estudiante que abre /director llega a su propio inicio', async () => {
    await openWith(sessionOf('student'), '/director');

    expect(screen.getByText('inicio del estudiante')).toBeOnTheScreen();
    expect(screen.queryByText('inicio de la directora')).toBeNull();
  });

  it('un acudiente que abre /teacher llega a «Practicar en casa»', async () => {
    await openWith(sessionOf('guardian'), '/teacher');

    expect(screen.getByText('inicio del acudiente')).toBeOnTheScreen();
  });

  it('la docente abre su propio espacio', async () => {
    await openWith(sessionOf('teacher'), '/teacher');

    expect(screen.getByText('inicio del docente')).toBeOnTheScreen();
  });
});
