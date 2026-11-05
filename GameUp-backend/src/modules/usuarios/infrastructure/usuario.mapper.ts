import { esRolGameUp } from '../../../common/auth/usuario-autenticado.js';
import { idATexto } from '../../../common/ids/ids.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import {
  ESTADOS_ESTUDIANTE,
  Usuario,
  type EstadoEstudiante,
} from '../domain/usuario.entity.js';
import type { UsuarioDto } from '../presentation/dto/usuario.dto.js';

/** Columnas que se leen de `usuario` (y su `estudiante`). */
export const SELECCION_USUARIO = {
  id: true,
  id_usuario_auth: true,
  nombres: true,
  apellidos: true,
  correo: true,
  activo: true,
  id_acudiente_externo: true,
  creado_en: true,
  ultimo_acceso: true,
  sincronizado_en: true,
  rol: { select: { nombre: true } },
  estudiante: {
    select: { id_estudiante_externo: true, nivel_id: true, estado: true },
  },
} satisfies Prisma.usuarioSelect;

export type FilaUsuario = Prisma.usuarioGetPayload<{
  select: typeof SELECCION_USUARIO;
}>;

function esEstadoEstudiante(valor: string): valor is EstadoEstudiante {
  return (ESTADOS_ESTUDIANTE as readonly string[]).includes(valor);
}

export const UsuarioMapper = {
  aEntidad(fila: FilaUsuario): Usuario {
    // La base lo garantiza con sus CHECK; si falla, es un error de datos.
    if (!esRolGameUp(fila.rol.nombre)) {
      throw new Error('Rol desconocido en la tabla rol');
    }
    const est = fila.estudiante;
    if (est && !esEstadoEstudiante(est.estado)) {
      throw new Error('Estado de estudiante desconocido');
    }
    return new Usuario({
      id: fila.id,
      idUsuarioAuth: fila.id_usuario_auth,
      rol: fila.rol.nombre,
      nombres: fila.nombres,
      apellidos: fila.apellidos,
      correo: fila.correo,
      activo: fila.activo,
      idAcudienteExterno: fila.id_acudiente_externo,
      estudiante: est
        ? {
            idEstudianteExterno: est.id_estudiante_externo,
            nivelId: est.nivel_id,
            estado: est.estado as EstadoEstudiante,
          }
        : null,
      creadoEn: fila.creado_en,
      ultimoAcceso: fila.ultimo_acceso,
      sincronizadoEn: fila.sincronizado_en,
    });
  },

  aDto(u: Usuario): UsuarioDto {
    return {
      id: idATexto(u.id),
      idUsuarioAuth: idATexto(u.idUsuarioAuth),
      rol: u.rol,
      nombres: u.nombres,
      apellidos: u.apellidos,
      correo: u.correo,
      activo: u.activo,
      idAcudienteExterno:
        u.idAcudienteExterno === null ? null : idATexto(u.idAcudienteExterno),
      estudiante: u.estudiante
        ? {
            idEstudianteExterno: idATexto(u.estudiante.idEstudianteExterno),
            nivelId: idATexto(u.estudiante.nivelId),
            estado: u.estudiante.estado,
          }
        : null,
      creadoEn: u.creadoEn.toISOString(),
      ultimoAcceso: u.ultimoAcceso?.toISOString() ?? null,
      sincronizadoEn: u.sincronizadoEn?.toISOString() ?? null,
    };
  },
} as const;
