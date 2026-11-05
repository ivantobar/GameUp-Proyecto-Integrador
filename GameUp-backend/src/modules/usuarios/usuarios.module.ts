import { Module } from '@nestjs/common';
import { UsuarioService } from './application/usuario.service.js';
import {
  NIVEL_CONSULTA,
  USUARIO_ESCRITURA_REPOSITORY,
  USUARIO_LECTURA_REPOSITORY,
} from './domain/usuario.repository.js';
import {
  PrismaNivelConsulta,
  PrismaUsuarioRepository,
} from './infrastructure/prisma-usuario.repository.js';
import { UsuarioController } from './presentation/usuario.controller.js';

/**
 * Cuentas de GameUP (copia mínima de las personas). Exporta los puertos de
 * lectura y escritura para que el login sincronice la copia.
 */
@Module({
  controllers: [UsuarioController],
  providers: [
    UsuarioService,
    PrismaUsuarioRepository,
    {
      provide: USUARIO_LECTURA_REPOSITORY,
      useExisting: PrismaUsuarioRepository,
    },
    {
      provide: USUARIO_ESCRITURA_REPOSITORY,
      useExisting: PrismaUsuarioRepository,
    },
    { provide: NIVEL_CONSULTA, useClass: PrismaNivelConsulta },
  ],
  exports: [USUARIO_LECTURA_REPOSITORY, USUARIO_ESCRITURA_REPOSITORY],
})
export class UsuariosModule {}
