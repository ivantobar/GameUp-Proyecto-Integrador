import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useRepositories } from '@/data/RepositoryProvider';

/**
 * Cerrar sesión: la app olvida el token y vuelve a «Iniciar sesión». Aunque
 * no haya red, la sesión queda cerrada en el teléfono.
 */
export function useSignOut() {
  const { auth } = useRepositories();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await auth.signOut();
    } catch {
      // `signOut` no debería fallar; si falla, igual se sale.
    } finally {
      setSigningOut(false);
      router.replace('/login');
    }
  }, [auth, signingOut]);

  return { signOut, signingOut };
}
