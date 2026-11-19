import {
  contentDrawings,
  illustrationFor,
  normalizeWord,
} from '@/components/gameup/illustrations';
import {
  classifySets,
  matchRounds,
  memoryBoards,
  sequenceRoutines,
} from '@/data/mock/gameContent';

describe('diccionario de ilustraciones de Pictogram', () => {
  it('normaliza mayúsculas, tildes y espacios', () => {
    expect(normalizeWord('  Balón ')).toBe('balon');
    expect(normalizeWord('TRIÁNGULO')).toBe('triangulo');
    expect(normalizeWord('Cepillo   de  dientes')).toBe('cepillo de dientes');
  });

  it('encuentra el dibujo por la palabra exacta, sin importar tildes ni mayúsculas', () => {
    expect(illustrationFor({ id: 'a', label: 'Plátano' })).toBe('banano');
    expect(illustrationFor({ id: 'b', label: 'JABÓN' })).toBe('jabon');
    expect(illustrationFor({ id: 'c', label: 'cepillo de dientes' })).toBe(
      'cepillo',
    );
  });

  it('nunca da un dibujo aproximado: sin coincidencia exacta, null', () => {
    // Palabras que contienen o se parecen a una del diccionario.
    expect(illustrationFor({ id: 'a', label: 'manzanas verdes' })).toBeNull();
    expect(illustrationFor({ id: 'b', label: 'perrito' })).toBeNull();
    expect(illustrationFor({ id: 'c', label: 'Abrir la llave' })).toBeNull();
    expect(illustrationFor({ id: 'd', label: 'llave' })).toBeNull();
  });

  it('traduce los emojis provisionales, con o sin selector de variante', () => {
    expect(illustrationFor({ id: 'a', label: 'sol', emoji: '☀️' })).toBe('sol');
    expect(illustrationFor({ id: 'b', label: 'x', emoji: '☀' })).toBe('sol');
    expect(illustrationFor({ id: 'c', label: 'Comida', emoji: '🍽️' })).toBe(
      'plato',
    );
  });

  it('todo el contenido de ejemplo tiene dibujo propio o texto', () => {
    const faces = JSON.stringify([
      matchRounds,
      classifySets,
      sequenceRoutines,
      memoryBoards,
    ]);
    const emojis = [...faces.matchAll(/"emoji":"([^"]+)"/g)].map((m) => m[1]!);
    expect(emojis.length).toBeGreaterThan(0);
    emojis.forEach((emoji) => {
      const drawing = illustrationFor({ id: 'x', label: '', emoji });
      expect([emoji, drawing]).toEqual([emoji, expect.any(String)]);
      expect(contentDrawings).toHaveProperty(drawing!);
    });
  });
});
