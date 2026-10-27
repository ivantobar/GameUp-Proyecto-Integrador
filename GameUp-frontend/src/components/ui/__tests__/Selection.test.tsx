import { render, screen, userEvent } from '@testing-library/react-native';
import { FilterChip } from '../FilterChip';
import { ProgressBar } from '../ProgressBar';
import { SegmentedTabs } from '../SegmentedTabs';

const options = [
  { value: 'vowels', label: 'Vocales' },
  { value: 'syllables', label: 'Sílabas', disabled: true },
] as const;

describe('SegmentedTabs', () => {
  it('marca la pestaña elegida como seleccionada', async () => {
    await render(
      <SegmentedTabs
        accessibilityLabel="Tipo de sonido"
        options={options}
        value="vowels"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Vocales' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Sílabas' })).not.toBeSelected();
  });

  it('una pestaña bloqueada no cambia la selección', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    await render(
      <SegmentedTabs
        accessibilityLabel="Tipo de sonido"
        options={options}
        value="vowels"
        onChange={onChange}
      />,
    );

    const blocked = screen.getByRole('tab', { name: 'Sílabas' });
    await user.press(blocked);

    expect(onChange).not.toHaveBeenCalled();
    expect(blocked).toBeDisabled();
    expect(screen.getByText('Pronto')).toBeOnTheScreen();
  });
});

describe('FilterChip', () => {
  it('informa si está seleccionado', async () => {
    await render(<FilterChip label="Todas" selected onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Todas' })).toBeSelected();
  });
});

describe('ProgressBar', () => {
  it('expone el valor y el texto al lector de pantalla', async () => {
    await render(
      <ProgressBar
        tone="practice"
        value={3}
        max={5}
        label="Llevas 3 de 5 vocales"
      />,
    );

    const bar = screen.getByRole('progressbar', {
      name: 'Llevas 3 de 5 vocales',
    });
    expect(bar).toHaveAccessibilityValue({
      min: 0,
      max: 5,
      now: 3,
      text: 'Llevas 3 de 5 vocales',
    });
  });

  it('no se sale de los límites', async () => {
    await render(
      <ProgressBar tone="official" value={9} max={5} label="Completo" />,
    );
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({
      now: 5,
    });
  });
});
