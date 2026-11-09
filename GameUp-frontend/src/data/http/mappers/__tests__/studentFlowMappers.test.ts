import { ServerError } from '@/services/apiErrors';
import type { ActividadDetalleDto } from '../../dto/actividades';
import type { ActividadPendienteDto } from '../../dto/asignaciones';
import type { IntentoDto, IntentoVozDto } from '../../dto/intentos';
import { toActivityContent } from '../activityMapper';
import { toAssignment } from '../assignmentMapper';
import { toListeningResult, toSpeechAttempt } from '../attemptMapper';
import { toActivityStatus, toAttemptStatus, toGameId } from '../gameCodes';
import { toResumePoint, toStarCount, toVowelPractice } from '../practiceMapper';
import { toOfficialProgress } from '../progressMapper';

describe('códigos de juego y de estado', () => {
  it.each([
    ['EMPAREJAR', 'match'],
    ['CLASIFICAR', 'classify'],
    ['SECUENCIAR', 'sequence'],
    ['MEMORIA', 'memory'],
    ['HABLA_CONMIGO', 'speak'],
    ['BUSCA_LA_BOCA', 'findMouth'],
  ])('%s → %s', (codigo, gameId) => {
    expect(toGameId(codigo)).toBe(gameId);
  });

  it.each([
    ['SIN_INTENTOS', 'assigned'],
    ['PENDIENTE_VALIDACION', 'pending_validation'],
    ['RECHAZADA', 'rejected'],
    ['APROBADA', 'validated'],
  ])('actividad %s → %s', (estado, status) => {
    expect(toActivityStatus(estado)).toBe(status);
  });

  it.each([
    ['PENDIENTE_VALIDACION', 'pending_validation'],
    ['APROBADO', 'validated'],
    ['RECHAZADO', 'rejected'],
  ])('intento %s → %s', (estado, status) => {
    expect(toAttemptStatus(estado)).toBe(status);
  });

  it('un código desconocido es un error claro, no un juego inventado', () => {
    expect(() => toGameId('DOMINO')).toThrow(ServerError);
    expect(() => toActivityStatus('VENCIDA')).toThrow(ServerError);
  });
});

const pendiente: ActividadPendienteDto = {
  actividadId: '8',
  titulo: 'Di la a',
  tipoJuego: 'HABLA_CONMIGO',
  orden: 0,
  vocal: 'a',
  estado: 'SIN_INTENTOS',
  intentos: 0,
  esNueva: true,
  retroalimentacion: null,
  asignacionId: '1',
  modulo: { id: '1', nombre: 'Vocales de prueba' },
  fechaSugerida: null,
};

describe('actividad pendiente → tarea', () => {
  it('lleva el actividadId para abrirla y la vocal de Habla conmigo', () => {
    expect(toAssignment(pendiente)).toEqual({
      id: '1:8',
      activityId: '8',
      gameId: 'speak',
      vowel: 'a',
      status: 'assigned',
      isNew: true,
      title: 'Di la a',
      moduleId: '1',
      moduleTitle: 'Vocales de prueba',
      order: 0,
    });
  });

  it('sin módulo ni título (respuesta vieja) la tarea se muestra igual', () => {
    const viejo = { ...pendiente, titulo: '', modulo: null, orden: 'x' };
    const tarea = toAssignment(viejo as unknown as typeof pendiente);
    expect(tarea.moduleId).toBeUndefined();
    expect(tarea.title).toBeUndefined();
    expect(tarea.order).toBeUndefined();
    expect(tarea.activityId).toBe('8');
  });

  it('una actividad rechazada no es nueva y no lleva vocal si no es de habla', () => {
    expect(
      toAssignment({
        ...pendiente,
        actividadId: '9',
        tipoJuego: 'BUSCA_LA_BOCA',
        vocal: null,
        estado: 'RECHAZADA',
        esNueva: false,
      }),
    ).toEqual({
      id: '1:9',
      activityId: '9',
      gameId: 'findMouth',
      status: 'rejected',
      isNew: false,
      title: 'Di la a',
      moduleId: '1',
      moduleTitle: 'Vocales de prueba',
      order: 0,
    });
  });
});

describe('progreso oficial', () => {
  it('módulos dinámicos con su nombre; solo cuentan las validadas', () => {
    expect(
      toOfficialProgress({
        modulos: [
          {
            asignacionId: '1',
            modulo: { id: '1', nombre: 'Vocales de prueba' },
            estado: 'EN_CURSO',
            progreso: 28,
            validadas: 2,
            total: 7,
            pendientesValidacion: 3,
          },
        ],
        pendientesValidacion: 3,
      }),
    ).toEqual({
      modules: [
        { moduleId: '1', title: 'Vocales de prueba', validated: 2, total: 7 },
      ],
      pendingValidation: 3,
    });
  });

  it('sin módulos asignados, la lista queda vacía', () => {
    expect(
      toOfficialProgress({ modulos: [], pendientesValidacion: 0 }),
    ).toEqual({ modules: [], pendingValidation: 0 });
  });
});

describe('práctica', () => {
  it('siempre las cinco vocales en orden; las que faltan quedan en 0', () => {
    expect(
      toVowelPractice([
        { vocal: 'o', estrellas: 2 },
        { vocal: 'a', estrellas: 3 },
        { vocal: 'x', estrellas: 3 },
      ]),
    ).toEqual([
      { vowel: 'a', stars: 3 },
      { vowel: 'e', stars: 0 },
      { vowel: 'i', stars: 0 },
      { vowel: 'o', stars: 2 },
      { vowel: 'u', stars: 0 },
    ]);
  });

  it('las estrellas quedan entre 0 y 3 (no son una nota)', () => {
    expect([toStarCount(-1), toStarCount(7), toStarCount('2')]).toEqual([
      0, 3, 0,
    ]);
  });

  it('el punto de retorno de Habla conmigo', () => {
    expect(
      toResumePoint({
        puntoRetorno: { tipoJuego: 'HABLA_CONMIGO', vocal: 'e' },
      }),
    ).toEqual({ gameId: 'speak', vowel: 'e' });
    expect(toResumePoint({ puntoRetorno: null })).toBeNull();
  });
});

const intento: IntentoDto = {
  id: '40',
  asignacionId: '1',
  actividadId: '9',
  tipoJuego: 'BUSCA_LA_BOCA',
  numeroIntento: 1,
  resultado: { firstTryCorrect: 4, total: 5 },
  estrellas: 0,
  fecha: '2026-11-05T15:00:00.000Z',
  estado: 'PENDIENTE_VALIDACION',
  validacion: null,
  tieneAudio: false,
};

describe('intentos', () => {
  it('Busca la boca queda pendiente y marcada como enviada al docente', () => {
    expect(
      toListeningResult(intento, {
        studentId: '5',
        firstTryCorrect: 4,
        total: 5,
        activityId: '9',
      }),
    ).toEqual({
      id: '40',
      studentId: '5',
      gameId: 'findMouth',
      firstTryCorrect: 4,
      total: 5,
      status: 'pending_validation',
      createdAt: '2026-11-05T15:00:00.000Z',
      sentForReview: true,
    });
  });

  it('el audio solo queda si el backend lo guardó (había autorización)', () => {
    const voz: IntentoVozDto = {
      ...intento,
      tipoJuego: 'HABLA_CONMIGO',
      estadoGrabacion: 'SIN_CONSENTIMIENTO',
      grabacionGuardada: false,
      estrellasPractica: 1,
    };
    const input = {
      studentId: '5',
      vowel: 'a' as const,
      audioUri: 'file:///voz.m4a',
      activityId: '8',
    };

    expect(toSpeechAttempt(voz, input).audioUri).toBeNull();
    expect(
      toSpeechAttempt(
        { ...voz, estadoGrabacion: 'ADJUNTA', grabacionGuardada: true },
        input,
      ).audioUri,
    ).toBe('file:///voz.m4a');
  });
});

const actividad: ActividadDetalleDto = {
  id: '9',
  moduloId: '1',
  tipoJuego: { id: '6', codigo: 'BUSCA_LA_BOCA', nombre: 'Busca la boca' },
  titulo: 'Busca la boca',
  instruccionTexto: null,
  configuracion: { vocales: ['a', 'o', 'u'] },
  orden: 2,
  activa: true,
};

describe('contenido de una actividad', () => {
  it('Busca la boca juega solo las vocales de la actividad', () => {
    expect(toActivityContent(actividad)).toEqual({
      activityId: '9',
      gameId: 'findMouth',
      title: 'Busca la boca',
      vowels: ['a', 'o', 'u'],
    });
  });

  it('Habla conmigo trae su vocal', () => {
    expect(
      toActivityContent({
        ...actividad,
        id: '8',
        tipoJuego: {
          id: '5',
          codigo: 'HABLA_CONMIGO',
          nombre: 'Habla conmigo',
        },
        titulo: 'Di la a',
        configuracion: { vocal: 'a' },
      }),
    ).toEqual({
      activityId: '8',
      gameId: 'speak',
      title: 'Di la a',
      vowel: 'a',
    });
  });

  it('una configuración sin vocales válidas es un error claro', () => {
    expect(() =>
      toActivityContent({ ...actividad, configuracion: { vocales: ['z'] } }),
    ).toThrow(ServerError);
  });

  // Los juegos de «Pensar y recordar» (fase 2b) se prueban en
  // thinkingGamesMappers.test.ts.
});
