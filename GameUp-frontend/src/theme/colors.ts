/**
 * Colores de GameUP.
 *
 * Los nombres siguen la guía «Estilos para el frontend» de la Fundación
 * ASISCO UP (colección «Marca ASISCO UP»). Si la paleta oficial cambia, se
 * actualiza aquí y en ningún otro lugar.
 *
 * Regla: ningún componente escribe un color a mano. Los componentes reciben
 * el tipo `ThemeColor`, que solo acepta valores de este archivo.
 *
 * Marcas usadas en los comentarios:
 * - [guía]: valor tomado tal cual de la guía.
 * - [derivado GameUP]: aprobado por el equipo GameUP el 22-oct-2026 a partir
 *   de los mockups. Falta proponerlo a la fundación («propónla en un comentario»).
 * - [PENDIENTE DE APROBACIÓN]: propuesta nueva, aún sin aprobar.
 */
export const colors = {
  marca: {
    /** [guía] Íconos y barras de progreso. Sin texto blanco pequeño encima (3,7:1). */
    verde: '#2E938A',
    /** [guía] Acento. Siempre con texto oscuro, nunca blanco (2,3:1). */
    naranja: '#F19727',
    /** [guía] Fondo general de la app. */
    gris: '#EDECED',
  },
  verde: {
    /** [guía] Botón principal y enlaces. Texto blanco permitido (6,3:1). */
    oscuro: '#1E6B65',
    /** [guía] Opción seleccionada y fondos suaves. */
    suave: '#E1F0EE',
    /** [derivado GameUP] Fondo del espejo y del video. Texto blanco 10:1. */
    profundo: '#174A45',
  },
  naranja: {
    /** [guía] Avisos y destacados, con texto oscuro. */
    suave: '#FDEFD9',
    /** [PENDIENTE DE APROBACIÓN] Botón naranja presionado. Texto principal 5,1:1. */
    presionado: '#DB8418',
  },
  texto: {
    /**
     * [guía] Texto general. La guía también lo usa como color del botón
     * principal presionado.
     */
    principal: '#1C2B2A',
    /** [guía] Texto de apoyo. AA sobre blanco y sobre el gris de fondo. */
    secundario: '#4F5F5D',
    /** [guía] Texto sobre verde oscuro o verde profundo. */
    sobreOscuro: '#FFFFFF',
  },
  superficie: {
    /** [derivado GameUP] Tarjetas. La guía nombra «superficie» sin dar el valor. */
    blanca: '#FFFFFF',
    /**
     * [derivado GameUP] Velo detrás de un aviso que tapa la pantalla (la
     * celebración de nivel): el texto principal al 60 %.
     */
    velo: 'rgba(28, 43, 42, 0.6)',
  },
  cafe: {
    /** [derivado GameUP] Íconos y textos sobre naranja suave. 6,9:1. */
    oscuro: '#7A4500',
  },
  borde: {
    /** [derivado GameUP] Bordes de tarjetas y fichas. Decorativo. */
    suave: '#D9DCDB',
  },
  estrella: {
    /** [derivado GameUP] Estrella vacía. 3,15:1 sobre blanco. */
    vacia: '#8A9391',
  },
  /**
   * [derivado GameUP] Colores del personaje y de las bocas, tomados de los
   * mockups (diseño original del equipo, no del Método Ventura).
   */
  ilustracion: {
    piel: '#F7D6BD',
    mejilla: '#F4C088',
    nariz: '#C99A7E',
    labio: '#D9574A',
    /** Labio inferior de la boca cerrada. */
    labioInferior: '#C94B40',
    /**
     * Contorno de la boca: sobre la piel el labio solo da 2,8:1; con este
     * borde la forma de la boca supera 3:1 (4,5:1).
     */
    labioBorde: '#A83F35',
    bocaInterior: '#5B1F22',
    lengua: '#EE8F86',
    dientes: '#FFFFFF',
  },
  /**
   * [PENDIENTE DE APROBACIÓN] Colores vivos de los dibujos de cada juego
   * (`GameIcon`): estilo infantil para que el niño reconozca el juego sin
   * leer. Solo decoran; el texto de la tarjeta dice qué juego es.
   */
  juego: {
    rojo: '#FF5A5F',
    azul: '#3DA5FF',
    amarillo: '#FFD23F',
    rosa: '#FF6F91',
    mejilla: '#FF8FA3',
    hoja: '#6CCB5F',
    morado: '#9B6BFF',
    moradoClaro: '#C9B3FF',
    fondoAmarillo: '#FFF1C7',
  },
  /** Sin color de fondo (enlaces, bordes invisibles). */
  transparente: 'transparent',
} as const;

type Leaves<T> = T extends string
  ? T
  : { [K in keyof T]: Leaves<T[K]> }[keyof T];

/** Cualquier color definido en el tema. Un valor escrito a mano no compila. */
export type ThemeColor = Leaves<typeof colors>;
