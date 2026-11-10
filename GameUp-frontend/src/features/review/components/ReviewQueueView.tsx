import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
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

interface ReviewQueueViewProps {
  /** «Por revisar» (docente) o «Por validar» (directora). */
  title: string;
  /** Solo las actividades de este estudiante. */
  studentId: string;
  /** «Martín C.»: para el título mientras cargan (viene de la lista). */
  studentName?: string;
}

/**
 * Actividades por revisar de un estudiante (Pantalla 8 · Docente «Por
 * escuchar», y «Por validar» de la directora). Se llega desde la lista de
 * estudiantes o desde su detalle. El backend combina el filtro con la
 * sesión: si el estudiante no es de quien revisa, no llega nada.
 */
export function ReviewQueueView({
  title,
  studentId,
  studentName,
}: ReviewQueueViewProps) {
  const queue = useReviewQueue(studentId);
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
  const name =
    (resource.status === 'ready'
      ? resource.data.items[0]?.student.displayName
      : undefined) ?? studentName;
  const allDone =
    resource.status === 'ready' && resource.data.items.length === 0;

  return (
    <Screen
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title={name ? `${title} · ${name}` : title}
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

          {allDone ? null : (
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
          )}

          {allDone ? (
            <StateView
              kind="empty"
              title={name ? `Revisaste todo de ${name}` : 'Revisaste todo'}
              message="Cuando vuelva a jugar, sus actividades aparecerán aquí."
              // Vuelve a donde estaba: la lista o el detalle del estudiante.
              action={{ label: 'Listo', onPress: () => router.back() }}
            />
          ) : items.length === 0 ? (
            <StateView
              kind="empty"
              title="Nada en este grupo"
              message="Toca «Todas» para ver sus otras actividades."
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
                  onRequestMore={(feedback, options) =>
                    queue.requestMorePractice(item, feedback, options)
                  }
                  onSaveVoiceNote={(audioUri) =>
                    queue.saveFamilyVoiceNote(item, audioUri)
                  }
                  loadRecording={() => queue.loadRecording(item)}
                  voiceNoteEnabled={queue.features.familyVoiceNote}
                  // Los niveles de cada juego se ven en el detalle del
                  // estudiante, no en cada actividad.
                  shareOption={!queue.features.feedbackAlwaysReachesFamily}
                />
              ))}
            </View>
          )}
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
