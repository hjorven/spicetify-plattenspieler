# Test Checklist – Plattenspieler

Manual checklist to run through after every update.

## 0. Automated Checks

```bash
npm run check
```

- [ ] Typecheck, unit tests and build pass → proceed
- [ ] Errors → fix first

## 1. App Loads

- [ ] Spotify starts, sidebar shows "Plattenspieler" icon (inactive/active SVG distinct)
- [ ] Click icon → page `/plattenspieler` opens without blank/error screen

## 2. Idle State (no track)

- [ ] Without a playing song: vinyl icon + "No track playing" text visible
- [ ] Tonearm in rest position (REST_ANGLE, points down-right, ~80°)
- [ ] Status dot is off (not green)

## 3. Song Start

- [ ] Album art appears correctly on the platter
- [ ] Vinyl rotates (speed depends on song length)
- [ ] Tonearm moves smoothly to starting position
- [ ] Status dot turns green
- [ ] Track name + artist name shown below turntable
- [ ] VU meter card visible, bars move with music (pill shows live or simulated)

## 4. Playback Progress

- [ ] Progress bar fills matching actual song position
- [ ] Time display (`mm:ss`) correct for current position and total duration
- [ ] Tonearm moves continuously from outer to inner groove
- [ ] At song end: tonearm near inner position (maxAngle)

## 5. Pause / Play

- [ ] Pause → vinyl stops (animation pauses in place, no reset)
- [ ] Status dot turns orange
- [ ] Tonearm stays at current position (no jump)
- [ ] VU bars and peaks fall to 0
- [ ] Play → rotation continues smoothly
- [ ] VU bars resume moving

## 6. Song Change

- [ ] Next song → album art, track name, artist name update immediately
- [ ] Tonearm returns to outer position for new song
- [ ] Progress bar resets to 0
- [ ] Vinyl speed adjusts if song length changed significantly

## 7. Progress Bar Click (Seek)

- [ ] Click on progress bar → song jumps to that position
- [ ] Tonearm angle updates to match new position
- [ ] No console errors

## 7b. Animation

- [ ] Play: record spins up smoothly (~1 s), pause: it slows down (~1.5 s) and stops without jumping back
- [ ] With "Platter inertia" off, the record starts and stops immediately
- [ ] Changing the speed in the header changes rotation smoothly, no jump
- [ ] Tonearm moves continuously (no 1-second steps), swings smoothly after a seek or song change
- [ ] Pause: tonearm lifts slightly (bigger shadow), drops back on play
- [ ] Progress bar moves continuously
- [ ] Paused and settled: CPU usage drops (loop stops)

## 8. Settings Window

- [ ] Gear icon (top right) opens the settings window
- [ ] Esc, the X button and a click on the dark background close it; focus returns to the gear icon
- [ ] Display → "Modern": dark turntable with rounded corners, green LEDs
- [ ] Display → "2000s": silver turntable with square corners, blue LEDs
- [ ] Display → "Spotify": turntable colors follow the active Spicetify color scheme
- [ ] Toggling "Show track info" / "Show VU meter" hides/shows the elements
- [ ] Turntable → fixed RPM changes the rotation speed immediately
- [ ] Turntable → "Reset to defaults" restores all settings
- [ ] Settings persist across page reload (`localStorage` key `plattenspieler:settings`)
- [ ] Old installs: previously chosen theme (`plattenspieler-theme`) is kept

## 8b. Click & Keyboard

- [ ] Click on the record toggles play/pause (when enabled)
- [ ] Tab to the record, Space/Enter toggles play/pause
- [ ] Tab to the progress bar, arrow keys seek ±5 s

## 9. Responsive

- [ ] Narrow window → turntable shrinks (90vw), tonearm stays correct
- [ ] Wide window → turntable max 560px, record max 320px
- [ ] Small viewport → border-radius reduces (breakpoint at 600px)

## 10. No Album Artwork (Edge Case)

- [ ] Play track without cover → black vinyl with colored label showing the track name, no errors

## 11. VU Meter (if analyser available)

- [ ] Bars respond to actual audio (frequency data)
- [ ] Peak lines hold briefly then decay
- [ ] Left/right channels show independent movement

## 12. Stability (Flatpak)

- [ ] Spotify runs several minutes without GPU crash

---

### Result Log

| Date | Version/Commit | Passed? | Notes |
|------|---------------|---------|-------|
|      |               |         |       |
