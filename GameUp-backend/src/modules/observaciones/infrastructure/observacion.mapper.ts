import { idATexto } from '../../../common/ids/ids.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import {
  nombreVisiblePersona,
  SELECCION_PERSONA,
} from '../../estudiantes/infrastructure/estudiante.mapper.js';
import { Observacion } from '../domain/observacion.entity.js';
import type { ObservacionDto } from '../presentation/dto/observacion.dto.js';

export const SELECCION_OBSERVACION = {
  id: true,
  estudiante_id: true,
  texto: true,
  visible_acudiente: true,
  fecha: true,
  usuario: { select: SELECCION_PERSONA },
} satisfies Prisma.observacionSelect;

export type FilaObservacion = Prisma.observacionGetPayload<{
  select: typeof SELECCION_OBSERVACION;
}>;

export const ObservacionMapper = {
  aEntidad(f: FilaObservacion): Observacion {
    return new Observacion({
      id: f.id,
      estudianteId: f.estudiante_id,
      autor: f.usuario,
      texto: f.texto,
      visibleAcudiente: f.visible_acudiente,
      fecha: f.fecha,
    });
  },

  aDto(o: Observacion): ObservacionDto {
    return {
      id: idATexto(o.id),
      estudianteId: idATexto(o.estudianteId),
      autor: {
        id: idATexto(o.autor.id),
        displayName: nombreVisiblePersona(o.autor),
      },
      texto: o.texto,
      visibleAcudiente: o.visibleAcudiente,
      fecha: o.fecha.toISOString(),
    };
  },
} as const;
