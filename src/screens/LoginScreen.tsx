import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { useAuth } from '../auth/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.top}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/readflow-icon.png')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <Text style={[typography.display, { color: colors.onSurface, marginTop: spacing.xl }]}>ReadFlow</Text>
            <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
              Turn any document into narrated chapters.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.xl, borderColor: colors.outline }]}>
            <Text style={[typography.title, { color: colors.onSurface }]}>Welcome back</Text>

            <View style={styles.field}>
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
              />
            </View>
            <View style={styles.field}>
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
              />
            </View>

            {error ? (
              <Text style={[typography.caption, { color: colors.error, marginTop: spacing.sm }]}>
                {error}
              </Text>
            ) : null}

            <View style={styles.spacer} />
            <Button title="Sign in" onPress={handleLogin} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
              New to ReadFlow?
            </Text>
            <Text
              style={[typography.bodyStrong, { color: colors.primary, marginLeft: spacing.xs }]}
              onPress={() => navigation.navigate('Register')}
            >
              Create an account
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  top: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
  },
  card: {
    borderWidth: 1,
    padding: 24,
  },
  field: { marginBottom: 16 },
  spacer: { height: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
