import type { PlayerControls } from "../hooks/usePlayer";
import type { MotionRefs } from "../hooks/useTurntableMotion";
import { formatTime } from "../lib/format";
import type { TrackState } from "../lib/player";
import { Card } from "./Card";
import { ICON_DISC, ICON_NEXT, ICON_PAUSE, ICON_PLAY, ICON_PREV, Icon } from "./Icon";

const SEEK_STEP_MS = 5000;

interface Props {
  track: TrackState;
  controls: PlayerControls;
  motion: MotionRefs;
}

/** Track card: cover, title, artist, album, progress bar (driven by the motion loop) and transport buttons. */
export function NowPlaying({ track, controls, motion }: Props) {
  const onKeyDown = (e: import("react").KeyboardEvent) => {
    if (track.durationMs <= 0) return;
    const step = SEEK_STEP_MS / track.durationMs;
    const actions: Record<string, () => void> = {
      ArrowRight: () => controls.seek(track.progress + step),
      ArrowUp: () => controls.seek(track.progress + step),
      ArrowLeft: () => controls.seek(track.progress - step),
      ArrowDown: () => controls.seek(track.progress - step),
      Home: () => controls.seek(0),
      End: () => controls.seek(0.999),
    };
    const action = actions[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  const current = Math.round(track.progress * track.durationMs);

  return (
    <Card eyebrow="Now playing" title="Track" className="plattenspieler-now">
      {track.hasTrack ? (
        <>
          <div className="plattenspieler-now-row">
            {track.albumArt ? (
              <img className="plattenspieler-now-art" src={track.albumArt} alt="" />
            ) : (
              <div className="plattenspieler-now-art plattenspieler-now-art-empty">
                <Icon d={ICON_DISC} size={28} />
              </div>
            )}
            <div className="plattenspieler-now-text">
              <div className="plattenspieler-now-title" title={track.title}>
                {track.title}
              </div>
              <div className="plattenspieler-now-sub" title={track.artist}>
                {track.artist}
              </div>
              {track.album && (
                <div className="plattenspieler-now-album" title={track.album}>
                  {track.album}
                </div>
              )}
            </div>
          </div>

          <div
            className="plattenspieler-progress"
            role="slider"
            tabIndex={0}
            aria-label="Playback position"
            aria-valuemin={0}
            aria-valuemax={Math.round(track.durationMs / 1000)}
            aria-valuenow={Math.round(current / 1000)}
            aria-valuetext={`${formatTime(current)} of ${formatTime(track.durationMs)}`}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              controls.seek((e.clientX - rect.left) / rect.width);
            }}
            onKeyDown={onKeyDown}
          >
            <div className="plattenspieler-progress-track">
              <div className="plattenspieler-progress-fill" ref={motion.progressFill as import("react").Ref<HTMLDivElement>} />
            </div>
          </div>
          <div className="plattenspieler-progress-times">
            <span ref={motion.elapsed as import("react").Ref<HTMLSpanElement>}>{formatTime(current)}</span>
            <span ref={motion.remaining as import("react").Ref<HTMLSpanElement>}>
              -{formatTime(track.durationMs - current)}
            </span>
          </div>

          <div className="plattenspieler-transport">
            <button type="button" className="plattenspieler-icon-btn" onClick={controls.back} aria-label="Previous track">
              <Icon d={ICON_PREV} />
            </button>
            <button
              type="button"
              className="plattenspieler-play-btn"
              onClick={controls.togglePlay}
              aria-label={track.isPlaying ? "Pause" : "Play"}
            >
              <Icon d={track.isPlaying ? ICON_PAUSE : ICON_PLAY} size={22} />
            </button>
            <button type="button" className="plattenspieler-icon-btn" onClick={controls.next} aria-label="Next track">
              <Icon d={ICON_NEXT} />
            </button>
          </div>
        </>
      ) : (
        <div className="plattenspieler-empty">
          <Icon d={ICON_DISC} size={32} />
          <div>Nothing on the platter yet.</div>
          <div className="plattenspieler-empty-hint">Start a song in Spotify and the record drops in.</div>
        </div>
      )}
    </Card>
  );
}
