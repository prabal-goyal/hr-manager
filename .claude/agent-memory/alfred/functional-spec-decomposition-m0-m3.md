---
name: functional-spec-decomposition-m0-m3
description: How the M0-M3 functional specs were decomposed (2026-09-07) — the section template, the enforcement-not-convention rule, and the three data-model gaps found on the critical path
metadata:
  type: project
---

# M0–M3 functional specs (dev start, 2026-09-07)

Wrote `docs/functional-specs/{M0-foundations,M1-organization-tenancy,M2-identity-access,M3-core-hr-people}.md`
— sprints 0–2, the critical path. Mirrored to KB space `Navya` (7b08935b-1739-44dd-a0be-a3070bad16fc) and
linked `specification` to epics NA-13/14/15/16.

**Why:** development phase started; BATMAN files the stories, alfred writes the contracts.

**How to apply:** reuse the eight-section template (Intent · Scope & surfaces · Data model · Behaviour
walk-through · ACs · Testing · Proposed stories · Open questions) for every later module spec, and reuse
the three techniques below.

## Techniques that worked

1. **Specify the enforcement mechanism, not the rule.** "Every tenant table has RLS" is a wish; "ENABLE +
   **FORCE** + `USING`/`WITH CHECK` in the same migration, app role without BYPASSRLS and not the owner,
   plus a reflective conformance test over `pg_class`/`pg_policies` that fails CI" is a spec. Same shape
   used for: append-only (DB trigger + revoked privilege, not a service-layer check), contract overlap
   (Postgres `EXCLUDE` constraint, not validation), and distinct-approver (a CHECK constraint, not an `if`).
   `FORCE ROW LEVEL SECURITY` is the easy miss — without it the table owner bypasses every policy.
2. **Name the four independent places a governance rule is enforced.** `documents.write` not being
   grantable to an Employee is (a) a catalogue `grantable_to_shapes`, (b) mutation validation, (c) a seed
   assertion, (d) a permission check — never a role-name check — at the M4 endpoint. Any one alone is a
   convention.
3. **`[proposed]` every field the spec lacks but a built screen promises**, and route it to Open Questions
   rather than asserting it. The design has already answered several things the spec has not.

## Cross-cutting facts worth keeping

- **The token must carry no permissions.** Resolve server-side per request against a per-user
  `assignment_epoch`. GA-04's built copy says "next token refresh" — that is a ≤15-minute revocation
  window on `payroll.approve`. Flagged, not applied.
- **`is_vacation_staff` must be read AS AT the computation date**, from the contract version in force then
  — never "the employee's current flag". A July accrual re-run in September must see July's answer. This is
  the single most likely way to get critical-path risk #2 wrong, and it is an AC in its own right.
- **Category vs contract for the vacation flag:** spec §6.3 puts it on the contract; HR-08 as built asks it
  at category level. Resolution written: category carries a *proposed default*, contract is authoritative,
  and a category flip becomes a bulk supersession with a stated affected-count and a
  recalculate-vs-grandfather choice with **no default**. Needs a ruling.
- Three data-model gaps on the critical path, all `[proposed]`: **`reports_to`** (M8's approval routing has
  nothing to route on), a **`Permission` catalogue** (no catalogue = nothing to validate `documents.write`
  against), and **effective-dated `Campus.state`** (a flat column silently re-rates historical PT/LWF).

## Estimates filed (unvalidated — check them at sprint close)

M0 18 stories/84 pts · M1 12/52 · M2 20/101 · M3 22/120. Total 72 stories, 357 points across sprints 0–2.
