import type { Repositories } from '../repositories';
import {
  MAX_STARS,
  type Assignment,
  type ListeningResult,
  type OfficialProgress,
  type ReviewItem,
  type SpeechAttempt,
  type StarCount,
  type StudentSummary,
  type TeacherNote,
  type VowelPractice,
} from '../types';
import { devSettings } from './devSettings';
import {
  createSeedReviews,
  mockAssignments,
  mockGuardian,
  mockGuardianStudents,
  mockOfficialProgress,
  mockResumePoint,
  mockStudent,
  mockStudentSummaries,
  mockTeacher,
  mockTeacherNote,
  mockTeacherStudents,
  mockVowelPractice,
} from './fixtures';

interface MockOptions {
  /**
   * Espera simulada de cada respuesta, para ver los estados de carga.
   * En las pruebas se usa 0.
   */
  delayMs?: number;
  /** Consentimiento de voz. Por defecto, el ajuste de «Modo desarrollo». */
  voiceConsent?: () => boolean;
}

/** Copia profunda simple: los datos simulados son JSON plano. */
function clone<T>(value: T): T {
  // `undefined` (respuestas sin datos) no es JSON válido: se devuelve tal cual.
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * MAPEO PROVISIONAL para la demo: lo validado en los juegos de habla suma al
 * tema «Letras». Cómo se relacionan juegos y temas está pendiente de decidir
 * con el equipo (lo calculará el backend).
 */
const SPEECH_MODULE = 'letters';

/**
 * Repositorios simulados en memoria. Guardan cambios mientras la app está
 * abierta, para que las pantallas se vean conectadas (lo que hace el
 * estudiante aparece en «Por escuchar»; lo que valida el docente sube el
 * progreso; su nota llega al acudiente). Al cerrar la app, todo vuelve a los
 * datos iniciales. Devuelven copias, para que una pantalla no pueda
 * modificar los datos de otra por accidente.
 */
export function createMockRepositories({
  delayMs = 300,
  voiceConsent = () => devSettings.get().voiceConsent,
}: MockOptions = {}): Repositories {
  const state = {
    vowelPractice: clone<VowelPractice[]>(mockVowelPractice),
    resumePoint: clone(mockResumePoint),
    attempts: [] as SpeechAttempt[],
    assignments: clone<Assignment[]>(mockAssignments),
    listeningResults: [] as ListeningResult[],
    progress: clone<OfficialProgress>(mockOfficialProgress),
    reviews: createSeedReviews(),
    teacherNotes: {
      [mockStudent.id]: clone<TeacherNote>(mockTeacherNote),
    } as Record<string, TeacherNote>,
    practicedDays: new Set<string>(),
  };

  const respond = <T>(value: T): Promise<T> =>
    new Promise((resolve) => {
      setTimeout(() => resolve(clone(value)), delayMs);
    });

  const fail = (message: string): Promise<never> =>
    new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error(message)), delayMs);
    });

  const summaryOf = (studentId: string): StudentSummary =>
    mockStudentSummaries[studentId] ?? {
      id: studentId,
      displayName: 'Estudiante',
      initials: 'ES',
    };

  const pendingFor = (studentId: string) =>
    state.reviews.filter(
      (r) => r.student.id === studentId && r.status === 'pending_validation',
    ).length;

  /** Cambia el estado de la revisión y del intento original. */
  const setReviewStatus = (
    reviewId: string,
    status: 'validated' | 'rejected',
  ): ReviewItem | undefined => {
    const review = state.reviews.find((r) => r.id === reviewId);
    if (!review) return undefined;
    review.status = status;
    const attempt = state.attempts.find((a) => a.id === reviewId);
    if (attempt) attempt.status = status;
    const result = state.listeningResults.find((r) => r.id === reviewId);
    if (result) result.status = status;
    return review;
  };

  return {
    students: {
      getCurrentStudent: () => respond(mockStudent),
    },
    practice: {
      getVowelPractice: () => respond(state.vowelPractice),
      getResumePoint: () => respond(state.resumePoint),
      recordPracticeCycle: (_studentId, vowel) => {
        const item = state.vowelPractice.find((v) => v.vowel === vowel);
        const next = Math.min((item?.stars ?? 0) + 1, MAX_STARS) as StarCount;
        if (item) item.stars = next;
        else state.vowelPractice.push({ vowel, stars: next });
        state.resumePoint = { gameId: 'speak', vowel };
        return respond(next);
      },
    },
    assignments: {
      listPendingForStudent: () =>
        respond(state.assignments.filter((a) => a.status === 'assigned')),
    },
    progress: {
      getOfficialProgress: (studentId) =>
        respond({
          ...state.progress,
          pendingValidation: pendingFor(studentId),
        }),
    },
    consent: {
      hasVoiceRecordingConsent: () => respond(voiceConsent()),
    },
    recordings: {
      submitSpeechAttempt: (input) => {
        const consent = voiceConsent();
        const attempt: SpeechAttempt = {
          id: `int-demo-${state.attempts.length + 1}`,
          ...input,
          // Regla: sin autorización no se guarda la voz, aunque llegue un archivo.
          audioUri: consent ? input.audioUri : null,
          status: 'pending_validation',
          createdAt: new Date().toISOString(),
        };
        state.attempts.push(attempt);

        // Aparece en «Por escuchar» del docente: «intento n de n».
        const sameSound = state.reviews.filter(
          (r) =>
            r.student.id === input.studentId &&
            r.speech?.vowel === input.vowel &&
            r.status === 'pending_validation',
        );
        const total = sameSound.length + 1;
        sameSound.forEach((r) => {
          if (r.speech) r.speech.attemptsTotal = total;
        });
        state.reviews.unshift({
          id: attempt.id,
          kind: 'speech',
          student: summaryOf(input.studentId),
          submittedAt: attempt.createdAt,
          status: 'pending_validation',
          speech: {
            vowel: input.vowel,
            audioUri: attempt.audioUri,
            voiceConsent: consent,
            attemptNumber: total,
            attemptsTotal: total,
          },
        });
        return respond(attempt);
      },
    },
    results: {
      submitFindMouthResult: (input) => {
        const result: ListeningResult = {
          id: `res-demo-${state.listeningResults.length + 1}`,
          ...input,
          gameId: 'findMouth',
          status: 'pending_validation',
          createdAt: new Date().toISOString(),
        };
        state.listeningResults.push(result);
        state.reviews.unshift({
          id: result.id,
          kind: 'listening',
          student: summaryOf(input.studentId),
          submittedAt: result.createdAt,
          status: 'pending_validation',
          listening: {
            firstTryCorrect: input.firstTryCorrect,
            total: input.total,
          },
        });
        // La tarea de Busca la boca pasa a «realizada»: ya no sale como
        // pendiente en Inicio, pero espera la validación del docente.
        state.assignments
          .filter((a) => a.gameId === 'findMouth' && a.status === 'assigned')
          .forEach((a) => {
            a.status = 'submitted';
            a.isNew = false;
          });
        return respond(result);
      },
    },
    staff: {
      getCurrentTeacher: () => respond(mockTeacher),
      getCurrentGuardian: () => respond(mockGuardian),
    },
    reviews: {
      listPendingReviews: (teacherId) => {
        const mine = mockTeacherStudents[teacherId] ?? [];
        return respond(
          state.reviews.filter(
            (r) =>
              r.status === 'pending_validation' && mine.includes(r.student.id),
          ),
        );
      },
      validate: (reviewId) => {
        const review = setReviewStatus(reviewId, 'validated');
        if (!review) return fail('Actividad no encontrada');
        // Privacidad: cumplida la validación, la grabación ya no se guarda.
        if (review.speech) review.speech.audioUri = null;
        // Solo lo validado suma al progreso oficial (regla de negocio 2).
        if (review.student.id === mockStudent.id) {
          const module = state.progress.modules.find(
            (m) => m.moduleId === SPEECH_MODULE,
          );
          if (module) {
            module.validated = Math.min(module.validated + 1, module.total);
          }
        }
        return respond(undefined);
      },
      requestMorePractice: (reviewId, feedback) => {
        if (feedback.trim().length === 0) {
          return fail('La retroalimentación es obligatoria');
        }
        const review = setReviewStatus(reviewId, 'rejected');
        if (!review) return fail('Actividad no encontrada');
        review.feedback = feedback.trim();
        // La retroalimentación también llega a la familia.
        const note = state.teacherNotes[review.student.id];
        state.teacherNotes[review.student.id] = {
          text: feedback.trim(),
          audioUri: note?.audioUri ?? null,
        };
        return respond(undefined);
      },
      saveFamilyVoiceNote: (studentId, audioUri) => {
        const note = state.teacherNotes[studentId];
        state.teacherNotes[studentId] = {
          text: note?.text ?? '',
          audioUri,
        };
        return respond(undefined);
      },
    },
    guardians: {
      getWeeklyPractice: (guardianId) => {
        const studentId = mockGuardianStudents[guardianId];
        if (!studentId)
          return fail('Este acudiente no tiene estudiantes asociados');
        const speakTask = state.assignments.find(
          (a) => a.gameId === 'speak' && a.vowel,
        );
        return respond({
          student: summaryOf(studentId),
          vowel: speakTask?.vowel ?? state.resumePoint.vowel,
          teacherNote: state.teacherNotes[studentId] ?? null,
          practicedToday: state.practicedDays.has(`${studentId}:${todayKey()}`),
        });
      },
      markPracticedToday: (guardianId, studentId) => {
        if (mockGuardianStudents[guardianId] !== studentId) {
          return fail('Solo puedes registrar a tu estudiante asociado');
        }
        state.practicedDays.add(`${studentId}:${todayKey()}`);
        return respond(undefined);
      },
    },
  };
}
