import { describe, expect, it } from "vitest";
import { armLength, computeGeometry, REST_ANGLE, resolveRpm, SECONDS_PER_REVOLUTION, tonearmAngle } from "../src/lib/geometry";

describe("resolveRpm", () => {
  it("uses fixed values as-is", () => {
    expect(resolveRpm("45", 10_000)).toBe("45");
  });
  it("picks speed by song length in auto mode", () => {
    expect(resolveRpm("auto", 90_000)).toBe("78");
    expect(resolveRpm("auto", 180_000)).toBe("45");
    expect(resolveRpm("auto", 300_000)).toBe("33");
    expect(resolveRpm("auto", 0)).toBe("33");
  });
  it("has realistic revolution times", () => {
    expect(SECONDS_PER_REVOLUTION["33"]).toBeCloseTo(1.8, 2);
    expect(SECONDS_PER_REVOLUTION["45"]).toBeCloseTo(1.333, 2);
    expect(SECONDS_PER_REVOLUTION["78"]).toBeCloseTo(0.769, 2);
  });
});

describe("geometry", () => {
  const g = computeGeometry(560, 430, 1200);
  it("places the pivot right of the record", () => {
    expect(g.recordRadius).toBe(160);
    expect(g.pivotX).toBeCloseTo(560 * 0.36 + 160 + 12);
    expect(g.maxAngle).toBeGreaterThan(g.baseAngle);
  });
  it("moves the arm from outer to inner groove", () => {
    expect(tonearmAngle(g, true, 0)).toBeCloseTo(g.baseAngle);
    expect(tonearmAngle(g, true, 1)).toBeCloseTo(g.maxAngle);
    expect(tonearmAngle(g, false, 0.5)).toBe(REST_ANGLE);
  });
  it("keeps a minimum arm length", () => {
    expect(armLength({ ...g, recordRadius: 10 })).toBe(200);
  });
});
