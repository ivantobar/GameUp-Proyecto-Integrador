import { useEffect, useRef, useState } from 'react';
import { WAKE_HINT_MS } from '@/config/http';
import {
  AccountNotAllowedError,
  InvalidCredentialsError,
  SignInUnavailableError,
  TooManyAttemptsError,
} from '@/data/authErrors';
import { useRepositories } from '@/data/RepositoryProvider';
import type { AuthSession } from '@/data/types';
import { TimeoutError } from '@/services/apiErrors';
import { useSession } from './SessionProvider';
import {
  hasErrors,
  normalizeEmail,
  validateCredentials,
  type CredentialErrors,
} from './credentials';

/** Por qué no se pudo entrar, cuando el formulario estaba bien escrito. */
export type SignInProblem =
  'invalid' | 'notAllowed' | 'unavailable' | 'tooMany' | 'connection';

function problemOf(error: unknown): SignInProblem {
  if (error instanceof InvalidCredentialsError) return 'invalid';
  if (error instanceof AccountNotAllowedError) return 'notAllowed';
  if (error instanceof SignInUnavailableError) return 'unavailable';
  if (error instanceof TooManyAttemptsError) return 'tooMany';
  // Ni reintentando respondió a tiempo: es el servidor, no el internet.
  if (error instanceof TimeoutError) return 'unavailable';
  return 'connection';
}

/**
 * Estado del formulario «Iniciar sesión». Valida en la app y luego llama a
 * `auth.signIn` del repositorio (simulado o la API NestJS).
 *
 * Al abrir la pantalla despierta el backend. Si «Entrar» tarda, `waking`
 * avisa «Estamos despertando GameUP…».
 */
export function useSignIn() {
  const { auth } = useRepositories();
  /** «Entrar» lleva un rato esperando: el servidor se está despertando. */
  const [waking, setWaking] = useState(false);
  const wakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { setSession } = useSession();

  // Cada vez que se abre «Iniciar sesión» (también al llegar por un 401),
  // se olvida la sesión anterior: el token guardado y el rol en memoria. Y,
  // mientras la persona escribe, el backend ya se va despertando.
  useEffect(() => {
    setSession(null);
    auth.forgetSession().catch(() => {});
    auth.warmUp().catch(() => {});
  }, [auth, setSession]);

  // Al salir de la pantalla no queda el temporizador del aviso.
  useEffect(
    () => () => {
      if (wakeTimer.current) clearTimeout(wakeTimer.current);
    },
    [],
  );
  const [email, setEmailValue] = useState('');
  const [password, setPasswordValue] = useState('');
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [problem, setProblem] = useState<SignInProblem | null>(null);
  /** Motivo del backend cuando la cuenta no puede entrar (ya revisado). */
  const [reason, setReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Al corregir un campo, su aviso desaparece.
  const setEmail = (value: string) => {
    setEmailValue(value);
    setErrors((current) => ({ ...current, email: undefined }));
    setProblem(null);
    setReason(null);
  };
  const setPassword = (value: string) => {
    setPasswordValue(value);
    setErrors((current) => ({ ...current, password: undefined }));
    setProblem(null);
    setReason(null);
  };

  /** Llena el formulario (cuentas de prueba en desarrollo). */
  const fill = (values: { email: string; password: string }) => {
    setEmailValue(values.email);
    setPasswordValue(values.password);
    setErrors({});
    setProblem(null);
    setReason(null);
  };

  /** Devuelve la sesión si se pudo entrar; si no, `null` y deja el aviso. */
  const submit = async (): Promise<AuthSession | null> => {
    if (submitting) return null;
    const found = validateCredentials({ email, password });
    setErrors(found);
    setProblem(null);
    setReason(null);
    if (hasErrors(found)) return null;

    setSubmitting(true);
    wakeTimer.current = setTimeout(() => setWaking(true), WAKE_HINT_MS);
    try {
      const session = await auth.signIn({
        email: normalizeEmail(email),
        password,
      });
      // El rol queda en memoria: cada espacio solo abre para su rol.
      setSession(session);
      return session;
    } catch (error: unknown) {
      setProblem(problemOf(error));
      setReason(error instanceof AccountNotAllowedError ? error.reason : null);
      return null;
    } finally {
      if (wakeTimer.current) clearTimeout(wakeTimer.current);
      wakeTimer.current = null;
      setWaking(false);
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
    reason,
    submitting,
    waking,
    submit,
  };
}
