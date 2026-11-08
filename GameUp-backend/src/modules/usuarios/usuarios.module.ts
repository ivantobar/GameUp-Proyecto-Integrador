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
 * Cuentas de GameUP (copia mínima de las personas). Exporta UsuarioService
 * (el login da de alta con él), los puertos de lectura y escritura (el login
 * sincroniza la copia) y la consulta de niveles.
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
  exports: [
    // El alta automática del primer login reutiliza UsuarioService.crear.
    UsuarioService,
    USUARIO_LECTURA_REPOSITORY,
    USUARIO_ESCRITURA_REPOSITORY,
    NIVEL_CONSULTA,
  ],
})
export class UsuariosModule {}
