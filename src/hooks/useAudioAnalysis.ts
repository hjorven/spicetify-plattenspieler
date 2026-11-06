import { type LoudnessSegment, parseSegments } from "../lib/loudness";

const { useEffect, useState } = Spicetify.React;

/** Keeps the analysis of the last few tracks, so skipping back and forth does not refetch. */
const CACHE_SIZE = 8;
const cache = new Map<string, LoudnessSegment[] | null>();

function remember(key: string, value: LoudnessSegment[] | null) {
  cache.delete(key);
  cache.set(key, value);
  while (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value as string);
}

/**
 * Loads Spotify's audio analysis for the current track via Spicetify.getAudioData and returns its
 * loudness segments, or null while loading or when Spotify has none (podcasts, local files, errors).
 */
export function useAudioAnalysis(trackKey: string, enabled: boolean): LoudnessSegment[] | null {
  const [segments, setSegments] = useState<LoudnessSegment[] | null>(() => cache.get(trackKey) ?? null);

  useEffect(() => {
    if (!enabled || !trackKey) {
      setSegments(null);
      return;
    }
    if (cache.has(trackKey)) {
      setSegments(cache.get(trackKey) ?? null);
      return;
    }
    setSegments(null);
    const getAudioData = Spicetify.getAudioData;
    if (typeof getAudioData !== "function") return;

    let cancelled = false;
    const uri = trackKey.startsWith("spotify:track:") ? trackKey : undefined;
    // Without a track uri, getAudioData() falls back to the current track.
    Promise.resolve()
      .then(() => getAudioData.call(Spicetify, uri))
      .then(
        (data) => parseSegments(data),
        (err: unknown) => {
          console.debug("[plattenspieler] no audio analysis:", err);
          return null;
        },
      )
      .then((result) => {
        remember(trackKey, result);
        if (!cancelled) setSegments(result);
      });
    return () => {
      cancelled = true;
    };
  }, [trackKey, enabled]);

  return segments;
}
