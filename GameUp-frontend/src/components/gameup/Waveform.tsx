import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/features/motion/useReducedMotion';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';

export type WaveformTone = 'brand' | 'accent';

const toneColors = {
  brand: colors.marca.verde,
  accent: colors.marca.naranja,
} as const satisfies Record<WaveformTone, ThemeColor>;

/** Forma fija de las barras (de 0 a 1), parecida a la de los mockups. */
const PATTERN = [
  0.3, 0.5, 0.8, 0.45, 1, 0.6, 0.35, 0.75, 0.5, 0.9, 0.4, 0.7, 0.55, 0.85, 0.4,
  0.6, 0.3,
];

interface WaveformProps {
  tone: WaveformTone;
  /** Escuchando: las barras se mueven. Si no, son un dibujo fijo. */
  active?: boolean;
  /**
   * Volumen real del micrófono (0 a 1), si el teléfono lo informa. Sin
   * él, la animación es solo decorativa (aviso de que la app escucha).
   */
  level?: number;
  /** Alto máximo de las barras. */
  height?: number;
}

/**
 * Onda de voz. Es decorativa: no analiza ni califica la pronunciación.
 * Con «reducir movimiento», la animación se detiene.
 */
export function Waveform({
  tone,
  active = false,
  level,
  height = sizes.waveform,
}: WaveformProps) {
  const reducedMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  const animate = active && !reducedMotion;

  useEffect(() => {
    if (!animate) return;
    const id = setInterval(() => setTick((value) => value + 1), 120);
    return () => clearInterval(id);
  }, [animate]);

  const intensity = active ? (level ?? 0.6) : 1;

  return (
    <View
      style={[styles.row, { height }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {PATTERN.map((base, index) => {
        // Pequeña variación por barra para que «respire» mientras escucha.
        const wobble = animate ? 0.75 + 0.25 * Math.sin(tick + index * 1.3) : 1;
        const factor = Math.max(0.15, base * intensity * wobble);
        return (
          <View
            key={index}
            style={[
              styles.bar,
              { height: height * factor, backgroundColor: toneColors[tone] },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  bar: {
    width: sizes.waveformBar,
    borderRadius: radii.pill,
  },
});
