#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
PORT="${1:-8000}"
echo
echo "RICHMACK: THE FOREST"
echo "Open http://localhost:${PORT}"
echo
python3 -m http.server "$PORT"
