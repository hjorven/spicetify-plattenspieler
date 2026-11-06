import { clamp01 } from "../lib/format";
import { levelAt } from "../lib/loudness";
import { estimateProgress, type ProgressAnchor } from "../lib/motion";
import type { TrackState } from "../lib/player";
import { findAnalyser, levelsFromSpectrum, SILENT, simulatedLevels, stepPaused, stepPlaying, type VuLevels } from "../lib/vu";
import { useAudioAnalysis } from "./useAudioAnalysis";
import { useFrameLoop } from "./useFrameLoop";

const { useEffect, useRef, useState } = Spicetify.React;

/** Look for the analyser every frame for ~10 s, then only every ~20 s. */
const FAST_SEARCH_FRAMES = 600;
const SLOW_SEARCH_EVERY = 1200;

/**
 * Where the levels come from:
 * - "live": Spotify's audio analyser (real-time spectrum, rarely available)
 * - "track": the song's loudness from Spotify's audio analysis, synced to the position
 * - "simulated": a beat-like fake signal
 */
export type VuSource = "live" | "track" | "simulated";

export interface VuRefs {
  left: { current: HTMLDivElement | null };
  right: { current: HTMLDivElement | null };
  peakLeft: { current: HTMLDivElement | null };
  peakRight: { current: HTMLDivElement | null };
}

/**
 * Drives the peak meter by writing directly to the bar elements (no React state per frame).
 * Returns the refs plus the source of the levels.
 */
export function useVuMeter(track: TrackState): [VuRefs, VuSource] {
  const refs: VuRefs = {
    left: useRef<HTMLDivElement>(null),
    right: useRef<HTMLDivElement>(null),
    peakLeft: useRef<HTMLDivElement>(null),
    peakRight: useRef<HTMLDivElement>(null),
  };
  const isPlaying = track.hasTrack && track.isPlaying;
  const levels = useRef<VuLevels>({ ...SILENT });
  const analyser = useRef<AnalyserLike | null>(null);
  const tries = useRef(0);
  const buf = useRef<Uint8Array | null>(null);
  const [live, setLive] = useState(false);
  const segments = useAudioAnalysis(track.key, track.hasTrack);

  // Same position extrapolation as the tonearm: Spotify reports the position only every ~0.5 s.
  const anchor = useRef<ProgressAnchor>({ progress: 0, at: performance.now() });
  useEffect(() => {
    anchor.current = { progress: track.progress, at: performance.now() };
  }, [track.progress, track.isPlaying, track.key]);

  useEffect(() => {
    levels.current = { ...SILENT };
    analyser.current = null;
    tries.current = 0;
  }, [track.key]);

  // clip-path instead of scaleX, so segmented bars (Silver skin) keep their segment width.
  const clip = (level: number) => `inset(0 ${((1 - clamp01(level)) * 100).toFixed(2)}% 0 0)`;
  const paint = (v: VuLevels) => {
    if (refs.left.current) refs.left.current.style.clipPath = clip(v.l);
    if (refs.right.current) refs.right.current.style.clipPath = clip(v.r);
    if (refs.peakLeft.current) refs.peakLeft.current.style.left = `${(clamp01(v.pl) * 100).toFixed(1)}%`;
    if (refs.peakRight.current) refs.peakRight.current.style.left = `${(clamp01(v.pr) * 100).toFixed(1)}%`;
  };

  const readAnalyser = (): [number, number] | null => {
    if (!analyser.current) {
      tries.current++;
      if (tries.current < FAST_SEARCH_FRAMES || tries.current % SLOW_SEARCH_EVERY === 0) {
        analyser.current = findAnalyser(Spicetify.Player);
        if (analyser.current) setLive(true);
      }
    }
    const a = analyser.current;
    if (!a) return null;
    if (!buf.current || buf.current.length !== a.frequencyBinCount) buf.current = new Uint8Array(a.frequencyBinCount);
    try {
      a.getByteFrequencyData(buf.current);
      return levelsFromSpectrum(buf.current);
    } catch {
      analyser.current = null;
      setLive(false);
      return null;
    }
  };

  useFrameLoop(
    (_dt, now) => {
      const v = levels.current;
      if (!isPlaying) {
        const done = stepPaused(v);
        paint(v);
        return !done;
      }
      let input = readAnalyser();
      if (!input && segments) {
        const positionMs = estimateProgress(anchor.current, now, track.durationMs, true) * track.durationMs;
        const level = levelAt(segments, positionMs);
        // The analysis is mono, so both channels show the same loudness.
        input = [level ?? 0, level ?? 0];
      }
      stepPlaying(v, ...(input ?? simulatedLevels(now)));
      paint(v);
      return true;
    },
    true,
    [isPlaying, track.key, track.durationMs, segments],
  );

  return [refs, live ? "live" : segments ? "track" : "simulated"];
}
