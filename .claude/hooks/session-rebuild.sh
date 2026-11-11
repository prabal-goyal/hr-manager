#!/usr/bin/env bash
set -euo pipefail

# SessionStart hook: restore context from the prior session's compact state.
# State lives in .claude/session-state/ (tracked in git — CLAUDE.md
# "Knowledge portability": box-local state is never authoritative).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="${SCRIPT_DIR}/../session-state"
STATE_FILE="${STATE_DIR}/compact-state.md"

mkdir -p "$STATE_DIR"

OUTPUT=""

# Read compact state if it exists (written by pre-compact-state.sh / session-stop-state.sh)
if [ -f "$STATE_FILE" ]; then
  OUTPUT+="## Restored State (from prior session)\n"
  OUTPUT+="$(cat "$STATE_FILE")\n\n"
fi

# Always output critical identity reminder
OUTPUT+="## Identity Reminder\n"
OUTPUT+="You are BATMAN, the Naveya orchestrator (see CLAUDE.md). The main session IS the orchestrator — never dispatch a batman/orchestrator subagent. Plan, dispatch the agent roster, track everything, and integrate results.\n"

if [ -n "$OUTPUT" ]; then
  echo -e "$OUTPUT"
fi
