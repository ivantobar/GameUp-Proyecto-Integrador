import type { JuegoConEscalera } from '../../catalogo/domain/juegos/niveles-juego.js';
import type { CambioNivel, NivelJuego } from './nivel-juego.js';

/** Nivel por juego de los estudiantes (subir de nivel lo hace la validación). */
export interface NivelJuegoRepository {
  /** Los 4 juegos del estudiante (la base los crea en el nivel 1). */
  delEstudiante(estudianteId: bigint): Promise<NivelJuego[]>;
  /** Intentos de la escalera sin validar en el nivel ACTUAL de cada juego. */
  pendientesPorJuego(
    estudianteId: bigint,
  ): Promise<Map<JuegoConEscalera, number>>;
  /** Id de la actividad activa de ese juego y nivel, o null si falta. */
  actividadDelNivel(
    juego: JuegoConEscalera,
    nivel: number,
  ): Promise<bigint | null>;
  /**
   * Ajuste manual con su historial (origen AJUSTE), en una transacción. Solo
   * aplica si el nivel sigue igual que cuando se leyó; si cambió entre tanto,
   * devuelve null y no cambia nada.
   */
  ajustar(
    estudianteId: bigint,
    juego: JuegoConEscalera,
    cambio: CambioNivel,
    cambiadoPor: bigint,
    motivo: string,
  ): Promise<NivelJuego | null>;
}

export const NIVEL_JUEGO_REPOSITORY = Symbol('NIVEL_JUEGO_REPOSITORY');
