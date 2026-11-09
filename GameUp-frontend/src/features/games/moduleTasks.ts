import type { Assignment, ModuleId } from '@/data/types';
import { findGame } from './catalog';

/**
 * Tareas de la profe agrupadas por módulo (tema). Son distintas de los
 * juegos por niveles: una tarea cuenta para el progreso de su módulo y no
 * sube el nivel de la escalera.
 */
export interface ModuleTasks {
  moduleId: ModuleId;
  title: string;
  /** Actividades que faltan, en el orden del módulo. */
  tasks: Assignment[];
  /** Cuántas aún no ha abierto el niño. */
  newCount: number;
  /** Cuántas pidió la profe practicar otra vez. */
  againCount: number;
}

/** Sin módulo (datos viejos o simulados): todas juntas en un grupo. */
export const NO_MODULE_ID = 'sin-modulo';
const NO_MODULE_TITLE = 'Tareas de tu profe';

/** Agrupa las tareas pendientes por módulo, en el orden en que llegan. */
export function groupByModule(pending: readonly Assignment[]): ModuleTasks[] {
  const groups = new Map<ModuleId, ModuleTasks>();
  for (const task of pending) {
    const moduleId = task.moduleId ?? NO_MODULE_ID;
    let group = groups.get(moduleId);
    if (!group) {
      group = {
        moduleId,
        title: task.moduleTitle ?? NO_MODULE_TITLE,
        tasks: [],
        newCount: 0,
        againCount: 0,
      };
      groups.set(moduleId, group);
    }
    group.tasks.push(task);
    if (task.isNew) group.newCount += 1;
    if (task.status === 'rejected') group.againCount += 1;
  }
  for (const group of groups.values()) {
    group.tasks.sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER),
    );
  }
  return [...groups.values()];
}

/** «2 juegos» / «1 juego». */
export function tasksCountText(count: number): string {
  return count === 1 ? '1 juego' : `${count} juegos`;
}

/** Insignia de un módulo: «Nuevo» si trae algo sin abrir, «Otra vez» si la profe pidió repetir. */
export function moduleBadge(group: ModuleTasks): string | undefined {
  if (group.newCount > 0) return 'Nuevo';
  if (group.againCount > 0) return 'Otra vez';
  return undefined;
}

/** Insignia de una tarea dentro de su módulo. */
export function taskBadge(task: Assignment): string | undefined {
  if (task.status === 'rejected') return 'Otra vez';
  if (task.isNew) return 'Nueva';
  return undefined;
}

/** Nombre que se ve: el de la actividad o, si no llegó, el del juego. */
export function taskTitle(task: Assignment): string {
  return task.title ?? findGame(task.gameId).title;
}
