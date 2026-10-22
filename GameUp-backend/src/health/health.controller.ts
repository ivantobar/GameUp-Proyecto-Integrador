import { Controller, Get } from '@nestjs/common';
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
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  @Get()
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
