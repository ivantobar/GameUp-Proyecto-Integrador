import { addDays, bogotaToday, spokenDate } from '@/data/bogotaDate';
import { suggestedDateOptions } from '../suggestedDates';

/** 20 de noviembre de 2026, 11:30 p. m. en Bogotá = 21 de noviembre, 04:30 UTC. */
const LATE_NIGHT_BOGOTA = Date.parse('2026-11-21T04:30:00.000Z');

describe('fechas en hora de Bogotá', () => {
  it('a las 11:30 p. m. de Bogotá, «hoy» sigue siendo el día de Bogotá', () => {
    // En UTC (y en un teléfono con otra zona) ya es el 21.
    expect(new Date(LATE_NIGHT_BOGOTA).toISOString().slice(0, 10)).toBe(
      '2026-11-21',
    );
    expect(bogotaToday(LATE_NIGHT_BOGOTA)).toBe('2026-11-20');
  });

  it('con el reloj falso, la opción «Hoy» usa la fecha de Bogotá', () => {
    jest.setSystemTime(LATE_NIGHT_BOGOTA);

    const options = suggestedDateOptions();

    expect(options.map((o) => [o.label, o.date])).toEqual([
      ['Sin fecha', undefined],
      ['Hoy', '2026-11-20'],
      ['En 1 semana', '2026-11-27'],
      ['En 2 semanas', '2026-12-04'],
    ]);
  });

  it('a medianoche de Bogotá cambia el día', () => {
    expect(bogotaToday(Date.parse('2026-11-21T05:00:00.000Z'))).toBe(
      '2026-11-21',
    );
    expect(bogotaToday(Date.parse('2026-11-21T04:59:59.000Z'))).toBe(
      '2026-11-20',
    );
  });

  it('suma días cruzando meses y años', () => {
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
    expect(addDays('2026-02-25', 7)).toBe('2026-03-04');
  });

  it('dice la fecha en palabras', () => {
    expect(spokenDate('2026-11-20')).toBe('20 de noviembre');
    expect(spokenDate('2027-01-04')).toBe('4 de enero');
  });
});
