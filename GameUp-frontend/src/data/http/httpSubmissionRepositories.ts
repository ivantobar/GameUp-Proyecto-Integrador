import type { ApiClient } from '@/services/api';
import type { RecordingRepository, ResultRepository } from '../repositories';
import type {
  IntentoDto,
  IntentoVozDto,
  RegistrarIntentoDto,
} from './dto/intentos';
import {
  freePlayGameResult,
  freePlayListeningResult,
  freePlaySpeechAttempt,
} from './freePlay';
import {
  toGameResult,
  toListeningResult,
  toResultado,
  toSpeechAttempt,
} from './mappers/attemptMapper';
import { withSilentRetry } from './silentRetry';

/** Nombre y tipo con que se sube la voz (la grabadora de la app hace .m4a). */
const VOICE_FILE = { name: 'voz.m4a', type: 'audio/mp4' } as const;

/**
 * Envío de intentos al terminar un juego. Solo se envían los juegos abiertos
 * desde una actividad (`activityId`); el juego libre se practica sin enviar
 * (decisión D1). Si el envío falla, se reintenta en silencio (Regla 11).
 */
export function createHttpRecordingRepository(
  api: ApiClient,
): RecordingRepository {
  return {
    async submitSpeechAttempt(input) {
      if (!input.activityId) return freePlaySpeechAttempt(input);
      const { activityId } = input;

      const send = () => {
        // Un FormData nuevo en cada intento: no se reutiliza un cuerpo enviado.
        const form = new FormData();
        form.append('actividadId', activityId);
        if (input.audioUri) {
          // React Native sube un archivo local con { uri, name, type }.
          form.append('audio', {
            uri: input.audioUri,
            ...VOICE_FILE,
          } as unknown as Blob);
        }
        return api.postForm<IntentoVozDto>('/intentos/habla-conmigo', form);
      };

      return toSpeechAttempt(await withSilentRetry(send), input);
    },
  };
}

export function createHttpResultRepository(api: ApiClient): ResultRepository {
  return {
    async submitFindMouthResult(input) {
      if (!input.activityId) return freePlayListeningResult(input);

      // Solo lo que pide el backend: sin tiempos, vidas ni penalizaciones.
      const body: RegistrarIntentoDto = {
        actividadId: input.activityId,
        resultado: {
          firstTryCorrect: input.firstTryCorrect,
          total: input.total,
        },
      };
      const dto = await withSilentRetry(() =>
        api.post<IntentoDto>('/intentos', body),
      );
      return toListeningResult(dto, input);
    },
    async submitGameResult(input) {
      if (!input.activityId) return freePlayGameResult(input);
      const body: RegistrarIntentoDto = {
        actividadId: input.activityId,
        resultado: toResultado(input.score),
      };
      const dto = await withSilentRetry(() =>
        api.post<IntentoDto>('/intentos', body),
      );
      return toGameResult(dto, input);
    },
  };
}
