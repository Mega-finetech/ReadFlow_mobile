import { useEffect, useMemo, useRef, useState } from 'react';
import { ChapterContent, PlayerSnapshot, TtsVoice, ttsPlayer } from '../services/ttsService';
import { getVoices } from '../services/ttsService';

const initialState: PlayerSnapshot = {
  status: 'idle',
  chapterIndex: 0,
  positionSec: 0,
  durationSec: 0,
  speed: 1,
};

export interface TtsPlayerApi {
  snapshot: PlayerSnapshot;
  voices: TtsVoice[];
  voicesLoading: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (positionSec: number) => void;
  forward: () => void;
  rewind: () => void;
  jump: (seconds: number) => void;
  repeatLast: () => void;
  setSpeed: (speed: number) => void;
  setVoice: (voiceId: string) => void;
  goToChapter: (index: number) => void;
}

/**
 * Binds the singleton TTS player to a set of chapters and exposes a
 * re-render-friendly API for screens.
 */
export function useTtsPlayer(chapters: ChapterContent[]): TtsPlayerApi {
  const [snapshot, setSnapshot] = useState<PlayerSnapshot>(initialState);
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters;

  useEffect(() => {
    ttsPlayer.setChapters(chaptersRef.current);
    const unsubscribe = ttsPlayer.onSnapshot(setSnapshot);
    return () => unsubscribe();
  }, []);

  // Re-bind chapters whenever the loaded chapter list changes (async fetch).
  useEffect(() => {
    ttsPlayer.setChapters(chapters);
  }, [chapters]);

  useEffect(() => {
    (async () => {
      const loaded = await getVoices();
      setVoices(loaded);
      setVoicesLoading(false);
    })();
  }, []);

  return useMemo(
    () => ({
      snapshot,
      voices,
      voicesLoading,
      play: () => ttsPlayer.play(),
      pause: () => ttsPlayer.pause(),
      stop: () => ttsPlayer.stop(),
      seek: (p: number) => ttsPlayer.seek(p),
      forward: () => ttsPlayer.forward(15),
      rewind: () => ttsPlayer.rewind(15),
      jump: (s: number) => ttsPlayer.jump(s),
      repeatLast: () => ttsPlayer.repeatLast(),
      setSpeed: (s: number) => ttsPlayer.setSpeed(s),
      setVoice: (v: string) => ttsPlayer.setVoice(v),
      goToChapter: (i: number) => ttsPlayer.goToChapter(i),
    }),
    [snapshot, voices, voicesLoading]
  );
}
