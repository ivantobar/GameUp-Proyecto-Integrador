/**
 * Fecha corta para el docente: «hoy, 4:10 p. m.», «ayer» o «12 oct.».
 * Se escribe a mano (sin Intl) para que dé lo mismo en todos los teléfonos.
 */
const MONTHS = [
  'ene.',
  'feb.',
  'mar.',
  'abr.',
  'may.',
  'jun.',
  'jul.',
  'ago.',
  'sep.',
  'oct.',
  'nov.',
  'dic.',
];

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function clock(date: Date): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours < 12 ? 'a. m.' : 'p. m.';
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${minutes} ${suffix}`;
}

export function formatSubmittedAt(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return `hoy, ${clock(date)}`;
  if (days === 1) return 'ayer';
  return `${date.getDate()} ${MONTHS[date.getMonth()] ?? ''}`;
}
