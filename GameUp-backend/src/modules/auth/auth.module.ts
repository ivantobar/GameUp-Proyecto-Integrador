import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { RESOLUTOR_USUARIO } from '../../common/auth/resolutor-usuario.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { VerificadorTokenPerfil } from '../../common/auth/seguridad-api/verificador-token-perfil.js';
import {
  INVALIDADOR_TOKEN,
  VERIFICADOR_TOKEN,
} from '../../common/auth/verificador-token.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AuthService } from './application/auth.service.js';
import { ResolutorUsuarioService } from './application/resolutor-usuario.service.js';
import { AUTENTICADOR_EXTERNO } from './domain/autenticador-externo.js';
import { CUENTA_REPOSITORY } from './domain/cuenta.repository.js';
import { AutenticadorSeguridadHttp } from './infrastructure/autenticador-seguridad-http.js';
import { PrismaCuentaRepository } from './infrastructure/prisma-cuenta.repository.js';
import { AuthController } from './presentation/auth.controller.js';

/**
 * Autenticación. Registra los guards globales (en este orden):
 *   AuthGuard  → token válido + cuenta de GameUP (401/403/503)
 *   RolesGuard → @Roles(...) de la ruta (403)
 * y las rutas /auth/login (pública), /auth/me y /auth/logout.
 */
@Module({
  imports: [UsuariosModule],
  controllers: [AuthController],
  providers: [
    AuthService,
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
