import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { RELOJ, RelojFijo } from '../src/common/reloj/reloj.js';
import { escenarioAcudiente } from './dobles/acudiente-en-memoria.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';
import { TOKENS_ESCENARIO } from './dobles/escenario-estudiantes.js';
import { VerificadorTokenFalso } from './dobles/verificador-token-falso.js';

type Token = keyof typeof TOKENS_ESCENARIO | null;

describe('Acudiente, observaciones y notificaciones (e2e)', () => {
  let app: INestApplication<App>;
  let e: Awaited<ReturnType<typeof escenarioAcudiente>>;

  beforeEach(async () => {
    e = await escenarioAcudiente();
    app = await crearAppDePrueba({
      usuarios: e.usuarios,
      estudiantes: e.estudiantes,
      catalogo: e.catalogo,
      almacen: e.almacen,
      modulos: e.modulos,
      asignaciones: e.asignaciones,
      notificaciones: e.notificaciones,
      observaciones: e.observaciones,
      practicas: e.practicas,
      verificador: new VerificadorTokenFalso(TOKENS_ESCENARIO),
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

  function como(token: Token) {
    const agente = request(app.getHttpServer());
    const con = <T extends request.Test>(r: T) =>
      token ? r.set('Authorization', `Bearer ${token}`) : r;
    return {
      get: (ruta: string) => con(agente.get(`/api/v1${ruta}`)),
      post: (ruta: string, cuerpo: object = {}) =>
        con(agente.post(`/api/v1${ruta}`).send(cuerpo)),
      patch: (ruta: string, cuerpo: object = {}) =>
        con(agente.patch(`/api/v1${ruta}`).send(cuerpo)),
      put: (ruta: string) => con(agente.put(`/api/v1${ruta}`)),
    };
  }

  describe('GET /estudiantes/:id/actividades', () => {
    it('la familia ve la retroalimentación de un intento aprobado', async () => {
      e.asignaciones.registrarIntento(e.ids.a4, e.ids.hablaE, {
        resultado: 'APROBADO',
        retroalimentacion: '¡Muy bien dicha la e!',
      });
      const res = await como('acudiente4')
        .get('/estudiantes/10/actividades')
        .expect(200);
      expect(
        res.body.find(
          (a: { actividadId: string }) =>
            a.actividadId === e.ids.hablaE.toString(),
        ),
      ).toMatchObject({
        estado: 'APROBADA',
        retroalimentacion: '¡Muy bien dicha la e!',
      });
    });

    it('el acudiente ve el estado de cada actividad y la retroalimentación', async () => {
      const res = await como('acudiente4')
        .get('/estudiantes/10/actividades')
        .expect(200);
      expect(res.body).toHaveLength(4);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            asignacionId: e.ids.a4.toString(),
            actividadId: e.ids.emparejar.toString(),
            modulo: {
              id: e.ids.modulo4.toString(),
              nombre: 'Vocales y parejas',
            },
            estado: 'RECHAZADA',
            retroalimentacion: 'Mira bien las parejas',
          }),
          expect.objectContaining({
            actividadId: e.ids.hablaE.toString(),
            estado: 'SIN_INTENTOS',
            vocal: 'e',
          }),
        ]),
      );
      await como('tallerista2').get('/estudiantes/10/actividades').expect(200);
      await como('directora').get('/estudiantes/10/actividades').expect(200);
    });

    it('id inválido → 400; sin token → 401; estudiante → 403; ajeno → 404', async () => {
      await como('acudiente4').get('/estudiantes/abc/actividades').expect(400);
      await como(null).get('/estudiantes/10/actividades').expect(401);
      await como('estudiante10').get('/estudiantes/10/actividades').expect(403);
      await como('acudiente5').get('/estudiantes/10/actividades').expect(404);
      await como('tallerista3').get('/estudiantes/10/actividades').expect(404);
    });
  });

  describe('observaciones', () => {
    it('la tallerista escribe una visible: el acudiente la ve y recibe el aviso', async () => {
      const creada = await como('tallerista2')
        .post('/estudiantes/10/observaciones', {
          texto: 'Hoy reconoció la e sin ayuda.',
          visibleAcudiente: true,
        })
        .expect(201);
      expect(creada.body).toMatchObject({
        estudianteId: '10',
        autor: { id: '2', displayName: 'Ana Gómez' },
        texto: 'Hoy reconoció la e sin ayuda.',
        visibleAcudiente: true,
      });
      await como('tallerista2')
        .post('/estudiantes/10/observaciones', { texto: 'Nota interna' })
        .expect(201);

      const familia = await como('acudiente4')
        .get('/estudiantes/10/observaciones')
        .expect(200);
      expect(familia.body.total).toBe(1);
      expect(familia.body.items[0].texto).toBe('Hoy reconoció la e sin ayuda.');
      const equipo = await como('directora')
        .get('/estudiantes/10/observaciones?limit=1')
        .expect(200);
      expect(equipo.body).toMatchObject({ total: 2, page: 1, limit: 1 });

      const avisos = await como('acudiente4')
        .get('/notificaciones?leida=false')
        .expect(200);
      expect(avisos.body.items[0]).toMatchObject({
        tipo: 'OBSERVACION',
        mensaje: 'Hay una nueva observación sobre Martín José.',
        leida: false,
      });
    });

    it('crear: DTO inválido → 400; texto en blanco → 422; acudiente → 403; ajeno → 404', async () => {
      await como('tallerista2')
        .post('/estudiantes/10/observaciones', { texto: 5 })
        .expect(400);
      await como('tallerista2')
        .post('/estudiantes/10/observaciones', { texto: 'x', extra: true })
        .expect(400);
      await como('tallerista2')
        .post('/estudiantes/10/observaciones', { texto: '   ' })
        .expect(422);
      await como(null)
        .post('/estudiantes/10/observaciones', { texto: 'x' })
        .expect(401);
      await como('acudiente4')
        .post('/estudiantes/10/observaciones', { texto: 'x' })
        .expect(403);
      await como('tallerista3')
        .post('/estudiantes/10/observaciones', { texto: 'x' })
        .expect(404);
    });

    it('listar: estudiante → 403; ajeno → 404; limit > 50 → 400', async () => {
      await como('estudiante10')
        .get('/estudiantes/10/observaciones')
        .expect(403);
      await como('acudiente5').get('/estudiantes/10/observaciones').expect(404);
      await como('directora')
        .get('/estudiantes/10/observaciones?limit=51')
        .expect(400);
    });

    it('editar: la autora la hace visible; otra persona → 403/404', async () => {
      const id = (
        await como('tallerista2')
          .post('/estudiantes/10/observaciones', { texto: 'Borrador' })
          .expect(201)
      ).body.id;
      const res = await como('tallerista2')
        .patch(`/observaciones/${id}`, {
          texto: 'Versión final',
          visibleAcudiente: true,
        })
        .expect(200);
      expect(res.body).toMatchObject({
        texto: 'Versión final',
        visibleAcudiente: true,
      });
      await como('tallerista2').patch(`/observaciones/${id}`, {}).expect(422);
      await como('tallerista2')
        .patch(`/observaciones/${id}`, { visibleAcudiente: 'si' })
        .expect(400);
      await como('acudiente4')
        .patch(`/observaciones/${id}`, { texto: 'x' })
        .expect(403);
      await como('tallerista3')
        .patch(`/observaciones/${id}`, { texto: 'x' })
        .expect(404);
      await como('directora')
        .patch('/observaciones/999', { texto: 'x' })
        .expect(404);
    });
  });

  describe('notificaciones', () => {
    it('lista las propias con el total sin leer', async () => {
      const res = await como('acudiente4').get('/notificaciones').expect(200);
      expect(res.body).toMatchObject({ total: 2, noLeidas: 1, page: 1 });
      expect(res.body.items.map((n: { id: string }) => n.id)).toEqual([
        e.ids.n1.toString(),
        e.ids.n2.toString(),
      ]);
    });

    it('marcar una y todas', async () => {
      await como('acudiente4')
        .patch(`/notificaciones/${e.ids.n1}/lectura`)
        .expect(200)
        .expect((r) => expect(r.body.leida).toBe(true));
      await como('acudiente4')
        .post('/notificaciones/lectura')
        .expect(200, { marcadas: 0 });
      await como('acudiente5')
        .post('/notificaciones/lectura')
        .expect(200, { marcadas: 1 });
    });

    it('la de otra persona → 404; filtro inválido → 400; sin token → 401', async () => {
      await como('acudiente4')
        .patch(`/notificaciones/${e.ids.n3}/lectura`)
        .expect(404);
      await como('acudiente4').get('/notificaciones?leida=quizas').expect(400);
      await como('acudiente4').patch('/notificaciones/x/lectura').expect(400);
      await como(null).get('/notificaciones').expect(401);
      await como(null).post('/notificaciones/lectura').expect(401);
    });

    it('cualquier rol puede consultar las suyas (403 solo para cuentas sin acceso)', async () => {
      await como('tallerista2')
        .get('/notificaciones')
        .expect(200)
        .expect((r) => expect(r.body.total).toBe(0));
      await como('estudiante10').get('/notificaciones').expect(200);
    });
  });

  describe('práctica en casa', () => {
    it('«Lo practicamos hoy» y la semana', async () => {
      const antes = await como('acudiente4')
        .get('/estudiantes/10/practica-semanal')
        .expect(200);
      expect(antes.body).toMatchObject({
        estudiante: { id: '10', displayName: 'Martín C.', initials: 'MC' },
        hoy: '2026-11-05',
        practicadoHoy: false,
      });
      expect(antes.body.dias[0]).toEqual({
        fecha: '2026-11-02',
        practicado: false,
      });
      const marcada = await como('acudiente4')
        .put('/estudiantes/10/practica-casa/hoy')
        .expect(200);
      expect(marcada.body.practicadoHoy).toBe(true);
      await como('acudiente4')
        .put('/estudiantes/10/practica-casa/hoy')
        .expect(200);
      expect(e.practicas.filas).toHaveLength(1);
    });

    it('la directora y la tallerista a cargo leen la semana, pero no la marcan', async () => {
      await como('acudiente4')
        .put('/estudiantes/10/practica-casa/hoy')
        .expect(200);
      for (const quien of ['directora', 'tallerista2'] as const) {
        const res = await como(quien)
          .get('/estudiantes/10/practica-semanal')
          .expect(200);
        expect(res.body.practicadoHoy).toBe(true);
        await como(quien).put('/estudiantes/10/practica-casa/hoy').expect(403);
      }
    });

    it('id inválido → 400; sin token → 401; estudiante → 403; ajeno → 404', async () => {
      await como('acudiente4')
        .get('/estudiantes/x/practica-semanal')
        .expect(400);
      await como(null).put('/estudiantes/10/practica-casa/hoy').expect(401);
      await como(null).get('/estudiantes/10/practica-semanal').expect(401);
      await como('estudiante10')
        .get('/estudiantes/10/practica-semanal')
        .expect(403);
      await como('tallerista3')
        .get('/estudiantes/10/practica-semanal')
        .expect(404);
      await como('acudiente5')
        .put('/estudiantes/10/practica-casa/hoy')
        .expect(404);
      await como('acudiente5')
        .get('/estudiantes/10/practica-semanal')
        .expect(404);
    });
  });
});
