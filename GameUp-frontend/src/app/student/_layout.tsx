import { Stack } from 'expo-router';
import { RoleGate } from '@/features/auth/RoleGate';
import { useStackScreenOptions } from '@/features/motion/useStackScreenOptions';

/**
 * Flujo del estudiante: las pestañas (Inicio, Juegos, Progreso) y, encima,
 * las pantallas de cada juego, que no muestran la barra inferior. Solo
 * para una sesión de estudiante (`RoleGate`).
 */
export default function StudentLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <RoleGate role="student">
      <Stack screenOptions={screenOptions} />
    </RoleGate>
  );
}
