import { IconButton } from '@/components/ui';
import { useNarration } from '@/features/narration/useNarration';

interface NarrationButtonProps {
  /** Instrucción que se lee en voz alta. */
  text: string;
}

/**
 * Botón de parlante: toda instrucción se puede oír (principio de los juegos).
 */
export function NarrationButton({ text }: NarrationButtonProps) {
  const { narrate } = useNarration();
  return (
    <IconButton
      icon="speaker"
      variant="soft"
      accessibilityLabel="Oír la instrucción"
      accessibilityHint={text}
      onPress={() => narrate(text)}
    />
  );
}
