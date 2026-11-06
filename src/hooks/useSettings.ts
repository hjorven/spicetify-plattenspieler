import { loadSettings, type Settings, saveSettings } from "../lib/settings";

const { useState, useCallback } = Spicetify.React;

/** Settings state that is persisted to localStorage on every change. */
export function useSettings(): [Settings, (next: Settings) => void] {
  const [settings, setState] = useState<Settings>(loadSettings);
  const update = useCallback((next: Settings) => {
    saveSettings(next);
    setState(next);
  }, []);
  return [settings, update];
}
