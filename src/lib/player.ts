import { clamp01 } from "./format";

export interface TrackState {
  hasTrack: boolean;
  /** Identifies the current track; changes on song change. */
  key: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  isPlaying: boolean;
  durationMs: number;
  /** 0–1 */
  progress: number;
}

export const EMPTY_TRACK: TrackState = {
  hasTrack: false,
  key: "",
  title: "",
  artist: "",
  album: "",
  albumArt: "",
  isPlaying: false,
  durationMs: 0,
  progress: 0,
};

/** spotify:image:<id> → https://i.scdn.co/image/<id>; other URLs are returned unchanged. */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const s = String(url).trim();
  if (/^spotify:image:/i.test(s)) {
    const id = s.replace(/^spotify:image:/i, "");
    return id ? `https://i.scdn.co/image/${id}` : "";
  }
  return s;
}

function safe<T>(fn: (() => T) | undefined): T | undefined {
  if (!fn) return undefined;
  try {
    const v = fn();
    return v ?? undefined;
  } catch {
    return undefined;
  }
}

export function getDuration(P: SpicetifyPlayer | undefined): number {
  if (!P) return 0;
  const item = P.data?.item ?? P.data?.track;
  return safe(P.getDuration && (() => P.getDuration!())) || P.data?.duration || item?.duration?.milliseconds || 0;
}

/**
 * Reads the player state. Prefers the stable getters getDuration/getProgress/isPlaying
 * and falls back to Player.data when a getter is missing in a Spicetify version.
 */
export function readPlayer(P: SpicetifyPlayer | undefined): TrackState {
  if (!P) return EMPTY_TRACK;
  const data = P.data ?? {};
  const item = data.item ?? data.track;
  if (!item?.name) return EMPTY_TRACK;

  const meta = item.metadata ?? {};
  const images = item.album?.images ?? item.images ?? [];
  const albumArt = normalizeImageUrl(
    meta.image_xlarge_url || meta.image_large_url || images[0]?.url || meta.image_url,
  );

  const durationMs = getDuration(P);
  const position =
    safe(P.getProgress && (() => P.getProgress!())) ?? data.position ?? data.positionAsOfTimestamp ?? 0;
  const playing = safe(P.isPlaying && (() => P.isPlaying!()));
  const artist =
    (item.artists ?? [])
      .map((a) => a.name)
      .filter(Boolean)
      .join(", ") ||
    meta.artist_name ||
    "";

  return {
    hasTrack: true,
    key: item.uri || `${item.name}|${artist}|${durationMs}`,
    title: item.name,
    artist,
    album: item.album?.name || meta.album_title || "",
    albumArt,
    isPlaying: playing !== undefined ? !!playing : !(data.isPaused || data.is_paused),
    durationMs,
    progress: durationMs > 0 ? clamp01(position / durationMs) : 0,
  };
}

export function readIsPlaying(P: SpicetifyPlayer | undefined): boolean | undefined {
  return safe(P?.isPlaying && (() => P.isPlaying!()));
}
