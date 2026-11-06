# Plattenspieler – Spicetify Custom App

A Spicetify custom app that shows the current Spotify album art as a spinning vinyl
record on a turntable with a moving tonearm – including play/pause detection,
clickable progress bar, stereo VU meter, and responsive layout.

![Screenshot](assets/screenshot.png)
<!-- TODO: Add screenshot, see assets/README.md -->

> **GitHub:** `https://github.com/hjorven/spicetify-plattenspieler`

## Features

- Album art as a spinning vinyl record (speed adapts to song length: 33⅓ / 45 / 78 RPM)
- SVG tonearm with metallic gradient, moves from outer to inner groove matching song progress
- Stereo VU meter box with peak hold (right side of turntable)
- Clickable progress bar with seek support
- Play/pause detection (green/orange status dot), click the record to play/pause
- Settings window (gear icon, top right) with tabs for display, turntable and about
- Three themes: Modern (dark, rounded, green), 2000s (silver, square, blue) and Spotify (follows your Spicetify color scheme)
- Fixed or automatic speed (33⅓ / 45 / 78 RPM), VU meter and track info can be toggled
- Fallback vinyl label when a track has no album art
- Keyboard support: Space/Enter on the record, arrow keys on the progress bar, Esc closes the settings
- Respects `prefers-reduced-motion`
- Responsive geometry via `ResizeObserver`
- No build tool required – pure `React.createElement`

## Installation

The ready-built app lives in `dist/`, so no Node.js is needed to install it.

```bash
git clone https://github.com/hjorven/spicetify-plattenspieler.git
mkdir -p "$(dirname "$(spicetify -c)")/CustomApps/plattenspieler"
cp spicetify-plattenspieler/dist/index.js spicetify-plattenspieler/dist/style.css spicetify-plattenspieler/dist/manifest.json \
   "$(dirname "$(spicetify -c)")/CustomApps/plattenspieler/"
spicetify config custom_apps plattenspieler
spicetify apply
```

`spicetify -c` prints the path of your Spicetify config file; the `CustomApps` folder sits next to it
(usually `~/.config/spicetify/CustomApps` or `~/.spicetify/CustomApps`).

Restart Spotify. The app appears in the sidebar and is accessible at `/plattenspieler`.

## Development

Requires Node.js 20 or newer.

```bash
npm ci              # install dev dependencies
npm run watch       # rebuild dist/ on every change
npm run check       # typecheck + unit tests + production build
./update.sh         # check, copy dist/ into Spicetify, back up the old version, spicetify apply
```

`update.sh` installs to `~/.spicetify/CustomApps/plattenspieler` by default. Override it with
`DEST_DIR`, for example:

```bash
DEST_DIR="$HOME/.config/spicetify/CustomApps/plattenspieler" ./update.sh
```

Commit the rebuilt `dist/` together with your source changes; CI fails if it is outdated.

### Project structure

```
src/
  index.tsx                  entry point, exports render()
  components/                React components (TSX)
    RecordPlayer.tsx         page layout
    Record.tsx, Tonearm.tsx, VuMeter.tsx, TrackInfo.tsx
    settings/                settings window and its controls
    ErrorBoundary.tsx
  hooks/                     usePlayer, useSettings, useTurntableGeometry, useVuLevels
  lib/                       pure logic without React (tested): format, settings, geometry, player, vu
  style.css
test/                        vitest unit tests for src/lib
dist/                        build output that Spicetify loads
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details and [TESTING.md](./TESTING.md) for the manual test checklist.

## Known Limitations

- Spotify Flatpak installations may experience GPU crashes on song start (not caused by this app) – workaround: `--disable-gpu` flag.
- VU meter uses simulated beat data when the system audio analyser is unavailable.

## License

See [LICENSE](./LICENSE) (MIT).

## Credits

The settings window, error boundary and some Spicetify compatibility helpers follow patterns from
[listening-stats](https://github.com/HeadshotInteractive/listening-stats) (MIT). No code was copied verbatim.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
