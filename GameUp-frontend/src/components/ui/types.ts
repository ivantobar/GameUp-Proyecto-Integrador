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
