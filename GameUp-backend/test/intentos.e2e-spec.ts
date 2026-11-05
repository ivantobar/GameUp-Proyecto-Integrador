import { readdir } from 'node:fs/promises';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DIRECTORIO_SUBIDAS } from '../src/common/almacenamiento/subidas.js';
import { RELOJ, RelojFijo } from '../src/common/reloj/reloj.js';
import { CONSULTA_CONSENTIMIENTO } from '../src/modules/consentimiento/domain/consulta-consentimiento.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';
import { TOKENS_ESCENARIO } from './dobles/escenario-estudiantes.js';
import { ARCHIVOS } from './dobles/escenario-modulos.js';
import { escenarioIntentos } from './dobles/intentos-en-memoria.js';
import { VerificadorTokenFalso } from './dobles/verificador-token-falso.js';

type Token = keyof typeof TOKENS_ESCENARIO | null;

describe('Intentos y grabaciones (e2e)', () => {
  let app: INestApplication<App>;
  let e: Awaited<ReturnType<typeof escenarioIntentos>>;
  const temporales = () =>
    readdir(DIRECTORIO_SUBIDAS).catch(() => [] as string[]);
  let antes: string[];

  beforeEach(async () => {
    e = await escenarioIntentos();
    antes = await temporales();
    app = await crearAppDePrueba({
      usuarios: e.usuarios,
      estudiantes: e.estudiantes,
      catalogo: e.catalogo,
      almacen: e.almacen,
      modulos: e.modulos,
      asignaciones: e.asignaciones,
      intentos: e.intentos,
      verificador: new VerificadorTokenFalso(TOKENS_ESCENARIO),
      reemplazos: [
        { provide: CONSULTA_CONSENTIMIENTO, useValue: e.consentimiento },
        {
          provide: RELOJ,
          useValue: new RelojFijo(new Date('2026-11-05T15:00:00Z')),
        },
      ],
    });
  });

  afterEach(async () => {
    await app.close();
    // Ninguna subida deja archivos temporales, pase lo que pase.
    expect((await temporales()).filter((f) => !antes.includes(f))).toEqual([]);
  });

  const como = (token: Token) => {
    const agente = request(app.getHttpServer());
    const con = <T extends request.Test>(r: T) =>
      token ? r.set('Authorization', `Bearer ${token}`) : r;
    return {
      get: (ruta: string) => con(agente.get(`/api/v1${ruta}`)),
      post: (ruta: string, cuerpo: object) =>
        con(agente.post(`/api/v1${ruta}`).send(cuerpo)),
      voz: () => con(agente.post('/api/v1/intentos/habla-conmigo')),
    };
  };
  const txt = (id: bigint) => id.toString();

  describe('POST /intentos (juegos sin voz)', () => {
    it('registra el intento pendiente de validación → 201', async () => {
      const res = await como('estudiante10')
        .post('/intentos', {
          actividadId: txt(e.ids.emparejar),
          resultado: { firstTryCorrect: 2, total: 2 },
        })
        .expect(201);
      expect(res.body).toMatchObject({
        actividadId: txt(e.ids.emparejar),
        asignacionId: txt(e.ids.a4),
        tipoJuego: 'EMPAREJAR',
        numeroIntento: 2,
        estado: 'PENDIENTE_VALIDACION',
        validacion: null,
        estrellas: 0,
        tieneAudio: false,
      });
      // Ya no figura como pendiente de hacer (espera a la tallerista).
      const pendientes = await como('estudiante10')
        .get('/estudiantes/me/actividades-pendientes')
        .expect(200);
      expect(
        pendientes.body.map((p: { actividadId: string }) => p.actividadId),
      ).not.toContain(txt(e.ids.emparejar));
    });

    it('resultado que no coincide con la actividad → 422; DTO inválido → 400', async () => {
      const res = await como('estudiante10')
        .post('/intentos', {
          actividadId: txt(e.ids.emparejar),
          resultado: { firstTryCorrect: 9, total: 9 },
        })
        .expect(422);
      expect(res.body.message).toMatch(/debe ser 2/);
      await como('estudiante10')
        .post('/intentos', { actividadId: 'x', resultado: 'no' })
        .expect(400);
    });

    it('actividad de un módulo no asignado → 404; adulto → 403; sin token → 401', async () => {
      const otra = e.modulos.agregarActividad(2, 'MEMORIA');
      const cuerpo = {
        actividadId: txt(otra.id),
        resultado: { pairs: 1, mismatches: 0 },
      };
      await como('estudiante10').post('/intentos', cuerpo).expect(404);
      await como('tallerista2').post('/intentos', cuerpo).expect(403);
      await como(null).post('/intentos', cuerpo).expect(401);
    });
  });

  describe('POST /intentos/habla-conmigo', () => {
    it('con consentimiento: guarda la voz en el bucket privado', async () => {
      const res = await como('estudiante10')
        .voz()
        .field('actividadId', txt(e.ids.hablaE))
        .field('duracionSeg', '3')
        .attach('audio', ARCHIVOS.m4a, {
          filename: 'voz.m4a',
          contentType: 'audio/x-m4a',
        })
        .expect(201);
      expect(res.body).toMatchObject({
        tipoJuego: 'HABLA_CONMIGO',
        estado: 'PENDIENTE_VALIDACION',
        estadoGrabacion: 'ADJUNTA',
        grabacionGuardada: true,
        estrellasPractica: 1,
        resultado: { estadoGrabacion: 'ADJUNTA' },
      });
      expect(e.almacen.rutas('grabaciones')).toEqual([
        `estudiante/10/intento/${res.body.id}.m4a`,
      ]);
      expect(JSON.stringify(res.body)).not.toContain('estudiante/10/intento');
    });

    it('sin consentimiento: 201 sin audio (no se guarda nada en Storage)', async () => {
      e.consentimiento.respuesta = null;
      const res = await como('estudiante10')
        .voz()
        .field('actividadId', txt(e.ids.hablaE))
        .attach('audio', ARCHIVOS.m4a, {
          filename: 'voz.m4a',
          contentType: 'audio/mp4',
        })
        .expect(201);
      expect(res.body).toMatchObject({
        estadoGrabacion: 'SIN_CONSENTIMIENTO',
        grabacionGuardada: false,
      });
      expect(e.almacen.rutas('grabaciones')).toEqual([]);
    });

    it('sin audio (la app no grabó): 201 NO_ENVIADA', async () => {
      const res = await como('estudiante10')
        .voz()
        .field('actividadId', txt(e.ids.hablaE))
        .expect(201);
      expect(res.body.estadoGrabacion).toBe('NO_ENVIADA');
    });

    it('audio disfrazado → 422; más de 10 MB → 413; duración inválida → 400', async () => {
      await como('estudiante10')
        .voz()
        .field('actividadId', txt(e.ids.hablaE))
        .attach('audio', ARCHIVOS.falso, {
          filename: 'v.m4a',
          contentType: 'audio/mp4',
        })
        .expect(422);
      const grande = Buffer.concat([
        ARCHIVOS.m4a,
        Buffer.alloc(10 * 1024 * 1024),
      ]);
      await como('estudiante10')
        .voz()
        .field('actividadId', txt(e.ids.hablaE))
        .attach('audio', grande, {
          filename: 'g.m4a',
          contentType: 'audio/mp4',
        })
        .expect(413);
      await como('estudiante10')
        .voz()
        .field('actividadId', txt(e.ids.hablaE))
        .field('duracionSeg', '999')
        .expect(400);
    });

    it('un adulto no registra intentos → 403', async () => {
      await como('acudiente4')
        .voz()
        .field('actividadId', txt(e.ids.hablaE))
        .attach('audio', ARCHIVOS.m4a, {
          filename: 'voz.m4a',
          contentType: 'audio/mp4',
        })
        .expect(403);
    });
  });

  describe('GET /intentos/:id', () => {
    it('lo ven el estudiante, su tallerista y su acudiente; ajeno → 404', async () => {
      const creado = await como('estudiante10')
        .post('/intentos', {
          actividadId: txt(e.ids.memoria),
          resultado: { pairs: 2, mismatches: 1 },
        })
        .expect(201);
      const ruta = `/intentos/${creado.body.id}`;
      for (const t of [
        'estudiante10',
        'tallerista2',
        'acudiente4',
        'directora',
      ] as const) {
        await como(t).get(ruta).expect(200);
      }
      await como('tallerista3').get(ruta).expect(404);
      await como('acudiente5').get(ruta).expect(404);
      await como('directora').get('/intentos/abc').expect(400);
    });
  });

  describe('práctica de vocales', () => {
    it('estrellas y «Sigue donde ibas» del estudiante con sesión', async () => {
      const vocales = await como('estudiante10')
        .get('/estudiantes/me/practica-vocales')
        .expect(200);
      expect(vocales.body[0]).toEqual({ vocal: 'a', estrellas: 2 });
      await como('estudiante10')
        .get('/estudiantes/me/punto-retorno')
        .expect(200, {
          puntoRetorno: { tipoJuego: 'HABLA_CONMIGO', vocal: 'a' },
        });
      await como('tallerista2')
        .get('/estudiantes/me/practica-vocales')
        .expect(403);
    });
  });
});
