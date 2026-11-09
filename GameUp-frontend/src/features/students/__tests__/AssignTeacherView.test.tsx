import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD, mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { TeacherLinkError } from '@/data/studentErrors';
import { takeTeacherNotice } from '../assignmentNotice';
import { AssignTeacherView } from '../components/AssignTeacherView';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

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

async function renderPicker(repos: Repositories, studentId = 'est-demo-004') {
  await render(
    <RepositoryProvider repositories={repos}>
      <AssignTeacherView studentId={studentId} />
    </RepositoryProvider>,
  );
  await settle();
}

describe('«Asignar tallerista»', () => {
  beforeEach(() => {
    jest.mocked(router.back).mockClear();
  });

  it('lista las talleristas activas; las que ya lo tienen no se pueden elegir', async () => {
    await renderPicker(await asDirector(), mockStudent.id);

    expect(
      screen.getByLabelText('Profe Laura. Ya lo tiene a cargo'),
    ).toBeDisabled();
    expect(screen.getByLabelText('Ana Gómez')).toBeOnTheScreen();
    expect(screen.getByLabelText('Carlos Pérez')).toBeOnTheScreen();
    // Rosa tiene la cuenta inactiva: no se ofrece.
    expect(screen.queryByText('Rosa Mejía')).toBeNull();
    // Sin elegir, «Asignar» no hace nada.
    expect(screen.getByRole('button', { name: 'Asignar' })).toBeDisabled();
  });

  it('tocar una y «Asignar»: la asigna y vuelve al perfil con el aviso', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    const assign = jest.spyOn(repos.teacherLinks, 'assignTeacher');
    await renderPicker(repos);

    await user.press(screen.getByLabelText('Ana Gómez'));
    expect(screen.getByLabelText('Ana Gómez. Elegida')).toBeOnTheScreen();
    await user.press(
      screen.getByRole('button', { name: 'Asignar a Ana Gómez' }),
    );
    await settle();

    expect(assign).toHaveBeenCalledWith('est-demo-004', 'doc-demo-002');
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(takeTeacherNotice('est-demo-004')).toBe(true);
  });

  it('409: dice «Ya lo tiene a cargo» sin cerrar la pantalla', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    jest
      .spyOn(repos.teacherLinks, 'assignTeacher')
      .mockRejectedValue(new TeacherLinkError('alreadyInCharge'));
    await renderPicker(repos);

    await user.press(screen.getByLabelText('Carlos Pérez'));
    await user.press(
      screen.getByRole('button', { name: 'Asignar a Carlos Pérez' }),
    );
    await settle();

    expect(screen.getByText('Ya lo tiene a cargo.')).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();
    expect(takeTeacherNotice('est-demo-004')).toBe(false);
  });

  it('422: dice que la cuenta no es de una tallerista activa', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const repos = await asDirector();
    jest
      .spyOn(repos.teacherLinks, 'assignTeacher')
      .mockRejectedValue(new TeacherLinkError('notActiveTeacher'));
    await renderPicker(repos);

    await user.press(screen.getByLabelText('Carlos Pérez'));
    await user.press(
      screen.getByRole('button', { name: 'Asignar a Carlos Pérez' }),
    );
    await settle();

    expect(
      screen.getByText('Esa cuenta no es de una tallerista activa.'),
    ).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();
  });

  it('con otra cuenta (403) no se presenta como problema de conexión', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await renderPicker(repos);

    expect(
      screen.getByText('No puedes cambiar su tallerista'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Revisa la conexión.')).toBeNull();
    warn.mockRestore();
  });
});
