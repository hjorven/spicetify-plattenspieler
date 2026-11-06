import { computeGeometry, DEFAULT_GEOMETRY, type Geometry } from "../lib/geometry";

const { useState, useEffect } = Spicetify.React;

/** Measures the turntable element and recomputes the tonearm geometry on resize (throttled via RAF). */
export function useTurntableGeometry(ref: { current: HTMLElement | null }): Geometry {
  const [geom, setGeom] = useState<Geometry>(DEFAULT_GEOMETRY);

  useEffect(() => {
    let rafId = 0;
    const recalc = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) setGeom(computeGeometry(rect.width, rect.height));
      });
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("resize", recalc);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, [ref]);

  return geom;
}
