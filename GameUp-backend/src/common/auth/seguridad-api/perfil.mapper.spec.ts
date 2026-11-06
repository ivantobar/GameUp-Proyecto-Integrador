import { mapearPerfil } from './perfil.mapper.js';

describe('mapearPerfil', () => {
  /**
   * Forma real de GET /api/auth/perfil, confirmada el 2026-11-05 con una
   * cuenta de prueba (solo la estructura; los valores de aquí son ficticios).
   */
  it('respuesta real de la API de seguridad: solo guarda la copia mínima', () => {
    const identidad = mapearPerfil({
      id_usuario: 41,
      correo_usuario: 'directora.prueba@ejemplo.com',
      nombres: 'Directora',
      apellidos: 'Prueba',
      tipo_documento: null,
      numero_identificacion: '9990000001',
      telefono: null,
      direccion: null,
      fecha_nacimiento: null,
      acepta_terminos_condiciones: true,
      creado_en: '2026-11-05T17:00:00.000Z',
      roles: [{ id_rol: 2, nombre_rol: 'ADMIN' }],
    });

    expect(identidad).toEqual({
      idUsuarioAuth: 41n,
      roles: ['ADMIN'],
      nombres: 'Directora',
      apellidos: 'Prueba',
      correo: 'directora.prueba@ejemplo.com',
    });
    // Ley 1581: documento, teléfono, dirección y fecha de nacimiento no pasan.
    expect(
      JSON.stringify(identidad, (_k, v: unknown) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
    ).not.toMatch(
      /9990000001|numero_identificacion|telefono|direccion|fecha_nacimiento/,
    );
  });

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
