import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  IconButton,
  type ButtonVariant,
  type IconButtonVariant,
} from '@/components/ui';
import { spacing } from '@/theme';
import { CatalogLabel, CatalogSection } from './CatalogSection';

const buttonVariantNames: readonly { variant: ButtonVariant; name: string }[] =
  [
    { variant: 'primary', name: 'Principal' },
    { variant: 'secondary', name: 'Secundario' },
    { variant: 'accent', name: 'Acento' },
    { variant: 'link', name: 'Enlace' },
  ];

const iconVariants: readonly IconButtonVariant[] = [
  'neutral',
  'soft',
  'solid',
  'accent',
];

const noop = () => {};

/** Botones e íconos en todos sus estados. */
export function ActionsSection() {
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <>
      <CatalogSection
        title="Botones"
        note="Mantén presionado un botón para ver el estado presionado (cambia de color en 150 ms)."
      >
        {buttonVariantNames.map(({ variant, name }) => (
          <View key={variant} style={styles.group}>
            <CatalogLabel>{name}</CatalogLabel>
            <Button
              label={`${name} · normal`}
              variant={variant}
              onPress={noop}
            />
            <Button
              label={`${name} · con ícono`}
              variant={variant}
              icon="speaker"
              onPress={noop}
            />
            <Button
              label={`${name} · deshabilitado`}
              variant={variant}
              disabled
              onPress={noop}
            />
          </View>
        ))}

        <CatalogLabel>Cargando</CatalogLabel>
        <Button
          label="Tócame para cargar"
          loading={loading}
          onPress={simulateLoading}
        />

        <CatalogLabel>Grande (64 px) para el niño</CatalogLabel>
        <Button label="Ahora tú" size="large" onPress={noop} />

        <CatalogLabel>Acento como principal sobre verde oscuro</CatalogLabel>
        <Card tone="brand">
          <Button
            label="Continuar"
            variant="accent"
            size="large"
            onPress={noop}
          />
        </Card>

        <CatalogLabel>En fila (docente)</CatalogLabel>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button label="Lo logró" icon="check" onPress={noop} />
          </View>
          <View style={styles.flex}>
            <Button
              label="Practicar más"
              icon="replay"
              variant="secondary"
              onPress={noop}
            />
          </View>
        </View>
      </CatalogSection>

      <CatalogSection
        title="Botones de ícono"
        note="Tamaños sm 44, md 56 y lg 88 px."
      >
        {iconVariants.map((variant) => (
          <View key={variant} style={styles.group}>
            <CatalogLabel>{variant}</CatalogLabel>
            <View style={styles.row}>
              <IconButton
                icon="speaker"
                variant={variant}
                size="sm"
                accessibilityLabel="Oír, pequeño"
                onPress={noop}
              />
              <IconButton
                icon="speaker"
                variant={variant}
                accessibilityLabel="Oír"
                onPress={noop}
              />
              <IconButton
                icon="speaker"
                variant={variant}
                size="lg"
                accessibilityLabel="Oír, grande"
                onPress={noop}
              />
              <IconButton
                icon="speaker"
                variant={variant}
                disabled
                accessibilityLabel="Oír, deshabilitado"
                onPress={noop}
              />
            </View>
          </View>
        ))}
        <CatalogLabel>Íconos de la app</CatalogLabel>
        <View style={styles.row}>
          <IconButton icon="back" accessibilityLabel="Volver" onPress={noop} />
          <IconButton icon="close" accessibilityLabel="Cerrar" onPress={noop} />
          <IconButton
            icon="replay"
            accessibilityLabel="Repetir"
            onPress={noop}
          />
          <IconButton
            icon="play"
            variant="solid"
            size="sm"
            accessibilityLabel="Reproducir"
            onPress={noop}
          />
        </View>
      </CatalogSection>
    </>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
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
