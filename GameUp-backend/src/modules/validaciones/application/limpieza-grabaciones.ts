import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import { GrabacionService } from './grabacion.service.js';

/**
 * Corre la limpieza de grabaciones al arrancar y cada
 * LIMPIEZA_GRABACIONES_MIN minutos (0 la desactiva). Sin dependencias nuevas:
 * un setInterval que no impide que el proceso termine.
 *
 * En Render (plan gratuito) el servicio se duerme sin tráfico: la pasada al
 * arrancar y el borrado tras cada validación cubren ese caso.
 */
@Injectable()
export class LimpiezaGrabaciones
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(LimpiezaGrabaciones.name);
  private temporizador: NodeJS.Timeout | null = null;
  private enCurso = false;

  constructor(
    private readonly grabaciones: GrabacionService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  onApplicationBootstrap(): void {
    const minutos = this.config.get('LIMPIEZA_GRABACIONES_MIN', {
      infer: true,
    });
    if (minutos <= 0) return;
    void this.pasada();
    this.temporizador = setInterval(
      () => void this.pasada(),
      minutos * 60 * 1000,
    );
    this.temporizador.unref();
  }

  onModuleDestroy(): void {
    if (this.temporizador) clearInterval(this.temporizador);
  }

  /** Nunca dos pasadas a la vez; un error no detiene las siguientes. */
  async pasada(): Promise<void> {
    if (this.enCurso) return;
    this.enCurso = true;
    try {
      await this.grabaciones.limpiar();
    } catch {
      this.logger.warn('La limpieza de grabaciones falló; se reintentará');
    } finally {
      this.enCurso = false;
    }
  }
}
