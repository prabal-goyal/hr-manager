# M5 — Recruitment / ATS · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M5 Recruitment / ATS (build-plan Sprint 3) · **Epic:** NA-20 lane B · **Author:** tn-alfred ·
> **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` §6.5, **M5 in full**, §7, §8, §11, §12 ·
> `docs/decisions-to-finalize.md` scope-change **2026-07-15** (ATS promoted into MVP; AI résumé parsing and
> recruitment analytics remain Phase 2) · `docs/functionality-blueprint.md` §11 and **PART C item 8** ·
> `docs/ui-compliance-requirements.md` **O1**, O2, O3, O4, O6, O7, **O8**, O11, O12, O17, O18, §2.4 (A22–A25) ·
> `docs/screen-inventory.md` HR-13…HR-21, PUB-01, PUB-02, PUB-04, PR-04 · `docs/executive-summary.md`.
>
> **Built design screens are the agreed UX.** `design/v3/pages/hr-hiring.jsx` (HR-13/14/16/17),
> `design/v3/pages/hr-offers.jsx` (HR-15/18/19/20/21) and `design/v3/pages/public.jsx` (PUB-01/02/04)
> already exist. The backend must serve what they promise.

---

## 1 · Intent

Hiring in a school does not look like hiring in an office. It happens in a burst before the session starts,
it is judged against qualifications the state mandates rather than preferences a manager has, and the
person who is hired walks into a classroom of somebody's children within days of accepting. A PGT Physics
post has a legal floor — a subject degree, a B.Ed, often a TET or CTET — and a school that fills it with a
strong interviewee who lacks the certificate has not been clever, it has been non-compliant.

M5 exists so that this burst is run once, in one place, and so that **nothing is typed twice**. The
requisition is approved against a budget; the post is advertised on the school's own careers page; the
applications arrive with structured qualifications so that eligibility can be *marked* — never silently
dropped, because a school sometimes has a good and legal reason to hire an unqualified support-role
candidate and must record why; the panel scores against stated criteria rather than impressions; and when
the offer is accepted, the candidate becomes a staff record with their certificates already attached,
sitting `pending` in HR's verification queue ([[M4-document-governance]]). That last step is the whole
reason ATS was pulled into MVP on 2026-07-15: an ATS that ends at "hired" leaves an HR Operator retyping a
person's life into [[M3-core-hr-people]] on their first day, which is exactly the work the product was
bought to remove.

---

## 2 · Scope & surfaces

### In scope

| Area | What M5 delivers |
|---|---|
| Requisition | Create, submit, budget-based approval chain, approve/reject, close, clone; filled-vs-open headcount |
| Posting | Job posting per requisition, `channel`, schedule/publish/close/extend, public preview, public link |
| Public career surface | **PUB-01** listing and **PUB-02** application — unauthenticated, tenant resolved from host, DPDP consent captured before submit (**O1**), candidate de-duplication |
| Candidate pool | De-duplicated talent pool, manual add, merge, attach-to-posting, DPDP anonymise |
| Pipeline | `Application.stage` machine, advance/reject/bulk-reject with reasons, **eligibility screening** against `StaffCategory.min_qualification` ([[M3-core-hr-people]]) writing `eligibility_flags` |
| Interviews | Scheduling, panel assignment within scope, reschedule/cancel/no-show, outcome; **scorecards** with submit-once semantics and pre-submission blindness between panellists |
| Offers | CTC (`Decimal`, `guard-money-float`) + `pay_group_id` + join date + expiry, letter artefact, send, revise (supersede), withdraw, over-budget flag with override reason |
| Digital acceptance | **PUB-04** — bearer-token accept/decline, reusing [[M4-document-governance]]'s `DocumentAccessGrant` primitive shape |
| **Conversion** | The transaction that creates `Employee` + `EmploymentContract` + `ServiceRecord(joined)` ([[M3-core-hr-people]]), **carries the candidate's documents into `StaffDocument` as `source=ats_import, verification_status=pending`**, raises onboarding tasks ([[M6-onboarding]]), queues the user invite ([[M2-identity-access]]), and fires `offer.accepted` ([[M16-integrations]]) — idempotent and resumable |

### Explicitly out of scope

| Out | Owned by |
|---|---|
| **AI résumé parsing; recruitment analytics (time-to-hire, source, funnel)** | **Phase 2** — `decisions-to-finalize.md` 2026-07-15, blueprint §11. Not in MVP, and no half-version of either belongs in a Sprint-3 story |
| Verification of the carried documents | **[[M4-document-governance]]** — M5 delivers them `pending` and never `verified` |
| Onboarding checklists, pre-boarding upload (PUB-03), bulk import | **[[M6-onboarding]]** |
| Employee/contract field semantics, `is_vacation_staff`, service records | **[[M3-core-hr-people]]** — M5 writes them once, through M3's own creation path |
| Leave-balance initialisation triggered by conversion | **[[M8-leave]]** — see the Sprint-3/Sprint-5 sequencing note in §8 |
| Salary structure and pay-group definition | **[[M10-payroll-core]]** — the offer *references* a `pay_group_id`, it does not define one |
| Notification and email delivery of offers, invites, reminders | **[[M14-notifications]]** |
| Background/police-verification **record** and its restricted access | **[[M4-document-governance]]** + **O8**; M5 only routes to it. A cleared-to-work decision is [[M6-onboarding]]'s joining gate, not an offer gate |
| Requisition budget-authority *thresholds* configuration surface | **[[M1-organization-tenancy]]/[[M2-identity-access]]** — unowned today, see OQ-M5-01 |

### API surfaces

- **GraphQL (primary):** the internal recruitment surface — requisitions, postings, candidates,
  applications, interviews, offers, and their explicit action mutations (`requisitionSubmit`,
  `requisitionApprove`, `jobPostingPublish`, `applicationAdvance`, `applicationScreen`,
  `interviewScheduleCreate`, `scorecardSubmit`, `offerSend`, `offerRevise`, `offerConvert`).
- **REST edge:** `POST /api/v1/careers/{posting}/apply` (public, multipart — résumé and certificates),
  `GET /api/v1/careers/postings` (public listing), `GET/POST /api/v1/offers/{grant}` (token surface),
  offer-letter PDF download. Files and unauthenticated ingestion go over REST per §7.
- **Tenancy on the public surface:** resolved from the **host** (custom domain or subdomain). It is never a
  query parameter or body field a caller can set (§7 Tenancy, M0-AC-09 — [[M0-foundations]]).

### Client surfaces

Web (green-lantern): HR-13, HR-14, HR-15, HR-16, HR-17, HR-18, HR-19 (panellist — may be a Dept Head,
Principal or senior Employee), HR-20, HR-21; PR-04 (the approver's decision screen, Principal role).
Public: **PUB-01**, **PUB-02** (unauthenticated), **PUB-04** (bearer token).
Mobile: none in MVP — HR-19 scorecards on a phone would be a reasonable Phase-2 ask, not an MVP one.

---

## 3 · Data model

All six entities are tenant-owned: each carries a NOT-NULL `tenant_id` **and** an RLS `ENABLE`+`FORCE`+policy
created in the **same migration** as the model (`guard-rls-policy`, [[M0-foundations]] AC-03).

### 3.1 `Requisition` (§6.5)

`campus_id` → [[M1-organization-tenancy]], `department_id`, `staff_category_id` → [[M3-core-hr-people]],
`title`, `headcount` (default 1), `budget_ctc` (**Decimal**), `justification` (required), `target_join_date`,
`status` `(draft/pending_approval/approved/rejected/closed)`, `approval_chain` (JSON).
Derived: `filled_count` from converted offers — HR-13 shows filled-vs-open headcount.
`budget_ctc` is *a budget for the position, never one person's pay* — it is the only money on the
requisition/posting screens and never appears in a public preview.

**`approval_chain` is an unstructured JSON blob with no configuration surface.** See OQ-M5-01.

### 3.2 `JobPosting` (§6.5)

`requisition_id`, `channel` `(career_site/board/referral)`, `title`, `description`, `published_at`,
`closes_at`, `closed_reason`, `status` `(draft/scheduled/live/closed)` — **`status` is proposed**; §6.5 gives
only the two timestamps, and the design carries five states including *scheduled* and *requisition closed
underneath it*. A posting auto-closes when its requisition closes.

### 3.3 `Candidate` (§6.5)

`name`, `email`, `phone`, `resume_ref` (encrypted), `qualifications` (JSON — structured: type
`degree/b_ed/tet/ctet/net/set/other`, institution, year, grade, optional certificate file ref), `source`,
`last_activity_at`, `anonymised_at`.
De-duplicated by email **or** phone within a tenant. §6.5 lists both without saying which is mandatory —
support-staff candidates frequently have no email (OQ-M5-04).

### 3.4 `CandidateConsent` (**new, proposed** — required by **O1** and §8)

`candidate_id`, `application_id`, `purpose`, `policy_version`, `given_at`, `withdrawn_at`, `source_ip_hash`,
`retention_until`. §8 mandates "lawful-basis records" and the design renders the consent artefact (version +
date) as a plain fact on the application detail — but **no entity in §6.5 stores it**. PUB-02 is the
highest-risk PII collection point in the product (§2.4 A22 `[judgement]`): an unauthenticated stranger
uploading a résumé, a phone number, a date of birth and certificate scans. Consent must be a record, not a
checkbox that was ticked once.

### 3.5 `Application` (§6.5)

`candidate_id`, `job_posting_id`, `stage` `(applied/screening/shortlisted/interview/offer/hired/rejected)`,
`eligibility_flags` (JSON: per-requirement pass/fail/cannot_assess + the unmet norm),
`eligibility_override_reason` (**proposed** — required when advancing a flagged-ineligible candidate),
`reject_reason_code`, `notes` (internal only, never candidate-visible), `stage_changed_at`.
Unique on (`candidate_id`, `job_posting_id`) — a second apply is "you already applied on <date>", not a
second row.

### 3.6 `Interview` (§6.5)

`application_id`, `round`, `scheduled_at`, `mode` `(in_person/online)`, `location_or_link`, `panel` (JSON:
user ids, all within the requisition's scope), `scorecard` (JSON, per-panellist, submit-once),
`outcome` `(proceed/hold/reject)`, `no_show_by`.
A **`ScorecardTemplate`** per round/staff-category is **proposed** (OQ-M5-05): the spec leaves `scorecard` as
free JSON, and free JSON means each panellist invents their own criteria, which is the thing structured
feedback exists to prevent. Teaching rounds carry a demo lesson; support rounds do not.

### 3.7 `Offer` (§6.5)

`application_id`, `ctc` (**Decimal**), `pay_group_id` → [[M10-payroll-core]], `join_date`, `expires_at`,
`status` `(draft/sent/accepted/declined/expired)`, `letter_ref`, `accepted_at`, `accepted_name_typed`,
`decline_reason_code`, `over_budget_override_reason`, `supersedes_offer_id` / `superseded_by_offer_id`.

**Conflict:** the built PUB-04 screen renders a **`superseded`** offer state, and HR-20's revise action
supersedes a sent offer. `§6.5 Offer.status` has no such value. See C-M5-01.

### 3.8 `OfferAcceptanceGrant`

The same primitive as [[M4-document-governance]]'s `DocumentAccessGrant`, scoped to one `Offer`: token hash,
expiry, revocation, use count. Bearer, therefore data-minimal — it renders the offer letter and the four
facts the letter already states (CTC, join date, campus, designation) and **nothing about the school's staff**.

---

## 4 · Behaviour walk-through

### 4.1 Happy path — requisition to a person on the roll

1. **HR-13.** Meera raises a requisition: PGT Physics, Indiranagar, headcount 1, `budget_ctc` ₹9,60,000,
   justification required. Draft. She submits; the **resolved approval chain is shown before submitting**,
   and the requisition goes `pending_approval` with the approver named.
2. **PR-04.** The Principal approves within authority (above it, the control is disabled and says *"this
   routes to the Group Admin"*). The chain **is** the second pair of eyes on budget (**O5**-adjacent: this
   is a budget gate, not a money-movement maker-checker).
3. **HR-14.** HR creates a posting from the approved requisition — an unapproved one is refused twice over:
   the row action is disabled with the blocking reason, and the picker never lists it. Publish shows the
   **public preview first**, because it is externally visible and nothing internal may leak.
4. **PUB-01/PUB-02.** A candidate finds the post, applies with structured qualifications and explicit,
   default-unchecked consent (**O1**). One `Candidate` (matched on email/phone), one `Application` at
   `applied`, a reference number back.
5. **HR-16/HR-17.** Screening runs against the staff category's `min_qualification`: eligible, ineligible
   (**marked, with the specific unmet norm — never silently dropped**), or *cannot assess* where the data
   is missing. Advancing a flagged-ineligible candidate demands a typed override reason.
6. **HR-18/HR-19.** Interviews scheduled with a panel drawn from users within scope; each panellist scores
   against the round's stated criteria and submits once. **Other panellists' scores are invisible until I
   submit**, because visible scores anchor.
7. **HR-20.** An offer: CTC, pay group (no default — it decides whether payroll runs CTC or honorarium
   logic), join date, expiry default +7 days. Over `budget_ctc` is flagged and needs an override reason.
   Sending previews the exact letter the candidate will see.
8. **PUB-04.** The candidate accepts with a typed name. `status=accepted`, `accepted_at` set.
9. **HR-21.** HR reviews the staged record — `emp_code` auto-suggested and collision-checked live,
   department, **`is_vacation_staff` with no default** and its consequence stated, notice period, pay group
   carried from the offer — and confirms. The conversion transaction runs (§4.3).
10. The teacher now exists in [[M3-core-hr-people]] with certificates sitting `pending` in HR-09's queue
    ([[M4-document-governance]]), an onboarding checklist in HR-22 ([[M6-onboarding]]), and an invite queued.

### 4.2 States

- **Requisition:** `draft → pending_approval → approved | rejected`; `approved → closed`; a closed
  requisition closes its live postings and says why.
- **Application:** the seven-stage machine. Skipping stages is **allowed with a confirm** because real
  hiring skips stages; moving backwards is allowed and audited.
- **Offer:** `draft → sent → accepted | declined | expired`; revise supersedes.
- **Interview:** scheduled → today → in progress → awaiting scorecards → completed; plus rescheduled,
  cancelled, no-show.

### 4.3 The conversion transaction (the heart of the module)

Triggered by PUB-04 acceptance or HR-20's `[proposed]` "mark accepted offline", **completed** at HR-21.
It is a single logical operation, **idempotent under a required idempotency key** (§7 Concurrency, **O17**)
and **resumable** — HR-21's own failure state is "conversion failed midway (partial)", and a half-created
teacher is worse than no teacher:

1. `Employee` created ([[M3-core-hr-people]]) from candidate fields — name, contact, qualifications — with
   **no re-keying**; only the genuinely new facts (`emp_code`, department, `is_vacation_staff`, notice
   period) are typed at HR-21.
2. `EmploymentContract` created from the offer: staff category, employment type, `is_vacation_staff`, DOJ =
   `join_date`, `contract_end_date` where fixed-term, `pay_group_id` from the offer.
3. `ServiceRecord(joined)` written — the immutable career timeline that gratuity later depends on
   ([[M12-full-and-final]]).
4. **Documents carried** into `StaffDocument` with `source=ats_import`, `verification_status=pending`, a
   shared `batch_id`, never `verified` ([[M4-document-governance]] AC-20).
5. Leave-balance initialisation **requested** ([[M8-leave]]) — see the sequencing note, OQ-M5-08.
6. Onboarding tasks raised ([[M6-onboarding]]); the pre-boarding document request and its PUB-03 grant are
   optionally issued here.
7. User invite queued ([[M2-identity-access]]) unless HR chooses "skip the invite for now" — an employee
   with no login is a visible state, not a silent one.
8. `offer.accepted` webhook fired via the outbox ([[M16-integrations]]).
9. `Application.stage = hired`; the requisition's filled count increments.

Every step is audited (**O6**). A retry with the same key returns the same result and creates nothing twice.

### 4.4 Edge cases and error paths

| Case | Behaviour |
|---|---|
| Requisition closed while a candidate is reading the posting | The posting stops accepting applications and **says so** — not a 500 (PUB-01 non-happy path) |
| Posting closes between form load and submit | Named message, input preserved, similar openings suggested |
| Candidate applies to two postings | One `Candidate`, two `Application` rows. The UI must never create a second candidate profile |
| Duplicate application to the same posting | "You have already applied on <date>" |
| Candidate has no email (common for support staff) | Phone-only path, or the field is honestly optional — needs the ruling in OQ-M5-04 |
| Ineligible candidate the school wants to hire anyway | **Permitted with a recorded override reason.** A legal, real case for support roles; blocking it outright would push the school off-system |
| Qualification data missing | Flagged *cannot assess* — never "ineligible". The distinction is the difference between a fact and an accusation |
| Panel member outside the requisition's scope | Blocked (**O7**) |
| Offer revised after sending | Old token shows **superseded**, never accepts a stale CTC |
| Two devices open the same offer token and both accept | Idempotency key; the second click returns the same receipt |
| Offer expires between page load and click | Refused with "this offer expired on …, contact HR" |
| `emp_code` collision at HR-21 | Blocked live, before commit, never discovered after |
| Duplicate person (a rehire) | Routes to a rehire path that **does not exist** — OQ-M5-06. Creating a second `Employee` silently breaks gratuity continuity |
| Candidate accepts, then never joins | No path exists — OQ-M5-07. Today it would require an immediate exit, polluting `ServiceRecord` |
| Join date falls in a locked payroll month | Warn about arrears ([[M10c-arrears-pay-revision]]) |
| Conversion partially fails | Resumable; HR-21 shows the partial state and completes it. Never half-created |

### 4.5 PII, consent and public-surface hardening

PUB-01/PUB-02 are the only unauthenticated write surface in the product. They therefore need: rate limiting
per IP and per tenant, upload type sniffing (not extension trust) and size caps, a malware-scan hook,
non-enumerating responses (a candidate must not be able to probe whether an email is already in the pool),
and **no tenant parameter of any kind**. Candidate phone, email and address are **not rendered** on HR-16/17
at all — the screens' "must contain" lists never name them, and the design states the omission in words
rather than leaving a blank (**O3**, **O11**). Consent (version + timestamp) is shown as a fact on the
application detail (**O1**). A candidate is a data subject even when never hired: the pool carries a
retention state and an anonymise action that preserves the audit action while removing the PII (**O2**).

### 4.6 Concurrency

`ETag`/`If-Match` on requisitions, applications and offers. Idempotency keys required on: apply (double-tap
on a phone), offer accept, and conversion. Stage advances are compare-and-set on `stage` so two recruiters
dragging the same card do not double-advance.

### 4.7 i18n and a11y

The public surfaces are **Hindi + English** (**O12**) — a support-staff applicant is exactly the person for
whom English-only is a barrier, and PUB-02 is where the product first meets the public. Controlled
vocabulary (stages, eligibility verdicts, decline reasons, rejection reasons, channel names) is i18n-keyed;
candidate-supplied text and proper nouns are not translated. Eligibility state is mark + word, never colour
alone. The offer letter artefact itself is generated in the language the school chooses — see OQ-M5-09.

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M5-AC-01 | A requisition cannot be posted until `status=approved`; the block is enforced server-side and is visible twice in the UI (disabled row action naming the approver, and absence from the posting picker). | `M5 §Business rules`, HR-13/HR-14 |
| M5-AC-02 | The approval chain resolves before submission and is shown to the requester; when no approver is configured the submission is blocked with an admin-facing reason, never routed to nobody. | `§6.5 Requisition.approval_chain`, HR-13 |
| M5-AC-03 | `budget_ctc` is a `Decimal` and never appears in any public-facing payload or preview; a contract test asserts its absence from the public posting schema. | `guard-money-float`, HR-14 "must NOT contain", **O3** |
| M5-AC-04 | The public career surfaces resolve the tenant from the request host; a tenant identifier supplied in a query parameter or body is rejected. | §7 Tenancy, M0-AC-09 ([[M0-foundations]]) |
| M5-AC-05 | PUB-02 refuses to submit without explicit, default-unchecked consent; a `CandidateConsent` record with the policy version and timestamp is written with the application and is visible on the candidate record and to the candidate. | §8 Consent & retention, **O1**, §2.4 A22 |
| M5-AC-06 | Applying twice with the same email or phone matches the existing `Candidate` rather than creating a second; applying twice to the same posting returns "already applied on <date>" and creates no second `Application`. | `§6.5 Candidate` ("de-duplicated"), PUB-02 |
| M5-AC-07 | Eligibility screening evaluates `qualifications` against the staff category's `min_qualification` and writes `eligibility_flags`; it **marks and never auto-rejects**, and missing data yields *cannot assess*, not *ineligible*. | `M5 §Business rules`, `§6.3 StaffCategory`, HR-16 |
| M5-AC-08 | Advancing an application flagged ineligible requires a typed override reason, which is stored and rendered in the application's history with the actor and date. | `M5 §Business rules`, HR-16 non-happy path, **O6** |
| M5-AC-09 | A panellist cannot see another panellist's scores before submitting their own; after submission the panel's scores become visible. A submitted scorecard is read-only and can only be reopened by HR. | HR-19 "must NOT contain", `§6.5 Interview.scorecard` |
| M5-AC-10 | Panel members must hold a role assignment within the requisition's scope; an out-of-scope user cannot be added to a panel. | `M5 §Permissions`, §4.1, **O7** |
| M5-AC-11 | An offer carries `ctc` as `Decimal`, a `pay_group_id` with **no default**, a join date and an expiry; a CTC above the requisition's `budget_ctc` is flagged and requires an override reason before the offer can be created. | `§6.5 Offer`, `M5 §Business rules`, HR-20 |
| M5-AC-12 | Revising a sent offer supersedes it; the superseded offer's token renders a superseded state and can never be accepted. | HR-20, PUB-04 states, §4.3 |
| M5-AC-13 | The PUB-04 token is a bearer grant scoped to exactly one offer; it exposes the letter and the offer's own terms and **no staff record, no other candidate and no internal data**. It expires, is revocable, and is rate-limited. | PUB-04 "must NOT contain", §8 |
| M5-AC-14 | Accepting an offer sets `status=accepted` and `accepted_at`, and initiates the conversion; a second acceptance from a second device returns the same receipt and converts once. | `§6.5 Offer`, §7 Concurrency, **O17** |
| M5-AC-15 | **Conversion creates `Employee` + `EmploymentContract` + `ServiceRecord(joined)` in one transaction**, from the candidate's captured data, with only `emp_code`, department, `is_vacation_staff` and notice period entered at HR-21. No field already captured by the ATS is re-typed. | `§6.5 (conversion)`, `M5 §Purpose` ("without re-keying"), `M5 §Acceptance`, HR-21 |
| M5-AC-16 | **Conversion carries the candidate's documents into `StaffDocument` with `source=ats_import` and `verification_status=pending`**; none is created verified, and each still requires an [[M4-document-governance]] verification decision. | `M5 §Business rules`, `M5 §Acceptance`, `§6.5 (conversion)`, **O4** |
| M5-AC-17 | Conversion is idempotent under a required idempotency key and resumable after a partial failure; a retry creates nothing twice, and no state exists in which an `Employee` was created without its contract. | §7 Concurrency, HR-21 failure path, **O17** |
| M5-AC-18 | `is_vacation_staff` is set at conversion with **no default**, and the consequence (leave accrual differs) is stated at the point of choice. | `M3 §Acceptance`, HR-21, blueprint PART C item 7 |
| M5-AC-19 | Conversion queues the user invite by default and supports skipping it; an employee without a login is a visible state in the staff register, not a silent one. | HR-21, `M2 §Seed roles` ([[M2-identity-access]]) |
| M5-AC-20 | Conversion fires the `offer.accepted` webhook through the outbox, delivered per tenant and signed. | `M16 §Business rules` ([[M16-integrations]]) |
| M5-AC-21 | Every requisition, application, interview, offer and conversion state change writes an `AuditLog` row with actor, reason where one is required, and before/after. | §4.2, **O6** |
| M5-AC-22 | All six ATS tables carry NOT-NULL `tenant_id` and an RLS `ENABLE`+`FORCE`+policy in the **same migration**; a recruiter in tenant A reaches zero of tenant B's candidates by ORM or raw SQL. | §3, `guard-rls-policy`, M0-AC-03/05 |
| M5-AC-23 | Campus scoping applies to requisitions, postings, pipelines, panels, offers **and to list counts, pickers, search and exports**; a Principal scoped to Campus A sees no Campus B application. | `M5 §Permissions`, **O7** |
| M5-AC-24 | Candidate contact details (phone, email, address) are absent from the pipeline and application-detail payloads, and CTC is masked in list views for users without the salary-PII permission. | **O3**, **O11**, HR-16/17 |
| M5-AC-25 | A candidate record can be anonymised: PII is removed, the audit retains the action but not the PII, and anonymisation is blocked while an active application exists. | §8 Consent & retention, **O2**, HR-15 |
| M5-AC-26 | Merging duplicate candidates re-points applications to the surviving record, is audited, and requires an explicit confirmation naming what will merge. | `§6.5 Candidate`, HR-15 |
| M5-AC-27 | The public surfaces are rate-limited, sniff uploaded file types server-side, cap file size, scan uploads, and return non-enumerating responses. | §8 Auth hardening, §2.4 A22 `[judgement]` |
| M5-AC-28 | PUB-01, PUB-02 and PUB-04 render Hindi and English at parity for all controlled copy; candidate-supplied text is never machine-translated. | `guard-i18n-strings`, **O12** |
| M5-AC-29 | Eligibility state and application stage are conveyed as mark + word, never colour alone. | `DESIGN.md` principle 8, **O12**-adjacent a11y |
| M5-AC-30 | **AI résumé parsing and recruitment analytics are absent from MVP**; no story, endpoint or field in this module implements either. | `decisions-to-finalize.md` 2026-07-15, blueprint §11 |
| M5-AC-31 | Background/police-verification content never appears on any recruitment screen or payload; the record and its restricted access live in [[M4-document-governance]] and the clearance gate is a joining gate, not an offer gate. | §8 Child-safety, **O8**, §2.4 A25 |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | The eligibility matrix: qualifications × `min_qualification` → eligible / ineligible-with-named-norm / cannot-assess, asserted against seeded category fixtures, never re-typed literals. The application stage machine (permitted, skipped-with-confirm, backwards, refused). Candidate dedup key resolution incl. phone-only and email-only. Offer expiry arithmetic and supersession. Over-budget detection on `Decimal`. Conversion field mapping — the assertion that every candidate field lands without transformation |
| Integration / conversion | **bane** | **The conversion suite**: the full transaction creating employee + contract + service record + carried documents; the idempotent replay creating nothing twice; the resumable partial failure; the assertion that every carried document is `pending` and none is `verified`; the `offer.accepted` webhook landing in the outbox |
| Integration / RLS | **bane** | Cross-tenant isolation on all six tables by ORM and raw SQL; cross-campus scope refusal on pipelines, panels, pickers, counts and exports |
| Integration / public surface | **bane** | Tenant resolution from host only; a tenant parameter rejected; rate limiting; duplicate application; posting-closed-mid-submit; consent absent → refused; upload type/size/scan refusals; **the offer token reaching nothing but its own offer** |
| Integration / governance | **bane** | The ATS conversion does not become a document-write bypass: an `ats_import` document cannot be created `verified`, and no ATS endpoint can set `verification_status` |
| Contract | **cyborg** + CI | `budget_ctc`, internal notes, eligibility overrides and candidate contact fields are absent from the public schema — asserted against the committed OpenAPI/SDL artefacts |
| A11y / UI | **two-face** | HR-13…HR-21 and PUB-01/02/04 at WCAG AA; Hindi/English parity on the public surfaces; eligibility legible without colour |
| Compliance review | **gordon** | Every diff: DPDP consent capture and withdrawal, candidate PII in logs, the anonymisation path, child-safety content leakage onto recruitment screens |

---

## 7 · Proposed stories

Sprint 3 (build plan §12, "ATS (M5)"). **This module is oversized for one two-week sprint** — see §8.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M5-S01 | `Requisition` + `JobPosting` models + RLS | The demand side of hiring, with `Decimal` budget and posting status. | oracle | 3 | M0-S04, [[M1-organization-tenancy]], [[M3-core-hr-people]] |
| M5-S02 | `Candidate`, `CandidateConsent`, `Application`, `Interview`, `Offer` models + RLS + dedup index | The supply side, the consent artefact, and the uniqueness rules that stop duplicate people. | oracle | 5 | M5-S01 |
| M5-S03 | Requisition lifecycle + budget approval chain execution | Draft → approval → approved, with the chain resolved and shown before submission. | cyborg | 5 | M5-S02, [[M2-identity-access]] |
| M5-S04 | Job posting lifecycle: publish, schedule, close, extend, auto-close | Including the auto-close when the parent requisition closes. | cyborg | 3 | M5-S03 |
| M5-S05 | Public career API: listing + apply (REST, multipart) | Tenant-from-host, consent capture, dedup, confirmation reference. | cyborg | 8 | M5-S04, M5-S06 |
| M5-S06 | **Public-surface hardening** | Rate limiting, type sniffing, size caps, scan hook, non-enumerating responses, no tenant parameter. | wonder-woman | 5 | M0-S12 ([[M0-foundations]]) |
| M5-S07 | Candidate pool: dedup, merge, anonymise, retention state | The DPDP half of the talent pool. | cyborg | 5 | M5-S02 |
| M5-S08 | Pipeline + **eligibility screening engine** | Stage machine, advance/reject/bulk, screening against `min_qualification`, override-with-reason. | cyborg | 5 | M5-S07, [[M3-core-hr-people]] |
| M5-S09 | Interviews + scorecards | Scheduling within scope, submit-once, pre-submission blindness, outcome. | cyborg | 5 | M5-S08 |
| M5-S10 | Offers: create, send, revise/supersede, withdraw, letter artefact | Over-budget flag, expiry, the exact letter the candidate sees. | cyborg | 5 | M5-S09, [[M10-payroll-core]] pay groups |
| M5-S11 | Offer acceptance grant (PUB-04 token) | Reuses M4's grant primitive; scoped to one offer; data-minimal. | wonder-woman | 3 | M4-S07 ([[M4-document-governance]]), M5-S10 |
| M5-S12 | **Conversion transaction** | Employee + contract + service record + carried documents + tasks + invite + webhook; idempotent and resumable. | cyborg | 8 | M5-S11, [[M3-core-hr-people]], [[M4-document-governance]], [[M6-onboarding]] |
| M5-S13 | `offer.accepted` webhook + outbox delivery | Signed, retried, per-tenant. | martian | 3 | M5-S12, [[M16-integrations]] |
| M5-S14 | HR-13 requisitions + HR-14 postings (web) | Including the approver-named disabled state and the public preview before publish. | green-lantern | 5 | M5-S04 |
| M5-S15 | HR-15 pool + HR-16 pipeline + HR-17 application detail (web) | The kanban, the eligibility marks, the override ritual. | green-lantern | 8 | M5-S08 |
| M5-S16 | HR-18 interviews + HR-19 scorecard (web) | Panellist-owned scorecard with anchoring prevented. | green-lantern | 5 | M5-S09 |
| M5-S17 | HR-20 offers + HR-21 conversion review (web) | The screen where a candidate becomes a person on the payroll. | green-lantern | 8 | M5-S12 |
| M5-S18 | PUB-01 careers + PUB-02 apply + PUB-04 acceptance (web) | The three public surfaces, Hindi + English. | green-lantern | 5 | M5-S05, M5-S11 |
| M5-S19 | Unit suite: eligibility matrix, stage machine, dedup, offer expiry, field mapping | The rules, asserted against fixtures. | deathstroke | 5 | M5-S12 |
| M5-S20 | E2E: requisition → conversion, incl. idempotent replay, public-surface and cross-tenant isolation | The whole joiner journey as one traced run on seed data. | bane | 8 | M5-S12, M5-S18 |

**Total: 20 stories, 107 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M5-01 | **Where are requisition budget-authority thresholds configured?** `approval_chain` is unstructured JSON with **no setup surface anywhere in the product** (inventory Q4). No module owns it. | HR-13 must show the resolved chain before submitting and PR-04 must disable approval above authority. Neither is possible against a blob nobody configures. | A per-scope authority table (scope level, scope id, `max_ctc`, approver role) configured in [[M1-organization-tenancy]]/[[M2-identity-access]]; `approval_chain` stores the *resolved* chain as an audit snapshot. **Blocking for Sprint 3.** |
| OQ-M5-02 | **No `CandidateConsent` entity exists** although §8 mandates lawful-basis records and the design renders the consent artefact. | Consent that lives only as a boolean on a submitted form is not a DPDP record; and there is no withdrawal path (inventory Q17). | Add the entity per §3.4, with a candidate-side withdrawal route owned by [[M15-reporting-platform]] (GA-12). **Blocking for PUB-02.** |
| OQ-M5-03 | **Is a candidate allowed to withdraw an application, and what happens to their consent and data?** (inventory Q17) | Withdrawal is the most common DPDP request a careers page receives. | MVP: withdrawal via the confirmation reference; the application closes, the pool record enters the retention/anonymise path. Needs a product ruling. |
| OQ-M5-04 | **Is `Candidate.email` or `Candidate.phone` mandatory?** §6.5 lists both, requires neither, and dedup keys off them. | Support-staff applicants often have no email. If both are optional, dedup silently stops working; if email is required, a real applicant class is excluded. | At least one required, with dedup on whichever is present; phone-only path supported on PUB-02. Needs confirming. |
| OQ-M5-05 | **Where do scorecard criteria come from?** `Interview.scorecard` is free JSON with no template entity (inventory: "a template source is needed"). | Free JSON means every panellist invents criteria, which defeats "structured feedback" (blueprint §11 MVP) and makes HR-19's "score a criterion" undesignable. | A `ScorecardTemplate` per staff-category/round, seeded with a teaching template (incl. demo lesson) and a support template. Small, and blocking for HR-19. |
| OQ-M5-06 | **Is there a rehire / duplicate-person path?** (inventory Q15) HR-21 lists "duplicate person detected (rehire)" as a state with nowhere to go. | A second `Employee` for a returning teacher silently breaks continuous-service and therefore gratuity ([[M12-full-and-final]]). | Detect on PAN/Aadhaar/name+DOB at conversion and offer "link to existing employee (rehire)" creating a new contract on the existing person. Needs a ruling; **cheap now, expensive after the first rehire**. |
| OQ-M5-07 | **"The joiner did not report."** (inventory Q16) Acceptance auto-creates an `Employee`; nothing handles the person who never arrives. | Today the only path is an immediate exit, which writes a false `ServiceRecord` and may compute an F&F for someone who never worked a day. | A pre-joining `did_not_report` terminal state on the contract that reverses the onboarding without an exit. Needs a ruling before Sprint 3 ships. |
| OQ-M5-08 | **Sequencing: conversion (Sprint 3) initialises leave balances that do not exist until Sprint 5.** `M3 §Workflow` and HR-21 both name leave-balance initialisation as part of conversion; [[M8-leave]] and [[M7-academic-calendar]] land in Sprints 4–5. | Either the AC cannot be verified in Sprint 3, or ATS slips to Sprint 5. Silently dropping the step would ship a teacher with no balances. | Conversion **emits a domain event / onboarding task**; [[M8-leave]] fulfils it in Sprint 5, and M5-AC-15's leave clause is verified then. Record the deferral explicitly rather than letting it look done. |
| OQ-M5-09 | **What language is the offer letter generated in, and who owns the template?** `letter_ref` exists; no template entity or language rule does. **O12** requires Hindi/English parity for anything a person must legally understand — an offer letter plainly qualifies. | A wrong-language or unversioned offer letter is a legal artefact the school cannot defend. | A versioned letter template per tenant, generated in the candidate's chosen language, with the version recorded on the offer. Owned by [[M14-notifications]] templates or M5 — needs an owner. |
| OQ-M5-10 | **Does an over-budget offer route back to the approver?** HR-20 marks this `[proposed]`; `M5 §Business rules` only says the requisition needs budget approval. | An override reason typed by the person making the offer is not a second pair of eyes on money. | Over-budget offers re-enter the approval chain. Needs a product ruling (it is a governance decision, not a UI one). |
| **C-M5-01** | **`Offer.status` has no `superseded` value**, yet HR-20 revises by superseding and PUB-04 renders a `superseded` state. | The built design promises a state the data model cannot represent, so the old token's behaviour is undefined — and an undefined old token can accept a stale CTC. | Add `superseded` to the enum, plus `supersedes_offer_id`/`superseded_by_offer_id`. **Dev-spec change — needs BATMAN's sign-off**; the design is the agreed UX and is not the thing that is wrong here. |
| **C-M5-02** | **`JobPosting` has no `status`.** §6.5 gives `published_at` + `closes_at`; HR-14 carries draft, scheduled, live, closing-soon, closed, and requisition-closed-underneath. | Deriving six states from two timestamps loses *scheduled* and *closed-early-with-reason* entirely. | Add `status` and `closed_reason`. Same sign-off route as C-M5-01. |
| **C-M5-03** | **HR-17's "request documents from the candidate"** (`[proposed]`) needs a `DocumentUpdateRequest` before an `Employee` exists; `§6.4 employee_id` is not nullable. | Building it would either add a nullable FK to M4's spine or create a second document channel — the exact thing [[M4-document-governance]] exists to prevent. | Keep pre-conversion candidate document collection **out of MVP**. PUB-03 after conversion covers the real need. Mirrors OQ-M4-02. |
| **C-M5-04** | **Blueprint PART C item 8 lists "BGV/police-verification tracking" under Recruitment**, while `§8 Child-safety` and **O8** place the record and its restricted access in documents. | If M5 builds a BGV surface, child-safety data ends up on a recruitment screen readable by every recruiter. | Tracking lives in [[M4-document-governance]] (HR-12 board); M5 links to it. **This spec follows O8.** Reported as a documentation conflict, not resolved unilaterally. |

**Note on the PDFs.** `docs/pdf/school-hrms-product-definition.pdf` (v0.1, 15 July 2026) is a compiled
snapshot of the exec summary, competitor analysis, blueprint and dev spec as they stood *before* the
2026-07-18 API decision and the 2026-07-22 ShriConnect scope change. `docs/Naveya-School-HRMS-Voxturrlabs.pdf`
(22 July) is the naming/positioning deck. Both are useful for intent; where either disagrees with
`docs/development-specification.md`, the dev spec wins as the build contract. No disagreement material to
M5 was found. The captured Keka reference (`design/reference/keka/`) is attendance-only and carries nothing
for this module.

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
