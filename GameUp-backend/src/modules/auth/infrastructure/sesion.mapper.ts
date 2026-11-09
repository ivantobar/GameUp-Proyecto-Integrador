import type { IdentidadExterna } from '../../../common/auth/verificador-token.js';
import { idATexto } from '../../../common/ids/ids.js';
import type { Usuario } from '../../usuarios/domain/usuario.entity.js';
import type { SesionIniciada } from '../application/auth.service.js';
import { MapeadorRoles } from '../domain/mapeador-roles.js';
import type {
  IdentidadCentralDto,
  LoginRespuestaDto,
  SesionUsuarioDto,
} from '../presentation/dto/sesion.dto.js';

export const SesionMapper = {
  aSesionDto(usuario: Usuario, identidad: IdentidadExterna): SesionUsuarioDto {
    return {
      userId: idATexto(usuario.id),
      role: MapeadorRoles.aRolApp(usuario.rol),
      displayName: usuario.nombreVisible(),
      identidadCentral: SesionMapper.aIdentidadCentralDto(identidad),
    };
  },

  /** Solo id, nombres, apellidos, correo y roles (nada más del perfil central). */
  aIdentidadCentralDto(identidad: IdentidadExterna): IdentidadCentralDto {
    return {
      idUsuario: idATexto(identidad.idUsuarioAuth),
      nombres: identidad.nombres,
      apellidos: identidad.apellidos,
      correo: identidad.correo,
      roles: [...identidad.roles],
    };
  },

  aLoginDto(sesion: SesionIniciada): LoginRespuestaDto {
    return {
      token: sesion.token,
      expiraEn: sesion.expiraEn?.toISOString() ?? null,
      usuario: SesionMapper.aSesionDto(sesion.usuario, sesion.identidad),
    };
  },
} as const;
