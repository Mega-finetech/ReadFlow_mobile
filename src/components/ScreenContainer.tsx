import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Avoid SafeAreaView on web where it can behave unexpectedly */
  useSafeArea?: boolean;
}

export function ScreenContainer({ children, style, useSafeArea = true }: ScreenContainerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const safePadding: ViewStyle = useSafeArea && Platform.OS !== 'web'
    ? { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }
    : {};

  return (
    <View style={[styles.base, { backgroundColor: colors.background }, safePadding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
