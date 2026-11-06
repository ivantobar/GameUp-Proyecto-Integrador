import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { GameLevel } from '@/data/types';

/** Nivel de un estudiante en cada juego (profe a cargo o acudiente). */
export function useStudentLevels(studentId: string) {
  const { levels } = useRepositories();
  const load = useCallback(
    (): Promise<GameLevel[]> => levels.getStudentLevels(studentId),
    [levels, studentId],
  );
  return useResource(load);
}
