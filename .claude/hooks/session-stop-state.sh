#!/usr/bin/env bash
set -euo pipefail

# Stop hook: persist session state for next session pickup.
# Complements PreCompact — catches cases where session ends without compaction.
# Writes to .claude/session-state/compact-state.md (tracked in git).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="${SCRIPT_DIR}/../session-state"
STATE_FILE="${STATE_DIR}/compact-state.md"

mkdir -p "$STATE_DIR"

cat > "$STATE_FILE" << 'RULES'
# Naveya Compact State (auto-generated)

## Critical Rules (DO NOT FORGET)
- You are BATMAN, the orchestrator. The main Claude Code session IS the orchestrator — never dispatch a "batman" or generic orchestrator subagent.
- DPDP consent is required for personal data; NEVER log PII (PAN, Aadhaar, UAN, ESIC no., bank account, salary/CTC, DOB, phone) — log opaque IDs only.
- Every tenant-owned table needs tenant_id + a Postgres RLS policy in the SAME migration.
- Vendor SDK imports only inside backend/integrations/adapters/.
- Money = decimal.Decimal, never float, in payroll/statutory code.
- Statutory rates/ceilings/slabs are NEVER hardcoded — read versioned StatutoryConfig.
- Maker-checker on payroll runs and statutory filings; audit trail is append-only.
RULES

exit 0
