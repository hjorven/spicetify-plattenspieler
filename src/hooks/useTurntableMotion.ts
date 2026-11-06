import { formatTime } from "../lib/format";
import { type Geometry, tonearmAngle } from "../lib/geometry";
import { advanceAngle, estimateProgress, isSettled, type ProgressAnchor, stepSpinSpeed, stepSpring } from "../lib/motion";
import type { TrackState } from "../lib/player";
import { useFrameLoop } from "./useFrameLoop";

const { useEffect, useRef } = Spicetify.React;

/** Tonearm follows its target like a damped arm (no overshoot). */
const ARM_STIFFNESS = 45;
/** Lift of the arm while paused (cue lever). */
const LIFT_STIFFNESS = 120;

export interface MotionRefs {
  vinyl: { current: HTMLDivElement | null };
  arm: { current: HTMLDivElement | null };
  progressFill: { current: HTMLDivElement | null };
  elapsed: { current: HTMLElement | null };
  remaining: { current: HTMLElement | null };
}

interface Options {
  track: TrackState;
  geom: Geometry;
  secondsPerRevolution: number;
  inertia: boolean;
  reducedMotion: boolean;
}

/**
 * One animation loop for the whole turntable. It writes transforms directly to the DOM
 * through refs, so React only re-renders when the track or settings change, not 60x per second.
 *
 * - Platter: integrates its own angle; speed eases in/out (spin-up / spin-down) instead of
 *   restarting a CSS animation, so pausing, resuming and RPM changes never make it jump.
 * - Tonearm: target angle comes from the extrapolated progress; a critically damped spring
 *   glides it there. On pause the arm lifts slightly (cue lever).
 * - Progress bar and time labels use the same extrapolated progress.
 */
export function useTurntableMotion({ track, geom, secondsPerRevolution, inertia, reducedMotion }: Options): MotionRefs {
  const refs: MotionRefs = {
    vinyl: useRef<HTMLDivElement>(null),
    arm: useRef<HTMLDivElement>(null),
    progressFill: useRef<HTMLDivElement>(null),
    elapsed: useRef<HTMLElement>(null),
    remaining: useRef<HTMLElement>(null),
  };

  const angle = useRef(0);
  const speed = useRef(0);
  const arm = useRef({ x: tonearmAngle(geom, false, 0), v: 0 });
  const lift = useRef({ x: 0, v: 0 });
  const anchor = useRef<ProgressAnchor>({ progress: 0, at: performance.now() });
  const lastSecond = useRef(-1);

  // New position reported by Spotify (or play state changed): re-anchor the extrapolation.
  useEffect(() => {
    anchor.current = { progress: track.progress, at: performance.now() };
  }, [track.progress, track.isPlaying, track.key]);

  const playing = track.hasTrack && track.isPlaying;

  useFrameLoop(
    (dt, now) => {
      const progress = track.hasTrack ? estimateProgress(anchor.current, now, track.durationMs, playing) : 0;

      // Platter
      const spinning = playing && !reducedMotion;
      speed.current = stepSpinSpeed(speed.current, spinning ? 1 : 0, dt, inertia && !reducedMotion);
      angle.current = advanceAngle(angle.current, secondsPerRevolution, speed.current, dt);
      if (refs.vinyl.current) refs.vinyl.current.style.transform = `rotate(${angle.current.toFixed(2)}deg)`;

      // Tonearm
      const armTarget = tonearmAngle(geom, track.hasTrack, progress);
      const liftTarget = track.hasTrack && !track.isPlaying ? 1 : 0;
      if (reducedMotion) {
        arm.current = { x: armTarget, v: 0 };
        lift.current = { x: liftTarget, v: 0 };
      } else {
        stepSpring(arm.current, armTarget, dt, ARM_STIFFNESS);
        stepSpring(lift.current, liftTarget, dt, LIFT_STIFFNESS);
      }
      const el = refs.arm.current;
      if (el) {
        const l = lift.current.x;
        el.style.transform = `rotate(${arm.current.x.toFixed(3)}deg) translateY(${(-4 * l).toFixed(2)}px) scale(${(1 + 0.025 * l).toFixed(4)})`;
        el.style.setProperty("--plattenspieler-lift", l.toFixed(3));
      }

      // Progress bar and time labels
      if (refs.progressFill.current) refs.progressFill.current.style.transform = `scaleX(${progress.toFixed(4)})`;
      const elapsedMs = progress * track.durationMs;
      const second = Math.floor(elapsedMs / 1000);
      if (second !== lastSecond.current) {
        lastSecond.current = second;
        if (refs.elapsed.current) refs.elapsed.current.textContent = formatTime(elapsedMs);
        if (refs.remaining.current)
          refs.remaining.current.textContent = `-${formatTime(Math.max(0, track.durationMs - elapsedMs))}`;
      }

      // Keep running while anything still moves; stop once fully settled to save CPU.
      const moving = playing || speed.current > 0;
      return moving || !isSettled(arm.current, armTarget) || !isSettled(lift.current, liftTarget);
    },
    true,
    [playing, track.key, track.progress, track.hasTrack, geom, secondsPerRevolution, inertia, reducedMotion],
  );

  return refs;
}
