import { Redirect } from 'expo-router';
import { Screen, StateView } from '@/components/ui';

/**
 * Ruta inicial. Mientras no exista el inicio de sesión, en desarrollo lleva
 * al selector de rol. En una versión publicada no muestra ese selector.
 */
export default function Index() {
  if (__DEV__) {
    return <Redirect href="/dev" />;
  }
  return (
    <Screen>
      <StateView
        kind="empty"
        title="Muy pronto podrás entrar aquí"
        message="Estamos preparando el inicio de sesión."
      />
    </Screen>
  );
}
