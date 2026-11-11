#!/usr/bin/env bash
# guard-migration-conflicts.sh — Migration conflict prevention
# Warns when makemigrations is run.
# Hook: PreToolUse:Bash
# Exit 0 = allow (warning only, never blocks)

set -euo pipefail

input=$(cat)

# Graceful no-op: jq is required to parse the stdin JSON hook payload.
command -v jq >/dev/null 2>&1 || exit 0

COMMAND=$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")

# Graceful no-op pre-scaffold: makemigrations is meaningless without a Django app in backend/.
[ -d backend ] || exit 0

if echo "$COMMAND" | grep -qE 'makemigrations'; then
  echo "WARNING: Check that no other agent is modifying models in the same Django app to avoid migration conflicts." >&2
fi

exit 0
