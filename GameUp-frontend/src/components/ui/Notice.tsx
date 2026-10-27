import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing, type ThemeColor } from '@/theme';
import { AppText, type TextTone } from './AppText';
import { Icon, type IconName } from './Icon';

export type NoticeTone = 'warm' | 'soft' | 'surface';

export const noticeTones = {
  /** Naranja suave con ícono y texto café: «Gestos de la fundación». */
  warm: {
    background: colors.naranja.suave,
    icon: colors.cafe.oscuro,
    message: 'cafe',
  },
  /** Verde suave: «Nota de la profe». */
  soft: {
    background: colors.verde.suave,
    icon: colors.verde.oscuro,
    message: 'principal',
  },
  /** Blanco: «Tu profe lo va a escuchar antes de sumarlo a tu progreso». */
  surface: {
    background: colors.superficie.blanca,
    icon: colors.texto.secundario,
    message: 'secundario',
  },
} as const satisfies Record<
  NoticeTone,
  { background: ThemeColor; icon: ThemeColor; message: TextTone }
>;

interface NoticeProps {
  icon: IconName;
  message: string;
  title?: string;
  tone?: NoticeTone;
  /** Acción opcional debajo del texto (un `Button`). */
  action?: ReactNode;
}

/** Aviso con ícono, texto breve y una acción opcional. */
export function Notice({
  icon,
  message,
  title,
  tone = 'surface',
  action,
}: NoticeProps) {
  const config = noticeTones[tone];
  return (
    <View style={[styles.box, { backgroundColor: config.background }]}>
      <View
        style={styles.row}
        accessible
        accessibilityLabel={title ? `${title}. ${message}` : message}
      >
        <Icon name={icon} color={config.icon} />
        <View style={styles.texts}>
          {title ? <AppText variant="bodyStrong">{title}</AppText> : null}
          <AppText variant="support" tone={config.message}>
            {message}
          </AppText>
        </View>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
});
