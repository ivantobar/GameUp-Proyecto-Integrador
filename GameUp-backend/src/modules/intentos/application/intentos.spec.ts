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
import { escenarioIntentos } from '../../../../test/dobles/intentos-en-memoria.js';
import {
  AccesoDenegadoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { RelojFijo } from '../../../common/reloj/reloj.js';
import { RegistroJuegosService } from '../../catalogo/application/registro-juegos.service.js';
import { estrategiasDelMvp } from '../../catalogo/domain/juegos/estrategias.js';
import { ConsentimientoService } from '../../consentimiento/application/consentimiento.service.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import { ContextoIntentoService } from './contexto-intento.service.js';
import { HablaConmigoService } from './habla-conmigo.service.js';
import { IntentoService } from './intento.service.js';
import { PracticaService } from './practica.service.js';

const AHORA = new Date('2026-11-05T15:00:00Z');

describe('Intentos y grabaciones', () => {
  let e: Awaited<ReturnType<typeof escenarioIntentos>>;
  let intentos: IntentoService;
  let habla: HablaConmigoService;
  let practica: PracticaService;

  beforeEach(async () => {
    e = await escenarioIntentos();
    const acceso = new AccesoEstudianteService(e.estudiantes);
    const contexto = new ContextoIntentoService(
      e.modulos.actividadRepo,
      e.asignaciones,
    );
    const consentimiento = new ConsentimientoService(
      e.consentimiento,
      new RelojFijo(AHORA),
      acceso,
    );
    vi.spyOn(consentimiento['logger'], 'warn').mockImplementation(
      () => undefined,
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
    vi.spyOn(habla['logger'], 'warn').mockImplementation(() => undefined);
    practica = new PracticaService(e.intentos);
  });

  afterEach(async () => {
    await borrarTemporales();
  });

  describe('juegos sin voz (POST /intentos)', () => {
    it('registra el intento pendiente, sin estrellas; la asignación pasa a EN_CURSO', async () => {
      const i = await intentos.registrar(ESTUDIANTE_10, e.ids.emparejar, {
        firstTryCorrect: 1,
        total: 2,
      });
      expect(i).toMatchObject({
        asignacionId: e.ids.a4,
        numeroIntento: 2, // ya había uno rechazado
        resultado: { firstTryCorrect: 1, total: 2 },
        estrellas: 0,
        validacion: null,
      });
      expect((await e.asignaciones.buscarPorId(e.ids.a4))?.estado).toBe(
        'EN_CURSO',
      );
    });

    it('MEMORIA con { pairs, mismatches }; BUSCA_LA_BOCA con { firstTryCorrect, total }', async () => {
      await expect(
        intentos.registrar(ESTUDIANTE_10, e.ids.memoria, {
          pairs: 2,
          mismatches: 5,
        }),
      ).resolves.toMatchObject({ resultado: { pairs: 2, mismatches: 5 } });
      await expect(
        intentos.registrar(ESTUDIANTE_10, e.ids.busca, {
          firstTryCorrect: 3,
          total: 3,
        }),
      ).resolves.toBeDefined();
    });

    it.each([
      [
        'total que no coincide con la actividad',
        { firstTryCorrect: 1, total: 9 },
        /debe ser 2/,
      ],
      [
        'campo de más',
        { firstTryCorrect: 1, total: 2, nota: 5 },
        /no admite: nota/,
      ],
      [
        'tiempo (regla 11)',
        { firstTryCorrect: 1, total: 2, tiempoSeg: 30 },
        /regla 11/,
      ],
    ])('%s → 422', async (_c, resultado, mensaje) => {
      await expect(
        intentos.registrar(ESTUDIANTE_10, e.ids.emparejar, resultado),
      ).rejects.toThrow(mensaje);
    });

    it('Habla conmigo por esta ruta → 422', async () => {
      await expect(
        intentos.registrar(ESTUDIANTE_10, e.ids.hablaE, {}),
      ).rejects.toThrow(/POST \/intentos\/habla-conmigo/);
    });

    it('actividad inactiva, inexistente o de un módulo no asignado → 404', async () => {
      for (const id of [e.ids.inactiva, 999n]) {
        await expect(intentos.registrar(ESTUDIANTE_10, id, {})).rejects.toThrow(
          new RecursoNoEncontradoError('La actividad no existe.'),
        );
      }
      const otro = e.modulos.agregarActividad(2, 'MEMORIA'); // borrador no asignado
      await expect(
        intentos.registrar(ESTUDIANTE_10, otro.id, {}),
      ).rejects.toThrow(RecursoNoEncontradoError);
    });

    it('módulo ya completado → 422; un adulto → 403', async () => {
      e.asignaciones.cambiarEstado(e.ids.a4, 'COMPLETADO', 100);
      await expect(
        intentos.registrar(ESTUDIANTE_10, e.ids.emparejar, {
          firstTryCorrect: 1,
          total: 2,
        }),
      ).rejects.toThrow(
        'Ya completaste este módulo: no se registran más intentos.',
      );
      await expect(
        intentos.registrar(TALLERISTA_2, e.ids.emparejar, {}),
      ).rejects.toThrow(AccesoDenegadoError);
    });

    it('ver un intento: el estudiante, su tallerista, su acudiente, la directora; ajeno → 404', async () => {
      const i = await intentos.registrar(ESTUDIANTE_10, e.ids.emparejar, {
        firstTryCorrect: 1,
        total: 2,
      });
      for (const actor of [
        ESTUDIANTE_10,
        TALLERISTA_2,
        ACUDIENTE_4,
        DIRECTORA,
      ]) {
        await expect(intentos.obtener(actor, i.id)).resolves.toMatchObject({
          id: i.id,
        });
      }
      for (const actor of [TALLERISTA_3, ACUDIENTE_5]) {
        await expect(intentos.obtener(actor, i.id)).rejects.toThrow(
          new RecursoNoEncontradoError('El intento no existe.'),
        );
      }
    });
  });

  describe('Habla conmigo (POST /intentos/habla-conmigo)', () => {
    const m4a = () => archivoTemporal(ARCHIVOS.m4a, 'audio/x-m4a');

    it('con consentimiento: guarda el audio en estudiante/<id>/intento/<id>.m4a y la versión de términos', async () => {
      const r = await habla.registrar(
        ESTUDIANTE_10,
        e.ids.hablaE,
        4,
        await m4a(),
      );
      expect(r.estadoGrabacion).toBe('ADJUNTA');
      const ruta = `estudiante/10/intento/${r.intento.id}.m4a`;
      expect(e.almacen.archivos.get(`grabaciones/${ruta}`)?.tipoMime).toBe(
        'audio/mp4',
      );
      expect(e.intentos.grabaciones).toEqual([
        {
          intentoId: r.intento.id,
          ruta,
          duracionSeg: 4,
          codigoVersionTerminos: 'TERMINOS-2026-01',
          consentimientoVerificadoEn: AHORA,
        },
      ]);
      expect(e.consentimiento.consultados).toEqual([10000n]);
      expect(r.intento.resultado).toEqual({ estadoGrabacion: 'ADJUNTA' });
    });

    it.each([
      ['sin consentimiento', null, 'SIN_CONSENTIMIENTO'],
      [
        'consentimiento no aceptado',
        { aceptaTratamiento: false, codigoVersion: 'v1' },
        'SIN_CONSENTIMIENTO',
      ],
      ['API del núcleo familiar caída', 'CAIDA' as const, 'NO_VERIFICABLE'],
    ])(
      '%s: el intento se guarda SIN audio (%s)',
      async (_c, respuesta, estado) => {
        e.consentimiento.respuesta = respuesta;
        const r = await habla.registrar(
          ESTUDIANTE_10,
          e.ids.hablaE,
          null,
          await m4a(),
        );
        expect(r).toMatchObject({ estadoGrabacion: estado });
        expect(e.almacen.rutas('grabaciones')).toEqual([]);
        expect(e.intentos.grabaciones).toEqual([]);
        expect(await e.intentos.buscarPorId(r.intento.id)).toMatchObject({
          resultado: { estadoGrabacion: estado },
        });
      },
    );

    it('con consentimiento pero sin audio: NO_ENVIADA', async () => {
      const r = await habla.registrar(ESTUDIANTE_10, e.ids.hablaE, null, null);
      expect(r.estadoGrabacion).toBe('NO_ENVIADA');
    });

    it('si Storage falla, el intento queda sin audio (NO_GUARDADA)', async () => {
      e.almacen.caido = true;
      const r = await habla.registrar(
        ESTUDIANTE_10,
        e.ids.hablaE,
        null,
        await m4a(),
      );
      expect(r.estadoGrabacion).toBe('NO_GUARDADA');
      expect(await e.intentos.buscarPorId(r.intento.id)).toMatchObject({
        resultado: { estadoGrabacion: 'NO_GUARDADA' },
      });
    });

    it('si falla el registro de la grabación, borra el audio subido', async () => {
      e.intentos.fallarGrabacion = true;
      const r = await habla.registrar(
        ESTUDIANTE_10,
        e.ids.hablaE,
        null,
        await m4a(),
      );
      expect(r.estadoGrabacion).toBe('NO_GUARDADA');
      expect(e.almacen.rutas('grabaciones')).toEqual([]);
    });

    it('un audio inválido o de otro formato → 422 sin crear el intento', async () => {
      const antes = e.asignaciones.intentosFilas.length;
      await expect(
        habla.registrar(
          ESTUDIANTE_10,
          e.ids.hablaE,
          null,
          await archivoTemporal(ARCHIVOS.falso, 'audio/mp4'),
        ),
      ).rejects.toThrow(/El audio no es válido/);
      await expect(
        habla.registrar(
          ESTUDIANTE_10,
          e.ids.hablaE,
          null,
          await archivoTemporal(ARCHIVOS.mp3, 'audio/mpeg'),
        ),
      ).rejects.toThrow(ReglaNegocioError);
      expect(e.asignaciones.intentosFilas).toHaveLength(antes);
    });

    it('acepta AAC y WebM', async () => {
      const aac = Buffer.concat([
        Buffer.from([0xff, 0xf1, 0x50, 0x80]),
        Buffer.alloc(16),
      ]);
      const webm = Buffer.concat([
        Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
        Buffer.alloc(16),
      ]);
      for (const [bytes, mime] of [
        [aac, 'audio/aac'],
        [webm, 'audio/webm'],
      ] as const) {
        const r = await habla.registrar(
          ESTUDIANTE_10,
          e.ids.hablaE,
          null,
          await archivoTemporal(bytes, mime),
        );
        expect(r.estadoGrabacion).toBe('ADJUNTA');
      }
    });

    it('estrellas de práctica: una por ciclo de la misma vocal, hasta 3', async () => {
      // El estudiante 10 ya tiene 2 intentos de la «a» (módulo 1).
      const tercero = await habla.registrar(
        ESTUDIANTE_10,
        e.ids.habla,
        null,
        null,
      );
      expect(tercero.estrellasPractica).toBe(3);
      const cuarto = await habla.registrar(
        ESTUDIANTE_10,
        e.ids.habla,
        null,
        null,
      );
      expect(cuarto.estrellasPractica).toBe(3);
      const primeroE = await habla.registrar(
        ESTUDIANTE_10,
        e.ids.hablaE,
        null,
        null,
      );
      expect(primeroE.estrellasPractica).toBe(1);
    });

    it('una actividad que no es de Habla conmigo → 422', async () => {
      await expect(
        habla.registrar(ESTUDIANTE_10, e.ids.emparejar, null, null),
      ).rejects.toThrow(/no es de Habla conmigo/);
    });
  });

  describe('práctica de vocales', () => {
    it('estrellas por vocal y «Sigue donde ibas»', async () => {
      expect(await practica.puntoRetorno(ESTUDIANTE_10)).toBe('a');
      await habla.registrar(ESTUDIANTE_10, e.ids.hablaE, null, null);
      expect(await practica.vocales(ESTUDIANTE_10)).toEqual([
        { vocal: 'a', estrellas: 2 },
        { vocal: 'e', estrellas: 1 },
        { vocal: 'i', estrellas: 0 },
        { vocal: 'o', estrellas: 0 },
        { vocal: 'u', estrellas: 0 },
      ]);
      expect(await practica.puntoRetorno(ESTUDIANTE_10)).toBe('e');
    });

    it('un estudiante sin práctica: sin punto de retorno; un adulto → 403', async () => {
      const otro = {
        id: 12n,
        idUsuarioAuth: 1200n,
        rol: 'ESTUDIANTE' as const,
      };
      expect(await practica.puntoRetorno(otro)).toBeNull();
      await expect(practica.vocales(ACUDIENTE_4)).rejects.toThrow(
        AccesoDenegadoError,
      );
    });
  });
});
