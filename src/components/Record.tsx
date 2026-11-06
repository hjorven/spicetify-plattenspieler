import type { TrackState } from "../lib/player";

const { useState, useEffect } = Spicetify.React;

interface Props {
  track: TrackState;
  secondsPerRevolution: number;
  /** When set, the record acts as a play/pause button. */
  onToggle?: () => void;
}

export function IdleRecord() {
  return (
    <div className="plattenspieler-idle">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" className="plattenspieler-idle-hole" />
      </svg>
      No track playing
    </div>
  );
}

/** Spinning vinyl with the album art. Falls back to a plain label when the cover is missing or fails to load. */
export function Record({ track, secondsPerRevolution, onToggle }: Props) {
  const [artFailed, setArtFailed] = useState(false);
  useEffect(() => setArtFailed(false), [track.albumArt]);

  const hasArt = !!track.albumArt && !artFailed;
  const label = track.isPlaying ? "Pause" : "Play";

  return (
    <div
      className={`plattenspieler-platter${onToggle ? " plattenspieler-platter-clickable" : ""}`}
      onClick={onToggle}
      onKeyDown={
        onToggle
          ? (e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                onToggle();
              }
            }
          : undefined
      }
      role={onToggle ? "button" : undefined}
      tabIndex={onToggle ? 0 : undefined}
      aria-label={onToggle ? label : undefined}
      title={onToggle ? label : undefined}
    >
      <div
        className={`plattenspieler-vinyl plattenspieler-vinyl-spinning${hasArt ? "" : " plattenspieler-vinyl-noart"}`}
        style={{
          backgroundImage: hasArt ? `url("${track.albumArt}")` : undefined,
          animationDuration: `${secondsPerRevolution}s`,
          animationPlayState: track.isPlaying ? "running" : "paused",
        }}
      >
        {/* Hidden image, only used to detect a failed cover load */}
        {hasArt && (
          <img src={track.albumArt} alt="" className="plattenspieler-art-probe" onError={() => setArtFailed(true)} />
        )}
        {!hasArt && <div className="plattenspieler-label">{track.title}</div>}
        <div className="plattenspieler-grooves" />
        <div className="plattenspieler-shine" />
        <div className="plattenspieler-hole" />
      </div>
    </div>
  );
}
