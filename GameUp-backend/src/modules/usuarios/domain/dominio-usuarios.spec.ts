import { usuarioDePrueba } from '../../../../test/dobles/usuarios-en-memoria.js';
import { identidad } from '../../../../test/dobles/verificador-token-falso.js';
import { ReglaNegocioError } from '../../../common/errors/dominio.errors.js';
import { copiaDesdeIdentidad } from './copia-externa.js';
import {
  normalizarNuevoUsuario,
  type DatosNuevoUsuario,
} from './nuevo-usuario.js';

describe('Usuario.nombreVisible', () => {
  it('al estudiante lo saluda por su primer nombre', () => {
    const u = usuarioDePrueba(1, 'ESTUDIANTE', {
      nombres: 'Martín José',
      apellidos: 'Cruz',
    });
    expect(u.nombreVisible()).toBe('Martín');
  });

  it('a los adultos, primer nombre y primer apellido', () => {
    const u = usuarioDePrueba(2, 'TALLERISTA', {
      nombres: ' Ana  María ',
      apellidos: 'Gómez Ruiz',
    });
    expect(u.nombreVisible()).toBe('Ana Gómez');
  });
});

describe('normalizarNuevoUsuario', () => {
  const base: DatosNuevoUsuario = {
    idUsuarioAuth: 1n,
    rol: 'TALLERISTA',
    nombres: '  Ana   María ',
    apellidos: 'Gómez',
    correo: ' Tallerista@Ejemplo.COM ',
    idAcudienteExterno: null,
    idEstudianteExterno: null,
    nivelId: null,
  };

  it('normaliza espacios y el correo', () => {
    expect(normalizarNuevoUsuario(base)).toMatchObject({
      nombres: 'Ana María',
      correo: 'tallerista@ejemplo.com',
    });
  });

  it('correo vacío → null', () => {
    expect(normalizarNuevoUsuario({ ...base, correo: '  ' }).correo).toBeNull();
  });

  it('nombres en blanco → 422', () => {
    expect(() => normalizarNuevoUsuario({ ...base, nombres: '   ' })).toThrow(
      ReglaNegocioError,
    );
  });

  it('un estudiante exige idEstudianteExterno', () => {
    expect(() =>
      normalizarNuevoUsuario({ ...base, rol: 'ESTUDIANTE' }),
    ).toThrow(/idEstudianteExterno/);
    expect(
      normalizarNuevoUsuario({
        ...base,
        rol: 'ESTUDIANTE',
        idEstudianteExterno: 9n,
        nivelId: 2n,
      }),
    ).toMatchObject({ idEstudianteExterno: 9n, nivelId: 2n });
  });

  it('idEstudianteExterno y nivelId solo para estudiantes', () => {
    expect(() =>
      normalizarNuevoUsuario({ ...base, idEstudianteExterno: 9n }),
    ).toThrow(ReglaNegocioError);
    expect(() => normalizarNuevoUsuario({ ...base, nivelId: 1n })).toThrow(
      ReglaNegocioError,
    );
  });

  it('idAcudienteExterno solo para acudientes', () => {
    expect(() =>
      normalizarNuevoUsuario({ ...base, idAcudienteExterno: 7n }),
    ).toThrow(/solo aplica a cuentas de acudiente/);
    expect(
      normalizarNuevoUsuario({
        ...base,
        rol: 'ACUDIENTE',
        idAcudienteExterno: 7n,
      }).idAcudienteExterno,
    ).toBe(7n);
  });
});

describe('copiaDesdeIdentidad', () => {
  it('copia solo los campos que llegaron con un valor válido', () => {
    expect(
      copiaDesdeIdentidad(
        identidad(1, ['ADMIN'], {
          nombres: ' Ana ',
          apellidos: null,
          correo: 'ANA@EJEMPLO.COM',
        }),
      ),
    ).toEqual({ nombres: 'Ana', correo: 'ana@ejemplo.com' });
  });

  it('descarta un correo inválido y textos vacíos o demasiado largos', () => {
    expect(
      copiaDesdeIdentidad(
        identidad(1, ['ADMIN'], {
          nombres: '  ',
          apellidos: 'x'.repeat(101),
          correo: 'no-es-correo',
        }),
      ),
    ).toEqual({});
  });
});
