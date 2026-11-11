# M15.1 — HR Helpdesk / Ticketing & Grievance · Functional Specification

> **Naveya** — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M15.1 HR Helpdesk (build-plan §12 Sprint 11 backend; ESS surfaces land Sprint 10 with
> `[[M13-ess-mobile]]`) · **Epic:** NA-24 lane F · **Author:** tn-alfred · **Date:** 2026-09-07
> **Parent document:** `[[M15-reporting-platform]]` (M15 Reporting & Platform). M15.1 is specified
> separately because it is a workflow module in its own right, not a report.
> **Authority:** `docs/development-specification.md` **M15.1** (Purpose, Actors, Entities, Business rules,
> Workflow, API, Permissions, Acceptance), §6.11 `HelpdeskTicket` / `TicketComment`, §4.2, §7, §8, §12 ·
> `docs/functionality-blueprint.md` §15 "HR Helpdesk / Ticketing — **NOW MVP** (ShriConnect scope,
> 2026-07-22): ticket categories, auto-assignment, SLA/TAT tracking, grievance handling `[MVP]`", PART C
> item 12 · `docs/decisions-to-finalize.md` 2026-07-22 scope-change log ·
> `docs/screen-inventory.md` EMP-14, EMP-15, HR-31, HR-32, HR-33, HR-01 ·
> `docs/ui-compliance-requirements.md` **O13** (grievance & helpdesk confidentiality — binding), O11, O12,
> O7, O6, A61, A62, A63 · `design/v3/pages/hr-helpdesk.jsx` (HR-31/32/33, **built**).
>
> **Implementation owner:** cyborg (workflow, SLA engine, API). **Web:** green-lantern. **Mobile:**
> nightwing (`[[M13-ess-mobile]]` EMP-14/15). **Escalation delivery:** `[[M14-notifications]]`.
> **Compliance review:** gordon. **Unit:** deathstroke. **Integration/confidentiality testing:** bane.
>
> **Cross-module links** — `[[M0-foundations]]`, `[[M2-identity-access]]`, `[[M3-core-hr-people]]`,
> `[[M4-document-governance]]`, `[[M8-leave]]`, `[[M10-payroll-core]]`, `[[M13-ess-mobile]]`,
> `[[M14-notifications]]`, `[[M15-reporting-platform]]`, `[[M17-performance-appraisal]]`.

---

## 1 · Intent

Everything else in Naveya is a system of record. The helpdesk is a system of *asking* — the place a teacher
goes when the payslip does not match what they expected, when a leave rejection made no sense, when the
transport allowance stopped, or when something happened at work that they need someone senior to know
about. It exists because the alternative is a WhatsApp message to whoever the person happens to know, and
that has no SLA, no record, and no confidentiality.

Two properties define the module.

**It carries sensitive content by nature.** A ticket body is a salary discrepancy, a medical
circumstance, or a grievance about a colleague. So the confidentiality model is not a feature of the
grievance category alone: **ticket bodies never appear in list views, previews, counts, notification
titles or exports** (O13), internal notes are structurally invisible to the raiser, and the grievance
category is hidden entirely — not shown as "restricted" — from anyone outside the designated handler, since
a greyed row confirms the ticket exists and usually who raised it.

**Its promise is time.** An SLA nobody can see is not a promise. The module computes SLA state from the
raise timestamp and the category's configured target — never hand-set — and says it **in words with the
elapsed time**: *"Due soon — 3h left"*, *"Breaching SLA — 5h over"*, *"Paused — waiting on Ramesh Kumar"*.
Colour may accompany the words; it may never replace them, because the person most likely to be checking a
breach list is doing so on a phone in bright sunlight, and because a colour-only state is invisible to a
screen reader. The built `design/v3/pages/hr-helpdesk.jsx` already renders exactly these strings, and this
specification codifies them.

---

## 2 · Scope & surfaces

### In scope

| Area | What M15.1 delivers | Screens |
|---|---|---|
| Raise | Category picker from configured data, subject, body, attachment, priority where allowed, the SLA that will apply, confidentiality notice for grievance | EMP-15 |
| Track | Own tickets with status, SLA state in words, assignee where disclosable, public thread, reopen | EMP-14 |
| Triage | Queue with SLA/age ordering, assign/reassign, priority, category change, escalate, bulk assign (non-grievance) | HR-31 |
| Work | Thread with public replies and **internal notes**, SLA pause/resume history, resolve with a required summary, close, reopen | HR-32 |
| Configure | Categories with owner/queue, SLA target and basis, escalation target and threshold, restricted flag, raiser-priority permission | HR-33 |
| SLA engine | State computation, pause/resume, breach detection, escalation trigger | — |
| Auto-assignment | By category to an owner or queue, with a fallback that is flagged rather than silent | — |
| Grievance handling | Restricted visibility, no bulk actions, no body in any notification, audited reassignment | all |

### Explicitly out of scope

| Out | Owned by |
|---|---|
| Standard reports and exports | `[[M15-reporting-platform]]` — and **grievance tickets cannot be bulk-exported at all** (O13) |
| Notification delivery and templates | `[[M14-notifications]]` — M15.1 raises the events |
| The corrections a ticket asks for (a payslip fix, a leave reversal, a data correction) | The owning module; a ticket **routes**, it never edits another module's record |
| Employee data edits requested through a ticket | `[[M3-core-hr-people]]` (HR performs them in HR-04) |
| Satisfaction rating | `[proposed]`, not specified (EMP-14; see §8) |
| Knowledge base / self-help articles | Not in MVP; blueprint §15 does not list it |
| Chat, live chat, or a bot | Not in MVP (blueprint: WhatsApp bot is **Later**) |

### API surfaces

- **GraphQL** — `helpdeskTickets` (scoped list), `helpdeskTicket`, `myHelpdeskTickets`, mutations
  `raiseTicket`, `assignTicket`, `commentOnTicket`, `resolveTicket`, `closeTicket`, `reopenTicket`,
  `changeTicketCategory`, `escalateTicket` (`M15.1 §API`).
- **REST edge** — attachment upload/download by short-lived signed URL.
- **ESS** — `…/me/helpdesk-tickets` (`M15.1 §API`, `M13 §API`).

---

## 3 · Data model

Tenant-owned; `tenant_id` NOT NULL plus RLS `ENABLE` + `FORCE` + policy **in the same migration**
(`guard-rls-policy`). Owner: oracle; policy content: wonder-woman — grievance restriction is enforced by
**permission plus policy**, not by a UI filter.

### 3.1 `HelpdeskTicket` (§6.11, extended)

| Field | Type | Notes |
|---|---|---|
| `id`, `tenant_id` | | |
| `ticket_no` | text | human reference, per-tenant sequence — the number a person quotes on the phone |
| `raised_by_user_id` | FK User | |
| `subject_employee_id` | FK Employee null | usually the raiser; HR may raise on behalf (audited) |
| `category_id` | **FK `TicketCategory`** | **not a free enum** — `M15.1 §Business rules` says "configurable" (OQ-M15a-01) |
| `subject`, `body` | text | body is **never** rendered in a list, count, preview or notification (O13) |
| `priority` | enum `low/normal/high` | raiser may set it only where the category allows |
| `assignee_user_id` | FK User null | |
| `status` | enum `open/assigned/in_progress/awaiting_raiser/resolved/closed/reopened` | `awaiting_raiser` is the paused state (§4.4) |
| `sla_category_version` | int | **which version of the category's SLA this ticket was raised under** |
| `sla_due_at` | timestamptz | computed at raise, recomputed only on an explicit, audited action |
| `sla_paused_minutes` | int | accumulated pause |
| `first_response_at`, `resolved_at`, `closed_at`, `reopened_count` | | TAT measurement |
| `resolution_summary` | text | **required** to resolve (HR-32) |
| `escalated_at`, `escalated_to_user_id` | | |
| `is_restricted` | bool | denormalised from the category at raise time, so a later category change cannot un-restrict history |
| `client_ref` | text | offline dedupe from `[[M13-ess-mobile]]` |
| `related_ref` | (type, id) null | payslip, leave request, document request — context for the agent (`[proposed]`, HR-32) |

### 3.2 `TicketComment` (§6.11, extended)

| Field | Type | Notes |
|---|---|---|
| `ticket_id`, `author_user_id`, `body` | | |
| `is_internal` | bool | **hidden from the raiser** — enforced at the resolver and by policy, never by a UI filter |
| `attachment_ref` | encrypted | |
| `pauses_sla` | bool | a public reply that asks the raiser for something may pause the clock (§4.4) |
| `created_at` | | comments are **append-only**; there is no edit or delete (A62) |

### 3.3 `TicketCategory` (new — "configurable ticket categories" has no entity)

| Field | Type | Notes |
|---|---|---|
| `code`, `name_en`, `name_hi` | | both languages (O12) |
| `owner_user_id` / `owner_queue` | | **required** — a category with no owner strands tickets (HR-33) |
| `sla_hours` | int null | **no default**; an unset SLA is a visible state, not a silent zero |
| `sla_basis` | enum `business_hours/calendar_hours` | default business hours |
| `business_hours` | JSON | per campus/tenant working window and week-offs, honouring the holiday calendar (`[[M7-academic-calendar]]`) |
| `escalation_target_user_id`, `escalation_threshold_pct` | | e.g. escalate at 80% of the SLA and again on breach |
| `is_restricted` | bool | the grievance flag; default off |
| `allow_raiser_priority` | bool | |
| `version`, `effective_from`, `is_active` | | **effective-dated supersession** — an SLA change applies to new tickets, never retroactively (`§4.3`, O18) |

### 3.4 `TicketSlaEvent` (new — the clock's audit trail)

`ticket_id`, `kind` (`started/paused/resumed/at_risk/breached/escalated/stopped`), `at`, `actor_or_system`,
`reason`. Without it, "why does this say breached?" has no answer, and a paused clock looks like a stopped
one.

---

## 4 · Behaviour walk-through

### 4.1 Happy path — a payslip question

Ananya opens her August payslip and the HRA line is lower than she expected. She taps **Query this
payslip** (EMP-07 footer), which opens EMP-15 pre-filled with category `payroll` and the run reference.
Before she sends it, the screen states the SLA that category promises — *"HR usually answer payroll
questions within 24 working hours"*. On submit the ticket is created `open`, auto-assigned to the payroll
queue's owner, `sla_due_at` is computed from the category's **current version**, the assignee is notified
(`[[M14-notifications]]`), and she sees the ticket number and its SLA. Meera picks it up, adds an internal
note to a colleague ("check the mid-month revision"), replies publicly asking Ananya to confirm the month
she is comparing against — which **pauses** the clock — and, once Ananya answers, resolves it with a
summary. Ananya may reopen within the window; the clock restarts per policy.

### 4.2 Workflow

```
raise (ESS/mobile)  ->  auto-assign by category  ->  assigned / in_progress
   ->  (public reply asking the raiser something)  ->  awaiting_raiser [SLA paused]
   ->  raiser replies  ->  in_progress [SLA resumed]
   ->  resolved (summary required)  ->  closed
                     \-> reopened (reason required, SLA restarts per policy)
```

`M15.1 §Workflow` states it as: raise, auto-assign, in_progress with comments, resolved, closed or
reopened; the SLA timer runs from raise, pauses per policy, and fires an escalation on breach.

### 4.3 SLA states — said in words, always

| State | Sentence pattern (both languages) | Computed from |
|---|---|---|
| Comfortable | "On track — due in {t}" | `sla_due_at - now` above the at-risk threshold |
| At risk | "Due soon — {t} left" | within `escalation_threshold_pct` of the target |
| Breached | "Breaching SLA — {t} over" | `now > sla_due_at`, unpaused |
| Paused | "Paused — waiting on {name}" | `status = awaiting_raiser` |
| Met on time | "Resolved in {t}, inside the {sla} promise" | `resolved_at <= sla_due_at` |
| Met late | "Resolved in {t}, past the {sla} promise" | `resolved_at > sla_due_at` |
| Unset | "No response-time promise is set for this category" | `sla_hours is null` |

Every state is **computed** from the raise timestamp and the category's configured SLA — never stored as a
hand-set label, never inferred from colour. Elapsed or remaining time is always spoken. This matches the
built design's `slaStateFor` exactly.

### 4.4 Pausing the clock

The clock pauses only when the ticket is genuinely waiting on the raiser (`awaiting_raiser`), set by an
explicit composer choice on a public reply — never automatically and never silently. Pause and resume are
`TicketSlaEvent` rows visible in the ticket's timeline, and the accumulated pause is excluded from the
elapsed calculation. Business-hours SLAs additionally exclude non-working hours, week-offs and published
holidays (`[[M7-academic-calendar]]`) — a 24-hour promise made at 4 p.m. on a Friday before a festival
holiday is not due on Saturday morning.

### 4.5 Confidentiality — the module's hardest requirement

| Rule | Consequence |
|---|---|
| **Ticket bodies never leave the detail view** | HR-31's list shows category, subject line, raiser, age and SLA — never the body; the built design states this on the queue ("A ticket's own content never shows here") |
| **A grievance ticket is hidden, not greyed** | For a user without the restricted role it does not appear in lists, counts, filters, dashboards, search, exports or bulk selections; there is no "restricted" placeholder row (O13, O7) |
| **Internal notes are invisible to the raiser** | Enforced in the resolver and in the RLS/permission layer, not by a UI filter; the composer makes internal-vs-public unmistakable with a word plus colour, never an ambiguous default checkbox (A62) |
| **No grievance content in any notification** | `[[M14-notifications]]` carries the event and the ticket number; never the subject or body (O13, O11) |
| **No bulk actions on grievance tickets** | Bulk assign excludes them and names the exclusion count without naming the tickets |
| **No bulk export of grievance tickets** | `[[M15-reporting-platform]]` refuses it (O13) |
| **Reassignment of a grievance is audited to the restricted trail** | And requires the restricted role (A63) |
| **A category change *into* grievance restricts immediately** | Prior non-restricted viewers lose sight of it, and the confirming dialog says so (HR-32) |
| **PII is never logged** | Ticket bodies, attachments and grievance metadata never enter a log line (`guard-pii-logging`, O11) |

### 4.6 Auto-assignment and its failure mode

Assignment is by category to an owner or a queue (`M15.1 §Business rules`). Where the category has no
resolvable owner — deactivated user, empty queue, holiday — the ticket goes to the **HR fallback queue and
is flagged to administrators**; it is never left unassigned and silent, because an unassigned ticket still
has an SLA running against it. A grievance ticket may only auto-assign to a holder of the restricted role;
if none exists, the raise still succeeds and the failure is escalated to the Group Admin, never dropped.

### 4.7 Edge and error paths

| Situation | Behaviour |
|---|---|
| Category list unconfigured | Falls back to `hr` with a warning to the administrator (EMP-15) |
| Category has no SLA set | Ticket is raised; the state reads "no response-time promise is set" — visible, not zero |
| Category SLA edited | Applies to **new** tickets; open tickets keep their `sla_due_at` and their `sla_category_version` unless explicitly and audibly recalculated (HR-33) |
| Category deactivated with open tickets | Blocked, naming the open count |
| Ticket raised about the person the category auto-assigns to | **Unspecified in the spec** — a conflict-of-interest reroute is missing (OQ-M15a-05); until ruled, a grievance auto-assigns only to the restricted role, which is the partial mitigation |
| Raiser replies after closure | The composer is replaced by *Reopen*; beyond the reopen window, a new linked ticket is offered |
| Assignee leaves or is deactivated | Ticket returns to the category queue and is flagged; the SLA does not reset |
| Duplicate of an open ticket | EMP-15 suggests the existing ticket rather than creating a second (`[proposed]`) |
| Ticket about a locked payroll month | Linked to the run for the agent's context; the fix is still an arrears path in `[[M10-payroll-core]]`, never an edit |
| Offline raise from mobile | Queued with `client_ref`; replay is idempotent (`[[M13-ess-mobile]]` K12) |
| Attachment oversize or wrong type | Named reason before submit; stored encrypted otherwise |

### 4.8 Concurrency

Two agents opening the same ticket use `ETag`/`If-Match` on transitions (`§7`); the second resolve returns
412 and reloads rather than overwriting a resolution summary. Comments are append-only, so concurrent
replies interleave rather than conflict. Escalation is idempotent per (ticket, threshold) so a scheduler
restart cannot escalate twice (`[[M14-notifications]]` `dedupe_key`).

### 4.9 i18n and a11y

- Category names, SLA sentences, status labels, confidentiality notices, rejection and resolution copy are
  EN + हिन्दी (O12, `guard-i18n-strings`); a grievance confidentiality notice is exactly the kind of text
  O12 forbids shipping half-translated.
- Elapsed and remaining times are formatted per locale but express the same magnitude.
- Every SLA state is a **word**; colour is decoration. Screen readers announce "Breaching SLA — 5 hours
  over", not "red".
- The internal-note composer is distinguished by a label and a persistent marker, not by colour alone
  (A62, WCAG AA).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Citation |
|---|---|---|
| AC-M15a-01 | **A ticket raised from mobile auto-assigns by category, surfaces an SLA due time, escalates on breach, and its full history is in the audit log.** | **`M15.1 §Acceptance`** |
| AC-M15a-02 | **A grievance ticket is not visible to unauthorized roles** — it is absent from lists, counts, filters, search, dashboards, bulk selections and exports, with no placeholder row. | **`M15.1 §Acceptance`**, **O13**, O7 |
| AC-M15a-03 | Ticket categories are **configuration data** (`TicketCategory`), never a hardcoded enum; adding a category requires no deployment. | `M15.1 §Business rules`, `guard-hardcoded-values` |
| AC-M15a-04 | A category cannot be created without an owner or queue; a category with no owner cannot receive tickets. | HR-33 |
| AC-M15a-05 | `sla_hours` has **no default**; an unset SLA renders as "no response-time promise is set for this category", never as zero or as a silent pass. | HR-33, `M15.1 §Business rules` |
| AC-M15a-06 | **SLA state is computed** from the raise timestamp and the category's configured target, and is **said in words with the elapsed or remaining time** — never colour alone, never a hand-set label. | **O13**, `§9 Accessibility`, `design/v3/pages/hr-helpdesk.jsx` |
| AC-M15a-07 | The seven SLA states (comfortable, at risk, breached, paused, met on time, met late, unset) exist in EN and हिन्दी with the elapsed time interpolated. | O12, built design |
| AC-M15a-08 | The SLA clock **pauses only** on an explicit `awaiting_raiser` action, and pause/resume are visible events on the ticket timeline. | `M15.1 §Workflow`, HR-32 |
| AC-M15a-09 | A business-hours SLA excludes non-working hours, week-offs and published holidays. | `M15.1 §Business rules`, `[[M7-academic-calendar]]` |
| AC-M15a-10 | A ticket records the **category SLA version** it was raised under; editing a category's SLA applies to new tickets only, and any recalculation of an open ticket is explicit and audited. | `§4.3`, **O18**, HR-33 |
| AC-M15a-11 | Escalation fires on the configured threshold and on breach, is delivered via `[[M14-notifications]]`, and is **idempotent** — a scheduler restart never escalates twice. | `M15.1 §Business rules`, `§7`, O17 |
| AC-M15a-12 | **Ticket bodies never appear** in a list, preview, count, dashboard, notification title or export. | **O13**, HR-31 must-NOT-contain |
| AC-M15a-13 | **Internal comments are hidden from the raiser**, enforced server-side at the resolver and by permission — not by a UI filter; a test proves the raiser's API response contains no internal comment. | **`§6.11`**, **O13**, `M15.1 §Business rules` |
| AC-M15a-14 | The internal-note composer is unmistakable at the moment of writing (a distinct composer and a persistent word, not an ambiguous default checkbox). | **A62**, O13 |
| AC-M15a-15 | Comments are **append-only** — no edit and no delete exists for any role. | A62, `§4.2`, §3 "never build" |
| AC-M15a-16 | Resolving requires a resolution summary; the raiser sees it and may reopen. | HR-32 |
| AC-M15a-17 | Reopen requires a reason and restarts the clock per policy; both are audited. | HR-32, EMP-14 |
| AC-M15a-18 | Changing a category **into** a restricted one restricts the ticket immediately, removes prior non-restricted viewers, and the confirming dialog states that consequence. | HR-32, O13 |
| AC-M15a-19 | Bulk assignment excludes grievance tickets and reports the exclusion as a count, without naming them. | HR-31, O13 |
| AC-M15a-20 | Grievance reassignment requires the restricted role and is written to the restricted audit trail with a reason. | **A63**, `§4.2` |
| AC-M15a-21 | Auto-assignment failure routes to the HR fallback queue **and flags administrators**; a ticket is never silently unassigned while its SLA runs. | `M15.1 §Business rules`, EMP-15 |
| AC-M15a-22 | Every transition — raise, assign, reassign, priority change, category change, comment, pause, resume, escalate, resolve, close, reopen — writes an immutable audit entry with its actor. | **`M15.1 §Acceptance`**, `§4.2`, O6 |
| AC-M15a-23 | No ticket body, attachment content, grievance subject or raiser PII is ever written to a log line. | **`M15.1 §Business rules`** ("PII never logged"), `guard-pii-logging`, O11 |
| AC-M15a-24 | An employee sees only their own tickets, including their own grievance tickets, from web and mobile. | `M15.1 §Permissions`, EMP-14 |
| AC-M15a-25 | `helpdesk.raise` is self-scoped; `helpdesk.manage` is scoped to the holder's campus/group; the grievance category is gated to a distinct restricted role. | **`M15.1 §Permissions`** |
| AC-M15a-26 | A ticket **routes**; it never edits another module's record. A payroll correction requested in a ticket is applied in `[[M10-payroll-core]]` under its own gate. | `M15 §Purpose`, §3 "never build" |
| AC-M15a-27 | An offline-raised ticket replays idempotently by `client_ref` and produces one ticket. | `§7`, **O17**, `[[M13-ess-mobile]]` |
| AC-M15a-28 | Category names, SLA sentences, statuses, confidentiality notices and resolution copy exist in EN and हिन्दी with no English fallback. | **O12**, `guard-i18n-strings` |
| AC-M15a-29 | Attachments are stored encrypted under a per-tenant key prefix and served by short-lived signed URL; a signed URL from one tenant cannot be redeemed in another. | `§8`, `[[M0-foundations]]` |
| AC-M15a-30 | HR-31 orders by SLA jeopardy and age by default (oldest and most-breaching first), and states the breaching count as a sentence. | HR-31, built design |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | SLA state machine across all seven states; business-hours arithmetic across a week-off, a published holiday and a Friday-evening raise; pause/resume accumulation; escalation threshold and idempotency; `sla_due_at` pinned to the category version; auto-assignment resolution and its fallback; the EN/HI sentence table for every state |
| Integration | **bane** | **The raiser's API response contains no internal comment, under every query shape** (the confidentiality regression test); a non-restricted user's list, count, search, filter option list and export contain no grievance ticket and no placeholder; bulk assign excludes grievances; category change into grievance revokes visibility immediately; cross-tenant ticket read returns nothing; attachment URL cross-tenant refusal |
| Confidentiality chaos | **bane** | Attempt to reach a grievance by direct id, by ticket number, by search term, by notification deep link, by export, and by a related-record link — each must 404, not 403-with-detail |
| Workflow | **bane** | The full raise-to-close path from mobile including reopen; concurrent resolve returns 412; escalation after a scheduler restart fires once |
| Compliance review | **gordon** | No PII in log output during a full ticket lifecycle including attachment upload; notification payloads for every helpdesk event carry no subject or body |
| a11y and Hindi | **two-face** | Every SLA state announced as a sentence with time; internal composer distinguishable without colour; Devanagari confidentiality notice does not truncate |

---

## 7 · Proposed stories

Backend Sprint 11; ESS surfaces ride Sprint 10 with `[[M13-ess-mobile]]`.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M15a-S01 | `TicketCategory`, `HelpdeskTicket`, `TicketComment`, `TicketSlaEvent` models + RLS | The four tables, policies in the same migration, restriction enforced at the policy layer. | oracle | 5 | M0-S04 |
| M15a-S02 | Grievance restriction: permission, policy content and resolver guards | Hidden, not greyed — proven server-side. | wonder-woman | 5 | M15a-S01 |
| M15a-S03 | Ticket workflow API (raise, assign, comment, resolve, close, reopen, category change) | The state machine with its audit entries. | cyborg | 8 | M15a-S01 |
| M15a-S04 | **SLA engine**: state computation, business hours, pause/resume, version pinning | The promise, computed rather than asserted. | cyborg | 8 | M15a-S03 |
| M15a-S05 | Auto-assignment + fallback queue + administrator flag | A ticket is never silently unassigned. | cyborg | 3 | M15a-S03 |
| M15a-S06 | Escalation events into `[[M14-notifications]]`, idempotent per threshold | Breach that reaches a person, once. | cyborg | 3 | M15a-S04, M14-S02 |
| M15a-S07 | HR-31 queue (SLA-ordered, grievance-safe, bulk assign with exclusions) | Which questions need answering, and which are breaching. | green-lantern | 5 | M15a-S03 |
| M15a-S08 | HR-32 ticket detail (public/internal composer, SLA timeline, resolve/close/reopen) | The thread where the internal/public boundary must be unmistakable. | green-lantern | 5 | M15a-S04 |
| M15a-S09 | HR-33 categories & SLA setup, effective-dated | Configuration a school can hold, with no hidden defaults. | green-lantern | 5 | M15a-S01 |
| M15a-S10 | EMP-14 / EMP-15 web parity | Raise and track from a desktop. | green-lantern | 3 | M15a-S03 |
| M15a-S11 | Attachment handling: encrypted storage, signed URLs, type/size limits | Files that do not become a leak. | cyborg | 3 | M0-S16 |
| M15a-S12 | Confidentiality test suite | The suite that decides whether O13 is real. | bane | 8 | M15a-S02 |
| M15a-S13 | SLA correctness suite (holidays, week-offs, pauses, version pinning) | Time arithmetic nobody should have to re-derive later. | deathstroke | 5 | M15a-S04 |

**Total: 13 stories, 66 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M15a-01 | **`HelpdeskTicket.category` is modelled in §6.11 as an enum-ish value** (`it/hr/payroll/facilities/grievance/…`) while `M15.1 §Business rules` requires **configurable** categories with owners, SLAs and escalation targets. | An enum cannot carry an owner, an SLA or a restricted flag, so HR-33 has nothing to configure. | Promote to `TicketCategory` (§3.3) with the enum values as seeded defaults. |
| OQ-M15a-02 | **No SLA state, pause, first-response or resolution-summary fields exist** on the entity, yet the acceptance criterion demands a surfaced SLA and escalation on breach. | The module's headline promise is unstorable as specified. | Extend as in §3.1 and add `TicketSlaEvent`. |
| OQ-M15a-03 | **Which role is the grievance handler?** `M15.1 §Permissions` says "gated to a restricted role"; `M2 §Seed roles` defines seven roles and none of them is it. | Without a named role, grievance handling defaults to whoever holds `helpdesk.manage` — precisely the exposure O13 exists to prevent. | A distinct capability flag (`helpdesk.grievance`) grantable to one or two named people, following the maker-checker flag pattern (screen-inventory C6). **Ruling needed.** |
| OQ-M15a-04 | **What is the reopen window?** EMP-14 and HR-32 both need one; nothing specifies it. | A ticket reopenable forever never closes; one that cannot be reopened forces duplicates. | 14 days after `closed_at`, per-tenant configurable; beyond it, a new linked ticket. |
| OQ-M15a-05 | **Conflict of interest on a grievance.** `M15.1` restricts *access* but says nothing about a grievance **about** the person the category assigns to. | The single most damaging failure this module can have: routing a complaint to its subject. | Exclude the subject of a grievance from its assignment chain and route to the next holder or the Group Admin; where no conflict-free handler exists, escalate outside the campus. This is HR policy as much as software — **ruling needed**. |
| OQ-M15a-06 | **May HR raise a ticket on behalf of an employee?** Common in practice (a teacher phones the office). §6.11 has `raised_by_user_id` only. | Attribution and confidentiality both change if the raiser is not the subject. | `subject_employee_id` (§3.1) with the on-behalf action audited; never permitted for grievance. |
| OQ-M15a-07 | **Are helpdesk categories tenant-level or campus-level?** (screen-inventory Q21.) A group may want different owners per campus. | A single group-wide `payroll` queue misroutes for a multi-campus trust. | Category defined at group level with a **per-campus owner override**; SLA stays group-level. |
| OQ-M15a-08 | **Is a satisfaction rating in scope?** EMP-14 lists it as `[proposed]`; the spec specifies SLA/TAT but not satisfaction. | Rating data about named agents is evaluative data and would fall under the M15 aggregate rules. | Out of MVP. If added, aggregate only, minimum cell size applies (`[[M15-reporting-platform]]`). |
| OQ-M15a-09 | **Do helpdesk metrics reach a report?** `[[M15-reporting-platform]]` owns reports; nothing lists a helpdesk report, yet SLA compliance is exactly what a Principal will ask for. | Without a definition, someone will export the queue — which risks bodies and grievances leaving the product. | A `helpdesk_sla` report definition with **no body column**, grievance rows excluded entirely, minimum cell size applied to per-agent breakdowns. |
| OQ-M15a-10 | **The 22 July ShriConnect deck contains no helpdesk slide**, and its pricing tiers (Basic / Complete / Custom, slide 18) list neither the helpdesk nor PAMS in any plan — yet both were pulled into MVP on that date. | The commercial artefact and the build scope disagree about what v1 contains, which will surface in the first customer conversation. | Not a build blocker; the dev spec governs. Flagged for BATMAN and the commercial owner. |
| OQ-M15a-11 | **Does an SLA pause require the raiser to be notified?** A paused clock that the raiser does not know about looks like an unanswered ticket. | Pausing without telling the raiser is how a school ends up blaming the software. | Every pause is accompanied by the public reply that caused it — pausing without a reply should not be possible. Asserted in §4.4; confirm. |

**Conflicts with built design:** none. `design/v3/pages/hr-helpdesk.jsx` already implements category-versioned
SLAs, the seven word-based SLA states, the pause semantics, grievance restriction and the "a ticket's own
content never shows here" queue rule; this document codifies them as AC-M15a-06, -07, -08, -10 and -12.
EMP-14/EMP-15 are unbuilt.

---

*Written by tn-alfred, 2026-09-07. No application code was written.*
