import { render, screen } from '@testing-library/react-native';
import { WeekStreak, practicedDaysText } from '../components/WeekStreak';

/** Lunes 2 a domingo 8 de noviembre de 2026. */
const week = [
  { date: '2026-11-02', practiced: true },
  { date: '2026-11-03', practiced: false },
  { date: '2026-11-04', practiced: true },
  { date: '2026-11-05', practiced: false },
  { date: '2026-11-06', practiced: false },
  { date: '2026-11-07', practiced: false },
  { date: '2026-11-08', practiced: false },
];

describe('días que practicaron en casa', () => {
  it('dice cuántos días, sin culpa si no hay ninguno', () => {
    expect(practicedDaysText(week)).toBe('Esta semana practicaron 2 días.');
    expect(practicedDaysText(week.slice(0, 1))).toBe(
      'Esta semana practicaron 1 día.',
    );
    expect(
      practicedDaysText(week.map((day) => ({ ...day, practiced: false }))),
    ).toBe('Esta semana todavía no han practicado en casa.');
  });

  it('un círculo por día: los practicados con ✓, los demás con su inicial', async () => {
    await render(<WeekStreak days={week} />);
    // Los 5 días sin práctica muestran su inicial (M, J, V, S, D).
    for (const initial of ['M', 'J', 'V', 'S', 'D']) {
      expect(
        screen.getAllByText(initial, { includeHiddenElements: true }).length,
      ).toBeGreaterThan(0);
    }
    // Los practicados (lunes y miércoles) no muestran su inicial: llevan ✓.
    expect(screen.queryByText('L', { includeHiddenElements: true })).toBeNull();
    expect(
      screen.getByLabelText(
        'Esta semana practicaron 2 días. Practicaron el lunes, miércoles.',
      ),
    ).toBeOnTheScreen();
  });
});
