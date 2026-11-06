#!/usr/bin/env bash
# Plattenspieler – install, update or uninstall for Spicetify (Linux / macOS).
#
# Install or update:
#   curl -fsSL https://raw.githubusercontent.com/hjorven/spicetify-plattenspieler/master/install.sh | bash
#
# Uninstall:
#   curl -fsSL https://raw.githubusercontent.com/hjorven/spicetify-plattenspieler/master/install.sh | bash -s -- --uninstall
#
# Options (environment variables):
#   PLATTENSPIELER_REF=<tag|branch>   install a specific version (default: latest release, else master)
#   PLATTENSPIELER_NO_APPLY=1         copy files and register the app, but do not run "spicetify apply"
#   SPICETIFY_CONFIG=<dir>            Spicetify config folder, if it is not the default
#
# Requires: Spicetify CLI (https://spicetify.app), curl.

set -euo pipefail

REPO="hjorven/spicetify-plattenspieler"
APP="plattenspieler"
FILES=(index.js style.css manifest.json)

if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; YEL=$'\033[33m'; GRN=$'\033[32m'; RST=$'\033[0m'
else
  BOLD=""; DIM=""; RED=""; YEL=""; GRN=""; RST=""
fi

step() { printf '%s==>%s %s\n' "$BOLD" "$RST" "$*"; }
info() { printf '    %s%s%s\n' "$DIM" "$*" "$RST"; }
warn() { printf '%sWarning:%s %s\n' "$YEL" "$RST" "$*" >&2; }
die()  { printf '%sError:%s %s\n' "$RED" "$RST" "$*" >&2; exit 1; }

UNINSTALL=0
for arg in "$@"; do
  case "$arg" in
    --uninstall|-u) UNINSTALL=1 ;;
    -h|--help) sed -n '2,16p' "$0" 2>/dev/null || true; exit 0 ;;
    *) die "Unknown option: $arg" ;;
  esac
done

command -v curl >/dev/null 2>&1 || die "curl is required."
command -v spicetify >/dev/null 2>&1 || die "Spicetify CLI not found. Install it first: https://spicetify.app/docs/getting-started"

# Where "spicetify apply" looks for custom apps: <config folder>/CustomApps.
custom_apps_dir() {
  if [[ -n "${SPICETIFY_CONFIG:-}" ]]; then
    printf '%s/CustomApps' "$SPICETIFY_CONFIG"
    return
  fi
  local cfg
  cfg="$(spicetify path -c 2>/dev/null | tail -n 1 || true)"
  if [[ -n "$cfg" && -f "$cfg" ]]; then
    printf '%s/CustomApps' "$(dirname "$cfg")"
    return
  fi
  printf '%s/spicetify/CustomApps' "${XDG_CONFIG_HOME:-$HOME/.config}"
}

# Runs "spicetify apply"; on a stale backup (typical after a Spotify update) it recovers with "backup apply".
apply_spicetify() {
  local out
  if out="$(spicetify apply 2>&1)" && ! grep -Eiq 'outdated|mismatch|backup apply' <<<"$out"; then
    return 0
  fi
  warn "spicetify apply reported an outdated backup, trying: spicetify backup apply"
  printf '%s\n' "$out" | sed 's/^/    /' >&2
  if spicetify backup apply; then return 0; fi
  warn "backup apply failed, trying: spicetify restore backup apply"
  spicetify restore backup apply || die "Spicetify could not be applied. Close Spotify completely and run: spicetify restore backup apply"
}

DEST="$(custom_apps_dir)/$APP"

if [[ "$UNINSTALL" -eq 1 ]]; then
  step "Uninstalling Plattenspieler"
  spicetify config custom_apps "${APP}-" >/dev/null 2>&1 || true
  if [[ -d "$DEST" ]]; then
    rm -rf "$DEST"
    info "removed $DEST"
  fi
  if [[ "${PLATTENSPIELER_NO_APPLY:-0}" != "1" ]]; then
    step "Applying Spicetify"
    apply_spicetify
  fi
  printf '%sPlattenspieler was removed.%s\n' "$GRN" "$RST"
  exit 0
fi

step "Finding the version to install"
REF="${PLATTENSPIELER_REF:-}"
if [[ -z "$REF" ]]; then
  REF="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null \
    | grep -m1 '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/' || true)"
  [[ -n "$REF" ]] || REF="master"
fi
info "version: $REF"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

step "Downloading"
for f in "${FILES[@]}"; do
  url="https://raw.githubusercontent.com/$REPO/$REF/dist/$f"
  curl -fsSL --retry 3 -o "$TMP/$f" "$url" || die "Download failed: $url"
  [[ -s "$TMP/$f" ]] || die "Downloaded file is empty: $f"
  info "$f"
done
grep -q "PlattenspielerApp" "$TMP/index.js" || die "Downloaded index.js does not look like Plattenspieler."

step "Installing to $DEST"
mkdir -p "$DEST"
for f in "${FILES[@]}"; do
  cp "$TMP/$f" "$DEST/$f"
done

step "Registering the app"
spicetify config custom_apps "$APP" >/dev/null

if [[ "${PLATTENSPIELER_NO_APPLY:-0}" == "1" ]]; then
  info "PLATTENSPIELER_NO_APPLY=1: skipping spicetify apply"
else
  step "Applying Spicetify (Spotify restarts)"
  apply_spicetify
fi

printf '\n%sDone.%s Open %sPlattenspieler%s in the Spotify sidebar.\n' "$GRN" "$RST" "$BOLD" "$RST"
