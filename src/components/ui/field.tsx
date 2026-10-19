import { useId, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/text';
import { maskDate, maskTime } from '@/lib/format';
import { useAppTheme } from '@/theme/theme-provider';
import { FontFamily, Radius } from '@/theme/tokens';

export type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
};

export function TextField({ label, hint, error, style, multiline, onFocus, onBlur, ...rest }: TextFieldProps) {
  const { colors, scheme } = useAppTheme();
  const id = useId();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrapper}>
      <AppText nativeID={id} variant="small" weight="bold" tone="label">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        aria-labelledby={id}
        placeholderTextColor={colors.placeholder}
        keyboardAppearance={scheme}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: colors.text,
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.danger : focused ? colors.accent : colors.inputBorder,
            borderWidth: focused || error ? 2 : 1,
            paddingHorizontal: focused || error ? 13 : 14,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

type MaskedProps = Omit<TextFieldProps, 'onChangeText' | 'value'> & {
  value: string;
  onChangeText: (value: string) => void;
};

/** Data no formato DD/MM/AAAA, com máscara enquanto digita. */
export function DateField({ value, onChangeText, ...rest }: MaskedProps) {
  return (
    <TextField
      value={value}
      onChangeText={(text) => onChangeText(maskDate(text))}
      keyboardType="number-pad"
      placeholder="DD/MM/AAAA"
      maxLength={10}
      {...rest}
    />
  );
}

/** Horário HH:MM. */
export function TimeField({ value, onChangeText, ...rest }: MaskedProps) {
  return (
    <TextField
      value={value}
      onChangeText={(text) => onChangeText(maskTime(text))}
      keyboardType="number-pad"
      placeholder="HH:MM"
      maxLength={5}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6, flex: 1 },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.sm + 2,
    borderWidth: 1,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    // No navegador o foco aparece pela borda verde, não pelo contorno padrão.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  multiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
});
