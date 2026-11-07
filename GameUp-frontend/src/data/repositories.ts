import type {
  ActivityContent,
  AssignableModule,
  Assignment,
  AssignmentState,
  AuthSession,
  Credentials,
  GameLevel,
  GameResult,
  LadderGameId,
  LevelActivity,
  LevelUp,
  ListeningResult,
  NewGameResult,
  NewAssignment,
  NewListeningResult,
  NewSpeechAttempt,
  OfficialProgress,
  ResumePoint,
  ReviewItem,
  StaffProfile,
  SpeechAttempt,
  StarCount,
  StudentAssignment,
  StudentProfile,
  StudentSummary,
  Vowel,
  VowelPractice,
  WeeklyPractice,
} from './types';

/**
 * Contratos de acceso a datos (inversión de dependencias): las pantallas y
 * los hooks dependen de estas interfaces, no de `fetch` ni de los mocks.
 * Hoy se inyecta la versión simulada (`mock/`); mañana, la de la API NestJS.
 *
 * Son interfaces pequeñas y separadas (segregación de interfaces): cada
 * pantalla usa solo las que necesita.
 */

/**
 * Inicio de sesión. PUNTO DE CONEXIÓN CON LA API: hoy lo resuelve la versión
 * simulada (`mock/`); con NestJS se implementa llamando al endpoint de
 * autenticación que defina el backend, sin cambiar la pantalla.
 */
export interface AuthRepository {
  /**
   * Si el correo o la contraseña no coinciden, rechaza con
   * `InvalidCredentialsError` (`./authErrors`). Cualquier otro error se trata
   * como un problema de conexión.
   */
  signIn(credentials: Credentials): Promise<AuthSession>;
  /**
   * Cerrar sesión: la app olvida el token (y avisa al backend, si puede).
   * Nunca falla: aunque no haya red, la sesión queda cerrada en el teléfono.
   */
  signOut(): Promise<void>;
}

export interface StudentRepository {
  /** Estudiante con sesión activa. Con la API saldrá del token. */
  getCurrentStudent(): Promise<StudentProfile>;
}

export interface PracticeRepository {
  /** Estrellas de práctica por vocal en «Habla conmigo». */
  getVowelPractice(studentId: string): Promise<VowelPractice[]>;
  /** Dónde se quedó el estudiante, o `null` si no hay nada a medias. */
  getResumePoint(studentId: string): Promise<ResumePoint | null>;
  /**
   * Registra un ciclo completo Mira → Dilo → Listo y devuelve cuántas
   * estrellas de práctica (máximo 3) tiene ahora esa vocal. Las estrellas
   * son práctica, no progreso oficial. Con la API las suma el backend al
   * recibir el intento de una actividad (un juego libre no suma).
   */
  recordPracticeCycle(studentId: string, vowel: Vowel): Promise<StarCount>;
}

export interface ConsentRepository {
  /**
   * ¿El acudiente autorizó grabar la voz del estudiante? (Ley 1581 de 2012).
   * Sin autorización, la app no graba.
   */
  hasVoiceRecordingConsent(studentId: string): Promise<boolean>;
}

export interface RecordingRepository {
  /**
   * Envía un intento de habla; queda pendiente de validación del docente.
   * Con la API solo se envía si trae `activityId` (juego abierto desde una
   * actividad); si no, devuelve el intento con `sentForReview: false`.
   */
  submitSpeechAttempt(attempt: NewSpeechAttempt): Promise<SpeechAttempt>;
}

export interface AssignmentRepository {
  /**
   * Tareas que el docente asignó y el estudiante todavía no ha hecho (o que
   * el docente pidió practicar más).
   */
  listPendingForStudent(studentId: string): Promise<Assignment[]>;
}

export interface ActivityRepository {
  /** Contenido de una actividad asignada (por ejemplo, qué vocales juega). */
  getActivity(activityId: string): Promise<ActivityContent>;
}

export interface ResultRepository {
  /**
   * Envía el resultado de «Busca la boca». Queda pendiente de validación y,
   * si había una tarea de ese juego, la marca como realizada. Con la API,
   * igual que los intentos de habla: solo se envía si trae `activityId`.
   */
  submitFindMouthResult(result: NewListeningResult): Promise<ListeningResult>;
  /**
   * Envía el resultado de Emparejar, Clasificar, Secuenciar o Memoria.
   * Solo se envía si trae `activityId`; el juego libre se practica sin
   * enviar (`sentForReview: false`).
   */
  submitGameResult(result: NewGameResult): Promise<GameResult>;
}

/**
 * Escalera de 5 niveles por juego (fase 9). El nivel sube solo cuando la
 * profe aprueba un intento del nivel actual; la app nunca lo cambia.
 */
export interface GameLevelRepository {
  /** Nivel del estudiante con sesión en cada juego con escalera. */
  getMyLevels(): Promise<GameLevel[]>;
  /**
   * La actividad de su nivel actual en ese juego (si completó el 5, la del
   * 5). Su resultado sí llega a la profe (`activityId` del contenido).
   */
  getCurrentLevelActivity(gameId: LadderGameId): Promise<LevelActivity>;
  /**
   * Nivel de un estudiante en cada juego, para la profe a cargo o su
   * acudiente (el backend responde 404 con cualquier otro).
   */
  getStudentLevels(studentId: string): Promise<GameLevel[]>;
}

export interface ProgressRepository {
  /** Progreso oficial por módulo: solo actividades validadas. */
  getOfficialProgress(studentId: string): Promise<OfficialProgress>;
}

export interface StaffRepository {
  /**
   * Adulto con sesión, sea docente o directora (por ejemplo, para «Por
   * escuchar» y «Por validar»). Con la API sale de `GET /auth/me`.
   */
  getCurrentStaff(): Promise<StaffProfile>;
  /** Docente con sesión. Con la API saldrá del token. */
  getCurrentTeacher(): Promise<StaffProfile>;
  /** Acudiente con sesión. */
  getCurrentGuardian(): Promise<StaffProfile>;
}

/**
 * Revisión del docente. Regla 6: el docente solo ve a SUS estudiantes. El
 * filtro por `teacherId` debe hacerlo el backend; ocultarlo en la app no basta.
 */
export interface ReviewRepository {
  /** Qué ofrece esta versión (cambia entre los datos simulados y la API). */
  readonly features: ReviewFeatures;
  listPendingReviews(teacherId: string): Promise<ReviewItem[]>;
  /**
   * Audio de un intento de voz para escucharlo (`speech.remoteAudio`). Con
   * la API es una URL firmada de pocos minutos; pedirlo es requisito para
   * validar ese intento.
   */
  getRecordingUrl(reviewId: string): Promise<string>;
  /**
   * «Lo logró»: valida la actividad; cuenta para el progreso oficial. Si el
   * intento tiene audio y no se escuchó, rechaza con `ListenFirstError`.
   * Si era el nivel actual de la escalera, devuelve la subida de nivel.
   */
  validate(reviewId: string): Promise<LevelUp | null>;
  /** «Practicar más»: no aprueba y deja retroalimentación (obligatoria). */
  requestMorePractice(reviewId: string, feedback: string): Promise<void>;
  /**
   * Nota de texto para la familia: la ve el acudiente en «Practicar en
   * casa» y le llega un aviso.
   */
  shareNoteWithFamily(studentId: string, text: string): Promise<void>;
  /** Nota de voz del docente para la familia (si `features.familyVoiceNote`). */
  saveFamilyVoiceNote(studentId: string, audioUri: string): Promise<void>;
}

export interface ReviewFeatures {
  /** Se puede grabar una nota de voz para la familia. */
  familyVoiceNote: boolean;
  /**
   * La indicación de «Practicar más» llega sola a la familia como nota. Si
   * no, el docente puede elegir enviarla también (`shareNoteWithFamily`).
   */
  feedbackAlwaysReachesFamily: boolean;
}

/**
 * Espacio del acudiente. Regla 5: solo ve al estudiante (o estudiantes) que
 * tiene asociados; el backend debe verificarlo.
 */
export interface GuardianRepository {
  /** Estudiantes asociados al acudiente (puede tener varios). */
  listStudents(guardianId: string): Promise<StudentSummary[]>;
  /**
   * Práctica de la semana de un estudiante del acudiente. Sin `studentId`,
   * la del primero.
   */
  getWeeklyPractice(
    guardianId: string,
    studentId?: string,
  ): Promise<WeeklyPractice>;
  /** «Lo practicamos hoy»: queda en el seguimiento. */
  markPracticedToday(guardianId: string, studentId: string): Promise<void>;
}

/**
 * Estudiantes que puede ver el adulto con sesión (docente: los suyos;
 * directora: todos). El backend decide quiénes son; la app no filtra.
 * Si el estudiante no le corresponde (403 o 404), rechaza con
 * `StudentAccessError` (`./studentErrors`).
 */
export interface StudentDirectoryRepository {
  listStudents(): Promise<StudentSummary[]>;
  getStudent(studentId: string): Promise<StudentSummary>;
  /** Progreso oficial de ese estudiante: solo lo validado. */
  getStudentProgress(studentId: string): Promise<OfficialProgress>;
}

/**
 * Asignar módulos (docente y directora). Si el backend dice que no, rechaza
 * con `AssignmentError` y su motivo (`./studentErrors`).
 */
export interface AssignmentManagementRepository {
  /** Módulos asignados a un estudiante, con su estado y avance. */
  listForStudent(studentId: string): Promise<StudentAssignment[]>;
  /** Solo los módulos publicados: los demás no se pueden asignar. */
  listAssignableModules(): Promise<AssignableModule[]>;
  assign(input: NewAssignment): Promise<StudentAssignment>;
  /** Quitar una asignación. No se puede deshacer. */
  remove(assignmentId: string): Promise<void>;
}

/**
 * Cifras del «Resumen» de la directora. Cada una es una consulta aparte:
 * si una falla, las demás se siguen mostrando.
 */
export interface OverviewRepository {
  /** Estudiantes que puede ver la sesión. */
  countStudents(): Promise<number>;
  /** Actividades que esperan validación. */
  countPendingReviews(): Promise<number>;
  /** Asignaciones en ese estado. */
  countAssignments(state: AssignmentState): Promise<number>;
}

/** Conjunto de repositorios que se inyecta en la app. */
export interface Repositories {
  auth: AuthRepository;
  students: StudentRepository;
  practice: PracticeRepository;
  assignments: AssignmentRepository;
  activities: ActivityRepository;
  progress: ProgressRepository;
  levels: GameLevelRepository;
  consent: ConsentRepository;
  recordings: RecordingRepository;
  results: ResultRepository;
  staff: StaffRepository;
  reviews: ReviewRepository;
  guardians: GuardianRepository;
  directory: StudentDirectoryRepository;
  assignmentManagement: AssignmentManagementRepository;
  overview: OverviewRepository;
}
