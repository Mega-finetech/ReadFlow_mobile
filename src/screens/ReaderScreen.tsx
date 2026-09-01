import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Bookmark,
  ChevronDown,
  Headphones,
  ListMusic,
  Mic,
  RotateCcw,
  SkipForward,
  Sparkles,
} from 'lucide-react-native';
import { MainStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { BookCover } from '../components/BookCover';
import { PlayPauseButton } from '../components/PlayPauseButton';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { useAsync } from '../hooks/useAsync';
import { useTtsPlayer } from '../hooks/useTtsPlayer';
import { useAutoSaveProgress } from '../hooks/useAutoSaveProgress';
import { getDocument } from '../api/documents';
import { getProgress } from '../api/progress';
import { ChapterContent } from '../services/ttsService';
import { formatClock } from '../utils/format';
import { addBookmark, removeBookmark, isBookmarked } from '../api/bookmarks';
import { Chapter } from '../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Reader'>;

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

export function ReaderScreen({ route }: Props) {
  const { documentId, title: routeTitle } = route.params;
  const { colors, spacing, radius, typography } = useTheme();
  const { width } = useWindowDimensions();

  const { data: doc, loading, error } = useAsync(() => getDocument(documentId), [documentId]);
  const chapters = doc?.chapters ?? [];
  const bookTitle = routeTitle ?? doc?.filename ?? 'Document';

  // Build chapter content for the TTS player (only when rawText is available).
  const chaptersContent = useMemo<ChapterContent[]>(
    () =>
      chapters
        .filter((c): c is Chapter & { rawText: string } => !!c.rawText)
        .map((c) => ({ id: c.id, title: c.title, rawText: c.rawText })),
    [chapters]
  );

  const player = useTtsPlayer(chaptersContent);
  const snapshot = player.snapshot;

  const [chapterSheet, setChapterSheet] = useState(false);
  const [speedSheet, setSpeedSheet] = useState(false);
  const [voiceSheet, setVoiceSheet] = useState(false);
  const [bookmarkSheet, setBookmarkSheet] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [bookmarked, setBookmarked] = useState(false);

  const activeChapter = chapters[snapshot.chapterIndex];

  // Resume from saved progress once the document and chapter content are ready.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current || chaptersContent.length === 0 || loading) return;
    resumedRef.current = true;
    (async () => {
      try {
        const p = await getProgress(documentId);
        if (p?.positionPercent && p.chapterId) {
          const targetIdx = chapters.findIndex((c) => c.id === p.chapterId);
          if (targetIdx >= 0) player.goToChapter(targetIdx);
          // Seek percentage of that chapter's duration (approx).
          const ch = chapters[targetIdx];
          if (ch?.estimatedDurationSeconds) {
            player.seek((p.positionPercent / 100) * ch.estimatedDurationSeconds);
          }
        }
      } catch {
        // ignore resume failures
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaptersContent.length, loading]);

  // Auto-save progress on interval + pause + exit.
  const { saveOnPause } = useAutoSaveProgress({
    documentId,
    enabled: !!activeChapter,
    getPosition: () => {
      const total = snapshot.durationSec || 1;
      return {
        chapterId: activeChapter?.id,
        positionPercent: Math.min(100, (snapshot.positionSec / total) * 100),
        isPlaying: snapshot.status === 'playing',
      };
    },
  });

  const handlePause = useCallback(() => {
    player.pause();
    saveOnPause();
  }, [player, saveOnPause]);

  const handlePlay = useCallback(() => {
    player.play();
  }, [player]);

  const togglePlay = useCallback(() => {
    if (snapshot.status === 'playing') handlePause();
    else handlePlay();
  }, [snapshot.status, handlePause, handlePlay]);

  const handleStop = useCallback(() => {
    player.stop();
    saveOnPause();
  }, [player, saveOnPause]);

  const onChapterSelect = (index: number) => {
    setChapterSheet(false);
    player.goToChapter(index);
  };

  const percent =
    snapshot.durationSec > 0 ? Math.min(100, (snapshot.positionSec / snapshot.durationSec) * 100) : 0;

  const seekBarRef = useRef<View>(null);
  const [seekBarWidth, setSeekBarWidth] = useState(0);

  const handleSeekTap = (ev: { nativeEvent: { locationX: number } }) => {
    if (seekBarWidth <= 0 || snapshot.durationSec <= 0) return;
    const frac = Math.max(0, Math.min(1, ev.nativeEvent.locationX / seekBarWidth));
    player.seek(frac * snapshot.durationSec);
  };

  const toggleBookmark = async () => {
    if (!activeChapter) return;
    if (bookmarked) {
      await removeBookmark(documentId, activeChapter.id, snapshot.positionSec);
      setBookmarked(false);
      return;
    }
    setBookmarkSheet(true);
  };

  const confirmBookmark = async () => {
    if (!activeChapter) return;
    await addBookmark({
      documentId,
      chapterId: activeChapter.id,
      label: bookmarkLabel.trim() || `Chapter ${snapshot.chapterIndex + 1} · ${formatClock(snapshot.positionSec)}`,
      position: snapshot.positionSec,
    });
    setBookmarked(true);
    setBookmarkSheet(false);
    setBookmarkLabel('');
  };

  const quickCommand = (action: 'repeat' | 'back30' | 'next') => {
    if (action === 'repeat') player.repeatLast();
    else if (action === 'back30') player.jump(-30);
    else player.jump(30);
  };

  // Track bookmark state when position changes (basic, position-keyed).
  useEffect(() => {
    (async () => {
      if (!activeChapter) return;
      setBookmarked(await isBookmarked(documentId, activeChapter.id, snapshot.positionSec));
    })();
  }, [documentId, activeChapter, snapshot.positionSec]);

  useEffect(() => {
    if (snapshot.status === 'error') {
      Alert.alert('Playback error', 'Text-to-speech hit an error. Try again.');
    }
  }, [snapshot.status]);

  return (
    <ScreenContainer useSafeArea={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Album-art style header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={[typography.caption, { color: colors.onPrimary, opacity: 0.9 }]}>
            NOW LISTENING
          </Text>
          <View style={styles.coverWrap}>
            <BookCover title={bookTitle} size={Math.min(width * 0.55, 220)} />
          </View>
          <Text
            numberOfLines={2}
            style={[typography.title, styles.bookTitle, { color: colors.onPrimary }]}
          >
            {bookTitle}
          </Text>

          <Pressable
            onPress={() => activeChapter && setChapterSheet(true)}
            style={styles.chapterIndicator}
            hitSlop={8}
          >
            <ListMusic size={16} color={colors.onPrimary} />
            <Text
              numberOfLines={1}
              style={[typography.label, { color: colors.onPrimary, marginLeft: spacing.xs, flexShrink: 1 }]}
            >
              {loading
                ? 'Loading…'
                : chapters.length === 0
                ? 'No chapters'
                : `Chapter ${snapshot.chapterIndex + 1} of ${chapters.length} · ${activeChapter?.title ?? ''}`}
            </Text>
            <ChevronDown size={16} color={colors.onPrimary} />
          </Pressable>
        </View>

        {/* Progress + seek */}
        <View style={styles.progressSection}>
          <Pressable
            onPress={handleSeekTap}
            onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
            style={styles.seekTrackWrap}
          >
            <View
              style={[
                styles.seekTrack,
                { backgroundColor: colors.surfaceVariant, borderRadius: radius.full },
              ]}
            >
              <View
                style={[
                  styles.seekFill,
                  { backgroundColor: colors.primary, borderRadius: radius.full, width: `${percent}%` },
                ]}
              />
            </View>
          </Pressable>
          <View style={styles.timeRow}>
            <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
              {formatClock(snapshot.positionSec)}
            </Text>
            <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
              {formatClock(snapshot.durationSec)}
            </Text>
          </View>
        </View>

        {/* Smart commands (UI shortcuts) */}
        <View style={styles.quickRow}>
          <QuickChip icon={RotateCcw} label="Repeat" onPress={() => quickCommand('repeat')} />
          <QuickChip icon={Sparkles} label="-30s" onPress={() => quickCommand('back30')} />
          <QuickChip icon={SkipForward} label="+30s" onPress={() => quickCommand('next')} />
        </View>

        {/* Transport controls */}
        <View style={styles.transport}>
          <Pressable onPress={() => player.rewind()} style={styles.sideBtn} hitSlop={8}>
            <RotateCcw size={30} color={colors.onSurface} />
            <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>15s</Text>
          </Pressable>

          <PlayPauseButton
            isPlaying={snapshot.status === 'playing'}
            loading={snapshot.status === 'loading'}
            onPress={togglePlay}
            size={84}
          />

          <Pressable onPress={() => player.forward()} style={styles.sideBtn} hitSlop={8}>
            <SkipForward size={30} color={colors.onSurface} />
            <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>15s</Text>
          </Pressable>
        </View>

        {/* Stop */}
        <Pressable onPress={handleStop} style={[styles.stopBtn, { borderColor: colors.outline }]}>
          <Text style={[typography.label, { color: colors.error }]}>Stop</Text>
        </Pressable>

        {/* Speed + Voice toggles */}
        <View style={styles.controlsGrid}>
          <Pressable
            onPress={() => setSpeedSheet(true)}
            style={[styles.control, { backgroundColor: colors.surface, borderColor: colors.outline, borderRadius: radius.lg }]}
          >
            <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>Speed</Text>
            <Text style={[typography.heading, { color: colors.onSurface, marginTop: 4 }]}>
              {snapshot.speed.toFixed(2).replace(/\.?0+$/, '')}x
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setVoiceSheet(true)}
            style={[styles.control, { backgroundColor: colors.surface, borderColor: colors.outline, borderRadius: radius.lg }]}
          >
            <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>Voice</Text>
            <View style={styles.voiceRow}>
              <Mic size={16} color={colors.accent} />
              <Text numberOfLines={1} style={[typography.heading, { color: colors.onSurface, marginLeft: 4, flexShrink: 1 }]}>
                {player.voicesLoading ? 'Loading…' : player.voices.length ? player.voices[0].name : 'Default'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Bookmark */}
        <Pressable
          onPress={toggleBookmark}
          style={[
            styles.bookmarkBtn,
            {
              backgroundColor: bookmarked ? colors.primaryContainer : colors.surface,
              borderColor: bookmarked ? colors.primary : colors.outline,
              borderRadius: radius.lg,
            },
          ]}
        >
          <Bookmark
            size={20}
            color={bookmarked ? colors.primary : colors.onSurfaceVariant}
            fill={bookmarked ? colors.primary : 'transparent'}
          />
          <Text
            style={[
              typography.label,
              { color: bookmarked ? colors.primary : colors.onSurfaceVariant, marginLeft: spacing.sm },
            ]}
          >
            {bookmarked ? 'Bookmarked at this spot' : 'Bookmark this spot'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Loading / error states */}
      {loading && (
        <View style={[styles.overlay, { backgroundColor: colors.background }]}>
          <Headphones size={28} color={colors.primary} />
          <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
            Preparing your reading session…
          </Text>
        </View>
      )}
      {!loading && error && (
        <View style={[styles.overlay, { backgroundColor: colors.background }]}>
          <Text style={[typography.body, { color: colors.error }]}>{error}</Text>
        </View>
      )}
      {!loading && !error && chapters.length > 0 && chaptersContent.length === 0 && (
        <View style={[styles.overlay, { backgroundColor: colors.background }]}>
          <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
            This document has no readable text yet.
          </Text>
        </View>
      )}

      {/* Chapter list sheet */}
      <BottomSheet visible={chapterSheet} onClose={() => setChapterSheet(false)} title="Chapters">
        <FlatList
          style={styles.sheetList}
          data={chapters}
          keyExtractor={(c) => c.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: c, index: idx }) => (
            <Pressable
              onPress={() => onChapterSelect(idx)}
              style={[
                styles.chapterRow,
                {
                  backgroundColor: idx === snapshot.chapterIndex ? colors.primaryContainer : colors.surfaceVariant,
                  borderRadius: radius.md,
                },
              ]}
            >
              <View style={styles.chapterNum}>
                <Text style={[typography.bodyStrong, { color: colors.primary }]}>{idx + 1}</Text>
              </View>
              <Text
                numberOfLines={2}
                style={[
                  typography.body,
                  { color: idx === snapshot.chapterIndex ? colors.onPrimaryContainer : colors.onSurface, flex: 1 },
                ]}
              >
                {c.title}
              </Text>
              <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
                {formatClock(c.estimatedDurationSeconds)}
              </Text>
            </Pressable>
          )}
        />
      </BottomSheet>

      {/* Speed sheet */}
      <BottomSheet visible={speedSheet} onClose={() => setSpeedSheet(false)} title="Playback speed">
        <View style={styles.speedGrid}>
          {SPEEDS.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                player.setSpeed(s);
                setSpeedSheet(false);
              }}
              style={[
                styles.speedCell,
                {
                  backgroundColor: s === snapshot.speed ? colors.primary : colors.surfaceVariant,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Text
                style={[
                  typography.heading,
                  { color: s === snapshot.speed ? colors.onPrimary : colors.onSurface },
                ]}
              >
                {s.toFixed(s % 1 === 0 ? 0 : 2).replace(/\.([0-9])$/, '.$1')}x
              </Text>
              {s === 1 && (
                <Text style={[typography.caption, { color: s === snapshot.speed ? colors.onPrimary : colors.onSurfaceVariant }]}>
                  Normal
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {/* Voice sheet */}
      <BottomSheet visible={voiceSheet} onClose={() => setVoiceSheet(false)} title="Voice">
        {player.voicesLoading ? (
          <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>Loading voices…</Text>
        ) : player.voices.length === 0 ? (
          <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
            No voices found on this device. Using the system default.
          </Text>
        ) : (
          <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
            {player.voices.map((v) => (
              <Pressable
                key={v.identifier}
                onPress={() => {
                  player.setVoice(v.identifier);
                  setVoiceSheet(false);
                }}
                style={[
                  styles.chapterRow,
                  { backgroundColor: colors.surfaceVariant, borderRadius: radius.md },
                ]}
              >
                <Text style={[typography.body, { color: colors.onSurface, flex: 1 }]}>{v.name}</Text>
                <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>{v.language}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </BottomSheet>

      {/* Bookmark label sheet */}
      <BottomSheet visible={bookmarkSheet} onClose={() => setBookmarkSheet(false)} title="Add bookmark">
        <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
          Saves position {formatClock(snapshot.positionSec)} in “{activeChapter?.title}”.
        </Text>
        <TextInput
          value={bookmarkLabel}
          onChangeText={setBookmarkLabel}
          placeholder="Label (optional)"
          placeholderTextColor={colors.onSurfaceVariant}
          style={[
            styles.input,
            {
              color: colors.onSurface,
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.outline,
              borderRadius: radius.md,
            },
          ]}
        />
        <View style={{ marginTop: spacing.lg }}>
          <Button title="Save bookmark" onPress={confirmBookmark} />
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

function QuickChip({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof RotateCcw;
  label: string;
  onPress: () => void;
}) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.quickChip,
        { backgroundColor: colors.surface, borderColor: colors.outline, borderRadius: radius.full },
      ]}
    >
      <Icon size={16} color={colors.primary} />
      <Text style={[typography.caption, { color: colors.onSurface, marginLeft: spacing.xs }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 28,
    alignItems: 'center',
  },
  coverWrap: { marginTop: 16 },
  bookTitle: { marginTop: 16, textAlign: 'center', paddingHorizontal: 12 },
  chapterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  progressSection: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  seekTrackWrap: {
    height: 32,
    justifyContent: 'center',
  },
  seekTrack: {
    height: 6,
    overflow: 'hidden',
  },
  seekFill: {
    height: 6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  sideBtn: {
    alignItems: 'center',
    marginHorizontal: 28,
  },
  stopBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 20,
  },
  controlsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 24,
    marginTop: 24,
  },
  control: {
    flex: 1,
    borderWidth: 1,
    padding: 16,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  sheetList: {
    flex: 1,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
  },
  chapterNum: {
    width: 28,
    marginRight: 12,
  },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speedCell: {
    width: '30%',
    paddingVertical: 18,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
});
