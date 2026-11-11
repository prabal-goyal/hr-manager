#!/usr/bin/env bash
# WARN (never block) on hardcoded user-facing strings (spec §7/§9: zero hardcoded copy).
# Flutter: Text('...') in app/**.dart. Frontend: JSX text + copy-bearing attributes in frontend/**.tsx|jsx.
# PostToolUse on Edit|Write.
command -v jq >/dev/null 2>&1 || exit 0
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
body=$(printf '%s' "$input" | jq -r '.tool_input.content // .tool_input.new_string // empty')
case "$file" in
  app/*.dart)
    hits=$(printf '%s' "$body" | grep -nE "Text\(\s*['\"][A-Za-z]{3,}" | grep -v 'AppLocalizations\|context.l10n\|// i18n-exempt' || true)
    fix="use ARB/AppLocalizations" ;;
  frontend/*.tsx|frontend/*.jsx)
    hits=$(printf '%s' "$body" | grep -nE '(>[[:space:]]*[A-Za-z][A-Za-z .,!?'"'"']{2,}<|(placeholder|title|label|alt|aria-label)=["'"'"'][A-Za-z]{3,})' | grep -v 't(\|i18n-exempt' || true)
    fix="route copy through src/lib/i18n.ts t()" ;;
  *) exit 0 ;;
esac
[ -z "$hits" ] && exit 0
echo "WARN (guard-i18n-strings): hardcoded user-facing copy — $fix (Hindi+English mandate). Mark 'i18n-exempt' only for non-user-facing strings:" >&2
echo "$hits" | head -5 >&2
exit 0
