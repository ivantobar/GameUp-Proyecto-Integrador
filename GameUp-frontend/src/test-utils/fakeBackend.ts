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
import type { ActivityContent, GameId, PictureFace } from '@/data/types';
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

/** Tarjeta de la app → «cara» del backend (solo texto en el backend falso). */
const cara = (face: PictureFace) => ({
  etiqueta: face.label,
  texto: face.text ?? face.label,
});

/** Contenido de la app → `configuracion` del backend (al revés que el mapeador). */
function configuracionDe(content: ActivityContent): Record<string, unknown> {
  switch (content.gameId) {
    case 'findMouth':
      return { vocales: content.vowels };
    case 'speak':
      return { vocal: content.vowel };
    case 'match':
      return {
        rondas: content.rounds.map((r) => ({
          pregunta: r.question,
          estimulo: cara(r.prompt),
          opciones: r.options.map(cara),
          respuesta: r.options.findIndex((o) => o.id === r.answerId),
        })),
      };
    case 'classify':
      return {
        conjuntos: content.sets.map((set) => ({
          pregunta: set.question,
          grupos: set.categories.map(cara),
          elementos: set.items.map((item) => ({
            cara: cara(item),
            grupo: set.categories.findIndex((c) => c.id === item.categoryId),
          })),
        })),
      };
    case 'sequence':
      return {
        rutinas: content.routines.map((r) => ({
          titulo: r.title,
          pasos: r.steps.map(cara),
        })),
      };
    case 'memory':
      return {
        tableros: content.boards.map((b) => ({ parejas: b.pairs.map(cara) })),
      };
  }
}

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
  // «Lo practicamos hoy» queda guardado mientras dura la prueba.
  let practicadoHoy = false;

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

    if (method === 'POST' && path === '/auth/logout') return jsonResponse(204);

    // ─── Acudiente: solo su estudiante ───
    const resumen = {
      id: mockStudent.id,
      displayName: 'Martín C.',
      initials: 'MC',
    };
    if (session.role === 'guardian') {
      if (method === 'GET' && path.startsWith('/estudiantes?')) {
        return jsonResponse(200, {
          items: [resumen],
          total: 1,
          page: 1,
          limit: 50,
        });
      }
      const propio = `/estudiantes/${mockStudent.id}`;
      if (method === 'GET' && path === `${propio}/practica-semanal`) {
        return jsonResponse(200, {
          estudiante: resumen,
          hoy: '2026-11-05',
          dias: [{ fecha: '2026-11-05', practicado: practicadoHoy }],
          practicadoHoy,
        });
      }
      if (method === 'GET' && path.startsWith(`${propio}/observaciones`)) {
        return jsonResponse(200, { items: [], total: 0, page: 1, limit: 1 });
      }
      if (method === 'GET' && path === `${propio}/actividades`) {
        return jsonResponse(200, []);
      }
      if (method === 'PUT' && path === `${propio}/practica-casa/hoy`) {
        practicadoHoy = true;
        return jsonResponse(200, {});
      }
      // Otro estudiante: el backend responde 404 (no revela si existe).
      if (path.startsWith('/estudiantes/')) {
        return errorResponse(404, 'No existe');
      }
    }

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
    // ─── Tallerista ───
    if (method === 'GET' && path.startsWith('/revisiones/pendientes')) {
      if (session.role !== 'teacher' && session.role !== 'director') {
        return errorResponse(403, 'Sin permiso');
      }
      const item = (intentoId: string, extra: Record<string, unknown>) => ({
        intentoId,
        estudiante: {
          id: mockStudent.id,
          displayName: 'Martín C.',
          initials: 'MC',
        },
        modulo: { id: '1', nombre: 'Vocales' },
        fecha: '2026-11-05T15:00:00.000Z',
        numeroIntento: 1,
        pendientesMismaActividad: 1,
        ...extra,
      });
      return jsonResponse(200, {
        items: [
          item('41', {
            tipo: 'VOZ',
            tipoJuego: 'HABLA_CONMIGO',
            actividad: { id: '1', titulo: 'Di la a', vocal: 'a' },
            resultado: { estadoGrabacion: 'NO_VERIFICABLE' },
            consentimientoVoz: false,
            grabacion: null,
          }),
          item('42', {
            tipo: 'JUEGO',
            tipoJuego: 'BUSCA_LA_BOCA',
            actividad: { id: '3', titulo: 'Busca la boca', vocal: null },
            resultado: { firstTryCorrect: 4, total: 5 },
            consentimientoVoz: null,
            grabacion: null,
          }),
        ],
        total: 2,
        page: 1,
        limit: 50,
      });
    }
    if (method === 'POST' && /^\/intentos\/[\w-]+\/validacion$/.test(path)) {
      return jsonResponse(201, intentoGuardado('validado', 'HABLA_CONMIGO'));
    }
    if (
      method === 'POST' &&
      /^\/estudiantes\/[\w-]+\/observaciones$/.test(path)
    ) {
      return jsonResponse(201, { id: '7' });
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
        configuracion: configuracionDe(content),
        orden: 0,
        activa: true,
      });
    }
    if (method === 'POST' && path === '/intentos') {
      const { actividadId } = body as { actividadId: string };
      const content = mockActivities[actividadId];
      return jsonResponse(
        201,
        intentoGuardado(
          actividadId,
          content ? CODIGOS[content.gameId] : 'BUSCA_LA_BOCA',
        ),
      );
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
