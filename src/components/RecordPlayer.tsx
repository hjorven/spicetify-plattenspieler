import { usePlayer } from "../hooks/usePlayer";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useSettings } from "../hooks/useSettings";
import { useTurntableGeometry } from "../hooks/useTurntableGeometry";
import { useTurntableMotion } from "../hooks/useTurntableMotion";
import { formatTime } from "../lib/format";
import { resolveRpm, SECONDS_PER_REVOLUTION } from "../lib/geometry";
import { RPM_OPTIONS, THEMES } from "../lib/settings";
import { Card, StatTile } from "./Card";
import { Header } from "./Header";
import { Levels } from "./Levels";
import { NowPlaying } from "./NowPlaying";
import { REPO_URL, SettingsModal } from "./settings/SettingsModal";
import { Turntable } from "./Turntable";

const { useState, useRef, useCallback } = Spicetify.React;

export function RecordPlayer() {
  const turntableRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [track, controls] = usePlayer();
  const geom = useTurntableGeometry(turntableRef);
  const reducedMotion = useReducedMotion();
  const closeSettings = useCallback(() => setShowSettings(false), []);

  const rpm = resolveRpm(settings.rpm, track.durationMs);
  const secondsPerRevolution = SECONDS_PER_REVOLUTION[rpm];
  const motion = useTurntableMotion({ track, geom, secondsPerRevolution, inertia: settings.inertia, reducedMotion });

  const status = !track.hasTrack ? "idle" : track.isPlaying ? "playing" : "paused";
  const rpmLabel = RPM_OPTIONS.find((o) => o.value === rpm)?.label ?? rpm;
  const themeLabel = THEMES.find((t) => t.value === settings.theme)?.label ?? settings.theme;
  const revolutions = track.durationMs > 0 ? Math.round(track.durationMs / 1000 / secondsPerRevolution) : 0;

  return (
    <div className="plattenspieler-page">
      <Header
        status={status}
        rpm={settings.rpm}
        onRpmChange={(v) => setSettings({ ...settings, rpm: v })}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="plattenspieler-grid">
        <Card
          eyebrow="Deck"
          title="Turntable"
          className="plattenspieler-deck"
          aside={<span className="plattenspieler-pill">{rpmLabel} RPM</span>}
        >
          <Turntable
            ref={turntableRef}
            track={track}
            rpm={rpm}
            theme={settings.theme}
            geom={geom}
            motion={motion}
            onToggle={settings.clickToToggle && track.hasTrack ? controls.togglePlay : undefined}
          />
        </Card>

        <div className="plattenspieler-side">
          {settings.showInfo && (
            <div className="plattenspieler-tiles">
              <StatTile label="Speed" value={rpmLabel} unit="RPM" hint={settings.rpm === "auto" ? "auto, by song length" : "fixed"} />
              <StatTile label="Length" value={track.hasTrack ? formatTime(track.durationMs) : "–"} hint="track duration" />
              <StatTile label="Revolutions" value={revolutions || "–"} hint="for this song" />
              <StatTile label="Style" value={themeLabel} hint="turntable finish" />
            </div>
          )}
          <NowPlaying track={track} controls={controls} motion={motion} />
          {settings.showVu && <Levels isPlaying={track.hasTrack && track.isPlaying} trackKey={track.key} />}
        </div>
      </main>

      <footer className="plattenspieler-footer">
        <span>Made by Jorven · v{__VERSION__} · </span>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="plattenspieler-link">
          GitHub
        </a>
      </footer>

      {showSettings && <SettingsModal settings={settings} onChange={setSettings} onClose={closeSettings} />}
    </div>
  );
}
