import { CuentaRepositoryEnMemoria } from '../../../../test/dobles/cuentas-en-memoria.js';
import { identidad } from '../../../../test/dobles/verificador-token-falso.js';
import { AccesoDenegadoError } from '../../../common/errors/dominio.errors.js';
import { Cuenta } from '../domain/cuenta.entity.js';
import { ResolutorUsuarioService } from './resolutor-usuario.service.js';

describe('ResolutorUsuarioService', () => {
  const cuentas = new CuentaRepositoryEnMemoria([
    new Cuenta(1n, 100n, 'DIRECTORA', true),
    new Cuenta(2n, 200n, 'TALLERISTA', true),
    new Cuenta(3n, 300n, 'ACUDIENTE', false),
  ]);
  const servicio = new ResolutorUsuarioService(cuentas);
  beforeAll(() => {
    vi.spyOn(servicio['logger'], 'warn').mockImplementation(() => undefined);
  });

  it('ADMIN externo + DIRECTORA local → usuario autenticado', async () => {
    await expect(servicio.resolver(identidad(100, ['ADMIN']))).resolves.toEqual(
      {
        id: 1n,
        idUsuarioAuth: 100n,
        rol: 'DIRECTORA',
      },
    );
  });

  it('con varios roles externos se queda con el que coincide con el local', async () => {
    await expect(
      servicio.resolver(identidad(200, ['DONANTE', 'ACUDIENTE', 'TALLERISTA'])),
    ).resolves.toMatchObject({ id: 2n, rol: 'TALLERISTA' });
  });

  it('DONANTE (o rol desconocido) → 403', async () => {
    await expect(
      servicio.resolver(identidad(100, ['DONANTE'])),
    ).rejects.toThrow('Tu cuenta no tiene acceso a GameUP.');
    await expect(servicio.resolver(identidad(100, []))).rejects.toThrow(
      AccesoDenegadoError,
    );
  });

  it('autenticado afuera pero sin fila en GameUP → 403 con mensaje claro', async () => {
    await expect(
      servicio.resolver(identidad(999, ['TALLERISTA'])),
    ).rejects.toThrow(/aún no está registrada en GameUP/);
  });

  it('cuenta inactiva → 403', async () => {
    await expect(
      servicio.resolver(identidad(300, ['ACUDIENTE'])),
    ).rejects.toThrow(/desactivada/);
  });

  it('rol externo distinto al local → 403 y no cambia el rol', async () => {
    await expect(
      servicio.resolver(identidad(200, ['ACUDIENTE'])),
    ).rejects.toThrow(/no coincide/);
    expect((await cuentas.buscarPorIdUsuarioAuth(200n))?.rol).toBe(
      'TALLERISTA',
    );
  });
});
