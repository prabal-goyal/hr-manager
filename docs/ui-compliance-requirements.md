# Naveya — UI compliance requirements

> **Owner:** gordon (compliance & safety review, read-only). **Status:** working reference, written *before*
> the ~40-screen design pass so that no screen draws an affordance the system must later refuse.
> **Sources cited inline:** `docs/development-specification.md` (dev-spec), `docs/functionality-blueprint.md`
> (blueprint), `CLAUDE.md` (non-negotiables + guard hooks), `DESIGN.md` (design principles).
> Anything not traceable to those is marked **`[judgement]`** — my professional call, not a written requirement.
> **This document does not resolve conflicts.** Where an obligation collides with a design principle it is
> flagged in §7 for BATMAN.

**How to read it**
- §1 — **Obligations**: what must be visible in or enforced by the interface, organised by obligation.
- §2 — **Action guardrail register**: every consequential action (money / PII / a person's record / a
  statutory artefact) with its gate, second-person rule, audit, reversibility, PII exposure, statutory
  effect, and the compliance-loaded options it takes.
- §3 — **Actions we must never build.**
- §4 — Per-role summary · §5 — Top risks · §6 — Designer's checklist.
- §7 — **Conflicts with DESIGN.md** (for BATMAN) · §8 — **Unmet by what is already built** · §9 —
  **Escalations to the user** (legal/statutory ambiguity — do not guess).

**Seven seed roles** (dev-spec M2 "Seed roles"): Group Admin · Campus Principal · HR Operator ·
Payroll Operator · Accountant · Department Head · Employee.

**A standing rule that governs every screen** — *offered vs disabled vs absent*:

| Situation | UI behaviour | Why |
|---|---|---|
| The role/scope **never** carries the right here | The control is **absent**. No ghost, no disabled stub, no tooltip. | DESIGN principle 9 "don't offer what governance forbids"; a disabled control enumerates the permission model and the org structure to someone outside it (dev-spec §8 "Field-level access", M2 scoping). `[judgement]` on the leak argument. |
| The right exists but a **state precondition** is unmet (run not computed, exceptions open, request not yet open) | **Visible, disabled, with the reason in words** next to it. | The reason is the teaching. Hiding it reads as a bug and invites a support ticket. `[judgement]` |
| The right exists but **this person** is barred from *this instance* (maker cannot be checker; approver is the requester) | **Visible, disabled, with the rule stated in the first person** — *"You prepared this run. A different approver must release it."* | dev-spec §8 "Maker–checker"; M10/M11 "the maker cannot self-approve". Here the rule *is* the message; hiding it would let a user believe the system simply failed. |

Be consistent. Mixing these three leaks more than any one of them.

---

# §1 — Obligations

## O1 · DPDP consent & notice at every PII-collecting touchpoint

**Source:** dev-spec §8 "Consent & retention (DPDP 2023) — lawful-basis records, retention windows,
data-access/correction requests"; blueprint Part B §6 "consent & retention aligned to DPDP Act".

**The UI must:**
- Present an itemised **notice at the point of collection** — what is collected, the purpose, who it is
  shared with (EPFO/ESIC/TRACES/bank/biometric vendor), how long it is kept, and how to withdraw — in the
  language the user is currently reading. Notice is per *touchpoint*, not one blanket sign-up tick.
- Touchpoints that must carry a notice: **staff enrolment / bulk import** (HR is collecting on the
  employee's behalf — the employee must be shown, on first ESS sign-in, what is already on record about
  them and on what basis `[judgement]`), **public career-site apply** (M5 — candidates are data principals
  too), **document upload response** (M4), **geo + selfie attendance capture** (M9 — location and a facial
  image are collected each punch), **investment declaration + proof upload** (M11), **reimbursement receipt
  upload** (M10), **police/background verification** (M5/blueprint §11), **helpdesk/grievance ticket** (M15.1),
  **360° appraisal input from students/parents** (M17 — minors' feedback; see §9).
- Carry a **"Your data" surface in ESS**: what is held, the lawful basis, the retention window, and controls
  to **request access**, **request correction**, and **withdraw consent** where consent (not statutory
  obligation) is the basis. Withdrawal must state its consequence in plain words before it is accepted.
- Record consent as a versioned, timestamped artefact and show the employee **which notice version they
  accepted and when** `[judgement — the spec requires "lawful-basis records"; showing the version is my call]`.

**The UI must NOT:**
- Bundle consents ("I agree to everything") or pre-tick them.
- Use a dark pattern on withdrawal (withdraw buried, continue emphasised).
- Make consent a **blocker for statutory processing** — PF/ESI/TDS processing rests on legal obligation, not
  consent; a withdrawal screen that implies payroll will stop is wrong (see §9-Q1).
- Collect geo or a selfie before the notice has been shown at least once on that device.

**Roles/screens:** Employee (ESS first-run, Your-data, attendance capture, document respond, declaration,
claims, tickets) · HR Operator (enrolment, bulk import, ATS) · Group Admin (notice/consent version admin).

**Visible copy required:** *"On record since 12 Apr 2024 · held because the Income-tax Act requires it ·
kept for 8 years after you leave"*; *"Your school's HR office added this. You can ask for a correction."*;
consent version + date; retention window on each PII group.

---

## O2 · Retention windows, and what survives exit

**Source:** dev-spec §8 "retention windows … statutory-retention data survives exit"; M12 (F&F, access
revoked); blueprint Part B §6.

**The UI must:** show a **retention line on every PII group and document type** (*"kept until 31 Mar 2033 —
statutory"*); distinguish visually between data held **by consent** (erasable on withdrawal) and data held
**by statutory obligation** (not erasable, and the UI must say why); show, on the F&F/exit screen, exactly
what will be **revoked** (login, ESS, app) versus what is **retained** (payslips, Form 16, PF/ESI records,
service book) and for how long; give an exited employee a stated route to their Form 16 after access is
revoked (see §9-Q2).

**The UI must NOT:** offer a "Delete employee" that implies erasure; show a Delete on any record inside a
statutory retention window; present erasure as immediate when it is queued.

**Roles/screens:** HR Operator (staff record, exit), Employee (Your data), Group Admin (retention policy).

---

## O3 · Field-level PII masking, and an audited reveal

**Source:** dev-spec §4.1 "**Field-level PII permissions** (bank, PAN, Aadhaar, salary) are separate from
record access"; §8 "PII classification … access-logged" / "Field-level access"; M2 acceptance *"a Department
Head can approve leave but cannot see bank details unless granted the PII permission"*; `CLAUDE.md`
`guard-pii-logging`.

**The UI must:**
- Render **PAN, Aadhaar, UAN, ESIC number, bank account + IFSC, DOB, personal phone, personal address, and
  salary/CTC masked by default**, for every role, including HR — masking is the default state of the field,
  not a role-dependent one `[judgement on "including HR"; the spec makes it a permission, my call is that the
  default rendering is masked and the permission governs the reveal]`.
- Mask **format-preserving and unambiguous**: `••••6841`, `ABCDE••••F`, `••••••••1234`. Never render a full
  Aadhaar number anywhere (see §9-Q3).
- Make **Reveal an explicit, per-field, per-record action** that (a) requires `people.pii.read`, (b) writes
  an audit row, (c) tells the user it is being recorded — *"Revealing this is recorded against your name"* —
  and (d) **re-masks** on navigation away and after a short idle.
- Show, on the employee's own **Your data** screen, **who revealed what and when** `[judgement — a natural
  consequence of "access-logged"; makes the log useful to the data principal]`.
- Treat **salary/CTC as PII** with the same masking discipline in list views, search results, org charts,
  and dashboards.

**The UI must NOT:** reveal-all on a list ("show all bank accounts" for 410 staff); put PII in a column that
is visible by default in an exportable table; render PII in a page title, breadcrumb, URL, toast, tooltip,
notification body, empty-state, error message, or a screenshot-friendly hero; ship a "copy to clipboard" on
a masked field that copies the unmasked value silently.

**Roles/screens:** every screen that lists or details a person. HR Operator & Payroll Operator with the PII
permission may reveal within their scope; Department Head must **not** see the reveal control at all (M2
acceptance); Principal only if separately granted; Accountant sees aggregate money, not per-person bank
details, unless granted `[judgement]`; Employee sees their own, unmasked, without a reveal step.

**Visible copy required:** *"Hidden — you have permission to reveal. Every reveal is recorded."* ·
*"Revealed by you at 14:22 · recorded"* · on the employee side *"Meera Nair (HR) viewed your bank details on
8 Aug"*.

---

## O4 · Document governance — HR-owned, request-gated, verified

**Source:** dev-spec §4.5 + **M4** in full ("An employee has NO direct create/update path to `StaffDocument`
… the `documents.write` permission is not granted to the Employee role"; the state machine
Open→Submitted→Verified/Rejected; "enforced at API/permission layer, not just UI"); blueprint Core-HR
"★ HR-controlled document governance"; `CLAUDE.md` non-negotiable "Document governance (M4)";
`DESIGN.md` principle 9.

**The UI must:** give the employee exactly one document affordance — **Respond** to an HR-initiated request
(only while `status=open`); show the **live document unchanged** while a response is pending, with the
response shown as *"submitted — awaiting HR verification"* beside it, never replacing it; show a
**verification state on every document** (pending / verified / rejected) as mark + word, never colour alone
(DESIGN 8); show **who verified and when** on a verified document; show **the reason** on a rejected one;
keep the superseded version in a visible history.

**The UI must NOT:** draw an **Edit**, **Replace**, **Upload** or **Delete** control on a staff document for
the Employee role — anywhere, in any state; let an employee **initiate** a document change (no "request a
correction to my PAN card" that writes a document — a correction request is a *message to HR*, and HR raises
the `DocumentUpdateRequest`); auto-promote a submitted response to the live document on upload; let HR
verify a document they themselves uploaded as the employee's response `[judgement — self-verification defeats
the check; see A17]`.

**Roles/screens:** Employee (ESS action queue, Documents) · HR Operator (staff documents, request queue,
verify) · Principal/Group Admin (read + expiry oversight, no verify unless granted).

**Visible copy required:** *"HR asked for this. Upload it here — HR verifies it before it goes on record."* ·
*"On record since 8 Aug 2026 · verified by Meera Nair, HR"* · *"Your upload is with HR. The copy on record has
not changed yet."*

---

## O5 · Maker-checker — a *distinct person*, on everything that finalises money or a filing

**Source:** dev-spec §8 "Maker–checker: second-person approval on payroll runs and statutory filings";
M10 ("payout batch … approved by a **distinct checker**; the maker cannot self-approve"; arrears "posting
requires a distinct checker"; loan approval uses `payroll.approve` maker-checker); M11 (bonus run "cannot be
finalized by its maker"); M2 "maker-checker capability flag on roles"; blueprint Part B §1 (corrected to MVP,
"binding non-negotiable"); `CLAUDE.md`; `DESIGN.md` principle 10.

**Actions that require a distinct second individual** (one person must never complete the chain alone):
payroll **run approval/release**, **bank-file generation**, **statutory filing submission**, **reimbursement
payout batch**, **arrears posting**, **bonus run finalisation**, **loan approval**, **F&F settlement
approval** `[judgement for F&F — the spec gives it `payroll.run` + `people.manage` but not an explicit
checker; it disburses money and closes a person's record, so I am recording it as maker-checker and
escalating in §9-Q4]`.

**The UI must:** show a **two-panel sign-off block** — *maker (prepared by)* and *checker (approved by)* —
each with name, role, staff ID and timestamp, both visible from the moment the run exists (the empty checker
panel is the point); state the rule in words: *"A different person must approve this. You cannot approve a
run you prepared."*; **lock the run on maker submission** and say so; give the checker a **Return to maker
with a reason** action of equal weight to Approve; restate the **exact amount and payee count** inside the
approval confirmation; require the checker's own authenticated session **and** re-authentication at the
moment of approval `[judgement — "own session" is not the same as "own person"; see §8-F3]`.

**The UI must NOT:** offer a **single-click payroll run/release** (see §7-C1 — the blueprint literally asks
for this); enable Approve for the maker under any circumstance; allow the maker to change anything after
submission without a full return-to-maker cycle; let a role hold both `payroll.run` and `payroll.approve`
*on the same run* — if the role config allows both, the UI must still refuse per-instance and say why;
present Approve as the only checker action.

**Roles/screens:** Payroll Operator (maker) · Accountant / Group Admin / a designated Director (checker) ·
Principal (visibility, typically not checker). Screens: payroll run console, reimbursement payout batch,
arrears posting, bonus run, statutory filing, F&F.

**Visible copy required:** *"MAKER — PREPARED BY Kavita Sharma · HR & Payroll Officer · NAV-0007 · signed
11 Aug 16:05"* · *"CHECKER — awaiting a different approver"* · *"You prepared this run. A different approver
must release it."* · *"Bank file is generated only after checker approval."* · *"Locked after submission."*

---

## O6 · Append-only audit, with attribution visible where the decision is read

**Source:** dev-spec §4.2 "Every mutating action writes an `AuditLog` … Mandatory and non-bypassable for
payroll runs, statutory filings, approvals, document changes, and master-data edits"; §4.3 effective-dating
("never edited in place — a new dated row supersedes"); M15 "immutable audit log (read-only) … append-only";
M10 arrears "append-only (a correction supersedes, never edits)"; M17 ratings append-only;
`CLAUDE.md` non-negotiable "Append-only audit".

**The UI must:** carry **provenance on every consequential figure or state** (DESIGN 6 agrees) — *"Run
PR-2026-07 · approved 29 July by R. Venkataraman"*, *"Marked by biometric · Gate 2 · eSSL K30"*, *"Cleared by
K. Sharma 11 Aug 14:02 — variance explained by mid-month join"*; render corrections as a **supersession
chain**, both values visible, with the reason and the person — never as a changed number; expose a
**per-record history** ("Activity") on employee, document, payslip, run, filing, claim, appraisal; make the
audit log **read-only in the UI with no controls at all** — no edit, no delete, no bulk action.

**The UI must NOT:** show a bare edited value with no trace; offer Delete/Undo on an audit, statutory,
appraisal-rating or posted-payroll record; use "Edit" as the verb for anything effective-dated — the verb is
**"Revise (effective from …)"**; let a correction visually erase the superseded value.

**Roles/screens:** every detail screen (activity strip) · Group Admin/HR (audit log viewer, M15) ·
Payroll/Accountant (run + filing history).

**Visible copy required:** *"Superseded on 12 Aug by K. Sharma — reason: incorrect UAN. Earlier value kept on
record."* · *"This log cannot be edited."*

---

## O7 · Campus-scoped access — including pickers, search, exports and counts

**Source:** dev-spec §4.1 RBAC permission × scope; M2 acceptance *"a Principal scoped to Campus A cannot read
Campus B data"*; §3 tenancy; blueprint Part B §1 "★ Scoped access by group/trust/campus level",
"role-scoped exports"; `CLAUDE.md` `guard-rls-policy`.

**The UI must:** apply scope to **every surface that can name a person or a number** — lists, detail pages,
**search and type-ahead**, **assignee/approver/checker pickers**, **@mentions**, **filters and their option
lists**, **exports and print**, **dashboard totals and headcounts**, **notification bodies**, **report
parameter dropdowns**; state the scope the user is inside, persistently — *"Indiranagar campus · 118 staff"*;
scope the **campus/entity switcher** to the assignments the user actually holds, and show only those.

**The UI must NOT:** render an out-of-scope record as greyed, "restricted", or a redacted row — **it must not
exist in the response** (a "you don't have access to this" row confirms the record exists and often its
name); show a group-wide total to a campus-scoped user (a total is an inference channel — a Principal who
sees the group payroll total and their own campus total learns the rest `[judgement]`); offer "All campuses"
in a filter for a campus-scoped user; leak scope through URL-guessable record IDs without a scope check on
direct navigation (deep link to `/employees/{id}` must 404, not 403-with-name).

**Roles/screens:** Campus Principal, Department Head (department scope), HR/Payroll Operator (their assigned
scope), Accountant (legal-entity scope). Every list, picker, dashboard and export.

**Visible copy required:** the scope banner on every scoped screen; on export *"This export contains 118 staff
from Indiranagar campus — the scope you hold."*

---

## O8 · Child-safety — police/background verification and staff-of-minors data

**Source:** dev-spec §8 "Child-safety — Police/background-verification records access-restricted; expiry
alerts prevent lapses"; blueprint Part B §6 "★ child-safety context (background-verification records,
restricted access to staff-of-minors data)"; blueprint Core-HR "★ Digital service book … police/background
verification"; blueprint §11 "Background/police verification tracking (child-safety mandate)"; M4
`doc_type=police_verif`.

**The UI must:** treat `police_verif` (and any BGV outcome) as a **separately-permissioned document
category** — a role with `documents.manage` does not automatically get to open it `[judgement — the spec says
"access-restricted" but does not name the permission; see §9-Q5]`; surface **validity + expiry** prominently
(status, expires-on, days remaining) because a *lapse* is the safeguarding failure, and alert employee + HOD
+ HR (M14 acceptance); log **every view** of a BGV record, not just every edit; on the employee's own view,
show status and expiry without exposing the verifying authority's free-text remarks to anyone outside the
restricted role `[judgement]`.

**The UI must NOT:** show a BGV **outcome, remark, or adverse finding** in any list, hover card, export,
dashboard tile, notification body, or helpdesk ticket; make BGV status a filterable column on a general staff
list (that is a de-facto disclosure of adverse findings by absence `[judgement]`); allow bulk download of BGV
documents; let a Department Head see it at all.

**Roles/screens:** HR Operator (restricted sub-role) and Principal `[judgement]` only. Staff document screen,
compliance/expiry board, ATS candidate record.

**Visible copy required:** *"Restricted — child-safety record. Opening this is recorded."* ·
*"Verification current until 31 Jul 2027."* · on expiry *"Expired 31 Jul — teaching staff must hold a current
verification on record."*

---

## O9 · Versioned StatutoryConfig — the run must show what it was computed against

**Source:** dev-spec §4.4 "Statutory numbers live in data, never in code … Each `PayrollRun` pins the version
it used"; M10 "pins `StatutoryConfig`"; M10 arrears "each affected month recomputes on **its originally
pinned** version"; M11 acceptance "a prior month re-opened still computes on its original version"; bonus
"%/cap/eligibility from the pinned `StatutoryConfig`"; `CLAUDE.md` `guard-statutory-hardcode`,
`guard-hardcoded-values`.

**The UI must:** print the **pinned config version and its effective-from date on the payroll run, the
payslip, the filing artefact and the bonus/arrears run** — *"Computed on StatutoryConfig v2026.3 · effective
01 Jul 2026"*; on an arrears run, show **per affected month which version was used**, because they differ;
present a config change as a **new version with a diff against the previous** (old rate → new rate, effective
date, who published), never as an editable settings form; warn, before a run is computed, when a newer config
version exists and state what will happen; show every displayed statutory rate/ceiling/slab **as read from a
named config version** so nobody can copy a number into a design as a literal.

**The UI must NOT:** hardcode any rate, ceiling, slab, percentage or threshold in a screen, a mock, a
tooltip, or example copy (design mocks leak into implementation — the "15% variance gate" in the current
payroll console is exactly this, see §8-F5); offer "Edit config" (it is immutable — the verb is **Publish new
version**); let a user pick a config version for a historical month.

**Roles/screens:** Payroll Operator + Accountant (run, payslip, filing) · Group Admin (config version
management) · Employee (payslip footer).

**Visible copy required:** *"StatutoryConfig v2026.3 (effective 01 Jul 2026) — pinned to this run."* ·
*"July arrears recomputed on v2026.2, the version in force that month."* · *"A newer version (v2026.4,
effective 01 Sep) exists. It applies from the September run onward."*

---

## O10 · Payslip / Form 16 / bank-file protection

**Source:** dev-spec §8 "password-protected payslips/Form 16", "Encryption … object-store encryption at
rest"; M10 Payslip "is_locked … Password-protected PDF"; M11 Form 16/24Q/12BA; blueprint §4 "Payslip
generation (password-protected) + ESS download".

**The UI must:** state, at the download point, **that the file is password-protected and what the password
is derived from** (never the password itself in the same channel) — *"The PDF opens with your PAN in capitals
and your date of birth (DDMMYYYY)."* — and note that this hint is itself a PII hint, so it must be shown only
to the document's own subject `[judgement]`; **audit every payslip / Form 16 / bank-file download** with actor
+ subject + timestamp, and show the employee their own download history `[judgement]`; show the payslip's
**locked** state and its run + approval provenance; treat the **NEFT bank file** as the most dangerous export
in the product — full account numbers for the whole payroll — gate it behind checker approval, generate it
**once**, name the generator, expire the download link, and record every re-download.

**The UI must NOT:** offer a bulk "download all payslips" to any role without a per-subject audit row; e-mail
or SMS a payslip/Form 16 as an unprotected attachment or a public link; render the bank file inline in the
browser; let a Payroll Operator regenerate the bank file after disbursement without a fresh checker approval
`[judgement]`; show a payslip of another employee to a Department Head or Principal without the salary PII
permission (O3).

**Roles/screens:** Employee (own payslips, Form 16) · Payroll Operator (run outputs) · Accountant (bank file,
register).

---

## O11 · Never display or log PII casually

**Source:** `CLAUDE.md` `guard-pii-logging` ("PAN, Aadhaar, UAN, ESIC, bank account, salary, DOB, phone in
log statements are blocked"); dev-spec §8 PII classification; §10 "structured logs"; M15.1 grievance "PII
never logged".

**The UI must:** keep PII out of **client-side telemetry and analytics events, error/crash reports, Sentry
breadcrumbs, network URLs and query strings, `localStorage`/`IndexedDB`/drift caches beyond what offline
attendance genuinely needs, browser page titles and history, print headers/footers, and screenshots used in
docs, demos, seed data or design mocks**; use **opaque IDs in URLs**, never PAN/Aadhaar/emp-code-plus-name;
sanitise **error messages** — *"That document could not be uploaded"*, never *"PAN ABCDE1234F rejected"*.

**The UI must NOT:** put a person's name + salary in a notification body or push payload (the lock screen is a
public surface `[judgement]`); include PII in an idempotency key, a support/diagnostic bundle, or a
copy-as-text of a table; ship a design mock containing a plausible real PAN/Aadhaar/account number (use
obviously-synthetic values).

**Roles/screens:** all — this is a build-time discipline that the *design* must not force (a screen that puts
a bank account in a page title creates the violation).

---

## O12 · Hindi/English parity for anything a person must legally understand

**Source:** dev-spec M13 "all user-facing copy is Hindi + English via i18n"; M17 same; §9 Localisation;
`CLAUDE.md` `guard-i18n-strings`; `DESIGN.md` principle 11 "One language at a time … never half-translated".

**The UI must:** ship **full parity** — with no English fallback — for: consent notices and retention text,
the DPDP rights surface, payslip labels and totals, Form 16 / declaration screens, the leave policy and
balance rules a person acts on, document-request instructions and rejection reasons, disciplinary/grievance
and helpdesk copy, F&F breakdowns, and every irreversible-action confirmation; keep **numbers, money, dates
and statutory identifiers in the same canonical form in both languages** (Indian lakh-crore grouping,
DESIGN 4) so a figure never differs between languages; budget ~25% taller line-height for Devanagari in every
consent/notice block (DESIGN 11) — these are the longest strings in the product and are the ones that must
not truncate.

**The UI must NOT:** show a half-translated consent or confirmation; truncate or `…`-clip legal copy;
leave statutory artefact names untranslated *without* keeping the official English term alongside (see
§9-Q6 — "Form 24Q" must remain identifiable).

**Roles/screens:** all, especially Employee ESS and mobile.

---

## O13 · Grievance & helpdesk confidentiality

**Source:** dev-spec M15.1 "grievance tickets are access-restricted (confidential handling, PII never
logged); internal comments are hidden from the raiser; every transition is audited"; entity `TicketComment.is_internal`.

**The UI must:** make the **internal/visible-to-raiser** state of a comment unmistakable at the moment of
writing (a distinct composer, a persistent label — never a checkbox that defaults ambiguously `[judgement]`);
restrict the grievance category to the designated role and keep it out of every general ticket list, count and
dashboard; show the raiser who currently holds their ticket and its SLA, without exposing internal notes;
audit reassignment of a grievance.

**The UI must NOT:** show grievance subjects in a shared queue or a notification title; include the ticket
body in an e-mail/SMS notification; allow bulk export of grievance tickets `[judgement]`; let the accused
party's manager appear as a default assignee for a grievance about them `[judgement — flagged as a design
constraint, resolution is HR policy]`.

**Roles/screens:** Employee (raise, track) · HR Operator (triage) · designated grievance role.

---

## O14 · Appraisal — append-only, advisory, and scoped

**Source:** dev-spec M17 "Ratings are **append-only** once submitted (a revision supersedes)";
"Increment/promotion recommendation is **advisory** … never auto-applied and still passes payroll
maker-checker"; "PII/scores access-scoped"; every transition audited.

**The UI must:** mark a submitted rating as final and offer only **Revise (supersedes, with reason)**; label
a recommendation explicitly as *"Recommendation — not applied"* and route it to payroll as a **proposed**
effective-dated revision that still shows the maker-checker gate; scope 360° inputs so a peer/student/parent
source cannot see other sources' scores or comments.

**The UI must NOT:** offer Edit or Delete on a submitted rating; draw an "Apply increment" button on the
appraisal screen (the action lives in payroll, behind maker-checker); show a composite score to a role
outside the review chain; attribute anonymous 360° feedback (see §9-Q7 on student/parent minors' input).

---

## O15 · Attendance capture — geo, selfie, biometric

**Source:** dev-spec M9 (`geo`, `selfie_ref`, source biometric/mobile/web); blueprint §2 "GPS geo-tagging +
geo-fencing … selfie/photo capture (anti-proxy)"; dev-spec §8 PII classification; §9 "Mobile offline".

**The UI must:** show the notice **before the first capture** and a persistent indicator that location + a
photo are being recorded *at each punch*; show the employee **their own** captured geo/selfie history and its
retention window; show **provenance on every attendance row** (DESIGN 6) — device, gate, source — so a
disputed day is arguable; make regularisation a **request with a reason**, visible to the employee, never a
silent HR overwrite.

**The UI must NOT:** track location in the background or outside a punch; retain the selfie beyond the
attendance-dispute window without saying so `[judgement — retention period is a policy call, §9-Q8]`; show one
employee's selfie/geo to another employee; expose a live map of staff positions `[judgement — surveillance
affordance, out of scope of a punch]`.

---

## O16 · Auth hardening as a visible contract

**Source:** dev-spec §8 "MFA for admin/payroll roles; rate-limiting; lockout; audit of logins"; §7 "JWT
(access ~15 min, refresh rotating)"; M2 "optional MFA for admin/payroll roles".

**The UI must:** require and *state* MFA for Group Admin, HR Operator, Payroll Operator and Accountant; show
the user their **own session and login history** with device and location, and a "sign out everywhere"; use a
**non-enumerating** failure message (*"That staff ID and password don't match"*, never "no such staff ID") —
the current login copy is already correct here (§8-F2); state lockout in words with the remaining time; make
session expiry graceful mid-form so a payroll operator does not lose a triage session and re-do it blind
`[judgement]`.

**The UI must NOT:** offer "remember me" on a shared school desktop without a stated consequence; auto-fill or
retain a staff ID + password on a kiosk; hint at whether an account exists via the OTP path.

---

## O17 · Idempotency — no double-processing, visibly

**Source:** dev-spec §7 "**idempotency keys** required on payroll/statutory/settlement actions so a retry
never double-processes"; §9 "payroll/statutory operations idempotent & resumable".

**The UI must:** disable-and-spin the control on submit for every payroll/statutory/settlement action, hold
the disabled state until the server confirms, and on network failure show **"we don't know yet — checking"**
followed by the actual state, never a naive "Retry" that could double-pay `[judgement on the copy]`; make a
long-running run **resumable and re-enterable** without restarting it; show the run's server-side state as the
source of truth, not the client's optimistic state.

**The UI must NOT:** allow a second click to fire a second request on any money action; offer "Run again" on a
run in a terminal state.

---

## O18 · Effective-dating as the interaction model

**Source:** dev-spec §4.3 "Records that change over time … are **never edited in place** — a new dated row
supersedes the old" (salary, statutory config, contracts); M10 "effective-dated salary; revisions add rows".

**The UI must:** replace **Edit** with **Revise, effective from `<date>`** on salary, contract, statutory
config and policy records; show the **timeline of versions** with each row's effective window and author;
warn, loudly, when an effective date falls **inside a period that has already been paid or filed** and state
the consequence (an arrears recompute and possibly a revised return — O9, A47).

**The UI must NOT:** present a back-dated change as an ordinary edit; hide superseded rows; allow an effective
date to be changed after the row is used by a run.

---

# §2 — Action guardrail register

Every action below **touches money, PII, a person's record, or a statutory artefact**. Columns:

- **Who @ scope** — role(s) and the scope at which the action is offered.
- **Gate** — *absent* (no right → do not draw) / *disabled+reason* (right held, precondition unmet) /
  *offered*.
- **2nd person** — `—` none · **approval** (a different role signs off) · **MC** true maker-checker with a
  *distinct individual* who cannot be the maker.
- **Reversible / ritual** — what must happen before an irreversible action commits. "Typed" = the user types
  a specific token (period, amount, or the word) — never a bare "Are you sure?".
- **Audit → visible where** — what is written, and where the attribution must be *readable in the UI*.

PII exposure, statutory effect, and compliance-loaded options are called out in the notes under each table.

## 2.1 Identity & access (M2)

| # | Action | Who @ scope | Gate | 2nd person | Reversible / ritual | Audit → visible where |
|---|---|---|---|---|---|---|
| A1 | Sign in | all | offered | — | n/a | login event (actor, time, device, IP) → user's own session history; admin login report |
| A2 | Request SMS one-time code | all | offered | — | n/a | OTP issue/verify (never the code, never the full phone) → session history |
| A3 | Create user / assign role at scope | Group Admin @group; Principal/HR @campus if granted `iam.manage` | absent otherwise | **approval** `[judgement — granting `payroll.approve` or `people.pii.read` should need a second admin; spec is silent → §9-Q9]` | reversible (revoke), but the window it opened is not — show effective-from | before/after role set → role-assignment history on the user + audit log |
| A4 | Grant/revoke `people.pii.read` (field-level PII) | Group Admin @group | absent otherwise | **approval** `[judgement]` | reversible | grant + grantor + scope + reason → visible on the grantee's profile and on the *subject's* Your-data page `[judgement]` |
| A5 | Set the maker-checker capability flag on a role | Group Admin @group | offered; **disabled+reason** if it would let one role hold both `payroll.run` and `payroll.approve` | **approval** `[judgement]` | reversible | before/after → role history; and a standing warning on the payroll console if the config is permissive |
| A6 | Deactivate user / revoke access | Group Admin, HR @campus | offered | — | reversible; **typed** staff ID; must state what is retained (O2) | actor + reason → employee activity + audit |
| A7 | "View as" / impersonate | **nobody** | **never build** (§3) | | | |

**Notes.** A3/A4 are the highest-leverage actions in the product: they are how PII and money rights are
created. Options that carry consequence: **scope level** (group vs campus vs department — a mis-set scope is
the O7 failure), **effective from/to** (a temporary grant must expire on its own `[judgement]`).

## 2.2 People & PII (M3, §4.1, §8)

| # | Action | Who @ scope | Gate | 2nd person | Reversible / ritual | Audit → visible where |
|---|---|---|---|---|---|---|
| A8 | Create employee | HR @campus | offered | — | reversible pre-payroll | actor → employee activity ("Added by … on …") |
| A9 | Revise employee PII field (PAN/Aadhaar/UAN/ESIC/bank/DOB) | HR @campus + `people.pii.read` | absent without the PII permission | **approval** for **bank account** `[judgement — a changed bank account before a run is the classic payroll-fraud vector; and the current console already flags it as an exception, see §8-F4]` | supersede, never edit (O18, O6); show old → new | before/after (values masked in the log render) → employee activity **and** the payroll run's exception list |
| A10 | **Reveal** a masked PII field | roles with `people.pii.read`, within scope; Employee for self | absent for Department Head (M2 acceptance) | — | n/a (read) | actor + field + subject + time → subject's Your-data page (O3) and admin PII-access report |
| A11 | Record a lifecycle event (confirm/transfer/promote/exit) | HR @campus; Principal for own campus | offered | approval for transfer across campuses `[judgement]` | append-only ServiceRecord — no delete; **typed** effective date | actor + event + effective date → service book (visible timeline) |
| A12 | Export staff register / directory | HR, Principal @own scope | **disabled+reason** while a PII column is selected without the permission | — | irreversible once downloaded — **state the row count, the scope, and that the export is recorded** | actor + columns + row count + scope → export log, visible to Group Admin |
| A13 | Bulk import employees | HR, Group Admin | offered | — | must **preview and confirm** counts; **typed** count `[judgement]` | actor + file digest + created/updated counts → audit |

**Notes.** PII exposure: A10 and A12 are the two PII-egress actions in this domain; both must be audited and
both must tell the user so. Statutory effect: A9 on **PAN** changes 24Q/Form 16 (see A54); on **UAN/ESIC**
changes ECR — warn when the period is already filed. Options: a **document/field category** may be
child-safety restricted (O8).

## 2.3 Documents (M4)

| # | Action | Who @ scope | Gate | 2nd person | Reversible / ritual | Audit → visible where |
|---|---|---|---|---|---|---|
| A14 | HR uploads a staff document | HR @campus (`documents.manage`) | absent for Employee **always** | — | supersedes; prior version retained | actor + doc type + source → document history ("Uploaded by … · 8 Aug") |
| A15 | Raise a `DocumentUpdateRequest` | HR @campus | absent for Employee (see §3) | — | cancellable (A19) | actor + reason + due date → the employee sees *"Requested by Meera Nair, HR · 8 Aug · due 18 Aug"* |
| A16 | Employee responds (upload) | Employee, **self only**, **only while `status=open`** | **absent** in every other state — no Edit/Replace/Delete ever | — | re-submittable until verified; **the live document does not change** | actor + time → *"Your upload is with HR. The copy on record has not changed."* |
| A17 | **Verify** a response → promote to `StaffDocument` | HR @campus (`documents.verify`) | **disabled+reason** if the verifier is the uploader `[judgement]` | **approval** (verification *is* the second-person check on the employee's submission) | irreversible promotion — the promoted doc becomes the record of truth; prior retained | actor + before/after → *"On record since 8 Aug · verified by Meera Nair, HR"* |
| A18 | Reject a response | HR @campus | offered | — | reversible (re-request) | actor + **reason (mandatory, shown to the employee verbatim)** → employee action queue |
| A19 | Cancel a request | HR @campus | offered | — | reversible (re-raise) | actor + reason → document history |
| A20 | Open/download a document file | HR @campus; Employee for own; **police/BGV: restricted role only** | absent for Department Head; absent for BGV outside the restricted role (O8) | — | n/a | **view** event for BGV and for any restricted category → *"Opening this is recorded"* + subject's Your-data page |
| A21 | Delete a document | **nobody** | **never build** (§3) | | | |

**Notes.** Options with consequence: **`doc_type`** — `police_verif` is child-safety restricted (O8);
`aadhaar`/`pan` are PII-classified (O3). **Due date** on A15 drives the overdue state an employee sees.
Statutory effect: a verified PAN/Aadhaar/UAN document changes what is filed (A54).

## 2.4 Recruitment (M5)

| # | Action | Who @ scope | Gate | 2nd person | Reversible / ritual | Audit → visible where |
|---|---|---|---|---|---|---|
| A22 | Candidate applies (public career site) | unauthenticated | offered | — | irreversible submission — **notice + explicit consent before submit** (O1) | consent artefact (version + time) → visible on the candidate record and to the candidate |
| A23 | Advance / reject an application; set eligibility flags | HR/Recruiter @campus | offered | — | reversible; **ineligible must be marked, never silently dropped** (M5 business rule) | actor + stage + flag reason → application timeline |
| A24 | Send offer / record acceptance → **convert to Employee** | HR @campus; approver for the requisition | **disabled+reason** until the requisition is approved (M5) | **approval** (budget-based requisition approval chain) | conversion creates a person's record + carries documents as `pending` — **state that** before committing | actor + CTC + pay group + join date → employee service book origin |
| A25 | Record background/police-verification outcome | restricted HR role only (O8) | absent for everyone else | — | append-only; supersede on renewal | actor + status + validity → restricted view only; **never** in a list column |

**Notes.** PII exposure: A22 collects a candidate's phone, DOB and qualifications from an unauthenticated
surface — the highest-risk collection point in the product `[judgement]`; A24 propagates candidate PII into
`StaffDocument`. Options: **CTC** on the offer is salary PII (O3) and must be masked in list views.

## 2.5 Leave & attendance (M8, M9)

| # | Action | Who @ scope | Gate | 2nd person | Reversible / ritual | Audit → visible where |
|---|---|---|---|---|---|---|
| A26 | Apply for leave | Employee, self | **disabled+reason** in a blackout term / when balance is short, with the rule stated (M8) | — | cancellable before approval | actor + type + dates → request timeline |
| A27 | Approve / reject leave | Dept Head, Principal @scope | **disabled+reason** when the approver is the applicant → *"You cannot approve your own leave"* | **approval** (a distinct person; never self) | reversible until it hits a run | actor + decision + reason → *"Approved by A. Deshpande · 9 Aug"* on the employee's record |
| A28 | Cancel an **approved** leave | HR, approver | **disabled+reason** once the period is in a locked payroll run | approval | reverses balance + paid-days — **state the payroll consequence** before committing | actor + reason → balance ledger, visible |
| A29 | Adjust a leave balance manually | HR @campus | offered | approval `[judgement — a balance grant is money at encashment]` | append-only adjustment with reason, never an overwrite | actor + delta + reason → balance ledger row visible to the employee |
| A30 | Mark attendance (geo + selfie) | Employee, self | offered; **disabled+reason** outside geofence/shift | — | irreversible punch — correction goes via A31 | source + device + geo + time → *"Marked by mobile · Indiranagar gate · 08:42"* on the employee's own row |
| A31 | Request / approve regularisation | Employee (request); Dept Head/HR (approve) | approver control absent for the requester | **approval** | reversible before the run locks | actor + old→new status + reason → attendance row provenance |
| A32 | HR bulk attendance correction | HR @campus | offered | approval `[judgement — bulk paid-days edits move money for many people at once]` | **preview + typed count**; irreversible after the run locks | actor + affected count + reason → each affected row shows *"Corrected by … · reason"* |

**Notes.** Statutory effect: A27–A32 all change **paid-days**, which change gross, PF/ESI base and TDS. Any
of them applied to a **period already in a locked/approved run** must be refused, or routed to arrears (A46) —
never silently applied. Options: **leave type** — a medical/sick type carries health data; the *reason text*
must never appear on a shared roster or dashboard (see §8-F8) `[judgement]`.

## 2.6 Payroll (M10) — the core of the register

| # | Action | Who @ scope | Gate | 2nd person | Reversible / ritual | Audit → visible where |
|---|---|---|---|---|---|---|
| A33 | Start / compute a run | Payroll Operator @legal entity (`payroll.run`) | **disabled+reason** if a run for the period exists | — | re-computable while `draft`; idempotent (O17) | actor + period + **pinned config version** + snapshot digest → run header |
| A34 | **Clear** a variance exception | Payroll Operator (maker) | **disabled+reason** after maker submission ("Locked after submission") | — | reversible via A36 while draft | actor + **mandatory reason/reason-code** + time → the exception row **and** the run dossier (see §8-F6 — currently missing) |
| A35 | **Hold** a payout (withhold from the bank file) | Payroll Operator | offered | — | reversible while draft; **irreversible once the run is approved** — the person is not paid this cycle | actor + reason + amount → run dossier and the held employee's payslip note `[judgement]` |
| A36 | Reopen a cleared/held exception | Payroll Operator | disabled after submission | — | reversible | actor + reason → dossier |
| A37 | **Maker: sign & submit** | Payroll Operator holding `payroll.run` | **disabled+reason** while any exception is open ("3 open exceptions block sign-off") | — | **irreversible in effect** — locks the run; only a checker return (A39) reopens it | actor + signature time + snapshot digest → maker panel, permanently |
| A38 | **Checker: approve & release** | a **distinct** person holding `payroll.approve` | **visible + disabled with the rule** for the maker (*"You prepared this run…"*); **absent** for roles without `payroll.approve` | **MC — distinct individual** | irreversible: money moves. **Re-authenticate**, restate net payable + payee count + held count, **typed period** (`2026-08`) | actor + amount + payee count + config version → checker panel + payslip provenance ("Run PR-2026-08 · approved 12 Aug by …") |
| A39 | **Checker: return to maker with a reason** | checker | **must exist** — see §8-F7, it is missing today | — | reversible by design | actor + reason → run timeline; maker is notified with the reason |
| A40 | Generate / download the NEFT bank file | Accountant @legal entity | **absent** before checker approval; the console already says *"Bank file is generated only after checker approval"* | inherits A38 | irreversible egress of every account number — **state the payee count and that the download is recorded**; expiring link | actor + time + payee count + file digest → run outputs, every re-download listed |
| A41 | Release payslips to ESS | Payroll Operator | disabled+reason before approval | inherits A38 | irreversible (people have read them) | actor + time → payslip provenance seal |
| A42 | Approve a loan / advance | `payroll.approve` holder ≠ requester | absent for the requester | **MC** (M10: "Loan approval uses `payroll.approve` maker-checker") | reversible before first deduction | actor + principal + rate + tenure → loan record, visible to the employee |
| A43 | Foreclose / waive a loan | `payroll.approve` holder | offered | **MC** `[judgement — a waiver is a payment; the spec says foreclosure/waiver "is audited" but does not name a checker → §9-Q10]` | irreversible; **typed** amount; waiver may be a **taxable perquisite** — say so | actor + reason + amount → loan history, employee-visible |
| A44 | Approve / reject a reimbursement claim | Dept Head or HR (approver) ≠ claimant | absent for the claimant | **approval** | reversible before payout batch | actor + decision + reason → claim timeline, employee-visible |
| A45 | Approve a **reimbursement payout batch** | distinct checker with `payroll.approve` | disabled-with-rule for the maker | **MC — distinct individual** (M10 acceptance, verbatim) | irreversible: money moves | actor + batch total + claim count → batch record + each claim |
| A46 | Compute + **post arrears** | Payroll Operator (maker), distinct checker | disabled+reason until each affected month's recompute is complete | **MC — distinct individual** (M10) | irreversible; **append-only — a correction supersedes, never edits** | actor + **per-month config version used** + delta → arrears record and each affected payslip's supersession note |
| A47 | Revise salary effective-dated (incl. back-dated) | HR/Payroll @campus | offered | **approval**; **MC** if it back-dates into a paid period `[judgement — it becomes an arrears posting, which is MC]` | supersede, never edit (O18); **warn hard** when the effective date crosses a paid/filed period and state the arrears + revised-return consequence | actor + old→new + effective date → salary timeline, visible on the employee record |

**Notes.**
- **PII exposure:** A38/A40/A41 expose salary and bank data at scale; A34's dossier shows per-employee net pay
  and components — that view needs the salary PII permission, not merely `payroll.run` `[judgement]`.
- **Statutory effect:** A38 fixes the figures that ECR/PT/TDS challans and eventually 24Q/Form 16 are built
  from. Anything that changes a **paid** period (A28, A32, A47, A46) has a downstream filing consequence and
  the UI must say which artefact is affected and that the correction will appear as a **supersession**, not a
  replacement (O6, A54).
- **Options that carry consequence:** *effective date* (back-dating across a filed period — A47); *reason
  code* on A34/A35 (this is the audit's only explanation — it must be a controlled list plus free text, not
  free text alone `[judgement]`); *pay head* selection (taxable vs exempt vs PF-applicable changes the
  statutory base — the picker must show those three flags inline `[judgement]`); *variance threshold* — see
  §8-F5, it must come from config, never a literal in a screen.

## 2.7 Statutory (M11) & F&F (M12)

| # | Action | Who @ scope | Gate | 2nd person | Reversible / ritual | Audit → visible where |
|---|---|---|---|---|---|---|
| A48 | Publish a new `StatutoryConfig` version | Group Admin / a designated compliance role @tenant | offered; **Edit is absent — the verb is Publish new version** | **approval** `[judgement — a wrong ceiling misprices every run; spec makes the config immutable but names no checker → §9-Q11]` | irreversible (immutable) — **show a diff vs the previous version and its effective-from** before publishing | actor + version + diff + effective_from → config version list, and every run header that pins it |
| A49 | Generate a filing artefact (ECR / 24Q / Form 16 / PT / ESI) | Payroll Operator or Accountant (maker) | disabled+reason until the run is approved | — | regenerable while unfiled | actor + period + config version + artefact digest → filing record |
| A50 | **Submit / mark filed** (the statutory finalisation) | distinct checker with `statutory.file` | disabled-with-rule for the maker | **MC — distinct individual** (dev-spec §8; M11) | irreversible — it is a government submission. Restate entity, period, artefact and total; **typed** period | actor + time + acknowledgement ref → filing record, permanently visible |
| A51 | Approve a **bonus run** | distinct checker (`statutory.file`) | disabled-with-rule for the maker (M11: "cannot be finalized by its maker") | **MC — distinct individual** | irreversible; append-only | actor + %/cap/eligibility **as read from the pinned config** + total → bonus run record |
| A52 | Employee submits an investment declaration / elects a regime | Employee, self | **disabled+reason** outside the declaration window | — | revisable within the window; **it is a declaration the employee is answerable for — say so** `[judgement]` | actor + regime + version → declaration history, employee-visible |
| A53 | Verify declaration proofs | Payroll Operator | offered | — | reversible before the TDS run that uses it | actor + decision + reason → declaration record, employee-visible |
| A54 | Issue a **revised** Form 16 / correction return | Accountant/Payroll (maker) + distinct checker | disabled+reason unless an original exists | **MC — distinct individual** `[judgement — same class as A50]` | irreversible; the original **remains on record and is marked superseded**, never replaced (O6) | actor + reason + what changed → **both** artefacts visible, with *"Supersedes Form 16 issued 15 Jun 2026"* |
| A55 | Initiate F&F | HR @campus | offered on exit lifecycle | — | reversible before approval | actor + LWD → settlement record |
| A56 | **Approve F&F settlement** | distinct checker `[judgement — see §9-Q4]` | disabled-with-rule for the preparer | **MC (recommended)** | irreversible: money moves, `User.is_active` flips false (M12) | actor + components (encashment, gratuity, recoveries, TDS true-up) + net → settlement + final payslip |
| A57 | Revoke access at F&F completion | system on A56; HR manually | — | — | irreversible for the user — **must state what the ex-employee can still reach** (O2, §9-Q2) | actor/system + time → employee record |

## 2.8 Appraisal, helpdesk, platform (M17, M15, M15.1)

| # | Action | Who @ scope | Gate | 2nd person | Reversible / ritual | Audit → visible where |
|---|---|---|---|---|---|---|
| A58 | Submit an appraisal rating (self/manager/peer/student/parent) | per-source permission, scoped | absent outside the review chain | — | **append-only** — only Revise-with-reason (M17) | actor (or anonymised source) + score + time → review timeline |
| A59 | Moderate / finalise a review | HR/Principal @scope | disabled+reason before all stages submit | approval | irreversible finalisation | actor + composite → review record |
| A60 | Raise an increment/promotion **recommendation** | Manager/HOD | offered | — | advisory only — **must be labelled "not applied"** (M17) | actor + recommendation → payroll's proposed-revision queue (A47) |
| A61 | Raise a helpdesk / **grievance** ticket | Employee, self | offered; grievance category visible to all raisers, its **queue** restricted (O13) | — | reversible (withdraw) | actor + category → ticket timeline; grievance body never in notifications |
| A62 | Add an internal comment | HR/assignee | offered, with an unmistakable internal composer | — | append-only `[judgement]` | actor + time → internal thread only |
| A63 | Reassign a grievance | designated role | absent otherwise | approval `[judgement]` | reversible | actor + reason → restricted audit |
| A64 | Run / export a report | per report, per scope (O7) | **disabled+reason** when a PII column is requested without permission | — | irreversible egress — **state scope, row count, and that it is recorded** | actor + report + params + row count → export log |
| A65 | View the audit log | Group Admin; HR within scope | absent otherwise | — | read-only, **no controls at all** | the view itself is logged `[judgement]` |
| A66 | Execute a retention/erasure action | Group Admin, on a queue | **disabled+reason** for anything inside a statutory window (O2) | **approval** `[judgement]` | irreversible — **typed** confirmation naming the subject and the basis | actor + basis + scope → retention log (the log survives the data) |
| A67 | Handle a DPDP access / correction / withdrawal request | Employee raises; Group Admin/HR fulfils | offered | — | correction is a **supersession**, never an erase (O6) | actor + request + outcome + SLA → visible to the employee end-to-end |

---

# §3 — Actions we must never build

Each of these would let policy be violated by a correctly-implemented button. They are not "gate them
carefully" — they must not exist as affordances.

| Never build | Because |
|---|---|
| **Edit / Replace / Upload / Delete** on a staff document for the Employee role | dev-spec M4: no direct write path; `documents.write` is not granted to Employee. `DESIGN.md` 9. |
| **Employee-initiated document change** that creates or replaces a `StaffDocument` | M4: the *only* channel is an HR-initiated request. A "request a correction" that writes a document is the same violation wearing a polite label. |
| **Single-click payroll run / release** | dev-spec §8 maker-checker; `DESIGN.md` 10. **Note:** the blueprint asks for exactly this — see §7-C1. |
| **Self-approval of anything**: own leave, own regularisation, own claim, own loan, own run, own filing, own F&F | M8/M10/M11 approval chains; §8 maker-checker; M13 "cannot approve their own claim". |
| **Hard delete** of an audit log, statutory record, payslip line, appraisal rating, service record, or posted arrears | dev-spec §4.2/§4.3, M15 "append-only", M10 "append-only (a correction supersedes, never edits)", M17. |
| **Edit-in-place** of salary, contract or `StatutoryConfig` | dev-spec §4.3, §4.4 (immutable, versioned). |
| **Unaudited PII reveal**, "reveal all", or a bulk unmask/export of PAN/Aadhaar/bank | dev-spec §8 "access-logged"; §4.1 field-level permissions. |
| **Full Aadhaar display** anywhere | dev-spec entity catalog: `aadhaar(masked)`. See §9-Q3. |
| **Impersonate / "view as employee"** with write ability | It forges attribution and breaks the audit's actor guarantee `[judgement]`. A read-only, consented, banner-marked, fully-logged support view is the *most* that could ever be argued — and it is not MVP. |
| **A "skip maker-checker" / emergency-release override** | There is no exception in the spec, and an override is the only path a fraud would ever need `[judgement]`. If a business emergency case is raised, it goes to §9, not into a screen. |
| **Silent auto-clear of payroll exceptions with no reviewable list** | The current console auto-clears 7 items "below the 15% gate" and does not show them — §8-F5/F6. |
| **BGV outcome as a list column, filter, export or notification** | dev-spec §8 child-safety "access-restricted". |
| **Tenant/campus as a client-settable parameter** (a picker that widens scope) | dev-spec §7 "tenant is implicit from the token — **never** a request parameter a client can set". |
| **Payslip / Form 16 sent as an unprotected attachment or public link** | dev-spec §8 "password-protected payslips/Form 16". |
| **A live staff-location map** | Beyond the punch-time purpose consented to (O15) `[judgement]`. |

---

# §4 — Per-role summary

| Role | May see | May do | Guardrails on it |
|---|---|---|---|
| **Group Admin** | Everything within the tenant, structurally. PII **masked by default**; reveal only with the field permission (O3). | Org/tenancy setup, roles & scopes (A3–A5), `StatutoryConfig` publication (A48), retention actions (A66), audit log (A65). | The most dangerous role in the product. Every grant is audited and visible to the *subject* (A4). MFA mandatory (O16). Cannot silently widen their own PII rights without a second admin `[judgement]`. Should not routinely be the payroll checker — separation of duties `[judgement]`. |
| **Campus Principal** | Their campus only — in lists, search, **pickers, exports, dashboards and totals** (O7). Staff records, leave, attendance, documents (not BGV outcomes unless in the restricted role). | Approve leave (A27), approve regularisation, oversee document expiry, campus reporting. | Never sees another campus, and no "All campuses" option exists for them. Salary/bank masked unless granted. Group totals are withheld, not greyed. |
| **HR Operator** | Staff records in scope; documents; ATS; requests. PII masked, revealable with permission and audited. | Create/revise employees (A8–A9, A11), upload documents (A14), raise requests (A15), **verify** (A17), bulk import (A13), exit (A55). | Cannot verify a response they themselves uploaded (A17) `[judgement]`. Cannot approve payroll. Bank-account revision needs a second approver (A9) `[judgement]`. Exports are scoped, counted and logged (A12). MFA mandatory. |
| **Payroll Operator** | Payroll runs, variance dossiers, salary data (needs the salary PII permission for per-person figures `[judgement]`), statutory artefacts. | Compute a run (A33), triage exceptions (A34–A36), **maker sign-off** (A37), generate filings (A49), verify proofs (A53). | **Is the maker. Can never be the checker on the same run** — the Approve control is visible, disabled, and says why (A38). Cannot see bank *numbers* unless separately granted `[judgement]`. MFA mandatory. |
| **Accountant** | Entity-level money: registers, liabilities, bank file, filings. Aggregate first; per-person salary only with the PII permission `[judgement]`. | **Checker** on payroll release (A38) and filings (A50) where assigned; bank-file generation (A40); reconciliation reports. | Cannot be the maker of what they check. Bank-file generation is post-approval, expiring and logged. MFA mandatory. |
| **Department Head** | Their department: attendance, leave, team approvals. **No bank/PAN/salary — the reveal control does not exist for them** (dev-spec M2 acceptance). | Approve leave (A27) and regularisation (A31), approve reimbursement claims (A44), appraisal review (A58). | Cannot approve their own anything. No BGV access. No exports carrying PII. Their scope is the department, including in pickers. |
| **Employee** | **Only their own** record, payslips, Form 16, leave, attendance, documents, claims, tickets, appraisal, and **Your data** (O1/O2). Own PII unmasked, no reveal step. | Apply for leave (A26), punch (A30), request regularisation (A31), **respond** to a document request (A16), submit claims and declarations (A52), raise tickets (A61), self-appraisal, exercise DPDP rights (A67). | **No `documents.write` — no Edit, ever** (O4). No self-approval. No visibility of any colleague's PII, leave reason, salary or BGV. Their own consent, retention and PII-access history is visible to them. |

---

# §5 — Top risks if we design without these

Ranked by *(likelihood a designer draws it wrong) × (severity if shipped)*.

| # | Risk | Most likely to get it wrong | Why it ranks here |
|---|---|---|---|
| **R1** | **A payroll release that one person can complete.** A conventional "Approve" button with a confirm dialog, or a checker whose only option is Approve (a rubber stamp). | **Payroll run console** (`design/v2-x.html`) — it already models sign-off, and it already lacks the *return-to-maker* action and says "own session" rather than "different person". | Money leaves the school. It is the single non-negotiable most likely to be defeated by a *well-designed-looking* screen. Blueprint even asks for "single-click payroll run" (§7-C1). |
| **R2** | **An Edit affordance on a staff document.** Every profile pattern in every HRMS has one; a designer will draw it from muscle memory. | **Employee profile / Documents screen (ESS)** — not yet built. | Directly violates M4 and the `DESIGN.md` principle written specifically to prevent it. Cheap to prevent now, expensive after the pattern spreads across ~40 screens. |
| **R3** | **PII rendered by default in a list or a hero.** A staff table with PAN and bank columns; a profile header with DOB and phone; salary shown in an org chart. | **Staff directory / staff list, employee profile header, payroll variance dossier.** | Turns every screenshot, export and support session into a breach, and makes the O3 reveal-audit meaningless. |
| **R4** | **Cross-campus leakage through a picker, search or total.** The record list is scoped correctly and the *approver dropdown*, *type-ahead*, or *dashboard total* is not. | **Any assignee/approver/checker picker; global search; group dashboard** (`design/v2-x2.html` shows "All campuses"). | Fails the M2 acceptance criterion outright and is invisible in review because the main list looks right. |
| **R5** | **No consent or retention surface anywhere in ESS.** DPDP obligations get treated as a backend concern. | **ESS home / profile** (`design/v3/`) — currently has none. | It is a statutory obligation that is *only* dischargeable in the UI. If it is not designed in this pass it will be bolted on as a legal-text modal nobody reads. |
| **R6** | **A statutory figure or rate typed into a screen as a literal**, and a run with no visible config version. | **Payroll console, statutory dashboard, payslip** — the "15% variance gate" literal is already there. | Breaks `guard-statutory-hardcode` and destroys the audit story ("what was this computed against?"). |
| **R7** | **A correction that visually replaces the value it supersedes.** | **Employee record, salary revision, arrears, revised Form 16.** | Append-only becomes a lie at the surface even if the database is honest — and the surface is what an auditor is shown. |
| **R8** | **Child-safety data treated as an ordinary document.** BGV appearing as a row, a chip, an expiry column, or a notification. | **Compliance/expiry board, staff document list, ATS candidate card.** | Safeguarding data with the widest blast radius and the least obvious visual difference from a degree certificate. |
| **R9** | **Leave *reason* or type exposed on a shared surface.** "On leave — medical" on a team roster is health data. | **Overview board "Out today", team calendar, cover board.** | Quiet, plausible, and already latent in the built overview board. |
| **R10** | **Half-translated legal copy.** Consent, confirmations and payslip labels ship English-only "for now". | **Every confirmation dialog and consent block.** | Breaks `guard-i18n-strings` and DESIGN 11, and specifically defeats the point of a notice a person must understand. |

---

# §6 — Designer's checklist

A screen does not ship until every line is answered. Print it next to the canvas.

1. **Every PII field on this screen is masked by default**, and the reveal is a deliberate, permissioned,
   audited action that tells the user it is recorded. (O3)
2. **No control on this screen offers something the role cannot do.** Absent when the right is missing;
   disabled-with-a-reason only when a state precondition or a per-instance rule blocks it. (§0 rule, DESIGN 9)
3. **Nothing consequential completes in one click.** Every irreversible action restates its consequence in
   specific words — amount, count, period, person — and never a bare "Are you sure?". (O5, O17, DESIGN 10)
4. **Anything that finalises money or a filing shows a maker panel and a checker panel**, names both people,
   and says in words that they must be different. (O5)
5. **Every consequential figure and state carries provenance** — who, when, from which run, on which config
   version, from which device. (O6, O9, DESIGN 6)
6. **Nothing is edited away.** Corrections show old → new with a reason and an author; there is no Delete on
   an audit, statutory, appraisal or posted-payroll record. (O6, O18)
7. **The scope is stated on the screen**, and applies to the list, the search, every picker, every filter
   option, every total, and every export. No out-of-scope record exists here, greyed or otherwise. (O7)
8. **A DPDP notice exists at every point this screen collects PII**, with purpose, retention and withdrawal —
   and the employee can reach "Your data" from here. (O1, O2)
9. **No PII in the page title, URL, breadcrumb, toast, tooltip, notification body, error message, empty
   state, export filename, or anything screenshotted.** (O11)
10. **Every string on this screen exists in Hindi and English at full parity**, with Devanagari line-height
    budgeted and no truncation of legal copy. (O12)
11. **No rate, ceiling, slab, threshold or percentage is typed into this screen** — each is read from a named,
    versioned config, and the version is shown. (O9)
12. **State is never carried by colour alone** — mark or word plus colour, including masked/revealed,
    verified/pending, held/cleared, locked/draft. (DESIGN 8)
13. **Child-safety and grievance records are not on this screen** unless the restricted role is the audience —
    and then their opening is logged and the user is told. (O8, O13)
14. **The employee's own view of this data exists**, and it is honest about who has looked at it. (O1, O3)

---

# §7 — Conflicts with `DESIGN.md` (flagged, not resolved — for BATMAN)

**C1 · "Single-click payroll run" vs maker-checker and DESIGN 10.**
`functionality-blueprint.md` §4 lists *"Single-click payroll run with exception/variance auto-detection before
disbursement **[MVP]**"*. `DESIGN.md` 10 says *"Nothing irreversible in one click … the interface must
actively refuse to let one person release money"*, and dev-spec §8 mandates maker-checker. Charitably the
blueprint means "one-click **compute**", but the words as written will be designed to. **Needs a ruling and a
blueprint correction.**

**C2 · DESIGN 1 "every element earns its place / cut anything shown twice" vs mandated disclosure.**
Consent notices, retention lines, config-version stamps, audit attribution, "recorded" warnings and scope
banners are all elements a reader would not "open the app for" — and several *are* repeated across screens by
design. Compliance disclosure cannot be cut on aesthetic grounds. Needs an explicit carve-out: *disclosure is
load-bearing furniture, and its cost is paid in hierarchy, not in deletion.* `[judgement]`

**C3 · DESIGN 4 "money is sacred — exact, never truncated" vs O3 masking of salary.**
A masked salary (`••••`) is not a truncated number, but the two rules will read as contradictory at the list
level. Needs a stated resolution: *masked money is absent, not abbreviated; when it is shown it is shown
exactly.* `[judgement]`

**C4 · DESIGN 3 "show the shape, then the number" vs statutory/legal figures.**
For a statutory liability, a payslip, a challan or an F&F breakdown, the exact figure must lead; a ring or a
donut that defers the number is wrong on those surfaces. Needs a boundary: shape-first applies to
*understanding*, never to *artefacts*. `[judgement]`

**C5 · DESIGN 7 "the empty state is a designed state" vs O7 scoped access.**
An empty state that says *"no records here"* is fine; one that says *"3 records are hidden"* or renders a
restricted placeholder is a disclosure. Needs a rule: out-of-scope data produces the **same** empty state as
genuinely-absent data. `[judgement]`

**C6 · DESIGN 11 "one language at a time" vs statutory artefacts with official English names.**
Form 16, Form 24Q, ECR, PF/UAN, and the payslip PDF itself may need to remain identifiable in English even in
the Hindi UI — and a generated PDF's language may be constrained by what a portal or an auditor accepts. Needs
a ruling on artefact language (see §9-Q6).

**C7 · DESIGN 9 "don't offer what governance forbids" vs the *deliberate* disabled checker button.**
The rule says do not draw what is forbidden; O5 says the maker **should** see a disabled Approve with the
reason, because the rule is the teaching. This is a genuine exception, not a contradiction, but it must be
written down or a reviewer will "fix" it. `[judgement]`

---

# §8 — Unmet by the screens already built

Reviewed: `design/v3/screens.jsx` + `design/v3/kit.jsx` (Login, Employee Home — the canonical v3 direction);
`design/v2-x.html` → `design/v2/experiments/payroll-run-console.jsx`; `design/v2-x2.html` →
`design/v2/experiments/overview-dashboard.jsx` (pre-v3 experiments).

**What is already right — keep these as the reference patterns**
- **v3 Home** masks the bank account in the credited-line (`"Credited to HDFC ••6841 on 31 July"`) — O3 in
  spirit, done well.
- **v3 Home** offers only **Respond** on document requests (`"doc.respond"`, both the PAN and police-verification
  items) and the copy already carries the governance model: *"HR verifies it before it goes on record."* — O4,
  exemplary.
- **v3 Home** payslip carries a provenance seal: *"Run PR-2026-07 · approved 29 July"* — O6.
- **v3 Login** errors are non-enumerating (*"Enter the staff ID from your school ID card"*), and
  *"your school's HR office sets up your account"* correctly forecloses self-registration — O16.
- **v3 kit** already has `navItemsFor(role)` / `ROLE_PERMISSIONS` role-filtering of the rail — the right
  skeleton for O7.
- **Payroll console** has a genuine two-panel maker/checker block with names, roles, staff IDs, a locked state
  after submission, a snapshot digest, *"open exceptions block sign-off"*, and *"Bank file is generated only
  after checker approval"* — the best compliance work in the repo so far.

**Gaps** (F = finding; all are against the built artefacts, none are blocking today since these are design
experiments, but each must be closed before the pattern is copied into ~40 screens)

| # | Finding | Where | Obligation |
|---|---|---|---|
| **F1** | **No DPDP surface anywhere.** No notice at any collection point, no retention line, no "Your data", no consent version, no access/correction/withdrawal route, no visibility of who revealed the employee's PII. | `design/v3/` (Login + Home) — entirely absent | O1, O2 |
| **F2** | **Login has no privacy notice or link**, and the SMS-OTP path uses the registered phone without saying so or stating that login events are recorded. | `v3/screens.jsx` Login (~L351) | O1, O16 |
| **F3** | **"Requires checker's own session" is the wrong rule.** A *session* is not a *person*; the same operator in a second browser satisfies that sentence. The copy must name a **different individual**, and the maker must see the disabled Approve with the reason. | `v2/experiments/payroll-run-console.jsx` L76 (`needChecker`) | O5 — **the most consequential wording defect found** |
| **F4** | **No pinned `StatutoryConfig` version on the run**, on the variance dossier, or anywhere in the console — even though a row's cause is literally *"PF wage ceiling applied mid-year"*, which is a config-version event. | payroll console (no `config`/`version` string exists) | O9 |
| **F5** | **A statutory-adjacent threshold is a literal in the design**: `AUTO_CLEARED = 7` items *"below the 15% variance gate"*. The 15% is a policy constant typed into a screen. | payroll console L~173, `qAuto` | O9, `guard-hardcoded-values` |
| **F6** | **Auto-cleared exceptions are invisible** — the comment says *"not shown"*. Seven money variances were suppressed from human review with no list, no drill-in, no record of the rule that suppressed them. | payroll console L173 | O6 `[judgement]` |
| **F7** | **The checker has no "Return to maker" action.** The only checker control is `Approve & release`. A checker who can only approve is a rubber stamp, and the state machine has no defined path back. | payroll console L556 | O5 / A39 |
| **F8** | **Exception triage actions capture no reason.** `Mark cleared` / `Hold payout` / `Reopen` mutate money outcomes with no reason code, no free text, and no visible attribution on the row afterwards. Holding a payout means a person is not paid — with no recorded why. | payroll console L493–495 | O6 / A34, A35 |
| **F9** | **`Approve & release` has no pre-commit ritual** — no re-authentication, no restatement of net payable + payee count + held count, no typed period. It is the single most irreversible action in the product. | payroll console L556 | O5, A38 |
| **F10** | **The variance dossier shows per-employee net pay and full component breakdowns unmasked**, with no salary-PII gate and no export/audit consideration. Also names an individual's exit and notice recovery in a shared operator view. | payroll console `EXC` L~145–175 | O3 `[judgement]` |
| **F11** | **No audit/activity trail on the run.** There is a state spine and a snapshot digest, but no "who did what" history a reviewer or auditor can read. | payroll console | O6 |
| **F12** | **The overview board is not scope-aware**: a flat nav (Overview…Statutory…Documents) with no role filtering, and an *"All campuses"* affordance on the cover board. Drawn as-is for a Campus Principal it fails the M2 acceptance criterion. | `v2/experiments/overview-dashboard.jsx` (nav L~90; `cbAll`) | O7 |
| **F13** | **Named individual employment states on a group board**: *"▼ 2 exits — T. Lakshmi Narayanan · 14 Aug"*, *"● 1 on notice — S. Kulkarni · last day 30 Sep"*. Notice-period status is sensitive and must be scoped to HR/Principal, not to whoever holds the board. | overview board `psExit`, `psNotice` | O7 `[judgement]` |
| **F14** | **Absence detail risks leaking leave *type***: the board summarises *"oldest 6 days · 4 medical"* in the request queue and lists who is out. "Medical" is health data; the *"Out today"* list must show absence only, never the type or reason. | overview board L183, `OUT` L220 | O3 `[judgement]` |
| **F15** | **Police/BGV renewal appears as an ordinary action-queue card** in the employee's home. Correct for the *subject*, but the card is a reusable pattern — the same component on an HR or Principal screen would put a child-safety record into a general queue. Needs the pattern marked restricted now. | `v3/screens.jsx` `act.police` (L~650) | O8 |
| **F16** | **The payslip download says nothing about password protection** and there is no download-history or audit notion. | `v3/screens.jsx` `PayslipCard` L584 | O10 |
| **F17** | **Money is `Number` (integer paise) in the design mocks.** Correct as a *frontend* pattern, and it must be recorded that this can never become a `float` on the backend when these screens are implemented. | payroll console `inr()` L21 | `guard-money-float` — advisory, not a defect in a mock |

---

# §9 — Escalations to the user (legal / statutory ambiguity — do not guess)

I am flagging these rather than inventing an answer. Each changes a screen.

- **Q1 · DPDP lawful basis per data group.** Which staff data is held on **consent** (withdrawable) and which
  on **legal obligation / employment contract** (not withdrawable)? The UI must label each group and must not
  offer withdrawal where it cannot be honoured. Needs a legal call before the "Your data" screen is drawn.
- **Q2 · Ex-employee access to Form 16 / payslips.** M12 flips `User.is_active` false at F&F, yet Form 16 for
  the year is issued afterwards and an ex-employee has a statutory need for it. What is the route — a
  time-boxed read-only account, an emailed protected artefact, or an HR-mediated request? Screen-level
  decision.
- **Q3 · Aadhaar.** Do we collect and store it at all, and if so under what basis and in what displayable
  form? The entity catalog says `aadhaar(masked)`. UIDAI rules on display/storage are strict. I am recording
  the rule *"never display a full Aadhaar"* — please confirm, and confirm whether collection is even required
  for our statutory set (PF/ESI/TDS use UAN/PAN/ESIC).
- **Q4 · Is F&F maker-checker?** The spec gives it `payroll.run` + `people.manage` but names no checker, while
  every other money finalisation is maker-checker. It disburses gratuity and encashment and closes a person's
  record. I have recorded it as **MC recommended** — please confirm so the screen is drawn once.
- **Q5 · Who exactly may open a police/BGV record?** "Access-restricted" is stated; the permission is not
  named. Is it a sub-role of HR, or Principal + a designated safeguarding officer? Determines whether a
  control is absent or disabled.
- **Q6 · Language of statutory artefacts.** Must the generated payslip / Form 16 / Form 12BA / 24Q remain in
  English regardless of UI language (portal and auditor acceptance), and may statutory form names stay
  untranslated inside a Hindi UI? Conflicts with DESIGN 11 (§7-C6).
- **Q7 · Student/parent 360° feedback (M17).** Students are minors — DPDP treats children's data specially
  (verifiable parental consent, no tracking/targeted anything). Who consents, what is stored, is the feedback
  anonymous to the teacher, and can a teacher contest it? This is the sharpest unresolved DPDP question in the
  product.
- **Q8 · Retention window for attendance selfies and geo-coordinates.** How long, and can an employee ask for
  earlier deletion once the dispute window closes?
- **Q9 · Does granting a role (especially `payroll.approve` or `people.pii.read`) need a second admin?** I have
  marked it `[judgement]`; the spec is silent. It is the escalation path around maker-checker.
- **Q10 · Loan waiver/foreclosure** — checker required, and is a waiver a taxable perquisite that must be
  disclosed to the employee on the payslip?
- **Q11 · Publishing a `StatutoryConfig` version** — does it need a second approver, and who owns rate
  correctness for on-prem customers who receive config as data (dev-spec §10)? A wrong ceiling published
  without a check mis-prices every subsequent run.
- **Q12 · Any legitimate emergency-release path around maker-checker?** I have recorded "never build". If the
  business has a real single-approver scenario (a one-person finance office at a small school), it needs a
  designed, audited, time-boxed answer — not an override button someone invents later.
