import { usuarioDePrueba } from '../../../../test/dobles/usuarios-en-memoria.js';
import { SesionMapper } from './sesion.mapper.js';

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
    expect(SesionMapper.aSesionDto(u)).toEqual({
      userId: '7',
      role,
      displayName,
    });
  });

  it('login: token, expiraEn ISO (o null) y la sesión', () => {
    const usuario = usuarioDePrueba(7, 'TALLERISTA');
    expect(
      SesionMapper.aLoginDto({
        token: 't',
        expiraEn: new Date('2026-11-06T00:00:00Z'),
        usuario,
      }),
    ).toMatchObject({
      token: 't',
      expiraEn: '2026-11-06T00:00:00.000Z',
      usuario: { userId: '7' },
    });
    expect(
      SesionMapper.aLoginDto({ token: 't', expiraEn: null, usuario }).expiraEn,
    ).toBeNull();
  });
});
