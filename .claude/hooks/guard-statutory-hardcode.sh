#!/usr/bin/env bash
# guard-statutory-hardcode.sh — statutory rates/ceilings/slabs must come from versioned
# StatutoryConfig, never hardcoded. PreToolUse on Edit|Write.
# Targets backend/*.py OUTSIDE statutory config / migrations / fixtures / tests.
# Flags hardcoded statutory numbers (e.g. 0.12, 12%, 15000, 21000, 0.0075, 0.0325)
# on lines naming pf/esi/pt/tds/gratuity/ceiling/slab identifiers.
# Escape hatch: "# statutory: exempt" on the offending line. Block (exit 2).
command -v jq >/dev/null 2>&1 || exit 0
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
body=$(printf '%s' "$input" | jq -r '.tool_input.content // .tool_input.new_string // empty')
[ -n "$file" ] || exit 0

# Graceful no-op pre-scaffold: nothing to scan until backend/ exists.
[ -d backend ] || exit 0

case "$file" in
  backend/*.py) ;;
  *) exit 0 ;;
esac
# Skip the legitimate homes of statutory numbers.
case "$file" in
  *statutory_config*|*statutoryconfig*|*/statutory/config*|*/migrations/*|*/fixtures/*|*test_*|*_test.py|*/tests/*) exit 0 ;;
esac
[ -n "$body" ] || exit 0

STAT_RE='pf|epf|eps|edli|esi|esic|\bpt\b|ptax|professional_tax|tds|gratuity|ceiling|slab|contribution'
NUM_RE='(^|[^a-zA-Z0-9_.])(0\.[0-9]+|[0-9]{4,}|[0-9]{1,2}[[:space:]]*%)'
# Drop escape-marked lines first.
scan=$(printf '%s' "$body" | grep -vE '#\s*statutory:\s*exempt' || true)
# A statutory identifier AND a rate/ceiling/percent literal on the same line.
hits=$(printf '%s' "$scan" | grep -inE "$STAT_RE" | grep -E "$NUM_RE" || true)
[ -z "$hits" ] && exit 0
echo "BLOCKED (guard-statutory-hardcode): hardcoded statutory rate/ceiling/slab. Rates change by FY and must be auditable — read versioned StatutoryConfig instead of a literal. Mark '# statutory: exempt' only if this is genuinely not a statutory constant:" >&2
echo "$hits" | head -5 >&2
exit 2
