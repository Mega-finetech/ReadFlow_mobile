import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/**
 * TTS service - single abstraction point for text-to-speech.
 *
 * The UI never calls expo-speech directly; it talks to this module so the
 * engine can be swapped for a cloud TTS service later without touching screens.
 *
 * Chosen engine (first implementation): expo-speech (on-device, no API key,
 * cross-platform). Note: expo-speech's pause()/resume() are unavailable on
 * Android, so this engine implements cross-platform pausing/resuming by
 * chunking the chapter and re-speaking from a tracked position.
 */

export type TtsStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

export interface TtsVoice {
  identifier: string;
  name: string;
  language: string;
  quality: string;
}

export interface ChapterContent {
  id: string;
  title: string;
  rawText: string;
}

export interface PlayerSnapshot {
  status: TtsStatus;
  chapterIndex: number;
  positionSec: number;
  durationSec: number;
  speed: number;
}

const WPM = 160; // average speaking rate used to estimate segment durations
const TICK_MS = 250;

interface Segment {
  text: string;
  startSec: number;
  durationSec: number;
}

function estimateSeconds(text: string, speed: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words / (WPM / 60) / speed;
}

function splitSegments(text: string): string[] {
  const maxLen = Speech.maxSpeechInputLength > 0 ? Speech.maxSpeechInputLength : 4000;
  const chunks: string[] = [];
  const sentenceMatches =
    text.match(/[^.!?\n]+[.!?]+\s*|[^.!?\n]+$/g) ?? [text];

  let current = '';
  for (const sentence of sentenceMatches) {
    if (current.length + sentence.length > maxLen) {
      if (current.trim().length > 0) chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim().length > 0) chunks.push(current.trim());

  // Fallback: if chunking produced nothing (e.g. one huge word), hard-split.
  if (chunks.length === 0 && text.trim().length > 0) {
    for (let i = 0; i < text.length; i += maxLen) {
      chunks.push(text.slice(i, i + maxLen));
    }
  }
  return chunks;
}

export class TtsPlayer {
  private chapters: ChapterContent[] = [];
  private status: TtsStatus = 'idle';
  private chapterIndex = 0;
  private speed = 1;
  private voiceId?: string;

  private segments: Segment[] = [];
  private curSegment = -1;
  private positionSec = 0;
  private durationSec = 0;
  private ticker: ReturnType<typeof setInterval> | null = null;

  private readonly listeners = new Set<(snapshot: PlayerSnapshot) => void>();

  onSnapshot(cb: (snapshot: PlayerSnapshot) => void): () => void {
    this.listeners.add(cb);
    this.emit();
    return () => this.listeners.delete(cb);
  }

  setChapters(chapters: ChapterContent[]): void {
    this.chapters = chapters;
    if (this.chapterIndex >= chapters.length) this.chapterIndex = 0;
    this.prepareCurrentChapter();
  }

  getSnapshot(): PlayerSnapshot {
    return {
      status: this.status,
      chapterIndex: this.chapterIndex,
      positionSec: this.positionSec,
      durationSec: this.durationSec,
      speed: this.speed,
    };
  }

  goToChapter(index: number): void {
    const clamped = Math.max(0, Math.min(this.chapters.length - 1, index));
    if (clamped === this.chapterIndex) return;
    this.stopInternal();
    this.chapterIndex = clamped;
    this.positionSec = 0;
    this.prepareCurrentChapter();
    this.emit();
  }

  setSpeed(speed: number): void {
    if (speed === this.speed) return;
    const keep = this.status === 'playing';
    const position = this.positionSec;
    this.stopInternal();
    this.speed = speed;
    this.positionSec = position;
    this.prepareCurrentChapter(true);
    if (keep) this.play();
  }

  setVoice(voiceId: string): void {
    if (voiceId === this.voiceId) return;
    const keep = this.status === 'playing';
    const position = this.positionSec;
    this.stopInternal();
    this.voiceId = voiceId;
    this.positionSec = position;
    this.prepareCurrentChapter(true);
    if (keep) this.play();
  }

  play(): void {
    if (this.chapters.length === 0 || this.segments.length === 0) return;
    // Resume from stored position if paused
    this.startTicker();
    this.speakFrom(this.positionSec);
  }

  pause(): void {
    if (this.status !== 'playing') return;
    this.stopInternal();
    this.status = 'paused';
    this.emit();
  }

  stop(): void {
    this.stopInternal();
    this.positionSec = 0;
    this.status = 'stopped';
    this.emit();
  }

  seek(positionSec: number): void {
    if (this.chapters.length === 0) return;
    const clamped = Math.max(0, Math.min(this.durationSec, positionSec));
    const wasPlaying = this.status === 'playing';
    this.stopInternal();
    this.positionSec = clamped;
    if (wasPlaying) this.play();
    else this.emit();
  }

  forward(seconds: number): void {
    if (this.chapters.length === 0) return;
    this.seek(this.positionSec + seconds);
  }

  rewind(seconds: number): void {
    if (this.chapters.length === 0) return;
    this.seek(Math.max(0, this.positionSec - seconds));
  }

  /**
   * Relative jump by a signed number of seconds (negative = back, positive = forward).
   */
  jump(seconds: number): void {
    if (this.chapters.length === 0) return;
    this.seek(this.positionSec + seconds);
  }

  repeatLast(): void {
    if (this.curSegment < 0) return;
    const seg = this.segments[this.curSegment];
    const wasPlaying = this.status === 'playing';
    this.stopInternal();
    this.positionSec = seg.startSec;
    if (wasPlaying) this.play();
    else this.emit();
  }

  private prepareCurrentChapter(keepSegment = false): void {
    const chapter = this.chapters[this.chapterIndex];
    const raw = chapter?.rawText ?? '';
    const texts = splitSegments(raw);
    const segments: Segment[] = [];
    let cursor = 0;
    for (const text of texts) {
      if (text.trim().length === 0) continue;
      const d = estimateSeconds(text, this.speed);
      segments.push({ text, startSec: cursor, durationSec: d });
      cursor += d;
    }
    this.segments = segments;
    this.durationSec = cursor;
    if (!keepSegment) {
      this.curSegment = 0;
      this.positionSec = 0;
    }
  }

  private speakFrom(positionSec: number): void {
    let nextSegment = this.segments.length - 1;
    for (let i = 0; i < this.segments.length; i++) {
      if (this.segments[i].startSec + this.segments[i].durationSec > positionSec) {
        nextSegment = i;
        break;
      }
    }
    this.curSegment = nextSegment;
    this.positionSec = this.segments[nextSegment]?.startSec ?? positionSec;
    this.speakCurrent();
  }

  private speakCurrent(): void {
    const seg = this.segments[this.curSegment];
    if (!seg) {
      this.finishChapter();
      return;
    }
    this.status = 'loading';
    this.emit();

    const options: Speech.SpeechOptions = {
      rate: this.speed,
      pitch: 1,
      ...(this.voiceId ? { voice: this.voiceId } : {}),
      onStart: () => {
        if (this.status !== 'loading') return;
        this.status = 'playing';
        this.emit();
      },
      onDone: () => this.onSegmentDone(),
      onStopped: () => this.onSegmentStopped(),
      onError: (error) => {
        this.status = 'error';
        this.stopTicker();
        this.emit();
      },
    };
    try {
      Speech.speak(seg.text, options);
    } catch {
      this.status = 'error';
      this.stopTicker();
      this.emit();
    }
  }

  private onSegmentDone(): void {
    // Guard: only advance if this segment is still the active one.
    if (this.status !== 'playing' && this.status !== 'loading') return;
    this.positionSec = this.segments[this.curSegment]?.startSec
      ? this.segments[this.curSegment].startSec + this.segments[this.curSegment].durationSec
      : this.positionSec;
    const next = this.curSegment + 1;
    if (next < this.segments.length) {
      this.startTicker();
      this.curSegment = next;
      this.positionSec = this.segments[next].startSec;
      this.speakCurrent();
    } else {
      this.finishChapter();
    }
  }

  private onSegmentStopped(): void {
    // Stop() was called externally (pause/seek/stop); do not auto-advance.
    if (this.status !== 'playing' && this.status !== 'loading') return;
    // Reaching here without explicit stop means the utterance was interrupted.
    if (this.ticker) return;
  }

  private finishChapter(): void {
    this.status = 'stopped';
    this.stopTicker();
    this.positionSec = this.durationSec;
    this.emit();
    // Auto-advance to next chapter if one exists
    if (this.chapterIndex < this.chapters.length - 1) {
      this.chapterIndex += 1;
      this.prepareCurrentChapter();
      this.play();
    }
  }

  private stopInternal(): void {
    this.stopTicker();
    try {
      Speech.stop();
    } catch {
      // ignore
    }
  }

  private startTicker(): void {
    this.stopTicker();
    this.ticker = setInterval(() => {
      if (this.status !== 'playing') return;
      const seg = this.segments[this.curSegment];
      this.positionSec += TICK_MS / 1000;
      if (seg && this.positionSec > seg.startSec + seg.durationSec) {
        this.positionSec = seg.startSec + seg.durationSec;
      }
      if (this.positionSec >= this.durationSec) {
        this.finishChapter();
      }
      this.emit();
    }, TICK_MS);
  }

  private stopTicker(): void {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((cb) => cb(snapshot));
  }
}

async function loadVoices(): Promise<TtsVoice[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return (voices as TtsVoice[]).map((v) => ({
      identifier: v.identifier,
      name: v.name,
      language: v.language,
      quality: String(v.quality ?? 'Default'),
    }));
  } catch {
    return [];
  }
}

export async function getVoices(): Promise<TtsVoice[]> {
  return loadVoices();
}

export function supportsTruePause(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'web';
}

export const ttsPlayer = new TtsPlayer();
