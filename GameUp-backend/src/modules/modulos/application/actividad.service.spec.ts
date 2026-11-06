import {
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
import { RegistroJuegosService } from '../../catalogo/application/registro-juegos.service.js';
import { estrategiasDelMvp } from '../../catalogo/domain/juegos/estrategias.js';
import type { ElementoActividad } from '../domain/modulo.entity.js';
import { AccesoModuloService } from './acceso-modulo.service.js';
import { ActividadService } from './actividad.service.js';

const SIN_CAMBIOS = {
  titulo: null,
  instruccionTexto: null,
  configuracion: null,
  orden: null,
  activa: null,
};

const elemento = (
  contenidoId: bigint,
  extra: Partial<ElementoActividad> = {},
): ElementoActividad => ({
  contenidoId,
  rolEnJuego: null,
  orden: 0,
  palabra: null,
  imagenContenidoId: null,
  kinemaContenidoId: null,
  audioContenidoId: null,
  ...extra,
});

describe('ActividadService', () => {
  let e: ReturnType<typeof escenarioModulos>;
  let servicio: ActividadService;

  beforeEach(() => {
    e = escenarioModulos();
    servicio = new ActividadService(
      e.modulos.actividadRepo,
      e.modulos.contenidoRepo,
      e.catalogo,
      new RegistroJuegosService(estrategiasDelMvp()),
      new AccesoModuloService(e.modulos.moduloRepo),
    );
  });

  it('el estudiante ve solo las activas; la tallerista, todas', async () => {
    expect((await servicio.listar(ESTUDIANTE_10, 1n)).map((a) => a.id)).toEqual(
      [e.ids.habla],
    );
    expect(await servicio.listar(TALLERISTA_2, 1n)).toHaveLength(2);
    await expect(
      servicio.obtener(ESTUDIANTE_10, e.ids.inactiva),
    ).rejects.toThrow(new RecursoNoEncontradoError('La actividad no existe.'));
  });

  describe('crear', () => {
    const datos = {
      tipoJuego: 'HABLA_CONMIGO',
      titulo: ' Di la e ',
      instruccionTexto: '  ',
      configuracion: { vocal: 'e' },
      orden: 1,
      activa: true,
    };

    it('valida la configuración con la estrategia del juego', async () => {
      const a = await servicio.crear(TALLERISTA_2, 1n, datos);
      expect(a).toMatchObject({
        titulo: 'Di la e',
        instruccionTexto: null,
        configuracion: { vocal: 'e' },
        tipoJuego: { codigo: 'HABLA_CONMIGO' },
      });
    });

    it('configuración inválida → 422', async () => {
      await expect(
        servicio.crear(TALLERISTA_2, 1n, {
          ...datos,
          configuracion: { vocal: 'x' },
        }),
      ).rejects.toThrow(ReglaNegocioError);
      await expect(
        servicio.crear(TALLERISTA_2, 1n, {
          ...datos,
          tipoJuego: 'MEMORIA',
          configuracion: { x: 1 },
        }),
      ).rejects.toThrow(/no admite: x/);
    });

    it('tipo de juego inexistente → 422; módulo ajeno → 403', async () => {
      await expect(
        servicio.crear(TALLERISTA_2, 1n, { ...datos, tipoJuego: 'AJEDREZ' }),
      ).rejects.toThrow('El tipo de juego AJEDREZ no existe.');
      await expect(servicio.crear(TALLERISTA_3, 1n, datos)).rejects.toThrow(
        AccesoDenegadoError,
      );
    });
  });

  it('actualizar re-valida la configuración con el MISMO tipo de juego', async () => {
    await expect(
      servicio.actualizar(TALLERISTA_2, e.ids.habla, {
        ...SIN_CAMBIOS,
        configuracion: { vocal: 'o' },
      }),
    ).resolves.toMatchObject({ configuracion: { vocal: 'o' } });
    await expect(
      servicio.actualizar(TALLERISTA_2, e.ids.habla, {
        ...SIN_CAMBIOS,
        configuracion: {},
      }),
    ).rejects.toThrow(ReglaNegocioError);
    await expect(
      servicio.actualizar(TALLERISTA_2, e.ids.habla, {
        ...SIN_CAMBIOS,
        instruccionTexto: 'borrar',
      }),
    ).resolves.toMatchObject({ instruccionTexto: null });
  });

  it('eliminar: con intentos → 409; sin intentos → se borra', async () => {
    e.modulos.actividadesConIntentos.add(e.ids.habla);
    await expect(servicio.eliminar(TALLERISTA_2, e.ids.habla)).rejects.toThrow(
      ConflictoError,
    );
    await servicio.eliminar(DIRECTORA, e.ids.inactiva);
    expect(
      await e.modulos.actividadRepo.buscarPorId(e.ids.inactiva),
    ).toBeNull();
  });

  describe('actividades de la escalera de niveles', () => {
    const parejas = (n: number) => ({
      tableros: [
        {
          parejas: Array.from({ length: n }, (_, i) => ({
            etiqueta: `carta ${i + 1}`,
            texto: '🍎',
          })),
        },
      ],
    });
    let nivel3: bigint;

    beforeEach(() => {
      // Memoria nivel 3 en un módulo de la directora (en la base, el de la escalera).
      nivel3 = e.modulos.agregarActividad(3, 'MEMORIA', true, 3).id;
    });

    it('la configuración debe tener el tamaño de su nivel (Memoria 3 = 4 parejas)', async () => {
      await expect(
        servicio.actualizar(DIRECTORA, nivel3, {
          ...SIN_CAMBIOS,
          configuracion: parejas(4),
        }),
      ).resolves.toMatchObject({ nivelJuego: 3, configuracion: parejas(4) });
      await expect(
        servicio.actualizar(DIRECTORA, nivel3, {
          ...SIN_CAMBIOS,
          configuracion: parejas(3),
        }),
      ).rejects.toThrow(
        /Memoria nivel 3: configuracion.tableros\[0\] necesita 4 parejas \(tiene 3\)/,
      );
    });

    it('cambiar solo el título no revisa el nivel', async () => {
      await expect(
        servicio.actualizar(DIRECTORA, nivel3, {
          ...SIN_CAMBIOS,
          titulo: 'Memoria · nivel 3',
        }),
      ).resolves.toMatchObject({ titulo: 'Memoria · nivel 3', nivelJuego: 3 });
    });

    it('no se desactiva ni se elimina: cada nivel necesita su actividad', async () => {
      await expect(
        servicio.actualizar(DIRECTORA, nivel3, {
          ...SIN_CAMBIOS,
          activa: false,
        }),
      ).rejects.toThrow(/Cada nivel de la escalera necesita su actividad/);
      await expect(servicio.eliminar(DIRECTORA, nivel3)).rejects.toThrow(
        ReglaNegocioError,
      );
      expect(await e.modulos.actividadRepo.buscarPorId(nivel3)).toMatchObject({
        activa: true,
      });
    });

    it('las actividades de los módulos no tienen nivel ni esas reglas', async () => {
      expect(
        (await e.modulos.actividadRepo.buscarPorId(e.ids.habla))!.nivelJuego,
      ).toBeNull();
      await expect(
        servicio.actualizar(TALLERISTA_2, e.ids.habla, {
          ...SIN_CAMBIOS,
          activa: false,
        }),
      ).resolves.toMatchObject({ activa: false, nivelJuego: null });
    });
  });

  describe('reemplazarElementos', () => {
    it('si el contenido es una IMAGEN, se usa como imagen', async () => {
      const r = await servicio.reemplazarElementos(TALLERISTA_2, e.ids.habla, [
        elemento(e.ids.imagen, { palabra: ' avión ' }),
      ]);
      expect(r[0]).toMatchObject({
        imagenContenidoId: e.ids.imagen,
        palabra: 'avión',
      });
    });

    it('un VIDEO como contenido necesita imagen aparte; puede ser kinema', async () => {
      await expect(
        servicio.reemplazarElementos(TALLERISTA_2, e.ids.habla, [
          elemento(e.ids.video),
        ]),
      ).rejects.toThrow(/indica imagenContenidoId/);
      await expect(
        servicio.reemplazarElementos(TALLERISTA_2, e.ids.habla, [
          elemento(e.ids.video, {
            imagenContenidoId: e.ids.imagen,
            kinemaContenidoId: e.ids.video,
          }),
        ]),
      ).resolves.toHaveLength(1);
    });

    it.each([
      [
        'contenido de otro módulo',
        () => [elemento(999n)],
        /no es de este módulo/,
      ],
      [
        'contenido repetido',
        (i: bigint) => [elemento(i), elemento(i)],
        /repetido/,
      ],
    ])('%s → 422', async (_c, armar, mensaje) => {
      await expect(
        servicio.reemplazarElementos(
          TALLERISTA_2,
          e.ids.habla,
          armar(e.ids.imagen),
        ),
      ).rejects.toThrow(mensaje);
    });

    it('referencias de tipo incorrecto → 422', async () => {
      await expect(
        servicio.reemplazarElementos(TALLERISTA_2, e.ids.habla, [
          elemento(e.ids.imagen, { audioContenidoId: e.ids.video }),
        ]),
      ).rejects.toThrow('Elemento 1 (audio): debe ser AUDIO.');
      await expect(
        servicio.reemplazarElementos(TALLERISTA_2, e.ids.habla, [
          elemento(e.ids.video, { imagenContenidoId: e.ids.video }),
        ]),
      ).rejects.toThrow('Elemento 1 (imagen): debe ser IMAGEN.');
    });

    it('lista vacía deja la actividad sin contenidos', async () => {
      await expect(
        servicio.reemplazarElementos(TALLERISTA_2, e.ids.habla, []),
      ).resolves.toEqual([]);
    });
  });

  describe('contenidos derivados de la configuración', () => {
    const secuencia = (pasos: Array<Record<string, string>>) => ({
      tipoJuego: 'SECUENCIAR',
      titulo: 'Rutina',
      instruccionTexto: null,
      configuracion: { rutinas: [{ titulo: 'Lavarse', pasos }] },
      orden: 0,
      activa: true,
    });

    it('crear guarda las caras con imagen en actividad_contenido', async () => {
      const a = await servicio.crear(
        TALLERISTA_2,
        1n,
        secuencia([
          { etiqueta: 'abrir', imagenContenidoId: e.ids.imagen.toString() },
          { etiqueta: 'secar', texto: 'Secar' },
        ]),
      );
      expect(e.modulos.elementosPorActividad.get(a.id)).toEqual([
        expect.objectContaining({
          contenidoId: e.ids.imagen,
          imagenContenidoId: e.ids.imagen,
          palabra: 'abrir',
          orden: 0,
        }),
      ]);
    });

    it('cambiar la configuración reemplaza los contenidos', async () => {
      const a = await servicio.crear(
        TALLERISTA_2,
        1n,
        secuencia([
          { etiqueta: 'abrir', imagenContenidoId: e.ids.imagen.toString() },
          { etiqueta: 'secar', texto: 'Secar' },
        ]),
      );
      await servicio.actualizar(TALLERISTA_2, a.id, {
        ...SIN_CAMBIOS,
        configuracion: secuencia([
          { etiqueta: 'uno', texto: '1' },
          { etiqueta: 'dos', texto: '2' },
        ]).configuracion,
      });
      expect(e.modulos.elementosPorActividad.get(a.id)).toEqual([]);
    });

    it('cambiar solo el título no toca los contenidos', async () => {
      const a = await servicio.crear(
        TALLERISTA_2,
        1n,
        secuencia([
          { etiqueta: 'abrir', imagenContenidoId: e.ids.imagen.toString() },
          { etiqueta: 'secar', texto: 'Secar' },
        ]),
      );
      await servicio.actualizar(TALLERISTA_2, a.id, {
        ...SIN_CAMBIOS,
        titulo: 'Otra',
      });
      expect(e.modulos.elementosPorActividad.get(a.id)).toHaveLength(1);
    });

    it('una cara que cita un VIDEO como imagen → 422 sin crear nada', async () => {
      const antes = e.modulos.actividades.length;
      await expect(
        servicio.crear(
          TALLERISTA_2,
          1n,
          secuencia([
            { etiqueta: 'abrir', imagenContenidoId: e.ids.video.toString() },
            { etiqueta: 'secar', texto: 'Secar' },
          ]),
        ),
      ).rejects.toThrow(/cita el contenido .* debe ser IMAGEN/);
      expect(e.modulos.actividades).toHaveLength(antes);
    });

    it('en los juegos con caras no se editan los contenidos a mano (422)', async () => {
      const a = await servicio.crear(
        TALLERISTA_2,
        1n,
        secuencia([
          { etiqueta: 'uno', texto: '1' },
          { etiqueta: 'dos', texto: '2' },
        ]),
      );
      await expect(
        servicio.reemplazarElementos(TALLERISTA_2, a.id, []),
      ).rejects.toThrow(/salen de la configuración/);
    });
  });
});
