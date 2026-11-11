---
name: compliance-check
description: Use before merging any diff that touches PII, consent, payroll/statutory output, employee documents, logging, analytics, or audit — runs the Naveya DPDP + payroll-correctness + document-governance + tenancy sweep and records a PASS/BLOCK verdict.
---

# Compliance Check

Dispatch to **gordon** (read-only reviewer — gordon never fixes; the owning agent fixes). Sweep the diff for:

1. **DPDP consent:** every new PII-collecting touchpoint captures + stores DPDP-compliant consent (purpose, retention, withdrawal). No data collection without a lawful basis recorded.

2. **PII leakage:** no PII in logs, exceptions, analytics events (analytics must be zero-PII), error responses, or test fixtures with real-looking data. Covered identifiers: **PAN, Aadhaar, UAN, ESIC, bank account, salary, DOB, phone** (`guard-pii-logging`). PII is masked at the API/UI layer, exposed only through permissioned fields.

3. **Append-only audit:** actions on employee/payroll data write immutable audit entries; nothing hard-deletes payroll records, statutory filings, or documents (supersede pattern). The audit trail is append-only.

4. **Payroll & statutory correctness:** money is `Decimal`, never float; statutory rates come from versioned `StatutoryConfig`, never hardcoded; PF/ESI/PT/TDS/gratuity/bonus/LWF calculations are covered by golden-file regression tests pinned to a config version; **maker-checker** is enforced on payroll runs and statutory filings (no single actor can approve their own run).

5. **Document governance:** employees cannot self-write documents — they only **respond to an HR `DocumentUpdateRequest`**, and HR verifies before the record changes (M4 governance). Check that no path lets an employee mutate their own document record directly.

6. **Tenancy escape:** new queries can't escape `tenant_id` scoping (pair with bane's cross-tenant isolation suite for new models); RLS policy present on new tenant-owned tables.

Output: **PASS** or **BLOCK** with findings (file:line). Include them in the report. BLOCK findings are fixed by the owning agent (oracle/riddler/cyborg/green-lantern/nightwing), never by gordon.
