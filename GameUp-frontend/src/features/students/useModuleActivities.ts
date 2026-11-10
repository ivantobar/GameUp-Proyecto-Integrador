import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { ModuleActivity, ModuleId } from '@/data/types';

/**
 * Actividades activas de un módulo, para verlas antes de asignarlo. Quien
 * lo usa debe montarlo con `key={moduleId}`: así, al cambiar de módulo,
 * vuelve a «cargando» y nunca muestra las del módulo anterior.
 */
export function useModuleActivities(moduleId: ModuleId) {
  const { assignmentManagement } = useRepositories();
  const load = useCallback(
    (): Promise<ModuleActivity[]> =>
      assignmentManagement.listModuleActivities(moduleId),
    [assignmentManagement, moduleId],
  );
  return useResource(load);
}
