#!/usr/bin/env bash
set -euo pipefail
PORT="${RICHMACK_PORT:-8080}"
docker compose up --build -d
URL="http://127.0.0.1:${PORT}"
echo "Richmack: The Forest is running at: $URL"
if [[ "$(uname -s)" == "Darwin" ]]; then
  open -a "Google Chrome" "$URL"
elif command -v google-chrome >/dev/null 2>&1; then
  google-chrome "$URL" >/dev/null 2>&1 &
elif command -v chromium >/dev/null 2>&1; then
  chromium "$URL" >/dev/null 2>&1 &
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 &
fi
