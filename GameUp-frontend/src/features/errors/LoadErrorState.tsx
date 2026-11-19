import { StateView } from '@/components/ui';
import { ForbiddenError } from '@/services/apiErrors';

/** Título cuando el backend responde 403: la cuenta no puede ver esto. */
export const NO_ACCESS_TITLE = 'No tienes acceso a esta pantalla';
export const NO_ACCESS_MESSAGE =
  'Si crees que es un error, habla con la fundación.';

interface LoadErrorStateProps {
  /** Lo que falló al cargar (de `useResource`). */
  error: unknown;
  /** Título si es otro error (sin red, servidor caído…). */
  title: string;
  message?: string;
  /** «Intentar de nuevo»: no se ofrece ante un 403, no serviría. */
  action?: { label: string; onPress: () => void };
}

/**
 * Error al cargar una pantalla. Si el backend dijo que la cuenta no tiene
 * permiso (403), lo dice así en lugar de «Revisa la conexión»: el problema
 * no es el internet y reintentar no lo arregla.
 */
export function LoadErrorState({
  error,
  title,
  message,
  action,
}: LoadErrorStateProps) {
  if (error instanceof ForbiddenError) {
    return (
      <StateView
        kind="error"
        title={NO_ACCESS_TITLE}
        message={NO_ACCESS_MESSAGE}
      />
    );
  }
  return (
    <StateView kind="error" title={title} message={message} action={action} />
  );
}

/** El error de un recurso, si lo hay (para las ramas que no lo distinguen). */
export function errorOf(resource: { status: string; error?: unknown }) {
  return resource.status === 'error' ? resource.error : undefined;
}
