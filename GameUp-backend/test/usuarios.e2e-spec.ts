import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';
import {
  UsuariosEnMemoria,
  usuarioDePrueba,
} from './dobles/usuarios-en-memoria.js';
import {
  identidad,
  VerificadorTokenFalso,
} from './dobles/verificador-token-falso.js';

describe('Usuarios (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const usuarios = new UsuariosEnMemoria([
      usuarioDePrueba(1, 'DIRECTORA'), // auth 100
      usuarioDePrueba(2, 'TALLERISTA', { correo: 'usada@ejemplo.com' }), // auth 200
      usuarioDePrueba(3, 'ACUDIENTE'), // auth 300
    ]);
    app = await crearAppDePrueba({
      usuarios,
      verificador: new VerificadorTokenFalso({
        directora: identidad(100, ['ADMIN']),
        tallerista: identidad(200, ['TALLERISTA']),
        acudiente: identidad(300, ['ACUDIENTE']),
      }),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const como = (token: string | null) => {
    const agente = request(app.getHttpServer());
    const con = <T extends request.Test>(r: T) =>
      token ? r.set('Authorization', `Bearer ${token}`) : r;
    return {
      get: (ruta: string) => con(agente.get(`/api/v1${ruta}`)),
      post: (ruta: string, cuerpo: object) =>
        con(agente.post(`/api/v1${ruta}`).send(cuerpo)),
      patch: (ruta: string, cuerpo: object) =>
        con(agente.patch(`/api/v1${ruta}`).send(cuerpo)),
    };
  };

  const tallerista = {
    idUsuarioAuth: '900',
    rol: 'TALLERISTA',
    nombres: ' Nueva ',
    apellidos: 'Tallerista',
    correo: 'Nueva@Ejemplo.com',
  };

  describe('POST /usuarios', () => {
    it('la directora da de alta una tallerista → 201', async () => {
      const res = await como('directora')
        .post('/usuarios', tallerista)
        .expect(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        idUsuarioAuth: '900',
        rol: 'TALLERISTA',
        nombres: 'Nueva',
        correo: 'nueva@ejemplo.com',
        activo: true,
        estudiante: null,
        sincronizadoEn: null,
      });
    });

    it('un estudiante queda con su fila de estudiante y nivel inicial', async () => {
      const res = await como('directora')
        .post('/usuarios', {
          idUsuarioAuth: '901',
          rol: 'ESTUDIANTE',
          nombres: 'Niño',
          apellidos: 'De Prueba',
          idEstudianteExterno: '7001',
        })
        .expect(201);
      expect(res.body.estudiante).toEqual({
        idEstudianteExterno: '7001',
        nivelId: '1',
        estado: 'ACTIVO',
      });
    });

    it.each([
      [{ ...tallerista, idUsuarioAuth: 'abc' }],
      [{ ...tallerista, rol: 'DONANTE' }],
      [{ ...tallerista, correo: 'no-es-correo' }],
      [{ ...tallerista, nombres: '' }],
      [{ ...tallerista, documento: '123' }], // campo no permitido
    ])('DTO inválido → 400 (%j)', async (cuerpo) => {
      await como('directora').post('/usuarios', cuerpo).expect(400);
    });

    it('sin token → 401', async () => {
      await como(null).post('/usuarios', tallerista).expect(401);
    });

    it('una tallerista no puede dar de alta cuentas → 403', async () => {
      await como('tallerista')
        .post('/usuarios', { ...tallerista, idUsuarioAuth: '950' })
        .expect(403);
    });

    it('id de la API de seguridad o correo repetidos → 409', async () => {
      await como('directora')
        .post('/usuarios', { ...tallerista, idUsuarioAuth: '200' })
        .expect(409);
      const res = await como('directora')
        .post('/usuarios', {
          ...tallerista,
          idUsuarioAuth: '951',
          correo: 'USADA@ejemplo.com',
        })
        .expect(409);
      expect(res.body.message).toBe('Ya existe una cuenta con ese correo.');
    });

    it('estudiante sin idEstudianteExterno → 422', async () => {
      await como('directora')
        .post('/usuarios', {
          ...tallerista,
          idUsuarioAuth: '952',
          correo: undefined,
          rol: 'ESTUDIANTE',
        })
        .expect(422);
    });
  });

  describe('GET /usuarios', () => {
    it('lista paginada con filtros', async () => {
      const res = await como('directora')
        .get('/usuarios?rol=TALLERISTA&activo=true&limit=10')
        .expect(200);
      expect(res.body).toMatchObject({ page: 1, limit: 10 });
      expect(
        res.body.items.every((u: { rol: string }) => u.rol === 'TALLERISTA'),
      ).toBe(true);
      expect(res.body.total).toBe(res.body.items.length);
    });

    it.each(['limit=51', 'page=0', 'activo=quizas', 'rol=DONANTE'])(
      'query inválida → 400 (%s)',
      async (q) => {
        await como('directora').get(`/usuarios?${q}`).expect(400);
      },
    );

    it('acudiente → 403', async () => {
      await como('acudiente').get('/usuarios').expect(403);
    });
  });

  describe('GET /usuarios/:id', () => {
    it('ver una cuenta', async () => {
      const res = await como('directora').get('/usuarios/2').expect(200);
      expect(res.body).toMatchObject({ id: '2', rol: 'TALLERISTA' });
    });

    it('id inválido → 400; inexistente → 404', async () => {
      await como('directora').get('/usuarios/abc').expect(400);
      await como('directora').get('/usuarios/999').expect(404, {
        statusCode: 404,
        error: 'Not Found',
        message: 'La cuenta no existe.',
      });
    });
  });

  describe('PATCH /usuarios/:id/estado', () => {
    it('desactivar una cuenta la deja sin acceso (403) y reactivarla lo devuelve', async () => {
      await como('directora')
        .patch('/usuarios/3/estado', { activo: false })
        .expect(200);
      const res = await como('acudiente').get('/auth/me').expect(403);
      expect(res.body.message).toMatch(/desactivada/);

      await como('directora')
        .patch('/usuarios/3/estado', { activo: true })
        .expect(200);
      await como('acudiente').get('/auth/me').expect(200);
    });

    it('la directora no puede desactivarse a sí misma → 422', async () => {
      await como('directora')
        .patch('/usuarios/1/estado', { activo: false })
        .expect(422);
    });

    it('cuerpo inválido → 400; cuenta inexistente → 404; tallerista → 403', async () => {
      await como('directora')
        .patch('/usuarios/2/estado', { activo: 'no' })
        .expect(400);
      await como('directora')
        .patch('/usuarios/999/estado', { activo: false })
        .expect(404);
      await como('tallerista')
        .patch('/usuarios/3/estado', { activo: false })
        .expect(403);
    });
  });
});
