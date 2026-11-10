import {
  MOCK_PASSWORD,
  mockAccounts,
  mockActivities,
  mockAssignments,
  mockOfficialProgress,
  mockResumePoint,
  mockModules,
  mockStudent,
  mockStudentAssignments,
  mockStudentSummaries,
  mockTeacher,
  mockTeacherLinks,
  mockTeachers,
  mockVowelPractice,
} from '@/data/mock/fixtures';
import { bogotaToday } from '@/data/bogotaDate';
import { ladderContent } from '@/data/mock/ladderContent';
import {
  LADDER_GAMES,
  type ActivityContent,
  type GameId,
  type LadderGameId,
  type PictureFace,
  type StudentAssignment,
} from '@/data/types';
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

/** `escalera-memory-2` → juego y nivel (actividad de la escalera). */
function deEscalera(actividadId: string) {
  const m = /^escalera-(\w+)-([1-5])$/.exec(actividadId);
  const gameId = m?.[1] as LadderGameId | undefined;
  return m && gameId && LADDER_GAMES.includes(gameId)
    ? { gameId, nivel: Number(m[2]) }
    : null;
}

/** Actividad como la devuelve `GET /actividades/:id`. */
function actividadDto(content: ActivityContent, nivelJuego: number | null) {
  return {
    id: content.activityId,
    moduloId: nivelJuego === null ? '1' : '90',
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
    nivelJuego,
  };
}

/** Un intento recién guardado, como lo devuelve el backend. */
function intentoGuardado(actividadId: string, tipoJuego: string) {
  return {
    id: `int-${actividadId}`,
    asignacionId: deEscalera(actividadId) ? null : '1',
    nivelJuego: deEscalera(actividadId)?.nivel ?? null,
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

const ESTADOS_ASIGNACION = {
  assigned: 'ASIGNADO',
  inProgress: 'EN_CURSO',
  completed: 'COMPLETADO',
} as const;

/** Estudiante como lo devuelve `GET /estudiantes` (EstudianteResumenDto). */
function estudianteDto(id: string) {
  const resumen = mockStudentSummaries[id];
  return {
    id,
    displayName: resumen?.displayName ?? 'Estudiante',
    initials: resumen?.initials ?? 'ES',
    nivel: { id: '1', nombre: 'BAJO' },
    estado: 'ACTIVO',
  };
}

/** Asignación como la devuelve `GET /asignaciones` (AsignacionDto). */
function asignacionDto(estudianteId: string, a: StudentAssignment) {
  const resumen = estudianteDto(estudianteId);
  return {
    id: a.id,
    modulo: { id: a.moduleId, nombre: a.moduleTitle },
    estudiante: {
      id: estudianteId,
      displayName: resumen.displayName,
      initials: resumen.initials,
    },
    asignadoPor: { id: '3', displayName: 'Profe Laura' },
    fechaAsignacion: '2026-11-05T15:00:00.000Z',
    fechaSugerida: a.suggestedDate,
    estado: ESTADOS_ASIGNACION[a.state],
    progreso: a.progress,
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
  // Nivel del estudiante en cada juego de la escalera (empieza en 1).
  const niveles = new Map<LadderGameId, number>();
  const nivelDe = (gameId: LadderGameId) => niveles.get(gameId) ?? 1;
  const nivelesDto = () =>
    LADDER_GAMES.map((gameId) => ({
      juego: CODIGOS[gameId],
      nombre: gameId,
      nivelActual: nivelDe(gameId),
      nivelMaximo: 5,
      completado: false,
      pendientesValidacion: 0,
      actualizadoEn: '2026-11-06T15:00:00.000Z',
    }));

  // Asignaciones de cada estudiante (copia: cada prueba empieza igual).
  const asignaciones: Record<string, StudentAssignment[]> = JSON.parse(
    JSON.stringify(mockStudentAssignments),
  ) as Record<string, StudentAssignment[]>;
  let siguienteAsignacion = 500;
  // Quién tiene a cargo a cada estudiante (la directora lo cambia).
  const vinculos = mockTeacherLinks.map((l) => ({ ...l }));
  const talleristaDto = (l: (typeof vinculos)[number]) => ({
    talleristaId: l.teacherId,
    displayName:
      mockTeachers.find((t) => t.id === l.teacherId)?.displayName ?? '',
    fechaInicio: l.since,
    activo: l.active,
  });

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
      if (method === 'GET' && path === `${propio}/niveles-juego`) {
        return jsonResponse(200, nivelesDto());
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

    // ─── Tallerista y directora: estudiantes, módulos y asignaciones ───
    const esPersonal =
      session.role === 'teacher' || session.role === 'director';
    const visibles =
      session.role === 'director'
        ? Object.keys(mockStudentSummaries)
        : vinculos
            .filter((l) => l.teacherId === mockTeacher.id && l.active)
            .map((l) => l.studentId);
    const [ruta, consulta = ''] = path.split('?');
    const params = new URLSearchParams(consulta);

    if (ruta === '/modulos' || ruta?.startsWith('/asignaciones')) {
      // Solo DIRECTORA y TALLERISTA crean, quitan o listan módulos.
      if (!esPersonal && !(method === 'GET' && ruta === '/asignaciones')) {
        return errorResponse(403, 'Sin permiso');
      }
    }
    if (esPersonal && method === 'GET' && ruta === '/estudiantes') {
      const page = Number(params.get('page') ?? '1');
      const limit = Number(params.get('limit') ?? '20');
      const items = visibles.slice((page - 1) * limit, page * limit);
      return jsonResponse(200, {
        items: items.map(estudianteDto),
        total: visibles.length,
        page,
        limit,
      });
    }
    // ─── Talleristas de un estudiante y lista de usuarios: solo DIRECTORA ───
    const aCargo = /^\/estudiantes\/([\w-]+)\/talleristas(?:\/([\w-]+))?$/.exec(
      ruta ?? '',
    );
    if (aCargo || ruta === '/usuarios') {
      if (session.role !== 'director') return errorResponse(403, 'Sin permiso');
    }
    if (method === 'GET' && ruta === '/usuarios') {
      const rol = params.get('rol');
      const activo = params.get('activo');
      const page = Number(params.get('page') ?? '1');
      const limit = Number(params.get('limit') ?? '20');
      const todos = mockTeachers
        .filter(() => rol === null || rol === 'TALLERISTA')
        .filter((t) => activo === null || String(t.active) === activo);
      return jsonResponse(200, {
        items: todos.slice((page - 1) * limit, page * limit).map((t) => {
          const [nombres = '', ...apellidos] = t.displayName.split(' ');
          return {
            id: t.id,
            idUsuarioAuth: `auth-${t.id}`,
            rol: 'TALLERISTA',
            nombres,
            apellidos: apellidos.join(' '),
            correo: null,
            activo: t.active,
            idAcudienteExterno: null,
            estudiante: null,
            creadoEn: '2026-01-15T12:00:00.000Z',
            ultimoAcceso: null,
            sincronizadoEn: null,
          };
        }),
        total: todos.length,
        page,
        limit,
      });
    }
    if (aCargo) {
      const estudianteId = aCargo[1] ?? '';
      const talleristaId = aCargo[2];
      if (!(estudianteId in mockStudentSummaries)) {
        return errorResponse(404, 'El estudiante no existe');
      }
      const delEstudiante = vinculos.filter(
        (l) => l.studentId === estudianteId,
      );
      if (method === 'GET' && !talleristaId) {
        return jsonResponse(200, delEstudiante.map(talleristaDto));
      }
      if (method === 'POST' && !talleristaId) {
        const id = (body as { talleristaId: string }).talleristaId;
        if (!mockTeachers.some((t) => t.id === id && t.active)) {
          return errorResponse(422, 'La cuenta no es de una tallerista activa');
        }
        const antes = delEstudiante.find((l) => l.teacherId === id);
        if (antes?.active) {
          return errorResponse(409, 'La tallerista ya lo tiene a cargo');
        }
        const vinculo = antes ?? {
          studentId: estudianteId,
          teacherId: id,
          since: bogotaToday(),
          active: true,
        };
        vinculo.since = bogotaToday();
        vinculo.active = true;
        if (!antes) vinculos.push(vinculo);
        return jsonResponse(201, talleristaDto(vinculo));
      }
      if (method === 'DELETE' && talleristaId) {
        const vinculo = delEstudiante.find(
          (l) => l.teacherId === talleristaId && l.active,
        );
        if (!vinculo) return errorResponse(404, 'No lo tiene a cargo');
        vinculo.active = false;
        return jsonResponse(204);
      }
    }

    const ficha = /^\/estudiantes\/([\w-]+)(\/progreso)?$/.exec(ruta ?? '');
    if (esPersonal && method === 'GET' && ficha && ficha[1] !== 'me') {
      const id = ficha[1] ?? '';
      if (!visibles.includes(id)) return errorResponse(404, 'No existe');
      if (!ficha[2]) {
        return jsonResponse(200, {
          ...estudianteDto(id),
          nombres: 'Nombre',
          apellidos: 'Ficticio',
          fechaIngreso: '2026-02-03',
          personajeAvatar: null,
          cuentaActiva: true,
        });
      }
      const modulos = (asignaciones[id] ?? []).map((a) => {
        const total =
          mockModules.find((m) => m.id === a.moduleId)?.activities ?? 0;
        return {
          asignacionId: a.id,
          modulo: { id: a.moduleId, nombre: a.moduleTitle },
          estado: ESTADOS_ASIGNACION[a.state],
          progreso: a.progress,
          validadas: Math.round((a.progress / 100) * total),
          total,
          pendientesValidacion: 0,
        };
      });
      return jsonResponse(200, { modulos, pendientesValidacion: 0 });
    }
    if (esPersonal && method === 'GET' && ruta === '/modulos') {
      const soloPublicados = params.get('publicado') === 'true';
      const items = mockModules
        .filter((m) => !soloPublicados || m.published)
        .map((m, orden) => ({
          id: m.id,
          nombre: m.title,
          descripcion: m.description,
          categoria: { id: '1', nombre: m.category },
          nivel: { id: '1', nombre: 'BAJO' },
          creadoPor: { id: '1', displayName: 'Directora' },
          musicaId: null,
          portadaContenidoId: null,
          publicado: m.published,
          orden,
          creadoEn: '2026-11-01T15:00:00.000Z',
        }));
      return jsonResponse(200, {
        items,
        total: items.length,
        page: 1,
        limit: 50,
      });
    }
    if (esPersonal && method === 'GET' && ruta === '/asignaciones') {
      const id = params.get('estudianteId');
      const estado = params.get('estado');
      const ids = id ? [id] : visibles;
      const items = ids
        .filter((e) => visibles.includes(e))
        .flatMap((e) => (asignaciones[e] ?? []).map((a) => asignacionDto(e, a)))
        .filter((a) => !estado || a.estado === estado);
      return jsonResponse(200, {
        items,
        total: items.length,
        page: 1,
        limit: 50,
      });
    }
    if (esPersonal && method === 'POST' && ruta === '/asignaciones') {
      const { moduloId, estudianteId, fechaSugerida } = body as {
        moduloId?: string;
        estudianteId?: string;
        fechaSugerida?: string;
      };
      if (!moduloId || !estudianteId) {
        return errorResponse(400, 'Faltan datos');
      }
      if (
        fechaSugerida !== undefined &&
        !/^\d{4}-\d{2}-\d{2}$/.test(fechaSugerida)
      ) {
        return errorResponse(
          400,
          'fechaSugerida debe tener el formato AAAA-MM-DD',
        );
      }
      if (!visibles.includes(estudianteId)) {
        return errorResponse(404, 'El estudiante no existe');
      }
      const modulo = mockModules.find((m) => m.id === moduloId);
      if (!modulo || !modulo.published) {
        return errorResponse(422, 'Módulo sin publicar o inexistente');
      }
      if (fechaSugerida !== undefined && fechaSugerida < bogotaToday()) {
        return errorResponse(422, 'La fecha sugerida ya pasó');
      }
      const lista = asignaciones[estudianteId] ?? [];
      asignaciones[estudianteId] = lista;
      if (
        lista.some((a) => a.moduleId === moduloId && a.state !== 'completed')
      ) {
        return errorResponse(409, 'Ya tiene ese módulo asignado sin completar');
      }
      siguienteAsignacion += 1;
      const nueva: StudentAssignment = {
        id: String(siguienteAsignacion),
        moduleId: moduloId,
        moduleTitle: modulo.title,
        state: 'assigned',
        progress: 0,
        suggestedDate: fechaSugerida ?? null,
      };
      lista.push(nueva);
      return jsonResponse(201, asignacionDto(estudianteId, nueva));
    }
    const quitar = /^\/asignaciones\/([\w-]+)$/.exec(ruta ?? '');
    if (esPersonal && method === 'DELETE' && quitar) {
      const id = quitar[1];
      const duenio = visibles.find((e) =>
        (asignaciones[e] ?? []).some((a) => a.id === id),
      );
      if (!duenio) return errorResponse(404, 'No existe');
      const lista = asignaciones[duenio] ?? [];
      const objetivo = lista.find((a) => a.id === id);
      if (!objetivo || objetivo.state !== 'assigned' || objetivo.progress > 0) {
        return errorResponse(409, 'El estudiante ya hizo intentos');
      }
      asignaciones[duenio] = lista.filter((a) => a.id !== id);
      return jsonResponse(204);
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
    if (method === 'GET' && path === '/revisiones/pendientes/resumen') {
      if (session.role !== 'teacher' && session.role !== 'director') {
        return errorResponse(403, 'Sin permiso');
      }
      // Los mismos dos intentos de la bandeja, contados por estudiante.
      return jsonResponse(200, [
        {
          estudianteId: mockStudent.id,
          nombre: 'Martín C.',
          iniciales: 'MC',
          pendientes: 2,
          masAntiguo: '2026-11-05T15:00:00.000Z',
        },
      ]);
    }
    if (method === 'GET' && path.startsWith('/revisiones/pendientes')) {
      if (session.role !== 'teacher' && session.role !== 'director') {
        return errorResponse(403, 'Sin permiso');
      }
      // Como el backend: otro estudiante (o uno ajeno) → lista vacía.
      const estudianteId = new URLSearchParams(path.split('?')[1] ?? '').get(
        'estudianteId',
      );
      if (estudianteId !== null && estudianteId !== mockStudent.id) {
        return jsonResponse(200, { items: [], total: 0, page: 1, limit: 50 });
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
      // Aprobar el nivel actual de la escalera lo sube (como el backend).
      const intentoId = path.split('/')[2] ?? '';
      const escalera = deEscalera(intentoId.replace(/^int-/, ''));
      const aprobado =
        (body as { resultado?: string }).resultado === 'APROBADO';
      let subidaNivel = null;
      if (escalera && aprobado && escalera.nivel === nivelDe(escalera.gameId)) {
        const nuevo = Math.min(5, escalera.nivel + 1);
        niveles.set(escalera.gameId, nuevo);
        subidaNivel = {
          intentoId,
          juego: CODIGOS[escalera.gameId],
          nivelAnterior: escalera.nivel,
          nivelNuevo: nuevo,
          completado: escalera.nivel === 5,
        };
      }
      return jsonResponse(201, {
        ...intentoGuardado('validado', 'HABLA_CONMIGO'),
        subidaNivel,
      });
    }
    if (
      method === 'GET' &&
      /^\/estudiantes\/[\w-]+\/niveles-juego$/.test(path) &&
      !path.startsWith('/estudiantes/me/')
    ) {
      if (session.role !== 'teacher' && session.role !== 'director') {
        return errorResponse(403, 'Sin permiso');
      }
      return path === `/estudiantes/${mockStudent.id}/niveles-juego`
        ? jsonResponse(200, nivelesDto())
        : errorResponse(404, 'El estudiante no existe');
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
    if (method === 'GET' && path === '/estudiantes/me/niveles-juego') {
      return jsonResponse(200, nivelesDto());
    }
    const nivelJuego =
      /^\/estudiantes\/me\/niveles-juego\/(\w+)\/actividad$/.exec(path);
    if (method === 'GET' && nivelJuego) {
      const gameId = LADDER_GAMES.find((g) => CODIGOS[g] === nivelJuego[1]);
      if (!gameId) return errorResponse(404, 'Ese juego no tiene escalera');
      const nivel = nivelDe(gameId);
      return jsonResponse(200, {
        nivel: nivelesDto().find((n) => n.juego === CODIGOS[gameId]),
        actividad: actividadDto(ladderContent(gameId, nivel), nivel),
      });
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
      const escalera = deEscalera(actividad[1] ?? '');
      if (escalera) {
        return jsonResponse(
          200,
          actividadDto(
            ladderContent(escalera.gameId, escalera.nivel),
            escalera.nivel,
          ),
        );
      }
      const content = mockActivities[actividad[1] ?? ''];
      if (!content) return errorResponse(404, 'La actividad no existe');
      return jsonResponse(200, actividadDto(content, null));
    }
    if (method === 'POST' && path === '/intentos') {
      const { actividadId } = body as { actividadId: string };
      const escalera = deEscalera(actividadId);
      if (escalera) {
        // Como el backend: solo el nivel actual.
        if (escalera.nivel !== nivelDe(escalera.gameId)) {
          return errorResponse(422, 'Esa actividad no es de tu nivel actual');
        }
        return jsonResponse(
          201,
          intentoGuardado(actividadId, CODIGOS[escalera.gameId]),
        );
      }
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
