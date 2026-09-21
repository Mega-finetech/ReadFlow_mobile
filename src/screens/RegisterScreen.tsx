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
  SuccessCheck,
} from '../components/auth/AuthUI';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../auth/AuthContext';
import { register as registerApi } from '../api/auth';

// How long the coral success checkmark stays on screen before navigating home.
const SUCCESS_DELAY_MS = 1000;

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

interface FieldErrors {
  email?: string;
  password?: string;
  confirm?: string;
}

export function RegisterScreen({ navigation }: Props) {
  const { commitSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setApiError(null);
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = 'Email is required.';
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!confirm) errors.confirm = 'Please confirm your password.';
    else if (password !== confirm) errors.confirm = 'Passwords do not match.';
    setFieldErrors(errors);
    if (errors.email || errors.password || errors.confirm) return;

    setLoading(true);
    try {
      const response = await registerApi(email.trim(), password);
      setLoading(false);
      setSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, SUCCESS_DELAY_MS));
      await commitSession(response.token, response.user);
    } catch (err) {
      setSuccess(false);
      setLoading(false);
      setApiError(err instanceof Error ? err.message : 'Registration failed');
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
            title="Create account"
            subtitle="Start turning PDFs, DOCX, TXT and EPUBs into narrated chapters."
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
              placeholder="At least 8 characters"
              error={fieldErrors.password}
            />
            <AuthField
              label="Confirm password"
              value={confirm}
              onChangeText={(text) => {
                setConfirm(text);
                if (fieldErrors.confirm) {
                  setFieldErrors((prev) => ({ ...prev, confirm: undefined }));
                }
              }}
              secureTextEntry
              placeholder="Repeat your password"
              error={fieldErrors.confirm}
            />

            {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

            <View style={styles.buttonGap} />
            <AuthButton title="Create account" onPress={handleRegister} loading={loading} />
          </View>

          <AuthLink
            prompt="Already have an account?"
            action="Sign in"
            onAction={() => navigation.navigate('Login')}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {success ? <SuccessCheck caption="Account created" /> : null}
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