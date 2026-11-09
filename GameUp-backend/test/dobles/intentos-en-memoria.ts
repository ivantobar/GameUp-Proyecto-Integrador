import { ServicioExternoNoDisponibleError } from '../../src/common/errors/dominio.errors.js';
import type { IntentoResumen } from '../../src/modules/asignaciones/domain/asignacion.entity.js';
import type { Configuracion } from '../../src/modules/catalogo/domain/juegos/estrategia-juego.js';
import type {
  ConsentimientoVigente,
  ConsultaConsentimiento,
  IdsEstudianteConsentimiento,
} from '../../src/modules/consentimiento/domain/consulta-consentimiento.js';
import type { Intento } from '../../src/modules/intentos/domain/intento.entity.js';
import type {
  IntentoEscrituraRepository,
  IntentoLecturaRepository,
  NuevaGrabacion,
  NuevoIntento,
} from '../../src/modules/intentos/domain/intento.repository.js';
import {
  escenarioAsignaciones,
  type AsignacionesEnMemoria,
} from './asignaciones-en-memoria.js';
import { AHORA_PRUEBA, type ModulosEnMemoria } from './modulos-en-memoria.js';
import { NivelesJuegoEnMemoria } from './niveles-juego-en-memoria.js';

/** Un intento guardado. Es el mismo objeto que ve AsignacionesEnMemoria (avance). */
export type FilaIntento = IntentoResumen & {
  /** null: intento de la escalera de niveles (fase 9). */
  asignacionId: bigint | null;
  /** Siempre en los de la escalera; en los demás sale de la asignación. */
  estudianteId?: bigint;
  id?: bigint;
  resultado?: Configuracion;
  estrellas?: number;
  grabacion?: {
    id: bigint;
    eliminadaEn: Date | null;
    ruta?: string;
    creadaEn?: Date;
  } | null;
};

/**
 * Intentos en memoria (pruebas). Simula lo que hace la base: numero_intento,
 * rechazo en asignaciones completadas y paso a EN_CURSO.
 */
export class IntentosEnMemoria
  implements IntentoEscrituraRepository, IntentoLecturaRepository
{
  readonly grabaciones: NuevaGrabacion[] = [];
  /** true: registrarGrabacion falla (p. ej., la base rechaza la fila). */
  fallarGrabacion = false;
  private siguiente = 900n;

  constructor(
    private readonly asignaciones: AsignacionesEnMemoria,
    private readonly modulos: ModulosEnMemoria,
    /** Para el chequeo de nivel actual de fn_intento_antes (escalera). */
    private readonly niveles: NivelesJuegoEnMemoria | null = null,
  ) {}

  private get filas(): FilaIntento[] {
    return this.asignaciones.intentosFilas as FilaIntento[];
  }

  private estudianteDe(f: FilaIntento): bigint {
    return (
      f.estudianteId ??
      this.asignaciones.filas.find((a) => a.id === f.asignacionId)!.estudianteId
    );
  }

  private actividad(id: bigint) {
    return this.modulos.actividades.find((a) => a.id === id)!;
  }

  private aIntento(f: FilaIntento): Intento {
    return {
      id: f.id!,
      asignacionId: f.asignacionId,
      actividadId: f.actividadId,
      estudianteId: this.estudianteDe(f),
      tipoJuego: this.actividad(f.actividadId).tipoJuego.codigo,
      nivelJuego: this.actividad(f.actividadId).nivelJuego,
      numeroIntento: f.numeroIntento,
      resultado: f.resultado ?? {},
      estrellas: f.estrellas ?? 0,
      fecha: f.fecha,
      validacion: f.validacion
        ? { ...f.validacion, fecha: AHORA_PRUEBA }
        : null,
      grabacion: f.grabacion ?? null,
    };
  }

  async registrar(d: NuevoIntento): Promise<Intento> {
    if (d.asignacionId === null) return this.registrarEnEscalera(d);
    const asignacion = this.asignaciones.filas.find(
      (a) => a.id === d.asignacionId,
    )!;
    if (asignacion.estado === 'COMPLETADO')
      throw new Error('trigger: asignación completada');
    const numero =
      this.filas.filter(
        (f) =>
          f.asignacionId === d.asignacionId && f.actividadId === d.actividadId,
      ).length + 1;
    const fila: FilaIntento = {
      id: this.siguiente++,
      asignacionId: d.asignacionId,
      estudianteId: asignacion.estudianteId,
      actividadId: d.actividadId,
      numeroIntento: numero,
      fecha: AHORA_PRUEBA,
      validacion: null,
      resultado: d.resultado,
      estrellas: d.estrellas,
      grabacion: null,
    };
    this.filas.push(fila);
    this.modulos.actividadesConIntentos.add(d.actividadId);
    if (asignacion.estado === 'ASIGNADO') asignacion.estado = 'EN_CURSO';
    return this.aIntento(fila);
  }

  /** Como fn_intento_antes sin asignación: solo el nivel ACTUAL. */
  private registrarEnEscalera(d: NuevoIntento): Intento {
    const nivel = this.niveles?.nivelDeActividad(d.actividadId) ?? null;
    if (!nivel) throw new Error('trigger: la actividad no es de la escalera');
    if (
      this.niveles!.nivelDe(d.estudianteId, nivel.juego).nivelActual !==
      nivel.nivel
    ) {
      throw new Error('trigger: no es el nivel actual del estudiante');
    }
    const fila: FilaIntento = {
      id: this.siguiente++,
      asignacionId: null,
      estudianteId: d.estudianteId,
      actividadId: d.actividadId,
      numeroIntento:
        this.filas.filter(
          (f) =>
            f.asignacionId === null &&
            f.estudianteId === d.estudianteId &&
            f.actividadId === d.actividadId,
        ).length + 1,
      fecha: AHORA_PRUEBA,
      validacion: null,
      resultado: d.resultado,
      estrellas: d.estrellas,
      grabacion: null,
    };
    this.filas.push(fila);
    this.modulos.actividadesConIntentos.add(d.actividadId);
    return this.aIntento(fila);
  }

  async actualizarResultado(
    id: bigint,
    resultado: Configuracion,
  ): Promise<void> {
    this.filas.find((f) => f.id === id)!.resultado = resultado;
  }

  async registrarGrabacion(d: NuevaGrabacion): Promise<void> {
    if (this.fallarGrabacion) throw new Error('la base rechazó la grabación');
    if (
      this.actividad(this.filas.find((f) => f.id === d.intentoId)!.actividadId)
        .tipoJuego.codigo !== 'HABLA_CONMIGO'
    ) {
      throw new Error('trigger fn_grabacion_solo_habla');
    }
    this.grabaciones.push(d);
    this.filas.find((f) => f.id === d.intentoId)!.grabacion = {
      id: BigInt(this.grabaciones.length),
      eliminadaEn: null,
      ruta: d.ruta,
      creadaEn: AHORA_PRUEBA,
    };
  }

  async buscarPorId(id: bigint): Promise<Intento | null> {
    const f = this.filas.find((x) => x.id === id);
    return f ? this.aIntento(f) : null;
  }

  private deHabla(estudianteId: bigint): string[] {
    return this.filas
      .filter((f) => this.estudianteDe(f) === estudianteId)
      .map((f) => this.actividad(f.actividadId))
      .filter((a) => a.tipoJuego.codigo === 'HABLA_CONMIGO')
      .map((a) => String(a.configuracion['vocal']));
  }

  async intentosPorVocal(estudianteId: bigint): Promise<Map<string, number>> {
    const conteo = new Map<string, number>();
    for (const v of this.deHabla(estudianteId))
      conteo.set(v, (conteo.get(v) ?? 0) + 1);
    return conteo;
  }

  async ultimaVocal(estudianteId: bigint): Promise<string | null> {
    return this.deHabla(estudianteId).at(-1) ?? null;
  }
}

/** Consentimiento controlable: aceptado, no aceptado, ninguno o API caída. */
export class ConsultaConsentimientoControlada implements ConsultaConsentimiento {
  respuesta: ConsentimientoVigente | null | 'CAIDA' = {
    aceptaTratamiento: true,
    codigoVersion: 'TERMINOS-2026-01',
  };
  readonly consultados: IdsEstudianteConsentimiento[] = [];

  async vigente(
    ids: IdsEstudianteConsentimiento,
  ): Promise<ConsentimientoVigente | null> {
    this.consultados.push(ids);
    if (this.respuesta === 'CAIDA') {
      throw new ServicioExternoNoDisponibleError(
        'API del núcleo familiar caída (prueba).',
      );
    }
    return this.respuesta;
  }
}

/**
 * Escenario de la fase 6 sobre el de asignaciones (ver asignaciones-en-memoria):
 * las actividades del módulo 4 reciben configuraciones válidas y se agrega una
 * de BUSCA_LA_BOCA. El estudiante 10 ya tiene 2 intentos de la vocal «a».
 */
export async function escenarioIntentos() {
  const base = await escenarioAsignaciones();
  const { modulos } = base;
  const m4 = Number(base.ids.modulo4);
  const actividad = (id: bigint) =>
    modulos.actividades.find((a) => a.id === id)!;
  actividad(base.ids.emparejar).configuracion = {
    rondas: [
      {
        pregunta: '¿Qué es?',
        estimulo: { etiqueta: 'perro', texto: 'PERRO' },
        opciones: [
          { etiqueta: 'perro', texto: 'perro' },
          { etiqueta: 'gato', texto: 'gato' },
        ],
        respuesta: 0,
      },
      {
        pregunta: '¿Qué es?',
        estimulo: { etiqueta: 'gato', texto: 'GATO' },
        opciones: [
          { etiqueta: 'perro', texto: 'perro' },
          { etiqueta: 'gato', texto: 'gato' },
        ],
        respuesta: 1,
      },
    ],
  };
  actividad(base.ids.memoria).configuracion = {
    tableros: [
      {
        parejas: [
          { etiqueta: 'sol', texto: 'SOL' },
          { etiqueta: 'luna', texto: 'LUNA' },
        ],
      },
    ],
  };
  const busca = modulos.agregarActividad(m4, 'BUSCA_LA_BOCA');
  busca.configuracion = { vocales: ['a', 'e', 'i'] };

  const nivelesJuego = new NivelesJuegoEnMemoria(
    modulos,
    base.usuarios,
    () => base.asignaciones.intentosFilas,
  );
  const intentos = new IntentosEnMemoria(
    base.asignaciones,
    modulos,
    nivelesJuego,
  );
  const consentimiento = new ConsultaConsentimientoControlada();
  return {
    ...base,
    intentos,
    nivelesJuego,
    consentimiento,
    ids: { ...base.ids, busca: busca.id },
  };
}
