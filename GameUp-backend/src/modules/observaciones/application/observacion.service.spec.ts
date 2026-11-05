import { escenarioAcudiente } from '../../../../test/dobles/acudiente-en-memoria.js';
import {
  ACUDIENTE_4,
  ACUDIENTE_5,
  DIRECTORA,
  ESTUDIANTE_10,
  TALLERISTA_2,
  TALLERISTA_3,
} from '../../../../test/dobles/escenario-estudiantes.js';
import {
  AccesoDenegadoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import { ObservacionService } from './observacion.service.js';

const PAGINA = { page: 1, limit: 20 };

describe('ObservacionService', () => {
  let e: Awaited<ReturnType<typeof escenarioAcudiente>>;
  let servicio: ObservacionService;

  beforeEach(async () => {
    e = await escenarioAcudiente();
    servicio = new ObservacionService(
      e.observaciones,
      e.observaciones,
      new AccesoEstudianteService(e.estudiantes),
    );
  });

  const avisosDe = (id: bigint) =>
    e.notificaciones.filas.filter(
      (n) => n.usuarioId === id && n.tipo === 'OBSERVACION',
    );

  describe('crear', () => {
    it('la tallerista a cargo escribe; si es visible, se avisa al acudiente', async () => {
      const o = await servicio.crear(
        TALLERISTA_2,
        10n,
        '  Hoy reconoció la e.\nSin ayuda.  ',
        true,
      );
      expect(o).toMatchObject({
        estudianteId: 10n,
        texto: 'Hoy reconoció la e.\nSin ayuda.',
        visibleAcudiente: true,
        autor: { id: 2n },
      });
      expect(avisosDe(4n)).toHaveLength(1);
    });

    it('oculta para la familia: no hay aviso', async () => {
      await servicio.crear(DIRECTORA, 10n, 'Nota interna', false);
      expect(avisosDe(4n)).toHaveLength(0);
    });

    it('texto vacío → 422', async () => {
      await expect(
        servicio.crear(TALLERISTA_2, 10n, '   ', false),
      ).rejects.toBeInstanceOf(ReglaNegocioError);
    });

    it('estudiante no a cargo → 404; acudiente o estudiante → 403', async () => {
      await expect(
        servicio.crear(TALLERISTA_3, 10n, 'x', false),
      ).rejects.toBeInstanceOf(RecursoNoEncontradoError);
      for (const actor of [ACUDIENTE_4, ESTUDIANTE_10]) {
        await expect(
          servicio.crear(actor, 10n, 'x', false),
        ).rejects.toBeInstanceOf(AccesoDenegadoError);
      }
    });
  });

  describe('listar', () => {
    beforeEach(async () => {
      await servicio.crear(TALLERISTA_2, 10n, 'Interna', false);
      await servicio.crear(TALLERISTA_2, 10n, 'Para la familia', true);
    });

    it('el equipo ve todas, la más reciente primero', async () => {
      const p = await servicio.listar(DIRECTORA, 10n, PAGINA);
      expect(p.items.map((o) => o.texto)).toEqual([
        'Para la familia',
        'Interna',
      ]);
      expect(p.total).toBe(2);
    });

    it('el acudiente solo ve las visibles', async () => {
      const p = await servicio.listar(ACUDIENTE_4, 10n, PAGINA);
      expect(p.items.map((o) => o.texto)).toEqual(['Para la familia']);
      expect(p.total).toBe(1);
    });

    it('estudiante ajeno → 404', async () => {
      for (const actor of [ACUDIENTE_5, TALLERISTA_3]) {
        await expect(
          servicio.listar(actor, 10n, PAGINA),
        ).rejects.toBeInstanceOf(RecursoNoEncontradoError);
      }
    });
  });

  describe('editar', () => {
    let id: bigint;
    beforeEach(async () => {
      id = (await servicio.crear(TALLERISTA_2, 10n, 'Borrador', false)).id;
    });

    it('la autora cambia el texto y la hace visible (un solo aviso)', async () => {
      const o = await servicio.editar(TALLERISTA_2, id, {
        texto: 'Versión final',
        visibleAcudiente: true,
      });
      expect(o).toMatchObject({
        texto: 'Versión final',
        visibleAcudiente: true,
      });
      await servicio.editar(TALLERISTA_2, id, {
        texto: 'Versión final, corregida',
        visibleAcudiente: null,
      });
      expect(avisosDe(4n)).toHaveLength(1);
    });

    it('la directora puede editar la de otra persona', async () => {
      await expect(
        servicio.editar(DIRECTORA, id, {
          texto: 'Revisada',
          visibleAcudiente: null,
        }),
      ).resolves.toMatchObject({ texto: 'Revisada' });
    });

    it('otra tallerista a cargo del mismo estudiante → 403', async () => {
      await e.estudiantes.talleristasRepo.activar(3n, 10n, new Date());
      await expect(
        servicio.editar(TALLERISTA_3, id, {
          texto: 'x',
          visibleAcudiente: null,
        }),
      ).rejects.toBeInstanceOf(AccesoDenegadoError);
    });

    it('sin el estudiante a cargo o inexistente → 404 «La observación no existe.»', async () => {
      await expect(
        servicio.editar(TALLERISTA_3, id, {
          texto: 'x',
          visibleAcudiente: null,
        }),
      ).rejects.toThrow('La observación no existe.');
      await expect(
        servicio.editar(DIRECTORA, 999n, {
          texto: 'x',
          visibleAcudiente: null,
        }),
      ).rejects.toThrow('La observación no existe.');
    });

    it('nada que cambiar o texto vacío → 422; acudiente → 403', async () => {
      await expect(
        servicio.editar(TALLERISTA_2, id, {
          texto: null,
          visibleAcudiente: null,
        }),
      ).rejects.toBeInstanceOf(ReglaNegocioError);
      await expect(
        servicio.editar(TALLERISTA_2, id, {
          texto: ' ',
          visibleAcudiente: null,
        }),
      ).rejects.toBeInstanceOf(ReglaNegocioError);
      await expect(
        servicio.editar(ACUDIENTE_4, id, {
          texto: 'x',
          visibleAcudiente: null,
        }),
      ).rejects.toBeInstanceOf(AccesoDenegadoError);
    });
  });
});
