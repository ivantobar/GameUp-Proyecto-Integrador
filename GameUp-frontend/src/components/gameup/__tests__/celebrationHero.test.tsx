import { render, screen } from '@testing-library/react-native';
import { CelebrationHero } from '@/components/gameup';
import { celebrationCharacterSize } from '@/components/gameup/CelebrationHero';
import { sizes } from '@/theme';

describe('pantallas de «¡Listo!»: tamaño del personaje', () => {
  it('grande solo en pantallas altas y sin letra grande', () => {
    expect(celebrationCharacterSize(sizes.tallScreen, 1)).toBe('lg');
    expect(celebrationCharacterSize(915, 1.15)).toBe('lg');
    // Pantalla baja: el mediano, para no desplazar.
    expect(celebrationCharacterSize(780, 1)).toBe('md');
    // Letra grande: el mediano, aunque la pantalla sea alta.
    expect(celebrationCharacterSize(915, 1.3)).toBe('md');
  });

  it('muestra el título, el mensaje y las tres estrellas', async () => {
    await render(
      <CelebrationHero
        cheer="¡Lo lograste!"
        message="Ordenaste 2 rutinas"
        starsLabel="Tres estrellas por jugar"
      />,
    );
    expect(screen.getByText('¡Lo lograste!')).toBeOnTheScreen();
    expect(screen.getByText('Ordenaste 2 rutinas')).toBeOnTheScreen();
    expect(screen.getByLabelText('Tres estrellas por jugar')).toBeOnTheScreen();
  });
});
