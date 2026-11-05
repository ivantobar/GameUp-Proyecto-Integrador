import { useEffect } from 'react';
import { router, SplashScreen, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { createRepositories } from '@/data/createRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import { useStackScreenOptions } from '@/features/motion/useStackScreenOptions';
import { fontAssets } from '@/theme/fonts';

// La pantalla de bienvenida se mantiene hasta que Nunito esté lista.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Si ya se ocultó (recarga en desarrollo), no hay nada que hacer.
});

/**
 * Repositorios de datos: simulados o de la API NestJS, según
 * `EXPO_PUBLIC_DATA_SOURCE` (ver `src/data/createRepositories.ts`). Si la
 * sesión termina (401), se vuelve a «Iniciar sesión».
 */
const repositories = createRepositories({
  onSessionExpired: () => router.replace('/login'),
});

/**
 * Raíz de la app: carga las fuentes, inyecta los datos y define el stack.
 * Las rutas son los archivos de `src/app/`.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const screenOptions = useStackScreenOptions();
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontError) {
      console.warn(
        '[GameUP] No se pudo cargar Nunito; se usa la fuente del sistema.',
        fontError,
      );
    }
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready, fontError]);

  if (!ready) return null;

  return (
    <RepositoryProvider repositories={repositories}>
      <Stack screenOptions={screenOptions} />
    </RepositoryProvider>
  );
}
