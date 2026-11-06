import { useVuLevels } from "../hooks/useVuLevels";
import { clamp01 } from "../lib/format";

function Bar({ level, peak }: { level: number; peak: number }) {
  return (
    <div className="plattenspieler-vu">
      <div className="plattenspieler-vu-fill" style={{ transform: `scaleY(${clamp01(level)})` }} />
      <div className="plattenspieler-vu-peak" style={{ bottom: `${clamp01(peak) * 100}%` }} />
    </div>
  );
}

/** Stereo VU meter. Has its own state so only the meter re-renders ~20 times per second. */
export function VuMeter({ isPlaying, trackKey }: { isPlaying: boolean; trackKey: string }) {
  const v = useVuLevels(isPlaying, trackKey);
  return (
    <div className="plattenspieler-vu-container" aria-hidden="true">
      <Bar level={v.l} peak={v.pl} />
      <Bar level={v.r} peak={v.pr} />
    </div>
  );
}
