import {
  MOCK_PASSWORD,
  mockAccounts,
  mockActivities,
  mockAssignments,
  mockOfficialProgress,
  mockResumePoint,
  mockStudent,
  mockVowelPractice,
} from '@/data/mock/fixtures';
import type { GameId } from '@/data/types';
import { createFakeFetch, errorResponse, jsonResponse } from './fakeFetch';

export const FAKE_API_URL = 'http://api.prueba/api/v1';

/** Juego de la app → código del backend (al revés que el mapeador). */
const CODIGOS: Record<GameId, string> = {
  match: 'EMPAREJAR',
  classify: 'CLASIFICAR',
  sequence: 'SECUENCIAR',
  memory: 'MEMORIA',
  speak: 'HABLA_CONMIGO',
  findMouth: 'BUSCA_LA_BOCA',
};

/** Un intento recién guardado, como lo devuelve el backend. */
function intentoGuardado(actividadId: string, tipoJuego: string) {
  return {
    id: `int-${actividadId}`,
    asignacionId: '1',
    actividadId,
    tipoJuego,
    numeroIntento: 1,
    resultado: {},
    estrellas: 0,
    fecha: '2026-11-05T15:00:00.000Z',
    estado: 'PENDIENTE_VALIDACION',
    validacion: null,
    tieneAudio: false,
  };
}

/**
 * Backend GameUP falso, con las mismas cuentas ficticias que los datos
 * simulados. Sirve para comprobar que la versión HTTP y la simulada se
 * comportan igual ante la misma interfaz. Solo responde las rutas que la
 * app ya usa.
 */
export function createFakeBackend() {
  const tokenOf = (email: string) => `token-de-prueba:${email}`;

  return createFakeFetch(({ url, method, headers, body }) => {
    const path = url.replace(FAKE_API_URL, '');
    const auth = headers.Authorization ?? '';
    const email = auth.startsWith('Bearer token-de-prueba:')
      ? auth.slice('Bearer token-de-prueba:'.length)
      : null;
    const session = email ? mockAccounts[email] : undefined;

    if (method === 'POST' && path === '/auth/login') {
      const { correo, contrasena } = body as {
        correo: string;
        contrasena: string;
      };
      const account = mockAccounts[correo];
      if (!account || contrasena !== MOCK_PASSWORD) {
        return errorResponse(401, 'Correo o contraseña incorrectos');
      }
      return jsonResponse(200, {
        token: tokenOf(correo),
        expiraEn: null,
        usuario: account,
      });
    }

    if (!session) return errorResponse(401, 'Sesión no válida');

    if (method === 'GET' && path === '/auth/me') {
      return jsonResponse(200, session);
    }
    if (method === 'GET' && path === '/estudiantes/me') {
      if (session.role !== 'student') return errorResponse(403, 'Sin permiso');
      return jsonResponse(200, {
        id: session.userId,
        displayName: mockStudent.displayName,
        personajeAvatar: null,
        nivel: { id: '1', nombre: 'BAJO' },
      });
    }
    if (path.startsWith('/estudiantes/me/') && session.role !== 'student') {
      return errorResponse(403, 'Sin permiso');
    }
    if (method === 'GET' && path === '/estudiantes/me/practica-vocales') {
      return jsonResponse(
        200,
        mockVowelPractice.map((v) => ({ vocal: v.vowel, estrellas: v.stars })),
      );
    }
    if (method === 'GET' && path === '/estudiantes/me/punto-retorno') {
      return jsonResponse(200, {
        puntoRetorno: {
          tipoJuego: 'HABLA_CONMIGO',
          vocal: mockResumePoint.vowel,
        },
      });
    }
    if (method === 'GET' && path === '/estudiantes/me/actividades-pendientes') {
      return jsonResponse(
        200,
        mockAssignments.map((a, i) => ({
          actividadId: a.activityId,
          titulo: `Actividad ${i + 1}`,
          tipoJuego: CODIGOS[a.gameId],
          orden: i,
          vocal: a.vowel ?? null,
          estado: 'SIN_INTENTOS',
          intentos: 0,
          esNueva: a.isNew,
          retroalimentacion: null,
          asignacionId: '1',
          modulo: { id: '1', nombre: 'Vocales' },
          fechaSugerida: null,
        })),
      );
    }
    if (method === 'GET' && path === '/estudiantes/me/progreso') {
      return jsonResponse(200, {
        modulos: mockOfficialProgress.modules.map((m, i) => ({
          asignacionId: String(i + 1),
          modulo: { id: m.moduleId, nombre: m.title },
          estado: 'EN_CURSO',
          progreso: 0,
          validadas: m.validated,
          total: m.total,
          pendientesValidacion: 0,
        })),
        pendientesValidacion: mockOfficialProgress.pendingValidation,
      });
    }
    if (method === 'GET' && path === '/estudiantes/me/consentimiento-voz') {
      return jsonResponse(200, {
        concedido: true,
        motivo: 'CONCEDIDO',
        verificadoEn: '2026-11-05T15:00:00.000Z',
      });
    }
    const actividad = /^\/actividades\/([\w-]+)$/.exec(path);
    if (method === 'GET' && actividad) {
      const content = mockActivities[actividad[1] ?? ''];
      if (!content) return errorResponse(404, 'La actividad no existe');
      return jsonResponse(200, {
        id: content.activityId,
        moduloId: '1',
        tipoJuego: {
          id: '1',
          codigo: CODIGOS[content.gameId],
          nombre: content.title,
        },
        titulo: content.title,
        instruccionTexto: null,
        configuracion:
          content.gameId === 'findMouth'
            ? { vocales: content.vowels }
            : { vocal: content.vowel },
        orden: 0,
        activa: true,
      });
    }
    if (method === 'POST' && path === '/intentos') {
      const { actividadId } = body as { actividadId: string };
      return jsonResponse(201, intentoGuardado(actividadId, 'BUSCA_LA_BOCA'));
    }
    if (method === 'POST' && path === '/intentos/habla-conmigo') {
      return jsonResponse(201, {
        ...intentoGuardado('voz', 'HABLA_CONMIGO'),
        estadoGrabacion: 'NO_ENVIADA',
        grabacionGuardada: false,
        estrellasPractica: 1,
      });
    }
    return errorResponse(404, 'Ruta no encontrada');
  });
}
