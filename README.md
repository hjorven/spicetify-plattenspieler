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

```bash
git clone https://github.com/hjorven/spicetify-plattenspieler.git
mkdir -p ~/.spicetify/CustomApps/plattenspieler
cp spicetify-plattenspieler/index.js spicetify-plattenspieler/style.css spicetify-plattenspieler/manifest.json \
   ~/.spicetify/CustomApps/plattenspieler/

spicetify config custom_apps plattenspieler
spicetify apply
```

Restart Spotify. The app appears in the sidebar and is accessible at `/plattenspieler`.

## Updates

For local development, use the included [`update.sh`](./update.sh).
See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

## Testing

A manual test checklist is available in [TESTING.md](./TESTING.md).

## Architecture

Technical documentation (data flow, geometry formulas, CSS structure, known limitations)
is in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

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
