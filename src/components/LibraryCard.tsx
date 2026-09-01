import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FileText, Headphones } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Document } from '../types';
import { ProgressBar } from './ProgressBar';

interface LibraryCardProps {
  document: Document;
  progress?: number;
  lastRead?: string;
  onPress: () => void;
}

const fileMeta: Record<string, { label: string; color: string }> = {
  pdf: { label: 'PDF', color: '#E05A4A' },
  txt: { label: 'TXT', color: '#4A8FE0' },
  docx: { label: 'DOCX', color: '#3E7CD6' },
  epub: { label: 'EPUB', color: '#7A6CE0' },
};

export function LibraryCard({ document, progress = 0, lastRead, onPress }: LibraryCardProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const type = (document.fileType || '').toLowerCase();
  const meta = fileMeta[type] ?? { label: type.toUpperCase() || 'DOC', color: colors.primary };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderColor: colors.outline,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: meta.color + '22' }]}>
          <FileText size={20} color={meta.color} />
        </View>
        <View style={styles.titleWrap}>
          <Text
            numberOfLines={1}
            style={[typography.bodyStrong, { color: colors.onSurface }]}
          >
            {document.filename}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
              {meta.label} · {document._count?.chapters ?? 0} chapters
              {lastRead ? ` · ${lastRead}` : ''}
            </Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
          <Headphones size={14} color={colors.onPrimaryContainer} />
        </View>
      </View>

      {document.status === 'processing' ? (
        <Text style={[typography.caption, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}>
          Processing document…
        </Text>
      ) : (
        <View style={styles.progressWrap}>
          <ProgressBar progress={progress} height={5} />
          <Text style={[typography.caption, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]}>
            {Math.round(progress)}% read
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  metaRow: {
    marginTop: 2,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: {
    marginTop: 12,
  },
});
