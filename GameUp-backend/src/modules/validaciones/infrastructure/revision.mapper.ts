import { idATexto } from '../../../common/ids/ids.js';
import {
  inicialesDe,
  nombreCortoDe,
} from '../../estudiantes/domain/estudiante.entity.js';
import type { EstadoGrabacion } from '../../intentos/domain/intento.entity.js';
import type { ItemRevision } from '../domain/validacion.js';
import type { ItemRevisionDto } from '../presentation/dto/validacion.dto.js';

/** Estados de grabación en los que el acudiente sí autorizó grabar. */
const CON_CONSENTIMIENTO: readonly EstadoGrabacion[] = [
  'ADJUNTA',
  'NO_ENVIADA',
  'NO_GUARDADA',
];

export const RevisionMapper = {
  aDto(i: ItemRevision): ItemRevisionDto {
    const esVoz = i.tipoJuego === 'HABLA_CONMIGO';
    const estado = i.resultado['estadoGrabacion'] as
      EstadoGrabacion | undefined;
    return {
      intentoId: idATexto(i.intentoId),
      tipo: esVoz ? 'VOZ' : 'JUEGO',
      tipoJuego: i.tipoJuego,
      estudiante: {
        id: idATexto(i.estudiante.id),
        displayName: nombreCortoDe(i.estudiante),
        initials: inicialesDe(i.estudiante),
      },
      actividad: {
        id: idATexto(i.actividad.id),
        titulo: i.actividad.titulo,
        vocal: i.actividad.vocal,
        nivelJuego: i.actividad.nivelJuego,
      },
      modulo: { id: idATexto(i.modulo.id), nombre: i.modulo.nombre },
      fecha: i.fecha.toISOString(),
      numeroIntento: i.numeroIntento,
      pendientesMismaActividad: i.pendientesMismaActividad,
      resultado: i.resultado,
      consentimientoVoz: esVoz
        ? CON_CONSENTIMIENTO.includes(estado ?? 'SIN_CONSENTIMIENTO')
        : null,
      grabacion: i.grabacion,
    };
  },
} as const;
