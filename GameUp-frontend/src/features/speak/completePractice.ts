import type { Repositories } from '@/data/repositories';
import type {
  NewSpeechAttempt,
  SpeechAttempt,
  StarCount,
  VoiceConsentStatus,
  Vowel,
} from '@/data/types';
import { deliveryOf, type Delivery } from '@/features/games/delivery';

export interface PracticeOutcome {
  vowel: Vowel;
  studentName: string;
  /** Estrellas de práctica de la vocal después de este intento. */
  stars: StarCount;
  attempt: SpeechAttempt;
  /** Si hubo autorización para grabar (solo con `granted`). */
  voiceConsent: boolean;
  /** Por qué se grabó o no; decide qué dice «Listo» cuando no se grabó. */
  voiceConsentStatus: VoiceConsentStatus;
  /** Si el intento llegó al docente (decide el mensaje de «Listo»). */
  delivery: Delivery;
}

/**
 * Lo que «Listo» le dice al niño cuando su voz no se grabó, o `null` si se
 * grabó. Solo se menciona al acudiente si de verdad no autorizó.
 */
export function notRecordedText(status: VoiceConsentStatus): string | null {
  switch (status) {
    case 'granted':
      return null;
    case 'notGranted':
      return 'Tu voz no se grabó porque no hay autorización de tu acudiente.';
    case 'notVerified':
      return 'Hoy no pudimos guardar tu voz. ¡Igual lo hiciste muy bien!';
  }
}

type PracticeRepositories = Pick<
  Repositories,
  'students' | 'practice' | 'consent' | 'recordings'
>;

/** Intento que no se pudo enviar: se celebra igual (Regla 11). */
function notSentAttempt(input: NewSpeechAttempt): SpeechAttempt {
  return {
    id: 'sin-enviar',
    studentId: input.studentId,
    vowel: input.vowel,
    audioUri: input.audioUri,
    status: 'submitted',
    createdAt: new Date().toISOString(),
    sentForReview: false,
  };
}

/**
 * Una sola consulta al consentimiento. Si falla, falla cerrado: no se
 * graba, pero tampoco se culpa al acudiente (`notVerified`).
 */
async function voiceConsentStatusOf(
  repositories: PracticeRepositories,
  studentId: string,
): Promise<VoiceConsentStatus> {
  try {
    return await repositories.consent.getVoiceConsentStatus(studentId);
  } catch (error) {
    console.warn(
      '[GameUP] No se pudo consultar el consentimiento de voz',
      error instanceof Error ? error.name : 'Error',
    );
    return 'notVerified';
  }
}

/**
 * Cierra un ciclo Mira → Dilo → Listo:
 * 1. vuelve a comprobar el consentimiento (si no hay, no se envía la voz);
 * 2. envía el intento, que queda PENDIENTE de validación del docente (solo
 *    si viene de una actividad: `activityId`);
 * 3. lee las estrellas de práctica (no son progreso oficial).
 * Si el envío falla (ya reintentado en silencio), el niño celebra igual y
 * «Listo» deja un aviso para el adulto.
 */
export async function completePractice(
  repositories: PracticeRepositories,
  vowel: Vowel,
  audioUri: string | null,
  activityId: string | null = null,
): Promise<PracticeOutcome> {
  const student = await repositories.students.getCurrentStudent();
  const voiceConsentStatus = await voiceConsentStatusOf(
    repositories,
    student.id,
  );
  const voiceConsent = voiceConsentStatus === 'granted';
  const input: NewSpeechAttempt = {
    studentId: student.id,
    vowel,
    audioUri: voiceConsent ? audioUri : null,
    activityId,
  };

  let attempt: SpeechAttempt;
  let delivery: Delivery;
  try {
    attempt = await repositories.recordings.submitSpeechAttempt(input);
    delivery = deliveryOf(attempt);
  } catch (error) {
    if (!activityId) throw error;
    // Sin datos del niño en el registro: solo el tipo de error.
    console.warn(
      '[GameUP] No se pudo enviar el intento de voz',
      error instanceof Error ? error.name : 'Error',
    );
    attempt = notSentAttempt(input);
    delivery = 'notSent';
  }

  let stars: StarCount = 0;
  try {
    stars = await repositories.practice.recordPracticeCycle(student.id, vowel);
  } catch {
    // Las estrellas son práctica: si no se pueden leer, no se detiene nada.
  }

  return {
    vowel,
    studentName: student.displayName,
    stars,
    attempt,
    voiceConsent,
    voiceConsentStatus,
    delivery,
  };
}
