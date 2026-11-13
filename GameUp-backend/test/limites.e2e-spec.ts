import type { INestApplication } from '@nestjs/common';
import { getOptionsToken } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type {
  IdentidadExterna,
  VerificadorToken,
} from '../src/common/auth/verificador-token.js';
import { NoAutenticadoError } from '../src/common/errors/dominio.errors.js';
import {
  crearOpcionesLimites,
  MENSAJE_DEMASIADAS_PETICIONES,
  type LimitesPeticiones,
} from '../src/common/limites/limites.js';
import { VERIFICADOR_TOKEN } from '../src/common/auth/verificador-token.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';

/** Cuenta cuántas veces se consultó la "API central" (ningún token es válido). */
class VerificadorQueCuenta implements VerificadorToken {
  llamadas = 0;
  async verificar(): Promise<IdentidadExterna> {
    this.llamadas++;
    throw new NoAutenticadoError('Tu sesión no es válida o venció.');
  }
}

/** Límites bajos para probar (los de verdad vienen de THROTTLE_*). */
function limites(cambios: Partial<LimitesPeticiones> = {}): LimitesPeticiones {
  return {
    global: { limite: 1000, ventanaSeg: 60 },
    login: { limite: 3, ventanaSeg: 60 },
    loginIp: { limite: 5, ventanaSeg: 60 },
    ...cambios,
  };
}

async function crearApp(
  valores: LimitesPeticiones,
  verificador?: VerificadorToken,
): Promise<INestApplication<App>> {
  return crearAppDePrueba({
    reemplazos: [
      { provide: getOptionsToken(), useValue: crearOpcionesLimites(valores) },
      ...(verificador
        ? [{ provide: VERIFICADOR_TOKEN, useValue: verificador }]
        : []),
    ],
  });
}

function login(app: INestApplication<App>, correo: string, ip?: string) {
  const peticion = request(app.getHttpServer()).post('/api/v1/auth/login');
  if (ip) peticion.set('X-Forwarded-For', ip);
  return peticion.send({ correo, contrasena: 'equivocada' });
}

describe('Límite de peticiones (e2e)', () => {
  describe('login por IP + correo', () => {
    let app: INestApplication<App>;
    beforeAll(async () => {
      // Tope por IP alto aquí: este bloque prueba solo la clave IP + correo.
      app = await crearApp(
        limites({ loginIp: { limite: 50, ventanaSeg: 60 } }),
      );
    });
    afterAll(async () => {
      await app.close();
    });

    it('el intento 4 con el mismo correo da 429 con Retry-After y el formato de errores', async () => {
      for (let i = 0; i < 3; i++) {
        await login(app, 'ana@ejemplo.com').expect(401);
      }
      const res = await login(app, 'ana@ejemplo.com').expect(429);
      expect(res.body).toEqual({
        statusCode: 429,
        error: 'Too Many Requests',
        message: MENSAJE_DEMASIADAS_PETICIONES,
      });
      expect(Number(res.headers['retry-after'])).toBeGreaterThanOrEqual(1);
    });

    it('el mismo correo con mayúsculas y espacios cuenta igual', async () => {
      await login(app, '  ANA@Ejemplo.com ').expect(429);
    });

    it('otro correo desde la misma IP sigue pudiendo intentar', async () => {
      await login(app, 'beto@ejemplo.com').expect(401);
    });
  });

  it('tope por IP en el login: el intento 6 desde una IP da 429 aunque cambie el correo', async () => {
    const app = await crearApp(limites());
    try {
      for (let i = 0; i < 5; i++) {
        await login(app, `persona${i}@ejemplo.com`).expect(401);
      }
      await login(app, 'otra@ejemplo.com').expect(429);
    } finally {
      await app.close();
    }
  });

  it('detrás del proxy (trust proxy) cuenta la IP real del cliente, no la del proxy', async () => {
    const app = await crearApp(limites());
    // Igual que en Render con TRUST_PROXY_HOPS=1.
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    try {
      for (let i = 0; i < 5; i++) {
        await login(app, `persona${i}@ejemplo.com`, '203.0.113.1').expect(401);
      }
      await login(app, 'otra@ejemplo.com', '203.0.113.1').expect(429);
      // Otro celular (otra IP real) detrás del mismo proxy no se bloquea.
      await login(app, 'otra@ejemplo.com', '203.0.113.2').expect(401);
    } finally {
      await app.close();
    }
  });

  describe('límite global por IP', () => {
    let app: INestApplication<App>;
    const verificador = new VerificadorQueCuenta();
    beforeAll(async () => {
      app = await crearApp(
        limites({ global: { limite: 5, ventanaSeg: 60 } }),
        verificador,
      );
    });
    afterAll(async () => {
      await app.close();
    });

    it('GET /health no tiene límite', async () => {
      for (let i = 0; i < 8; i++) {
        await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      }
    });

    it('tokens inventados: tras el límite, 429 sin consultar la API central', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer inventado-${i}`)
          .expect(401);
      }
      expect(verificador.llamadas).toBe(5);
      const res = await request(app.getHttpServer())
        .get('/api/v1/estudiantes')
        .set('Authorization', 'Bearer inventado-6')
        .expect(429);
      expect(res.body.message).toBe(MENSAJE_DEMASIADAS_PETICIONES);
      // El límite global va antes del AuthGuard: no hubo otra consulta.
      expect(verificador.llamadas).toBe(5);
    });
  });
});
