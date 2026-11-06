import { clamp01 } from "./format";

export interface VuLevels {
  l: number;
  r: number;
  /** Peak hold, left */
  pl: number;
  /** Peak hold, right */
  pr: number;
}

export const SILENT: VuLevels = Object.freeze({ l: 0, r: 0, pl: 0, pr: 0 });

/** Bar fall-off per frame while playing (≈130 ms to 50 %). */
const DECAY = 0.92;
/** Peak fall-off per frame while playing (holds ~3–4 s). */
const PEAK_DECAY = 0.997;
/** Faster fall-off while paused. */
const PAUSE_DECAY = 0.88;
const PAUSE_PEAK_DECAY = 0.995;

/** Averages the lower and upper half of the frequency bins into two pseudo-channels. */
export function levelsFromSpectrum(buf: Uint8Array): [number, number] {
  const half = buf.length >> 1;
  if (half === 0) return [0, 0];
  let sumL = 0;
  let sumR = 0;
  for (let i = 0; i < half; i++) sumL += buf[i];
  for (let i = half; i < buf.length; i++) sumR += buf[i];
  return [(sumL / half / 255) * 1.5, (sumR / (buf.length - half) / 255) * 1.5];
}

/** Beat-like fake signal for when Spotify exposes no analyser. */
export function simulatedLevels(timeMs: number, random: () => number = Math.random): [number, number] {
  const t = timeMs * 0.001;
  const period = 0.4 + ((t * 0.01) % 0.3);
  const energy = Math.sin(((t % period) / period) * Math.PI);
  const l = 0.08 + energy * 0.55 + Math.sin(t * 3.1) * 0.08 + (1 - energy) * random() * 0.12;
  const r = 0.08 + energy * 0.5 + Math.sin(t * 2.8 + 0.7) * 0.08 + (1 - energy) * random() * 0.12;
  return [l, r];
}

/** One frame while playing: instant attack, slow decay, peak hold. Mutates and returns v. */
export function stepPlaying(v: VuLevels, inL: number, inR: number): VuLevels {
  v.l = Math.max(clamp01(inL), v.l * DECAY);
  v.r = Math.max(clamp01(inR), v.r * DECAY);
  v.pl = Math.max(v.pl * PEAK_DECAY, v.l);
  v.pr = Math.max(v.pr * PEAK_DECAY, v.r);
  return v;
}

/** One frame while paused. Returns true once everything has fallen to (practically) zero. */
export function stepPaused(v: VuLevels): boolean {
  v.l *= PAUSE_DECAY;
  v.r *= PAUSE_DECAY;
  v.pl *= PAUSE_PEAK_DECAY;
  v.pr *= PAUSE_PEAK_DECAY;
  if (v.l < 0.005 && v.r < 0.005 && v.pl < 0.005 && v.pr < 0.005) {
    v.l = v.r = v.pl = v.pr = 0;
    return true;
  }
  return false;
}

export function findAnalyser(P: SpicetifyPlayer | undefined): AnalyserLike | null {
  if (!P) return null;
  for (const name of ["analyser", "_analyser", "audioAnalyser", "_audioAnalyser"]) {
    try {
      const a = P[name] as AnalyserLike | undefined;
      if (a && typeof a.frequencyBinCount === "number" && a.frequencyBinCount > 0) return a;
    } catch {
      // Some getters throw; try the next name.
    }
  }
  return null;
}
