import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/features/motion/useStackScreenOptions';
import { PracticeSessionProvider } from '@/features/speak/PracticeSession';

/**
 * «Habla conmigo»: la selección de sonido es la base del stack. Si se entra
 * directo a un paso (por ejemplo, con «Continuar» desde Inicio), la
 * selección queda debajo y la ✕ siempre vuelve a ella.
 */
export const unstable_settings = {
  anchor: 'index',
};

export default function SpeakLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <PracticeSessionProvider>
      <Stack screenOptions={screenOptions} />
    </PracticeSessionProvider>
  );
}
