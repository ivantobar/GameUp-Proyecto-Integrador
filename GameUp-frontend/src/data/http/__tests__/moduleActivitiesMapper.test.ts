import { ServerError } from '@/services/apiErrors';
import { toModuleActivities } from '../mappers/assignmentManagementMapper';

/** Un elemento de `GET /modulos/:id/actividades` con datos inventados. */
function actividad(overrides: Record<string, unknown> = {}) {
  return {
    id: '8',
    moduloId: '3',
    tipoJuego: { id: '5', codigo: 'HABLA_CONMIGO', nombre: 'Habla conmigo' },
    titulo: 'Di la a',
    instruccionTexto: null,
    configuracion: { vocal: 'a' },
    orden: 0,
    activa: true,
    nivelJuego: null,
    ...overrides,
  };
}

describe('actividades de un módulo del backend → las de la app', () => {
  it('traduce el juego y conserva el orden en que llegan', () => {
    expect(
      toModuleActivities([
        actividad(),
        actividad({
          id: '9',
          titulo: 'Busca la boca',
          tipoJuego: { id: '6', codigo: 'BUSCA_LA_BOCA', nombre: 'Busca' },
        }),
      ]),
    ).toEqual([
      { id: '8', title: 'Di la a', gameId: 'speak' },
      { id: '9', title: 'Busca la boca', gameId: 'findMouth' },
    ]);
  });

  it('no muestra las inactivas (el estudiante no las ve)', () => {
    expect(
      toModuleActivities([actividad(), actividad({ id: '9', activa: false })]),
    ).toEqual([{ id: '8', title: 'Di la a', gameId: 'speak' }]);
  });

  it('un juego que la app no conoce se salta sin romper la lista', () => {
    expect(
      toModuleActivities([
        actividad({ tipoJuego: { id: '7', codigo: 'NUEVO', nombre: 'Nuevo' } }),
        actividad({ id: '9' }),
      ]),
    ).toEqual([{ id: '9', title: 'Di la a', gameId: 'speak' }]);
  });

  it('un módulo sin actividades es una lista vacía', () => {
    expect(toModuleActivities([])).toEqual([]);
  });

  it('una respuesta que no es lista es un error del servidor', () => {
    expect(() => toModuleActivities({ items: [] })).toThrow(ServerError);
  });
});
