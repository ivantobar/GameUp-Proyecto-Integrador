import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../../common/reloj/reloj.js';
import {
  VIGENCIA_ESCUCHA_HORAS,
  type RegistroEscucha,
} from '../domain/registro-escucha.js';

/** Tope de marcas guardadas; al pasarlo se descartan las más antiguas. */
export const MAXIMO_MARCAS_ESCUCHA = 10_000;

/**
 * Registro de escucha en la memoria del proceso (una sola instancia en
 * Render). Si el servidor se reinicia, basta con volver a pedir el audio.
 * Si se escala a varias instancias, cambiar por un adaptador en la base.
 */
@Injectable()
export class RegistroEscuchaEnMemoria implements RegistroEscucha {
  /** clave «validador:intento» → cuándo pidió el audio (orden de inserción). */
  private readonly marcas = new Map<string, Date>();

  constructor(@Inject(RELOJ) private readonly reloj: Reloj) {}

  private static clave(validadorId: bigint, intentoId: bigint): string {
    return `${validadorId}:${intentoId}`;
  }

  async marcar(validadorId: bigint, intentoId: bigint): Promise<void> {
    const clave = RegistroEscuchaEnMemoria.clave(validadorId, intentoId);
    this.marcas.delete(clave); // la vuelve la más reciente
    this.marcas.set(clave, this.reloj.ahora());
    while (this.marcas.size > MAXIMO_MARCAS_ESCUCHA) {
      const masAntigua = this.marcas.keys().next().value as string;
      this.marcas.delete(masAntigua);
    }
  }

  async escucho(validadorId: bigint, intentoId: bigint): Promise<boolean> {
    const clave = RegistroEscuchaEnMemoria.clave(validadorId, intentoId);
    const cuando = this.marcas.get(clave);
    if (!cuando) return false;
    const vigencia = VIGENCIA_ESCUCHA_HORAS * 60 * 60 * 1000;
    if (this.reloj.ahora().getTime() - cuando.getTime() > vigencia) {
      this.marcas.delete(clave);
      return false;
    }
    return true;
  }

  async olvidar(intentoId: bigint): Promise<void> {
    const sufijo = `:${intentoId}`;
    // Borrar durante la iteración de un Map es seguro.
    for (const clave of this.marcas.keys()) {
      if (clave.endsWith(sufijo)) this.marcas.delete(clave);
    }
  }
}
