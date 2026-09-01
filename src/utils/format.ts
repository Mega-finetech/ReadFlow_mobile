/** Format a duration given in seconds as "m:ss" (e.g. 65 -> "1:05"). */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** Format a duration for lists, e.g. "12m 05s" or "45s". */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

/** Clamp a percentage to 0..100. */
export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Build a deterministic, book-like initial for the cover placeholder. */
export function initialsFromTitle(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'RF';
  const first = words[0][0] ?? 'R';
  const second = words.length > 1 ? words[words.length - 1][0] : words[0][1];
  return (first + (second ?? '')).toUpperCase();
}

/** Relative "last read" label, e.g. "2h ago". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
