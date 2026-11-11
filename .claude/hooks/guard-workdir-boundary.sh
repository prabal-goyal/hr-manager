#!/bin/bash
# guard-workdir-boundary.sh — PreToolUse(Bash): block filesystem EXPLORATION
# outside the repository tree. Agents that think something is missing
# must check `git log main` / report BLOCKED — not go hunting through ~/.
# Toolchain caches (.nvm, .claude, .pub-cache, fvm, npm, dart, gradle) stay
# usable; executing tools from those paths is fine — listing/searching home
# and other projects is not.
input=$(cat)
command -v jq >/dev/null 2>&1 || exit 0
cmd=$(echo "$input" | jq -r '.tool_input.command // empty')
[ -n "$cmd" ] || exit 0

# Resolve paths at runtime so the guard works on any machine and inside worktrees.
# Both spellings are matched because Git Bash on Windows prints `E:/x` from git
# but `/e/x` from pwd.
repo_root=$(git -C "${CLAUDE_PROJECT_DIR:-$PWD}" rev-parse --show-toplevel 2>/dev/null) || repo_root="${CLAUDE_PROJECT_DIR:-$PWD}"
repo_posix=$(cd "$repo_root" 2>/dev/null && pwd) || repo_posix="$repo_root"
re_escape() { printf '%s' "$1" | sed 's/[].[*^$(){}?+|\\]/\\&/g'; }

REPO_RE="($(re_escape "$repo_root")|$(re_escape "$repo_posix"))"
HOME_RE="($(re_escape "$HOME")|~|\\\$HOME)"
ALLOW_RE='(\.nvm|\.claude|\.pub-cache|\.npm|\.cache|fvm|\.dart|\.gradle|\.cocoapods|Library/(Android|Developer)|\.local)'

# 1) Exploration commands (find/ls/grep/rg/cat/tree/du) aimed at home.
if echo "$cmd" | grep -qE "(^|[;&|]|[[:space:]])(find|ls|grep|rg|cat|head|tail|tree|du)[[:space:]][^|;&]*${HOME_RE}(/[^[:space:]]*)?([[:space:]]|\$)"; then
  targets=$(echo "$cmd" | grep -oE "${HOME_RE}(/[^[:space:]\"']*)?")
  bad=0
  while IFS= read -r t; do
    [ -z "$t" ] && continue
    echo "$t" | grep -qE "^(${REPO_RE}|${HOME_RE}/${ALLOW_RE})" || bad=1
  done <<< "$targets"
  if [ "$bad" = 1 ]; then
    echo "BLOCKED (guard-workdir-boundary): filesystem exploration outside the repository. Work ONLY inside the Naveya repo and its .claude/worktrees. If files seem missing, your worktree base is stale — check 'git log main' and report BLOCKED; never search ~/ or other projects." >&2
    exit 2
  fi
fi

# 2) cd to absolute/home paths outside the repo tree (scratch dirs under /tmp allowed).
if echo "$cmd" | grep -qE "(^|[;&|]|[[:space:]])cd[[:space:]]+[\"']?(/|~|\\\$HOME|[A-Za-z]:)"; then
  if ! echo "$cmd" | grep -qE "cd[[:space:]]+[\"']?(${REPO_RE}|/private/tmp|/tmp|\\\$CLAUDE|\\\$\{?TMPDIR)"; then
    echo "BLOCKED (guard-workdir-boundary): cd outside the repository tree. Stay inside the Naveya repo (+ worktrees) or the session scratch dir." >&2
    exit 2
  fi
fi
exit 0
