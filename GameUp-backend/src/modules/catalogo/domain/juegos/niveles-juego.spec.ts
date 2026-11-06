import { ReglaNegocioError } from '../../../../common/errors/dominio.errors.js';
import { RegistroJuegosService } from '../../application/registro-juegos.service.js';
import { CODIGOS_JUEGO, type Configuracion } from './estrategia-juego.js';
import { estrategiasDelMvp } from './estrategias.js';
import {
  JUEGOS_CON_ESCALERA,
  esJuegoConEscalera,
  esNivelJuego,
} from './niveles-juego.js';

const registro = new RegistroJuegosService(estrategiasDelMvp());

/** Como en ActividadService: primero la configuración, después su nivel. */
function validar(codigo: string, configuracion: Configuracion, nivel: number) {
  const estrategia = registro.estrategia(codigo);
  const validada = estrategia.validarConfiguracion(configuracion);
  estrategia.validarNivel(validada.configuracion, nivel);
}

const cara = (etiqueta: string, extra: Configuracion = {}) => ({
  etiqueta,
  texto: '🍎',
  ...extra,
});
const caras = (n: number, prefijo: string) =>
  Array.from({ length: n }, (_, i) => cara(`${prefijo} ${i + 1}`));

// ─── Constructores de configuraciones de prueba (dibujos genéricos) ────────

function memoria(...parejasPorTablero: number[]): Configuracion {
  return {
    tableros: parejasPorTablero.map((n) => ({ parejas: caras(n, 'carta') })),
  };
}

function emparejar(
  opcionesPorRonda: number[],
  estimulo: Configuracion = { etiqueta: 'perro', texto: 'perro' },
): Configuracion {
  return {
    rondas: opcionesPorRonda.map((n) => ({
      pregunta: '¿Cuál es?',
      estimulo,
      opciones: caras(n, 'opción'),
      respuesta: 0,
    })),
  };
}

function clasificar(grupos: number, elementos: number): Configuracion {
  return {
    conjuntos: [
      {
        pregunta: '¿Dónde va?',
        grupos: caras(grupos, 'grupo'),
        elementos: caras(elementos, 'elemento').map((c, i) => ({
          cara: c,
          grupo: i % grupos,
        })),
      },
    ],
  };
}

function secuenciar(...pasosPorRutina: number[]): Configuracion {
  return {
    rutinas: pasosPorRutina.map((n, i) => ({
      titulo: `Rutina ${i + 1}`,
      pasos: caras(n, 'paso'),
    })),
  };
}

/** La tabla de niveles de la fase 9 (sección 1 del plan). */
const ESCALERA = [
  { nivel: 1, parejas: 2, opciones: 2, grupos: 2, elementos: 4, pasos: 2 },
  { nivel: 2, parejas: 3, opciones: 3, grupos: 2, elementos: 6, pasos: 3 },
  { nivel: 3, parejas: 4, opciones: 4, grupos: 2, elementos: 8, pasos: 4 },
  { nivel: 4, parejas: 5, opciones: 3, grupos: 3, elementos: 6, pasos: 5 },
  { nivel: 5, parejas: 6, opciones: 4, grupos: 3, elementos: 9, pasos: 6 },
];

describe('escalera de niveles por juego', () => {
  it('solo Emparejar, Clasificar, Secuenciar y Memoria tienen escalera', () => {
    for (const codigo of CODIGOS_JUEGO) {
      expect(registro.estrategia(codigo).tieneEscalera).toBe(
        esJuegoConEscalera(codigo),
      );
    }
    expect([...JUEGOS_CON_ESCALERA].sort()).toEqual(
      ['CLASIFICAR', 'EMPAREJAR', 'MEMORIA', 'SECUENCIAR'].sort(),
    );
  });

  it('los juegos de habla no tienen niveles', () => {
    expect(() =>
      registro.estrategia('HABLA_CONMIGO').validarNivel({ vocal: 'a' }, 1),
    ).toThrow(/Habla conmigo no tiene escalera/);
    expect(() =>
      registro.estrategia('BUSCA_LA_BOCA').validarNivel({ vocales: ['a'] }, 1),
    ).toThrow(/Busca la boca no tiene escalera/);
  });

  it.each([0, 6, -1, 2.5, Number.NaN])('el nivel %s no existe', (nivel) => {
    expect(esNivelJuego(nivel)).toBe(false);
    expect(() => validar('MEMORIA', memoria(2), nivel)).toThrow(/entre 1 y 5/);
  });

  describe.each(ESCALERA)('nivel $nivel', (n) => {
    it(`Memoria: exactamente ${n.parejas} parejas`, () => {
      expect(() =>
        validar('MEMORIA', memoria(n.parejas), n.nivel),
      ).not.toThrow();
      // Varios tableros: todos con el tamaño del nivel.
      expect(() =>
        validar('MEMORIA', memoria(n.parejas, n.parejas), n.nivel),
      ).not.toThrow();
      const otro = n.parejas === 6 ? 5 : n.parejas + 1;
      expect(() => validar('MEMORIA', memoria(otro), n.nivel)).toThrow(
        new RegExp(
          `Memoria nivel ${n.nivel}: configuracion.tableros\\[0\\] necesita ${n.parejas} parejas \\(tiene ${otro}\\)`,
        ),
      );
      expect(() =>
        validar('MEMORIA', memoria(n.parejas, otro), n.nivel),
      ).toThrow(/tableros\[1\]/);
    });

    it(`Emparejar: exactamente ${n.opciones} opciones por ronda`, () => {
      expect(() =>
        validar('EMPAREJAR', emparejar([n.opciones, n.opciones]), n.nivel),
      ).not.toThrow();
      const otro = n.opciones === 4 ? 3 : n.opciones + 1;
      expect(() =>
        validar('EMPAREJAR', emparejar([n.opciones, otro]), n.nivel),
      ).toThrow(
        new RegExp(
          `Emparejar nivel ${n.nivel}: configuracion.rondas\\[1\\] necesita ${n.opciones} opciones`,
        ),
      );
    });

    it(`Clasificar: ${n.grupos} grupos y ${n.elementos} elementos`, () => {
      expect(() =>
        validar('CLASIFICAR', clasificar(n.grupos, n.elementos), n.nivel),
      ).not.toThrow();
      const otrosGrupos = n.grupos === 2 ? 3 : 2;
      expect(() =>
        validar('CLASIFICAR', clasificar(otrosGrupos, n.elementos), n.nivel),
      ).toThrow(new RegExp(`necesita ${n.grupos} grupos`));
      expect(() =>
        validar('CLASIFICAR', clasificar(n.grupos, n.elementos - 1), n.nivel),
      ).toThrow(new RegExp(`necesita ${n.elementos} elementos`));
    });

    it(`Secuenciar: exactamente ${n.pasos} pasos`, () => {
      expect(() =>
        validar('SECUENCIAR', secuenciar(n.pasos), n.nivel),
      ).not.toThrow();
      const otro = n.pasos === 6 ? 5 : n.pasos + 1;
      expect(() =>
        validar('SECUENCIAR', secuenciar(n.pasos, otro), n.nivel),
      ).toThrow(
        new RegExp(
          `Secuenciar nivel ${n.nivel}: configuracion.rutinas\\[1\\] necesita ${n.pasos} pasos \\(tiene ${otro}\\)`,
        ),
      );
    });
  });

  describe('Emparejar: tarjeta de arriba con palabra o cantidad (niveles 4 y 5)', () => {
    const conImagen = (n: number) =>
      emparejar([n], { etiqueta: 'perro', imagenContenidoId: '14' });

    it.each([1, 2, 3])(
      'nivel %s: imagen igual a imagen, sin exigir palabra',
      (nivel) => {
        const opciones = ESCALERA[nivel - 1]!.opciones;
        expect(() =>
          validar('EMPAREJAR', conImagen(opciones), nivel),
        ).not.toThrow();
      },
    );

    it.each([4, 5])('nivel %s: sin texto ni cantidad → 422', (nivel) => {
      const opciones = ESCALERA[nivel - 1]!.opciones;
      expect(() => validar('EMPAREJAR', conImagen(opciones), nivel)).toThrow(
        new RegExp(
          `Emparejar nivel ${nivel}: configuracion.rondas\\[0\\].estimulo necesita una palabra`,
        ),
      );
    });

    it.each([4, 5])('nivel %s: con palabra o con cantidad, sí', (nivel) => {
      const opciones = ESCALERA[nivel - 1]!.opciones;
      expect(() =>
        validar(
          'EMPAREJAR',
          emparejar([opciones], { etiqueta: 'perro', texto: 'perro' }),
          nivel,
        ),
      ).not.toThrow();
      expect(() =>
        validar(
          'EMPAREJAR',
          emparejar([opciones], {
            etiqueta: 'tres manzanas',
            imagenContenidoId: '15',
            cantidad: 3,
          }),
          nivel,
        ),
      ).not.toThrow();
    });
  });

  it('los errores son de regla de negocio (422)', () => {
    expect(() => validar('MEMORIA', memoria(3), 1)).toThrow(ReglaNegocioError);
  });
});
