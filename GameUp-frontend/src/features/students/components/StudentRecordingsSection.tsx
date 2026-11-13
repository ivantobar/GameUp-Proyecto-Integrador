import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Notice } from '@/components/ui';
import { spacing } from '@/theme';
import { useDeleteRecordings } from '../useDeleteRecordings';
import { Section } from './Section';

interface StudentRecordingsSectionProps {
  studentId: string;
}

/**
 * «Grabaciones de voz» (solo la directora): borra TODAS las grabaciones
 * del estudiante, por ejemplo si la familia lo pide (Ley 1581). Pide
 * confirmación porque no se puede deshacer y dice cuántas se borraron.
 */
export function StudentRecordingsSection({
  studentId,
}: StudentRecordingsSectionProps) {
  const { confirming, busy, message, ask, cancel, confirm } =
    useDeleteRecordings(studentId);

  return (
    <Section title="Grabaciones de voz">
      <Card>
        <View style={styles.box}>
          <AppText variant="support" tone="secundario">
            Borra todas las grabaciones de voz de este estudiante, por ejemplo,
            si la familia lo pide. Sus intentos se conservan y se pueden validar
            sin audio.
          </AppText>

          {message ? (
            <View accessibilityLiveRegion="polite">
              <Notice
                icon={message.tone === 'done' ? 'check' : 'info'}
                tone={message.tone === 'done' ? 'soft' : 'warm'}
                message={message.text}
              />
            </View>
          ) : null}

          {confirming ? (
            <View style={styles.box} accessibilityLiveRegion="polite">
              <AppText variant="bodyStrong">
                ¿Borrar todas sus grabaciones? No se puede deshacer.
              </AppText>
              <Button
                label="Sí, borrar todas"
                variant="warm"
                size="large"
                loading={busy}
                accessibilityLabel="Sí, borrar todas sus grabaciones"
                onPress={() => {
                  confirm().catch(() => {});
                }}
              />
              <Button
                label="Cancelar"
                variant="secondary"
                size="large"
                disabled={busy}
                accessibilityLabel="Cancelar, no borrar"
                onPress={cancel}
              />
            </View>
          ) : (
            <Button
              label="Borrar grabaciones"
              icon="mic"
              variant="warm"
              size="large"
              accessibilityLabel="Borrar todas sus grabaciones de voz"
              accessibilityHint="Pide confirmación. No se puede deshacer."
              onPress={ask}
            />
          )}
        </View>
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.sm,
  },
});
