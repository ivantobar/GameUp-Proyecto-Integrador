import { identidad } from '../../../../test/dobles/verificador-token-falso.js';
import { usuarioDePrueba } from '../../../../test/dobles/usuarios-en-memoria.js';
import { SesionMapper } from './sesion.mapper.js';

const CENTRAL = identidad(845, ['ADMIN'], {
  nombres: 'Ana María',
  apellidos: 'Gómez Ruiz',
  correo: 'ana@ejemplo.com',
});

describe('SesionMapper', () => {
  it.each([
    ['DIRECTORA', 'director', 'Ana Gómez'],
    ['TALLERISTA', 'teacher', 'Ana Gómez'],
    ['ACUDIENTE', 'guardian', 'Ana Gómez'],
    ['ESTUDIANTE', 'student', 'Ana'],
  ] as const)('%s → role %s, displayName %s', (rol, role, displayName) => {
    const u = usuarioDePrueba(7, rol, {
      nombres: 'Ana María',
      apellidos: 'Gómez Ruiz',
    });
    expect(SesionMapper.aSesionDto(u, CENTRAL)).toEqual({
      userId: '7',
      role,
      displayName,
      identidadCentral: {
        idUsuario: '845',
        nombres: 'Ana María',
        apellidos: 'Gómez Ruiz',
        correo: 'ana@ejemplo.com',
        roles: ['ADMIN'],
      },
    });
  });

  it('identidadCentral solo lleva id, nombres, apellidos, correo y roles', () => {
    // Aunque llegaran otros campos, no salen en la respuesta.
    const conExtras = {
      ...CENTRAL,
      documento: '123',
      telefono: '300',
    } as unknown as typeof CENTRAL;
    expect(
      Object.keys(SesionMapper.aIdentidadCentralDto(conExtras)).sort(),
    ).toEqual(['apellidos', 'correo', 'idUsuario', 'nombres', 'roles']);
  });

  it('login: token, expiraEn ISO (o null) y la sesión con identidadCentral', () => {
    const usuario = usuarioDePrueba(7, 'TALLERISTA');
    expect(
      SesionMapper.aLoginDto({
        token: 't',
        expiraEn: new Date('2026-11-06T00:00:00Z'),
        usuario,
        identidad: CENTRAL,
      }),
    ).toMatchObject({
      token: 't',
      expiraEn: '2026-11-06T00:00:00.000Z',
      usuario: { userId: '7', identidadCentral: { idUsuario: '845' } },
    });
    expect(
      SesionMapper.aLoginDto({
        token: 't',
        expiraEn: null,
        usuario,
        identidad: CENTRAL,
      }).expiraEn,
    ).toBeNull();
  });
});
