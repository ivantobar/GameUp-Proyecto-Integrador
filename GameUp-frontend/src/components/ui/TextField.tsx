import { useState, type ReactNode, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radii, sizes, spacing, typography } from '@/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

/** Ajustes del teclado y del autocompletado que el campo deja pasar. */
type InputOptions = Pick<
  TextInputProps,
  | 'secureTextEntry'
  | 'keyboardType'
  | 'autoComplete'
  | 'textContentType'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'returnKeyType'
  | 'onSubmitEditing'
  | 'submitBehavior'
  | 'editable'
>;

interface TextFieldProps extends InputOptions {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Varias líneas (por ejemplo, una retroalimentación). */
  multiline?: boolean;
  /** Texto de ayuda debajo del campo. */
  helper?: string;
  /**
   * Qué hay que corregir. Se muestra con ícono, texto y borde más grueso:
   * el error no se comunica solo con color.
   */
  error?: string;
  /** Botón dentro del campo, a la derecha (por ejemplo, ver la contraseña). */
  trailing?: ReactNode;
  inputRef?: Ref<TextInput>;
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
  error,
  trailing,
  inputRef,
  testID,
  ...inputOptions
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? colors.cafe.oscuro
    : focused
      ? colors.verde.oscuro
      : colors.borde.suave;

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong">{label}</AppText>
      <View
        style={[
          styles.box,
          multiline && styles.multilineBox,
          {
            borderColor,
            borderWidth: error ? sizes.borderStrong : sizes.border,
          },
        ]}
      >
        <TextInput
          {...inputOptions}
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.texto.secundario}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={error ?? helper}
          testID={testID}
          style={[styles.input, multiline && styles.multiline]}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="info" size="sm" color={colors.cafe.oscuro} />
          <AppText variant="support" tone="cafe" style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : helper ? (
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
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.superficie.blanca,
  },
  multilineBox: {
    alignItems: 'stretch',
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.texto.principal,
    minHeight: sizes.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: {
    minHeight: sizes.button * 2,
    textAlignVertical: 'top',
  },
  trailing: {
    paddingRight: spacing.xxs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xxs,
  },
  errorText: {
    flex: 1,
  },
});
