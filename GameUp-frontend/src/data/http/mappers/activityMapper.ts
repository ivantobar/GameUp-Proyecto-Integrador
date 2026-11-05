import { isVowel, type ActivityContent, type Vowel } from '../../types';
import type { ActividadDetalleDto } from '../dto/actividades';
import { toGameId } from './gameCodes';
import { requireList, requireText, unexpected } from './responseShape';

/**
 * Actividad del backend → contenido que juega la app. Fase 2a: «Busca la
 * boca» (sus vocales) y «Habla conmigo» (su vocal). Emparejar, Clasificar,
 * Secuenciar y Memoria se agregan en la fase 2b.
 */
export function toActivityContent(dto: ActividadDetalleDto): ActivityContent {
  const activityId = requireText(dto.id, 'id');
  const title = requireText(dto.titulo, 'titulo');
  const config = dto.configuracion ?? {};
  const gameId = toGameId(dto.tipoJuego?.codigo);

  switch (gameId) {
    case 'findMouth': {
      const vowels = requireList(
        config['vocales'],
        'configuracion.vocales',
      ).filter((v): v is Vowel => typeof v === 'string' && isVowel(v));
      if (vowels.length === 0) throw unexpected('configuracion.vocales');
      return { activityId, gameId, title, vowels };
    }
    case 'speak': {
      const vowel = config['vocal'];
      if (typeof vowel !== 'string' || !isVowel(vowel)) {
        throw unexpected('configuracion.vocal');
      }
      return { activityId, gameId, title, vowel };
    }
    default:
      throw unexpected(`juego todavía no disponible en la app: ${gameId}`);
  }
}
