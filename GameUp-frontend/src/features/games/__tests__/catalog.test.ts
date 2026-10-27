import type { Assignment } from '@/data/types';
import {
  findGame,
  gameBadge,
  gameCatalog,
  gameHref,
  gameSections,
} from '../catalog';

const newTask: Assignment = {
  id: 't1',
  gameId: 'findMouth',
  status: 'assigned',
  isNew: true,
};

describe('catálogo de juegos', () => {
  it('tiene los 6 juegos del MVP, cada uno en una sección existente', () => {
    expect(gameCatalog).toHaveLength(6);
    const sectionIds = gameSections.map((section) => section.id);
    gameCatalog.forEach((game) => {
      expect(sectionIds).toContain(game.section);
    });
  });

  it('un juego sin pantalla lleva a «en construcción»', () => {
    expect(gameHref(findGame('memory'))).toEqual({
      pathname: '/student/coming-soon/[game]',
      params: { game: 'memory' },
    });
    expect(gameHref(findGame('speak'))).toBe('/student/speak');
  });

  it('«Tarea» tiene prioridad sobre «Nuevo»', () => {
    expect(gameBadge(findGame('findMouth'), [newTask])).toBe('Tarea');
  });

  it('una tarea ya abierta no muestra «Tarea»', () => {
    expect(
      gameBadge(findGame('findMouth'), [{ ...newTask, isNew: false }]),
    ).toBe('Nuevo');
  });

  it('un juego que no es nuevo y sin tarea no lleva insignia', () => {
    expect(gameBadge(findGame('match'), [])).toBeUndefined();
  });
});
