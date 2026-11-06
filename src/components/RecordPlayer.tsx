import { usePlayer } from "../hooks/usePlayer";
import { useSettings } from "../hooks/useSettings";
import { useTurntableGeometry } from "../hooks/useTurntableGeometry";
import { armLength, resolveRpm, SECONDS_PER_REVOLUTION, tonearmAngle } from "../lib/geometry";
import { ICON_GEAR, Icon } from "./Icon";
import { IdleRecord, Record } from "./Record";
import { REPO_URL, SettingsModal } from "./settings/SettingsModal";
import { Tonearm } from "./Tonearm";
import { TrackInfo } from "./TrackInfo";
import { VuMeter } from "./VuMeter";

const { useState, useRef, useCallback } = Spicetify.React;

export function RecordPlayer() {
  const turntableRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [track, controls] = usePlayer();
  const geom = useTurntableGeometry(turntableRef);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  const rpm = resolveRpm(settings.rpm, track.durationMs);
  const statusClass = !track.hasTrack
    ? " plattenspieler-play-indicator-dot-off"
    : track.isPlaying
      ? ""
      : " plattenspieler-play-indicator-dot-paused";

  return (
    <div className={`plattenspieler-container plattenspieler-theme-${settings.theme}`}>
      <div className="plattenspieler-toolbar">
        <button
          type="button"
          className="plattenspieler-icon-btn"
          onClick={() => setShowSettings(true)}
          aria-label="Open settings"
          title="Settings"
        >
          <Icon d={ICON_GEAR} />
        </button>
      </div>

      <div className="plattenspieler-turntable" ref={turntableRef}>
        <div
          className="plattenspieler-play-indicator"
          title={!track.hasTrack ? "Stopped" : track.isPlaying ? "Playing" : "Paused"}
        >
          <div className={`plattenspieler-play-indicator-dot${statusClass}`} />
        </div>

        {track.hasTrack ? (
          <Record
            track={track}
            secondsPerRevolution={SECONDS_PER_REVOLUTION[rpm]}
            onToggle={settings.clickToToggle ? controls.togglePlay : undefined}
          />
        ) : (
          <IdleRecord />
        )}

        <Tonearm
          length={armLength(geom)}
          angle={tonearmAngle(geom, track.hasTrack, track.progress)}
          pivotX={geom.pivotX}
          pivotY={geom.pivotY}
        />
        <div className="plattenspieler-pivot" style={{ left: `${geom.pivotX - 10}px`, top: `${geom.pivotY - 10}px` }} />

        {settings.showVu && track.hasTrack && <VuMeter isPlaying={track.isPlaying} trackKey={track.key} />}
      </div>

      {settings.showInfo && track.hasTrack && <TrackInfo track={track} onSeek={controls.seek} />}

      <div className="plattenspieler-footer">
        <span>Made by Jorven · </span>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="plattenspieler-footer-link">
          GitHub
        </a>
      </div>

      {showSettings && <SettingsModal settings={settings} onChange={setSettings} onClose={closeSettings} />}
    </div>
  );
}
