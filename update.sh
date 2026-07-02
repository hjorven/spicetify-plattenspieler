#!/usr/bin/env bash
#
# update.sh – Kopiert die Plattenspieler-App vom Entwicklungsordner
# ins Spicetify-CustomApps-Verzeichnis, prüft Syntax, legt ein Backup an
# und wendet Spicetify an.
#
# Nutzung:
#   ./update.sh            # normales Update
#   ./update.sh --no-apply # nur kopieren, kein "spicetify apply"
#   ./update.sh --restart  # zusätzlich Spotify neu starten (Flatpak)

set -euo pipefail

SRC_DIR="${SRC_DIR:-$HOME/Downloads/plattenspieler}"
DEST_DIR="${DEST_DIR:-$HOME/.spicetify/CustomApps/plattenspieler}"
BACKUP_ROOT="${BACKUP_ROOT:-$HOME/.spicetify/CustomApps/.plattenspieler-backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

APPLY=true
RESTART=false

for arg in "$@"; do
  case "$arg" in
    --no-apply) APPLY=false ;;
    --restart) RESTART=true ;;
    *) echo "Unbekannte Option: $arg" >&2; exit 1 ;;
  esac
done

echo "==> Plattenspieler Update"
echo "    Quelle:  $SRC_DIR"
echo "    Ziel:    $DEST_DIR"
echo

# 1. Syntax-Check
echo "==> [1/5] Syntax-Check (index.js)"
if ! command -v node >/dev/null 2>&1; then
  echo "    WARNUNG: node nicht gefunden, Syntax-Check wird übersprungen." >&2
else
  node --check "$SRC_DIR/index.js"
  echo "    OK"
fi
echo

# 2. Pflichtdateien prüfen
echo "==> [2/5] Prüfe benötigte Dateien"
for f in manifest.json index.js style.css; do
  if [[ ! -f "$SRC_DIR/$f" ]]; then
    echo "    FEHLER: $SRC_DIR/$f fehlt." >&2
    exit 1
  fi
  echo "    gefunden: $f"
done
echo

# 3. Backup der aktuell installierten Version
echo "==> [3/5] Backup der aktuellen Installation"
if [[ -d "$DEST_DIR" ]]; then
  mkdir -p "$BACKUP_DIR"
  cp -r "$DEST_DIR"/. "$BACKUP_DIR"/ 2>/dev/null || true
  echo "    Backup unter: $BACKUP_DIR"
else
  echo "    Keine bestehende Installation gefunden, überspringe Backup."
fi
echo

# 4. Dateien kopieren
echo "==> [4/5] Kopiere Dateien"
mkdir -p "$DEST_DIR"
cp "$SRC_DIR/manifest.json" "$SRC_DIR/index.js" "$SRC_DIR/style.css" "$DEST_DIR"/
echo "    Kopiert nach $DEST_DIR"
echo

# 5. Spicetify anwenden
if $APPLY; then
  echo "==> [5/5] spicetify apply"
  if command -v spicetify >/dev/null 2>&1; then
    spicetify apply
  else
    echo "    WARNUNG: 'spicetify' nicht im PATH gefunden. Bitte manuell ausführen." >&2
  fi
else
  echo "==> [5/5] Übersprungen (--no-apply gesetzt)"
fi
echo

if $RESTART; then
  echo "==> Starte Spotify (Flatpak) neu"
  if command -v flatpak >/dev/null 2>&1; then
    flatpak kill com.spotify.Client 2>/dev/null || true
    sleep 1
    flatpak run com.spotify.Client >/dev/null 2>&1 &
    disown
    echo "    Spotify wird neu gestartet."
  else
    echo "    WARNUNG: 'flatpak' nicht gefunden, bitte Spotify manuell neu starten." >&2
  fi
else
  echo "==> Fertig. Bitte Spotify neu starten oder DevTools (127.0.0.1:8088) neu laden."
fi

echo
echo "Letzte Backups:"
ls -1t "$BACKUP_ROOT" 2>/dev/null | head -n 5 | sed 's/^/  - /' || true
