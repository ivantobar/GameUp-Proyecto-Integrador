/**
 * DTO de la revisión del docente (`GameUp-backend/src/modules/validaciones/
 * presentation/dto/validacion.dto.ts`) y de las observaciones.
 */
import type { CodigoJuego } from './juegos';

/** Un intento de `GET /revisiones/pendientes` («Por escuchar»). */
export interface ItemRevisionDto {
  intentoId: string;
  tipo: 'VOZ' | 'JUEGO';
  tipoJuego: CodigoJuego;
  estudiante: { id: string; displayName: string; initials: string };
  actividad: { id: string; titulo: string; vocal: string | null };
  modulo: { id: string; nombre: string };
  fecha: string;
  numeroIntento: number;
  /** Pendientes de la misma actividad («intento n de n»). */
  pendientesMismaActividad: number;
  /**
   * Lo que envió el juego. Voz: `{ estadoGrabacion }`; Memoria:
   * `{ pairs, mismatches }`; los demás: `{ firstTryCorrect, total }`.
   */
  resultado: Record<string, unknown>;
  /** Solo voz: ¿el acudiente autorizó grabar? */
  consentimientoVoz: boolean | null;
  /** Solo si hubo audio: disponible para oírlo, o vencido (30 días). */
  grabacion: { disponible: boolean; vencido: boolean } | null;
}

export interface PaginaRevisionDto {
  items: ItemRevisionDto[];
  total: number;
  page: number;
  limit: number;
}

/** Cuerpo de `POST /intentos/:id/validacion`. */
export interface ValidarIntentoDto {
  resultado: 'APROBADO' | 'RECHAZADO';
  /** Obligatoria si es RECHAZADO. */
  retroalimentacion?: string;
}

/** Respuesta de `GET /intentos/:id/grabacion` (URL firmada, 10 min como máximo). */
export interface UrlFirmadaDto {
  url: string;
  expiraEn: string;
}

/** Cuerpo de `POST /estudiantes/:id/observaciones`. */
export interface CrearObservacionDto {
  texto: string;
  /** `true`: la ve el acudiente y le llega un aviso. */
  visibleAcudiente: boolean;
}
