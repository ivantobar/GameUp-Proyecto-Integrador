import { act, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { router } from 'expo-router';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD, mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { LevelChangeError, SOLO_DIRECTORA_SUBE } from '@/data/studentErrors';
import { takeLevelNotice } from '@/features/students/assignmentNotice';
import { LevelAdjustView } from '../components/LevelAdjustView';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function signedIn(email: string) {
  const repos = createMockRepositories({ delayMs: 0 });
  await act(async () => {
    const pending = repos.auth.signIn({ email, password: MOCK_PASSWORD });
    await jest.runAllTimersAsync();
    await pending;
  });
  return repos;
}

/** Pone Memoria en el nivel 4 (como directora) para tener niveles que bajar. */
async function memoriaEnNivel4(repos: Repositories) {
  await act(async () => {
    const pending = repos.levels.setStudentLevel({
      studentId: mockStudent.id,
      gameId: 'memory',
      level: 4,
      reason: 'Punto de partida',
    });
    await jest.runAllTimersAsync();
    await pending;
  });
}

async function renderView(repos: Repositories, canRaise: boolean) {
  await render(
    <RepositoryProvider repositories={repos}>
      <LevelAdjustView studentId={mockStudent.id} canRaise={canRaise} />
    </RepositoryProvider>,
  );
  await settle();
}

const nivelBoton = (n: number) =>
  screen.queryByRole('button', { name: `Nivel ${n} de Memoria` });

describe('«Cambiar nivel»', () => {
  beforeEach(() => {
    jest.mocked(router.back).mockClear();
    takeLevelNotice(mockStudent.id);
  });

  it('la tallerista solo puede elegir niveles menores al actual', async () => {
    const repos = await signedIn('directora@gameup.test');
    await memoriaEnNivel4(repos);
    await act(async () => {
      const pending = repos.auth.signIn({
        email: 'docente@gameup.test',
        password: MOCK_PASSWORD,
      });
      await jest.runAllTimersAsync();
      await pending;
    });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderView(repos, false);

    expect(
      screen.getByText(/Como tallerista, solo puedes bajar el nivel/),
    ).toBeOnTheScreen();
    await user.press(screen.getByLabelText('Memoria: Nivel 4'));

    expect(nivelBoton(1)).toBeOnTheScreen();
    expect(nivelBoton(3)).toBeOnTheScreen();
    expect(nivelBoton(4)).toBeNull();
    expect(nivelBoton(5)).toBeNull();
  });

  it('en el nivel 1, la tallerista ve que no se puede bajar más', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderView(await signedIn('docente@gameup.test'), false);

    await user.press(screen.getByLabelText('Emparejar: Nivel 1'));
    expect(
      screen.getByText('Ya está en el nivel 1: no se puede bajar más.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Guardar nivel' }),
    ).toBeDisabled();
  });

  it('la directora puede elegir cualquiera menos el actual', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderView(await signedIn('directora@gameup.test'), true);

    await user.press(screen.getByLabelText('Memoria: Nivel 1'));
    expect(nivelBoton(1)).toBeNull();
    for (const n of [2, 3, 4, 5]) expect(nivelBoton(n)).toBeOnTheScreen();
    expect(screen.queryByText(/Como tallerista/)).toBeNull();
  });

  it('el motivo es obligatorio; al guardar vuelve al detalle con el aviso', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await signedIn('directora@gameup.test');
    const guardar = jest.spyOn(repos.levels, 'setStudentLevel');
    await renderView(repos, true);

    await user.press(screen.getByLabelText('Memoria: Nivel 1'));
    await user.press(nivelBoton(3)!);
    expect(
      screen.getByRole('button', { name: 'Guardar: Memoria en el nivel 3' }),
    ).toBeDisabled();

    await user.type(screen.getByTestId('motivo-nivel'), '  Ya domina parejas ');
    await user.press(
      screen.getByRole('button', { name: 'Guardar: Memoria en el nivel 3' }),
    );
    await settle();

    expect(guardar).toHaveBeenCalledWith({
      studentId: mockStudent.id,
      gameId: 'memory',
      level: 3,
      reason: 'Ya domina parejas',
    });
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(takeLevelNotice(mockStudent.id)).toBe(
      'Memoria quedó en el nivel 3.',
    );
  });

  it('si el backend responde 403, muestra su mensaje, lo anuncia y no sale', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const repos = await signedIn('directora@gameup.test');
    jest
      .spyOn(repos.levels, 'setStudentLevel')
      .mockRejectedValueOnce(
        new LevelChangeError('notAllowed', SOLO_DIRECTORA_SUBE),
      );
    await renderView(repos, true);

    await user.press(screen.getByLabelText('Memoria: Nivel 1'));
    await user.press(nivelBoton(2)!);
    await user.type(screen.getByTestId('motivo-nivel'), 'Prueba');
    await user.press(
      screen.getByRole('button', { name: 'Guardar: Memoria en el nivel 2' }),
    );
    await settle();

    expect(screen.getByText(SOLO_DIRECTORA_SUBE)).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith(SOLO_DIRECTORA_SUBE);
    expect(router.back).not.toHaveBeenCalled();
  });
});
