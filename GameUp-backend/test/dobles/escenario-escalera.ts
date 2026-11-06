import type { Configuracion } from '../../src/modules/catalogo/domain/juegos/estrategia-juego.js';
import { ARCHIVOS } from './escenario-modulos.js';
import { escenarioValidaciones } from './validaciones-en-memoria.js';

/** Id del módulo de la escalera en las pruebas. */
export const MODULO_ESCALERA = 90;

const parejas = (n: number, imagen?: bigint): Configuracion => ({
  tableros: [
    {
      parejas: Array.from({ length: n }, (_, i) => ({
        etiqueta: `carta ${i + 1}`,
        texto: '🍎',
        ...(i === 0 && imagen ? { imagenContenidoId: imagen.toString() } : {}),
      })),
    },
  ],
});

const rondas = (opciones: number): Configuracion => ({
  rondas: [
    {
      pregunta: '¿Cuál es igual?',
      estimulo: { etiqueta: 'sol', texto: '☀️' },
      opciones: Array.from({ length: opciones }, (_, i) => ({
        etiqueta: i === 0 ? 'sol' : `otro ${i}`,
        texto: i === 0 ? '☀️' : '🚗',
      })),
      respuesta: 0,
    },
  ],
});

/**
 * Escenario de la fase 9 sobre el de validaciones: el módulo 90 es la
 * escalera (de la directora, SIN publicar), con Memoria niveles 1 a 5 y
 * Emparejar niveles 1 y 2. Memoria nivel 1 usa una imagen del módulo.
 * El estudiante 10 empieza en el nivel 1 de todos los juegos.
 */
export async function escenarioEscalera() {
  const base = await escenarioValidaciones();
  const { modulos, almacen } = base;
  modulos.agregarModuloEscalera(MODULO_ESCALERA);
  const imagen = modulos.agregarContenido(MODULO_ESCALERA, 'IMAGEN', 'Sol');
  almacen.guardar('contenidos', imagen.ruta, ARCHIVOS.png, 'image/png');

  const memoria: bigint[] = [];
  for (let nivel = 1; nivel <= 5; nivel++) {
    const a = modulos.agregarActividad(MODULO_ESCALERA, 'MEMORIA', true, nivel);
    a.configuracion = parejas(nivel + 1, nivel === 1 ? imagen.id : undefined);
    a.titulo = `Memoria · nivel ${nivel}`;
    memoria.push(a.id);
  }
  const emparejar: bigint[] = [];
  for (let nivel = 1; nivel <= 2; nivel++) {
    const a = modulos.agregarActividad(
      MODULO_ESCALERA,
      'EMPAREJAR',
      true,
      nivel,
    );
    a.configuracion = rondas(nivel + 1);
    a.titulo = `Emparejar · nivel ${nivel}`;
    emparejar.push(a.id);
  }
  return {
    ...base,
    escalera: { memoria, emparejar, imagen: imagen.id },
  };
}

/** Resultado de un intento de Memoria con n parejas. */
export const resultadoMemoria = (n: number) => ({ pairs: n, mismatches: 1 });
/** Resultado de un intento de Emparejar con una ronda. */
export const resultadoEmparejar = { firstTryCorrect: 1, total: 1 };
