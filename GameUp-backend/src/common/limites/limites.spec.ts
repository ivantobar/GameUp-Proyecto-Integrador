import type { ExecutionContext } from '@nestjs/common';
import type { ThrottlerOptions } from '@nestjs/throttler';
import {
  claveLogin,
  correoDelLogin,
  crearOpcionesLimites,
  LIMITE_DE_LOGIN,
  LimiteDeLogin,
  MENSAJE_DEMASIADAS_PETICIONES,
} from './limites.js';

const LIMITES = {
  global: { limite: 600, ventanaSeg: 60 },
  login: { limite: 10, ventanaSeg: 60 },
  loginIp: { limite: 100, ventanaSeg: 120 },
};

function reglas(): ThrottlerOptions[] {
  const opciones = crearOpcionesLimites(LIMITES);
  if (Array.isArray(opciones)) throw new Error('se esperaba un objeto');
  return opciones.throttlers;
}

function regla(nombre: string): ThrottlerOptions {
  const encontrada = reglas().find((r) => r.name === nombre);
  if (!encontrada) throw new Error(`falta la regla ${nombre}`);
  return encontrada;
}

function contextoDe(handler: () => void): ExecutionContext {
  return { getHandler: () => handler } as unknown as ExecutionContext;
}

describe('correoDelLogin', () => {
  it('quita espacios y pasa a minúsculas', () => {
    expect(correoDelLogin({ correo: '  Ana.Gomez@Ejemplo.COM ' })).toBe(
      'ana.gomez@ejemplo.com',
    );
    expect(correoDelLogin({ correo: 'ana @ejemplo.com' })).toBe(
      'ana@ejemplo.com',
    );
  });

  it('null si no hay correo de texto', () => {
    expect(correoDelLogin(undefined)).toBeNull();
    expect(correoDelLogin({})).toBeNull();
    expect(correoDelLogin({ correo: 42 })).toBeNull();
    expect(correoDelLogin({ correo: '   ' })).toBeNull();
  });

  it('corta correos larguísimos (la clave no crece sin límite)', () => {
    const largo = `${'a'.repeat(1000)}@x.co`;
    expect(correoDelLogin({ correo: largo })).toHaveLength(254);
  });
});

describe('claveLogin', () => {
  it('IP + correo normalizado', () => {
    expect(claveLogin({ ip: '10.0.0.1', body: { correo: 'Ana@X.co' } })).toBe(
      '10.0.0.1|ana@x.co',
    );
  });

  it('sin correo, solo la IP', () => {
    expect(claveLogin({ ip: '10.0.0.1', body: {} })).toBe('10.0.0.1');
  });
});

describe('crearOpcionesLimites', () => {
  it('tres reglas, con las ventanas en milisegundos y el mensaje en español', () => {
    const opciones = crearOpcionesLimites(LIMITES);
    expect(Array.isArray(opciones)).toBe(false);
    if (Array.isArray(opciones)) return;
    expect(opciones.errorMessage).toBe(MENSAJE_DEMASIADAS_PETICIONES);
    expect(reglas().map((r) => r.name)).toEqual([
      'default',
      'login',
      'login-ip',
    ]);
    expect(regla('default')).toMatchObject({ limit: 600, ttl: 60_000 });
    expect(regla('login')).toMatchObject({ limit: 10, ttl: 60_000 });
    expect(regla('login-ip')).toMatchObject({ limit: 100, ttl: 120_000 });
  });

  it('la regla global cuenta por IP para todas las rutas juntas', () => {
    const generar = regla('default').generateKey;
    expect(generar?.({} as ExecutionContext, '10.0.0.1', 'default')).toBe(
      'global:10.0.0.1',
    );
  });

  it('las reglas del login solo aplican en rutas con @LimiteDeLogin()', () => {
    class Controlador {
      login(): void {}
      otra(): void {}
    }
    const descriptor = Object.getOwnPropertyDescriptor(
      Controlador.prototype,
      'login',
    );
    if (!descriptor) throw new Error('sin descriptor');
    LimiteDeLogin()(Controlador.prototype, 'login', descriptor);
    expect(
      Reflect.getMetadata(LIMITE_DE_LOGIN, Controlador.prototype.login),
    ).toBe(true);

    for (const nombre of ['login', 'login-ip']) {
      const saltar = regla(nombre).skipIf;
      expect(saltar?.(contextoDe(Controlador.prototype.login))).toBe(false);
      expect(saltar?.(contextoDe(Controlador.prototype.otra))).toBe(true);
    }
    expect(regla('default').skipIf).toBeUndefined();
  });
});
