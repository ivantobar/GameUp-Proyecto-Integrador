import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  AccesoDenegadoError,
  ConflictoError,
  RecursoNoEncontradoError,
} from '../../../common/errors/dominio.errors.js';
import {
  esJuegoConEscalera,
  type JuegoConEscalera,
} from '../../catalogo/domain/juegos/niveles-juego.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import type { Actividad } from '../../modulos/domain/modulo.entity.js';
import {
  ACTIVIDAD_REPOSITORY,
  type ActividadRepository,
} from '../../modulos/domain/modulo.repository.js';
import {
  ajusteManual,
  normalizarMotivo,
  type NivelJuego,
} from '../domain/nivel-juego.js';
import {
  NIVEL_JUEGO_REPOSITORY,
  type NivelJuegoRepository,
} from '../domain/nivel-juego.repository.js';

export const MENSAJE_JUEGO_SIN_ESCALERA =
  'Ese juego no tiene escalera de niveles.';

/** Nivel de un juego con lo que espera validación en ese nivel. */
export interface NivelConPendientes extends NivelJuego {
  /** Intentos del nivel actual que esperan a la tallerista (no suben solos). */
  pendientesValidacion: number;
}

export interface ActividadDelNivel {
  nivel: NivelConPendientes;
  actividad: Actividad;
}

/** Código de la ruta (EMPAREJAR…) → juego con escalera, o 404. */
export function juegoConEscalera(codigo: string): JuegoConEscalera {
  if (!esJuegoConEscalera(codigo)) {
    throw new RecursoNoEncontradoError(MENSAJE_JUEGO_SIN_ESCALERA);
  }
  return codigo;
}

/**
 * Escalera de niveles por juego (fase 9). Subir de nivel lo hace la
 * validación (ValidacionService, en su misma transacción); aquí se consulta
 * el nivel, se entrega la actividad del nivel actual y se ajusta a mano.
 */
@Injectable()
export class NivelJuegoService {
  constructor(
    @Inject(NIVEL_JUEGO_REPOSITORY)
    private readonly repo: NivelJuegoRepository,
    @Inject(ACTIVIDAD_REPOSITORY)
    private readonly actividades: ActividadRepository,
    private readonly acceso: AccesoEstudianteService,
  ) {}

  /** Directora, tallerista a cargo, acudiente o el propio estudiante (si no, 404). */
  async niveles(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
  ): Promise<NivelConPendientes[]> {
    await this.acceso.verificar(actual, estudianteId);
    return this.conPendientes(estudianteId);
  }

  /**
   * La actividad del nivel actual del estudiante con sesión en ese juego (si
   * completó el 5, la del 5). El módulo de la escalera no se publica ni se
   * asigna: aquí no hace falta.
   */
  async actividadActual(
    actual: UsuarioAutenticado,
    codigo: string,
  ): Promise<ActividadDelNivel> {
    if (actual.rol !== 'ESTUDIANTE') {
      throw new AccesoDenegadoError(
        'Solo el estudiante abre su nivel de cada juego.',
      );
    }
    const juego = juegoConEscalera(codigo);
    const nivel = (await this.conPendientes(actual.id)).find(
      (n) => n.juego === juego,
    );
    const id = nivel
      ? await this.repo.actividadDelNivel(juego, nivel.nivelActual)
      : null;
    const actividad =
      id === null ? null : await this.actividades.buscarPorId(id);
    if (!nivel || !actividad?.activa) {
      throw new RecursoNoEncontradoError(
        'Este nivel todavía no tiene una actividad.',
      );
    }
    return { nivel, actividad };
  }

  /**
   * Ajuste manual (directora o tallerista a cargo; si no, 404). Motivo
   * obligatorio; queda en el historial. No avisa al acudiente.
   */
  async ajustar(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
    codigo: string,
    nivel: number,
    motivo: string,
  ): Promise<NivelConPendientes> {
    if (actual.rol !== 'DIRECTORA' && actual.rol !== 'TALLERISTA') {
      throw new AccesoDenegadoError(
        'Solo la directora o la tallerista a cargo cambian el nivel.',
      );
    }
    await this.acceso.verificar(actual, estudianteId);
    const juego = juegoConEscalera(codigo);
    const texto = normalizarMotivo(motivo);
    const estado = (await this.repo.delEstudiante(estudianteId)).find(
      (n) => n.juego === juego,
    );
    if (!estado) throw new RecursoNoEncontradoError(MENSAJE_JUEGO_SIN_ESCALERA);
    const cambio = ajusteManual(estado, nivel);
    const nuevo = await this.repo.ajustar(
      estudianteId,
      juego,
      cambio,
      actual.id,
      texto,
    );
    if (!nuevo) {
      throw new ConflictoError(
        'El nivel cambió mientras tanto (quizá por una validación). Vuelve a cargarlo.',
      );
    }
    const pendientes = await this.repo.pendientesPorJuego(estudianteId);
    return { ...nuevo, pendientesValidacion: pendientes.get(juego) ?? 0 };
  }

  private async conPendientes(
    estudianteId: bigint,
  ): Promise<NivelConPendientes[]> {
    const [niveles, pendientes] = await Promise.all([
      this.repo.delEstudiante(estudianteId),
      this.repo.pendientesPorJuego(estudianteId),
    ]);
    return niveles.map((n) => ({
      ...n,
      pendientesValidacion: pendientes.get(n.juego) ?? 0,
    }));
  }
}
