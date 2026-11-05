/**
 * Tipos de aviso (notificacion_tipo_check). Los crea la base con triggers,
 * nunca el backend:
 *  - AVANCE: el estudiante completó un módulo.
 *  - NIVEL: cambió de nivel.
 *  - OBSERVACION: hay una observación visible para el acudiente.
 *  - NUEVO_MODULO: le asignaron un módulo.
 */
export const TIPOS_NOTIFICACION = [
  'AVANCE',
  'NIVEL',
  'OBSERVACION',
  'NUEVO_MODULO',
] as const;
export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];

export function esTipoNotificacion(valor: string): valor is TipoNotificacion {
  return (TIPOS_NOTIFICACION as readonly string[]).includes(valor);
}

export interface PropiedadesNotificacion {
  id: bigint;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  fecha: Date;
}

/** Un aviso para una persona (hoy, solo los acudientes reciben avisos). */
export class Notificacion {
  readonly id: bigint;
  readonly tipo: TipoNotificacion;
  readonly mensaje: string;
  readonly leida: boolean;
  readonly fecha: Date;

  constructor(p: PropiedadesNotificacion) {
    this.id = p.id;
    this.tipo = p.tipo;
    this.mensaje = p.mensaje;
    this.leida = p.leida;
    this.fecha = p.fecha;
  }
}
