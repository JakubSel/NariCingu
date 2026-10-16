import type { Segment } from '../types';

/**
 * Index of the segment playing at time t: the last segment that has started.
 * During the pause after a sentence, that sentence stays active (no flicker).
 * Returns -1 before the first segment. Binary search, so it is cheap to call
 * every animation frame, also for word-level segments.
 */
export function findActiveSegment(segments: Segment[], t: number, lead = 0.05): number {
  let lo = 0;
  let hi = segments.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (segments[mid].start <= t + lead) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
