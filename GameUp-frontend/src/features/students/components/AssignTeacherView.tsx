import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  HeaderBackButton,
  Notice,
  PressableCard,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import { spacing } from '@/theme';
import { leaveTeacherNotice } from '../assignmentNotice';
import { isAccessError } from '../assignmentText';
import { useAssignTeacher, type TeacherChoice } from '../useAssignTeacher';

interface AssignTeacherViewProps {
  studentId: string;
}

/**
 * «Asignar tallerista» (solo la directora): elegir una tallerista activa.
 * Las que ya lo tienen a cargo aparecen como «Ya lo tiene a cargo». Al
 * confirmar, vuelve al detalle con «Tallerista asignada».
 */
export function AssignTeacherView({ studentId }: AssignTeacherViewProps) {
  const { resource, reload, error, submitting, assign } =
    useAssignTeacher(studentId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const choices = resource.status === 'ready' ? resource.data : [];
  const selected = choices.find(
    (c) => c.teacher.id === selectedId && !c.alreadyInCharge,
  );

  const onConfirm = async () => {
    if (!selected) return;
    const ok = await assign(selected.teacher.id);
    if (ok) {
      leaveTeacherNotice(studentId);
      router.back();
    }
  };

  return (
    <Screen
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title="Asignar tallerista"
        />
      }
      footer={
        resource.status === 'ready' && choices.length > 0 ? (
          <Button
            label="Asignar"
            icon="check"
            size="large"
            loading={submitting}
            disabled={!selected}
            accessibilityLabel={
              selected ? `Asignar a ${selected.teacher.displayName}` : 'Asignar'
            }
            accessibilityHint={
              selected ? undefined : 'Primero elige una tallerista'
            }
            onPress={() => {
              onConfirm().catch(() => {});
            }}
          />
        ) : undefined
      }
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Buscando talleristas…" />
      ) : null}
      {resource.status === 'error' ? (
        isAccessError(resource.error) ? (
          <StateView
            kind="error"
            title="No puedes cambiar su tallerista"
            message="Solo la directora puede hacerlo."
          />
        ) : (
          <StateView
            kind="error"
            title="No pudimos cargar las talleristas"
            message="Revisa la conexión."
            action={{ label: 'Intentar de nuevo', onPress: reload }}
          />
        )
      ) : null}
      {resource.status === 'ready' && choices.length === 0 ? (
        <StateView
          kind="empty"
          title="No hay talleristas activas"
          message="Cuando la fundación active una cuenta de tallerista, aparecerá aquí."
        />
      ) : null}

      {resource.status === 'ready' && choices.length > 0 ? (
        <>
          <AppText variant="label" tone="secundario" accessibilityRole="header">
            Elige una tallerista
          </AppText>
          <View style={styles.list}>
            {choices.map((choice) => (
              <TeacherOption
                key={choice.teacher.id}
                choice={choice}
                selected={choice.teacher.id === selected?.teacher.id}
                onPress={() => setSelectedId(choice.teacher.id)}
              />
            ))}
          </View>

          {error ? (
            <View accessibilityLiveRegion="polite">
              <Notice icon="info" tone="warm" message={error} />
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

interface TeacherOptionProps {
  choice: TeacherChoice;
  selected: boolean;
  onPress: () => void;
}

/** Una tallerista para elegir. Si ya lo tiene a cargo, no se puede tocar. */
function TeacherOption({ choice, selected, onPress }: TeacherOptionProps) {
  const { teacher, alreadyInCharge } = choice;
  const state = alreadyInCharge
    ? 'Ya lo tiene a cargo'
    : selected
      ? 'Elegida'
      : undefined;
  return (
    <PressableCard
      tone={selected ? 'soft' : 'surface'}
      onPress={onPress}
      disabled={alreadyInCharge}
      accessibilityLabel={[teacher.displayName, state]
        .filter(Boolean)
        .join('. ')}
      testID={`tallerista-${teacher.id}`}
    >
      <View style={styles.option}>
        <AppText variant="bodyStrong" style={styles.flex}>
          {teacher.displayName}
        </AppText>
        {alreadyInCharge ? (
          <Badge label="Ya lo tiene a cargo" tone="neutral" />
        ) : null}
        {selected ? <Badge label="Elegida" tone="brand" /> : null}
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
