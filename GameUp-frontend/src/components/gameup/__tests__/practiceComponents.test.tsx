import { render, screen, userEvent } from '@testing-library/react-native';
import { AudioClipRow } from '../AudioClipRow';
import { MicButton } from '../MicButton';
import { StepIndicator } from '../StepIndicator';

describe('StepIndicator', () => {
  it('anuncia el paso actual con palabras', async () => {
    await render(
      <StepIndicator steps={['Mira', 'Dilo', 'Listo']} current={1} />,
    );
    expect(
      screen.getByRole('progressbar', { name: 'Paso 2 de 3: Dilo' }),
    ).toBeOnTheScreen();
  });
});

describe('MicButton', () => {
  it('cambia su nombre según el estado (no solo el color)', async () => {
    const { rerender } = await render(
      <MicButton recording={false} onPress={jest.fn()} />,
    );
    expect(
      screen.getByRole('button', { name: 'Grabar mi voz' }),
    ).toBeOnTheScreen();

    await rerender(<MicButton recording onPress={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Terminar de grabar' }),
    ).toBeBusy();
  });
});

describe('AudioClipRow', () => {
  it('el botón dice qué se va a escuchar', async () => {
    const onPlay = jest.fn();
    const user = userEvent.setup();
    await render(
      <AudioClipRow kind="model" label="Así suena" onPlay={onPlay} />,
    );
    await user.press(
      screen.getByRole('button', { name: 'Escuchar: Así suena' }),
    );
    expect(onPlay).toHaveBeenCalledTimes(1);
  });
});
