/**
 * Props base que respeta todo elemento tocable de la app (principio de
 * sustitución de Liskov): cualquier variante acepta y cumple estas props.
 */
export interface PressableBaseProps {
  onPress: () => void;
  disabled?: boolean;
  /** Qué pasa al tocarlo, si el texto visible no lo deja claro. */
  accessibilityHint?: string;
  testID?: string;
}

/**
 * Recarga de una pantalla (la arma `useScreenRefresh`). `Screen` la usa para
 * deslizar hacia abajo y el aviso si falla; `ScreenHeader`, para el botón
 * «Actualizar» de las pantallas de adultos.
 */
export interface ScreenRefresh {
  /** Recarga pedida por la persona (deslizar o «Actualizar»). */
  onRefresh: () => void;
  /** Hay una recarga en curso (el botón «Actualizar» espera). */
  refreshing: boolean;
  /** La persona deslizó hacia abajo y la recarga sigue (ruedita arriba). */
  pulling: boolean;
  /** Falló la última recarga: aviso suave con «Intentar de nuevo». */
  failed: boolean;
}
