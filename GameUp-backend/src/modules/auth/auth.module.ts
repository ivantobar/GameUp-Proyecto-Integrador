import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { RESOLUTOR_USUARIO } from '../../common/auth/resolutor-usuario.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { VerificadorTokenPerfil } from '../../common/auth/seguridad-api/verificador-token-perfil.js';
import { VERIFICADOR_TOKEN } from '../../common/auth/verificador-token.js';
import { ResolutorUsuarioService } from './application/resolutor-usuario.service.js';
import { CUENTA_REPOSITORY } from './domain/cuenta.repository.js';
import { PrismaCuentaRepository } from './infrastructure/prisma-cuenta.repository.js';

/**
 * Autenticación. Registra los guards globales (en este orden):
 *   AuthGuard  → token válido + cuenta de GameUP (401/403/503)
 *   RolesGuard → @Roles(...) de la ruta (403)
 * Las rutas sin token se marcan con @Public().
 */
@Module({
  providers: [
    { provide: VERIFICADOR_TOKEN, useClass: VerificadorTokenPerfil },
    { provide: CUENTA_REPOSITORY, useClass: PrismaCuentaRepository },
    { provide: RESOLUTOR_USUARIO, useClass: ResolutorUsuarioService },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [VERIFICADOR_TOKEN, RESOLUTOR_USUARIO],
})
export class AuthModule {}
