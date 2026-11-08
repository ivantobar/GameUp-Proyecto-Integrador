import { ServerError } from '@/services/apiErrors';
import type { AsignacionDto } from '../../dto/asignaciones';
import type { ModuloDto } from '../../dto/modulos';
import {
  toAssignableModule,
  toCreateAssignmentBody,
  toStudentAssignment,
} from '../assignmentManagementMapper';

const asignacion = (overrides: Partial<AsignacionDto> = {}): AsignacionDto => ({
  id: '12',
  modulo: { id: '3', nombre: 'Vocal A' },
  estudiante: { id: '31', displayName: 'Estrella P.', initials: 'EP' },
  asignadoPor: { id: '3', displayName: 'Profe de prueba' },
  fechaAsignacion: '2026-11-05T15:00:00.000Z',
  fechaSugerida: '2026-11-20',
  estado: 'EN_CURSO',
  progreso: 50,
  ...overrides,
});

const modulo = (overrides: Partial<ModuloDto> = {}): ModuloDto => ({
  id: '3',
  nombre: 'Vocal A',
  descripcion: '  Reconocer y decir la a  ',
  categoria: { id: '1', nombre: 'Lenguaje' },
  nivel: { id: '1', nombre: 'BAJO' },
  creadoPor: { id: '1', displayName: 'Directora' },
  musicaId: null,
  portadaContenidoId: null,
  publicado: true,
  orden: 0,
  creadoEn: '2026-11-05T15:00:00.000Z',
  ...overrides,
});

describe('toStudentAssignment', () => {
  it('traduce la asignación del backend', () => {
    expect(toStudentAssignment(asignacion())).toEqual({
      id: '12',
      moduleId: '3',
      moduleTitle: 'Vocal A',
      state: 'inProgress',
      progress: 50,
      suggestedDate: '2026-11-20',
    });
  });

  it.each([
    ['ASIGNADO', 'assigned'],
    ['EN_CURSO', 'inProgress'],
    ['COMPLETADO', 'completed'],
  ] as const)('estado %s → %s', (estado, state) => {
    expect(toStudentAssignment(asignacion({ estado })).state).toBe(state);
  });

  it('sin fecha sugerida, queda en null', () => {
    expect(
      toStudentAssignment(asignacion({ fechaSugerida: null })).suggestedDate,
    ).toBeNull();
  });

  it('un estado desconocido o un progreso inválido es un error claro', () => {
    expect(() =>
      toStudentAssignment(
        asignacion({ estado: 'OTRO' as AsignacionDto['estado'] }),
      ),
    ).toThrow(ServerError);
    expect(() => toStudentAssignment(asignacion({ progreso: -1 }))).toThrow(
      ServerError,
    );
  });
});

describe('toAssignableModule', () => {
  it('toma el nombre, la categoría y la descripción sin espacios', () => {
    expect(toAssignableModule(modulo())).toEqual({
      id: '3',
      title: 'Vocal A',
      description: 'Reconocer y decir la a',
      category: 'Lenguaje',
    });
  });

  it('una descripción vacía queda en null', () => {
    expect(toAssignableModule(modulo({ descripcion: '  ' })).description).toBe(
      null,
    );
  });
});

describe('toCreateAssignmentBody', () => {
  it('usa los nombres exactos de CrearAsignacionDto', () => {
    expect(
      toCreateAssignmentBody({
        moduleId: '3',
        studentId: '31',
        suggestedDate: '2026-11-20',
      }),
    ).toEqual({
      moduloId: '3',
      estudianteId: '31',
      fechaSugerida: '2026-11-20',
    });
  });

  it('sin fecha, no envía fechaSugerida', () => {
    const body = toCreateAssignmentBody({ moduleId: '3', studentId: '31' });
    expect(body).toEqual({ moduloId: '3', estudianteId: '31' });
    expect('fechaSugerida' in body).toBe(false);
  });
});
