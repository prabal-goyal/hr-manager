---
name: payroll-statutory
description: Use when scaffolding or changing any Indian statutory payroll calculation in Naveya — PF, ESI, PT, TDS, gratuity, bonus, or LWF. Reads versioned StatutoryConfig, uses Decimal money, and pins golden-file regression tests per config version. Dispatch riddler + deathstroke + gordon.
---

# Payroll & Statutory Calculator (versioned, Decimal, golden-file)

Dispatch **riddler** (implement) → **deathstroke** (review) → **gordon** (`/compliance-check`). Payroll math is never "trivial" — a wrong salary or statutory filing is a critical defect. One unit of work, per the payroll/statutory modules in `docs/development-specification.md`.

## Non-negotiables

1. **Money is `Decimal`, never float.** Every amount, rate, and intermediate is `Decimal`. Rounding is **explicit and documented** at each step (statutory rules mandate specific rounding — e.g. PF/ESI rounding to the nearest rupee per the scheme; TDS per the Income Tax rules). Never rely on implicit float behavior.

2. **Rates come from versioned `StatutoryConfig`, never hardcoded.** PF/ESI wage ceilings and rates, PT slabs (state-specific), TDS slabs/cess, gratuity formula constants, bonus min/max and eligibility ceiling, and LWF amounts (state-specific) are all read from a `StatutoryConfig` row keyed by (component, state/jurisdiction, effective-from … effective-to). A calculation always resolves the config **effective for the pay period being computed** — back-dated runs use the historically-correct version, never today's.

## Scaffold

For each statutory component (**PF, ESI, PT, TDS, gratuity, bonus, LWF**):

1. **Config model:** `StatutoryConfig` entries are append-only and versioned — new rates create a new effective-dated row, never mutate an old one. Global/reference config is `# rls: exempt` with justification; tenant overrides (if any) are tenant-scoped (see rls-model skill).

2. **Pure calculator function:** a side-effect-free function `calc_<component>(inputs, config) -> Decimal / breakdown` that takes explicit inputs (wages, days, state, etc.) and the resolved `StatutoryConfig`, and returns a fully broken-down result (employee share, employer share, taxable base, rounding applied). No DB access inside the calculator — the resolver/service loads the config and passes it in. This keeps it deterministic and golden-testable.

3. **Golden-file regression tests, per config version:** for each component AND each `StatutoryConfig` version, a golden fixture pins representative inputs → expected outputs (multiple wage bands, edge cases: at ceiling, below floor, exempt, mid-slab, state variants). The golden values are the authority; a calculation change that alters a golden value is a finding to justify, not silently accept. New config version ⇒ new golden set pinned to that version; old versions' goldens stay green (back-dated correctness). Store fixtures alongside the tests (e.g. `backend/payroll/tests/golden/<component>/<config-version>/…`).

4. **Maker-checker + audit:** any payroll run or statutory filing output goes through maker-checker (the actor who runs cannot approve their own run) and writes append-only audit entries. Never hard-delete a run or filing (supersede pattern).

5. **No PII in logs:** never log salary, PAN, UAN, ESIC, or bank details (`guard-pii-logging`). Filing exports that must carry these go through the integration broker/outbox (see vendor-adapter: EPFO/ESIC/TRACES), never ad-hoc logging.

## Gate
- **riddler** implements calculator + config resolution + golden tests (TDD: write the golden case first).
- **deathstroke** reviews: Decimal throughout, config-sourced rates, rounding correctness, effective-dating for back-dated runs, golden coverage, maker-checker, append-only audit.
- **gordon** runs `/compliance-check` (payroll/statutory correctness + PII + audit + document governance).
- Register any new statutory component or config schema change via an ADR in `docs/adr/`.
