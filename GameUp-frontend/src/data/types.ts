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

/**
 * Resultado de una partida de «Busca la boca». Cuenta cuántos sonidos
 * reconoció al primer intento, pero NO es una nota: queda pendiente hasta
 * que el docente lo revise y lo valide.
 */
export interface ListeningResult {
  id: string;
  studentId: string;
  gameId: 'findMouth';
  firstTryCorrect: number;
  total: number;
  status: ActivityStatus;
  createdAt: string;
}

export interface NewListeningResult {
  studentId: string;
  firstTryCorrect: number;
  total: number;
}

/** Persona adulta con sesión (docente o acudiente). */
export interface StaffProfile {
  id: string;
  displayName: string;
}

/** Estudiante tal como lo ve el docente: nombre corto e iniciales. */
export interface StudentSummary {
  id: string;
  /** Nombre y la inicial del apellido («Martín C.»). */
  displayName: string;
  /** Dos letras para el círculo («MC»). */
  initials: string;
}

export type ReviewKind = 'speech' | 'listening';

/**
 * Actividad realizada que espera la revisión del docente («Por escuchar»).
 * - speech: intento de «Habla conmigo» (con o sin grabación);
 * - listening: partida de «Busca la boca».
 */
export interface ReviewItem {
  id: string;
  kind: ReviewKind;
  student: StudentSummary;
  submittedAt: string;
  status: ActivityStatus;
  /** Solo «Habla conmigo». */
  speech?: {
    vowel: Vowel;
    /** Archivo de voz; `null` si no hay grabación. */
    audioUri: string | null;
    /** ¿El acudiente autorizó grabar? Explica por qué no hay audio. */
    voiceConsent: boolean;
    attemptNumber: number;
    attemptsTotal: number;
  };
  /** Solo «Busca la boca». */
  listening?: {
    firstTryCorrect: number;
    total: number;
  };
  /** Retroalimentación si el docente pidió practicar más. */
  feedback?: string;
}

/** Nota de la profe para la familia (texto y, si la grabó, voz). */
export interface TeacherNote {
  text: string;
  audioUri: string | null;
}

/** Lo que ve el acudiente en «Practicar en casa». */
export interface WeeklyPractice {
  student: StudentSummary;
  vowel: Vowel;
  teacherNote: TeacherNote | null;
  practicedToday: boolean;
}

/** Roles de GameUP. El rol de cada cuenta lo decide el backend, no la app. */
export type UserRole = 'student' | 'teacher' | 'guardian' | 'director';

/** Lo que escribe la persona en «Iniciar sesión». */
export interface Credentials {
  email: string;
  password: string;
}

/**
 * Sesión iniciada. Con la API NestJS también traerá el token que entregue el
 * backend; la app nunca decide los permisos a partir de estos datos.
 */
export interface AuthSession {
  userId: string;
  role: UserRole;
  displayName: string;
}

/*
 * Contenido de los juegos «Pensar y recordar» (Emparejar, Clasificar,
 * Secuenciar y Memoria). Lo define el docente o la fundación; hoy sale de
 * datos de ejemplo (`mock/gameContent.ts`).
 */

/**
 * Lo que se ve en una tarjeta: un dibujo, una palabra o una cantidad.
 * - `emoji`: dibujo provisional (pictograma) hasta tener las ilustraciones
 *   de la fundación;
 * - `count`: repite el dibujo para mostrar una cantidad (●●●);
 * - `text`: palabra o número.
 * `label` es lo que oye el niño y el lector de pantalla.
 */
export interface PictureFace {
  id: string;
  label: string;
  emoji?: string;
  count?: number;
  text?: string;
}

/** Emparejar: una tarjeta arriba y de 2 a 4 opciones; una va con ella. */
export interface MatchRound {
  id: string;
  /** Pregunta corta: «¿Qué palabra es?». */
  question: string;
  prompt: PictureFace;
  options: PictureFace[];
  answerId: string;
}

export type ClassifyCategory = PictureFace;

export interface ClassifyItem extends PictureFace {
  categoryId: string;
}

/** Clasificar: 2 grupos y unos pocos elementos para repartir. */
export interface ClassifySet {
  id: string;
  question: string;
  categories: ClassifyCategory[];
  items: ClassifyItem[];
}

/** Secuenciar: una rutina con sus pasos EN ORDEN (de 2 a 4). */
export interface SequenceRoutine {
  id: string;
  title: string;
  steps: PictureFace[];
}

/** Memoria: cada dibujo aparece en dos cartas. */
export interface MemoryBoard {
  id: string;
  pairs: PictureFace[];
}
