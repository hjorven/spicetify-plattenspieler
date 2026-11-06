import { armLength, type Geometry } from "../lib/geometry";
import type { Theme } from "../lib/settings";
import type { TrackState } from "../lib/player";
import type { MotionRefs } from "../hooks/useTurntableMotion";
import { Record, IdleRecord } from "./Record";
import { Tonearm } from "./Tonearm";

const { forwardRef } = Spicetify.React;

interface Props {
  track: TrackState;
  /** Resolved speed, shown on the plinth's speed selector */
  rpm: "33" | "45" | "78";
  theme: Theme;
  geom: Geometry;
  motion: MotionRefs;
  onToggle?: () => void;
}

/** The plinth with platter, tonearm and pivot. All movement is applied by useTurntableMotion. */
export const Turntable = forwardRef<HTMLDivElement, Props>(function Turntable({ track, rpm, theme, geom, motion, onToggle }, ref) {
  return (
    <div className={`plattenspieler-turntable plattenspieler-theme-${theme}`} ref={ref}>
      <div className={`plattenspieler-led${track.hasTrack ? (track.isPlaying ? " is-on" : " is-paused") : ""}`} />
      {track.hasTrack ? <Record track={track} vinylRef={motion.vinyl} onToggle={onToggle} /> : <IdleRecord />}
      <Tonearm armRef={motion.arm} length={armLength(geom)} pivotX={geom.pivotX} pivotY={geom.pivotY} />
      <div className="plattenspieler-pivot" style={{ left: `${geom.pivotX - 11}px`, top: `${geom.pivotY - 11}px` }} />
      <div className="plattenspieler-speeds" aria-hidden="true">
        {(["33", "45", "78"] as const).map((r) => (
          <div key={r} className={`plattenspieler-speed${r === rpm ? " is-active" : ""}`}>
            <span className="plattenspieler-speed-led" />
            {r}
          </div>
        ))}
      </div>
      <div className="plattenspieler-badge">{track.hasTrack ? "STEREO" : "STANDBY"}</div>
    </div>
  );
});
