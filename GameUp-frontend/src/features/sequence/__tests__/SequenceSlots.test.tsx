import { render, screen } from '@testing-library/react-native';
import { SequenceSlots } from '../components/SequenceSlots';

describe('SequenceSlots', () => {
  it('lee los pasos ordenados y los que faltan', async () => {
    await render(
      <SequenceSlots
        total={3}
        placed={[{ id: 'llave', label: 'Abrir la llave', emoji: '🚰' }]}
      />,
    );
    expect(
      screen.getByLabelText('Pasos. 1: Abrir la llave. 2: falta. 3: falta'),
    ).toBeOnTheScreen();
  });
});
