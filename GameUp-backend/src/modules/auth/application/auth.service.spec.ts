import { AutenticadorFalso } from '../../../../test/dobles/autenticador-falso.js';
import {
  UsuariosEnMemoria,
  usuarioDePrueba,
} from '../../../../test/dobles/usuarios-en-memoria.js';
import {
  identidad,
  VerificadorTokenFalso,
} from '../../../../test/dobles/verificador-token-falso.js';
import {
  AccesoDenegadoError,
  NoAutenticadoError,
} from '../../../common/errors/dominio.errors.js';
import { RelojFijo } from '../../../common/reloj/reloj.js';
import { AuthService } from './auth.service.js';
import { ResolutorUsuarioService } from './resolutor-usuario.service.js';

const AHORA = new Date('2026-11-05T12:00:00Z');

/** JWT de prueba con exp (firma falsa). */
const jwt = (exp: number) =>
  `e30.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.firma`;
const TOKEN_TALLERISTA = jwt(1_800_000_000);

describe('AuthService', () => {
  let usuarios: UsuariosEnMemoria;
  let verificador: VerificadorTokenFalso;
  let servicio: AuthService;

  beforeEach(() => {
    usuarios = new UsuariosEnMemoria([
      usuarioDePrueba(2, 'TALLERISTA', {
        nombres: 'Viejo',
        apellidos: 'Nombre',
      }), // idUsuarioAuth 200
      usuarioDePrueba(3, 'ACUDIENTE'), // idUsuarioAuth 300
    ]);
    verificador = new VerificadorTokenFalso({
      [TOKEN_TALLERISTA]: identidad(200, ['TALLERISTA'], {
        nombres: 'Ana',
        apellidos: 'Gómez',
        correo: 'ana@ejemplo.com',
      }),
      'token-donante': identidad(300, ['DONANTE']),
    });
    const resolutor = new ResolutorUsuarioService(usuarios);
    vi.spyOn(resolutor['logger'], 'warn').mockImplementation(() => undefined);
    servicio = new AuthService(
      new AutenticadorFalso({
        'ana@ejemplo.com': { contrasena: 'clave', token: TOKEN_TALLERISTA },
        'donante@ejemplo.com': { contrasena: 'clave', token: 'token-donante' },
      }),
      verificador,
      verificador,
      resolutor,
      usuarios,
      usuarios,
      new RelojFijo(AHORA),
    );
    vi.spyOn(servicio['logger'], 'warn').mockImplementation(() => undefined);
  });

  describe('iniciarSesion', () => {
    it('devuelve el token, su vencimiento y la cuenta', async () => {
      const sesion = await servicio.iniciarSesion('ana@ejemplo.com', 'clave');
      expect(sesion.token).toBe(TOKEN_TALLERISTA);
      expect(sesion.expiraEn).toEqual(new Date(1_800_000_000_000));
      expect(sesion.usuario).toMatchObject({ id: 2n, rol: 'TALLERISTA' });
    });

    it('sincroniza la copia mínima y marca ultimo_acceso y sincronizado_en', async () => {
      const { usuario } = await servicio.iniciarSesion(
        'ana@ejemplo.com',
        'clave',
      );
      expect(usuario).toMatchObject({
        nombres: 'Ana',
        apellidos: 'Gómez',
        correo: 'ana@ejemplo.com',
        ultimoAcceso: AHORA,
        sincronizadoEn: AHORA,
      });
    });

    it('credenciales incorrectas → 401', async () => {
      await expect(
        servicio.iniciarSesion('ana@ejemplo.com', 'mala'),
      ).rejects.toThrow(NoAutenticadoError);
    });

    it('rol sin acceso (DONANTE) → 403 y no toca la copia', async () => {
      await expect(
        servicio.iniciarSesion('donante@ejemplo.com', 'clave'),
      ).rejects.toThrow(AccesoDenegadoError);
      expect((await usuarios.buscarPorId(3n))?.ultimoAcceso).toBeNull();
    });

    it('si la sincronización falla, igual entra', async () => {
      vi.spyOn(usuarios, 'sincronizarCopia').mockRejectedValue(
        new Error('base caída'),
      );
      await expect(
        servicio.iniciarSesion('ana@ejemplo.com', 'clave'),
      ).resolves.toMatchObject({
        usuario: { id: 2n },
      });
    });
  });

  it('sesionActual devuelve la cuenta de quien pide', async () => {
    await expect(
      servicio.sesionActual({ id: 2n, idUsuarioAuth: 200n, rol: 'TALLERISTA' }),
    ).resolves.toMatchObject({ id: 2n });
  });

  it('cerrarSesion olvida el token de la caché', () => {
    servicio.cerrarSesion(TOKEN_TALLERISTA);
    expect(verificador.olvidados).toEqual([TOKEN_TALLERISTA]);
  });

  describe('acudiente con ASISCO UP conectado', () => {
    const TOKEN_ACUDIENTE = jwt(1_800_000_000) + 'a';
    let llamadas: Array<[{ id: bigint; idUsuarioAuth: bigint }, string]>;
    let fallar: boolean;
    const sincronizador = {
      sincronizarAcudiente(
        acudiente: { id: bigint; idUsuarioAuth: bigint },
        token: string,
      ): Promise<void> {
        llamadas.push([acudiente, token]);
        return fallar
          ? Promise.reject(new Error('dormido'))
          : Promise.resolve();
      },
    };
    const crear = () => {
      const verif = new VerificadorTokenFalso({
        [TOKEN_TALLERISTA]: identidad(200, ['TALLERISTA']),
        [TOKEN_ACUDIENTE]: identidad(300, ['ACUDIENTE']),
      });
      const resolutor = new ResolutorUsuarioService(usuarios);
      const s = new AuthService(
        new AutenticadorFalso({
          'ana@ejemplo.com': { contrasena: 'clave', token: TOKEN_TALLERISTA },
          'acu@ejemplo.com': { contrasena: 'clave', token: TOKEN_ACUDIENTE },
        }),
        verif,
        verif,
        resolutor,
        usuarios,
        usuarios,
        new RelojFijo(AHORA),
        sincronizador,
      );
      vi.spyOn(s['logger'], 'warn').mockImplementation(() => undefined);
      return s;
    };
    beforeEach(() => {
      llamadas = [];
      fallar = false;
    });

    it('al entrar refresca sus vínculos con su propio token', async () => {
      await crear().iniciarSesion('acu@ejemplo.com', 'clave');
      expect(llamadas).toEqual([
        [
          expect.objectContaining({ id: 3n, idUsuarioAuth: 300n }),
          TOKEN_ACUDIENTE,
        ],
      ]);
    });

    it('si ASISCO UP falla, igual entra', async () => {
      fallar = true;
      await expect(
        crear().iniciarSesion('acu@ejemplo.com', 'clave'),
      ).resolves.toMatchObject({ usuario: { id: 3n } });
    });

    it('otros roles no consultan ASISCO UP', async () => {
      await crear().iniciarSesion('ana@ejemplo.com', 'clave');
      expect(llamadas).toEqual([]);
    });
  });
});
