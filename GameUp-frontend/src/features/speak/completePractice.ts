import type { Repositories } from '@/data/repositories';
import type { SpeechAttempt, StarCount, Vowel } from '@/data/types';

export interface PracticeOutcome {
  vowel: Vowel;
  studentName: string;
  /** Estrellas de práctica de la vocal después de este intento. */
  stars: StarCount;
  attempt: SpeechAttempt;
  /** Si hubo autorización para grabar; decide qué muestra «Listo». */
  voiceConsent: boolean;
}

type PracticeRepositories = Pick<
  Repositories,
  'students' | 'practice' | 'consent' | 'recordings'
>;

/**
 * Cierra un ciclo Mira → Dilo → Listo:
 * 1. vuelve a comprobar el consentimiento (si no hay, no se envía la voz);
 * 2. envía el intento, que queda PENDIENTE de validación del docente;
 * 3. suma 1 estrella de práctica (no es progreso oficial).
 */
export async function completePractice(
  repositories: PracticeRepositories,
  vowel: Vowel,
  audioUri: string | null,
): Promise<PracticeOutcome> {
  const student = await repositories.students.getCurrentStudent();
  const voiceConsent = await repositories.consent.hasVoiceRecordingConsent(
    student.id,
  );
  const attempt = await repositories.recordings.submitSpeechAttempt({
    studentId: student.id,
    vowel,
    audioUri: voiceConsent ? audioUri : null,
  });
  const stars = await repositories.practice.recordPracticeCycle(
    student.id,
    vowel,
  );
  return {
    vowel,
    studentName: student.displayName,
    stars,
    attempt,
    voiceConsent,
  };
}
