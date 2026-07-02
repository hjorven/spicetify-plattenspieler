# Architecture – Plattenspieler (Spicetify Custom App)

## Overview

The app renders a React component (`RecordPlayer`) in a Spicetify custom page at `/plattenspieler`. All logic lives in a single JS file (`index.js`) using the Spicetify-provided React instance – no build tool, no JSX, no bundle.

**UI language:** English
**Install path:** `~/.spicetify/CustomApps/plattenspieler/`
**Source path:** `/var/home/jorven/Downloads/plattenspieler/`

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | App metadata: name, sidebar icons (inactive/active as inline SVG) |
| `index.js` | React component, geometry calculation, Spicetify player binding, VU meter loop |
| `style.css` | All styling (two themes, responsive, animations) |

## `index.js` Details

### Entry Point

Spicetify expects a `render()` function as export. It returns `React.createElement(RecordPlayer)`. The app name comes from `manifest.json`; the page is mounted at `/plattenspieler`.

### Component `RecordPlayer`

A single functional React component with four state slices:

1. **`state` (player data):** `albumArt`, `trackName`, `artistName`, `isPlaying`, `progress` (0–1), `currentTime`, `duration`, `hasTrack`
2. **`geom` (turntable geometry):** dynamic from `ResizeObserver` + `getBoundingClientRect`
3. **`vuData` (VU meter levels):** `l`, `r` (fill), `pl`, `pr` (peak)
4. **`turntableRef`:** ref to `.plattenspieler-turntable` div for geometry measurement

### Geometry (`geom`, `recalc()`)

Recalculated on mount and on every turntable resize via `ResizeObserver`.

**Formulas:**
- Record width: `min(320px, 55vw)`
- Record center (`centerX, centerY`): 36% from left, 50% from top (of turntable)
- Tonearm pivot (`pivotX, pivotY`): `centerX + recordRadius + 12` and `centerY * 0.18 + 20`
- `angleToCenter`: via `Math.atan2` from pivot to record center, in degrees
- **`baseAngle` (outer groove):** `angleToCenter - 35`
- **`maxAngle` (inner groove):** `angleToCenter - 2`

### Tonearm Angle

```
tonearmAngle =
  hasTrack  →  baseAngle + progress × (maxAngle − baseAngle)
  no track  →  REST_ANGLE (80° – arm points down-right)
```

The arm is drawn as an SVG with linear/radial gradients. `transformOrigin` is at the left end (pivot post). The angle is set via CSS `transform: rotate()` with a `cubic-bezier(0.34, 1.2, 0.64, 1)` transition over 0.6s.

### Event Binding (`useEffect #2`)

Three Spicetify player events plus a `requestAnimationFrame` loop:

- **`songchange`** → resets `savedProgress`, calls `update()`
- **`onplaypause`** → toggles `isPlaying` (via `ref` + `setState`), calls `update()` on play
- **`onprogress`** → updates `currentTime` and `progress`, sets `savedProgress`, signals `isPlaying: true`
- **VU loop** → `requestAnimationFrame` polling `Spicetify.Player.analyser` or generating beat-simulated data

Cleanup on unmount: all three `unsub()` functions + `cancelAnimationFrame`.

### VU Meter

Two bars in a box on the right side of the turntable, representing stereo channels.

**Data sources (tried in order):**
1. `Spicetify.Player.analyser` (and variants `_analyser`, `audioAnalyser`)
2. Beat-simulated fallback (when no analyser available)

**Signal chain:**
- RAF loop runs at 60fps, state updates throttled to ~20fps
- Bar fill: instant attack, slow decay (`×0.92` per frame ≈ 130ms to 50%)
- Peak: instant attack, very slow decay (`×0.997` per frame ≈ 3-4s hold)
- VU loop checks `isPlayingRef.current` – no update when paused (bars freeze)

### Vinyl Rotation Speed

```
rotationSpeed =
  duration < 120s  →  0.77s/rotation (≈78 RPM)
  duration < 240s  →  1.33s/rotation (≈45 RPM)
  else             →  1.8s/rotation  (≈33⅓ RPM)
```

### Render Structure

```
div.plattenspieler-container
  div.plattenspieler-theme-selector
    button "Modern"
    button "2000s"
  div.plattenspieler-turntable
    div.plattenspieler-play-indicator
    div.plattenspieler-platter OR div.plattenspieler-idle
    div.plattenspieler-tonearm
    div.plattenspieler-pivot
    div.plattenspieler-vu-container (only when hasTrack)
      div.plattenspieler-vu (L channel)
      div.plattenspieler-vu (R channel)
  div.plattenspieler-info (only when hasTrack)
    div.track-name
    div.artist-name
    div.progress-container
  div.plattenspieler-footer
```

### Progress Bar Click

`onClick` handler calculates click position relative to bar using `e.currentTarget.getBoundingClientRect()` and calls `Spicetify.Player.seek(ratio)`.

### `formatTime(ms)`

Helper function (`mm:ss`), uses `Math.floor` + `padStart`.

## `style.css` Details

### Layout Strategy

- **Container:** Flexbox, centered, themed background
- **Turntable:** `width: min(560px, 90vw)`, `aspect-ratio: 1.3 / 1`
- **Platter:** absolute, 36% / 50%, `transform: translate(-50%, -50%)`, circular
- **Tonearm:** absolute positioning via JS inline styles
- **VU container:** absolute, right side, 55% height with border-box, flex layout
- **Info:** `width: 80%`, `max-width: 480px`, `backdrop-filter: blur(8px)`, sibling of turntable

### Themes

Custom properties on `.plattenspieler-theme-modern` and `.plattenspieler-theme-2000s`:
- `--plinth-radius`, `--info-radius`: border-radius (24px/12px modern, 2px for 2000s)
- `--container-bg`, `--plinth-bg`: background gradients
- `--accent`: fill color (green for modern, blue for 2000s)
- `--text-color`, `--text-muted`, `--text-dim`: text colors
- Various UI element colors

### Vinyl Animation

```
@keyframes plattenspieler-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.plattenspieler-vinyl-spinning {
  animation-name: plattenspieler-spin;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
```

Animation controlled via inline `animationDuration` (RPM-based) and `animationPlayState` (running/paused for play/pause).

### Z-Index Order

| Element | z-index |
|---------|---------|
| VU container | 5 |
| tonearm | 10 |
| pivot | 11 |
| play-indicator | 20 |

### Key CSS Details

- `overflow: hidden` removed – tonearm extends beyond turntable
- No `will-change` on vinyl – avoids GPU crash on faulty drivers (Flatpak/Wayland)
- Progress bar hover: 4px → 6px height
- Progress fill: `transition: width 0.1s linear`
- VU fill: `transform-origin: bottom center`, scaled via `scaleY`

## Data Flow

```
Spicetify.Player events → readPlayer() → setState()
ResizeObserver          → recalc()     → setGeom()
requestAnimationFrame   → vuLoop()     → vuData (ref → setState)
```

No Redux, no Context – pure `useState` + `useEffect` + module-level `savedProgress`.

## Known Issues & Limitations

1. **Spotify Flatpak GPU crash** (`GPU process isn't usable`) – environment issue, not app-related. Workaround: `--disable-gpu` flag.
2. **VU meter analyser** may not be available in all Spicetify versions – falls back to beat simulation.
3. **No fallback image** for tracks without album artwork – vinyl stays black.
4. **Tonearm geometry** may need offset adjustment for extreme viewport sizes.
5. **DevTools** at `http://127.0.0.1:8088` (enabled by `spicetify apply`).

## Development Workflow

1. Edit files in `/var/home/jorven/Downloads/plattenspieler/`
2. `node --check index.js` → syntax check
3. `./update.sh` (copies files, creates backup, runs `spicetify apply`)
4. Reload DevTools page (`127.0.0.1:8088`, Ctrl+R) – no full restart needed
