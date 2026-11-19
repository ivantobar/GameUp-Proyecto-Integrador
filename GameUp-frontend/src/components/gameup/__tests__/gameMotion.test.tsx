import { act, render, screen } from '@testing-library/react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { hintPillStyles, PictureCard } from '@/components/gameup';
import { mouthOptionStates } from '@/components/gameup/MouthOption';
import { pictureCardStates } from '@/components/gameup/PictureCard';
import { memoryCardStyles } from '@/features/memory/components/MemoryCard';
import { colors, motion } from '@/theme';

const apple = { id: 'manzana', label: 'manzana', emoji: '🍎' };

/**
 * Los tipos de Reanimated describen la versión web (sin argumentos); en
 * Jest corre la nativa, que recibe el componente y devuelve su estilo
 * animado actual.
 */
const animatedStyleOf = getAnimatedStyle as unknown as (component: unknown) => {
  transform?: { scale?: number }[];
};

/** Escala actual de la tarjeta (1 si no tiene transformación). */
function breatheScale(): number {
  const { transform } = animatedStyleOf(
    screen.getByTestId('picture-card-breathe'),
  );
  return transform?.find((t) => t.scale !== undefined)?.scale ?? 1;
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('la opción «respira» solo después de la pista o del acierto', () => {
  it('antes de la pista no se mueve (no regala la respuesta)', async () => {
    await render(<PictureCard face={apple} state="idle" onPress={jest.fn()} />);
    await advance(motion.duration.breathe);
    expect(breatheScale()).toBe(1);
  });

  it('con la pista crece un poco y vuelve', async () => {
    await render(<PictureCard face={apple} state="hint" onPress={jest.fn()} />);
    await advance(motion.duration.breathe);
    expect(breatheScale()).toBeGreaterThan(1);
    expect(breatheScale()).toBeLessThanOrEqual(motion.breatheScale);
  });

  it('se detiene sola: nada en bucle infinito', async () => {
    await render(
      <PictureCard face={apple} state="correct" onPress={jest.fn()} />,
    );
    // Dos ciclos completos (subir y bajar) y un margen.
    await advance(motion.duration.breathe * 2 * motion.repeat.breathe + 500);
    expect(breatheScale()).toBe(1);
    // Mucho después, sigue quieta.
    await advance(motion.duration.breathe * 3);
    expect(breatheScale()).toBe(1);
  });
});

describe('el color de cada juego nunca marca el estado de una opción', () => {
  const identity = new Set<string>(Object.values(colors.identidad));

  it.each([
    ['PictureCard', pictureCardStates],
    ['MemoryCard', memoryCardStyles],
    ['HintPill', hintPillStyles],
    ['MouthOption', mouthOptionStates],
  ])('%s usa solo colores de estado de la guía', (_name, states) => {
    Object.values(states).forEach((style) => {
      Object.values(style).forEach((value) => {
        expect(identity.has(String(value))).toBe(false);
      });
    });
  });
});
