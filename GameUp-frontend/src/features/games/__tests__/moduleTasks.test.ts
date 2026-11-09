import type { Assignment } from '@/data/types';
import {
  groupByModule,
  moduleBadge,
  NO_MODULE_ID,
  taskBadge,
  taskTitle,
  tasksCountText,
} from '../moduleTasks';

const task = (overrides: Partial<Assignment>): Assignment => ({
  id: 't',
  activityId: '1',
  gameId: 'match',
  status: 'assigned',
  isNew: false,
  ...overrides,
});

describe('tareas de la profe por módulo', () => {
  it('agrupa por módulo en el orden en que llegan y ordena por «orden»', () => {
    const groups = groupByModule([
      task({ id: 'a2', moduleId: '1', moduleTitle: 'La A', order: 2 }),
      task({ id: 'c1', moduleId: '2', moduleTitle: 'Colores', order: 1 }),
      task({ id: 'a1', moduleId: '1', moduleTitle: 'La A', order: 1 }),
    ]);
    expect(groups.map((g) => g.title)).toEqual(['La A', 'Colores']);
    expect(groups[0]?.tasks.map((t) => t.id)).toEqual(['a1', 'a2']);
  });

  it('sin módulo, todas van juntas en «Tareas de tu profe»', () => {
    const [group] = groupByModule([task({ id: 'x' }), task({ id: 'y' })]);
    expect(group?.moduleId).toBe(NO_MODULE_ID);
    expect(group?.title).toBe('Tareas de tu profe');
    expect(group?.tasks).toHaveLength(2);
  });

  it('cuenta nuevas y para repetir; la insignia del módulo prefiere «Nuevo»', () => {
    const [group] = groupByModule([
      task({ moduleId: '1', isNew: true }),
      task({ moduleId: '1', status: 'rejected' }),
    ]);
    expect(group?.newCount).toBe(1);
    expect(group?.againCount).toBe(1);
    expect(group && moduleBadge(group)).toBe('Nuevo');
  });

  it('insignias y textos de una tarea', () => {
    expect(taskBadge(task({ status: 'rejected', isNew: true }))).toBe(
      'Otra vez',
    );
    expect(taskBadge(task({ isNew: true }))).toBe('Nueva');
    expect(taskBadge(task({}))).toBeUndefined();
    expect(taskTitle(task({ title: 'Une los colores' }))).toBe(
      'Une los colores',
    );
    expect(taskTitle(task({ gameId: 'memory' }))).toBe('Memoria');
    expect(tasksCountText(1)).toBe('1 juego');
    expect(tasksCountText(3)).toBe('3 juegos');
  });
});
