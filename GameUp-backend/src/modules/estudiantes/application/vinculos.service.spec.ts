import { escenarioEstudiantes } from '../../../../test/dobles/escenario-estudiantes.js';
import {
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { RelojFijo } from '../../../common/reloj/reloj.js';
import { AccesoEstudianteService } from './acceso-estudiante.service.js';
import { VinculosService } from './vinculos.service.js';

// 03:00 UTC del 6 de noviembre = 10:00 p. m. del 5 de noviembre en Bogotá.
const AHORA = new Date('2026-11-06T03:00:00Z');

describe('VinculosService', () => {
  let escenario: ReturnType<typeof escenarioEstudiantes>;
  let servicio: VinculosService;

  beforeEach(() => {
    escenario = escenarioEstudiantes();
    servicio = new VinculosService(
      escenario.estudiantes.talleristasRepo,
      escenario.estudiantes.acudientesRepo,
      escenario.usuarios,
      new RelojFijo(AHORA),
      new AccesoEstudianteService(escenario.estudiantes),
    );
  });

  describe('talleristas', () => {
    it('lista las actuales primero y conserva las anteriores', async () => {
      const lista = await servicio.listarTalleristas(10n);
      expect(lista.map((t) => [t.tallerista.id, t.activo])).toEqual([
        [2n, true],
        [3n, false],
      ]);
    });

    it('asignar crea el vínculo desde hoy en Bogotá', async () => {
      const t = await servicio.asignarTallerista(12n, 2n);
      expect(t).toMatchObject({
        activo: true,
        fechaInicio: new Date('2026-11-05T00:00:00Z'),
      });
    });

    it('asignar reactiva un vínculo anterior', async () => {
      const t = await servicio.asignarTallerista(10n, 3n);
      expect(t.activo).toBe(true);
      expect(
        escenario.estudiantes.talleristas.filter((f) => f.estudianteId === 10n),
      ).toHaveLength(2);
    });

    it('ya a cargo → 409', async () => {
      await expect(servicio.asignarTallerista(10n, 2n)).rejects.toThrow(
        ConflictoError,
      );
    });

    it.each([
      ['un acudiente', 4n],
      ['una cuenta inexistente', 999n],
    ])('la cuenta es %s → 422', async (_caso, id) => {
      await expect(servicio.asignarTallerista(10n, id)).rejects.toThrow(
        'La cuenta indicada no es de una tallerista de GameUP.',
      );
    });

    it('estudiante inexistente → 404', async () => {
      await expect(servicio.asignarTallerista(999n, 2n)).rejects.toThrow(
        RecursoNoEncontradoError,
      );
    });

    it('retirar desactiva el vínculo; si no estaba a cargo → 404', async () => {
      await servicio.retirarTallerista(10n, 2n);
      expect(
        (await servicio.listarTalleristas(10n)).every((t) => !t.activo),
      ).toBe(true);
      await expect(servicio.retirarTallerista(10n, 2n)).rejects.toThrow(
        RecursoNoEncontradoError,
      );
    });
  });

  describe('acudientes', () => {
    it('vincula un acudiente con el parentesco normalizado', async () => {
      const v = await servicio.vincularAcudiente(
        12n,
        4n,
        '  Tía  abuela ',
        false,
      );
      expect(v).toMatchObject({
        acudiente: { id: 4n },
        parentesco: 'Tía abuela',
        esPrincipal: false,
      });
    });

    it('ya vinculado → 409', async () => {
      await expect(
        servicio.vincularAcudiente(10n, 4n, 'Madre', false),
      ).rejects.toThrow('El acudiente ya está vinculado a este estudiante.');
    });

    it('un segundo principal → 409 (se cambia con PATCH)', async () => {
      await expect(
        servicio.vincularAcudiente(10n, 5n, 'Padre', true),
      ).rejects.toThrow(/ya tiene un acudiente principal/);
    });

    it('cuenta que no es de acudiente, o desactivada → 422', async () => {
      await expect(
        servicio.vincularAcudiente(10n, 2n, 'Tía', false),
      ).rejects.toThrow(ReglaNegocioError);
      await expect(
        servicio.vincularAcudiente(10n, 6n, 'Tía', false),
      ).rejects.toThrow('La cuenta indicada está desactivada.');
    });

    it('parentesco en blanco → 422', async () => {
      await expect(
        servicio.vincularAcudiente(12n, 4n, '   ', false),
      ).rejects.toThrow('El parentesco es obligatorio.');
    });

    it('marcar otro como principal le quita la marca al anterior', async () => {
      await servicio.vincularAcudiente(10n, 5n, 'Padre', false);
      await servicio.actualizarAcudiente(10n, 5n, {
        parentesco: null,
        esPrincipal: true,
      });
      const lista = await servicio.listarAcudientes(10n);
      expect(lista.map((v) => [v.acudiente.id, v.esPrincipal])).toEqual([
        [5n, true],
        [4n, false],
      ]);
    });

    it('actualizar: sin cambios → 422; no vinculado → 404', async () => {
      await expect(
        servicio.actualizarAcudiente(10n, 4n, {
          parentesco: null,
          esPrincipal: null,
        }),
      ).rejects.toThrow(ReglaNegocioError);
      await expect(
        servicio.actualizarAcudiente(10n, 5n, {
          parentesco: 'Tío',
          esPrincipal: null,
        }),
      ).rejects.toThrow(RecursoNoEncontradoError);
    });

    it('desvincular; si no estaba vinculado → 404', async () => {
      await servicio.desvincularAcudiente(10n, 4n);
      expect(await servicio.listarAcudientes(10n)).toEqual([]);
      await expect(servicio.desvincularAcudiente(10n, 4n)).rejects.toThrow(
        RecursoNoEncontradoError,
      );
    });
  });

  describe('con ASISCO UP conectado', () => {
    beforeEach(() => {
      servicio = new VinculosService(
        escenario.estudiantes.talleristasRepo,
        escenario.estudiantes.acudientesRepo,
        escenario.usuarios,
        new RelojFijo(AHORA),
        new AccesoEstudianteService(escenario.estudiantes),
        true,
      );
    });

    it('vincular, cambiar o quitar acudientes → 409 (se hace en ASISCO UP)', async () => {
      await expect(
        servicio.vincularAcudiente(12n, 4n, 'Madre', false),
      ).rejects.toBeInstanceOf(ConflictoError);
      await expect(
        servicio.actualizarAcudiente(10n, 4n, {
          parentesco: 'Tía',
          esPrincipal: null,
        }),
      ).rejects.toBeInstanceOf(ConflictoError);
      await expect(
        servicio.desvincularAcudiente(10n, 4n),
      ).rejects.toBeInstanceOf(ConflictoError);
    });

    it('listar sigue funcionando (lee la copia)', async () => {
      await expect(servicio.listarAcudientes(10n)).resolves.not.toHaveLength(0);
    });
  });
});
