/**
 * DTO de la escalera de niveles por juego (`GameUp-backend/src/modules/
 * niveles-juego/presentation/dto/nivel-juego.dto.ts`).
 */
import type { ActividadDetalleDto } from './actividades';

/** Juegos con escalera (códigos del backend). */
export type CodigoJuegoConEscalera =
  'EMPAREJAR' | 'CLASIFICAR' | 'SECUENCIAR' | 'MEMORIA';

/** Un elemento de `GET /estudiantes/me/niveles-juego` y `/estudiantes/:id/niveles-juego`. */
export interface NivelJuegoDto {
  juego: CodigoJuegoConEscalera;
  nombre: string;
  /** 1 a 5. */
  nivelActual: number;
  nivelMaximo: number;
  /** Aprobó el nivel 5. */
  completado: boolean;
  /** Intentos del nivel actual que esperan a la tallerista. */
  pendientesValidacion: number;
  actualizadoEn: string;
}

/** Respuesta de `GET /estudiantes/me/niveles-juego/:juego/actividad`. */
export interface ActividadDelNivelDto {
  nivel: NivelJuegoDto;
  actividad: ActividadDetalleDto & { nivelJuego?: number | null };
}

/** `subidaNivel` de `POST /intentos/:id/validacion` (o `null`). */
export interface SubidaNivelDto {
  intentoId: string;
  juego: CodigoJuegoConEscalera;
  nivelAnterior: number;
  nivelNuevo: number;
  completado: boolean;
}
