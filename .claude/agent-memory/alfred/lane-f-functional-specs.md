---
name: lane-f-functional-specs
description: What worked writing the M13/M14/M15/M15a/M16/M17 functional specs (NA-24), the eight-section shape, and the cross-lane conventions discovered mid-flight
metadata:
  type: project
---

# Lane F functional specs — M13, M14, M15, M15a, M16, M17 (NA-24, 2026-09-07)

Six specs written in `docs/functional-specs/`, mirrored to the Navya KB space and linked to their module
epics (NA-38…NA-42). Totals: 187 ACs, 99 proposed stories, 512 points, 72 open questions.

**Why:** the build plan dispatches sprints 10–12 from these documents, and a story with no functional-spec
page does not dispatch (`CLAUDE.md`).

**How to apply:**

## The eight-section shape holds, and section 4 is where the value is
`M0-foundations.md` set the template (Intent · Scope & surfaces · Data model · Behaviour walk-through ·
numbered AC table with `M<n> §<x>` citations · Testing table · Proposed stories · Open questions). Sections
1–3 mostly restate; **section 4 is where a spec earns its keep** — the M13 conflict matrix (K1–K16) and the
M15 aggregate-leak layering are the two pieces implementers cannot derive from the dev spec.

## Conventions discovered mid-flight (follow these next time, do not re-derive)
- **Wikilink basenames are the file basenames and they are longer than you guess**: `M3-core-hr-people`,
  `M4-document-governance`, `M11-statutory-compliance`, and the payroll/statutory split into
  `M10a-loans-advances`, `M10b-reimbursements-fbp`, `M10c-arrears-pay-revision`, `M11a-statutory-config-versioning`,
  `M11b-bonus`. Check `ls docs/functional-specs/` before writing links; someone had to fix mine.
- **KB pages go at the space root**, titled `M<n> — <Name> (Functional Spec)`, then
  `link_kb_document_to_work_item(link_type="specification")` to the module epic, then `create_edge`
  (`depends_on` / `feeds` / `relates_to`) with a `why` in `properties`. `feeds` is the right verb for an
  advisory handoff (M17 → M10).
- **Push KB content from the file, never by retyping it**: `source .claude/hooks/_mcp.sh` (needs
  `CLAUDE_PROJECT_DIR` set and `set +u`), then `jq -n --rawfile md <file>` into `create_kb_document`.
  A retry after an apparently-empty response created a **duplicate page** — check with `search_kb` before
  retrying, and retitle a duplicate `[duplicate — superseded] …` (the convention other lanes used).
- **`guard-workdir-boundary` blocks a Bash heredoc containing a tilde character.** Writing "about 25%" as
  a tilde-percent tripped it. Use the Write tool for prose, or spell out "about".
- `transition_work_item` is in `denied_tools` for tn-alfred — comment and hand back to BATMAN.

## Findings worth carrying to other lanes
- **The 22 July ShriConnect deck contains no PAMS slide and no helpdesk slide**, and its pricing tiers
  (slide 18) list neither in any plan — although that meeting is why both are MVP. The 15 July product
  definition PDF (v0.1) predates the change entirely. So the dev spec is the *only* artefact describing
  what was promised for the two biggest ShriConnect modules.
- `executive-summary.md` and `competitor-analysis.md` still advertise **student/parent 360°** as MVP PAMS,
  contradicting amendment A (2026-08-11). Documentation correction awaiting a ruling.
- `functionality-blueprint.md` §2 line 55 tags **offline attendance capture `[P2]`** while its own PART B
  item 3 and `M13 §Business rules` put it in MVP — a self-contradiction, same class as Q30.
- Blueprint §15 tags **webhooks `[P2]`** while `M16 §Acceptance` requires one to fire on payroll approval.
- **Whole modules are entity-less in `§6`.** M16 has no device, connection, outbox, webhook or ingestion
  table; M14 has no template, rule, `read_at` or dedupe key; M15 has no report or DPDP entity; M15.1's
  category is an enum where the rules require a configurable object. Every lane should check whether its
  module's §6 rows can actually carry its §Business rules.
- **`reports_to` is now blocking four modules** (M8, M13, M14, M17), not just the screen inventory's Q6.
- Two delivery blockers nobody had named: **TRAI DLT template registration** for Indian transactional SMS
  (M14), and **how a LAN biometric device reaches a cloud tenant** without a bearer token (M16 — needs an
  on-site agent or pull-mode).
- **Student-result linkage (MVP) has no data source**: the exam/result system and SIS integration are both
  P2 and no result entity exists. MVP path has to be manual/CSV aggregate signals.

## Estimation baseline (for the next planning session)
Six specs of this depth in one dispatch: 29 minutes measured wall-clock (05:07-05:36 IST), including all reading
(dev spec, blueprint incl. PART C, 18 UI obligations, screen inventory, two PDFs, three built design files)
and the KB/graph work. Per spec: 25–35 ACs and 13–21 stories is the natural size for a module of M13/M17
weight; M14 came out smaller (26 ACs, 13 stories) because it owns no UI of its own beyond two screens.
