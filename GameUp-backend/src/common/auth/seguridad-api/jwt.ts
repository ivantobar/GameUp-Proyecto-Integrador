/**
 * Lee el campo `exp` del payload de un JWT SIN verificar la firma.
 *
 * Solo sirve para no guardar en caché un token más allá de su vencimiento:
 * la validez real la decide la API de seguridad en /api/auth/perfil.
 * Nunca uses esto para autorizar.
 */
export function leerExpiracionJwt(token: string): Date | null {
  const partes = token.split('.');
  if (partes.length !== 3 || !partes[1]) return null;
  try {
    const payload: unknown = JSON.parse(
      Buffer.from(partes[1], 'base64url').toString('utf8'),
    );
    if (typeof payload !== 'object' || payload === null) return null;
    const exp = (payload as { exp?: unknown }).exp;
    if (typeof exp !== 'number' || !Number.isFinite(exp)) return null;
    return new Date(exp * 1000);
  } catch {
    return null;
  }
}
