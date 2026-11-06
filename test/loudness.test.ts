import { describe, expect, it } from "vitest";
import { dbToLevel, findSegment, FLOOR_DB, levelAt, loudnessAt, parseSegments } from "../src/lib/loudness";

const raw = {
  segments: [
    { start: 0.5, duration: 0.5, loudness_start: -30, loudness_max: -10, loudness_max_time: 0.1 },
    { start: 0, duration: 0.5, loudness_start: -60, loudness_max: -20, loudness_max_time: 0.25 },
    { start: 1.0, duration: 0.4, loudness_start: -20, loudness_max: 0, loudness_max_time: 0 },
  ],
};

describe("parseSegments", () => {
  it("reads and sorts segments", () => {
    const s = parseSegments(raw)!;
    expect(s.map((x) => x.start)).toEqual([0, 0.5, 1.0]);
    expect(s[0]).toEqual({ start: 0, duration: 0.5, loudnessStart: -60, loudnessMax: -20, loudnessMaxTime: 0.25 });
  });

  it("returns null for missing or empty data", () => {
    expect(parseSegments(null)).toBeNull();
    expect(parseSegments({})).toBeNull();
    expect(parseSegments({ segments: [] })).toBeNull();
    expect(parseSegments({ segments: [{ start: "x" }] })).toBeNull();
  });

  it("skips broken segments and fills optional fields", () => {
    const s = parseSegments({
      segments: [{ start: 0, duration: 0 }, { start: 1, duration: 1, loudness_max: -5, loudness_max_time: 9 }],
    })!;
    expect(s).toHaveLength(1);
    expect(s[0].loudnessStart).toBe(-5);
    expect(s[0].loudnessMaxTime).toBe(1);
  });
});

describe("findSegment", () => {
  const s = parseSegments(raw)!;
  it("finds the segment containing t", () => {
    expect(findSegment(s, 0)).toBe(0);
    expect(findSegment(s, 0.49)).toBe(0);
    expect(findSegment(s, 0.5)).toBe(1);
    expect(findSegment(s, 1.2)).toBe(2);
  });
  it("returns -1 outside", () => {
    expect(findSegment(s, -1)).toBe(-1);
    expect(findSegment(s, 1.4)).toBe(-1);
  });
});

describe("loudnessAt", () => {
  const s = parseSegments(raw)!;
  it("rises to the maximum", () => {
    expect(loudnessAt(s, 0)).toBeCloseTo(-60);
    expect(loudnessAt(s, 0.125)).toBeCloseTo(-40);
    expect(loudnessAt(s, 0.25)).toBeCloseTo(-20);
  });
  it("falls towards the next segment's start", () => {
    expect(loudnessAt(s, 0.375)).toBeCloseTo(-25);
    expect(loudnessAt(s, 0.5)).toBeCloseTo(-30);
  });
  it("falls to the floor after the last segment and is null outside", () => {
    expect(loudnessAt(s, 1.2)).toBeCloseTo(FLOOR_DB / 2);
    expect(loudnessAt(s, 5)).toBeNull();
  });
});

describe("dbToLevel / levelAt", () => {
  it("maps the dB range to 0..1", () => {
    expect(dbToLevel(0)).toBe(1);
    expect(dbToLevel(FLOOR_DB)).toBe(0);
    expect(dbToLevel(-80)).toBe(0);
    expect(dbToLevel(5)).toBe(1);
    expect(dbToLevel(FLOOR_DB / 2)).toBeCloseTo(0.5);
  });
  it("works on milliseconds", () => {
    const s = parseSegments(raw)!;
    expect(levelAt(s, 250)).toBeCloseTo(dbToLevel(-20));
    expect(levelAt(s, 9000)).toBeNull();
  });
});
