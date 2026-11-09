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
  /**
   * Actividad que se abre (va en la ruta como `actividadId`). Solo los
   * juegos abiertos desde una actividad envían su resultado al docente.
   */
  activityId?: string;
  gameId: GameId;
  /** Vocal concreta, si la tarea es de un juego de habla. */
  vowel?: Vowel;
  status: ActivityStatus;
  /** El estudiante todavía no la ha abierto. */
  isNew: boolean;
  /** Nombre de la actividad («¿Cuál empieza con A?»), si se conoce. */
  title?: string;
  /** Módulo (tema) al que pertenece: agrupa las tareas en «Juegos». */
  moduleId?: ModuleId;
  /** Nombre del módulo («La A»). */
  moduleTitle?: string;
  /** Orden de la actividad dentro de su módulo. */
  order?: number;
}

/**
 * Módulos educativos (universo del discurso: colores, números, letras…).
 * Son dinámicos: los crea la fundación en el backend. Los datos simulados
 * usan ids de texto ('colors', 'letters'…) y la API, ids numéricos.
 */
export type ModuleId = string;

/** Avance de un módulo: actividades validadas sobre el total asignado. */
export interface ModuleProgress {
  moduleId: ModuleId;
  /** Nombre del módulo («Vocales»). */
  title: string;
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
 * Autorización para grabar la voz, con su motivo:
 * - `granted`: el acudiente autorizó (solo entonces se graba);
 * - `notGranted`: el acudiente NO autorizó (`NO_ACEPTADO`);
 * - `notVerified`: no se pudo consultar o la respuesta no fue clara. Falla
 *   cerrado (no se graba), pero no se culpa al acudiente.
 */
export type VoiceConsentStatus = 'granted' | 'notGranted' | 'notVerified';

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
  /**
   * ¿Llegó al docente? `false` en un juego libre con la API: se practica,
   * pero no se envía (solo cuentan los juegos abiertos desde una actividad).
   */
  sentForReview: boolean;
}

export interface NewSpeechAttempt {
  studentId: string;
  vowel: Vowel;
  audioUri: string | null;
  /** Actividad asignada de la que viene, o nada si el juego se abrió libre. */
  activityId?: string | null;
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
  /** ¿Llegó al docente? (ver `SpeechAttempt.sentForReview`). */
  sentForReview: boolean;
}

export interface NewListeningResult {
  studentId: string;
  firstTryCorrect: number;
  total: number;
  /** Actividad asignada de la que viene, o nada si el juego se abrió libre. */
  activityId?: string | null;
}

/** Juegos de «Pensar y recordar»: envían su resultado con `POST /intentos`. */
export type ThinkingGameId = 'match' | 'classify' | 'sequence' | 'memory';

/*
 * Escalera de niveles (fase 9). Emparejar, Clasificar, Secuenciar y Memoria
 * tienen 5 niveles cada uno; el niño sube uno cuando la profe aprueba su
 * intento del nivel actual. NO es el nivel BAJO/MEDIO/ALTO del estudiante.
 */

/** Juegos con escalera de niveles: los de «Pensar y recordar». */
export type LadderGameId = ThinkingGameId;

export const LADDER_GAMES: readonly LadderGameId[] = [
  'match',
  'classify',
  'sequence',
  'memory',
];

export function isLadderGame(gameId: GameId): gameId is LadderGameId {
  return (LADDER_GAMES as readonly GameId[]).includes(gameId);
}

/** Niveles de cada escalera. */
export const LADDER_LEVELS = 5;

/** Nivel de un estudiante en un juego. */
export interface GameLevel {
  gameId: LadderGameId;
  /** 1 a 5. */
  level: number;
  /** Aprobó el nivel 5: puede seguir jugándolo. */
  completed: boolean;
  /** Intentos de su nivel que esperan a la profe (no suben solos). */
  pendingReview: number;
}

/** La actividad del nivel actual de un juego (la abre el estudiante). */
export interface LevelActivity {
  level: GameLevel;
  content: ActivityContent;
}

/** Lo que pasó con el nivel al aprobar un intento de la escalera. */
export interface LevelUp {
  gameId: LadderGameId;
  previousLevel: number;
  level: number;
  /** true: aprobó el nivel 5. */
  completed: boolean;
}

/**
 * Lo que se informa al docente al terminar (no es una nota):
 * - `turns`: Emparejar, Clasificar y Secuenciar, cuántos turnos resolvió al
 *   primer intento de cuántos tenía el juego;
 * - `memory`: parejas del juego y veces que abrió dos cartas distintas.
 * Sin tiempos, vidas ni penalizaciones (Regla 11).
 */
export type GameScore =
  | { kind: 'turns'; firstTryCorrect: number; total: number }
  | { kind: 'memory'; pairs: number; mismatches: number };

export interface NewGameResult {
  studentId: string;
  gameId: ThinkingGameId;
  score: GameScore;
  /** Actividad asignada de la que viene, o nada si el juego se abrió libre. */
  activityId?: string | null;
}

export interface GameResult {
  id: string;
  studentId: string;
  gameId: ThinkingGameId;
  status: ActivityStatus;
  createdAt: string;
  /** ¿Llegó al docente? (ver `SpeechAttempt.sentForReview`). */
  sentForReview: boolean;
}

interface ActivityBase {
  activityId: string;
  title: string;
}

/**
 * Contenido de una actividad asignada, según su juego: qué vocales juega
 * «Busca la boca», qué vocal «Habla conmigo», y las rondas, conjuntos,
 * rutinas o tableros de los juegos de «Pensar y recordar».
 */
export type ActivityContent =
  | (ActivityBase & { gameId: 'findMouth'; vowels: Vowel[] })
  | (ActivityBase & { gameId: 'speak'; vowel: Vowel })
  | (ActivityBase & { gameId: 'match'; rounds: readonly MatchRound[] })
  | (ActivityBase & { gameId: 'classify'; sets: readonly ClassifySet[] })
  | (ActivityBase & {
      gameId: 'sequence';
      routines: readonly SequenceRoutine[];
    })
  | (ActivityBase & { gameId: 'memory'; boards: readonly MemoryBoard[] });

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

/**
 * - speech: «Habla conmigo»;
 * - listening: «Busca la boca»;
 * - game: Emparejar, Clasificar, Secuenciar o Memoria.
 */
export type ReviewKind = 'speech' | 'listening' | 'game';

/**
 * Por qué un intento de voz no tiene audio (sale de `estadoGrabacion` del
 * backend). En todos estos casos el docente valida sin escuchar.
 * - noConsent: el acudiente no autorizó grabar;
 * - notVerified: no se pudo verificar la autorización (la app no grabó);
 * - notSent: había autorización, pero el niño no envió grabación;
 * - notSaved: no se pudo guardar el audio en el servidor.
 */
export type NoAudioReason =
  'noConsent' | 'notVerified' | 'notSent' | 'notSaved';

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
    /** Archivo de voz que ya se puede oír; `null` si no hay (o hay que pedirlo). */
    audioUri: string | null;
    /**
     * El audio está en el servidor: se pide con `getRecordingUrl` y hay que
     * oírlo antes de decidir (lo exige el backend).
     */
    remoteAudio?: boolean;
    /** Había audio, pero se borró a los 30 días sin revisar. */
    audioExpired?: boolean;
    /** Por qué no hay audio, si se sabe. */
    noAudioReason?: NoAudioReason;
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
  /** Solo Emparejar, Clasificar, Secuenciar y Memoria. */
  game?: {
    gameId: ThinkingGameId;
    /** Título de la actividad («Las vocales en orden»). */
    title: string;
    score: GameScore;
    /** Nivel de la escalera (1-5); `null` si es una tarea de un módulo. */
    level?: number | null;
    /** Intentos pendientes del mismo nivel o tarea (este incluido). */
    pendingSameActivity?: number;
  };
  /** Retroalimentación si el docente pidió practicar más. */
  feedback?: string;
}

/** Nota de la profe para la familia (texto y, si la grabó, voz). */
export interface TeacherNote {
  text: string;
  audioUri: string | null;
}

/** Un día de la semana en el seguimiento de la práctica en casa. */
export interface PracticeDay {
  /** AAAA-MM-DD (hora de Bogotá). */
  date: string;
  practiced: boolean;
}

/**
 * Lo que dijo la profe al revisar una actividad: la familia lo ve en
 * «Practicar en casa» (decisión D5).
 */
export interface ActivityFeedback {
  activityId: string;
  /** Título de la actividad («Di la a»). */
  title: string;
  gameId: GameId;
  /** `validated`: «Lo logró»; `rejected`: «Practicar más». */
  status: 'validated' | 'rejected';
  text: string;
}

/** Lo que ve el acudiente en «Practicar en casa». */
export interface WeeklyPractice {
  student: StudentSummary;
  /** Sonido de la semana; `null` si no hay una tarea de habla pendiente. */
  vowel: Vowel | null;
  teacherNote: TeacherNote | null;
  practicedToday: boolean;
  /** Lunes a domingo de esta semana, si se conocen. */
  days?: PracticeDay[];
  /** Retroalimentación de las actividades revisadas, si hay. */
  feedback?: ActivityFeedback[];
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
  /**
   * Imagen de la fundación (URL firmada del backend). Si no hay, se usa el
   * dibujo provisional (`emoji`) o la palabra.
   */
  imageUri?: string;
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

/** Clasificar: 2 o 3 grupos y unos pocos elementos (hasta 9) para repartir. */
export interface ClassifySet {
  id: string;
  question: string;
  categories: ClassifyCategory[];
  items: ClassifyItem[];
}

/** Secuenciar: una rutina con sus pasos EN ORDEN (de 2 a 6). */
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

/*
 * Gestión de asignaciones (docente y directora). Asignar un módulo a un
 * estudiante empieza el ciclo realización → validación → progreso.
 */

/** Estado de un módulo asignado: asignado, en curso o completado. */
export type AssignmentState = 'assigned' | 'inProgress' | 'completed';

/** Un módulo asignado a un estudiante, con su avance oficial. */
export interface StudentAssignment {
  id: string;
  moduleId: ModuleId;
  /** Nombre del módulo («Vocal A»). */
  moduleTitle: string;
  state: AssignmentState;
  /** Progreso oficial de 0 a 100: solo lo validado. */
  progress: number;
  /** Fecha sugerida para terminarlo (AAAA-MM-DD), o `null`. */
  suggestedDate: string | null;
}

/** Módulo publicado que se puede asignar. */
export interface AssignableModule {
  id: ModuleId;
  title: string;
  description: string | null;
  /** Nombre de su categoría («Lenguaje»). */
  category: string;
}

/** Lo que se envía al asignar. */
export interface NewAssignment {
  moduleId: ModuleId;
  studentId: string;
  /** AAAA-MM-DD, no antes de hoy (hora de Bogotá). Opcional. */
  suggestedDate?: string;
}

/**
 * Una tallerista que tiene (o tuvo) a cargo a un estudiante. Solo lo ve la
 * directora.
 */
export interface StudentTeacher {
  teacherId: string;
  /** Nombre y primer apellido («Ana Gómez»). */
  displayName: string;
  /** Desde cuándo lo tiene a cargo (AAAA-MM-DD). */
  since: string;
  /** `false`: ya no lo tiene a cargo (historial). */
  active: boolean;
}

/**
 * Resultado de quitar una tallerista. `notInCharge`: ya no lo tenía a cargo
 * (por ejemplo, otra persona la quitó antes). No es un error.
 */
export type TeacherRemoval = 'removed' | 'notInCharge';
