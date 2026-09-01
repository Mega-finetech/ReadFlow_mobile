import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { initialsFromTitle } from '../utils/format';

interface BookCoverProps {
  title: string;
  size?: number;
}

const PALETTES = [
  { bg: '#5B6CF5', fg: '#FFFFFF' },
  { bg: '#4EA57A', fg: '#FFFFFF' },
  { bg: '#D97757', fg: '#FFFFFF' },
  { bg: '#7A6CE0', fg: '#FFFFFF' },
  { bg: '#3E7CD6', fg: '#FFFFFF' },
  { bg: '#B05C8A', fg: '#FFFFFF' },
];

function paletteFor(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length];
}

/** Deterministic book-cover placeholder (album-art style area for the player). */
export function BookCover({ title, size = 120 }: BookCoverProps) {
  const { radius } = useTheme();
  const palette = paletteFor(title);
  const fontSize = Math.max(20, size * 0.32);

  return (
    <View
      style={[
        styles.cover,
        {
          width: size,
          height: size,
          borderRadius: radius.lg,
          backgroundColor: palette.bg,
        },
      ]}
    >
      <Text style={[styles.initials, { color: palette.fg, fontSize }]}>
        {initialsFromTitle(title)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    letterSpacing: 1,
  },
});
