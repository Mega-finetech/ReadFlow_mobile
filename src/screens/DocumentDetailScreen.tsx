import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BookOpen, Clock, Play } from 'lucide-react-native';
import { MainStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { Skeleton, SkeletonRow } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useAsync } from '../hooks/useAsync';
import { getDocument } from '../api/documents';

type Props = NativeStackScreenProps<MainStackParamList, 'DocumentDetail'>;

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export function DocumentDetailScreen({ route, navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const { documentId, title } = route.params;
  const { data: doc, loading, error } = useAsync(() => getDocument(documentId), [documentId]);

  const chapters = doc?.chapters ?? [];
  const totalSeconds = chapters.reduce((sum, c) => sum + (c.estimatedDurationSeconds ?? 0), 0);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text numberOfLines={2} style={[typography.title, { color: colors.onSurface }]}>
          {title ?? doc?.filename ?? 'Document'}
        </Text>
        <Text style={[typography.caption, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]}>
          {loading ? 'Loading…' : `${chapters.length} chapters · ${formatDuration(totalSeconds)}`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.skeletonList}>
          <Skeleton height={120} style={{ marginBottom: 12, borderRadius: 16 }} />
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[typography.body, { color: colors.error }]}>{error}</Text>
        </View>
      ) : chapters.length === 0 ? (
        <EmptyState icon={BookOpen} title="No chapters found" message="We couldn't split this document into chapters." />
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('Reader', {
                  documentId,
                  chapterId: item.id,
                  title: item.title,
                })
              }
              style={({ pressed }) => [
                styles.chapter,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  borderRadius: radius.lg,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <View style={[styles.num, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[typography.bodyStrong, { color: colors.onPrimaryContainer }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.chapterInfo}>
                <Text numberOfLines={2} style={[typography.bodyStrong, { color: colors.onSurface }]}>
                  {item.title}
                </Text>
                <View style={styles.metaRow}>
                  <Clock size={13} color={colors.onSurfaceVariant} />
                  <Text style={[typography.caption, { color: colors.onSurfaceVariant, marginLeft: 4 }]}>
                    {formatDuration(item.estimatedDurationSeconds)}
                  </Text>
                </View>
              </View>
              <View style={[styles.play, { backgroundColor: colors.primary }]}>
                <Play size={16} color={colors.onPrimary} fill={colors.onPrimary} />
              </View>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  skeletonList: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  num: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chapterInfo: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  play: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
