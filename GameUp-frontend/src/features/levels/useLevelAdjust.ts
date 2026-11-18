import { useCallback, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useRepositories } from '@/data/RepositoryProvider';
import { LevelChangeError } from '@/data/studentErrors';
import type { LevelChange } from '@/data/types';
import { levelChangeErrorText } from './levelChoices';
import { useStudentLevels } from './useStudentLevels';

/**
 * «Cambiar nivel»: el nivel actual de cada juego y la acción de guardarlo.
 * Si el backend no deja (403 de la tallerista que intenta subir), su
 * mensaje queda en `error` y se anuncia al lector de pantalla.
 */
export function useLevelAdjust(studentId: string) {
  const { levels } = useRepositories();
  const { resource, reload, refresh } = useStudentLevels(studentId);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Devuelve `true` si quedó guardado. */
  const save = useCallback(
    async (change: LevelChange): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        await levels.setStudentLevel(change);
        return true;
      } catch (problem) {
        const text = levelChangeErrorText(problem);
        setError(text);
        AccessibilityInfo.announceForAccessibility(text);
        // Otra persona (o una validación) pudo cambiarlo mientras tanto.
        if (problem instanceof LevelChangeError) refresh();
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [levels, refresh],
  );

  return { resource, reload, error, submitting, save };
}
