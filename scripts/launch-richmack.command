#!/usr/bin/env bash

set -u

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${RICHMACK_PORT:-8000}"
URL="http://127.0.0.1:${PORT}"

cd "$PROJECT_DIR" || exit 1
mkdir -p .runtime

if ! command -v python3 >/dev/null 2>&1; then
    osascript -e 'display alert "Python 3 Required" message "Python 3 was not found."'
    exit 1
fi

if ! open -Ra "Google Chrome" >/dev/null 2>&1; then
    osascript -e 'display alert "Google Chrome Required" message "Google Chrome was not found."'
    exit 1
fi

if ! curl -fsS "$URL" >/dev/null 2>&1; then
    nohup python3 -m http.server "$PORT" \
        --bind 127.0.0.1 \
        --directory "$PROJECT_DIR" \
        > "$PROJECT_DIR/.runtime/server.log" 2>&1 &

    echo "$!" > "$PROJECT_DIR/.runtime/server.pid"

    for attempt in {1..30}; do
        curl -fsS "$URL" >/dev/null 2>&1 && break
        sleep 0.2
    done
fi

open -a "Google Chrome" "$URL"
