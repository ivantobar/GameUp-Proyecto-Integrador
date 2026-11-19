import { Stack } from 'expo-router';
import { RoleGate } from '@/features/auth/RoleGate';
import { useStackScreenOptions } from '@/features/motion/useStackScreenOptions';

/**
 * Espacio del docente: las pestañas («Por revisar» y «Mis estudiantes») y,
 * encima, el detalle de un estudiante y «Asignar actividad». Solo para una
 * sesión de docente (`RoleGate`).
 */
export default function TeacherLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <RoleGate role="teacher">
      <Stack screenOptions={screenOptions} />
    </RoleGate>
  );
}
