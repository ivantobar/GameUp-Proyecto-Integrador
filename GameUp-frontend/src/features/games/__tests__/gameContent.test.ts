import {
  classifySets,
  matchRounds,
  memoryBoards,
  sequenceRoutines,
} from '@/data/mock/gameContent';

/**
 * El contenido de ejemplo (y, más adelante, el que llegue de la API) debe
 * cumplir las reglas pedagógicas: pocas opciones por pantalla y respuestas
 * que existan.
 */
describe('contenido de los juegos «Pensar y recordar»', () => {
  it('Emparejar: de 2 a 4 opciones y la respuesta está entre ellas', () => {
    matchRounds.forEach((round) => {
      expect(round.options.length).toBeGreaterThanOrEqual(2);
      expect(round.options.length).toBeLessThanOrEqual(4);
      expect(round.options.map((o) => o.id)).toContain(round.answerId);
      expect(new Set(round.options.map((o) => o.id)).size).toBe(
        round.options.length,
      );
    });
  });

  it('Clasificar: 2 grupos y cada elemento va a uno de ellos', () => {
    classifySets.forEach((set) => {
      expect(set.categories).toHaveLength(2);
      const ids = set.categories.map((c) => c.id);
      set.items.forEach((item) => expect(ids).toContain(item.categoryId));
    });
  });

  it('Secuenciar: de 2 a 4 pasos con nombres distintos', () => {
    sequenceRoutines.forEach((routine) => {
      expect(routine.steps.length).toBeGreaterThanOrEqual(2);
      expect(routine.steps.length).toBeLessThanOrEqual(4);
      expect(new Set(routine.steps.map((s) => s.id)).size).toBe(
        routine.steps.length,
      );
    });
  });

  it('Memoria: como máximo 4 cartas por tablero', () => {
    memoryBoards.forEach((board) => {
      expect(board.pairs.length * 2).toBeLessThanOrEqual(4);
    });
  });

  it('todo lo que se muestra tiene un nombre para oírlo', () => {
    const faces = [
      ...matchRounds.flatMap((r) => [r.prompt, ...r.options]),
      ...classifySets.flatMap((s) => [...s.categories, ...s.items]),
      ...sequenceRoutines.flatMap((r) => r.steps),
      ...memoryBoards.flatMap((b) => b.pairs),
    ];
    faces.forEach((face) => {
      expect(face.label.trim().length).toBeGreaterThan(0);
      expect(face.emoji ?? face.text).toBeTruthy();
    });
  });
});
