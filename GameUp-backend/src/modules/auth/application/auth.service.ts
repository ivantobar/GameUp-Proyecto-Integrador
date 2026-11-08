import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  RESOLUTOR_USUARIO,
  type ResolutorUsuario,
} from '../../../common/auth/resolutor-usuario.js';
import { leerExpiracionJwt } from '../../../common/auth/seguridad-api/jwt.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  INVALIDADOR_TOKEN,
  VERIFICADOR_TOKEN,
  type InvalidadorToken,
  type VerificadorToken,
} from '../../../common/auth/verificador-token.js';
import {
  AccesoDenegadoError,
  NoAutenticadoError,
} from '../../../common/errors/dominio.errors.js';
import { RELOJ, type Reloj } from '../../../common/reloj/reloj.js';
import {
  SINCRONIZADOR_VINCULOS,
  type SincronizadorVinculos,
} from '../../estudiantes/domain/vinculos-externos.js';
import { copiaDesdeIdentidad } from '../../usuarios/domain/copia-externa.js';
import type { Usuario } from '../../usuarios/domain/usuario.entity.js';
import {
  USUARIO_ESCRITURA_REPOSITORY,
  USUARIO_LECTURA_REPOSITORY,
  type UsuarioEscrituraRepository,
  type UsuarioLecturaRepository,
} from '../../usuarios/domain/usuario.repository.js';
import {
  AUTENTICADOR_EXTERNO,
  type AutenticadorExterno,
} from '../domain/autenticador-externo.js';

/** Resultado de iniciar sesión. */
export interface SesionIniciada {
  /** El JWT de la API de seguridad (GameUP no emite tokens propios). */
  token: string;
  expiraEn: Date | null;
  usuario: Usuario;
}

/**
 * Casos de uso de sesión:
 *  - iniciarSesion: credenciales → API de seguridad → token → perfil →
 *    cuenta de GameUP (403 si no hay o el rol no coincide) → sincroniza la
 *    copia mínima (nombres, apellidos, correo, ultimo_acceso, sincronizado_en).
 *    Si es ACUDIENTE y ASISCO UP está conectado, refresca también la copia
 *    de sus vínculos con estudiantes (sin bloquear el login si falla).
 *  - sesionActual: la cuenta de quien hace la petición.
 *  - cerrarSesion: olvida el token de la caché.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AUTENTICADOR_EXTERNO)
    private readonly autenticador: AutenticadorExterno,
    @Inject(VERIFICADOR_TOKEN) private readonly verificador: VerificadorToken,
    @Inject(INVALIDADOR_TOKEN) private readonly invalidador: InvalidadorToken,
    @Inject(RESOLUTOR_USUARIO) private readonly resolutor: ResolutorUsuario,
    @Inject(USUARIO_LECTURA_REPOSITORY)
    private readonly lectura: UsuarioLecturaRepository,
    @Inject(USUARIO_ESCRITURA_REPOSITORY)
    private readonly escritura: UsuarioEscrituraRepository,
    @Inject(RELOJ) private readonly reloj: Reloj,
    @Optional()
    @Inject(SINCRONIZADOR_VINCULOS)
    private readonly vinculos: SincronizadorVinculos | null = null,
  ) {}

  async iniciarSesion(
    correo: string,
    contrasena: string,
  ): Promise<SesionIniciada> {
    const token = await this.autenticador.iniciarSesion(correo, contrasena);
    // Verificar aquí también deja el token en la caché para las siguientes peticiones.
    const identidad = await this.verificador.verificar(token);
    const autenticado = await this.resolutor.resolver(identidad);

    try {
      await this.escritura.sincronizarCopia(
        autenticado.id,
        copiaDesdeIdentidad(identidad),
        this.reloj.ahora(),
      );
    } catch {
      // La copia es secundaria: un fallo aquí no impide entrar.
      this.logger.warn(
        `No se pudo sincronizar la copia mínima (usuario ${autenticado.id})`,
      );
    }

    if (autenticado.rol === 'ACUDIENTE' && this.vinculos) {
      try {
        await this.vinculos.sincronizarAcudiente(autenticado, token);
      } catch {
        // Se conserva la copia anterior: ASISCO UP puede estar dormido.
        this.logger.warn(
          `No se pudieron actualizar los vínculos desde ASISCO UP (usuario ${autenticado.id})`,
        );
      }
    }

    const usuario = await this.lectura.buscarPorId(autenticado.id);
    if (!usuario) {
      throw new AccesoDenegadoError(
        'Tu cuenta aún no está registrada en GameUP.',
      );
    }
    return { token, expiraEn: leerExpiracionJwt(token), usuario };
  }

  async sesionActual(actual: UsuarioAutenticado): Promise<Usuario> {
    const usuario = await this.lectura.buscarPorId(actual.id);
    if (!usuario) throw new NoAutenticadoError();
    return usuario;
  }

  /**
   * La API de seguridad es la dueña del token: GameUP no puede revocarlo,
   * solo dejar de recordarlo. Si la API lo revoca, la próxima petición
   * vuelve a /perfil y recibe 401 sin esperar los 5 minutos de la caché.
   */
  cerrarSesion(token: string): void {
    this.invalidador.olvidar(token);
  }
}
