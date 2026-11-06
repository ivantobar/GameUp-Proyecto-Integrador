import type { Assignment } from '@/data/types';
import {
  assignmentHref,
  findGame,
  gameBadge,
  nextAssignment,
} from '../catalog';
import { parseActivityId, parseDelivery } from '../delivery';

const task = (overrides: Partial<Assignment>): Assignment => ({
  id: 't',
  activityId: 'a1',
  gameId: 'findMouth',
  status: 'assigned',
  isNew: true,
  ...overrides,
});

describe('próxima tarea para abrir', () => {
  it('primero las nuevas y luego las que la profe pidió repetir', () => {
    const rejected = task({ id: 'r', status: 'rejected', isNew: false });
    const fresh = task({ id: 'n', gameId: 'memory' });

    expect(nextAssignment([rejected, fresh])?.id).toBe('n');
    expect(nextAssignment([rejected])?.id).toBe('r');
  });

  it('una tarea ya empezada (ni nueva ni rechazada) no se ofrece', () => {
    expect(nextAssignment([task({ isNew: false })])).toBeNull();
  });

  it('por juego: solo las de ese juego', () => {
    const tasks = [task({ id: 'b' }), task({ id: 'm', gameId: 'memory' })];
    expect(nextAssignment(tasks, 'memory')?.id).toBe('m');
    expect(nextAssignment(tasks, 'speak')).toBeNull();
  });

  it('una tarea para repetir también lleva la insignia «Tarea»', () => {
    expect(
      gameBadge(findGame('match'), [
        task({ gameId: 'match', status: 'rejected', isNew: false }),
      ]),
    ).toBe('Tarea');
  });
});

describe('ruta de una tarea (con actividadId)', () => {
  it('Habla conmigo va directo a «Mira» de su vocal', () => {
    expect(
      assignmentHref(task({ gameId: 'speak', vowel: 'a', activityId: '8' })),
    ).toEqual({
      pathname: '/student/speak/[vowel]/look',
      params: { vowel: 'a', actividadId: '8' },
    });
  });

  it.each([
    ['findMouth', '/student/find-mouth'],
    ['match', '/student/match'],
    ['classify', '/student/classify'],
    ['sequence', '/student/sequence'],
    ['memory', '/student/memory'],
  ] as const)('%s lleva su actividadId', (gameId, pathname) => {
    expect(assignmentHref(task({ gameId, activityId: '9' }))).toEqual({
      pathname,
      params: { actividadId: '9' },
    });
  });

  it('sin actividad, el juego se abre libre', () => {
    expect(assignmentHref(task({ activityId: undefined }))).toBe(
      '/student/find-mouth',
    );
  });
});

describe('parámetros de ruta', () => {
  it('actividadId: solo un id simple; si no, juego libre', () => {
    expect(parseActivityId('8')).toBe('8');
    expect(parseActivityId(['act-demo-001'])).toBe('act-demo-001');
    expect(parseActivityId(undefined)).toBeNull();
    expect(parseActivityId('../../x')).toBeNull();
  });

  it('envío: un valor desconocido se trata como enviado al docente', () => {
    expect(parseDelivery('practice')).toBe('practice');
    expect(parseDelivery('notSent')).toBe('notSent');
    expect(parseDelivery('otro')).toBe('review');
  });
});
