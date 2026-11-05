import { AsignacionMapper, type FilaAsignacion } from './asignacion.mapper.js';

const fila = (extra: Partial<FilaAsignacion> = {}): FilaAsignacion => ({
  id: 12n,
  fecha_asignacion: new Date('2026-11-05T15:00:00Z'),
  fecha_sugerida: new Date('2026-11-20T00:00:00Z'),
  estado: 'EN_CURSO',
  progreso: 50,
  modulo: { id: 3n, nombre: 'Vocal A' },
  usuario: { id: 2n, nombres: 'Ana María', apellidos: 'Gómez Ruiz' },
  estudiante: {
    usuario: { id: 10n, nombres: 'Martín José', apellidos: 'Cruz' },
  },
  ...extra,
});

describe('AsignacionMapper', () => {
  it('fila → entidad → DTO (ids texto, fecha sugerida sin hora)', () => {
    const a = AsignacionMapper.aEntidad(fila());
    expect(a.estaCompletada()).toBe(false);
    expect(AsignacionMapper.aDto(a)).toEqual({
      id: '12',
      modulo: { id: '3', nombre: 'Vocal A' },
      estudiante: { id: '10', displayName: 'Martín C.', initials: 'MC' },
      asignadoPor: { id: '2', displayName: 'Ana Gómez' },
      fechaAsignacion: '2026-11-05T15:00:00.000Z',
      fechaSugerida: '2026-11-20',
      estado: 'EN_CURSO',
      progreso: 50,
    });
  });

  it('estado fuera del catálogo es un error de datos', () => {
    expect(() =>
      AsignacionMapper.aEntidad(fila({ estado: 'PAUSADO' })),
    ).toThrow();
  });

  it('intento con y sin validación', () => {
    const base = {
      asignacion_id: 12n,
      actividad_id: 8n,
      numero_intento: 1,
      fecha: new Date('2026-11-05T15:00:00Z'),
    };
    expect(
      AsignacionMapper.aIntento({ ...base, validacion: null }).validacion,
    ).toBeNull();
    expect(
      AsignacionMapper.aIntento({
        ...base,
        validacion: { resultado: 'RECHAZADO', retroalimentacion: 'Otra vez' },
      }).validacion,
    ).toEqual({ resultado: 'RECHAZADO', retroalimentacion: 'Otra vez' });
  });

  it('actividad de una asignación (o pendiente) → DTO para la app', () => {
    const asignacion = AsignacionMapper.aEntidad(fila());
    expect(
      AsignacionMapper.aActividadDto({
        asignacion,
        avance: {
          actividad: {
            id: 8n,
            titulo: 'Di la a',
            tipoJuego: 'HABLA_CONMIGO',
            configuracion: { vocal: 'a' },
            orden: 0,
          },
          estado: 'SIN_INTENTOS',
          intentos: 0,
          esNueva: true,
          retroalimentacion: null,
          vocal: 'a',
        },
      }),
    ).toEqual({
      asignacionId: '12',
      modulo: { id: '3', nombre: 'Vocal A' },
      fechaSugerida: '2026-11-20',
      actividadId: '8',
      titulo: 'Di la a',
      tipoJuego: 'HABLA_CONMIGO',
      orden: 0,
      vocal: 'a',
      estado: 'SIN_INTENTOS',
      intentos: 0,
      esNueva: true,
      retroalimentacion: null,
    });
  });
});
