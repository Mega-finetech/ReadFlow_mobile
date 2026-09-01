import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../theme';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
}

export function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
        <Icon size={32} color={colors.onSurfaceVariant} />
      </View>
      <Text style={[typography.heading, { color: colors.onSurface, marginTop: spacing.lg }]}>
        {title}
      </Text>
      {message ? (
        <Text
          style={[
            typography.body,
            { color: colors.onSurfaceVariant, marginTop: spacing.sm, textAlign: 'center' },
          ]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
