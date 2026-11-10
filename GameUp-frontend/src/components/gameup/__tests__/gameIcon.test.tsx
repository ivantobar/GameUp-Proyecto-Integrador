import { render, screen } from '@testing-library/react-native';
import type { GameId } from '@/data/types';
import { GameCard } from '../GameCard';
import { GameIcon } from '../GameIcon';

const GAMES: GameId[] = [
  'match',
  'classify',
  'sequence',
  'memory',
  'speak',
  'findMouth',
];

describe('GameIcon', () => {
  it.each(GAMES)('dibuja el juego %s y es decorativo', async (game) => {
    await render(<GameIcon game={game} />);
    expect(
      screen.getByTestId(`game-icon-${game}`, { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    // El lector de pantalla no lo lee: el título de la tarjeta dice el juego.
    expect(screen.queryByTestId(`game-icon-${game}`)).toBeNull();
  });
});

describe('GameCard con dibujo del juego', () => {
  it('muestra el dibujo y el lector sigue leyendo solo el texto', async () => {
    await render(
      <GameCard
        title="Emparejar"
        subtitle="Une las parejas"
        icon="match"
        game="match"
        tone="surface"
        onPress={() => {}}
      />,
    );
    expect(
      screen.getByTestId('game-icon-match', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Emparejar. Une las parejas' }),
    ).toBeOnTheScreen();
  });
});
