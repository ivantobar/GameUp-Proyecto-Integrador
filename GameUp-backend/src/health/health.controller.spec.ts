import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('responde ok e informa el estado de la base de datos y Supabase', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: { checkConnection: async () => 'conectada' },
        },
        {
          provide: SupabaseService,
          useValue: { checkConnection: async () => 'no_configurado' },
        },
      ],
    }).compile();

    const result = await moduleRef.get(HealthController).check();

    expect(result).toMatchObject({
      status: 'ok',
      service: 'gameup-backend',
      database: 'conectada',
      supabase: 'no_configurado',
    });
  });
});
