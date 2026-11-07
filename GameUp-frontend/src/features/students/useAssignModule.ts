import { useCallback, useState } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { AssignableModule } from '@/data/types';
import { assignErrorText } from './assignmentText';

export interface ModuleChoice {
  module: AssignableModule;
  /** Ya está asignado y sin terminar: no se puede volver a asignar. */
  alreadyAssigned: boolean;
}

/**
 * «Asignar actividad»: módulos publicados para elegir, marcando los que el
 * estudiante ya tiene sin terminar, y la acción de asignar.
 */
export function useAssignModule(studentId: string) {
  const { assignmentManagement } = useRepositories();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (): Promise<ModuleChoice[]> => {
    const [modules, assignments] = await Promise.all([
      assignmentManagement.listAssignableModules(),
      assignmentManagement.listForStudent(studentId),
    ]);
    const open = new Set(
      assignments.filter((a) => a.state !== 'completed').map((a) => a.moduleId),
    );
    return modules.map((module) => ({
      module,
      alreadyAssigned: open.has(module.id),
    }));
  }, [assignmentManagement, studentId]);

  const { resource, reload, refresh } = useResource(load);

  /** Devuelve `true` si quedó asignado. */
  const assign = useCallback(
    async (moduleId: string, suggestedDate?: string): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        await assignmentManagement.assign({
          moduleId,
          studentId,
          ...(suggestedDate ? { suggestedDate } : {}),
        });
        return true;
      } catch (problem) {
        setError(assignErrorText(problem));
        // Otro adulto pudo asignarlo mientras tanto: se actualiza la lista.
        refresh();
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [assignmentManagement, studentId, refresh],
  );

  return { resource, reload, error, submitting, assign };
}
