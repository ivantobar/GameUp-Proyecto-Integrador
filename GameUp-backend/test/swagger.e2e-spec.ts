import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SupabaseService } from '../src/supabase/supabase.service.js';

describe('Swagger (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
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

  it('GET /api-docs sirve la página de Swagger UI', async () => {
    const res = await request(app.getHttpServer())
      .get('/api-docs')
      .redirects(1)
      .expect(200);
    expect(res.text).toContain('swagger-ui');
  });

  it('GET /api-docs.json sirve la especificación OpenAPI 3', async () => {
    const res = await request(app.getHttpServer())
      .get('/api-docs.json')
      .expect(200);

    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.info.title).toBe('GameUP API');
    // Las rutas documentadas incluyen el prefijo global.
    expect(res.body.paths['/api/v1/health']).toBeDefined();
    expect(res.body.components.securitySchemes.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
  });
});
