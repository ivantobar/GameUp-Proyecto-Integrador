import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
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
  /** `error` (y HTTP 503) solo cuando la base de datos no responde. */
  status: 'ok' | 'error';
  service: 'gameup-backend';
  timestamp: string;
  database: DatabaseStatus;
  supabase: SupabaseStatus;
}

/**
 * GET /api/v1/health — permite comprobar que la API está viva.
 * Útil también para verificar desde el celular que la app llega al backend.
 *
 * 200 si la base de datos responde; 503 (mismo cuerpo, `status: 'error'`) si
 * no, para que Render no dé por bueno un despliegue sin base. Supabase y las
 * APIs externas son solo informativos: nunca cambian el código.
 */
/** Esquema de la respuesta (el mismo con 200 y con 503). */
const ESQUEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['ok', 'error'], example: 'ok' },
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
      example: 'conectado',
    },
  },
};

@ApiTags('health')
// Sin token: Render y el celular lo usan para saber si la API está viva.
@Public()
// Sin límite de peticiones: Render lo consulta seguido.
@SkipThrottle()
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
      'Responde 200 si la base de datos responde y 503 (con el mismo cuerpo y ' +
      '`status: "error"`) si no. `supabase` es informativo (lee el bucket privado ' +
      '`grabaciones`; `error` si no responde o si el bucket es público) y no cambia ' +
      'el código. Se recuerda 60 s. La API de seguridad y ASISCO UP no se consultan.',
  })
  @ApiOkResponse({ description: 'La base de datos responde', schema: ESQUEMA })
  @ApiServiceUnavailableResponse({
    description: 'La base de datos no responde (status: "error")',
    schema: ESQUEMA,
  })
  async check(
    @Res({ passthrough: true }) res: Pick<Response, 'status'>,
  ): Promise<HealthResponse> {
    const [database, supabase] = await Promise.all([
      this.prisma.checkConnection(),
      this.supabase.checkConnection(),
    ]);
    const sana = database === 'conectada';
    res.status(sana ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: sana ? 'ok' : 'error',
      service: 'gameup-backend',
      timestamp: new Date().toISOString(),
      database,
      supabase,
    };
  }
}
