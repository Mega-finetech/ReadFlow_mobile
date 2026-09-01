import React, { useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Bookmark } from 'lucide-react-native';
import { MainTabParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { EmptyState } from '../components/EmptyState';
import { Bookmark as BookmarkType } from '../types';

type Props = BottomTabScreenProps<MainTabParamList, 'Bookmarks'>;

/** Bookmarks are not yet persisted server-side; this mirrors the shape we'll render. */
const MOCK_BOOKMARKS: BookmarkType[] = [];

export function BookmarksScreen(_props: Props) {
  const { colors, spacing, typography } = useTheme();
  const [bookmarks] = useState<BookmarkType[]>(MOCK_BOOKMARKS);

  return (
    <ScreenContainer>
      <Text style={[styles.header, typography.title, { color: colors.onSurface }]}>Bookmarks</Text>

      {bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          message="Tap the bookmark button in the player to save a spot and it will appear here."
        />
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(b) => b.id}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl }]}
          renderItem={({ item }) => (
            <Text style={{ color: colors.onSurface }}>{item.label ?? 'Bookmark'}</Text>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = {
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 24,
  },
} as const;
