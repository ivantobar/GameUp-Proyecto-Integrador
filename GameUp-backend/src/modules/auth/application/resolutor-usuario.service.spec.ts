import { CuentaRepositoryEnMemoria } from '../../../../test/dobles/cuentas-en-memoria.js';
import { identidad } from '../../../../test/dobles/verificador-token-falso.js';
import { AccesoDenegadoError } from '../../../common/errors/dominio.errors.js';
import { CuentaNoRegistradaError } from '../domain/cuenta-no-registrada.error.js';
import { Cuenta } from '../domain/cuenta.entity.js';
import { ResolutorUsuarioService } from './resolutor-usuario.service.js';

describe('ResolutorUsuarioService', () => {
  const cuentas = new CuentaRepositoryEnMemoria([
    new Cuenta(1n, 100n, 'DIRECTORA', true),
    new Cuenta(2n, 200n, 'TALLERISTA', true),
    new Cuenta(3n, 300n, 'ACUDIENTE', false),
    new Cuenta(4n, 400n, 'ESTUDIANTE', true, 'ACTIVO'),
    new Cuenta(5n, 500n, 'ESTUDIANTE', true, 'EGRESADO'),
    new Cuenta(6n, 600n, 'ESTUDIANTE', true, 'RETIRADO'),
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

  it('autenticado afuera pero sin fila en GameUP → 403 CuentaNoRegistradaError', async () => {
    const promesa = servicio.resolver(identidad(999, ['TALLERISTA']));
    await expect(promesa).rejects.toThrow(CuentaNoRegistradaError);
    await expect(promesa).rejects.toThrow(AccesoDenegadoError);
    await expect(promesa).rejects.toThrow(/aún no está registrada en GameUP/);
  });

  it('los demás 403 NO son CuentaNoRegistradaError (no disparan el alta)', async () => {
    for (const ident of [
      identidad(300, ['ACUDIENTE']), // inactiva
      identidad(200, ['ACUDIENTE']), // rol distinto
      identidad(100, ['DONANTE']), // sin rol con acceso
    ]) {
      const err: unknown = await servicio.resolver(ident).catch((e) => e);
      expect(err).toBeInstanceOf(AccesoDenegadoError);
      expect(err).not.toBeInstanceOf(CuentaNoRegistradaError);
    }
  });

  it('estudiante ACTIVO entra', async () => {
    await expect(
      servicio.resolver(identidad(400, ['ESTUDIANTE'])),
    ).resolves.toMatchObject({ id: 4n, rol: 'ESTUDIANTE' });
  });

  it.each([500, 600])(
    'estudiante egresado o retirado → 403 (auth %d)',
    async (idAuth) => {
      await expect(
        servicio.resolver(identidad(idAuth, ['ESTUDIANTE'])),
      ).rejects.toThrow(/ya no está activa/);
    },
  );

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
