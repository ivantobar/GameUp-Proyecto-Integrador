import { mapearPerfil } from './perfil.mapper.js';

describe('mapearPerfil (provisional hasta tener un ejemplo real)', () => {
  it('perfil plano con un solo nombre_rol', () => {
    expect(
      mapearPerfil({
        id_usuario: 15,
        nombre_rol: 'ACUDIENTE',
        nombres: ' Laura ',
        apellidos: 'Gómez',
        correo_usuario: 'acudiente@ejemplo.com',
      }),
    ).toEqual({
      idUsuarioAuth: 15n,
      roles: ['ACUDIENTE'],
      nombres: 'Laura',
      apellidos: 'Gómez',
      correo: 'acudiente@ejemplo.com',
    });
  });

  it('varios roles (tabla rol_usuario) en distintas formas, sin repetir', () => {
    const identidad = mapearPerfil({
      id_usuario: '15',
      roles: [
        'DONANTE',
        { nombre_rol: 'TALLERISTA' },
        { rol: { nombre_rol: 'ADMIN' } },
      ],
      rol_usuario: [{ id_rol: 4, nombre_rol: 'TALLERISTA' }],
    });
    expect(identidad?.roles).toEqual(['DONANTE', 'TALLERISTA', 'ADMIN']);
  });

  it('rol como objeto { id_rol, nombre_rol }', () => {
    expect(
      mapearPerfil({ id: 3, rol: { id_rol: 1, nombre_rol: 'ESTUDIANTE' } })
        ?.roles,
    ).toEqual(['ESTUDIANTE']);
  });

  it('perfil envuelto en { data } o { usuario }', () => {
    expect(
      mapearPerfil({ data: { id_usuario: 9, nombre_rol: 'ADMIN' } })
        ?.idUsuarioAuth,
    ).toBe(9n);
    expect(mapearPerfil({ usuario: { idUsuario: 9 } })?.idUsuarioAuth).toBe(9n);
  });

  it('sin roles devuelve una lista vacía (el módulo de auth responde 403)', () => {
    expect(mapearPerfil({ id_usuario: 1 })?.roles).toEqual([]);
  });

  it.each([
    null,
    'texto',
    [],
    {},
    { id_usuario: 0 },
    { id_usuario: -2 },
    { id_usuario: 'abc' },
    { id_usuario: 1.5 },
  ])('devuelve null si no hay un id_usuario válido (%j)', (json) => {
    expect(mapearPerfil(json)).toBeNull();
  });
});
