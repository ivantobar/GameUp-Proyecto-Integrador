import type {
  CodigoJuego,
  Configuracion,
} from '../../catalogo/domain/juegos/estrategia-juego.js';

/**
 * Qué pasó con la voz en un intento de Habla conmigo. Lo decide el backend
 * (nunca el cliente) y se guarda en intento.resultado.estadoGrabacion:
 *  - ADJUNTA: hay consentimiento y el audio quedó guardado.
 *  - NO_ENVIADA: hay consentimiento, pero la app no mandó audio.
 *  - SIN_CONSENTIMIENTO: el acudiente no aceptó; el audio se descartó.
 *  - NO_VERIFICABLE: no se pudo consultar el consentimiento; se descartó.
 *  - NO_GUARDADA: había consentimiento, pero Storage falló; el intento queda.
 */
export const ESTADOS_GRABACION = [
  'ADJUNTA',
  'NO_ENVIADA',
  'SIN_CONSENTIMIENTO',
  'NO_VERIFICABLE',
  'NO_GUARDADA',
] as const;
export type EstadoGrabacion = (typeof ESTADOS_GRABACION)[number];

export interface Intento {
  id: bigint;
  asignacionId: bigint;
  actividadId: bigint;
  estudianteId: bigint;
  tipoJuego: CodigoJuego;
  /** Lo pone la base (trigger): 1, 2, 3... por actividad y asignación. */
  numeroIntento: number;
  resultado: Configuracion;
  /** Estrellas de práctica (0-3). No son una nota. */
  estrellas: number;
  fecha: Date;
  validacion: {
    resultado: 'APROBADO' | 'RECHAZADO';
    retroalimentacion: string | null;
    fecha: Date;
  } | null;
  /** Solo Habla conmigo. eliminadaEn: el audio ya se borró de Storage. */
  grabacion: { id: bigint; eliminadaEn: Date | null } | null;
}

/** Estrellas de práctica por vocal: 1 por ciclo Mira → Dilo → Listo, hasta 3. */
export const MAXIMO_ESTRELLAS = 3;

export function estrellasDePractica(intentosPrevios: number): number {
  return Math.min(MAXIMO_ESTRELLAS, intentosPrevios + 1);
}

/** Ruta del audio en el bucket privado `grabaciones` (decidido en la fase 0). */
export function rutaGrabacion(
  estudianteId: bigint,
  intentoId: bigint,
  extension: string,
): string {
  return `estudiante/${estudianteId}/intento/${intentoId}.${extension}`;
}
