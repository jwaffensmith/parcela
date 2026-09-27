#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d backend/venv || ! -d frontend/node_modules ]]; then
  echo "Dependencies are missing. Run ./scripts/setup.sh first."
  exit 1
fi

cleanup() {
  echo
  echo "Shutting down..."
  kill "$API_PID" ${UI_PID:+"$UI_PID"} 2>/dev/null || true
  wait "$API_PID" ${UI_PID:+"$UI_PID"} 2>/dev/null || true
}

(cd backend && exec venv/bin/uvicorn main:app --reload --port 8000) &
API_PID=$!
trap cleanup EXIT INT TERM

for _ in $(seq 20); do
  if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

(cd frontend && exec npm run dev) &
UI_PID=$!

echo
echo "  UI:   http://localhost:5173"
echo "  API:  http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"
echo
echo "Press Ctrl+C to stop."

wait
