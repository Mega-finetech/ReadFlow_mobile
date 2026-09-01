import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

interface ProgressBarProps {
  /** 0..100 */
  progress: number;
  height?: number;
  style?: object;
}

export function ProgressBar({ progress, height = 6, style }: ProgressBarProps) {
  const { colors, radius } = useTheme();
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: radius.full,
          backgroundColor: colors.surfaceVariant,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            height,
            borderRadius: radius.full,
            backgroundColor: colors.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    overflow: 'hidden',
  },
});
