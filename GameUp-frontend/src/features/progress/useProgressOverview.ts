import { useCallback } from 'react';
import { toPercent } from '@/components/ui';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import { moduleCatalog, type ModuleDefinition } from './modules';

export interface ModuleProgressItem {
  module: ModuleDefinition;
  /** Porcentaje de actividades validadas (0 a 100). */
  percent: number;
}

export interface ProgressOverview {
  modules: ModuleProgressItem[];
  /** Actividades que esperan la revisión del docente (no suman todavía). */
  pendingValidation: number;
}

/**
 * «Mi progreso»: porcentaje por tema calculado SOLO con actividades
 * validadas por el docente (regla de negocio 2). Lo pendiente de validación
 * no suma. Un tema sin datos se muestra en 0 %.
 */
export function useProgressOverview() {
  const { students, progress } = useRepositories();

  const load = useCallback(async (): Promise<ProgressOverview> => {
    const student = await students.getCurrentStudent();
    const official = await progress.getOfficialProgress(student.id);
    return {
      modules: moduleCatalog.map((module) => {
        const item = official.modules.find((m) => m.moduleId === module.id);
        return {
          module,
          percent: item ? toPercent(item.validated, item.total) : 0,
        };
      }),
      pendingValidation: official.pendingValidation,
    };
  }, [students, progress]);

  return useResource(load);
}
