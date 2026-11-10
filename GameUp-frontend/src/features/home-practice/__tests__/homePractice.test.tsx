import type { ReactNode } from 'react';
import {
  act,
  render,
  renderHook,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import { TeacherVideoCard } from '../components/TeacherVideoCard';
import { homeSteps } from '../homeSteps';
import { useWeeklyPractice } from '../useWeeklyPractice';

jest.mock('expo-router', () => ({ useIsFocused: () => true }));

const repositories = createMockRepositories({ delayMs: 0 });

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <RepositoryProvider repositories={repositories}>
      {children}
    </RepositoryProvider>
  );
}

describe('Practicar en casa', () => {
  it('los pasos usan el sonido de la semana', () => {
    const steps = homeSteps('o');
    expect(steps).toHaveLength(4);
    expect(steps[1]).toBe('Haz el gesto y di «o» despacio, dos veces.');
  });

  it('muestra la nota de la profe y registra «Lo practicamos hoy»', async () => {
    const { result } = await renderHook(() => useWeeklyPractice(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    if (result.current.resource.status !== 'ready') return;
    expect(result.current.resource.data.week.teacherNote?.text).toContain(
      'oso, ojo, ola',
    );
    expect(result.current.resource.data.week.practicedToday).toBe(false);

    await act(async () => {
      result.current.markPracticedToday().catch(() => {});
    });
    await waitFor(() => {
      const r = result.current.resource;
      expect(r.status === 'ready' && r.data.week.practicedToday).toBe(true);
    });
    expect(result.current.markState).toBe('idle');
  });

  it('«Mira cómo lo hace la profe»: ▶ abre el video del sonido de la semana', async () => {
    const user = userEvent.setup();
    await render(<TeacherVideoCard vowel="i" />);
    expect(
      screen.queryByLabelText('La profe Consuelo hace el gesto de la I'),
    ).toBeNull();

    await user.press(
      screen.getByRole('button', { name: 'Ver cómo lo hace la profe' }),
    );

    expect(
      screen.getByLabelText('La profe Consuelo hace el gesto de la I'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Mira cómo lo hace la profe')).toBeOnTheScreen();
    expect(screen.queryByText(/Muy pronto/)).toBeNull();
  });
});
