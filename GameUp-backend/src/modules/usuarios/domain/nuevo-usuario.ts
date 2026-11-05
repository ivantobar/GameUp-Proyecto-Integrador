import type { RolGameUp } from '../../../common/auth/usuario-autenticado.js';
import { ReglaNegocioError } from '../../../common/errors/dominio.errors.js';

/** Lo que pide la directora para dar de alta una cuenta. */
export interface DatosNuevoUsuario {
  idUsuarioAuth: bigint;
  rol: RolGameUp;
  nombres: string;
  apellidos: string;
  correo: string | null;
  idAcudienteExterno: bigint | null;
  idEstudianteExterno: bigint | null;
  nivelId: bigint | null;
}

/**
 * Reglas del alta (invariantes del dominio). Devuelve los datos normalizados
 * o lanza ReglaNegocioError (422).
 *  - ESTUDIANTE: exige idEstudianteExterno; solo él puede tener nivel.
 *  - ACUDIENTE: es el único que puede tener idAcudienteExterno.
 *  - Nombres y apellidos sin espacios de sobra; correo en minúsculas.
 */
export function normalizarNuevoUsuario(
  d: DatosNuevoUsuario,
): DatosNuevoUsuario {
  const nombres = colapsar(d.nombres);
  const apellidos = colapsar(d.apellidos);
  if (!nombres || !apellidos) {
    throw new ReglaNegocioError(
      'Los nombres y los apellidos son obligatorios.',
    );
  }

  if (d.rol === 'ESTUDIANTE' && d.idEstudianteExterno === null) {
    throw new ReglaNegocioError(
      'Un estudiante necesita su id de la API del núcleo familiar (idEstudianteExterno).',
    );
  }
  if (
    d.rol !== 'ESTUDIANTE' &&
    (d.idEstudianteExterno !== null || d.nivelId !== null)
  ) {
    throw new ReglaNegocioError(
      'idEstudianteExterno y nivelId solo aplican a cuentas de estudiante.',
    );
  }
  if (d.rol !== 'ACUDIENTE' && d.idAcudienteExterno !== null) {
    throw new ReglaNegocioError(
      'idAcudienteExterno solo aplica a cuentas de acudiente.',
    );
  }

  const correo = d.correo?.trim().toLowerCase() || null;
  return { ...d, nombres, apellidos, correo };
}

function colapsar(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ');
}
