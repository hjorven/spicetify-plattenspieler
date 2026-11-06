# Architecture – Plattenspieler (Spicetify Custom App)

## Overview

The app renders `RecordPlayer` on the Spicetify custom page `/plattenspieler`. The source is TypeScript + JSX in
`src/`, bundled by esbuild (`build.mjs`) into `dist/index.js`. React is **not** bundled: JSX compiles to
`Spicetify.React.createElement`, and hooks are taken from `Spicetify.React`. The bundle is an IIFE whose footer
exposes the global `render()` that Spicetify calls.

**UI language:** English

## Layers

| Layer | Folder | Rule |
|-------|--------|------|
| Pure logic | `src/lib/` | No React, no DOM globals except optional `localStorage` default. Fully unit-tested. |
| Hooks | `src/hooks/` | Bridge between Spicetify/DOM events and React state. |
| Components | `src/components/` | Rendering only; get data from hooks and props. |

### `src/lib/`

| Module | Content |
|--------|---------|
| `format.ts` | `formatTime(ms)` → `m:ss`, `clamp01()` |
| `settings.ts` | `Settings` type, options, defaults, `sanitizeSettings`, `loadSettings`/`saveSettings` incl. migration of `plattenspieler-theme` |
| `geometry.ts` | `computeGeometry()` (tonearm pivot and angle range), `tonearmAngle()`, `armLength()`, `resolveRpm()`, `SECONDS_PER_REVOLUTION` |
| `player.ts` | `readPlayer()` → `TrackState`, `normalizeImageUrl()` (`spotify:image:<id>` → `https://i.scdn.co/image/<id>`) |
| `vu.ts` | VU math: `levelsFromSpectrum`, `simulatedLevels`, `stepPlaying`, `stepPaused`, `findAnalyser` |

### `src/hooks/`

| Hook | Purpose |
|------|---------|
| `usePlayer()` | Subscribes to `songchange`, `onplaypause`, `onprogress`; returns `[track, { togglePlay, seek }]` |
| `useSettings()` | Settings state, persisted on every change |
| `useTurntableGeometry(ref)` | `ResizeObserver` + window resize, throttled via `requestAnimationFrame` |
| `useVuLevels(isPlaying, trackKey)` | RAF loop for the VU meter, state throttled to ~20 fps, stops when paused bars reach 0 |

### `src/components/`

| Component | Purpose |
|-----------|---------|
| `ErrorBoundary` | Shows error, version and a retry button instead of Spotify's generic error page |
| `RecordPlayer` | Page layout, wires hooks to children |
| `Record` / `IdleRecord` | Spinning vinyl with cover; fallback label when the cover is missing or fails to load; acts as play/pause button |
| `Tonearm` | SVG tonearm, gradient ids prefixed with `plattenspieler-` |
| `VuMeter` | Stereo bars with peak hold; own state so only the meter re-renders ~20x/s |
| `TrackInfo` | Title, artist, progress bar (`role=slider`, click + keyboard seek) |
| `settings/SettingsModal` | Settings window via `createPortal` into `document.body`; tabs Display / Turntable / About; Esc, X, backdrop click close it; focus trap and focus restore |
| `settings/controls` | `SettingRow`, `OptionGroup`, `Toggle` (native `Spicetify.ReactComponent.Toggle` or checkbox fallback) |

## Reading the player

`readPlayer()` prefers the stable getters `Spicetify.Player.getDuration()`, `getProgress()` and `isPlaying()` and
falls back to `Spicetify.Player.data` when a getter is missing or throws. The cover comes from
`item.metadata.image_xlarge_url`, `image_large_url`, `item.album.images[0].url` or `image_url`.

Events:

- **`songchange`** → full re-read
- **`onplaypause`** → `isPlaying` from `Player.isPlaying()` (full re-read if unavailable)
- **`onprogress`** → only `progress`/`durationMs`. It deliberately does not set `isPlaying`, because progress events also fire while paused (e.g. after seeking). If no track is known yet, it triggers a full re-read.
- one delayed re-read after 1 s, in case the player was not ready when the page opened

All listeners are removed with `removeEventListener` on unmount.

## Settings

Stored as JSON in `localStorage` under `plattenspieler:settings`. Unknown or invalid fields fall back to the defaults.

| Key | Values | Default |
|-----|--------|---------|
| `theme` | `modern`, `2000s`, `spotify` | `modern` |
| `rpm` | `auto`, `33`, `45`, `78` | `auto` |
| `showVu` | boolean | `true` |
| `showInfo` | boolean | `true` |
| `clickToToggle` | boolean | `true` |

## Geometry

Recomputed on mount and on every resize.

- Record width: `min(320px, 55vw)` (must match the CSS)
- Record center: 36 % from left, 50 % from top of the turntable
- Tonearm pivot: `centerX + recordRadius + 12`, `height * 0.18 + 20`
- `baseAngle` (outer groove) = angle to center − 35°, `maxAngle` (inner groove) = angle to center − 2°
- `tonearmAngle = baseAngle + progress × (maxAngle − baseAngle)`, or `REST_ANGLE` (80°) without a track

## Rotation speed

With `rpm: auto`: below 2 min → 78 RPM (0.769 s/rev), below 4 min → 45 RPM (1.333 s/rev), otherwise 33⅓ RPM
(1.8 s/rev). The speed is applied as `animation-duration`; pause sets `animation-play-state: paused`, so the record
stops in place instead of jumping back.

## VU meter

1. Looks for `Spicetify.Player.analyser` (also `_analyser`, `audioAnalyser`, `_audioAnalyser`): every frame for ~10 s, then every ~20 s
2. Without an analyser, a beat-like signal is simulated
3. Playing: instant attack, decay ×0.92 per frame, peak decay ×0.997
4. Paused: decay ×0.88 / ×0.995 until everything is 0, then the loop stops
5. Reset on track change

## Styling (`src/style.css`)

Spicetify loads `style.css` from the app folder automatically; `build.mjs` copies it to `dist/`.

- Themes are custom properties on `.plattenspieler-theme-modern`, `-2000s` and `-spotify` (the latter maps to
  `--spice-*` variables with fallbacks). The settings overlay gets the same theme class because it is rendered
  outside the container.
- No `will-change` on the vinyl – avoids GPU crashes with faulty drivers (Flatpak/Wayland)
- `prefers-reduced-motion` disables the rotation and transitions
- Z-order: VU 5, tonearm 10, pivot 11, play indicator 20, toolbar 30, settings overlay 1000

## Build

`build.mjs`: entry `src/index.tsx` → `dist/index.js` (IIFE, `globalName: PlattenspielerApp`, footer
`var render = PlattenspielerApp.render;`), target `chrome100`, minified; `manifest.json` and `src/style.css` are copied
to `dist/`. `__VERSION__` is replaced with the version from `package.json`.

CI (`.github/workflows/ci.yml`) runs typecheck, unit tests, build, checks that the committed `dist/` matches the
build, and runs `shellcheck` on `update.sh`.

## Known Issues & Limitations

1. **Spotify Flatpak GPU crash** (`GPU process isn't usable`) – environment issue, not app-related. Workaround: `--disable-gpu`.
2. **VU meter analyser** is not exposed by most Spotify versions – the meter then shows the simulated signal.
3. **Tonearm geometry** may need offset adjustment for extreme viewport sizes.
4. **DevTools** are available at `http://127.0.0.1:8088` after `spicetify enable-devtools`.

## Development Workflow

1. `npm ci` once
2. `npm run watch` while editing, or `npm run check` before committing
3. `./update.sh` (checks, copies `dist/`, creates a backup, runs `spicetify apply`)
4. Reload the page in DevTools (Ctrl+R) – no full restart needed
