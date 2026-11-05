import { ReglaNegocioError } from '../../../common/errors/dominio.errors.js';
import {
  LARGO_MAXIMO_OBSERVACION,
  normalizarTextoObservacion,
} from '../domain/observacion.entity.js';
import { ObservacionMapper } from './observacion.mapper.js';

describe('ObservacionMapper', () => {
  const fila = {
    id: 7n,
    estudiante_id: 10n,
    texto: 'Hoy reconoció la e.',
    visible_acudiente: true,
    fecha: new Date('2026-11-05T15:00:00Z'),
    usuario: { id: 2n, nombres: 'Ana María', apellidos: 'Gómez Ruiz' },
  };

  it('fila → entidad → DTO (ids en texto, fecha ISO, autor con nombre visible)', () => {
    const o = ObservacionMapper.aEntidad(fila);
    expect(o.esDe(2n)).toBe(true);
    expect(o.esDe(3n)).toBe(false);
    expect(ObservacionMapper.aDto(o)).toEqual({
      id: '7',
      estudianteId: '10',
      autor: { id: '2', displayName: 'Ana Gómez' },
      texto: 'Hoy reconoció la e.',
      visibleAcudiente: true,
      fecha: '2026-11-05T15:00:00.000Z',
    });
  });
});

describe('normalizarTextoObservacion', () => {
  it('recorta los extremos y conserva los saltos de línea', () => {
    expect(normalizarTextoObservacion('  a\nb  ')).toBe('a\nb');
  });

  it('vacía o demasiado larga → 422', () => {
    expect(() => normalizarTextoObservacion(' \n ')).toThrow(ReglaNegocioError);
    expect(() =>
      normalizarTextoObservacion('x'.repeat(LARGO_MAXIMO_OBSERVACION + 1)),
    ).toThrow(ReglaNegocioError);
  });
});
