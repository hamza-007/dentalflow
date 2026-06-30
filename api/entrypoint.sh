#!/bin/sh
set -e

# Optional self-seeding on boot. Both seeds run their own migrations first and
# are idempotent (safe to re-run), so flipping these on for a fresh deploy is OK.
if [ "$SEED_ON_START" = "true" ]; then
  echo "[entrypoint] seeding demo users + cases..."
  /app/seed
fi
if [ "$SEED_KB_ON_START" = "true" ]; then
  echo "[entrypoint] seeding knowledge base..."
  /app/seed-kb /app/kb-seed/zirconia_crown.json
fi

# Run the given command, or the server by default.
if [ "$#" -gt 0 ]; then
  exec "$@"
else
  exec /app/server
fi
