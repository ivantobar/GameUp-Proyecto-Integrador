import type {
  Assignment,
  NewSpeechAttempt,
  OfficialProgress,
  ResumePoint,
  SpeechAttempt,
  StarCount,
  StudentProfile,
  Vowel,
  VowelPractice,
} from './types';

/**
 * Contratos de acceso a datos (inversión de dependencias): las pantallas y
 * los hooks dependen de estas interfaces, no de `fetch` ni de los mocks.
 * Hoy se inyecta la versión simulada (`mock/`); mañana, la de la API NestJS.
 *
 * Son interfaces pequeñas y separadas (segregación de interfaces): cada
 * pantalla usa solo las que necesita.
 */

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
  /** Tareas que el docente asignó al estudiante y aún no están validadas. */
  listPendingForStudent(studentId: string): Promise<Assignment[]>;
}

export interface ProgressRepository {
  /** Progreso oficial por módulo: solo actividades validadas. */
  getOfficialProgress(studentId: string): Promise<OfficialProgress>;
}

/** Conjunto de repositorios que se inyecta en la app. */
export interface Repositories {
  students: StudentRepository;
  practice: PracticeRepository;
  assignments: AssignmentRepository;
  progress: ProgressRepository;
  consent: ConsentRepository;
  recordings: RecordingRepository;
}
