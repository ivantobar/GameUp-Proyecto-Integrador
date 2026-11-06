import type { Configuracion } from '../../catalogo/domain/juegos/estrategia-juego.js';
import type { Intento } from './intento.entity.js';

export interface NuevoIntento {
  /** null: intento de la escalera de niveles. */
  asignacionId: bigint | null;
  estudianteId: bigint;
  actividadId: bigint;
  resultado: Configuracion;
  estrellas: number;
}

export interface NuevaGrabacion {
  intentoId: bigint;
  ruta: string;
  duracionSeg: number | null;
  /** Versión de términos verificada en la API del núcleo familiar. */
  codigoVersionTerminos: string;
  consentimientoVerificadoEn: Date;
}

/** Escritura de intentos y grabaciones. */
export interface IntentoEscrituraRepository {
  /**
   * La base pone numero_intento, pasa la asignación a EN_CURSO y rechaza
   * intentos en asignaciones completadas o de otro módulo (triggers).
   */
  registrar(datos: NuevoIntento): Promise<Intento>;
  actualizarResultado(id: bigint, resultado: Configuracion): Promise<void>;
  /** El trigger fn_grabacion_solo_habla exige que sea de Habla conmigo. */
  registrarGrabacion(datos: NuevaGrabacion): Promise<void>;
}

/** Lectura de intentos. */
export interface IntentoLecturaRepository {
  buscarPorId(id: bigint): Promise<Intento | null>;
  /**
   * Intentos de Habla conmigo del estudiante por vocal (todas sus
   * asignaciones), para las estrellas de práctica.
   */
  intentosPorVocal(estudianteId: bigint): Promise<Map<string, number>>;
  /** Vocal del último intento de Habla conmigo («Sigue donde ibas»), o null. */
  ultimaVocal(estudianteId: bigint): Promise<string | null>;
}

export const INTENTO_ESCRITURA_REPOSITORY = Symbol(
  'INTENTO_ESCRITURA_REPOSITORY',
);
export const INTENTO_LECTURA_REPOSITORY = Symbol('INTENTO_LECTURA_REPOSITORY');
