import {
  NivelesEnMemoria,
  UsuariosEnMemoria,
  usuarioDePrueba,
} from '../../../../test/dobles/usuarios-en-memoria.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { CampoEnUsoError } from '../domain/campo-en-uso.error.js';
import type { DatosNuevoUsuario } from '../domain/nuevo-usuario.js';
import { UsuarioService } from './usuario.service.js';

const DIRECTORA: UsuarioAutenticado = {
  id: 1n,
  idUsuarioAuth: 100n,
  rol: 'DIRECTORA',
};

const nuevo = (extra: Partial<DatosNuevoUsuario> = {}): DatosNuevoUsuario => ({
  idUsuarioAuth: 900n,
  rol: 'TALLERISTA',
  nombres: 'Nueva',
  apellidos: 'Tallerista',
  correo: 'nueva@ejemplo.com',
  idAcudienteExterno: null,
  idEstudianteExterno: null,
  nivelId: null,
  ...extra,
});

describe('UsuarioService', () => {
  let repo: UsuariosEnMemoria;
  let servicio: UsuarioService;

  beforeEach(() => {
    repo = new UsuariosEnMemoria([
      usuarioDePrueba(1, 'DIRECTORA'),
      usuarioDePrueba(2, 'TALLERISTA', { correo: 'usado@ejemplo.com' }),
      usuarioDePrueba(3, 'ESTUDIANTE'), // idEstudianteExterno 3000
      usuarioDePrueba(4, 'ACUDIENTE', {
        idAcudienteExterno: 40n,
        activo: false,
      }),
    ]);
    servicio = new UsuarioService(repo, repo, new NivelesEnMemoria());
  });

  describe('crear', () => {
    it('crea una tallerista con la copia mínima', async () => {
      const u = await servicio.crear(nuevo());
      expect(u).toMatchObject({
        rol: 'TALLERISTA',
        idUsuarioAuth: 900n,
        activo: true,
        estudiante: null,
      });
      expect(await repo.buscarPorId(u.id)).not.toBeNull();
    });

    it('un estudiante sin nivel recibe el nivel inicial (BAJO)', async () => {
      const u = await servicio.crear(
        nuevo({ rol: 'ESTUDIANTE', idEstudianteExterno: 5000n }),
      );
      expect(u.estudiante).toEqual({
        idEstudianteExterno: 5000n,
        nivelId: 1n,
        estado: 'ACTIVO',
      });
    });

    it('un estudiante con un nivel que no existe → 422', async () => {
      await expect(
        servicio.crear(
          nuevo({ rol: 'ESTUDIANTE', idEstudianteExterno: 5000n, nivelId: 9n }),
        ),
      ).rejects.toThrow('El nivel indicado no existe.');
    });

    it.each([
      ['idUsuarioAuth', { idUsuarioAuth: 200n }, /id de la API de seguridad/],
      ['correo', { correo: 'usado@ejemplo.com' }, /ese correo/],
      [
        'idEstudianteExterno',
        { rol: 'ESTUDIANTE' as const, idEstudianteExterno: 3000n },
        /id de estudiante/,
      ],
      [
        'idAcudienteExterno',
        { rol: 'ACUDIENTE' as const, idAcudienteExterno: 40n },
        /id de acudiente/,
      ],
    ])('%s repetido → 409', async (campo, extra, mensaje) => {
      const promesa = servicio.crear(nuevo(extra));
      await expect(promesa).rejects.toThrow(ConflictoError);
      await expect(servicio.crear(nuevo(extra))).rejects.toThrow(mensaje);
      const err: unknown = await servicio.crear(nuevo(extra)).catch((e) => e);
      expect(err).toBeInstanceOf(CampoEnUsoError);
      expect((err as CampoEnUsoError).campos).toContain(campo);
    });

    it('el error lleva todos los campos repetidos; el mensaje es el del primero', async () => {
      const err: unknown = await servicio
        .crear(nuevo({ idUsuarioAuth: 200n, correo: 'usado@ejemplo.com' }))
        .catch((e) => e);
      expect(err).toBeInstanceOf(CampoEnUsoError);
      const e = err as CampoEnUsoError;
      expect([...e.campos].sort()).toEqual(['correo', 'idUsuarioAuth']);
      expect(e.incluye('correo')).toBe(true);
      expect(e.message).toBe(new CampoEnUsoError([e.campos[0]!]).message);
    });

    it('las reglas del rol se validan antes de escribir (422)', async () => {
      await expect(servicio.crear(nuevo({ nivelId: 1n }))).rejects.toThrow(
        ReglaNegocioError,
      );
      expect(repo.todos()).toHaveLength(4);
    });
  });

  it('listar filtra por rol y activo, y pagina', async () => {
    const todos = await servicio.listar(
      { rol: null, activo: null },
      { page: 1, limit: 2 },
    );
    expect(todos).toMatchObject({ total: 4, page: 1, limit: 2 });
    expect(todos.items).toHaveLength(2);

    const inactivos = await servicio.listar(
      { rol: 'ACUDIENTE', activo: false },
      { page: 1, limit: 20 },
    );
    expect(inactivos.items.map((u) => u.id)).toEqual([4n]);
  });

  it('obtener: 404 si no existe', async () => {
    await expect(servicio.obtener(2n)).resolves.toMatchObject({ id: 2n });
    await expect(servicio.obtener(99n)).rejects.toThrow(
      RecursoNoEncontradoError,
    );
  });

  describe('cambiarEstado', () => {
    it('no se puede desactivar a la última directora activa (422)', async () => {
      const otra = { id: 7n, idUsuarioAuth: 700n, rol: 'DIRECTORA' as const };
      // La directora 1 es la única activa: otra directora no puede desactivarla.
      repo = new UsuariosEnMemoria([
        usuarioDePrueba(1, 'DIRECTORA'),
        usuarioDePrueba(7, 'DIRECTORA', { activo: false }),
      ]);
      servicio = new UsuarioService(repo, repo, new NivelesEnMemoria());
      await expect(servicio.cambiarEstado(otra, 1n, false)).rejects.toThrow(
        'No puedes desactivar a la última directora activa.',
      );
      expect((await repo.buscarPorId(1n))?.activo).toBe(true);
    });

    it('con dos directoras activas, una puede desactivar a la otra', async () => {
      repo = new UsuariosEnMemoria([
        usuarioDePrueba(1, 'DIRECTORA'),
        usuarioDePrueba(7, 'DIRECTORA'),
      ]);
      servicio = new UsuarioService(repo, repo, new NivelesEnMemoria());
      expect((await servicio.cambiarEstado(DIRECTORA, 7n, false)).activo).toBe(
        false,
      );
    });

    it('desactiva y reactiva una cuenta', async () => {
      expect((await servicio.cambiarEstado(DIRECTORA, 2n, false)).activo).toBe(
        false,
      );
      expect((await servicio.cambiarEstado(DIRECTORA, 2n, true)).activo).toBe(
        true,
      );
    });

    it('la directora no puede desactivarse a sí misma (422)', async () => {
      await expect(
        servicio.cambiarEstado(DIRECTORA, 1n, false),
      ).rejects.toThrow('No puedes desactivar tu propia cuenta.');
    });

    it('cuenta inexistente → 404', async () => {
      await expect(
        servicio.cambiarEstado(DIRECTORA, 99n, false),
      ).rejects.toThrow(RecursoNoEncontradoError);
    });
  });
});
