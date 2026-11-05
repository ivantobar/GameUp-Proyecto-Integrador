import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { Assignment, ResumePoint, StudentProfile } from '@/data/types';
import {
  findGame,
  gameCatalog,
  nextAssignment,
  type GameDefinition,
} from '@/features/games/catalog';

export interface StudentHomeData {
  student: StudentProfile;
  /** Cuántas tareas tiene pendientes («Hoy tienes 2 juegos»). */
  pendingCount: number;
  resume: ResumePoint | null;
  /**
   * La próxima tarea que dejó el docente: primero las nuevas y luego las
   * que pidió practicar otra vez.
   */
  newAssignment: { assignment: Assignment; game: GameDefinition } | null;
  gamesCount: number;
  /** Temas que se ven en «Mi progreso». */
  modulesCount: number;
}

/** Datos de la pantalla Inicio del estudiante. */
export function useStudentHome() {
  const { students, practice, assignments, progress } = useRepositories();

  const load = useCallback(async (): Promise<StudentHomeData> => {
    const student = await students.getCurrentStudent();
    const [resume, pending, official] = await Promise.all([
      practice.getResumePoint(student.id),
      assignments.listPendingForStudent(student.id),
      progress.getOfficialProgress(student.id),
    ]);
    const next = nextAssignment(pending);
    return {
      student,
      pendingCount: pending.length,
      resume,
      newAssignment: next
        ? { assignment: next, game: findGame(next.gameId) }
        : null,
      gamesCount: gameCatalog.length,
      // Los temas son dinámicos: se cuentan los que tiene asignados.
      modulesCount: official.modules.length,
    };
  }, [students, practice, assignments, progress]);

  return useResource(load);
}
