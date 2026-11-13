import { Test } from '@nestjs/testing';
import type { DatabaseStatus } from '../prisma/prisma.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SupabaseStatus } from '../supabase/supabase.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { HealthController } from './health.controller.js';

async function crear(database: DatabaseStatus, supabase: SupabaseStatus) {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      {
        provide: PrismaService,
        useValue: { checkConnection: async () => database },
      },
      {
        provide: SupabaseService,
        useValue: { checkConnection: async () => supabase },
      },
    ],
  }).compile();
  return moduleRef.get(HealthController);
}

/** Respuesta de Express mínima: solo anota el código. */
function respuesta() {
  const res = {
    codigo: 0,
    status(codigo: number) {
      res.codigo = codigo;
      return res;
    },
  };
  return res;
}

describe('HealthController', () => {
  it('200 con la base conectada; informa el estado de Supabase', async () => {
    const res = respuesta();
    const result = await (
      await crear('conectada', 'no_configurado')
    ).check(res as never);
    expect(res.codigo).toBe(200);
    expect(result).toMatchObject({
      status: 'ok',
      service: 'gameup-backend',
      database: 'conectada',
      supabase: 'no_configurado',
    });
  });

  it('503 con la base caída, con el mismo cuerpo y status "error"', async () => {
    const res = respuesta();
    const result = await (
      await crear('error', 'conectado')
    ).check(res as never);
    expect(res.codigo).toBe(503);
    expect(result).toMatchObject({
      status: 'error',
      service: 'gameup-backend',
      database: 'error',
      supabase: 'conectado',
    });
  });

  it('Supabase caído no cambia el código: sigue 200', async () => {
    const res = respuesta();
    const result = await (
      await crear('conectada', 'error')
    ).check(res as never);
    expect(res.codigo).toBe(200);
    expect(result).toMatchObject({ status: 'ok', supabase: 'error' });
  });
});
