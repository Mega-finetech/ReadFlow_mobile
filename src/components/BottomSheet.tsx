import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useTheme } from '../theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const SHEET_HEIGHT = 420;

// Space reserved for the drag handle and (optional) title/close header row, so
// the content region below gets a definite, bounded height.
const CONTENT_OFFSET = 84;

/**
 * Lightweight animated bottom sheet built on Modal + react-native-reanimated.
 * Slides the panel up/down with a fading backdrop.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const progress = useSharedValue(0);

  // Bound the sheet to a real, fixed height so its contents (and any nested
  // ScrollView/FlatList) get a bounded layout and can scroll internally. We give
  // the content region a concrete height rather than relying on `flex: 1`
  // flowing through the transformed animated container, which can leave scroll
  // containers without a definite measure in Reanimated 4 / Fabric.
  const sheetHeight = Math.min(SHEET_HEIGHT, windowHeight * 0.8);
  const contentHeight = Math.max(200, sheetHeight - CONTENT_OFFSET);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 260 });
  }, [visible, progress]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [sheetHeight, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={styles.backdrop} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight },
            sheetStyle,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              borderColor: colors.outline,
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.outline }]} />
          </View>

          {title ? (
            <View style={styles.headerRow}>
              <Text style={[typography.heading, { color: colors.onSurface, flex: 1 }]}>
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
          ) : null}

          <View
            style={[
              styles.content,
              {
                height: contentHeight,
                paddingHorizontal: spacing.lg,
                paddingBottom: Math.max(spacing.xxl, insets.bottom + spacing.md),
              },
            ]}
          >
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopWidth: 1,
    width: '100%',
  },
  content: {
    width: '100%',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
});
