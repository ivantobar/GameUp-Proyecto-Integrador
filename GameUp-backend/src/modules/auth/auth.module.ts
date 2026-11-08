import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { RESOLUTOR_USUARIO } from '../../common/auth/resolutor-usuario.js';
import {
  ALTA_AUTOMATICA_ROLES_POR_DEFECTO,
  leerRolesAltaAutomatica,
} from '../../common/auth/roles-alta-automatica.js';
import type { RolGameUp } from '../../common/auth/usuario-autenticado.js';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { VerificadorTokenPerfil } from '../../common/auth/seguridad-api/verificador-token-perfil.js';
import {
  INVALIDADOR_TOKEN,
  VERIFICADOR_TOKEN,
} from '../../common/auth/verificador-token.js';
import { EstudiantesModule } from '../estudiantes/estudiantes.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import {
  AltaAutomaticaService,
  ROLES_ALTA_AUTOMATICA,
} from './application/alta-automatica.service.js';
import { AuthService } from './application/auth.service.js';
import { ResolutorUsuarioService } from './application/resolutor-usuario.service.js';
import { AUTENTICADOR_EXTERNO } from './domain/autenticador-externo.js';
import { CUENTA_REPOSITORY } from './domain/cuenta.repository.js';
import { AutenticadorSeguridadHttp } from './infrastructure/autenticador-seguridad-http.js';
import { PrismaCuentaRepository } from './infrastructure/prisma-cuenta.repository.js';
import { AuthController } from './presentation/auth.controller.js';

/**
 * Roles con alta automática en el primer login (ALTA_AUTOMATICA_ROLES).
 * env.validation ya rechazó valores inválidos; vacía → [] (apagada).
 * Se exporta para probarla sin levantar Nest.
 */
export function crearRolesAltaAutomatica(
  config: ConfigService<EnvironmentVariables, true>,
): RolGameUp[] {
  const valor =
    config.get('ALTA_AUTOMATICA_ROLES', { infer: true }) ??
    ALTA_AUTOMATICA_ROLES_POR_DEFECTO;
  const lectura = leerRolesAltaAutomatica(valor);
  return lectura.ok ? lectura.roles : [];
}

/**
 * Autenticación. Registra los guards globales (en este orden):
 *   AuthGuard  → token válido + cuenta de GameUP (401/403/503)
 *   RolesGuard → @Roles(...) de la ruta (403)
 * y las rutas /auth/login (pública), /auth/me y /auth/logout.
 */
@Module({
  imports: [UsuariosModule, EstudiantesModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AltaAutomaticaService,
    {
      provide: ROLES_ALTA_AUTOMATICA,
      inject: [ConfigService],
      useFactory: crearRolesAltaAutomatica,
    },
    { provide: VERIFICADOR_TOKEN, useClass: VerificadorTokenPerfil },
    // El mismo adaptador sabe olvidar tokens de su caché (logout).
    { provide: INVALIDADOR_TOKEN, useExisting: VERIFICADOR_TOKEN },
    { provide: AUTENTICADOR_EXTERNO, useClass: AutenticadorSeguridadHttp },
    { provide: CUENTA_REPOSITORY, useClass: PrismaCuentaRepository },
    { provide: RESOLUTOR_USUARIO, useClass: ResolutorUsuarioService },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [VERIFICADOR_TOKEN, RESOLUTOR_USUARIO],
})
export class AuthModule {}
