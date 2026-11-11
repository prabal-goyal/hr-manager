#!/usr/bin/env bash
# guard-hand-rolled-auth.sh — No custom auth code
# Blocks custom JWT/auth implementations. Use Simple JWT + Django auth.
# Hook: PreToolUse:Write, PreToolUse:Edit
# Exit 0 = allow, Exit 2 = block

set -euo pipefail

input=$(cat)

# Graceful no-op: jq is required to parse the stdin JSON hook payload.
command -v jq >/dev/null 2>&1 || exit 0

FILE_PATH=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Graceful no-op pre-scaffold: this guard targets backend/ (Django) auth files.
[ -d backend ] || exit 0

# Allow known auth config files
if echo "$FILE_PATH" | grep -qE 'accounts/middleware\.py'; then
  exit 0
fi
if echo "$FILE_PATH" | grep -qE 'next-?auth'; then
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")
BASENAME_LOWER=$(echo "$BASENAME" | tr '[:upper:]' '[:lower:]')

# Block custom JWT files
if echo "$BASENAME_LOWER" | grep -qE '(custom_jwt|jwt_auth|jwt_middleware)'; then
  echo "BLOCK: Custom JWT implementations are banned. Use djangorestframework-simplejwt." >&2
  exit 2
fi

# Block custom auth backend files
if echo "$BASENAME_LOWER" | grep -qE '(custom_auth|auth_backend)'; then
  echo "BLOCK: Custom auth backends are banned. Use Django built-in auth." >&2
  exit 2
fi

exit 0
