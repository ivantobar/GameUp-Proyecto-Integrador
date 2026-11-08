import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';
import { AutenticadorFalso } from './dobles/autenticador-falso.js';
import {
  UsuariosEnMemoria,
  usuarioDePrueba,
} from './dobles/usuarios-en-memoria.js';
import {
  identidad,
  VerificadorTokenFalso,
} from './dobles/verificador-token-falso.js';

/** JWT de prueba con exp (firma falsa; el verificador es un doble). */
const TOKEN_TALLERISTA = `e30.${Buffer.from(JSON.stringify({ exp: 1_800_000_000 })).toString('base64url')}.firma`;

describe('Auth: login, me y logout (e2e)', () => {
  let app: INestApplication<App>;
  let verificador: VerificadorTokenFalso;
  let usuarios: UsuariosEnMemoria;

  beforeAll(async () => {
    usuarios = new UsuariosEnMemoria([
      usuarioDePrueba(2, 'TALLERISTA', {
        nombres: 'Viejo',
        apellidos: 'Nombre',
      }), // auth 200
      usuarioDePrueba(5, 'ESTUDIANTE', {
        nombres: 'Martín José',
        apellidos: 'Cruz',
      }), // auth 500
      usuarioDePrueba(6, 'ESTUDIANTE', {
        estudiante: {
          idEstudianteExterno: 6000n,
          nivelId: 1n,
          estado: 'RETIRADO',
        },
      }), // auth 600
    ]);
    verificador = new VerificadorTokenFalso({
      [TOKEN_TALLERISTA]: identidad(200, ['DONANTE', 'TALLERISTA'], {
        nombres: 'Ana María',
        apellidos: 'Gómez Ruiz',
        correo: 'ana@ejemplo.com',
      }),
      'token-estudiante': identidad(500, ['ESTUDIANTE'], {
        nombres: 'Martín José',
        apellidos: 'Cruz',
      }),
      'token-donante': identidad(300, ['DONANTE']),
      'token-retirado': identidad(600, ['ESTUDIANTE']),
      'token-sin-cuenta': identidad(400, ['ESTUDIANTE']),
    });
    app = await crearAppDePrueba({
      verificador,
      usuarios,
      autenticador: new AutenticadorFalso({
        'ana@ejemplo.com': { contrasena: 'clave-1', token: TOKEN_TALLERISTA },
        'nino@ejemplo.com': {
          contrasena: 'clave-2',
          token: 'token-estudiante',
        },
        'donante@ejemplo.com': {
          contrasena: 'clave-3',
          token: 'token-donante',
        },
        'nueva@ejemplo.com': {
          contrasena: 'clave-4',
          token: 'token-sin-cuenta',
        },
        'retirado@ejemplo.com': {
          contrasena: 'clave-5',
          token: 'token-retirado',
        },
      }),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const login = (cuerpo: object) =>
    request(app.getHttpServer()).post('/api/v1/auth/login').send(cuerpo);

  describe('POST /auth/login (público)', () => {
    it('devuelve el token y la sesión con el rol de la app', async () => {
      const res = await login({
        correo: 'ana@ejemplo.com',
        contrasena: 'clave-1',
      }).expect(200);
      expect(res.body).toEqual({
        token: TOKEN_TALLERISTA,
        expiraEn: '2027-01-15T08:00:00.000Z',
        usuario: { userId: '2', role: 'teacher', displayName: 'Ana Gómez' },
      });
    });

    it('sincroniza la copia mínima en GameUP', async () => {
      const u = await usuarios.buscarPorId(2n);
      expect(u).toMatchObject({
        nombres: 'Ana María',
        apellidos: 'Gómez Ruiz',
        correo: 'ana@ejemplo.com',
      });
      expect(u?.sincronizadoEn).toBeInstanceOf(Date);
      expect(u?.ultimoAcceso).toBeInstanceOf(Date);
    });

    it('al estudiante lo saluda por su primer nombre', async () => {
      const res = await login({
        correo: 'nino@ejemplo.com',
        contrasena: 'clave-2',
      }).expect(200);
      expect(res.body.usuario).toEqual({
        userId: '5',
        role: 'student',
        displayName: 'Martín',
      });
      expect(res.body.expiraEn).toBeNull();
    });

    it.each([
      [{ correo: 'no-es-correo', contrasena: 'x' }],
      [{ correo: 'ana@ejemplo.com' }],
      [{ correo: 'ana@ejemplo.com', contrasena: '' }],
      [{ correo: 'ana@ejemplo.com', contrasena: 'clave-1', rol: 'ADMIN' }],
    ])('DTO inválido → 400 (%j)', async (cuerpo) => {
      const res = await login(cuerpo).expect(400);
      expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    });

    it('credenciales incorrectas → 401 con mensaje genérico', async () => {
      await login({ correo: 'ana@ejemplo.com', contrasena: 'mala' }).expect(
        401,
        {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Correo o contraseña incorrectos.',
        },
      );
    });

    it('DONANTE → 403', async () => {
      const res = await login({
        correo: 'donante@ejemplo.com',
        contrasena: 'clave-3',
      }).expect(403);
      expect(res.body.message).toBe('Tu cuenta no tiene acceso a GameUP.');
    });

    it('estudiante retirado → 403 al iniciar sesión y en cualquier petición', async () => {
      const res = await login({
        correo: 'retirado@ejemplo.com',
        contrasena: 'clave-5',
      }).expect(403);
      expect(res.body.message).toMatch(/ya no está activa/);
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer token-retirado')
        .expect(403);
    });

    it('estudiante sin fila y sin ASISCO UP → 403 con el motivo, sin crear cuenta', async () => {
      const antes = usuarios.todos().length;
      const res = await login({
        correo: 'nueva@ejemplo.com',
        contrasena: 'clave-4',
      }).expect(403);
      expect(res.body.message).toBe(
        'Aún no te encontramos en ASISCO UP. Pide a la fundación que revise tu registro.',
      );
      expect(usuarios.todos()).toHaveLength(antes);
    });
  });

  describe('GET /auth/me', () => {
    it('sin token → 401', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('con token → la sesión actual', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${TOKEN_TALLERISTA}`)
        .expect(200, {
          userId: '2',
          role: 'teacher',
          displayName: 'Ana Gómez',
        });
    });

    it('rol sin acceso → 403', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer token-donante')
        .expect(403);
    });
  });

  describe('POST /auth/logout', () => {
    it('sin token → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });

    it('con token → 204 y el token sale de la caché', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${TOKEN_TALLERISTA}`)
        .expect(204);
      expect(verificador.olvidados).toContain(TOKEN_TALLERISTA);
    });
  });
});
