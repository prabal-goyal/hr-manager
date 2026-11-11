# M4 — Document Management & Verification · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M4 Document Management & Verification (build-plan Sprint 2) · **Epic:** NA-20 lane B ·
> **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` §4.5, §6.4, **M4 in full**, §7, §8, §11, §12 ·
> `docs/decisions-to-finalize.md` scope-change 2026-07-15 (document governance added) ·
> `docs/functionality-blueprint.md` §1 · `docs/ui-compliance-requirements.md` **O4**, O2, O3, O6, O7, O8,
> O11, O12, O18, §2.3 (A14–A21) · `docs/screen-inventory.md` HR-07, HR-09, HR-10, HR-11, HR-12, EMP-10,
> EMP-11, PUB-03 · `CLAUDE.md` non-negotiable "Document governance (M4)".
>
> **Built design screens are the agreed UX.** `design/v3/pages/hr.jsx` (HR-09),
> `design/v3/pages/documents.jsx` (EMP-10/EMP-11), `design/v3/pages/hr-compliance.jsx` (HR-10/11/12) and
> `design/v3/pages/public.jsx` (PUB-03) already exist. The backend must serve what they promise.

---

## 1 · Intent

A school is judged, by a parent and by an inspector, on whether the adult standing in front of a class is
who the school says they are. The degree, the B.Ed, the TET certificate, the police verification — the file
is not paperwork, it is the school's answer when someone asks *"how do you know?"* M4 makes that answer
defensible by giving the file exactly one owner: **HR**. A teacher cannot change what the school holds on
them; not because the button is hidden, but because the school's system will not accept the write. When a
certificate does need refreshing, HR asks for it, the teacher sends it in, and it sits **beside** the record
— visibly not yet the record — until an HR Operator has opened it, looked at it, and said so. Only that act
puts it on file.

That single rule is what makes every downstream claim honest: the child-safety board (HR-12) can say a
teacher is cleared, the expiry watchlist (HR-11) can say a licence lapses on Thursday, and a Form 16 can
carry a PAN, because in every case a named person verified the paper behind it on a recorded date. Remove
the rule and the product still functions — it just stops being trustworthy, which is the only thing it was
for. This module is small in surface and large in consequence; the correctness that matters is almost
entirely about what the system **refuses** to do.

---

## 2 · Scope & surfaces

### In scope

| Area | What M4 delivers |
|---|---|
| The record | `StaffDocument` — HR-owned, versioned by supersession, never edited in place, never deleted |
| The channel | `DocumentUpdateRequest` — the *only* route by which a subject supplies or changes a document, with the state machine of `M4 §Workflow` |
| The refusal | Server-side denial of every employee-originated document write: the Employee role's permission set ([[M2-identity-access]]) does not contain `documents.write`, and every write path authorises against it |
| Verification | `verify` (promote) / `reject` (reason, employee-visible verbatim) / `cancel`, each audited, each irreversible in the direction the spec names |
| Bearer channel | **`DocumentAccessGrant`** — a scoped bearer credential letting a subject with no `User` (a joiner, PUB-03) respond to the same requests through the same state machine. Defined here so [[M5-recruitment-ats]] and [[M6-onboarding]] consume one primitive rather than inventing two |
| Files | Encrypted object storage, per-tenant key namespace ([[M0-foundations]]), short-lived signed URLs, download auditing, type/size validation, malware scan hook |
| Restricted types | `police_verif` and other child-safety classes gated by a permission distinct from `documents.manage`, with an audited **view** event (O8, §8 Child-safety) |
| Expiry data | The queries HR-11 and HR-12 read: expiring-within-lead-time, expired, missing-by-requirement. **Alert scheduling and delivery are M14's** |
| Governance test surface | The enumerated 403 matrix that proves rule #2 — a first-class deliverable, not a side effect |

### Explicitly out of scope

| Out | Owned by |
|---|---|
| Notification delivery, expiry scan scheduling, lead-time configuration | **[[M14-notifications]]** |
| The conversion that carries candidate documents in (`source=ats_import`) | **[[M5-recruitment-ats]]** — M4 owns the invariants those rows must satisfy on arrival |
| Issuing the pre-boarding request as an onboarding step; the checklist around it | **[[M6-onboarding]]** — M6 orchestrates, M4 owns the request and the grant |
| Employee/candidate PII fields themselves (PAN, Aadhaar values on `Employee`) | **[[M3-core-hr-people]]** — M4 holds the *document*, not the field |
| The Flutter twin of EMP-10/EMP-11 | **[[M13-ess-mobile]]** (Sprint 10) — the API contract is M4's and must not change for mobile |
| DPDP consent records, erasure workflow, the data-protection console | **[[M15-reporting-platform]]** (GA-12) |
| Helpdesk ticket raised from "ask about a document" | **[[M15a-helpdesk]]** |
| Retention *policy* (how long a rejected response file lives) | **[[M15-reporting-platform]]** (GA-12) — M4 must not delete, only mark |

### API surfaces

- **GraphQL (primary):** document reads (`staffDocuments`, `documentUpdateRequests`, `myDocuments`,
  `myDocumentRequests`), and the state-transition mutations `documentRequestRaise`,
  `documentRequestRaiseBulk`, `documentRequestCancel`, `documentRequestExtend`, `documentRequestRemind`,
  `documentRequestVerify`, `documentRequestReject`. Explicit action mutations, never an overloaded update
  (§7 Style).
- **REST edge:** file upload and download only — `POST /api/v1/employees/{id}/documents` (HR upload),
  `POST /api/v1/me/document-requests/{id}/respond` (employee upload), `POST /api/v1/preboarding/{grant}/respond`
  (bearer upload), `GET /api/v1/documents/{id}/file` (redirect to a signed URL). Files go over REST because
  §7 says files go over REST.
- **Deliberately absent:** `PATCH /me/documents`, `DELETE /documents/{id}`, and any mutation that sets
  `verification_status` outside the verify transition. Their absence is asserted by a test (AC-05, AC-21).

### Client surfaces

Web (green-lantern): HR-07 (documents on the staff record), **HR-09** (control queue), **HR-10** (verify),
HR-11 (expiry watchlist, read), HR-12 (child-safety board, read), **EMP-10**, **EMP-11**.
Public/token: **PUB-03**. Mobile (nightwing, M13): the EMP-10/EMP-11 pair.

---

## 3 · Data model

### 3.1 `StaffDocument` (§6.4)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK → Tenant, not null | **tenant_id + RLS ENABLE/FORCE + policy in the SAME migration** (`guard-rls-policy`) |
| `employee_id` | FK → Employee ([[M3-core-hr-people]]), not null | scope for RBAC is the employee's campus ([[M1-organization-tenancy]], [[M2-identity-access]]) |
| `doc_type` | FK → `DocumentType` catalog | §6.4 shows an inline enum; see OQ-M4-01 |
| `file_ref` | text, encrypted | object-storage key, per-tenant namespace (M0-AC-27) |
| `issued_on` | date, nullable | |
| `expires_on` | date, nullable | required where `DocumentType.requires_expiry` |
| `verification_status` | enum `pending` \| `verified` \| `rejected` | |
| `verified_by_user_id` | FK → User, nullable | **proposed addition** — O4 requires "who verified and when" on the document itself; §6.4 carries it only on the request |
| `verified_at` | timestamptz, nullable | **proposed addition**, same reason |
| `uploaded_by_user_id` | FK → User, nullable | null when the uploader was a bearer grant; `uploaded_via` distinguishes |
| `uploaded_via` | enum `user` \| `grant` \| `system` | |
| `source` | enum `hr_upload` \| `ats_import` \| `request_response` | §6.4 |
| `source_request_id` | FK → DocumentUpdateRequest, nullable | provenance for `request_response` rows |
| `is_current` | boolean | exactly one current row per (`employee_id`, `doc_type`) — partial unique index |
| `superseded_at` / `superseded_by_id` | timestamptz / self-FK, nullable | **proposed** — §4.3 supersession, reusing [[M0-foundations]]'s effective-dating base. M4 §Acceptance demands "the old is retained in history"; §6.4 provides no mechanism |

Rows are **never deleted** (A21). Correction of a wrong upload is a supersession with a reason.

### 3.2 `DocumentUpdateRequest` (§6.4)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK → Tenant, not null | **RLS in the same migration** |
| `employee_id` | FK → Employee, not null | the subject. See OQ-M4-02 for the candidate-stage gap |
| `doc_type` | FK → DocumentType | |
| `reason` | text, not null | HR's words, shown to the employee verbatim |
| `requested_by_user_id` | FK → User, not null | |
| `status` | enum `open` \| `submitted` \| `verified` \| `rejected` \| `cancelled` | exactly the states of `M4 §Workflow` |
| `due_date` | date, nullable | drives the overdue lane (HR-09) and the escalation (M14) |
| `response_file_ref` | text, encrypted, nullable | **the response — never a live document** |
| `response_submitted_at` | timestamptz, nullable | |
| `response_issued_on` / `response_expires_on` | date, nullable | captured by the responder where the type carries expiry |
| `response_note` | text, nullable | employee's note to HR |
| `verified_by_user_id` | FK → User, nullable | |
| `decided_at` | timestamptz, nullable | |
| `decision_reason_code` | enum `illegible` \| `wrong_document` \| `expired` \| `name_mismatch` \| `other` | required on reject (HR-10) |
| `decision_note` | text, nullable | shown to the employee verbatim on reject |
| `promoted_document_id` | FK → StaffDocument, nullable | set only by the verify transition |
| `previous_request_id` | self-FK, nullable | the `Rejected --> Open` chain, so the prior response stays visible for reference |
| `batch_id` | UUID, nullable | groups a bulk raise (HR-09) and an ATS/pre-boarding set |

### 3.3 `DocumentAccessGrant` (**new, proposed** — the PUB-03 surface model)

| Field | Type | Notes |
|---|---|---|
| `id` / `tenant_id` | UUID / FK | **RLS in the same migration** |
| `subject_employee_id` | FK → Employee, not null | the joiner; may have no `User` yet |
| `request_ids` | M2M → DocumentUpdateRequest | the grant reaches **only** these requests |
| `token_hash` | text | the token itself is never stored |
| `expires_at` | timestamptz, not null | |
| `revoked_at` | timestamptz, nullable | offer withdrawn → revoked (PUB-03 "revoked" state) |
| `last_used_at`, `use_count` | timestamptz / int | abuse signal |

The grant is a **bearer** credential: it may be forwarded to a stranger. Therefore it authorises exactly two
verbs — *list the requests named on it* and *upload a response to one of them* — and reads **no** staff
record, no name beyond what the school itself printed on the invitation, no other document. This is why
PUB-03's "must NOT contain: any view of the staff record" is a server-side scope, not a UI choice.

### 3.4 `DocumentType` catalog (**proposed**, see OQ-M4-01)

`code`, `label_key` (i18n), `requires_expiry`, `is_restricted` (child-safety), `applies_to_staff_kind`,
`is_mandatory_for_category`, `sort_order`, `is_active`. Tenant-scoped with a seeded default set. A hardcoded
Python enum would put a school-configurable taxonomy in code (`guard-hardcoded-values`) and would make
Hindi/English labelling (O12) a frontend invention.

---

## 4 · Behaviour walk-through

### 4.1 Happy path — the loop the product is built around

1. Meera (HR Operator, Indiranagar campus) opens **HR-09**. The default lane is *to verify*.
2. A B.Ed certificate for a teacher expires next month. She raises a request from **HR-11** or HR-07:
   `doc_type=bed`, reason in her own words, `due_date`. Status `open`. The employee is notified (M14).
3. The teacher opens **EMP-10**. There is no Upload control anywhere on the screen — there never is. There
   is an action band: *HR asked for this.* It routes to **EMP-11**.
4. On EMP-11 she attaches a photo of the certificate, adds `expires_on`, an optional note, and submits.
   `response_file_ref` is set, status → `submitted`. **The live `StaffDocument` row is untouched** — EMP-10
   still shows the old certificate as the record, with "your upload is with HR" beside it.
5. Meera opens **HR-10**. Side by side: the current document and the response. *Verify & promote* stays
   disabled until she has actually opened the response file (the queue's own anti-rubber-stamp rule).
6. She verifies. In one transaction: a new `StaffDocument` is created (`source=request_response`,
   `verification_status=verified`, `verified_by`/`verified_at` set), the prior current row is superseded and
   retained, the request goes to `verified` with `promoted_document_id`, an `AuditLog` row is written, the
   expiry watch re-arms on the new `expires_on`, and the teacher is notified.

### 4.2 States

Exactly the machine in `M4 §Workflow`; no other transition exists.

```
[*] --> open            HR raises
open --> submitted      subject uploads a response (ESS or grant)
open --> cancelled      HR cancels (reason)
submitted --> verified  HR verifies -> promote
submitted --> rejected  HR rejects (reason, employee-visible)
rejected --> open       HR re-requests (new row, previous_request_id set)
verified --> [*]
cancelled --> [*]
```

Anything else — `submitted --> open`, `verified --> rejected`, a subject cancelling, a subject moving their
own request forward — is refused with a stable machine code, not a validation sentence.

### 4.3 Edge cases and error paths

| Case | Behaviour |
|---|---|
| Employee has no `User` | Raise is **blocked with the reason** ("invite the employee first") unless a `DocumentAccessGrant` is issued instead. Never a silent skip; in a bulk raise the excluded people are enumerated by name (HR-09) |
| Request cancelled while the subject has a file staged locally | The respond call is refused with `request_not_open` and the current status; the client keeps the file so the person does not lose it (EMP-11, PUB-03) |
| Subject re-uploads before submitting | Permitted while `open` — the staged response is replaced. Once `submitted`, only HR can reopen (by rejecting) |
| Two HR Operators verify the same response | Second attempt returns 409 `already_decided`; verify carries an idempotency key (§7) so a retry is a replay, not a second promotion |
| Response uploaded, then HR rejects | Response file is **retained** (provenance for the re-request), request goes `rejected`, reason shown verbatim, the re-request keeps `previous_request_id` so HR-10 can show what came before |
| First-ever document of that type | No "current" row to supersede; HR-10 renders the previous-version pane as an explicit empty state, not a blank |
| 400 ATS-imported documents land `pending` at once | They land with a `batch_id`; HR-09 filters by batch. Governance does not bend: each still needs a verification decision. **This is the throughput risk the design already named** — see OQ-M4-07 |
| Document expires with no request raised | M4 exposes it as *expired*; M14 alerts employee + HOD + HR; EMP-10 must be able to say "expired — HR has been notified" rather than leaving the employee with no path |
| Restricted type (`police_verif`) | Metadata visible to `documents.manage`; the **file** only to the restricted permission holder; every open writes an audited view event; never rendered in a list column (O8) |
| File fails type/size/malware validation | Named reason per item; in PUB-03 a per-item failure never discards the other items (no all-or-nothing) |
| HR uploads a document *as* the response on the subject's behalf, then verifies it | Refused: verifier ≠ responder when the responder is a `User` holding `documents.verify` (O4 A17). See OQ-M4-04 for the single-HR-school case |

### 4.4 Concurrency

`ETag`/`If-Match` on the request record; the verify and reject mutations require an idempotency key. The
promotion is a single transaction covering document insert + supersession + request update + audit write; a
failure in any part leaves no half-promoted state (M0-AC-13). The partial unique index on
(`employee_id`, `doc_type`, `is_current`) makes two simultaneous promotions a database error rather than two
current documents.

### 4.5 PII and logging

`file_ref` is encrypted at rest; document *contents* never enter a log, and neither do PAN/Aadhaar values
that a document happens to contain (`guard-pii-logging`, O11). Audit diffs on a document record that a
sensitive field changed, never its value (M0-AC-15). A download is logged as an access event with the actor
and the document id — never with the file name if the file name carries a person's identifiers.

### 4.6 i18n and a11y

Controlled vocabulary — document type labels, the five request states, the five rejection reason codes, all
button and lane labels — ships Hindi + English via i18n keys (`guard-i18n-strings`, O12). HR's free-text
`reason` and `decision_note` are **not** translated: they are captured human words, shown verbatim (this
matches the design's own precedent — proper nouns and captured free text skip `t()`).
Verification status is conveyed as **mark + word, never colour alone**; the EMP-10 screen must be readable
by someone who cannot distinguish the pending amber from the verified green.

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M4-AC-01 | The seeded **Employee** role's permission set ([[M2-identity-access]]) contains no `documents.write`, `documents.manage` or `documents.verify`; the assertion is made against the seeded role record, not against a rendered UI. | `M4 §Business rules` #2, `M2 §Seed roles`, §4.5, **O4** |
| M4-AC-02 | **Every** document write path — GraphQL mutation and REST file endpoint alike — authorises against `documents.manage`; an Employee-role token receives **403** on each one, enumerated as a matrix in the test suite. | `M4 §Acceptance`, §11 "document-governance tests", **O4** |
| M4-AC-03 | The only employee-originated write is `respond`, and only when the request's `employee_id` is the caller's own employee **and** `status=open`. Any other status returns a stable machine code; another employee's request returns 403. | `M4 §API`, `M4 §Business rules` #3 |
| M4-AC-04 | An employee response is stored in `response_file_ref`. A test asserts the live `StaffDocument` row for that `doc_type` is **byte-identical before and after** the response, including `verification_status`. | `M4 §Business rules` #3, `M4 §Acceptance`, **O4** |
| M4-AC-05 | `verification_status='verified'` can be reached **only** through the verify transition. No other code path, admin action, import or bulk operation may set it; a test asserts the absence of any other writer. | `M4 §Business rules` #4, O4 |
| M4-AC-06 | Verification creates a new `StaffDocument` (`source=request_response`, `verified`, `verified_by_user_id` + `verified_at` set) and **supersedes-and-retains** the prior current row; nothing is deleted, and the history is queryable. | `M4 §Acceptance`, §4.3, A14 |
| M4-AC-07 | Rejection requires a reason code **and** is shown to the employee verbatim; the request moves to `rejected` and the response file is retained. | `M4 §Business rules` #4, A18, HR-10 |
| M4-AC-08 | The `Rejected --> Open` re-request creates a new open request carrying `previous_request_id`, and the previous response remains visible to HR for reference. | `M4 §Workflow` |
| M4-AC-09 | The state machine permits exactly the transitions of `M4 §Workflow` and refuses every other pair with a stable machine code — proven by a table-driven test over all state × transition combinations. | `M4 §Workflow` |
| M4-AC-10 | Every transition (raise, respond, verify, reject, cancel, extend, remind) writes an `AuditLog` row in the same transaction with actor, before and after. | `M4 §Acceptance` ("all transitions appear in the audit log"), §4.2, **O6** |
| M4-AC-11 | A user who submitted a response cannot verify it: when the responder holds `documents.verify`, verification by that same user is refused with a named reason. | O4, §2.3 A17 `[judgement]` |
| M4-AC-12 | Raising a request for an employee with no `User` and no `DocumentAccessGrant` is blocked with an explicit reason; in a bulk raise, excluded employees are returned by name and never silently skipped. | HR-09 Actions, HR-07 Actions |
| M4-AC-13 | A bulk raise creates N requests under one `batch_id`, reports per-employee outcomes, and is idempotent under a repeated idempotency key. | HR-09, §7 Concurrency |
| M4-AC-14 | A `DocumentAccessGrant` authorises exactly two operations — list the requests named on the grant, and upload a response to one of them. It returns **no** staff record, no other document, and no data about the subject beyond the requested `doc_type` and due date. | PUB-03 "must NOT contain", §8 |
| M4-AC-15 | A grant-authenticated upload lands as a response through the **same** state machine as the ESS path — one code path, two authentication channels — and the resulting request is indistinguishable in HR-09 except for the channel recorded on it. | `M4 §Business rules` #3, PUB-03 |
| M4-AC-16 | A grant is expiring, revocable and rate-limited; an expired or revoked grant returns the token-dead state and renders nothing about the requests. | PUB-03 states (`expired`, `revoked`), §8 Auth hardening |
| M4-AC-17 | Restricted document types (`police_verif` and any type flagged `is_restricted`) require a permission distinct from `documents.manage` to open the **file**; every open writes an audited view event; the type never appears as a list column value for an unauthorised viewer. | §8 Child-safety, **O8**, A20 |
| M4-AC-18 | Document files are served only via short-lived signed URLs scoped to the tenant's key namespace; a URL for tenant A's document cannot be minted from tenant B's context; every download is audited. | §8 Encryption, M0-AC-27 ([[M0-foundations]]), A20, **O3** |
| M4-AC-19 | Where `DocumentType.requires_expiry` is true, verification without `expires_on` is refused, naming the missing field. | HR-10 Actions, §6.4 `expires_on` |
| M4-AC-20 | Documents arriving from ATS conversion land `source=ats_import`, `verification_status=pending`, carrying a `batch_id`; they are governed identically to HR uploads and are **not** auto-verified. | `M5 §Business rules` ([[M5-recruitment-ats]]), `§6.5 (conversion)`, `M4 §Business rules` #1 |
| M4-AC-21 | No delete path exists for `StaffDocument` in any surface, for any role. A correction is a supersession with a reason. | A21 ("never build"), §4.3 |
| M4-AC-22 | M4 exposes expiring-within-N / expired / missing-by-requirement queries for HR-11 and HR-12 and **does not** schedule or send any alert; the schedule lives once, in M14. | `M14 §Business rules` ([[M14-notifications]]), HR-11 "must NOT contain" |
| M4-AC-23 | `staff_document`, `document_update_request` and `document_access_grant` each carry a NOT-NULL `tenant_id` and an RLS `ENABLE`+`FORCE`+policy created in the **same migration** as the model. | §3, `guard-rls-policy`, M0-AC-03 ([[M0-foundations]]) |
| M4-AC-24 | An HR Operator in tenant A cannot read, raise against, or verify any document or request belonging to tenant B — proven by raw SQL with the ORM filter disabled. | §3, §11, M0-AC-05 ([[M0-foundations]]), **O7** |
| M4-AC-25 | An HR Operator scoped to Campus A cannot raise, verify, reject or read documents for an employee posted at Campus B; scope filtering applies to list counts and exports as well as records. | `M4 §Permissions`, §4.1, **O7** |
| M4-AC-26 | Document content, file names carrying identifiers, and any PAN/Aadhaar/UAN value are absent from all log output; audit diffs record *that* a sensitive field changed, never the value. | `guard-pii-logging`, **O11**, M0-AC-15/16 ([[M0-foundations]]) |
| M4-AC-27 | Two concurrent verifications of the same request produce exactly one promotion: the second returns 409 `already_decided`, and a retry with the same idempotency key replays the first response. | §7 Concurrency, **O17** |
| M4-AC-28 | Document type labels, request states and rejection reason codes are Hindi + English via i18n keys; HR's captured free text is shown verbatim in the language it was written. | `guard-i18n-strings`, **O12**, `M13 §Business rules` ([[M13-ess-mobile]]) |
| M4-AC-29 | Verification status is rendered as **mark + word**, never colour alone, on every surface that shows it. | O4, `DESIGN.md` principle 8 |
| M4-AC-30 | Response files belonging to cancelled or rejected requests are **retained**, marked, and never deleted by M4; their disposal is a retention-policy action owned elsewhere. | §8 Consent & retention, **O2** |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | The transition table: every (state × transition) pair, permitted and refused, asserted against the machine definition rather than a re-typed list. Promotion logic: new row created, prior superseded, `is_current` invariant held. Reason-code requirement on reject. `requires_expiry` gating. Grant scope resolution (a grant reaches exactly its named requests). Permission-set assertions read the seeded `Role` record, never a literal |
| Integration / governance | **bane** | **The 403 matrix** — the single most important test in this module: for the Employee role × every document-write operation (GraphQL mutation, REST upload, REST delete-if-it-existed, bulk paths, admin paths) the answer is 403. Repeated for a Department Head and a Principal without `documents.verify`. The matrix is generated from the schema's mutation list so a *newly added* mutation cannot escape it |
| Integration / RLS | **bane** | Cross-tenant read/write/verify against raw SQL with the ORM filter disabled; cross-campus scope refusal including list counts and exports; signed-URL cross-tenant mint refused |
| Integration / workflow | **bane** | The full loop on seed data: raise → respond → verify, asserting the live document is unchanged at the intermediate step; reject → re-request → respond → verify; cancel-mid-staging; concurrent verify (one promotion, one 409); grant-channel upload landing identically to the ESS upload |
| Integration / restricted | **bane** | `police_verif` file open refused without the restricted permission; view event written when permitted; the type absent from an unauthorised list projection |
| Contract | **cyborg** + CI | The absence of `PATCH /me/documents` and any `DELETE` on documents is asserted against the committed SDL and OpenAPI artefacts — a governance rule enforced by the contract diff, not by memory |
| A11y / UI | **two-face** | HR-09/HR-10/EMP-10/EMP-11 at WCAG AA; verification status legible without colour; Hindi and English at parity on every controlled string |
| Compliance review | **gordon** | Every diff in this module: PII in logs, audit immutability, DPDP retention of rejected responses, child-safety access restriction |

---

## 7 · Proposed stories

Sprint 2 throughout (build plan §12 "People + Documents (M3–M4)"), except where noted.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M4-S01 | `StaffDocument`, `DocumentUpdateRequest`, `DocumentType` models + RLS | The three tables with supersession, `is_current` invariant, and policies in the same migration. | oracle | 5 | M0-S04 ([[M0-foundations]]), Employee model ([[M3-core-hr-people]]) |
| M4-S02 | Document permission set and the Employee-role negative surface | `documents.manage` / `documents.verify` / restricted-type permission; the Employee role provably lacks all of them; campus-scope filtering. | wonder-woman | 5 | M4-S01, roles ([[M2-identity-access]]) |
| M4-S03 | HR document upload + document read API (REST file edge + GraphQL) | HR's own upload path, encrypted storage, signed-URL download, audited access. | cyborg | 5 | M4-S02 |
| M4-S04 | Request state machine: raise, bulk raise, extend, remind, cancel | The HR half of the channel, with `batch_id` and idempotent bulk. | cyborg | 5 | M4-S02 |
| M4-S05 | Employee respond endpoint (self-scoped, open-only) | The one write an employee has, and its refusals. | cyborg | 3 | M4-S04 |
| M4-S06 | Verify / reject + the promotion transaction | Promotion, supersession, audit, expiry re-arm — one transaction, idempotent, self-verify refused. | cyborg | 5 | M4-S05 |
| M4-S07 | `DocumentAccessGrant` — bearer channel for pre-`User` subjects | Issue, scope, expire, revoke, rate-limit; the primitive [[M5-recruitment-ats]] (PUB-04) and [[M6-onboarding]] (PUB-03) both consume. | wonder-woman | 5 | M4-S04 |
| M4-S08 | Expiry / missing-document query surface | The reads HR-11 and HR-12 need, with **no** scheduling of its own. | cyborg | 3 | M4-S03 |
| M4-S09 | HR-09 document control queue (web) | Four lanes, bulk raise, the open-before-verify rule. | green-lantern | 5 | M4-S04, M4-S06 |
| M4-S10 | HR-10 verify response (web) | Side-by-side compare, reason picker, expiry capture, re-request. | green-lantern | 5 | M4-S06 |
| M4-S11 | EMP-10 my documents + EMP-11 respond (web) | The employee half — and the screens that must carry **no** write control at any state. | green-lantern | 5 | M4-S05 |
| M4-S12 | HR-07 documents on the staff record + HR-12 child-safety board (read) | Documents in the record shell; the cleared/not-cleared board with restricted file access. | green-lantern | 5 | M4-S03, M4-S08 |
| M4-S13 | Unit suite: transition table, promotion, grant scope | The rules, tested against their definitions rather than restated literals. | deathstroke | 3 | M4-S06 |
| M4-S14 | **Governance test suite: the 403 matrix, cross-tenant and cross-campus isolation** | The test that makes `M4 §Business rules` #2 a fact about the server. Schema-generated so a new mutation cannot escape it. | bane | 8 | M4-S06, M4-S07 |

**Total: 14 stories, 67 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M4-01 | **Is `doc_type` a code enum or a tenant-configurable catalog?** §6.4 shows an inline enum (`degree/bed/tet/police_verif/…`); HR-08 configures staff categories with `min_qualification` drawn from a similar set, and O12 needs Hindi labels for each. | An enum in Python makes a school-configurable taxonomy a code change and makes label translation a frontend invention (`guard-hardcoded-values`, `guard-i18n-strings`). | A seeded, tenant-scoped `DocumentType` catalog with `requires_expiry` and `is_restricted` flags. Referenced by [[M3-core-hr-people]] category requirements and [[M5-recruitment-ats]] screening. |
| OQ-M4-02 | **A candidate-stage document request has no subject.** HR-17's `[proposed]` "request documents from the candidate" needs a `DocumentUpdateRequest` before an `Employee` exists, but `§6.4 employee_id` is not nullable. | Either the action is dropped from MVP, or the entity gains a nullable `candidate_id` with an XOR constraint — a data-model change that is cheap now and expensive in Sprint 3. | Keep pre-conversion candidate document collection **out of MVP** (it is `[proposed]` in the inventory, not in `M5 §Business rules` — see [[M5-recruitment-ats]]). Pre-boarding upload after conversion (PUB-03) covers the real need. Needs a ruling before M5 is built. |
| OQ-M4-03 | **What is the `verification_status` of a document HR uploads directly?** `M4 §Business rules` #1 lets HR upload at enrolment; #4 defines verification only as the promotion of a *response*. HR-12 renders `verified · pending · expired · missing`. | If HR uploads land `verified`, the word "verified" means two different things and the child-safety board's assurance is weaker than it looks. If they land `pending`, a school that uploads 300 files at enrolment has 300 verification decisions to make. | HR uploads land `pending` and are verified by an explicit act. Where the uploader holds `documents.verify`, allow verify-on-upload **recorded as single-person** (the [[M12-full-and-final]] F&F exception pattern, 2026-08-11), so a one-HR school is not stuck. Needs a product ruling. |
| OQ-M4-04 | **Self-verification.** O4/A17 says verification must be disabled when the verifier is the uploader, marked `[judgement]`. The spec itself never says it. | In a single-HR-Operator campus — the common case — a strict rule blocks the only person who can act. | Bind the rule to the **response** channel only (a `User` who responds on someone's behalf may not verify it), and record single-person verify-on-upload as such per OQ-M4-03. |
| OQ-M4-05 | **Who may open a police/background-verification file, and may the subject open their own?** §8 says "access-restricted" and names no permission (inventory Q8). | It is the most sensitive document in the product and the one an inspection asks about. Guessing here is a child-safety decision made by a developer. | A distinct `documents.restricted.read` permission, held by HR/Principal by seed; the **subject may see metadata and status but not the file**. Needs a legal/product ruling. |
| OQ-M4-06 | **`StaffDocument` has no supersession or verifier fields.** §6.4 lists neither `superseded_by`, `is_current`, `verified_by_user_id` nor `verified_at`, yet `M4 §Acceptance` requires history retention and O4 requires "verified by … on …" on the document. | Without them the acceptance criterion cannot be met and the second document of a type either overwrites the first or duplicates it. | Add the four fields, reusing M0's effective-dating base. Low cost, unblocks AC-06. |
| OQ-M4-07 | **Verification throughput after an ATS conversion or a bulk import.** HR-09's own non-happy path names 400 pending documents landing at once; HR-10 deliberately forbids bulk verify. | If the only compliant path is 400 individual judgements, the queue will be rubber-stamped and M4's guarantee degrades to a status field. | Keep per-document judgement, but add a **batch view** with per-item evidence and a documented expected throughput; measure it in the first pilot rather than assuming. Product decision, not a technical one. |
| OQ-M4-08 | **What is the file policy?** Accepted MIME types, size cap, whether malware scanning is in MVP, and whether a photo of a certificate (the realistic mobile case) is acceptable. Nothing in the spec says. | It is the first thing a joiner hits on PUB-03 and the first thing that will fail in a village-connectivity pilot. | PDF/JPG/PNG, a stated cap, server-side type sniffing (not extension trust), scan hook present in MVP even if the scanner is a stub. Needs confirming. |
| OQ-M4-09 | **Retention of rejected and cancelled response files.** §8 requires retention windows; M4 must not delete. Nothing says how long a rejected response — which may contain a stranger's Aadhaar sent to the wrong link — is kept. | Keeping a mis-sent identity document indefinitely is itself a DPDP exposure. | Retain with a marked disposal date owned by [[M15-reporting-platform]] (GA-12); M4 exposes the marker and never deletes. Needs the legal call that OQ-M0-01 ([[M0-foundations]]) also waits on. |
| **C-M4-01** | **Blueprint §9 line 213 still reads "Profile/document self-update **[MVP]**"**, which directly contradicts `M4 §Business rules` #2 and `M4 §Acceptance`. Recorded as C4/Q29 in the screen inventory and **still not corrected**. | It is the single line in the docs that, read alone, authorises building the thing this module exists to prevent. | Correct the blueprint line to "profile **view**; document updates only via an HR-initiated request". **Needs BATMAN's ruling** — I do not edit scope tags unilaterally. This spec follows the governance model regardless. |
| **C-M4-02** | **PUB-03 appears to contradict rule #2 and does not.** A joiner uploads without a `User` and without `documents.write`. | An implementer reading PUB-03 in isolation could reasonably build a second, weaker write path and believe it authorised. | Stated in §3.3 and AC-14/15: the grant is a second *authentication* channel onto the *same* state machine, with no staff-record read. No new write path exists. **Resolved here, not an open question** — recorded so nobody re-opens it. |

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
