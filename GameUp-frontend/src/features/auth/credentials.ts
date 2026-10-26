import type { Credentials } from '@/data/types';

export interface CredentialErrors {
  email?: string;
  password?: string;
}

/** Forma básica de un correo. La validación definitiva la hace el backend. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Correo sin espacios y en minúsculas, como se envía al backend. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Revisa el formulario antes de enviarlo, para avisar pronto y con frases
 * cortas. No reemplaza la validación del backend.
 */
export function validateCredentials({
  email,
  password,
}: Credentials): CredentialErrors {
  const errors: CredentialErrors = {};
  const cleanEmail = normalizeEmail(email);
  if (cleanEmail.length === 0) {
    errors.email = 'Escribe tu correo.';
  } else if (!EMAIL_PATTERN.test(cleanEmail)) {
    errors.email = 'Revisa el correo. Debe verse así: nombre@correo.com';
  }
  if (password.length === 0) {
    errors.password = 'Escribe tu contraseña.';
  }
  return errors;
}

export function hasErrors(errors: CredentialErrors): boolean {
  return errors.email !== undefined || errors.password !== undefined;
}
