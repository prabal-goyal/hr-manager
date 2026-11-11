#!/usr/bin/env bash
# Block Django migrations that create tenant tables without an RLS policy (spec §4).
# PreToolUse on Edit|Write. Escape hatch: "# rls: exempt" comment for genuinely global tables.
command -v jq >/dev/null 2>&1 || exit 0
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
body=$(printf '%s' "$input" | jq -r '.tool_input.content // .tool_input.new_string // empty')
case "$file" in
  */migrations/*.py) ;;
  *) exit 0 ;;
esac
printf '%s' "$body" | grep -q 'CreateModel' || exit 0
if printf '%s' "$body" | grep -qE 'ENABLE ROW LEVEL SECURITY|CREATE POLICY|# rls: exempt'; then
  exit 0
fi
echo "BLOCKED (guard-rls-policy): migration creates a table without an RLS policy. Add RunSQL enabling RLS + policy in the SAME migration (tenant_id-scoped), or mark '# rls: exempt' for a genuinely global table (see backend/CLAUDE.md)." >&2
exit 2
