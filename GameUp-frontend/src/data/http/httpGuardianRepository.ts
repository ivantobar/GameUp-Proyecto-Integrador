import type { ApiClient } from '@/services/api';
import { NoLinkedStudentsError } from '../guardianErrors';
import type { GuardianRepository } from '../repositories';
import type {
  ActividadEstudianteDto,
  PaginaEstudiantesDto,
  PaginaObservacionesDto,
  PracticaSemanalDto,
} from './dto/acudiente';
import { toStudentSummary, toWeeklyPractice } from './mappers/guardianMapper';
import { requireList } from './mappers/responseShape';

const student = (id: string) => `/estudiantes/${encodeURIComponent(id)}`;

/**
 * Espacio del acudiente con la API. El backend solo le devuelve SUS
 * estudiantes y responde 404 con cualquier otro: el `guardianId` no se
 * envía.
 */
export function createHttpGuardianRepository(
  api: ApiClient,
): GuardianRepository {
  const listStudents = async () => {
    const page = await api.get<PaginaEstudiantesDto>('/estudiantes?limit=50');
    return requireList(page.items, 'items').map((item) =>
      toStudentSummary(item as PaginaEstudiantesDto['items'][number]),
    );
  };

  return {
    listStudents,

    async getWeeklyPractice(_guardianId, studentId) {
      const id = studentId ?? (await listStudents())[0]?.id;
      // Sin niños vinculados no es un fallo de red: lo dice la pantalla.
      if (!id) throw new NoLinkedStudentsError();

      const [semana, observaciones, actividades] = await Promise.all([
        api.get<PracticaSemanalDto>(`${student(id)}/practica-semanal`),
        // La más reciente primero: el acudiente solo recibe las visibles.
        api.get<PaginaObservacionesDto>(`${student(id)}/observaciones?limit=1`),
        api.get<ActividadEstudianteDto[]>(`${student(id)}/actividades`),
      ]);
      return toWeeklyPractice(
        semana,
        requireList(
          observaciones.items,
          'observaciones',
        ) as PaginaObservacionesDto['items'],
        actividades,
      );
    },

    async markPracticedToday(_guardianId, studentId) {
      await api.put<PracticaSemanalDto>(
        `${student(studentId)}/practica-casa/hoy`,
      );
    },
  };
}
