interface Props {
  length: number;
  angle: number;
  pivotX: number;
  pivotY: number;
}

const HEIGHT = 36;

/** SVG tonearm. Gradient ids are prefixed to avoid collisions with other apps on the page. */
export function Tonearm({ length, angle, pivotX, pivotY }: Props) {
  const mid = HEIGHT / 2;
  const head = length * 0.8;
  return (
    <div
      className="plattenspieler-tonearm"
      style={{
        transform: `rotate(${angle}deg)`,
        transformOrigin: `0 ${mid}px`,
        left: `${pivotX}px`,
        top: `${pivotY - mid}px`,
        width: `${length}px`,
        height: `${HEIGHT}px`,
      }}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${length} ${HEIGHT}`} width={length} height={HEIGHT}>
        <defs>
          <linearGradient id="plattenspieler-armGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c0c0c0" />
            <stop offset="50%" stopColor="#888" />
            <stop offset="100%" stopColor="#666" />
          </linearGradient>
          <linearGradient id="plattenspieler-headGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#999" />
            <stop offset="100%" stopColor="#555" />
          </linearGradient>
          <radialGradient id="plattenspieler-pivotGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#ddd" />
            <stop offset="100%" stopColor="#777" />
          </radialGradient>
          <filter id="plattenspieler-shadow">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>
        <circle cx="0" cy={mid} r="10" fill="url(#plattenspieler-pivotGrad)" stroke="#555" strokeWidth="1" />
        <rect x="8" y={mid - 2.5} width={length * 0.6} height="5" rx="2.5" fill="url(#plattenspieler-armGrad)" />
        <rect
          x={length * 0.6}
          y={mid - 7}
          width={length * 0.2}
          height="14"
          rx="3"
          fill="url(#plattenspieler-headGrad)"
          filter="url(#plattenspieler-shadow)"
        />
        <polygon points={`${head},${mid} ${head + 8},${mid - 2} ${head + 10},${mid + 2}`} fill="#777" />
        <rect
          x="0"
          y={mid - 4}
          width="16"
          height="8"
          rx="3"
          fill="url(#plattenspieler-pivotGrad)"
          stroke="#555"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}
