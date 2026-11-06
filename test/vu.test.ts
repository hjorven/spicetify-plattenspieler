import { describe, expect, it } from "vitest";
import { findAnalyser, levelsFromSpectrum, SILENT, simulatedLevels, stepPaused, stepPlaying } from "../src/lib/vu";

describe("vu", () => {
  it("averages spectrum halves", () => {
    const [l, r] = levelsFromSpectrum(new Uint8Array([255, 255, 0, 0]));
    expect(l).toBeCloseTo(1.5);
    expect(r).toBe(0);
    expect(levelsFromSpectrum(new Uint8Array(0))).toEqual([0, 0]);
  });

  it("attacks instantly and decays slowly", () => {
    const v = { ...SILENT };
    stepPlaying(v, 0.8, 2);
    expect(v.l).toBe(0.8);
    expect(v.r).toBe(1);
    stepPlaying(v, 0, 0);
    expect(v.l).toBeCloseTo(0.8 * 0.92);
    expect(v.pl).toBeCloseTo(0.8 * 0.997);
  });

  it("falls to zero when paused", () => {
    const v = { l: 1, r: 1, pl: 1, pr: 1 };
    let frames = 0;
    while (!stepPaused(v)) frames++;
    expect(v).toEqual(SILENT);
    expect(frames).toBeLessThan(2000);
  });

  it("simulates plausible levels", () => {
    const [l, r] = simulatedLevels(1234, () => 0.5);
    expect(l).toBeGreaterThan(0);
    expect(r).toBeGreaterThan(0);
  });

  it("finds an analyser under known names", () => {
    const a = { frequencyBinCount: 32, getByteFrequencyData() {} };
    expect(findAnalyser({ _analyser: a })).toBe(a);
    expect(findAnalyser({ analyser: { frequencyBinCount: 0 } })).toBeNull();
    expect(findAnalyser(undefined)).toBeNull();
  });
});
