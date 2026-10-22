import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { spacing } from '@/theme';

interface CatalogSectionProps {
  title: string;
  note?: string;
  children: ReactNode;
}

/** Bloque del catálogo de desarrollo: título, nota y ejemplos. */
export function CatalogSection({ title, note, children }: CatalogSectionProps) {
  return (
    <View style={styles.section}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {note ? (
        <AppText variant="support" tone="secundario">
          {note}
        </AppText>
      ) : null}
      <View style={styles.items}>{children}</View>
    </View>
  );
}

interface CatalogLabelProps {
  children: string;
}

/** Subtítulo pequeño dentro de una sección. */
export function CatalogLabel({ children }: CatalogLabelProps) {
  return (
    <AppText variant="label" tone="secundario">
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  items: {
    gap: spacing.md,
  },
});
