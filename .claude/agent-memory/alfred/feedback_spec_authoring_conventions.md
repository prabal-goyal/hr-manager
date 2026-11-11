---
name: statutory-spec-authoring-conventions
description: How BATMAN wants functional specs written on Naveya — wikilinks, KB mirroring, cite O1..O18 rather than restate, PART C is authoritative
metadata:
  type: feedback
---

Functional specs in `docs/functional-specs/` are written to a fixed contract. Confirmed by two mid-task
course corrections from BATMAN during NA-23 (2026-09-07).

**Rule 1 — eight sections, always:** Intent · Scope & surfaces · Data model (with `tenant_id` + RLS in the
same migration per tenant-owned table) · Behaviour walk-through (happy path, states, edge cases, error
paths, concurrency, i18n, a11y) · numbered AC table citing `M<n> §<x>` per row · Testing table (unit →
deathstroke; integration/E2E → bane; compliance → gordon) · Proposed stories (filable, with owner, points,
depends-on) · Open questions & conflicts. Match `M0-foundations.md`'s shape; do not invent a new one.

**Rule 2 — the specs are a graph, not a shelf of documents.** Wikilink every cross-module reference in
prose using the target spec's basename without `.md`, e.g. `[[M11a-statutory-config-versioning]]`. Link
liberally; a link to a spec another lane is still writing is correct and expected. Then mirror each spec
into the KB with `create_kb_document` (**the substance — never a pointer to the repo, never a summary that
drops the AC table**), link it to its work item with `link_kb_document_to_work_item`, add `create_edge`
where a real dependency exists, and confirm with `query_kb_graph` that nothing is orphaned.
**Why:** a spec nobody can traverse from a related one gets re-derived instead of read.

**Rule 3 — cite, do not re-derive.** The repo has already decided most of it:
- `docs/functionality-blueprint.md` **PART C is the authoritative MVP in/out list**. Disagreement with it
  is a **conflict to report, not a judgement to make**. PART A gives per-module detail and MVP/P2/Later
  tags — and where PART A and PART C disagree, PART C wins and the disagreement is an open question.
- `docs/ui-compliance-requirements.md` carries **eighteen numbered obligations O1..O18** — the compliance
  contract. **Cite them in the AC table the way spec sections are cited**, e.g. `(M11 §Bonus, O5)`. Where
  an obligation *is* a module's whole reason for existing (O9 for the versioned config), quote it.
- `docs/competitor-analysis.md` defines what "greytHR parity" concretely means; D3 locked us to it.
- The two PDFs (`docs/Naveya-School-HRMS-Voxturrlabs.pdf` 22 Jul deck,
  `docs/pdf/school-hrms-product-definition.pdf` 15 Jul v0.1) are **snapshots that predate** the 18 Jul API
  decision, the 22 Jul ShriConnect change and the 11 Aug amendments A–C. **Where a PDF and the dev spec
  disagree, the dev spec wins and the disagreement goes in Open Questions** — do not silently follow the
  deck, and do not silently ignore it either; a promise made to school leadership is worth flagging.

**How to apply:** read PART C and the O-list *before* writing, not as a review pass. Budget for it — on
NA-23 both arrived as corrections mid-task and forced a retrofit of the first document.

Related: [[statutory-lane-gaps]], [[kb-mirroring-shell-gotcha]].
