import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Play, Pause } from 'lucide-react-native';
import { useTheme } from '../theme';

interface PlayPauseButtonProps {
  isPlaying: boolean;
  loading?: boolean;
  onPress: () => void;
  size?: number;
}

/**
 * Large thumb-reachable play/pause control with a smooth, physical-feeling
 * scale-and-swap transition between states (react-native-reanimated).
 */
export function PlayPauseButton({
  isPlaying,
  loading = false,
  onPress,
  size = 84,
}: PlayPauseButtonProps) {
  const { colors, radius } = useTheme();
  const progress = useSharedValue(isPlaying ? 1 : 0);

  useEffect(() => {
    if (isPlaying) {
      progress.value = withSequence(
        withTiming(1, { duration: 180 }),
        withDelay(60, withTiming(0.75, { duration: 120 })),
        withTiming(1, { duration: 140 })
      );
    } else {
      progress.value = withSequence(
        withTiming(0.75, { duration: 120 }),
        withTiming(1, { duration: 140 })
      );
    }
  }, [isPlaying, progress]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0.75, 1], [0.9, 1], Extrapolation.CLAMP) },
      { rotate: `${interpolate(progress.value, [0.75, 1], [-6, 0], Extrapolation.CLAMP)}deg` },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.2], Extrapolation.CLAMP) }],
  }));

  const pauseIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.2, 1], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View style={ringStyle}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        style={({ pressed }) => [
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primary,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.center, iconStyle]}
        >
          <Play size={size * 0.46} color={colors.onPrimary} fill={colors.onPrimary} />
        </Animated.View>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.center, pauseIconStyle]}
        >
          <Pause size={size * 0.46} color={colors.onPrimary} fill={colors.onPrimary} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
