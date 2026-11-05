import type { Repositories } from '../repositories';

/**
 * Parte de la app que todavía no está conectada a la API. Con
 * `EXPO_PUBLIC_DATA_SOURCE=api`, esas pantallas muestran su estado de error
 * (con «Reintentar») en vez de mezclar datos ficticios con los reales.
 */
export class NotConnectedYetError extends Error {
  constructor(what: string) {
    super(`Todavía no está conectado a la API: ${what}`);
    this.name = 'NotConnectedYetError';
  }
}

const notYet = (what: string) => () =>
  Promise.reject(new NotConnectedYetError(what));

/** PROVISIONAL: la fase 4 reemplaza el espacio del acudiente. */
export const notConnectedRepositories: Pick<Repositories, 'guardians'> = {
  guardians: {
    getWeeklyPractice: notYet('práctica de la semana'),
    markPracticedToday: notYet('práctica en casa'),
  },
};
