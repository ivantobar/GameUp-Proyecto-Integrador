import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { RELOJ, RelojFijo } from '../src/common/reloj/reloj.js';
import { CONSULTA_CONSENTIMIENTO } from '../src/modules/consentimiento/domain/consulta-consentimiento.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';
import {
  MODULO_ESCALERA,
  escenarioEscalera,
  resultadoEmparejar,
  resultadoMemoria,
} from './dobles/escenario-escalera.js';
import { TOKENS_ESCENARIO } from './dobles/escenario-estudiantes.js';
import { ARCHIVOS } from './dobles/escenario-modulos.js';
import { VerificadorTokenFalso } from './dobles/verificador-token-falso.js';

type Token = keyof typeof TOKENS_ESCENARIO | null;

interface NivelDto {
  juego: string;
  nivelActual: number;
  completado: boolean;
  pendientesValidacion: number;
}

describe('Escalera de niveles por juego (e2e)', () => {
  let app: INestApplication<App>;
  let e: Awaited<ReturnType<typeof escenarioEscalera>>;

  beforeEach(async () => {
    e = await escenarioEscalera();
    app = await crearAppDePrueba({
      usuarios: e.usuarios,
      estudiantes: e.estudiantes,
      catalogo: e.catalogo,
      almacen: e.almacen,
      modulos: e.modulos,
      asignaciones: e.asignaciones,
      intentos: e.intentos,
      validaciones: e.validaciones,
      nivelesJuego: e.nivelesJuego,
      verificador: new VerificadorTokenFalso(TOKENS_ESCENARIO),
      reemplazos: [
        { provide: CONSULTA_CONSENTIMIENTO, useValue: e.consentimiento },
        {
          provide: RELOJ,
          useValue: new RelojFijo(new Date('2026-11-06T15:00:00Z')),
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
      post: (ruta: string, cuerpo: object) =>
        con(agente.post(`/api/v1${ruta}`).send(cuerpo)),
      put: (ruta: string, cuerpo: object) =>
        con(agente.put(`/api/v1${ruta}`).send(cuerpo)),
      patch: (ruta: string, cuerpo: object) =>
        con(agente.patch(`/api/v1${ruta}`).send(cuerpo)),
    };
  }

  const nino = () => como('estudiante10');
  const tallerista = () => como('tallerista2');

  /** El niño juega el nivel `nivel` de Memoria (n+1 parejas). */
  async function jugarMemoria(nivel: number): Promise<string> {
    const res = await nino()
      .post('/intentos', {
        actividadId: e.escalera.memoria[nivel - 1]!.toString(),
        resultado: resultadoMemoria(nivel + 1),
      })
      .expect(201);
    return res.body.id as string;
  }

  async function aprobar(intentoId: string) {
    return (
      await tallerista()
        .post(`/intentos/${intentoId}/validacion`, { resultado: 'APROBADO' })
        .expect(200)
    ).body;
  }

  async function nivelDe(juego: string, token: Token = 'estudiante10') {
    const ruta =
      token === 'estudiante10'
        ? '/estudiantes/me/niveles-juego'
        : '/estudiantes/10/niveles-juego';
    const res = await como(token).get(ruta).expect(200);
    return (res.body as NivelDto[]).find((n) => n.juego === juego)!;
  }

  describe('nivel de cada juego', () => {
    it('todo niño empieza en el nivel 1 de los 4 juegos (sin juegos de habla)', async () => {
      const res = await nino().get('/estudiantes/me/niveles-juego').expect(200);
      expect(res.body).toEqual(
        ['EMPAREJAR', 'CLASIFICAR', 'SECUENCIAR', 'MEMORIA'].map((juego) =>
          expect.objectContaining({
            juego,
            nivelActual: 1,
            nivelMaximo: 5,
            completado: false,
            pendientesValidacion: 0,
          }),
        ),
      );
    });

    it('lo ven la directora, la tallerista a cargo y el acudiente; los demás → 404', async () => {
      for (const token of ['directora', 'tallerista2', 'acudiente4'] as const) {
        await como(token).get('/estudiantes/10/niveles-juego').expect(200);
      }
      await como('tallerista3')
        .get('/estudiantes/10/niveles-juego')
        .expect(404);
      await como('acudiente5').get('/estudiantes/10/niveles-juego').expect(404);
      await como('estudiante10')
        .get('/estudiantes/10/niveles-juego')
        .expect(403);
      await como('tallerista2')
        .get('/estudiantes/me/niveles-juego')
        .expect(403);
      await como(null).get('/estudiantes/me/niveles-juego').expect(401);
    });
  });

  describe('la actividad del nivel actual', () => {
    it('el niño la carga con sus imágenes aunque la escalera NO esté publicada', async () => {
      expect(
        e.modulos.modulos.find((m) => m.id === BigInt(MODULO_ESCALERA))!
          .publicado,
      ).toBe(false);

      const res = await nino()
        .get('/estudiantes/me/niveles-juego/MEMORIA/actividad')
        .expect(200);
      expect(res.body).toMatchObject({
        nivel: { juego: 'MEMORIA', nivelActual: 1 },
        actividad: {
          id: e.escalera.memoria[0]!.toString(),
          moduloId: String(MODULO_ESCALERA),
          nivelJuego: 1,
          tipoJuego: { codigo: 'MEMORIA' },
        },
      });
      expect(res.body.actividad.configuracion.tableros[0].parejas).toHaveLength(
        2,
      );

      // Lo mismo que hace la app: la actividad y las URLs de sus imágenes.
      await nino()
        .get(`/actividades/${e.escalera.memoria[0]}`)
        .expect(200)
        .expect((r) => expect(r.body.nivelJuego).toBe(1));
      const urls = await nino()
        .get(`/modulos/${MODULO_ESCALERA}/contenidos/urls`)
        .expect(200);
      expect(urls.body).toEqual([
        expect.objectContaining({ contenidoId: e.escalera.imagen.toString() }),
      ]);
      await nino().get(`/modulos/${MODULO_ESCALERA}`).expect(200);
    });

    it('un juego sin escalera o un nivel sin actividad → 404; otros roles → 403', async () => {
      await nino()
        .get('/estudiantes/me/niveles-juego/HABLA_CONMIGO/actividad')
        .expect(404);
      await nino()
        .get('/estudiantes/me/niveles-juego/CLASIFICAR/actividad')
        .expect(404); // la escalera de prueba no trae Clasificar
      await como('tallerista2')
        .get('/estudiantes/me/niveles-juego/MEMORIA/actividad')
        .expect(403);
    });

    it('la escalera no se desactiva por la API (cada nivel necesita su actividad)', async () => {
      await como('directora')
        .patch(`/actividades/${e.escalera.memoria[0]}`, { activa: false })
        .expect(422);
    });
  });

  describe('intentos de la escalera', () => {
    it('se aceptan sin asignación, solo del nivel actual', async () => {
      const res = await nino()
        .post('/intentos', {
          actividadId: e.escalera.memoria[0]!.toString(),
          resultado: resultadoMemoria(2),
        })
        .expect(201);
      expect(res.body).toMatchObject({
        asignacionId: null,
        nivelJuego: 1,
        estado: 'PENDIENTE_VALIDACION',
      });
      const otro = await nino()
        .post('/intentos', {
          actividadId: e.escalera.memoria[1]!.toString(),
          resultado: resultadoMemoria(3),
        })
        .expect(422);
      expect(otro.body.message).toBe(
        'Esa actividad es del nivel 2: en Memoria vas en el nivel 1.',
      );
    });

    it('no entran en el progreso oficial ni en las tareas pendientes', async () => {
      const antes = await nino().get('/estudiantes/me/progreso').expect(200);
      const tareasAntes = await nino()
        .get('/estudiantes/me/actividades-pendientes')
        .expect(200);
      await aprobar(await jugarMemoria(1));
      expect(
        (await nino().get('/estudiantes/me/progreso').expect(200)).body,
      ).toEqual(antes.body);
      expect(
        (await nino().get('/estudiantes/me/actividades-pendientes').expect(200))
          .body,
      ).toEqual(tareasAntes.body);
    });
  });

  describe('subir de nivel al aprobar', () => {
    it('aprobar sube 1 → 2 solo en ese juego; avisa al acudiente; el niño ve el nivel 2', async () => {
      const intento = await jugarMemoria(1);
      expect(await nivelDe('MEMORIA')).toMatchObject({
        nivelActual: 1,
        pendientesValidacion: 1,
      });
      const res = await aprobar(intento);
      expect(res.subidaNivel).toEqual({
        intentoId: intento,
        juego: 'MEMORIA',
        nivelAnterior: 1,
        nivelNuevo: 2,
        completado: false,
      });
      expect(await nivelDe('MEMORIA')).toMatchObject({
        nivelActual: 2,
        completado: false,
        pendientesValidacion: 0,
      });
      expect(await nivelDe('EMPAREJAR')).toMatchObject({ nivelActual: 1 });
      expect(await nivelDe('MEMORIA', 'acudiente4')).toMatchObject({
        nivelActual: 2,
      });
      expect(e.nivelesJuego.avisos).toEqual([
        {
          estudianteId: 10n,
          mensaje:
            'Martín José subió al nivel 2 de Memoria. ¡Celébrenlo juntos!',
        },
      ]);

      const actividad = await nino()
        .get('/estudiantes/me/niveles-juego/MEMORIA/actividad')
        .expect(200);
      expect(actividad.body.actividad.nivelJuego).toBe(2);
      expect(
        actividad.body.actividad.configuracion.tableros[0].parejas,
      ).toHaveLength(3);
      // El nivel 1 ya no se acepta.
      await nino()
        .post('/intentos', {
          actividadId: e.escalera.memoria[0]!.toString(),
          resultado: resultadoMemoria(2),
        })
        .expect(422);
    });

    it('«Practicar más» no cambia el nivel; puede repetirlo', async () => {
      const intento = await jugarMemoria(1);
      const res = await tallerista()
        .post(`/intentos/${intento}/validacion`, {
          resultado: 'RECHAZADO',
          retroalimentacion: 'Mira bien las cartas',
        })
        .expect(200);
      expect(res.body.subidaNivel).toBeNull();
      expect(await nivelDe('MEMORIA')).toMatchObject({ nivelActual: 1 });
      await jugarMemoria(1);
    });

    it('aprobar un intento de un nivel ya superado no sube', async () => {
      const viejo = await jugarMemoria(1);
      const nuevo = await jugarMemoria(1);
      expect((await aprobar(nuevo)).subidaNivel).toMatchObject({
        nivelNuevo: 2,
      });
      // El viejo (del nivel 1, ya superado) se puede validar, pero no sube.
      expect((await aprobar(viejo)).subidaNivel).toBeNull();
      expect(await nivelDe('MEMORIA')).toMatchObject({ nivelActual: 2 });
      expect(e.nivelesJuego.historial).toHaveLength(1);
    });

    it('en el nivel 5, aprobar lo completa, se celebra y sigue en el 5', async () => {
      e.nivelesJuego.poner(10n, 'MEMORIA', 5);
      const res = await aprobar(await jugarMemoria(5));
      expect(res.subidaNivel).toMatchObject({
        nivelAnterior: 5,
        nivelNuevo: 5,
        completado: true,
      });
      expect(await nivelDe('MEMORIA')).toMatchObject({
        nivelActual: 5,
        completado: true,
      });
      expect(e.nivelesJuego.avisos.at(-1)?.mensaje).toBe(
        'Martín José completó los 5 niveles de Memoria. ¡Qué gran logro!',
      );
      // Puede seguir jugando el 5; aprobarlo otra vez no cambia nada.
      const actividad = await nino()
        .get('/estudiantes/me/niveles-juego/MEMORIA/actividad')
        .expect(200);
      expect(actividad.body.actividad.nivelJuego).toBe(5);
      expect((await aprobar(await jugarMemoria(5))).subidaNivel).toBeNull();
      expect(await nivelDe('MEMORIA')).toMatchObject({
        nivelActual: 5,
        completado: true,
      });
    });

    it('un juego de habla no cambia ningún nivel', async () => {
      const voz = await request(app.getHttpServer())
        .post('/api/v1/intentos/habla-conmigo')
        .set('Authorization', 'Bearer estudiante10')
        .field('actividadId', e.ids.hablaE.toString())
        .attach('audio', ARCHIVOS.m4a, {
          filename: 'voz.m4a',
          contentType: 'audio/mp4',
        });
      expect(voz.status).toBe(201);
      await tallerista().get(`/intentos/${voz.body.id}/grabacion`).expect(200);
      const res = await aprobar(voz.body.id);
      expect(res.subidaNivel).toBeNull();
      const niveles = await nino().get('/estudiantes/me/niveles-juego');
      expect(
        (niveles.body as NivelDto[]).every((n) => n.nivelActual === 1),
      ).toBe(true);
    });

    it('una tallerista ajena no valida intentos de la escalera (404)', async () => {
      const intento = await jugarMemoria(1);
      await como('tallerista3')
        .post(`/intentos/${intento}/validacion`, { resultado: 'APROBADO' })
        .expect(404);
      expect(await nivelDe('MEMORIA')).toMatchObject({ nivelActual: 1 });
    });
  });

  describe('aprobar en lote', () => {
    it('sube como máximo un nivel por intento elegible y nunca salta niveles', async () => {
      const m1 = await jugarMemoria(1);
      const m2 = await jugarMemoria(1);
      const m3 = await jugarMemoria(1);
      const emp = (
        await nino()
          .post('/intentos', {
            actividadId: e.escalera.emparejar[0]!.toString(),
            resultado: resultadoEmparejar,
          })
          .expect(201)
      ).body.id as string;

      const res = await tallerista()
        .post('/validaciones/lote', { intentoIds: [m3, emp, m1, m2] })
        .expect(200);
      expect(res.body.aprobados).toBe(4);
      expect(res.body.subidas).toEqual([
        expect.objectContaining({
          intentoId: m1,
          juego: 'MEMORIA',
          nivelAnterior: 1,
          nivelNuevo: 2,
        }),
        expect.objectContaining({
          intentoId: emp,
          juego: 'EMPAREJAR',
          nivelNuevo: 2,
        }),
      ]);
      expect(await nivelDe('MEMORIA')).toMatchObject({ nivelActual: 2 });
      expect(await nivelDe('EMPAREJAR')).toMatchObject({ nivelActual: 2 });
    });
  });

  describe('bandeja de la tallerista', () => {
    it('muestra el nivel y junta los intentos repetidos del mismo nivel', async () => {
      const primero = await jugarMemoria(1);
      const segundo = await jugarMemoria(1);
      const res = await tallerista().get('/revisiones/pendientes').expect(200);
      const deEscalera = res.body.items.filter(
        (i: { actividad: { nivelJuego: number | null } }) =>
          i.actividad.nivelJuego !== null,
      );
      expect(deEscalera).toEqual([
        expect.objectContaining({
          intentoId: segundo,
          tipo: 'JUEGO',
          tipoJuego: 'MEMORIA',
          actividad: expect.objectContaining({ nivelJuego: 1 }),
          modulo: { id: String(MODULO_ESCALERA), nombre: 'Escalera de juegos' },
          pendientesMismaActividad: 2,
        }),
      ]);

      // Al aprobar el más reciente, el otro (nivel ya superado) desaparece.
      await aprobar(segundo);
      const despues = await tallerista()
        .get('/revisiones/pendientes')
        .expect(200);
      expect(
        despues.body.items.map((i: { intentoId: string }) => i.intentoId),
      ).not.toContain(primero);
    });

    it('otra tallerista no los ve', async () => {
      await jugarMemoria(1);
      const res = await como('tallerista3')
        .get('/revisiones/pendientes')
        .expect(200);
      expect(res.body.total).toBe(0);
    });
  });

  describe('ajuste manual', () => {
    it('la tallerista a cargo pone el nivel con motivo; queda en el historial', async () => {
      const res = await tallerista()
        .put('/estudiantes/10/niveles-juego/MEMORIA', {
          nivel: 4,
          motivo: '  Ya domina las parejas  ',
        })
        .expect(200);
      expect(res.body).toMatchObject({
        juego: 'MEMORIA',
        nivelActual: 4,
        completado: false,
      });
      expect(e.nivelesJuego.historial).toEqual([
        expect.objectContaining({
          estudianteId: 10n,
          juego: 'MEMORIA',
          origen: 'AJUSTE',
          nivelAnterior: 1,
          nivelNuevo: 4,
          cambiadoPor: 2n,
          motivo: 'Ya domina las parejas',
        }),
      ]);
      expect(e.nivelesJuego.avisos).toEqual([]); // el ajuste no avisa
      // La directora puede bajarlo.
      await como('directora')
        .put('/estudiantes/10/niveles-juego/MEMORIA', {
          nivel: 2,
          motivo: 'Repasar',
        })
        .expect(200);
      expect(await nivelDe('MEMORIA')).toMatchObject({ nivelActual: 2 });
    });

    it('motivo obligatorio, nivel válido, distinto del actual y solo juegos con escalera', async () => {
      await tallerista()
        .put('/estudiantes/10/niveles-juego/MEMORIA', { nivel: 3 })
        .expect(400);
      await tallerista()
        .put('/estudiantes/10/niveles-juego/MEMORIA', {
          nivel: 3,
          motivo: '   ',
        })
        .expect(422);
      await tallerista()
        .put('/estudiantes/10/niveles-juego/MEMORIA', {
          nivel: 6,
          motivo: 'x',
        })
        .expect(400);
      await tallerista()
        .put('/estudiantes/10/niveles-juego/MEMORIA', {
          nivel: 1,
          motivo: 'Ya está ahí',
        })
        .expect(422);
      await tallerista()
        .put('/estudiantes/10/niveles-juego/HABLA_CONMIGO', {
          nivel: 2,
          motivo: 'x',
        })
        .expect(404);
    });

    it('una tallerista ajena recibe 404; acudiente y estudiante, 403', async () => {
      const cuerpo = { nivel: 3, motivo: 'Prueba' };
      await como('tallerista3')
        .put('/estudiantes/10/niveles-juego/MEMORIA', cuerpo)
        .expect(404);
      await como('acudiente4')
        .put('/estudiantes/10/niveles-juego/MEMORIA', cuerpo)
        .expect(403);
      await nino()
        .put('/estudiantes/10/niveles-juego/MEMORIA', cuerpo)
        .expect(403);
      expect(await nivelDe('MEMORIA')).toMatchObject({ nivelActual: 1 });
    });
  });
});
