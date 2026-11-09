import type { ApiClient } from '@/services/api';
import type {
  ActivityRepository,
  AssignmentRepository,
  ConsentRepository,
  PracticeRepository,
  ProgressRepository,
} from '../repositories';
import type { ActividadDetalleDto, ContenidoUrlDto } from './dto/actividades';
import type {
  ActividadPendienteDto,
  ProgresoOficialDto,
} from './dto/asignaciones';
import type { VoiceConsentStatus } from '../types';
import type { ConsentimientoVozDto } from './dto/estudiantes';
import type { PracticaVocalDto, PuntoRetornoDto } from './dto/intentos';
import {
  imageIdsOf,
  toActivityContent,
  type ImageUrls,
} from './mappers/activityMapper';
import { toAssignment } from './mappers/assignmentMapper';
import { toResumePoint, toVowelPractice } from './mappers/practiceMapper';
import { toOfficialProgress } from './mappers/progressMapper';
import { requireList } from './mappers/responseShape';

/*
 * Lecturas del flujo del estudiante. Todas usan rutas `/me`: el backend sabe
 * quién es por el token, así que el `studentId` de las interfaces no se
 * envía (y no da acceso a otro estudiante: eso lo verifica el backend).
 */

export function createHttpPracticeRepository(
  api: ApiClient,
): PracticeRepository {
  const vowelPractice = async () =>
    toVowelPractice(
      await api.get<PracticaVocalDto[]>('/estudiantes/me/practica-vocales'),
    );

  return {
    getVowelPractice: vowelPractice,
    getResumePoint: async () =>
      toResumePoint(
        await api.get<PuntoRetornoDto>('/estudiantes/me/punto-retorno'),
      ),
    // La estrella la suma el backend al registrar el intento de una
    // actividad; aquí solo se lee cuántas tiene ahora la vocal.
    recordPracticeCycle: async (_studentId, vowel) => {
      const practice = await vowelPractice();
      return practice.find((item) => item.vowel === vowel)?.stars ?? 0;
    },
  };
}

export function createHttpAssignmentRepository(
  api: ApiClient,
): AssignmentRepository {
  return {
    listPendingForStudent: async () =>
      requireList(
        await api.get<ActividadPendienteDto[]>(
          '/estudiantes/me/actividades-pendientes',
        ),
        'actividades-pendientes',
      ).map((item) => toAssignment(item as ActividadPendienteDto)),
  };
}

export function createHttpActivityRepository(
  api: ApiClient,
): ActivityRepository {
  return {
    getActivity: async (activityId) => {
      const dto = await api.get<ActividadDetalleDto>(
        `/actividades/${encodeURIComponent(activityId)}`,
      );
      return toActivityContent(dto, await imageUrlsFor(api, dto));
    },
  };
}

/**
 * URLs firmadas de las imágenes de la actividad, en una sola llamada por
 * módulo. Solo si la actividad usa imágenes. Si no se pueden traer, el
 * juego sigue: las tarjetas muestran su texto o su etiqueta.
 */
export async function imageUrlsFor(
  api: ApiClient,
  dto: ActividadDetalleDto,
): Promise<ImageUrls> {
  const ids = new Set(imageIdsOf(dto.configuracion));
  if (ids.size === 0) return new Map();
  try {
    const urls = await api.get<ContenidoUrlDto[]>(
      `/modulos/${encodeURIComponent(dto.moduloId)}/contenidos/urls`,
    );
    return new Map(
      requireList(urls, 'contenidos/urls')
        .map((item) => item as ContenidoUrlDto)
        .filter((c) => ids.has(c.contenidoId) && typeof c.url === 'string')
        .map((c) => [c.contenidoId, c.url]),
    );
  } catch (error) {
    console.warn(
      '[GameUP] No se pudieron cargar las imágenes de la actividad',
      error instanceof Error ? error.name : 'Error',
    );
    return new Map();
  }
}

export function createHttpProgressRepository(
  api: ApiClient,
): ProgressRepository {
  return {
    getOfficialProgress: async () =>
      toOfficialProgress(
        await api.get<ProgresoOficialDto>('/estudiantes/me/progreso'),
      ),
  };
}

/**
 * Falla cerrado: sin `concedido: true`, no se graba. Solo se dice que el
 * acudiente no autorizó cuando el motivo es `NO_ACEPTADO`; cualquier otra
 * respuesta (`NO_VERIFICABLE` o algo raro) es «no se pudo verificar».
 */
export function toVoiceConsentStatus(
  dto: Partial<ConsentimientoVozDto> | null | undefined,
): VoiceConsentStatus {
  if (dto?.concedido === true) return 'granted';
  if (dto?.concedido === false && dto.motivo === 'NO_ACEPTADO') {
    return 'notGranted';
  }
  return 'notVerified';
}

export function createHttpConsentRepository(api: ApiClient): ConsentRepository {
  const status = async () =>
    toVoiceConsentStatus(
      await api.get<ConsentimientoVozDto>('/estudiantes/me/consentimiento-voz'),
    );

  return {
    hasVoiceRecordingConsent: async () => (await status()) === 'granted',
    getVoiceConsentStatus: status,
  };
}
