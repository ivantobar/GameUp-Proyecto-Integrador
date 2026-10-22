import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { fontFamilies } from './typography';

/**
 * Archivos de Nunito que carga `useFonts` en `src/app/_layout.tsx`.
 * Se importa cada grosor por separado para no incluir en la app los otros
 * 13 archivos de la familia.
 */
export const fontAssets = {
  [fontFamilies.regular]: Nunito_400Regular,
  [fontFamilies.bold]: Nunito_700Bold,
  [fontFamilies.extraBold]: Nunito_800ExtraBold,
};
