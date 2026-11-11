#!/usr/bin/env bash
# Block log/print statements that mention PII field names (DPDP / spec: no PII in logs/analytics).
# Naveya PII: PAN, Aadhaar, UAN, ESIC no., bank account, salary/CTC, DOB, phone.
# PreToolUse on Edit|Write. Applies to backend python, frontend ts/tsx, app dart.
command -v jq >/dev/null 2>&1 || exit 0
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
body=$(printf '%s' "$input" | jq -r '.tool_input.content // .tool_input.new_string // empty')
case "$file" in
  *.py|*.ts|*.tsx|*.dart) ;;
  *) exit 0 ;;
esac
LOG_RE='logger\.|logging\.|print\(|console\.(log|warn|error)|debugPrint\('
PII_RE='\bpan\b|aadhaar|aadhar|\buan\b|esic|esi_no|bank_account|account_number|account_no|ifsc|salary|\bctc\b|gross_pay|net_pay|date_of_birth|\bdob\b|phone|mobile'
hits=$(printf '%s' "$body" | grep -inE "$LOG_RE" | grep -iE "$PII_RE" || true)
[ -z "$hits" ] && exit 0
echo "BLOCKED (guard-pii-logging): log statement references PII fields (PAN/Aadhaar/UAN/ESIC/bank/salary/CTC/DOB/phone). Log opaque IDs, never employee PII (DPDP):" >&2
echo "$hits" | head -5 >&2
exit 2
