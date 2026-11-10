import type { Vowel } from '@/data/types';

/**
 * Videos de los gestos de las vocales, grabados por doña Consuelo, terapeuta de
 * la Fundación ASISCO-UP. Su método de enseñanza se basa en el Método Ventura
 * de Patricia Ventura.
 *
 * Son H.264 720p a 30 fps, sin metadatos (los originales del iPhone tenían la
 * ubicación GPS y pesaban 75 MB; estos pesan unos 5,5 MB en total).
 * El alias `@/` solo apunta a `src/`, por eso la ruta es relativa.
 */
export const vowelVideos: Record<Vowel, number> = {
  a: require('../../../assets/videos/vocal-a.mp4'),
  e: require('../../../assets/videos/vocal-e.mp4'),
  i: require('../../../assets/videos/vocal-i.mp4'),
  o: require('../../../assets/videos/vocal-o.mp4'),
  u: require('../../../assets/videos/vocal-u.mp4'),
};

export const VIDEO_CREDIT =
  'Gestos de la profe Consuelo, basados en el Método Ventura de Patricia Ventura.';
