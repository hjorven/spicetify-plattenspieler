import { RPM_OPTIONS, type Rpm } from "../lib/settings";
import { ICON_GEAR, Icon } from "./Icon";
import { OptionGroup } from "./settings/controls";

interface Props {
  status: "playing" | "paused" | "idle";
  rpm: Rpm;
  onRpmChange(rpm: Rpm): void;
  onOpenSettings(): void;
}

const STATUS_LABEL = { playing: "Playing", paused: "Paused", idle: "Idle" } as const;

/** Page header: title + status pill on the left, speed pills and settings on the right. */
export function Header({ status, rpm, onRpmChange, onOpenSettings }: Props) {
  return (
    <header className="plattenspieler-header">
      <div className="plattenspieler-header-left">
        <h1 className="plattenspieler-title">Plattenspieler</h1>
        <span className="plattenspieler-model">Direct Drive Turntable System</span>
        <span className={`plattenspieler-status plattenspieler-status-${status}`} aria-live="polite">
          <span className="plattenspieler-status-dot" />
          {STATUS_LABEL[status]}
        </span>
      </div>
      <div className="plattenspieler-header-right">
        <OptionGroup label="Speed" options={RPM_OPTIONS} value={rpm} onChange={onRpmChange} variant="tabs" />
        <button
          type="button"
          className="plattenspieler-icon-btn"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
        >
          <Icon d={ICON_GEAR} />
        </button>
      </div>
    </header>
  );
}
