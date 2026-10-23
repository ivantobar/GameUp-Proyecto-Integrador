import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, FilterChip, TextField } from '@/components/ui';
import { spacing } from '@/theme';
import { feedbackSuggestions } from '../reviewText';

interface FeedbackFormProps {
  studentName: string;
  busy: boolean;
  /** Devuelve `true` si se guardó (entonces el formulario se cierra). */
  onSubmit: (feedback: string) => Promise<boolean>;
  onCancel: () => void;
}

/**
 * «Practicar más»: la retroalimentación es obligatoria (regla de negocio 4).
 * Llega al estudiante y a su familia en «Practicar en casa».
 */
export function FeedbackForm({
  studentName,
  busy,
  onSubmit,
  onCancel,
}: FeedbackFormProps) {
  const [text, setText] = useState('');
  const empty = text.trim().length === 0;

  return (
    <View style={styles.form}>
      <TextField
        label={`¿Qué debe practicar ${studentName}?`}
        value={text}
        onChangeText={setText}
        multiline
        placeholder="Escribe una indicación corta"
        helper="La verá la familia en «Practicar en casa»."
        testID="feedback-input"
      />
      <AppText variant="support" tone="secundario">
        Frases rápidas
      </AppText>
      <View style={styles.chips}>
        {feedbackSuggestions.map((phrase) => (
          <FilterChip
            key={phrase}
            label={phrase}
            selected={text === phrase}
            onPress={() => setText(phrase)}
          />
        ))}
      </View>
      <Button
        label="Enviar indicación"
        icon="check"
        disabled={empty}
        loading={busy}
        accessibilityHint={
          empty ? 'Escribe primero qué debe practicar' : undefined
        }
        onPress={() => {
          onSubmit(text.trim()).catch(() => {});
        }}
      />
      <Button label="Cancelar" variant="link" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
