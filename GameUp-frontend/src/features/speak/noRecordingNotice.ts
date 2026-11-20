import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';

/** Textos del aviso de «Dilo» cuando la voz no se graba. */
export const NO_RECORDING_TEXT = {
  freePractice: 'Práctica libre: tu voz no se graba',
  noConsent: 'Tu familia aún no autorizó grabar tu voz',
} as const;

/** ¿El acudiente autorizó grabar la voz? (`unknown` mientras carga o si falla). */
export type VoiceConsentStatus = 'granted' | 'denied' | 'unknown';

/**
 * Lee la autorización del acudiente SOLO para explicarle al niño por qué no
 * se graba. No decide nada: cuándo se graba lo decide `useSayStep` (sin
 * cambios). Hace la misma consulta que él.
 */
export function useVoiceConsentStatus(): VoiceConsentStatus {
  const { students, consent } = useRepositories();
  const load = useCallback(async () => {
    const student = await students.getCurrentStudent();
    return consent.hasVoiceRecordingConsent(student.id);
  }, [students, consent]);
  const { resource } = useResource(load);
  if (resource.status !== 'ready') return 'unknown';
  return resource.data ? 'granted' : 'denied';
}

/**
 * Aviso debajo del espejo cuando la voz no se graba (Ley 1581), para que no
 * parezca que algo falla:
 * - práctica libre (sin tarea): nunca se graba;
 * - desde una tarea, sin autorización del acudiente;
 * - desde una tarea con autorización: sin aviso (se ve el micrófono).
 * Mientras no se sabe la autorización, no se muestra nada.
 */
export function noRecordingNotice(
  fromTask: boolean,
  consent: VoiceConsentStatus,
): string | null {
  if (!fromTask) return NO_RECORDING_TEXT.freePractice;
  if (consent === 'denied') return NO_RECORDING_TEXT.noConsent;
  return null;
}
