import { useVuMeter } from "../hooks/useVuMeter";
import { Card } from "./Card";

type DivRef = import("react").Ref<HTMLDivElement>;

function Channel({ name, bar, peak }: { name: string; bar: DivRef; peak: DivRef }) {
  return (
    <div className="plattenspieler-level">
      <span className="plattenspieler-level-name">{name}</span>
      <div className="plattenspieler-level-track">
        <div className="plattenspieler-level-fill" ref={bar} />
        <div className="plattenspieler-level-peak" ref={peak} />
      </div>
    </div>
  );
}

/** Stereo level meter card. Bars are painted by useVuMeter without React re-renders. */
export function Levels({ isPlaying, trackKey }: { isPlaying: boolean; trackKey: string }) {
  const [refs, live] = useVuMeter(isPlaying, trackKey);
  return (
    <Card
      eyebrow="Levels"
      title="VU meter"
      aside={
        <span className="plattenspieler-pill" title={live ? "Reading Spotify's audio analyser" : "No analyser available"}>
          {live ? "live" : "simulated"}
        </span>
      }
    >
      <div className="plattenspieler-levels" aria-hidden="true">
        <Channel name="L" bar={refs.left as DivRef} peak={refs.peakLeft as DivRef} />
        <Channel name="R" bar={refs.right as DivRef} peak={refs.peakRight as DivRef} />
      </div>
    </Card>
  );
}
