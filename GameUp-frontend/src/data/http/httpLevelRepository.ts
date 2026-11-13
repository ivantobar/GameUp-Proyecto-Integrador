import type { ApiClient } from '@/services/api';
import {
  ForbiddenError,
  NotFoundError,
  ServerError,
} from '@/services/apiErrors';
import { LevelChangeError, StudentAccessError } from '../studentErrors';
import type { GameLevelRepository } from '../repositories';
import type { ActividadDelNivelDto, NivelJuegoDto } from './dto/niveles';
import { imageUrlsFor } from './httpStudentFlowRepositories';
import { toActivityContent } from './mappers/activityMapper';
import { CODIGO_DE_JUEGO, toGameLevel } from './mappers/levelMapper';
import { requireList } from './mappers/responseShape';

/** Errores de PUT /estudiantes/:id/niveles-juego/:juego, en palabras del dominio. */
function levelChangeError(error: unknown): unknown {
  if (error instanceof ForbiddenError) {
    return new LevelChangeError('notAllowed', error.message);
  }
  if (error instanceof NotFoundError) return new StudentAccessError();
  if (error instanceof ServerError && error.status === 409) {
    return new LevelChangeError('changed', error.message);
  }
  if (
    error instanceof ServerError &&
    (error.status === 400 || error.status === 422)
  ) {
    return new LevelChangeError('invalid', error.message);
  }
  return error;
}

const toLevels = (dtos: unknown) =>
  requireList(dtos, 'niveles').map((item) =>
    toGameLevel(item as NivelJuegoDto),
  );

/**
 * Escalera de niveles con la API. El nivel lo sube el backend al aprobar;
 * aquí se lee y se ajusta a mano (PUT, con motivo). El módulo de la escalera no está publicado ni asignado:
 * el backend igual deja ver su actividad y sus imágenes.
 */
export function createHttpLevelRepository(api: ApiClient): GameLevelRepository {
  return {
    getMyLevels: async () =>
      toLevels(await api.get<NivelJuegoDto[]>('/estudiantes/me/niveles-juego')),

    async getCurrentLevelActivity(gameId) {
      const dto = await api.get<ActividadDelNivelDto>(
        `/estudiantes/me/niveles-juego/${CODIGO_DE_JUEGO[gameId]}/actividad`,
      );
      const content = toActivityContent(
        dto.actividad,
        await imageUrlsFor(api, dto.actividad),
      );
      if (content.gameId !== gameId) {
        throw new Error('La actividad del nivel no es de este juego');
      }
      return { level: toGameLevel(dto.nivel), content };
    },

    getStudentLevels: async (studentId) =>
      toLevels(
        await api.get<NivelJuegoDto[]>(
          `/estudiantes/${encodeURIComponent(studentId)}/niveles-juego`,
        ),
      ),

    async setStudentLevel({ studentId, gameId, level, reason }) {
      try {
        return toGameLevel(
          await api.put<NivelJuegoDto>(
            `/estudiantes/${encodeURIComponent(studentId)}/niveles-juego/${CODIGO_DE_JUEGO[gameId]}`,
            { nivel: level, motivo: reason.trim() },
          ),
        );
      } catch (error: unknown) {
        throw levelChangeError(error);
      }
    },
  };
}
