import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/features/motion/useStackScreenOptions';

/**
 * Flujo del estudiante: las pestañas (Inicio, Juegos, Progreso) y, encima,
 * las pantallas de cada juego, que no muestran la barra inferior.
 */
export default function StudentLayout() {
  const screenOptions = useStackScreenOptions();
  return <Stack screenOptions={screenOptions} />;
}
