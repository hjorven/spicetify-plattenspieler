# Plattenspieler

A [Spicetify](https://spicetify.app) custom app that puts the song you are listening to on a turntable: the album art
spins as a vinyl record, the tonearm tracks the song position, and a peak meter dances along.

![Plattenspieler, Modern finish](docs/screenshots/modern.png)

<table>
  <tr>
    <td><img src="docs/screenshots/silver.png" alt="Silver finish" /></td>
    <td><img src="docs/screenshots/spotify.png" alt="Spotify finish" /></td>
    <td><img src="docs/screenshots/settings.png" alt="Settings window" /></td>
  </tr>
  <tr>
    <td align="center">Silver finish</td>
    <td align="center">Spotify finish</td>
    <td align="center">Settings window</td>
  </tr>
</table>

## Features

- **Spinning record** with the current album art, real spin-up and spin-down like a belt-drive turntable
- **Tonearm** that glides from the outer to the inner groove as the song plays and lifts slightly while paused
- **Speed** 33⅓ / 45 / 78 RPM, automatic by song length or fixed, switchable in the header
- **Now playing card** with cover, title, artist, album, seekable progress bar and previous / play-pause / next
- **Peak meter** that follows the real loudness of the song, from Spotify's audio analysis and synced to the position
  (live analyser when Spotify exposes one, a simulated signal for tracks without analysis)
- **Three finishes**
  - *Modern*: dark turntable with green LEDs in a Spotify-style layout
  - *Silver*: the whole page as brushed-aluminum hi-fi gear of the early 80s, with glowing VFD displays and bevelled keys
  - *Spotify*: follows the colors of your Spicetify theme
- **Settings window** for finish, speed, inertia, tiles, peak meter and click-to-play
- **Keyboard support**: Space/Enter on the record, arrow keys on the progress bar, Esc closes the settings
- Respects `prefers-reduced-motion`, works in narrow windows, no data leaves your computer

## Requirements

- Spotify desktop app
- [Spicetify](https://spicetify.app/docs/getting-started) installed and applied at least once

## Installation

One command installs the latest release. Run it again later to update. You do not need Git or Node.js.

**Linux / macOS**

```bash
curl -fsSL https://raw.githubusercontent.com/hjorven/spicetify-plattenspieler/master/install.sh | bash
```

**Windows (PowerShell)**

```powershell
iwr -useb https://raw.githubusercontent.com/hjorven/spicetify-plattenspieler/master/install.ps1 | iex
```

The installer finds your Spicetify `CustomApps` folder, downloads `index.js`, `style.css` and `manifest.json`,
registers the app and runs `spicetify apply`. Spotify restarts and **Plattenspieler** appears in the sidebar.
If `spicetify apply` fails because Spotify was updated, it runs `spicetify backup apply` for you.

Options (environment variables):

| Variable | Effect |
|----------|--------|
| `PLATTENSPIELER_REF` | Install a specific version, e.g. `v1.1.0` or `master` (default: latest release, otherwise `master`) |
| `PLATTENSPIELER_NO_APPLY=1` | Copy and register only, do not run `spicetify apply` |
| `SPICETIFY_CONFIG` | Your Spicetify config folder, if it is not the default |

Example: install the current development version on Linux / macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/hjorven/spicetify-plattenspieler/master/install.sh | PLATTENSPIELER_REF=master bash
```

<details>
<summary>Manual installation</summary>

Download `plattenspieler.zip` from the [latest release](https://github.com/hjorven/spicetify-plattenspieler/releases/latest)
(or the three files from `dist/`) and put them into the `CustomApps/plattenspieler` folder next to your Spicetify
config (`spicetify path -c` shows where it is). Then:

```bash
spicetify config custom_apps plattenspieler
spicetify apply
```

</details>

## Updating

Run the install command again.

## Uninstalling

**Linux / macOS**

```bash
curl -fsSL https://raw.githubusercontent.com/hjorven/spicetify-plattenspieler/master/install.sh | bash -s -- --uninstall
```

**Windows (PowerShell)**

```powershell
$env:PLATTENSPIELER_UNINSTALL = "1"; iwr -useb https://raw.githubusercontent.com/hjorven/spicetify-plattenspieler/master/install.ps1 | iex
```

## Troubleshooting

| Problem | What to do |
|---------|-----------|
| The app does not show up in the sidebar | Run `spicetify config custom_apps` and check that `plattenspieler` is listed, then `spicetify apply` again. |
| "Plattenspieler crashed" page | Click **Try again**. If it happens again, open an [issue](https://github.com/hjorven/spicetify-plattenspieler/issues/new/choose) and paste the error shown on the page. |
| Peak meter says "simulated" | Spotify has no audio analysis for this item (podcasts, local files) or your Spicetify version has no `getAudioData`. The meter then shows a beat-like signal. "track" means real song loudness. |
| Installer says "Spicetify CLI not found" | Install Spicetify first and open a new terminal: [spicetify.app](https://spicetify.app/docs/getting-started). |
| Spotify (Flatpak) crashes with `GPU process isn't usable` | Not caused by this app. Start Spotify with `--disable-gpu`. |
| After a Spotify update the app is gone | Spotify updates remove Spicetify. Run `spicetify backup apply`. |

## Contributing

Contributions are welcome, from bug reports and ideas to code, new finishes and documentation.

- [CONTRIBUTING.md](CONTRIBUTING.md): how to report bugs, suggest features and open a pull request
- [DEVELOPMENT.md](DEVELOPMENT.md): set up the project, build, test and debug
- [ARCHITECTURE.md](ARCHITECTURE.md): how the app works inside (player, animation engine, styling)
- [TESTING.md](TESTING.md): manual test checklist for Spotify

## Privacy

The app only talks to Spotify itself: cover images come from Spotify's CDN, and the peak meter asks Spotify (through
Spicetify) for the audio analysis of the current song. Settings are stored
in `localStorage` in your Spotify client. See [SECURITY.md](SECURITY.md).

## Credits

Layout, settings window, the one-line installers and parts of the project setup follow patterns from
[listening-stats](https://github.com/HeadshotInteractive/listening-stats) (MIT). No code was copied verbatim.

## License

[MIT](LICENSE). See [CHANGELOG.md](CHANGELOG.md) for the release history.
