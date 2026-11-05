import {
  isVowel,
  type ActivityContent,
  type ClassifySet,
  type MatchRound,
  type MemoryBoard,
  type PictureFace,
  type SequenceRoutine,
  type Vowel,
} from '../../types';
import type { ActividadDetalleDto } from '../dto/actividades';
import { toGameId } from './gameCodes';
import { requireList, requireText, unexpected } from './responseShape';

/** URL firmada de cada imagen de la actividad, por `contenidoId`. */
export type ImageUrls = ReadonlyMap<string, string>;

type Json = Record<string, unknown>;

function asObject(value: unknown, field: string): Json {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw unexpected(field);
  }
  return value as Json;
}

function list(value: unknown, field: string): Json[] {
  return requireList(value, field).map((item, i) =>
    asObject(item, `${field}[${i}]`),
  );
}

/**
 * Una «cara» del backend (lo que se ve en una tarjeta) → `PictureFace`.
 *   { etiqueta, texto?, cantidad?, imagenContenidoId?, audioContenidoId? }
 * El `id` sale de su posición (estable en la partida). Si la imagen no tiene
 * URL, la tarjeta muestra el texto o la etiqueta (ver `Pictogram`). El audio
 * de la cara todavía no se usa en la app.
 */
function toFace(value: unknown, id: string, images: ImageUrls): PictureFace {
  const cara = asObject(value, id);
  const face: PictureFace = {
    id,
    label: requireText(cara['etiqueta'], `${id}.etiqueta`),
  };
  if (typeof cara['texto'] === 'string') face.text = cara['texto'];
  if (typeof cara['cantidad'] === 'number') face.count = cara['cantidad'];
  const imageId = cara['imagenContenidoId'];
  const url = typeof imageId === 'string' ? images.get(imageId) : undefined;
  if (url) face.imageUri = url;
  return face;
}

/** EMPAREJAR: { rondas: [{ pregunta, estimulo, opciones, respuesta }] } */
function toMatchRounds(config: Json, images: ImageUrls): MatchRound[] {
  return list(config['rondas'], 'rondas').map((ronda, r) => {
    const options = requireList(ronda['opciones'], `rondas[${r}].opciones`).map(
      (opcion, o) => toFace(opcion, `r${r}-o${o}`, images),
    );
    const answer = options[Number(ronda['respuesta'])];
    if (!answer) throw unexpected(`rondas[${r}].respuesta`);
    return {
      id: `r${r}`,
      question: requireText(ronda['pregunta'], `rondas[${r}].pregunta`),
      prompt: toFace(ronda['estimulo'], `r${r}-e`, images),
      options,
      answerId: answer.id,
    };
  });
}

/** CLASIFICAR: { conjuntos: [{ pregunta, grupos: [Cara, Cara], elementos: [{ cara, grupo }] }] } */
function toClassifySets(config: Json, images: ImageUrls): ClassifySet[] {
  return list(config['conjuntos'], 'conjuntos').map((conjunto, c) => {
    const categories = requireList(
      conjunto['grupos'],
      `conjuntos[${c}].grupos`,
    ).map((grupo, g) => toFace(grupo, `c${c}-g${g}`, images));
    const items = list(conjunto['elementos'], `conjuntos[${c}].elementos`).map(
      (elemento, e) => {
        const category = categories[Number(elemento['grupo'])];
        if (!category)
          throw unexpected(`conjuntos[${c}].elementos[${e}].grupo`);
        return {
          ...toFace(elemento['cara'], `c${c}-e${e}`, images),
          categoryId: category.id,
        };
      },
    );
    return {
      id: `c${c}`,
      question: requireText(conjunto['pregunta'], `conjuntos[${c}].pregunta`),
      categories,
      items,
    };
  });
}

/** SECUENCIAR: { rutinas: [{ titulo, pasos: [Cara] }] } (pasos en orden) */
function toRoutines(config: Json, images: ImageUrls): SequenceRoutine[] {
  return list(config['rutinas'], 'rutinas').map((rutina, r) => ({
    id: `s${r}`,
    title: requireText(rutina['titulo'], `rutinas[${r}].titulo`),
    steps: requireList(rutina['pasos'], `rutinas[${r}].pasos`).map((paso, p) =>
      toFace(paso, `s${r}-p${p}`, images),
    ),
  }));
}

/** MEMORIA: { tableros: [{ parejas: [Cara] }] } */
function toBoards(config: Json, images: ImageUrls): MemoryBoard[] {
  return list(config['tableros'], 'tableros').map((tablero, t) => ({
    id: `m${t}`,
    pairs: requireList(tablero['parejas'], `tableros[${t}].parejas`).map(
      (pareja, p) => toFace(pareja, `m${t}-p${p}`, images),
    ),
  }));
}

/** Ids de las imágenes que usa la configuración (para pedir sus URLs). */
export function imageIdsOf(configuracion: unknown): string[] {
  const ids = new Set<string>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, inner]) => {
        if (key === 'imagenContenidoId' && typeof inner === 'string') {
          ids.add(inner);
        } else {
          visit(inner);
        }
      });
    }
  };
  visit(configuracion);
  return [...ids];
}

/**
 * Actividad del backend → contenido que juega la app. La configuración ya
 * la validó el backend; aquí se traduce y se comprueba lo mínimo para no
 * mostrar un juego a medias.
 */
export function toActivityContent(
  dto: ActividadDetalleDto,
  images: ImageUrls = new Map(),
): ActivityContent {
  const activityId = requireText(dto.id, 'id');
  const title = requireText(dto.titulo, 'titulo');
  const config = asObject(dto.configuracion ?? {}, 'configuracion');
  const gameId = toGameId(dto.tipoJuego?.codigo);
  const base = { activityId, title };

  switch (gameId) {
    case 'findMouth': {
      const vowels = requireList(
        config['vocales'],
        'configuracion.vocales',
      ).filter((v): v is Vowel => typeof v === 'string' && isVowel(v));
      if (vowels.length === 0) throw unexpected('configuracion.vocales');
      return { ...base, gameId, vowels };
    }
    case 'speak': {
      const vowel = config['vocal'];
      if (typeof vowel !== 'string' || !isVowel(vowel)) {
        throw unexpected('configuracion.vocal');
      }
      return { ...base, gameId, vowel };
    }
    case 'match':
      return { ...base, gameId, rounds: toMatchRounds(config, images) };
    case 'classify':
      return { ...base, gameId, sets: toClassifySets(config, images) };
    case 'sequence':
      return { ...base, gameId, routines: toRoutines(config, images) };
    case 'memory':
      return { ...base, gameId, boards: toBoards(config, images) };
  }
}
