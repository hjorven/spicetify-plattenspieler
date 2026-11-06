import { clamp01 } from "../lib/format";
import { EMPTY_TRACK, getDuration, readIsPlaying, readPlayer, type TrackState } from "../lib/player";

const { useState, useEffect, useRef, useCallback } = Spicetify.React;

export interface PlayerControls {
  togglePlay(): void;
  next(): void;
  back(): void;
  /** ratio 0–1 of the current track */
  seek(ratio: number): void;
}

/** Subscribes to Spicetify player events and exposes the current track plus controls. */
export function usePlayer(): [TrackState, PlayerControls] {
  const [track, setTrack] = useState<TrackState>(EMPTY_TRACK);
  const hasTrackRef = useRef(false);
  hasTrackRef.current = track.hasTrack;

  useEffect(() => {
    const P = Spicetify.Player;
    const update = () => setTrack(readPlayer(Spicetify.Player));

    const onSongChange = () => update();
    const onPlayPause = () => {
      const playing = readIsPlaying(Spicetify.Player);
      if (playing === undefined) update();
      else setTrack((t) => (t.isPlaying === playing ? t : { ...t, isPlaying: playing }));
    };
    const onProgress = (e?: { data?: unknown }) => {
      // Page opened before Spotify was ready: read everything once.
      if (!hasTrackRef.current) return update();
      const player = Spicetify.Player;
      const duration = getDuration(player);
      if (duration <= 0) return;
      const pos = typeof e?.data === "number" ? e.data : (player?.getProgress?.() ?? 0);
      // Deliberately does not touch isPlaying: progress events also fire while paused (e.g. after seeking).
      setTrack((t) => ({ ...t, progress: clamp01(pos / duration), durationMs: duration }));
    };

    update();
    // In case the player was not ready yet when the page opened.
    const retry = window.setTimeout(update, 1000);
    P?.addEventListener?.("songchange", onSongChange);
    P?.addEventListener?.("onplaypause", onPlayPause);
    P?.addEventListener?.("onprogress", onProgress);

    return () => {
      window.clearTimeout(retry);
      P?.removeEventListener?.("songchange", onSongChange);
      P?.removeEventListener?.("onplaypause", onPlayPause);
      P?.removeEventListener?.("onprogress", onProgress);
    };
  }, []);

  const togglePlay = useCallback(() => {
    try {
      Spicetify.Player?.togglePlay?.();
    } catch (err) {
      console.warn("[plattenspieler] togglePlay failed", err);
    }
  }, []);

  const next = useCallback(() => {
    try {
      Spicetify.Player?.next?.();
    } catch (err) {
      console.warn("[plattenspieler] next failed", err);
    }
  }, []);

  const back = useCallback(() => {
    try {
      Spicetify.Player?.back?.();
    } catch (err) {
      console.warn("[plattenspieler] back failed", err);
    }
  }, []);

  const durationMs = track.durationMs;
  const seek = useCallback(
    (ratio: number) => {
      const P = Spicetify.Player;
      if (!P?.seek || durationMs <= 0) return;
      const r = clamp01(ratio);
      P.seek(Math.round(r * durationMs));
      setTrack((t) => ({ ...t, progress: r }));
    },
    [durationMs],
  );

  return [track, { togglePlay, next, back, seek }];
}
