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

/**
 * PROVISIONAL: cada fase reemplaza un grupo por su repositorio HTTP
 * (fase 2: estudiante; fase 3: tallerista; fase 4: acudiente).
 */
export const notConnectedRepositories: Omit<
  Repositories,
  'auth' | 'students' | 'staff'
> = {
  practice: {
    getVowelPractice: notYet('práctica por vocal'),
    getResumePoint: notYet('punto de retorno'),
    recordPracticeCycle: notYet('estrellas de práctica'),
  },
  assignments: { listPendingForStudent: notYet('actividades pendientes') },
  progress: { getOfficialProgress: notYet('progreso oficial') },
  consent: { hasVoiceRecordingConsent: notYet('consentimiento de voz') },
  recordings: { submitSpeechAttempt: notYet('intentos de voz') },
  results: { submitFindMouthResult: notYet('resultados de juegos') },
  reviews: {
    listPendingReviews: notYet('revisiones pendientes'),
    validate: notYet('validar'),
    requestMorePractice: notYet('pedir más práctica'),
    saveFamilyVoiceNote: notYet('nota de voz'),
  },
  guardians: {
    getWeeklyPractice: notYet('práctica de la semana'),
    markPracticedToday: notYet('práctica en casa'),
  },
};
