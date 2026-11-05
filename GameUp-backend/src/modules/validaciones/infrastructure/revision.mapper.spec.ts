import type { ItemRevision } from '../domain/validacion.js';
import { RevisionMapper } from './revision.mapper.js';

const item = (extra: Partial<ItemRevision> = {}): ItemRevision => ({
  intentoId: 41n,
  numeroIntento: 2,
  fecha: new Date('2026-11-05T15:00:00Z'),
  tipoJuego: 'HABLA_CONMIGO',
  resultado: { estadoGrabacion: 'ADJUNTA' },
  estudiante: { id: 10n, nombres: 'Martín José', apellidos: 'Cruz' },
  actividad: { id: 8n, titulo: 'Di la a', vocal: 'a' },
  modulo: { id: 3n, nombre: 'Vocal A' },
  pendientesMismaActividad: 2,
  grabacion: { disponible: true, vencido: false },
  ...extra,
});

describe('RevisionMapper', () => {
  it('intento de voz → ReviewItem de la app', () => {
    expect(RevisionMapper.aDto(item())).toEqual({
      intentoId: '41',
      tipo: 'VOZ',
      tipoJuego: 'HABLA_CONMIGO',
      estudiante: { id: '10', displayName: 'Martín C.', initials: 'MC' },
      actividad: { id: '8', titulo: 'Di la a', vocal: 'a' },
      modulo: { id: '3', nombre: 'Vocal A' },
      fecha: '2026-11-05T15:00:00.000Z',
      numeroIntento: 2,
      pendientesMismaActividad: 2,
      resultado: { estadoGrabacion: 'ADJUNTA' },
      consentimientoVoz: true,
      grabacion: { disponible: true, vencido: false },
    });
  });

  it.each([
    ['ADJUNTA', true],
    ['NO_ENVIADA', true],
    ['NO_GUARDADA', true],
    ['SIN_CONSENTIMIENTO', false],
    ['NO_VERIFICABLE', false],
  ])('estado de grabación %s → consentimientoVoz %s', (estado, esperado) => {
    expect(
      RevisionMapper.aDto(
        item({ resultado: { estadoGrabacion: estado }, grabacion: null }),
      ).consentimientoVoz,
    ).toBe(esperado);
  });

  it('un juego sin voz: tipo JUEGO y sin consentimiento de voz', () => {
    const dto = RevisionMapper.aDto(
      item({
        tipoJuego: 'MEMORIA',
        resultado: { pairs: 2, mismatches: 1 },
        grabacion: null,
      }),
    );
    expect(dto).toMatchObject({
      tipo: 'JUEGO',
      consentimientoVoz: null,
      grabacion: null,
    });
  });
});
