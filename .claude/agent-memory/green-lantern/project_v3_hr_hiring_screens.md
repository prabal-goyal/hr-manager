---
name: v3-hr-hiring-screens
description: design/v3/pages/hr-hiring.jsx — HR-13/14/16/17 (requisitions, postings, pipeline, application detail), one recruitment world (Ishaan Verma, Simran Dutta, Farida Ansari, etc.) shared across three tabs
metadata:
  type: project
---

`design/v3/pages/hr-hiring.jsx` exports `window.Pages3.HRHiring`, routed at `?role=hr&screen=hrHiring`, one file / three tabs: Requisitions (HR-13), Job postings (HR-14), Pipeline & screening (HR-16 register + HR-17 detail combined, same list+detail shape as `hr.jsx`'s HRDocs). `nav.hrHiring` / `hr.hiring.manage` were already wired in `kit.jsx` and `v3.html`'s `ROUTES`/`CODES` by the coordinator before this dispatch — only the file itself and its `<script>` tag were missing.

**Gate chain modelled end-to-end and made genuinely interactive (not just documented):** Requisition (`draft → pending_approval → approved/rejected → closed`) gates JobPosting creation — an unapproved requisition's "Create a posting" row action is `disabled` with the exact blocking reason in words (`awaiting <approver>` / `not submitted yet` / `rejected — revise and resubmit` / `closed — raise a new requisition` / `already posted`), and the Postings tab's own "Create a posting" picker only ever lists approved-and-unposted requisitions — so an unapproved requisition is refused twice over, not just documented once. `budget_ctc` is modelled as a single approved-ceiling Decimal (matching the spec's literal field, not an invented min/max band), always captioned "a budget for the position, never one person's pay," and is the ONLY money on any of these four screens — Postings' public preview panel and the pipeline/detail views never render it at all (HR-14's own "Must NOT contain" list doesn't name it internally either, so it's absent from the internal Postings register too, not just the public preview).

**DPDP / child-safety choices:** candidate phone/email/address are omitted entirely (not masked-with-reveal) because HR-16/17's "Must contain" lists never name them — the omission is stated in words (`hrh.det.contactNote`) rather than left blank. The A22 consent artefact (version + date) is shown as a plain fact on the application detail. No background-check/police-verification content appears anywhere (that is HR-10/11/12's `hr-compliance.jsx`, deliberately not touched or duplicated here).

**Real state, not just visuals:** advancing an ineligible-flagged candidate requires a typed override reason before "Confirm — advance" un-disables (`AdvancePanel`); reject requires a picked reason before "Confirm — reject" un-disables; both write who+reason+date into the candidate's own history (`Trail`) and notes, matching the "every state change records who and why" non-negotiable. Verified live via puppeteer (not just screenshotted): advancing Simran Dutta (ineligible, PGT Physics) from Screening→Shortlisted moved the stage-tab counts, kept her "Ineligible" flag visible, AND appended the override attribution — the M5 non-happy-path ("ineligible but advance anyway, with a reason") working in one traced interaction.

Cast reused verbatim from siblings: Meera Iyer (HR), Radhika Menon (Principal, Indiranagar, from `hr-leaveatt.jsx`); Farhan Qureshi (Principal, Whitefield) is this file's one new fictional name. Clock: 11 Aug 2026, matching every other v3 page.

See [[nested-tabs-panel-count]] and [[selected-row-fallback-and-placeholder-audit]] for the two real bugs this build caught.
