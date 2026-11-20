import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors, sizes, type CharacterSize } from '@/theme';
import { mouthShapes, type MouthShape } from './mouthShapes';

interface CharacterProps {
  /** Boca que muestra el personaje. */
  mouth: MouthShape;
  size?: CharacterSize;
  /** Círculo verde suave de fondo (como en los mockups). */
  halo?: boolean;
  /**
   * Descripción para el lector de pantalla. Sin ella, el personaje es
   * decorativo (lo habitual: el texto de al lado ya dice qué hacer).
   */
  accessibilityLabel?: string;
  /**
   * Ojos: `open` (normal), `happy` (arcos: celebrar) o `closed` (parpadeo).
   */
  eyes?: CharacterEyes;
  /** Manito que saluda, abajo a la derecha (Inicio, bienvenida). */
  wave?: boolean;
}

export type CharacterEyes = 'open' | 'happy' | 'closed';

const c = colors.ilustracion;

/**
 * Personaje de GameUP: el mismo en todos los juegos (principio de los
 * mockups). Diseño original del equipo. Uso: `<Character mouth="o" />`.
 *
 * Se dibuja en una caja de 200 × 200; la boca se coloca con una
 * transformación sobre su caja de 100 × 100.
 */
export function Character({
  mouth,
  size = 'md',
  halo = true,
  accessibilityLabel,
  eyes = 'open',
  wave = false,
}: CharacterProps) {
  const side = sizes.character[size];
  const decorative = accessibilityLabel === undefined;

  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      accessibilityElementsHidden={decorative}
    >
      <Svg width={side} height={side} viewBox="0 0 200 200">
        {halo ? (
          <Circle cx={100} cy={100} r={98} fill={colors.verde.suave} />
        ) : null}
        {/* Orejas */}
        <Circle cx={21} cy={105} r={12} fill={c.piel} />
        <Circle cx={179} cy={105} r={12} fill={c.piel} />
        {/* Cara */}
        <Circle cx={100} cy={102} r={76} fill={c.piel} />
        {/* Cabello */}
        <Path
          d="M42 79 C 52 42, 78 27, 100 27 C 126 27, 150 44, 158 79 C 147 62, 136 54, 122 51 C 125 46, 123 40, 115 36 C 108 47, 99 50, 90 51 C 70 53, 52 63, 42 79 Z"
          fill={colors.verde.oscuro}
        />
        {/* Cejas */}
        <G
          stroke={colors.verde.profundo}
          strokeWidth={4.5}
          strokeLinecap="round"
          fill="none"
        >
          <Path d="M61 76 Q 73 70, 85 75" />
          <Path d="M115 75 Q 127 70, 139 76" />
        </G>
        {/* Ojos */}
        {eyes === 'open' ? (
          <>
            <Ellipse
              cx={74}
              cy={93}
              rx={8.5}
              ry={10}
              fill={colors.texto.principal}
            />
            <Ellipse
              cx={126}
              cy={93}
              rx={8.5}
              ry={10}
              fill={colors.texto.principal}
            />
            <Circle cx={77} cy={89} r={2.8} fill={colors.superficie.blanca} />
            <Circle cx={129} cy={89} r={2.8} fill={colors.superficie.blanca} />
          </>
        ) : (
          <G
            stroke={colors.texto.principal}
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          >
            {eyes === 'happy' ? (
              // Ojos felices: arcos hacia arriba (celebrar).
              <>
                <Path d="M65 96 Q 74 84, 83 96" />
                <Path d="M117 96 Q 126 84, 135 96" />
              </>
            ) : (
              // Ojos cerrados: una línea suave (parpadeo).
              <>
                <Path d="M65 94 Q 74 98, 83 94" />
                <Path d="M117 94 Q 126 98, 135 94" />
              </>
            )}
          </G>
        )}
        {/* Nariz */}
        <Path
          d="M95 104 Q 100 112, 105 104"
          stroke={c.nariz}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
        {/* Mejillas */}
        <Circle cx={58} cy={121} r={10} fill={c.mejilla} />
        <Circle cx={142} cy={121} r={10} fill={c.mejilla} />
        {/* Boca: caja de 100 × 100 reducida al 60 % y centrada en (100, 147) */}
        <G transform="translate(70 117) scale(0.6)">{mouthShapes[mouth]}</G>
        {wave ? (
          // Manito que saluda: palma y dedos, inclinada.
          <G transform="translate(12 6) rotate(-18 168 160)">
            <Path
              d="M150 150 L150 132 Q150 126 155 126 Q160 126 160 132 L160 146 L160 124 Q160 118 165 118 Q170 118 170 124 L170 146 L170 128 Q170 122 175 122 Q180 122 180 128 L180 160 Q180 182 164 182 Q148 182 146 168 L140 156 Q137 150 143 148 Q147 147 150 152 Z"
              fill={c.piel}
              stroke={c.nariz}
              strokeWidth={3}
              strokeLinejoin="round"
            />
          </G>
        ) : null}
      </Svg>
    </View>
  );
}
