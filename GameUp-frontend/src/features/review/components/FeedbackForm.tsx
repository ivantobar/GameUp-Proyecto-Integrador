import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, FilterChip, TextField } from '@/components/ui';
import { spacing } from '@/theme';
import { feedbackSuggestions } from '../reviewText';

/** Opciones al enviar «Practicar más». */
export interface FeedbackOptions {
  /** Enviar también la indicación como nota para la familia (con aviso). */
  shareWithFamily: boolean;
}

interface FeedbackFormProps {
  studentName: string;
  busy: boolean;
  /**
   * Ofrecer «Enviar también a la familia» (cuando la indicación no llega
   * sola a la familia como nota).
   */
  shareOption?: boolean;
  /** Devuelve `true` si se guardó (entonces el formulario se cierra). */
  onSubmit: (feedback: string, options?: FeedbackOptions) => Promise<boolean>;
  onCancel: () => void;
}

/**
 * «Practicar más»: la retroalimentación es obligatoria (regla de negocio 4).
 * Llega al estudiante y a su familia en «Practicar en casa».
 */
export function FeedbackForm({
  studentName,
  busy,
  shareOption = false,
  onSubmit,
  onCancel,
}: FeedbackFormProps) {
  const [text, setText] = useState('');
  const [share, setShare] = useState(false);
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
      {shareOption ? (
        <FilterChip
          label="Enviar también como nota a la familia"
          selected={share}
          onPress={() => setShare((value) => !value)}
        />
      ) : null}
      <Button
        label="Enviar indicación"
        icon="check"
        disabled={empty}
        loading={busy}
        accessibilityHint={
          empty ? 'Escribe primero qué debe practicar' : undefined
        }
        onPress={() => {
          const sent = share
            ? onSubmit(text.trim(), { shareWithFamily: true })
            : onSubmit(text.trim());
          sent.catch(() => {});
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
