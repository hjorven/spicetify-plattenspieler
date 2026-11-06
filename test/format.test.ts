import { describe, expect, it } from "vitest";
import { clamp01, formatTime } from "../src/lib/format";

describe("formatTime", () => {
  it("formats m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5_000)).toBe("0:05");
    expect(formatTime(65_999)).toBe("1:05");
    expect(formatTime(3_600_000)).toBe("60:00");
  });
  it("handles invalid input", () => {
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(-1)).toBe("0:00");
  });
});

describe("clamp01", () => {
  it("clamps", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0.3)).toBe(0.3);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });
});
