import { readdir } from 'node:fs/promises';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DIRECTORIO_SUBIDAS } from '../src/common/almacenamiento/subidas.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';
import { TOKENS_ESCENARIO } from './dobles/escenario-estudiantes.js';
import { ARCHIVOS, escenarioModulos } from './dobles/escenario-modulos.js';
import { VerificadorTokenFalso } from './dobles/verificador-token-falso.js';

type Token = keyof typeof TOKENS_ESCENARIO | null;

describe('Catálogo, módulos, contenidos y actividades (e2e)', () => {
  let app: INestApplication<App>;
  let e: ReturnType<typeof escenarioModulos>;

  beforeEach(async () => {
    e = escenarioModulos();
    app = await crearAppDePrueba({
      usuarios: e.usuarios,
      estudiantes: e.estudiantes,
      catalogo: e.catalogo,
      almacen: e.almacen,
      modulos: e.modulos,
      verificador: new VerificadorTokenFalso(TOKENS_ESCENARIO),
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
      post: (ruta: string, cuerpo: object = {}) =>
        con(agente.post(`/api/v1${ruta}`).send(cuerpo)),
      patch: (ruta: string, cuerpo: object) =>
        con(agente.patch(`/api/v1${ruta}`).send(cuerpo)),
      put: (ruta: string, cuerpo: object) =>
        con(agente.put(`/api/v1${ruta}`).send(cuerpo)),
      delete: (ruta: string) => con(agente.delete(`/api/v1${ruta}`)),
      subir: (ruta: string) => con(agente.post(`/api/v1${ruta}`)),
    };
  };

  describe('catálogo (cualquier persona con sesión)', () => {
    it('niveles, categorías, tipos de juego y música activa', async () => {
      const niveles = await como('estudiante10').get('/niveles').expect(200);
      expect(niveles.body.map((n: { nombre: string }) => n.nombre)).toEqual([
        'BAJO',
        'MEDIO',
        'ALTO',
      ]);
      await como('acudiente4').get('/categorias').expect(200);
      const tipos = await como('tallerista2').get('/tipos-juego').expect(200);
      expect(tipos.body).toHaveLength(6);
      const musica = await como('directora').get('/musica').expect(200);
      expect(musica.body).toEqual([
        {
          id: '1',
          titulo: 'Canon',
          autor: 'Pachelbel',
          tipo: 'CLASICA',
          urlAudio: 'https://musica.test/1.mp3',
        },
      ]);
    });

    it('sin token → 401', async () => {
      await como(null).get('/niveles').expect(401);
    });
  });

  describe('módulos', () => {
    it('listado según el rol; estudiante → 403', async () => {
      const ids = (b: { items: Array<{ id: string }> }) =>
        b.items.map((m) => m.id);
      expect(
        ids((await como('directora').get('/modulos').expect(200)).body),
      ).toEqual(['1', '2', '3']);
      expect(
        ids((await como('tallerista3').get('/modulos').expect(200)).body),
      ).toEqual(['1', '2']);
      await como('estudiante10').get('/modulos').expect(403);
      await como('directora').get('/modulos?publicado=quizas').expect(400);
    });

    it('ver: estudiante y acudiente solo lo asignado; lo ajeno → 404', async () => {
      await como('estudiante10').get('/modulos/1').expect(200);
      await como('acudiente4').get('/modulos/1').expect(200);
      await como('acudiente5').get('/modulos/1').expect(404);
      await como('estudiante10').get('/modulos/3').expect(404);
      await como('tallerista2').get('/modulos/2').expect(404); // borrador ajeno
      await como('directora').get('/modulos/abc').expect(400);
    });

    it('la tallerista crea, edita y elimina su módulo; otra no puede tocarlo', async () => {
      const creado = await como('tallerista3')
        .post('/modulos', { categoriaId: '1', nivelId: '2', nombre: 'Vocal E' })
        .expect(201);
      expect(creado.body).toMatchObject({
        nombre: 'Vocal E',
        publicado: false,
        creadoPor: { id: '3', displayName: 'Tomás Rey' },
        nivel: { id: '2', nombre: 'MEDIO' },
      });
      const id = creado.body.id as string;

      await como('tallerista3')
        .patch(`/modulos/${id}`, { descripcion: 'Repaso' })
        .expect(200);
      await como('tallerista2')
        .patch(`/modulos/${id}`, { nombre: 'X' })
        .expect(404); // borrador ajeno
      await como('tallerista3')
        .patch('/modulos/1', { nombre: 'X' })
        .expect(403); // publicado ajeno
      await como('tallerista3').delete(`/modulos/${id}`).expect(204);
      await como('directora').get(`/modulos/${id}`).expect(404);
    });

    it('validaciones: 400 de DTO, 422 de referencias, 409 con asignaciones', async () => {
      const res = await como('directora')
        .post('/modulos', { nivelId: '1', nombre: '' })
        .expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('categoriaId debe ser un id numérico'),
          'nombre debe tener al menos 1 caracteres.',
        ]),
      );
      await como('directora')
        .post('/modulos', { categoriaId: '9', nivelId: '1', nombre: 'X' })
        .expect(422);
      await como('acudiente4')
        .post('/modulos', { categoriaId: '1', nivelId: '1', nombre: 'X' })
        .expect(403);
      await como('tallerista2').delete('/modulos/1').expect(409);
    });

    it('publicar: solo la directora y con al menos una actividad activa', async () => {
      await como('tallerista2').post('/modulos/1/publicacion').expect(403);
      await como('directora').post('/modulos/3/publicacion').expect(422);
      await como('directora')
        .post('/modulos/3/actividades', {
          tipoJuego: 'BUSCA_LA_BOCA',
          titulo: 'Busca la boca',
          configuracion: { vocales: ['a', 'e'] },
        })
        .expect(201);
      const res = await como('directora')
        .post('/modulos/3/publicacion')
        .expect(200);
      expect(res.body.publicado).toBe(true);
      await como('directora').delete('/modulos/3/publicacion').expect(200);
    });
  });

  describe('contenidos (multipart y URLs firmadas)', () => {
    /** Archivos temporales de subida (a disco, nunca en memoria). */
    const temporales = () =>
      readdir(DIRECTORIO_SUBIDAS).catch(() => [] as string[]);
    let antes: string[];

    beforeEach(async () => {
      antes = await temporales();
    });

    afterEach(async () => {
      // Pase lo que pase (201, 400, 403, 413, 422, 503), no queda ningún temporal.
      const nuevos = (await temporales()).filter((f) => !antes.includes(f));
      expect(nuevos).toEqual([]);
    });

    it('sube un MP4 al bucket privado y entrega una URL firmada', async () => {
      const subido = await como('tallerista2')
        .subir('/modulos/1/contenidos')
        .field('tipo', 'VIDEO')
        .field('titulo', 'Mira la e')
        .field('orden', '2')
        .attach('archivo', ARCHIVOS.mp4, {
          filename: 'e.mp4',
          contentType: 'video/mp4',
        })
        .expect(201);
      expect(subido.body).toMatchObject({
        moduloId: '1',
        tipo: 'VIDEO',
        titulo: 'Mira la e',
        orden: 2,
      });
      expect(JSON.stringify(subido.body)).not.toContain('modulo/1/contenido');
      expect(
        e.almacen.rutas('contenidos').some((r) => r.endsWith('.mp4')),
      ).toBe(true);

      const url = await como('estudiante10')
        .get(`/contenidos/${subido.body.id}/url`)
        .expect(200);
      expect(url.body).toEqual({
        url: expect.stringMatching(
          /^https:\/\/almacen\.test\/contenidos\/modulo\/1\/contenido\//,
        ),
        expiraEn: expect.any(String),
      });
    });

    it('un archivo disfrazado de video → 422; sin archivo → 400', async () => {
      await como('tallerista2')
        .subir('/modulos/1/contenidos')
        .field('tipo', 'VIDEO')
        .field('titulo', 'Falso')
        .attach('archivo', ARCHIVOS.falso, {
          filename: 'v.mp4',
          contentType: 'video/mp4',
        })
        .expect(422);
      const res = await como('tallerista2')
        .subir('/modulos/1/contenidos')
        .field('tipo', 'VIDEO')
        .field('titulo', 'Sin archivo')
        .expect(400);
      expect(res.body.message).toEqual(['Falta el archivo (campo "archivo").']);
    });

    it('más de 50 MB → 413', async () => {
      const grande = Buffer.concat([
        ARCHIVOS.mp4,
        Buffer.alloc(50 * 1024 * 1024),
      ]);
      await como('tallerista2')
        .subir('/modulos/1/contenidos')
        .field('tipo', 'VIDEO')
        .field('titulo', 'Muy grande')
        .attach('archivo', grande, {
          filename: 'g.mp4',
          contentType: 'video/mp4',
        })
        .expect(413);
    });

    it('otra tallerista → 403; acudiente → 403; Storage caído → 503', async () => {
      const subir = (token: Token) =>
        como(token)
          .subir('/modulos/1/contenidos')
          .field('tipo', 'IMAGEN')
          .field('titulo', 'Avión')
          .attach('archivo', ARCHIVOS.png, {
            filename: 'a.png',
            contentType: 'image/png',
          });
      await subir('tallerista3').expect(403);
      await subir('acudiente4').expect(403);
      e.almacen.caido = true;
      await subir('tallerista2').expect(503);
    });

    it('URLs del módulo en una llamada; estudiante sin el módulo asignado → 404', async () => {
      const res = await como('acudiente4')
        .get('/modulos/1/contenidos/urls')
        .expect(200);
      expect(
        res.body.map((u: { contenidoId: string }) => u.contenidoId),
      ).toEqual([e.ids.imagen.toString(), e.ids.video.toString()]);
      await como('acudiente5')
        .get(`/contenidos/${e.ids.imagen}/url`)
        .expect(404);
    });

    it('no se elimina un contenido en uso (409)', async () => {
      await como('tallerista2')
        .put(`/actividades/${e.ids.habla}/contenidos`, {
          elementos: [
            { contenidoId: e.ids.imagen.toString(), palabra: 'avión' },
          ],
        })
        .expect(200);
      await como('tallerista2')
        .delete(`/contenidos/${e.ids.imagen}`)
        .expect(409);
      await como('tallerista2')
        .delete(`/contenidos/${e.ids.video}`)
        .expect(204);
    });
  });

  describe('actividades con caras (configuración de juegos)', () => {
    const memoria = () => ({
      tipoJuego: 'MEMORIA',
      titulo: 'Parejas',
      configuracion: {
        tableros: [
          {
            parejas: [
              { etiqueta: 'avión', imagenContenidoId: e.ids.imagen.toString() },
              { etiqueta: 'a', texto: 'A' },
            ],
          },
        ],
      },
    });

    it('MEMORIA: actividad_contenido sale de las caras; el contenido queda en uso', async () => {
      const creada = await como('tallerista2')
        .post('/modulos/1/actividades', memoria())
        .expect(201);
      const detalle = await como('tallerista2')
        .get(`/actividades/${creada.body.id}`)
        .expect(200);
      expect(detalle.body.elementos).toEqual([
        expect.objectContaining({
          contenidoId: e.ids.imagen.toString(),
          palabra: 'avión',
          imagenContenidoId: e.ids.imagen.toString(),
        }),
      ]);
      await como('tallerista2')
        .delete(`/contenidos/${e.ids.imagen}`)
        .expect(409);
      // Sus contenidos no se editan a mano.
      await como('tallerista2')
        .put(`/actividades/${creada.body.id}/contenidos`, { elementos: [] })
        .expect(422);
    });

    it('cita un VIDEO como imagen, o un contenido de otro módulo → 422', async () => {
      const conVideo = memoria();
      conVideo.configuracion.tableros[0]!.parejas[0]!.imagenContenidoId =
        e.ids.video.toString();
      await como('tallerista2')
        .post('/modulos/1/actividades', conVideo)
        .expect(422);
      const ajeno = memoria();
      ajeno.configuracion.tableros[0]!.parejas[0]!.imagenContenidoId = '999';
      const res = await como('tallerista2')
        .post('/modulos/1/actividades', ajeno)
        .expect(422);
      expect(res.body.message).toMatch(
        /cita el contenido 999.*no es de este módulo/,
      );
    });

    it('regla 11: tiempo límite, vidas o penalización → 422', async () => {
      const res = await como('tallerista2')
        .post('/modulos/1/actividades', {
          tipoJuego: 'BUSCA_LA_BOCA',
          titulo: 'Con reloj',
          configuracion: { vocales: ['a'], tiempoLimiteSeg: 30 },
        })
        .expect(422);
      expect(res.body.message).toMatch(
        /no usa tiempo límite, vidas ni penalizaciones/,
      );
    });
  });

  describe('actividades', () => {
    it('crea HABLA_CONMIGO con su vocal; configuración inválida → 422', async () => {
      const res = await como('tallerista2')
        .post('/modulos/1/actividades', {
          tipoJuego: 'HABLA_CONMIGO',
          titulo: 'Di la e',
          configuracion: { vocal: 'e' },
        })
        .expect(201);
      expect(res.body).toMatchObject({
        tipoJuego: { codigo: 'HABLA_CONMIGO' },
        configuracion: { vocal: 'e' },
      });
      await como('tallerista2')
        .post('/modulos/1/actividades', {
          tipoJuego: 'HABLA_CONMIGO',
          titulo: 'X',
          configuracion: { vocal: 'z' },
        })
        .expect(422);
      await como('tallerista2')
        .post('/modulos/1/actividades', { tipoJuego: 'AJEDREZ', titulo: 'X' })
        .expect(400);
    });

    it('el estudiante ve solo las activas y el detalle con sus contenidos', async () => {
      const lista = await como('estudiante10')
        .get('/modulos/1/actividades')
        .expect(200);
      expect(lista.body.map((a: { id: string }) => a.id)).toEqual([
        e.ids.habla.toString(),
      ]);
      await como('estudiante10')
        .get(`/actividades/${e.ids.inactiva}`)
        .expect(404);

      await como('tallerista2')
        .put(`/actividades/${e.ids.habla}/contenidos`, {
          elementos: [
            {
              contenidoId: e.ids.video.toString(),
              imagenContenidoId: e.ids.imagen.toString(),
              kinemaContenidoId: e.ids.video.toString(),
            },
          ],
        })
        .expect(200);
      const detalle = await como('estudiante10')
        .get(`/actividades/${e.ids.habla}`)
        .expect(200);
      expect(detalle.body.elementos).toEqual([
        {
          contenidoId: e.ids.video.toString(),
          rolEnJuego: null,
          orden: 0,
          palabra: null,
          imagenContenidoId: e.ids.imagen.toString(),
          kinemaContenidoId: e.ids.video.toString(),
          audioContenidoId: null,
        },
      ]);
    });

    it('elementos inválidos → 400 (DTO) o 422 (reglas); estudiante → 403', async () => {
      await como('tallerista2')
        .put(`/actividades/${e.ids.habla}/contenidos`, {
          elementos: [{ contenidoId: 'x' }],
        })
        .expect(400);
      await como('tallerista2')
        .put(`/actividades/${e.ids.habla}/contenidos`, {
          elementos: [{ contenidoId: '999' }],
        })
        .expect(422);
      await como('estudiante10')
        .put(`/actividades/${e.ids.habla}/contenidos`, { elementos: [] })
        .expect(403);
    });

    it('desactivar y eliminar', async () => {
      await como('tallerista2')
        .patch(`/actividades/${e.ids.habla}`, { activa: false })
        .expect(200);
      e.modulos.actividadesConIntentos.add(e.ids.habla);
      await como('tallerista2')
        .delete(`/actividades/${e.ids.habla}`)
        .expect(409);
      await como('tallerista2')
        .delete(`/actividades/${e.ids.inactiva}`)
        .expect(204);
      await como('tallerista3')
        .delete(`/actividades/${e.ids.habla}`)
        .expect(403);
    });
  });
});
