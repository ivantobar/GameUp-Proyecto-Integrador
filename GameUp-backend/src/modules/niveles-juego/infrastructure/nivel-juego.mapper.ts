import { idATexto } from '../../../common/ids/ids.js';
import { NIVEL_JUEGO_MAXIMO } from '../../catalogo/domain/juegos/niveles-juego.js';
import { ModuloMapper } from '../../modulos/infrastructure/modulo.mapper.js';
import type {
  ActividadDelNivel,
  NivelConPendientes,
} from '../application/nivel-juego.service.js';
import type { SubidaNivel } from '../domain/nivel-juego.js';
import type {
  ActividadDelNivelDto,
  NivelJuegoDto,
  SubidaNivelDto,
} from '../presentation/dto/nivel-juego.dto.js';

export const NivelJuegoMapper = {
  aDto(n: NivelConPendientes): NivelJuegoDto {
    return {
      juego: n.juego,
      nombre: n.nombreJuego,
      nivelActual: n.nivelActual,
      nivelMaximo: NIVEL_JUEGO_MAXIMO,
      completado: n.completado,
      pendientesValidacion: n.pendientesValidacion,
      actualizadoEn: n.actualizadoEn.toISOString(),
    };
  },

  aActividadDto(a: ActividadDelNivel): ActividadDelNivelDto {
    return {
      nivel: NivelJuegoMapper.aDto(a.nivel),
      actividad: ModuloMapper.aActividadDto(a.actividad),
    };
  },

  aSubidaDto(s: SubidaNivel): SubidaNivelDto {
    return {
      intentoId: idATexto(s.intentoId),
      juego: s.juego,
      nivelAnterior: s.nivelAnterior,
      nivelNuevo: s.nivelNuevo,
      completado: s.completado,
    };
  },
} as const;
