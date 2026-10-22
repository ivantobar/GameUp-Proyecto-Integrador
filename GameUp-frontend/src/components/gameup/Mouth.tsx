import { View } from 'react-native';
import Svg from 'react-native-svg';
import { sizes, type MouthSize } from '@/theme';
import type { Vowel } from '@/data/types';
import { mouthDescriptions, mouthShapes } from './mouthShapes';

interface MouthProps {
  vowel: Vowel;
  size?: MouthSize;
  /**
   * Si la boca transmite información por sí sola (Busca la boca), se
   * describe al lector de pantalla. Si va junto a un texto, es decorativa.
   */
  decorative?: boolean;
}

/** Boca suelta, sin cara. Uso: `<Mouth vowel="a" />`. */
export function Mouth({ vowel, size = 'md', decorative = false }: MouthProps) {
  const side = sizes.mouth[size];
  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : mouthDescriptions[vowel]}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      accessibilityElementsHidden={decorative}
    >
      <Svg width={side} height={side} viewBox="0 0 100 100">
        {mouthShapes[vowel]}
      </Svg>
    </View>
  );
}
