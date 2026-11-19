import { colors } from '@/theme';

/**
 * Paleta y trazo de la biblioteca de ilustraciones. Todo sale del tema
 * (ningún color a mano).
 *
 * Estilo: plano y redondeado, contorno oscuro de 3 px, pocas formas por
 * dibujo, sin degradados. Los animales tienen carita amable; los objetos
 * no, para que el niño aprenda cómo es el objeto de verdad.
 */
export const ink = {
  contorno: colors.texto.principal,
  blanco: colors.superficie.blanca,
  rojo: colors.juego.rojo,
  azul: colors.juego.azul,
  amarillo: colors.juego.amarillo,
  rosa: colors.juego.rosa,
  mejilla: colors.juego.mejilla,
  hoja: colors.juego.hoja,
  morado: colors.juego.morado,
  cafe: colors.juego.cafe,
  cafeOscuro: colors.cafe.oscuro,
  celeste: colors.juego.celeste,
  gris: colors.juego.gris,
  naranja: colors.marca.naranja,
  verde: colors.marca.verde,
  verdeSuave: colors.verde.suave,
  verdeOscuro: colors.verde.oscuro,
  piel: colors.ilustracion.piel,
  labio: colors.ilustracion.labio,
  bocaInterior: colors.ilustracion.bocaInterior,
  lengua: colors.ilustracion.lengua,
} as const;

/** Contorno común: se esparce en cada forma (`{...line}`). */
export const line = {
  stroke: ink.contorno,
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

/** Trazo sin relleno (tallos, bigotes, rayas). */
export const stroke = { ...line, fill: 'none' } as const;
