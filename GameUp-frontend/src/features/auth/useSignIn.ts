import { useState } from 'react';
import { InvalidCredentialsError } from '@/data/authErrors';
import { useRepositories } from '@/data/RepositoryProvider';
import type { AuthSession } from '@/data/types';
import {
  hasErrors,
  normalizeEmail,
  validateCredentials,
  type CredentialErrors,
} from './credentials';

/** Por qué no se pudo entrar, cuando el formulario estaba bien escrito. */
export type SignInProblem = 'invalid' | 'connection';

/**
 * Estado del formulario «Iniciar sesión». Valida en la app y luego llama a
 * `auth.signIn` del repositorio: hoy simulado, mañana la API NestJS.
 */
export function useSignIn() {
  const { auth } = useRepositories();
  const [email, setEmailValue] = useState('');
  const [password, setPasswordValue] = useState('');
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [problem, setProblem] = useState<SignInProblem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Al corregir un campo, su aviso desaparece.
  const setEmail = (value: string) => {
    setEmailValue(value);
    setErrors((current) => ({ ...current, email: undefined }));
    setProblem(null);
  };
  const setPassword = (value: string) => {
    setPasswordValue(value);
    setErrors((current) => ({ ...current, password: undefined }));
    setProblem(null);
  };

  /** Llena el formulario (cuentas de prueba en desarrollo). */
  const fill = (values: { email: string; password: string }) => {
    setEmailValue(values.email);
    setPasswordValue(values.password);
    setErrors({});
    setProblem(null);
  };

  /** Devuelve la sesión si se pudo entrar; si no, `null` y deja el aviso. */
  const submit = async (): Promise<AuthSession | null> => {
    if (submitting) return null;
    const found = validateCredentials({ email, password });
    setErrors(found);
    setProblem(null);
    if (hasErrors(found)) return null;

    setSubmitting(true);
    try {
      return await auth.signIn({ email: normalizeEmail(email), password });
    } catch (error: unknown) {
      setProblem(
        error instanceof InvalidCredentialsError ? 'invalid' : 'connection',
      );
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    email,
    password,
    setEmail,
    setPassword,
    fill,
    errors,
    problem,
    submitting,
    submit,
  };
}
