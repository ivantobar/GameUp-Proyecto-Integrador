import type { OfficialProgress } from '../../types';
import type { ProgresoOficialDto } from '../dto/asignaciones';
import { requireCount, requireList, requireText } from './responseShape';

/**
 * Progreso oficial del backend → «Mi progreso». Los módulos son dinámicos:
 * salen tal como los asignó la fundación, con su nombre. Solo cuentan las
 * actividades validadas (lo pendiente se informa aparte).
 */
export function toOfficialProgress(dto: ProgresoOficialDto): OfficialProgress {
  return {
    modules: requireList(dto.modulos, 'modulos').map((item) => {
      const m = item as ProgresoOficialDto['modulos'][number];
      return {
        moduleId: requireText(m.modulo?.id, 'modulo.id'),
        title: requireText(m.modulo?.nombre, 'modulo.nombre'),
        validated: requireCount(m.validadas, 'validadas'),
        total: requireCount(m.total, 'total'),
      };
    }),
    pendingValidation: requireCount(
      dto.pendientesValidacion,
      'pendientesValidacion',
    ),
  };
}
