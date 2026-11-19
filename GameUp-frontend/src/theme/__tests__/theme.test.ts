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

  it.each([
    ['fondo del niño', colors.fondo.nino],
    ['Emparejar', colors.identidad.emparejarFondo],
    ['Clasificar', colors.identidad.clasificarFondo],
    ['Secuenciar', colors.juego.fondoAmarillo],
    ['Memoria', colors.identidad.memoriaFondo],
    ['Busca la boca', colors.identidad.bocaFondo],
  ])(
    'textos principal, secundario y de marca cumplen AA sobre %s',
    (_name, background) => {
      expect(
        contrastRatio(colors.texto.principal, background),
      ).toBeGreaterThanOrEqual(AA.text);
      expect(
        contrastRatio(colors.texto.secundario, background),
      ).toBeGreaterThanOrEqual(AA.text);
      expect(
        contrastRatio(colors.verde.oscuro, background),
      ).toBeGreaterThanOrEqual(AA.text);
    },
  );

  it.each([
    [
      'Emparejar',
      colors.identidad.emparejarAcento,
      colors.identidad.emparejarFondo,
    ],
    [
      'Clasificar',
      colors.identidad.clasificarAcento,
      colors.identidad.clasificarFondo,
    ],
    [
      'Secuenciar',
      colors.identidad.secuenciarAcento,
      colors.juego.fondoAmarillo,
    ],
    ['Memoria', colors.identidad.memoriaAcento, colors.identidad.memoriaFondo],
    ['Busca la boca', colors.identidad.bocaAcento, colors.identidad.bocaFondo],
  ])(
    'el acento de %s cumple AA para texto sobre su fondo y sobre blanco',
    (_name, accent, background) => {
      expect(contrastRatio(accent, background)).toBeGreaterThanOrEqual(AA.text);
      expect(
        contrastRatio(accent, colors.superficie.blanca),
      ).toBeGreaterThanOrEqual(AA.text);
    },
  );

  it('el relieve del botón naranja se distingue del fondo (gráficos)', () => {
    expect(
      contrastRatio(colors.relieve.naranja, colors.marca.gris),
    ).toBeGreaterThanOrEqual(AA.graphic);
    expect(
      contrastRatio(colors.relieve.naranja, colors.fondo.nino),
    ).toBeGreaterThanOrEqual(AA.graphic);
    // También marca la casilla «siguiente» de Secuenciar, sobre blanco.
    expect(
      contrastRatio(colors.relieve.naranja, colors.superficie.blanca),
    ).toBeGreaterThanOrEqual(AA.graphic);
  });

  it.each([
    ['gris', colors.marca.gris],
    ['fondo del niño', colors.fondo.nino],
    ['Habla conmigo', colors.verde.suave],
    ['Emparejar', colors.identidad.emparejarFondo],
    ['Clasificar', colors.identidad.clasificarFondo],
    ['Secuenciar', colors.juego.fondoAmarillo],
    ['Memoria', colors.identidad.memoriaFondo],
    ['Busca la boca', colors.identidad.bocaFondo],
  ])('los puntos de avance se ven sobre %s (gráficos ≥ 3:1)', (_n, bg) => {
    // Actual, hecho y borde del pendiente (ProgressDots).
    for (const dot of [
      colors.relieve.naranja,
      colors.verde.oscuro,
      colors.texto.secundario,
    ]) {
      expect(contrastRatio(dot, bg)).toBeGreaterThanOrEqual(AA.graphic);
    }
    // «Toca para oír otra vez» (café) en Busca la boca y demás fondos.
    expect(contrastRatio(colors.cafe.oscuro, bg)).toBeGreaterThanOrEqual(
      AA.text,
    );
  });

  it('la estrella vacía también se ve sobre el fondo del niño', () => {
    expect(
      contrastRatio(colors.estrella.vacia, colors.fondo.nino),
    ).toBeGreaterThanOrEqual(AA.graphic);
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

  it('botones de 56 px o más y áreas táctiles de 48 dp o más (Android)', () => {
    expect(sizes.button).toBeGreaterThanOrEqual(56);
    expect(sizes.buttonLarge).toBeGreaterThanOrEqual(56);
    expect(sizes.touchMin).toBeGreaterThanOrEqual(48);
    Object.values(sizes.iconButton).forEach((size) => {
      expect(size).toBeGreaterThanOrEqual(sizes.touchMin);
    });
  });
});
