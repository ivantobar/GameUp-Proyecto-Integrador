import type { MemoryBoard } from '@/data/types';
import {
  cardView,
  createMemory,
  currentCards,
  isBoardSolved,
  memoryReducer,
  type MemoryState,
} from '../memoryGame';

const boards: MemoryBoard[] = [
  {
    id: 'b1',
    pairs: [
      { id: 'perro', label: 'perro', emoji: '🐶' },
      { id: 'gato', label: 'gato', emoji: '🐱' },
    ],
  },
  { id: 'b2', pairs: [{ id: 'sol', label: 'sol', emoji: '☀️' }] },
];

/** Sin mezclar: la lista queda perro-1, perro-2, gato-1, gato-2. */
const noShuffle = () => 0.999;

function start(): MemoryState {
  return createMemory(boards, noShuffle);
}

function indexOf(state: MemoryState, key: string): number {
  return currentCards(state).findIndex((card) => card.key === key);
}

function flip(state: MemoryState, key: string): MemoryState {
  return memoryReducer(state, { type: 'flip', index: indexOf(state, key) });
}

describe('memoryReducer', () => {
  it('cada dibujo aparece en dos cartas', () => {
    const cards = currentCards(start());
    expect(cards).toHaveLength(4);
    expect(cards.filter((c) => c.faceId === 'perro')).toHaveLength(2);
  });

  it('dos cartas iguales quedan como pareja', () => {
    let state = flip(start(), 'perro-1');
    expect(cardView(state, indexOf(state, 'perro-1'))).toBe('up');
    state = flip(state, 'perro-2');
    expect(state.matched).toEqual(['perro']);
    expect(cardView(state, indexOf(state, 'perro-2'))).toBe('matched');
  });

  it('dos distintas se quedan a la vista, sin temporizador, hasta tocar otra', () => {
    let state = flip(flip(start(), 'perro-1'), 'gato-1');
    expect(cardView(state, indexOf(state, 'perro-1'))).toBe('mismatch');
    expect(cardView(state, indexOf(state, 'gato-1'))).toBe('mismatch');
    expect(state.mismatches).toBe(1);

    state = flip(state, 'gato-2');
    expect(state.open).toEqual([indexOf(state, 'gato-2')]);
    expect(cardView(state, indexOf(state, 'perro-1'))).toBe('down');
  });

  it('tocar una carta ya abierta o ya emparejada no cambia nada', () => {
    const open = flip(start(), 'perro-1');
    expect(flip(open, 'perro-1')).toBe(open);
    const matched = flip(open, 'perro-2');
    expect(flip(matched, 'perro-1')).toBe(matched);
  });

  it('con todas las parejas, «Siguiente» pasa al otro tablero y luego termina', () => {
    let state = start();
    expect(memoryReducer(state, { type: 'next' })).toBe(state);
    state = flip(flip(state, 'perro-1'), 'perro-2');
    state = flip(flip(state, 'gato-1'), 'gato-2');
    expect(isBoardSolved(state)).toBe(true);

    state = memoryReducer(state, { type: 'next' });
    expect(state.board).toBe(1);
    expect(state.matched).toEqual([]);

    state = flip(flip(state, 'sol-1'), 'sol-2');
    state = memoryReducer(state, { type: 'next' });
    expect(state.finished).toBe(true);
  });
});
