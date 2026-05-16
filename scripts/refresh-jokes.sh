#!/usr/bin/env bash
# Re-fetch the dad joke database from icanhazdadjoke.com.
# Writes the result to BOTH backend/jokes.json (authoritative, served by the API)
# AND frontend/jokes.json (offline fallback bundled with the static site).
#
# Run this from the project root:
#   ./scripts/refresh-jokes.sh

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

echo "Fetching jokes from icanhazdadjoke.com..."
seq 1 30 | xargs -P 8 -I{} curl -s \
  -H "Accept: application/json" \
  -H "User-Agent: dadjokesmachine.com (refresh script)" \
  "https://icanhazdadjoke.com/search?page={}&limit=30" \
  -o "$TMP_DIR/page_{}.json"

jq -s '[.[].results[] | {id, joke}] | unique_by(.id)' "$TMP_DIR"/page_*.json \
  > "$PROJECT_ROOT/backend/jokes.json"

cp "$PROJECT_ROOT/backend/jokes.json" "$PROJECT_ROOT/frontend/jokes.json"

COUNT=$(jq 'length' "$PROJECT_ROOT/backend/jokes.json")
echo "Wrote $COUNT jokes to backend/jokes.json and frontend/jokes.json"
