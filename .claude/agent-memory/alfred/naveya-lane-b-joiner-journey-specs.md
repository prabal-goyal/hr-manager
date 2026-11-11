---
name: naveya-lane-b-joiner-journey-specs
description: NA-20 (2026-09-07) — writing the M4/M5/M6/M7 functional specs; what the eight-section house format taught, the data-model holes the joiner journey exposed, and the sprint-order constraints it surfaced
metadata:
  type: project
---

Wrote the four Lane-B functional specs on 2026-09-07 (NA-20): `docs/functional-specs/M4-document-governance.md`,
`M5-recruitment-ats.md`, `M6-onboarding.md`, `M7-academic-calendar.md`. 56 proposed stories, 280 points.

**Why:** BATMAN split the 17 modules across six alfred lanes writing siblings into one directory
simultaneously. Lane B is the joiner journey — requisition through to a staff record with verified documents.

**How to apply:**

- **The eight-section format is `M0-foundations.md`'s, and it works.** Intent (school's language) · Scope &
  surfaces (in / out-with-owner / API surfaces / client surfaces) · Data model · Behaviour walk-through ·
  numbered AC table with citations · Testing table split by owning agent · Proposed stories (title, intent,
  owner, points, deps) · Open questions & conflicts. Match it exactly; do not invent a variant.
- **The "Explicitly out of scope" table with an owner per row is the highest-value section.** It is where
  ownership boundaries get decided once instead of six times, and where a sibling lane's spec gets its
  inbound contract. Every out-row names the owning module as a wikilink.
- **Writing the data-model section is what finds the holes.** Four modules, four structural gaps that a
  screen list had not surfaced: M6 has **no entities in §6 at all** (onboarding tasks, templates, bulk-import
  jobs are all absent); `StaffDocument` has no supersession or verifier fields although `M4 §Acceptance`
  demands history retention; `Offer.status` has no `superseded` value though the built PUB-04 renders it;
  `HolidayCalendar` has no `status` though PR-07's whole model is draft→published. Also missing:
  `CandidateConsent` (§8 mandates lawful-basis records; no entity stores them).
- **Sprint-order constraints only appear when you write dependencies down.** Two real inversions found:
  ATS conversion (Sprint 3) initialises leave balances owned by M8 (Sprint 5), and M6 onboarding (Sprint 4)
  does the same. Resolution proposed both times: emit a domain event/task, verify the leave clause in
  Sprint 5, and **record the deferral** rather than letting the AC look done. Also: M7 must land *before*
  M6 within Sprint 4 (renewal defaults to +1 academic year; DOJ-relative task dates read the calendar).
- **M5 is oversized for one sprint** — 20 stories, 107 points against a two-week sprint. Say so in the spec
  rather than pretending the build plan's one-line milestone is a plan.
- **A governance module's ACs are mostly about refusals.** M4's most important deliverable is the enumerated
  403 matrix, generated from the schema's mutation list so a *newly added* mutation cannot escape it. Write
  that as a story with points, not as a testing note.
- **PUB-03 looks like it violates M4 rule #2 and does not.** Resolved in the spec as C-M4-02 (recorded so
  nobody re-opens it): the bearer grant is a second *authentication* channel onto the *same* state machine,
  with no staff-record read. Generalised as a reusable primitive `DocumentAccessGrant`, owned by M4 and
  consumed by M5 (PUB-04) and M6 (PUB-03) — one primitive, not three token schemes.
- **Cite obligations O1–O18 inline in the AC table alongside spec sections.** `ui-compliance-requirements.md`
  is the compliance contract; O4 is M4's spine, O8 bears on M5/M6 (a school cannot onboard an unverified
  adult around children), O1 on PUB-02, O17 on every conversion and bulk commit.
- **Wikilink every cross-module reference** using the target spec's basename without `.md`
  (`[[M8-leave]]`, `[[M11a-statutory-config-versioning]]`). A link to a spec another lane is still writing
  is correct, not an error.
- **The PDFs are historical snapshots.** `docs/pdf/school-hrms-product-definition.pdf` (15 Jul 2026) is a
  compiled bundle of the repo docs *before* the 2026-07-18 API decision and the 2026-07-22 ShriConnect
  change; the deck (22 Jul) is naming/positioning. Useful for Intent framing; the dev spec wins as the build
  contract. `design/reference/keka/` is attendance-only — nothing for this lane except confirming that the
  staff-facing calendar grid printing HOLIDAY/W-OFF is M9's shift calendar reading M7's facts.
- **KB mirroring:** `create_kb_document` succeeds but its response exceeds the tool output limit; the id is
  recoverable with `jq -r '.data.id'` on the saved tool-result file. `transition_work_item` is in
  `denied_tools` for `tn-alfred` — BATMAN must move the item. The `.claude/hooks/_mcp.sh` helper resolves
  credentials but its curl calls fail in this sandbox; use the MCP tools directly.

See [[screen-inventory-decomposition]] and [[naveya-spec-gaps-and-open-questions]] — several of this
session's open questions (Q4 budget thresholds, Q5 expired contract, Q15 rehire, Q16 did-not-report,
Q17 candidate withdrawal, Q8 BGV access) are the same ones the screen inventory raised and are **still
unanswered**; they have now been restated as blocking items against specific sprints.
