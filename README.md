# Naveya

**HR & payroll for Indian schools.** A compliance-grade, multi-tenant SaaS built for private multi-branch K–12 groups, with a schema that extends from pre-school to college.

Built by **Voxturr Labs** in collaboration with **ShriConnect**, the technology arm of The Shri Ram Schools group.

> **Status: design phase.** What exists today is the specification, the screen inventory, and a working in-browser design system covering 7 roles. `backend/`, `frontend/` and `app/` are not yet scaffolded.

---

## Why this exists

Indian schools run payroll under rules that generic HR software does not model: teaching staff who accrue no earned leave because they get vacations; leave that must not be approved during an exam window; substitution cover that has to be arranged before a teacher can be spared; statutory filings whose rates change mid-year and must be applied as they stood *then*, not as they stand today.

Getting those wrong is not a UX inconvenience — it is a wrong salary, a missed filing, or an uncleared adult standing in front of children.

---

## Running the design canvas

No build step. Serve the folder and open it:

```bash
python3 -m http.server 8934 --bind 127.0.0.1 --directory design
open http://127.0.0.1:8934/v3.html
```

A **role switcher** sits bottom-right. Deep links take `?role=`, `?screen=`, `?theme=light|dark` and `?lang=en|hi`:

```
http://127.0.0.1:8934/v3.html?role=payrollOfficer&screen=pyRun&theme=dark&lang=hi
```

React 18 + Babel-standalone from a CDN, transpiled in the browser. The classic JSX runtime is forced in `v3.html`; without it the page renders blank.

---

## What is built

Seven roles, 25 screens, verified across light/dark and English/Hindi.

| Role | Screens |
|---|---|
| Employee | Home · Attendance · Leave · Payslips · Documents · Profile |
| Department Head | Home · Leave approvals · Department attendance |
| Campus Principal | Home · Campus attendance · Leave escalations |
| HR Operator | Work queue · Staff register · Document control |
| Payroll Operator | Home · Payroll run console · Paid-days reconciliation |
| Accountant | Compliance calendar · Maker-checker gate · Statutory liability |
| Group Admin | Group overview · Users & roles · Audit log |

`docs/screen-inventory.md` is the authoritative map: **119 MVP screens**, spec-derived, each with its question and a full action table. Screens are cited by code (`HR-09`, `PY-07`, `AC-02`) rather than by name.

---

## Layout

```
design/
  v3.html              harness — role switcher, routing, deep links
  v3/
    tokens.jsx         the palette and type stack; the single source of colour
    kit.jsx            components, i18n, theming, the role-filtered rail
    screens.jsx        Login, employee Home
    pages/*.jsx        one file per role or section
  reference/keka/      captured competitor benchmark, with what to take and what not to
  v2/, fresh/, …       superseded explorations, kept for provenance

docs/
  development-specification.md   the build spec — modules M1–M16, data model, sprints
  screen-inventory.md            every screen, its question, and every action
  ui-compliance-requirements.md  what the UI must refuse, and why
  functionality-blueprint.md     MVP / Phase 2 / Later
```

---

## The design system — "Staffroom Terracotta"

Warm and light-first, because a teacher opens this on a school desktop in daylight, in a staffroom, with colleagues at her shoulder.

Cream `#FAF3EA` ground · cocoa `#3E2A1F` rail · clay `#C14D29`. Bricolage Grotesque for display, Hanken Grotesk for UI, **Hind for all Devanagari**, Red Hat Mono for every figure (the "Warm Grotesk" type system, 2026-09-16). Nothing downstream of `tokens.jsx` contains a colour literal, which is what let the whole system pivot from an earlier peacock palette in one file.

`DESIGN.md` carries the eleven principles. The load-bearing ones:

- **Every element earns its place** — if it does not answer the screen's question, cut it.
- **One screen, one question.** If stating the question needs "and", it is two screens.
- **Density is a function of role.** A teacher's home is calm; an HR work queue is a list of obligations.
- **Never state by colour alone.** Every tint is paired with a word or a letter.
- **Don't offer what governance forbids** — see below.
- **One language at a time.** English or Hindi, never both at once.

---

## Rules the interface enforces

These are not stylistic preferences. Each maps to a rule in the spec or to Indian law.

- **Employees cannot self-write documents.** There is no upload control anywhere in employee self-service — not disabled, *absent*. HR raises a request; the employee responds; HR verifies.
- **Identifiers are masked in the DOM, not hidden with CSS.** PAN, UAN, bank account. A full Aadhaar is never rendered in any role, to anyone — the last four digits are the fullest form that exists.
- **Statutory rates are never hardcoded.** They come from a versioned, effective-dated config, and every run and filing pins the version it used. A July payslip keeps July's rates.
- **Maker–checker means two different people.** Never the same person in a second browser tab. A checker can always send work back with a reason; nothing irreversible happens in one click.
- **Audit is append-only.** Supersede, never delete — and a diff of a sensitive field records that it *changed*, never the old and new values.
- **Money is exact.** Every total is computed from its parts, never re-typed, and reconciles in the rendered DOM.
- **Salary stays off dashboards.** Amounts live on the payslip, one deliberate click away.

`docs/ui-compliance-requirements.md` holds the full register, and the standing rule behind most of it: **absent when you lack the capability, disabled-with-a-stated-reason when you hold it but this particular item forbids you.**

---

## Conventions

- **Tenancy** — `tenant_id` plus Postgres RLS ship in the same migration as the model. A tenant is a customer account; `group → trust → campus → department` lives inside it and is not the isolation boundary.
- **Types are generated**, never hand-written, wherever a source of truth exists.
- **Money is `Decimal`**, never `float`.
- **Never log PII** — no PAN, Aadhaar, UAN, ESIC, bank account, salary, DOB or phone in a log line.
- **Commits carry no AI attribution.**

`CLAUDE.md` is the operating manual for contributors and agents; each app gets its own once scaffolded.

---

© Voxturr Labs. Internal — not for distribution.
