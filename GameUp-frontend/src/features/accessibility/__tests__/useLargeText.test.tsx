import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { TaskHeroCard } from '@/features/home/components/TaskHeroCard';
import { LARGE_TEXT_SCALE } from '@/theme';
import { isLargeText } from '../useLargeText';

/** Simula la escala de letra del sistema. */
function withFontScale(fontScale: number) {
  return jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
    width: 360,
    height: 780,
    scale: 3,
    fontScale,
  });
}

describe('letra grande (escala del sistema)', () => {
  it('desde el 130 % se considera letra grande', () => {
    expect(isLargeText(1)).toBe(false);
    expect(isLargeText(1.15)).toBe(false);
    expect(isLargeText(LARGE_TEXT_SCALE)).toBe(true);
    expect(isLargeText(2)).toBe(true);
  });

  it.each([1, 1.5, 2])(
    'el aviso de la tarea sigue completo con la letra al %s',
    async (scale) => {
      const dims = withFontScale(scale);
      await render(
        <TaskHeroCard
          gameTitle="Secuenciar"
          game="sequence"
          onStart={jest.fn()}
        />,
      );
      expect(screen.getByText('Secuenciar')).toBeOnTheScreen();
      expect(screen.getByText('Haz esta tarea')).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: '¡Vamos!' })).toBeOnTheScreen();
      dims.mockRestore();
    },
  );
});
