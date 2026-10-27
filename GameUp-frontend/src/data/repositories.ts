import type {
  Assignment,
  AuthSession,
  Credentials,
  ListeningResult,
  NewListeningResult,
  NewSpeechAttempt,
  OfficialProgress,
  ResumePoint,
  ReviewItem,
  StaffProfile,
  SpeechAttempt,
  StarCount,
  StudentProfile,
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
   * Registra un ciclo completo Mira → Dilo → Listo: suma 1 estrella de
   * práctica (máximo 3) y devuelve cuántas tiene ahora esa vocal.
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
  /** Envía un intento de habla; queda pendiente de validación del docente. */
  submitSpeechAttempt(attempt: NewSpeechAttempt): Promise<SpeechAttempt>;
}

export interface AssignmentRepository {
  /** Tareas que el docente asignó y el estudiante todavía no ha hecho. */
  listPendingForStudent(studentId: string): Promise<Assignment[]>;
}

export interface ResultRepository {
  /**
   * Envía el resultado de «Busca la boca». Queda pendiente de validación y,
   * si había una tarea de ese juego, la marca como realizada.
   */
  submitFindMouthResult(result: NewListeningResult): Promise<ListeningResult>;
}

export interface ProgressRepository {
  /** Progreso oficial por módulo: solo actividades validadas. */
  getOfficialProgress(studentId: string): Promise<OfficialProgress>;
}

export interface StaffRepository {
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
  listPendingReviews(teacherId: string): Promise<ReviewItem[]>;
  /** «Lo logró»: valida la actividad; cuenta para el progreso oficial. */
  validate(reviewId: string): Promise<void>;
  /** «Practicar más»: no aprueba y deja retroalimentación (obligatoria). */
  requestMorePractice(reviewId: string, feedback: string): Promise<void>;
  /** Nota de voz del docente para la familia de un estudiante. */
  saveFamilyVoiceNote(studentId: string, audioUri: string): Promise<void>;
}

/**
 * Espacio del acudiente. Regla 5: solo ve al estudiante (o estudiantes) que
 * tiene asociados; el backend debe verificarlo.
 */
export interface GuardianRepository {
  getWeeklyPractice(guardianId: string): Promise<WeeklyPractice>;
  /** «Lo practicamos hoy»: queda en el seguimiento. */
  markPracticedToday(guardianId: string, studentId: string): Promise<void>;
}

/** Conjunto de repositorios que se inyecta en la app. */
export interface Repositories {
  auth: AuthRepository;
  students: StudentRepository;
  practice: PracticeRepository;
  assignments: AssignmentRepository;
  progress: ProgressRepository;
  consent: ConsentRepository;
  recordings: RecordingRepository;
  results: ResultRepository;
  staff: StaffRepository;
  reviews: ReviewRepository;
  guardians: GuardianRepository;
}
