/**
 * Real loudness of the playing song, from Spotify's audio analysis (Spicetify.getAudioData).
 *
 * The analysis splits a track into short segments (~0.1–0.5 s). Each segment has a loudness
 * at its start, a maximum loudness and the time of that maximum (all in dB, typically -60..0).
 * We rebuild a loudness curve from that and turn it into meter levels.
 */

import { clamp01 } from "./format";

export interface LoudnessSegment {
  /** Start in seconds */
  start: number;
  /** Duration in seconds */
  duration: number;
  /** dB at the segment start */
  loudnessStart: number;
  /** Peak dB within the segment */
  loudnessMax: number;
  /** Seconds after start where the peak is reached */
  loudnessMaxTime: number;
}

/** Lowest level shown on the meter; anything quieter reads as 0. */
export const FLOOR_DB = -40;

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Reads the segments from whatever getAudioData returned. Returns null if there are none,
 * so the caller can fall back to another source.
 */
export function parseSegments(data: unknown): LoudnessSegment[] | null {
  if (!data || typeof data !== "object") return null;
  const raw = (data as { segments?: unknown }).segments;
  if (!Array.isArray(raw)) return null;
  const out: LoudnessSegment[] = [];
  for (const s of raw) {
    if (!s || typeof s !== "object") continue;
    const r = s as Record<string, unknown>;
    const start = num(r.start);
    const duration = num(r.duration);
    const loudnessMax = num(r.loudness_max);
    if (start === null || duration === null || duration <= 0 || loudnessMax === null) continue;
    const loudnessStart = num(r.loudness_start) ?? loudnessMax;
    const maxTime = num(r.loudness_max_time) ?? 0;
    out.push({
      start,
      duration,
      loudnessStart,
      loudnessMax,
      loudnessMaxTime: Math.min(Math.max(maxTime, 0), duration),
    });
  }
  if (out.length === 0) return null;
  out.sort((a, b) => a.start - b.start);
  return out;
}

/** Index of the segment that contains t (seconds), or -1 if t is outside all segments. */
export function findSegment(segments: readonly LoudnessSegment[], t: number): number {
  let lo = 0;
  let hi = segments.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = segments[mid];
    if (t < s.start) hi = mid - 1;
    else if (t >= s.start + s.duration) lo = mid + 1;
    else return mid;
  }
  return -1;
}

/**
 * Loudness in dB at time t (seconds): rises from loudnessStart to loudnessMax, then falls
 * towards the next segment's start loudness. Returns null outside the analysed range.
 */
export function loudnessAt(segments: readonly LoudnessSegment[], t: number): number | null {
  const i = findSegment(segments, t);
  if (i < 0) return null;
  const s = segments[i];
  const local = t - s.start;
  if (local < s.loudnessMaxTime) {
    const k = s.loudnessMaxTime > 0 ? local / s.loudnessMaxTime : 1;
    return s.loudnessStart + (s.loudnessMax - s.loudnessStart) * k;
  }
  const next = segments[i + 1];
  const end = next ? next.loudnessStart : FLOOR_DB;
  const rest = s.duration - s.loudnessMaxTime;
  const k = rest > 0 ? (local - s.loudnessMaxTime) / rest : 1;
  return s.loudnessMax + (end - s.loudnessMax) * k;
}

/** Maps dB to a meter level 0..1 (FLOOR_DB → 0, 0 dB → 1). */
export function dbToLevel(db: number): number {
  return clamp01((db - FLOOR_DB) / -FLOOR_DB);
}

/** Meter level 0..1 at a song position in milliseconds, or null if there is no data there. */
export function levelAt(segments: readonly LoudnessSegment[], positionMs: number): number | null {
  const db = loudnessAt(segments, positionMs / 1000);
  return db === null ? null : dbToLevel(db);
}
