import type {
  ClassifySet,
  MatchRound,
  MemoryBoard,
  SequenceRoutine,
} from '../types';

/**
 * CONTENIDO DE EJEMPLO de Emparejar, Clasificar, Secuenciar y Memoria.
 * No tiene datos de ningún niño: solo dibujos, palabras y rutinas.
 *
 * Dónde se conectará la API: cuando el backend NestJS tenga las actividades
 * (por ejemplo, el contenido de la tarea que asignó el docente), se agrega
 * un repositorio en `src/data/repositories.ts` y los hooks de cada juego
 * (`features/<juego>/use…Game.ts`) lo piden a ese repositorio en lugar de
 * importar este archivo. Las pantallas no cambian.
 *
 * Los dibujos son emojis provisionales, hasta tener los pictogramas o las
 * ilustraciones que defina la fundación. Reglas del contenido:
 * - de 2 a 4 opciones por pantalla;
 * - palabras cortas y cotidianas;
 * - cantidades del 1 al 3.
 */

export const matchRounds: readonly MatchRound[] = [
  {
    id: 'emp-01',
    question: '¿Qué palabra es?',
    prompt: { id: 'p', label: 'manzana', emoji: '🍎' },
    options: [
      { id: 'manzana', label: 'manzana', text: 'Manzana' },
      { id: 'perro', label: 'perro', text: 'Perro' },
      { id: 'sol', label: 'sol', text: 'Sol' },
    ],
    answerId: 'manzana',
  },
  {
    id: 'emp-02',
    question: '¿Cuántas hay?',
    prompt: { id: 'p', label: 'tres estrellas', emoji: '⭐', count: 3 },
    options: [
      { id: '1', label: 'uno', text: '1' },
      { id: '2', label: 'dos', text: '2' },
      { id: '3', label: 'tres', text: '3' },
    ],
    answerId: '3',
  },
  {
    id: 'emp-03',
    question: '¿Cuál es igual?',
    prompt: { id: 'p', label: 'perro', emoji: '🐶' },
    options: [
      { id: 'gato', label: 'gato', emoji: '🐱' },
      { id: 'perro', label: 'perro', emoji: '🐶' },
      { id: 'pez', label: 'pez', emoji: '🐟' },
    ],
    answerId: 'perro',
  },
  {
    id: 'emp-04',
    question: '¿Cuál es el sol?',
    prompt: { id: 'p', label: 'sol', text: 'Sol' },
    options: [
      { id: 'luna', label: 'luna', emoji: '🌙' },
      { id: 'sol', label: 'sol', emoji: '☀️' },
      { id: 'nube', label: 'nube', emoji: '☁️' },
    ],
    answerId: 'sol',
  },
];

export const classifySets: readonly ClassifySet[] = [
  {
    id: 'cla-01',
    question: '¿Es fruta o animal?',
    categories: [
      { id: 'frutas', label: 'Frutas', emoji: '🍎' },
      { id: 'animales', label: 'Animales', emoji: '🐶' },
    ],
    items: [
      { id: 'banano', label: 'banano', emoji: '🍌', categoryId: 'frutas' },
      { id: 'gato', label: 'gato', emoji: '🐱', categoryId: 'animales' },
      { id: 'uvas', label: 'uvas', emoji: '🍇', categoryId: 'frutas' },
      { id: 'pez', label: 'pez', emoji: '🐟', categoryId: 'animales' },
    ],
  },
  {
    id: 'cla-02',
    question: '¿Se come o se pone?',
    categories: [
      { id: 'comida', label: 'Comida', emoji: '🍽️' },
      { id: 'ropa', label: 'Ropa', emoji: '👕' },
    ],
    items: [
      { id: 'medias', label: 'medias', emoji: '🧦', categoryId: 'ropa' },
      {
        id: 'zanahoria',
        label: 'zanahoria',
        emoji: '🥕',
        categoryId: 'comida',
      },
      { id: 'gorra', label: 'gorra', emoji: '🧢', categoryId: 'ropa' },
      { id: 'pan', label: 'pan', emoji: '🍞', categoryId: 'comida' },
    ],
  },
];

export const sequenceRoutines: readonly SequenceRoutine[] = [
  {
    id: 'sec-01',
    title: 'Lavarse las manos',
    steps: [
      { id: 'llave', label: 'Abrir la llave', emoji: '🚰' },
      { id: 'jabon', label: 'Echar jabón', emoji: '🧼' },
      { id: 'frotar', label: 'Frotar las manos', emoji: '👐' },
      { id: 'secar', label: 'Secar las manos', emoji: '🧻' },
    ],
  },
  {
    id: 'sec-02',
    title: 'Cepillarse los dientes',
    steps: [
      { id: 'crema', label: 'Poner la crema', emoji: '🪥' },
      { id: 'cepillar', label: 'Cepillar los dientes', emoji: '😁' },
      { id: 'enjuagar', label: 'Enjuagar la boca', emoji: '🥛' },
    ],
  },
];

/** Tableros de 2 parejas (4 cartas), para no pasar de 4 opciones. */
export const memoryBoards: readonly MemoryBoard[] = [
  {
    id: 'mem-01',
    pairs: [
      { id: 'perro', label: 'perro', emoji: '🐶' },
      { id: 'gato', label: 'gato', emoji: '🐱' },
    ],
  },
  {
    id: 'mem-02',
    pairs: [
      { id: 'manzana', label: 'manzana', emoji: '🍎' },
      { id: 'banano', label: 'banano', emoji: '🍌' },
    ],
  },
  {
    id: 'mem-03',
    pairs: [
      { id: 'balon', label: 'balón', emoji: '⚽' },
      { id: 'carro', label: 'carro', emoji: '🚗' },
    ],
  },
];
