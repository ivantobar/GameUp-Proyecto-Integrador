import { ReglaNegocioError } from '../../../common/errors/dominio.errors.js';
import {
  NIVEL_JUEGO_MAXIMO,
  exigirNivelJuego,
  type JuegoConEscalera,
} from '../../catalogo/domain/juegos/niveles-juego.js';

/**
 * Nivel de un estudiante en un juego con escalera (tabla
 * nivel_juego_estudiante). NO es BAJO/MEDIO/ALTO.
 */
export interface NivelJuego {
  estudianteId: bigint;
  juego: JuegoConEscalera;
  /** Nombre del juego para mostrar («Memoria»). */
  nombreJuego: string;
  /** 1 a 5. */
  nivelActual: number;
  /** Aprobó el nivel 5: se celebra y puede seguir jugando el 5. */
  completado: boolean;
  actualizadoEn: Date;
}

/** Estado mínimo para decidir un cambio. */
export type EstadoNivel = Pick<NivelJuego, 'nivelActual' | 'completado'>;

/** Un cambio de nivel (historial_nivel_juego). */
export interface CambioNivel {
  nivelAnterior: number;
  /** Estado leído antes del cambio (el cambio solo aplica si sigue igual). */
  completadoAnterior: boolean;
  nivelNuevo: number;
  /** Estado después del cambio. */
  completado: boolean;
}

/** Una subida de nivel ya aplicada por una validación (la ve quien aprueba). */
export interface SubidaNivel extends CambioNivel {
  intentoId: bigint;
  estudianteId: bigint;
  juego: JuegoConEscalera;
}

/**
 * ¿Sube de nivel un intento APROBADO de la escalera? Solo si es del nivel
 * ACTUAL y el juego no está completado. Sube un solo nivel (nunca salta);
 * en el 5 queda completado y sigue en el 5. Nunca baja.
 */
export function subidaPorAprobacion(
  estado: EstadoNivel,
  nivelDelIntento: number,
): CambioNivel | null {
  if (estado.completado || nivelDelIntento !== estado.nivelActual) return null;
  if (estado.nivelActual >= NIVEL_JUEGO_MAXIMO) {
    return {
      nivelAnterior: estado.nivelActual,
      completadoAnterior: false,
      nivelNuevo: NIVEL_JUEGO_MAXIMO,
      completado: true,
    };
  }
  return {
    nivelAnterior: estado.nivelActual,
    completadoAnterior: false,
    nivelNuevo: estado.nivelActual + 1,
    completado: false,
  };
}

export const LARGO_MAXIMO_MOTIVO = 300;

/** El motivo del ajuste manual es obligatorio (queda en el historial). */
export function normalizarMotivo(motivo: string | null | undefined): string {
  const texto = motivo?.trim().replace(/\s+/g, ' ') ?? '';
  if (!texto) {
    throw new ReglaNegocioError(
      'Para cambiar el nivel a mano, el motivo es obligatorio.',
    );
  }
  if (texto.length > LARGO_MAXIMO_MOTIVO) {
    throw new ReglaNegocioError(
      `El motivo admite hasta ${LARGO_MAXIMO_MOTIVO} caracteres.`,
    );
  }
  return texto;
}

/**
 * Ajuste manual de la directora o la tallerista a cargo: pone el nivel que
 * digan (también puede bajarlo, lo decide una persona). El juego queda sin
 * completar: se completa al aprobar el nivel 5.
 */
export function ajusteManual(
  estado: EstadoNivel,
  nivelNuevo: number,
): CambioNivel {
  exigirNivelJuego(nivelNuevo);
  if (nivelNuevo === estado.nivelActual && !estado.completado) {
    throw new ReglaNegocioError(
      `Ya va en el nivel ${nivelNuevo} de ese juego.`,
    );
  }
  return {
    nivelAnterior: estado.nivelActual,
    completadoAnterior: estado.completado,
    nivelNuevo,
    completado: false,
  };
}

/** Aviso al acudiente (sin presión, sin género). */
export function mensajeSubida(
  nombreEstudiante: string,
  nombreJuego: string,
  cambio: CambioNivel,
): string {
  return cambio.completado
    ? `${nombreEstudiante} completó los ${NIVEL_JUEGO_MAXIMO} niveles de ${nombreJuego}. ¡Qué gran logro!`
    : `${nombreEstudiante} subió al nivel ${cambio.nivelNuevo} de ${nombreJuego}. ¡Celébrenlo juntos!`;
}

/** Tipo de notificación (notificacion_tipo_check). */
export const TIPO_AVISO_NIVEL_JUEGO = 'NIVEL_JUEGO';
