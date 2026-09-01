import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { BookOpen, Clock, Library, LogOut, Upload } from 'lucide-react-native';
import { MainTabParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { ContinueCard } from '../components/ContinueCard';
import { Skeleton, SkeletonRow } from '../components/Skeleton';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { listDocuments } from '../api/documents';
import { getContinueReading } from '../api/continueReading';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const { user, signOut } = useAuth();
  const { data, loading } = useAsync(() => listDocuments());
  const continueReading = useAsync(() => getContinueReading());

  const documentCount = data?.length ?? 0;
  const firstName = user?.email?.split('@')[0] ?? 'there';
  const continueItem = continueReading.data;

  const openReader = (documentId: string, docTitle: string) => {
    navigation
      .getParent()
      ?.navigate('Reader', { documentId, title: docTitle });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
            Welcome back,
          </Text>
          <Text style={[typography.title, { color: colors.onSurface }]}>
            {firstName}
          </Text>
        </View>
        <Pressable
          onPress={() => signOut()}
          style={[styles.logout, { backgroundColor: colors.surfaceVariant, borderRadius: radius.full }]}
          hitSlop={8}
        >
          <LogOut size={18} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <>
            {/* Continue Reading */}
            {continueReading.loading ? (
              <View style={styles.skeletonCardWrap}>
                <Skeleton height={96} style={{ borderRadius: 24 }} />
              </View>
            ) : continueItem ? (
              <View style={styles.section}>
                <Text style={[typography.heading, { color: colors.onSurface, marginBottom: spacing.md }]}>
                  Continue reading
                </Text>
                <ContinueCard
                  document={continueItem.document}
                  progress={continueItem.progress}
                  onPress={() => openReader(continueItem.document.id, continueItem.document.filename)}
                />
              </View>
            ) : documentCount === 0 ? (
              <View style={[styles.hero, { backgroundColor: colors.primary, borderRadius: radius.xl }]}>
                <Text style={[typography.heading, { color: colors.onPrimary }]}>
                  Start listening
                </Text>
                <Text
                  style={[
                    typography.body,
                    { color: colors.onPrimary, opacity: 0.9, marginTop: spacing.xs, marginBottom: spacing.xl },
                  ]}
                >
                  Upload a document to hear it read aloud.
                </Text>
                <Button
                  title="Upload a document"
                  variant="secondary"
                  onPress={() => navigation.navigate('Upload')}
                />
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={[typography.heading, { color: colors.onSurface, marginBottom: spacing.md }]}>
                  Continue reading
                </Text>
                <View style={[styles.hero, { backgroundColor: colors.primary, borderRadius: radius.xl }]}>
                  <Text style={[typography.body, { color: colors.onPrimary }]}>
                    You're all caught up. Pick a document from your library to keep listening.
                  </Text>
                  <View style={{ marginTop: spacing.lg }}>
                    <Button
                      title="Open library"
                      variant="secondary"
                      onPress={() => navigation.navigate('Library')}
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.outline, borderRadius: radius.lg }]}>
                <Library size={20} color={colors.primary} />
                <Text style={[typography.title, { color: colors.onSurface, marginTop: spacing.sm }]}>
                  {loading ? '…' : documentCount}
                </Text>
                <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>Documents</Text>
              </View>
              <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.outline, borderRadius: radius.lg }]}>
                <Clock size={20} color={colors.accent} />
                <Text style={[typography.title, { color: colors.onSurface, marginTop: spacing.sm }]}>
                  {continueItem ? `${Math.round(continueItem.progress.positionPercent)}%` : '—'}
                </Text>
                <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>Last read</Text>
              </View>
            </View>

            <View style={styles.quickWrap}>
              <Text style={[typography.heading, { color: colors.onSurface, marginBottom: spacing.md }]}>
                Quick actions
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Library')}
                style={[styles.quick, { backgroundColor: colors.surface, borderColor: colors.outline, borderRadius: radius.lg }]}
              >
                <BookOpen size={20} color={colors.primary} />
                <View style={{ marginLeft: spacing.lg }}>
                  <Text style={[typography.bodyStrong, { color: colors.onSurface }]}>Browse library</Text>
                  <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>Your uploaded documents</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('Upload')}
                style={[styles.quick, { backgroundColor: colors.surface, borderColor: colors.outline, borderRadius: radius.lg }]}
              >
                <Upload size={20} color={colors.accent} />
                <View style={{ marginLeft: spacing.lg }}>
                  <Text style={[typography.bodyStrong, { color: colors.onSurface }]}>Upload new</Text>
                  <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>Add a PDF, DOCX, or TXT</Text>
                </View>
              </Pressable>
            </View>

            {loading && (
              <View style={styles.skeletonWrap}>
                <SkeletonRow />
                <SkeletonRow />
              </View>
            )}
          </>
        )}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logout: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  skeletonCardWrap: {
    marginBottom: 20,
  },
  hero: {
    padding: 24,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  stat: {
    flex: 1,
    borderWidth: 1,
    padding: 20,
    alignItems: 'flex-start',
  },
  quickWrap: {
    marginBottom: 8,
  },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  skeletonWrap: {
    marginTop: 16,
  },
});
