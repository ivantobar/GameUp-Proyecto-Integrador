/**
 * Fechas sin hora (columnas `date`) y el «hoy» de la fundación.
 *
 * La fundación está en Colombia: «hoy» es la fecha en America/Bogota, no la
 * del servidor (Render corre en UTC). Prisma lee y escribe las columnas
 * `date` como un Date a medianoche UTC.
 */
export const ZONA_FUNDACION = 'America/Bogota';

const FORMATO = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_FUNDACION,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "2026-11-05" según el calendario de Bogotá. */
export function fechaEnBogota(instante: Date): string {
  return FORMATO.format(instante);
}

/** "2026-11-05" → Date a medianoche UTC (lo que espera Prisma en una columna date). */
export function aFechaSinHora(fecha: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new TypeError('Fecha inválida');
  }
  return new Date(`${fecha}T00:00:00.000Z`);
}

/** Date de una columna date → "2026-11-05". */
export function fechaSinHoraATexto(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}
