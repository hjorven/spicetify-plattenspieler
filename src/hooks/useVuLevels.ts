import { findAnalyser, levelsFromSpectrum, SILENT, simulatedLevels, stepPaused, stepPlaying, type VuLevels } from "../lib/vu";

const { useState, useEffect, useRef } = Spicetify.React;

/** State updates are throttled to ~20 fps; the RAF loop itself runs at display rate. */
const UPDATE_INTERVAL_MS = 50;
/** Look for the analyser every frame for ~10 s, then only every ~20 s. */
const FAST_SEARCH_FRAMES = 600;
const SLOW_SEARCH_EVERY = 1200;

/**
 * Drives the VU meter. While playing it reads the audio analyser (or simulates a beat),
 * while paused the bars fall to zero and the loop stops. Resets on track change.
 */
export function useVuLevels(isPlaying: boolean, trackKey: string): VuLevels {
  const [levels, setLevels] = useState<VuLevels>(SILENT);
  const current = useRef<VuLevels>({ ...SILENT });
  const analyser = useRef<AnalyserLike | null>(null);
  const tries = useRef(0);

  useEffect(() => {
    current.current = { ...SILENT };
    analyser.current = null;
    tries.current = 0;
    setLevels(SILENT);
  }, [trackKey]);

  useEffect(() => {
    let rafId = 0;
    let last = 0;
    let buf: Uint8Array | null = null;

    const getAnalyser = () => {
      if (!analyser.current) {
        tries.current++;
        if (tries.current < FAST_SEARCH_FRAMES || tries.current % SLOW_SEARCH_EVERY === 0) {
          analyser.current = findAnalyser(Spicetify.Player);
        }
      }
      return analyser.current;
    };

    const loop = (time: number) => {
      rafId = requestAnimationFrame(loop);
      const v = current.current;

      if (isPlaying) {
        const a = getAnalyser();
        let input: [number, number];
        if (a) {
          if (!buf || buf.length !== a.frequencyBinCount) buf = new Uint8Array(a.frequencyBinCount);
          try {
            a.getByteFrequencyData(buf);
          } catch {
            analyser.current = null;
            return;
          }
          input = levelsFromSpectrum(buf);
        } else {
          input = simulatedLevels(time);
        }
        stepPlaying(v, input[0], input[1]);
      } else if (stepPaused(v)) {
        setLevels(SILENT);
        cancelAnimationFrame(rafId);
        return;
      }

      if (time - last > UPDATE_INTERVAL_MS) {
        last = time;
        setLevels({ ...v });
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  return levels;
}
