# Developer Guide

Everything you need to work on Plattenspieler: setup, the daily workflow, debugging in Spotify and releasing.
For how the app works inside, read [ARCHITECTURE.md](ARCHITECTURE.md).

## Contents

- [Requirements](#requirements)
- [Setup](#setup)
- [Commands](#commands)
- [Project structure](#project-structure)
- [How Spicetify loads the app](#how-spicetify-loads-the-app)
- [Daily workflow](#daily-workflow)
- [Browser preview without Spotify](#browser-preview-without-spotify)
- [Debugging in Spotify](#debugging-in-spotify)
- [Tests](#tests)
- [Spicetify APIs used](#spicetify-apis-used)
- [Common tasks](#common-tasks)
- [Releasing](#releasing)
- [Editor setup](#editor-setup)

## Requirements

| Tool | Version | Why |
|------|---------|-----|
| Node.js | 20 or newer | build, typecheck, tests |
| npm | comes with Node.js | dependencies |
| Spotify desktop + [Spicetify](https://spicetify.app) | current | to run the app for real |
| bash | any | `update.sh` (on Windows use Git Bash or WSL, or copy the files by hand) |

## Setup

```bash
git clone https://github.com/<your-name>/spicetify-plattenspieler.git
cd spicetify-plattenspieler
npm ci
npm run check
```

`npm run check` should end with `Built v…`. If it does, your setup works.

## Commands

| Command | What it does |
|---------|--------------|
| `npm run watch` | Rebuilds `dist/` on every change (with inline source maps) |
| `npm run build` | Production build into `dist/` (minified) |
| `npm run typecheck` | TypeScript check without output |
| `npm test` | Unit tests with vitest |
| `npm run check` | Typecheck + tests + build, the same as CI |
| `npm run preview` | Build, then open `dev/preview.html` in a browser |
| `./update.sh` | `npm run check`, back up the installed app, copy `dist/` into Spicetify, `spicetify apply` |
| `./update.sh --no-apply` | Same, without `spicetify apply` |
| `./update.sh --restart` | Same, then restart Spotify (Flatpak) |

`update.sh` installs to `~/.spicetify/CustomApps/plattenspieler`. If your Spicetify uses another folder
(check with `spicetify -c`), set `DEST_DIR`:

```bash
DEST_DIR="$(dirname "$(spicetify -c)")/CustomApps/plattenspieler" ./update.sh
```

## Project structure

```
src/
  index.tsx                 entry point, exports render()
  spicetify.d.ts            types for the parts of the Spicetify API we use
  style.css                 all styles (copied to dist/)
  lib/                      pure logic, unit-tested
    format.ts               time formatting, clamp
    settings.ts             settings type, defaults, validation, migration
    geometry.ts             turntable and tonearm geometry, RPM
    player.ts               reading Spicetify.Player into a TrackState
    motion.ts               animation math (spin-up, springs, extrapolation)
    vu.ts                   peak meter math, analyser lookup
  hooks/                    connect Spicetify / DOM to React
    usePlayer.ts            player events + controls
    useSettings.ts          settings state, persisted
    useTurntableGeometry.ts measures the turntable
    useTurntableMotion.ts   the animation engine
    useVuMeter.ts           peak meter painting
    useFrameLoop.ts         shared requestAnimationFrame loop
    useReducedMotion.ts     prefers-reduced-motion
  components/               rendering
    RecordPlayer.tsx        page layout
    Header.tsx, Card.tsx, Turntable.tsx, Record.tsx, Tonearm.tsx,
    NowPlaying.tsx, Levels.tsx, ErrorBoundary.tsx, Icon.tsx
    settings/               settings window and its controls
test/                       vitest unit tests for src/lib
dev/preview.html            browser preview with a fake Spotify
dist/                       build output that Spicetify loads (committed)
build.mjs                   esbuild configuration
update.sh                   local install script
```

## How Spicetify loads the app

1. `spicetify config custom_apps plattenspieler` registers the folder `CustomApps/plattenspieler`.
2. On `spicetify apply`, Spicetify adds a sidebar entry using `name` and `icon` from `manifest.json`.
3. When you open the page, Spotify loads `index.js` and `style.css` from that folder and calls the global
   `render()` function, which returns a React element.

`build.mjs` therefore bundles `src/index.tsx` as an IIFE and appends `var render = PlattenspielerApp.render;`.
React is **not** bundled: JSX compiles to `Spicetify.React.createElement`, so the app uses Spotify's own React.

## Daily workflow

```bash
npm run watch          # terminal 1: rebuild on save
./update.sh --no-apply # terminal 2: copy dist/ into Spicetify after a change
```

After the first full `./update.sh`, a copy plus a page reload is usually enough: open DevTools in Spotify and press
`Ctrl+R` (or `Cmd+R`). Run `spicetify apply` again only when `manifest.json` changed.

Before you commit:

```bash
npm run check
git add src test dist
```

## Browser preview without Spotify

`dev/preview.html` runs the built app in a normal browser with a fake `Spicetify.Player` (three test tracks,
position updates every 500 ms like Spotify). Buttons in the bottom-left corner switch tracks, pause, remove the cover
and simulate "no track".

```bash
npm run preview
```

Then open `dev/preview.html` in Chrome, Chromium or Firefox. It is great for layout, CSS and animation work. Things
that depend on the real client (the audio analyser, Spotify's own components, the actual Spicetify theme colors)
still need a test in Spotify.

## Debugging in Spotify

1. Enable the DevTools once:

   ```bash
   spicetify enable-devtools
   ```

2. In Spotify, open the DevTools with `Ctrl+Shift+I` (`Cmd+Option+I` on macOS), or right-click and choose
   **Inspect Element**.
3. Log messages from the app start with `[plattenspieler]`.
4. Render errors show the "Plattenspieler crashed" page with the stack trace; the same error is in the console.
5. Use `npm run watch` for readable stack traces: it builds with inline source maps.

Useful snippets for the DevTools console:

```js
Spicetify.Player.data                                   // what readPlayer() sees
JSON.parse(localStorage.getItem("plattenspieler:settings"))
localStorage.removeItem("plattenspieler:settings")      // back to defaults, then reload
```

## Tests

- **Unit tests** (`test/`, vitest) cover everything in `src/lib/`. Add a test for every new function there.

  ```bash
  npm test                 # once
  npx vitest               # watch mode
  ```

- **Manual tests** in Spotify follow [TESTING.md](TESTING.md). Run the sections your change touches.
- **CI** (`.github/workflows/ci.yml`) runs typecheck, tests, build, checks that `dist/` matches the build and runs
  `shellcheck` on `update.sh` for every push to `master` and every pull request.

## Spicetify APIs used

| API | Used for | Fallback |
|-----|----------|----------|
| `Spicetify.React`, `Spicetify.ReactDOM.createPortal` | rendering, settings window | portal → inline render |
| `Spicetify.Player.data` | current track, cover, artist, album | — |
| `Spicetify.Player.getDuration / getProgress / isPlaying` | position and state | values from `Player.data` |
| `Spicetify.Player.addEventListener` (`songchange`, `onplaypause`, `onprogress`) | updates | one delayed re-read |
| `Spicetify.Player.togglePlay / next / back / seek` | controls | ignored if missing |
| `Spicetify.Player.analyser` (and variants) | real peak meter levels | simulated signal |
| `Spicetify.ReactComponent.Toggle` | native switches in settings | checkbox |

Every call is guarded, because Spotify updates add and remove these regularly.

## Common tasks

**Add a setting**

1. Add the field and its default in `src/lib/settings.ts` and validate it in `sanitizeSettings`.
2. Add a test in `test/settings.test.ts`.
3. Add a row in `src/components/settings/SettingsModal.tsx` (`SettingRow` + `Toggle` or `OptionGroup`).
4. Use it in the component, document it in the settings table in [ARCHITECTURE.md](ARCHITECTURE.md).

**Add a new finish**: see [CONTRIBUTING.md](CONTRIBUTING.md#adding-a-new-finish-theme).

**Change the animation**: tune or extend the math in `src/lib/motion.ts` (with tests) and apply it in
`src/hooks/useTurntableMotion.ts`. Write to the DOM through refs; do not add React state that changes every frame.

**Add a card to the page**: build it with `Card` (and `StatTile` for figures) from `src/components/Card.tsx` and place
it in `RecordPlayer.tsx`. Check both the wide layout and the single-column layout below 960 px.

## Releasing

1. Update the version in `package.json` (the app shows it in the footer and the About tab).
2. Move the `[Unreleased]` entries in [CHANGELOG.md](CHANGELOG.md) under the new version with the date.
3. `npm run check`, commit `package.json`, `CHANGELOG.md` and `dist/`.
4. Tag and push:

   ```bash
   git tag v1.1.0
   git push origin master --tags
   ```

5. Create a GitHub release for the tag, paste the changelog section and attach `dist/index.js`, `dist/style.css` and
   `dist/manifest.json`.

## Editor setup

Any editor with TypeScript support works. In VS Code these help:

- the built-in TypeScript support (uses the workspace `tsconfig.json`)
- *Vitest* extension to run single tests
- *EditorConfig* if you use other editors in parallel

Recommended workspace settings (`.vscode/settings.json`, not committed):

```json
{
  "editor.tabSize": 2,
  "editor.formatOnSave": false,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```
