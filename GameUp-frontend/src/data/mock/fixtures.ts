import type {
  Assignment,
  OfficialProgress,
  ResumePoint,
  StudentProfile,
  VowelPractice,
} from '../types';

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
  { id: 'asg-demo-001', gameId: 'findMouth', status: 'assigned', isNew: true },
  {
    id: 'asg-demo-002',
    gameId: 'speak',
    vowel: 'o',
    status: 'assigned',
    isNew: false,
  },
];

/** Colores 80 %, Números 55 %, Letras 10 %, Cuentos 0 % (imagen de referencia). */
export const mockOfficialProgress: OfficialProgress = {
  modules: [
    { moduleId: 'colors', validated: 8, total: 10 },
    { moduleId: 'numbers', validated: 11, total: 20 },
    { moduleId: 'letters', validated: 1, total: 10 },
    { moduleId: 'stories', validated: 0, total: 6 },
  ],
  pendingValidation: 1,
};
