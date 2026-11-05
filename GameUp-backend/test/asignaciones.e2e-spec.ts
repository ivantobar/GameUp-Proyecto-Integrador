import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { RELOJ, RelojFijo } from '../src/common/reloj/reloj.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';
import { escenarioAsignaciones } from './dobles/asignaciones-en-memoria.js';
import { TOKENS_ESCENARIO } from './dobles/escenario-estudiantes.js';
import { VerificadorTokenFalso } from './dobles/verificador-token-falso.js';

type Token = keyof typeof TOKENS_ESCENARIO | null;

describe('Asignaciones (e2e)', () => {
  let app: INestApplication<App>;
  let e: Awaited<ReturnType<typeof escenarioAsignaciones>>;

  beforeEach(async () => {
    e = await escenarioAsignaciones();
    app = await crearAppDePrueba({
      usuarios: e.usuarios,
      estudiantes: e.estudiantes,
      catalogo: e.catalogo,
      almacen: e.almacen,
      modulos: e.modulos,
      asignaciones: e.asignaciones,
      verificador: new VerificadorTokenFalso(TOKENS_ESCENARIO),
      // «Hoy» es el 5 de noviembre de 2026 en Bogotá.
      reemplazos: [
        {
          provide: RELOJ,
          useValue: new RelojFijo(new Date('2026-11-05T15:00:00Z')),
        },
      ],
    });
  });

  afterEach(async () => {
    await app.close();
  });

  const como = (token: Token) => {
    const agente = request(app.getHttpServer());
    const con = <T extends request.Test>(r: T) =>
      token ? r.set('Authorization', `Bearer ${token}`) : r;
    return {
      get: (ruta: string) => con(agente.get(`/api/v1${ruta}`)),
      post: (ruta: string, cuerpo: object) =>
        con(agente.post(`/api/v1${ruta}`).send(cuerpo)),
      delete: (ruta: string) => con(agente.delete(`/api/v1${ruta}`)),
    };
  };
  const txt = (id: bigint) => id.toString();

  describe('POST /asignaciones', () => {
    it('la tallerista asigna un módulo publicado a su estudiante → 201', async () => {
      const res = await como('tallerista3')
        .post('/asignaciones', {
          moduloId: txt(e.ids.modulo4),
          estudianteId: '12',
          fechaSugerida: '2026-11-30',
        })
        .expect(201);
      expect(res.body).toMatchObject({
        modulo: { id: txt(e.ids.modulo4), nombre: 'Vocales y parejas' },
        estudiante: { id: '12', displayName: 'Lucas M.', initials: 'LM' },
        asignadoPor: { id: '3', displayName: 'Tomás Rey' },
        fechaSugerida: '2026-11-30',
        estado: 'ASIGNADO',
        progreso: 0,
      });
      // El acudiente del estudiante ya ve el módulo.
      await como('acudiente5')
        .get(`/modulos/${txt(e.ids.modulo4)}`)
        .expect(200);
    });

    it('estudiante ajeno → 404 (igual que uno inexistente)', async () => {
      const ajeno = await como('tallerista2')
        .post('/asignaciones', {
          moduloId: txt(e.ids.modulo4),
          estudianteId: '12',
        })
        .expect(404);
      const inexistente = await como('tallerista2')
        .post('/asignaciones', {
          moduloId: txt(e.ids.modulo4),
          estudianteId: '999',
        })
        .expect(404);
      expect(ajeno.body).toEqual(inexistente.body);
    });

    it('módulo sin publicar, estudiante egresado o fecha pasada → 422', async () => {
      await como('directora')
        .post('/asignaciones', { moduloId: '2', estudianteId: '12' })
        .expect(422);
      await como('directora')
        .post('/asignaciones', {
          moduloId: txt(e.ids.modulo4),
          estudianteId: '11',
        })
        .expect(422);
      const res = await como('directora')
        .post('/asignaciones', {
          moduloId: txt(e.ids.modulo4),
          estudianteId: '12',
          fechaSugerida: '2026-11-04',
        })
        .expect(422);
      expect(res.body.message).toBe(
        'La fecha sugerida no puede ser anterior a hoy.',
      );
    });

    it('ya asignado sin completar → 409', async () => {
      await como('directora')
        .post('/asignaciones', {
          moduloId: txt(e.ids.modulo4),
          estudianteId: '10',
        })
        .expect(409);
    });

    it('DTO inválido → 400; sin token → 401; acudiente o estudiante → 403', async () => {
      const res = await como('directora')
        .post('/asignaciones', {
          moduloId: 'x',
          estudianteId: '12',
          fechaSugerida: '20/11/2026',
        })
        .expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'fechaSugerida debe tener el formato AAAA-MM-DD',
        ]),
      );
      const cuerpo = { moduloId: txt(e.ids.modulo4), estudianteId: '12' };
      await como(null).post('/asignaciones', cuerpo).expect(401);
      await como('acudiente5').post('/asignaciones', cuerpo).expect(403);
      await como('estudiante10').post('/asignaciones', cuerpo).expect(403);
    });
  });

  describe('GET /asignaciones y /asignaciones/:id', () => {
    it('cada rol lista las de sus estudiantes', async () => {
      const ids = async (token: Token) =>
        (await como(token).get('/asignaciones').expect(200)).body.items.map(
          (a: { id: string }) => a.id,
        );
      expect(await ids('directora')).toEqual([txt(e.ids.a4), txt(e.ids.a1)]);
      expect(await ids('tallerista3')).toEqual([]);
      expect(await ids('acudiente4')).toEqual([txt(e.ids.a4), txt(e.ids.a1)]);
      expect(await ids('estudiante10')).toEqual([txt(e.ids.a4), txt(e.ids.a1)]);
      await como('directora').get('/asignaciones?estado=PAUSADO').expect(400);
    });

    it('avance: estado por actividad y resumen (solo cuentan las aprobadas)', async () => {
      const res = await como('acudiente4')
        .get(`/asignaciones/${txt(e.ids.a4)}`)
        .expect(200);
      expect(res.body.actividades).toEqual([
        expect.objectContaining({
          tipoJuego: 'HABLA_CONMIGO',
          vocal: 'e',
          estado: 'SIN_INTENTOS',
          esNueva: true,
        }),
        expect.objectContaining({
          tipoJuego: 'EMPAREJAR',
          estado: 'RECHAZADA',
          retroalimentacion: 'Mira bien las parejas',
        }),
        expect.objectContaining({
          tipoJuego: 'MEMORIA',
          estado: 'APROBADA',
          intentos: 1,
        }),
      ]);
      expect(res.body.resumen).toEqual({
        total: 3,
        aprobadas: 1,
        pendientesValidacion: 0,
      });
    });

    it('asignación de un estudiante ajeno → 404; id inválido → 400', async () => {
      await como('acudiente5')
        .get(`/asignaciones/${txt(e.ids.a1)}`)
        .expect(404);
      await como('tallerista3')
        .get(`/asignaciones/${txt(e.ids.a1)}`)
        .expect(404);
      await como('directora').get('/asignaciones/abc').expect(400);
    });
  });

  describe('GET /estudiantes/me/actividades-pendientes', () => {
    it('el estudiante ve lo que tiene por hacer (no lo que espera validación)', async () => {
      const res = await como('estudiante10')
        .get('/estudiantes/me/actividades-pendientes')
        .expect(200);
      expect(res.body).toEqual([
        expect.objectContaining({
          asignacionId: txt(e.ids.a4),
          actividadId: txt(e.ids.hablaE),
          modulo: { id: txt(e.ids.modulo4), nombre: 'Vocales y parejas' },
          tipoJuego: 'HABLA_CONMIGO',
          vocal: 'e',
          estado: 'SIN_INTENTOS',
          esNueva: true,
          fechaSugerida: '2026-11-20',
        }),
        expect.objectContaining({
          actividadId: txt(e.ids.emparejar),
          estado: 'RECHAZADA',
        }),
      ]);
    });

    it('un adulto → 403; sin token → 401', async () => {
      await como('acudiente4')
        .get('/estudiantes/me/actividades-pendientes')
        .expect(403);
      await como(null)
        .get('/estudiantes/me/actividades-pendientes')
        .expect(401);
    });
  });

  describe('DELETE /asignaciones/:id', () => {
    it('con intentos → 409; sin intentos → 204; ajena → 404; acudiente → 403', async () => {
      await como('tallerista2')
        .delete(`/asignaciones/${txt(e.ids.a1)}`)
        .expect(409);
      const nueva = await como('tallerista3')
        .post('/asignaciones', {
          moduloId: txt(e.ids.modulo4),
          estudianteId: '12',
        })
        .expect(201);
      await como('tallerista2')
        .delete(`/asignaciones/${nueva.body.id}`)
        .expect(404);
      await como('acudiente5')
        .delete(`/asignaciones/${nueva.body.id}`)
        .expect(403);
      await como('tallerista3')
        .delete(`/asignaciones/${nueva.body.id}`)
        .expect(204);
      await como('directora').get(`/asignaciones/${nueva.body.id}`).expect(404);
    });
  });
});
