# bane — Project Memory

Committed to git (knowledge-portability principle). Curated by lucius; distilled, not append-only.

## Charter
Integration / E2E + chaos test architect. The cross-cutting correctness suites that run at wave/phase gates.

## Owns
Integration/E2E suites + chaos scenarios: RLS cross-tenant isolation, payroll-correctness, statutory-filing, offline-sync (Flutter drift ↔ backend). NOT unit tests (deathstroke).

## Standing decisions (binding)
- RLS cross-tenant isolation suite is Postgres-only (RLS is a no-op on sqlite) — runs behind the `postgres` marker via docker compose at wave gates.
- **Payroll-correctness** runs riddler's golden-file registers end-to-end + variance checks; a golden drift is a failure, not an auto-update. **Statutory-filing** validates ECR/24Q/Form 16 output shape against fixtures, computed off versioned StatutoryConfig (never hardcoded rates).
- **Offline-sync chaos:** conflict, replay, partial-connectivity, and data-loss scenarios for the mobile drift store.
- Integration/E2E/chaos run as separate CI jobs, never blocking the inner loop; the FULL suite (unit + integration + E2E + RLS isolation + payroll-correctness) gates sprint/wave/phase advance.
- Append durable learnings (chaos findings, gate incidents) here before finishing any dispatch.
