#!/usr/bin/env bash
# guard-money-float.sh — Money must be Decimal, never float, in payroll/statutory code.
# PreToolUse on Edit|Write. Targets backend/**/*.py under payroll|statutory|salary|payslip paths.
# Flags: float() coercion of a money-named var, and float literals assigned to
#        amount/salary/pay/gross/net/ctc-style fields.
# Escape hatch: "# money: exempt" on the offending line. Block (exit 2).
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
# Only money-bearing code paths.
echo "$file" | grep -qiE '(payroll|statutory|salary|payslip)' || exit 0
[ -n "$body" ] || exit 0

MONEY_RE='amount|salary|pay|gross|net|ctc|wage|bonus|deduction|allowance|earning|stipend'
# Drop escape-marked lines first.
scan=$(printf '%s' "$body" | grep -vE '#\s*money:\s*exempt' || true)

# float() coercion on a money-named identifier.
h1=$(printf '%s' "$scan" | grep -inE "float\(\s*[a-zA-Z_][a-zA-Z0-9_.]*" | grep -iE "$MONEY_RE" || true)
# float literal assigned to a money-named field/attr.
h2=$(printf '%s' "$scan" | grep -inE "($MONEY_RE)[a-zA-Z0-9_]*\s*[:=]\s*[0-9]+\.[0-9]+" || true)

hits=$(printf '%s\n%s' "$h1" "$h2" | grep -vE '^[[:space:]]*$' || true)
[ -z "$hits" ] && exit 0
echo "BLOCKED (guard-money-float): money must be decimal.Decimal, never float, in payroll/statutory code (rounding = wrong pay/filings). Construct Decimal from strings. Mark '# money: exempt' only for genuinely non-money floats:" >&2
echo "$hits" | head -5 >&2
exit 2
