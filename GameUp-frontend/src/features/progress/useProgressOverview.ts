import { useCallback } from 'react';
import { toPercent } from '@/components/ui';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import { moduleDefinitionFor, type ModuleDefinition } from './modules';

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
 * no suma. Los temas son dinámicos: se muestran los que llegan, en ese
 * orden y con su nombre.
 */
export function useProgressOverview() {
  const { students, progress } = useRepositories();

  const load = useCallback(async (): Promise<ProgressOverview> => {
    const student = await students.getCurrentStudent();
    const official = await progress.getOfficialProgress(student.id);
    return {
      modules: official.modules.map((item) => ({
        module: moduleDefinitionFor(item),
        percent: toPercent(item.validated, item.total),
      })),
      pendingValidation: official.pendingValidation,
    };
  }, [students, progress]);

  return useResource(load);
}
