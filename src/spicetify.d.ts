/**
 * Minimal typings for the parts of the Spicetify global this app uses.
 * Everything optional is guarded at runtime, because Spotify/Spicetify
 * versions differ in what they expose.
 */

type ReactNS = typeof import("react");
type ReactDOMNS = typeof import("react-dom");

interface SpicetifyImage {
  url?: string;
}

interface SpicetifyTrackItem {
  name?: string;
  uri?: string;
  artists?: { name?: string }[];
  album?: { name?: string; images?: SpicetifyImage[] };
  images?: SpicetifyImage[];
  duration?: { milliseconds?: number };
  metadata?: Record<string, string | undefined>;
}

interface SpicetifyPlayerData {
  item?: SpicetifyTrackItem;
  track?: SpicetifyTrackItem;
  duration?: number;
  position?: number;
  positionAsOfTimestamp?: number;
  isPaused?: boolean;
  is_paused?: boolean;
}

interface AnalyserLike {
  frequencyBinCount: number;
  getByteFrequencyData(buf: Uint8Array): void;
}

type PlayerEvent = "songchange" | "onplaypause" | "onprogress";

interface SpicetifyPlayer {
  data?: SpicetifyPlayerData;
  getDuration?(): number;
  getProgress?(): number;
  isPlaying?(): boolean;
  togglePlay?(): void;
  next?(): void;
  back?(): void;
  seek?(positionMs: number): void;
  addEventListener?(type: PlayerEvent, cb: (e?: { data?: unknown }) => void): void;
  removeEventListener?(type: PlayerEvent, cb: (e?: { data?: unknown }) => void): void;
  [key: string]: unknown;
}

interface SpicetifyGlobal {
  React: ReactNS;
  ReactDOM?: ReactDOMNS;
  Player?: SpicetifyPlayer;
  /** Spotify's audio analysis (segments with loudness) for a track; current track if uri is omitted. */
  getAudioData?(uri?: string): Promise<unknown>;
  ReactComponent?: {
    Toggle?: import("react").ComponentType<{ value: boolean; onSelected: (v: boolean) => void }>;
  };
}

declare const Spicetify: SpicetifyGlobal;
declare const __VERSION__: string;
