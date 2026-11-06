import {
  isVowel,
  type ActivityFeedback,
  type StudentSummary,
  type Vowel,
  type WeeklyPractice,
} from '../../types';
import type {
  ActividadEstudianteDto,
  EstudianteResumenDto,
  ObservacionDto,
  PracticaSemanalDto,
} from '../dto/acudiente';
import { toGameId } from './gameCodes';
import { requireList, requireText } from './responseShape';

export function toStudentSummary(dto: EstudianteResumenDto): StudentSummary {
  return {
    id: requireText(dto.id, 'estudiante.id'),
    displayName: requireText(dto.displayName, 'estudiante.displayName'),
    initials: dto.initials ?? '',
  };
}

/**
 * Sonido de la semana: la vocal de la actividad de Habla conmigo que el
 * estudiante tiene pendiente (sin hacer, o que la profe pidió repetir).
 * `null` si no hay ninguna.
 */
export function weekVowel(actividades: ActividadEstudianteDto[]): Vowel | null {
  const pending = actividades.find(
    (a) =>
      a.tipoJuego === 'HABLA_CONMIGO' &&
      (a.estado === 'SIN_INTENTOS' || a.estado === 'RECHAZADA') &&
      typeof a.vocal === 'string' &&
      isVowel(a.vocal),
  );
  return pending?.vocal && isVowel(pending.vocal) ? pending.vocal : null;
}

/**
 * Lo que dijo la profe al revisar (decisión D5): la retroalimentación de las
 * actividades aprobadas (si dejó una) y de las que pidió repetir. Vienen de
 * la más reciente a la más antigua.
 */
export function activityFeedback(
  actividades: ActividadEstudianteDto[],
): ActivityFeedback[] {
  return actividades.flatMap((a): ActivityFeedback[] => {
    const text = a.retroalimentacion?.trim();
    if (!text || (a.estado !== 'APROBADA' && a.estado !== 'RECHAZADA')) {
      return [];
    }
    return [
      {
        activityId: a.actividadId,
        title: a.titulo,
        gameId: toGameId(a.tipoJuego),
        status: a.estado === 'APROBADA' ? 'validated' : 'rejected',
        text,
      },
    ];
  });
}

/**
 * «Practicar en casa» armado con tres rutas que ya existen (decisión 5 de
 * la fase 8): la semana, la última nota visible de la profe y las
 * actividades del estudiante.
 */
export function toWeeklyPractice(
  semana: PracticaSemanalDto,
  observaciones: ObservacionDto[],
  actividades: ActividadEstudianteDto[],
): WeeklyPractice {
  const note = observaciones[0];
  const list = requireList(
    actividades,
    'actividades',
  ) as ActividadEstudianteDto[];
  return {
    student: toStudentSummary(semana.estudiante),
    vowel: weekVowel(list),
    // La nota de voz para la familia está pospuesta (D4): solo texto.
    teacherNote: note ? { text: note.texto, audioUri: null } : null,
    practicedToday: semana.practicadoHoy === true,
    days: requireList(semana.dias, 'dias').map((d) => {
      const day = d as PracticaSemanalDto['dias'][number];
      return {
        date: requireText(day.fecha, 'dias.fecha'),
        practiced: day.practicado === true,
      };
    }),
    feedback: activityFeedback(list),
  };
}
