---
name: screen-inventory-decomposition
description: How Naveya's 118-screen MVP inventory was decomposed per role, the splitting rules that worked, and where the count actually sits
metadata:
  type: project
---

# Screen inventory (docs/screen-inventory.md, 2026-08-11)

**Fact:** `docs/screen-inventory.md` is the authoritative role→screen→action map. **118 distinct MVP
screens** (+1 P2, +1 Later). It supersedes `design/canvas.jsx`'s ~50 frames, which covered 42% of scope.

**Why:** we were designing screens by intuition and discovering omissions late. The user warned the canvas
count was not authoritative and asked for a spec-derived answer.

**How to apply:** cite screen codes (`EMP-02`, `HR-09`, `AC-02`) in work items instead of prose screen
names; every work item's screen should already exist here, and if it doesn't, that's a scope question, not
a design decision.

## Per-role MVP counts (owned, not reachable)

Shared 4 · Public/token 4 · **Employee 19 · Dept Head 9 · Principal 7 · HR Operator 37 · Payroll Operator
18 · Accountant 8 · Group Admin 12**. HR + Payroll = **47% of the surface** and were the two least-built
roles — which matches BATMAN's locked build order (HR next, then Payroll).

## Splitting rules that worked

- **"One question" test, applied literally.** If a screen needs "and" to state its question, split it.
  This is what separated: my-leave vs apply-leave; run console vs variance review vs bank file; document
  *expiry watch* (HR-11) vs document *request queue* (HR-09) — two questions that had been collapsed.
- **Kind lens (destination · detail · task · setup)** makes a big count interpretable. Only destinations
  go in the rail; ~40% of screens are tasks/details that must never become nav items.
- **Define each screen ONCE; carry cross-role use in a coverage table.** Scope-narrowing (group → campus →
  dept → self) is *not* a new screen. Exceptions worth splitting anyway: role **homes** (density differs
  per role — DESIGN principle 5) and DH-05 *My team* vs HR-02 *Staff register* (same people, different
  density and PII).
- **Subject shell + tabs** for the employee record (HR-03 shell; HR-04..07 as separate screens) resolves
  the "one screen, one question" conflict with a record that genuinely has many facets.
- **One gate, not five.** Maker-checker is spread across five modules in the spec but is *one question* for
  the checker → a single AC-02 queue. Splitting it per module would guarantee something is missed.

## Structural findings worth reusing

- Every screen needs `must NOT contain` as much as `must contain` — that field is what stopped duplicate
  destinations, and it is where the governance rules land (no Edit on employee documents, no approve on
  own claim, no maker-approves-own-run).
- **Actions belong in the inventory**, not in a later design pass. Each control needs: who/scope,
  preconditions, options+defaults, downstream effects, failure, reversibility, second-eyes. Writing these
  is what surfaced most of the 31 open questions — behaviour is where specs are thin, not structure.
- **Availability convention (binding):** action the role could do but state forbids → *shown disabled with
  the reason*; action the role can never do → *hidden entirely*.
- Public/token surfaces (career site, application, pre-boarding upload, offer acceptance) are always
  forgotten because they have no role and no rail — check for them in every module with an external actor.

## Related

See [[naveya-spec-gaps-and-open-questions]] for the gap list and the 31 open questions this produced.
