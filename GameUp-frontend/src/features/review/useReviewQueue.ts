import { useCallback, useState } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { ListenFirstError } from '@/data/reviewErrors';
import { useResource } from '@/data/useResource';
import {
  LADDER_LEVELS,
  type LevelUp,
  type ReviewItem,
  type StaffProfile,
} from '@/data/types';
import { findGame } from '@/features/games/catalog';
import type { FeedbackOptions } from './components/FeedbackForm';

interface ReviewQueue {
  teacher: StaffProfile;
  items: ReviewItem[];
}

/** Aviso tras una acción del docente (se muestra en la pantalla). */
export interface ReviewMessage {
  tone: 'done' | 'error';
  text: string;
}

/** Aviso al validar: si subió de nivel en la escalera, se celebra. */
export function validatedText(
  item: ReviewItem,
  levelUp: LevelUp | null,
): string {
  const name = item.student.displayName;
  if (!levelUp) {
    return `Validado: la actividad de ${name} ya cuenta en su progreso.`;
  }
  const game = findGame(levelUp.gameId).title;
  return levelUp.completed
    ? `¡${name} completó los ${LADDER_LEVELS} niveles de ${game}!`
    : `¡${name} subió al nivel ${levelUp.level} de ${game}!`;
}

/** Mensaje para el docente cuando algo no se pudo guardar. */
function errorText(error: unknown): string {
  return error instanceof ListenFirstError
    ? 'Primero escucha la grabación del intento: toca «Escuchar».'
    : 'No se pudo guardar. Revisa la conexión e inténtalo otra vez.';
}

/**
 * «Por revisar» (docente) y «Por validar» (directora): actividades
 * pendientes que le corresponden a la sesión, y sus acciones (validar,
 * pedir práctica, nota de voz). Con `studentId`, solo las de ese estudiante.
 */
export function useReviewQueue(studentId?: string) {
  const { staff, reviews } = useRepositories();
  const [message, setMessage] = useState<ReviewMessage | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<ReviewQueue> => {
    // Docente o directora: el backend decide qué intentos le corresponden.
    const teacher = await staff.getCurrentStaff();
    const items = await reviews.listPendingReviews(teacher.id, studentId);
    return { teacher, items };
  }, [staff, reviews, studentId]);

  const { resource, reload, refresh } = useResource(load);

  /** Ejecuta una acción, muestra el aviso y actualiza la lista. */
  const run = useCallback(
    async (
      id: string,
      action: () => Promise<void>,
      doneText: string | (() => string),
    ) => {
      setBusyId(id);
      try {
        await action();
        setMessage({
          tone: 'done',
          text: typeof doneText === 'string' ? doneText : doneText(),
        });
        refresh();
        return true;
      } catch (error) {
        console.warn(
          '[GameUP] No se pudo guardar la revisión',
          error instanceof Error ? error.name : 'Error',
        );
        setMessage({ tone: 'error', text: errorText(error) });
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  const validate = useCallback(
    (item: ReviewItem) => {
      let levelUp: LevelUp | null = null;
      return run(
        item.id,
        async () => {
          levelUp = await reviews.validate(item.id);
        },
        () => validatedText(item, levelUp),
      );
    },
    [run, reviews],
  );

  /**
   * «Practicar más». Si el docente lo pide, la indicación también llega a la
   * familia como nota (si se guardó la decisión pero no la nota, se avisa).
   */
  const requestMorePractice = useCallback(
    (item: ReviewItem, feedback: string, options?: FeedbackOptions) => {
      const name = item.student.displayName;
      const share = options?.shareWithFamily === true;
      const reachesFamily =
        reviews.features.feedbackAlwaysReachesFamily || share;
      let noteFailed = false;
      return run(
        item.id,
        async () => {
          await reviews.requestMorePractice(item.id, feedback);
          if (!share) return;
          try {
            await reviews.shareNoteWithFamily(item.student.id, feedback);
          } catch {
            noteFailed = true;
          }
        },
        reachesFamily
          ? `${name} practicará más. Tu nota llegó a la familia.`
          : `${name} practicará más.`,
      ).then((saved) => {
        if (saved && noteFailed) {
          setMessage({
            tone: 'error',
            text: `${name} practicará más, pero la nota no llegó a la familia. Revisa la conexión.`,
          });
        }
        return saved;
      });
    },
    [run, reviews],
  );

  /** Audio de un intento de voz (lo pide al tocar «Escuchar»). */
  const loadRecording = useCallback(
    (item: ReviewItem) => reviews.getRecordingUrl(item.id),
    [reviews],
  );

  const saveFamilyVoiceNote = useCallback(
    (item: ReviewItem, audioUri: string) =>
      run(
        item.id,
        () => reviews.saveFamilyVoiceNote(item.student.id, audioUri),
        `Tu nota de voz llegó a la familia de ${item.student.displayName}.`,
      ),
    [run, reviews],
  );

  return {
    resource,
    reload,
    refresh,
    message,
    busyId,
    validate,
    requestMorePractice,
    saveFamilyVoiceNote,
    loadRecording,
    features: reviews.features,
  };
}
