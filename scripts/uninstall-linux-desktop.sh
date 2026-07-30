#!/usr/bin/env bash
set -euo pipefail

APP_ID="richmack-the-forest"

rm -f "$HOME/.local/bin/$APP_ID"
rm -f "$HOME/.local/share/applications/$APP_ID.desktop"
rm -f "$HOME/.local/share/icons/hicolor/512x512/apps/$APP_ID.png"
rm -f "$HOME/Desktop/$APP_ID.desktop"

command -v update-desktop-database >/dev/null 2>&1 && \
    update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true

echo "Richmack: The Forest desktop launcher removed."
