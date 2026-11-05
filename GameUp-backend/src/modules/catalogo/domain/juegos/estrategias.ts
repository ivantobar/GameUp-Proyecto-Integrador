import { ReglaNegocioError } from '../../../../common/errors/dominio.errors.js';
import type {
  Configuracion,
  ConfiguracionValidada,
  EstrategiaJuego,
  MedidaResultado,
} from './estrategia-juego.js';
import {
  entero,
  leerCara,
  lista,
  objeto,
  rechazarPresion,
  resultadoPorTurnos,
  sinRepetir,
  soloClaves,
  texto,
  type CaraLeida,
} from './reglas-comunes.js';

export const VOCALES = ['a', 'e', 'i', 'o', 'u'] as const;
export type Vocal = (typeof VOCALES)[number];

function esVocal(valor: unknown): valor is Vocal {
  return (
    typeof valor === 'string' && (VOCALES as readonly string[]).includes(valor)
  );
}

/** Juegos cuyas caras definen los contenidos de la actividad. */
abstract class JuegoConCaras implements EstrategiaJuego {
  abstract readonly codigo: EstrategiaJuego['codigo'];
  readonly derivaContenidos = true;

  validarConfiguracion(configuracion: Configuracion): ConfiguracionValidada {
    rechazarPresion(configuracion);
    const caras: CaraLeida[] = [];
    const normalizada = this.leer(configuracion, (valor, ruta) => {
      const cara = leerCara(valor, ruta);
      caras.push(cara);
      return cara.json;
    });
    return {
      configuracion: normalizada,
      elementos: sinRepetir(caras.map((c) => c.elemento)),
    };
  }

  /** Lee y normaliza la configuración; `cara` valida cada cara encontrada. */
  protected abstract leer(
    configuracion: Configuracion,
    cara: (valor: unknown, ruta: string) => Configuracion,
  ): Configuracion;

  abstract medida(configuracion: Configuracion): MedidaResultado;

  validarResultado(
    resultado: Configuracion,
    configuracion: Configuracion,
  ): Configuracion {
    return resultadoPorTurnos(resultado, this.medida(configuracion).valor);
  }
}

/**
 * EMPAREJAR (MatchRound): una tarjeta arriba y de 2 a 4 opciones.
 *   { "rondas": [{ "pregunta", "estimulo": Cara, "opciones": [Cara], "respuesta": 0 }] }
 * Turnos: uno por ronda.
 */
export class EmparejarEstrategia extends JuegoConCaras {
  readonly codigo = 'EMPAREJAR' as const;

  protected leer(
    c: Configuracion,
    cara: (v: unknown, r: string) => Configuracion,
  ) {
    soloClaves(c, ['rondas'], 'configuracion');
    const rondas = lista(c['rondas'], 'configuracion.rondas', 1, 10).map(
      (valor, i) => {
        const ruta = `configuracion.rondas[${i}]`;
        const r = objeto(valor, ruta);
        soloClaves(r, ['pregunta', 'estimulo', 'opciones', 'respuesta'], ruta);
        const opciones = lista(r['opciones'], `${ruta}.opciones`, 2, 4).map(
          (o, j) => cara(o, `${ruta}.opciones[${j}]`),
        );
        return {
          pregunta: texto(r['pregunta'], `${ruta}.pregunta`, 120),
          estimulo: cara(r['estimulo'], `${ruta}.estimulo`),
          opciones,
          respuesta: entero(
            r['respuesta'],
            `${ruta}.respuesta`,
            0,
            opciones.length - 1,
          ),
        };
      },
    );
    return { rondas };
  }

  medida(c: Configuracion): MedidaResultado {
    return {
      campo: 'total',
      valor: (c['rondas'] as unknown[] | undefined)?.length ?? 0,
    };
  }
}

/**
 * CLASIFICAR (ClassifySet): 2 grupos y de 2 a 8 elementos por conjunto.
 *   { "conjuntos": [{ "pregunta", "grupos": [Cara, Cara], "elementos": [{ "cara": Cara, "grupo": 0 }] }] }
 * Turnos: uno por elemento. Cada grupo recibe al menos un elemento.
 */
export class ClasificarEstrategia extends JuegoConCaras {
  readonly codigo = 'CLASIFICAR' as const;

  protected leer(
    c: Configuracion,
    cara: (v: unknown, r: string) => Configuracion,
  ) {
    soloClaves(c, ['conjuntos'], 'configuracion');
    const conjuntos = lista(
      c['conjuntos'],
      'configuracion.conjuntos',
      1,
      5,
    ).map((valor, i) => {
      const ruta = `configuracion.conjuntos[${i}]`;
      const s = objeto(valor, ruta);
      soloClaves(s, ['pregunta', 'grupos', 'elementos'], ruta);
      const grupos = lista(s['grupos'], `${ruta}.grupos`, 2, 2).map((g, j) =>
        cara(g, `${ruta}.grupos[${j}]`),
      );
      const elementos = lista(s['elementos'], `${ruta}.elementos`, 2, 8).map(
        (e, j) => {
          const rutaE = `${ruta}.elementos[${j}]`;
          const el = objeto(e, rutaE);
          soloClaves(el, ['cara', 'grupo'], rutaE);
          return {
            cara: cara(el['cara'], `${rutaE}.cara`),
            grupo: entero(el['grupo'], `${rutaE}.grupo`, 0, 1),
          };
        },
      );
      for (const grupo of [0, 1]) {
        if (!elementos.some((e) => e.grupo === grupo)) {
          throw new ReglaNegocioError(
            `${ruta}: el grupo ${grupo} no tiene elementos.`,
          );
        }
      }
      return {
        pregunta: texto(s['pregunta'], `${ruta}.pregunta`, 120),
        grupos,
        elementos,
      };
    });
    return { conjuntos };
  }

  medida(c: Configuracion): MedidaResultado {
    const conjuntos =
      (c['conjuntos'] as Array<{ elementos: unknown[] }> | undefined) ?? [];
    return {
      campo: 'total',
      valor: conjuntos.reduce((n, s) => n + s.elementos.length, 0),
    };
  }
}

/**
 * SECUENCIAR (SequenceRoutine): una rutina con sus pasos EN ORDEN (2 a 4).
 *   { "rutinas": [{ "titulo", "pasos": [Cara] }] }
 * Turnos: uno por paso. La app los mezcla; aquí se guardan en orden.
 */
export class SecuenciarEstrategia extends JuegoConCaras {
  readonly codigo = 'SECUENCIAR' as const;

  protected leer(
    c: Configuracion,
    cara: (v: unknown, r: string) => Configuracion,
  ) {
    soloClaves(c, ['rutinas'], 'configuracion');
    const rutinas = lista(c['rutinas'], 'configuracion.rutinas', 1, 5).map(
      (valor, i) => {
        const ruta = `configuracion.rutinas[${i}]`;
        const r = objeto(valor, ruta);
        soloClaves(r, ['titulo', 'pasos'], ruta);
        return {
          titulo: texto(r['titulo'], `${ruta}.titulo`, 120),
          pasos: lista(r['pasos'], `${ruta}.pasos`, 2, 4).map((p, j) =>
            cara(p, `${ruta}.pasos[${j}]`),
          ),
        };
      },
    );
    return { rutinas };
  }

  medida(c: Configuracion): MedidaResultado {
    const rutinas =
      (c['rutinas'] as Array<{ pasos: unknown[] }> | undefined) ?? [];
    return {
      campo: 'total',
      valor: rutinas.reduce((n, r) => n + r.pasos.length, 0),
    };
  }
}

/**
 * MEMORIA (MemoryBoard): cada cara aparece en dos cartas (2 a 6 parejas).
 *   { "tableros": [{ "parejas": [Cara] }] }
 * Resultado: { pairs, mismatches }; pairs = total de parejas.
 */
export class MemoriaEstrategia extends JuegoConCaras {
  readonly codigo = 'MEMORIA' as const;

  protected leer(
    c: Configuracion,
    cara: (v: unknown, r: string) => Configuracion,
  ) {
    soloClaves(c, ['tableros'], 'configuracion');
    const tableros = lista(c['tableros'], 'configuracion.tableros', 1, 5).map(
      (valor, i) => {
        const ruta = `configuracion.tableros[${i}]`;
        const t = objeto(valor, ruta);
        soloClaves(t, ['parejas'], ruta);
        const parejas = lista(t['parejas'], `${ruta}.parejas`, 2, 6).map(
          (p, j) => cara(p, `${ruta}.parejas[${j}]`),
        );
        const etiquetas = parejas.map((p) => p['etiqueta']);
        if (new Set(etiquetas).size !== etiquetas.length) {
          throw new ReglaNegocioError(
            `${ruta}: dos parejas no pueden tener la misma etiqueta.`,
          );
        }
        return { parejas };
      },
    );
    return { tableros };
  }

  medida(c: Configuracion): MedidaResultado {
    const tableros =
      (c['tableros'] as Array<{ parejas: unknown[] }> | undefined) ?? [];
    return {
      campo: 'pairs',
      valor: tableros.reduce((n, t) => n + t.parejas.length, 0),
    };
  }

  /** { pairs, mismatches }: los intentos fallidos solo informan, no restan. */
  override validarResultado(
    resultado: Configuracion,
    configuracion: Configuracion,
  ): Configuracion {
    rechazarPresion(resultado, 'resultado');
    soloClaves(resultado, ['pairs', 'mismatches'], 'resultado');
    const pairs = entero(resultado['pairs'], 'resultado.pairs', 1, 100);
    const esperado = this.medida(configuracion).valor;
    if (pairs !== esperado) {
      throw new ReglaNegocioError(
        `resultado.pairs: debe ser ${esperado}, las parejas de esta actividad.`,
      );
    }
    return {
      pairs,
      mismatches: entero(
        resultado['mismatches'],
        'resultado.mismatches',
        0,
        100,
      ),
    };
  }
}

/**
 * BUSCA_LA_BOCA (QuizRound): una ronda por vocal, con 3 bocas que arma la app.
 *   { "vocales": ["a", "e", "i", "o", "u"] }
 * Turnos: uno por vocal. Las bocas son imágenes de la app (sin contenidos).
 */
export class BuscaLaBocaEstrategia implements EstrategiaJuego {
  readonly codigo = 'BUSCA_LA_BOCA' as const;
  readonly derivaContenidos = false;

  validarConfiguracion(c: Configuracion): ConfiguracionValidada {
    rechazarPresion(c);
    soloClaves(c, ['vocales'], 'configuracion');
    const vocales = lista(c['vocales'], 'configuracion.vocales', 1, 5);
    if (!vocales.every(esVocal) || new Set(vocales).size !== vocales.length) {
      throw new ReglaNegocioError(
        'configuracion.vocales: vocales a, e, i, o, u, sin repetir.',
      );
    }
    return { configuracion: { vocales }, elementos: null };
  }

  medida(c: Configuracion): MedidaResultado {
    return {
      campo: 'total',
      valor: (c['vocales'] as unknown[] | undefined)?.length ?? 0,
    };
  }

  validarResultado(
    resultado: Configuracion,
    configuracion: Configuracion,
  ): Configuracion {
    return resultadoPorTurnos(resultado, this.medida(configuracion).valor);
  }
}

/**
 * HABLA_CONMIGO: una actividad por vocal.  { "vocal": "a" }
 * El resultado lo arma el backend (estado de la grabación): el cliente envía {}.
 * La app NO califica la pronunciación: no hay medida ni nota.
 */
export class HablaConmigoEstrategia implements EstrategiaJuego {
  readonly codigo = 'HABLA_CONMIGO' as const;
  readonly derivaContenidos = false;

  validarConfiguracion(c: Configuracion): ConfiguracionValidada {
    rechazarPresion(c);
    soloClaves(c, ['vocal'], 'configuracion');
    if (!esVocal(c['vocal'])) {
      throw new ReglaNegocioError(
        'HABLA_CONMIGO necesita la vocal: { "vocal": "a" } (a, e, i, o o u).',
      );
    }
    return { configuracion: { vocal: c['vocal'] }, elementos: null };
  }

  medida(): null {
    return null;
  }

  validarResultado(resultado: Configuracion): Configuracion {
    rechazarPresion(resultado, 'resultado');
    soloClaves(resultado, [], 'resultado');
    return {};
  }
}

/** Todas las estrategias registradas. */
export function estrategiasDelMvp(): EstrategiaJuego[] {
  return [
    new HablaConmigoEstrategia(),
    new BuscaLaBocaEstrategia(),
    new EmparejarEstrategia(),
    new ClasificarEstrategia(),
    new SecuenciarEstrategia(),
    new MemoriaEstrategia(),
  ];
}
