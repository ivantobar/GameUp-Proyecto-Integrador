import { InvalidCredentialsError } from '../authErrors';
import type { Repositories } from '../repositories';
import {
  LADDER_GAMES,
  LADDER_LEVELS,
  MAX_STARS,
  type Assignment,
  type GameId,
  type GameLevel,
  type GameResult,
  type LadderGameId,
  type LevelUp,
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
import { ladderContent } from './ladderContent';
import {
  createSeedReviews,
  MOCK_PASSWORD,
  mockAccounts,
  mockActivities,
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

/** Nombre de un juego sin actividad conocida (solo para la demo). */
function findGameTitle(gameId: GameId): string {
  const titles: Record<GameId, string> = {
    speak: 'Habla conmigo',
    findMouth: 'Busca la boca',
    match: 'Emparejar',
    classify: 'Clasificar',
    sequence: 'Secuenciar',
    memory: 'Memoria',
  };
  return titles[gameId];
}

/** `escalera-memory-2` → { gameId: 'memory', level: 2 } (actividad de la escalera). */
function parseLadderId(
  activityId: string | null | undefined,
): { gameId: LadderGameId; level: number } | null {
  const match = /^escalera-(\w+)-([1-5])$/.exec(activityId ?? '');
  const gameId = match?.[1] as LadderGameId | undefined;
  if (!match || !gameId || !LADDER_GAMES.includes(gameId)) return null;
  return { gameId, level: Number(match[2]) };
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

/** Lunes a domingo de la semana de hoy, como AAAA-MM-DD. */
function weekKeys(): string[] {
  const today = new Date(`${todayKey()}T12:00:00Z`);
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    return day.toISOString().slice(0, 10);
  });
}

/** Juego de una revisión (para la retroalimentación que ve la familia). */
function gameOfReview(review: ReviewItem): GameId {
  if (review.kind === 'speech') return 'speak';
  if (review.kind === 'listening') return 'findMouth';
  return review.game?.gameId ?? 'match';
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
    gameResults: [] as GameResult[],
    progress: clone<OfficialProgress>(mockOfficialProgress),
    reviews: createSeedReviews(),
    teacherNotes: {
      [mockStudent.id]: clone<TeacherNote>(mockTeacherNote),
    } as Record<string, TeacherNote>,
    practicedDays: new Set<string>(),
    /** Nivel de cada estudiante en cada juego (todos empiezan en el 1). */
    levels: {} as Record<
      string,
      Partial<Record<LadderGameId, { level: number; completed: boolean }>>
    >,
  };

  const levelOf = (studentId: string, gameId: LadderGameId) =>
    state.levels[studentId]?.[gameId] ?? { level: 1, completed: false };

  const levelsOf = (studentId: string): GameLevel[] =>
    LADDER_GAMES.map((gameId) => {
      const { level, completed } = levelOf(studentId, gameId);
      return {
        gameId,
        level,
        completed,
        pendingReview: state.reviews.filter(
          (r) =>
            r.student.id === studentId &&
            r.status === 'pending_validation' &&
            r.game?.gameId === gameId &&
            r.game.level === level,
        ).length,
      };
    });

  /** Como el backend: solo el nivel actual sube, uno por vez; en el 5 completa. */
  const levelUp = (
    studentId: string,
    gameId: LadderGameId,
    attemptLevel: number,
  ): LevelUp | null => {
    const actual = levelOf(studentId, gameId);
    if (actual.completed || attemptLevel !== actual.level) return null;
    const next =
      actual.level >= LADDER_LEVELS
        ? { level: LADDER_LEVELS, completed: true }
        : { level: actual.level + 1, completed: false };
    state.levels[studentId] = { ...state.levels[studentId], [gameId]: next };
    return {
      gameId,
      previousLevel: actual.level,
      level: next.level,
      completed: next.completed,
    };
  };

  const respond = <T>(value: T): Promise<T> =>
    new Promise((resolve) => {
      setTimeout(() => resolve(clone(value)), delayMs);
    });

  const rejectWith = (error: Error): Promise<never> =>
    new Promise((_resolve, reject) => {
      setTimeout(() => reject(error), delayMs);
    });

  const fail = (message: string): Promise<never> =>
    rejectWith(new Error(message));

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

  /**
   * Una tarea hecha pasa a «realizada»: ya no sale como pendiente, pero
   * espera la validación del docente. Con `activityId`, solo esa tarea; sin
   * él (juego libre), todas las de ese juego, como antes.
   */
  const markSubmitted = (
    gameId: Assignment['gameId'],
    activityId: string | null | undefined,
  ) => {
    state.assignments
      .filter((a) =>
        activityId
          ? a.activityId === activityId
          : a.gameId === gameId && a.status === 'assigned',
      )
      .forEach((a) => {
        a.status = 'submitted';
        a.isNew = false;
      });
  };

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
    auth: {
      signOut: () => respond(undefined),
      signIn: ({ email, password }) => {
        const session = mockAccounts[email.trim().toLowerCase()];
        if (!session || password !== MOCK_PASSWORD) {
          return rejectWith(new InvalidCredentialsError());
        }
        return respond(session);
      },
    },
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
    activities: {
      getActivity: (activityId) => {
        const ladder = parseLadderId(activityId);
        if (ladder) return respond(ladderContent(ladder.gameId, ladder.level));
        const activity = mockActivities[activityId];
        return activity ? respond(activity) : fail('Actividad no encontrada');
      },
    },
    progress: {
      getOfficialProgress: (studentId) =>
        respond({
          ...state.progress,
          pendingValidation: pendingFor(studentId),
        }),
    },
    levels: {
      getMyLevels: () => respond(levelsOf(mockStudent.id)),
      getCurrentLevelActivity: (gameId) => {
        const level = levelsOf(mockStudent.id).find((l) => l.gameId === gameId);
        if (!level) return fail('Ese juego no tiene escalera de niveles');
        return respond({ level, content: ladderContent(gameId, level.level) });
      },
      getStudentLevels: (studentId) => respond(levelsOf(studentId)),
    },
    consent: {
      hasVoiceRecordingConsent: () => respond(voiceConsent()),
    },
    recordings: {
      submitSpeechAttempt: ({ activityId, ...input }) => {
        const consent = voiceConsent();
        const attempt: SpeechAttempt = {
          id: `int-demo-${state.attempts.length + 1}`,
          ...input,
          // Regla: sin autorización no se guarda la voz, aunque llegue un archivo.
          audioUri: consent ? input.audioUri : null,
          status: 'pending_validation',
          createdAt: new Date().toISOString(),
          // En la demo todo llega a «Por escuchar», también el juego libre.
          sentForReview: true,
        };
        state.attempts.push(attempt);
        if (activityId) markSubmitted('speak', activityId);

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
      submitFindMouthResult: ({ activityId, ...input }) => {
        const result: ListeningResult = {
          id: `res-demo-${state.listeningResults.length + 1}`,
          ...input,
          gameId: 'findMouth',
          status: 'pending_validation',
          createdAt: new Date().toISOString(),
          sentForReview: true,
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
        markSubmitted('findMouth', activityId);
        return respond(result);
      },
      submitGameResult: ({ activityId, studentId, gameId, score }) => {
        // Como antes de conectar estos juegos: el juego libre no se envía.
        // Desde una tarea, queda guardado y la tarea pasa a «realizada».
        const result: GameResult = {
          id: `jue-demo-${state.gameResults.length + 1}`,
          studentId,
          gameId,
          status: activityId ? 'pending_validation' : 'submitted',
          createdAt: new Date().toISOString(),
          sentForReview: Boolean(activityId),
        };
        const ladder = parseLadderId(activityId);
        if (ladder && ladder.level !== levelOf(studentId, gameId).level) {
          // Como el backend: solo se acepta el nivel actual.
          return fail('Esa actividad no es de tu nivel actual');
        }
        if (activityId) {
          state.gameResults.push(result);
          if (!ladder) markSubmitted(gameId, activityId);
          // Llega a «Por escuchar» del docente.
          state.reviews.unshift({
            id: result.id,
            kind: 'game',
            student: summaryOf(studentId),
            submittedAt: result.createdAt,
            status: 'pending_validation',
            game: {
              gameId,
              title: ladder
                ? `${findGameTitle(gameId)} · nivel ${ladder.level}`
                : (mockActivities[activityId]?.title ?? findGameTitle(gameId)),
              score,
              level: ladder?.level ?? null,
            },
          });
        }
        return respond(result);
      },
    },
    staff: {
      getCurrentTeacher: () => respond(mockTeacher),
      getCurrentGuardian: () => respond(mockGuardian),
    },
    reviews: {
      // En la demo la indicación siempre llega a la familia, y se puede
      // grabar una nota de voz.
      features: { familyVoiceNote: true, feedbackAlwaysReachesFamily: true },
      getRecordingUrl: (reviewId) => {
        const audio = state.reviews.find((r) => r.id === reviewId)?.speech
          ?.audioUri;
        return audio ? respond(audio) : fail('Este intento no tiene audio');
      },
      shareNoteWithFamily: (studentId, text) => {
        const note = state.teacherNotes[studentId];
        state.teacherNotes[studentId] = {
          text: text.trim(),
          audioUri: note?.audioUri ?? null,
        };
        return respond(undefined);
      },
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
        const level = review.game?.level;
        if (review.game && typeof level === 'number') {
          return respond(levelUp(review.student.id, review.game.gameId, level));
        }
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
        return respond(null);
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
      listStudents: (guardianId) => {
        const studentId = mockGuardianStudents[guardianId];
        return respond(studentId ? [summaryOf(studentId)] : []);
      },
      getWeeklyPractice: (guardianId, requested) => {
        const studentId = mockGuardianStudents[guardianId];
        if (!studentId)
          return fail('Este acudiente no tiene estudiantes asociados');
        if (requested && requested !== studentId) {
          return fail('Solo puedes ver a tu estudiante asociado');
        }
        const speakTask = state.assignments.find(
          (a) => a.gameId === 'speak' && a.vowel,
        );
        return respond({
          student: summaryOf(studentId),
          vowel: speakTask?.vowel ?? state.resumePoint.vowel,
          teacherNote: state.teacherNotes[studentId] ?? null,
          practicedToday: state.practicedDays.has(`${studentId}:${todayKey()}`),
          days: weekKeys().map((date) => ({
            date,
            practiced: state.practicedDays.has(`${studentId}:${date}`),
          })),
          feedback: state.reviews
            .filter(
              (r) =>
                r.student.id === studentId &&
                r.status === 'rejected' &&
                r.feedback,
            )
            .map((r) => ({
              activityId: r.id,
              title: findGameTitle(gameOfReview(r)),
              gameId: gameOfReview(r),
              status: 'rejected' as const,
              text: r.feedback ?? '',
            })),
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
