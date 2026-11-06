# Security Policy

## Supported versions

Only the latest version on `master` gets fixes. Please update before reporting.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Use GitHub's private reporting instead:
[Report a vulnerability](https://github.com/hjorven/spicetify-plattenspieler/security/advisories/new).

Include:

- a description of the problem and its impact
- steps to reproduce
- your Spotify and Spicetify versions (`spicetify -v`)
- a suggested fix, if you have one

You will get an answer as soon as possible. Confirmed problems are fixed in a new release, and you are credited in
the changelog unless you prefer not to be.

## Scope

- the custom app (`src/`, built into `dist/`)
- the installers `install.sh` and `install.ps1` and the developer script `update.sh`
- the CI workflow in `.github/workflows/`

## Data and privacy

- The app only talks to Spotify. Album art is loaded from Spotify's image CDN (`i.scdn.co`) through the URLs Spotify
  already provides, and the peak meter asks Spotify for the current song's audio analysis through
  `Spicetify.getAudioData`, using your existing Spotify session.
- The installers download only from this GitHub repository (`raw.githubusercontent.com`, `api.github.com`).
- Settings are stored in `localStorage` under `plattenspieler:settings` in your Spotify client and never leave your
  computer.
- No analytics, no tracking, no accounts, no API keys.
