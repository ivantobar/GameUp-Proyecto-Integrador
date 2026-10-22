import type { ReactElement } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme';
import type { Vowel } from '@/data/types';

/**
 * Bocas originales del equipo GameUP, redibujadas a partir de la lámina de
 * los mockups. No reproducen las láminas ni los gestos del Método Ventura.
 *
 * Cada boca se dibuja en una caja de 100 × 100 centrada en (50, 50), para
 * poder usarla sola (Busca la boca) o dentro del personaje.
 */
export type MouthShape = Vowel | 'closed' | 'smile';

const c = colors.ilustracion;
/** Contorno para que la boca contraste con la piel (≥ 3:1). */
const outline = { stroke: c.labioBorde, strokeWidth: 2 } as const;

export const mouthShapes: Record<MouthShape, ReactElement> = {
  /** A: muy abierta, con dientes arriba y lengua abajo. */
  a: (
    <G>
      <Ellipse cx={50} cy={50} rx={33} ry={40} fill={c.labio} {...outline} />
      <Ellipse cx={50} cy={52} rx={24} ry={31} fill={c.bocaInterior} />
      <Rect x={33} y={22} width={34} height={9} rx={4.5} fill={c.dientes} />
      <Ellipse cx={50} cy={72} rx={16} ry={9} fill={c.lengua} />
    </G>
  ),
  /** E: alargada, con los dientes visibles. */
  e: (
    <G>
      <Rect
        x={4}
        y={29}
        width={92}
        height={42}
        rx={21}
        fill={c.labio}
        {...outline}
      />
      <Rect
        x={13}
        y={37}
        width={74}
        height={26}
        rx={13}
        fill={c.bocaInterior}
      />
      <Rect x={22} y={37} width={56} height={8} rx={4} fill={c.dientes} />
      <Ellipse cx={50} cy={59} rx={19} ry={3.5} fill={c.lengua} />
    </G>
  ),
  /** I: sonrisa estrecha y estirada. */
  i: (
    <G>
      <Path
        d="M2 43 C 30 34, 70 34, 98 43 C 76 64, 24 64, 2 43 Z"
        fill={c.labio}
        {...outline}
      />
      <Path
        d="M12 45 C 35 40, 65 40, 88 45 C 70 57, 30 57, 12 45 Z"
        fill={c.bocaInterior}
      />
      <Path
        d="M15 44.5 C 38 40, 62 40, 85 44.5 L 85 47 C 62 43, 38 43, 15 47 Z"
        fill={c.dientes}
      />
    </G>
  ),
  /** O: redonda. */
  o: (
    <G>
      <Ellipse cx={50} cy={50} rx={29} ry={37} fill={c.labio} {...outline} />
      <Ellipse cx={50} cy={50} rx={16} ry={24} fill={c.bocaInterior} />
    </G>
  ),
  /** U: pequeña y fruncida. */
  u: (
    <G>
      <Circle cx={50} cy={50} r={21} fill={c.labio} {...outline} />
      <Ellipse cx={50} cy={50} rx={6} ry={8} fill={c.bocaInterior} />
      <G stroke={c.labioBorde} strokeWidth={2.5} strokeLinecap="round">
        <Path d="M37 37 L 41 41" />
        <Path d="M63 37 L 59 41" />
        <Path d="M37 63 L 41 59" />
        <Path d="M63 63 L 59 59" />
      </G>
    </G>
  ),
  /** Labios juntos: reposo (y M, P, B en la segunda etapa). */
  closed: (
    <G>
      <Path
        d="M2 50 C 22 37, 40 35, 50 42 C 60 35, 78 37, 98 50 Z"
        fill={c.labio}
        {...outline}
      />
      <Path
        d="M2 50 C 25 74, 75 74, 98 50 Z"
        fill={c.labioInferior}
        {...outline}
      />
      <Path
        d="M3 50 C 35 54, 65 54, 97 50"
        stroke={c.bocaInterior}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  ),
  /** Sonrisa abierta: celebración. */
  smile: (
    <G>
      <Path
        d="M8 38 C 35 33, 65 33, 92 38 C 90 74, 10 74, 8 38 Z"
        fill={c.labio}
        {...outline}
      />
      <Path
        d="M17 42 C 40 38, 60 38, 83 42 C 79 64, 21 64, 17 42 Z"
        fill={c.bocaInterior}
      />
      <Path
        d="M19 42 C 40 38, 60 38, 81 42 L 80 48 C 60 44, 40 44, 20 48 Z"
        fill={c.dientes}
      />
      <Ellipse cx={50} cy={58} rx={17} ry={5} fill={c.lengua} />
    </G>
  ),
};

/** Nombre de cada boca para lectores de pantalla. */
export const mouthDescriptions: Record<MouthShape, string> = {
  a: 'Boca muy abierta, como para decir A',
  e: 'Boca alargada mostrando los dientes, como para decir E',
  i: 'Boca estirada en una sonrisa, como para decir I',
  o: 'Boca redonda, como para decir O',
  u: 'Boca pequeña y fruncida, como para decir U',
  closed: 'Boca cerrada',
  smile: 'Boca sonriendo',
};
