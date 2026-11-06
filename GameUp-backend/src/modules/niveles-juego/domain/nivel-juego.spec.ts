import { ReglaNegocioError } from '../../../common/errors/dominio.errors.js';
import {
  ajusteManual,
  mensajeSubida,
  normalizarMotivo,
  subidaPorAprobacion,
} from './nivel-juego.js';

describe('escalera: subir de nivel al aprobar', () => {
  it.each([1, 2, 3, 4])('aprobar el nivel actual %s sube uno', (nivel) => {
    expect(
      subidaPorAprobacion({ nivelActual: nivel, completado: false }, nivel),
    ).toEqual({
      nivelAnterior: nivel,
      completadoAnterior: false,
      nivelNuevo: nivel + 1,
      completado: false,
    });
  });

  it('aprobar el nivel 5 lo completa y sigue en el 5', () => {
    expect(
      subidaPorAprobacion({ nivelActual: 5, completado: false }, 5),
    ).toEqual({
      nivelAnterior: 5,
      completadoAnterior: false,
      nivelNuevo: 5,
      completado: true,
    });
  });

  it('ya completado, aprobar otra vez el 5 no cambia nada', () => {
    expect(
      subidaPorAprobacion({ nivelActual: 5, completado: true }, 5),
    ).toBeNull();
  });

  it('un nivel ya superado (o uno al que no ha llegado) no sube ni salta', () => {
    expect(
      subidaPorAprobacion({ nivelActual: 3, completado: false }, 2),
    ).toBeNull();
    expect(
      subidaPorAprobacion({ nivelActual: 3, completado: false }, 4),
    ).toBeNull();
  });

  it('dos aprobaciones seguidas del mismo nivel suben uno solo', () => {
    let estado = { nivelActual: 1, completado: false };
    const subidas = [1, 1].map((nivel) => {
      const cambio = subidaPorAprobacion(estado, nivel);
      if (cambio)
        estado = {
          nivelActual: cambio.nivelNuevo,
          completado: cambio.completado,
        };
      return cambio;
    });
    expect(subidas[0]).not.toBeNull();
    expect(subidas[1]).toBeNull();
    expect(estado.nivelActual).toBe(2);
  });
});

describe('escalera: ajuste manual', () => {
  it('pone el nivel pedido (sube o baja) y queda sin completar', () => {
    expect(ajusteManual({ nivelActual: 1, completado: false }, 4)).toEqual({
      nivelAnterior: 1,
      completadoAnterior: false,
      nivelNuevo: 4,
      completado: false,
    });
    expect(ajusteManual({ nivelActual: 5, completado: true }, 5)).toEqual({
      nivelAnterior: 5,
      completadoAnterior: true,
      nivelNuevo: 5,
      completado: false,
    });
    expect(
      ajusteManual({ nivelActual: 4, completado: false }, 2),
    ).toMatchObject({ nivelNuevo: 2 });
  });

  it('el mismo nivel o uno que no existe → 422', () => {
    expect(() =>
      ajusteManual({ nivelActual: 3, completado: false }, 3),
    ).toThrow(/Ya va en el nivel 3/);
    for (const nivel of [0, 6, 2.5]) {
      expect(() =>
        ajusteManual({ nivelActual: 3, completado: false }, nivel),
      ).toThrow(ReglaNegocioError);
    }
  });

  it('el motivo es obligatorio y tiene un largo máximo', () => {
    expect(normalizarMotivo('  Ya  domina  ')).toBe('Ya domina');
    expect(() => normalizarMotivo('   ')).toThrow(/motivo es obligatorio/);
    expect(() => normalizarMotivo(null)).toThrow(/motivo es obligatorio/);
    expect(() => normalizarMotivo('x'.repeat(301))).toThrow(/300 caracteres/);
  });
});

describe('escalera: aviso al acudiente', () => {
  it('al subir y al completar, sin presión ni género', () => {
    expect(
      mensajeSubida('Ana', 'Memoria', {
        nivelAnterior: 2,
        completadoAnterior: false,
        nivelNuevo: 3,
        completado: false,
      }),
    ).toBe('Ana subió al nivel 3 de Memoria. ¡Celébrenlo juntos!');
    expect(
      mensajeSubida('Ana', 'Memoria', {
        nivelAnterior: 5,
        completadoAnterior: false,
        nivelNuevo: 5,
        completado: true,
      }),
    ).toBe('Ana completó los 5 niveles de Memoria. ¡Qué gran logro!');
  });
});
