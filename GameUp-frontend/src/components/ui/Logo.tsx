import { Image, StyleSheet } from 'react-native';
import { sizes } from '@/theme';

/** Logo completo, con lema, tal como viene en la guía de estilos. */
const logo = require('../../../assets/brand/asisco-logo.png');

/** Proporción del archivo original (528 × 174 px). */
const ASPECT_RATIO = 528 / 174;

/**
 * Logo de la Fundación ASISCO UP. Regla 1 de la guía: se usa tal como lo
 * entrega la fundación, sin redibujarlo, recolorearlo ni deformarlo, y
 * siempre sobre blanco o sobre el gris de fondo.
 */
export function Logo() {
  return (
    <Image
      source={logo}
      style={styles.logo}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel="Fundación ASISCO UP"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: sizes.logo,
    height: sizes.logo / ASPECT_RATIO,
    alignSelf: 'center',
  },
});
