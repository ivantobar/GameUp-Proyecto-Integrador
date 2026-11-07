import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/features/motion/useStackScreenOptions';

/**
 * Espacio del docente: las pestañas («Por escuchar» y «Mis estudiantes») y,
 * encima, el detalle de un estudiante y «Asignar actividad».
 */
export default function TeacherLayout() {
  const screenOptions = useStackScreenOptions();
  return <Stack screenOptions={screenOptions} />;
}
