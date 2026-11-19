import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { ink, line, stroke } from './palette';

/**
 * Escenas de la app (no son contenido de juego), en una caja de 100 × 100.
 * Diseño original del equipo GameUP.
 */
export const sceneDrawings = {
  /** Vacío genérico: una caja abierta con una estrellita. */
  box: (
    <>
      <Circle cx={50} cy={52} r={46} fill={ink.verdeSuave} />
      <Path
        d="M22 46 L50 56 L78 46 L78 78 L50 88 L22 78 Z"
        fill={ink.cafe}
        {...line}
      />
      <Path d="M50 56 L50 88" {...stroke} />
      <Path d="M22 46 L12 34 L40 26 L50 36 Z" fill={ink.cafe} {...line} />
      <Path d="M78 46 L88 34 L60 26 L50 36 Z" fill={ink.cafe} {...line} />
      <Path
        d="M50 8 L53 16 L61 16 L55 21 L57 29 L50 24 L43 29 L45 21 L39 16 L47 16 Z"
        fill={ink.amarillo}
        {...line}
        strokeWidth={2}
      />
    </>
  ),
  /** «Todo revisado»: bandeja con un visto. */
  inboxDone: (
    <>
      <Circle cx={50} cy={52} r={46} fill={ink.verdeSuave} />
      <Path
        d="M14 56 L26 30 L74 30 L86 56 L86 78 Q86 84 80 84 L20 84 Q14 84 14 78 Z"
        fill={ink.blanco}
        {...line}
      />
      <Path d="M14 56 L36 56 Q38 66 50 66 Q62 66 64 56 L86 56" {...stroke} />
      <Circle cx={70} cy={28} r={16} fill={ink.verdeOscuro} {...line} />
      <Path
        d="M62 28 L68 34 L78 22"
        stroke={ink.blanco}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  /** «Sin estudiantes»: dos caritas juntas. */
  people: (
    <>
      <Circle cx={50} cy={52} r={46} fill={ink.verdeSuave} />
      <Path d="M8 92 Q8 62 34 62 Q60 62 60 92 Z" fill={ink.azul} {...line} />
      <Path
        d="M40 92 Q40 66 66 66 Q92 66 92 92 Z"
        fill={ink.naranja}
        {...line}
      />
      <Circle cx={34} cy={42} r={16} fill={ink.piel} {...line} />
      <Circle cx={66} cy={46} r={14} fill={ink.piel} {...line} />
      <Path
        d="M28 46 Q34 50 40 46 M60 50 Q66 54 72 50"
        {...stroke}
        strokeWidth={2.5}
      />
      <Circle cx={29} cy={39} r={2.2} fill={ink.contorno} />
      <Circle cx={39} cy={39} r={2.2} fill={ink.contorno} />
      <Circle cx={62} cy={43} r={2.2} fill={ink.contorno} />
      <Circle cx={70} cy={43} r={2.2} fill={ink.contorno} />
    </>
  ),
  /** «Sin conexión»: una nube dormida (sin culpa ni alarma). */
  cloudSleep: (
    <>
      <Circle cx={50} cy={52} r={46} fill={ink.verdeSuave} />
      <Path
        d="M24 74 C10 74 8 54 24 52 C24 34 46 28 54 42 C60 32 80 34 80 50 C94 50 94 74 80 74 Z"
        fill={ink.blanco}
        {...line}
      />
      <Path
        d="M36 58 Q41 62 46 58 M56 58 Q61 62 66 58"
        {...stroke}
        strokeWidth={2.5}
      />
      <Circle cx={51} cy={66} r={2.5} fill={ink.contorno} />
      <G {...stroke} strokeWidth={2.5}>
        <Path d="M70 14 L80 14 L70 24 L80 24" />
        <Path d="M84 30 L90 30 L84 36 L90 36" />
      </G>
    </>
  ),
  /** «Hoy no hay tareas»: un sol tranquilo. */
  calmSun: (
    <>
      <Circle cx={50} cy={52} r={46} fill={ink.verdeSuave} />
      <G stroke={ink.naranja} strokeWidth={5} strokeLinecap="round">
        <Path d="M50 14 L50 22 M50 82 L50 90 M12 52 L20 52 M80 52 L88 52" />
        <Path d="M23 25 L29 31 M71 73 L77 79 M77 25 L71 31 M29 73 L23 79" />
      </G>
      <Circle cx={50} cy={52} r={22} fill={ink.amarillo} {...line} />
      <Path
        d="M42 50 Q45 46 48 50 M52 50 Q55 46 58 50"
        {...stroke}
        strokeWidth={2.5}
      />
      <Path d="M43 58 Q50 64 57 58" {...stroke} strokeWidth={2.5} />
    </>
  ),
  /** Bienvenida del login: formas de la marca alrededor de un corazón. */
  welcome: (
    <>
      <Circle cx={50} cy={52} r={46} fill={ink.verdeSuave} />
      <Circle cx={18} cy={24} r={7} fill={ink.naranja} />
      <Circle cx={86} cy={30} r={5} fill={ink.verde} />
      <Rect
        x={76}
        y={74}
        width={12}
        height={12}
        rx={3}
        fill={ink.amarillo}
        {...line}
        strokeWidth={2}
      />
      <Path
        d="M50 82 C20 64 18 42 30 34 C40 28 48 34 50 40 C52 34 60 28 70 34 C82 42 80 64 50 82 Z"
        fill={ink.naranja}
        {...line}
      />
      <Ellipse cx={38} cy={44} rx={4} ry={6} fill={ink.blanco} opacity={0.7} />
    </>
  ),
  /**
   * Manito de pista: el índice estirado, como cuando se toca la pantalla.
   * Se anima despacio en los juegos (ver `HintHand`).
   */
  hand: (
    <>
      <Rect
        x={52}
        y={36}
        width={15}
        height={22}
        rx={7.5}
        fill={ink.piel}
        {...line}
      />
      <Rect
        x={66}
        y={40}
        width={15}
        height={20}
        rx={7.5}
        fill={ink.piel}
        {...line}
      />
      <Ellipse
        cx={28}
        cy={64}
        rx={8}
        ry={14}
        fill={ink.piel}
        {...line}
        transform="rotate(-35 28 64)"
      />
      <Rect
        x={36}
        y={6}
        width={16}
        height={56}
        rx={8}
        fill={ink.piel}
        {...line}
      />
      <Path
        d="M34 50 L82 50 L82 72 Q82 94 60 94 L52 94 Q34 94 32 76 Z"
        fill={ink.piel}
        {...line}
      />
      <Path d="M40 50 L48 50" stroke={ink.piel} strokeWidth={4} />
    </>
  ),
  /**
   * Estrella para tamaños de ícono (20 a 32 dp): contorno más grueso, para
   * que siga viéndose a ese tamaño (3:1 o más gracias al contorno oscuro).
   */
  estrellaIcono: (
    <Path
      d="M50.0 14.0 L60.0 40.2 L88.0 41.6 L66.2 59.3 L73.5 86.4 L50.0 71.0 L26.5 86.4 L33.8 59.3 L12.0 41.6 L40.0 40.2 Z"
      fill={ink.amarillo}
      {...line}
      strokeWidth={8}
    />
  ),
} satisfies Record<string, ReactNode>;

export type SceneIllustration = keyof typeof sceneDrawings;
