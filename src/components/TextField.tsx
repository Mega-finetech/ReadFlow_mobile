import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useTheme } from '../theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const borderColor = error ? colors.error : colors.outline;

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <Text style={[typography.label, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      ) : null}
      <RNTextInput
        placeholderTextColor={colors.onSurfaceVariant}
        style={[
          styles.input,
          {
            color: colors.onSurface,
            backgroundColor: colors.surface,
            borderColor,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg,
          },
        ]}
        {...rest}
      />
      {error ? (
        <Text style={[typography.caption, { color: colors.error, marginTop: spacing.xs }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 0,
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
  },
});
