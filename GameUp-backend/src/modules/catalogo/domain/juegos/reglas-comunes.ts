import { ReglaNegocioError } from '../../../../common/errors/dominio.errors.js';
import type { Configuracion, ElementoDerivado } from './estrategia-juego.js';

/**
 * Piezas comunes a las estrategias de juego: lectura estricta de JSON, la
 * «cara» (lo que se ve en una tarjeta) y la regla 11.
 */

type Objeto = Record<string, unknown>;

const fallo = (ruta: string, mensaje: string): never => {
  throw new ReglaNegocioError(`${ruta}: ${mensaje}`);
};

export function objeto(valor: unknown, ruta: string): Objeto {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    fallo(ruta, 'debe ser un objeto.');
  }
  return valor as Objeto;
}

/** Rechaza claves que no están permitidas (configuración estricta). */
export function soloClaves(
  obj: Objeto,
  permitidas: readonly string[],
  ruta: string,
): void {
  const sobrantes = Object.keys(obj).filter((k) => !permitidas.includes(k));
  if (sobrantes.length > 0) fallo(ruta, `no admite: ${sobrantes.join(', ')}.`);
}

export function lista(
  valor: unknown,
  ruta: string,
  minimo: number,
  maximo: number,
): unknown[] {
  if (!Array.isArray(valor)) return fallo(ruta, 'debe ser una lista.');
  if (valor.length < minimo || valor.length > maximo) {
    fallo(ruta, `debe tener entre ${minimo} y ${maximo} elementos.`);
  }
  return valor;
}

export function texto(valor: unknown, ruta: string, maximo: number): string {
  if (typeof valor !== 'string') return fallo(ruta, 'debe ser texto.');
  const limpio = valor.trim().replace(/\s+/g, ' ');
  if (!limpio || limpio.length > maximo) {
    fallo(ruta, `debe tener entre 1 y ${maximo} caracteres.`);
  }
  return limpio;
}

export function entero(
  valor: unknown,
  ruta: string,
  minimo: number,
  maximo: number,
): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor)) {
    return fallo(ruta, 'debe ser un número entero.');
  }
  if (valor < minimo || valor > maximo)
    fallo(ruta, `debe estar entre ${minimo} y ${maximo}.`);
  return valor;
}

const PATRON_ID = /^[1-9]\d{0,18}$/;

/** Ids de contenido en el JSON: texto numérico, como en el resto de la API. */
export function idContenido(valor: unknown, ruta: string): bigint {
  if (typeof valor !== 'string' || !PATRON_ID.test(valor)) {
    fallo(ruta, 'debe ser un id de contenido en texto (ej.: "14").');
  }
  return BigInt(valor as string);
}

// ─── Regla 11: sin tiempo límite, vidas ni penalización ─────────────────────

/** Raíces de nombres de campo que indican presión (comparación sin tildes ni guiones). */
const RAICES_PROHIBIDAS = [
  'tiempo',
  'segundo',
  'minuto',
  'cronometro',
  'temporizador',
  'limite',
  'timer',
  'timeout',
  'time',
  'vida',
  'live',
  'life',
  'penaliz',
  'penalt',
  'castigo',
  'negativ',
  'restar',
  'maxintento',
  'intentosmax',
];

function normalizarClave(clave: string): string {
  return clave
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();
}

/**
 * Regla 11 del proyecto: los juegos no tienen tiempo límite, vidas ni
 * penalizaciones. Revisa todas las claves del JSON, a cualquier profundidad.
 */
export function rechazarPresion(valor: unknown, ruta = 'configuracion'): void {
  if (Array.isArray(valor)) {
    valor.forEach((v, i) => rechazarPresion(v, `${ruta}[${i}]`));
    return;
  }
  if (typeof valor !== 'object' || valor === null) return;
  for (const [clave, interno] of Object.entries(valor)) {
    const normal = normalizarClave(clave);
    if (RAICES_PROHIBIDAS.some((raiz) => normal.includes(raiz))) {
      throw new ReglaNegocioError(
        `GameUP no usa tiempo límite, vidas ni penalizaciones (regla 11): quita «${ruta}.${clave}».`,
      );
    }
    rechazarPresion(interno, `${ruta}.${clave}`);
  }
}

// ─── Cara: lo que se ve en una tarjeta ──────────────────────────────────────

const CLAVES_CARA = [
  'etiqueta',
  'imagenContenidoId',
  'texto',
  'cantidad',
  'audioContenidoId',
] as const;

export interface CaraLeida {
  json: Configuracion;
  etiqueta: string;
  elemento: ElementoDerivado | null;
}

/**
 * Una cara (PictureFace en la app):
 *   { "etiqueta": "perro", "imagenContenidoId": "14", "texto": "3",
 *     "cantidad": 3, "audioContenidoId": "16" }
 * - etiqueta (obligatoria): lo que oye el niño y lee el lector de pantalla;
 * - imagen o texto (al menos uno);
 * - cantidad (1-10) repite la imagen; audio: un sonido. Ambos exigen imagen.
 */
export function leerCara(valor: unknown, ruta: string): CaraLeida {
  const obj = objeto(valor, ruta);
  soloClaves(obj, CLAVES_CARA, ruta);
  const etiqueta = texto(obj['etiqueta'], `${ruta}.etiqueta`, 60);
  const json: Configuracion = { etiqueta };

  let imagen: bigint | null = null;
  if (obj['imagenContenidoId'] !== undefined) {
    imagen = idContenido(obj['imagenContenidoId'], `${ruta}.imagenContenidoId`);
    json['imagenContenidoId'] = imagen.toString();
  }
  if (obj['texto'] !== undefined) {
    json['texto'] = texto(obj['texto'], `${ruta}.texto`, 30);
  }
  if (imagen === null && json['texto'] === undefined) {
    fallo(ruta, 'necesita imagenContenidoId o texto.');
  }
  if (obj['cantidad'] !== undefined) {
    if (imagen === null)
      fallo(ruta, 'cantidad repite la imagen: indica imagenContenidoId.');
    json['cantidad'] = entero(obj['cantidad'], `${ruta}.cantidad`, 1, 10);
  }
  let audio: bigint | null = null;
  if (obj['audioContenidoId'] !== undefined) {
    if (imagen === null)
      fallo(ruta, 'el audio va con una imagen: indica imagenContenidoId.');
    audio = idContenido(obj['audioContenidoId'], `${ruta}.audioContenidoId`);
    json['audioContenidoId'] = audio.toString();
  }

  return {
    json,
    etiqueta,
    elemento:
      imagen === null
        ? null
        : {
            imagenContenidoId: imagen,
            audioContenidoId: audio,
            palabra: etiqueta,
          },
  };
}

/** Une los elementos de varias caras (un contenido aparece una sola vez). */
export function sinRepetir(
  elementos: Array<ElementoDerivado | null>,
): ElementoDerivado[] {
  const vistos = new Map<bigint, ElementoDerivado>();
  for (const e of elementos) {
    if (e && !vistos.has(e.imagenContenidoId))
      vistos.set(e.imagenContenidoId, e);
  }
  return [...vistos.values()];
}

// ─── Resultados de los juegos por turnos ────────────────────────────────────

/**
 * { firstTryCorrect, total }: cuántos turnos resolvió al primer intento (no
 * es una nota) y cuántos tenía el juego. total debe coincidir con la
 * configuración, para que el resultado no se pueda inflar.
 */
export function resultadoPorTurnos(
  resultado: Configuracion,
  totalEsperado: number | null,
): Configuracion {
  rechazarPresion(resultado, 'resultado');
  soloClaves(resultado, ['firstTryCorrect', 'total'], 'resultado');
  const total = entero(resultado['total'], 'resultado.total', 1, 100);
  const primero = entero(
    resultado['firstTryCorrect'],
    'resultado.firstTryCorrect',
    0,
    100,
  );
  if (primero > total)
    fallo('resultado.firstTryCorrect', 'no puede ser mayor que total.');
  if (totalEsperado !== null && total !== totalEsperado) {
    fallo(
      'resultado.total',
      `debe ser ${totalEsperado}, los turnos de esta actividad.`,
    );
  }
  return { firstTryCorrect: primero, total };
}
