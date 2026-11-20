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
  // Lo que más se repite en el contenido que siembra el backend.
  fresa: (
    <>
      <Path
        d="M50 90 C30 84 16 64 20 44 C22 34 34 30 50 34 C66 30 78 34 80 44 C84 64 70 84 50 90 Z"
        fill={ink.rojo}
        {...line}
      />
      <Path
        d="M30 38 Q40 24 50 32 Q60 24 70 38 Q58 42 50 37 Q42 42 30 38 Z"
        fill={ink.hoja}
        {...line}
      />
      <Path d="M50 32 L50 16" {...stroke} />
      {[
        [38, 50],
        [50, 48],
        [62, 50],
        [44, 62],
        [56, 62],
        [50, 75],
        [34, 62],
        [66, 62],
      ].map(([cx, cy]) => (
        <Ellipse
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          rx={1.8}
          ry={2.6}
          fill={ink.amarillo}
        />
      ))}
    </>
  ),
  pera: (
    <>
      <Path
        d="M50 22 C42 22 40 30 40 38 C40 46 26 54 26 70 C26 84 38 92 50 92 C62 92 74 84 74 70 C74 54 60 46 60 38 C60 30 58 22 50 22 Z"
        fill={ink.hoja}
        {...line}
      />
      <Path d="M50 22 Q52 14 56 10" {...stroke} />
      <Path d="M54 16 Q64 6 74 12 Q66 22 54 16 Z" fill={ink.hoja} {...line} />
      <Ellipse cx={38} cy={68} rx={4} ry={8} fill={ink.blanco} opacity={0.6} />
    </>
  ),
  sandia: (
    <>
      <Path
        d="M8 38 L92 38 Q92 88 50 88 Q8 88 8 38 Z"
        fill={ink.hoja}
        {...line}
      />
      <Path d="M16 38 L84 38 Q82 78 50 79 Q18 78 16 38 Z" fill={ink.rojo} />
      {[
        [34, 50],
        [50, 56],
        [66, 50],
        [42, 66],
        [58, 66],
      ].map(([cx, cy]) => (
        <Ellipse
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          rx={2}
          ry={3.2}
          fill={ink.contorno}
        />
      ))}
      <Path d="M8 38 L92 38" {...stroke} />
    </>
  ),
  conejo: (
    <>
      <Ellipse cx={38} cy={28} rx={8} ry={22} fill={ink.blanco} {...line} />
      <Ellipse cx={62} cy={28} rx={8} ry={22} fill={ink.blanco} {...line} />
      <Ellipse cx={38} cy={28} rx={3.5} ry={14} fill={ink.rosa} />
      <Ellipse cx={62} cy={28} rx={3.5} ry={14} fill={ink.rosa} />
      <Circle cx={50} cy={64} r={27} fill={ink.blanco} {...line} />
      <Circle cx={40} cy={58} r={4.5} fill={ink.contorno} />
      <Circle cx={60} cy={58} r={4.5} fill={ink.contorno} />
      <Circle cx={41.5} cy={56.5} r={1.6} fill={ink.blanco} />
      <Circle cx={61.5} cy={56.5} r={1.6} fill={ink.blanco} />
      <Circle cx={32} cy={70} r={4} fill={ink.mejilla} opacity={0.8} />
      <Circle cx={68} cy={70} r={4} fill={ink.mejilla} opacity={0.8} />
      <Path
        d="M46 66 L54 66 L50 71 Z"
        fill={ink.rosa}
        {...line}
        strokeWidth={2}
      />
      <Path d="M44 76 Q50 80 56 76" {...stroke} strokeWidth={2.5} />
    </>
  ),
  oveja: (
    <>
      <Rect x={32} y={64} width={7} height={22} rx={3} fill={ink.contorno} />
      <Rect x={62} y={64} width={7} height={22} rx={3} fill={ink.contorno} />
      <Path
        d="M28 68 C14 68 14 48 28 48 C28 34 44 30 52 40 C58 30 76 32 78 44 C92 44 92 68 78 68 Z"
        fill={ink.blanco}
        {...line}
      />
      <Ellipse
        cx={16}
        cy={46}
        rx={7}
        ry={4}
        fill={ink.gris}
        {...line}
        strokeWidth={2}
        transform="rotate(-25 16 46)"
      />
      <Ellipse cx={26} cy={56} rx={11} ry={13} fill={ink.gris} {...line} />
      <Circle cx={22} cy={54} r={3} fill={ink.contorno} />
      <Circle cx={30} cy={54} r={3} fill={ink.contorno} />
      <Path d="M22 62 Q26 65 30 62" {...stroke} strokeWidth={2} />
    </>
  ),
  vaca: (
    <>
      <Ellipse
        cx={18}
        cy={42}
        rx={11}
        ry={6}
        fill={ink.blanco}
        {...line}
        transform="rotate(-20 18 42)"
      />
      <Ellipse
        cx={82}
        cy={42}
        rx={11}
        ry={6}
        fill={ink.blanco}
        {...line}
        transform="rotate(20 82 42)"
      />
      <Path
        d="M32 30 Q28 18 34 14"
        {...stroke}
        strokeWidth={5}
        stroke={ink.gris}
      />
      <Path
        d="M68 30 Q72 18 66 14"
        {...stroke}
        strokeWidth={5}
        stroke={ink.gris}
      />
      <Ellipse cx={50} cy={52} rx={28} ry={28} fill={ink.blanco} {...line} />
      <Path d="M30 36 Q38 30 44 38 Q42 48 32 46 Z" fill={ink.contorno} />
      <Circle cx={40} cy={48} r={4} fill={ink.contorno} />
      <Circle cx={60} cy={48} r={4} fill={ink.contorno} />
      <Circle cx={41.4} cy={46.6} r={1.4} fill={ink.blanco} />
      <Circle cx={61.4} cy={46.6} r={1.4} fill={ink.blanco} />
      <Ellipse cx={50} cy={68} rx={19} ry={12} fill={ink.mejilla} {...line} />
      <Ellipse cx={43} cy={67} rx={2.5} ry={3.5} fill={ink.contorno} />
      <Ellipse cx={57} cy={67} rx={2.5} ry={3.5} fill={ink.contorno} />
    </>
  ),
  cerdo: (
    <>
      <Path d="M26 36 L22 16 L42 28 Z" fill={ink.rosa} {...line} />
      <Path d="M74 36 L78 16 L58 28 Z" fill={ink.rosa} {...line} />
      <Circle cx={50} cy={54} r={30} fill={ink.rosa} {...line} />
      <Circle cx={39} cy={46} r={4.5} fill={ink.contorno} />
      <Circle cx={61} cy={46} r={4.5} fill={ink.contorno} />
      <Circle cx={40.5} cy={44.5} r={1.6} fill={ink.blanco} />
      <Circle cx={62.5} cy={44.5} r={1.6} fill={ink.blanco} />
      <Ellipse cx={50} cy={63} rx={13} ry={9} fill={ink.mejilla} {...line} />
      <Ellipse cx={45} cy={63} rx={2.2} ry={3.2} fill={ink.contorno} />
      <Ellipse cx={55} cy={63} rx={2.2} ry={3.2} fill={ink.contorno} />
      <Path d="M44 76 Q50 80 56 76" {...stroke} strokeWidth={2.5} />
    </>
  ),
  oso: (
    <>
      <Circle cx={26} cy={30} r={12} fill={ink.cafe} {...line} />
      <Circle cx={74} cy={30} r={12} fill={ink.cafe} {...line} />
      <Circle cx={26} cy={30} r={5} fill={ink.piel} />
      <Circle cx={74} cy={30} r={5} fill={ink.piel} />
      <Circle cx={50} cy={56} r={31} fill={ink.cafe} {...line} />
      <Ellipse cx={50} cy={67} rx={14} ry={11} fill={ink.piel} />
      <Circle cx={39} cy={50} r={4.5} fill={ink.contorno} />
      <Circle cx={61} cy={50} r={4.5} fill={ink.contorno} />
      <Circle cx={40.5} cy={48.5} r={1.6} fill={ink.blanco} />
      <Circle cx={62.5} cy={48.5} r={1.6} fill={ink.blanco} />
      <Ellipse cx={50} cy={62} rx={6} ry={4.5} fill={ink.contorno} />
      <Path d="M44 71 Q50 76 56 71" {...stroke} strokeWidth={2.5} />
    </>
  ),
  leon: (
    <>
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <Circle
            key={angle}
            cx={50 + 30 * Math.cos(rad)}
            cy={52 + 30 * Math.sin(rad)}
            r={13}
            fill={ink.naranja}
            {...line}
          />
        );
      })}
      <Circle cx={50} cy={52} r={27} fill={ink.amarillo} {...line} />
      <Circle cx={40} cy={47} r={4.5} fill={ink.contorno} />
      <Circle cx={60} cy={47} r={4.5} fill={ink.contorno} />
      <Circle cx={41.5} cy={45.5} r={1.6} fill={ink.blanco} />
      <Circle cx={61.5} cy={45.5} r={1.6} fill={ink.blanco} />
      <Path
        d="M44 57 L56 57 L50 64 Z"
        fill={ink.cafeOscuro}
        {...line}
        strokeWidth={2}
      />
      <Path d="M43 68 Q50 74 57 68" {...stroke} strokeWidth={2.5} />
    </>
  ),
  mono: (
    <>
      <Circle cx={20} cy={50} r={12} fill={ink.cafe} {...line} />
      <Circle cx={80} cy={50} r={12} fill={ink.cafe} {...line} />
      <Circle cx={20} cy={50} r={6} fill={ink.piel} />
      <Circle cx={80} cy={50} r={6} fill={ink.piel} />
      <Circle cx={50} cy={50} r={30} fill={ink.cafe} {...line} />
      <Ellipse cx={41} cy={46} rx={11} ry={12} fill={ink.piel} />
      <Ellipse cx={59} cy={46} rx={11} ry={12} fill={ink.piel} />
      <Ellipse cx={50} cy={64} rx={19} ry={13} fill={ink.piel} />
      <Circle cx={42} cy={46} r={4} fill={ink.contorno} />
      <Circle cx={58} cy={46} r={4} fill={ink.contorno} />
      <Circle cx={43.4} cy={44.6} r={1.4} fill={ink.blanco} />
      <Circle cx={59.4} cy={44.6} r={1.4} fill={ink.blanco} />
      <Circle cx={47} cy={59} r={1.8} fill={ink.contorno} />
      <Circle cx={53} cy={59} r={1.8} fill={ink.contorno} />
      <Path d="M42 67 Q50 74 58 67" {...stroke} strokeWidth={2.5} />
    </>
  ),
  elefante: (
    <>
      <Ellipse cx={22} cy={46} rx={18} ry={24} fill={ink.gris} {...line} />
      <Ellipse cx={78} cy={46} rx={18} ry={24} fill={ink.gris} {...line} />
      <Ellipse
        cx={22}
        cy={46}
        rx={10}
        ry={15}
        fill={ink.mejilla}
        opacity={0.6}
      />
      <Ellipse
        cx={78}
        cy={46}
        rx={10}
        ry={15}
        fill={ink.mejilla}
        opacity={0.6}
      />
      <Path
        d="M43 62 L57 62 L57 80 Q57 92 45 92 Q38 92 38 86 Q38 82 43 82 Q46 82 46 80 Z"
        fill={ink.gris}
        {...line}
      />
      <Circle cx={50} cy={44} r={26} fill={ink.gris} {...line} />
      <Path d="M43 62 L57 62" stroke={ink.gris} strokeWidth={6} />
      <Circle cx={40} cy={42} r={4.5} fill={ink.contorno} />
      <Circle cx={60} cy={42} r={4.5} fill={ink.contorno} />
      <Circle cx={41.5} cy={40.5} r={1.6} fill={ink.blanco} />
      <Circle cx={61.5} cy={40.5} r={1.6} fill={ink.blanco} />
      <Circle cx={34} cy={54} r={4} fill={ink.mejilla} opacity={0.8} />
      <Circle cx={66} cy={54} r={4} fill={ink.mejilla} opacity={0.8} />
    </>
  ),
  pulpo: (
    <>
      <Path
        d="M24 54 Q20 70 10 74 Q22 82 32 64 Q34 78 28 88 Q42 84 42 64 Q46 80 50 90 Q54 80 58 64 Q58 84 72 88 Q66 78 68 64 Q78 82 90 74 Q80 70 76 54 Z"
        fill={ink.morado}
        {...line}
      />
      <Path
        d="M22 58 C22 30 36 16 50 16 C64 16 78 30 78 58 Z"
        fill={ink.morado}
        {...line}
      />
      <Circle cx={40} cy={42} r={5} fill={ink.contorno} />
      <Circle cx={60} cy={42} r={5} fill={ink.contorno} />
      <Circle cx={41.6} cy={40.4} r={1.8} fill={ink.blanco} />
      <Circle cx={61.6} cy={40.4} r={1.8} fill={ink.blanco} />
      <Circle cx={32} cy={50} r={4} fill={ink.mejilla} opacity={0.8} />
      <Circle cx={68} cy={50} r={4} fill={ink.mejilla} opacity={0.8} />
      <Path d="M44 51 Q50 56 56 51" {...stroke} strokeWidth={2.5} />
    </>
  ),
  abeja: (
    <>
      <Ellipse
        cx={46}
        cy={34}
        rx={10}
        ry={15}
        fill={ink.celeste}
        {...line}
        strokeWidth={2}
        transform="rotate(-20 46 34)"
      />
      <Ellipse
        cx={62}
        cy={32}
        rx={10}
        ry={15}
        fill={ink.celeste}
        {...line}
        strokeWidth={2}
        transform="rotate(20 62 32)"
      />
      <Ellipse cx={54} cy={58} rx={28} ry={20} fill={ink.amarillo} />
      <Rect x={48} y={40} width={8} height={36} fill={ink.contorno} />
      <Rect x={64} y={43} width={8} height={30} fill={ink.contorno} />
      <Ellipse cx={54} cy={58} rx={28} ry={20} fill="none" {...line} />
      <Path d="M82 56 L92 58 L82 62 Z" fill={ink.contorno} />
      <Circle cx={26} cy={56} r={13} fill={ink.amarillo} {...line} />
      <Circle cx={22} cy={53} r={3} fill={ink.contorno} />
      <Path d="M20 61 Q24 64 28 61" {...stroke} strokeWidth={2} />
      <Path
        d="M24 44 Q20 34 14 32 M30 44 Q32 34 38 30"
        {...stroke}
        strokeWidth={2}
      />
    </>
  ),
  avion: (
    <>
      <Path d="M40 50 L56 20 L68 20 L62 50 Z" fill={ink.azul} {...line} />
      <Path d="M14 46 L8 26 L20 26 L30 46 Z" fill={ink.azul} {...line} />
      <Path
        d="M10 52 Q10 44 20 44 L74 44 Q90 44 94 52 Q90 60 74 60 L20 60 Q10 60 10 52 Z"
        fill={ink.blanco}
        {...line}
      />
      <Path d="M40 54 L56 84 L68 84 L62 54 Z" fill={ink.azul} {...line} />
      <Path
        d="M80 47 Q88 48 91 52 L80 52 Z"
        fill={ink.celeste}
        {...line}
        strokeWidth={2}
      />
      {[36, 48, 60, 72].map((cx) => (
        <Circle
          key={cx}
          cx={cx}
          cy={50}
          r={2.6}
          fill={ink.celeste}
          {...line}
          strokeWidth={1.5}
        />
      ))}
    </>
  ),
  barco: (
    <>
      <Path d="M50 12 L50 66" {...stroke} />
      <Path d="M54 16 L54 60 L86 60 Z" fill={ink.blanco} {...line} />
      <Path d="M46 24 L46 60 L20 60 Z" fill={ink.amarillo} {...line} />
      <Path d="M10 66 L90 66 L78 84 L22 84 Z" fill={ink.rojo} {...line} />
      <Path
        d="M6 92 Q16 86 26 92 Q36 98 46 92 Q56 86 66 92 Q76 98 94 92"
        {...stroke}
        stroke={ink.azul}
      />
    </>
  ),
  tren: (
    <>
      <Rect
        x={20}
        y={22}
        width={12}
        height={18}
        rx={2}
        fill={ink.gris}
        {...line}
      />
      <Rect
        x={10}
        y={40}
        width={58}
        height={32}
        rx={5}
        fill={ink.rojo}
        {...line}
      />
      <Rect
        x={54}
        y={24}
        width={30}
        height={48}
        rx={5}
        fill={ink.azul}
        {...line}
      />
      <Rect
        x={60}
        y={32}
        width={18}
        height={14}
        rx={3}
        fill={ink.celeste}
        {...line}
        strokeWidth={2}
      />
      <Path d="M84 66 L92 66 L92 74 L84 74" fill={ink.gris} {...line} />
      {[24, 46, 70].map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy={78} r={9} fill={ink.contorno} />
          <Circle cx={cx} cy={78} r={3.5} fill={ink.gris} />
        </G>
      ))}
    </>
  ),
  bus: (
    <>
      <Rect
        x={6}
        y={24}
        width={88}
        height={52}
        rx={10}
        fill={ink.amarillo}
        {...line}
      />
      {[12, 32, 52].map((x) => (
        <Rect
          key={x}
          x={x}
          y={32}
          width={16}
          height={16}
          rx={3}
          fill={ink.celeste}
          {...line}
          strokeWidth={2}
        />
      ))}
      <Rect
        x={74}
        y={32}
        width={14}
        height={30}
        rx={3}
        fill={ink.celeste}
        {...line}
        strokeWidth={2}
      />
      <Path d="M6 58 L70 58" stroke={ink.naranja} strokeWidth={4} />
      {[26, 74].map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy={78} r={10} fill={ink.contorno} />
          <Circle cx={cx} cy={78} r={4} fill={ink.gris} />
        </G>
      ))}
    </>
  ),
  bicicleta: (
    <>
      <Circle cx={24} cy={66} r={18} fill="none" {...line} />
      <Circle cx={76} cy={66} r={18} fill="none" {...line} />
      <Path
        d="M24 66 L42 40 L66 40 L76 66 M42 40 L50 66 L24 66 M50 66 L66 40"
        fill="none"
        stroke={ink.rojo}
        strokeWidth={4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path d="M36 32 L48 32" {...stroke} strokeWidth={5} />
      <Path d="M42 32 L42 40" {...stroke} />
      <Path d="M66 40 L64 28 L74 26" {...stroke} />
      <Circle cx={24} cy={66} r={3} fill={ink.contorno} />
      <Circle cx={76} cy={66} r={3} fill={ink.contorno} />
      <Circle cx={50} cy={66} r={4} fill={ink.contorno} />
    </>
  ),
  globo: (
    <>
      <Path d="M50 74 Q42 84 52 96" {...stroke} strokeWidth={2.5} />
      <Path
        d="M45 76 L55 76 L50 70 Z"
        fill={ink.rojo}
        {...line}
        strokeWidth={2}
      />
      <Ellipse cx={50} cy={40} rx={26} ry={31} fill={ink.rojo} {...line} />
      <Ellipse cx={39} cy={30} rx={5} ry={9} fill={ink.blanco} opacity={0.6} />
    </>
  ),
  cuchara: (
    <>
      <Path
        d="M53 44 L60 50 L26 90 Q22 94 18 90 Q15 86 19 82 Z"
        fill={ink.gris}
        {...line}
      />
      <Ellipse
        cx={68}
        cy={30}
        rx={15}
        ry={21}
        fill={ink.gris}
        {...line}
        transform="rotate(40 68 30)"
      />
      <Ellipse
        cx={66}
        cy={28}
        rx={5}
        ry={10}
        fill={ink.blanco}
        opacity={0.6}
        transform="rotate(40 66 28)"
      />
    </>
  ),
  mar: (
    <>
      <Path
        d="M6 48 Q18 32 32 44 Q42 54 52 44 Q62 34 72 44 Q82 54 94 42 L94 90 L6 90 Z"
        fill={ink.azul}
        {...line}
      />
      <Path
        d="M6 66 Q18 56 30 66 Q42 76 54 66 Q66 56 78 66 Q86 72 94 66 L94 90 L6 90 Z"
        fill={ink.celeste}
        {...line}
      />
    </>
  ),
  gota: (
    <>
      <Path
        d="M50 10 C40 32 22 48 22 64 C22 80 35 90 50 90 C65 90 78 80 78 64 C78 48 60 32 50 10 Z"
        fill={ink.celeste}
        {...line}
      />
      <Ellipse cx={38} cy={64} rx={4} ry={9} fill={ink.blanco} opacity={0.8} />
    </>
  ),
  leche: (
    <>
      <Path d="M28 32 L28 90 L72 90 L72 32 Z" fill={ink.blanco} {...line} />
      <Path d="M28 32 L36 14 L64 14 L72 32 Z" fill={ink.blanco} {...line} />
      <Path
        d="M44 14 L44 8 L56 8 L56 14"
        fill={ink.azul}
        {...line}
        strokeWidth={2}
      />
      <Rect x={28} y={48} width={44} height={24} fill={ink.azul} {...line} />
      <Path d="M50 52 Q44 60 50 66 Q56 60 50 52 Z" fill={ink.blanco} />
    </>
  ),
  circuloAmarillo: (
    <Circle cx={50} cy={50} r={36} fill={ink.amarillo} {...line} />
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
