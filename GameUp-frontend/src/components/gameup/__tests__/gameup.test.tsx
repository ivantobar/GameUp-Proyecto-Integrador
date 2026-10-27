import { render, screen, userEvent } from '@testing-library/react-native';
import { VOWELS } from '@/data/types';
import { Character } from '../Character';
import { Mouth } from '../Mouth';
import { SoundTile } from '../SoundTile';

describe('SoundTile', () => {
  it.each([
    [0, 'A. Sin practicar, 0 de 3 estrellas'],
    [1, 'A. En curso, 1 de 3 estrellas'],
    [3, 'A. Practicada, 3 de 3 estrellas'],
  ] as const)(
    'con %i estrellas dice su estado con palabras',
    async (stars, label) => {
      await render(<SoundTile letter="A" stars={stars} onPress={jest.fn()} />);
      expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
    },
  );

  it('responde al toque', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<SoundTile letter="O" stars={1} onPress={onPress} />);
    await user.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Mouth', () => {
  it.each(VOWELS)('la boca de la %s se describe al lector', async (vowel) => {
    await render(<Mouth vowel={vowel} />);
    expect(screen.getByRole('image')).toHaveAccessibleName(
      new RegExp(`decir ${vowel.toUpperCase()}`),
    );
  });

  it('decorativa: no se anuncia', async () => {
    await render(<Mouth vowel="o" decorative />);
    expect(screen.queryByRole('image')).toBeNull();
  });
});

describe('Character', () => {
  it('sin descripción es decorativo', async () => {
    await render(<Character mouth="o" />);
    expect(screen.queryByRole('image')).toBeNull();
  });

  it('con descripción se anuncia como imagen', async () => {
    await render(
      <Character mouth="o" accessibilityLabel="El personaje dice O" />,
    );
    expect(
      screen.getByRole('image', { name: 'El personaje dice O' }),
    ).toBeOnTheScreen();
  });
});
