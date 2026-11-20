import { StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import {
  Character,
  Illustration,
  Pictogram,
  type CharacterEyes,
} from '@/components/gameup';
import {
  contentDrawings,
  sceneDrawings,
  type IllustrationName,
} from '@/components/gameup/illustrations';
import { sizes, spacing } from '@/theme';
import { CatalogLabel, CatalogSection } from './CatalogSection';

const contentNames = Object.keys(contentDrawings) as IllustrationName[];
const sceneNames = Object.keys(sceneDrawings) as IllustrationName[];
const eyes: readonly CharacterEyes[] = ['open', 'happy', 'closed'];

/** Biblioteca propia de ilustraciones SVG y expresiones del personaje. */
export function IllustrationsSection() {
  return (
    <CatalogSection
      title="Ilustraciones"
      note="Diseño original del equipo GameUP, en SVG (sin licencias de terceros). Plano, redondeado, contorno oscuro y pocas formas. Las imágenes que sube la fundación tienen prioridad."
    >
      <CatalogLabel>Contenido de los juegos</CatalogLabel>
      <Card>
        <View style={styles.grid}>
          {contentNames.map((name) => (
            <View key={name} style={styles.item}>
              <Illustration name={name} size="sm" />
              <AppText variant="support" tone="secundario">
                {name}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <CatalogLabel>
        Orden: dibujo, emoji (sin dibujo), palabra (sin nada más)
      </CatalogLabel>
      <Card>
        <View style={styles.grid}>
          <Pictogram face={{ id: 'a', label: 'Plátano' }} />
          <Pictogram face={{ id: 'b', label: 'canoa', text: '🛶' }} />
          <Pictogram face={{ id: 'c', label: 'trompo' }} />
          <Pictogram face={{ id: 'd', label: 'manzana', text: 'Manzana' }} />
        </View>
      </Card>

      <CatalogLabel>Escenas (estados vacíos, bienvenida, pista)</CatalogLabel>
      <Card>
        <View style={styles.grid}>
          {sceneNames.map((name) => (
            <View key={name} style={styles.item}>
              <Illustration name={name} size="md" />
              <AppText variant="support" tone="secundario">
                {name}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <CatalogLabel>Expresiones del personaje</CatalogLabel>
      <Card>
        <View style={styles.grid}>
          {eyes.map((eye) => (
            <View key={eye} style={styles.item}>
              <Character
                mouth={eye === 'happy' ? 'smile' : 'closed'}
                eyes={eye}
                size="sm"
              />
              <AppText variant="support" tone="secundario">
                {eye}
              </AppText>
            </View>
          ))}
          <View style={styles.item}>
            <Character mouth="smile" wave size="sm" />
            <AppText variant="support" tone="secundario">
              saluda
            </AppText>
          </View>
        </View>
      </Card>
    </CatalogSection>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  item: {
    alignItems: 'center',
    minWidth: sizes.illustration.md,
    gap: spacing.xxs,
  },
});
