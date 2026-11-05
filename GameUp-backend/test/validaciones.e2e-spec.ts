import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { RELOJ, RelojFijo } from '../src/common/reloj/reloj.js';
import { CONSULTA_CONSENTIMIENTO } from '../src/modules/consentimiento/domain/consulta-consentimiento.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';
import { TOKENS_ESCENARIO } from './dobles/escenario-estudiantes.js';
import { ARCHIVOS } from './dobles/escenario-modulos.js';
import { escenarioValidaciones } from './dobles/validaciones-en-memoria.js';
import { VerificadorTokenFalso } from './dobles/verificador-token-falso.js';

type Token = keyof typeof TOKENS_ESCENARIO | null;

describe('Validación y progreso (e2e)', () => {
  let app: INestApplication<App>;
  let e: Awaited<ReturnType<typeof escenarioValidaciones>>;
  let voz: string;
  let juego: string;
  let memoria: string;

  beforeEach(async () => {
    e = await escenarioValidaciones();
    app = await crearAppDePrueba({
      usuarios: e.usuarios,
      estudiantes: e.estudiantes,
      catalogo: e.catalogo,
      almacen: e.almacen,
      modulos: e.modulos,
      asignaciones: e.asignaciones,
      intentos: e.intentos,
      validaciones: e.validaciones,
      verificador: new VerificadorTokenFalso(TOKENS_ESCENARIO),
      reemplazos: [
        { provide: CONSULTA_CONSENTIMIENTO, useValue: e.consentimiento },
        {
          provide: RELOJ,
          useValue: new RelojFijo(new Date('2026-11-05T15:00:00Z')),
        },
      ],
    });
    // El estudiante 10 hace tres intentos.
    const nino = como('estudiante10');
    voz = (
      await nino
        .voz()
        .field('actividadId', e.ids.hablaE.toString())
        .attach('audio', ARCHIVOS.m4a, {
          filename: 'voz.m4a',
          contentType: 'audio/mp4',
        })
        .expect(201)
    ).body.id;
    juego = (
      await nino
        .post('/intentos', {
          actividadId: e.ids.emparejar.toString(),
          resultado: { firstTryCorrect: 1, total: 2 },
        })
        .expect(201)
    ).body.id;
    memoria = (
      await nino
        .post('/intentos', {
          actividadId: e.ids.memoria.toString(),
          resultado: { pairs: 2, mismatches: 3 },
        })
        .expect(201)
    ).body.id;
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
      post: (ruta: string, cuerpo: object) =>
        con(agente.post(`/api/v1${ruta}`).send(cuerpo)),
      voz: () => con(agente.post('/api/v1/intentos/habla-conmigo')),
    };
  }

  describe('GET /revisiones/pendientes', () => {
    it('la tallerista ve los intentos de sus estudiantes, del más antiguo al más reciente', async () => {
      const res = await como('tallerista2')
        .get('/revisiones/pendientes')
        .expect(200);
      expect(
        res.body.items.map((i: { intentoId: string }) => i.intentoId),
      ).toEqual([voz, juego, memoria]);
      expect(res.body.items[0]).toMatchObject({
        tipo: 'VOZ',
        tipoJuego: 'HABLA_CONMIGO',
        estudiante: { id: '10', displayName: 'Martín C.', initials: 'MC' },
        actividad: { vocal: 'e' },
        consentimientoVoz: true,
        grabacion: { disponible: true, vencido: false },
      });
      expect(res.body.items[1]).toMatchObject({
        tipo: 'JUEGO',
        consentimientoVoz: null,
      });
    });

    it('otra tallerista no los ve; acudiente y estudiante → 403', async () => {
      const res = await como('tallerista3')
        .get('/revisiones/pendientes')
        .expect(200);
      expect(res.body.total).toBe(0);
      await como('acudiente4').get('/revisiones/pendientes').expect(403);
      await como('estudiante10').get('/revisiones/pendientes').expect(403);
      await como(null).get('/revisiones/pendientes').expect(401);
    });
  });

  describe('GET /intentos/:id/grabacion', () => {
    it('URL firmada de 10 minutos para la tallerista a cargo', async () => {
      const res = await como('tallerista2')
        .get(`/intentos/${voz}/grabacion`)
        .expect(200);
      expect(res.body.url).toMatch(
        /^https:\/\/almacen\.test\/grabaciones\/estudiante\/10\/intento\//,
      );
      expect(res.body.expiraEn).toBe('2026-11-05T15:10:00.000Z');
    });

    it('otra tallerista → 404; acudiente → 403; intento sin audio → 404', async () => {
      await como('tallerista3').get(`/intentos/${voz}/grabacion`).expect(404);
      await como('acudiente4').get(`/intentos/${voz}/grabacion`).expect(403);
      await como('tallerista2').get(`/intentos/${juego}/grabacion`).expect(404);
    });
  });

  describe('POST /intentos/:id/validacion', () => {
    it('voz con audio sin haberlo pedido → 422; tras pedir la URL, se valida', async () => {
      const sin = await como('tallerista2')
        .post(`/intentos/${voz}/validacion`, { resultado: 'APROBADO' })
        .expect(422);
      expect(sin.body).toEqual({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: 'Antes de validar, escucha la grabación de este intento.',
      });
      await como('tallerista2').get(`/intentos/${voz}/grabacion`).expect(200);
      await como('tallerista2')
        .post(`/intentos/${voz}/validacion`, { resultado: 'APROBADO' })
        .expect(200);
    });

    it('«Lo logró»: valida y borra el audio de Storage', async () => {
      await como('tallerista2').get(`/intentos/${voz}/grabacion`).expect(200);
      const res = await como('tallerista2')
        .post(`/intentos/${voz}/validacion`, { resultado: 'APROBADO' })
        .expect(200);
      expect(res.body).toMatchObject({
        estado: 'APROBADO',
        validacion: { resultado: 'APROBADO', retroalimentacion: null },
        tieneAudio: false,
      });
      expect(e.almacen.rutas('grabaciones')).toEqual([]);
      await como('tallerista2').get(`/intentos/${voz}/grabacion`).expect(404);
    });

    it('«Practicar más» sin retroalimentación → 422; con ella → 200', async () => {
      const sin = await como('tallerista2')
        .post(`/intentos/${juego}/validacion`, { resultado: 'RECHAZADO' })
        .expect(422);
      expect(sin.body.message).toBe(
        'Para pedir que practique más, la retroalimentación es obligatoria.',
      );
      await como('tallerista2')
        .post(`/intentos/${juego}/validacion`, {
          resultado: 'RECHAZADO',
          retroalimentacion: 'Mira bien las parejas',
        })
        .expect(200);
      // El estudiante vuelve a tenerla por hacer, con la retroalimentación.
      const pendientes = await como('estudiante10')
        .get('/estudiantes/me/actividades-pendientes')
        .expect(200);
      expect(pendientes.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            actividadId: e.ids.emparejar.toString(),
            retroalimentacion: 'Mira bien las parejas',
          }),
        ]),
      );
    });

    it('ya validado → 409; resultado inválido → 400; estudiante ajeno → 404; acudiente → 403', async () => {
      await como('tallerista2')
        .post(`/intentos/${memoria}/validacion`, { resultado: 'APROBADO' })
        .expect(200);
      await como('tallerista2')
        .post(`/intentos/${memoria}/validacion`, { resultado: 'APROBADO' })
        .expect(409);
      await como('tallerista2')
        .post(`/intentos/${juego}/validacion`, { resultado: 'BIEN' })
        .expect(400);
      await como('tallerista3')
        .post(`/intentos/${juego}/validacion`, { resultado: 'APROBADO' })
        .expect(404);
      await como('acudiente4')
        .post(`/intentos/${juego}/validacion`, { resultado: 'APROBADO' })
        .expect(403);
    });
  });

  describe('POST /validaciones/lote', () => {
    it('aprueba varios juegos sin voz de una vez', async () => {
      await como('tallerista2')
        .post('/validaciones/lote', { intentoIds: [juego, memoria] })
        .expect(200, { aprobados: 2 });
    });

    it('con uno de voz → 422 y no aprueba ninguno; ids inválidos o repetidos → 400', async () => {
      const res = await como('tallerista2')
        .post('/validaciones/lote', { intentoIds: [juego, voz] })
        .expect(422);
      expect(res.body.message).toMatch(/No se aprobó ninguno: .*Habla conmigo/);
      const intento = await como('tallerista2')
        .get(`/intentos/${juego}`)
        .expect(200);
      expect(intento.body.estado).toBe('PENDIENTE_VALIDACION');
      await como('tallerista2')
        .post('/validaciones/lote', { intentoIds: ['x'] })
        .expect(400);
      await como('tallerista2')
        .post('/validaciones/lote', { intentoIds: [juego, juego] })
        .expect(400);
      await como('tallerista2')
        .post('/validaciones/lote', { intentoIds: [] })
        .expect(400);
    });
  });

  describe('progreso oficial', () => {
    it('solo suma lo aprobado; lo pendiente se informa aparte', async () => {
      await como('tallerista2')
        .post('/validaciones/lote', { intentoIds: [juego] })
        .expect(200);
      const res = await como('acudiente4')
        .get('/estudiantes/10/progreso')
        .expect(200);
      const m4 = res.body.modulos.find(
        (m: { asignacionId: string }) => m.asignacionId === e.ids.a4.toString(),
      );
      expect(m4).toMatchObject({
        modulo: { nombre: 'Vocales y parejas' },
        validadas: 2,
        total: 4,
        progreso: 50,
        pendientesValidacion: 1,
      });
      await como('estudiante10').get('/estudiantes/me/progreso').expect(200);
    });

    it('estudiante ajeno → 404; el estudiante no ve el de otro por :id (403)', async () => {
      await como('acudiente5').get('/estudiantes/10/progreso').expect(404);
      await como('tallerista3').get('/estudiantes/10/progreso').expect(404);
      await como('estudiante10').get('/estudiantes/10/progreso').expect(403);
    });
  });
});
