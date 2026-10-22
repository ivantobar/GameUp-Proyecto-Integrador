/**
 * Tipos del dominio que usa el frontend. Siguen el universo del discurso de
 * GameUP. Cuando exista la API NestJS, sus DTO se traducirán a estos tipos
 * dentro de los repositorios, sin tocar las pantallas.
 */

/** Vocales del MVP. Sílabas y palabras quedan para la segunda etapa. */
export const VOWELS = ['a', 'e', 'i', 'o', 'u'] as const;
export type Vowel = (typeof VOWELS)[number];

export function isVowel(value: string): value is Vowel {
  return (VOWELS as readonly string[]).includes(value);
}

/** Juegos del catálogo. */
export type GameId =
  'speak' | 'findMouth' | 'match' | 'classify' | 'sequence' | 'memory';

/**
 * Estado de una actividad asignada. Corresponde al ciclo del universo del
 * discurso: asignada → realizada → pendiente de validación → validada o no
 * aprobada. Solo `validated` cuenta para el progreso oficial.
 */
export type ActivityStatus =
  'assigned' | 'submitted' | 'pending_validation' | 'validated' | 'rejected';

export interface StudentProfile {
  id: string;
  /** Nombre o apodo con el que la app saluda («Martín»). */
  displayName: string;
}

/** Estrellas de práctica de una vocal (de 0 a 3). No son una nota. */
export type StarCount = 0 | 1 | 2 | 3;
export const MAX_STARS: StarCount = 3;

export interface VowelPractice {
  vowel: Vowel;
  stars: StarCount;
}

/** Último punto donde iba el estudiante («Sigue donde ibas»). */
export interface ResumePoint {
  gameId: 'speak';
  vowel: Vowel;
}

export interface Assignment {
  id: string;
  gameId: GameId;
  /** Vocal concreta, si la tarea es de un juego de habla. */
  vowel?: Vowel;
  status: ActivityStatus;
  /** El estudiante todavía no la ha abierto. */
  isNew: boolean;
}

/**
 * Módulos educativos (universo del discurso: colores, números, letras…).
 * La lista del MVP sale de la imagen de referencia de «Mi progreso».
 */
export type ModuleId = 'colors' | 'numbers' | 'letters' | 'stories';

/** Avance de un módulo: actividades validadas sobre el total asignado. */
export interface ModuleProgress {
  moduleId: ModuleId;
  validated: number;
  total: number;
}

/**
 * Progreso oficial: solo cuenta actividades validadas por el docente.
 * Las pendientes de validación se informan aparte y no suman.
 */
export interface OfficialProgress {
  modules: ModuleProgress[];
  pendingValidation: number;
}

/**
 * Intento de «Habla conmigo». La app NO califica la pronunciación: el
 * intento queda pendiente hasta que el docente lo escuche y lo valide.
 */
export interface SpeechAttempt {
  id: string;
  studentId: string;
  vowel: Vowel;
  /**
   * Archivo de voz en el teléfono, o `null` si el acudiente no autorizó la
   * grabación. Nunca hay imagen: la cámara solo funciona como espejo.
   */
  audioUri: string | null;
  status: ActivityStatus;
  createdAt: string;
}

export interface NewSpeechAttempt {
  studentId: string;
  vowel: Vowel;
  audioUri: string | null;
}
