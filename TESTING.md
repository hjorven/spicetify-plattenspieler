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
- [ ] Peak meter card visible, bars move with music (pill shows live, track or simulated)

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
- [ ] Display → "Silver": whole page in brushed aluminum, cyan VFD displays, segmented peak meter, red key LEDs, chrome feet
- [ ] Users who had "2000s" selected get "Silver" automatically
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

## 11. Peak Meter

- [ ] Music track: pill shows "track", bars follow the song (quiet intro low, chorus high, breaks drop)
- [ ] Seek to a loud and a quiet part: the bars follow at once
- [ ] Skip to a podcast or local file: pill shows "simulated", no errors in the console
- [ ] Peak lines hold briefly then decay
- [ ] If an analyser is available (pill "live"): bars respond to actual audio, left/right move independently

## 11a. Installer

- [ ] Linux/macOS: `curl -fsSL https://raw.githubusercontent.com/hjorven/spicetify-plattenspieler/master/install.sh | bash` installs, Spotify restarts, app in sidebar
- [ ] Windows: `iwr -useb https://raw.githubusercontent.com/hjorven/spicetify-plattenspieler/master/install.ps1 | iex` does the same
- [ ] Running it again updates without errors
- [ ] Uninstall command removes the app from the sidebar and the `CustomApps` folder

## 12. Stability (Flatpak)

- [ ] Spotify runs several minutes without GPU crash

---

### Result Log

| Date | Version/Commit | Passed? | Notes |
|------|---------------|---------|-------|
|      |               |         |       |
