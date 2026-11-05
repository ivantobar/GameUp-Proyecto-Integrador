import type { ApiClient } from '@/services/api';
import { ServerError } from '@/services/apiErrors';
import type { ReviewRepository } from '../repositories';
import { ListenFirstError } from '../reviewErrors';
import type {
  CrearObservacionDto,
  PaginaRevisionDto,
  UrlFirmadaDto,
  ValidarIntentoDto,
} from './dto/revisiones';
import { requireList, requireText } from './mappers/responseShape';
import { toReviewItem } from './mappers/reviewMapper';

/** La bandeja trae hasta 50 intentos (el máximo de la paginación del backend). */
const PAGE_LIMIT = 50;

/** Esta función todavía no existe en el backend (decisión D4). */
export class NotAvailableError extends Error {
  constructor(what: string) {
    super(`Todavía no está disponible: ${what}`);
    this.name = 'NotAvailableError';
  }
}

const path = (intentoId: string) =>
  `/intentos/${encodeURIComponent(intentoId)}`;

/**
 * Revisión de la tallerista con la API. El backend decide qué intentos ve
 * (solo los de SUS estudiantes): el `teacherId` no se envía.
 */
export function createHttpReviewRepository(api: ApiClient): ReviewRepository {
  const decide = async (intentoId: string, body: ValidarIntentoDto) => {
    try {
      await api.post(`${path(intentoId)}/validacion`, body);
    } catch (error: unknown) {
      // 422: hay audio y quien valida aún no lo pidió (hay que escucharlo).
      if (
        error instanceof ServerError &&
        error.status === 422 &&
        /escucha/i.test(error.message)
      ) {
        throw new ListenFirstError();
      }
      throw error;
    }
  };

  return {
    // La nota de voz para la familia está pospuesta en el backend (D4), y
    // la indicación de «Practicar más» no se vuelve nota por sí sola.
    features: { familyVoiceNote: false, feedbackAlwaysReachesFamily: false },

    async listPendingReviews() {
      const page = await api.get<PaginaRevisionDto>(
        `/revisiones/pendientes?limit=${PAGE_LIMIT}`,
      );
      return requireList(page.items, 'items').map((item) =>
        toReviewItem(item as PaginaRevisionDto['items'][number]),
      );
    },

    async getRecordingUrl(reviewId) {
      const dto = await api.get<UrlFirmadaDto>(`${path(reviewId)}/grabacion`);
      return requireText(dto.url, 'url');
    },

    validate: (reviewId) => decide(reviewId, { resultado: 'APROBADO' }),

    async requestMorePractice(reviewId, feedback) {
      const text = feedback.trim();
      // Igual que la versión simulada: sin indicación no se envía.
      if (text.length === 0) {
        throw new Error('La retroalimentación es obligatoria');
      }
      await decide(reviewId, {
        resultado: 'RECHAZADO',
        retroalimentacion: text,
      });
    },

    async shareNoteWithFamily(studentId, text) {
      const body: CrearObservacionDto = {
        texto: text.trim(),
        visibleAcudiente: true,
      };
      await api.post(
        `/estudiantes/${encodeURIComponent(studentId)}/observaciones`,
        body,
      );
    },

    saveFamilyVoiceNote: () =>
      Promise.reject(new NotAvailableError('nota de voz para la familia')),
  };
}
