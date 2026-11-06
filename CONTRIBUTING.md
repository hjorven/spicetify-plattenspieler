# Contributing to Plattenspieler

Thanks for wanting to help. Every kind of contribution counts: a clear bug report, an idea, a new turntable finish,
a fix, a better sentence in the docs.

## Contents

- [Code of Conduct](#code-of-conduct)
- [Questions](#questions)
- [Reporting bugs](#reporting-bugs)
- [Suggesting features](#suggesting-features)
- [Your first code contribution](#your-first-code-contribution)
- [Pull request checklist](#pull-request-checklist)
- [Code style](#code-style)
- [Adding a new finish (theme)](#adding-a-new-finish-theme)
- [Commit messages](#commit-messages)
- [Improving the documentation](#improving-the-documentation)
- [Legal](#legal)

## Code of Conduct

Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Questions

Read the [README](README.md) and its troubleshooting table first, then search the
[issues](https://github.com/hjorven/spicetify-plattenspieler/issues). If nothing helps, open an issue with the
**Question** template and include your Spotify and Spicetify versions (`spicetify -v`).

## Reporting bugs

Before you open a bug report:

1. Make sure you use the latest version (`git pull`, copy `dist/` again, `spicetify apply`).
2. Check whether the bug also happens with a different finish and with other custom apps or extensions disabled.
3. Search the existing [issues](https://github.com/hjorven/spicetify-plattenspieler/issues?q=label%3Abug).

Then open an issue with the **Bug report** template. Good reports contain:

- what you did, what you expected, and what happened instead
- steps that reproduce the problem
- your OS, Spotify version and `spicetify -v`
- the error from the "Plattenspieler crashed" page or from the DevTools console, if any (see
  [DEVELOPMENT.md](DEVELOPMENT.md#debugging-in-spotify))
- a screenshot or short recording for visual problems

Security problems do not belong in public issues; see [SECURITY.md](SECURITY.md).

## Suggesting features

Open an issue with the **Feature request** template. Describe the problem you want to solve, not only the solution,
and add sketches or photos of real hardware if the idea is visual. Features should fit the idea of the app: a
turntable that shows what Spotify is playing.

## Your first code contribution

Issues labelled [`good first issue`](https://github.com/hjorven/spicetify-plattenspieler/labels/good%20first%20issue)
are a good start. Comment on the issue so nobody works on the same thing twice.

1. Fork the repository and clone your fork.
2. Install the tools (Node.js 20 or newer):

   ```bash
   npm ci
   ```

3. Create a branch from `master`:

   ```bash
   git checkout -b fix/short-description
   ```

4. Start the watcher and install the app into your Spicetify (details in [DEVELOPMENT.md](DEVELOPMENT.md)):

   ```bash
   npm run watch
   ./update.sh
   ```

5. Make your change. Keep it focused on one thing.
6. Run all checks. This is the same as CI:

   ```bash
   npm run check
   ```

7. Commit your source changes **and the rebuilt `dist/`** (CI fails if `dist/` is outdated).
8. Push and open a pull request against `master`. The template asks for a short description, how you tested it and
   screenshots for visual changes.

## Pull request checklist

- [ ] `npm run check` passes (typecheck, unit tests, build)
- [ ] `dist/` is rebuilt and committed
- [ ] Tested in Spotify with Spicetify applied (the relevant parts of [TESTING.md](TESTING.md))
- [ ] Screenshots for visual changes, in every finish you touched
- [ ] New logic in `src/lib/` has unit tests
- [ ] [CHANGELOG.md](CHANGELOG.md) has an entry under `[Unreleased]`
- [ ] Docs updated if behavior, settings or the project structure changed

## Code style

The rules that keep the app fast and the code easy to follow:

- **TypeScript, strict.** No `any` unless there is no other way; Spicetify types live in `src/spicetify.d.ts`.
- **Three layers.**
  - `src/lib/`: pure logic, no React, no DOM. Everything here gets unit tests in `test/`.
  - `src/hooks/`: connect Spicetify and the DOM to React.
  - `src/components/`: rendering only.
- **No React state per frame.** Anything that moves 60 times per second is written to the DOM through refs inside
  `useFrameLoop` (see the animation engine in [ARCHITECTURE.md](ARCHITECTURE.md#animation-engine-useturntablemotion)).
- **React comes from Spicetify.** Use `Spicetify.React` (`const { useState } = Spicetify.React;`), never
  `import React from "react"`; React is not bundled.
- **Guard every Spicetify API.** Not every Spotify version has every function. Use optional calls
  (`Spicetify.Player?.next?.()`) and fall back gracefully.
- **CSS classes start with `plattenspieler-`** so they cannot clash with Spotify or other apps. Colors come from
  CSS variables (`--ps-*` for the page, `--tt-*` for the turntable).
- **UI text is English.** Docs and code comments are English too.
- **Accessibility.** Interactive elements are real buttons or have a role, a label and keyboard handling.
- Formatting: 2 spaces, double quotes, semicolons, lines up to about 120 characters. Match the surrounding code.

## Adding a new finish (theme)

A finish changes the look of the turntable, and optionally the whole page (like *Silver*).

1. **Register it** in `src/lib/settings.ts`: add the value to the `Theme` type and to `THEMES`.
   If it restyles the whole page, return a skin name for it from `skinOf()`.
2. **Style the turntable** in `src/style.css` with a block that sets the `--tt-*` variables:

   ```css
   .plattenspieler-theme-walnut {
     --tt-radius: 6px;
     --tt-bg: linear-gradient(160deg, #6b4428, #3e2615);
     --tt-border: 1px solid rgba(255, 255, 255, 0.08);
     --tt-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
     --tt-accent: #ffb04a;
     --tt-text: rgba(255, 236, 210, 0.6);
     --tt-mat: #161616;
   }
   ```

3. **Optional page skin**: add rules under `.plattenspieler-skin-<name>` that override the `--ps-*` variables and
   restyle cards, tiles and buttons. The Silver skin at the end of `style.css` is a complete example.
4. **Test** `sanitizeSettings` with the new value in `test/settings.test.ts`.
5. **Screenshots**: add `docs/screenshots/<name>.png` and mention the finish in the README.

Real hardware is the best reference. Link the photos you used in the pull request.

## Commit messages

- First line: what the change does, in the imperative, up to about 72 characters
  (`Fix tonearm jump after seeking`, `Add walnut finish`).
- A blank line, then why and anything a reviewer should know.
- Reference issues with `Fixes #123`.

## Improving the documentation

Docs are Markdown files in the repository root. Fixes for typos, unclear steps or outdated screenshots are very
welcome and can be sent as a pull request without an issue.

## Legal

By contributing you confirm that you wrote the contribution yourself (or have the right to submit it) and that it may
be published under the project's [MIT license](LICENSE). Code taken from other projects needs a compatible license
and a credit in the README.
