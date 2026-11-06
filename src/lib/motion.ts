/**
 * Pure animation math for the turntable. Everything here is frame-rate independent
 * (driven by dt in seconds) and unit-tested, the hooks only apply the results to the DOM.
 */
import { clamp01 } from "./format";

/** Longest frame step we integrate; protects against huge jumps after a hidden tab or a breakpoint. */
export const MAX_DT = 0.05;

/** Seconds a real platter needs to reach full speed from standstill. */
export const SPIN_UP_SECONDS = 0.9;
/** Seconds from full speed to standstill (belt drive, slow brake). */
export const SPIN_DOWN_SECONDS = 1.6;

export function clampDt(dt: number): number {
  if (!Number.isFinite(dt) || dt <= 0) return 0;
  return Math.min(dt, MAX_DT);
}

/**
 * Moves the platter speed factor (0 = stopped, 1 = full speed) towards its target with
 * constant acceleration. Without inertia it snaps to the target.
 */
export function stepSpinSpeed(current: number, target: number, dt: number, inertia = true): number {
  if (!inertia) return target;
  const rate = target > current ? 1 / SPIN_UP_SECONDS : 1 / SPIN_DOWN_SECONDS;
  const delta = rate * clampDt(dt);
  if (Math.abs(target - current) <= delta) return target;
  return current + Math.sign(target - current) * delta;
}

/** Advances the record angle in degrees, wrapped to [0, 360). */
export function advanceAngle(angle: number, secondsPerRevolution: number, speed: number, dt: number): number {
  if (secondsPerRevolution <= 0) return angle;
  const next = angle + (360 / secondsPerRevolution) * speed * clampDt(dt);
  return ((next % 360) + 360) % 360;
}

export interface ProgressAnchor {
  /** progress 0–1 reported by Spotify */
  progress: number;
  /** performance.now() when it was reported */
  at: number;
}

/**
 * Spotify reports the position only every few hundred ms. Between reports we extrapolate
 * from the last known position, so the tonearm and progress bar move continuously.
 */
export function estimateProgress(anchor: ProgressAnchor, now: number, durationMs: number, playing: boolean): number {
  if (!playing || durationMs <= 0) return anchor.progress;
  return clamp01(anchor.progress + Math.max(0, now - anchor.at) / durationMs);
}

export interface Spring {
  x: number;
  v: number;
}

/**
 * Critically damped spring towards target (no overshoot). stiffness controls how fast it
 * follows: ~40 glides like a tonearm, ~200 is nearly instant.
 */
export function stepSpring(s: Spring, target: number, dt: number, stiffness: number): Spring {
  const d = clampDt(dt);
  if (d === 0) return s;
  const damping = 2 * Math.sqrt(stiffness);
  // Two half steps keep the semi-implicit Euler stable at low frame rates.
  for (let i = 0; i < 2; i++) {
    const h = d / 2;
    const a = stiffness * (target - s.x) - damping * s.v;
    s.v += a * h;
    s.x += s.v * h;
  }
  if (Math.abs(target - s.x) < 1e-4 && Math.abs(s.v) < 1e-3) {
    s.x = target;
    s.v = 0;
  }
  return s;
}

export function isSettled(s: Spring, target: number): boolean {
  return s.x === target && s.v === 0;
}
