import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  FilterChip,
  HeaderBackButton,
  Notice,
  PressableCard,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import { spokenDate } from '@/data/bogotaDate';
import { spacing } from '@/theme';
import { leaveAssignedNotice } from '../assignmentNotice';
import { isAccessError } from '../assignmentText';
import {
  suggestedDateOptions,
  type SuggestedDateOption,
} from '../suggestedDates';
import { useAssignModule, type ModuleChoice } from '../useAssignModule';

interface AssignModuleViewProps {
  studentId: string;
}

/**
 * «Asignar actividad»: elegir un módulo publicado y, si se quiere, una
 * fecha sugerida. Los que ya tiene sin terminar aparecen como «Ya
 * asignado». Al confirmar, vuelve al detalle con «Actividad asignada».
 */
export function AssignModuleView({ studentId }: AssignModuleViewProps) {
  const { resource, reload, error, submitting, assign } =
    useAssignModule(studentId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dateOptions = useMemo(() => suggestedDateOptions(), []);
  const [dateKey, setDateKey] = useState<SuggestedDateOption['key']>('none');
  const date = dateOptions.find((o) => o.key === dateKey)?.date;

  const choices = resource.status === 'ready' ? resource.data : [];
  const selected = choices.find(
    (c) => c.module.id === selectedId && !c.alreadyAssigned,
  );

  const onConfirm = async () => {
    if (!selected) return;
    const ok = await assign(selected.module.id, date);
    if (ok) {
      leaveAssignedNotice(studentId);
      router.back();
    }
  };

  return (
    <Screen
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title="Asignar actividad"
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
            accessibilityHint={selected ? undefined : 'Primero elige un módulo'}
            onPress={() => {
              onConfirm().catch(() => {});
            }}
          />
        ) : undefined
      }
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Buscando módulos…" />
      ) : null}
      {resource.status === 'error' ? (
        isAccessError(resource.error) ? (
          <StateView
            kind="error"
            title="No puedes asignar a este estudiante"
            message="Si debería estar a tu cargo, habla con la fundación."
          />
        ) : (
          <StateView
            kind="error"
            title="No pudimos cargar los módulos"
            message="Revisa la conexión."
            action={{ label: 'Intentar de nuevo', onPress: reload }}
          />
        )
      ) : null}
      {resource.status === 'ready' && choices.length === 0 ? (
        <StateView
          kind="empty"
          title="No hay módulos publicados"
          message="Cuando la fundación publique uno, podrás asignarlo."
        />
      ) : null}

      {resource.status === 'ready' && choices.length > 0 ? (
        <>
          <AppText variant="label" tone="secundario" accessibilityRole="header">
            Elige un módulo
          </AppText>
          <View style={styles.list}>
            {choices.map((choice) => (
              <ModuleOption
                key={choice.module.id}
                choice={choice}
                selected={choice.module.id === selected?.module.id}
                onPress={() => setSelectedId(choice.module.id)}
              />
            ))}
          </View>

          <AppText variant="label" tone="secundario" accessibilityRole="header">
            Fecha sugerida (opcional)
          </AppText>
          <View style={styles.chips}>
            {dateOptions.map((option) => (
              <FilterChip
                key={option.key}
                label={option.label}
                selected={option.key === dateKey}
                accessibilityHint={
                  option.date ? `Para el ${spokenDate(option.date)}` : undefined
                }
                onPress={() => setDateKey(option.key)}
              />
            ))}
          </View>
          {date ? (
            <AppText variant="support" tone="secundario">
              Para el {spokenDate(date)}.
            </AppText>
          ) : null}

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

interface ModuleOptionProps {
  choice: ModuleChoice;
  selected: boolean;
  onPress: () => void;
}

/** Un módulo para elegir. Si ya está asignado, no se puede tocar. */
function ModuleOption({ choice, selected, onPress }: ModuleOptionProps) {
  const { module, alreadyAssigned } = choice;
  const state = alreadyAssigned
    ? 'Ya asignado'
    : selected
      ? 'Elegido'
      : undefined;
  return (
    <PressableCard
      tone={selected ? 'soft' : 'surface'}
      onPress={onPress}
      disabled={alreadyAssigned}
      accessibilityLabel={[module.title, module.category, state]
        .filter(Boolean)
        .join('. ')}
      testID={`modulo-${module.id}`}
    >
      <View style={styles.option}>
        <View style={styles.optionTexts}>
          <AppText variant="bodyStrong">{module.title}</AppText>
          {module.category ? (
            <AppText variant="support" tone="secundario">
              {module.category}
            </AppText>
          ) : null}
        </View>
        {alreadyAssigned ? <Badge label="Ya asignado" tone="neutral" /> : null}
        {selected ? <Badge label="Elegido" tone="brand" /> : null}
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionTexts: {
    flex: 1,
    gap: spacing.xxs,
  },
});
