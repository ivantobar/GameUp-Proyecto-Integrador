import { StyleSheet, View } from 'react-native';
import { AppText, Backdrop, Card, type BackdropKind } from '@/components/ui';
import { GameIconFrame } from '@/components/gameup';
import type { GameId } from '@/data/types';
import {
  colors,
  radii,
  sizes,
  spacing,
  typography,
  type TextVariant,
  type ThemeColor,
} from '@/theme';
import { AA, contrastRatio } from '@/theme/contrast';
import { CatalogLabel, CatalogSection } from './CatalogSection';

interface Swatch {
  token: string;
  value: ThemeColor;
}

const swatches: readonly Swatch[] = [
  { token: 'marca.verde', value: colors.marca.verde },
  { token: 'marca.naranja', value: colors.marca.naranja },
  { token: 'marca.gris', value: colors.marca.gris },
  { token: 'verde.oscuro', value: colors.verde.oscuro },
  { token: 'verde.suave', value: colors.verde.suave },
  { token: 'verde.profundo · derivado', value: colors.verde.profundo },
  { token: 'naranja.suave', value: colors.naranja.suave },
  { token: 'naranja.presionado · pendiente', value: colors.naranja.presionado },
  { token: 'texto.principal', value: colors.texto.principal },
  { token: 'texto.secundario', value: colors.texto.secundario },
  { token: 'superficie.blanca · derivado', value: colors.superficie.blanca },
  { token: 'cafe.oscuro · derivado', value: colors.cafe.oscuro },
  { token: 'borde.suave · derivado', value: colors.borde.suave },
  { token: 'estrella.vacia · derivado', value: colors.estrella.vacia },
  { token: 'borde.relieve · pendiente', value: colors.borde.relieve },
];

/** Fondos decorativos sobre el color donde se usan. */
const backdrops: readonly {
  kind: BackdropKind;
  name: string;
  background: ThemeColor;
}[] = [
  {
    kind: 'clouds',
    name: 'Nubes · pantallas del niño',
    background: colors.marca.gris,
  },
  {
    kind: 'hills',
    name: 'Colinas · Inicio',
    background: colors.marca.gris,
  },
  {
    kind: 'bubbles',
    name: 'Burbujas · juegos',
    background: colors.marca.gris,
  },
];

/** Identidad de cada juego (pendiente): solo el fondo detrás del dibujo. */
const gameIdentities: readonly { name: string; game: GameId }[] = [
  { name: 'Emparejar', game: 'match' },
  { name: 'Clasificar', game: 'classify' },
  { name: 'Secuenciar', game: 'sequence' },
  { name: 'Memoria', game: 'memory' },
  { name: 'Habla conmigo', game: 'speak' },
  { name: 'Busca la boca', game: 'findMouth' },
];

function formatRatio(ratio: number): string {
  const verdict =
    ratio >= AA.text ? 'AA' : ratio >= AA.graphic ? 'gráficos' : 'no';
  return `${ratio.toFixed(1).replace('.', ',')}:1 (${verdict})`;
}

const typeSamples: readonly { variant: TextVariant; name: string }[] = [
  { variant: 'display', name: 'Display' },
  { variant: 'title', name: 'Título' },
  { variant: 'subtitle', name: 'Subtítulo' },
  { variant: 'body', name: 'Cuerpo' },
  { variant: 'bodyStrong', name: 'Cuerpo fuerte' },
  { variant: 'button', name: 'Botón' },
  { variant: 'label', name: 'Etiqueta' },
  { variant: 'support', name: 'Apoyo' },
  { variant: 'number', name: 'Cifra (Resumen de la directora)' },
];

/** Colores con su contraste y las variantes de texto. */
export function FoundationsSection() {
  return (
    <>
      <CatalogSection
        title="Colores"
        note="Contraste contra texto principal y contra blanco. AA = 4,5:1 para texto; gráficos = 3:1."
      >
        {swatches.map((swatch) => (
          <View key={swatch.token} style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: swatch.value }]} />
            <View style={styles.swatchText}>
              <AppText variant="bodyStrong">{swatch.token}</AppText>
              <AppText variant="support" tone="secundario">
                {swatch.value} · texto principal{' '}
                {formatRatio(
                  contrastRatio(colors.texto.principal, swatch.value),
                )}{' '}
                · blanco{' '}
                {formatRatio(
                  contrastRatio(colors.texto.sobreOscuro, swatch.value),
                )}
              </AppText>
            </View>
          </View>
        ))}
      </CatalogSection>
      <CatalogSection
        title="Fondos"
        note="Formas planas de contraste muy bajo (1,1:1 a 1,2:1): decoran sin distraer. No se mueven ni las lee el lector de pantalla."
      >
        {backdrops.map((item) => (
          <View
            key={item.kind}
            style={[styles.backdropBox, { backgroundColor: item.background }]}
          >
            <Backdrop kind={item.kind} />
            <AppText variant="bodyStrong">{item.name}</AppText>
          </View>
        ))}
      </CatalogSection>
      <CatalogSection
        title="Identidad de cada juego"
        note="Solo el fondo suave detrás del dibujo de cada juego, para reconocerlo sin leer. Nunca en botones, textos, encabezados, fondos de pantalla ni estados. Pendiente de aprobación."
      >
        {gameIdentities.map((item) => (
          <View key={item.name} style={styles.identity}>
            <GameIconFrame game={item.game} />
            <AppText variant="bodyStrong" style={styles.flex}>
              {item.name}
            </AppText>
          </View>
        ))}
      </CatalogSection>

      <CatalogSection
        title="Tipografía"
        note="Nunito. Etiqueta subió de 13 a 15 px (decisión del equipo)."
      >
        <Card>
          {typeSamples.map(({ variant, name }) => (
            <AppText key={variant} variant={variant}>
              {`${name} ${typography[variant].fontSize}/${typography[variant].lineHeight}`}
            </AppText>
          ))}
        </Card>
        <CatalogLabel>Tonos de texto</CatalogLabel>
        <Card>
          <AppText tone="principal">Principal</AppText>
          <AppText tone="secundario">Secundario</AppText>
          <AppText tone="marca">Marca (verde oscuro)</AppText>
        </Card>
        <Card tone="warm">
          <AppText tone="cafe">Café sobre naranja suave</AppText>
        </Card>
        <Card tone="brand">
          <AppText tone="sobreOscuro">Blanco sobre verde oscuro</AppText>
        </Card>
      </CatalogSection>
    </>
  );
}

const styles = StyleSheet.create({
  backdropBox: {
    minHeight: sizes.categoryBin,
    padding: spacing.md,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  identity: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.xl,
  },
  flex: {
    flex: 1,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: sizes.iconButton.md,
    height: sizes.iconButton.md,
    borderRadius: radii.md,
    borderWidth: sizes.border,
    borderColor: colors.borde.suave,
  },
  swatchText: {
    flex: 1,
  },
});
