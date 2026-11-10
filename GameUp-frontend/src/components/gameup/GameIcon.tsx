import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import type { GameId } from '@/data/types';
import { colors, fontFamilies, sizes, type GameIconSize } from '@/theme';

/** Paleta de los dibujos: todo sale del tema (ningún color a mano). */
const p = {
  contorno: colors.texto.principal,
  blanco: colors.superficie.blanca,
  rojo: colors.juego.rojo,
  azul: colors.juego.azul,
  amarillo: colors.juego.amarillo,
  rosa: colors.juego.rosa,
  mejilla: colors.juego.mejilla,
  verdeHoja: colors.juego.hoja,
  morado: colors.juego.morado,
  moradoClaro: colors.juego.moradoClaro,
  fondoAmarillo: colors.juego.fondoAmarillo,
  fondoVerde: colors.verde.suave,
  naranja: colors.marca.naranja,
  verde: colors.marca.verde,
  piel: colors.ilustracion.piel,
  cabello: colors.cafe.oscuro,
  bocaInterior: colors.ilustracion.bocaInterior,
  lengua: colors.ilustracion.lengua,
} as const;

/**
 * Dibujo de cada juego, en una caja de 100 × 100. Estilo infantil (contorno
 * grueso, ojos grandes con brillo, mejillas): todo tiene carita para que el
 * niño entienda a simple vista que es para jugar y qué juego es.
 * Diseño original del equipo.
 */
const drawings: Record<GameId, ReactNode> = {
  /** Emparejar: dos manzanas felices con un corazón. */
  match: (
    <>
      <Path
        d="M50 3 C72 2 96 18 97 46 C98 74 78 97 50 97 C22 97 2 78 3 50 C4 22 26 4 50 3 Z"
        fill={p.fondoVerde}
      />
      <Path
        d="M30 42 C24 36 10 38 11 54 C12 68 22 74 30 71 C38 74 48 68 49 54 C50 38 36 36 30 42 Z"
        fill={p.rojo}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M30 42 Q31 35 33 32"
        stroke={p.contorno}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M33 34 Q18 26 14 34 Q21 39 33 34 Z"
        fill={p.verdeHoja}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle cx={24} cy={55} r={3.6} fill={p.contorno} />
      <Circle cx={36} cy={55} r={3.6} fill={p.contorno} />
      <Circle cx={25.4} cy={53.5} r={1.4} fill={p.blanco} />
      <Circle cx={37.4} cy={53.5} r={1.4} fill={p.blanco} />
      <Circle cx={19} cy={61} r={3} fill={p.mejilla} opacity={0.8} />
      <Circle cx={41} cy={61} r={3} fill={p.mejilla} opacity={0.8} />
      <Path
        d="M26.0 61 Q30 67.4 34.0 61"
        stroke={p.contorno}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M70 42 C64 36 50 38 51 54 C52 68 62 74 70 71 C78 74 88 68 89 54 C90 38 76 36 70 42 Z"
        fill={p.rojo}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M70 42 Q71 35 73 32"
        stroke={p.contorno}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M73 34 Q82 26 86 34 Q79 39 73 34 Z"
        fill={p.verdeHoja}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle cx={64} cy={55} r={3.6} fill={p.contorno} />
      <Circle cx={76} cy={55} r={3.6} fill={p.contorno} />
      <Circle cx={65.4} cy={53.5} r={1.4} fill={p.blanco} />
      <Circle cx={77.4} cy={53.5} r={1.4} fill={p.blanco} />
      <Circle cx={59} cy={61} r={3} fill={p.mejilla} opacity={0.8} />
      <Circle cx={81} cy={61} r={3} fill={p.mejilla} opacity={0.8} />
      <Path
        d="M66.0 61 Q70 67.4 74.0 61"
        stroke={p.contorno}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M50 30 C46 23 37 25 38 32 C39 38 50 44 50 44 C50 44 61 38 62 32 C63 25 54 23 50 30 Z"
        fill={p.rosa}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M14 19 Q15.25 22.75 19 24 Q15.25 25.25 14 29 Q12.75 25.25 9 24 Q12.75 22.75 14 19 Z"
        fill={p.amarillo}
      />
      <Path
        d="M87 77 Q88.25 80.75 92 82 Q88.25 83.25 87 87 Q85.75 83.25 82 82 Q85.75 80.75 87 77 Z"
        fill={p.amarillo}
      />
    </>
  ),
  /** Clasificar: una canasta feliz que recibe pelotas de colores. */
  classify: (
    <>
      <Path
        d="M50 3 C72 2 96 18 97 46 C98 74 78 97 50 97 C22 97 2 78 3 50 C4 22 26 4 50 3 Z"
        fill={p.fondoAmarillo}
      />
      <Circle
        cx={30}
        cy={27}
        r={9}
        fill={p.azul}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle
        cx={51}
        cy={18}
        r={9}
        fill={p.amarillo}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle
        cx={71}
        cy={28}
        r={9}
        fill={p.rojo}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle cx={27.5} cy={24.5} r={2.4} fill={p.blanco} />
      <Circle cx={48.5} cy={15.5} r={2.4} fill={p.blanco} />
      <Circle cx={68.5} cy={25.5} r={2.4} fill={p.blanco} />
      <Path
        d="M14 46 H86 L78 86 Q77 90 72 90 H28 Q23 90 22 86 Z"
        fill={p.morado}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Rect
        x={10}
        y={40}
        width={80}
        height={11}
        rx={5.5}
        fill={p.moradoClaro}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M24 60 H76 M26 74 H74"
        stroke={p.moradoClaro}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.7}
      />
      <Circle cx={40} cy={63} r={4.4} fill={p.contorno} />
      <Circle cx={60} cy={63} r={4.4} fill={p.contorno} />
      <Circle cx={41.4} cy={61.5} r={1.7} fill={p.blanco} />
      <Circle cx={61.4} cy={61.5} r={1.7} fill={p.blanco} />
      <Circle cx={31} cy={72} r={4} fill={p.mejilla} opacity={0.8} />
      <Circle cx={69} cy={72} r={4} fill={p.mejilla} opacity={0.8} />
      <Path
        d="M44.0 71 Q50 80.6 56.0 71"
        stroke={p.contorno}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M88 9 Q89.25 12.75 93 14 Q89.25 15.25 88 19 Q86.75 15.25 83 14 Q86.75 12.75 88 9 Z"
        fill={p.amarillo}
      />
    </>
  ),
  /** Secuenciar: bloques 1, 2 y 3 con carita y una estrella que sube. */
  sequence: (
    <>
      <Path
        d="M50 3 C72 2 96 18 97 46 C98 74 78 97 50 97 C22 97 2 78 3 50 C4 22 26 4 50 3 Z"
        fill={p.fondoVerde}
      />
      <Rect
        x={8}
        y={54}
        width={26}
        height={36}
        rx={6}
        fill={p.azul}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <SvgText
        x={21.0}
        y={85}
        fontSize={12}
        fontFamily={fontFamilies.extraBold}
        fill={p.blanco}
        textAnchor="middle"
      >
        1
      </SvgText>
      <Circle cx={16.0} cy={63} r={2.9} fill={p.contorno} />
      <Circle cx={26.0} cy={63} r={2.9} fill={p.contorno} />
      <Circle cx={17.4} cy={61.5} r={1.1} fill={p.blanco} />
      <Circle cx={27.4} cy={61.5} r={1.1} fill={p.blanco} />
      <Path
        d="M17.5 68 Q21.0 73.6 24.5 68"
        stroke={p.contorno}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <Rect
        x={37}
        y={43}
        width={26}
        height={47}
        rx={6}
        fill={p.verde}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <SvgText
        x={50.0}
        y={85}
        fontSize={12}
        fontFamily={fontFamilies.extraBold}
        fill={p.blanco}
        textAnchor="middle"
      >
        2
      </SvgText>
      <Circle cx={45.0} cy={52} r={2.9} fill={p.contorno} />
      <Circle cx={55.0} cy={52} r={2.9} fill={p.contorno} />
      <Circle cx={46.4} cy={50.5} r={1.1} fill={p.blanco} />
      <Circle cx={56.4} cy={50.5} r={1.1} fill={p.blanco} />
      <Path
        d="M46.5 57 Q50.0 62.6 53.5 57"
        stroke={p.contorno}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <Rect
        x={66}
        y={28}
        width={26}
        height={62}
        rx={6}
        fill={p.naranja}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <SvgText
        x={79.0}
        y={85}
        fontSize={12}
        fontFamily={fontFamilies.extraBold}
        fill={p.contorno}
        textAnchor="middle"
      >
        3
      </SvgText>
      <Circle cx={74.0} cy={37} r={2.9} fill={p.contorno} />
      <Circle cx={84.0} cy={37} r={2.9} fill={p.contorno} />
      <Circle cx={75.4} cy={35.5} r={1.1} fill={p.blanco} />
      <Circle cx={85.4} cy={35.5} r={1.1} fill={p.blanco} />
      <Path
        d="M75.5 42 Q79.0 47.6 82.5 42"
        stroke={p.contorno}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M24 12 L27.5 19.5 L35.5 20.5 L29.5 26 L31 34 L24 30 L17 34 L18.5 26 L12.5 20.5 L20.5 19.5 Z"
        fill={p.amarillo}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle cx={21} cy={23} r={1.9} fill={p.contorno} />
      <Circle cx={27} cy={23} r={1.9} fill={p.contorno} />
      <Circle cx={22.4} cy={21.5} r={0.7} fill={p.blanco} />
      <Circle cx={28.4} cy={21.5} r={0.7} fill={p.blanco} />
      <Path
        d="M33 42 Q44 30 56 34"
        stroke={p.contorno}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeDasharray="1 5"
      />
    </>
  ),
  /** Memoria: una carta con «?» y otra volteada con un sol feliz. */
  memory: (
    <>
      <Path
        d="M50 3 C72 2 96 18 97 46 C98 74 78 97 50 97 C22 97 2 78 3 50 C4 22 26 4 50 3 Z"
        fill={p.fondoAmarillo}
      />
      <Rect
        x={9}
        y={22}
        width={38}
        height={54}
        rx={9}
        fill={p.azul}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
        transform="rotate(-12 28 49)"
      />
      <SvgText
        x={28}
        y={60}
        fontSize={30}
        fontFamily={fontFamilies.extraBold}
        fill={p.blanco}
        textAnchor="middle"
        transform="rotate(-12 28 49)"
      >
        ?
      </SvgText>
      <Rect
        x={53}
        y={22}
        width={38}
        height={54}
        rx={9}
        fill={p.blanco}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
        transform="rotate(10 72 49)"
      />
      <G transform="rotate(10 72 49)">
        <Circle
          cx={72}
          cy={49}
          r={13}
          fill={p.amarillo}
          stroke={p.contorno}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <Path
          d="M72 30 V33 M72 65 V68 M53 49 H56 M88 49 H91"
          stroke={p.naranja}
          strokeWidth={3.4}
          strokeLinecap="round"
        />
        <Circle cx={67} cy={46} r={2.9} fill={p.contorno} />
        <Circle cx={77} cy={46} r={2.9} fill={p.contorno} />
        <Circle cx={68.4} cy={44.5} r={1.1} fill={p.blanco} />
        <Circle cx={78.4} cy={44.5} r={1.1} fill={p.blanco} />
        <Circle cx={63.5} cy={52} r={2.4} fill={p.mejilla} opacity={0.8} />
        <Circle cx={80.5} cy={52} r={2.4} fill={p.mejilla} opacity={0.8} />
        <Path
          d="M68.0 52 Q72 58.4 76.0 52"
          stroke={p.contorno}
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
        />
      </G>
      <Path
        d="M50 83 Q51.25 86.75 55 88 Q51.25 89.25 50 93 Q48.75 89.25 45 88 Q48.75 86.75 50 83 Z"
        fill={p.naranja}
      />
      <Path
        d="M88 8 Q89.25 11.75 93 13 Q89.25 14.25 88 18 Q86.75 14.25 83 13 Q86.75 11.75 88 8 Z"
        fill={p.amarillo}
      />
    </>
  ),
  /** Habla conmigo: un niño que dice «a». */
  speak: (
    <>
      <Path
        d="M50 3 C72 2 96 18 97 46 C98 74 78 97 50 97 C22 97 2 78 3 50 C4 22 26 4 50 3 Z"
        fill={p.blanco}
      />
      <Circle
        cx={15}
        cy={62}
        r={6}
        fill={p.piel}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle
        cx={65}
        cy={62}
        r={6}
        fill={p.piel}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle
        cx={40}
        cy={60}
        r={25}
        fill={p.piel}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M16 54 C18 34 34 30 42 34 C52 29 66 40 64 54 C56 44 46 46 40 42 C32 48 22 46 16 54 Z"
        fill={p.cabello}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle cx={31} cy={60} r={4} fill={p.contorno} />
      <Circle cx={49} cy={60} r={4} fill={p.contorno} />
      <Circle cx={32.4} cy={58.5} r={1.5} fill={p.blanco} />
      <Circle cx={50.4} cy={58.5} r={1.5} fill={p.blanco} />
      <Circle cx={25} cy={69} r={4} fill={p.mejilla} opacity={0.8} />
      <Circle cx={55} cy={69} r={4} fill={p.mejilla} opacity={0.8} />
      <Ellipse
        cx={40}
        cy={72}
        rx={6}
        ry={7}
        fill={p.bocaInterior}
        stroke={p.contorno}
        strokeWidth={2.4}
      />
      <Ellipse cx={40} cy={75.5} rx={3.5} ry={2.2} fill={p.lengua} />
      <Path
        d="M64 10 H88 Q95 10 95 17 V33 Q95 40 88 40 H76 L67 48 L69 40 H64 Q57 40 57 33 V17 Q57 10 64 10 Z"
        fill={p.naranja}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <SvgText
        x={76}
        y={33}
        fontSize={20}
        fontFamily={fontFamilies.extraBold}
        fill={p.contorno}
        textAnchor="middle"
      >
        a
      </SvgText>
    </>
  ),
  /** Busca la boca: un niño que escucha con ondas y una nota. */
  findMouth: (
    <>
      <Path
        d="M50 3 C72 2 96 18 97 46 C98 74 78 97 50 97 C22 97 2 78 3 50 C4 22 26 4 50 3 Z"
        fill={p.blanco}
      />
      <Circle
        cx={17}
        cy={60}
        r={6}
        fill={p.piel}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle
        cx={67}
        cy={60}
        r={6}
        fill={p.piel}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle
        cx={42}
        cy={58}
        r={25}
        fill={p.piel}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M18 52 C20 32 36 28 44 32 C54 27 68 38 66 52 C58 42 48 44 42 40 C34 46 24 44 18 52 Z"
        fill={p.cabello}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle cx={33} cy={58} r={4} fill={p.contorno} />
      <Circle cx={51} cy={58} r={4} fill={p.contorno} />
      <Circle cx={34.4} cy={56.5} r={1.5} fill={p.blanco} />
      <Circle cx={52.4} cy={56.5} r={1.5} fill={p.blanco} />
      <Circle cx={27} cy={67} r={4} fill={p.mejilla} opacity={0.8} />
      <Circle cx={57} cy={67} r={4} fill={p.mejilla} opacity={0.8} />
      <Path
        d="M35.0 67 Q42 78.2 49.0 67"
        stroke={p.contorno}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M75 42 Q81 54 75 66"
        stroke={p.verde}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M84 35 Q94 54 84 73"
        stroke={p.verde}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M78 12 V26"
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path d="M78 12 L88 9 V14 L78 17" fill={p.contorno} />
      <Ellipse
        cx={74.5}
        cy={27}
        rx={5}
        ry={4}
        fill={p.morado}
        stroke={p.contorno}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </>
  ),
};

interface GameIconProps {
  game: GameId;
  size?: GameIconSize;
}

/**
 * Ícono ilustrado de un juego (tarjetas de Juegos, tareas e Inicio). Es
 * decorativo: el título de la tarjeta dice qué juego es.
 */
export function GameIcon({ game, size = 'md' }: GameIconProps) {
  const side = sizes.gameIcon[size];
  return (
    <View
      testID={`game-icon-${game}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Svg width={side} height={side} viewBox="0 0 100 100">
        {drawings[game]}
      </Svg>
    </View>
  );
}
