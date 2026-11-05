import { idATexto } from '../../../common/ids/ids.js';
import type { IntentoDeVoz } from '../application/habla-conmigo.service.js';
import type { Intento } from '../domain/intento.entity.js';
import type {
  IntentoDto,
  IntentoVozDto,
} from '../presentation/dto/intento.dto.js';

export const IntentoMapper = {
  /** Nunca incluye la ruta del audio: se pide con URL firmada (fase 7). */
  aDto(i: Intento): IntentoDto {
    return {
      id: idATexto(i.id),
      asignacionId: idATexto(i.asignacionId),
      actividadId: idATexto(i.actividadId),
      tipoJuego: i.tipoJuego,
      numeroIntento: i.numeroIntento,
      resultado: i.resultado,
      estrellas: i.estrellas,
      fecha: i.fecha.toISOString(),
      estado: i.validacion?.resultado ?? 'PENDIENTE_VALIDACION',
      validacion: i.validacion
        ? {
            resultado: i.validacion.resultado,
            retroalimentacion: i.validacion.retroalimentacion,
            fecha: i.validacion.fecha.toISOString(),
          }
        : null,
      tieneAudio: i.grabacion !== null && i.grabacion.eliminadaEn === null,
    };
  },

  aVozDto(v: IntentoDeVoz): IntentoVozDto {
    return {
      ...IntentoMapper.aDto(v.intento),
      tieneAudio: v.estadoGrabacion === 'ADJUNTA',
      estadoGrabacion: v.estadoGrabacion,
      grabacionGuardada: v.estadoGrabacion === 'ADJUNTA',
      estrellasPractica: v.estrellasPractica,
    };
  },
} as const;
