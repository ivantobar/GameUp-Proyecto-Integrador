import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import type { EnvironmentVariables } from '../config/env.validation.js';

export type DatabaseStatus = 'conectada' | 'error';

/**
 * Cliente de Prisma para toda la app (mismo esquema que proyecto-integrador-backend:
 * Prisma 7 + @prisma/adapter-pg + DATABASE_URL).
 *
 * Uso en otros servicios:
 *   constructor(private readonly prisma: PrismaService) {}
 *   this.prisma.estudiante.findMany(...)
 *
 * Se conecta como dueño de la base de datos (salta RLS), así que los permisos
 * por rol SIEMPRE se verifican en NestJS antes de consultar.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    const adapter = new PrismaPg({
      connectionString: config.get('DATABASE_URL', { infer: true }),
    });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    // Con el adaptador pg, $connect() no abre la conexión; una consulta sí.
    if ((await this.checkConnection()) === 'conectada') {
      this.logger.log('Conectado a PostgreSQL');
    } else {
      // No detenemos la app: /api/v1/health mostrará "database": "error".
      this.logger.error(
        'No se pudo conectar a PostgreSQL. Revisa DATABASE_URL en .env y que la base de datos esté encendida.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Consulta mínima (SELECT 1) para saber si la base de datos responde. */
  async checkConnection(): Promise<DatabaseStatus> {
    try {
      await this.$queryRaw`SELECT 1`;
      return 'conectada';
    } catch {
      return 'error';
    }
  }
}
