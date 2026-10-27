/**
 * Espacios, radios y tamaños. Las medidas salen de la guía (botones de
 * 56 px, áreas táctiles de 44 px) y de los mockups.
 */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  /** Margen lateral de las pantallas. */
  gutter: 24,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const sizes = {
  /** Área táctil mínima (guía: 44 px o más). */
  touchMin: 44,
  /** Alto mínimo de un botón (guía: 56 px o más). */
  button: 56,
  /** Botón de acción principal en las pantallas del niño (decisión del equipo). */
  buttonLarge: 64,
  iconButton: { sm: 44, md: 56, lg: 88 },
  icon: { sm: 20, md: 24, lg: 32, xl: 40 },
  border: 1.5,
  borderStrong: 2,
  progressBar: 12,
  dot: 12,
  dotActiveWidth: 32,
  tabBarItem: 64,
  avatar: 48,
  stepNumber: 32,
  /** Personaje: Inicio (xs), selección (sm), tarjetas (md), paso Mira (lg). */
  character: { xs: 56, sm: 72, md: 120, lg: 220 },
  /** Boca suelta: Busca la boca y catálogo. */
  mouth: { sm: 56, md: 80, lg: 120 },
  /** Recuadro blanco del ícono en las tarjetas de juego. */
  iconBox: 56,
  /** Recuadro del símbolo de cada tema en «Mi progreso». */
  moduleBadge: 44,
  /** Botón de micrófono y su halo (paso «Dilo»). */
  mic: 96,
  micHalo: 128,
  /** Alto del espejo de la cámara. */
  mirror: 300,
  /** Miniatura «Así» dentro del espejo. */
  mirrorThumb: 88,
  /** Onda de voz: alto máximo de las barras (grande y en filas de audio). */
  waveform: 40,
  waveformSmall: 20,
  waveformBar: 4,
  /** Tarjeta de cada boca en «Busca la boca» (alto mínimo). */
  mouthOption: 88,
  /** Ficha de sonido (alto mínimo). */
  soundTile: 96,
<<<<<<< HEAD
=======
  /**
   * Juegos de «Pensar y recordar» (sin mockup: propuesta del equipo).
   * Tarjeta con dibujo en fila (Emparejar) y en cuadrícula (Secuenciar,
   * Memoria), grupo de Clasificar y casilla de cada paso en Secuenciar.
   */
  pictureRow: 96,
  /** Tarjeta grande de arriba: lo que se empareja o se clasifica. */
  pictureStage: 160,
  pictureTile: 140,
  categoryBin: 180,
  sequenceSlot: 72,
>>>>>>> d35da8ccfdd8dc6504d71a290c9fdc1a1ad75028
  /** Logo completo de la fundación (guía: con lema, desde 200 px de ancho). */
  logo: 220,
} as const;

export type CharacterSize = keyof typeof sizes.character;
export type MouthSize = keyof typeof sizes.mouth;

export type IconSize = keyof typeof sizes.icon;
