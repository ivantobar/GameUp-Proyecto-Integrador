import { buttonDisabled, buttonVariants } from '@/components/ui/Button';
import { iconButtonVariants } from '@/components/ui/IconButton';
import { badgeTones } from '@/components/ui/Badge';
import { noticeTones } from '@/components/ui/Notice';
import { textTones } from '@/components/ui/AppText';
import { colors, MIN_FONT_SIZE, sizes, typography } from '@/theme';
import { AA, contrastRatio } from '@/theme/contrast';

/**
 * Estas pruebas convierten las reglas de la guía en comprobaciones
 * automáticas: si alguien cambia un color o un tamaño y rompe una regla,
 * la prueba falla.
 */
describe('contraste de colores (WCAG AA)', () => {
  it('reproduce los valores que cita la guía', () => {
    expect(
      contrastRatio(colors.texto.sobreOscuro, colors.marca.verde),
    ).toBeCloseTo(3.7, 1);
    expect(
      contrastRatio(colors.texto.sobreOscuro, colors.marca.naranja),
    ).toBeCloseTo(2.3, 1);
    expect(
      contrastRatio(colors.texto.sobreOscuro, colors.verde.oscuro),
    ).toBeCloseTo(6.3, 1);
  });

  it('nunca pone texto blanco sobre naranja: no llega a AA', () => {
    expect(
      contrastRatio(colors.texto.sobreOscuro, colors.marca.naranja),
    ).toBeLessThan(AA.text);
  });

  it.each([
    ['texto principal sobre gris', colors.texto.principal, colors.marca.gris],
    ['texto secundario sobre gris', colors.texto.secundario, colors.marca.gris],
    [
      'texto secundario sobre blanco',
      colors.texto.secundario,
      colors.superficie.blanca,
    ],
    [
      'texto secundario sobre verde suave',
      colors.texto.secundario,
      colors.verde.suave,
    ],
    [
      'texto secundario sobre naranja suave',
      colors.texto.secundario,
      colors.naranja.suave,
    ],
    [
      'verde oscuro sobre blanco',
      colors.verde.oscuro,
      colors.superficie.blanca,
    ],
    ['verde oscuro sobre verde suave', colors.verde.oscuro, colors.verde.suave],
    ['café sobre naranja suave', colors.cafe.oscuro, colors.naranja.suave],
    [
      'blanco sobre verde profundo',
      colors.texto.sobreOscuro,
      colors.verde.profundo,
    ],
    [
      'texto principal sobre naranja',
      colors.texto.principal,
      colors.marca.naranja,
    ],
    [
      'texto principal sobre naranja presionado',
      colors.texto.principal,
      colors.naranja.presionado,
    ],
  ])('%s cumple AA para texto', (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(
      AA.text,
    );
  });

  it('la estrella vacía cumple el mínimo para gráficos sobre blanco', () => {
    expect(
      contrastRatio(colors.estrella.vacia, colors.superficie.blanca),
    ).toBeGreaterThanOrEqual(AA.graphic);
  });

  it('cada variante de botón cumple AA en estado normal y presionado', () => {
    Object.values(buttonVariants).forEach((variant) => {
      const text = textTones[variant.text];
      // El enlace es transparente: se mide contra el fondo gris de la app.
      const normal =
        variant.background === colors.transparente
          ? colors.marca.gris
          : variant.background;
      expect(contrastRatio(text, normal)).toBeGreaterThanOrEqual(AA.text);
      expect(
        contrastRatio(text, variant.pressedBackground),
      ).toBeGreaterThanOrEqual(AA.text);
    });
    expect(
      contrastRatio(textTones[buttonDisabled.text], buttonDisabled.background),
    ).toBeGreaterThanOrEqual(AA.text);
  });

  it('los íconos de los botones cumplen el mínimo para gráficos', () => {
    Object.values(iconButtonVariants).forEach((variant) => {
      expect(
        contrastRatio(variant.icon, variant.background),
      ).toBeGreaterThanOrEqual(AA.graphic);
      expect(
        contrastRatio(variant.icon, variant.pressedBackground),
      ).toBeGreaterThanOrEqual(AA.graphic);
    });
  });

  it('las insignias y los avisos cumplen AA', () => {
    Object.values(badgeTones).forEach((tone) => {
      expect(
        contrastRatio(textTones[tone.text], tone.background),
      ).toBeGreaterThanOrEqual(AA.text);
    });
    Object.values(noticeTones).forEach((tone) => {
      expect(
        contrastRatio(textTones[tone.message], tone.background),
      ).toBeGreaterThanOrEqual(AA.text);
    });
  });
});

describe('ilustración', () => {
  it('el contorno de la boca contrasta con la piel (gráficos ≥ 3:1)', () => {
    const { labioBorde, bocaInterior, piel } = colors.ilustracion;
    expect(contrastRatio(labioBorde, piel)).toBeGreaterThanOrEqual(AA.graphic);
    expect(contrastRatio(bocaInterior, piel)).toBeGreaterThanOrEqual(
      AA.graphic,
    );
  });
});

describe('tamaños', () => {
  it('ningún texto baja de 15 px', () => {
    Object.values(typography).forEach((style) => {
      expect(style.fontSize).toBeGreaterThanOrEqual(MIN_FONT_SIZE);
    });
  });

  it('botones de 56 px o más y áreas táctiles de 44 px o más', () => {
    expect(sizes.button).toBeGreaterThanOrEqual(56);
    expect(sizes.buttonLarge).toBeGreaterThanOrEqual(56);
    expect(sizes.touchMin).toBeGreaterThanOrEqual(44);
    Object.values(sizes.iconButton).forEach((size) => {
      expect(size).toBeGreaterThanOrEqual(sizes.touchMin);
    });
  });
});
