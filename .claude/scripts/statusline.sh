#!/bin/bash
# Naveya status line — adapted from RecoveryOS (danielmackay/claude-code-statusline).
# Segments: model/effort/context/cost/rate-limit + dir/branch/dirty.
input=$(cat)

model=$(echo "$input" | jq -r '.model.display_name // "Claude"')
effort=$(echo "$input" | jq -r '.effort.level // empty')
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
total_cost=$(echo "$input" | jq -r '.cost.total_cost_usd // empty')
rl_5h_pct=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty' | awk '{printf "%.0f", $1}')
rl_5h_reset=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')

GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; CYAN='\033[36m'; RESET='\033[0m'

usage_str="0%"
[ -n "$used" ] && usage_str="$(printf "%.0f" "$used")%"

git_str="no branch"
if git rev-parse --git-dir >/dev/null 2>&1; then
  branch=$(git branch --show-current 2>/dev/null)
  [ -z "$branch" ] && branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  staged=$(git diff --cached --numstat 2>/dev/null | wc -l | tr -d ' ')
  modified=$(git diff --numstat 2>/dev/null | wc -l | tr -d ' ')
  git_str="$branch"
  [ "$staged" -gt 0 ] && git_str="${git_str} $(printf "${GREEN}+${staged}${RESET}")"
  [ "$modified" -gt 0 ] && git_str="${git_str} $(printf "${YELLOW}~${modified}${RESET}")"
fi

cost_str=""
[ -n "$total_cost" ] && cost_str=" | 💰 \$$(awk "BEGIN { printf \"%.2f\", $total_cost }")"

make_bar() {
  pct="$1"; width=8; filled=$(( pct * width / 100 )); bar=""
  i=0; while [ $i -lt $filled ]; do bar="${bar}█"; i=$((i+1)); done
  while [ $i -lt $width ]; do bar="${bar}░"; i=$((i+1)); done
  printf "%s" "$bar"
}

rl_str=""
if [ -n "$rl_5h_pct" ]; then
  if [ "$rl_5h_pct" -ge 90 ]; then c="$RED"; elif [ "$rl_5h_pct" -ge 70 ]; then c="$YELLOW"; else c="$GREEN"; fi
  rt=$(date -r "$rl_5h_reset" "+%-I:%M%p" 2>/dev/null || date -d "@$rl_5h_reset" "+%-I:%M%p" 2>/dev/null)
  rl_str=" | ⏱️ $(printf "${c}%s %s%% → %s${RESET}" "$(make_bar "$rl_5h_pct")" "$rl_5h_pct" "$rt")"
fi

effort_str=""
[ -n "$effort" ] && effort_str=" | 💪 $effort"

now_str=$(date "+%-I:%M%p")

printf "🎓 %s%s | 🧠 %s%s%s | 🕐 %s\n🌿 %s" "$model" "$effort_str" "$usage_str" "$cost_str" "$rl_str" "$now_str" "$git_str"
