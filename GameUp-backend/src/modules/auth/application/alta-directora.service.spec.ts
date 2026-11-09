import { DirectorioCentralFalso } from '../../../../test/dobles/directorio-central-falso.js';
import {
  NivelesEnMemoria,
  UsuariosEnMemoria,
} from '../../../../test/dobles/usuarios-en-memoria.js';
import { identidad } from '../../../../test/dobles/verificador-token-falso.js';
import {
  ReglaNegocioError,
  ServicioExternoNoDisponibleError,
} from '../../../common/errors/dominio.errors.js';
import type { ConsultaEstudianteExterno } from '../../estudiantes/domain/estudiante-externo.js';
import { UsuarioService } from '../../usuarios/application/usuario.service.js';
import {
  AltaDirectoraService,
  MENSAJES_ALTA_DIRECTORA,
  type PedidoAltaDirectora,
} from './alta-directora.service.js';

const TOKEN = 'jwt-directora';

const pedido = (
  extra: Partial<PedidoAltaDirectora> = {},
): PedidoAltaDirectora => ({
  idUsuarioAuth: 47n,
  rol: 'ESTUDIANTE',
  idAcudienteExterno: null,
  idEstudianteExterno: null,
  nivelId: null,
  ...extra,
});

function crear(
  opciones: {
    estudiantes?: ConsultaEstudianteExterno | null;
    personas?: ReturnType<typeof identidad>[];
  } = {},
) {
  const usuarios = new UsuariosEnMemoria();
  const directorio = new DirectorioCentralFalso(
    opciones.personas ?? [
      identidad(47, ['ESTUDIANTE'], {
        nombres: 'Martín',
        apellidos: 'Cruz',
        correo: 'martin@ejemplo.com',
      }),
      identidad(44, ['ADMIN']),
      identidad(40, ['TALLERISTA'], { nombres: null, apellidos: null }),
    ],
  );
  const servicio = new AltaDirectoraService(
    directorio,
    new UsuarioService(usuarios, usuarios, new NivelesEnMemoria()),
    opciones.estudiantes === undefined
      ? { porIdUsuarioAuth: async () => 23n }
      : opciones.estudiantes,
  );
  return { servicio, usuarios, directorio };
}

describe('AltaDirectoraService (POST /usuarios)', () => {
  it('toma los datos de la API central con el token de la directora', async () => {
    const { servicio, directorio } = crear();
    const u = await servicio.crear(pedido(), TOKEN);
    expect(u).toMatchObject({
      idUsuarioAuth: 47n,
      rol: 'ESTUDIANTE',
      nombres: 'Martín',
      apellidos: 'Cruz',
      correo: 'martin@ejemplo.com',
      estudiante: { idEstudianteExterno: 23n },
    });
    expect(directorio.consultas).toEqual([
      { idUsuarioAuth: 47n, token: TOKEN },
    ]);
  });

  it('ADMIN central → puede ser DIRECTORA', async () => {
    const { servicio } = crear();
    await expect(
      servicio.crear(pedido({ idUsuarioAuth: 44n, rol: 'DIRECTORA' }), TOKEN),
    ).resolves.toMatchObject({ rol: 'DIRECTORA' });
  });

  it('sin nombres en la API central → «Sin nombre» / «Sin apellido»', async () => {
    const { servicio } = crear();
    await expect(
      servicio.crear(pedido({ idUsuarioAuth: 40n, rol: 'TALLERISTA' }), TOKEN),
    ).resolves.toMatchObject({
      nombres: 'Sin nombre',
      apellidos: 'Sin apellido',
    });
  });

  it('no existe en la API central → 422', async () => {
    const { servicio } = crear();
    await expect(
      servicio.crear(pedido({ idUsuarioAuth: 999n }), TOKEN),
    ).rejects.toThrow(MENSAJES_ALTA_DIRECTORA.noExisteCentral);
  });

  it('rol que no tiene en la API central → 422', async () => {
    const { servicio, usuarios } = crear();
    await expect(
      servicio.crear(pedido({ rol: 'TALLERISTA' }), TOKEN),
    ).rejects.toThrow('Esa persona no tiene el rol TALLERISTA');
    expect(usuarios.todos()).toHaveLength(0);
  });

  it('API central caída → 503', async () => {
    const { servicio, directorio } = crear();
    directorio.caida = true;
    await expect(servicio.crear(pedido(), TOKEN)).rejects.toBeInstanceOf(
      ServicioExternoNoDisponibleError,
    );
  });

  describe('ESTUDIANTE e idEstudianteExterno', () => {
    it('lo pide a ASISCO UP por id_usuario, con el token de la directora', async () => {
      const porIdUsuarioAuth = vi.fn(async () => 23n);
      const { servicio } = crear({ estudiantes: { porIdUsuarioAuth } });
      await servicio.crear(pedido(), TOKEN);
      expect(porIdUsuarioAuth).toHaveBeenCalledWith(47n, TOKEN);
    });

    it('si la directora lo manda y coincide → se crea', async () => {
      const { servicio } = crear();
      await expect(
        servicio.crear(pedido({ idEstudianteExterno: 23n }), TOKEN),
      ).resolves.toMatchObject({ estudiante: { idEstudianteExterno: 23n } });
    });

    it('si la directora lo manda y no coincide → 422', async () => {
      const { servicio, usuarios } = crear();
      await expect(
        servicio.crear(pedido({ idEstudianteExterno: 24n }), TOKEN),
      ).rejects.toThrow(MENSAJES_ALTA_DIRECTORA.estudianteNoCoincide);
      expect(usuarios.todos()).toHaveLength(0);
    });

    it('ASISCO UP no lo tiene → 422', async () => {
      const { servicio } = crear({
        estudiantes: { porIdUsuarioAuth: async () => null },
      });
      await expect(servicio.crear(pedido(), TOKEN)).rejects.toThrow(
        MENSAJES_ALTA_DIRECTORA.estudianteNoEnAsisco,
      );
    });

    it('ASISCO UP no responde → 503', async () => {
      const { servicio } = crear({
        estudiantes: {
          porIdUsuarioAuth: async () => {
            throw new ServicioExternoNoDisponibleError('caída');
          },
        },
      });
      await expect(servicio.crear(pedido(), TOKEN)).rejects.toThrow(
        MENSAJES_ALTA_DIRECTORA.asiscoNoResponde,
      );
    });

    it('sin ASISCO UP: usa el que manda la directora; sin él → 422', async () => {
      const { servicio } = crear({ estudiantes: null });
      await expect(servicio.crear(pedido(), TOKEN)).rejects.toThrow(
        MENSAJES_ALTA_DIRECTORA.estudianteSinId,
      );
      await expect(
        servicio.crear(pedido({ idEstudianteExterno: 7001n }), TOKEN),
      ).resolves.toMatchObject({
        estudiante: { idEstudianteExterno: 7001n },
      });
    });

    it('a un rol que no es ESTUDIANTE no se le acepta idEstudianteExterno (422)', async () => {
      const { servicio } = crear();
      await expect(
        servicio.crear(
          pedido({
            idUsuarioAuth: 44n,
            rol: 'DIRECTORA',
            idEstudianteExterno: 1n,
          }),
          TOKEN,
        ),
      ).rejects.toBeInstanceOf(ReglaNegocioError);
    });
  });
});
