#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! node -e 'const [maj, min] = process.versions.node.split(".").map(Number); process.exit((maj === 22 && min >= 22) || (maj === 24 && min >= 15) || maj >= 26 ? 0 : 1)' 2>/dev/null; then
  echo "Parcela needs Node 22.22+, 24.15+ or 26+ (found $(node --version 2>/dev/null || echo 'no node'))."
  echo "Download a supported release for your OS from https://nodejs.org/en/download"
  exit 1
fi

echo "=== Parcela Setup ==="

echo
echo "-- Backend --"
if [[ ! -d backend/venv ]]; then
  echo "Creating virtual environment..."
  python3 -m venv backend/venv
fi
echo "Installing Python dependencies..."
backend/venv/bin/pip install -q -r backend/requirements.txt
echo "Backend ready."

echo
echo "-- Frontend --"
echo "Installing Node dependencies..."
(cd frontend && npm install --no-fund --no-audit)
echo "Frontend ready."

echo
echo "-- Playwright browser (E2E tests only, ~550MB in the shared Playwright cache) --"
if [[ -z "${INSTALL_BROWSER:-}" ]]; then
  echo "Skipped. Everything but the E2E tests works without it."
  echo "To run them:  INSTALL_BROWSER=1 ./scripts/setup.sh"
elif (cd frontend && npx playwright install chromium); then
  echo "Chromium ready."
else
  echo "Chromium download failed — the app and the unit tests are unaffected."
  echo "For the E2E tests, retry later with:  cd frontend && npx playwright install chromium"
fi

echo
echo "=== Setup complete ==="
echo "Start both servers with:  ./scripts/dev.sh"
