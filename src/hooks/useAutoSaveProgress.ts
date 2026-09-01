import { useEffect, useRef } from 'react';
import { saveProgress } from '../api/progress';
import { Chapter } from '../types';

interface AutoSaveOptions {
  documentId: string;
  enabled: boolean;
  getPosition: () => { chapterId?: string; positionPercent: number; isPlaying: boolean };
}

const SAVE_INTERVAL_MS = 10_000;

/**
 * Persists reading progress to the backend automatically:
 * - every ~10 seconds while playing
 * - immediately on pause
 * - immediately on unmount (screen exit)
 */
export function useAutoSaveProgress({ documentId, enabled, getPosition }: AutoSaveOptions) {
  const getPositionRef = useRef(getPosition);
  getPositionRef.current = getPosition;
  const documentIdRef = useRef(documentId);
  documentIdRef.current = documentId;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const saveNow = async () => {
    if (!enabledRef.current) return;
    const { chapterId, positionPercent } = getPositionRef.current();
    if (chapterId == null) return;
    try {
      await saveProgress({ documentId: documentIdRef.current, chapterId, positionPercent });
    } catch {
      // Best-effort: do not disrupt playback on a failed save.
    }
  };

  const positionRef = useRef<{ chapterId?: string; positionPercent: number; isPlaying: boolean }>({
    chapterId: undefined,
    positionPercent: 0,
    isPlaying: false,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      positionRef.current = getPositionRef.current();
      if (positionRef.current.isPlaying) {
        saveNow();
      }
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      positionRef.current = getPositionRef.current();
      if (positionRef.current.isPlaying) {
        saveNow();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on explicit pause
  const saveOnPause = () => {
    positionRef.current = getPositionRef.current();
    saveNow();
  };

  return { saveOnPause };
}
