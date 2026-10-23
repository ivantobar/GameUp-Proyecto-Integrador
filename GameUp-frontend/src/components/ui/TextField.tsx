import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radii, sizes, spacing, typography } from '@/theme';
import { AppText } from './AppText';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Varias líneas (por ejemplo, una retroalimentación). */
  multiline?: boolean;
  /** Texto de ayuda o de error debajo del campo. */
  helper?: string;
  testID?: string;
}

/**
 * Campo de texto de la guía («Nombre o apodo»): etiqueta arriba, fondo
 * blanco, borde suave y borde verde oscuro al escribir. Solo para adultos.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  helper,
  testID,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong">{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.texto.secundario}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        accessibilityHint={helper}
        testID={testID}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            borderColor: focused ? colors.verde.oscuro : colors.borde.suave,
          },
        ]}
      />
      {helper ? (
        <AppText variant="support" tone="secundario">
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
  },
  input: {
    ...typography.body,
    color: colors.texto.principal,
    minHeight: sizes.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: sizes.border,
    backgroundColor: colors.superficie.blanca,
  },
  multiline: {
    minHeight: sizes.button * 2,
    textAlignVertical: 'top',
  },
});
