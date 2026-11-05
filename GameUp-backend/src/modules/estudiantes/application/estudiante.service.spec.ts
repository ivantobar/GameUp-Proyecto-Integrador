import {
  ACUDIENTE_4,
  ACUDIENTE_5,
  DIRECTORA,
  ESTUDIANTE_10,
  escenarioEstudiantes,
  TALLERISTA_2,
  TALLERISTA_3,
} from '../../../../test/dobles/escenario-estudiantes.js';
import { NivelesEnMemoria } from '../../../../test/dobles/usuarios-en-memoria.js';
import {
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { AccesoEstudianteService } from './acceso-estudiante.service.js';
import { EstudianteService } from './estudiante.service.js';

const SIN_FILTRO = { estado: null, nivelId: null };
const PAGINA = { page: 1, limit: 20 };

describe('AccesoEstudianteService y EstudianteService', () => {
  let escenario: ReturnType<typeof escenarioEstudiantes>;
  let acceso: AccesoEstudianteService;
  let servicio: EstudianteService;

  beforeEach(() => {
    escenario = escenarioEstudiantes();
    acceso = new AccesoEstudianteService(escenario.estudiantes);
    servicio = new EstudianteService(
      escenario.estudiantes,
      escenario.estudiantes,
      new NivelesEnMemoria(),
      acceso,
    );
  });

  describe('regla de relación (verificar)', () => {
    it.each([
      ['directora → cualquiera', DIRECTORA, 12n],
      ['tallerista → a cargo', TALLERISTA_2, 10n],
      ['acudiente → el suyo', ACUDIENTE_4, 10n],
      ['estudiante → él mismo', ESTUDIANTE_10, 10n],
    ])('permite: %s', async (_caso, actor, id) => {
      await expect(acceso.verificar(actor, id)).resolves.toBeUndefined();
    });

    it.each([
      ['tallerista → no a cargo', TALLERISTA_2, 12n],
      ['tallerista → vínculo inactivo', TALLERISTA_3, 10n],
      ['acudiente → ajeno', ACUDIENTE_5, 10n],
      ['estudiante → otro', ESTUDIANTE_10, 12n],
      ['directora → inexistente', DIRECTORA, 999n],
    ])(
      'niega con 404 (sin confirmar que existe): %s',
      async (_caso, actor, id) => {
        await expect(acceso.verificar(actor, id)).rejects.toThrow(
          new RecursoNoEncontradoError('El estudiante no existe.'),
        );
      },
    );
  });

  describe('listar', () => {
    const ids = async (actor: typeof DIRECTORA) =>
      (await servicio.listar(actor, SIN_FILTRO, PAGINA)).items.map((e) => e.id);

    it('cada rol ve solo lo suyo', async () => {
      expect(await ids(DIRECTORA)).toEqual([12n, 10n, 11n]); // por nombre: Lucas, Martín, Sofía
      expect(await ids(TALLERISTA_2)).toEqual([10n, 11n]);
      expect(await ids(TALLERISTA_3)).toEqual([12n]);
      expect(await ids(ACUDIENTE_4)).toEqual([10n]);
    });

    it('filtra por estado y por nivel', async () => {
      const egresados = await servicio.listar(
        DIRECTORA,
        { estado: 'EGRESADO', nivelId: null },
        PAGINA,
      );
      expect(egresados.items.map((e) => e.id)).toEqual([11n]);
      const nivel2 = await servicio.listar(
        DIRECTORA,
        { estado: null, nivelId: 2n },
        PAGINA,
      );
      expect(nivel2.total).toBe(1);
    });

    it('pagina', async () => {
      const p = await servicio.listar(DIRECTORA, SIN_FILTRO, {
        page: 2,
        limit: 2,
      });
      expect(p).toMatchObject({ total: 3, page: 2, limit: 2 });
      expect(p.items).toHaveLength(1);
    });
  });

  it('obtener respeta la relación; obtenerPropio da el estudiante con sesión', async () => {
    await expect(servicio.obtener(TALLERISTA_2, 10n)).resolves.toMatchObject({
      id: 10n,
    });
    await expect(servicio.obtener(TALLERISTA_2, 12n)).rejects.toThrow(
      RecursoNoEncontradoError,
    );
    await expect(servicio.obtenerPropio(ESTUDIANTE_10)).resolves.toMatchObject({
      id: 10n,
    });
  });

  describe('cambiarNivel (directora)', () => {
    it('cambia el nivel, guarda historial con el motivo y avisa a los acudientes', async () => {
      const e = await servicio.cambiarNivel(
        DIRECTORA,
        10n,
        2n,
        '  Reconoce vocales  ',
      );
      expect(e.nivel).toEqual({ id: 2n, nombre: 'MEDIO' });

      const historial = await servicio.historialNivel(ACUDIENTE_4, 10n, PAGINA);
      expect(historial.items[0]).toMatchObject({
        nivel: { id: 2n, nombre: 'MEDIO' },
        motivo: 'Reconoce vocales',
        asignadoPor: { id: 1n },
      });
      expect(escenario.estudiantes.notificados).toEqual([10n]);
    });

    it('motivo vacío → null', async () => {
      await servicio.cambiarNivel(DIRECTORA, 10n, 3n, '   ');
      expect(escenario.estudiantes.historial[0]?.motivo).toBeNull();
    });

    it('nivel inexistente o el mismo nivel → 422', async () => {
      await expect(
        servicio.cambiarNivel(DIRECTORA, 10n, 9n, null),
      ).rejects.toThrow('El nivel indicado no existe.');
      await expect(
        servicio.cambiarNivel(DIRECTORA, 10n, 1n, null),
      ).rejects.toThrow(ReglaNegocioError);
      expect(escenario.estudiantes.historial).toHaveLength(0);
    });

    it('estudiante inexistente → 404', async () => {
      await expect(
        servicio.cambiarNivel(DIRECTORA, 999n, 2n, null),
      ).rejects.toThrow(RecursoNoEncontradoError);
    });
  });

  it('historialNivel: un estudiante ajeno da 404', async () => {
    await expect(
      servicio.historialNivel(TALLERISTA_3, 10n, PAGINA),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });
});
