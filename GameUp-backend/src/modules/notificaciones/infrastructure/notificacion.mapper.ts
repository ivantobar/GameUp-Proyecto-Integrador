import { idATexto } from '../../../common/ids/ids.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import {
  esTipoNotificacion,
  Notificacion,
} from '../domain/notificacion.entity.js';
import type { NotificacionDto } from '../presentation/dto/notificacion.dto.js';

export const SELECCION_NOTIFICACION = {
  id: true,
  tipo: true,
  mensaje: true,
  leida: true,
  fecha: true,
} satisfies Prisma.notificacionSelect;

export type FilaNotificacion = Prisma.notificacionGetPayload<{
  select: typeof SELECCION_NOTIFICACION;
}>;

export const NotificacionMapper = {
  aEntidad(f: FilaNotificacion): Notificacion {
    // notificacion_tipo_check lo garantiza.
    if (!esTipoNotificacion(f.tipo)) {
      throw new Error('Tipo de notificación desconocido');
    }
    return new Notificacion({
      id: f.id,
      tipo: f.tipo,
      mensaje: f.mensaje,
      leida: f.leida,
      fecha: f.fecha,
    });
  },

  aDto(n: Notificacion): NotificacionDto {
    return {
      id: idATexto(n.id),
      tipo: n.tipo,
      mensaje: n.mensaje,
      leida: n.leida,
      fecha: n.fecha.toISOString(),
    };
  },
} as const;
