import { AutenticadorFalso } from '../../../../test/dobles/autenticador-falso.js';
import {
  NivelesEnMemoria,
  UsuariosEnMemoria,
  usuarioDePrueba,
} from '../../../../test/dobles/usuarios-en-memoria.js';
import {
  identidad,
  VerificadorTokenFalso,
} from '../../../../test/dobles/verificador-token-falso.js';
import type { RolGameUp } from '../../../common/auth/usuario-autenticado.js';
import type { IdentidadExterna } from '../../../common/auth/verificador-token.js';
import {
  AccesoDenegadoError,
  ServicioExternoNoDisponibleError,
} from '../../../common/errors/dominio.errors.js';
import { RelojFijo } from '../../../common/reloj/reloj.js';
import type { ConsultaEstudianteExterno } from '../../estudiantes/domain/estudiante-externo.js';
import { UsuarioService } from '../../usuarios/application/usuario.service.js';
import { CuentaNoRegistradaError } from '../domain/cuenta-no-registrada.error.js';
import {
  AltaAutomaticaService,
  MENSAJES_ALTA,
} from './alta-automatica.service.js';
import { AuthService } from './auth.service.js';
import { ResolutorUsuarioService } from './resolutor-usuario.service.js';

const TODOS: RolGameUp[] = [
  'ESTUDIANTE',
  'ACUDIENTE',
  'TALLERISTA',
  'DIRECTORA',
];
const TOKEN = 'token-de-la-persona';

interface Opciones {
  roles?: RolGameUp[];
  /** null = ASISCO_API_URL vacía (sin consulta). */
  asisco?: ConsultaEstudianteExterno | null;
}

/** ASISCO UP falso: id_usuario 1000 → idEstudiante 77. */
const asiscoConEstudiante = (): ConsultaEstudianteExterno & {
  porIdUsuarioAuth: ReturnType<typeof vi.fn>;
} => ({
  porIdUsuarioAuth: vi.fn(async (id: bigint) => (id === 1000n ? 77n : null)),
});

function armar(opciones: Opciones = {}) {
  const usuarios = new UsuariosEnMemoria([
    usuarioDePrueba(1, 'DIRECTORA', { correo: 'directora@ejemplo.com' }), // auth 100
    usuarioDePrueba(2, 'TALLERISTA'), // auth 200
    usuarioDePrueba(3, 'ACUDIENTE', { activo: false }), // auth 300, inactiva
    usuarioDePrueba(4, 'ESTUDIANTE', {
      // auth 400, ya usa el idEstudiante 4000 de ASISCO UP
      estudiante: { idEstudianteExterno: 4000n, nivelId: 1n, estado: 'ACTIVO' },
    }),
  ]);
  const resolutor = new ResolutorUsuarioService(usuarios);
  vi.spyOn(resolutor['logger'], 'warn').mockImplementation(() => undefined);
  const alta = new AltaAutomaticaService(
    resolutor,
    new UsuarioService(usuarios, usuarios, new NivelesEnMemoria()),
    opciones.roles ?? TODOS,
    opciones.asisco === undefined ? asiscoConEstudiante() : opciones.asisco,
  );
  const log = vi
    .spyOn(alta['logger'], 'log')
    .mockImplementation(() => undefined);
  const warn = vi
    .spyOn(alta['logger'], 'warn')
    .mockImplementation(() => undefined);

  /** Login completo (AuthService) de una identidad. */
  const entrar = async (ident: IdentidadExterna) => {
    const auth = new AuthService(
      new AutenticadorFalso({
        'x@ejemplo.com': { contrasena: 'c', token: TOKEN },
      }),
      new VerificadorTokenFalso({ [TOKEN]: ident }),
      new VerificadorTokenFalso({}),
      resolutor,
      usuarios,
      usuarios,
      new RelojFijo(new Date('2026-11-08T12:00:00Z')),
      null,
      alta,
    );
    vi.spyOn(auth['logger'], 'warn').mockImplementation(() => undefined);
    return auth.iniciarSesion('x@ejemplo.com', 'c');
  };
  const deAuth = (id: bigint) =>
    usuarios.todos().filter((u) => u.idUsuarioAuth === id);

  return { usuarios, resolutor, alta, log, warn, entrar, deAuth };
}

describe('AltaAutomaticaService', () => {
  describe('se crea la cuenta en el primer login', () => {
    it.each([
      ['TALLERISTA', 'TALLERISTA', 700],
      ['ACUDIENTE', 'ACUDIENTE', 800],
      ['ADMIN', 'DIRECTORA', 900],
      ['ESTUDIANTE', 'ESTUDIANTE', 1000],
    ] as const)('rol externo %s → cuenta %s', async (externo, rol, idAuth) => {
      const { entrar, deAuth, log } = armar();
      const sesion = await entrar(
        identidad(idAuth, [externo], {
          nombres: '  Persona   Nueva ',
          apellidos: 'De Prueba',
          correo: 'Nueva@Ejemplo.com',
        }),
      );
      const creadas = deAuth(BigInt(idAuth));
      expect(creadas).toHaveLength(1);
      expect(creadas[0]).toMatchObject({
        rol,
        nombres: 'Persona Nueva',
        apellidos: 'De Prueba',
        correo: 'nueva@ejemplo.com',
        activo: true,
        idAcudienteExterno: null,
      });
      expect(sesion.usuario.id).toBe(creadas[0]?.id);
      expect(sesion.token).toBe(TOKEN);
      // Log info solo con id interno, id_usuario_auth y rol.
      expect(log).toHaveBeenCalledTimes(1);
      const mensaje = String(log.mock.calls[0]?.[0]);
      expect(mensaje).toContain(`id_usuario_auth ${idAuth}`);
      expect(mensaje).toContain(`rol ${rol}`);
      expect(mensaje).not.toMatch(/Persona|Prueba|ejemplo/i);
    });

    it('ESTUDIANTE: idEstudianteExterno de ASISCO UP (con su token) y nivel inicial', async () => {
      const asisco = asiscoConEstudiante();
      const { entrar, deAuth } = armar({ asisco });
      await entrar(identidad(1000, ['ESTUDIANTE']));
      expect(asisco.porIdUsuarioAuth).toHaveBeenCalledWith(1000n, TOKEN);
      expect(deAuth(1000n)[0]?.estudiante).toEqual({
        idEstudianteExterno: 77n,
        nivelId: 1n, // NivelesEnMemoria.inicial() (BAJO), como POST /usuarios
        estado: 'ACTIVO',
      });
    });

    it('los otros roles no consultan ASISCO UP', async () => {
      const asisco = asiscoConEstudiante();
      const { entrar } = armar({ asisco });
      await entrar(identidad(700, ['TALLERISTA']));
      expect(asisco.porIdUsuarioAuth).not.toHaveBeenCalled();
    });

    it('sin nombre o apellido → «Sin nombre» / «Sin apellido»', async () => {
      const { entrar, deAuth } = armar();
      await entrar(
        identidad(700, ['TALLERISTA'], { nombres: null, apellidos: '   ' }),
      );
      expect(deAuth(700n)[0]).toMatchObject({
        nombres: 'Sin nombre',
        apellidos: 'Sin apellido',
      });
    });

    it('correo inválido → se crea sin correo', async () => {
      const { entrar, deAuth } = armar();
      await entrar(identidad(700, ['TALLERISTA'], { correo: 'no-es-correo' }));
      expect(deAuth(700n)[0]?.correo).toBeNull();
    });

    it('correo ya usado por otra cuenta → se crea SIN correo y log solo con ids', async () => {
      const { entrar, deAuth, warn, usuarios } = armar();
      // Como en la base (uq_usuario_correo): la copia con ese correo falla.
      // AuthService atrapa ese fallo: el login sigue, hoy y en los siguientes.
      vi.spyOn(usuarios, 'sincronizarCopia').mockRejectedValue(
        new Error('uq_usuario_correo'),
      );
      const ident = identidad(700, ['TALLERISTA'], {
        correo: 'directora@ejemplo.com',
      });
      const sesion = await entrar(ident);
      expect(deAuth(700n)).toHaveLength(1);
      expect(deAuth(700n)[0]?.correo).toBeNull();
      expect(sesion.usuario.id).toBe(deAuth(700n)[0]?.id);
      // Segundo login con el correo aún repetido: entra, sin crear otra.
      await expect(entrar(ident)).resolves.toMatchObject({
        usuario: { id: deAuth(700n)[0]?.id },
      });
      expect(deAuth(700n)).toHaveLength(1);
      const mensaje = String(warn.mock.calls[0]?.[0]);
      expect(mensaje).toContain('id_usuario_auth 700');
      expect(mensaje).not.toContain('directora@ejemplo.com');
    });
  });

  describe('no se crea la cuenta', () => {
    it('varios roles con acceso → 403 «varios roles»', async () => {
      const { entrar, deAuth } = armar();
      await expect(
        entrar(identidad(700, ['TALLERISTA', 'ACUDIENTE', 'DONANTE'])),
      ).rejects.toThrow(MENSAJES_ALTA.variosRoles);
      expect(deAuth(700n)).toHaveLength(0);
    });

    it('cuenta inactiva → 403 de siempre, sin crear ni reactivar', async () => {
      const { entrar, usuarios, alta } = armar();
      const darDeAlta = vi.spyOn(alta, 'darDeAlta');
      await expect(entrar(identidad(300, ['ACUDIENTE']))).rejects.toThrow(
        /desactivada/,
      );
      expect(darDeAlta).not.toHaveBeenCalled();
      expect(usuarios.todos()).toHaveLength(4);
      expect((await usuarios.buscarPorId(3n))?.activo).toBe(false);
    });

    it('rol que no coincide → 403 de siempre, sin crear ni cambiar el rol', async () => {
      const { entrar, usuarios, alta } = armar();
      const darDeAlta = vi.spyOn(alta, 'darDeAlta');
      await expect(entrar(identidad(200, ['ACUDIENTE']))).rejects.toThrow(
        /no coincide/,
      );
      expect(darDeAlta).not.toHaveBeenCalled();
      expect(usuarios.todos()).toHaveLength(4);
      expect((await usuarios.buscarPorId(2n))?.rol).toBe('TALLERISTA');
    });

    it('DONANTE (sin rol con acceso) → 403 de siempre', async () => {
      const { entrar, usuarios } = armar();
      await expect(entrar(identidad(700, ['DONANTE']))).rejects.toThrow(
        'Tu cuenta no tiene acceso a GameUP.',
      );
      expect(usuarios.todos()).toHaveLength(4);
    });

    it('interruptor vacío → el 403 de hoy («aún no está registrada»)', async () => {
      const { entrar, usuarios } = armar({ roles: [] });
      const err: unknown = await entrar(identidad(700, ['TALLERISTA'])).catch(
        (e) => e,
      );
      expect(err).toBeInstanceOf(CuentaNoRegistradaError);
      expect(usuarios.todos()).toHaveLength(4);
    });

    it('rol fuera de ALTA_AUTOMATICA_ROLES → 403 («aún no está registrada»)', async () => {
      const { entrar, deAuth } = armar({ roles: ['ESTUDIANTE', 'ACUDIENTE'] });
      await expect(entrar(identidad(900, ['ADMIN']))).rejects.toThrow(
        CuentaNoRegistradaError,
      );
      expect(deAuth(900n)).toHaveLength(0);
    });

    it('darDeAlta relanza el mismo error original cuando no aplica', async () => {
      const { alta } = armar({ roles: [] });
      const original = new CuentaNoRegistradaError();
      await expect(
        alta.darDeAlta(identidad(700, ['TALLERISTA']), TOKEN, original),
      ).rejects.toBe(original);
    });

    describe('ESTUDIANTE y ASISCO UP', () => {
      it('ASISCO_API_URL vacía (sin consulta) → 403 «aún no te encontramos»', async () => {
        const { entrar, deAuth } = armar({ asisco: null });
        await expect(entrar(identidad(1000, ['ESTUDIANTE']))).rejects.toThrow(
          MENSAJES_ALTA.estudianteNoEncontrado,
        );
        expect(deAuth(1000n)).toHaveLength(0);
      });

      it('no encontrado (o respondió por otra cuenta: el adaptador da null) → 403', async () => {
        const { entrar, deAuth } = armar();
        const err: unknown = await entrar(
          identidad(1001, ['ESTUDIANTE']),
        ).catch((e) => e);
        expect(err).toBeInstanceOf(AccesoDenegadoError);
        expect((err as Error).message).toBe(
          MENSAJES_ALTA.estudianteNoEncontrado,
        );
        expect(deAuth(1001n)).toHaveLength(0);
      });

      it('ASISCO UP caído → 503 «espera un momento»', async () => {
        const { entrar, deAuth } = armar({
          asisco: {
            porIdUsuarioAuth: vi.fn(async () => {
              throw new ServicioExternoNoDisponibleError(
                'ASISCO UP no responde.',
              );
            }),
          },
        });
        const err: unknown = await entrar(
          identidad(1000, ['ESTUDIANTE']),
        ).catch((e) => e);
        expect(err).toBeInstanceOf(ServicioExternoNoDisponibleError);
        expect((err as Error).message).toBe(MENSAJES_ALTA.asiscoNoResponde);
        expect(deAuth(1000n)).toHaveLength(0);
      });

      it('idEstudianteExterno ya usado por otra cuenta → 403 y log solo con ids', async () => {
        const { entrar, deAuth, warn } = armar({
          asisco: { porIdUsuarioAuth: vi.fn(async () => 4000n) },
        });
        await expect(
          entrar(identidad(1000, ['ESTUDIANTE'], { nombres: 'Niño' })),
        ).rejects.toThrow(MENSAJES_ALTA.revisarCuenta);
        expect(deAuth(1000n)).toHaveLength(0);
        const mensaje = String(warn.mock.calls[0]?.[0]);
        expect(mensaje).toContain('4000');
        expect(mensaje).toContain('id_usuario_auth 1000');
        expect(mensaje).not.toContain('Niño');
      });
    });
  });

  describe('carreras (dos logins a la vez)', () => {
    it('el otro login creó la cuenta antes del índice único → entra normalmente', async () => {
      const { entrar, usuarios, deAuth } = armar();
      const crearReal = usuarios.crear.bind(usuarios);
      vi.spyOn(usuarios, 'crear').mockImplementationOnce(async (datos) => {
        // El otro login gana: su fila queda y la nuestra choca con el índice.
        await crearReal(datos);
        throw Object.assign(new Error('Unique constraint failed'), {
          name: 'PrismaClientKnownRequestError',
          code: 'P2002',
        });
      });
      const sesion = await entrar(identidad(700, ['TALLERISTA']));
      expect(deAuth(700n)).toHaveLength(1);
      expect(sesion.usuario.id).toBe(deAuth(700n)[0]?.id);
    });

    it('la cuenta apareció entre resolver y crear (camposEnUso: idUsuarioAuth) → entra', async () => {
      const { entrar, usuarios, deAuth } = armar();
      const camposReal = usuarios.camposEnUso.bind(usuarios);
      vi.spyOn(usuarios, 'camposEnUso').mockImplementationOnce(async (d) => {
        await usuarios.crear({ ...d, nivelId: null });
        return camposReal(d);
      });
      await expect(
        entrar(identidad(700, ['TALLERISTA'])),
      ).resolves.toMatchObject({ usuario: { rol: 'TALLERISTA' } });
      expect(deAuth(700n)).toHaveLength(1);
    });

    it('crear falla y la cuenta sigue sin existir → 403 «revise tu cuenta» y log con ids', async () => {
      const { entrar, usuarios, deAuth, warn } = armar();
      vi.spyOn(usuarios, 'crear').mockRejectedValueOnce(
        new Error('base caída'),
      );
      await expect(entrar(identidad(700, ['TALLERISTA']))).rejects.toThrow(
        MENSAJES_ALTA.revisarCuenta,
      );
      expect(deAuth(700n)).toHaveLength(0);
      expect(String(warn.mock.calls.at(-1)?.[0])).toContain(
        'id_usuario_auth 700',
      );
    });
  });
});
