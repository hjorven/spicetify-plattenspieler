const { useEffect, useRef } = Spicetify.React;

/**
 * Runs callback(dt, now) on every animation frame while `active` is true.
 * The callback returns false to stop the loop (e.g. once everything has settled);
 * it restarts automatically when `active` or any of `deps` change.
 * The latest callback is always used, so it may read fresh props without restarting.
 */
export function useFrameLoop(
  callback: (dt: number, now: number) => boolean | void,
  active: boolean,
  deps: readonly unknown[] = [],
): void {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (cb.current(dt, now) === false) return;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);
}
