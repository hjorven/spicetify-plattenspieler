# Architecture – Plattenspieler (Spicetify Custom App)

## Overview

The app renders a React component (`RecordPlayer`) in a Spicetify custom page at `/plattenspieler`. All logic lives in a single JS file (`index.js`) using the Spicetify-provided React instance – no build tool, no JSX, no bundle.

**UI language:** English
**Install path:** `~/.spicetify/CustomApps/plattenspieler/`

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | App metadata: name, sidebar icons (inactive/active as inline SVG) |
| `index.js` | React component, geometry calculation, Spicetify player binding, VU meter loop |
| `style.css` | All styling (two themes, responsive, animations) |

## `index.js` Details

### Entry Point

Spicetify expects a `render()` function as export. It returns `React.createElement(RecordPlayer)`. The app name comes from `manifest.json`; the page is mounted at `/plattenspieler`.

### Components

| Component | Purpose |
|-----------|---------|
| `ErrorBoundary` | Catches render errors and shows the error with a retry button instead of Spotify's generic error page |
| `RecordPlayer` | Main component: player state, geometry, layout |
| `Tonearm` | SVG tonearm (gradient ids are prefixed with `plattenspieler-` to avoid collisions) |
| `VuMeter` | Stereo VU meter with its own state and RAF loop, so only the meter re-renders ~20x/s |
| `SettingsModal` | Settings window rendered via `Spicetify.ReactDOM.createPortal` into `document.body` |
| `Toggle` | Uses `Spicetify.ReactComponent.Toggle` when available, otherwise a plain checkbox |

### State in `RecordPlayer`

1. **`track`:** `albumArt`, `trackName`, `artistName`, `albumName`, `isPlaying`, `progress` (0–1), `duration`, `hasTrack`, `trackKey`
2. **`geom` (turntable geometry):** dynamic from `ResizeObserver` + `getBoundingClientRect`
3. **`settings`:** persisted as JSON in `localStorage` under `plattenspieler:settings`
4. **`showSettings`**, **`artFailed`** (cover failed to load → fallback label)

### Settings

| Key | Values | Default |
|-----|--------|---------|
| `theme` | `modern`, `2000s`, `spotify` | `modern` |
| `rpm` | `auto`, `33`, `45`, `78` | `auto` |
| `showVu` | boolean | `true` |
| `showInfo` | boolean | `true` |
| `clickToToggle` | boolean | `true` |

The old key `plattenspieler-theme` is migrated automatically. Unknown or corrupt values fall back to the defaults.

### Reading the player (`readPlayer()`)

Prefers the stable getters `Spicetify.Player.getDuration()`, `getProgress()` and `isPlaying()` and falls back to
`Spicetify.Player.data` when a getter is missing. Cover URLs are taken from `item.metadata.image_xlarge_url` or
`item.album.images[0].url`; `spotify:image:<id>` URIs are converted to `https://i.scdn.co/image/<id>`.

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

### Event Binding

- **`songchange`** → resets the cover error flag, calls `update()`
- **`onplaypause`** → sets `isPlaying` from `Spicetify.Player.isPlaying()`
- **`onprogress`** → updates `progress` (does not touch `isPlaying`, which previously caused a paused track to show as playing)
- one delayed `update()` after 1 s in case the player was not ready when the page opened

Cleanup on unmount: `removeEventListener` for all three events.

### VU Meter

Two bars in a box on the right side of the turntable, representing stereo channels.

**Data sources (tried in order):**
1. `Spicetify.Player.analyser` (and variants `_analyser`, `audioAnalyser`)
2. Beat-simulated fallback (when no analyser available)

**Signal chain:**
- RAF loop runs at 60fps, state updates throttled to ~20fps
- Bar fill: instant attack, slow decay (`×0.92` per frame ≈ 130ms to 50%)
- Peak: instant attack, very slow decay (`×0.997` per frame ≈ 3-4s hold)
- When paused, bars and peaks decay to 0 and the loop stops

### Vinyl Rotation Speed

With `rpm: auto`:

```
rotationSpeed =
  duration < 120s  →  0.769s/rotation (≈78 RPM)
  duration < 240s  →  1.333s/rotation (≈45 RPM)
  else             →  1.8s/rotation   (≈33⅓ RPM)
```

A fixed value from the settings overrides this.

### Render Structure

```
ErrorBoundary
  div.plattenspieler-container.plattenspieler-theme-<theme>
    div.plattenspieler-toolbar
      button (gear) → opens SettingsModal
    div.plattenspieler-turntable
      div.plattenspieler-play-indicator
      div.plattenspieler-platter (role=button when click-to-play is on) OR div.plattenspieler-idle
      Tonearm
      div.plattenspieler-pivot
      VuMeter (when hasTrack and showVu)
    div.plattenspieler-info (when hasTrack and showInfo)
      div.track-name, div.artist-name
      div.progress-container (progress bar has role=slider)
    div.plattenspieler-footer
    SettingsModal (portal into document.body)
      div.plattenspieler-overlay > div.plattenspieler-modal[role=dialog]
        header, tabs (Display / Turntable / About), tab panel
```

### Progress Bar Click

`onClick` calculates the click position relative to the bar and calls `Spicetify.Player.seek(ms)`.
Keyboard: arrow keys seek ±5 s, Home/End jump to start/end.

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

Custom properties on `.plattenspieler-theme-modern`, `.plattenspieler-theme-2000s` and `.plattenspieler-theme-spotify`
(the latter maps to `--spice-*` variables with fallbacks). The settings overlay gets the same theme class, because
it is rendered outside the container:
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
requestAnimationFrame   → VuMeter loop → local state of VuMeter
SettingsModal           → setSettings() → localStorage + re-render
```

No Redux, no Context, no module-level mutable state – only `useState`, `useRef` and `useEffect`.

## Known Issues & Limitations

1. **Spotify Flatpak GPU crash** (`GPU process isn't usable`) – environment issue, not app-related. Workaround: `--disable-gpu` flag.
2. **VU meter analyser** may not be available in all Spicetify versions – falls back to beat simulation.
3. Tracks without (loadable) artwork show a plain vinyl with a colored label instead.
4. **Tonearm geometry** may need offset adjustment for extreme viewport sizes.
5. **DevTools** at `http://127.0.0.1:8088` (enabled by `spicetify apply`).

## Development Workflow

1. Edit files in your clone of the repository
2. `node --check index.js` → syntax check (also runs in CI)
3. `./update.sh` (copies files from the script's directory, creates a backup, runs `spicetify apply`)
4. Reload DevTools page (`127.0.0.1:8088`, Ctrl+R) – no full restart needed
