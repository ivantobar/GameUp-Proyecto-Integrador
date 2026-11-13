import { act, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD, mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { StudentAccessError } from '@/data/studentErrors';
import { StudentRecordingsSection } from '../components/StudentRecordingsSection';
import { recordingsDeletedText } from '../recordingsText';

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function asDirector() {
  const repos = createMockRepositories({ delayMs: 0 });
  await act(async () => {
    const pending = repos.auth.signIn({
      email: 'directora@gameup.test',
      password: MOCK_PASSWORD,
    });
    await jest.runAllTimersAsync();
    await pending;
  });
  return repos;
}

async function renderSection(repos: Repositories) {
  await render(
    <RepositoryProvider repositories={repos}>
      <StudentRecordingsSection studentId={mockStudent.id} />
    </RepositoryProvider>,
  );
  await settle();
}

const borrar = () =>
  screen.getByRole('button', { name: 'Borrar todas sus grabaciones de voz' });
const confirmar = () =>
  screen.getByRole('button', { name: 'Sí, borrar todas sus grabaciones' });

describe('«Grabaciones de voz» (directora)', () => {
  it('pide confirmación («No se puede deshacer») y «Cancelar» no borra nada', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    const spy = jest.spyOn(repos.reviews, 'deleteStudentRecordings');
    await renderSection(repos);

    await user.press(borrar());
    expect(
      screen.getByText('¿Borrar todas sus grabaciones? No se puede deshacer.'),
    ).toBeOnTheScreen();

    await user.press(
      screen.getByRole('button', { name: 'Cancelar, no borrar' }),
    );
    expect(spy).not.toHaveBeenCalled();
    expect(borrar()).toBeOnTheScreen();
  });

  it('al confirmar borra y dice cuántas: «Se borraron 3 grabaciones.»', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const repos = await asDirector();
    const spy = jest
      .spyOn(repos.reviews, 'deleteStudentRecordings')
      .mockResolvedValueOnce(3);
    await renderSection(repos);

    await user.press(borrar());
    await user.press(confirmar());
    await settle();

    expect(spy).toHaveBeenCalledWith(mockStudent.id);
    expect(screen.getByText('Se borraron 3 grabaciones.')).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith('Se borraron 3 grabaciones.');
    // La confirmación se cierra.
    expect(screen.queryByText(/No se puede deshacer/)).toBeNull();
  });

  it('si falla, lo dice y se puede volver a intentar', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    jest
      .spyOn(repos.reviews, 'deleteStudentRecordings')
      .mockRejectedValueOnce(new Error('503'));
    await renderSection(repos);

    await user.press(borrar());
    await user.press(confirmar());
    await settle();

    expect(
      screen.getByText('No se pudieron borrar. Intenta de nuevo.'),
    ).toBeOnTheScreen();
    expect(borrar()).toBeEnabled();
  });

  it('sin permiso, lo explica', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    jest
      .spyOn(repos.reviews, 'deleteStudentRecordings')
      .mockRejectedValueOnce(new StudentAccessError());
    await renderSection(repos);

    await user.press(borrar());
    await user.press(confirmar());
    await settle();

    expect(
      screen.getByText('No puedes borrar las grabaciones de este estudiante.'),
    ).toBeOnTheScreen();
  });
});

describe('texto del resultado', () => {
  it.each([
    [0, 'No había grabaciones para borrar.'],
    [1, 'Se borró 1 grabación.'],
    [4, 'Se borraron 4 grabaciones.'],
  ])('con %i: %s', (count, text) => {
    expect(recordingsDeletedText(count)).toBe(text);
  });
});
