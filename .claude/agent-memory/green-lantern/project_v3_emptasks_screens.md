---
name: v3-emptasks-screens
description: design/v3/pages/emp-tasks.jsx — the five employee "doing" tasks (EMP-03/04/06/11/12/13) built as one tabbed aggregator page pairing with three destination pages
metadata:
  type: project
---

`emp-tasks.jsx` (`window.Pages3.EmpTasks`, nav key `empTasks`, label "Requests") is a single file holding five tabs — Mark attendance (EMP-03), Regularise a day (EMP-04), Apply for leave (EMP-06), Respond to HR (EMP-11), Reimbursements (EMP-12/13) — one `Tabs`/`TabPanel` group, `panelCount === 1` always. It is the *doing* half of three already-built *reading* destinations and reuses their facts rather than inventing parallel ones:

- `attendance.jsx`'s missing punch (6 Aug) is the Regularise-a-day anchor; its already-regularised 3 Jul example (approved by "Meera Nair, HR") is reused verbatim as read-only history even though a *fresh* submission on this page correctly routes to the Dept Head per M9 — a flagged, deliberate divergence between an old fact and the spec-correct new path, not a bug to silently paper over.
- `leave.jsx`'s pending `LR-0219` (Ananya's Aug 24–25 casual leave, needs cover) is reused as the **overlap** example: picking those same dates on the Apply-for-leave tab triggers the spec's "overlapping request → blocks and links to it" failure mode instead of a duplicate parallel record. A genuinely new, non-overlapping submission still gets its own fresh id (`LR-0225`) — reuse-the-anchor and invent-a-new-id are not in tension, they answer different questions (is this the SAME request, or a NEW one).
- `documents.jsx`'s two open requests (PAN, bank proof) are reused as the actionable "Respond" cards; four more read-only states (submitted/rejected/overdue/cancelled) are added so EMP-11's full state list is demonstrable on one screen without inventing decorative duplicates of EMP-10's own data.

Money facts (`MONTHLY_GROSS = 94800.0`, `LOP_DAY_RATE = 3160.00`), `HOLIDAYS`, and `WINDOWS` (exam blackout Sep 14–19, autumn/winter vacation, admission/result blackout) are re-declared locally, byte-identical to `leave.jsx`'s own constants — per the established self-contained-page convention (each page owns its own copies rather than importing another page's module scope), not a shortcut.

See [[project_emptasks_kit_promotions]] for the three local primitives this file needed that `kit.jsx` still lacks.
