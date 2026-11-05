import {
  ACUDIENTE_4,
  ACUDIENTE_5,
  DIRECTORA,
  ESTUDIANTE_10,
  TALLERISTA_2,
  TALLERISTA_3,
} from '../../../../test/dobles/escenario-estudiantes.js';
import { escenarioModulos } from '../../../../test/dobles/escenario-modulos.js';
import {
  AccesoDenegadoError,
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import type { CambiosModulo } from '../domain/modulo.repository.js';
import { AccesoModuloService } from './acceso-modulo.service.js';
import { ModuloService } from './modulo.service.js';

const SIN_CAMBIOS: CambiosModulo = {
  categoriaId: null,
  nivelId: null,
  musicaId: null,
  nombre: null,
  descripcion: null,
  portadaContenidoId: null,
  orden: null,
};
const SIN_FILTRO = { categoriaId: null, nivelId: null, publicado: null };
const PAGINA = { page: 1, limit: 20 };

describe('AccesoModuloService y ModuloService', () => {
  let e: ReturnType<typeof escenarioModulos>;
  let acceso: AccesoModuloService;
  let servicio: ModuloService;

  beforeEach(() => {
    e = escenarioModulos();
    acceso = new AccesoModuloService(e.modulos.moduloRepo);
    servicio = new ModuloService(
      e.modulos.moduloRepo,
      e.modulos.contenidoRepo,
      e.catalogo,
      e.almacen,
      acceso,
    );
  });

  describe('quién ve qué', () => {
    it.each([
      ['directora → borrador ajeno', DIRECTORA, 2n],
      ['tallerista → publicado de otra', TALLERISTA_3, 1n],
      ['tallerista → su borrador', TALLERISTA_3, 2n],
      ['estudiante → módulo asignado', ESTUDIANTE_10, 1n],
      ['acudiente → módulo asignado a su hijo', ACUDIENTE_4, 1n],
    ])('ve: %s', async (_c, actor, id) => {
      await expect(acceso.ver(actor, id)).resolves.toMatchObject({ id });
    });

    it.each([
      ['tallerista → borrador ajeno', TALLERISTA_2, 2n],
      ['estudiante → módulo no asignado', ESTUDIANTE_10, 3n],
      ['acudiente → módulo de otro estudiante', ACUDIENTE_5, 1n],
      ['directora → inexistente', DIRECTORA, 999n],
    ])('404: %s', async (_c, actor, id) => {
      await expect(acceso.ver(actor, id)).rejects.toThrow(
        new RecursoNoEncontradoError('El módulo no existe.'),
      );
    });

    it('editar: la tallerista solo los suyos (403 en uno publicado ajeno)', async () => {
      await expect(acceso.editar(TALLERISTA_2, 1n)).resolves.toBeDefined();
      await expect(acceso.editar(TALLERISTA_3, 1n)).rejects.toThrow(
        AccesoDenegadoError,
      );
      await expect(acceso.editar(DIRECTORA, 2n)).resolves.toBeDefined();
    });

    it('listar: la tallerista ve publicados y los suyos', async () => {
      const ids = async (actor: typeof DIRECTORA) =>
        (await servicio.listar(actor, SIN_FILTRO, PAGINA)).items.map(
          (m) => m.id,
        );
      expect(await ids(DIRECTORA)).toEqual([1n, 2n, 3n]);
      expect(await ids(TALLERISTA_3)).toEqual([1n, 2n]);
      expect(await ids(TALLERISTA_2)).toEqual([1n]);
    });
  });

  describe('crear y actualizar', () => {
    const datos = {
      categoriaId: 1n,
      nivelId: 1n,
      musicaId: null,
      nombre: '  Vocal   E ',
      descripcion: null,
      orden: 0,
    };

    it('la tallerista crea un borrador a su nombre', async () => {
      const m = await servicio.crear(TALLERISTA_3, datos);
      expect(m).toMatchObject({
        nombre: 'Vocal E',
        publicado: false,
        creadoPor: { id: 3n },
      });
    });

    it.each([
      [
        'categoría inexistente',
        { categoriaId: 9n },
        'La categoría indicada no existe.',
      ],
      ['nivel inexistente', { nivelId: 9n }, 'El nivel indicado no existe.'],
      [
        'música inactiva',
        { musicaId: 2n },
        'La música indicada no existe o no está activa.',
      ],
    ])('%s → 422', async (_c, extra, mensaje) => {
      await expect(
        servicio.crear(TALLERISTA_3, { ...datos, ...extra }),
      ).rejects.toThrow(mensaje);
    });

    it('portada: solo una IMAGEN del mismo módulo; null la quita', async () => {
      const m = await servicio.actualizar(TALLERISTA_2, 1n, {
        ...SIN_CAMBIOS,
        portadaContenidoId: e.ids.imagen,
      });
      expect(m.portadaContenidoId).toBe(e.ids.imagen);
      await expect(
        servicio.actualizar(TALLERISTA_2, 1n, {
          ...SIN_CAMBIOS,
          portadaContenidoId: e.ids.video,
        }),
      ).rejects.toThrow(/debe ser un contenido de tipo IMAGEN/);
      await expect(
        servicio.actualizar(DIRECTORA, 3n, {
          ...SIN_CAMBIOS,
          portadaContenidoId: e.ids.imagen,
        }),
      ).rejects.toThrow(ReglaNegocioError);
      const sin = await servicio.actualizar(TALLERISTA_2, 1n, {
        ...SIN_CAMBIOS,
        portadaContenidoId: 'borrar',
      });
      expect(sin.portadaContenidoId).toBeNull();
    });

    it('otra tallerista no modifica un módulo publicado ajeno → 403', async () => {
      await expect(
        servicio.actualizar(TALLERISTA_3, 1n, { ...SIN_CAMBIOS, nombre: 'X' }),
      ).rejects.toThrow(AccesoDenegadoError);
    });
  });

  describe('publicar', () => {
    it('sin actividades activas no se publica (422)', async () => {
      await expect(servicio.publicar(DIRECTORA, 3n, true)).rejects.toThrow(
        'El módulo necesita al menos una actividad activa para publicarse.',
      );
      e.modulos.agregarActividad(3, 'MEMORIA', false);
      await expect(servicio.publicar(DIRECTORA, 3n, true)).rejects.toThrow(
        ReglaNegocioError,
      );
    });

    it('con una actividad activa se publica; despublicar siempre se puede', async () => {
      e.modulos.agregarActividad(3, 'MEMORIA');
      expect((await servicio.publicar(DIRECTORA, 3n, true)).publicado).toBe(
        true,
      );
      expect((await servicio.publicar(DIRECTORA, 1n, false)).publicado).toBe(
        false,
      );
    });
  });

  describe('eliminar', () => {
    it('con asignaciones → 409', async () => {
      await expect(servicio.eliminar(TALLERISTA_2, 1n)).rejects.toThrow(
        ConflictoError,
      );
    });

    it('sin asignaciones: borra el módulo y los archivos de sus contenidos', async () => {
      const c = e.modulos.agregarContenido(2, 'IMAGEN');
      e.almacen.guardar('contenidos', c.ruta, Buffer.alloc(1), 'image/png');
      await servicio.eliminar(TALLERISTA_3, 2n);
      expect(await e.modulos.moduloRepo.buscarPorId(2n)).toBeNull();
      expect(e.almacen.eliminados).toEqual([`contenidos/${c.ruta}`]);
    });

    it('si Storage falla después de borrar el módulo, no se revierte (queda en el log)', async () => {
      e.modulos.agregarContenido(2, 'IMAGEN');
      e.almacen.caido = true;
      vi.spyOn(servicio['logger'], 'warn').mockImplementation(() => undefined);
      await expect(
        servicio.eliminar(TALLERISTA_3, 2n),
      ).resolves.toBeUndefined();
      expect(await e.modulos.moduloRepo.buscarPorId(2n)).toBeNull();
    });
  });
});
