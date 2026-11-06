import { useVuMeter, type VuSource } from "../hooks/useVuMeter";
import type { TrackState } from "../lib/player";
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
const SOURCE_LABEL: Record<VuSource, { text: string; title: string }> = {
  live: { text: "live", title: "Reading Spotify's audio analyser" },
  track: { text: "track", title: "Loudness of this song from Spotify's audio analysis (mono)" },
  simulated: { text: "simulated", title: "No loudness data for this track, showing a simulated signal" },
};

export function Levels({ track }: { track: TrackState }) {
  const [refs, source] = useVuMeter(track);
  const label = SOURCE_LABEL[source];
  return (
    <Card
      eyebrow="Levels"
      title="Peak meter"
      aside={
        <span className="plattenspieler-pill" title={label.title}>
          {label.text}
        </span>
      }
    >
      <div className="plattenspieler-levels" aria-hidden="true">
        <Channel name="L" bar={refs.left as DivRef} peak={refs.peakLeft as DivRef} />
        <Channel name="R" bar={refs.right as DivRef} peak={refs.peakRight as DivRef} />
        <div className="plattenspieler-level-scale">
          {["0.1", "0.5", "1", "3", "5", "10", "30", "50", "100"].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>
    </Card>
  );
}
