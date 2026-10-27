import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SupabaseService } from '../src/supabase/supabase.service.js';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      // Las pruebas no dependen de una base de datos ni de un Supabase reales.
      .overrideProvider(PrismaService)
      .useValue({ checkConnection: async () => 'conectada' })
      .overrideProvider(SupabaseService)
      .useValue({ checkConnection: async () => 'no_configurado' })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health responde 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'gameup-backend',
      database: 'conectada',
      supabase: 'no_configurado',
    });
    // helmet agrega cabeceras de seguridad
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('las rutas sin prefijo no existen', async () => {
    await request(app.getHttpServer()).get('/health').expect(404);
  });

  it('CORS está desactivado por defecto (app móvil)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'http://sitio-externo.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
