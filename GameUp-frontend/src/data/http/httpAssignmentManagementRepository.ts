import type { ApiClient } from '@/services/api';
import { ApiError } from '@/services/apiErrors';
import type { AssignmentManagementRepository } from '../repositories';
import { AssignmentError, type AssignmentProblem } from '../studentErrors';
import type { AsignacionDto, PaginaAsignacionesDto } from './dto/asignaciones';
import type { ModuloDto, PaginaModulosDto } from './dto/modulos';
import {
  toAssignableModule,
  toModuleActivities,
  toCreateAssignmentBody,
  toStudentAssignment,
} from './mappers/assignmentManagementMapper';
import { requireList } from './mappers/responseShape';

type ProblemTable = Partial<Record<number, AssignmentProblem>>;

/**
 * Qué significa cada código en cada endpoint. El 409 cambia: al crear es
 * «ya lo tiene asignado»; al quitar, «ya empezó a practicarla».
 */
const createProblems: ProblemTable = {
  400: 'invalid',
  403: 'notAllowed',
  404: 'notFound',
  409: 'alreadyAssigned',
  422: 'notAssignable',
};
const removeProblems: ProblemTable = {
  400: 'invalid',
  403: 'notAllowed',
  404: 'notFound',
  409: 'hasAttempts',
};
const readProblems: ProblemTable = {
  403: 'notAllowed',
  404: 'notFound',
};

/** Traduce el error HTTP con la tabla de ese endpoint; la red sigue igual. */
async function translated<T>(
  problems: ProblemTable,
  request: () => Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    const status = error instanceof ApiError ? error.status : null;
    const problem = status === null ? undefined : problems[status];
    if (problem) throw new AssignmentError(problem);
    throw error;
  }
}

/** Asignaciones con la API (DIRECTORA y TALLERISTA; el backend lo verifica). */
export function createHttpAssignmentManagementRepository(
  api: ApiClient,
): AssignmentManagementRepository {
  return {
    listForStudent: (studentId) =>
      translated(readProblems, async () => {
        const page = await api.get<PaginaAsignacionesDto>(
          `/asignaciones?estudianteId=${encodeURIComponent(studentId)}&limit=50`,
        );
        return requireList(page.items, 'items').map((item) =>
          toStudentAssignment(item as AsignacionDto),
        );
      }),

    listAssignableModules: () =>
      translated(readProblems, async () => {
        const page = await api.get<PaginaModulosDto>(
          '/modulos?publicado=true&limit=50',
        );
        const items = requireList(page.items, 'items') as ModuloDto[];
        // El backend ya filtra; si llegara uno sin publicar, no se ofrece.
        return items
          .filter((modulo) => modulo.publicado === true)
          .map(toAssignableModule);
      }),

    listModuleActivities: (moduleId) =>
      translated(readProblems, async () =>
        toModuleActivities(
          await api.get<unknown>(
            `/modulos/${encodeURIComponent(moduleId)}/actividades`,
          ),
        ),
      ),

    assign: (input) =>
      translated(createProblems, async () =>
        toStudentAssignment(
          await api.post<AsignacionDto>(
            '/asignaciones',
            toCreateAssignmentBody(input),
          ),
        ),
      ),

    remove: (assignmentId) =>
      translated(removeProblems, async () => {
        await api.delete<void>(
          `/asignaciones/${encodeURIComponent(assignmentId)}`,
        );
      }),
  };
}
