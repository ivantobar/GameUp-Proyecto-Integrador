import type { ApiClient } from '@/services/api';
import { ForbiddenError, NotFoundError } from '@/services/apiErrors';
import type { StudentDirectoryRepository } from '../repositories';
import { StudentAccessError } from '../studentErrors';
import type {
  EstudianteResumenDto,
  PaginaEstudiantesDto,
} from './dto/acudiente';
import type { ProgresoOficialDto } from './dto/asignaciones';
import { toStudentSummary } from './mappers/guardianMapper';
import { toOfficialProgress } from './mappers/progressMapper';
import { requireList } from './mappers/responseShape';

const student = (id: string) => `/estudiantes/${encodeURIComponent(id)}`;

/** Páginas como máximo (50 × 20 = 1000 estudiantes): evita un ciclo sin fin. */
const MAX_PAGES = 20;

/** 403 y 404 → «no puedes ver a este estudiante» (no es un problema de red). */
async function guarded<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      throw new StudentAccessError();
    }
    throw error;
  }
}

/**
 * Estudiantes con la API. El backend devuelve solo los que le corresponden
 * a la sesión (tallerista: los suyos; directora: todos).
 */
export function createHttpStudentDirectoryRepository(
  api: ApiClient,
): StudentDirectoryRepository {
  return {
    listStudents: () =>
      guarded(async () => {
        // El backend pagina de a 50 como máximo: se piden todas las páginas.
        const all: EstudianteResumenDto[] = [];
        for (let page = 1; page <= MAX_PAGES; page += 1) {
          const result = await api.get<PaginaEstudiantesDto>(
            `/estudiantes?limit=50&page=${page}`,
          );
          const items = requireList(
            result.items,
            'items',
          ) as EstudianteResumenDto[];
          all.push(...items);
          if (items.length === 0 || all.length >= result.total) break;
        }
        return all.map(toStudentSummary);
      }),

    getStudent: (studentId) =>
      guarded(async () =>
        toStudentSummary(
          await api.get<EstudianteResumenDto>(student(studentId)),
        ),
      ),

    getStudentProgress: (studentId) =>
      guarded(async () =>
        toOfficialProgress(
          await api.get<ProgresoOficialDto>(`${student(studentId)}/progreso`),
        ),
      ),
  };
}
