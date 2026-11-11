#!/usr/bin/env bash
# guard-missing-dataloader.sh — DataLoader enforcement
# Warns when GraphQL types lack DataLoader usage.
# Hook: PreToolUse:Write, PreToolUse:Edit
# Exit 0 = allow (warning only, never blocks)

set -euo pipefail

input=$(cat)

# Graceful no-op: jq is required to parse the stdin JSON hook payload.
command -v jq >/dev/null 2>&1 || exit 0

FILE_PATH=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")
CONTENT=$(printf '%s' "$input" | jq -r '.tool_input.new_string // .tool_input.content // empty' 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ] || [ -z "$CONTENT" ]; then
  exit 0
fi

# Graceful no-op pre-scaffold: this guard targets backend/ GraphQL types.py files.
[ -d backend ] || exit 0

BASENAME=$(basename "$FILE_PATH")

# Only check types.py files
if [[ "$BASENAME" != "types.py" ]]; then
  exit 0
fi

# Check for strawberry-django / Graphene type definitions
if echo "$CONTENT" | grep -qE '(strawberry_django\.type|@strawberry_django|@strawberry\.type|DjangoObjectType|DjangoConnectionField)'; then
  echo "WARNING: Ensure DataLoaders are defined for all nested relations in this GraphQL type to prevent N+1 queries." >&2
fi

exit 0
