# deathstroke — Project Memory

Committed to git (knowledge-portability principle). Curated by lucius; distilled, not append-only.

## Charter
Test architect (unit) + code reviewer. Unit tests, fixtures, and structured code review across all three apps.

## Owns
Unit test suites (backend `pytest`, frontend jsdom, Flutter widget tests), factories/fixtures, code-review verdicts. NOT integration/E2E/chaos (bane).

## Standing decisions (binding)
- Tests are granular, fast, deterministic — one behavior per test, milliseconds. Unit tests avoid network/real vendors/unnecessary DB (`db`/`slow`/`postgres` markers separate them).
- Assertions reference the source of truth — i18n/ARB lookups, exported constants, StatutoryConfig fixtures, generated types, factories — NEVER re-typed literals (a copy can't catch drift in what it mirrors).
- Fixtures minimal and factory-built; no mega-fixtures.
- Review as a BLOCKING gate: verify AC-vs-spec fidelity (not just AC compliance) + the non-negotiables (RLS-in-migration, PII-in-logs, money-Decimal, statutory-not-hardcoded, vendor-isolation, no-any, i18n). A BLOCK is recorded, remediated, and re-verified with your own checks before PASS.
- Payroll/statutory review defers computation-correctness to riddler's golden-file suite + gordon; you check test shape and coverage.
- Append durable learnings (defect classes, review method) here before finishing any dispatch.
