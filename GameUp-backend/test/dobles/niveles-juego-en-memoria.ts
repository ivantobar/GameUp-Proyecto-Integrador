import {
  JUEGOS_CON_ESCALERA,
  esJuegoConEscalera,
  type JuegoConEscalera,
} from '../../src/modules/catalogo/domain/juegos/niveles-juego.js';
import {
  mensajeSubida,
  subidaPorAprobacion,
  type CambioNivel,
  type NivelJuego,
  type SubidaNivel,
} from '../../src/modules/niveles-juego/domain/nivel-juego.js';
import type { NivelJuegoRepository } from '../../src/modules/niveles-juego/domain/nivel-juego.repository.js';
import { AHORA_PRUEBA, type ModulosEnMemoria } from './modulos-en-memoria.js';
import type { UsuariosEnMemoria } from './usuarios-en-memoria.js';

const NOMBRES: Record<JuegoConEscalera, string> = {
  EMPAREJAR: 'Emparejar',
  CLASIFICAR: 'Clasificar',
  SECUENCIAR: 'Secuenciar',
  MEMORIA: 'Memoria',
};

/** Un intento de la escalera, como lo guardan los dobles de intentos. */
export interface IntentoDeEscalera {
  id?: bigint;
  asignacionId: bigint | null;
  estudianteId?: bigint;
  actividadId: bigint;
  validacion: { resultado: 'APROBADO' | 'RECHAZADO' } | null;
}

/**
 * Nivel por juego en memoria (pruebas). Simula la tabla
 * nivel_juego_estudiante (todo estudiante empieza en el nivel 1), el
 * historial, el aviso NIVEL_JUEGO y subirSiCorresponde de la validación,
 * con la MISMA regla del dominio (subidaPorAprobacion).
 */
export class NivelesJuegoEnMemoria implements NivelJuegoRepository {
  private readonly estado = new Map<
    string,
    { nivelActual: number; completado: boolean; actualizadoEn: Date }
  >();
  readonly historial: Array<
    CambioNivel & {
      estudianteId: bigint;
      juego: JuegoConEscalera;
      origen: 'VALIDACION' | 'AJUSTE';
      intentoId: bigint | null;
      cambiadoPor: bigint;
      motivo: string | null;
    }
  > = [];
  /** Avisos a los acudientes (fn_notificar_acudientes con NIVEL_JUEGO). */
  readonly avisos: Array<{ estudianteId: bigint; mensaje: string }> = [];

  constructor(
    private readonly modulos: ModulosEnMemoria,
    private readonly usuarios: UsuariosEnMemoria,
    /** Las filas de intentos compartidas con los demás dobles. */
    private readonly intentos: () => IntentoDeEscalera[],
  ) {}

  private clave(estudianteId: bigint, juego: JuegoConEscalera) {
    return `${estudianteId}:${juego}`;
  }

  private leer(estudianteId: bigint, juego: JuegoConEscalera) {
    return (
      this.estado.get(this.clave(estudianteId, juego)) ?? {
        nivelActual: 1,
        completado: false,
        actualizadoEn: AHORA_PRUEBA,
      }
    );
  }

  /** Para preparar escenarios (no deja historial). */
  poner(
    estudianteId: bigint,
    juego: JuegoConEscalera,
    nivelActual: number,
    completado = false,
  ): void {
    this.estado.set(this.clave(estudianteId, juego), {
      nivelActual,
      completado,
      actualizadoEn: AHORA_PRUEBA,
    });
  }

  nivelDe(estudianteId: bigint, juego: JuegoConEscalera): NivelJuego {
    return {
      estudianteId,
      juego,
      nombreJuego: NOMBRES[juego],
      ...this.leer(estudianteId, juego),
    };
  }

  /** Nivel de la escalera de una actividad, o null si es de un módulo. */
  nivelDeActividad(actividadId: bigint) {
    const a = this.modulos.actividades.find((x) => x.id === actividadId);
    if (!a || a.nivelJuego === null || !esJuegoConEscalera(a.tipoJuego.codigo))
      return null;
    return { juego: a.tipoJuego.codigo, nivel: a.nivelJuego };
  }

  async delEstudiante(estudianteId: bigint): Promise<NivelJuego[]> {
    return JUEGOS_CON_ESCALERA.map((j) => this.nivelDe(estudianteId, j));
  }

  async pendientesPorJuego(estudianteId: bigint) {
    const conteo = new Map<JuegoConEscalera, number>();
    for (const f of this.intentos()) {
      const n = this.nivelDeActividad(f.actividadId);
      if (
        f.asignacionId !== null ||
        f.estudianteId !== estudianteId ||
        f.validacion ||
        !n ||
        n.nivel !== this.leer(estudianteId, n.juego).nivelActual
      )
        continue;
      conteo.set(n.juego, (conteo.get(n.juego) ?? 0) + 1);
    }
    return conteo;
  }

  async actividadDelNivel(juego: JuegoConEscalera, nivel: number) {
    const a = this.modulos.actividades.find(
      (x) =>
        x.tipoJuego.codigo === juego &&
        x.nivelJuego === nivel &&
        x.activa &&
        this.modulos.modulos.find((m) => m.id === x.moduloId)?.esEscalera,
    );
    return a?.id ?? null;
  }

  async ajustar(
    estudianteId: bigint,
    juego: JuegoConEscalera,
    cambio: CambioNivel,
    cambiadoPor: bigint,
    motivo: string,
  ): Promise<NivelJuego | null> {
    if (!this.aplicar(estudianteId, juego, cambio)) return null;
    this.historial.push({
      ...cambio,
      estudianteId,
      juego,
      origen: 'AJUSTE',
      intentoId: null,
      cambiadoPor,
      motivo,
    });
    return this.nivelDe(estudianteId, juego);
  }

  /** Como subirSiCorresponde (dentro de la validación APROBADA). */
  subirSiCorresponde(
    f: IntentoDeEscalera,
    estudianteId: bigint,
    validadorId: bigint,
  ): SubidaNivel | null {
    const n = this.nivelDeActividad(f.actividadId);
    if (f.asignacionId !== null || !n) return null;
    if (this.historial.some((h) => h.intentoId === f.id)) {
      throw new Error('uq_histnivjuego_intento'); // un intento sube una vez
    }
    const cambio = subidaPorAprobacion(
      this.leer(estudianteId, n.juego),
      n.nivel,
    );
    if (!cambio || !this.aplicar(estudianteId, n.juego, cambio)) return null;
    this.historial.push({
      ...cambio,
      estudianteId,
      juego: n.juego,
      origen: 'VALIDACION',
      intentoId: f.id!,
      cambiadoPor: validadorId,
      motivo: null,
    });
    const nombre =
      this.usuarios.todos().find((u) => u.id === estudianteId)?.nombres ?? '';
    this.avisos.push({
      estudianteId,
      mensaje: mensajeSubida(nombre, NOMBRES[n.juego], cambio),
    });
    return { ...cambio, intentoId: f.id!, estudianteId, juego: n.juego };
  }

  /** Actualización condicional, como el UPDATE … WHERE de la base. */
  private aplicar(
    estudianteId: bigint,
    juego: JuegoConEscalera,
    cambio: CambioNivel,
  ): boolean {
    const actual = this.leer(estudianteId, juego);
    if (
      actual.nivelActual !== cambio.nivelAnterior ||
      actual.completado !== cambio.completadoAnterior
    ) {
      return false;
    }
    this.estado.set(this.clave(estudianteId, juego), {
      nivelActual: cambio.nivelNuevo,
      completado: cambio.completado,
      actualizadoEn: AHORA_PRUEBA,
    });
    return true;
  }
}
