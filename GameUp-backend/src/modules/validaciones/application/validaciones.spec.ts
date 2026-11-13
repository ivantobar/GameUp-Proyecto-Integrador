import {
  ACUDIENTE_4,
  ACUDIENTE_5,
  DIRECTORA,
  ESTUDIANTE_10,
  TALLERISTA_2,
  TALLERISTA_3,
} from '../../../../test/dobles/escenario-estudiantes.js';
import {
  ARCHIVOS,
  archivoTemporal,
  borrarTemporales,
} from '../../../../test/dobles/escenario-modulos.js';
import { escenarioValidaciones } from '../../../../test/dobles/validaciones-en-memoria.js';
import type { ConfigService } from '@nestjs/config';
import {
  AccesoDenegadoError,
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
  ServicioExternoNoDisponibleError,
} from '../../../common/errors/dominio.errors.js';
import { RelojFijo } from '../../../common/reloj/reloj.js';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import { AsignacionService } from '../../asignaciones/application/asignacion.service.js';
import { AvanceAsignacionService } from '../../asignaciones/application/avance-asignacion.service.js';
import { RegistroJuegosService } from '../../catalogo/application/registro-juegos.service.js';
import { estrategiasDelMvp } from '../../catalogo/domain/juegos/estrategias.js';
import { ConsentimientoService } from '../../consentimiento/application/consentimiento.service.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import { ContextoIntentoService } from '../../intentos/application/contexto-intento.service.js';
import { HablaConmigoService } from '../../intentos/application/habla-conmigo.service.js';
import { IntentoService } from '../../intentos/application/intento.service.js';
import { RegistroEscuchaEnMemoria } from '../infrastructure/registro-escucha-en-memoria.js';
import {
  AUTORIZACION_NO_VERIFICABLE,
  AUTORIZACION_RETIRADA,
  ESCUCHA_OBLIGATORIA,
  GrabacionService,
} from './grabacion.service.js';
import { LimpiezaGrabaciones } from './limpieza-grabaciones.js';
import { ValidacionService } from './validacion.service.js';

const AHORA = new Date('2026-11-05T15:00:00Z');
const PAGINA = { page: 1, limit: 20 };

describe('Validación, audio y progreso', () => {
  let e: Awaited<ReturnType<typeof escenarioValidaciones>>;
  let reloj: RelojFijo;
  let intentos: IntentoService;
  let habla: HablaConmigoService;
  let grabaciones: GrabacionService;
  let servicio: ValidacionService;
  let avance: AvanceAsignacionService;
  /** Intentos creados en cada prueba. */
  let voz: bigint;
  let juego: bigint;
  let memoria: bigint;

  beforeEach(async () => {
    e = await escenarioValidaciones();
    reloj = new RelojFijo(AHORA);
    const acceso = new AccesoEstudianteService(e.estudiantes);
    const contexto = new ContextoIntentoService(
      e.modulos.actividadRepo,
      e.asignaciones,
      e.nivelesJuego,
    );
    const consentimiento = new ConsentimientoService(
      e.consentimiento,
      reloj,
      acceso,
    );
    intentos = new IntentoService(
      e.intentos,
      e.intentos,
      contexto,
      new RegistroJuegosService(estrategiasDelMvp()),
      acceso,
    );
    habla = new HablaConmigoService(
      e.intentos,
      e.intentos,
      e.almacen,
      contexto,
      consentimiento,
      acceso,
    );
    grabaciones = new GrabacionService(
      e.validaciones,
      e.almacen,
      reloj,
      intentos,
      new RegistroEscuchaEnMemoria(reloj),
      consentimiento,
      acceso,
    );
    vi.spyOn(grabaciones['logger'], 'warn').mockImplementation(() => undefined);
    vi.spyOn(grabaciones['logger'], 'log').mockImplementation(() => undefined);
    servicio = new ValidacionService(
      e.validaciones,
      e.validaciones,
      intentos,
      grabaciones,
    );
    const asignaciones = new AsignacionService(
      e.asignaciones,
      e.asignaciones,
      e.modulos.moduloRepo,
      reloj,
      acceso,
    );
    avance = new AvanceAsignacionService(
      e.asignaciones,
      e.modulos.actividadRepo,
      asignaciones,
      acceso,
    );

    voz = (
      await habla.registrar(
        ESTUDIANTE_10,
        e.ids.hablaE,
        3,
        await archivoTemporal(ARCHIVOS.m4a, 'audio/mp4'),
      )
    ).intento.id;
    juego = (
      await intentos.registrar(ESTUDIANTE_10, e.ids.emparejar, {
        firstTryCorrect: 1,
        total: 2,
      })
    ).id;
    memoria = (
      await intentos.registrar(ESTUDIANTE_10, e.ids.memoria, {
        pairs: 2,
        mismatches: 0,
      })
    ).id;
  });

  afterEach(async () => {
    await borrarTemporales();
  });

  const audioEnStorage = () => e.almacen.rutas('grabaciones');

  describe('bandeja «Por escuchar»', () => {
    it('la tallerista ve solo a sus estudiantes; la directora, a todos', async () => {
      const ids = async (actor: typeof DIRECTORA) =>
        (await servicio.pendientes(actor, null, PAGINA)).items.map(
          (i) => i.intentoId,
        );
      expect(await ids(TALLERISTA_2)).toEqual([voz, juego, memoria]);
      expect(await ids(DIRECTORA)).toEqual([voz, juego, memoria]);
      expect(await ids(TALLERISTA_3)).toEqual([]);
      expect((await servicio.pendientes(TALLERISTA_2, 12n, PAGINA)).total).toBe(
        0,
      );
    });

    it('el resumen cuenta por estudiante lo mismo que la bandeja y con su alcance', async () => {
      const bandeja = await servicio.pendientes(TALLERISTA_2, null, PAGINA);
      const esperado = [
        {
          estudiante: expect.objectContaining({ id: 10n }),
          pendientes: bandeja.total,
          masAntiguo: bandeja.items[0]!.fecha,
        },
      ];
      expect(await servicio.resumenPendientes(TALLERISTA_2)).toEqual(esperado);
      expect(await servicio.resumenPendientes(DIRECTORA)).toEqual(esperado);
      // Vínculo inactivo con el estudiante 10: no cuenta.
      expect(await servicio.resumenPendientes(TALLERISTA_3)).toEqual([]);

      await servicio.validar(TALLERISTA_2, juego, 'APROBADO', null);
      expect(await servicio.resumenPendientes(TALLERISTA_2)).toEqual([
        expect.objectContaining({ pendientes: bandeja.total - 1 }),
      ]);
    });

    it('el intento de voz trae el estado del audio y su vocal', async () => {
      const [item] = (await servicio.pendientes(TALLERISTA_2, null, PAGINA))
        .items;
      expect(item).toMatchObject({
        intentoId: voz,
        tipoJuego: 'HABLA_CONMIGO',
        actividad: { vocal: 'e' },
        estudiante: { id: 10n },
        grabacion: { disponible: true, vencido: false },
        resultado: { estadoGrabacion: 'ADJUNTA' },
      });
    });
  });

  describe('audio (URL firmada de 10 min)', () => {
    it('la tallerista a cargo la obtiene; otra tallerista → 404', async () => {
      const url = await grabaciones.urlAudio(TALLERISTA_2, voz);
      expect(url.url).toMatch(/grabaciones\/estudiante\/10\/intento\//);
      expect(url.expiraEn).toEqual(new Date(AHORA.getTime() + 10 * 60 * 1000));
      await expect(grabaciones.urlAudio(TALLERISTA_3, voz)).rejects.toThrow(
        RecursoNoEncontradoError,
      );
    });

    it('un intento sin audio → 404', async () => {
      await expect(grabaciones.urlAudio(TALLERISTA_2, juego)).rejects.toThrow(
        /no está disponible/,
      );
    });

    it('vuelve a consultar el consentimiento antes de entregar el audio', async () => {
      const antes = e.consentimiento.consultados.length;
      await grabaciones.urlAudio(TALLERISTA_2, voz);
      expect(e.consentimiento.consultados.length).toBe(antes + 1);
      expect(e.consentimiento.consultados.at(-1)).toMatchObject({
        idEstudianteExterno: expect.any(BigInt),
      });
    });

    it('autorización retirada → 403, no entrega el audio y NO lo borra', async () => {
      e.consentimiento.respuesta = {
        aceptaTratamiento: false,
        codigoVersion: 'TERMINOS-2026-01',
      };
      await expect(grabaciones.urlAudio(TALLERISTA_2, voz)).rejects.toThrow(
        new AccesoDenegadoError(AUTORIZACION_RETIRADA),
      );
      // Sin consentimiento vigente alguno (null) es lo mismo.
      e.consentimiento.respuesta = null;
      await expect(grabaciones.urlAudio(DIRECTORA, voz)).rejects.toThrow(
        AUTORIZACION_RETIRADA,
      );
      expect(audioEnStorage()).toHaveLength(1);
      expect(
        (await e.validaciones.buscarPorIntento(voz))?.eliminadaEn,
      ).toBeNull();
      // No cuenta como escuchado: validar sigue exigiendo la escucha.
      await expect(
        servicio.validar(TALLERISTA_2, voz, 'APROBADO', null),
      ).rejects.toThrow(ESCUCHA_OBLIGATORIA);
    });

    it('ASISCO UP caído → 503 (falla cerrado) y no borra nada', async () => {
      e.consentimiento.respuesta = 'CAIDA';
      await expect(grabaciones.urlAudio(TALLERISTA_2, voz)).rejects.toThrow(
        new ServicioExternoNoDisponibleError(AUTORIZACION_NO_VERIFICABLE),
      );
      expect(audioEnStorage()).toHaveLength(1);
    });

    it('el estudiante ajeno sigue dando 404 antes de consultar ASISCO UP', async () => {
      const antes = e.consentimiento.consultados.length;
      await expect(grabaciones.urlAudio(TALLERISTA_3, voz)).rejects.toThrow(
        RecursoNoEncontradoError,
      );
      expect(e.consentimiento.consultados.length).toBe(antes);
    });
  });

  describe('borrado a pedido de la directora (supresión)', () => {
    it('borra todas las grabaciones del estudiante y deja validar sin escuchar', async () => {
      const otra = (
        await habla.registrar(
          ESTUDIANTE_10,
          e.ids.hablaE,
          2,
          await archivoTemporal(ARCHIVOS.m4a, 'audio/mp4'),
        )
      ).intento.id;
      expect(audioEnStorage()).toHaveLength(2);

      await expect(
        grabaciones.borrarDeEstudiante(DIRECTORA, 10n),
      ).resolves.toEqual({ borradas: 2 });
      expect(audioEnStorage()).toEqual([]);
      for (const id of [voz, otra]) {
        expect(
          (await e.validaciones.buscarPorIntento(id))?.eliminadaEn,
        ).toEqual(AHORA);
      }
      // El audio ya no se entrega y se puede validar sin escucharlo.
      await expect(grabaciones.urlAudio(TALLERISTA_2, voz)).rejects.toThrow(
        /no está disponible/,
      );
      await expect(
        servicio.validar(TALLERISTA_2, voz, 'APROBADO', null),
      ).resolves.toMatchObject({
        intento: { validacion: { resultado: 'APROBADO' } },
      });
    });

    it('es idempotente: la segunda vez borra 0 y no llama a Storage', async () => {
      await grabaciones.borrarDeEstudiante(DIRECTORA, 10n);
      e.almacen.caido = true;
      await expect(
        grabaciones.borrarDeEstudiante(DIRECTORA, 10n),
      ).resolves.toEqual({ borradas: 0 });
    });

    it('si Storage falla → 503 y no marca nada (se puede repetir)', async () => {
      e.almacen.caido = true;
      await expect(
        grabaciones.borrarDeEstudiante(DIRECTORA, 10n),
      ).rejects.toThrow(ServicioExternoNoDisponibleError);
      expect(
        (await e.validaciones.buscarPorIntento(voz))?.eliminadaEn,
      ).toBeNull();
      e.almacen.caido = false;
      await expect(
        grabaciones.borrarDeEstudiante(DIRECTORA, 10n),
      ).resolves.toEqual({ borradas: 1 });
    });

    it('estudiante inexistente → 404', async () => {
      await expect(
        grabaciones.borrarDeEstudiante(DIRECTORA, 999n),
      ).rejects.toThrow(RecursoNoEncontradoError);
    });
  });

  describe('validar uno', () => {
    it('APROBADO: queda validado, cuenta para el progreso y borra el audio', async () => {
      await grabaciones.urlAudio(TALLERISTA_2, voz);
      const { intento: i, subida } = await servicio.validar(
        TALLERISTA_2,
        voz,
        'APROBADO',
        null,
      );
      expect(subida).toBeNull(); // Habla conmigo no tiene escalera
      expect(i.validacion).toMatchObject({
        resultado: 'APROBADO',
        retroalimentacion: null,
      });
      expect(audioEnStorage()).toEqual([]);
      expect((await e.validaciones.buscarPorIntento(voz))?.eliminadaEn).toEqual(
        AHORA,
      );
      await expect(grabaciones.urlAudio(TALLERISTA_2, voz)).rejects.toThrow(
        RecursoNoEncontradoError,
      );
      expect(e.validaciones.validadores.get(voz)).toBe(2n);
    });

    it('RECHAZADO exige retroalimentación; con ella, también borra el audio', async () => {
      await expect(
        servicio.validar(TALLERISTA_2, voz, 'RECHAZADO', '  '),
      ).rejects.toThrow(
        'Para pedir que practique más, la retroalimentación es obligatoria.',
      );
      expect(audioEnStorage()).toHaveLength(1);
      await grabaciones.urlAudio(TALLERISTA_2, voz);
      const { intento: i } = await servicio.validar(
        TALLERISTA_2,
        voz,
        'RECHAZADO',
        ' Abre  más la boca ',
      );
      expect(i.validacion).toMatchObject({
        resultado: 'RECHAZADO',
        retroalimentacion: 'Abre más la boca',
      });
      expect(audioEnStorage()).toEqual([]);
    });

    it('ya validado → 409; estudiante ajeno → 404', async () => {
      await servicio.validar(TALLERISTA_2, juego, 'APROBADO', null);
      await expect(
        servicio.validar(TALLERISTA_2, juego, 'APROBADO', null),
      ).rejects.toThrow(ConflictoError);
      await expect(
        servicio.validar(TALLERISTA_3, memoria, 'APROBADO', null),
      ).rejects.toThrow(new RecursoNoEncontradoError('El intento no existe.'));
    });

    it('si Storage falla al borrar, la validación queda y la limpieza lo reintenta', async () => {
      await grabaciones.urlAudio(TALLERISTA_2, voz);
      e.almacen.caido = true;
      await servicio.validar(TALLERISTA_2, voz, 'APROBADO', null);
      expect(
        (await e.validaciones.buscarPorIntento(voz))?.eliminadaEn,
      ).toBeNull();
      e.almacen.caido = false;
      await expect(grabaciones.limpiar()).resolves.toEqual({
        borradas: 1,
        fallidas: 0,
      });
      expect(audioEnStorage()).toEqual([]);
    });
  });

  describe('escuchar antes de validar (voz con audio)', () => {
    it('sin haber pedido el audio → 422 y no valida nada', async () => {
      await expect(
        servicio.validar(TALLERISTA_2, voz, 'APROBADO', null),
      ).rejects.toThrow(new ReglaNegocioError(ESCUCHA_OBLIGATORIA));
      expect((await intentos.obtener(TALLERISTA_2, voz)).validacion).toBeNull();
      expect(audioEnStorage()).toHaveLength(1);
    });

    it('cuenta quién lo pidió: si lo escuchó la directora, la tallerista no puede validar', async () => {
      await grabaciones.urlAudio(DIRECTORA, voz);
      await expect(
        servicio.validar(TALLERISTA_2, voz, 'APROBADO', null),
      ).rejects.toThrow(ESCUCHA_OBLIGATORIA);
      await expect(
        servicio.validar(DIRECTORA, voz, 'APROBADO', null),
      ).resolves.toMatchObject({
        intento: { validacion: { resultado: 'APROBADO' } },
      });
    });

    it('la escucha vence a las 12 horas', async () => {
      await grabaciones.urlAudio(TALLERISTA_2, voz);
      reloj.avanzar(12 * 60 * 60 * 1000 + 1);
      await expect(
        servicio.validar(TALLERISTA_2, voz, 'APROBADO', null),
      ).rejects.toThrow(ESCUCHA_OBLIGATORIA);
    });

    it('sin audio disponible (venció a los 30 días) se valida normal', async () => {
      await e.validaciones.marcarEliminadas(
        [(await e.validaciones.buscarPorIntento(voz))!.id],
        AHORA,
      );
      await expect(
        servicio.validar(TALLERISTA_2, voz, 'APROBADO', null),
      ).resolves.toMatchObject({
        intento: { validacion: { resultado: 'APROBADO' } },
      });
    });

    it('los juegos sin voz no lo exigen', async () => {
      await expect(
        servicio.validar(TALLERISTA_2, juego, 'APROBADO', null),
      ).resolves.toMatchObject({
        intento: { validacion: { resultado: 'APROBADO' } },
      });
    });
  });

  describe('aprobar en lote (juegos sin voz)', () => {
    it('aprueba todos de una vez', async () => {
      await expect(
        servicio.aprobarLote(TALLERISTA_2, [juego, memoria, juego]),
      ).resolves.toEqual({ aprobados: 2, subidas: [] });
      expect(
        (await intentos.obtener(TALLERISTA_2, memoria)).validacion?.resultado,
      ).toBe('APROBADO');
    });

    it.each([
      ['uno de voz', () => [juego, voz], /es de Habla conmigo/],
      ['uno inexistente', () => [juego, 999n], /el intento 999 no existe/],
    ])('con %s → 422 y no aprueba ninguno', async (_c, ids, mensaje) => {
      await expect(servicio.aprobarLote(TALLERISTA_2, ids())).rejects.toThrow(
        mensaje,
      );
      expect(
        (await intentos.obtener(TALLERISTA_2, juego)).validacion,
      ).toBeNull();
    });

    it('con uno ya validado → 422; de otra tallerista → «no existe»', async () => {
      await servicio.validar(TALLERISTA_2, memoria, 'APROBADO', null);
      await expect(
        servicio.aprobarLote(TALLERISTA_2, [juego, memoria]),
      ).rejects.toThrow(/ya fue validado/);
      await expect(servicio.aprobarLote(TALLERISTA_3, [juego])).rejects.toThrow(
        /no existe/,
      );
    });

    it('más de 50 → 422', async () => {
      const ids = Array.from({ length: 51 }, (_x, i) => BigInt(i + 1));
      await expect(servicio.aprobarLote(TALLERISTA_2, ids)).rejects.toThrow(
        ReglaNegocioError,
      );
    });
  });

  describe('retención de grabaciones (30 días)', () => {
    it('borra las nunca validadas de más de 30 días y deja las recientes', async () => {
      const antigua = (
        await habla.registrar(
          ESTUDIANTE_10,
          e.ids.habla,
          null,
          await archivoTemporal(ARCHIVOS.m4a, 'audio/mp4'),
        )
      ).intento.id;
      const fila = e.asignaciones.intentosFilas.find(
        (f) => (f as { id?: bigint }).id === antigua,
      ) as unknown as { grabacion: { creadaEn: Date } };
      fila.grabacion.creadaEn = new Date(
        AHORA.getTime() - 31 * 24 * 60 * 60 * 1000,
      );

      await expect(grabaciones.limpiar()).resolves.toEqual({
        borradas: 1,
        fallidas: 0,
      });
      expect(audioEnStorage()).toEqual([`estudiante/10/intento/${voz}.m4a`]);
      // En la bandeja, el intento sigue pendiente, con el audio vencido.
      const item = (
        await servicio.pendientes(TALLERISTA_2, null, PAGINA)
      ).items.find((i) => i.intentoId === antigua);
      expect(item?.grabacion).toEqual({ disponible: false, vencido: true });
    });

    it('sin nada que borrar no toca Storage', async () => {
      e.almacen.caido = true; // si lo tocara, fallaría
      await expect(grabaciones.limpiar()).resolves.toEqual({
        borradas: 0,
        fallidas: 0,
      });
    });

    it('la limpieza programada no rompe si falla; con 0 minutos no se programa', async () => {
      const config = (minutos: number) =>
        ({ get: () => minutos }) as unknown as ConfigService<
          EnvironmentVariables,
          true
        >;
      const limpieza = new LimpiezaGrabaciones(grabaciones, config(0));
      vi.spyOn(limpieza['logger'], 'warn').mockImplementation(() => undefined);
      limpieza.onApplicationBootstrap();
      expect(limpieza['temporizador']).toBeNull();
      vi.spyOn(grabaciones, 'limpiar').mockRejectedValueOnce(
        new Error('caída'),
      );
      await expect(limpieza.pasada()).resolves.toBeUndefined();
    });
  });

  describe('progreso oficial', () => {
    it('solo cuentan las aprobadas; las pendientes se informan aparte', async () => {
      const antes = await avance.progreso(ACUDIENTE_4, 10n);
      const m4 = antes.modulos.find((m) => m.asignacion.id === e.ids.a4)!;
      // Módulo 4: MEMORIA ya estaba aprobada (su intento nuevo no la vuelve
      // pendiente); HABLA «e» y EMPAREJAR esperan validación.
      expect(m4.resumen).toMatchObject({
        total: 4,
        aprobadas: 1,
        pendientesValidacion: 2,
      });

      await servicio.aprobarLote(TALLERISTA_2, [juego]);
      const despues = await avance.progreso(ESTUDIANTE_10, 10n);
      const m4b = despues.modulos.find((m) => m.asignacion.id === e.ids.a4)!;
      expect(m4b.resumen).toMatchObject({
        aprobadas: 2,
        pendientesValidacion: 1,
      });
      expect(m4b.asignacion.progreso).toBe(50); // calculado como la base: 2 de 4
    });

    it('estudiante ajeno → 404', async () => {
      await expect(avance.progreso(ACUDIENTE_5, 10n)).rejects.toThrow(
        RecursoNoEncontradoError,
      );
      await expect(avance.progreso(TALLERISTA_3, 10n)).rejects.toThrow(
        RecursoNoEncontradoError,
      );
    });
  });
});
