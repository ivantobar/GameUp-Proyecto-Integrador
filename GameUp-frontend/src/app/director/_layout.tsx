import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/features/motion/useStackScreenOptions';

/**
 * Espacio de la directora: las pestañas («Estudiantes», «Por validar» y
 * «Resumen») y, encima, el detalle de un estudiante y «Asignar actividad».
 */
export default function DirectorLayout() {
  const screenOptions = useStackScreenOptions();
  return <Stack screenOptions={screenOptions} />;
}
