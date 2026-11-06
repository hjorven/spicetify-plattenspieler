/**
 * Building blocks for the settings window, so every row looks and behaves the same.
 * The Toggle prefers Spotify's own component and falls back to a checkbox, because
 * Spicetify.ReactComponent.* is not available in every version (rendering an undefined
 * component type would crash the page).
 */

type ReactNode = import("react").ReactNode;

export function SettingRow({ label, sublabel, children }: { label: string; sublabel?: string; children?: ReactNode }) {
  return (
    <div className="plattenspieler-setting-row">
      <div>
        <div className="plattenspieler-setting-label">{label}</div>
        {sublabel && <div className="plattenspieler-setting-sublabel">{sublabel}</div>}
      </div>
      {children}
    </div>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange(v: boolean): void; label: string }) {
  const Native = Spicetify.ReactComponent?.Toggle;
  if (Native) return <Native value={value} onSelected={onChange} />;
  return (
    <input
      type="checkbox"
      className="plattenspieler-checkbox"
      aria-label={label}
      checked={value}
      onChange={(e) => onChange(e.currentTarget.checked)}
    />
  );
}

interface OptionGroupProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange(v: T): void;
}

export function OptionGroup<T extends string>({ label, options, value, onChange }: OptionGroupProps<T>) {
  return (
    <div className="plattenspieler-option-group" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`plattenspieler-option${value === o.value ? " plattenspieler-option-active" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
