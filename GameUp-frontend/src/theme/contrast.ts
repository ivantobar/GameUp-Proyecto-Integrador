/**
 * Cálculo de contraste según WCAG 2.x. Lo usan las pruebas del tema y el
 * catálogo de desarrollo para comprobar que los pares de colores cumplen AA.
 */
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Color no válido para calcular contraste: ${hex}`);
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Relación de contraste entre dos colores hexadecimales (de 1 a 21). */
export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/** Mínimos AA: 4,5 para texto normal y 3 para gráficos o texto grande. */
export const AA = { text: 4.5, graphic: 3 } as const;
