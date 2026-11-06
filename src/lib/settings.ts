export type Theme = "modern" | "2000s" | "spotify";
export type Rpm = "auto" | "33" | "45" | "78";

export interface Settings {
  theme: Theme;
  rpm: Rpm;
  showVu: boolean;
  showInfo: boolean;
  clickToToggle: boolean;
  /** Realistic spin-up/spin-down of the platter */
  inertia: boolean;
}

export const THEMES: readonly { value: Theme; label: string }[] = [
  { value: "modern", label: "Modern" },
  { value: "2000s", label: "2000s" },
  { value: "spotify", label: "Spotify" },
];

export const RPM_OPTIONS: readonly { value: Rpm; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "33", label: "33⅓" },
  { value: "45", label: "45" },
  { value: "78", label: "78" },
];

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  theme: "modern",
  rpm: "auto",
  showVu: true,
  showInfo: true,
  clickToToggle: true,
  inertia: true,
});

export const STORAGE_KEY = "plattenspieler:settings";
export const LEGACY_THEME_KEY = "plattenspieler-theme";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function isTheme(v: unknown): v is Theme {
  return THEMES.some((t) => t.value === v);
}

function isRpm(v: unknown): v is Rpm {
  return RPM_OPTIONS.some((r) => r.value === v);
}

/** Validates arbitrary (possibly corrupt) input field by field and fills gaps with defaults. */
export function sanitizeSettings(input: unknown): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS };
  if (!input || typeof input !== "object") return s;
  const o = input as Record<string, unknown>;
  if (isTheme(o.theme)) s.theme = o.theme;
  if (isRpm(o.rpm)) s.rpm = o.rpm;
  if (typeof o.showVu === "boolean") s.showVu = o.showVu;
  if (typeof o.showInfo === "boolean") s.showInfo = o.showInfo;
  if (typeof o.clickToToggle === "boolean") s.clickToToggle = o.clickToToggle;
  if (typeof o.inertia === "boolean") s.inertia = o.inertia;
  return s;
}

export function loadSettings(storage: StorageLike = localStorage): Settings {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) return sanitizeSettings(JSON.parse(raw));
    // Migrate the theme from versions before the settings window.
    return sanitizeSettings({ theme: storage.getItem(LEGACY_THEME_KEY) });
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings, storage: StorageLike = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or blocked: settings simply are not persisted.
  }
}
