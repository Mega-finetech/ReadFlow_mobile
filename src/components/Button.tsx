import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'error';
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const isPressedDisabled = disabled || loading;

  const background: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: colors.primary,
    secondary: colors.primaryContainer,
    ghost: 'transparent',
    error: colors.error,
  };

  const foreground: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: colors.onPrimary,
    secondary: colors.onPrimaryContainer,
    ghost: colors.primary,
    error: colors.onError,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isPressedDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background[variant],
          paddingVertical: spacing.lg,
          borderRadius: radius.md,
          opacity: isPressedDisabled ? 0.6 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator size="small" color={foreground[variant]} />
        )}
        <Text style={[styles.label, { color: foreground[variant], ...typography.label }]}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontWeight: '600',
  },
});
