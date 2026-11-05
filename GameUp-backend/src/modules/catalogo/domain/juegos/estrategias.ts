import { ReglaNegocioError } from '../../../../common/errors/dominio.errors.js';
import type {
  CodigoJuego,
  Configuracion,
  EstrategiaJuego,
} from './estrategia-juego.js';

export const VOCALES = ['a', 'e', 'i', 'o', 'u'] as const;
export type Vocal = (typeof VOCALES)[number];

/** Rechaza claves que la estrategia no conoce (configuración estricta). */
function soloClaves(
  codigo: CodigoJuego,
  configuracion: Configuracion,
  permitidas: readonly string[],
): void {
  const sobrantes = Object.keys(configuracion).filter(
    (k) => !permitidas.includes(k),
  );
  if (sobrantes.length > 0) {
    throw new ReglaNegocioError(
      `La configuración de ${codigo} no admite: ${sobrantes.join(', ')}.`,
    );
  }
}

/**
 * HABLA_CONMIGO: una actividad por vocal (decidido en la fase 0).
 *   { "vocal": "a" }
 */
export class HablaConmigoEstrategia implements EstrategiaJuego {
  readonly codigo = 'HABLA_CONMIGO' as const;

  validarConfiguracion(configuracion: Configuracion): Configuracion {
    soloClaves(this.codigo, configuracion, ['vocal']);
    const vocal = configuracion['vocal'];
    if (
      typeof vocal !== 'string' ||
      !(VOCALES as readonly string[]).includes(vocal)
    ) {
      throw new ReglaNegocioError(
        'HABLA_CONMIGO necesita la vocal: { "vocal": "a" } (a, e, i, o o u).',
      );
    }
    return { vocal };
  }
}

/**
 * Juegos cuya configuración aún NO está definida (EMPAREJAR, CLASIFICAR,
 * SECUENCIAR, MEMORIA, BUSCA_LA_BOCA): por ahora solo aceptan `{}`. Cuando el
 * equipo defina sus rondas, se reemplaza por una estrategia propia.
 */
export class SinConfiguracionEstrategia implements EstrategiaJuego {
  constructor(readonly codigo: CodigoJuego) {}

  validarConfiguracion(configuracion: Configuracion): Configuracion {
    soloClaves(this.codigo, configuracion, []);
    return {};
  }
}

/** Todas las estrategias registradas. */
export function estrategiasDelMvp(): EstrategiaJuego[] {
  return [
    new HablaConmigoEstrategia(),
    new SinConfiguracionEstrategia('EMPAREJAR'),
    new SinConfiguracionEstrategia('CLASIFICAR'),
    new SinConfiguracionEstrategia('SECUENCIAR'),
    new SinConfiguracionEstrategia('MEMORIA'),
    new SinConfiguracionEstrategia('BUSCA_LA_BOCA'),
  ];
}
