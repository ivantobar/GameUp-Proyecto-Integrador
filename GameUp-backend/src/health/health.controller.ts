import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/auth/decoradores.js';
import {
  PrismaService,
  type DatabaseStatus,
} from '../prisma/prisma.service.js';
import {
  SupabaseService,
  type SupabaseStatus,
} from '../supabase/supabase.service.js';

export interface HealthResponse {
  status: 'ok';
  service: 'gameup-backend';
  timestamp: string;
  database: DatabaseStatus;
  supabase: SupabaseStatus;
}

/**
 * GET /api/v1/health — permite comprobar que la API está viva.
 * Útil también para verificar desde el celular que la app llega al backend.
 */
@ApiTags('health')
// Sin token: Render y el celular lo usan para saber si la API está viva.
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Comprueba que la API está viva',
    description:
      'Responde siempre 200 si el servidor está arriba e indica si la base de datos y Supabase responden.',
  })
  @ApiOkResponse({
    description: 'Estado del backend',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok'], example: 'ok' },
        service: {
          type: 'string',
          enum: ['gameup-backend'],
          example: 'gameup-backend',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2026-11-05T12:00:00.000Z',
        },
        database: {
          type: 'string',
          enum: ['conectada', 'error'],
          example: 'conectada',
        },
        supabase: {
          type: 'string',
          enum: ['conectado', 'error', 'no_configurado'],
          example: 'no_configurado',
        },
      },
    },
  })
  async check(): Promise<HealthResponse> {
    const [database, supabase] = await Promise.all([
      this.prisma.checkConnection(),
      this.supabase.checkConnection(),
    ]);
    return {
      status: 'ok',
      service: 'gameup-backend',
      timestamp: new Date().toISOString(),
      database,
      supabase,
    };
  }
}
