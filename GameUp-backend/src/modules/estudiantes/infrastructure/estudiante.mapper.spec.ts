import { alcanceDe } from '../domain/alcance.js';
import {
  EstudianteMapper,
  nombreVisiblePersona,
  type FilaEstudiante,
} from './estudiante.mapper.js';

const fila = (extra: Partial<FilaEstudiante> = {}): FilaEstudiante => ({
  usuario_id: 10n,
  estado: 'ACTIVO',
  fecha_ingreso: new Date('2026-02-03T00:00:00.000Z'),
  personaje_avatar: 'osito',
  id_estudiante_externo: 9001n,
  nivel: { id: 1n, nombre: 'BAJO' },
  usuario: {
    id_usuario_auth: 4747n,
    nombres: 'Martín José',
    apellidos: 'cruz Pérez',
    activo: true,
  },
  ...extra,
});

describe('EstudianteMapper', () => {
  const e = EstudianteMapper.aEntidad(fila());

  it('nombres como los muestra la app', () => {
    expect(e.primerNombre()).toBe('Martín');
    expect(e.nombreCorto()).toBe('Martín C.');
    expect(e.iniciales()).toBe('MC');
  });

  it('resumen (StudentSummary) sin datos de más', () => {
    expect(EstudianteMapper.aResumenDto(e)).toEqual({
      id: '10',
      displayName: 'Martín C.',
      initials: 'MC',
      nivel: { id: '1', nombre: 'BAJO' },
      estado: 'ACTIVO',
    });
  });

  it('detalle: fecha sin hora y nunca el id externo', () => {
    const dto = EstudianteMapper.aDetalleDto(e);
    expect(dto).toMatchObject({
      fechaIngreso: '2026-02-03',
      personajeAvatar: 'osito',
      cuentaActiva: true,
    });
    expect(JSON.stringify(dto)).not.toContain('9001');
  });

  it('ningún DTO lleva los ids externos (idEstudianteExterno ni idUsuarioAuth)', () => {
    for (const dto of [
      EstudianteMapper.aResumenDto(e),
      EstudianteMapper.aDetalleDto(e),
      EstudianteMapper.aPropioDto(e),
    ]) {
      const json = JSON.stringify(dto);
      expect(json).not.toContain('9001');
      expect(json).not.toContain('4747');
      expect(json).not.toMatch(/idUsuarioAuth|idEstudianteExterno/);
    }
  });

  it('propio (StudentProfile): saluda por el primer nombre', () => {
    expect(EstudianteMapper.aPropioDto(e)).toMatchObject({
      id: '10',
      displayName: 'Martín',
    });
  });

  it('estado desconocido es un error de datos', () => {
    expect(() => EstudianteMapper.aEntidad(fila({ estado: 'OTRO' }))).toThrow();
  });

  it('vínculos y cambios de nivel → DTO', () => {
    const persona = { id: 2n, nombres: 'Ana María', apellidos: 'Gómez Ruiz' };
    expect(nombreVisiblePersona(persona)).toBe('Ana Gómez');
    expect(
      EstudianteMapper.talleristaADto({
        tallerista: persona,
        fechaInicio: new Date('2026-11-05T00:00:00Z'),
        activo: true,
      }),
    ).toEqual({
      talleristaId: '2',
      displayName: 'Ana Gómez',
      fechaInicio: '2026-11-05',
      activo: true,
    });
    expect(
      EstudianteMapper.acudienteADto({
        acudiente: persona,
        parentesco: 'Madre',
        esPrincipal: true,
      }),
    ).toEqual({
      acudienteId: '2',
      displayName: 'Ana Gómez',
      parentesco: 'Madre',
      esPrincipal: true,
    });
    expect(
      EstudianteMapper.cambioNivelADto({
        id: 5n,
        nivel: { id: 2n, nombre: 'MEDIO' },
        motivo: null,
        fecha: new Date('2026-11-05T15:00:00Z'),
        asignadoPor: persona,
      }),
    ).toEqual({
      id: '5',
      nivel: { id: '2', nombre: 'MEDIO' },
      motivo: null,
      fecha: '2026-11-05T15:00:00.000Z',
      asignadoPor: { id: '2', displayName: 'Ana Gómez' },
    });
  });
});

describe('alcanceDe', () => {
  it.each([
    ['DIRECTORA', { tipo: 'todos' }],
    ['TALLERISTA', { tipo: 'tallerista', talleristaId: 7n }],
    ['ACUDIENTE', { tipo: 'acudiente', acudienteId: 7n }],
    ['ESTUDIANTE', { tipo: 'propio', estudianteId: 7n }],
  ] as const)('%s', (rol, alcance) => {
    expect(alcanceDe({ id: 7n, idUsuarioAuth: 700n, rol })).toEqual(alcance);
  });
});
