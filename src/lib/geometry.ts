import type { Rpm } from "./settings";

/** Tonearm angle when no track is loaded (arm points down-right). */
export const REST_ANGLE = 80;

export interface Geometry {
  pivotX: number;
  pivotY: number;
  recordRadius: number;
  /** Arm angle at the outer groove (song start). */
  baseAngle: number;
  /** Arm angle at the inner groove (song end). */
  maxAngle: number;
}

export const DEFAULT_GEOMETRY: Geometry = { pivotX: 280, pivotY: 90, recordRadius: 140, baseAngle: 120, maxAngle: 145 };

/** Record diameter relative to the turntable width. Must match .plattenspieler-platter in style.css. */
export const RECORD_WIDTH_RATIO = 0.57;

/**
 * Computes the tonearm pivot and its angle range from the turntable size.
 * Must stay in sync with the CSS: record centered at 36% / 50%, width 57% of the turntable.
 */
export function computeGeometry(width: number, height: number): Geometry {
  const recordRadius = (width * RECORD_WIDTH_RATIO) / 2;
  const centerX = width * 0.36;
  const centerY = height * 0.5;
  const pivotX = centerX + recordRadius + 12;
  const pivotY = height * 0.18 + 20;
  const angleToCenter = Math.atan2(centerY - pivotY, centerX - pivotX) * (180 / Math.PI);
  return { pivotX, pivotY, recordRadius, baseAngle: angleToCenter - 35, maxAngle: angleToCenter - 2 };
}

export function tonearmAngle(geom: Geometry, hasTrack: boolean, progress: number): number {
  if (!hasTrack) return REST_ANGLE;
  return geom.baseAngle + progress * (geom.maxAngle - geom.baseAngle);
}

export function armLength(geom: Geometry): number {
  return Math.max(120, geom.recordRadius * 1.7 + 40);
}

/** Seconds per revolution for each speed. */
export const SECONDS_PER_REVOLUTION: Record<Exclude<Rpm, "auto">, number> = {
  "33": 60 / (100 / 3),
  "45": 60 / 45,
  "78": 60 / 78,
};

/** Auto: short songs spin faster (78 below 2 min, 45 below 4 min, otherwise 33⅓). */
export function resolveRpm(setting: Rpm, durationMs: number): Exclude<Rpm, "auto"> {
  if (setting !== "auto") return setting;
  if (durationMs > 0 && durationMs < 120_000) return "78";
  if (durationMs > 0 && durationMs < 240_000) return "45";
  return "33";
}
