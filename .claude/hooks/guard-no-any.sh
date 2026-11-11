#!/usr/bin/env bash
set -euo pipefail

# PreToolUse (Edit|Write) hook — Naveya correctness guard
# Enforces total type safety in TypeScript files (frontend/CLAUDE.md: "No `any`").
#
# Blocks:
#   : any
#   as any
#   <any>  (generic parameter)
#   // @ts-ignore
#   // @ts-nocheck
#
# Allowed (with warnings):
#   // @ts-expect-error <non-empty comment>  — must include a comment
#   unknown — preferred over any; always allowed
#
# Skipped:
#   .md, .mdx, .json, .yaml — docs and config files may reference these strings without introducing them into code
#   test files (*.test.ts, *.test.tsx, *.spec.ts) — WARN only, not BLOCK, because
#     test authors sometimes need `as any` for mock boundaries; encouraged to
#     fix but not blocked.

input=$(cat)

# Graceful no-op: jq is required to parse tool input, and there's nothing to
# scan pre-scaffold (frontend/ has no TypeScript code yet).
command -v jq >/dev/null 2>&1 || exit 0
[ -d frontend ] || exit 0

tool_name=$(echo "$input" | jq -r '.tool_name // ""' 2>/dev/null || echo "")

if [ "$tool_name" != "Edit" ] && [ "$tool_name" != "Write" ]; then
  exit 0
fi

file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")
new_content=$(echo "$input" | jq -r '.tool_input.new_string // .tool_input.content // ""' 2>/dev/null || echo "")

# Only scan TS source files
case "$file_path" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

# Test files — warn only
is_test=0
case "$file_path" in
  *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) is_test=1 ;;
  */tests/*|*/__tests__/*) is_test=1 ;;
esac

# Check patterns. grep returns 0 on match; we treat match as violation.
violations=""

# `: any` — type annotation
if echo "$new_content" | grep -nE ':\s*any\b' >/dev/null; then
  violations+="  - Type annotation ': any' — use 'unknown' or a specific type instead.\n"
fi

# `as any` — cast
if echo "$new_content" | grep -nE '\bas\s+any\b' >/dev/null; then
  violations+="  - Type cast 'as any' — use a type guard, zod parse, or 'as unknown' + narrow.\n"
fi

# `<any>` — generic parameter (e.g., Array<any>, Promise<any>)
if echo "$new_content" | grep -nE '<\s*any\s*[,>]' >/dev/null; then
  violations+="  - Generic parameter '<any>' — specify a concrete type or use 'unknown'.\n"
fi

# // @ts-ignore
if echo "$new_content" | grep -nE '//\s*@ts-ignore' >/dev/null; then
  violations+="  - '// @ts-ignore' — use '// @ts-expect-error <issue-link>' instead.\n"
fi

# // @ts-nocheck
if echo "$new_content" | grep -nE '//\s*@ts-nocheck' >/dev/null; then
  violations+="  - '// @ts-nocheck' — banned in production code.\n"
fi

# @ts-expect-error WITHOUT a following comment is also not allowed
if echo "$new_content" | grep -nE '//\s*@ts-expect-error\s*$' >/dev/null; then
  violations+="  - '// @ts-expect-error' without a comment — include an issue link.\n"
fi

if [ -z "$violations" ]; then
  exit 0
fi

# Emit findings
if [ "$is_test" -eq 1 ]; then
  # Test files — warn, don't block
  echo "WARN [guard-no-any] type-safety violations in test file (not blocking):" >&2
  printf "%b" "$violations" >&2
  exit 0
fi

# Production code — block
echo "BLOCKED [guard-no-any] total type safety violation in $file_path:" >&2
printf "%b" "$violations" >&2
echo "" >&2
echo "See frontend/CLAUDE.md (\"No \`any\`\") and docs/adr/ for the type-safety rule." >&2
exit 2
