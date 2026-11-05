import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';

/**
 * Qué estudiantes puede ver cada persona (regla de relación, 2.º nivel de
 * autorización). Es el ÚNICO lugar que la define:
 *   - DIRECTORA: todos.
 *   - TALLERISTA: los que tiene a cargo (tallerista_estudiante.activo = true).
 *   - ACUDIENTE: los de acudiente_estudiante.
 *   - ESTUDIANTE: solo él mismo.
 */
export type AlcanceEstudiantes =
  | { tipo: 'todos' }
  | { tipo: 'tallerista'; talleristaId: bigint }
  | { tipo: 'acudiente'; acudienteId: bigint }
  | { tipo: 'propio'; estudianteId: bigint };

export function alcanceDe(usuario: UsuarioAutenticado): AlcanceEstudiantes {
  switch (usuario.rol) {
    case 'DIRECTORA':
      return { tipo: 'todos' };
    case 'TALLERISTA':
      return { tipo: 'tallerista', talleristaId: usuario.id };
    case 'ACUDIENTE':
      return { tipo: 'acudiente', acudienteId: usuario.id };
    case 'ESTUDIANTE':
      return { tipo: 'propio', estudianteId: usuario.id };
  }
}
