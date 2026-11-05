import { escenarioAsignaciones } from '../../../../test/dobles/asignaciones-en-memoria.js';
import {
  ACUDIENTE_4,
  ACUDIENTE_5,
  DIRECTORA,
  ESTUDIANTE_10,
  TALLERISTA_2,
  TALLERISTA_3,
} from '../../../../test/dobles/escenario-estudiantes.js';
import {
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { RelojFijo } from '../../../common/reloj/reloj.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import { AsignacionService } from './asignacion.service.js';
import { AvanceAsignacionService } from './avance-asignacion.service.js';

// 2026-11-05 en Bogotá.
const AHORA = new Date('2026-11-05T15:00:00Z');
const SIN_FILTRO = { estudianteId: null, moduloId: null, estado: null };
const PAGINA = { page: 1, limit: 20 };

describe('AsignacionService y AvanceAsignacionService', () => {
  let e: Awaited<ReturnType<typeof escenarioAsignaciones>>;
  let servicio: AsignacionService;
  let avance: AvanceAsignacionService;

  beforeEach(async () => {
    e = await escenarioAsignaciones();
    servicio = new AsignacionService(
      e.asignaciones,
      e.asignaciones,
      e.modulos.moduloRepo,
      new RelojFijo(AHORA),
      new AccesoEstudianteService(e.estudiantes),
    );
    avance = new AvanceAsignacionService(
      e.asignaciones,
      e.modulos.actividadRepo,
      servicio,
      new AccesoEstudianteService(e.estudiantes),
    );
  });

  describe('crear', () => {
    const datos = (extra = {}) => ({
      moduloId: e.ids.modulo4,
      estudianteId: 12n,
      fechaSugerida: null,
      ...extra,
    });

    it('la tallerista asigna un módulo publicado a un estudiante a cargo', async () => {
      const a = await servicio.crear(
        TALLERISTA_3,
        datos({ fechaSugerida: '2026-11-05' }),
      );
      expect(a).toMatchObject({
        estado: 'ASIGNADO',
        progreso: 0,
        estudiante: { id: 12n },
        asignadoPor: { id: 3n },
        fechaSugerida: new Date('2026-11-05T00:00:00Z'),
      });
    });

    it('estudiante no a cargo → 404 (como si no existiera)', async () => {
      await expect(servicio.crear(TALLERISTA_2, datos())).rejects.toThrow(
        new RecursoNoEncontradoError('El estudiante no existe.'),
      );
    });

    it.each([
      [
        'módulo sin publicar',
        { moduloId: 2n },
        'Solo se pueden asignar módulos publicados.',
      ],
      [
        'módulo inexistente',
        { moduloId: 999n },
        'El módulo indicado no existe.',
      ],
      [
        'estudiante egresado',
        { estudianteId: 11n },
        'Solo se asignan módulos a estudiantes activos.',
      ],
      [
        'fecha pasada (hora de Bogotá)',
        { fechaSugerida: '2026-11-04' },
        'La fecha sugerida no puede ser anterior a hoy.',
      ],
    ])('%s → 422', async (_c, extra, mensaje) => {
      await expect(servicio.crear(DIRECTORA, datos(extra))).rejects.toThrow(
        new ReglaNegocioError(mensaje),
      );
    });

    it('ya asignado sin completar → 409; completado → se puede repetir', async () => {
      await expect(
        servicio.crear(DIRECTORA, datos({ estudianteId: 10n })),
      ).rejects.toThrow(ConflictoError);
      e.asignaciones.cambiarEstado(e.ids.a4, 'COMPLETADO', 100);
      await expect(
        servicio.crear(DIRECTORA, datos({ estudianteId: 10n })),
      ).resolves.toMatchObject({ estado: 'ASIGNADO' });
    });
  });

  describe('listar y obtener', () => {
    const ids = async (actor: typeof DIRECTORA) =>
      (await servicio.listar(actor, SIN_FILTRO, PAGINA)).items.map((a) => a.id);

    it('cada rol ve las de sus estudiantes', async () => {
      expect(await ids(DIRECTORA)).toEqual([e.ids.a4, e.ids.a1]);
      expect(await ids(TALLERISTA_2)).toEqual([e.ids.a4, e.ids.a1]);
      expect(await ids(TALLERISTA_3)).toEqual([]);
      expect(await ids(ACUDIENTE_4)).toEqual([e.ids.a4, e.ids.a1]);
      expect(await ids(ACUDIENTE_5)).toEqual([]);
      expect(await ids(ESTUDIANTE_10)).toEqual([e.ids.a4, e.ids.a1]);
    });

    it('filtra por módulo y estado', async () => {
      const r = await servicio.listar(
        DIRECTORA,
        { ...SIN_FILTRO, moduloId: e.ids.modulo4 },
        PAGINA,
      );
      expect(r.items.map((a) => a.id)).toEqual([e.ids.a4]);
    });

    it('obtener una ajena → 404 «La asignación no existe.»', async () => {
      await expect(servicio.obtener(ACUDIENTE_5, e.ids.a1)).rejects.toThrow(
        new RecursoNoEncontradoError('La asignación no existe.'),
      );
      await expect(servicio.obtener(DIRECTORA, 999n)).rejects.toThrow(
        RecursoNoEncontradoError,
      );
    });
  });

  it('eliminar: con intentos → 409; sin intentos → se borra', async () => {
    await expect(servicio.eliminar(TALLERISTA_2, e.ids.a1)).rejects.toThrow(
      ConflictoError,
    );
    const nueva = await servicio.crear(TALLERISTA_3, {
      moduloId: e.ids.modulo4,
      estudianteId: 12n,
      fechaSugerida: null,
    });
    await servicio.eliminar(TALLERISTA_3, nueva.id);
    expect(await e.asignaciones.buscarPorId(nueva.id)).toBeNull();
    await expect(servicio.eliminar(TALLERISTA_2, nueva.id)).rejects.toThrow(
      RecursoNoEncontradoError,
    );
  });

  describe('avance', () => {
    it('detalle: estado de cada actividad activa y resumen', async () => {
      const d = await avance.detalle(ACUDIENTE_4, e.ids.a4);
      expect(
        d.actividades.map((a) => [a.actividad.tipoJuego, a.estado, a.vocal]),
      ).toEqual([
        ['HABLA_CONMIGO', 'SIN_INTENTOS', 'e'],
        ['EMPAREJAR', 'RECHAZADA', null],
        ['MEMORIA', 'APROBADA', null],
      ]);
      expect(d.actividades[1]?.retroalimentacion).toBe('Mira bien las parejas');
      expect(d.resumen).toEqual({
        total: 3,
        aprobadas: 1,
        pendientesValidacion: 0,
      });
    });

    it('las actividades inactivas no cuentan', async () => {
      const d = await avance.detalle(DIRECTORA, e.ids.a1);
      expect(d.actividades.map((a) => a.actividad.id)).toEqual([e.ids.habla]);
      expect(d.resumen).toEqual({
        total: 1,
        aprobadas: 0,
        pendientesValidacion: 1,
      });
    });

    it('pendientes del estudiante: sin intentos o rechazadas, nunca las por validar', async () => {
      const p = await avance.pendientesDelEstudiante(ESTUDIANTE_10);
      expect(
        p.map((x) => [x.asignacion.id, x.avance.actividad.id, x.avance.estado]),
      ).toEqual([
        [e.ids.a4, e.ids.hablaE, 'SIN_INTENTOS'],
        [e.ids.a4, e.ids.emparejar, 'RECHAZADA'],
      ]);
    });

    it('actividades del estudiante: todas sus asignaciones, con estado y retroalimentación', async () => {
      e.asignaciones.cambiarEstado(e.ids.a4, 'COMPLETADO', 100);
      const a = await avance.actividadesDelEstudiante(ACUDIENTE_4, 10n);
      expect(
        a.map((x) => [x.asignacion.id, x.avance.actividad.id, x.avance.estado]),
      ).toEqual([
        // Como el listado de asignaciones: la más reciente primero.
        [e.ids.a4, e.ids.hablaE, 'SIN_INTENTOS'],
        [e.ids.a4, e.ids.emparejar, 'RECHAZADA'],
        [e.ids.a4, e.ids.memoria, 'APROBADA'],
        [e.ids.a1, e.ids.habla, 'PENDIENTE_VALIDACION'],
      ]);
      expect(a[1]?.avance.retroalimentacion).toBe('Mira bien las parejas');
      await expect(
        avance.actividadesDelEstudiante(TALLERISTA_2, 10n),
      ).resolves.toHaveLength(4);
      await expect(
        avance.actividadesDelEstudiante(DIRECTORA, 12n),
      ).resolves.toEqual([]);
    });

    it('actividades de un estudiante ajeno → 404', async () => {
      for (const actor of [ACUDIENTE_5, TALLERISTA_3]) {
        await expect(
          avance.actividadesDelEstudiante(actor, 10n),
        ).rejects.toBeInstanceOf(RecursoNoEncontradoError);
      }
    });

    it('una asignación completada ya no aporta pendientes', async () => {
      e.asignaciones.cambiarEstado(e.ids.a4, 'COMPLETADO', 100);
      await expect(
        avance.pendientesDelEstudiante(ESTUDIANTE_10),
      ).resolves.toEqual([]);
    });
  });
});
