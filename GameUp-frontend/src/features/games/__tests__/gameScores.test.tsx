import { render, screen } from '@testing-library/react-native';
import { Pictogram } from '@/components/gameup';
import {
  createMemory,
  memoryReducer,
  memoryScore,
} from '@/features/memory/memoryGame';
import { createTurnGame, turnGameReducer, turnScore } from '../turnGame';

describe('lo que se envía al docente (no es una nota)', () => {
  it('turnos: los resueltos al primer intento y el total del juego', () => {
    // Dos rondas: 1 turno y 2 turnos (por ejemplo, Clasificar).
    let state = createTurnGame([1, 2]);
    state = turnGameReducer(state, { type: 'answer', correct: true });
    state = turnGameReducer(state, { type: 'next' });
    state = turnGameReducer(state, { type: 'answer', correct: false });
    state = turnGameReducer(state, { type: 'answer', correct: true });
    state = turnGameReducer(state, { type: 'answer', correct: true });

    expect(turnScore(state)).toEqual({
      kind: 'turns',
      firstTryCorrect: 2,
      total: 3,
    });
  });

  it('Memoria: parejas de todos los tableros y cartas distintas abiertas', () => {
    const boards = [
      {
        id: 'm0',
        pairs: [
          { id: 'a', label: 'a' },
          { id: 'o', label: 'o' },
        ],
      },
      { id: 'm1', pairs: [{ id: 'u', label: 'u' }] },
    ];
    let state = createMemory(boards, () => 0.5);
    const cards = state.boards[0] ?? [];
    const first = cards.findIndex((c) => c.faceId === 'a');
    const other = cards.findIndex((c) => c.faceId === 'o');
    state = memoryReducer(state, { type: 'flip', index: first });
    state = memoryReducer(state, { type: 'flip', index: other });

    expect(memoryScore(state)).toEqual({
      kind: 'memory',
      pairs: 3,
      mismatches: 1,
    });
  });
});

describe('Pictogram', () => {
  it('con imagen de la fundación, la muestra (repetida si es una cantidad)', async () => {
    await render(
      <Pictogram
        face={{
          id: 'p',
          label: 'perro',
          imageUri: 'https://storage.prueba/perro.png',
          emoji: '🐶',
          count: 2,
        }}
      />,
    );
    expect(
      screen.getAllByTestId('pictogram-image', { includeHiddenElements: true }),
    ).toHaveLength(2);
    // La imagen reemplaza al dibujo provisional.
    expect(
      screen.queryByText('🐶', { includeHiddenElements: true }),
    ).toBeNull();
  });

  it('sin imagen, conserva el dibujo provisional como respaldo', async () => {
    await render(<Pictogram face={{ id: 'p', label: 'perro', emoji: '🐶' }} />);
    expect(
      screen.getByText('🐶', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    expect(
      screen.queryByTestId('pictogram-image', { includeHiddenElements: true }),
    ).toBeNull();
  });

  it('sin imagen, dibujo ni texto, muestra la etiqueta', async () => {
    await render(<Pictogram face={{ id: 'p', label: 'gato' }} />);
    expect(
      screen.getByText('gato', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });
});
