---
name: v3-principal-screens
description: design/v3/pages/principal.jsx — PR-01/02/03 Campus Principal build; the "name the escalation cause" recipe and the outage-leads-before-absence recipe
metadata:
  type: project
---

Built 2026-09-03 as `Pages3.{PRHome,PRAttendance,PRLeave}`, a `Pages3/*.jsx` satellite page (see [[project-v3-attendance-screen]]'s three-tier convention), reusing weekday/month strings from screens.jsx (`att.d0..d6`) and leave.jsx (`lv.mon.*`, and — verbatim, not reinvented — the Term-1 exam blackout window `lv.win.exam1`/`lv.win.exam1d`, 14–19 Sep 2026). Spec: screen-inventory.md §5 (PR-01/02/03), M8 §Workflow, M9 §Business rules, M2 §Acceptance (campus-only scope).

**Domain recipe: name the escalation cause, always.** PR-03's five mock escalations each carry a DISTINCT, real cause drawn from the spec text itself, not invented: applicant is a dept head (chain skips a level — confirmed via leave.jsx's own "anything longer than three days also goes to the Principal" line, which also gave the ">3 days" cause), an exam/admission blackout window, balance-exhausted-becomes-LOP, and a vacant Head-of-Department post (the `[proposed]` "Reassign the approver" row action only makes sense paired with this last cause — build the cause and the action together, not separately). Every row shows a `CAUSE_KEY` chip; the detail panel repeats it under "Why this reached you". A principal-approval screen with an unlabelled queue is a worse screen than one with four rows.

**Recipe: the outage banner leads, the matrix follows.** PR-02's non-happy path ("a wrong-looking absence number destroys trust") is enforced structurally, not just by copy: the affected department (Primary, 17 of 24 staff) is given an `awaiting`, not `absent`, count in the SAME mock data PR-01 also reads — cross-screen mock constants — and the matrix's "Exceptions" cell renders a neutral "17 awaiting sync" chip instead of a red exception count for that row. The outage `<div role="alert">` sits above the three-card summary row in DOM order, verified by string-index comparison in puppeteer (`bodyHtml.indexOf`), not by eyeballing a screenshot.

**PII line actually applied, not just quoted:** DH-02/PR-03's OWN escalation detail panel shows leave TYPE and REASON TEXT (it is the decision surface — DH-02's own must-contain list), but the SAME data rendered on the "campus leave calendar" tab (a passive, shared roster) shows absence only — no type, no code. Verified with a body-text regex scoped to the calendar-tab half of the page only. Money never appears at all: the LOP consequence is stated as "will be recorded as Loss of Pay", never a rupee figure — a principal does not see salary.

**Layout: measure every column, not just the tallest.** First pass paired the two tallest cards (dept shape + staff-on-leave) in one column, leaving the other two columns roughly half as tall — same defect as [[dead-space-relocates]]. Fixed by regrouping cards by JOB (operational snapshot alone / decision queues+compliance / people-today) rather than by build order, which happened to balance height within ~150px without inventing filler content.

**Bug caught only by full-page screenshot, not the DOM:** a department row's "uncovered classes" note shared a flex row with wrapping status chips; at the actual column width it visually ran into the last chip's count ("Absent **1**" + "**1** classes…" read as "Absent 11 classes"). Fixed by moving the note to its own block-level line. Nothing in the accessibility tree or console flagged this — only a rendered screenshot at the real column width did.

**i18n leak caught the same way [[feedback-i18n-demo-content-leaks]] warns about, a second time:** escalation reasons, chain-step verbs ("applied"/"approved") and every `appliedOn`/`hodApprovedOn`/`escalatedOn`/`decidedOn` date were first authored as hardcoded English strings/pre-formatted dates in the mock data. All now route through `t()` (`pr.reason.*`, `pr.chain.applied/approved`) or a local `fmtDate(t, iso)` helper that reuses `lv.mon.*`. **Store dates ISO in mock data, always — never pre-formatted in one language** — this is the reusable rule, not just "translate strings".

Local promotion candidates (kit.jsx out of scope for this dispatch): `IconMark` (TitleMark needs a 7th `danger` iconTone — three call sites needed it here alone), `Chain` (a third independent build of documents.jsx `Trail`/leave.jsx `TrailStep` — promote next kit touch), `TextArea` + `FilterPills` (third independent build, same as leave.jsx's own promotion note).

Related: [[project-v3-attendance-screen]], [[feedback-cross-screen-mock-constants]], [[feedback-dead-space-relocates]], [[feedback-devanagari-slice-truncation]], [[feedback-i18n-demo-content-leaks]].
