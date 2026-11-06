import type { TrackState } from "../lib/player";

const { useState, useEffect } = Spicetify.React;

interface Props {
  track: TrackState;
  /** Rotation is applied to this element every frame by useTurntableMotion. */
  vinylRef: { current: HTMLDivElement | null };
  /** When set, the record acts as a play/pause button. */
  onToggle?: () => void;
}

export function IdleRecord() {
  return (
    <div className="plattenspieler-platter plattenspieler-platter-idle">
      <div className="plattenspieler-vinyl plattenspieler-vinyl-noart">
        <div className="plattenspieler-grooves" />
        <div className="plattenspieler-label">No track playing</div>
        <div className="plattenspieler-hole" />
      </div>
    </div>
  );
}

/** Vinyl with the album art as center. Falls back to a plain label when the cover is missing or fails to load. */
export function Record({ track, vinylRef, onToggle }: Props) {
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
        ref={vinylRef as import("react").Ref<HTMLDivElement>}
        className={`plattenspieler-vinyl${hasArt ? "" : " plattenspieler-vinyl-noart"}`}
        style={hasArt ? { backgroundImage: `url("${track.albumArt}")` } : undefined}
      >
        {/* Hidden image, only used to detect a failed cover load */}
        {hasArt && (
          <img src={track.albumArt} alt="" className="plattenspieler-art-probe" onError={() => setArtFailed(true)} />
        )}
        {!hasArt && <div className="plattenspieler-label">{track.title}</div>}
        <div className="plattenspieler-grooves" />
        <div className="plattenspieler-hole" />
      </div>
      {/* Static light reflection; does not rotate with the record */}
      <div className="plattenspieler-shine" />
    </div>
  );
}
