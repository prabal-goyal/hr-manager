# M16 — Integrations · Functional Specification

> **Naveya** — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M16 Integrations (build-plan §12 Sprint 11; biometric ingestion is first consumed in Sprint 6)
> · **Epic:** NA-24 lane F · **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M16, M9 §API (`POST …/attendance/ingest`), §2
> (architecture), §7 (Webhooks — signed HMAC, retried with backoff, per-tenant), §8, §10, §12 ·
> `docs/functionality-blueprint.md` §2 (biometric device integration `[MVP]`), §14 (★ Academic-System
> Integration Layer — SIS/ERP connector `[P2, but design the API from MVP]`), §15 (device families
> `[MVP]`; Tally/accounting export `[P2]`; open REST API + webhooks `[P2]`; SMS/e-mail `[MVP]`, WhatsApp
> `[P2]`), PART B item 7 ("Integrations — MVP **as architecture**") ·
> `docs/decisions-to-finalize.md` **D4 LOCKED** (HRMS-only; integrate with existing school ERPs; own a
> minimal internal timetable/staff-structure store) · `docs/screen-inventory.md` GA-10, GA-11 ·
> `docs/ui-compliance-requirements.md` O11, O15, O9, A64, §3 ("tenant/campus is never a client-settable
> parameter") · `CLAUDE.md` **`guard-vendor-isolation`**.
>
> **Implementation owner:** martian (`backend/integrations/`, all adapters, outbox, webhooks).
> **Domain-side consumers:** cyborg (attendance ingest projection, event emission),
> `[[M14-notifications]]` (delivery), `[[M11-statutory-compliance]]` (filing artefacts). **Web:** green-lantern
> (GA-10, GA-11). **Chaos:** bane.
>
> **Cross-module links** — `[[M0-foundations]]`, `[[M2-identity-access]]`, `[[M3-core-hr-people]]`,
> `[[M5-recruitment-ats]]`, `[[M9-attendance]]`, `[[M10-payroll-core]]`, `[[M11-statutory-compliance]]`,
> `[[M13-ess-mobile]]`, `[[M14-notifications]]`, `[[M15-reporting-platform]]`, `[[M15a-helpdesk]]`.

---

## 1 · Intent

Naveya is the broker and the source of truth; **no client surface ever talks to a vendor directly**
(`CLAUDE.md`). M16 is where the outside world is allowed in, and its whole design is one idea taken
seriously: *vendors are interchangeable, our domain is not.* A biometric gate device, an SMS aggregator, an
accounting package and a bank each speak their own dialect, change it without warning, and go down at
inconvenient times. If any of that dialect reaches domain code, the domain inherits the vendor's outages
and its release schedule.

So M16 is ports and adapters, enforced by a hook rather than by discipline: **a vendor SDK may be imported
only inside `backend/integrations/adapters/`** (`guard-vendor-isolation`). Everything above the boundary
speaks a canonical, tested vocabulary — a punch, a message, a journal line, a payout instruction — and every
adapter's job is translation and nothing else.

The stakes are highest on the way *in*. A silent biometric device does not look like a failure; it looks
like an empty attendance day, which becomes an absence, which becomes LOP, which becomes wrong pay
(`[[M9-attendance]]`, `[[M10-payroll-core]]`). That is why GA-11 exists and why "the device has not
reported" is a **distinct state** from "the employee was absent" — a distinction the whole product depends
on and that no amount of correct payroll arithmetic can recover once lost.

---

## 2 · Scope & surfaces

### In scope

| Area | What M16 delivers | MVP? |
|---|---|---|
| **Biometric ingestion** | Device registry, push endpoint, pull scheduler, canonical punch DTO, idempotent ingestion, rejection log, gap detection, outage windows | **MVP** |
| Device families | ZKTeco, eSSL, Matrix, Realtime, **Spectra** (`CLAUDE.md` and blueprint §15; the dev spec's M16 list omits Spectra — OQ-M16-01) | **MVP** |
| **Messaging transport** | SMS and e-mail adapters (MSG91, Gupshup, Twilio) behind one `MessagingPort`, driven by `[[M14-notifications]]` | **MVP** |
| WhatsApp | Same port, different adapter | **P2** |
| **Outbox** | Transactional outbox for every outbound side effect, with retry, backoff and dead-letter | **MVP** |
| **Webhooks (outbound)** | Signed (HMAC), per-tenant, retried, replayable; events `employee.created`, `payroll_run.approved`, `offer.accepted` | **MVP** (see OQ-M16-03) |
| Service tokens | Machine credentials for ingestion, scoped and revocable | **MVP** |
| Accounting export (Tally) | `AccountingExportPort` + a Tally XML adapter; pay-head to ledger mapping | **P2** — port defined in MVP, adapter later |
| Bank disbursement / NEFT (Razorpay) | `DisbursementPort`; MVP produces a **bank file** in `[[M10-payroll-core]]`, not an API payout | **Port only** (OQ-M16-04) |
| Statutory portals (EPFO / ESIC / TRACES) | `StatutoryArtefactPort` — MVP **generates artefacts** (ECR, 24Q, challans) for human upload | **Artefact only** (OQ-M16-05) |
| SIS / school-ERP connector | Stable internal staff/attendance API designed now, connector later (D4, blueprint §14) | **P2, API designed in MVP** |
| GA-10 / GA-11 | Provider and webhook configuration; device and ingestion health | **MVP** |

### Explicitly out of scope

| Out | Owned by / status |
|---|---|
| The meaning of an attendance record (status, paid days, reconciliation) | `[[M9-attendance]]` — M16 delivers punches, never statuses |
| Notification content, recipients, templates | `[[M14-notifications]]` |
| Payroll computation and the bank file's content | `[[M10-payroll-core]]` |
| Statutory artefact *content* and correctness | `[[M11-statutory-compliance]]` |
| Timetable import, substitution, period-level attendance | **Phase 2** (D2) |
| Deep SIS/exam/transport/hostel integrations | **Phase 2** (blueprint) |
| Any vendor SDK import outside `backend/integrations/adapters/` | **Forbidden** (`guard-vendor-isolation`) |

### API surfaces

- **REST edge (ingestion)** — `POST /api/v1/attendance/ingest` (device push, service-token authenticated),
  `POST /api/v1/webhooks/{provider}/status` (delivery callbacks). REST because these are device and
  machine surfaces (`§7`).
- **GraphQL (administration)** — devices, ingestion batches, rejections, webhook endpoints, deliveries,
  provider connections.
- **Outbound webhooks** — signed HTTPS POST to tenant-registered endpoints.
- **Ports (internal Python protocols)** — `BiometricPort`, `MessagingPort`, `AccountingExportPort`,
  `DisbursementPort`, `StatutoryArtefactPort`. Domain code depends on these, never on an adapter.

---

## 3 · Data model

Tenant-owned; `tenant_id` NOT NULL plus RLS `ENABLE` + `FORCE` + policy **in the same migration**
(`guard-rls-policy`). Owner: oracle; policy content: wonder-woman. §6 of the dev spec defines **none** of
these entities — the whole module is currently entity-less (OQ-M16-02).

### 3.1 `IntegrationConnection`

`kind` (`biometric/sms/email/whatsapp/accounting/disbursement/statutory/erp`), `vendor`
(`zkteco/essl/matrix/realtime/spectra/msg91/gupshup/twilio/tally/razorpay/…`), `label`, `status`
(`unconfigured/active/failing/disabled`), `config` JSON (**no secrets**), `secret_ref` (pointer into the
secret store — credentials are **write-only** and never re-displayed, GA-10), `scope` (group/campus),
`last_health_at`, `last_error_code`.

### 3.2 `Device`

`connection_id`, `family`, `serial` (unique per tenant), `campus_id`, `gate_label`, `mode`
(`push/pull`), `firmware`, `last_seen_at`, `last_record_at`, `expected_interval_minutes`,
`clock_offset_seconds`, `status` (`healthy/silent/unmapped/deactivated`).

### 3.3 `IngestionBatch` and `IngestionRecord`

Batch: `device_id`, `received_at`, `source` (`push/pull/manual_resync`), `record_count`, `accepted`,
`rejected`, `service_token_id`, `raw_ref` (retained briefly for support, PII-minimised).
Record: `batch_id`, `device_user_code`, `punched_at_device`, `punched_at_normalised`, `direction`
(`in/out/unknown`), `status` (`accepted/duplicate/rejected/quarantined`), `reject_reason`
(`unknown_code/out_of_range/future_timestamp/duplicate/malformed/unmapped_device`),
`resulting_attendance_id`, `resolved_by_user_id`.

`device_user_code` to employee mapping lives on `EmployeeDeviceMapping` (`employee_id`, `connection_id`,
`device_user_code`, `effective_from/to`) — because codes are reassigned when staff leave, and a punch must
map to whoever held the code **on that date**.

### 3.4 `OutboxEvent`

`event_type`, `payload` JSON (**PII-filtered**), `dedupe_key`, `status`
(`pending/sending/sent/failed/dead`), `attempts`, `next_attempt_at`, `last_error_code`,
`available_after` — written **in the same transaction as the domain change**, which is the whole point of
an outbox: a payroll approval and its webhook either both happen or neither does.

### 3.5 `WebhookEndpoint` and `WebhookDelivery`

Endpoint: `url` (**HTTPS only**), `events` JSON, `secret_hash`, `previous_secret_hash` +
`rotation_expires_at` (overlap window), `is_enabled`, `created_by`, `last_success_at`,
`consecutive_failures`.
Delivery: `endpoint_id`, `outbox_event_id`, `attempt`, `request_signature`, `response_status`,
`response_ms`, `status` (`pending/succeeded/failed/dropped`), `next_attempt_at`.

### 3.6 `ServiceToken`

Already recommended by `[[M0-foundations]]` (OQ-M0-04): `tenant_id`, `label`, `scopes`, `secret_hash`,
`last_used_at`, `expires_at`, `revoked_at`. An ingestion token writes attendance, which writes pay — so it
is issued once, shown once, scoped narrowly, and revocable from GA-10.

---

## 4 · Behaviour walk-through

### 4.1 Ports and adapters — the boundary

```
domain / application code          ports (Protocol)             adapters (vendor SDKs live ONLY here)
-------------------------          ---------------------        -------------------------------------
M9 attendance projection    <----  BiometricPort         <----  zkteco.py / essl.py / matrix.py /
M14 notifications           ---->  MessagingPort         ---->  realtime.py / spectra.py
M10 payroll (P2)            ---->  AccountingExportPort  ---->  msg91.py / gupshup.py / twilio.py
M10 payroll (port only)     ---->  DisbursementPort      ---->  tally.py
M11 statutory               ---->  StatutoryArtefactPort ---->  razorpay.py  (P2)
                                                                epfo.py / esic.py / traces.py
```

Rules that make this real rather than decorative:

1. A port speaks **canonical DTOs** — `Punch(employee_ref, at, direction, device_ref, raw_meta)`,
   `Message(channel, address, body, locale, reference)` — never a vendor type.
2. An adapter **translates and nothing else**: no business rules, no attendance statuses, no notification
   recipients, no money arithmetic.
3. Capability differences are declared, not implied: `MessagingPort.capabilities()` reports whether the
   vendor supports delivery receipts, so `[[M14-notifications]]` can say "sent" instead of promising
   "delivered" it cannot observe.
4. Vendor errors are mapped to a **provider-neutral** error taxonomy at the boundary. Domain code never
   branches on a vendor error string.
5. Adapters are individually testable against recorded fixtures; no test hits a live vendor.

### 4.2 Inbound — a biometric push

1. A device (or the on-site middleware speaking for it) POSTs to `…/attendance/ingest` authenticated by a
   **service token**, which carries the tenant. **The tenant is never a body or query parameter**
   (`§7 Tenancy`, §3 "never build").
2. The adapter for that family parses the payload into canonical punches. Malformed rows are rejected
   individually — one bad row never rejects a batch.
3. Each punch is **normalised to server time** using the device's known `clock_offset_seconds`, and the
   raw device timestamp is retained for provenance (O15, `DESIGN.md` 6).
4. `device_user_code` is mapped to an employee **as at the punch date** via `EmployeeDeviceMapping`.
   Unknown codes are `rejected` with `unknown_code` and land in GA-11's resolution list — never dropped.
5. Ingestion is **idempotent** on (device, device_user_code, punched_at, direction). A device that replays
   its buffer after a network outage produces no duplicates (`§7`, O17).
6. Accepted punches are handed to `[[M9-attendance]]`, which decides what they mean. M16 never writes an
   attendance *status*.
7. The batch is recorded with counts, so "we received 412 punches from Gate 2 at 08:05" is answerable.

### 4.3 Inbound — a pull

For pull-mode devices a scheduled job fetches a date range per device with tenant context. Re-running it is
safe (same idempotency key). A manual re-sync from GA-11 uses the same path so there is one ingestion
route, not two.

### 4.4 Device health and the silent-device problem

- Each device declares an `expected_interval_minutes`. A device that has not reported within its interval
  during working hours becomes `silent`, raising `attendance.device_silent`
  (`[[M14-notifications]]`, compliance-marked).
- GA-11 shows last-seen, today's count, and the ingestion log with rejection reasons.
- An administrator may raise an **outage window** for a device and date range; every attendance surface
  then reads "not yet received from the device" for those days — **distinct from absent** — so a silent gate
  cannot quietly manufacture LOP (`M16 §Acceptance`, EMP-01 non-happy paths).
- Clock drift beyond a threshold is detected from the delta between device and server timestamps and
  surfaced; punches are still accepted, with the offset recorded.

### 4.5 Outbound — the outbox

Every outbound side effect (a webhook, an SMS handoff, an accounting export job) is written as an
`OutboxEvent` **inside the transaction that changed the domain**. A separate worker drains it. This gives
exactly the properties the spec asks for and nothing more:

- **At-least-once** delivery with bounded exponential backoff and jitter;
- **dedupe_key** so a retry after an ambiguous response does not double-deliver;
- a terminal `dead` state that is **visible** on GA-10, never a silent give-up;
- ordering that is *not* promised — consumers are told to use the event id and `occurred_at`, because
  promising ordering across retries is a promise we would break.

### 4.6 Outbound — webhooks

- HTTPS only; a plain-HTTP endpoint is refused at registration.
- **SSRF protection:** endpoint hosts resolving to private, loopback, link-local or metadata addresses are
  refused, and the resolution is re-checked at delivery time (DNS rebinding).
- Each delivery is signed with an HMAC over the raw body plus a timestamp, in a versioned signature header,
  so a consumer can verify and reject replays.
- Secrets are generated server-side, **shown once**, and rotated with an overlap window during which both
  signatures verify.
- Retries: bounded schedule; after N consecutive failures the endpoint is auto-disabled **and the tenant is
  notified** — deliveries then stop rather than queueing forever.
- Failed deliveries are replayable from GA-10 with the same idempotency semantics.
- Payloads carry **references and non-sensitive facts** — `employee.created` carries an id, a staff code and
  a campus, never PAN, Aadhaar, bank details or salary (O11, `§8`).

### 4.7 Edge and error paths

| Situation | Behaviour |
|---|---|
| Device pushes for an unregistered serial | Batch rejected with `unmapped_device`; the serial is shown in GA-11 for registration — never silently accepted into a tenant |
| Device pushes a future timestamp | `rejected: future_timestamp`, with the drift shown; never quietly stored |
| Punch for an employee who has exited | Accepted and quarantined for HR review; it may be a code reassigned to a new joiner |
| Two devices at one gate double-punch | Idempotency key plus a configurable de-bounce window; the second is `duplicate` |
| Provider credentials invalid | Connection `failing`, the vendor's message surfaced verbatim to the admin, no retry storm |
| Provider quota exhausted | Provider-neutral `quota_exceeded`; messages remain queued and the admin is told |
| Endpoint returns 2xx but did not process | Not our problem to detect; we deliver, sign and record — the consumer owns idempotency, and we say so in the OpenAPI docs |
| Tenant deletes a webhook endpoint mid-flight | Pending deliveries are `dropped` with a reason, visible |
| On-prem install with no outbound internet | Adapters degrade to file-based artefacts (bank file, ECR, journal export); nothing hard-fails at boot (`§3` on-prem parity) |

### 4.8 Security

- Service tokens and provider credentials live in a secret store, never in `config` JSON, never in logs
  (`guard-pii-logging`).
- A token scopes to exactly one capability (`attendance.ingest`) and one tenant; expiry defaults to one
  year and revocation is immediate.
- Ingestion is rate-limited per token and per device; an unusually large batch is accepted but flagged.
- Every configuration change — connection created, credential rotated, endpoint added or disabled, token
  issued or revoked, device registered or deactivated, outage window raised — is **audited** (`§4.2`).
- Vendor payloads are retained only briefly and PII-minimised; we do not become a shadow copy of a
  provider's data.

### 4.9 i18n and a11y

GA-10 and GA-11 are administrator surfaces and carry the same obligations as the rest: EN + हिन्दी copy
(O12), device and delivery states **in words** ("silent since 06:40 today", "3 deliveries failing"), never
colour alone, and rejection reasons expressed as sentences a school's IT coordinator can act on rather than
vendor error codes.

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Citation |
|---|---|---|
| AC-M16-01 | **A biometric push creates attendance records** for the mapped employees, via the canonical punch DTO. | **`M16 §Acceptance`**, `M9 §API` |
| AC-M16-02 | **A webhook fires on payroll approval** (`payroll_run.approved`), signed and delivered per tenant. | **`M16 §Acceptance`**, `§7 Webhooks` |
| AC-M16-03 | **Every vendor SDK import lives inside `backend/integrations/adapters/`**; a vendor import elsewhere fails the guard and CI. | **`guard-vendor-isolation`**, `CLAUDE.md` |
| AC-M16-04 | Domain code depends only on ports (`BiometricPort`, `MessagingPort`, `AccountingExportPort`, `DisbursementPort`, `StatutoryArtefactPort`) and canonical DTOs; no vendor type crosses the boundary. | `§2`, blueprint PART B item 7 |
| AC-M16-05 | Adapters contain translation only — no attendance status, no recipient resolution, no money arithmetic, no business rule. | `§2`, `M16 §Purpose` |
| AC-M16-06 | Vendor errors are mapped to a provider-neutral taxonomy at the boundary; no domain branch reads a vendor error string. | `§2`, `§10` |
| AC-M16-07 | Adapters exist for ZKTeco, eSSL, Matrix, Realtime **and Spectra**, each tested against recorded fixtures with no live vendor call in any test. | `M16 §Business rules`, blueprint §15, `CLAUDE.md` |
| AC-M16-08 | Ingestion authenticates by **service token** carrying the tenant; a tenant or campus supplied in the body or query string is rejected. | `§7 Tenancy`, §3 "never build" |
| AC-M16-09 | Ingestion is **idempotent** on (device, device_user_code, punched_at, direction); a device replaying its buffer creates no duplicates. | `§7 Concurrency`, **O17** |
| AC-M16-10 | A malformed or unmappable row is rejected **individually with a reason**; one bad row never rejects a batch, and no row is silently dropped. | `M16 §Business rules`, GA-11 |
| AC-M16-11 | Rejected records appear in GA-11 with a resolvable cause; mapping a code ingests the record and triggers attendance recomputation; discarding is recorded with a reason. | GA-11 |
| AC-M16-12 | `device_user_code` maps to the employee who held that code **on the punch date**, so a reassigned code never credits the wrong person. | `M9 §Business rules`, `§4.3` |
| AC-M16-13 | Device timestamps are normalised to server time with the raw device timestamp retained; clock drift beyond the threshold is recorded and surfaced. | **O15**, `M9 §Business rules` |
| AC-M16-14 | A device that misses its expected interval becomes `silent` and raises `attendance.device_silent` to Group Admin and HR. | `M16 §Acceptance`, `[[M14-notifications]]` |
| AC-M16-15 | **"Not yet received from the device" is a distinct state from "absent"** across every attendance surface, and an outage window applies it for a date range. | `M16 §Acceptance`, EMP-01, GA-11 |
| AC-M16-16 | M16 never writes an attendance status; it delivers punches and `[[M9-attendance]]` decides. | `M9 §Business rules` |
| AC-M16-17 | Every outbound side effect is written to the **transactional outbox in the same transaction as the domain change**; a rolled-back approval sends no webhook. | `§2`, `§7` |
| AC-M16-18 | Outbox delivery is at-least-once with bounded exponential backoff and a `dedupe_key`; the terminal `dead` state is visible on GA-10, never silent. | `§7 Webhooks`, `§10` |
| AC-M16-19 | Delivery ordering is **not** promised; the payload carries an event id and `occurred_at` and the published contract says consumers must be idempotent. | `§7` |
| AC-M16-20 | Webhook endpoints are **HTTPS only**, and hosts resolving to private, loopback, link-local or cloud-metadata addresses are refused at registration **and re-checked at delivery**. | `§8`, defence in depth |
| AC-M16-21 | Every delivery is **HMAC-signed** over the raw body with a timestamp in a versioned header, enabling verification and replay rejection. | **`§7 Webhooks`** |
| AC-M16-22 | Secrets are generated server-side, shown **once**, stored hashed, and rotated with an overlap window during which both signatures verify. | GA-10, `§8` |
| AC-M16-23 | After N consecutive failures an endpoint is auto-disabled **and the tenant is notified**; deliveries stop rather than queueing indefinitely. | GA-10, `§7` |
| AC-M16-24 | A failed delivery can be replayed from GA-10 with unchanged idempotency semantics. | GA-10 |
| AC-M16-25 | Webhook and outbox payloads carry **no PAN, Aadhaar, UAN, ESIC, bank account, salary or DOB**; they carry references and non-sensitive facts. | **`§8`**, **O11** |
| AC-M16-26 | Provider credentials are write-only, stored in the secret store, never re-displayed and never logged. | GA-10, `§8`, `guard-pii-logging` |
| AC-M16-27 | A service token is scoped to one capability and one tenant, shown once, expires (default one year) and is revocable with immediate effect. | GA-10, `[[M0-foundations]]` OQ-M0-04 |
| AC-M16-28 | Ingestion is rate-limited per token and per device; an anomalous batch size is accepted and flagged rather than silently trusted. | `§8`, `§9` |
| AC-M16-29 | Every integration configuration change is written to the immutable audit log with its actor. | `§4.2`, A64-adjacent |
| AC-M16-30 | `MessagingPort` declares its capabilities, so `[[M14-notifications]]` never claims a delivery confirmation a vendor cannot provide. | `§4.6`, `[[M14-notifications]]` AC-M14-11 |
| AC-M16-31 | The accounting-export, disbursement and statutory-portal **ports exist in MVP with at least a file-based implementation**, so the P2 adapters are a substitution rather than a redesign. | blueprint PART B item 7 ("MVP as architecture"), D4 |
| AC-M16-32 | An on-prem install with no outbound internet boots and operates: adapters degrade to file artefacts and nothing hard-fails. | `§3`, `§10` |
| AC-M16-33 | GA-10 and GA-11 state device, delivery and connection health **in words** with times, in EN and हिन्दी, and never in colour alone. | O12, `§9 Accessibility` |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | Each adapter against **recorded vendor fixtures** (a real ZKTeco push body, an eSSL pull response, an MSG91 status callback) with no network; canonical DTO round-trips; error-taxonomy mapping; idempotency key construction; clock normalisation including a device an hour behind; `EmployeeDeviceMapping` date resolution across a code reassignment; HMAC signature construction and verification; SSRF host classification table |
| Integration | **bane** | Ingest with a valid token creates punches in the right tenant and **cannot** be steered to another tenant by any body field; replayed batch creates nothing new; malformed rows rejected individually; outbox row and domain change commit or roll back together; endpoint auto-disable after N failures; secret rotation overlap accepts both signatures |
| **Integration chaos** | **bane** | Device offline for a day then dumping its buffer; duplicate pushes from a retrying middleware; out-of-order deliveries; provider 5xx storm and quota exhaustion; endpoint that accepts then times out; DNS rebinding at delivery time; outbox worker killed mid-send; two workers draining concurrently; a silent device across a month boundary and the LOP consequence it would have caused |
| Contract | **cyborg** + CI | The ingest and webhook payloads are in the committed OpenAPI; generated clients compile; a breaking change fails CI |
| Compliance review | **gordon** | No PII in any webhook payload, outbox payload or log line during a full ingest-to-webhook cycle; credentials never re-displayed |
| Guard | CI | A deliberate vendor import outside `adapters/` fails `guard-vendor-isolation` |

---

## 7 · Proposed stories

Biometric ingestion is consumed from Sprint 6; the rest lands Sprint 11.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M16-S01 | `backend/integrations/` package layout, port protocols, canonical DTOs, error taxonomy | The boundary itself, before any vendor exists. | martian | 5 | M0-S01 |
| M16-S02 | `IntegrationConnection`, `Device`, `EmployeeDeviceMapping`, ingestion tables + RLS | The registry and the ingestion ledger. | oracle | 5 | M0-S04 |
| M16-S03 | **Transactional outbox + worker** (backoff, dedupe, dead-letter) | The one delivery mechanism everything outbound uses. | martian | 8 | M0-S14 |
| M16-S04 | `ServiceToken` issue/scope/revoke + ingestion auth | Machine credentials that write attendance, therefore pay. | wonder-woman | 5 | M0-S08 |
| M16-S05 | **Ingest endpoint**: idempotency, per-row rejection, normalisation, mapping | The inbound path the whole attendance story rests on. | martian | 8 | M16-S02, M16-S04 |
| M16-S06 | Biometric adapters: ZKTeco, eSSL, Matrix, Realtime, Spectra (fixture-tested) | Five dialects, one DTO. | martian | 8 | M16-S05 |
| M16-S07 | Pull scheduler + manual re-sync on one ingestion route | No second path with different rules. | martian | 5 | M16-S05 |
| M16-S08 | Device health, silence detection, outage windows | The state that stops a dead gate becoming LOP. | martian | 5 | M16-S05, M14-S02 |
| M16-S09 | `MessagingPort` + MSG91 / Gupshup / Twilio adapters + capability declaration | Transport for `[[M14-notifications]]`, with honest delivery claims. | martian | 5 | M16-S03 |
| M16-S10 | Delivery-status callback endpoint and projection | Status that returns and lands. | martian | 3 | M16-S09 |
| M16-S11 | **Webhook endpoints + signed delivery + rotation + SSRF guard** | The outbound contract, safe by construction. | martian | 8 | M16-S03 |
| M16-S12 | Event emission for `employee.created`, `payroll_run.approved`, `offer.accepted` | Three events, emitted from the owning transactions. | cyborg | 3 | M16-S03 |
| M16-S13 | GA-10 integrations & webhooks console | Configure, test, rotate, replay — with secrets shown once. | green-lantern | 5 | M16-S11 |
| M16-S14 | GA-11 devices & ingestion health | Are our devices actually sending data? | green-lantern | 5 | M16-S08 |
| M16-S15 | `AccountingExportPort`, `DisbursementPort`, `StatutoryArtefactPort` with file-based implementations | Ports now so the P2 adapters are a substitution, not a redesign. | martian | 5 | M16-S01 |
| M16-S16 | Integration chaos suite | Buffer dumps, duplicates, rebinding, worker kills, silent devices. | bane | 8 | M16-S05, M16-S11 |

**Total: 16 stories, 91 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M16-01 | **Device family list disagreement.** `M16 §Business rules` names ZKTeco/eSSL/Matrix/Realtime; `CLAUDE.md` and blueprint §15 add **Spectra**; GA-11's picker lists four. | An adapter nobody planned for is a sprint's surprise, and a school with Spectra gates cannot be onboarded. | Five families, Spectra included (this spec assumes it). Correct `M16 §Business rules` — **documentation correction awaiting a ruling**. |
| OQ-M16-02 | **M16 has no entities in §6 at all** — no device, no connection, no outbox, no webhook endpoint, no ingestion log. | The module with the most operational state in the product is entity-less in the data model; without these tables GA-10/GA-11 cannot exist. | Add §3.1–3.6 to the entity catalog. |
| OQ-M16-03 | **Webhooks are `[P2]` in blueprint §15 ("Open REST API + webhooks") but MVP in `M16 §Acceptance`** ("a webhook fires on payroll approval") and in `§7 Webhooks`. | Sprint 11 either builds them or does not. | Dev spec wins: **tenant-registered webhooks are MVP**, a *public* open API programme (docs, keys, partner onboarding) is P2. Flagged. |
| OQ-M16-04 | **Razorpay / NEFT disbursement.** `CLAUDE.md` names Razorpay as a vendor family and the 22 July deck (slide 13) markets a "NEFT bank file"; `M16 §Business rules` names no bank integration, and `[[M10-payroll-core]]` produces a **bank file**, not an API payout. | An API payout is a materially different control surface: it moves money directly and would need its own maker-checker and idempotency story. | MVP = bank **file** only; `DisbursementPort` defined, no adapter. An API payout is a separate, later decision with its own gate. **Ruling needed.** |
| OQ-M16-05 | **Statutory portal "integration" is not an API.** `CLAUDE.md` names EPFO/ESIC/TRACES adapters; those portals have no supported machine interface, and automated submission would mean credential storage and screen automation. | Promising portal automation and delivering a file upload is the kind of gap discovered at go-live. | MVP generates **artefacts** for human upload (`[[M11-statutory-compliance]]`); no portal credentials are stored. Confirm this is the shared understanding. |
| OQ-M16-06 | **Tally export is `[P2]` in blueprint §15 but appears in `M16 §Business rules`** as if in scope, and GA-10 shows it "as unavailable rather than absent". | Sprint 11 scope again. | Port in MVP, adapter P2 (AC-M16-31). Flagged. |
| OQ-M16-07 | **How do devices on a school LAN reach a cloud tenant?** Most biometric devices push to a LAN address over plain HTTP and cannot present a bearer token. | The MVP acceptance criterion ("a biometric push creates attendance records") is unachievable for a large share of installed devices without an on-site agent. | Ship a small **on-site middleware agent** that holds the service token and forwards, or document pull-mode as the supported path for those families. **This is a delivery-blocking decision.** |
| OQ-M16-08 | **No `ServiceToken` entity exists** (`[[M0-foundations]]` OQ-M0-04 raised it first). | Ingestion has no credential model, and inventing one in Sprint 6 would not carry a tenant the same way RLS expects. | Define it in M0 alongside JWT, as that document recommends. |
| OQ-M16-09 | **Device-code reassignment.** Nothing in the spec anticipates a device user code being reused after a staff exit. | Without date-scoped mapping, a new joiner's punches credit a leaver, and the error is invisible until payroll. | `EmployeeDeviceMapping` with effective dates (§3.3). |
| OQ-M16-10 | **How long are raw vendor payloads retained?** Useful for support, but they contain identifiers. | Retention obligations (O2) apply to anything we store. | 30 days, PII-minimised, then discard; the `IngestionRecord` keeps the durable facts. |
| OQ-M16-11 | **Does an outage window change paid days retroactively?** GA-11 raises the window across attendance surfaces; the recompute path is `[[M9-attendance]]`'s, and if the month is closed it is `[[M10-payroll-core]]`'s arrears. | This is exactly the seam where a silent device becomes a wrong payslip that nobody re-opens. | The window marks days as "not received"; correction still flows through regularization and, for a closed month, arrears. Confirm with M9/M10 lanes. |
| OQ-M16-12 | **SIS/ERP connector: D4 locks "design the API from MVP" but nothing names that API's shape.** | Blueprint §14 calls the internal staff/attendance/timetable API a strategic dependency; if it is only designed at P2 the education features get retrofitted. | The GraphQL schema plus the ingest REST edge **are** that API; publish an integrator-facing subset in the OpenAPI from MVP. |

**Conflicts with built design:** none — GA-10 and GA-11 are unbuilt. GA-11 is itself a gap this project
found (screen-inventory G6) rather than a screen the spec listed.

---

*Written by tn-alfred, 2026-09-07. No application code was written.*
