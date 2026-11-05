import { escenarioAcudiente } from '../../../../test/dobles/acudiente-en-memoria.js';
import {
  ACUDIENTE_4,
  ACUDIENTE_5,
  DIRECTORA,
  ESTUDIANTE_10,
  TALLERISTA_2,
  TALLERISTA_3,
} from '../../../../test/dobles/escenario-estudiantes.js';
import {
  AccesoDenegadoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { RelojFijo } from '../../../common/reloj/reloj.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import { semanaDe } from '../domain/practica-casa.js';
import { PracticaCasaMapper } from '../infrastructure/practica-casa.mapper.js';
import { PracticaCasaService } from './practica-casa.service.js';

// Jueves 5 de noviembre de 2026, 10:00 en Bogotá.
const AHORA = new Date('2026-11-05T15:00:00Z');

describe('semanaDe', () => {
  it('lunes a domingo de la semana que contiene el día', () => {
    expect(semanaDe('2026-11-05')).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
  });

  it('el lunes y el domingo pertenecen a su propia semana', () => {
    expect(semanaDe('2026-11-02')[0]).toBe('2026-11-02');
    expect(semanaDe('2026-11-08')[0]).toBe('2026-11-02');
    expect(semanaDe('2026-11-09')[0]).toBe('2026-11-09');
  });

  it('cruza meses y años', () => {
    expect(semanaDe('2027-01-01')).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });
});

describe('PracticaCasaService', () => {
  let e: Awaited<ReturnType<typeof escenarioAcudiente>>;
  let reloj: RelojFijo;
  let servicio: PracticaCasaService;

  beforeEach(async () => {
    e = await escenarioAcudiente();
    reloj = new RelojFijo(AHORA);
    servicio = new PracticaCasaService(
      e.practicas,
      reloj,
      new AccesoEstudianteService(e.estudiantes),
    );
  });

  it('semana sin práctica: 7 días sin marcar', async () => {
    const s = await servicio.semana(ACUDIENTE_4, 10n);
    expect(s.hoy).toBe('2026-11-05');
    expect(s.dias).toHaveLength(7);
    expect(s.dias.every((d) => !d.practicado)).toBe(true);
    expect(s.practicadoHoy).toBe(false);
  });

  it('«Lo practicamos hoy»: marca hoy y es idempotente', async () => {
    await servicio.marcarHoy(ACUDIENTE_4, 10n);
    const s = await servicio.marcarHoy(ACUDIENTE_4, 10n);
    expect(s.practicadoHoy).toBe(true);
    expect(s.dias.filter((d) => d.practicado).map((d) => d.fecha)).toEqual([
      '2026-11-05',
    ]);
    expect(e.practicas.filas).toHaveLength(1);
  });

  it('«hoy» es la fecha de Bogotá, no la del servidor (UTC)', async () => {
    // 6 de nov. a las 03:00 UTC = 5 de nov. a las 22:00 en Bogotá.
    reloj.avanzar(12 * 60 * 60 * 1000);
    await servicio.marcarHoy(ACUDIENTE_4, 10n);
    expect(e.practicas.filas[0]?.fecha).toBe('2026-11-05');
  });

  it('solo cuenta la semana actual', async () => {
    await e.practicas.registrar(10n, 4n, '2026-11-01'); // domingo anterior
    await e.practicas.registrar(10n, 4n, '2026-11-03');
    const s = await servicio.semana(ACUDIENTE_4, 10n);
    expect(s.dias.filter((d) => d.practicado).map((d) => d.fecha)).toEqual([
      '2026-11-03',
    ]);
  });

  it('estudiante de otro acudiente → 404; otros roles → 403', async () => {
    await expect(servicio.semana(ACUDIENTE_5, 10n)).rejects.toBeInstanceOf(
      RecursoNoEncontradoError,
    );
    await expect(servicio.marcarHoy(ACUDIENTE_5, 10n)).rejects.toBeInstanceOf(
      RecursoNoEncontradoError,
    );
    for (const actor of [DIRECTORA, TALLERISTA_2]) {
      await expect(servicio.marcarHoy(actor, 10n)).rejects.toBeInstanceOf(
        AccesoDenegadoError,
      );
    }
    expect(e.practicas.filas).toHaveLength(0);
  });

  it('la directora y la tallerista a cargo leen la semana (no la marcan)', async () => {
    await servicio.marcarHoy(ACUDIENTE_4, 10n);
    for (const actor of [DIRECTORA, TALLERISTA_2]) {
      await expect(servicio.semana(actor, 10n)).resolves.toMatchObject({
        practicadoHoy: true,
      });
    }
  });

  it('la tallerista sin el estudiante a cargo → 404; el estudiante → 403', async () => {
    await expect(servicio.semana(TALLERISTA_3, 10n)).rejects.toBeInstanceOf(
      RecursoNoEncontradoError,
    );
    await expect(servicio.semana(ESTUDIANTE_10, 10n)).rejects.toBeInstanceOf(
      AccesoDenegadoError,
    );
  });

  it('estudiante que no está activo → 422', async () => {
    // El estudiante 11 está EGRESADO: se vincula al acudiente 4 solo para esta prueba.
    await e.estudiantes.acudientesRepo.crear(4n, 11n, 'Tía', false);
    await expect(servicio.marcarHoy(ACUDIENTE_4, 11n)).rejects.toBeInstanceOf(
      ReglaNegocioError,
    );
    await expect(servicio.semana(ACUDIENTE_4, 11n)).resolves.toMatchObject({
      practicadoHoy: false,
    });
  });

  it('mapper: estudiante con nombre corto e iniciales', async () => {
    const dto = PracticaCasaMapper.aDto(
      await servicio.semana(ACUDIENTE_4, 10n),
    );
    expect(dto.estudiante).toEqual({
      id: '10',
      displayName: 'Martín C.',
      initials: 'MC',
    });
    expect(dto.dias[0]).toEqual({ fecha: '2026-11-02', practicado: false });
  });
});
