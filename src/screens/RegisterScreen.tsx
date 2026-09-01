import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Headphones } from 'lucide-react-native';
import { AuthStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { useAuth } from '../auth/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
            <View style={[styles.logo, { backgroundColor: colors.primaryContainer }]}>
              <Headphones size={32} color={colors.primary} />
            </View>
            <Text style={[typography.display, { color: colors.onSurface }]}>ReadFlow</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.xl, borderColor: colors.outline }]}>
            <Text style={[typography.title, { color: colors.onSurface }]}>Create account</Text>

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
                placeholder="At least 8 characters"
              />
            </View>
            <View style={styles.field}>
              <TextField
                label="Confirm password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                placeholder="Repeat your password"
              />
            </View>

            {error ? (
              <Text style={[typography.caption, { color: colors.error, marginTop: spacing.sm }]}>
                {error}
              </Text>
            ) : null}

            <View style={styles.spacer} />
            <Button title="Create account" onPress={handleRegister} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
              Already have an account?
            </Text>
            <Text
              style={[typography.bodyStrong, { color: colors.primary, marginLeft: spacing.xs }]}
              onPress={() => navigation.navigate('Login')}
            >
              Sign in
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
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    padding: 24,
  },
  field: { marginBottom: 16 },
  spacer: { height: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
