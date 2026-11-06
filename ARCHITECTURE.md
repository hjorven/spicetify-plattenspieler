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
| `motion.ts` | Animation math, frame-rate independent: `stepSpinSpeed` (spin-up/down), `advanceAngle`, `estimateProgress` (extrapolation between Spotify updates), `stepSpring` (critically damped spring) |

### `src/hooks/`

| Hook | Purpose |
|------|---------|
| `usePlayer()` | Subscribes to `songchange`, `onplaypause`, `onprogress`; returns `[track, { togglePlay, seek }]` |
| `useSettings()` | Settings state, persisted on every change |
| `useTurntableGeometry(ref)` | `ResizeObserver` + window resize, throttled via `requestAnimationFrame` |
| `useFrameLoop(cb, active, deps)` | Shared `requestAnimationFrame` loop; the callback gets `dt` and returns `false` to stop once settled |
| `useTurntableMotion(...)` | The turntable's animation engine (see below); writes to the DOM via refs |
| `useVuMeter(isPlaying, trackKey)` | Paints the VU bars via refs; reports whether a real analyser was found |
| `useReducedMotion()` | Follows `prefers-reduced-motion` |

### `src/components/`

Layout follows listening-stats: sticky header, then a two-column grid of cards (one column below 960 px).

| Component | Purpose |
|-----------|---------|
| `ErrorBoundary` | Shows error, version and a retry button instead of Spotify's generic error page |
| `RecordPlayer` | Page layout, wires hooks to children |
| `Header` | Title, status pill (Playing / Paused / Idle), speed segment control, settings button |
| `Card`, `StatTile` | Section card (uppercase eyebrow + title) and key-figure tile |
| `Turntable` | Plinth with LED, platter, tonearm, pivot and speed indicator; finish via theme class |
| `Record` / `IdleRecord` | Vinyl with cover (fallback label when missing or broken); play/pause button |
| `Tonearm` | SVG tonearm, gradient ids prefixed with `plattenspieler-` |
| `NowPlaying` | Cover, title, artist, album, progress bar (`role=slider`), previous / play-pause / next |
| `Levels` | Horizontal stereo VU bars with peak markers and a live/simulated pill |
| `settings/SettingsModal` | Settings window via `createPortal`; tabs Display / Turntable / About; Esc, X, backdrop click; focus trap and restore |
| `settings/controls` | `SettingRow`, `OptionGroup` (pills or tabs), `Toggle` (native or checkbox) |

## Animation engine (`useTurntableMotion`)

One `requestAnimationFrame` loop drives everything that moves. It writes `transform` directly to
elements through refs, so React only re-renders on track or settings changes, never per frame.

| Part | Logic |
|------|-------|
| Platter | Integrates its own angle: `angle += 360 / secondsPerRevolution × speed × dt`. `speed` eases from 0 to 1 in 0.9 s (spin-up) and back in 1.6 s (spin-down) with constant acceleration. Pausing, resuming and RPM changes therefore never make the record jump (the old CSS animation restarted or jumped when its duration changed). Inertia can be turned off in the settings. |
| Progress | Spotify reports the position only every few hundred ms. The last report is stored as an anchor `{progress, at}` and extrapolated with `performance.now()` while playing. |
| Tonearm | Target angle = `tonearmAngle(geom, hasTrack, progress)`. A critically damped spring (stiffness 45) glides the arm there without overshoot – continuous while playing, a smooth swing on seek or song change, back to rest without a track. |
| Cue lift | While paused, a second spring lifts the arm: slight `translateY`/`scale` and a larger drop shadow (CSS variable `--plattenspieler-lift`). |
| Progress bar / times | `scaleX(progress)` on the fill; time labels are rewritten only when the second changes. |
| Stop condition | The loop ends when the record stands still and both springs have settled, and restarts on the next relevant change. |
| Reduced motion | No rotation, arm and lift jump to their targets. |

All of this math lives in `src/lib/motion.ts` and is unit-tested (spin-up time, one revolution per period, extrapolation, no overshoot, stability at low frame rates).

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
| `theme` | `modern`, `silver`, `spotify` (old value `2000s` is mapped to `silver`) | `modern` |
| `rpm` | `auto`, `33`, `45`, `78` | `auto` |
| `showVu` | boolean | `true` |
| `showInfo` | boolean | `true` |
| `clickToToggle` | boolean | `true` |

## Geometry

Recomputed on mount and on every resize of the turntable element.

- Record width: 57 % of the turntable width (`RECORD_WIDTH_RATIO`, must match the CSS)
- Record center: 36 % from left, 50 % from top of the turntable
- Tonearm pivot: `centerX + recordRadius + 12`, `height * 0.18 + 20`
- `baseAngle` (outer groove) = angle to center − 35°, `maxAngle` (inner groove) = angle to center − 2°
- `tonearmAngle = baseAngle + progress × (maxAngle − baseAngle)`, or `REST_ANGLE` (80°) without a track

## Rotation speed

With `rpm: auto`: below 2 min → 78 RPM (0.769 s/rev), below 4 min → 45 RPM (1.333 s/rev), otherwise 33⅓ RPM
(1.8 s/rev). The speed can also be fixed via the segment control in the header or in the settings.

## VU meter

1. Looks for `Spicetify.Player.analyser` (also `_analyser`, `audioAnalyser`, `_audioAnalyser`): every frame for ~10 s, then every ~20 s
2. Without an analyser, a beat-like signal is simulated (pill shows "simulated")
3. Playing: instant attack, decay ×0.92 per frame, peak decay ×0.997
4. Paused: decay ×0.88 / ×0.995 until everything is 0, then the loop stops
5. Reset on track change; bars are painted via refs, no React state per frame

## Styling (`src/style.css`)

Spicetify loads `style.css` from the app folder automatically; `build.mjs` copies it to `dist/`.

- Page, cards and settings window use Spotify's colors (`--spice-*` with fallbacks), so they match the active Spicetify theme.
- The turntable has its own finishes: `.plattenspieler-theme-modern`, `-silver`, `-spotify` set `--tt-*` variables.
- **Silver skin** (`.plattenspieler-skin-silver` on the page and the settings overlay, via `skinOf(theme)`): restyles the whole page
  after real early-80s hi-fi gear – brushed-aluminum faceplates with engraved lowercase labels, black smoked display
  windows with glowing cyan VFD digits (tiles, track text, progress), red indicator tags and key LEDs, an amber speed badge,
  rectangular bevelled keys, a segmented peak power meter with scale, and chrome feet under the deck.
- VU bars are revealed with `clip-path` (not `scaleX`) so segmented bars keep their segment width.
- No CSS animation on the vinyl; no `will-change` (avoids GPU crashes with faulty drivers on Flatpak/Wayland).
- Z-order inside the turntable: tonearm 10, pivot 11. Header 20 (sticky), settings overlay 1000.

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

## Development

Setup, commands, debugging and releasing are described in [DEVELOPMENT.md](DEVELOPMENT.md); contribution rules in
[CONTRIBUTING.md](CONTRIBUTING.md).
