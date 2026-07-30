#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_ID="richmack-the-forest"
APP_NAME="Richmack: The Forest"

BIN_DIR="$HOME/.local/bin"
APP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
DESKTOP_DIR="$HOME/Desktop"

mkdir -p "$BIN_DIR" "$APP_DIR" "$ICON_DIR"

if [[ ! -f "$PROJECT_DIR/assets/icons/richmack-the-forest.png" ]]; then
    echo "Missing icon: $PROJECT_DIR/assets/icons/richmack-the-forest.png" >&2
    exit 1
fi

cp "$PROJECT_DIR/assets/icons/richmack-the-forest.png" \
   "$ICON_DIR/$APP_ID.png"

cat > "$BIN_DIR/$APP_ID" <<LAUNCHER
#!/usr/bin/env bash
set -u

PROJECT_DIR="$PROJECT_DIR"
PORT="\${RICHMACK_PORT:-8000}"
URL="http://127.0.0.1:\${PORT}"

cd "\$PROJECT_DIR" || exit 1
mkdir -p .runtime

if ! command -v python3 >/dev/null 2>&1; then
    command -v notify-send >/dev/null 2>&1 && \
        notify-send "Richmack: The Forest" "Python 3 is required."
    exit 1
fi

if ! curl -fsS "\$URL" >/dev/null 2>&1; then
    nohup python3 -m http.server "\$PORT" \
        --bind 127.0.0.1 \
        --directory "\$PROJECT_DIR" \
        > "\$PROJECT_DIR/.runtime/server.log" 2>&1 &

    echo "\$!" > "\$PROJECT_DIR/.runtime/server.pid"

    for attempt in {1..30}; do
        curl -fsS "\$URL" >/dev/null 2>&1 && break
        sleep 0.2
    done
fi

if command -v google-chrome >/dev/null 2>&1; then
    google-chrome "\$URL" >/dev/null 2>&1 &
elif command -v google-chrome-stable >/dev/null 2>&1; then
    google-chrome-stable "\$URL" >/dev/null 2>&1 &
elif command -v chromium >/dev/null 2>&1; then
    chromium "\$URL" >/dev/null 2>&1 &
elif command -v chromium-browser >/dev/null 2>&1; then
    chromium-browser "\$URL" >/dev/null 2>&1 &
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "\$URL" >/dev/null 2>&1 &
else
    echo "Install Google Chrome, Chromium, or xdg-utils." >&2
    exit 1
fi
LAUNCHER

chmod +x "$BIN_DIR/$APP_ID"

cat > "$APP_DIR/$APP_ID.desktop" <<DESKTOP
[Desktop Entry]
Version=1.0
Type=Application
Name=$APP_NAME
Comment=Drive through the haunted Richmack forest
Exec=$BIN_DIR/$APP_ID
Icon=$APP_ID
Terminal=false
Categories=Game;
StartupNotify=true
DESKTOP

chmod +x "$APP_DIR/$APP_ID.desktop"

if [[ -d "$DESKTOP_DIR" ]]; then
    cp "$APP_DIR/$APP_ID.desktop" "$DESKTOP_DIR/$APP_ID.desktop"
    chmod +x "$DESKTOP_DIR/$APP_ID.desktop"
    if command -v gio >/dev/null 2>&1; then
        gio set "$DESKTOP_DIR/$APP_ID.desktop" metadata::trusted true 2>/dev/null || true
    fi
fi

command -v update-desktop-database >/dev/null 2>&1 && \
    update-desktop-database "$APP_DIR" 2>/dev/null || true

command -v gtk-update-icon-cache >/dev/null 2>&1 && \
    gtk-update-icon-cache "$HOME/.local/share/icons/hicolor" 2>/dev/null || true

echo
echo "$APP_NAME installed."
echo "Application menu entry: $APP_DIR/$APP_ID.desktop"
echo "Launcher command: $APP_ID"
