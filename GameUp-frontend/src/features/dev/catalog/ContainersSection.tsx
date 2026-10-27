import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  Icon,
  InitialsAvatar,
  Notice,
  NumberedSteps,
  PressableCard,
  StateView,
  type CardTone,
} from '@/components/ui';
import { colors, spacing } from '@/theme';
import { CatalogLabel, CatalogSection } from './CatalogSection';

const cardTones: readonly { tone: CardTone; name: string; onDark: boolean }[] =
  [
    { tone: 'surface', name: 'Blanca', onDark: false },
    { tone: 'soft', name: 'Verde suave', onDark: false },
    { tone: 'warm', name: 'Naranja suave', onDark: false },
    { tone: 'brand', name: 'Verde oscuro', onDark: true },
    { tone: 'deep', name: 'Verde profundo', onDark: true },
  ];

const noop = () => {};

/** Tarjetas, insignias, avisos, pasos y estados de carga, vacío y error. */
export function ContainersSection() {
  return (
    <>
      <CatalogSection
        title="Tarjetas"
        note="Planas, sin sombras. Las que se tocan muestran un borde al presionar."
      >
        {cardTones.map(({ tone, name, onDark }) => (
          <Card key={tone} tone={tone}>
            <AppText
              variant="bodyStrong"
              tone={onDark ? 'sobreOscuro' : 'principal'}
            >
              {name}
            </AppText>
          </Card>
        ))}
        <CatalogLabel>Tarjeta que se toca</CatalogLabel>
        <View style={styles.row}>
          <PressableCard
            tone="brand"
            style={styles.flex}
            accessibilityLabel="Habla conmigo. Mira, oye y dilo. Nuevo."
            onPress={noop}
          >
            <Badge label="Nuevo" />
            <AppText variant="subtitle" tone="sobreOscuro">
              Habla conmigo
            </AppText>
            <AppText tone="sobreOscuro">Mira, oye y dilo</AppText>
          </PressableCard>
          <PressableCard
            tone="warm"
            style={styles.flex}
            accessibilityLabel="Busca la boca. Oye y toca. Tarea."
            onPress={noop}
          >
            <Badge label="Tarea" />
            <AppText variant="subtitle">Busca la boca</AppText>
            <AppText tone="secundario">Oye y toca</AppText>
          </PressableCard>
        </View>
      </CatalogSection>

      <CatalogSection title="Insignias">
        <View style={styles.row}>
          <Badge label="Nueva" />
          <Badge label="Tarea" />
          <Badge label="Validada" tone="brand" />
          <Badge label="Próximamente" tone="neutral" />
        </View>
      </CatalogSection>

      <CatalogSection title="Avisos">
        <Notice
          icon="time"
          message="Tu profe lo va a escuchar antes de sumarlo a tu progreso"
        />
        <Notice
          icon="note"
          tone="soft"
          title="Nota de la profe"
          message="Martín ya redondea los labios."
        />
        <Notice
          icon="video"
          tone="warm"
          title="Gestos de la fundación"
          message='Graba el gesto de cada sonido. Es el video que ven los niños en "Ver el gesto".'
          action={
            <Button
              label="Grabar un gesto"
              icon="video"
              variant="secondary"
              onPress={noop}
            />
          }
        />
      </CatalogSection>

      <CatalogSection title="Personas y pasos">
        <Card>
          <View style={styles.row}>
            <InitialsAvatar initials="MC" />
            <View style={styles.flex}>
              <AppText variant="bodyStrong">Martín C.</AppText>
              <AppText variant="support" tone="secundario">
                Habla conmigo · Sonido O · hoy
              </AppText>
            </View>
            <Icon name="forward" color={colors.texto.secundario} />
          </View>
        </Card>
        <Card>
          <AppText variant="subtitle">Así lo practican</AppText>
          <NumberedSteps
            steps={[
              'Siéntense frente a frente, a la altura de sus ojos.',
              'Haz el gesto y di "o" despacio, dos veces.',
              'Celebra cada intento, aunque no salga igual.',
            ]}
          />
        </Card>
      </CatalogSection>

      <CatalogSection
        title="Estados"
        note="Mensajes amables: sin «error» ni «fallo» en las pantallas del niño."
      >
        <Card>
          <StateView kind="loading" title="Preparando tus juegos…" />
        </Card>
        <Card>
          <StateView
            kind="empty"
            title="Aún no hay grabaciones"
            message="Cuando tus estudiantes practiquen, aparecerán aquí."
          />
        </Card>
        <Card>
          <StateView
            kind="error"
            title="Vamos a intentarlo otra vez"
            message="No pudimos traer tus juegos."
            action={{ label: 'Intentar de nuevo', onPress: noop }}
          />
        </Card>
      </CatalogSection>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
