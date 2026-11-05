import { Cuenta } from '../domain/cuenta.entity.js';
import { CuentaMapper } from './cuenta.mapper.js';

describe('CuentaMapper', () => {
  it('fila de Prisma → Cuenta', () => {
    const cuenta = CuentaMapper.aEntidad({
      id: 5n,
      id_usuario_auth: 50n,
      activo: true,
      rol: { nombre: 'ESTUDIANTE' },
    });
    expect(cuenta).toEqual(new Cuenta(5n, 50n, 'ESTUDIANTE', true));
    expect(cuenta.coincideCon(['ESTUDIANTE'])).toBe(true);
    expect(cuenta.coincideCon(['ACUDIENTE'])).toBe(false);
  });

  it('un rol fuera del catálogo es un error de datos', () => {
    expect(() =>
      CuentaMapper.aEntidad({
        id: 5n,
        id_usuario_auth: 50n,
        activo: true,
        rol: { nombre: 'PSICOLOGO' },
      }),
    ).toThrow();
  });
});
