import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import Animated, {
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2 } from 'lucide-react-native';

/**
 * ReadFlow auth design system. Fixed dark palette (not derived from the app
 * theme) so Login and Register stay visually identical in every mode.
 */
export const AUTH = {
  background: '#171925',
  surface: '#232838',
  gradientStart: '#64ADB6',
  gradientEnd: '#0C44A3',
  onPrimary: '#FFFFFF',
  primaryText: '#F2F2F7',
  muted: '#8B8CA3',
  error: '#FF6B6B',
  coral: '#FF8A5C',
  icy: '#D6F3F7',
} as const;

export const AUTH_GRADIENT = ['#64ADB6', '#0C44A3'] as const;

export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

const GRADIENT_45DEG = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } as const;

const BLOB_STEPS = [
  { size: 210, opacity: 0.04 },
  { size: 168, opacity: 0.045 },
  { size: 128, opacity: 0.05 },
  { size: 94, opacity: 0.055 },
];

const SPRING_SOFT = { damping: 18, stiffness: 320 };

const AnimatedGradient = createAnimatedComponent(LinearGradient);

export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.logoSlot}>
        <View style={styles.glowWrap} pointerEvents="none">
          {BLOB_STEPS.map((step) => {
            const offset = (210 - step.size) / 2;
            return (
              <View
                key={step.size}
                style={[
                  styles.blob,
                  {
                    width: step.size,
                    height: step.size,
                    borderRadius: step.size / 2,
                    opacity: step.opacity,
                    top: offset,
                    left: offset,
                  },
                ]}
              />
            );
          })}
        </View>
        <Image
          source={require('../../../assets/readflow-icon.png')}
          style={styles.logo}
          resizeMode="cover"
        />
      </View>
      <View style={styles.headlineWrap}>
        <Text style={styles.headline}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

interface AuthFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function AuthField({ label, error, style, ...rest }: AuthFieldProps) {
  const progress = useSharedValue(0);
  const borderStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.label, error ? styles.labelError : null]}>{label}</Text>
      <View style={styles.fieldBox}>
        <AnimatedGradient
          colors={AUTH_GRADIENT}
          start={GRADIENT_45DEG.start}
          end={GRADIENT_45DEG.end}
          style={[StyleSheet.absoluteFillObject, styles.fieldGradient, borderStyle]}
        />
        <View style={styles.fieldInner}>
          <TextInput
            placeholderTextColor={AUTH.muted}
            selectionColor={AUTH.gradientStart}
            cursorColor={AUTH.gradientStart}
            style={styles.input}
            {...rest}
            onFocus={(e) => {
              progress.value = withTiming(1, { duration: 150 });
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              progress.value = withTiming(0, { duration: 150 });
              rest.onBlur?.(e);
            }}
          />
        </View>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AuthButton({ title, onPress, loading, disabled }: AuthButtonProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isOff = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isOff}
      onPressIn={() => {
        scale.value = withSpring(0.97, SPRING_SOFT);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_SOFT);
      }}
      style={styles.buttonWrap}
    >
      <Animated.View style={[styles.buttonShadow, animStyle, isOff ? styles.buttonOff : null]}>
        <LinearGradient
          colors={AUTH_GRADIENT}
          start={GRADIENT_45DEG.start}
          end={GRADIENT_45DEG.end}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color={AUTH.onPrimary} />
          ) : (
            <Text style={styles.buttonLabel}>{title}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

interface AuthLinkProps {
  prompt: string;
  action: string;
  onAction: () => void;
}

export function AuthLink({ prompt, action, onAction }: AuthLinkProps) {
  return (
    <View style={styles.linkRow}>
      <Text style={styles.linkPrompt}>{prompt}</Text>
      <Pressable
        onPress={onAction}
        hitSlop={10}
        style={({ pressed }) => (pressed ? styles.linkPressed : null)}
      >
        <LinearGradient
          colors={AUTH_GRADIENT}
          start={GRADIENT_45DEG.start}
          end={GRADIENT_45DEG.end}
          style={styles.linkPill}
        >
          <Text style={styles.linkWord}>{action}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export function SuccessCheck({ caption }: { caption?: string }) {
  const overlayOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.2);
  const ringOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 180 });
    checkOpacity.value = withDelay(140, withTiming(1, { duration: 180 }));
    checkScale.value = withDelay(140, withSpring(1, { damping: 11, stiffness: 220 }));
    ringScale.value = withDelay(140, withTiming(1.8, { duration: 700 }));
    ringOpacity.value = withSequence(
      withDelay(140, withTiming(0.8, { duration: 160 })),
      withDelay(380, withTiming(0, { duration: 320 }))
    );
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View style={[styles.successOverlay, overlayStyle]}>
      <View style={styles.successArea}>
        <Animated.View style={[styles.successRing, ringStyle]} />
        <Animated.View style={[styles.successIconWrap, checkStyle]}>
          <CheckCircle2 size={46} color={AUTH.coral} strokeWidth={2.2} />
        </Animated.View>
      </View>
      {caption ? <Text style={styles.successCaption}>{caption}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 42,
  },
  logoSlot: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    position: 'absolute',
    width: 210,
    height: 210,
    top: '50%',
    left: '50%',
    marginTop: -105,
    marginLeft: -105,
  },
  blob: {
    position: 'absolute',
    backgroundColor: AUTH.icy,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  headlineWrap: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  headline: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: AUTH.primaryText,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 21,
    color: AUTH.muted,
    marginTop: 8,
  },
  field: {
    alignSelf: 'stretch',
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    lineHeight: 20,
    color: AUTH.muted,
    marginBottom: 8,
  },
  labelError: {
    color: AUTH.error,
  },
  fieldBox: {
    height: 56,
    borderRadius: 16,
    backgroundColor: AUTH.surface,
    overflow: 'hidden',
  },
  fieldGradient: {
    borderRadius: 16,
  },
  fieldInner: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    bottom: 1.5,
    borderRadius: 14.5,
    backgroundColor: AUTH.surface,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: AUTH.primaryText,
    fontFamily: FONTS.regular,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 17,
    color: AUTH.error,
    marginTop: 6,
  },
  buttonWrap: {
    alignSelf: 'stretch',
  },
  buttonShadow: {
    borderRadius: 20,
    shadowColor: AUTH.gradientEnd,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonGradient: {
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonLabel: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    letterSpacing: 0.2,
    color: AUTH.onPrimary,
  },
  buttonOff: {
    opacity: 0.6,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 2,
  },
  linkPrompt: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: AUTH.muted,
  },
  linkPill: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  linkWord: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: AUTH.onPrimary,
  },
  linkPressed: {
    opacity: 0.75,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 25, 37, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  successArea: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: AUTH.coral,
  },
  successIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 138, 92, 0.12)',
  },
  successCaption: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    letterSpacing: 0.2,
    color: AUTH.muted,
    marginTop: 22,
  },
});