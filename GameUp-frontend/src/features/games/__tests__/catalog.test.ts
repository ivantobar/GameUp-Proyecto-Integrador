import {
  findGame,
  gameBadge,
  gameCatalog,
  gameHref,
  gameSections,
} from '../catalog';

describe('catálogo de juegos', () => {
  it('tiene los 6 juegos del MVP, cada uno en una sección existente', () => {
    expect(gameCatalog).toHaveLength(6);
    const sectionIds = gameSections.map((section) => section.id);
    gameCatalog.forEach((game) => {
      expect(sectionIds).toContain(game.section);
    });
  });

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
  });

  it('las tareas ya no marcan los juegos: un juego nuevo dice «Nuevo»', () => {
    expect(gameBadge(findGame('findMouth'))).toBe('Nuevo');
  });

  it('un juego que no es nuevo no lleva insignia', () => {
    expect(gameBadge(findGame('match'))).toBeUndefined();
  });
});
