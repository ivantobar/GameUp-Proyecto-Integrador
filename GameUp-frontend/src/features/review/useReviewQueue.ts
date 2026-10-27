import { useCallback, useState } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { ReviewItem, StaffProfile } from '@/data/types';

interface ReviewQueue {
  teacher: StaffProfile;
  items: ReviewItem[];
}

/** Aviso tras una acción del docente (se muestra en la pantalla). */
export interface ReviewMessage {
  tone: 'done' | 'error';
  text: string;
}

/**
 * «Por escuchar»: actividades pendientes de los estudiantes asignados al
 * docente, y sus acciones (validar, pedir práctica, nota de voz).
 */
export function useReviewQueue() {
  const { staff, reviews } = useRepositories();
  const [message, setMessage] = useState<ReviewMessage | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<ReviewQueue> => {
    const teacher = await staff.getCurrentTeacher();
    const items = await reviews.listPendingReviews(teacher.id);
    return { teacher, items };
  }, [staff, reviews]);

  const { resource, reload, refresh } = useResource(load);

  /** Ejecuta una acción, muestra el aviso y actualiza la lista. */
  const run = useCallback(
    async (id: string, action: () => Promise<void>, doneText: string) => {
      setBusyId(id);
      try {
        await action();
        setMessage({ tone: 'done', text: doneText });
        refresh();
        return true;
      } catch (error) {
        console.warn('[GameUP] No se pudo guardar la revisión', error);
        setMessage({
          tone: 'error',
          text: 'No se pudo guardar. Revisa la conexión e inténtalo otra vez.',
        });
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  const validate = useCallback(
    (item: ReviewItem) =>
      run(
        item.id,
        () => reviews.validate(item.id),
        `Validado: la actividad de ${item.student.displayName} ya cuenta en su progreso.`,
      ),
    [run, reviews],
  );

  const requestMorePractice = useCallback(
    (item: ReviewItem, feedback: string) =>
      run(
        item.id,
        () => reviews.requestMorePractice(item.id, feedback),
        `${item.student.displayName} practicará más. Tu nota llegó a la familia.`,
      ),
    [run, reviews],
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
  };
}
