import { Cuenta } from '../domain/cuenta.entity.js';
import { CuentaMapper } from './cuenta.mapper.js';

describe('CuentaMapper', () => {
  it('fila de Prisma → Cuenta', () => {
    const cuenta = CuentaMapper.aEntidad({
      id: 5n,
      id_usuario_auth: 50n,
      activo: true,
      rol: { nombre: 'ESTUDIANTE' },
      estudiante: { estado: 'ACTIVO' },
    });
    expect(cuenta).toEqual(new Cuenta(5n, 50n, 'ESTUDIANTE', true, 'ACTIVO'));
    expect(cuenta.coincideCon(['ESTUDIANTE'])).toBe(true);
    expect(cuenta.coincideCon(['ACUDIENTE'])).toBe(false);
    expect(cuenta.esEstudianteSinAcceso()).toBe(false);
  });

  it.each(['EGRESADO', 'RETIRADO'])(
    'estudiante %s no tiene acceso',
    (estado) => {
      const cuenta = CuentaMapper.aEntidad({
        id: 5n,
        id_usuario_auth: 50n,
        activo: true,
        rol: { nombre: 'ESTUDIANTE' },
        estudiante: { estado },
      });
      expect(cuenta.esEstudianteSinAcceso()).toBe(true);
    },
  );

  it('el estado de estudiante no afecta a los adultos', () => {
    const cuenta = CuentaMapper.aEntidad({
      id: 6n,
      id_usuario_auth: 60n,
      activo: true,
      rol: { nombre: 'ACUDIENTE' },
      estudiante: null,
    });
    expect(cuenta.esEstudianteSinAcceso()).toBe(false);
  });

  it('un rol fuera del catálogo es un error de datos', () => {
    expect(() =>
      CuentaMapper.aEntidad({
        id: 5n,
        id_usuario_auth: 50n,
        activo: true,
        rol: { nombre: 'PSICOLOGO' },
        estudiante: null,
      }),
    ).toThrow();
  });
});
