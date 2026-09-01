import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Library } from 'lucide-react-native';
import { MainTabParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { LibraryCard } from '../components/LibraryCard';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { listDocuments } from '../api/documents';
import { getProgress } from '../api/progress';
import { Document } from '../types';
import { timeAgo } from '../utils/format';

type Props = BottomTabScreenProps<MainTabParamList, 'Library'>;

interface DocMeta {
  percent: number;
  updatedAt: string | null;
}

export function LibraryScreen({ navigation }: Props) {
  const { colors, spacing, typography } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [meta, setMeta] = useState<Record<string, DocMeta>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
      const entries = await Promise.all(
        docs.map(async (d) => {
          try {
            const p = await getProgress(d.id);
            return [d.id, { percent: p?.positionPercent ?? 0, updatedAt: p?.updatedAt ?? null }] as const;
          } catch {
            return [d.id, { percent: 0, updatedAt: null }] as const;
          }
        })
      );
      setMeta(Object.fromEntries(entries));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load(false);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[typography.title, { color: colors.onSurface }]}>Your library</Text>
        <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
          {documents.length} document{documents.length === 1 ? '' : 's'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={108} style={{ marginBottom: 12, borderRadius: 16 }} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[typography.body, { color: colors.error }]}>{error}</Text>
        </View>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No documents yet"
          message="Upload your first document to get started — it'll appear here, ready to listen."
        />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const m = meta[item.id];
            return (
              <View style={{ marginBottom: spacing.md }}>
                <LibraryCard
                  document={item}
                  progress={m?.percent ?? 0}
                  lastRead={m?.updatedAt ? timeAgo(m.updatedAt) : undefined}
                  onPress={() =>
                    navigation.getParent()?.navigate('DocumentDetail', {
                      documentId: item.id,
                      title: item.filename,
                    })
                  }
                />
              </View>
            );
          }}
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
});
