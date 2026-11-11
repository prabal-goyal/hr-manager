# M14 — Notifications & Alerts · Functional Specification

> **Naveya** — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M14 Notifications & Alerts (build-plan §12 Sprint 11) · **Epic:** NA-24 lane F ·
> **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M14, §4.6, §6.11 `Notification`, §7, §8, §12 ·
> `docs/functionality-blueprint.md` PART B item 4 (multi-channel notifications `[MVP for core channels]`),
> §15 "SMS/WhatsApp/email communication layer `[MVP for SMS/email; WhatsApp P2]`", §1 (document-expiry
> alerts `[MVP]`) · `docs/screen-inventory.md` SH-03 (notification centre), HR-34 (templates), HR-11
> (expiry watchlist), GA-10 (providers) · `docs/ui-compliance-requirements.md` **O12** (Hindi/English
> parity), O11 (never log or display PII casually), O13 (grievance bodies never in a notification), O7
> (scope applies to notification bodies), O1/O2, O9, A64 · `design/v3/pages/hr-reports.jsx` (HR-34, built).
>
> **Implementation owner:** cyborg (event pipeline, scheduler, rendering, in-app API). **Delivery
> transport:** martian — every provider SDK lives in `backend/integrations/adapters/`
> (`[[M16-integrations]]`, `guard-vendor-isolation`). **Web surfaces:** green-lantern (SH-03, HR-34).
> **Mobile:** nightwing (`[[M13-ess-mobile]]`). **Unit:** deathstroke. **Delivery chaos:** bane.
>
> **Cross-module links** — `[[M0-foundations]]`, `[[M2-identity-access]]`, `[[M3-core-hr-people]]`,
> `[[M4-document-governance]]`, `[[M5-recruitment-ats]]`, `[[M6-onboarding]]`, `[[M8-leave]]`, `[[M9-attendance]]`,
> `[[M10-payroll-core]]`, `[[M11-statutory-compliance]]`, `[[M12-full-and-final]]`, `[[M13-ess-mobile]]`,
> `[[M15-reporting-platform]]`, `[[M15a-helpdesk]]`, `[[M16-integrations]]`,
> `[[M17-performance-appraisal]]`.

---

## 1 · Intent

Almost everything else in Naveya waits to be opened. M14 is the only part of the product that goes and
finds someone. That makes it the module where a silent failure is most expensive: a driving licence that
lapses because nobody was told is a transport-compliance breach and a child-safety exposure
(`§8 Child-safety`); a PF due date that passes unannounced is a penalty; an approval that never reaches a
Department Head is a teacher's leave stuck in limbo and, three weeks later, an LOP argument.

M14 is deliberately **channel-agnostic** (`§4.6`): the module decides *who must be told what*, renders it
in the recipient's language, and hands delivery to an adapter. It owns none of the transport. It also owns
a promise that is easy to lose: the in-app record is written **whether or not** SMS, e-mail or push
succeeded, because "we told you" must be provable from our own data and not from a vendor's dashboard.

The module's second obligation is linguistic. `M13 §Business rules` and O12 require Hindi/English parity
for anything a person must legally understand, and notifications are frequently the *first* place a person
reads a legal fact — that a document expires, that a payslip is released, that a filing is due. A template
missing its Hindi body silently sends English to a Hindi-preferring teacher, so language completeness is a
first-class, visible state on HR-34, never a quiet gap (the built `design/v3/pages/hr-reports.jsx` already
renders it that way).

---

## 2 · Scope & surfaces

### In scope

| Area | What M14 delivers |
|---|---|
| Event catalogue | The named, versioned set of notifiable events with their payload contracts |
| Recipient resolution | Who is told, derived from role, scope and relationship — never a hand-typed list |
| Channels | `in_app`, `push`, `sms`, `email` (§6.11). **WhatsApp is Later** (blueprint §15) |
| Templates | Per event × channel × locale, EN + हिन्दी, with declared merge fields (HR-34) |
| Rendering | Locale selection, merge-field substitution, PII-safe body construction, length budgets per channel |
| Dispatch | Enqueue to the `[[M16-integrations]]` outbox, retry/backoff policy, dead-letter visibility |
| Delivery state | Per-notification status lifecycle and provider reference, without storing provider payloads |
| Scheduled scans | Document/contract expiry with configurable lead times; statutory due dates; appraisal windows; helpdesk SLA breach |
| In-app surface | SH-03 notification centre: list, unread, filter, deep link, mark read (`M14 §API`) |
| Administration | HR-34 templates and per-event channel enablement, lead times, test send |
| Preferences | Per-user muting of **non-compliance** categories only (`[proposed]`, see §8) |

### Explicitly out of scope

| Out | Owned by |
|---|---|
| Provider credentials, sender IDs, adapters, actual transmission | **`[[M16-integrations]]`** (GA-10) — `guard-vendor-isolation` |
| The events themselves (what constitutes an approval, an expiry, a breach) | The originating module |
| Ticket SLA computation and escalation policy | `[[M15a-helpdesk]]` — M14 delivers what it decides |
| Statutory due-date calendar content | `[[M11-statutory-compliance]]` |
| Report scheduling and delivery | `[[M15-reporting-platform]]` (`[proposed]`, P2) |
| Substitution-duty alerts | Phase 2 (D2) |
| Marketing or bulk broadcast to staff | Not a product capability; see OQ-M14-09 |

### API surfaces

- **GraphQL** — `notifications` (self-scoped list with cursor pagination, `§7`), `unreadCount`,
  `markRead`, `markAllRead`, `preferences`.
- **REST edge** — template administration, test send, and the **inbound delivery-status webhook** from
  providers (received by `[[M16-integrations]]`, projected onto the notification record).
- **Internal** — `notify(event_code, subject_ref, actors, payload)` is the only way any module raises a
  notification. No module writes a `Notification` row directly.

---

## 3 · Data model

All tenant-owned; `tenant_id` NOT NULL plus RLS `ENABLE` + `FORCE` + policy **in the same migration**
(`guard-rls-policy`). Owner: oracle; policy content: wonder-woman.

### 3.1 `Notification` (§6.11, extended)

| Field | Type | Notes |
|---|---|---|
| `id`, `tenant_id` | | |
| `recipient_user_id` | FK User | resolved, never free text |
| `event_code` | text | from the catalogue (§3.4); the join key to templates |
| `channel` | enum `in_app/push/sms/email` | one row per channel per recipient |
| `template_id`, `template_version` | FK, int | **which version was sent** — an audit question (O9 in spirit) |
| `locale` | enum `en/hi` | the language actually sent |
| `payload` | JSON | merge values, **PII-filtered before storage** |
| `subject_ref` | (type, id) | the record the deep link opens |
| `dedupe_key` | text | unique on (tenant, recipient, event, subject, period) — the anti-duplicate spine |
| `status` | enum `queued/sent/delivered/failed/suppressed/expired` | `suppressed` = policy or preference blocked it, and is visible |
| `failure_code` | text null | provider-neutral reason |
| `provider_message_ref` | text null | opaque handle for support, no provider payload retained |
| `sent_at`, `delivered_at`, `read_at` | timestamptz null | **`read_at` does not exist in §6.11 and is required by SH-03** (OQ-M14-01) |
| `scan_run_id` | FK null | which scheduled scan produced it |

### 3.2 `NotificationTemplate` (new — `M14 §API` "admin templates" has no entity)

| Field | Type | Notes |
|---|---|---|
| `event_code`, `channel`, `locale` | | unique together with `version` |
| `subject`, `body` | text | merge fields declared as `{field}`; the event's payload contract validates them |
| `version`, `is_active`, `effective_from` | | **effective-dated supersession, never edit-in-place** (`§4.3`, O18) |
| `is_system_default` | bool | the shipped default a tenant may revert to |
| `updated_by_user_id` | FK User | attribution, audited |

### 3.3 `NotificationRule` (new — the per-tenant event × channel switchboard, HR-34)

| Field | Type | Notes |
|---|---|---|
| `event_code`, `channel` | | |
| `is_enabled` | bool | |
| `is_compliance` | bool | **compliance events cannot be fully disabled** (§4.6 below) |
| `lead_days` | int null | for scheduled scans; `M14 §Acceptance` implies a 30-day default |
| `recipient_roles` | JSON | e.g. `["subject","reports_to","hr@campus"]` — roles, never user ids |
| `scope` | group/campus | a campus may differ from its group |
| `quiet_hours` | JSON null | `[proposed]`, see OQ-M14-05 |

### 3.4 `NotificationEvent` catalogue (code, not a table)

| Event code | Raised by | Default recipients | Compliance? |
|---|---|---|---|
| `approval.requested` / `approval.decided` | `[[M8-leave]]`, `[[M9-attendance]]`, `[[M10-payroll-core]]`, `[[M17-performance-appraisal]]` | approver / requester | no |
| `document.request_raised` / `.overdue` / `.verified` / `.rejected` | `[[M4-document-governance]]` | subject; HR on overdue | yes |
| `document.expiring` | scheduled scan | **subject + reports_to + HR** | **yes** |
| `contract.expiring` | scheduled scan | subject + HR + Principal | **yes** |
| `bgv.expiring` | scheduled scan | HR restricted role only — **never the general HR queue** (`§8 Child-safety`) | **yes** |
| `payslip.released` | `[[M10-payroll-core]]` | subject | no |
| `payroll.checker_pending` | `[[M10-payroll-core]]` | the checker (a distinct person) | **yes** |
| `statutory.due` | `[[M11-statutory-compliance]]` scan | Payroll Operator + Accountant | **yes** |
| `filing.submitted` / `.acknowledged` | `[[M11-statutory-compliance]]` | Accountant + Group Admin | **yes** |
| `helpdesk.assigned` / `.replied` / `.sla_at_risk` / `.sla_breached` / `.escalated` | `[[M15a-helpdesk]]` | assignee, raiser, escalation target | no (but see O13) |
| `appraisal.cycle_opened` / `.stage_due` / `.window_closing` / `.finalized` | `[[M17-performance-appraisal]]` | population in scope, managers | no |
| `attendance.device_silent` | `[[M16-integrations]]` | Group Admin + HR | **yes** |
| `offer.accepted`, `candidate.status_changed` | `[[M5-recruitment-ats]]` | recruiter; candidate by e-mail | no |
| `security.password_changed`, `security.new_device` | `[[M2-identity-access]]` | the user | **yes** |

The catalogue is committed data, not literals scattered through code (`guard-hardcoded-values`).

---

## 4 · Behaviour walk-through

### 4.1 Happy path — a licence expiring in 30 days

The nightly scan runs per tenant. For each `StaffDocument` with an `expiry_date`, it computes
`expiry_date - lead_days` from the `document.expiring` rule (default 30, `M14 §Acceptance`) and finds
Ramesh's transport licence. It resolves recipients by **role and relationship**: Ramesh (subject), his
Department Head (`reports_to` — see OQ-M14-03), and the HR operator(s) scoped to his campus. For each
recipient it consults `NotificationRule` for enabled channels, renders the active template version in that
recipient's language, and writes one `Notification` row per channel with a `dedupe_key` of
`(document.expiring, staff_document_id, 30d)`. The in-app rows are immediately visible in SH-03; the SMS
and e-mail rows are enqueued to the `[[M16-integrations]]` outbox. Nothing in the body names the licence
number (O11) — it says which document, for whom, and by when, and deep-links to the record.

### 4.2 The pipeline

```
event or scan  ->  rule resolution  ->  recipient resolution (scope-aware)
   ->  per-channel fan-out  ->  template render (recipient's locale)
   ->  PII filter  ->  Notification rows written (in-app always)
   ->  outbox handoff (M16)  ->  provider  ->  delivery status webhook  ->  status projected back
```

### 4.3 States

| State | Meaning |
|---|---|
| `queued` | Written; not yet handed to a transport |
| `sent` | Accepted by the provider (or rendered in-app) |
| `delivered` | Provider confirmed delivery, where the channel supports it |
| `failed` | Terminal after the retry budget; visible in the dead-letter view, never silent |
| `suppressed` | A rule, preference or policy blocked it — **recorded with the reason**, because a suppression is a decision |
| `expired` | Scheduled notice overtaken by events (the document was renewed before send) |
| `read` | `read_at` set by the recipient (in-app/push only) |

### 4.4 Edge and error paths

| Situation | Behaviour |
|---|---|
| **Hindi template missing** | The send falls back to English **and the gap is recorded and surfaced** on HR-34 as a defect state; it is never silent (O12) |
| Unresolved merge field in a template | **Blocked at save time**, naming the field (HR-34); a template with an unknown field can never reach a recipient |
| Recipient has no phone / no e-mail | That channel is `suppressed` with a reason; the in-app record still exists |
| Recipient has no app installed | Push `suppressed`; in-app remains the record |
| Provider hard-fails (invalid number) | `failed` with a provider-neutral code; the operator sees it on GA-10; **no retry storm** |
| Provider soft-fails (timeout, 5xx) | Retried with backoff by `[[M16-integrations]]`, capped, then dead-lettered |
| Scan re-runs (restart, redeploy, manual) | `dedupe_key` makes it idempotent — no second notice for the same document and lead window (`§7`, O17) |
| Recipient loses access to the subject before opening | SH-03 shows "you no longer have access to this item", never a 403 dead end and never the record's name (O7) |
| Subject record deleted or superseded | "This has moved on", with the current state |
| Employee exits mid-flight | Queued items to a revoked user are `suppressed`; statutory notices route to HR instead |
| A compliance event's last channel is being disabled | **Refused** with the reason (§4.6) |
| Bounce / opt-out from the provider | Recorded against the address, not the person's record; HR sees "we cannot reach this address" |

### 4.5 Concurrency and volume

Sends are idempotent per `dedupe_key`; two schedulers racing produce one notification. Fan-out for a
group-wide event (payslip release for 2,000 staff) is chunked into Celery tasks that each carry the tenant
context (`[[M0-foundations]]`), with per-tenant rate limits so one large group cannot starve another. A
scan that fails halfway is resumable: `dedupe_key` makes re-running it safe, which is the only reliable
property to have here.

### 4.6 Compliance events cannot be silenced

`NotificationRule.is_compliance` marks the events a school cannot switch off: document, contract and BGV
expiry; statutory due dates and filing outcomes; the payroll checker's pending gate; device-silent alerts;
security events. For these:

- **at least one channel must remain enabled** — disabling the last one is refused with the reason (HR-34);
- a per-user mute does not apply (SH-03's mute carve-out);
- a `suppressed` outcome is itself an alert to the administrator, because a compliance notice that did not
  go out is an operational fact somebody must know.

This is the M14 half of the same principle `ui-compliance-requirements.md` §3 applies to payroll: a control
that would let policy be violated by a correctly-implemented toggle should not exist.

### 4.7 PII and confidentiality in a notification body

A notification travels outside our access controls the moment it becomes an SMS or an e-mail. Therefore:

- **Never in a body:** salary or net-pay figures, PAN, Aadhaar, UAN, ESIC, bank account, DOB, a leave
  *reason*, a medical detail, a BGV outcome, a grievance subject or body, an appraisal score, another
  employee's name where the recipient lacks scope (O11, O13, O7, `§8 Child-safety`).
- **Allowed:** what happened, to which record, by when, and a deep link that re-authenticates.
- Push payloads carry an event code and a subject reference, not content; the app fetches the body
  (`[[M13-ess-mobile]]`).
- The stored `payload` is filtered before it is written, so the notification table is not a PII side-channel
  around the redaction registry (`[[M0-foundations]]`).

### 4.8 i18n and a11y

- Every event × channel has an EN and a हिन्दी template; the seeded defaults ship complete, and
  **language completeness is a visible state**, not a hope (O12; already rendered by the built HR-34).
- The recipient's **profile** language decides; the device locale is only a pre-sign-in fallback
  (`[[M13-ess-mobile]]` OQ-M13-11).
- Money, dates and statutory identifiers are formatted identically in both languages; "Form 24Q" keeps its
  official English term alongside any translation (O12).
- SMS length budgets are computed per locale — Devanagari is UCS-2 encoded and roughly halves the segment
  size, so a template valid in English can silently become a three-part SMS in Hindi. The editor shows the
  segment count per language at save time.
- SH-03 conveys unread and delivery state **in words**, not colour alone; the notification centre is
  keyboard-navigable and screen-reader-labelled; no action is performed from the centre itself
  (`DESIGN.md` principle 1 — the action lives in its own queue).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Citation |
|---|---|---|
| AC-M14-01 | **A licence expiring in 30 days notifies the employee, their Department Head and HR** — one notification per recipient per enabled channel, deep-linked to the document. | **`M14 §Acceptance`** |
| AC-M14-02 | Scheduled scans exist for document expiry, contract expiry, BGV expiry, statutory due dates, appraisal windows and helpdesk SLA breach, each with a configurable `lead_days` (default 30). | `M14 §Business rules`, HR-34, HR-11 |
| AC-M14-03 | Notifications are raised only through the internal `notify()` contract; no module writes a `Notification` row directly, and every event is in the committed catalogue. | `§4.6`, `guard-hardcoded-values` |
| AC-M14-04 | Recipients are resolved from role, scope and relationship at send time — never from a stored list of user ids — so a transferred employee's notices follow their scope. | `§4.1 RBAC`, O7 |
| AC-M14-05 | An **in-app record is always written**, whatever any external channel does; delivery failure on SMS/e-mail/push never removes the in-app trace. | `§4.6`, SH-03 |
| AC-M14-06 | Every notification stores which **template version and locale** were sent. | `§4.3`, O9 (same principle as a pinned config) |
| AC-M14-07 | Re-running a scan (restart, redeploy, manual trigger) sends nothing twice: `dedupe_key` is unique on (tenant, recipient, event, subject, lead window). | `§7 Concurrency`, **O17** |
| AC-M14-08 | Delivery is handed to `[[M16-integrations]]`; **no provider SDK is imported anywhere in M14 code**. | `guard-vendor-isolation`, `M16 §Business rules` |
| AC-M14-09 | Retries use bounded backoff and terminate in a **visible** dead-letter state; a permanently failed notification is never silently dropped. | `§7 Webhooks` (retry/backoff), `§10 Observability` |
| AC-M14-10 | Every event × channel has an EN **and** a हिन्दी template; a missing Hindi body is a **visible defect state on HR-34** and the English fallback is stated, never silent. | `M13 §Business rules`, **O12**, `guard-i18n-strings` |
| AC-M14-11 | A template with an unresolved or unknown merge field **cannot be saved**; the field is named. | HR-34, `guard-i18n-strings` |
| AC-M14-12 | Templates are **effective-dated and superseded**, never edited in place; the previous version stays readable and the change is attributed and audited. | `§4.3`, **O18**, `§4.2` |
| AC-M14-13 | A notification body **never contains** a salary figure, PAN, Aadhaar, UAN, ESIC, bank account, DOB, leave reason, medical detail, BGV outcome, appraisal score, or a grievance subject or body. | `§8`, **O11**, **O13**, `§8 Child-safety` |
| AC-M14-14 | Push payloads carry an event code and subject reference only; the body is fetched by the authenticated app. | `§8`, O11 |
| AC-M14-15 | Notification bodies are **scope-filtered**: a recipient is never told a name, count or figure they could not see in the product. | **O7** |
| AC-M14-16 | Compliance-marked events (expiry, statutory due, filing outcome, payroll checker pending, device silent, security) **cannot have their last channel disabled and cannot be muted**; the attempt is refused with the reason. | `§8`, `M14 §Business rules`, §3 "never build" |
| AC-M14-17 | A `suppressed` notification records *why* it was suppressed and is visible to an administrator. | `§4.2`, `§10` |
| AC-M14-18 | SH-03 lists notifications grouped by day with unread state, type marks, per-channel delivery indicator and a deep link; it contains **no approval action** (the action lives in its queue). | SH-03 must-contain / must-NOT-contain, `DESIGN.md` 1 |
| AC-M14-19 | Marking read is reversible per row; `read_at` is stored per notification. | SH-03 |
| AC-M14-20 | A deep link to a record the recipient can no longer access shows "this has moved on" or "you no longer have access" — never a 403 dead end and never the record's name. | O7, SH-03 non-happy paths |
| AC-M14-21 | A user may mute **non-compliance** categories for in-app and push only; statutory, payroll-release and compliance categories cannot be muted on any channel. | SH-03 `[proposed]` mute, `M14 §Business rules` |
| AC-M14-22 | Every template edit, channel toggle, lead-time change and test send is written to the immutable audit log with its actor. | `§4.2`, HR-34 |
| AC-M14-23 | A test send is delivered only to the requesting user, is marked as a test, and is audited. | HR-34 |
| AC-M14-24 | The SMS template editor shows the **per-locale segment count**, because a Devanagari body encodes to UCS-2 and halves the segment size. | O12, `§9 Localisation` |
| AC-M14-25 | Fan-out is chunked, tenant-scoped and rate-limited; a 2,000-staff payslip release cannot starve another tenant, and a partially completed scan is resumable without duplicates. | `§9 Performance`, `§3` tenancy, AC-M14-07 |
| AC-M14-26 | Notification records carry no provider payload; only a provider-neutral failure code and an opaque message reference are stored. | `§8`, `guard-vendor-isolation` |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | Recipient resolution per event against a scoped fixture (subject / reports_to / HR at campus); `dedupe_key` construction; template rendering with every merge field, both locales; the PII filter against a table of realistic-shaped values; SMS segment counting for EN and HI; lead-date arithmetic across month ends and an academic-year boundary; compliance-event disable refusal; suppression reason mapping |
| Integration | **bane** | Scan run twice produces one notification (AC-M14-07); in-app row survives a provider outage; delivery-status webhook projects onto the right row and cannot cross tenants; a recipient who loses scope stops receiving; muting a compliance event is refused end-to-end; a template save with an unknown merge field is refused |
| Delivery chaos | **bane** | Provider timeouts, 5xx storms, duplicate status callbacks, out-of-order callbacks, dead-letter surfacing, scheduler restart mid-scan, clock change across a DST-free but leap-day boundary, 2,000-recipient fan-out under a rate limit |
| Compliance review | **gordon** | No PII in any seeded template body in either language; grievance events carry no subject; BGV events reach only the restricted role |
| a11y and Hindi | **two-face** | SH-03 unread and delivery states in words; HR-34's missing-translation state legible; Devanagari body previews do not truncate |

---

## 7 · Proposed stories

Sprint 11. Owners per module ownership.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M14-S01 | `Notification` extension + `NotificationTemplate` + `NotificationRule` models and RLS | The three tables the module needs, policies in the same migration. | oracle | 5 | M0-S04 |
| M14-S02 | Event catalogue as committed data + `notify()` contract | One way in, no literals scattered through modules. | cyborg | 5 | M14-S01 |
| M14-S03 | Recipient resolution by role, scope and relationship | The part that makes AC-M14-01 true for a group with many campuses. | cyborg | 5 | M14-S02, M2 |
| M14-S04 | Template rendering, locale selection and the **PII filter** | The body a person actually reads, and everything it must not contain. | cyborg | 5 | M14-S02 |
| M14-S05 | Dispatch to the M16 outbox, retry policy, dead-letter view | Delivery without a vendor import anywhere in this module. | cyborg | 5 | M14-S04, M16-S03 |
| M14-S06 | Delivery-status projection from provider webhooks | Status that comes back and lands on the right row. | cyborg | 3 | M14-S05, M16-S06 |
| M14-S07 | **Scheduled scans**: document, contract, BGV expiry with lead times | The alert that stops a licence lapsing. | cyborg | 5 | M14-S03, M4 |
| M14-S08 | Scheduled scans: statutory due dates and appraisal windows | The calendar-driven half. | cyborg | 3 | M14-S07, M11, M17 |
| M14-S09 | Idempotent scan runner (`dedupe_key`, resumability, chunked fan-out) | The property that makes re-running safe. | cyborg | 5 | M14-S07 |
| M14-S10 | SH-03 notification centre (web) | What happened that I should know about — and nothing I should do here. | green-lantern | 5 | M14-S02 |
| M14-S11 | HR-34 template administration incl. missing-translation state and segment counts | Configuration a school can hold, with the language gap visible. | green-lantern | 5 | M14-S04 |
| M14-S12 | Compliance-event lock + preference model | The toggle that refuses to switch off a statutory notice. | cyborg | 3 | M14-S02 |
| M14-S13 | Delivery chaos suite | Duplicate, late and lost callbacks, restarts, and a 2,000-recipient release. | bane | 5 | M14-S06, M14-S09 |

**Total: 13 stories, 54 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M14-01 | **`Notification` (§6.11) has no `read_at`, no `dedupe_key`, no template version and no delivery timestamps.** SH-03 requires unread state; idempotency requires a dedupe key. | Without these the notification centre cannot be built as specified and a re-run scan will double-notify. | Extend the entity as in §3.1. |
| OQ-M14-02 | **No `NotificationTemplate` or `NotificationRule` entity exists**, yet `M14 §API` promises "admin templates" and HR-34 is an MVP setup screen. | "Configurable" without a configuration table becomes hardcoded copy — exactly what `guard-i18n-strings` and `guard-hardcoded-values` exist to stop. | Add both, effective-dated. |
| OQ-M14-03 | **`reports_to` does not exist on `Employee`** (§6.3; screen-inventory Q6/Q31), but `M14 §Acceptance` requires the **HOD** to be notified. | AC-M14-01 is literally unimplementable without it. | Add `reports_to`; until then, department-scoped Head resolution is a fallback, not a substitute. |
| OQ-M14-04 | **Indian SMS regulation (TRAI DLT) is not mentioned anywhere.** Transactional SMS in India requires a registered sender ID and **pre-registered template content** with the DLT platform; content that deviates from the registered template is rejected by the operator. | Our template editor lets HR write free text that will simply not deliver. This is a real delivery blocker discovered at launch, not a design nicety. | Model a `dlt_template_id` on `NotificationTemplate` for the SMS channel, and mark SMS templates as **registration-gated**: editable only through a flow that re-registers. Needs a product and legal call. |
| OQ-M14-05 | **Quiet hours and notification fatigue.** Nothing says whether a 6 a.m. expiry scan may SMS a teacher at 6 a.m. | Schools will complain; and a muted-by-annoyance channel defeats compliance alerts. | Default send window 08:00–20:00 local for non-urgent categories; compliance alerts unaffected. `[proposed]`. |
| OQ-M14-06 | **Notification retention.** No retention window is stated, and notification payloads reference PII-adjacent records. | The table grows unbounded and falls under DPDP retention (O2) with no rule. | 24 months for in-app, 90 days for delivery metadata; the audit log remains the durable record. Ruling needed with `[[M15-reporting-platform]]`'s DPDP console. |
| OQ-M14-07 | **Is e-mail in MVP for staff, or only for candidates?** Blueprint §15 tags SMS/e-mail MVP; `§6.11` lists `email`; no screen shows an e-mail preference for staff. | Cost and DPDP notice obligations differ; e-mail addresses for support staff often do not exist. | E-mail MVP for candidate and admin-role notices; SMS + in-app + push for staff. Confirming. |
| OQ-M14-08 | **Who is notified when the *approver* is absent or the post is vacant?** (screen-inventory Q10.) `M8 §Workflow` escalates by policy, not by absence; regularization has no escalation at all. | The notification fires into a vacancy and the request sits until someone complains. | Escalation on absence belongs to `[[M8-leave]]`/`[[M9-attendance]]`; M14 needs the event to exist before it can deliver it. |
| OQ-M14-09 | **Is there an HR broadcast / circular capability?** Blueprint §15 lists "circulars" in the communication layer; no module owns it and no screen draws it. | If it is MVP, it needs an audience model, an audit trail and an opt-out that does not collide with compliance events. | Out of MVP as an M14 capability; record the decision. |
| OQ-M14-10 | **Does a notification to a *candidate* (no user account) fit this model?** `Notification.recipient` is a user; ATS candidates are not users. | `offer.accepted` and interview scheduling need candidate e-mail delivery. | Allow a `recipient_contact` alternative on the row, retained under the candidate consent record (`[[M5-recruitment-ats]]`, O1). |
| OQ-M14-11 | **Delivery status is not available on every channel.** SMS aggregators differ; e-mail bounce handling differs; in-app has no "delivered". | A UI promising a delivery indicator (SH-03) will show "unknown" often. | Model `delivered` as optional per channel and say "sent" where confirmation is unavailable, rather than implying more than we know. |

**Conflict with built design:** none. `design/v3/pages/hr-reports.jsx` already renders HR-34 with the
missing-translation state and per-event channel toggles, consistent with AC-M14-10 and AC-M14-16. SH-03 is
not yet built.

---

*Written by tn-alfred, 2026-09-07. No application code was written.*
