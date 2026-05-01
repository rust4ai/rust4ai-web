#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[dev]${NC} $1"; }
warn() { echo -e "${YELLOW}[dev]${NC} $1"; }
err() { echo -e "${RED}[dev]${NC} $1"; }

# Check for .env
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    warn ".env not found — copying from .env.example"
    cp .env.example .env
    warn "Edit .env with your real credentials before running again."
    exit 1
  else
    err "No .env or .env.example found"
    exit 1
  fi
fi

# Load .env for this script
set -a
source .env
set +a

# Check required tools
for cmd in cargo node npm; do
  if ! command -v "$cmd" &>/dev/null; then
    err "$cmd is required but not found"
    exit 1
  fi
done

# Install frontend deps if needed
if [ ! -d frontend/node_modules ]; then
  log "Installing frontend dependencies..."
  (cd frontend && npm install)
fi

# Cleanup on exit
cleanup() {
  log "Shutting down..."
  kill $VITE_PID $CARGO_PID 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Start Vite dev server (frontend with HMR)
log "Starting Vite dev server on :5173..."
(cd frontend && npx vite --port 5173) &
VITE_PID=$!

# Build frontend dist for rust-embed (needed for cargo to compile)
log "Building frontend for embedding..."
(cd frontend && npx vite build --mode development) 2>&1 | tail -3

# Start backend with cargo watch (auto-reload on changes)
if command -v cargo-watch &>/dev/null; then
  log "Starting backend with cargo watch on :8080..."
  cargo watch -x 'run --bin rust4ai' -w backend/src -w backend/migrations &
  CARGO_PID=$!
else
  log "Starting backend on :8080... (install cargo-watch for auto-reload)"
  cargo run --bin rust4ai &
  CARGO_PID=$!
fi

log ""
log "=============================="
log "  Frontend:  http://localhost:5173  (HMR)"
log "  Backend:   http://localhost:8080  (API)"
log "  Vite proxies /api -> :8080"
log "=============================="
log ""

# Wait for either to exit
wait
