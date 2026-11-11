#!/usr/bin/env bash
# Block vendor SDK/client imports outside backend/integrations/adapters/ (spec §5, SOW abstraction AC).
# Naveya vendors: biometric (zkteco/essl/matrix/realtime/spectra), SMS/WhatsApp (msg91/gupshup/twilio),
# accounting (tally), bank/NEFT (razorpay), statutory portals (EPFO/ESIC/TRACES).
# PreToolUse on Edit|Write.
command -v jq >/dev/null 2>&1 || exit 0
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
body=$(printf '%s' "$input" | jq -r '.tool_input.content // .tool_input.new_string // empty')
case "$file" in
  backend/integrations/adapters/*) exit 0 ;;
  backend/*.py) ;;
  *) exit 0 ;;
esac
VENDOR_RE='zkteco|essl|matrix|realtime|spectra|msg91|gupshup|twilio|tally|razorpay|epfo|esic|traces'
hits=$(printf '%s' "$body" | grep -inE "^\s*(import|from)\s+.*(${VENDOR_RE})" || true)
[ -z "$hits" ] && exit 0
echo "BLOCKED (guard-vendor-isolation): vendor import outside integrations/adapters/. Depend on the port interface (backend/integrations/ports.py) instead:" >&2
echo "$hits" | head -5 >&2
exit 2
