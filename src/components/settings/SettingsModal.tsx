import { DEFAULT_SETTINGS, RPM_OPTIONS, type Settings, skinOf, THEMES } from "../../lib/settings";
import { ICON_CLOSE, Icon } from "../Icon";
import { OptionGroup, SettingRow, Toggle } from "./controls";

const { useState, useEffect, useRef } = Spicetify.React;

export const REPO_URL = "https://github.com/hjorven/spicetify-plattenspieler";

type Tab = "display" | "turntable" | "about";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "display", label: "Display" },
  { id: "turntable", label: "Turntable" },
  { id: "about", label: "About" },
];

interface Props {
  settings: Settings;
  onChange(next: Settings): void;
  onClose(): void;
}

const FOCUSABLE = 'button, [href], input, [tabindex]:not([tabindex="-1"])';

/**
 * Settings window, rendered as a portal into document.body (pattern from listening-stats).
 * Closes on Esc, the X button or a click on the backdrop; keeps keyboard focus inside
 * and gives it back to the element that opened it.
 */
export function SettingsModal({ settings, onChange, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("display");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      previous?.focus?.();
    };
  }, [onClose]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value });

  let body: import("react").ReactNode;
  if (tab === "display") {
    body = (
      <>
        <SettingRow
          label="Finish"
          sublabel={'"Silver" turns the whole page into brushed-aluminum hi-fi gear, "Spotify" uses your Spicetify colors.'}
        >
          <OptionGroup label="Finish" options={THEMES} value={settings.theme} onChange={(v) => set("theme", v)} />
        </SettingRow>
        <SettingRow label="Show stat tiles" sublabel="Speed, length, revolutions and finish above the track card.">
          <Toggle label="Show stat tiles" value={settings.showInfo} onChange={(v) => set("showInfo", v)} />
        </SettingRow>
        <SettingRow label="Show VU meter" sublabel="Stereo level meter card.">
          <Toggle label="Show VU meter" value={settings.showVu} onChange={(v) => set("showVu", v)} />
        </SettingRow>
      </>
    );
  } else if (tab === "turntable") {
    body = (
      <>
        <SettingRow label="Speed (RPM)" sublabel="Auto: 78 below 2 min, 45 below 4 min, otherwise 33⅓.">
          <OptionGroup label="Speed" options={RPM_OPTIONS} value={settings.rpm} onChange={(v) => set("rpm", v)} />
        </SettingRow>
        <SettingRow label="Platter inertia" sublabel="The record spins up and slows down like a real belt-drive turntable.">
          <Toggle label="Platter inertia" value={settings.inertia} onChange={(v) => set("inertia", v)} />
        </SettingRow>
        <SettingRow label="Click record to play/pause" sublabel="Clicking the vinyl toggles playback.">
          <Toggle
            label="Click record to play/pause"
            value={settings.clickToToggle}
            onChange={(v) => set("clickToToggle", v)}
          />
        </SettingRow>
        <div className="plattenspieler-setting-actions">
          <button type="button" className="plattenspieler-btn" onClick={() => onChange({ ...DEFAULT_SETTINGS })}>
            Reset to defaults
          </button>
        </div>
      </>
    );
  } else {
    body = (
      <div className="plattenspieler-about">
        <p>
          <strong>Plattenspieler</strong> – version {__VERSION__}
        </p>
        <p>Shows the current album art as a spinning vinyl record with tonearm and VU meter.</p>
        <p>
          Keyboard: Space/Enter on the focused record = play/pause, arrow keys on the progress bar = seek 5 s, Esc =
          close this window.
        </p>
        <p>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="plattenspieler-link">
            Source code on GitHub
          </a>
        </p>
      </div>
    );
  }

  const content = (
    <div
      className={`plattenspieler-overlay plattenspieler-skin-${skinOf(settings.theme)}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="plattenspieler-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plattenspieler-modal-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="plattenspieler-modal-header">
          <h2 id="plattenspieler-modal-title" className="plattenspieler-modal-title">
            Settings
          </h2>
          <button type="button" className="plattenspieler-icon-btn" onClick={onClose} aria-label="Close settings">
            <Icon d={ICON_CLOSE} />
          </button>
        </div>
        <div className="plattenspieler-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`plattenspieler-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="plattenspieler-tabpanel"
              className={`plattenspieler-tab${tab === t.id ? " plattenspieler-tab-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div
          id="plattenspieler-tabpanel"
          className="plattenspieler-modal-body"
          role="tabpanel"
          aria-labelledby={`plattenspieler-tab-${tab}`}
        >
          {body}
        </div>
      </div>
    </div>
  );

  const createPortal = Spicetify.ReactDOM?.createPortal;
  return createPortal ? createPortal(content, document.body) : content;
}
