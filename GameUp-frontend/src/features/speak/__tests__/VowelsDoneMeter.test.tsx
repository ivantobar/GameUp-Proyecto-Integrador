import { render, screen } from '@testing-library/react-native';
import { VowelsDoneMeter } from '../components/VowelsDoneMeter';

describe('VowelsDoneMeter', () => {
  it('se ve «Vocales terminadas: 2 de 5» y se lee como un solo elemento', async () => {
    await render(
      <VowelsDoneMeter
        vowels={[
          { vowel: 'a', stars: 3 },
          { vowel: 'e', stars: 3 },
          { vowel: 'i', stars: 2 },
          { vowel: 'o', stars: 1 },
          { vowel: 'u', stars: 0 },
        ]}
      />,
    );

    expect(screen.getByText('Vocales terminadas: 2 de 5')).toBeOnTheScreen();
    const meter = screen.getByRole('progressbar', {
      name: 'Vocales terminadas: 2 de 5: A y E',
    });
    expect(meter).toHaveAccessibilityValue({ min: 0, max: 5, now: 2 });
    // Los círculos no se leen uno por uno.
    expect(screen.queryByRole('progressbar', { name: 'A' })).toBeNull();
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
  });
});
