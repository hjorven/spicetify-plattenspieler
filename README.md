# Plattenspieler – Spicetify Custom App

A Spicetify custom app that shows the current Spotify album art as a spinning vinyl
record on a turntable with a moving tonearm – including play/pause detection,
clickable progress bar, stereo VU meter, and responsive layout.

![Screenshot](assets/screenshot.png)
<!-- TODO: Add screenshot, see assets/README.md -->

> **GitHub:** `https://github.com/Death-Watcher/spicetify-plattenspieler`

## Features

- Album art as a spinning vinyl record (speed adapts to song length: 33⅓ / 45 / 78 RPM)
- SVG tonearm with metallic gradient, moves from outer to inner groove matching song progress
- Stereo VU meter box with peak hold (right side of turntable)
- Clickable progress bar with seek support
- Play/pause detection (green/orange status dot)
- Two themes: Modern (dark, rounded, green accent) and 2000s (silver, square, blue accent)
- Responsive geometry via `ResizeObserver`
- No build tool required – pure `React.createElement`

## Installation

```bash
git clone https://github.com/Death-Watcher/spicetify-plattenspieler.git
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
- No fallback image if a track has no album artwork.
- VU meter uses simulated beat data when the system audio analyser is unavailable.

## License

See [LICENSE](./LICENSE) (MIT).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
