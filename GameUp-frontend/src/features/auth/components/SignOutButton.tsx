import { IconButton } from '@/components/ui';
import { useSignOut } from '../useSignOut';

/**
 * «Cerrar sesión» en el encabezado de los espacios de los adultos (docente
 * y acudiente). El estudiante no lo tiene: no debe salir por accidente.
 */
export function SignOutButton() {
  const { signOut, signingOut } = useSignOut();
  return (
    <IconButton
      icon="logout"
      variant="soft"
      accessibilityLabel="Cerrar sesión"
      disabled={signingOut}
      onPress={() => {
        signOut().catch(() => {});
      }}
    />
  );
}
