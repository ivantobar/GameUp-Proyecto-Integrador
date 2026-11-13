import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerLimitDetail } from '@nestjs/throttler';
import type { Response } from 'express';

/**
 * ThrottlerGuard con la cabecera estándar `Retry-After` en todo 429.
 * La librería solo la pone así para la regla `default`; para `login` y
 * `login-ip` escribe `Retry-After-login`, que la app no lee.
 *
 * Va registrado como guard global ANTES de AuthGuard (ver AuthModule): una
 * ráfaga de tokens inventados recibe 429 sin llegar a la API central.
 */
@Injectable()
export class LimitePeticionesGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(
    context: ExecutionContext,
    detalle: ThrottlerLimitDetail,
  ): Promise<void> {
    const res = context.switchToHttp().getResponse<Response>();
    res.setHeader(
      'Retry-After',
      String(Math.max(1, detalle.timeToBlockExpire)),
    );
    return super.throwThrottlingException(context, detalle);
  }
}
