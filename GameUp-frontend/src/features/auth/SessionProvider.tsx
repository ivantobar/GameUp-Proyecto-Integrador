import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthSession } from '@/data/types';

interface SessionValue {
  /** Quién inició sesión (rol y nombre), o `null` si nadie. */
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
  /** Para las pruebas: una sesión ya iniciada. */
  initialSession?: AuthSession | null;
}

/**
 * Sesión en memoria: se llena al iniciar sesión y se vacía al cerrarla o al
 * volver a «Iniciar sesión». No se guarda en el teléfono: al abrir la app de
 * nuevo hay que entrar otra vez. Sirve para que cada rol solo vea sus
 * pantallas; los permisos de verdad los revisa el backend.
 */
export function SessionProvider({
  children,
  initialSession = null,
}: SessionProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(initialSession);
  const value = useMemo(() => ({ session, setSession }), [session]);
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession debe usarse dentro de SessionProvider');
  }
  return value;
}
