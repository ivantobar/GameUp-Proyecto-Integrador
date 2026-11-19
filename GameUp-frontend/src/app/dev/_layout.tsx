import { Redirect, Stack } from 'expo-router';
import { useStackScreenOptions } from '@/features/motion/useStackScreenOptions';

/**
 * Rutas de desarrollo (`/dev`, `/dev/catalog`, `/dev/connection`). En una
 * versión publicada no existen para nadie: cualquier enlace (por ejemplo,
 * `gameup://dev`) lleva a «Iniciar sesión».
 */
export default function DevLayout() {
  const screenOptions = useStackScreenOptions();
  if (!__DEV__) return <Redirect href="/login" />;
  return <Stack screenOptions={screenOptions} />;
}
