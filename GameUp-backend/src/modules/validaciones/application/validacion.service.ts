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
import {
  MAXIMO_LOTE,
  normalizarDecision,
  type ItemRevision,
  type ResultadoValidacion,
} from '../domain/validacion.js';
import {
  REVISION_LECTURA_REPOSITORY,
  VALIDACION_ESCRITURA_REPOSITORY,
  type AlcanceRevision,
  type RevisionLecturaRepository,
  type ValidacionEscrituraRepository,
} from '../domain/validacion.repository.js';
import { GrabacionService } from './grabacion.service.js';

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
    const alcance: AlcanceRevision =
      actual.rol === 'TALLERISTA'
        ? { tipo: 'tallerista', talleristaId: actual.id }
        : { tipo: 'todos' };
    return this.revision.pendientes(alcance, estudianteId, paginacion);
  }

  /**
   * «Lo logró» o «Practicar más» (con retroalimentación obligatoria). Si hay
   * audio disponible, quien valida debe haberlo escuchado antes. La base
   * recalcula el progreso (solo cuentan las APROBADAS). Después se
   * borra el audio, sea cual sea el resultado.
   */
  async validar(
    actual: UsuarioAutenticado,
    intentoId: bigint,
    resultado: ResultadoValidacion,
    retroalimentacion: string | null,
  ): Promise<Intento> {
    const intento = await this.intentos.obtener(actual, intentoId);
    if (intento.validacion)
      throw new ConflictoError('Este intento ya fue validado.');
    const decision = normalizarDecision(resultado, retroalimentacion);
    await this.grabaciones.exigirEscucha(actual, intentoId);

    await this.escritura.validar(intentoId, actual.id, decision);
    await this.grabaciones.borrarDeIntento(intentoId);
    return this.intentos.obtener(actual, intentoId);
  }

  /**
   * Aprueba varios intentos de juegos SIN voz de una vez (los de voz se
   * validan uno por uno, escuchando el audio). Todos o ninguno: si alguno
   * no se puede, no se aprueba nada y se explica por qué.
   */
  async aprobarLote(
    actual: UsuarioAutenticado,
    intentoIds: bigint[],
  ): Promise<number> {
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
