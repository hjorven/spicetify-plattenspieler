import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, LEGACY_THEME_KEY, loadSettings, STORAGE_KEY, sanitizeSettings, saveSettings } from "../src/lib/settings";

function memoryStorage(init: Record<string, string> = {}) {
  const data = new Map(Object.entries(init));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
}

describe("sanitizeSettings", () => {
  it("returns defaults for garbage", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings("x")).toEqual(DEFAULT_SETTINGS);
  });
  it("keeps valid fields and drops invalid ones", () => {
    expect(sanitizeSettings({ theme: "silver", rpm: "99", showVu: "yes", showInfo: false })).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "silver",
      showInfo: false,
    });
  });
});

describe("loadSettings / saveSettings", () => {
  it("round-trips", () => {
    const s = memoryStorage();
    const value = { ...DEFAULT_SETTINGS, theme: "spotify" as const, rpm: "45" as const };
    saveSettings(value, s);
    expect(loadSettings(s)).toEqual(value);
  });
  it("migrates the legacy theme key", () => {
    expect(loadSettings(memoryStorage({ [LEGACY_THEME_KEY]: "2000s" })).theme).toBe("silver");
  });
  it("maps the old 2000s finish to silver", () => {
    expect(sanitizeSettings({ theme: "2000s" }).theme).toBe("silver");
  });
  it("survives corrupt JSON", () => {
    expect(loadSettings(memoryStorage({ [STORAGE_KEY]: "{oops" }))).toEqual(DEFAULT_SETTINGS);
  });
  it("prefers the new key over the legacy one", () => {
    const s = memoryStorage({ [LEGACY_THEME_KEY]: "2000s", [STORAGE_KEY]: JSON.stringify({ theme: "modern" }) });
    expect(loadSettings(s).theme).toBe("modern");
  });
});
