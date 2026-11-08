import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALMACEN_ARCHIVOS,
  type AlmacenArchivos,
  type ArchivoSubido,
} from '../../../common/almacenamiento/almacen-archivos.js';
import {
  confirmarTipo,
  EXTENSION,
  FORMATOS_GRABACION,
  type TipoMime,
} from '../../../common/almacenamiento/tipos-archivo.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { ReglaNegocioError } from '../../../common/errors/dominio.errors.js';
import { ConsentimientoService } from '../../consentimiento/application/consentimiento.service.js';
import type { VerificacionConsentimiento } from '../../consentimiento/domain/consulta-consentimiento.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import {
  estrellasDePractica,
  rutaGrabacion,
  type EstadoGrabacion,
  type Intento,
} from '../domain/intento.entity.js';
import {
  INTENTO_ESCRITURA_REPOSITORY,
  INTENTO_LECTURA_REPOSITORY,
  type IntentoEscrituraRepository,
  type IntentoLecturaRepository,
} from '../domain/intento.repository.js';
import { ContextoIntentoService } from './contexto-intento.service.js';

export interface IntentoDeVoz {
  intento: Intento;
  estadoGrabacion: EstadoGrabacion;
  /** Estrellas de práctica de la vocal después de este intento (0-3). */
  estrellasPractica: number;
}

/** Qué estado le toca a la grabación antes de guardar nada. */
function estadoInicial(
  hayAudio: boolean,
  consentimiento: VerificacionConsentimiento,
): EstadoGrabacion {
  if (!consentimiento.concedido) {
    return consentimiento.motivo === 'NO_VERIFICABLE'
      ? 'NO_VERIFICABLE'
      : 'SIN_CONSENTIMIENTO';
  }
  return hayAudio ? 'ADJUNTA' : 'NO_ENVIADA';
}

/**
 * Intento de Habla conmigo (Mira → Dilo → Listo).
 *  - La app NO califica la pronunciación: el intento queda pendiente.
 *  - La voz solo se guarda si el consentimiento vigente está verificado
 *    (falla cerrado). Sin él, el intento se guarda SIN audio.
 *  - El audio va al bucket privado `grabaciones` en
 *    estudiante/<id>/intento/<id>.<ext>, con la versión de términos y la
 *    hora de verificación.
 *  - Si Storage falla, el intento del niño no se pierde: queda sin audio
 *    (NO_GUARDADA).
 */
@Injectable()
export class HablaConmigoService {
  private readonly logger = new Logger(HablaConmigoService.name);

  constructor(
    @Inject(INTENTO_ESCRITURA_REPOSITORY)
    private readonly escritura: IntentoEscrituraRepository,
    @Inject(INTENTO_LECTURA_REPOSITORY)
    private readonly lectura: IntentoLecturaRepository,
    @Inject(ALMACEN_ARCHIVOS) private readonly almacen: AlmacenArchivos,
    private readonly contexto: ContextoIntentoService,
    private readonly consentimiento: ConsentimientoService,
    private readonly acceso: AccesoEstudianteService,
  ) {}

  async registrar(
    actual: UsuarioAutenticado,
    actividadId: bigint,
    duracionSeg: number | null,
    audio: ArchivoSubido | null,
    token: string | null = null,
  ): Promise<IntentoDeVoz> {
    const { actividad, asignacion } = await this.contexto.resolver(
      actual,
      actividadId,
    );
    if (actividad.tipoJuego.codigo !== 'HABLA_CONMIGO') {
      throw new ReglaNegocioError(
        'Esta actividad no es de Habla conmigo: usa POST /intentos.',
      );
    }

    // El formato se valida antes de todo: un archivo inválido es un error de la app.
    let formato: TipoMime | null = null;
    if (audio) {
      formato = confirmarTipo(audio.cabecera, audio.mimetype);
      if (!formato || !FORMATOS_GRABACION.includes(formato)) {
        throw new ReglaNegocioError(
          'El audio no es válido: se acepta M4A/MP4, AAC o WebM, y su contenido debe coincidir con el formato.',
        );
      }
    }

    const estudiante = await this.acceso.existente(actual.id);
    const verificacion = await this.consentimiento.verificar(
      estudiante.idEstudianteExterno,
      token,
    );
    let estado = estadoInicial(audio !== null, verificacion);

    const vocal = String(actividad.configuracion['vocal'] ?? '');
    const previos =
      (await this.lectura.intentosPorVocal(actual.id)).get(vocal) ?? 0;
    const estrellas = estrellasDePractica(previos);

    const intento = await this.escritura.registrar({
      asignacionId: asignacion?.id ?? null,
      estudianteId: actual.id,
      actividadId: actividad.id,
      resultado: { estadoGrabacion: estado },
      estrellas,
    });

    if (
      estado === 'ADJUNTA' &&
      audio &&
      formato &&
      verificacion.codigoVersion
    ) {
      const guardado = await this.guardarAudio(
        intento,
        audio,
        formato,
        duracionSeg,
        {
          codigoVersion: verificacion.codigoVersion,
          verificadoEn: verificacion.verificadoEn,
        },
      );
      if (!guardado) {
        estado = 'NO_GUARDADA';
        await this.escritura.actualizarResultado(intento.id, {
          estadoGrabacion: estado,
        });
      }
    }

    return {
      intento: { ...intento, resultado: { estadoGrabacion: estado } },
      estadoGrabacion: estado,
      estrellasPractica: estrellas,
    };
  }

  /** Sube el audio y registra la grabación. Si algo falla, no deja restos. */
  private async guardarAudio(
    intento: Intento,
    audio: ArchivoSubido,
    formato: TipoMime,
    duracionSeg: number | null,
    verificacion: { codigoVersion: string; verificadoEn: Date },
  ): Promise<boolean> {
    const ruta = rutaGrabacion(
      intento.estudianteId,
      intento.id,
      EXTENSION[formato],
    );
    try {
      await this.almacen.subir('grabaciones', ruta, audio.path, formato);
    } catch {
      // Sin la ruta en el log: identifica a un estudiante.
      this.logger.warn(`No se guardó el audio del intento ${intento.id}`);
      return false;
    }
    try {
      await this.escritura.registrarGrabacion({
        intentoId: intento.id,
        ruta,
        duracionSeg,
        codigoVersionTerminos: verificacion.codigoVersion,
        consentimientoVerificadoEn: verificacion.verificadoEn,
      });
      return true;
    } catch {
      this.logger.warn(`No se registró la grabación del intento ${intento.id}`);
      await this.almacen.eliminar('grabaciones', [ruta]).catch(() => undefined);
      return false;
    }
  }
}
