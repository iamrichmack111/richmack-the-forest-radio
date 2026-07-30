#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="Richmack The Forest"
APP_PATH="$HOME/Applications/$APP_NAME.app"
CONTENTS="$APP_PATH/Contents"
MACOS_DIR="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
ICON_SOURCE="$PROJECT_DIR/assets/icons/richmack-the-forest.png"
ICONSET="$PROJECT_DIR/.runtime/Richmack.iconset"

mkdir -p "$MACOS_DIR" "$RESOURCES" "$PROJECT_DIR/.runtime"

if [[ ! -f "$ICON_SOURCE" ]]; then
    echo "Missing icon: $ICON_SOURCE" >&2
    exit 1
fi

rm -rf "$ICONSET"
mkdir -p "$ICONSET"

sips -z 16 16 "$ICON_SOURCE" --out "$ICONSET/icon_16x16.png" >/dev/null
sips -z 32 32 "$ICON_SOURCE" --out "$ICONSET/icon_16x16@2x.png" >/dev/null
sips -z 32 32 "$ICON_SOURCE" --out "$ICONSET/icon_32x32.png" >/dev/null
sips -z 64 64 "$ICON_SOURCE" --out "$ICONSET/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "$ICON_SOURCE" --out "$ICONSET/icon_128x128.png" >/dev/null
sips -z 256 256 "$ICON_SOURCE" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "$ICON_SOURCE" --out "$ICONSET/icon_256x256.png" >/dev/null
sips -z 512 512 "$ICON_SOURCE" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "$ICON_SOURCE" --out "$ICONSET/icon_512x512.png" >/dev/null
sips -z 1024 1024 "$ICON_SOURCE" --out "$ICONSET/icon_512x512@2x.png" >/dev/null

iconutil -c icns "$ICONSET" -o "$RESOURCES/Richmack.icns"

cat > "$MACOS_DIR/RichmackTheForest" <<LAUNCHER
#!/usr/bin/env bash
set -u

PROJECT_DIR="$PROJECT_DIR"
PORT="\${RICHMACK_PORT:-8000}"
URL="http://127.0.0.1:\${PORT}"

cd "\$PROJECT_DIR" || exit 1
mkdir -p .runtime

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

open -a "Google Chrome" "\$URL"
LAUNCHER

chmod +x "$MACOS_DIR/RichmackTheForest"

cat > "$CONTENTS/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>Richmack The Forest</string>
    <key>CFBundleDisplayName</key>
    <string>Richmack: The Forest</string>
    <key>CFBundleIdentifier</key>
    <string>com.richmack.theforest</string>
    <key>CFBundleVersion</key>
    <string>2.2.4</string>
    <key>CFBundleShortVersionString</key>
    <string>2.2.4</string>
    <key>CFBundleExecutable</key>
    <string>RichmackTheForest</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>Richmack.icns</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
PLIST

xattr -dr com.apple.quarantine "$APP_PATH" 2>/dev/null || true
touch "$APP_PATH"

echo
echo "Installed: $APP_PATH"
echo "Open with: open \"$APP_PATH\""
