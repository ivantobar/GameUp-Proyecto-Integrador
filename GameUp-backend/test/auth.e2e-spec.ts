import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  type INestApplication,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  Public,
  Roles,
  UsuarioActual,
} from '../src/common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../src/common/auth/usuario-autenticado.js';
import type {
  IdentidadExterna,
  VerificadorToken,
} from '../src/common/auth/verificador-token.js';
import {
  RecursoNoEncontradoError,
  ServicioExternoNoDisponibleError,
} from '../src/common/errors/dominio.errors.js';
import { ParseBigIntPipe } from '../src/common/pipes/parse-bigint.pipe.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { Cuenta } from '../src/modules/auth/domain/cuenta.entity.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';
import { CuentaRepositoryEnMemoria } from './dobles/cuentas-en-memoria.js';
import {
  identidad,
  VerificadorTokenFalso,
} from './dobles/verificador-token-falso.js';

class EcoDto {
  @IsString()
  @MinLength(1)
  texto: string;
}

/** Controlador SOLO de prueba: ejercita guards, pipe y filtro de errores. */
@Controller('prueba')
class PruebaController {
  @Public()
  @Get('publica')
  publica() {
    return { ok: true };
  }

  @Get('yo')
  yo(@UsuarioActual() usuario: UsuarioAutenticado) {
    return { id: usuario.id.toString(), rol: usuario.rol };
  }

  @Roles('DIRECTORA')
  @Get('solo-directora')
  soloDirectora() {
    return { ok: true };
  }

  @Get('estudiantes/:id')
  estudiante(@Param('id', ParseBigIntPipe) id: bigint) {
    // Simula un estudiante ajeno: el servicio responde "no existe".
    if (id === 99n)
      throw new RecursoNoEncontradoError('El estudiante no existe.');
    return { id: id.toString() };
  }

  @Get('falla-base')
  fallaBase() {
    throw new Prisma.PrismaClientKnownRequestError(
      'El usuario 5 no tiene asignado al estudiante 7 (asignacion.asignado_por)',
      {
        code: 'P2039',
        clientVersion: '7.10.1',
        meta: {
          driverAdapterError: {
            cause: { kind: 'postgres', originalCode: '42501' },
          },
        },
      },
    );
  }

  @Get('falla-inesperada')
  fallaInesperada() {
    throw new Error('select * from usuario');
  }

  @Post('eco')
  eco(@Body() dto: EcoDto) {
    return dto;
  }
}

const TOKENS: Record<string, IdentidadExterna> = {
  'token-directora': identidad(100, ['ADMIN']),
  'token-tallerista': identidad(200, ['DONANTE', 'TALLERISTA']),
  'token-donante': identidad(300, ['DONANTE']),
  'token-sin-cuenta': identidad(400, ['ACUDIENTE']),
  'token-rol-distinto': identidad(200, ['ACUDIENTE']),
  'token-inactivo': identidad(500, ['ESTUDIANTE']),
};

const cuentas = new CuentaRepositoryEnMemoria([
  new Cuenta(1n, 100n, 'DIRECTORA', true),
  new Cuenta(2n, 200n, 'TALLERISTA', true),
  new Cuenta(5n, 500n, 'ESTUDIANTE', false),
]);

describe('Base común: autenticación, roles y errores (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await crearAppDePrueba({
      verificador: new VerificadorTokenFalso(TOKENS),
      cuentas,
      controllers: [PruebaController],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const get = (ruta: string, token?: string) => {
    const req = request(app.getHttpServer()).get(`/api/v1${ruta}`);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  describe('rutas públicas', () => {
    it('health no exige token', async () => {
      await get('/health').expect(200);
    });

    it('@Public() no exige token', async () => {
      await get('/prueba/publica').expect(200, { ok: true });
    });
  });

  describe('401: sin token o token inválido', () => {
    it('sin encabezado Authorization → 401 con la respuesta uniforme', async () => {
      const res = await get('/prueba/yo').expect(401);
      expect(res.body).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: expect.stringContaining('Bearer'),
      });
    });

    it('esquema distinto de Bearer → 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/prueba/yo')
        .set('Authorization', 'Basic abc')
        .expect(401);
    });

    it('token que la API de seguridad rechaza → 401', async () => {
      await get('/prueba/yo', 'token-falso').expect(401);
    });
  });

  describe('403: cuenta o rol sin acceso', () => {
    it('DONANTE → 403', async () => {
      const res = await get('/prueba/yo', 'token-donante').expect(403);
      expect(res.body.message).toBe('Tu cuenta no tiene acceso a GameUP.');
    });

    it('autenticado afuera pero sin fila en GameUP → 403 con mensaje claro', async () => {
      const res = await get('/prueba/yo', 'token-sin-cuenta').expect(403);
      expect(res.body.message).toMatch(/aún no está registrada en GameUP/);
    });

    it('rol externo distinto al local → 403', async () => {
      const res = await get('/prueba/yo', 'token-rol-distinto').expect(403);
      expect(res.body.message).toMatch(/no coincide/);
    });

    it('cuenta inactiva → 403', async () => {
      await get('/prueba/yo', 'token-inactivo').expect(403);
    });

    it('@Roles(DIRECTORA) con una tallerista → 403', async () => {
      const res = await get(
        '/prueba/solo-directora',
        'token-tallerista',
      ).expect(403);
      expect(res.body).toEqual({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Tu rol no tiene acceso a esta acción.',
      });
    });
  });

  describe('caso feliz', () => {
    it('@UsuarioActual() entrega id interno (como texto) y rol', async () => {
      await get('/prueba/yo', 'token-tallerista').expect(200, {
        id: '2',
        rol: 'TALLERISTA',
      });
    });

    it('@Roles(DIRECTORA) con la directora → 200', async () => {
      await get('/prueba/solo-directora', 'token-directora').expect(200);
    });
  });

  describe('validación y errores', () => {
    it('ParseBigIntPipe: id inválido → 400', async () => {
      const res = await get(
        '/prueba/estudiantes/abc',
        'token-directora',
      ).expect(400);
      expect(res.body.statusCode).toBe(400);
      await get('/prueba/estudiantes/12', 'token-directora').expect(200, {
        id: '12',
      });
    });

    it('estudiante ajeno → 404 sin confirmar que existe', async () => {
      await get('/prueba/estudiantes/99', 'token-tallerista').expect(404, {
        statusCode: 404,
        error: 'Not Found',
        message: 'El estudiante no existe.',
      });
    });

    it('DTO inválido → 400 con la lista de mensajes', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/prueba/eco')
        .set('Authorization', 'Bearer token-directora')
        .send({ texto: '', extra: 1 })
        .expect(400);
      expect(res.body.error).toBe('Bad Request');
      expect(res.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('extra')]),
      );
    });

    it('trigger de vínculo (42501) → 403 sin reenviar ids ni SQL', async () => {
      const res = await get('/prueba/falla-base', 'token-directora').expect(
        403,
      );
      expect(JSON.stringify(res.body)).not.toMatch(
        /usuario 5|estudiante 7|asignado_por/,
      );
    });

    it('error inesperado → 500 genérico, sin traza', async () => {
      const res = await get(
        '/prueba/falla-inesperada',
        'token-directora',
      ).expect(500);
      expect(res.body).toEqual({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Ocurrió un error inesperado. Intenta de nuevo.',
      });
    });

    it('ruta inexistente → 404 con la respuesta uniforme', async () => {
      const res = await get('/no-existe', 'token-directora').expect(404);
      expect(res.body).toMatchObject({ statusCode: 404, error: 'Not Found' });
    });
  });
});

describe('API de seguridad caída (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const caido: VerificadorToken = {
      verificar: async () => {
        throw new ServicioExternoNoDisponibleError(
          'La API de seguridad no responde.',
        );
      },
    };
    app = await crearAppDePrueba({
      verificador: caido,
      controllers: [PruebaController],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('una ruta protegida responde 503 y health sigue respondiendo', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/prueba/yo')
      .set('Authorization', 'Bearer x')
      .expect(503, {
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'La API de seguridad no responde.',
      });
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });
});
