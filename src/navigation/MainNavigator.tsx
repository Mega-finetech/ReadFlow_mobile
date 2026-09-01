import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { DocumentDetailScreen } from '../screens/DocumentDetailScreen';
import { ReaderScreen } from '../screens/ReaderScreen';
import { useTheme } from '../theme';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.onSurface, fontWeight: '600' },
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="DocumentDetail"
        component={DocumentDetailScreen}
        options={({ route }) => ({ title: route.params.title ?? 'Document' })}
      />
      <Stack.Screen
        name="Reader"
        component={ReaderScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
