import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../navigation/types';
import {
  AUTH,
  AuthButton,
  AuthField,
  AuthHeader,
  AuthLink,
  FONTS,
} from '../components/auth/AuthUI';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../auth/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setApiError(null);
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = 'Email is required.';
    if (!password) errors.password = 'Password is required.';
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader
            title="Welcome back"
            subtitle="Sign in to keep listening to your documents."
          />

          <View style={styles.form}>
            <AuthField
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              error={fieldErrors.email}
            />
            <AuthField
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              secureTextEntry
              placeholder="Your password"
              error={fieldErrors.password}
            />

            {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

            <View style={styles.buttonGap} />
            <AuthButton title="Sign in" onPress={handleLogin} loading={loading} />
          </View>

          <AuthLink
            prompt="New to ReadFlow?"
            action="Create account"
            onAction={() => navigation.navigate('Register')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AUTH.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  form: {
    alignSelf: 'stretch',
    gap: 18,
  },
  apiError: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 17,
    color: AUTH.error,
  },
  buttonGap: {
    height: 6,
  },
});