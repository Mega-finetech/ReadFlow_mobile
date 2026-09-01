import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Play } from 'lucide-react-native';
import { useTheme } from '../theme';
import { BookCover } from './BookCover';
import { ProgressBar } from './ProgressBar';
import { Document, Progress } from '../types';
import { clampPercent } from '../utils/format';

interface ContinueCardProps {
  document: Document;
  progress: Progress | null;
  onPress: () => void;
}

export function ContinueCard({ document, progress, onPress }: ContinueCardProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const percent = clampPercent(progress?.positionPercent ?? 0);
  const chapterName = progress?.chapter?.title ?? 'Chapter 1';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
          borderRadius: radius.xl,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <BookCover title={document.filename} size={64} />
      <View style={styles.info}>
        <Text
          numberOfLines={1}
          style={[typography.bodyStrong, { color: colors.onSurface }]}
        >
          {document.filename}
        </Text>
        <Text numberOfLines={1} style={[typography.caption, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
          {chapterName}
        </Text>
        <View style={styles.progressWrap}>
          <ProgressBar progress={percent} height={4} />
          <Text style={[typography.caption, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
            {Math.round(percent)}% complete
          </Text>
        </View>
      </View>
      <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
        <Play size={18} color={colors.onPrimary} fill={colors.onPrimary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 16,
  },
  info: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressWrap: {
    marginTop: 8,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
