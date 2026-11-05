import type { IdentidadExterna } from '../../../common/auth/verificador-token.js';

/**
 * Campos de `usuario` que se refrescan desde la API de seguridad en cada
 * login. Solo trae los que llegaron con un valor válido: si el perfil no
 * trae el correo, el correo guardado no se toca.
 */
export interface CopiaExterna {
  nombres?: string;
  apellidos?: string;
  correo?: string;
}

/** Mismo criterio que la restricción ck_usuario_correo de la base. */
const PATRON_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const LARGO_MAXIMO = 100;

function textoValido(valor: string | null): string | null {
  if (valor === null) return null;
  const limpio = valor.trim().replace(/\s+/g, ' ');
  return limpio && limpio.length <= LARGO_MAXIMO ? limpio : null;
}

export function copiaDesdeIdentidad(identidad: IdentidadExterna): CopiaExterna {
  const copia: CopiaExterna = {};
  const nombres = textoValido(identidad.nombres);
  const apellidos = textoValido(identidad.apellidos);
  const correo = identidad.correo?.trim().toLowerCase();
  if (nombres) copia.nombres = nombres;
  if (apellidos) copia.apellidos = apellidos;
  if (correo && correo.length <= 254 && PATRON_CORREO.test(correo)) {
    copia.correo = correo;
  }
  return copia;
}
