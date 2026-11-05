import {
  ACUDIENTE_4,
  ACUDIENTE_5,
  ESTUDIANTE_10,
  TALLERISTA_2,
  TALLERISTA_3,
} from '../../../../test/dobles/escenario-estudiantes.js';
import {
  ARCHIVOS,
  archivoTemporal,
  borrarTemporales,
  escenarioModulos,
} from '../../../../test/dobles/escenario-modulos.js';
import {
  AccesoDenegadoError,
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
  ServicioExternoNoDisponibleError,
} from '../../../common/errors/dominio.errors.js';
import { AccesoModuloService } from './acceso-modulo.service.js';
import { ContenidoService } from './contenido.service.js';

/** Archivo temporal real, como el que deja multer en disco. */
const archivo = archivoTemporal;

describe('ContenidoService', () => {
  let e: ReturnType<typeof escenarioModulos>;
  let servicio: ContenidoService;

  beforeEach(() => {
    e = escenarioModulos();
    servicio = new ContenidoService(
      e.modulos.contenidoRepo,
      e.almacen,
      new AccesoModuloService(e.modulos.moduloRepo),
    );
    vi.spyOn(servicio['logger'], 'warn').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await borrarTemporales();
  });

  describe('subir', () => {
    const datos = { tipo: 'VIDEO' as const, titulo: ' Mira la e ', orden: 1 };

    it('sube a modulo/<id>/contenido/<uuid>.mp4 y registra el contenido', async () => {
      const c = await servicio.subir(
        TALLERISTA_2,
        1n,
        datos,
        await archivo(ARCHIVOS.mp4, 'video/mp4'),
      );
      expect(c).toMatchObject({
        moduloId: 1n,
        tipo: 'VIDEO',
        titulo: 'Mira la e',
        orden: 1,
      });
      expect(c.ruta).toMatch(/^modulo\/1\/contenido\/[0-9a-f-]{36}\.mp4$/);
      expect(e.almacen.archivos.get(`contenidos/${c.ruta}`)?.tipoMime).toBe(
        'video/mp4',
      );
    });

    it('un archivo cuyos bytes no son lo que dice ser → 422 sin subir nada', async () => {
      const antes = e.almacen.archivos.size;
      await expect(
        servicio.subir(
          TALLERISTA_2,
          1n,
          datos,
          await archivo(ARCHIVOS.falso, 'video/mp4'),
        ),
      ).rejects.toThrow(/no es válido/);
      expect(e.almacen.archivos.size).toBe(antes);
    });

    it.each([
      ['VIDEO', ARCHIVOS.png, 'image/png'],
      ['IMAGEN', ARCHIVOS.mp4, 'video/mp4'],
      ['AUDIO', ARCHIVOS.png, 'image/png'],
    ] as const)(
      'tipo %s con un formato que no le corresponde → 422',
      async (tipo, bytes, mime) => {
        await expect(
          servicio.subir(
            TALLERISTA_2,
            1n,
            { ...datos, tipo },
            await archivo(bytes, mime),
          ),
        ).rejects.toThrow(ReglaNegocioError);
      },
    );

    it.each([
      ['ANIMACION', ARCHIVOS.webp, 'image/webp'],
      ['AUDIO', ARCHIVOS.m4a, 'audio/mp4'],
      ['AUDIO', ARCHIVOS.mp3, 'audio/mpeg'],
      ['IMAGEN', ARCHIVOS.jpeg, 'image/jpeg'],
    ] as const)('tipo %s acepta %s', async (tipo, bytes, mime) => {
      await expect(
        servicio.subir(
          TALLERISTA_2,
          1n,
          { ...datos, tipo },
          await archivo(bytes, mime),
        ),
      ).resolves.toMatchObject({ tipo });
    });

    it('si falla el registro, borra el archivo subido (compensación)', async () => {
      vi.spyOn(e.modulos.contenidoRepo, 'crear').mockRejectedValue(
        new Error('base caída'),
      );
      await expect(
        servicio.subir(
          TALLERISTA_2,
          1n,
          datos,
          await archivo(ARCHIVOS.mp4, 'video/mp4'),
        ),
      ).rejects.toThrow('base caída');
      expect(e.almacen.eliminados).toHaveLength(1);
    });

    it('Storage caído → 503; otra tallerista → 403; borrador ajeno → 404', async () => {
      e.almacen.caido = true;
      await expect(
        servicio.subir(
          TALLERISTA_2,
          1n,
          datos,
          await archivo(ARCHIVOS.mp4, 'video/mp4'),
        ),
      ).rejects.toThrow(ServicioExternoNoDisponibleError);
      e.almacen.caido = false;
      await expect(
        servicio.subir(
          TALLERISTA_3,
          1n,
          datos,
          await archivo(ARCHIVOS.mp4, 'video/mp4'),
        ),
      ).rejects.toThrow(AccesoDenegadoError);
      await expect(
        servicio.subir(
          TALLERISTA_2,
          2n,
          datos,
          await archivo(ARCHIVOS.mp4, 'video/mp4'),
        ),
      ).rejects.toThrow(RecursoNoEncontradoError);
    });
  });

  describe('URLs firmadas', () => {
    it('estudiante y acudiente del módulo asignado obtienen la URL (60 min)', async () => {
      const url = await servicio.url(ESTUDIANTE_10, e.ids.imagen);
      expect(url.url).toMatch(
        /^https:\/\/almacen\.test\/contenidos\/modulo\/1\//,
      );
      expect(url.expiraEn).toEqual(new Date('2026-11-05T16:00:00Z'));
      await expect(
        servicio.url(ACUDIENTE_4, e.ids.video),
      ).resolves.toBeDefined();
    });

    it('acudiente de otro estudiante → 404 «El contenido no existe.»', async () => {
      await expect(servicio.url(ACUDIENTE_5, e.ids.imagen)).rejects.toThrow(
        new RecursoNoEncontradoError('El contenido no existe.'),
      );
    });

    it('todas las del módulo en una llamada', async () => {
      const urls = await servicio.urlsDelModulo(ESTUDIANTE_10, 1n);
      expect(urls.map((u) => u.contenidoId)).toEqual([
        e.ids.imagen,
        e.ids.video,
      ]);
    });

    it('archivo que ya no está en Storage → 404', async () => {
      const huerfano = e.modulos.agregarContenido(1, 'AUDIO');
      await expect(servicio.url(TALLERISTA_2, huerfano.id)).rejects.toThrow(
        'El archivo del contenido no está disponible.',
      );
    });
  });

  describe('actualizar y eliminar', () => {
    it('cambia título y orden; título vacío → 422', async () => {
      await expect(
        servicio.actualizar(TALLERISTA_2, e.ids.video, {
          titulo: ' Nuevo ',
          orden: 3,
        }),
      ).resolves.toMatchObject({ titulo: 'Nuevo', orden: 3 });
      await expect(
        servicio.actualizar(TALLERISTA_2, e.ids.video, {
          titulo: '  ',
          orden: null,
        }),
      ).rejects.toThrow(ReglaNegocioError);
    });

    it('en uso por una actividad → 409; si no, borra registro y archivo', async () => {
      e.modulos.elementosPorActividad.set(e.ids.habla, [
        {
          contenidoId: e.ids.video,
          rolEnJuego: null,
          orden: 0,
          palabra: null,
          imagenContenidoId: e.ids.imagen,
          kinemaContenidoId: null,
          audioContenidoId: null,
        },
      ]);
      await expect(
        servicio.eliminar(TALLERISTA_2, e.ids.imagen),
      ).rejects.toThrow(ConflictoError);

      e.modulos.elementosPorActividad.clear();
      const ruta = (await e.modulos.contenidoRepo.buscarPorId(e.ids.imagen))!
        .ruta;
      await servicio.eliminar(TALLERISTA_2, e.ids.imagen);
      expect(
        await e.modulos.contenidoRepo.buscarPorId(e.ids.imagen),
      ).toBeNull();
      expect(e.almacen.eliminados).toEqual([`contenidos/${ruta}`]);
    });
  });
});
