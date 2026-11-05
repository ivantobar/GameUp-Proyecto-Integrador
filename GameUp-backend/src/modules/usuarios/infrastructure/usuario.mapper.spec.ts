import { UsuarioMapper, type FilaUsuario } from './usuario.mapper.js';

const fila = (extra: Partial<FilaUsuario> = {}): FilaUsuario => ({
  id: 3n,
  id_usuario_auth: 300n,
  nombres: 'Nombre',
  apellidos: 'Apellido',
  correo: null,
  activo: true,
  id_acudiente_externo: null,
  creado_en: new Date('2026-11-01T10:00:00Z'),
  ultimo_acceso: null,
  sincronizado_en: new Date('2026-11-02T10:00:00Z'),
  rol: { nombre: 'ESTUDIANTE' },
  estudiante: { id_estudiante_externo: 3000n, nivel_id: 2n, estado: 'ACTIVO' },
  ...extra,
});

describe('UsuarioMapper', () => {
  it('fila → entidad → DTO (ids como texto, fechas ISO)', () => {
    const dto = UsuarioMapper.aDto(UsuarioMapper.aEntidad(fila()));
    expect(dto).toEqual({
      id: '3',
      idUsuarioAuth: '300',
      rol: 'ESTUDIANTE',
      nombres: 'Nombre',
      apellidos: 'Apellido',
      correo: null,
      activo: true,
      idAcudienteExterno: null,
      estudiante: {
        idEstudianteExterno: '3000',
        nivelId: '2',
        estado: 'ACTIVO',
      },
      creadoEn: '2026-11-01T10:00:00.000Z',
      ultimoAcceso: null,
      sincronizadoEn: '2026-11-02T10:00:00.000Z',
    });
    // El DTO es JSON puro: ningún bigint.
    expect(() => JSON.stringify(dto)).not.toThrow();
  });

  it('acudiente sin fila de estudiante', () => {
    const dto = UsuarioMapper.aDto(
      UsuarioMapper.aEntidad(
        fila({
          rol: { nombre: 'ACUDIENTE' },
          estudiante: null,
          id_acudiente_externo: 77n,
        }),
      ),
    );
    expect(dto).toMatchObject({
      rol: 'ACUDIENTE',
      estudiante: null,
      idAcudienteExterno: '77',
    });
  });

  it('rol o estado fuera del catálogo es un error de datos', () => {
    expect(() =>
      UsuarioMapper.aEntidad(fila({ rol: { nombre: 'PSICOLOGO' } })),
    ).toThrow();
    expect(() =>
      UsuarioMapper.aEntidad(
        fila({
          estudiante: {
            id_estudiante_externo: 1n,
            nivel_id: 1n,
            estado: 'OTRO',
          },
        }),
      ),
    ).toThrow();
  });
});
