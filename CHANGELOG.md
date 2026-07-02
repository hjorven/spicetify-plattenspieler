# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Stereo VU meter box on right side with peak hold and beat-responsive animation
- Vinyl rotation speed adapts to song length (78 RPM for <2 min, 45 RPM for 2-4 min, 33⅓ RPM for >4 min)
- Two themes: Modern (dark, rounded, green) and 2000s (silver, square, blue)
- Theme selector buttons in the UI
- Footer with "Made by Jorven" and GitHub link
- English UI (translated from German)

### Changed
- VU meter pauses when playback is paused (freezes at current position)
- Analyser search retries periodically if not immediately available
- Fallback VU data uses beat-simulated pattern when no real analyser found
- Progress bar now reads from persisted progress (no reset on pause)
- Inline animation control via `animationPlayState` for vinyl freeze on pause
- Cleaned up code structure (separated `readPlayer`, consolidated state)

### Fixed
- Progress bar resetting to 0 on pause (now uses `savedProgress` module variable)
- Tonearm jumping to outer position on pause (angle depends only on `hasTrack + progress`)
- Vinyl restarting rotation from 0° on resume (uses `animationPlayState: paused`)
- Play button lag (immediate `hasTrack: true` in `onplaypause`)
- "No track playing" shown during playback (`data.item` vs `data.track` fallback)
- GPU crash risk (`will-change: transform` removed)

## [0.1.0] – Initial functional version

### Added
- `RecordPlayer` component with spinning vinyl, SVG tonearm, progress bar
- German UI with idle state ("Kein Song wird wiedergegeben")
- Responsive geometry via `ResizeObserver`
- Play/pause status dot (green/orange)
- Clickable progress bar with seek support
- Spicetify integration (`manifest.json`, route `/plattenspieler`)
- Deployment script `update.sh` with backup and syntax check

### Fixed
- Tonearm invisible → removed `overflow: hidden` on turntable
- Tonearm wrong angle → corrected `baseAngle` offset
- Title clipping into record → info section moved outside turntable
- Syntax errors → bracket nesting fixed, template literals → string concat
- Rest position wrong → `REST_ANGLE` changed from -8° to 80°
- GPU crash risk → `will-change: transform` removed

### Known (not app-related)
- Spotify Flatpak GPU crash on song start (`gpu_data_manager_impl_private.cc:417`)
