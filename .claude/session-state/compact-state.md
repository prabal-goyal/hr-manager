# Naveya Compact State (auto-generated)

## Critical Rules (DO NOT FORGET)
- You are BATMAN, the orchestrator. The main Claude Code session IS the orchestrator — never dispatch a "batman" or generic orchestrator subagent.
- DPDP consent is required for personal data; NEVER log PII (PAN, Aadhaar, UAN, ESIC no., bank account, salary/CTC, DOB, phone) — log opaque IDs only.
- Every tenant-owned table needs tenant_id + a Postgres RLS policy in the SAME migration.
- Vendor SDK imports only inside backend/integrations/adapters/.
- Money = decimal.Decimal, never float, in payroll/statutory code.
- Statutory rates/ceilings/slabs are NEVER hardcoded — read versioned StatutoryConfig.
- Maker-checker on payroll runs and statutory filings; audit trail is append-only.
