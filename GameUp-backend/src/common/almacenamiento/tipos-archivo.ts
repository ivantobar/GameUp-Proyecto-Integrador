/**
 * Reconoce el tipo REAL de un archivo por sus primeros bytes («firma»), en
 * lugar de confiar en el Content-Type que manda el cliente. Solo cubre los
 * tipos que aceptan los buckets de GameUP.
 */
export type TipoMime =
  | 'video/mp4'
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'audio/mpeg'
  | 'audio/mp4';

export const EXTENSION: Record<TipoMime, string> = {
  'video/mp4': 'mp4',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
};

function empiezaCon(b: Buffer, firma: number[], desde = 0): boolean {
  return firma.every((byte, i) => b[desde + i] === byte);
}

function ascii(b: Buffer, desde: number, largo: number): string {
  return b.subarray(desde, desde + largo).toString('latin1');
}

/** Familia ISO-BMFF (mp4, m4a): "ftyp" en el byte 4. */
function esIsoBmff(b: Buffer): boolean {
  return b.length >= 12 && ascii(b, 4, 4) === 'ftyp';
}

/** Marcas de audio dentro de un ftyp (M4A, M4B...). */
const MARCAS_AUDIO = new Set(['M4A ', 'M4B ', 'M4P ', 'F4A ']);

/**
 * Tipos reales con los que es compatible el archivo. Un .mp4 de video y un
 * .m4a de audio comparten formato contenedor: por eso puede haber más de uno.
 */
export function tiposCompatibles(b: Buffer): TipoMime[] {
  if (empiezaCon(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return ['image/png'];
  if (empiezaCon(b, [0xff, 0xd8, 0xff])) return ['image/jpeg'];
  if (
    b.length >= 12 &&
    ascii(b, 0, 4) === 'RIFF' &&
    ascii(b, 8, 4) === 'WEBP'
  ) {
    return ['image/webp'];
  }
  if (esIsoBmff(b)) {
    return MARCAS_AUDIO.has(ascii(b, 8, 4))
      ? ['audio/mp4']
      : ['video/mp4', 'audio/mp4'];
  }
  // MP3: etiqueta ID3, o una trama MPEG (11 bits de sincronía en 1).
  if (ascii(b, 0, 3) === 'ID3') return ['audio/mpeg'];
  if (b.length >= 2 && b[0] === 0xff && ((b[1] ?? 0) & 0xe0) === 0xe0)
    return ['audio/mpeg'];
  return [];
}

/**
 * El tipo declarado por el cliente, si los bytes lo confirman; si no, null.
 * Así no se puede subir, por ejemplo, un ejecutable llamado "video.mp4".
 */
export function confirmarTipo(
  bytes: Buffer,
  declarado: string,
): TipoMime | null {
  const reales = tiposCompatibles(bytes);
  return (reales as string[]).includes(declarado)
    ? (declarado as TipoMime)
    : null;
}
