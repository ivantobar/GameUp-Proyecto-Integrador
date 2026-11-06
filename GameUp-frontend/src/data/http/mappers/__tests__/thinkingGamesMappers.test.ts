import { ServerError } from '@/services/apiErrors';
import type { ActividadDetalleDto } from '../../dto/actividades';
import { imageIdsOf, toActivityContent } from '../activityMapper';
import { toResultado } from '../attemptMapper';

const base: Omit<ActividadDetalleDto, 'tipoJuego' | 'configuracion'> = {
  id: '20',
  moduloId: '1',
  titulo: 'Actividad de prueba',
  instruccionTexto: null,
  orden: 0,
  activa: true,
};

const activity = (
  codigo: ActividadDetalleDto['tipoJuego']['codigo'],
  configuracion: Record<string, unknown>,
): ActividadDetalleDto => ({
  ...base,
  tipoJuego: { id: '1', codigo, nombre: codigo },
  configuracion,
});

describe('Emparejar: rondas de la actividad', () => {
  const config = {
    rondas: [
      {
        pregunta: '¿Cuál es igual?',
        estimulo: { etiqueta: 'a', texto: 'a' },
        opciones: [
          { etiqueta: 'e', texto: 'e' },
          { etiqueta: 'a', texto: 'a' },
        ],
        respuesta: 1,
      },
    ],
  };

  it('la respuesta es la opción en la posición que dice el backend', () => {
    const content = toActivityContent(activity('EMPAREJAR', config));
    if (content.gameId !== 'match') throw new Error('no es Emparejar');

    const round = content.rounds[0];
    expect(round).toMatchObject({
      question: '¿Cuál es igual?',
      prompt: { label: 'a', text: 'a' },
    });
    expect(round?.options.map((o) => o.label)).toEqual(['e', 'a']);
    expect(round?.answerId).toBe(round?.options[1]?.id);
  });

  it('una respuesta fuera de las opciones es un error claro', () => {
    expect(() =>
      toActivityContent(
        activity('EMPAREJAR', {
          rondas: [{ ...config.rondas[0], respuesta: 5 }],
        }),
      ),
    ).toThrow(ServerError);
  });
});

describe('Clasificar, Secuenciar y Memoria', () => {
  it('Clasificar: cada elemento apunta a su grupo', () => {
    const content = toActivityContent(
      activity('CLASIFICAR', {
        conjuntos: [
          {
            pregunta: '¿Vocal o número?',
            grupos: [
              { etiqueta: 'vocales', texto: 'a e i' },
              { etiqueta: 'números', texto: '1 2 3' },
            ],
            elementos: [
              { cara: { etiqueta: 'o', texto: 'o' }, grupo: 0 },
              { cara: { etiqueta: 'dos', texto: '2' }, grupo: 1 },
            ],
          },
        ],
      }),
    );
    if (content.gameId !== 'classify') throw new Error('no es Clasificar');

    const set = content.sets[0];
    const [vocales, numeros] = set?.categories ?? [];
    expect(set?.items.map((i) => [i.label, i.categoryId])).toEqual([
      ['o', vocales?.id],
      ['dos', numeros?.id],
    ]);
  });

  it('Secuenciar: los pasos llegan en orden (la app los mezcla)', () => {
    const content = toActivityContent(
      activity('SECUENCIAR', {
        rutinas: [
          {
            titulo: 'Las vocales',
            pasos: ['a', 'e', 'i'].map((v) => ({ etiqueta: v, texto: v })),
          },
        ],
      }),
    );
    if (content.gameId !== 'sequence') throw new Error('no es Secuenciar');

    expect(content.routines[0]?.title).toBe('Las vocales');
    expect(content.routines[0]?.steps.map((s) => s.label)).toEqual([
      'a',
      'e',
      'i',
    ]);
  });

  it('Memoria: parejas con ids distintos en cada tablero', () => {
    const content = toActivityContent(
      activity('MEMORIA', {
        tableros: [
          {
            parejas: [
              { etiqueta: 'a', texto: 'a' },
              { etiqueta: 'o', texto: 'o' },
            ],
          },
          {
            parejas: [
              { etiqueta: 'a', texto: 'a' },
              { etiqueta: 'u', texto: 'u' },
            ],
          },
        ],
      }),
    );
    if (content.gameId !== 'memory') throw new Error('no es Memoria');

    const ids = content.boards.flatMap((b) => b.pairs.map((p) => p.id));
    expect(new Set(ids).size).toBe(4);
  });
});

describe('imágenes de las tarjetas', () => {
  const config = {
    rondas: [
      {
        pregunta: '¿Qué es?',
        estimulo: { etiqueta: 'perro', imagenContenidoId: '14', cantidad: 2 },
        opciones: [
          { etiqueta: 'perro', texto: 'perro' },
          { etiqueta: 'gato', imagenContenidoId: '15' },
        ],
        respuesta: 0,
      },
    ],
  };

  it('se recogen los ids de imagen de toda la configuración', () => {
    expect(imageIdsOf(config).sort()).toEqual(['14', '15']);
    expect(imageIdsOf({ vocales: ['a'] })).toEqual([]);
  });

  it('cada cara lleva la URL firmada de su imagen y su cantidad', () => {
    const content = toActivityContent(
      activity('EMPAREJAR', config),
      new Map([['14', 'https://storage.prueba/perro.png?firma=x']]),
    );
    if (content.gameId !== 'match') throw new Error('no es Emparejar');

    expect(content.rounds[0]?.prompt).toMatchObject({
      label: 'perro',
      imageUri: 'https://storage.prueba/perro.png?firma=x',
      count: 2,
    });
    // Sin URL (no llegó), la tarjeta queda sin imagen: muestra su etiqueta.
    expect(content.rounds[0]?.options[1]?.imageUri).toBeUndefined();
  });
});

describe('resultado de cada juego (decisión 11 de la fase 0)', () => {
  it('turnos: { firstTryCorrect, total }; Memoria: { pairs, mismatches }', () => {
    expect(
      toResultado({ kind: 'turns', firstTryCorrect: 2, total: 3 }),
    ).toEqual({ firstTryCorrect: 2, total: 3 });
    expect(toResultado({ kind: 'memory', pairs: 3, mismatches: 4 })).toEqual({
      pairs: 3,
      mismatches: 4,
    });
  });
});
