import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  FilterChip,
  HeaderBackButton,
  Notice,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { ReviewCard } from '@/features/review/components/ReviewCard';
import {
  matchesFilter,
  pendingTitle,
  reviewFilters,
  type ReviewFilter,
} from '@/features/review/reviewText';
import { useReviewQueue } from '@/features/review/useReviewQueue';
import { spacing } from '@/theme';

/** Pantalla 8 · Docente: «Por escuchar». */
export default function TeacherReviewScreen() {
  const queue = useReviewQueue();
  const { resource, reload, refresh, message, busyId } = queue;
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  useRefreshOnFocus(refresh);

  const items =
    resource.status === 'ready'
      ? resource.data.items.filter((item) => matchesFilter(item, filter))
      : [];
  // Abierta: la que eligió el docente o, si no, la primera de la lista.
  const expandedId =
    openId !== null && items.some((item) => item.id === openId)
      ? openId
      : (items[0]?.id ?? null);

  return (
    <Screen
      header={
        <ScreenHeader
          left={
            // Después de iniciar sesión no hay pantalla anterior.
            router.canGoBack() ? (
              <HeaderBackButton onPress={() => router.back()} />
            ) : undefined
          }
          title="Por escuchar"
        />
      }
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Buscando actividades…" />
      ) : null}
      {resource.status === 'error' ? (
        <StateView
          kind="error"
          title="No pudimos cargar las actividades"
          message="Revisa la conexión."
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}

      {resource.status === 'ready' ? (
        <>
          <AppText variant="title" accessibilityRole="header">
            {pendingTitle(resource.data.items.length)}
          </AppText>

          {message ? (
            <View accessibilityLiveRegion="polite">
              <Notice
                icon={message.tone === 'done' ? 'check' : 'offline'}
                tone={message.tone === 'done' ? 'soft' : 'warm'}
                message={message.text}
              />
            </View>
          ) : null}

          <View style={styles.chips}>
            {reviewFilters.map(({ value, label }) => (
              <FilterChip
                key={value}
                label={label}
                selected={filter === value}
                onPress={() => setFilter(value)}
              />
            ))}
          </View>

          {items.length === 0 ? (
            <StateView
              kind="empty"
              title="No hay nada por revisar"
              message="Cuando un estudiante termine una actividad, aparecerá aquí."
            />
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <ReviewCard
                  key={item.id}
                  item={item}
                  expanded={item.id === expandedId}
                  onExpand={() => setOpenId(item.id)}
                  busy={busyId === item.id}
                  onValidate={() => {
                    queue.validate(item).catch(() => {});
                  }}
                  onRequestMore={(feedback) =>
                    queue.requestMorePractice(item, feedback)
                  }
                  onSaveVoiceNote={(audioUri) =>
                    queue.saveFamilyVoiceNote(item, audioUri)
                  }
                />
              ))}
            </View>
          )}

          <Notice
            icon="video"
            tone="warm"
            title="Gestos de la fundación"
            message="Graba el gesto de cada sonido. Es el video que ven los niños en «Ver el gesto». Llega en una próxima versión."
            action={
              <Button
                label="Grabar un gesto"
                icon="video"
                variant="secondary"
                disabled
                accessibilityHint="Próximamente"
                onPress={() => {}}
              />
            }
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
});
