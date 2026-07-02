# Test Checklist – Plattenspieler

Manual checklist to run through after every update.

## 0. Syntax Check

```bash
node --check ~/Downloads/plattenspieler/index.js
```

- [ ] No errors → proceed
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
- [ ] VU meter box visible on right side, bars move with music

## 4. Playback Progress

- [ ] Progress bar fills matching actual song position
- [ ] Time display (`mm:ss`) correct for current position and total duration
- [ ] Tonearm moves continuously from outer to inner groove
- [ ] At song end: tonearm near inner position (maxAngle)

## 5. Pause / Play

- [ ] Pause → vinyl stops (animation pauses in place, no reset)
- [ ] Status dot turns orange
- [ ] Tonearm stays at current position (no jump)
- [ ] VU bars freeze at current level (no movement)
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

## 8. Theme Switching

- [ ] Click "Modern" → dark theme with rounded corners, green accent
- [ ] Click "2000s" → silver theme with square corners, blue accent
- [ ] Theme persists across page reload (localStorage)

## 9. Responsive

- [ ] Narrow window → turntable shrinks (90vw), tonearm stays correct
- [ ] Wide window → turntable max 560px, record max 320px
- [ ] Small viewport → border-radius reduces (breakpoint at 600px)

## 10. No Album Artwork (Edge Case)

- [ ] Play track without cover → vinyl stays black, no crash, no errors

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
