type ReactNode = import("react").ReactNode;

interface CardProps {
  /** Small uppercase label before the title, e.g. "NOW PLAYING" */
  eyebrow: string;
  title: string;
  /** Optional content on the right side of the header */
  aside?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** Section card: small uppercase label + title, then content (layout pattern from listening-stats). */
export function Card({ eyebrow, title, aside, className, children }: CardProps) {
  return (
    <section className={`plattenspieler-card${className ? ` ${className}` : ""}`}>
      <header className="plattenspieler-card-header">
        <h2 className="plattenspieler-card-title">
          <span className="plattenspieler-eyebrow">{eyebrow}</span>
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  valueRef?: { current: HTMLElement | null };
}

/** Key figure tile: uppercase label, big value, small hint. */
export function StatTile({ label, value, unit, hint, valueRef }: StatTileProps) {
  return (
    <div className="plattenspieler-tile">
      <div className="plattenspieler-tile-label">{label}</div>
      <div className="plattenspieler-tile-value">
        <span ref={valueRef as import("react").Ref<HTMLSpanElement>}>{value}</span>
        {unit && <span className="plattenspieler-tile-unit">{unit}</span>}
      </div>
      {hint && <div className="plattenspieler-tile-hint">{hint}</div>}
    </div>
  );
}
