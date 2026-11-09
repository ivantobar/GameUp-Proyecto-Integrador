import type { ApiClient } from '@/services/api';
import { ApiError, ForbiddenError, NotFoundError } from '@/services/apiErrors';
import type { TeacherLinkRepository } from '../repositories';
import { StudentAccessError, TeacherLinkError } from '../studentErrors';
import type {
  AsignarTalleristaDto,
  PaginaUsuariosDto,
  TalleristaAsignadaDto,
  UsuarioDto,
} from './dto/talleristas';
import { requireList } from './mappers/responseShape';
import { toStudentTeacher, toTeacherOption } from './mappers/teacherMapper';

const teachersOf = (studentId: string) =>
  `/estudiantes/${encodeURIComponent(studentId)}/talleristas`;

/** Páginas como máximo (50 × 20 = 1000 talleristas): evita un ciclo sin fin. */
const MAX_PAGES = 20;

/** 403 y 404 → «no puedes hacer esto con este estudiante». */
function toAccessError(error: unknown): unknown {
  return error instanceof ForbiddenError || error instanceof NotFoundError
    ? new StudentAccessError()
    : error;
}

async function guarded<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw toAccessError(error);
  }
}

/** Talleristas a cargo de un estudiante, con la API (solo la directora). */
export function createHttpTeacherLinkRepository(
  api: ApiClient,
): TeacherLinkRepository {
  return {
    listStudentTeachers: (studentId) =>
      guarded(async () => {
        const list = requireList(
          await api.get<TalleristaAsignadaDto[]>(teachersOf(studentId)),
          'talleristas',
        ) as TalleristaAsignadaDto[];
        return list.map(toStudentTeacher);
      }),

    listActiveTeachers: () =>
      guarded(async () => {
        // El backend pagina de a 50 como máximo: se piden todas las páginas.
        const all: UsuarioDto[] = [];
        for (let page = 1; page <= MAX_PAGES; page += 1) {
          const result = await api.get<PaginaUsuariosDto>(
            `/usuarios?rol=TALLERISTA&activo=true&page=${page}&limit=50`,
          );
          const items = requireList(result.items, 'items') as UsuarioDto[];
          all.push(...items);
          if (items.length === 0 || all.length >= result.total) break;
        }
        return all.map(toTeacherOption);
      }),

    assignTeacher: async (studentId, teacherId) => {
      const body: AsignarTalleristaDto = { talleristaId: teacherId };
      try {
        return toStudentTeacher(
          await api.post<TalleristaAsignadaDto>(teachersOf(studentId), body),
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          throw new TeacherLinkError('alreadyInCharge');
        }
        if (error instanceof ApiError && error.status === 422) {
          throw new TeacherLinkError('notActiveTeacher');
        }
        throw toAccessError(error);
      }
    },

    removeTeacher: async (studentId, teacherId) => {
      try {
        await api.delete<void>(
          `${teachersOf(studentId)}/${encodeURIComponent(teacherId)}`,
        );
        return 'removed';
      } catch (error) {
        // 404: esa tallerista ya no lo tenía a cargo (otra persona la quitó
        // antes). El resultado es el que se quería: no es un error.
        if (error instanceof NotFoundError) return 'notInCharge';
        throw toAccessError(error);
      }
    },
  };
}
