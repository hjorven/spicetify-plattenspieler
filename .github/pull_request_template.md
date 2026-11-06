## Description

<!-- What does this pull request change, and why? -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] New or changed finish (theme)
- [ ] Refactor (no visible change)
- [ ] Documentation
- [ ] Other:

## Related issue

<!-- "Fixes #123" closes the issue when this is merged. -->

## How to test

1. `npm ci && npm run check`
2. `./update.sh` (or copy `dist/` into your Spicetify `CustomApps/plattenspieler` and run `spicetify apply`)
3. Open Plattenspieler in the Spotify sidebar
4. ...

## Checklist

- [ ] `npm run check` passes
- [ ] `dist/` is rebuilt and committed
- [ ] Tested in Spotify with Spicetify (relevant parts of `TESTING.md`)
- [ ] New logic in `src/lib/` has unit tests
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] Docs updated if behavior or settings changed

## Screenshots

<!-- For visual changes: before and after, in every finish you touched. -->
