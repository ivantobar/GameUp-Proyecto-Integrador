import { idATexto } from '../../../common/ids/ids.js';
import {
  inicialesDe,
  nombreCortoDe,
} from '../../estudiantes/domain/estudiante.entity.js';
import type { PracticaSemanal } from '../domain/practica-casa.js';
import type { PracticaSemanalDto } from '../presentation/dto/practica-casa.dto.js';

export const PracticaCasaMapper = {
  aDto(p: PracticaSemanal): PracticaSemanalDto {
    return {
      estudiante: {
        id: idATexto(p.estudiante.id),
        displayName: nombreCortoDe(p.estudiante),
        initials: inicialesDe(p.estudiante),
      },
      hoy: p.hoy,
      dias: p.dias.map((d) => ({ fecha: d.fecha, practicado: d.practicado })),
      practicadoHoy: p.practicadoHoy,
    };
  },
} as const;
