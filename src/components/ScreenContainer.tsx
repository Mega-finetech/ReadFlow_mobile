import React from 'react';
import { Platform, SafeAreaView, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Avoid SafeAreaView on web where it can behave unexpectedly */
  useSafeArea?: boolean;
}

export function ScreenContainer({ children, style, useSafeArea = true }: ScreenContainerProps) {
  const { colors } = useTheme();

  if (Platform.OS === 'web' || !useSafeArea) {
    return <View style={[styles.base, { backgroundColor: colors.background }, style]}>{children}</View>;
  }

  return (
    <SafeAreaView style={[styles.base, { backgroundColor: colors.background }, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
