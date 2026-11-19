import { Stack } from 'expo-router';
import { RoleGate } from '@/features/auth/RoleGate';
import { useStackScreenOptions } from '@/features/motion/useStackScreenOptions';

/**
 * Espacio de la directora: las pestañas («Estudiantes», «Por validar» y
 * «Resumen») y, encima, el detalle de un estudiante y «Asignar actividad».
 * Solo para una sesión de directora (`RoleGate`).
 */
export default function DirectorLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <RoleGate role="director">
      <Stack screenOptions={screenOptions} />
    </RoleGate>
  );
}
