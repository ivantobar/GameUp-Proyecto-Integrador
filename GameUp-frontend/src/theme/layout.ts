/**
 * Espacios, radios y tamaños. Las medidas salen de la guía (botones de
 * 56 px), de Android (áreas táctiles de 48 dp) y de los mockups.
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
  /**
   * Separación mínima entre opciones de juego (motricidad fina: el niño no
   * debe tocar la de al lado sin querer).
   */
  option: 12,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  /** Tarjetas del niño: más redondeadas que las de los adultos (xl). */
  card: 24,
  pill: 999,
} as const;

/**
 * Relieve plano (sin sombras): alto del borde inferior sólido de lo que se
 * toca. Al presionar, la cara baja `pressed` dp y «se hunde».
 */
export const depth = {
  /** Botones y botones redondos del niño. */
  sm: 3,
  /** Botones grandes y tarjetas de juego del niño. */
  md: 5,
  /** Cuánto baja la cara al presionar (menos que `sm`: nunca tapa el borde). */
  pressed: 2,
  /**
   * Pantallas de los adultos (login, tallerista, directora, acudiente):
   * relieve más discreto y sin rebote, para que se vean sobrias. Lo aplica
   * `AdultSurfaces` a todo lo que se toca dentro de esas pantallas.
   */
  adult: { sm: 2, md: 3, pressed: 1 },
} as const;

export const sizes = {
  /** Área táctil mínima (Android: 48 dp o más). */
  touchMin: 48,
  /** Alto mínimo de un botón (guía: 56 px o más). */
  button: 56,
  /** Botón de acción principal en las pantallas del niño (decisión del equipo). */
  buttonLarge: 64,
  iconButton: { sm: 48, md: 56, lg: 88 },
  icon: { sm: 20, md: 24, lg: 32, xl: 40 },
  border: 1.5,
  borderStrong: 2,
  progressBar: 12,
  dot: 12,
  dotActiveWidth: 32,
  tabBarItem: 64,
  /** Raya bajo la pestaña activa (el estado también se ve por forma). */
  tabMark: 4,
  avatar: 48,
  stepNumber: 32,
  /** Círculo de cada vocal en «Vocales terminadas» (Habla conmigo). */
  vowelDone: 40,
  /** Personaje: Inicio (xs), selección (sm), tarjetas (md), paso Mira (lg). */
  character: { xs: 56, sm: 72, md: 120, lg: 220 },
  /** Boca suelta: Busca la boca y catálogo. */
  mouth: { sm: 56, md: 80, lg: 120 },
  /** Recuadro blanco del ícono en las tarjetas de juego. */
  iconBox: 56,
  /**
   * Dibujo de cada juego: tareas y preguntas (sm), tarjetas de Juegos (md),
   * aviso de la tarea en Inicio y celebración de nivel (lg).
   */
  gameIcon: { sm: 56, md: 72, lg: 96 },
  /**
   * Ancho mínimo de la columna de texto junto a un dibujo (aviso de la
   * tarea, «Sigue donde ibas»). Con letra grande, si no cabe, el texto baja
   * debajo del dibujo en vez de partir las palabras.
   */
  textColumnMin: 176,
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
  /**
   * Imagen de una tarjeta (contenido de la fundación), del alto de los
   * glifos: `md` en las opciones, `lg` en la tarjeta grande de arriba.
   */
  pictogramImage: { md: 64, lg: 112 },
  /**
   * Miniatura de lo que ya se acomodó: dentro de un grupo de Clasificar o
   * de una casilla de Secuenciar (`sm`), y en un grupo de 3 (`xs`).
   */
  miniPicture: { xs: 28, sm: 40 },
  /**
   * Alto de pantalla desde el que la celebración de «¡Listo!» usa el
   * personaje grande (en pantallas más bajas no cabría sin desplazar).
   */
  tallScreen: 860,
  /** Ilustraciones: estados vacíos y celebración (sm, md, lg). */
  illustration: { sm: 64, md: 120, lg: 200 },
  /** Logo completo de la fundación (guía: con lema, desde 200 px de ancho). */
  logo: 220,
} as const;

export type IllustrationSize = keyof typeof sizes.illustration;
export type DepthSize = Exclude<keyof typeof depth, 'pressed' | 'adult'>;
export type CharacterSize = keyof typeof sizes.character;
export type MouthSize = keyof typeof sizes.mouth;
export type GameIconSize = keyof typeof sizes.gameIcon;

export type IconSize = keyof typeof sizes.icon;
