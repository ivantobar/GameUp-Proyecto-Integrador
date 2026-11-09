import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { RolGameUp } from '../../../common/auth/usuario-autenticado.js';
import {
  ReglaNegocioError,
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
import type { Usuario } from '../../usuarios/domain/usuario.entity.js';
import {
  DIRECTORIO_CENTRAL,
  type DirectorioCentral,
} from '../domain/directorio-central.js';
import { MapeadorRoles } from '../domain/mapeador-roles.js';

/** Lo que decide la directora; nombres, apellidos y correo no: vienen de la API central. */
export interface PedidoAltaDirectora {
  idUsuarioAuth: bigint;
  rol: RolGameUp;
  idAcudienteExterno: bigint | null;
  /** Opcional: si llega, debe coincidir con el de ASISCO UP. */
  idEstudianteExterno: bigint | null;
  nivelId: bigint | null;
}

export const MENSAJES_ALTA_DIRECTORA = {
  noExisteCentral:
    'Esa persona no existe en la API central (revisa el idUsuarioAuth).',
  rolNoCoincide: (rol: RolGameUp) =>
    `Esa persona no tiene el rol ${rol} en la API central.`,
  estudianteNoEnAsisco:
    'Ese estudiante no está en ASISCO UP con ese idUsuarioAuth.',
  estudianteNoCoincide:
    'El idEstudianteExterno no coincide con el que tiene ASISCO UP para esa persona.',
  estudianteSinId:
    'ASISCO UP no está conectado: indica el idEstudianteExterno del estudiante.',
  asiscoNoResponde:
    'No pudimos consultar ASISCO UP. Espera un momento e inténtalo otra vez.',
} as const;

const SIN_NOMBRE = 'Sin nombre';
const SIN_APELLIDO = 'Sin apellido';

/**
 * Caso de uso: la directora da de alta una cuenta (POST /usuarios) sin
 * escribir datos a mano.
 *
 *  1. GET /api/usuarios/{idUsuarioAuth} de la API central con el token de la
 *     directora → nombres, apellidos, correo y roles. No existe → 422; no
 *     responde → 503.
 *  2. El rol pedido debe estar entre sus roles centrales (ADMIN→DIRECTORA);
 *     si no, 422.
 *  3. ESTUDIANTE: su idEstudianteExterno sale de ASISCO UP
 *     (GET /api/estudiantes/por-usuario/{idUsuarioAuth}). Si la directora lo
 *     manda y no coincide → 422; ASISCO UP no lo tiene → 422; no responde → 503.
 *     Sin ASISCO_API_URL se acepta el que mande la directora (como antes).
 *  4. Se crea con UsuarioService.crear (mismas reglas que el alta automática).
 *     Si el correo central ya lo usa otra cuenta, se crea sin correo.
 *
 * Nunca crea credenciales ni llama a /api/auth/registro.
 */
@Injectable()
export class AltaDirectoraService {
  private readonly logger = new Logger(AltaDirectoraService.name);

  constructor(
    @Inject(DIRECTORIO_CENTRAL) private readonly directorio: DirectorioCentral,
    private readonly usuarios: UsuarioService,
    @Optional()
    @Inject(CONSULTA_ESTUDIANTE_EXTERNO)
    private readonly estudiantes: ConsultaEstudianteExterno | null = null,
  ) {}

  async crear(pedido: PedidoAltaDirectora, token: string): Promise<Usuario> {
    const identidad = await this.directorio.buscar(pedido.idUsuarioAuth, token);
    if (!identidad) {
      throw new ReglaNegocioError(MENSAJES_ALTA_DIRECTORA.noExisteCentral);
    }
    if (!MapeadorRoles.aRolesGameUp(identidad.roles).includes(pedido.rol)) {
      throw new ReglaNegocioError(
        MENSAJES_ALTA_DIRECTORA.rolNoCoincide(pedido.rol),
      );
    }

    const idEstudianteExterno =
      pedido.rol === 'ESTUDIANTE'
        ? await this.idEstudiante(pedido, token)
        : pedido.idEstudianteExterno; // normalizarNuevoUsuario lo rechaza (422)

    const copia = copiaDesdeIdentidad(identidad);
    const datos: DatosNuevoUsuario = {
      idUsuarioAuth: pedido.idUsuarioAuth,
      rol: pedido.rol,
      nombres: copia.nombres ?? SIN_NOMBRE,
      apellidos: copia.apellidos ?? SIN_APELLIDO,
      correo: copia.correo ?? null,
      idAcudienteExterno: pedido.idAcudienteExterno,
      idEstudianteExterno,
      nivelId: pedido.nivelId,
    };

    try {
      return await this.usuarios.crear(datos);
    } catch (err) {
      // El correo es de la API central: la directora no puede cambiarlo.
      if (
        err instanceof CampoEnUsoError &&
        err.incluye('correo') &&
        !err.incluye('idUsuarioAuth') &&
        datos.correo !== null
      ) {
        this.logger.warn(
          `Alta sin correo: ya lo usa otra cuenta (id_usuario_auth ${pedido.idUsuarioAuth.toString()})`,
        );
        return this.usuarios.crear({ ...datos, correo: null });
      }
      throw err;
    }
  }

  private async idEstudiante(
    pedido: PedidoAltaDirectora,
    token: string,
  ): Promise<bigint> {
    if (!this.estudiantes) {
      if (pedido.idEstudianteExterno === null) {
        throw new ReglaNegocioError(MENSAJES_ALTA_DIRECTORA.estudianteSinId);
      }
      return pedido.idEstudianteExterno;
    }

    let deAsisco: bigint | null;
    try {
      deAsisco = await this.estudiantes.porIdUsuarioAuth(
        pedido.idUsuarioAuth,
        token,
      );
    } catch (err) {
      if (err instanceof ServicioExternoNoDisponibleError) {
        throw new ServicioExternoNoDisponibleError(
          MENSAJES_ALTA_DIRECTORA.asiscoNoResponde,
        );
      }
      throw err;
    }
    if (deAsisco === null) {
      throw new ReglaNegocioError(MENSAJES_ALTA_DIRECTORA.estudianteNoEnAsisco);
    }
    if (
      pedido.idEstudianteExterno !== null &&
      pedido.idEstudianteExterno !== deAsisco
    ) {
      throw new ReglaNegocioError(MENSAJES_ALTA_DIRECTORA.estudianteNoCoincide);
    }
    return deAsisco;
  }
}
