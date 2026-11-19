import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/theme';

export type BackdropKind = 'clouds' | 'hills' | 'bubbles';

/**
 * Formas de fondo, dibujadas en una caja de 400 × 800. Son decorativas y de
 * contraste muy bajo a propósito (1,1:1 a 1,2:1 con el fondo): dan calidez
 * sin distraer. Por eso no siguen la regla de 3:1 de los gráficos: no
 * comunican nada.
 *
 * - clouds: nubes blancas arriba (fondos de color: el del niño o el de un
 *   juego; sobre blanco no se ven).
 * - hills: colinas verde suave abajo (Inicio y pantallas de «¡Listo!»).
 * - bubbles: burbujas blancas en los bordes (pantallas de juego).
 */
const shapes: Record<BackdropKind, ReactNode> = {
  clouds: (
    <>
      <Path
        d="M-20 96 C-20 70 6 54 30 62 C40 38 76 32 94 52 C112 40 140 50 142 74 C160 76 168 96 154 108 L-20 108 Z"
        fill={colors.superficie.blanca}
      />
      <Path
        d="M262 160 C262 140 282 128 300 134 C310 114 340 110 354 128 C370 118 394 128 394 148 C410 150 420 166 408 176 L262 176 Z"
        fill={colors.superficie.blanca}
      />
    </>
  ),
  hills: (
    <>
      <Path
        d="M-10 700 C70 650 150 650 230 690 C300 724 360 716 410 690 L410 810 L-10 810 Z"
        fill={colors.verde.suave}
      />
      <Path
        d="M-10 740 C90 708 170 720 250 750 C320 776 370 770 410 752 L410 810 L-10 810 Z"
        fill={colors.superficie.blanca}
        opacity={0.6}
      />
    </>
  ),
  bubbles: (
    <>
      <Circle
        cx={18}
        cy={140}
        r={46}
        fill={colors.superficie.blanca}
        opacity={0.55}
      />
      <Circle
        cx={384}
        cy={300}
        r={60}
        fill={colors.superficie.blanca}
        opacity={0.55}
      />
      <Circle
        cx={360}
        cy={380}
        r={18}
        fill={colors.superficie.blanca}
        opacity={0.55}
      />
      <Circle
        cx={30}
        cy={620}
        r={34}
        fill={colors.superficie.blanca}
        opacity={0.55}
      />
      <Circle
        cx={380}
        cy={760}
        r={52}
        fill={colors.superficie.blanca}
        opacity={0.55}
      />
    </>
  ),
};

interface BackdropProps {
  kind: BackdropKind;
}

/**
 * Fondo decorativo detrás de toda la pantalla. No se toca, no lo lee el
 * lector de pantalla y no se mueve (no depende de «reducir movimiento»).
 */
export function Backdrop({ kind }: BackdropProps) {
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={`backdrop-${kind}`}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 800"
        // Cubre la pantalla sin deformarse; en pantallas largas se recorta.
        preserveAspectRatio="xMidYMid slice"
      >
        {shapes[kind]}
      </Svg>
    </View>
  );
}
