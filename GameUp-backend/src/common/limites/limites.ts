import { SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type {
  ThrottlerModuleOptions,
  ThrottlerOptions,
} from '@nestjs/throttler';
import type { EnvironmentVariables } from '../../config/env.validation.js';

/**
 * Límite de peticiones (@nestjs/throttler). Tres reglas:
 *
 *  - `default` (global): todas las rutas, por IP real del cliente (Express
 *    la lee con `trust proxy` = TRUST_PROXY_HOPS). Una sola cuenta por IP
 *    para TODAS las rutas. Es holgado porque en la fundación muchos
 *    celulares comparten la misma IP. `GET /health` queda fuera.
 *  - `login`: solo POST /auth/login, por IP + correo normalizado. Frena la
 *    fuerza bruta contra una cuenta sin castigar a los demás niños de la
 *    misma Wi-Fi.
 *  - `login-ip`: solo POST /auth/login, por IP (cualquier correo). Frena que
 *    desde una IP se prueben muchas cuentas distintas.
 *
 * Los contadores viven en memoria (Render corre UNA instancia). Si algún día
 * hay varias instancias, hay que pasar a un almacenamiento compartido (por
 * ejemplo Redis) con la opción `storage` de ThrottlerModule.
 */

/** Ventanas y topes (los segundos se pasan a milisegundos al armar las reglas). */
export interface LimitesPeticiones {
  global: { limite: number; ventanaSeg: number };
  login: { limite: number; ventanaSeg: number };
  loginIp: { limite: number; ventanaSeg: number };
}

export const MENSAJE_DEMASIADAS_PETICIONES =
  'Demasiados intentos. Espera un momento y vuelve a intentarlo.';

/** Metadato que activa las reglas del login en una ruta. */
export const LIMITE_DE_LOGIN = 'gameup:limite-de-login';

/** Marca la ruta de inicio de sesión: le aplican `login` y `login-ip`. */
export const LimiteDeLogin = (): MethodDecorator =>
  SetMetadata(LIMITE_DE_LOGIN, true);

export function leerLimites(
  config: ConfigService<EnvironmentVariables, true>,
): LimitesPeticiones {
  return {
    global: {
      limite: config.get('THROTTLE_GLOBAL_LIMITE', { infer: true }),
      ventanaSeg: config.get('THROTTLE_GLOBAL_VENTANA_SEG', { infer: true }),
    },
    login: {
      limite: config.get('THROTTLE_LOGIN_LIMITE', { infer: true }),
      ventanaSeg: config.get('THROTTLE_LOGIN_VENTANA_SEG', { infer: true }),
    },
    loginIp: {
      limite: config.get('THROTTLE_LOGIN_IP_LIMITE', { infer: true }),
      ventanaSeg: config.get('THROTTLE_LOGIN_IP_VENTANA_SEG', { infer: true }),
    },
  };
}

interface SolicitudConIp {
  ip?: string;
  body?: unknown;
}

/** IP del cliente (ya resuelta por Express con `trust proxy`). */
export function ipDe(req: SolicitudConIp): string {
  return req.ip ?? 'desconocida';
}

/**
 * Correo del cuerpo del login, sin espacios y en minúsculas, o null si no
 * viene. Nunca se registra: solo entra (con la IP) en la clave del contador,
 * que el throttler guarda como hash SHA-256.
 */
export function correoDelLogin(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const correo = (body as { correo?: unknown }).correo;
  if (typeof correo !== 'string') return null;
  const limpio = correo.replace(/\s+/g, '').toLowerCase().slice(0, 254);
  return limpio === '' ? null : limpio;
}

/** IP + correo; sin correo, solo la IP. */
export function claveLogin(req: SolicitudConIp): string {
  const correo = correoDelLogin(req.body);
  return correo === null ? ipDe(req) : `${ipDe(req)}|${correo}`;
}

function noEsLogin(ctx: ExecutionContext): boolean {
  return Reflect.getMetadata(LIMITE_DE_LOGIN, ctx.getHandler()) !== true;
}

/** Las tres reglas, listas para ThrottlerModule. */
export function crearOpcionesLimites(
  limites: LimitesPeticiones,
): ThrottlerModuleOptions {
  const throttlers: ThrottlerOptions[] = [
    {
      name: 'default',
      limit: limites.global.limite,
      ttl: limites.global.ventanaSeg * 1000,
      getTracker: ipDe,
      // Una sola cuenta por IP para todas las rutas (por defecto sería por ruta).
      generateKey: (_ctx, ip) => `global:${ip}`,
    },
    {
      name: 'login',
      limit: limites.login.limite,
      ttl: limites.login.ventanaSeg * 1000,
      getTracker: claveLogin,
      skipIf: noEsLogin,
    },
    {
      name: 'login-ip',
      limit: limites.loginIp.limite,
      ttl: limites.loginIp.ventanaSeg * 1000,
      getTracker: ipDe,
      skipIf: noEsLogin,
    },
  ];
  return { throttlers, errorMessage: MENSAJE_DEMASIADAS_PETICIONES };
}
