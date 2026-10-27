import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { Assignment, ResumePoint, StudentProfile } from '@/data/types';
import {
  findGame,
  gameCatalog,
  type GameDefinition,
} from '@/features/games/catalog';
import { moduleCatalog } from '@/features/progress/modules';

export interface StudentHomeData {
  student: StudentProfile;
  /** Cuántas tareas tiene pendientes («Hoy tienes 2 juegos»). */
  pendingCount: number;
  resume: ResumePoint | null;
  /** La tarea nueva más reciente que dejó el docente, si hay. */
  newAssignment: { assignment: Assignment; game: GameDefinition } | null;
  gamesCount: number;
  /** Temas que se ven en «Mi progreso». */
  modulesCount: number;
}

/** Datos de la pantalla Inicio del estudiante. */
export function useStudentHome() {
  const { students, practice, assignments } = useRepositories();

  const load = useCallback(async (): Promise<StudentHomeData> => {
    const student = await students.getCurrentStudent();
    const [resume, pending] = await Promise.all([
      practice.getResumePoint(student.id),
      assignments.listPendingForStudent(student.id),
    ]);
    const firstNew = pending.find((a) => a.isNew) ?? null;
    return {
      student,
      pendingCount: pending.length,
      resume,
      newAssignment: firstNew
        ? { assignment: firstNew, game: findGame(firstNew.gameId) }
        : null,
      gamesCount: gameCatalog.length,
      modulesCount: moduleCatalog.length,
    };
  }, [students, practice, assignments]);

  return useResource(load);
}
