#!/usr/bin/env bash
# Stop-hook nudge (never blocks): code changed recently but no knowledge file did → remind
# to run the feedback→knowledge loop (root CLAUDE.md). Part of the knowledge-evolution mandate.
command -v git >/dev/null 2>&1 || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0
recent=$( { git log --since="4 hours ago" --name-only --pretty=format: 2>/dev/null; git diff --name-only HEAD 2>/dev/null; } | sort -u)
code=$(printf '%s\n' "$recent" | grep -cE '^(backend|frontend|app)/' || true)
know=$(printf '%s\n' "$recent" | grep -cE '^(\.claude/agent-memory/|docs/learnings/|docs/adr/|CLAUDE\.md)' || true)
if [ "${code:-0}" -gt 0 ] && [ "${know:-0}" -eq 0 ]; then
  echo "REMINDER (knowledge-evolution): code changed this session but no agent memory / learnings / ADR / CLAUDE.md was updated. If the user gave feedback or a review found a defect class, route it now — agent-scoped: .claude/agent-memory/<agent>/MEMORY.md · project-wide: docs/learnings/ · rule-level: CLAUDE.md/ADR." >&2
fi
exit 0
