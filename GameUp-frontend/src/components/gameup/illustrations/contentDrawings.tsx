import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { ink, line, stroke } from './palette';

/**
 * Dibujos del contenido de los juegos, en una caja de 100 × 100. Diseño
 * original del equipo GameUP (sin licencias de terceros). Reemplazan a los
 * emojis provisionales, que se veían distintos en cada teléfono.
 *
 * Para agregar uno: una entrada nueva en este mapa y su palabra exacta en
 * `illustrationLookup.ts`.
 */
export const contentDrawings = {
  manzana: (
    <>
      <Path
        d="M50 30 C40 22 18 24 18 50 C18 74 34 90 50 84 C66 90 82 74 82 50 C82 24 60 22 50 30 Z"
        fill={ink.rojo}
        {...line}
      />
      <Path d="M50 30 Q52 20 56 14" {...stroke} />
      <Path d="M54 22 Q66 10 78 16 Q68 28 54 22 Z" fill={ink.hoja} {...line} />
      <Ellipse cx={32} cy={46} rx={4} ry={8} fill={ink.blanco} opacity={0.7} />
    </>
  ),
  banano: (
    <>
      <Path
        d="M18 28 C22 68 52 88 86 76 C90 74 88 66 82 64 C58 64 42 50 38 26 C36 16 18 16 18 28 Z"
        fill={ink.amarillo}
        {...line}
      />
      <Path d="M28 40 C34 58 48 70 66 72" {...stroke} strokeWidth={2} />
      <Path d="M24 20 L20 10" {...stroke} strokeWidth={5} />
      <Circle cx={85} cy={70} r={3} fill={ink.cafeOscuro} />
    </>
  ),
  uvas: (
    <>
      <Path d="M50 26 Q50 16 56 10" {...stroke} />
      <Path d="M52 18 Q66 8 76 16 Q66 26 52 18 Z" fill={ink.hoja} {...line} />
      {[
        [40, 38],
        [60, 38],
        [30, 56],
        [50, 56],
        [70, 56],
        [40, 74],
        [60, 74],
        [50, 90],
      ].map(([cx, cy]) => (
        <Circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={10}
          fill={ink.morado}
          {...line}
        />
      ))}
    </>
  ),
  zanahoria: (
    <>
      <Ellipse
        cx={42}
        cy={20}
        rx={6}
        ry={13}
        fill={ink.hoja}
        {...line}
        transform="rotate(-25 42 20)"
      />
      <Ellipse
        cx={58}
        cy={20}
        rx={6}
        ry={13}
        fill={ink.hoja}
        {...line}
        transform="rotate(25 58 20)"
      />
      <Path
        d="M30 32 Q50 26 70 32 L54 90 Q50 96 46 90 Z"
        fill={ink.naranja}
        {...line}
      />
      <Path d="M40 46 L48 46" {...stroke} strokeWidth={2.5} />
      <Path d="M52 62 L58 62" {...stroke} strokeWidth={2.5} />
    </>
  ),
  pan: (
    <>
      <Path
        d="M14 56 C14 36 28 26 50 26 C72 26 86 36 86 56 L86 76 Q86 84 78 84 L22 84 Q14 84 14 76 Z"
        fill={ink.cafe}
        {...line}
      />
      <Path d="M32 40 L38 52" {...stroke} strokeWidth={2.5} />
      <Path d="M47 38 L53 50" {...stroke} strokeWidth={2.5} />
      <Path d="M62 40 L68 52" {...stroke} strokeWidth={2.5} />
    </>
  ),
  perro: (
    <>
      <Ellipse
        cx={20}
        cy={50}
        rx={11}
        ry={20}
        fill={ink.cafeOscuro}
        {...line}
        transform="rotate(15 20 50)"
      />
      <Ellipse
        cx={80}
        cy={50}
        rx={11}
        ry={20}
        fill={ink.cafeOscuro}
        {...line}
        transform="rotate(-15 80 50)"
      />
      <Ellipse cx={50} cy={54} rx={30} ry={30} fill={ink.cafe} {...line} />
      <Ellipse cx={50} cy={68} rx={14} ry={11} fill={ink.piel} />
      <Circle cx={39} cy={48} r={4.5} fill={ink.contorno} />
      <Circle cx={61} cy={48} r={4.5} fill={ink.contorno} />
      <Circle cx={40.5} cy={46.5} r={1.6} fill={ink.blanco} />
      <Circle cx={62.5} cy={46.5} r={1.6} fill={ink.blanco} />
      <Ellipse cx={50} cy={62} rx={6} ry={4.5} fill={ink.contorno} />
      <Path d="M43 70 Q50 76 57 70" {...stroke} strokeWidth={2.5} />
    </>
  ),
  gato: (
    <>
      <Path d="M24 44 L26 14 L46 32 Z" fill={ink.naranja} {...line} />
      <Path d="M76 44 L74 14 L54 32 Z" fill={ink.naranja} {...line} />
      <Circle cx={50} cy={56} r={30} fill={ink.naranja} {...line} />
      <Circle cx={39} cy={52} r={4.5} fill={ink.contorno} />
      <Circle cx={61} cy={52} r={4.5} fill={ink.contorno} />
      <Circle cx={40.5} cy={50.5} r={1.6} fill={ink.blanco} />
      <Circle cx={62.5} cy={50.5} r={1.6} fill={ink.blanco} />
      <Path
        d="M46 62 L54 62 L50 67 Z"
        fill={ink.rosa}
        {...line}
        strokeWidth={2}
      />
      <Path d="M44 72 Q50 76 56 72" {...stroke} strokeWidth={2.5} />
      <Path
        d="M30 62 L16 60 M30 68 L16 70 M70 62 L84 60 M70 68 L84 70"
        {...stroke}
        strokeWidth={2}
      />
    </>
  ),
  pez: (
    <>
      <Path d="M72 50 L92 32 L92 68 Z" fill={ink.azul} {...line} />
      <Ellipse cx={44} cy={50} rx={32} ry={22} fill={ink.azul} {...line} />
      <Path d="M40 30 Q50 20 60 30" fill={ink.azul} {...line} />
      <Circle cx={28} cy={46} r={4.5} fill={ink.contorno} />
      <Circle cx={29.5} cy={44.5} r={1.6} fill={ink.blanco} />
      <Path d="M22 58 Q28 62 34 58" {...stroke} strokeWidth={2.5} />
      <Path d="M50 42 Q56 50 50 58" {...stroke} strokeWidth={2.5} />
    </>
  ),
  sol: (
    <>
      <G stroke={ink.naranja} strokeWidth={6} strokeLinecap="round">
        <Path d="M50 6 L50 16 M50 84 L50 94 M6 50 L16 50 M84 50 L94 50" />
        <Path d="M19 19 L26 26 M74 74 L81 81 M81 19 L74 26 M26 74 L19 81" />
      </G>
      <Circle cx={50} cy={50} r={24} fill={ink.amarillo} {...line} />
    </>
  ),
  luna: (
    <Path
      d="M62 12 C36 16 20 40 24 62 C28 84 52 94 74 84 C52 80 40 62 44 42 C47 28 54 18 62 12 Z"
      fill={ink.amarillo}
      {...line}
    />
  ),
  nube: (
    <Path
      d="M24 72 C10 72 8 52 24 50 C24 32 46 26 54 40 C60 30 80 32 80 48 C94 48 94 72 80 72 Z"
      fill={ink.blanco}
      {...line}
    />
  ),
  estrella: (
    <Path
      d="M50.0 14.0 L60.0 40.2 L88.0 41.6 L66.2 59.3 L73.5 86.4 L50.0 71.0 L26.5 86.4 L33.8 59.3 L12.0 41.6 L40.0 40.2 Z"
      fill={ink.amarillo}
      {...line}
    />
  ),
  flor: (
    <>
      <Path
        d="M50 56 L50 94"
        {...stroke}
        stroke={ink.verdeOscuro}
        strokeWidth={5}
      />
      <Ellipse
        cx={62}
        cy={80}
        rx={10}
        ry={5}
        fill={ink.hoja}
        {...line}
        transform="rotate(-30 62 80)"
      />
      {[
        [50, 18],
        [70, 32],
        [62, 54],
        [38, 54],
        [30, 32],
      ].map(([cx, cy]) => (
        <Circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={13}
          fill={ink.rosa}
          {...line}
        />
      ))}
      <Circle cx={50} cy={38} r={11} fill={ink.amarillo} {...line} />
    </>
  ),
  carro: (
    <>
      <Path
        d="M12 62 L12 52 Q12 44 20 44 L30 44 L38 30 Q40 27 45 27 L64 27 Q68 27 70 31 L78 44 L82 44 Q90 44 90 52 L90 62 Q90 68 84 68 L18 68 Q12 68 12 62 Z"
        fill={ink.rojo}
        {...line}
      />
      <Path
        d="M41 33 L64 33 L71 44 L35 44 Z"
        fill={ink.celeste}
        {...line}
        strokeWidth={2.5}
      />
      <Circle cx={30} cy={70} r={10} fill={ink.contorno} />
      <Circle cx={72} cy={70} r={10} fill={ink.contorno} />
      <Circle cx={30} cy={70} r={4} fill={ink.gris} />
      <Circle cx={72} cy={70} r={4} fill={ink.gris} />
    </>
  ),
  balon: (
    <>
      <Circle cx={50} cy={50} r={36} fill={ink.blanco} />
      <Path
        d="M50.0 37.8 L50.0 26.0 M61.6 46.2 L72.8 42.6 M57.2 59.9 L64.1 69.4 M42.8 59.9 L35.9 69.4 M38.4 46.2 L27.2 42.6"
        {...stroke}
        strokeWidth={2.5}
      />
      <Path
        d="M50.0 38.0 L61.4 46.3 L57.1 59.7 L42.9 59.7 L38.6 46.3 Z"
        fill={ink.contorno}
      />
      {/* Parches del borde: lo que hace que se lea como balón y no como rueda. */}
      <Path
        d="M39.8 16.5 L60.2 16.5 L54.2 26.4 L45.8 26.4 Z M78.7 29.9 L85.0 49.4 L73.8 46.7 L71.2 38.7 Z M78.0 71.1 L61.4 83.1 L60.5 71.6 L67.3 66.7 Z M38.6 83.1 L22.0 71.1 L32.7 66.7 L39.5 71.6 Z M15.0 49.4 L21.3 29.9 L28.8 38.7 L26.2 46.7 Z"
        fill={ink.contorno}
        stroke={ink.contorno}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={50} cy={50} r={36} fill="none" {...line} />
    </>
  ),
  medias: (
    <>
      <Path
        d="M34 12 L60 12 L60 54 L80 68 Q90 78 80 88 Q72 94 62 88 L38 72 Q32 66 34 58 Z"
        fill={ink.azul}
        {...line}
      />
      <Path d="M34 12 L60 12 L60 26 L34 26 Z" fill={ink.blanco} {...line} />
    </>
  ),
  gorra: (
    <>
      <Path
        d="M50 64 L84 64 Q96 64 96 72 Q84 76 66 74 L50 72 Z"
        fill={ink.rojo}
        {...line}
      />
      <Path
        d="M16 64 C16 38 30 26 48 26 C66 26 80 38 80 64 Z"
        fill={ink.rojo}
        {...line}
      />
      <Path d="M48 26 L48 64" {...stroke} strokeWidth={2.5} />
      <Circle cx={48} cy={24} r={5} fill={ink.blanco} {...line} />
    </>
  ),
  camiseta: (
    <Path
      d="M34 16 L22 22 L8 40 L22 52 L28 46 L28 88 L72 88 L72 46 L78 52 L92 40 L78 22 L66 16 Q58 28 50 28 Q42 28 34 16 Z"
      fill={ink.azul}
      {...line}
    />
  ),
  plato: (
    <>
      <Circle cx={50} cy={52} r={32} fill={ink.blanco} {...line} />
      <Circle cx={50} cy={52} r={20} fill="none" {...line} strokeWidth={2} />
      <Path
        d="M8 22 L8 40 M14 22 L14 40 M8 40 Q11 46 14 40 M11 44 L11 84"
        {...stroke}
      />
      <Path d="M90 22 Q82 34 88 50 L90 50 L90 84" {...stroke} />
    </>
  ),
  grifo: (
    <>
      <Path d="M30 20 L50 20 M40 20 L40 30" {...stroke} strokeWidth={5} />
      <Path
        d="M16 30 L64 30 Q78 30 78 44 L78 50 L64 50 L64 44 L16 44 Z"
        fill={ink.gris}
        {...line}
      />
      <Path
        d="M71 58 Q63 70 71 76 Q79 70 71 58 Z"
        fill={ink.celeste}
        {...line}
        strokeWidth={2.5}
      />
      <Path
        d="M71 82 Q66 90 71 94 Q76 90 71 82 Z"
        fill={ink.celeste}
        {...line}
        strokeWidth={2.5}
      />
    </>
  ),
  jabon: (
    <>
      <Rect
        x={16}
        y={44}
        width={68}
        height={38}
        rx={12}
        fill={ink.rosa}
        {...line}
      />
      <Ellipse cx={36} cy={56} rx={10} ry={4} fill={ink.blanco} opacity={0.6} />
      <Circle
        cx={32}
        cy={30}
        r={8}
        fill={ink.celeste}
        {...line}
        strokeWidth={2.5}
      />
      <Circle
        cx={54}
        cy={22}
        r={10}
        fill={ink.celeste}
        {...line}
        strokeWidth={2.5}
      />
      <Circle
        cx={72}
        cy={32}
        r={6}
        fill={ink.celeste}
        {...line}
        strokeWidth={2.5}
      />
    </>
  ),
  manos: (
    <>
      {[28, 40, 52, 64].map((x) => (
        <Rect
          key={x}
          x={x}
          y={18}
          width={11}
          height={40}
          rx={5.5}
          fill={ink.piel}
          {...line}
        />
      ))}
      <Ellipse
        cx={24}
        cy={64}
        rx={7}
        ry={15}
        fill={ink.piel}
        {...line}
        transform="rotate(-35 24 64)"
      />
      <Path
        d="M27 48 L76 48 L76 72 Q76 90 52 90 Q27 90 27 72 Z"
        fill={ink.piel}
        {...line}
      />
      <Circle
        cx={84}
        cy={30}
        r={6}
        fill={ink.celeste}
        {...line}
        strokeWidth={2}
      />
      <Circle
        cx={88}
        cy={48}
        r={4}
        fill={ink.celeste}
        {...line}
        strokeWidth={2}
      />
    </>
  ),
  toalla: (
    <>
      <Path d="M12 22 L88 22" {...stroke} strokeWidth={5} />
      <Path
        d="M24 22 L76 22 L76 84 Q76 90 70 90 L30 90 Q24 90 24 84 Z"
        fill={ink.celeste}
        {...line}
      />
      <Path d="M24 70 L76 70 M24 78 L76 78" stroke={ink.azul} strokeWidth={4} />
      <Path
        d="M24 22 L76 22 L76 84 Q76 90 70 90 L30 90 Q24 90 24 84 Z"
        fill="none"
        {...line}
      />
    </>
  ),
  cepillo: (
    <>
      <Rect
        x={6}
        y={60}
        width={62}
        height={12}
        rx={6}
        fill={ink.azul}
        {...line}
      />
      <Rect
        x={60}
        y={54}
        width={32}
        height={18}
        rx={6}
        fill={ink.azul}
        {...line}
      />
      <Rect
        x={62}
        y={40}
        width={28}
        height={14}
        rx={3}
        fill={ink.blanco}
        {...line}
      />
      <Path
        d="M69 42 L69 52 M76 42 L76 52 M83 42 L83 52"
        {...stroke}
        strokeWidth={2}
      />
      <Path
        d="M62 40 Q64 28 74 32 Q84 24 90 36 L90 40 Z"
        fill={ink.celeste}
        {...line}
        strokeWidth={2.5}
      />
    </>
  ),
  dientes: (
    <>
      <Path
        d="M12 42 Q50 32 88 42 Q84 86 50 88 Q16 86 12 42 Z"
        fill={ink.labio}
        {...line}
      />
      <Path
        d="M20 48 Q50 54 80 48 Q76 80 50 82 Q24 80 20 48 Z"
        fill={ink.bocaInterior}
      />
      <Path
        d="M22 46 Q50 40 78 46 L76 58 Q50 62 24 58 Z"
        fill={ink.blanco}
        {...line}
        strokeWidth={2}
      />
      <Path
        d="M36 44 L36 60 M50 42 L50 61 M64 44 L64 60"
        {...stroke}
        strokeWidth={2}
      />
      <Ellipse cx={50} cy={74} rx={14} ry={6} fill={ink.lengua} />
    </>
  ),
  vaso: (
    <>
      <Path
        d="M28 44 L72 44 L67 88 Q66 92 61 92 L39 92 Q34 92 33 88 Z"
        fill={ink.celeste}
      />
      <Path
        d="M24 14 L76 14 L67 88 Q66 92 61 92 L39 92 Q34 92 33 88 Z"
        fill="none"
        {...line}
      />
      <Path d="M28 44 L72 44" {...stroke} strokeWidth={2} />
      <Path
        d="M34 22 L36 36"
        stroke={ink.blanco}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </>
  ),
  circuloRojo: <Circle cx={50} cy={50} r={36} fill={ink.rojo} {...line} />,
  circuloAzul: <Circle cx={50} cy={50} r={36} fill={ink.azul} {...line} />,
  circuloVerde: <Circle cx={50} cy={50} r={36} fill={ink.hoja} {...line} />,
  circulo: <Circle cx={50} cy={50} r={36} fill={ink.naranja} {...line} />,
  cuadrado: (
    <Rect
      x={16}
      y={16}
      width={68}
      height={68}
      rx={8}
      fill={ink.azul}
      {...line}
    />
  ),
  triangulo: <Path d="M50 12 L90 84 L10 84 Z" fill={ink.hoja} {...line} />,
} satisfies Record<string, ReactNode>;

export type ContentIllustration = keyof typeof contentDrawings;
