import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  RESOLUTOR_USUARIO,
  type ResolutorUsuario,
} from '../../../common/auth/resolutor-usuario.js';
import type {
  RolGameUp,
  UsuarioAutenticado,
} from '../../../common/auth/usuario-autenticado.js';
import type { IdentidadExterna } from '../../../common/auth/verificador-token.js';
import {
  AccesoDenegadoError,
  ServicioExternoNoDisponibleError,
} from '../../../common/errors/dominio.errors.js';
import {
  CONSULTA_ESTUDIANTE_EXTERNO,
  type ConsultaEstudianteExterno,
} from '../../estudiantes/domain/estudiante-externo.js';
import { UsuarioService } from '../../usuarios/application/usuario.service.js';
import { CampoEnUsoError } from '../../usuarios/domain/campo-en-uso.error.js';
import { copiaDesdeIdentidad } from '../../usuarios/domain/copia-externa.js';
import type { DatosNuevoUsuario } from '../../usuarios/domain/nuevo-usuario.js';
import { CuentaNoRegistradaError } from '../domain/cuenta-no-registrada.error.js';
import { MapeadorRoles } from '../domain/mapeador-roles.js';

/** Roles de GameUP con alta automática (ALTA_AUTOMATICA_ROLES ya leída). */
export const ROLES_ALTA_AUTOMATICA = Symbol('ROLES_ALTA_AUTOMATICA');

export const MENSAJES_ALTA = {
  variosRoles:
    'Tu cuenta tiene varios roles en la fundación. Pide a la directora que te dé de alta en GameUP.',
  estudianteNoEncontrado:
    'Aún no te encontramos en ASISCO UP. Pide a la fundación que revise tu registro.',
  asiscoNoResponde:
    'No pudimos consultar ASISCO UP. Espera un momento e inténtalo otra vez.',
  revisarCuenta: 'Pide a la directora que revise tu cuenta.',
} as const;

const SIN_NOMBRE = 'Sin nombre';
const SIN_APELLIDO = 'Sin apellido';

/**
 * Caso de uso: alta automática en el PRIMER inicio de sesión.
 *
 * Solo lo llama AuthService.iniciarSesion cuando el resolutor dice
 * CuentaNoRegistradaError (no hay fila en `usuario` con ese id_usuario_auth).
 * El AuthGuard nunca llega aquí: en cualquier otra petición, sin cuenta → 403.
 *
 * Reglas:
 *  - ALTA_AUTOMATICA_ROLES vacía o rol fuera de la lista → el 403 de siempre.
 *  - Varios roles con acceso → 403 (la directora decide con POST /usuarios).
 *  - ESTUDIANTE: su idEstudianteExterno sale de ASISCO UP (búsqueda exacta por
 *    id_usuario). Sin ASISCO UP o sin encontrarlo → 403; ASISCO UP caído → 503;
 *    ese idEstudianteExterno ya lo usa otra cuenta → 403.
 *  - ACUDIENTE, TALLERISTA y DIRECTORA: sin más datos (los vínculos del
 *    acudiente los copia después el login, como siempre).
 *  - Correo de seguridad ya usado por otra cuenta → se crea sin correo.
 *  - Se crea con UsuarioService.crear: mismas reglas, fila `estudiante` y
 *    nivel inicial que POST /usuarios.
 *  - Carrera (dos logins a la vez): si crear falla, se vuelve a resolver; si
 *    la cuenta ya existe, entra; si no, 403 claro.
 * Nunca reactiva, cambia el rol ni toca una cuenta que ya existe.
 */
@Injectable()
export class AltaAutomaticaService {
  private readonly logger = new Logger(AltaAutomaticaService.name);

  constructor(
    @Inject(RESOLUTOR_USUARIO) private readonly resolutor: ResolutorUsuario,
    private readonly usuarios: UsuarioService,
    @Inject(ROLES_ALTA_AUTOMATICA)
    private readonly rolesHabilitados: readonly RolGameUp[],
    @Optional()
    @Inject(CONSULTA_ESTUDIANTE_EXTERNO)
    private readonly estudiantes: ConsultaEstudianteExterno | null = null,
  ) {}

  /**
   * Crea la cuenta de quien acaba de autenticarse en la API de seguridad y
   * devuelve su UsuarioAutenticado. `noRegistrada` es el 403 original: se
   * relanza tal cual cuando el alta no aplica (interruptor apagado).
   */
  async darDeAlta(
    identidad: IdentidadExterna,
    token: string,
    noRegistrada: CuentaNoRegistradaError,
  ): Promise<UsuarioAutenticado> {
    if (this.rolesHabilitados.length === 0) throw noRegistrada;

    const roles = MapeadorRoles.aRolesGameUp(identidad.roles);
    if (roles.length > 1) {
      throw new AccesoDenegadoError(MENSAJES_ALTA.variosRoles);
    }
    const rol = roles[0];
    if (!rol || !this.rolesHabilitados.includes(rol)) throw noRegistrada;

    const idEstudianteExterno =
      rol === 'ESTUDIANTE'
        ? await this.buscarEstudiante(identidad.idUsuarioAuth, token)
        : null;

    const copia = copiaDesdeIdentidad(identidad);
    const datos: DatosNuevoUsuario = {
      idUsuarioAuth: identidad.idUsuarioAuth,
      rol,
      nombres: copia.nombres ?? SIN_NOMBRE,
      apellidos: copia.apellidos ?? SIN_APELLIDO,
      correo: copia.correo ?? null,
      idAcudienteExterno: null,
      idEstudianteExterno,
      nivelId: null,
    };
    return this.crear(identidad, datos);
  }

  private async buscarEstudiante(
    idUsuarioAuth: bigint,
    token: string,
  ): Promise<bigint> {
    // Sin ASISCO_API_URL no hay de dónde sacar el idEstudianteExterno.
    if (!this.estudiantes) {
      throw new AccesoDenegadoError(MENSAJES_ALTA.estudianteNoEncontrado);
    }
    let idExterno: bigint | null;
    try {
      idExterno = await this.estudiantes.porIdUsuarioAuth(idUsuarioAuth, token);
    } catch (err) {
      if (err instanceof ServicioExternoNoDisponibleError) {
        throw new ServicioExternoNoDisponibleError(
          MENSAJES_ALTA.asiscoNoResponde,
        );
      }
      throw err;
    }
    if (idExterno === null) {
      throw new AccesoDenegadoError(MENSAJES_ALTA.estudianteNoEncontrado);
    }
    return idExterno;
  }

  private async crear(
    identidad: IdentidadExterna,
    datos: DatosNuevoUsuario,
  ): Promise<UsuarioAutenticado> {
    const idAuth = identidad.idUsuarioAuth.toString();
    try {
      const usuario = await this.usuarios.crear(datos);
      this.logger.log(
        `Cuenta creada automáticamente (usuario ${usuario.id.toString()}, id_usuario_auth ${idAuth}, rol ${usuario.rol})`,
      );
      return {
        id: usuario.id,
        idUsuarioAuth: usuario.idUsuarioAuth,
        rol: usuario.rol,
      };
    } catch (err) {
      if (err instanceof CampoEnUsoError && !err.incluye('idUsuarioAuth')) {
        if (err.incluye('idEstudianteExterno')) {
          this.logger.warn(
            `Alta automática rechazada: el id_estudiante_externo ${String(datos.idEstudianteExterno)} ya lo usa otra cuenta (id_usuario_auth ${idAuth})`,
          );
          throw new AccesoDenegadoError(MENSAJES_ALTA.revisarCuenta);
        }
        if (err.incluye('correo') && datos.correo !== null) {
          // La identidad es id_usuario_auth; el correo es secundario.
          this.logger.warn(
            `Alta automática sin correo: ya lo usa otra cuenta (id_usuario_auth ${idAuth})`,
          );
          return this.crear(identidad, { ...datos, correo: null });
        }
      }
      const motivo = err instanceof Error ? err.name : 'desconocido';
      return this.resolverTrasFallo(identidad, idAuth, motivo);
    }
  }

  /**
   * crear falló (otro login simultáneo ganó el índice único, u otro error):
   * si la cuenta ya existe, se entra con las reglas de siempre; si no, 403.
   */
  private async resolverTrasFallo(
    identidad: IdentidadExterna,
    idAuth: string,
    motivo: string,
  ): Promise<UsuarioAutenticado> {
    try {
      return await this.resolutor.resolver(identidad);
    } catch (err) {
      if (!(err instanceof CuentaNoRegistradaError)) throw err;
      this.logger.warn(
        `Alta automática fallida (${motivo}) y la cuenta sigue sin existir (id_usuario_auth ${idAuth})`,
      );
      throw new AccesoDenegadoError(MENSAJES_ALTA.revisarCuenta);
    }
  }
}
