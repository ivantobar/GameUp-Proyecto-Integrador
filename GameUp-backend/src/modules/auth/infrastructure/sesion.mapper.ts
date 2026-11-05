import { idATexto } from '../../../common/ids/ids.js';
import type { Usuario } from '../../usuarios/domain/usuario.entity.js';
import type { SesionIniciada } from '../application/auth.service.js';
import { MapeadorRoles } from '../domain/mapeador-roles.js';
import type {
  LoginRespuestaDto,
  SesionUsuarioDto,
} from '../presentation/dto/sesion.dto.js';

export const SesionMapper = {
  aSesionDto(usuario: Usuario): SesionUsuarioDto {
    return {
      userId: idATexto(usuario.id),
      role: MapeadorRoles.aRolApp(usuario.rol),
      displayName: usuario.nombreVisible(),
    };
  },

  aLoginDto(sesion: SesionIniciada): LoginRespuestaDto {
    return {
      token: sesion.token,
      expiraEn: sesion.expiraEn?.toISOString() ?? null,
      usuario: SesionMapper.aSesionDto(sesion.usuario),
    };
  },
} as const;
