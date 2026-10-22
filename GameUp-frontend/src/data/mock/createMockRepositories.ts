import type { Repositories } from '../repositories';
import {
  MAX_STARS,
  type SpeechAttempt,
  type StarCount,
  type VowelPractice,
} from '../types';
import { devSettings } from './devSettings';
import {
  mockAssignments,
  mockOfficialProgress,
  mockResumePoint,
  mockStudent,
  mockVowelPractice,
} from './fixtures';

interface MockOptions {
  /**
   * Espera simulada de cada respuesta, para ver los estados de carga.
   * En las pruebas se usa 0.
   */
  delayMs?: number;
  /** Consentimiento de voz. Por defecto, el ajuste de «Modo desarrollo». */
  voiceConsent?: () => boolean;
}

/** Copia profunda simple: los datos simulados son JSON plano. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Repositorios simulados en memoria. Guardan cambios mientras la app está
 * abierta (estrellas, intentos), para que las pantallas se vean conectadas;
 * al cerrar la app, todo vuelve a los datos iniciales. Devuelven copias, para
 * que una pantalla no pueda modificar los datos de otra por accidente.
 */
export function createMockRepositories({
  delayMs = 300,
  voiceConsent = () => devSettings.get().voiceConsent,
}: MockOptions = {}): Repositories {
  const state = {
    vowelPractice: clone<VowelPractice[]>(mockVowelPractice),
    resumePoint: clone(mockResumePoint),
    attempts: [] as SpeechAttempt[],
  };

  const respond = <T>(value: T): Promise<T> =>
    new Promise((resolve) => {
      setTimeout(() => resolve(clone(value)), delayMs);
    });

  return {
    students: {
      getCurrentStudent: () => respond(mockStudent),
    },
    practice: {
      getVowelPractice: () => respond(state.vowelPractice),
      getResumePoint: () => respond(state.resumePoint),
      recordPracticeCycle: (_studentId, vowel) => {
        const item = state.vowelPractice.find((v) => v.vowel === vowel);
        const next = Math.min((item?.stars ?? 0) + 1, MAX_STARS) as StarCount;
        if (item) item.stars = next;
        else state.vowelPractice.push({ vowel, stars: next });
        state.resumePoint = { gameId: 'speak', vowel };
        return respond(next);
      },
    },
    assignments: {
      listPendingForStudent: () =>
        respond(mockAssignments.filter((a) => a.status !== 'validated')),
    },
    progress: {
      getOfficialProgress: () => respond(mockOfficialProgress),
    },
    consent: {
      hasVoiceRecordingConsent: () => respond(voiceConsent()),
    },
    recordings: {
      submitSpeechAttempt: (input) => {
        const attempt: SpeechAttempt = {
          id: `int-demo-${state.attempts.length + 1}`,
          ...input,
          // Regla: sin autorización no se guarda la voz, aunque llegue un archivo.
          audioUri: voiceConsent() ? input.audioUri : null,
          status: 'pending_validation',
          createdAt: new Date().toISOString(),
        };
        state.attempts.push(attempt);
        return respond(attempt);
      },
    },
  };
}
