import { ReglaNegocioError } from '../../../../common/errors/dominio.errors.js';
import { RegistroJuegosService } from '../../application/registro-juegos.service.js';
import { CODIGOS_JUEGO, type Configuracion } from './estrategia-juego.js';
import { estrategiasDelMvp } from './estrategias.js';

const registro = new RegistroJuegosService(estrategiasDelMvp());
const juego = (codigo: string) => registro.estrategia(codigo);

/** Caras de ejemplo (ids de contenidos ficticios). */
const cara = (
  etiqueta: string,
  imagen?: string,
  extra: Configuracion = {},
) => ({
  etiqueta,
  ...(imagen ? { imagenContenidoId: imagen } : {}),
  ...extra,
});

const CONFIGURACIONES_VALIDAS: Record<string, Configuracion> = {
  HABLA_CONMIGO: { vocal: 'a' },
  BUSCA_LA_BOCA: { vocales: ['a', 'e', 'i'] },
  EMPAREJAR: {
    rondas: [
      {
        pregunta: '¿Qué palabra es?',
        estimulo: cara('perro', '14'),
        opciones: [
          cara('perro', undefined, { texto: 'PERRO' }),
          cara('gato', undefined, { texto: 'GATO' }),
        ],
        respuesta: 0,
      },
      {
        pregunta: '¿Cuántos hay?',
        estimulo: cara('tres manzanas', '15', { cantidad: 3 }),
        opciones: [
          cara('dos', undefined, { texto: '2' }),
          cara('tres', undefined, { texto: '3' }),
        ],
        respuesta: 1,
      },
    ],
  },
  CLASIFICAR: {
    conjuntos: [
      {
        pregunta: '¿Es fruta o animal?',
        grupos: [
          cara('frutas', undefined, { texto: 'Frutas' }),
          cara('animales', undefined, { texto: 'Animales' }),
        ],
        elementos: [
          { cara: cara('manzana', '15'), grupo: 0 },
          { cara: cara('perro', '14'), grupo: 1 },
          { cara: cara('gato', '16'), grupo: 1 },
        ],
      },
    ],
  },
  SECUENCIAR: {
    rutinas: [
      {
        titulo: 'Lavarse las manos',
        pasos: [
          cara('abrir la llave', '17'),
          cara('enjabonar', '18'),
          cara('secar', '19'),
        ],
      },
    ],
  },
  MEMORIA: {
    tableros: [{ parejas: [cara('perro', '14'), cara('gato', '16')] }],
  },
};

describe('estrategias por tipo de juego', () => {
  it('hay una estrategia para cada juego del MVP', () => {
    for (const codigo of CODIGOS_JUEGO)
      expect(juego(codigo).codigo).toBe(codigo);
    expect(() => juego('AJEDREZ')).toThrow(
      'El tipo de juego AJEDREZ no está disponible.',
    );
  });

  it.each(Object.keys(CONFIGURACIONES_VALIDAS))(
    '%s acepta su configuración',
    (codigo) => {
      expect(() =>
        juego(codigo).validarConfiguracion(CONFIGURACIONES_VALIDAS[codigo]!),
      ).not.toThrow();
    },
  );

  it.each([...CODIGOS_JUEGO])('%s rechaza {}', (codigo) => {
    expect(() => juego(codigo).validarConfiguracion({})).toThrow(
      ReglaNegocioError,
    );
  });

  describe('regla 11: sin tiempo límite, vidas ni penalizaciones', () => {
    it.each([
      [
        'HABLA_CONMIGO',
        { vocal: 'a', tiempoLimite: 30 },
        'configuracion.tiempoLimite',
      ],
      ['BUSCA_LA_BOCA', { vocales: ['a'], vidas: 3 }, 'configuracion.vidas'],
      [
        'MEMORIA',
        { tableros: [{ parejas: [], segundos: 60 }] },
        'configuracion.tableros[0].segundos',
      ],
      [
        'EMPAREJAR',
        { rondas: [{ pregunta: 'x', penalizacion: 1 }] },
        'configuracion.rondas[0].penalizacion',
      ],
      [
        'SECUENCIAR',
        { rutinas: [], time_limit: 10 },
        'configuracion.time_limit',
      ],
      [
        'CLASIFICAR',
        { conjuntos: [], puntosNegativos: true },
        'configuracion.puntosNegativos',
      ],
    ])('%s: %j', (codigo, config, campo) => {
      expect(() => juego(codigo).validarConfiguracion(config)).toThrow(
        `GameUP no usa tiempo límite, vidas ni penalizaciones (regla 11): quita «${campo}».`,
      );
    });

    it('también en el resultado de un intento', () => {
      expect(() =>
        juego('MEMORIA').validarResultado(
          { pairs: 2, mismatches: 0, tiempoSeg: 40 },
          CONFIGURACIONES_VALIDAS.MEMORIA!,
        ),
      ).toThrow(/regla 11/);
    });
  });

  describe('caras', () => {
    const conRonda = (estimulo: unknown) => ({
      rondas: [
        {
          pregunta: 'p',
          estimulo,
          opciones: [cara('a', '1'), cara('b', '2')],
          respuesta: 0,
        },
      ],
    });

    it.each([
      ['sin etiqueta', { imagenContenidoId: '14' }, /etiqueta/],
      [
        'sin imagen ni texto',
        { etiqueta: 'x' },
        /necesita imagenContenidoId o texto/,
      ],
      [
        'cantidad sin imagen',
        { etiqueta: 'x', texto: '3', cantidad: 3 },
        /cantidad repite la imagen/,
      ],
      [
        'audio sin imagen',
        { etiqueta: 'x', texto: 'a', audioContenidoId: '16' },
        /el audio va con una imagen/,
      ],
      [
        'cantidad fuera de rango',
        { etiqueta: 'x', imagenContenidoId: '14', cantidad: 11 },
        /entre 1 y 10/,
      ],
      [
        'id de contenido inválido',
        { etiqueta: 'x', imagenContenidoId: 14 },
        /id de contenido en texto/,
      ],
      [
        'emoji (provisional en la app)',
        { etiqueta: 'x', emoji: '🐶' },
        /no admite: emoji/,
      ],
    ])('%s → 422', (_c, estimulo, mensaje) => {
      expect(() =>
        juego('EMPAREJAR').validarConfiguracion(conRonda(estimulo)),
      ).toThrow(mensaje);
    });

    it('normaliza textos y deja los ids como texto', () => {
      const { configuracion } = juego('EMPAREJAR').validarConfiguracion(
        conRonda({ etiqueta: '  perro   grande ', imagenContenidoId: '14' }),
      );
      expect(
        (configuracion['rondas'] as Configuracion[])[0]?.['estimulo'],
      ).toEqual({
        etiqueta: 'perro grande',
        imagenContenidoId: '14',
      });
    });
  });

  describe('contenidos derivados (actividad_contenido)', () => {
    it('una entrada por imagen citada, sin repetir, con su audio', () => {
      const config = {
        tableros: [
          {
            parejas: [
              cara('perro', '14', { audioContenidoId: '20' }),
              cara('gato', '16'),
            ],
          },
          { parejas: [cara('perro', '14'), cara('pato', '21')] },
        ],
      };
      const { elementos } = juego('MEMORIA').validarConfiguracion(config);
      expect(elementos).toEqual([
        { imagenContenidoId: 14n, audioContenidoId: 20n, palabra: 'perro' },
        { imagenContenidoId: 16n, audioContenidoId: null, palabra: 'gato' },
        { imagenContenidoId: 21n, audioContenidoId: null, palabra: 'pato' },
      ]);
    });

    it('HABLA_CONMIGO y BUSCA_LA_BOCA no derivan contenidos (se editan a mano)', () => {
      expect(juego('HABLA_CONMIGO').derivaContenidos).toBe(false);
      expect(
        juego('BUSCA_LA_BOCA').validarConfiguracion({ vocales: ['a'] })
          .elementos,
      ).toBeNull();
      expect(juego('SECUENCIAR').derivaContenidos).toBe(true);
    });
  });

  describe('reglas propias de cada juego', () => {
    it('EMPAREJAR: la respuesta debe ser una de las opciones', () => {
      const config = structuredClone(CONFIGURACIONES_VALIDAS.EMPAREJAR!) as {
        rondas: Array<{ respuesta: number }>;
      };
      config.rondas[0]!.respuesta = 2;
      expect(() => juego('EMPAREJAR').validarConfiguracion(config)).toThrow(
        /respuesta: debe estar entre 0 y 1/,
      );
    });

    it('CLASIFICAR: cada grupo recibe al menos un elemento', () => {
      const config = structuredClone(CONFIGURACIONES_VALIDAS.CLASIFICAR!) as {
        conjuntos: Array<{ elementos: Array<{ grupo: number }> }>;
      };
      for (const e of config.conjuntos[0]!.elementos) e.grupo = 0;
      expect(() => juego('CLASIFICAR').validarConfiguracion(config)).toThrow(
        /el grupo 1 no tiene elementos/,
      );
    });

    it('SECUENCIAR: de 2 a 6 pasos (fase 9: antes, hasta 4)', () => {
      const pasos = (n: number) =>
        Array.from({ length: n }, (_, i) => cara(`paso ${i}`, String(i + 1)));
      const config = (n: number) => ({
        rutinas: [{ titulo: 't', pasos: pasos(n) }],
      });
      expect(() => juego('SECUENCIAR').validarConfiguracion(config(1))).toThrow(
        /entre 2 y 6/,
      );
      expect(() =>
        juego('SECUENCIAR').validarConfiguracion(config(6)),
      ).not.toThrow();
      expect(() => juego('SECUENCIAR').validarConfiguracion(config(7))).toThrow(
        /entre 2 y 6/,
      );
    });

    describe('CLASIFICAR: 2 o 3 grupos y hasta 9 elementos (fase 9)', () => {
      const grupos = (n: number) =>
        Array.from({ length: n }, (_, i) =>
          cara(`grupo ${i}`, undefined, { texto: `G${i}` }),
        );
      const elementos = (n: number, numGrupos: number) =>
        Array.from({ length: n }, (_, i) => ({
          cara: cara(`elemento ${i}`, String(i + 1)),
          grupo: i % numGrupos,
        }));
      const config = (g: number, e: number) => ({
        conjuntos: [
          {
            pregunta: '¿Dónde va?',
            grupos: grupos(g),
            elementos: elementos(e, g),
          },
        ],
      });

      it('acepta 3 grupos y 9 elementos', () => {
        expect(() =>
          juego('CLASIFICAR').validarConfiguracion(config(3, 9)),
        ).not.toThrow();
      });

      it('rechaza 4 grupos, 1 grupo y 10 elementos', () => {
        expect(() =>
          juego('CLASIFICAR').validarConfiguracion(config(4, 8)),
        ).toThrow(/grupos: debe tener entre 2 y 3/);
        expect(() =>
          juego('CLASIFICAR').validarConfiguracion(config(1, 4)),
        ).toThrow(/grupos: debe tener entre 2 y 3/);
        expect(() =>
          juego('CLASIFICAR').validarConfiguracion(config(2, 10)),
        ).toThrow(/elementos: debe tener entre 2 y 9/);
      });

      it('el grupo de cada elemento debe existir', () => {
        const dos = config(2, 4);
        dos.conjuntos[0]!.elementos[0]!.grupo = 2;
        expect(() => juego('CLASIFICAR').validarConfiguracion(dos)).toThrow(
          /grupo: debe estar entre 0 y 1/,
        );
        const tres = config(3, 6);
        tres.conjuntos[0]!.elementos[0]!.grupo = 3;
        expect(() => juego('CLASIFICAR').validarConfiguracion(tres)).toThrow(
          /grupo: debe estar entre 0 y 2/,
        );
      });

      it('con 3 grupos, el tercero también recibe al menos un elemento', () => {
        const c = config(3, 6);
        for (const e of c.conjuntos[0]!.elementos)
          if (e.grupo === 2) e.grupo = 0;
        expect(() => juego('CLASIFICAR').validarConfiguracion(c)).toThrow(
          /el grupo 2 no tiene elementos/,
        );
      });
    });

    it('las configuraciones con los límites anteriores siguen siendo válidas', () => {
      const pasos = Array.from({ length: 4 }, (_, i) =>
        cara(`p${i}`, String(i + 1)),
      );
      const elementos = Array.from({ length: 8 }, (_, i) => ({
        cara: cara(`e${i}`, String(i + 1)),
        grupo: i % 2,
      }));
      const anteriores: Array<[string, Configuracion]> = [
        ['SECUENCIAR', { rutinas: [{ titulo: 't', pasos }] }],
        [
          'CLASIFICAR',
          {
            conjuntos: [
              {
                pregunta: 'p',
                grupos: [
                  cara('a', undefined, { texto: 'A' }),
                  cara('b', undefined, { texto: 'B' }),
                ],
                elementos,
              },
            ],
          },
        ],
        [
          'MEMORIA',
          {
            tableros: [
              {
                parejas: Array.from({ length: 6 }, (_, i) =>
                  cara(`m${i}`, String(i + 1)),
                ),
              },
            ],
          },
        ],
        ...Object.entries(CONFIGURACIONES_VALIDAS),
      ];
      for (const [codigo, configuracion] of anteriores) {
        expect(() =>
          juego(codigo).validarConfiguracion(configuracion),
        ).not.toThrow();
      }
    });

    it('MEMORIA: etiquetas distintas en un tablero', () => {
      expect(() =>
        juego('MEMORIA').validarConfiguracion({
          tableros: [{ parejas: [cara('perro', '14'), cara('perro', '15')] }],
        }),
      ).toThrow(/misma etiqueta/);
    });

    it('BUSCA_LA_BOCA: vocales sin repetir', () => {
      expect(() =>
        juego('BUSCA_LA_BOCA').validarConfiguracion({ vocales: ['a', 'a'] }),
      ).toThrow(/sin repetir/);
      expect(() =>
        juego('BUSCA_LA_BOCA').validarConfiguracion({ vocales: ['x'] }),
      ).toThrow(ReglaNegocioError);
    });

    it('HABLA_CONMIGO: una vocal válida', () => {
      for (const vocal of ['a', 'e', 'i', 'o', 'u']) {
        expect(
          juego('HABLA_CONMIGO').validarConfiguracion({ vocal }).configuracion,
        ).toEqual({ vocal });
      }
      expect(() =>
        juego('HABLA_CONMIGO').validarConfiguracion({ vocal: 'A' }),
      ).toThrow(ReglaNegocioError);
    });
  });

  describe('medida y resultado', () => {
    it.each([
      ['EMPAREJAR', 'total', 2], // 2 rondas
      ['CLASIFICAR', 'total', 3], // 3 elementos
      ['SECUENCIAR', 'total', 3], // 3 pasos
      ['MEMORIA', 'pairs', 2], // 2 parejas
      ['BUSCA_LA_BOCA', 'total', 3], // 3 vocales
    ])('%s: %s = %d', (codigo, campo, valor) => {
      expect(juego(codigo).medida(CONFIGURACIONES_VALIDAS[codigo]!)).toEqual({
        campo,
        valor,
      });
    });

    it('HABLA_CONMIGO no tiene medida ni nota: el cliente envía {}', () => {
      expect(juego('HABLA_CONMIGO').medida({ vocal: 'a' })).toBeNull();
      expect(
        juego('HABLA_CONMIGO').validarResultado({}, { vocal: 'a' }),
      ).toEqual({});
      expect(() =>
        juego('HABLA_CONMIGO').validarResultado(
          { aprobado: true },
          { vocal: 'a' },
        ),
      ).toThrow(/no admite: aprobado/);
    });

    it('turnos: total debe coincidir con la configuración', () => {
      const config = CONFIGURACIONES_VALIDAS.CLASIFICAR!;
      expect(
        juego('CLASIFICAR').validarResultado(
          { firstTryCorrect: 2, total: 3 },
          config,
        ),
      ).toEqual({
        firstTryCorrect: 2,
        total: 3,
      });
      expect(() =>
        juego('CLASIFICAR').validarResultado(
          { firstTryCorrect: 2, total: 10 },
          config,
        ),
      ).toThrow('resultado.total: debe ser 3, los turnos de esta actividad.');
      expect(() =>
        juego('CLASIFICAR').validarResultado(
          { firstTryCorrect: 4, total: 3 },
          config,
        ),
      ).toThrow(/no puede ser mayor que total/);
    });

    it('MEMORIA: pairs debe coincidir; mismatches solo informa', () => {
      const config = CONFIGURACIONES_VALIDAS.MEMORIA!;
      expect(
        juego('MEMORIA').validarResultado({ pairs: 2, mismatches: 7 }, config),
      ).toEqual({
        pairs: 2,
        mismatches: 7,
      });
      expect(() =>
        juego('MEMORIA').validarResultado({ pairs: 5, mismatches: 0 }, config),
      ).toThrow(/debe ser 2/);
    });

    it('rechaza campos de más (ej.: una nota)', () => {
      expect(() =>
        juego('BUSCA_LA_BOCA').validarResultado(
          { firstTryCorrect: 1, total: 3, nota: 5 },
          CONFIGURACIONES_VALIDAS.BUSCA_LA_BOCA!,
        ),
      ).toThrow(/no admite: nota/);
    });
  });
});
