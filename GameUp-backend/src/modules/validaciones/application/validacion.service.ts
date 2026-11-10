import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import { IntentoService } from '../../intentos/application/intento.service.js';
import type { Intento } from '../../intentos/domain/intento.entity.js';
import type { SubidaNivel } from '../../niveles-juego/domain/nivel-juego.js';
import {
  MAXIMO_LOTE,
  normalizarDecision,
  type ItemRevision,
  type ResultadoValidacion,
  type ResumenPendientes,
} from '../domain/validacion.js';
import {
  REVISION_LECTURA_REPOSITORY,
  VALIDACION_ESCRITURA_REPOSITORY,
  type AlcanceRevision,
  type ResultadoLote,
  type RevisionLecturaRepository,
  type ValidacionEscrituraRepository,
} from '../domain/validacion.repository.js';
import { GrabacionService } from './grabacion.service.js';

/** La tallerista ve a sus estudiantes; la directora, a todos. */
function alcanceDe(actual: UsuarioAutenticado): AlcanceRevision {
  return actual.rol === 'TALLERISTA'
    ? { tipo: 'tallerista', talleristaId: actual.id }
    : { tipo: 'todos' };
}

export interface ResultadoValidacionIntento {
  intento: Intento;
  /** Si aprobar subió de nivel en la escalera (o completó el juego). */
  subida: SubidaNivel | null;
}

/**
 * Revisión de la tallerista (o la directora). Solo sus estudiantes: el
 * controlador exige el rol y aquí se verifica la relación (si no, 404).
 * La app no califica: aprueba o pide practicar más una persona.
 */
@Injectable()
export class ValidacionService {
  constructor(
    @Inject(REVISION_LECTURA_REPOSITORY)
    private readonly revision: RevisionLecturaRepository,
    @Inject(VALIDACION_ESCRITURA_REPOSITORY)
    private readonly escritura: ValidacionEscrituraRepository,
    private readonly intentos: IntentoService,
    private readonly grabaciones: GrabacionService,
  ) {}

  /** Bandeja «Por escuchar», del más antiguo al más reciente. */
  pendientes(
    actual: UsuarioAutenticado,
    estudianteId: bigint | null,
    paginacion: Paginacion,
  ): Promise<Pagina<ItemRevision>> {
    return this.revision.pendientes(
      alcanceDe(actual),
      estudianteId,
      paginacion,
    );
  }

  /** Lista de «Por escuchar»: cada estudiante con sus pendientes. */
  resumenPendientes(actual: UsuarioAutenticado): Promise<ResumenPendientes[]> {
    return this.revision.resumenPendientes(alcanceDe(actual));
  }

  /**
   * «Lo logró» o «Practicar más» (con retroalimentación obligatoria). Si hay
   * audio disponible, quien valida debe haberlo escuchado antes. La base
   * recalcula el progreso (solo cuentan las APROBADAS). En la escalera,
   * aprobar el nivel actual sube un nivel en la misma transacción. Después
   * se borra el audio, sea cual sea el resultado.
   */
  async validar(
    actual: UsuarioAutenticado,
    intentoId: bigint,
    resultado: ResultadoValidacion,
    retroalimentacion: string | null,
  ): Promise<ResultadoValidacionIntento> {
    const intento = await this.intentos.obtener(actual, intentoId);
    if (intento.validacion)
      throw new ConflictoError('Este intento ya fue validado.');
    const decision = normalizarDecision(resultado, retroalimentacion);
    await this.grabaciones.exigirEscucha(actual, intentoId);

    const subida = await this.escritura.validar(intentoId, actual.id, decision);
    await this.grabaciones.borrarDeIntento(intentoId);
    return { intento: await this.intentos.obtener(actual, intentoId), subida };
  }

  /**
   * Aprueba varios intentos de juegos SIN voz de una vez (los de voz se
   * validan uno por uno, escuchando el audio). Todos o ninguno: si alguno
   * no se puede, no se aprueba nada y se explica por qué.
   */
  async aprobarLote(
    actual: UsuarioAutenticado,
    intentoIds: bigint[],
  ): Promise<ResultadoLote> {
    const ids = [...new Set(intentoIds)];
    if (ids.length === 0 || ids.length > MAXIMO_LOTE) {
      throw new ReglaNegocioError(
        `El lote debe tener entre 1 y ${MAXIMO_LOTE} intentos.`,
      );
    }

    const problemas: string[] = [];
    for (const id of ids) {
      let intento: Intento;
      try {
        intento = await this.intentos.obtener(actual, id);
      } catch (error) {
        if (!(error instanceof RecursoNoEncontradoError)) throw error;
        problemas.push(`el intento ${id} no existe`);
        continue;
      }
      if (intento.validacion)
        problemas.push(`el intento ${id} ya fue validado`);
      else if (intento.tipoJuego === 'HABLA_CONMIGO') {
        problemas.push(
          `el intento ${id} es de Habla conmigo (se valida uno por uno, escuchando el audio)`,
        );
      }
    }
    if (problemas.length > 0) {
      throw new ReglaNegocioError(
        `No se aprobó ninguno: ${problemas.join('; ')}.`,
      );
    }
    return this.escritura.aprobarLote(ids, actual.id);
  }
}
