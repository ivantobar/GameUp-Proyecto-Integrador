import { Stack } from 'expo-router';
import { AdultSurfaces } from '@/components/ui';
import { RoleGate } from '@/features/auth/RoleGate';
import { useStackScreenOptions } from '@/features/motion/useStackScreenOptions';

/**
 * Espacio del acudiente («Practicar en casa»). Solo para una sesión de
 * acudiente (`RoleGate`).
 */
export default function GuardianLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <RoleGate role="guardian">
      {/* Pantallas de adultos: relieve discreto y sin rebote. */}
      <AdultSurfaces>
        <Stack screenOptions={screenOptions} />
      </AdultSurfaces>
    </RoleGate>
  );
}
