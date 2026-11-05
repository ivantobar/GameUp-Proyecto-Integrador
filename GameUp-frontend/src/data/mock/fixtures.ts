import {
  VOWELS,
  type ActivityContent,
  type Assignment,
  type AuthSession,
  type OfficialProgress,
  type ResumePoint,
  type ReviewItem,
  type StaffProfile,
  type StudentProfile,
  type StudentSummary,
  type TeacherNote,
  type VowelPractice,
} from '../types';
import {
  classifySets,
  matchRounds,
  memoryBoards,
  sequenceRoutines,
} from './gameContent';

/**
 * Datos ficticios para desarrollo. Ningún dato corresponde a un niño real.
 * Reproducen el estado que muestran los mockups.
 */
export const mockStudent: StudentProfile = {
  id: 'est-demo-001',
  displayName: 'Martín',
};

/** A, E e I practicadas; O en curso; U sin practicar («Llevas 3 de 5»). */
export const mockVowelPractice: VowelPractice[] = [
  { vowel: 'a', stars: 3 },
  { vowel: 'e', stars: 3 },
  { vowel: 'i', stars: 3 },
  { vowel: 'o', stars: 1 },
  { vowel: 'u', stars: 0 },
];

export const mockResumePoint: ResumePoint = { gameId: 'speak', vowel: 'o' };

/** «Hoy tienes 2 juegos»: una tarea nueva y una en curso. */
export const mockAssignments: Assignment[] = [
  {
    id: 'asg-demo-001',
    activityId: 'act-demo-001',
    gameId: 'findMouth',
    status: 'assigned',
    isNew: true,
  },
  {
    id: 'asg-demo-002',
    activityId: 'act-demo-002',
    gameId: 'speak',
    vowel: 'o',
    status: 'assigned',
    isNew: false,
  },
];

/** Contenido de las actividades de esas tareas. */
export const mockActivities: Record<string, ActivityContent> = {
  'act-demo-001': {
    activityId: 'act-demo-001',
    gameId: 'findMouth',
    title: 'Busca la boca',
    vowels: [...VOWELS],
  },
  'act-demo-002': {
    activityId: 'act-demo-002',
    gameId: 'speak',
    title: 'Di la o',
    vowel: 'o',
  },
  // Sin tarea asignada: sirven para abrir estos juegos con `actividadId`.
  'act-demo-003': {
    activityId: 'act-demo-003',
    gameId: 'match',
    title: 'Emparejar',
    rounds: matchRounds,
  },
  'act-demo-004': {
    activityId: 'act-demo-004',
    gameId: 'classify',
    title: 'Clasificar',
    sets: classifySets,
  },
  'act-demo-005': {
    activityId: 'act-demo-005',
    gameId: 'sequence',
    title: 'Secuenciar',
    routines: sequenceRoutines,
  },
  'act-demo-006': {
    activityId: 'act-demo-006',
    gameId: 'memory',
    title: 'Memoria',
    boards: memoryBoards,
  },
};

/** Colores 80 %, Números 55 %, Letras 10 %, Cuentos 0 % (imagen de referencia). */
export const mockOfficialProgress: OfficialProgress = {
  modules: [
    { moduleId: 'colors', title: 'Colores', validated: 8, total: 10 },
    { moduleId: 'numbers', title: 'Números', validated: 11, total: 20 },
    { moduleId: 'letters', title: 'Letras', validated: 1, total: 10 },
    { moduleId: 'stories', title: 'Cuentos', validated: 0, total: 6 },
  ],
  pendingValidation: 1,
};

/** Personas adultas ficticias. */
export const mockTeacher: StaffProfile = {
  id: 'doc-demo-001',
  displayName: 'Profe Laura',
};

export const mockGuardian: StaffProfile = {
  id: 'acu-demo-001',
  displayName: 'Acudiente de Martín',
};

/** Estudiantes asignados a la docente (nombres del mockup, ficticios). */
export const mockStudentSummaries: Record<string, StudentSummary> = {
  [mockStudent.id]: {
    id: mockStudent.id,
    displayName: 'Martín C.',
    initials: 'MC',
  },
  'est-demo-002': {
    id: 'est-demo-002',
    displayName: 'Valentina G.',
    initials: 'VG',
  },
  'est-demo-003': {
    id: 'est-demo-003',
    displayName: 'Samuel O.',
    initials: 'SO',
  },
};

/** Docente → estudiantes asignados. */
export const mockTeacherStudents: Record<string, string[]> = {
  [mockTeacher.id]: Object.keys(mockStudentSummaries),
};

/** Acudiente → estudiante asociado (solo Martín). */
export const mockGuardianStudents: Record<string, string> = {
  [mockGuardian.id]: mockStudent.id,
};

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/**
 * «Por escuchar» del mockup. Son datos de ejemplo SIN audio real: para oír
 * una grabación, juega «Habla conmigo» como estudiante y aparecerá arriba.
 */
export function createSeedReviews(): ReviewItem[] {
  const [martin, valentina, samuel] = [
    mockStudentSummaries[mockStudent.id],
    mockStudentSummaries['est-demo-002'],
    mockStudentSummaries['est-demo-003'],
  ] as StudentSummary[];
  return [
    {
      id: 'rev-demo-001',
      kind: 'speech',
      student: martin,
      submittedAt: hoursAgo(2),
      status: 'pending_validation',
      speech: {
        vowel: 'o',
        audioUri: null,
        voiceConsent: true,
        attemptNumber: 2,
        attemptsTotal: 2,
      },
    },
    {
      id: 'rev-demo-002',
      kind: 'speech',
      student: valentina,
      submittedAt: hoursAgo(26),
      status: 'pending_validation',
      speech: {
        vowel: 'a',
        audioUri: null,
        voiceConsent: true,
        attemptNumber: 1,
        attemptsTotal: 1,
      },
    },
    {
      id: 'rev-demo-003',
      kind: 'listening',
      student: samuel,
      submittedAt: hoursAgo(28),
      status: 'pending_validation',
      listening: { firstTryCorrect: 4, total: 5 },
    },
  ];
}

/** Nota de la profe del mockup del acudiente. */
export const mockTeacherNote: TeacherNote = {
  text: 'Martín ya redondea los labios. Esta semana jueguen con palabras: oso, ojo, ola.',
  audioUri: null,
};

/**
 * Cuentas de prueba del inicio de sesión simulado. Son ficticias y solo
 * existen en memoria: las cuentas reales las creará y validará el backend.
 */
export const MOCK_PASSWORD = 'gameup123';

export const mockAccounts: Record<string, AuthSession> = {
  'estudiante@gameup.test': {
    userId: mockStudent.id,
    role: 'student',
    displayName: mockStudent.displayName,
  },
  'docente@gameup.test': {
    userId: mockTeacher.id,
    role: 'teacher',
    displayName: mockTeacher.displayName,
  },
  'acudiente@gameup.test': {
    userId: mockGuardian.id,
    role: 'guardian',
    displayName: mockGuardian.displayName,
  },
  'directora@gameup.test': {
    userId: 'dir-demo-001',
    role: 'director',
    displayName: 'Directora',
  },
};
