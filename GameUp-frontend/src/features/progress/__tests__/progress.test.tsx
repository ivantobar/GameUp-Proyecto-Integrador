import { render, screen } from '@testing-library/react-native';
import { toPercent } from '@/components/ui';
import { ModuleProgressCard } from '../components/ModuleProgressCard';
import { moduleCatalog } from '../modules';

describe('toPercent', () => {
  it('redondea y se mantiene entre 0 y 100', () => {
    expect(toPercent(11, 20)).toBe(55);
    expect(toPercent(2, 3)).toBe(67);
    expect(toPercent(9, 5)).toBe(100);
    expect(toPercent(-1, 5)).toBe(0);
  });

  it('sin actividades asignadas, el avance es 0 %', () => {
    expect(toPercent(0, 0)).toBe(0);
  });
});

describe('ModuleProgressCard', () => {
  it('dice el tema y el porcentaje con palabras, no solo con la barra', async () => {
    const colors = moduleCatalog[0];
    if (!colors) throw new Error('Falta el tema Colores');
    await render(<ModuleProgressCard module={colors} percent={80} />);

    const bar = screen.getByRole('progressbar', {
      name: 'Colores, 80 por ciento',
    });
    expect(bar).toHaveAccessibilityValue({ min: 0, max: 100, now: 80 });
    expect(screen.getByText('80%')).toBeOnTheScreen();
  });
});
