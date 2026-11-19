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
    /**
     * [PENDIENTE DE APROBACIÓN] Relieve plano de las tarjetas y botones
     * blancos: el borde inferior sólido que los hace ver «tocables» (sin
     * sombras ni degradados). DECORATIVO: el estado nunca depende de él.
     * Gris neutro entre `borde.suave` y `estrella.vacia`: 1,8:1 sobre
     * `marca.gris` y 2,1:1 sobre blanco. Es el único color nuevo fuera de
     * los dibujos; los demás relieves usan colores de la guía o derivados.
     */
    relieve: '#ADB4B2',
  },
  estrella: {
    /** [derivado GameUP] Estrella vacía. 3,15:1 sobre blanco. */
    vacia: '#8A9391',
  },
  /**
   * [derivado GameUP] Colores del personaje y de las bocas, tomados de los
   * mockups (diseño original del equipo, no del Método Ventura). Los videos
   * de los gestos sí siguen el método de la profe Consuelo, basado en el
   * Método Ventura de Patricia Ventura.
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
   * Sobre blanco dan entre 1,4:1 y 3,5:1: sirven como relleno de un dibujo
   * con contorno, nunca como texto ni como único indicador de algo.
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
    /**
     * [PENDIENTE DE APROBACIÓN] Rellenos de la biblioteca de ilustraciones
     * (perro, pan; agua y cielo; metal del grifo). Siempre dentro de un
     * contorno oscuro: el dibujo se distingue por el contorno, no por ellos.
     */
    cafe: '#C98B4E',
    celeste: '#BFE6FF',
    gris: '#C9D1CF',
  },
  /**
   * [PENDIENTE DE APROBACIÓN] Fondo suave de cada juego, SOLO detrás de su
   * dibujo (el recuadro del `GameIcon`), para reconocer el juego sin leer.
   * Nunca en botones, textos, encabezados, fondos de pantalla ni estados.
   * Secuenciar usa `juego.fondoAmarillo` y Habla conmigo, `verde.suave`.
   * Sobre ellos no va texto.
   */
  identidad: {
    /** Emparejar: coral muy claro. */
    emparejarFondo: '#FFE9E5',
    /** Clasificar: azul muy claro. */
    clasificarFondo: '#E3F1FF',
    /** Memoria: lila muy claro. */
    memoriaFondo: '#EFE8FF',
    /** Busca la boca: rosa muy claro. */
    bocaFondo: '#FDEBF1',
  },
  /** Sin color de fondo (enlaces, bordes invisibles). */
  transparente: 'transparent',
} as const;

type Leaves<T> = T extends string
  ? T
  : { [K in keyof T]: Leaves<T[K]> }[keyof T];

/** Cualquier color definido en el tema. Un valor escrito a mano no compila. */
export type ThemeColor = Leaves<typeof colors>;
