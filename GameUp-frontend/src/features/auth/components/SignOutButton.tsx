import { IconButton } from '@/components/ui';
import { useSignOut } from '../useSignOut';

interface SignOutButtonProps {
  /**
   * Si se da, el botón no sale: hace esto (por ejemplo, pedir confirmación
   * en el espacio del estudiante, ver `SignOutConfirm`).
   */
  onPress?: () => void;
  accessibilityHint?: string;
}

/**
 * «Cerrar sesión» en el encabezado. Los adultos (docente, directora y
 * acudiente) salen al tocarlo. El estudiante lo tiene en «Mi progreso»,
 * pero pide confirmación para que el niño no salga sin querer.
 */
export function SignOutButton({
  onPress,
  accessibilityHint,
}: SignOutButtonProps = {}) {
  const { signOut, signingOut } = useSignOut();
  return (
    <IconButton
      icon="logout"
      variant="soft"
      accessibilityLabel="Cerrar sesión"
      accessibilityHint={accessibilityHint}
      disabled={signingOut}
      onPress={
        onPress ??
        (() => {
          signOut().catch(() => {});
        })
      }
    />
  );
}
