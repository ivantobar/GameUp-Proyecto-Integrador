import { render, screen, userEvent } from '@testing-library/react-native';
import { CategoryBin } from '../components/CategoryBin';

const fruits = { id: 'frutas', label: 'Frutas', emoji: '🍎' };
const banana = {
  id: 'banano',
  label: 'banano',
  emoji: '🍌',
  categoryId: 'frutas',
};

describe('CategoryBin', () => {
  it('dice qué grupo es y qué tiene, y responde al toque', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <CategoryBin
        category={fruits}
        items={[banana]}
        hint={false}
        disabled={false}
        onPress={onPress}
      />,
    );
    await user.press(
      screen.getByRole('button', { name: 'Grupo Frutas. Tiene: banano' }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('pista: «Va aquí» con palabras', async () => {
    await render(
      <CategoryBin
        category={fruits}
        items={[]}
        hint
        disabled={false}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Va aquí')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {
        name: 'Grupo Frutas. Pista: va aquí. Vacío',
      }),
    ).toBeOnTheScreen();
  });
});
