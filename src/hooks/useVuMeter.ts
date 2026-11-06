import { clamp01 } from "../lib/format";
import { findAnalyser, levelsFromSpectrum, SILENT, simulatedLevels, stepPaused, stepPlaying, type VuLevels } from "../lib/vu";
import { useFrameLoop } from "./useFrameLoop";

const { useEffect, useRef, useState } = Spicetify.React;

/** Look for the analyser every frame for ~10 s, then only every ~20 s. */
const FAST_SEARCH_FRAMES = 600;
const SLOW_SEARCH_EVERY = 1200;

export interface VuRefs {
  left: { current: HTMLDivElement | null };
  right: { current: HTMLDivElement | null };
  peakLeft: { current: HTMLDivElement | null };
  peakRight: { current: HTMLDivElement | null };
}

/**
 * Drives the VU meter by writing directly to the bar elements (no React state per frame).
 * Returns the refs plus whether a real analyser was found (otherwise the signal is simulated).
 */
export function useVuMeter(isPlaying: boolean, trackKey: string): [VuRefs, boolean] {
  const refs: VuRefs = {
    left: useRef<HTMLDivElement>(null),
    right: useRef<HTMLDivElement>(null),
    peakLeft: useRef<HTMLDivElement>(null),
    peakRight: useRef<HTMLDivElement>(null),
  };
  const levels = useRef<VuLevels>({ ...SILENT });
  const analyser = useRef<AnalyserLike | null>(null);
  const tries = useRef(0);
  const buf = useRef<Uint8Array | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    levels.current = { ...SILENT };
    analyser.current = null;
    tries.current = 0;
  }, [trackKey]);

  const paint = (v: VuLevels) => {
    if (refs.left.current) refs.left.current.style.transform = `scaleX(${clamp01(v.l).toFixed(3)})`;
    if (refs.right.current) refs.right.current.style.transform = `scaleX(${clamp01(v.r).toFixed(3)})`;
    if (refs.peakLeft.current) refs.peakLeft.current.style.left = `${(clamp01(v.pl) * 100).toFixed(1)}%`;
    if (refs.peakRight.current) refs.peakRight.current.style.left = `${(clamp01(v.pr) * 100).toFixed(1)}%`;
  };

  useFrameLoop(
    (_dt, now) => {
      const v = levels.current;
      if (!isPlaying) {
        const done = stepPaused(v);
        paint(v);
        return !done;
      }
      if (!analyser.current) {
        tries.current++;
        if (tries.current < FAST_SEARCH_FRAMES || tries.current % SLOW_SEARCH_EVERY === 0) {
          analyser.current = findAnalyser(Spicetify.Player);
          if (analyser.current) setLive(true);
        }
      }
      const a = analyser.current;
      let input: [number, number];
      if (a) {
        if (!buf.current || buf.current.length !== a.frequencyBinCount) buf.current = new Uint8Array(a.frequencyBinCount);
        try {
          a.getByteFrequencyData(buf.current);
          input = levelsFromSpectrum(buf.current);
        } catch {
          analyser.current = null;
          setLive(false);
          input = simulatedLevels(now);
        }
      } else {
        input = simulatedLevels(now);
      }
      stepPlaying(v, input[0], input[1]);
      paint(v);
      return true;
    },
    true,
    [isPlaying, trackKey],
  );

  return [refs, live];
}
