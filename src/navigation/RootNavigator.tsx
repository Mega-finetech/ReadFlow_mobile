import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AuthStack } from './AuthStack';
import { MainNavigator } from './MainNavigator';
import { useTheme } from '../theme';

export function RootNavigator() {
  const { token, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return token ? <MainNavigator /> : <AuthStack />;
}
