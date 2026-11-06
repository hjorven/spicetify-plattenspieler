import { formatTime } from "../lib/format";
import type { TrackState } from "../lib/player";

const SEEK_STEP_MS = 5000;

interface Props {
  track: TrackState;
  onSeek(ratio: number): void;
}

export function TrackInfo({ track, onSeek }: Props) {
  const current = Math.round(track.progress * track.durationMs);

  const onKeyDown = (e: import("react").KeyboardEvent) => {
    if (track.durationMs <= 0) return;
    const step = SEEK_STEP_MS / track.durationMs;
    const actions: Record<string, () => void> = {
      ArrowRight: () => onSeek(track.progress + step),
      ArrowUp: () => onSeek(track.progress + step),
      ArrowLeft: () => onSeek(track.progress - step),
      ArrowDown: () => onSeek(track.progress - step),
      Home: () => onSeek(0),
      End: () => onSeek(0.999),
    };
    const action = actions[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="plattenspieler-info">
      <div className="plattenspieler-track-name" title={track.title}>
        {track.title}
      </div>
      <div className="plattenspieler-artist-name" title={track.artist}>
        {track.artist}
      </div>
      <div className="plattenspieler-progress-container">
        <span className="plattenspieler-time">{formatTime(current)}</span>
        <div
          className="plattenspieler-progress-bar"
          role="slider"
          tabIndex={0}
          aria-label="Playback position"
          aria-valuemin={0}
          aria-valuemax={Math.round(track.durationMs / 1000)}
          aria-valuenow={Math.round(current / 1000)}
          aria-valuetext={`${formatTime(current)} of ${formatTime(track.durationMs)}`}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onSeek((e.clientX - rect.left) / rect.width);
          }}
          onKeyDown={onKeyDown}
        >
          <div className="plattenspieler-progress-fill" style={{ width: `${track.progress * 100}%` }} />
        </div>
        <span className="plattenspieler-time plattenspieler-time-right">{formatTime(track.durationMs)}</span>
      </div>
    </div>
  );
}
