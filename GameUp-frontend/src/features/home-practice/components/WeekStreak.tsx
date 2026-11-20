import { StyleSheet, View } from 'react-native';
import { AppText, Card, Icon } from '@/components/ui';
import type { PracticeDay } from '@/data/types';
import { colors, radii, sizes, spacing } from '@/theme';

/** Inicial de cada día (domingo = 0), como en el calendario. */
const DAY_INITIALS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const;
const DAY_NAMES = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
] as const;

/** Día de la semana de una fecha AAAA-MM-DD (al mediodía: sin saltos de zona). */
function weekday(date: string): number {
  return new Date(`${date}T12:00:00`).getDay();
}

/** «Esta semana practicaron 2 días.» */
export function practicedDaysText(days: readonly PracticeDay[]): string {
  const count = days.filter((day) => day.practiced).length;
  if (count === 0) return 'Esta semana todavía no han practicado en casa.';
  return count === 1
    ? 'Esta semana practicaron 1 día.'
    : `Esta semana practicaron ${count} días.`;
}

interface WeekStreakProps {
  days: readonly PracticeDay[];
}

/**
 * Los días que practicaron en casa esta semana, como una fila de círculos:
 * el día practicado lleva ✓ sobre verde (forma, no solo color). Los demás
 * se ven neutros, sin tachar ni marcar en rojo: sin culpa si faltan días.
 */
export function WeekStreak({ days }: WeekStreakProps) {
  const summary = practicedDaysText(days);
  const practicedNames = days
    .filter((day) => day.practiced)
    .map((day) => DAY_NAMES[weekday(day.date)])
    .join(', ');

  return (
    <Card>
      <View
        style={styles.body}
        accessible
        accessibilityLabel={
          practicedNames
            ? `${summary} Practicaron el ${practicedNames}.`
            : summary
        }
      >
        <AppText variant="bodyStrong">Días que practicaron</AppText>
        <View style={styles.days}>
          {days.map((day) => (
            <View
              key={day.date}
              style={[styles.day, day.practiced ? styles.done : styles.open]}
            >
              {day.practiced ? (
                <Icon name="check" size="sm" color={colors.texto.sobreOscuro} />
              ) : (
                <AppText variant="support" tone="secundario">
                  {DAY_INITIALS[weekday(day.date)]}
                </AppText>
              )}
            </View>
          ))}
        </View>
        <AppText variant="support" tone="secundario">
          {summary}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.sm,
  },
  /** Con letra grande, los días bajan de línea en vez de salirse. */
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  /** Alto y ancho mínimos (no fijos): con letra grande la inicial no se corta. */
  day: {
    minWidth: sizes.touchMin - spacing.xs,
    minHeight: sizes.touchMin - spacing.xs,
    paddingHorizontal: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  done: {
    backgroundColor: colors.verde.oscuro,
  },
  open: {
    backgroundColor: colors.superficie.blanca,
    borderWidth: sizes.border,
    borderColor: colors.texto.secundario,
  },
});
