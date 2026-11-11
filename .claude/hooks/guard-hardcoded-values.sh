#!/usr/bin/env bash
# guard-hardcoded-values.sh — No hardcoded config
# Blocks hardcoded URLs and API keys in source files.
# Hook: PreToolUse:Write, PreToolUse:Edit
# Exit 0 = allow, Exit 2 = block

set -euo pipefail

input=$(cat)

# Graceful no-op: jq is required to parse the stdin JSON hook payload.
command -v jq >/dev/null 2>&1 || exit 0

FILE_PATH=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")
CONTENT=$(printf '%s' "$input" | jq -r '.tool_input.new_string // .tool_input.content // empty' 2>/dev/null || echo "")

if [ -z "$CONTENT" ] || [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Graceful no-op pre-scaffold: nothing to check until backend/ or frontend/ has code.
[ -d backend ] || [ -d frontend ] || exit 0

# Allow test files, .env.example, docs, CLAUDE.md
if echo "$FILE_PATH" | grep -qE '(test_|_test\.|\.spec\.|tests/|\.env\.example|\.md$|CLAUDE\.md)'; then
  exit 0
fi

# Only check Python and TypeScript source files
if ! echo "$FILE_PATH" | grep -qE '\.(py|ts|tsx|js|jsx)$'; then
  exit 0
fi

# Block hardcoded localhost URLs (allow comments and config constants)
if echo "$CONTENT" | grep -qE 'https?://localhost:[0-9]+' | head -1; then
  # Check it's not in a comment or env default
  if echo "$CONTENT" | grep -vE '^\s*(#|//|/\*|\*|os\.environ|process\.env)' | grep -qE 'https?://localhost:[0-9]+'; then
    echo "BLOCK: Hardcoded localhost URL detected. Use environment variables." >&2
    exit 2
  fi
fi

# Block API key patterns
if echo "$CONTENT" | grep -qE '(sk_live_|pk_live_|AKIA[A-Z0-9]{16})'; then
  echo "BLOCK: Possible API key/secret detected in source code. Use environment variables." >&2
  exit 2
fi

exit 0
