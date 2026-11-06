/**
 * DTO del módulo `intentos` del backend (`GameUp-backend/src/modules/
 * intentos/presentation/dto/intento.dto.ts`).
 */
import type { CodigoJuego, EstadoIntento } from './juegos';

/** Cuerpo de `POST /intentos` (juegos sin voz). */
export interface RegistrarIntentoDto {
  actividadId: string;
  /**
   * EMPAREJAR, CLASIFICAR, SECUENCIAR, BUSCA_LA_BOCA: `{ firstTryCorrect, total }`.
   * MEMORIA: `{ pairs, mismatches }`. Sin tiempos, vidas ni penalizaciones.
   */
  resultado: Record<string, unknown>;
}

/** Respuesta de `POST /intentos` y base de la de Habla conmigo. */
export interface IntentoDto {
  id: string;
  /** `null` en los intentos de la escalera de niveles (no tienen asignación). */
  asignacionId: string | null;
  actividadId: string;
  /** Nivel (1-5) si es de la escalera; `null` si es de un módulo. */
  nivelJuego?: number | null;
  tipoJuego: CodigoJuego;
  numeroIntento: number;
  resultado: Record<string, unknown>;
  estrellas: number;
  fecha: string;
  estado: EstadoIntento;
  validacion: {
    resultado: 'APROBADO' | 'RECHAZADO';
    retroalimentacion: string | null;
    fecha: string;
  } | null;
  tieneAudio: boolean;
}

/** Respuesta de `POST /intentos/habla-conmigo` (multipart). */
export interface IntentoVozDto extends IntentoDto {
  estadoGrabacion:
    | 'ADJUNTA'
    | 'NO_ENVIADA'
    | 'SIN_CONSENTIMIENTO'
    | 'NO_VERIFICABLE'
    | 'NO_GUARDADA';
  grabacionGuardada: boolean;
  estrellasPractica: number;
}

/** Un elemento de `GET /estudiantes/me/practica-vocales`. */
export interface PracticaVocalDto {
  vocal: string;
  estrellas: number;
}

/** Respuesta de `GET /estudiantes/me/punto-retorno`. */
export interface PuntoRetornoDto {
  puntoRetorno: { tipoJuego: 'HABLA_CONMIGO'; vocal: string } | null;
}
