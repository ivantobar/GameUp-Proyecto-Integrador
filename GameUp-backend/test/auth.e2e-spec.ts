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
import { ROLES_ALTA_AUTOMATICA } from '../src/modules/auth/application/alta-automatica.service.js';
import { Cuenta } from '../src/modules/auth/domain/cuenta.entity.js';
import { CONSULTA_ESTUDIANTE_EXTERNO } from '../src/modules/estudiantes/domain/estudiante-externo.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';
import { AutenticadorFalso } from './dobles/autenticador-falso.js';
import { CuentaRepositoryEnMemoria } from './dobles/cuentas-en-memoria.js';
import { UsuariosEnMemoria } from './dobles/usuarios-en-memoria.js';
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

describe('Alta automática al primer login (e2e)', () => {
  let app: INestApplication<App>;
  let usuarios: UsuariosEnMemoria;
  const consultaAsisco = {
    porIdUsuarioAuth: vi.fn(async (id: bigint) => (id === 1000n ? 77n : null)),
  };

  const NUEVAS: Record<string, IdentidadExterna> = {
    'token-tallerista-nueva': identidad(700, ['TALLERISTA'], {
      nombres: 'Tallerista',
      apellidos: 'Nueva',
      correo: 'tallerista.nueva@ejemplo.com',
    }),
    'token-acudiente-nuevo': identidad(800, ['ACUDIENTE']),
    'token-directora-nueva': identidad(900, ['ADMIN']),
    'token-estudiante-nuevo': identidad(1000, ['ESTUDIANTE']),
    'token-solo-guard': identidad(1100, ['ACUDIENTE']),
  };
  const credenciales = Object.fromEntries(
    Object.keys(NUEVAS).map((token) => [
      `${token}@ejemplo.com`,
      { contrasena: 'clave', token },
    ]),
  );

  beforeAll(async () => {
    usuarios = new UsuariosEnMemoria();
    app = await crearAppDePrueba({
      verificador: new VerificadorTokenFalso(NUEVAS),
      autenticador: new AutenticadorFalso(credenciales),
      usuarios,
      controllers: [PruebaController],
      reemplazos: [
        { provide: CONSULTA_ESTUDIANTE_EXTERNO, useValue: consultaAsisco },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const login = (token: string) =>
    request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ correo: `${token}@ejemplo.com`, contrasena: 'clave' });
  const deAuth = (id: bigint) =>
    usuarios.todos().filter((u) => u.idUsuarioAuth === id);

  it('el AuthGuard NO crea cuentas: sin fila, cualquier petición sigue en 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/prueba/yo')
      .set('Authorization', 'Bearer token-solo-guard')
      .expect(403);
    expect(res.body.message).toMatch(/aún no está registrada en GameUP/);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer token-solo-guard')
      .expect(403);
    expect(usuarios.todos()).toHaveLength(0);
  });

  it('primer login de una tallerista: crea la cuenta y devuelve el token', async () => {
    const res = await login('token-tallerista-nueva').expect(200);
    expect(res.body).toMatchObject({
      token: 'token-tallerista-nueva',
      usuario: { role: 'teacher', displayName: 'Tallerista Nueva' },
    });
    const [cuenta] = deAuth(700n);
    expect(cuenta).toMatchObject({
      rol: 'TALLERISTA',
      nombres: 'Tallerista',
      apellidos: 'Nueva',
      correo: 'tallerista.nueva@ejemplo.com',
      activo: true,
      estudiante: null,
    });
    expect(res.body.usuario.userId).toBe(cuenta?.id.toString());
  });

  it('segundo login: entra a la misma cuenta, sin crear otra', async () => {
    await login('token-tallerista-nueva').expect(200);
    expect(deAuth(700n)).toHaveLength(1);
  });

  it('después del alta, el guard acepta su token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/prueba/yo')
      .set('Authorization', 'Bearer token-tallerista-nueva')
      .expect(200);
  });

  it('acudiente y directora (ADMIN) también se crean', async () => {
    const acudiente = await login('token-acudiente-nuevo').expect(200);
    expect(acudiente.body.usuario.role).toBe('guardian');
    const directora = await login('token-directora-nueva').expect(200);
    expect(directora.body.usuario.role).toBe('director');
    expect(deAuth(800n)[0]).toMatchObject({
      rol: 'ACUDIENTE',
      idAcudienteExterno: null,
    });
    expect(deAuth(900n)[0]?.rol).toBe('DIRECTORA');
  });

  it('estudiante: toma su idEstudianteExterno de ASISCO UP con su propio token', async () => {
    const res = await login('token-estudiante-nuevo').expect(200);
    expect(res.body.usuario.role).toBe('student');
    expect(consultaAsisco.porIdUsuarioAuth).toHaveBeenCalledWith(
      1000n,
      'token-estudiante-nuevo',
    );
    expect(deAuth(1000n)[0]?.estudiante).toEqual({
      idEstudianteExterno: 77n,
      nivelId: 1n,
      estado: 'ACTIVO',
    });
  });
});

describe('Alta automática apagada (e2e)', () => {
  let app: INestApplication<App>;
  let usuarios: UsuariosEnMemoria;

  beforeAll(async () => {
    usuarios = new UsuariosEnMemoria();
    app = await crearAppDePrueba({
      verificador: new VerificadorTokenFalso({
        'token-nueva': identidad(700, ['TALLERISTA']),
      }),
      autenticador: new AutenticadorFalso({
        'nueva@ejemplo.com': { contrasena: 'clave', token: 'token-nueva' },
      }),
      usuarios,
      reemplazos: [{ provide: ROLES_ALTA_AUTOMATICA, useValue: [] }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('ALTA_AUTOMATICA_ROLES vacía → 403 como antes y no crea nada', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ correo: 'nueva@ejemplo.com', contrasena: 'clave' })
      .expect(403);
    expect(res.body.message).toMatch(/aún no está registrada en GameUP/);
    expect(usuarios.todos()).toHaveLength(0);
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
