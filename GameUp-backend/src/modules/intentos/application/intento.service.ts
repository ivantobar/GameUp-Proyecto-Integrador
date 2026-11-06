import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { RegistroJuegosService } from '../../catalogo/application/registro-juegos.service.js';
import type { Configuracion } from '../../catalogo/domain/juegos/estrategia-juego.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import type { Intento } from '../domain/intento.entity.js';
import {
  INTENTO_ESCRITURA_REPOSITORY,
  INTENTO_LECTURA_REPOSITORY,
  type IntentoEscrituraRepository,
  type IntentoLecturaRepository,
} from '../domain/intento.repository.js';
import { ContextoIntentoService } from './contexto-intento.service.js';

const NO_EXISTE = 'El intento no existe.';

/**
 * Intentos de los juegos sin voz. El resultado se valida con la estrategia
 * del juego (forma, rangos y que total/pairs coincidan con la actividad).
 * Nada se aprueba solo: el intento queda pendiente de la tallerista.
 */
@Injectable()
export class IntentoService {
  constructor(
    @Inject(INTENTO_ESCRITURA_REPOSITORY)
    private readonly escritura: IntentoEscrituraRepository,
    @Inject(INTENTO_LECTURA_REPOSITORY)
    private readonly lectura: IntentoLecturaRepository,
    private readonly contexto: ContextoIntentoService,
    private readonly juegos: RegistroJuegosService,
    private readonly acceso: AccesoEstudianteService,
  ) {}

  async registrar(
    actual: UsuarioAutenticado,
    actividadId: bigint,
    resultado: Configuracion,
  ): Promise<Intento> {
    const { actividad, asignacion } = await this.contexto.resolver(
      actual,
      actividadId,
    );
    if (actividad.tipoJuego.codigo === 'HABLA_CONMIGO') {
      throw new ReglaNegocioError(
        'Los intentos de Habla conmigo se envían a POST /intentos/habla-conmigo.',
      );
    }
    const validado = this.juegos
      .estrategia(actividad.tipoJuego.codigo)
      .validarResultado(resultado, actividad.configuracion);

    return this.escritura.registrar({
      asignacionId: asignacion.id,
      estudianteId: asignacion.estudiante.id,
      actividadId: actividad.id,
      resultado: validado,
      // Las estrellas son de práctica de vocales; los demás juegos no dan nota.
      estrellas: 0,
    });
  }

  /** El estudiante, su tallerista a cargo, su acudiente o la directora. Si no, 404. */
  async obtener(actual: UsuarioAutenticado, id: bigint): Promise<Intento> {
    const intento = await this.lectura.buscarPorId(id);
    if (!intento) throw new RecursoNoEncontradoError(NO_EXISTE);
    await this.acceso
      .verificar(actual, intento.estudianteId)
      .catch((error: unknown) => {
        throw error instanceof RecursoNoEncontradoError
          ? new RecursoNoEncontradoError(NO_EXISTE)
          : error;
      });
    return intento;
  }
}
