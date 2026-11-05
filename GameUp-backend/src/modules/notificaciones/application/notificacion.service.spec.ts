import { escenarioAcudiente } from '../../../../test/dobles/acudiente-en-memoria.js';
import {
  ACUDIENTE_4,
  ACUDIENTE_5,
  TALLERISTA_2,
} from '../../../../test/dobles/escenario-estudiantes.js';
import { RecursoNoEncontradoError } from '../../../common/errors/dominio.errors.js';
import { NotificacionMapper } from '../infrastructure/notificacion.mapper.js';
import { NotificacionService } from './notificacion.service.js';

const PAGINA = { page: 1, limit: 20 };

describe('NotificacionService', () => {
  let e: Awaited<ReturnType<typeof escenarioAcudiente>>;
  let servicio: NotificacionService;

  beforeEach(async () => {
    e = await escenarioAcudiente();
    servicio = new NotificacionService(e.notificaciones);
  });

  it('lista solo las propias, la más reciente primero, con el total sin leer', async () => {
    const { pagina, noLeidas } = await servicio.listar(
      ACUDIENTE_4,
      null,
      PAGINA,
    );
    expect(pagina.items.map((n) => n.id)).toEqual([e.ids.n1, e.ids.n2]);
    expect(noLeidas).toBe(1);
  });

  it('filtra por leída sin cambiar el total sin leer', async () => {
    const { pagina, noLeidas } = await servicio.listar(
      ACUDIENTE_4,
      false,
      PAGINA,
    );
    expect(pagina.items.map((n) => n.tipo)).toEqual(['NUEVO_MODULO']);
    expect(noLeidas).toBe(1);
  });

  it('quien no tiene avisos recibe una lista vacía', async () => {
    const { pagina, noLeidas } = await servicio.listar(
      TALLERISTA_2,
      null,
      PAGINA,
    );
    expect(pagina.total).toBe(0);
    expect(noLeidas).toBe(0);
  });

  it('marcar una: idempotente', async () => {
    await expect(
      servicio.marcarLeida(ACUDIENTE_4, e.ids.n1),
    ).resolves.toMatchObject({ leida: true });
    await expect(
      servicio.marcarLeida(ACUDIENTE_4, e.ids.n1),
    ).resolves.toMatchObject({ leida: true });
  });

  it('marcar la de otra persona o una inexistente → 404, sin tocarla', async () => {
    await expect(
      servicio.marcarLeida(ACUDIENTE_4, e.ids.n3),
    ).rejects.toBeInstanceOf(RecursoNoEncontradoError);
    await expect(servicio.marcarLeida(ACUDIENTE_4, 1n)).rejects.toBeInstanceOf(
      RecursoNoEncontradoError,
    );
    expect(e.notificaciones.filas.find((f) => f.id === e.ids.n3)?.leida).toBe(
      false,
    );
  });

  it('marcar todas: solo las propias', async () => {
    await expect(servicio.marcarTodasLeidas(ACUDIENTE_4)).resolves.toBe(1);
    await expect(servicio.marcarTodasLeidas(ACUDIENTE_4)).resolves.toBe(0);
    const otra = await servicio.listar(ACUDIENTE_5, false, PAGINA);
    expect(otra.noLeidas).toBe(1);
  });
});

describe('NotificacionMapper', () => {
  const fila = {
    id: 15n,
    tipo: 'OBSERVACION',
    mensaje: 'Hay una nueva observación sobre Martín José.',
    leida: false,
    fecha: new Date('2026-11-05T15:00:00Z'),
  };

  it('fila → entidad → DTO', () => {
    expect(NotificacionMapper.aDto(NotificacionMapper.aEntidad(fila))).toEqual({
      id: '15',
      tipo: 'OBSERVACION',
      mensaje: 'Hay una nueva observación sobre Martín José.',
      leida: false,
      fecha: '2026-11-05T15:00:00.000Z',
    });
  });

  it('tipo desconocido → error (la base no lo permite)', () => {
    expect(() =>
      NotificacionMapper.aEntidad({ ...fila, tipo: 'OTRO' }),
    ).toThrow();
  });
});
