import {
  avanceDe,
  estaPorHacer,
  type ActividadAsignada,
  type IntentoResumen,
} from './asignacion.entity.js';

const habla: ActividadAsignada = {
  id: 8n,
  titulo: 'Di la a',
  tipoJuego: 'HABLA_CONMIGO',
  configuracion: { vocal: 'a' },
  orden: 0,
};

const intento = (
  numero: number,
  validacion: IntentoResumen['validacion'] = null,
  actividadId = 8n,
): IntentoResumen => ({
  actividadId,
  numeroIntento: numero,
  fecha: new Date('2026-11-05T15:00:00Z'),
  validacion,
});
const rechazado = (retro: string) => ({
  resultado: 'RECHAZADO' as const,
  retroalimentacion: retro,
});
const aprobado = { resultado: 'APROBADO' as const, retroalimentacion: null };

describe('avanceDe', () => {
  it('sin intentos: SIN_INTENTOS y nueva', () => {
    expect(avanceDe(habla, [intento(1, null, 99n)])).toMatchObject({
      estado: 'SIN_INTENTOS',
      intentos: 0,
      esNueva: true,
      vocal: 'a',
    });
  });

  it('último intento sin validar: PENDIENTE_VALIDACION (aunque antes hubo un rechazo)', () => {
    const v = avanceDe(habla, [
      intento(1, rechazado('Abre más la boca')),
      intento(2),
    ]);
    expect(v).toMatchObject({
      estado: 'PENDIENTE_VALIDACION',
      intentos: 2,
      retroalimentacion: null,
    });
  });

  it('último intento rechazado: RECHAZADA con su retroalimentación', () => {
    const v = avanceDe(habla, [
      intento(2, rechazado('Otra vez')),
      intento(1, rechazado('Primera')),
    ]);
    expect(v).toMatchObject({
      estado: 'RECHAZADA',
      retroalimentacion: 'Otra vez',
    });
  });

  it('basta un intento aprobado para APROBADA (como el progreso de la base)', () => {
    const v = avanceDe(habla, [
      intento(1, aprobado),
      intento(2, rechazado('x')),
      intento(3),
    ]);
    expect(v.estado).toBe('APROBADA');
  });

  it('la vocal solo aplica a HABLA_CONMIGO', () => {
    expect(
      avanceDe(
        { ...habla, tipoJuego: 'MEMORIA', configuracion: { vocal: 'a' } },
        [],
      ).vocal,
    ).toBeNull();
  });

  it('por hacer: sin intentos o rechazada', () => {
    expect(estaPorHacer(avanceDe(habla, []))).toBe(true);
    expect(estaPorHacer(avanceDe(habla, [intento(1, rechazado('x'))]))).toBe(
      true,
    );
    expect(estaPorHacer(avanceDe(habla, [intento(1)]))).toBe(false);
    expect(estaPorHacer(avanceDe(habla, [intento(1, aprobado)]))).toBe(false);
  });
});
