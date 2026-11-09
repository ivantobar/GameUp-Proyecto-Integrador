import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import { groupByModule, type ModuleTasks } from './moduleTasks';

/** Tareas pendientes de la profe, agrupadas por módulo. */
export function useModuleTasks() {
  const { students, assignments } = useRepositories();
  const load = useCallback(async (): Promise<ModuleTasks[]> => {
    const student = await students.getCurrentStudent();
    return groupByModule(await assignments.listPendingForStudent(student.id));
  }, [students, assignments]);
  return useResource(load);
}
