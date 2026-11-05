import type { ApiClient } from '@/services/api';
import type {
  ActivityRepository,
  AssignmentRepository,
  ConsentRepository,
  PracticeRepository,
  ProgressRepository,
} from '../repositories';
import type { ActividadDetalleDto } from './dto/actividades';
import type {
  ActividadPendienteDto,
  ProgresoOficialDto,
} from './dto/asignaciones';
import type { ConsentimientoVozDto } from './dto/estudiantes';
import type { PracticaVocalDto, PuntoRetornoDto } from './dto/intentos';
import { toActivityContent } from './mappers/activityMapper';
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
    getActivity: async (activityId) =>
      toActivityContent(
        await api.get<ActividadDetalleDto>(
          `/actividades/${encodeURIComponent(activityId)}`,
        ),
      ),
  };
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

export function createHttpConsentRepository(api: ApiClient): ConsentRepository {
  return {
    // Falla cerrado: sin una respuesta clara de «concedido», no se graba.
    hasVoiceRecordingConsent: async () => {
      const dto = await api.get<ConsentimientoVozDto>(
        '/estudiantes/me/consentimiento-voz',
      );
      return dto.concedido === true;
    },
  };
}
