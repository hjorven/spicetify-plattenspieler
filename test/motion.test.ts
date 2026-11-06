import { describe, expect, it } from "vitest";
import {
  advanceAngle,
  clampDt,
  estimateProgress,
  isSettled,
  MAX_DT,
  SPIN_DOWN_SECONDS,
  SPIN_UP_SECONDS,
  stepSpinSpeed,
  stepSpring,
} from "../src/lib/motion";

function run(frames: number, fn: () => void) {
  for (let i = 0; i < frames; i++) fn();
}

describe("clampDt", () => {
  it("limits large and invalid steps", () => {
    expect(clampDt(1)).toBe(MAX_DT);
    expect(clampDt(-1)).toBe(0);
    expect(clampDt(Number.NaN)).toBe(0);
  });
});

describe("stepSpinSpeed", () => {
  it("spins up in about SPIN_UP_SECONDS", () => {
    let s = 0;
    const frames = Math.ceil(SPIN_UP_SECONDS * 60);
    run(frames - 2, () => (s = stepSpinSpeed(s, 1, 1 / 60)));
    expect(s).toBeLessThan(1);
    run(3, () => (s = stepSpinSpeed(s, 1, 1 / 60)));
    expect(s).toBe(1);
  });
  it("spins down slower than up", () => {
    expect(SPIN_DOWN_SECONDS).toBeGreaterThan(SPIN_UP_SECONDS);
    expect(stepSpinSpeed(1, 0, 0.1)).toBeCloseTo(1 - 0.05 / SPIN_DOWN_SECONDS);
  });
  it("snaps without inertia", () => {
    expect(stepSpinSpeed(0, 1, 0.001, false)).toBe(1);
  });
});

describe("advanceAngle", () => {
  it("turns one revolution per period at full speed", () => {
    let a = 0;
    run(90, () => (a = advanceAngle(a, 1.8, 1, 0.02)));
    expect(a).toBeCloseTo(0, 6);
  });
  it("does not move when stopped", () => {
    expect(advanceAngle(42, 1.8, 0, 0.02)).toBe(42);
  });
});

describe("estimateProgress", () => {
  const anchor = { progress: 0.5, at: 1000 };
  it("extrapolates while playing", () => {
    expect(estimateProgress(anchor, 3000, 100_000, true)).toBeCloseTo(0.52);
  });
  it("holds while paused and clamps at the end", () => {
    expect(estimateProgress(anchor, 3000, 100_000, false)).toBe(0.5);
    expect(estimateProgress(anchor, 1e9, 100_000, true)).toBe(1);
  });
});

describe("stepSpring", () => {
  it("reaches the target without overshoot and settles", () => {
    const s = { x: 0, v: 0 };
    let max = 0;
    run(600, () => {
      stepSpring(s, 10, 1 / 60, 40);
      max = Math.max(max, s.x);
    });
    expect(max).toBeLessThanOrEqual(10.0001);
    expect(isSettled(s, 10)).toBe(true);
  });
  it("is stable at low frame rates", () => {
    const s = { x: 0, v: 0 };
    run(200, () => stepSpring(s, 1, 0.2, 200));
    expect(s.x).toBeCloseTo(1, 3);
  });
});
