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

<<<<<<< HEAD
  it('un juego sin pantalla lleva a «en construcción»', () => {
    expect(gameHref(findGame('memory'))).toEqual({
      pathname: '/student/coming-soon/[game]',
      params: { game: 'memory' },
    });
    expect(gameHref(findGame('speak'))).toBe('/student/speak');
=======
  it('los 6 juegos del MVP ya tienen su pantalla', () => {
    gameCatalog.forEach((game) => {
      expect(game.href).not.toBeNull();
    });
    expect(gameHref(findGame('speak'))).toBe('/student/speak');
    expect(gameHref(findGame('memory'))).toBe('/student/memory');
  });

  it('un juego sin pantalla lleva a «en construcción»', () => {
    const draft = { ...findGame('memory'), href: null };
    expect(gameHref(draft)).toEqual({
      pathname: '/student/coming-soon/[game]',
      params: { game: 'memory' },
    });
>>>>>>> d35da8ccfdd8dc6504d71a290c9fdc1a1ad75028
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
