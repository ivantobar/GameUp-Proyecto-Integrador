import { StyleSheet, View } from 'react-native';
import { AppText, Backdrop, Card, type BackdropKind } from '@/components/ui';
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
  { token: 'fondo.nino · pendiente', value: colors.fondo.nino },
  { token: 'relieve.naranja · pendiente', value: colors.relieve.naranja },
  { token: 'relieve.superficie · pendiente', value: colors.relieve.superficie },
];

/** Fondos decorativos sobre el color donde se usan. */
const backdrops: readonly {
  kind: BackdropKind;
  name: string;
  background: ThemeColor;
}[] = [
  {
    kind: 'clouds',
    name: 'Nubes · fondo del niño',
    background: colors.fondo.nino,
  },
  {
    kind: 'hills',
    name: 'Colinas · Inicio y ¡Listo!',
    background: colors.fondo.nino,
  },
  {
    kind: 'bubbles',
    name: 'Burbujas · juegos (Clasificar)',
    background: colors.identidad.clasificarFondo,
  },
];

/** Identidad de cada juego (pendiente de aprobación): fondo y acento. */
const gameIdentities: readonly {
  name: string;
  background: ThemeColor;
  accent: ThemeColor;
}[] = [
  {
    name: 'Emparejar',
    background: colors.identidad.emparejarFondo,
    accent: colors.identidad.emparejarAcento,
  },
  {
    name: 'Clasificar',
    background: colors.identidad.clasificarFondo,
    accent: colors.identidad.clasificarAcento,
  },
  {
    name: 'Secuenciar',
    background: colors.juego.fondoAmarillo,
    accent: colors.identidad.secuenciarAcento,
  },
  {
    name: 'Memoria',
    background: colors.identidad.memoriaFondo,
    accent: colors.identidad.memoriaAcento,
  },
  {
    name: 'Habla conmigo',
    background: colors.verde.suave,
    accent: colors.verde.oscuro,
  },
  {
    name: 'Busca la boca',
    background: colors.identidad.bocaFondo,
    accent: colors.identidad.bocaAcento,
  },
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
];

/** Colores con su contraste y las ocho variantes de texto. */
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
        note="Solo para reconocer el juego (fondo y encabezado). Nunca marcan un estado: elegido, pista y acierto usan siempre los verdes de la guía. Pendiente de aprobación."
      >
        {gameIdentities.map((game) => (
          <View
            key={game.name}
            style={[styles.identity, { backgroundColor: game.background }]}
          >
            <View
              style={[styles.identityAccent, { backgroundColor: game.accent }]}
            />
            <AppText variant="bodyStrong" style={styles.flex}>
              {game.name}
            </AppText>
            <AppText variant="support" tone="secundario">
              acento {formatRatio(contrastRatio(game.accent, game.background))}
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
  identityAccent: {
    width: sizes.icon.lg,
    height: sizes.icon.lg,
    borderRadius: radii.pill,
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
