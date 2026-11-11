# M13 — Employee Self-Service & Mobile · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M13 Employee Self-Service & Mobile (build-plan §12 Sprint 10) · **Epic:** NA-24 lane F ·
> **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M13, §4.5, §4.6, §7, §8, §9 (Mobile offline), §12 ·
> `docs/functionality-blueprint.md` §9 (ESS & staff mobile app), PART C item 9, PART B item 3 ·
> `docs/decisions-to-finalize.md` D6 (Flutter locked) and the 2026-07-22 scope change ·
> `docs/screen-inventory.md` EMP-01…EMP-19, SH-03, SH-04, DH-02/04/07/09 (mobile parity) ·
> `docs/ui-compliance-requirements.md` **O4, O11, O12, O15, O17** (binding), O1, O2, O3, O10, O13, O16,
> §3 "Actions we must never build" · `docs/executive-summary.md` (positioning) ·
> `CLAUDE.md` (`guard-i18n-strings`, Flutter strict analyzer, knowledge portability).
>
> **Implementation owner:** nightwing (Flutter). **API owner:** cyborg (`…/me/*` GraphQL + REST edge).
> **Offline/sync chaos:** bane. **Unit:** deathstroke. **a11y + Hindi:** two-face.
>
> **Cross-module links used below** — `[[M0-foundations]]`, `[[M2-identity-access]]`, `[[M3-core-hr-people]]`,
> `[[M4-document-governance]]`, `[[M7-academic-calendar]]`, `[[M8-leave]]`, `[[M9-attendance]]`,
> `[[M10-payroll-core]]`, `[[M11-statutory-compliance]]`, `[[M12-full-and-final]]`, `[[M14-notifications]]`,
> `[[M15-reporting-platform]]`, `[[M15a-helpdesk]]`, `[[M16-integrations]]`,
> `[[M17-performance-appraisal]]`. Sibling lanes are writing these concurrently; a link to a file that does
> not exist yet is a forward reference, not an error.

---

## 1 · Intent

A school's workforce is not at a desk. A PGT Physics teacher marks attendance walking through a gate at
7:40 a.m., checks a leave balance between periods, and opens a payslip on a bus. The web console is where
HR works; the phone is where *everyone else* works. M13 is therefore not a companion app — it is the
primary client for the large majority of the product's users (`M13 §Purpose` "phone-first";
`functionality-blueprint.md` §9 "Mobile is not optional — it's primary"; the Voxturr/ShriConnect deck,
22 July 2026, slide 16 "Phone-first, for a desk-less workforce").

Two things make M13 harder than a normal mobile client, and both are why this document exists.

**The first is signal.** Campuses have basements, quadrangles, hostel blocks and rural branches where a
punch must still be possible. `§9 Non-functional` requires attendance to "degrade gracefully on weak
connectivity and sync on reconnect". That single sentence contains the hardest correctness problem in the
module: when a record captured offline meets a server that changed underneath it, something has to give —
and if the app guesses, a teacher is marked absent, absence becomes LOP, and LOP becomes wrong pay in
`[[M10-payroll-core]]`. §4.4 below specifies that collision case by case, because it is the part that
fails in the field and the part specifications usually reduce to "handle conflicts".

**The second is governance.** The employee is the *subject* of most of this data, not its owner. M13 gives
a rich read of one's own record and a deliberately narrow set of writes. In particular the app contains
**no document-upload control** anywhere except inside a response to an HR-initiated
`DocumentUpdateRequest` (`§4.5`, `[[M4-document-governance]]`, O4) — absent, not greyed out, because a disabled
Upload button still teaches the user that self-upload is a thing this product does.
`ui-compliance-requirements.md` §5 ranks an Edit affordance on a staff document as the second most likely
thing a designer draws wrong (R2), and the ESS screens are exactly where it would appear.

---

## 2 · Scope & surfaces

### In scope

| Area | What M13 delivers | Screens |
|---|---|---|
| Home | Today's attendance with provenance, action-needed band, latest payslip net, leave shape | EMP-01 |
| Attendance | Own log, punch in/out with geo + selfie, **offline queue**, regularization request | EMP-02, EMP-03, EMP-04 |
| Leave | Balances per academic year, apply, track, cancel | EMP-05, EMP-06 |
| Pay | Payslip list + protected PDF, tax documents, investment declaration | EMP-07, EMP-08, EMP-09 |
| Documents | **Read-only** own documents; **respond** to an HR-initiated request | EMP-10, EMP-11 |
| Reimbursements | Own claims, new claim with per-line receipts (`[[M10b-reimbursements-fbp]]`) *(ShriConnect scope, 2026-07-22)* | EMP-12, EMP-13 |
| Helpdesk | Own tickets with SLA state, raise a ticket *(ShriConnect scope)* | EMP-14, EMP-15 |
| Appraisal | Own goals, acknowledgement, self-appraisal | EMP-16, EMP-17 |
| Profile | Own record read-only, service book, masked statutory IDs | EMP-18 |
| Loans | Own EMI schedule and outstanding, `[[M10a-loans-advances]]` *(`[proposed]`, see §8)* | EMP-19 |
| Manager surfaces on mobile | Leave, regularization, reimbursement and appraisal approval queues | DH-02, DH-04, DH-07, DH-09 |
| Shell | Notification centre, account & security, language switch | SH-03, SH-04 |
| Platform | drift offline store, sync engine, push registration, EN/HI ARB localisation, a11y | — |

### Explicitly out of scope

| Out | Owned by |
|---|---|
| Any document upload outside a response to an open request | **`[[M4-document-governance]]`** — the request is the only channel (`§4.5`, O4) |
| Editing profile, contact, bank or statutory IDs | `[[M3-core-hr-people]]` — `people.manage` is HR's; the employee raises a ticket (`[[M15a-helpdesk]]`) |
| Payroll computation, payslip generation, bank files | `[[M10-payroll-core]]` |
| Ticket triage, assignment, internal comments, SLA configuration | `[[M15a-helpdesk]]` |
| Notification delivery, templates, provider configuration | `[[M14-notifications]]` |
| The report library and exports | `[[M15-reporting-platform]]` |
| Biometric ingestion and device health | `[[M16-integrations]]` |
| Appraisal cycle setup, moderation, composite-score release | `[[M17-performance-appraisal]]` |
| Approving **anything while offline** | Nobody — see AC-M13-19; approvals require connectivity by design |
| Substitution-duty notifications | Phase 2 (D2; blueprint PART C item 9 states this explicitly) |

### API surfaces

- **GraphQL (`…/me/*`, primary)** — profile read, leave, attendance, payslip metadata, document requests,
  reimbursement claims, helpdesk tickets, goals and self-appraisal, notifications (`M13 §API`). Every query
  is self-scoped from the token; the app never sends an employee id (`§7 Tenancy`, `[[M0-foundations]]`).
- **REST edge** — files and ingestion only: receipt upload, document-response upload, selfie upload,
  payslip and Form 16 download (protected artefacts, `§8`, O10), device registration, and the **sync batch**
  endpoint.
- **Push** — FCM/APNs tokens per device; payloads carry no PII (`§8`, `guard-pii-logging`, O11).
- **Generated clients only.** Dart operations come from the committed SDL and OpenAPI (`§7 Contract`,
  `check-contract-sync`); no hand-written request code.

---

## 3 · Data model

M13 adds little server-side state — it is mostly a *client* of other modules. The additions below are
tenant-owned; each carries a NOT-NULL `tenant_id` and its RLS `ENABLE` + `FORCE` + policy **in the same
migration as the model** (`guard-rls-policy`, `[[M0-foundations]]` §3.4). Owner: oracle; policy content:
wonder-woman.

### 3.1 `DeviceRegistration` (new — required by `§4.6` and by §6.11 `Notification.channel='push'`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK Tenant, NOT NULL | RLS predicate |
| `user_id` | FK User | one user may hold several devices |
| `platform` | enum `android/ios/web` | |
| `push_token` | text, encrypted at rest | rotated by the OS; **never logged** |
| `app_version`, `os_version` | text | drives the forced-upgrade check |
| `locale` | enum `en/hi` | fallback language for push before first sign-in (O12) |
| `last_seen_at` | timestamptz | staleness sweep |
| `revoked_at` | timestamptz null | sign-out, "sign out everywhere" (SH-04), or exit |

> Without this table `Notification.channel='push'` has no address. §6.11 defines no such entity — recorded
> as **OQ-M13-01**.

### 3.2 `SyncSubmission` (new — the server half of the offline queue)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK Tenant, NOT NULL | |
| `employee_id` | FK Employee | always the caller |
| `client_ref` | text | client-generated ULID; **unique on (tenant_id, client_ref)** |
| `kind` | enum `punch/leave_request/regularization/claim_draft/claim_submit/ticket/ticket_comment/self_appraisal_draft` | |
| `payload_hash` | text | body fingerprint for the idempotency semantics of `§7` |
| `captured_at` | timestamptz | **device** clock at capture |
| `received_at` | timestamptz | **server** clock at receipt — authoritative for ordering |
| `outcome` | enum `applied/duplicate/superseded/refused_locked/refused_stale/discarded` | |
| `outcome_detail` | JSON | machine-readable reason, rendered to the user in their language |
| `resulting_entity` | (type, id) | the record it produced, for provenance |

`SyncSubmission` is the audit trail of the queue: it answers "what did my phone send, and what happened to
it?", without which an unsynced punch is indistinguishable from a punch that was refused.

### 3.3 Field additions to existing entities

| Entity | Field | Why |
|---|---|---|
| `AttendanceRecord` (§6.8) | `client_ref`, `captured_at` (device), `device_clock_skew_seconds`; `source` gains `mobile_offline` | Provenance on a disputed day (O15, `DESIGN.md` 6); skew is evidence, never a correction |
| `LeaveRequest` (§6.7) | `client_ref` | dedupe on replay |
| `ReimbursementClaim` (§6.9) | `client_ref` | dedupe on replay |
| `HelpdeskTicket` (§6.11) | `client_ref` | dedupe on replay |

### 3.4 The device-local store (drift; no `tenant_id` — one tenant per install session)

| Local table | Holds | Retention |
|---|---|---|
| `outbox` | queued submissions with `client_ref`, kind, payload, `captured_at`, attempts, last error | until acknowledged, or `queue_ttl_days` (default 7, config), then moved to `failed` and shown |
| `cache_attendance`, `cache_leave`, `cache_notifications`, `cache_goals` | read models, last 90 days | refreshed on sync; wiped on sign-out |
| `cache_meta` | balances, shift, holiday calendar, rating matrix, helpdesk categories, i18n bundle version | must be present for offline validation |
| `pending_media` | selfie / receipt / document-response bytes | encrypted at rest; wiped on sign-out or successful upload |

**The local store never holds** PAN, Aadhaar, bank account, salary figures, payslip or Form 16 PDFs, other
employees' data, or grievance ticket bodies (`§8`, O11, O13). Payslips are fetched on demand over TLS and
opened as protected artefacts (`§8`, O10) — never cached in the clear.

---

## 4 · Behaviour walk-through

### 4.1 Happy path — a morning

Anjali opens the app at 7:38. The token is valid; the shell resolves her tenant from the JWT claim
(`§7 Tenancy`) and never asks. Home shows today's state — *"not marked yet"* — a leave balance as a shape
before a number, an action-needed band with one open document request, and the last released payslip's net
with the run's provenance. She taps **Mark attendance**: the app acquires location, shows the geo-fence
verdict and the shift's grace window, captures a selfie, and submits. The confirmation shows the **exact
time the server stored**, not the time on her phone. Later she opens the document request, attaches the
scan HR asked for, and submits it as a *response* — the only upload path in the app. At lunch she raises a
helpdesk ticket about an HRA line, and the app shows the SLA the category promises before she sends it
(`[[M15a-helpdesk]]`).

### 4.2 States and modes

| Mode | Behaviour |
|---|---|
| Online, authenticated | Everything available; writes go through with an idempotency key (`§7`) |
| Degraded (slow/flaky) | Reads served from cache with an explicit *"showing data from 7:12 a.m."* line; writes queue rather than spin |
| Offline | **Capture-capable** surfaces stay usable (punch, leave draft, regularization draft, claim draft with receipts, ticket draft, self-appraisal draft); everything else reads from cache and says so |
| Offline, **approval** surfaces | Approval controls are **hidden with a stated reason** — "you're offline; decisions need the current state" (AC-M13-19) |
| Session expired | Re-auth in place, preserving the route and any typed content (`§8` auth hardening, O16) |
| Locked period | A day inside an approved `PayrollRun` is read-only; the app offers regularization to arrears, never a rewrite |
| Exited / `is_active=false` | Sign-in refused; see OQ-M13-08 on post-exit Form 16 access |
| Forced upgrade | A contract-breaking client is blocked at launch with a store link, in both languages |

### 4.3 Offline capture and the sync engine

1. **Capture** writes an `outbox` row with a client-generated `client_ref` (ULID) and the device
   `captured_at`. The UI immediately shows the item as *queued*, with a count in the shell — never as
   "done".
2. **Ordering** is FIFO per entity per employee. A punch-out never syncs before its punch-in; a claim
   submit never syncs before its receipts.
3. **Transmission** is a batch to the REST edge. Every item carries `client_ref` as the idempotency key
   (`§7 Concurrency`, O17), so a retry after a dropped response replays the stored outcome rather than
   writing twice.
4. **Adjudication** is server-side. The server returns, per item, one of the outcomes in §3.2 with a
   machine-readable code; the app renders the human sentence from its ARB bundle in the user's language.
5. **Resolution UI.** Anything not `applied` lands in a **"needs your attention"** list with the reason and
   the one route that fixes it. Nothing is ever silently dropped.
6. **Expiry.** An item that cannot sync within `queue_ttl_days` (default 7) moves to `failed`, is shown
   with its capture time, and is offered as evidence for a regularization. It is **not** deleted.
7. **Clock skew.** The device clock is never authoritative. `captured_at` is stored as evidence,
   `received_at` orders events, and skew beyond a threshold (default 10 minutes) is recorded on the record
   and shown on the provenance line so a disputed day is arguable (O15).

### 4.4 Conflict resolution — the collision matrix

This is the field-failure surface. Each row is a scenario bane owns.

| # | Offline item | Server state at sync | Resolution | Told to the user |
|---|---|---|---|---|
| K1 | Punch-in | No record for the day | **Applied**, `source=mobile_offline`, both timestamps stored | "Marked at 7:41 a.m. (sent from your phone at 7:38)" |
| K2 | Punch-in | `first_in` already set from a **biometric** push (`[[M16-integrations]]`) | Server record **wins**; the queued punch is retained as corroborating provenance and never overwrites `first_in` | "The gate device already recorded 7:36 a.m. Your phone punch is kept as evidence." |
| K3 | Punch-in | `first_in` already set from **this same device** (replay) | `duplicate` via `client_ref`; the stored outcome replays | Silent success — the same receipt, not a second record |
| K4 | Punch-out | No `first_in` exists | **Refused as stale**; offered as a regularization (EMP-04) with the captured time pre-filled | "We have no clock-in for that day — request a correction with this time." |
| K5 | Punch | The day is now **approved leave** or a published holiday (`[[M8-leave]]`, `[[M7-academic-calendar]]`) | Recorded, **never overwriting** the leave/holiday status; flagged for HR reconciliation (`M9 §Business rules`) | "That day is recorded as approved leave. HR has been flagged; your punch is attached." |
| K6 | Punch | The month is **locked by an approved `PayrollRun`** | `refused_locked`. The only path is regularization to an `ArrearAdjustment` in `[[M10-payroll-core]]` — never an edit of a locked month | "August pay is already approved. This becomes a correction with arrears, not a change to the payslip." |
| K7 | Leave request | Balance changed while offline (another approval, an accrual run, a policy supersession) | **Revalidated at sync.** If it no longer fits, the request returns to **draft** with the new balance and the LOP consequence stated — never silently converted to LOP | "Your CL balance is now 1.5 days. This request would create 0.5 day of LOP — confirm or change it." |
| K8 | Leave request | An identical request already exists | `duplicate` via `client_ref` | The existing request opens |
| K9 | Regularization | A pending request already exists for that day | `duplicate`; points at the existing one | "You already asked about 12 August." |
| K10 | Claim submit | One or more receipts failed to upload | Submit is **atomic**: the claim stays `draft` and names the lines missing receipts | "2 of 4 receipts are still waiting for signal." |
| K11 | Claim submit | The category limit was exhausted meanwhile | Applied but **flagged** (flag-and-route-up, EMP-13 default) — never silently rejected | "This exceeds the medical limit; it will route to HR." |
| K12 | Ticket / comment | Ticket closed, or its category became restricted (`[[M15a-helpdesk]]`) | Refused with the ticket's current state; the text is preserved locally so nothing is lost | "This ticket was closed on 9 Aug — reopen it, or raise a new one." |
| K13 | Self-appraisal draft | The cycle window closed (`[[M17-performance-appraisal]]`) | **Refused**, draft preserved, HR notified per M17 | "The window closed on 31 Aug. Your draft is safe; HR has been told." |
| K14 | Document response | The `DocumentUpdateRequest` was cancelled or already verified | `discarded` with the reason; uploaded bytes are deleted from `pending_media` | "HR withdrew that request on 8 Aug." |
| K15 | Any item | Access revoked or scope changed | Refused; the queue is wiped on the next authenticated sign-out | Generic, non-enumerating message (O16) |
| K16 | Any item | Server 5xx or network loss mid-batch | Retried with backoff, same `client_ref`; **never** re-prompted as a fresh action (O17 — no naive "Retry" on a write) | "We don't know yet — checking", then the actual state |

**The rule underneath the matrix:** *a server-side fact is never overwritten by an offline capture; the
capture is preserved as evidence and routed into a correction workflow that already exists.* Attendance
corrections go through `Regularization`; pay consequences go through arrears. Nothing in M13 rewrites
history (`§4.3` effective-dating, O18 in spirit).

### 4.5 Edge and error paths

| Situation | Behaviour |
|---|---|
| Location permission denied | Explains what is needed, offers web/desk punch where the campus allows `source=web`; never a silent failure |
| Camera denied where the campus requires an anti-proxy selfie | Punch blocked **with the reason and the alternative**, not a dead button |
| Out of geo-fence | Blocked by default with the distance and a regularization route — **enforcement mode is unspecified in the spec** (OQ-M13-02) |
| Punch on a holiday or weekly-off | Allowed with a confirm; becomes comp-off evidence (`M8 §Business rules`) |
| Two devices punch simultaneously | One record; the second replays the first's receipt (`§7` idempotency) |
| Payslip month not released | *"Not released yet"* — **never** a provisional net |
| Push arrives but the in-app record is missing | Reconciled on open (`[[M14-notifications]]`) |
| Deep link to a record the user has lost access to | "This has moved on" / "you no longer have access" — never a 403 dead end, never a name (O7) |
| Device storage full | Capture refuses **before** the punch, naming the reason; it never accepts a punch it cannot persist |
| App killed mid-capture | The outbox row is written before the UI confirms, so a killed app loses nothing |

### 4.6 Concurrency

Optimistic concurrency (`ETag` / `If-Match`, `§7`) applies to every mutable record the app edits — a draft
claim edited on the phone and the web at once returns 412 and the app reloads rather than clobbering.
Idempotency keys are mandatory on every write the app can retry, which offline makes *all* of them.
Approvals are excluded from the queue entirely (AC-M13-19), so no approval is ever applied against stale
state.

### 4.7 PII, logging and consent

Log statements carry no PAN, Aadhaar, UAN, ESIC, bank account, salary, DOB or phone
(`guard-pii-logging`, O11); crash reports are scrubbed by the same registry. The geo/selfie notice is shown
**before the first capture** and a persistent indicator appears at each punch (O15); location is never
sampled outside a punch and there is no live-location surface anywhere (`ui-compliance-requirements.md` §3).
The employee sees their own captured geo/selfie history and its retention window, and no one else's.
Grievance ticket bodies never enter a push payload or a log line (O13). Consent and retention surfaces owed
to the employee under DPDP (O1, O2) are the ESS half of `[[M15-reporting-platform]]`'s GA-12 console.

### 4.8 i18n and a11y

- **Full EN + हिन्दी parity via ARB** (`M13 §Business rules`, `guard-i18n-strings`, O12). No hardcoded copy
  and no English fallback for consent, confirmations, refusal reasons, SLA sentences, payslip labels or
  leave rules. Every conflict outcome in §4.4 has a string in both languages.
- Numbers, money and dates keep the same canonical Indian form in both languages (lakh–crore grouping), so
  a figure never differs between languages (O12).
- Devanagari gets about 25% extra line-height in notice and consent blocks; no legal copy truncates.
- Screen-reader labels on every control (TalkBack/VoiceOver); minimum 44 by 44 touch targets;
  queued/offline and SLA states are conveyed **in words**, never by colour alone; dynamic type respected to
  the platform maximum without loss of function.
- The language switch lives on the shell and on SH-04, defaults to English, and syncs to the profile.

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Citation |
|---|---|---|
| AC-M13-01 | The Flutter app delivers, for the signed-in employee only: leave apply/track, attendance mark + regularize, payslip and Form 16 download, investment declaration, document-request responses, reimbursement claims, helpdesk tickets, goals + self-appraisal, and manager approvals where held. | `M13 §Purpose`, `M13 §Business rules`, blueprint PART C item 9 |
| AC-M13-02 | Every `…/me/*` operation resolves the subject from the token; an employee id supplied by the client is rejected and no query can widen to another employee. | `M13 §API`, `§7 Tenancy`, O7 |
| AC-M13-03 | **The app contains no document-upload control anywhere except inside a response to an open HR-initiated `DocumentUpdateRequest`** — absent from EMP-10 and EMP-18, not disabled. | `§4.5`, `M4 §Business rules`, **O4**, §3 "never build" |
| AC-M13-04 | A direct document write by the Employee role returns **403** server-side, proven by a test, regardless of what the UI shows. | `M13 §Acceptance`, `M4 §Acceptance` |
| AC-M13-05 | An employee can submit a reimbursement claim with a per-line receipt from the phone and **cannot approve their own claim** — the control is absent, not disabled. | `M13 §Acceptance`, `M10 §Reimbursements`, §3 "never build" |
| AC-M13-06 | An employee can raise a helpdesk ticket from the phone and see its status and **SLA state in words with elapsed time**; internal comments never appear. | `M13 §Acceptance`, `M15.1 §Business rules`, **O13** |
| AC-M13-07 | A punch captured with no connectivity is persisted to the device outbox **before** the UI confirms, is shown as *queued* (never as done), and syncs on reconnect. | `M13 §Business rules` (offline tolerance), `§9 Mobile offline` |
| AC-M13-08 | Every queued write carries a client-generated `client_ref` used as the idempotency key; replaying a batch produces no second record and returns the original outcome. | `§7 Concurrency`, **O17** |
| AC-M13-09 | The **server** timestamp is authoritative for the recorded punch time; device time is stored as `captured_at`, and skew beyond the threshold is recorded and shown on the provenance line. | `M9 §Business rules`, **O15** |
| AC-M13-10 | **K2:** an offline punch meeting a biometric record for the same day does not overwrite `first_in`; it is retained as corroborating provenance and the user is told which source was used. | `M9 §Business rules`, `M16 §Acceptance` |
| AC-M13-11 | **K5:** an offline punch on a day that is now approved leave or a published holiday never overwrites that status; it is flagged for HR reconciliation and the user is told. | `M9 §Business rules`, `M8 §Business rules` |
| AC-M13-12 | **K6:** an offline record for a period locked by an approved `PayrollRun` is refused as `refused_locked` and routed to regularization then arrears; the locked month is never rewritten. | `M10 §Arrears`, `§4.3` |
| AC-M13-13 | **K7:** a queued leave request is revalidated against the current balance at sync; if it no longer fits it returns to draft stating the LOP consequence, and is never silently converted to LOP. | `M8 §Business rules` |
| AC-M13-14 | **K10:** claim submission is atomic — a claim with an unuploaded receipt stays `draft` and names the affected lines. | `§6.9 ReimbursementClaimLine` |
| AC-M13-15 | Every non-`applied` sync outcome appears in a "needs your attention" list with a reason and exactly one route that resolves it; **no queued item is ever silently discarded**. | `§9 Mobile offline`, O17 |
| AC-M13-16 | A queued item that cannot sync within `queue_ttl_days` (config, default 7) moves to a visible `failed` list retaining its capture time, and can be attached as evidence to a regularization. | `M9 §Acceptance` |
| AC-M13-17 | Sync ordering is FIFO per entity: a punch-out never applies before its punch-in; a claim submit never applies before its receipts. | `§7`, `M9 §Business rules` |
| AC-M13-18 | `SyncSubmission` records every submitted item with its outcome, giving the employee and HR a record of what the phone sent and what became of it. | `§4.2`, `§9` |
| AC-M13-19 | **No approval, rejection, verification or any second-eyes decision can be taken offline.** Those controls are hidden with a stated reason when connectivity is absent; a decision is always made against current server state. | `§8 Maker–checker`, `M8 §Workflow`, O17 |
| AC-M13-20 | The device-local store holds no PAN, Aadhaar, bank account, salary figure, payslip PDF or another employee's data; sign-out wipes the local database and pending media. | `§8`, **O11** |
| AC-M13-21 | The geo/selfie notice appears before the first capture, an indicator is present at each punch, and location is never sampled outside a punch; no live-location surface exists. | **O15**, §3 "never build" |
| AC-M13-22 | The employee can view their own geo/selfie capture history and its retention window, and no one else's. | O15, `§8` |
| AC-M13-23 | Push notifications are addressed via `DeviceRegistration`, carry **no PII in the payload**, and render in the user's language. | `§4.6`, `§8`, O11, O12 |
| AC-M13-24 | Signing out (or "sign out everywhere" on SH-04) revokes the device's push registration and wipes local data. | `§8 Auth hardening`, O16 |
| AC-M13-25 | Every user-facing string is EN + हिन्दी via ARB; the build fails on a key missing in either locale; no string is hardcoded. | `M13 §Business rules`, `guard-i18n-strings`, **O12** |
| AC-M13-26 | Money renders from a `Decimal`-backed value in Indian lakh–crore grouping, identically in both languages; the client performs no monetary arithmetic of its own. | `guard-money-float`, O12 |
| AC-M13-27 | Offline, queued, sync-failed and SLA states are conveyed in words with elapsed or queued time — never by colour alone. | O13, `§9 Accessibility` |
| AC-M13-28 | All interactive elements carry screen-reader labels and meet the 44 by 44 minimum target; the app stays usable at the platform's maximum text size. | `§9 Accessibility` |
| AC-M13-29 | A payslip or Form 16 is delivered as a protected artefact over a short-lived signed URL and is never written to the device cache in the clear. | `§8 Encryption`, **O10** |
| AC-M13-30 | Dart operations are generated from the committed SDL/OpenAPI; a schema change that breaks the client fails CI. | `§7 Contract`, `check-contract-sync` |
| AC-M13-31 | Manager approval surfaces (DH-02/04/07/09) reach mobile parity and refuse self-approval — an approver's own request is absent from their queue, not merely disabled. | `M13 §Permissions`, §3 "never build" |
| AC-M13-32 | The app enforces the strict Dart analyzer (`strict-casts`, `strict-inference`, `strict-raw-types`) and sound null safety; `dynamic` requires a justifying comment. | `CLAUDE.md` Type safety |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit (Dart) | **deathstroke** | Outbox enqueue/dequeue ordering; `client_ref` ULID uniqueness and monotonicity; skew computation; the conflict-outcome to ARB-string mapping for **all 16 K-rows in both locales**; money formatting against the shared formatter (never a re-typed literal); geo-fence distance maths; queue-TTL transition; local-store wipe on sign-out |
| Unit (Python) | **deathstroke** | `SyncSubmission` adjudication per outcome; idempotent replay returns the stored outcome; locked-period refusal; leave revalidation against a changed balance; atomic claim submit |
| Widget | **deathstroke** | EMP-10 and EMP-18 render **no** upload affordance in any state (the governance regression test); offline mode hides approval controls with a reason; queued state announces in words; Devanagari consent copy does not truncate |
| Integration | **bane** | `…/me/*` self-scoping — a crafted employee id is refused; document write returns 403; self-approval refused server-side; protected payslip URL expiry; cross-tenant read of a `SyncSubmission` returns nothing |
| **Offline-sync chaos** | **bane** | The full K1–K16 matrix as executable scenarios, each run twice to prove idempotency; kill-the-app-mid-capture; airplane mode for 7+ days crossing the TTL; device clock moved hours forward and backward; batch interrupted at every item boundary; duplicate delivery of a whole batch; sync while the payroll month locks concurrently; sync while the employee's scope changes |
| Contract | **cyborg** + CI | Generated Dart analyses clean under the strict modes; SDL/OpenAPI drift fails the build |
| a11y and Hindi | **two-face** | TalkBack/VoiceOver pass on EMP-01/03/07/11/15/17; target sizes; text scaling; colour-independence of every state; Devanagari line-height in consent blocks |

Assertions reference the ARB bundle, generated types and factories — never a re-typed literal
(`CLAUDE.md` Testing standards).

---

## 7 · Proposed stories

Sprint 10 unless noted. Owners per `docs/development-specification.md` module ownership.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M13-S01 | Flutter app skeleton: MVVM + Riverpod, routing, `app/CLAUDE.md` | The shell every screen hangs on, with the strict analyzer wired. | nightwing | 5 | M0-S15 |
| M13-S02 | ARB localisation (EN + हिन्दी) with a build-time missing-key gate | Parity enforced by the build, not by review. | nightwing | 5 | M13-S01 |
| M13-S03 | Auth, secure token storage, expiry-in-place, sign-out wipe | Sign-in that survives a bus ride and forgets everything on exit. | nightwing | 5 | M13-S01, M2 |
| M13-S04 | `…/me/*` GraphQL surface + REST file edge | The self-scoped API the whole app reads. | cyborg | 8 | M0-S11, M3 |
| M13-S05 | drift local store + cached read-models with staleness display | Reads that work without signal and admit their age. | nightwing | 5 | M13-S01 |
| M13-S06 | **Outbox + sync engine (client)** | Capture-before-confirm, FIFO ordering, backoff, TTL, resolution list. | nightwing | 8 | M13-S05 |
| M13-S07 | **`SyncSubmission` + batch adjudication endpoint (server)** | The server half: idempotent replay and a typed outcome per item. | cyborg | 8 | M13-S04 |
| M13-S08 | **Conflict matrix K1–K16 implementation** | The rules that decide who wins when a phone meets a changed server. | cyborg | 8 | M13-S07, M9, M10 |
| M13-S09 | EMP-01 Home, EMP-18 profile (read-only), EMP-19 loans | The landing surface and the read-only record — **no edit controls anywhere**. | nightwing | 5 | M13-S04 |
| M13-S10 | EMP-02/03/04 attendance: punch with geo + selfie, offline queue, regularization | The module's hardest screen and its correction path. | nightwing | 8 | M13-S06, M9 |
| M13-S11 | EMP-05/06 leave apply and track with offline revalidation | Applying for leave from a corridor, safely. | nightwing | 5 | M13-S06, M8 |
| M13-S12 | EMP-07/08/09 payslip, tax documents, investment declaration | Protected artefacts, never cached in the clear. | nightwing | 5 | M13-S04, M10, M11 |
| M13-S13 | EMP-10/11 documents read-only + **respond to a request** | The governance boundary, implemented as an absence. | nightwing | 5 | M13-S04, M4 |
| M13-S14 | EMP-12/13 reimbursement claims with per-line receipts | Claims from a phone, atomic on submit. | nightwing | 5 | M13-S06, M10 |
| M13-S15 | EMP-14/15 helpdesk tickets with SLA in words | Ask a question; see the promise. | nightwing | 5 | M13-S06, M15a |
| M13-S16 | EMP-16/17 goals and self-appraisal | Rate your own year on the cycle's matrix, never a hardcoded scale. | nightwing | 5 | M13-S04, M17 |
| M13-S17 | Manager approvals on mobile (DH-02/04/07/09), **online only** | Decisions against current state, with self-approval absent. | nightwing | 5 | M13-S04 |
| M13-S18 | SH-03 notification centre + SH-04 account & security on mobile | The shell surfaces that make the rest legible. | nightwing | 5 | M13-S04, M14 |
| M13-S19 | `DeviceRegistration` + push registration and PII-free payload rendering | The address book push has been missing. | cyborg | 3 | M13-S03, M14 |
| M13-S20 | Offline-sync chaos suite (K1–K16) | The suite that decides whether this module is trustworthy in a basement. | bane | 8 | M13-S08 |
| M13-S21 | Mobile a11y + Hindi layout audit pass | Words not colour; Devanagari that does not truncate. | two-face | 3 | M13-S10…S16 |

**Total: 21 stories, 119 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M13-01 | **No `DeviceRegistration` entity exists.** §6.11 `Notification` supports `channel='push'` with nowhere to store a push token, platform or per-device locale. | Push is an MVP channel; without this table it cannot be delivered, and the token would end up in a JSON blob outside RLS. | Add the entity as specified in §3.1, token encrypted and never logged. |
| OQ-M13-02 | **Is an out-of-geo-fence punch blocked or flagged?** (screen-inventory Q3.) `M9 §Business rules` mandates geo capture; the enforcement mode is unstated. | It is the difference between a teacher at the second gate being marked absent and being marked present-with-a-note. | Default **flag, do not block**, per-campus configurable, distance recorded. A blocked punch pushes staff to ask HR to type it in, which is worse. Product ruling needed. |
| OQ-M13-03 | **`functionality-blueprint.md` §2 line 55 tags "Offline attendance capture (poor-connectivity campuses) `[P2]`"** while the same document's PART B item 3 tags offline tolerance `[MVP]`, and `M13 §Business rules` + `§9` place it in MVP. The blueprint contradicts itself and the dev spec. | NA-24's AC2 makes offline capture MVP. A stale `[P2]` tag will later be cited as licence to drop it. | Dev spec wins; correct blueprint §2 line 55 to `[MVP]`. **Documentation correction awaiting BATMAN's ruling** (same class as screen-inventory Q30). |
| OQ-M13-04 | **What is the offline queue's maximum age and size?** `§9` says "syncs on reconnect" and stops there. | A teacher back from two weeks' leave returns with a queue whose facts are stale; applying them blind corrupts a closed month. | `queue_ttl_days` default 7, per-tenant configurable; expired items become regularization evidence, never auto-applied. Ruling needed on the default. |
| OQ-M13-05 | **May a manager approve from the phone at all, or only view?** `M13 §Business rules` says "manager approvals"; `§8` requires a distinct person but says nothing about the device. | If mobile approval could be queued offline, the approval-chain guarantee weakens to "eventually, against stale state". | Confirm: mobile approvals allowed **online**, never queued. This spec assumes that. |
| OQ-M13-06 | **Payslip PDF password rule** (screen-inventory Q20). `§8` mandates protection but names no key derivation. | Mobile is where payslips are actually opened; an undefined password is an undefined support burden — and the common DOB-derived choice leaks a sensitive field. | Ruling needed; do not invent. |
| OQ-M13-07 | **No `reports_to` field on `Employee`** (§6.3; screen-inventory Q6/Q31). Every manager approval queue on mobile depends on it. | DH-02/04/07/09 mobile parity cannot route without it. A data-model gap, not a UI gap. | Add `reports_to` to §6.3 — already recommended in the screen inventory; it now blocks M13 too. |
| OQ-M13-08 | **Post-exit access** (screen-inventory Q7, conflict C8). `M12 §Acceptance` flips `is_active=false` at F&F; `§8` requires retained statutory data and the leaver still needs Form 16 on their phone. | A leaver locked out in April cannot fetch the Form 16 issued in June. | A limited post-exit mode (tax documents + payslips only) rather than a binary flip. Ruling needed — see `[[M12-full-and-final]]`. |
| OQ-M13-09 | **Selfie retention window** (O15). Nothing states how long `selfie_ref` images are kept, yet the employee must be shown that window. | We are required to state a retention period that does not exist. | Tie to the attendance-dispute window (recommend 90 days), then delete; a policy call belonging to `[[M15-reporting-platform]]`'s DPDP console. |
| OQ-M13-10 | **Is there an employee-delegate model?** (screen-inventory Q28.) Nothing lets a colleague submit a claim or apply for leave on someone's behalf. | Real schools do this for staff on medical leave. Absent a model, HR does it and attribution is wrong. | Out of MVP; state it explicitly so it is a decision, not an oversight. |
| OQ-M13-11 | **Language precedence for push.** `DeviceRegistration.locale` is per device; the profile also carries a language (SH-04). Which wins? | A Hindi-preferring teacher receiving English push notices is exactly the O12 failure. | Profile language wins; device locale is the pre-sign-in fallback. |
| OQ-M13-12 | **Is web ESS at full parity, and does offline apply to it?** `M13 §Purpose` is phone-first; the screen inventory says "web is at parity" without saying whether the web client queues writes. | Two clients behaving differently on a flaky link is a support problem and a correctness problem. | Web is online-only for writes with the same idempotency keys; offline capture is a mobile capability. Confirming. |
| OQ-M13-13 | **The 22 July deck (slide 13) markets a "Single-click run … then NEFT bank file and payslips"** — already ruled wrong for payroll (memory amendment B, 2026-08-11) but the deck is the customer-facing artefact. | An employee-facing app that shows a payslip whose release copy implies one-click disbursement propagates the error into ESS copy. | ESS copy never implies a one-click run-to-disbursement. Deck correction is a marketing call, not mine — flagged. |

**Conflicts with built design:** none — `design/v3/` contains no ESS *mobile* screens yet, and
EMP-14…EMP-17 are unbuilt. AC-M13-03 must be carried into the mobile design pass before any ESS screen is
drawn.

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file.*
