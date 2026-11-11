# M9 — Attendance · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M9 Attendance (build-plan Sprint 6) · **Work item:** NA-21 · **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M9, §6.8, §4.2, §4.3, §7, §8, §9, §11, §12 ·
> `docs/functionality-blueprint.md` §2 and **PART C** (the authoritative in/out list) ·
> `docs/ui-compliance-requirements.md` **O15** (attendance capture — geo, selfie, biometric), **O1, O2, O6,
> O7, O11, O12, O17, O18** and the **§2.5 action guardrail register (A30–A32)** ·
> `docs/decisions-to-finalize.md` **D2** (period-wise attendance, timetable import and substitution deferred
> to Phase 2; half-day stays MVP) · `docs/executive-summary.md` · `docs/competitor-analysis.md` ·
> `docs/screen-inventory.md` EMP-02, EMP-03, EMP-04, DH-03, DH-04, PR-02, HR-29, HR-30, PY-08 ·
> built design `design/v3/pages/attendance.jsx`, `hr-leaveatt.jsx`, `depthead.jsx`, `principal.jsx`,
> `payroll.jsx` · captured benchmark `design/reference/keka/`.
>
> **Related specs:** [[M8-leave]] (the leave days this module stamps, and the LOP decision it folds in) ·
> [[M7-academic-calendar]] (holidays and vacation terms) · [[M3-core-hr-people]] (`is_vacation_staff`,
> date of joining, `reports_to`) · [[M16-integrations]] (biometric device adapters — the **only** place a
> vendor SDK may appear) · [[M13-ess-mobile]] (the phone-first capture surface and offline queue) ·
> [[M10-payroll-core]] (the consumer of paid days) · [[M10c-arrears-pay-revision]] (the route for a
> correction after the freeze) · [[M12-full-and-final]] (final-month attendance) ·
> [[M14-notifications]] · [[M15-reporting-platform]] (attendance register, device-outage view) ·
> [[M2-identity-access]] (`attendance.read`, `attendance.manage`, the ingest service token) ·
> [[M0-foundations]] (tenancy, audit, idempotency, service tokens).

---

## 1 · Intent

Attendance is where a school's day becomes a number, and the number becomes money. A teacher taps a
fingerprint at the gate at 07:52, a transport driver punches from his phone at a bus depot four kilometres
away, an ayah's device is offline all morning because the campus wifi is down — and at the end of the month
all of it has to reconcile into one auditable figure per person that payroll can be paid on. M9 owns that
figure. It captures from three sources (biometric device, mobile with geo and selfie, web), applies the
shift and grace rules nightly, raises the days that do not make sense as **exceptions** rather than
silently calling them absences, lets a manager decide the genuinely ambiguous ones through a request from
the employee, and produces **paid days** — the bridge to [[M10-payroll-core]].

Two things make this module unusually easy to get wrong, and both are safety properties rather than
features. The first is that **a wrong-looking number destroys trust in every other number**: if a biometric
device dies at 08:00 and half a campus shows as absent, the board that sees it stops believing the payroll
register too. So a device outage must read as an outage, never as a wall of absences. The second is that
**the capture is surveillance-adjacent**: a location and a facial image are personal data collected from a
person who cannot practically refuse, so O15 and O1 bind here harder than anywhere else in the product —
a punch collects the minimum, at the moment of the punch only, with a notice, and never becomes a live map
of where staff are.

---

## 2 · Scope & surfaces

### In scope (MVP)

| Area | What M9 delivers |
|---|---|
| **Biometric ingest** | `POST …/attendance/ingest` under a service token; device families ZKTeco / eSSL / Matrix / Realtime handled by **[[M16-integrations]] adapters** — no vendor SDK ever reaches domain code (`guard-vendor-isolation`); push and pull; idempotent replay |
| **Mobile capture** | Geo + selfie punch, phone-first, with an offline queue that survives poor signal and syncs on reconnect (§9 Mobile offline) |
| Web capture | `source=web` punch where the campus permits it — no geo, no selfie |
| Shifts & rosters | `Shift` (fixed / flexi / rotating, start/end, grace minutes, weekly-off pattern); assignment of staff to shifts, effective-dated; rotating rosters. Blueprint §2 tags shift & roster management **MVP** for hostel/transport/security/mess staff |
| Nightly reconciliation | Applies shift, grace, holiday ([[M7-academic-calendar]]), weekly-off and approved-leave ([[M8-leave]]) rules → `status` + `worked_hours`; idempotent and re-runnable |
| **Half-day granularity** | `status = half_day` and half-day leave from [[M8-leave]] fold into paid days at 0.5 (D2 keeps this MVP) |
| Exceptions | Missing punch · single punch · out-of-geofence · device gap · leave/attendance conflict · unassigned shift — surfaced, not absorbed |
| Regularization | Employee-raised `Regularization` with a required reason → manager decision → status corrected, paid days recomputed |
| **Paid-days reconciliation** | The per-employee-per-period computation, its exception gate, its **freeze** bound to a payroll run, and the arithmetic shown rather than asserted — the auditable bridge to [[M10-payroll-core]] |
| Device outage handling | An ingestion gap is a first-class, grouped fact that suppresses false absences and is bulk-resolvable with a reason |
| Attendance policies | Late-coming / early-going / grace / weekend-and-holiday rules, per campus (blueprint §2 **MVP**) |
| Multi-campus consolidation | Campus and group roll-ups (blueprint §2 "★ Multi-campus consolidated attendance **[MVP]**"), scoped per **O7** |

### Explicitly out of scope

| Out | Why / owned by |
|---|---|
| **Period-wise / subject-wise attendance** ("present for 4 of 6 periods") | **Phase 2, decision D2.** Granularity in MVP is the day and the half-day |
| **Timetable import** | **Phase 2, decision D2** |
| **Substitute/relief arrangement** (auto-detecting a vacated period and arranging cover) | **Phase 2, decision D2** — blueprint §6, the starred neighbour of this lane |
| Teaching-load / workload balancing | **Phase 2, decision D2** — blueprint §7 |
| Facial recognition; WhatsApp/Teams punch | Blueprint §2 tags these **P2** / **Later** |
| Auto shift allowances | Blueprint §2 **P2** |
| Overtime / extra-duty **rates and pay** | Contested — see **CF-M9-C**; the *capture* of extra duty may be MVP, the *pricing* is [[M10-payroll-core]]'s |
| Vendor SDKs, device polling, webhook signature verification | [[M16-integrations]] (martian) — M9 consumes a normalised port |
| Holidays and vacation terms | [[M7-academic-calendar]] |
| The leave decision and the LOP *cause* | [[M8-leave]] |
| Money — what a day is worth | [[M10-payroll-core]] |

> **D2 boundary marker.** MVP leaves named seams and no half-built machinery: `AttendanceRecord` carries no
> period, no subject and no timetable reference; the ingest port's normalised `PunchEvent` has a
> `device_zone` but no classroom; reconciliation emits `attendance.reconciled` so a Phase-2 substitution
> module can subscribe without M9 changing. Nothing in MVP is shaped *around* a period.

### API surfaces (§7)

- **REST edge (DRF):** `POST /api/v1/attendance/ingest` — **service-token authenticated**, not a user JWT;
  idempotency key required; batch payload of normalised punches. Selfie upload (file). Register exports.
- **GraphQL (strawberry-django):** `attendanceRecords`, `shifts`, `shiftAssignments`, `regularizations`,
  `paidDaysSnapshot` queries; mutations `attendancePunch`, `regularizationRequest`,
  `regularizationApprove`, `regularizationReject`, `attendanceCorrect`, `attendanceBulkCorrect`,
  `shiftCreate`, `shiftAssign`, `shiftRevise`, `reconciliationRun`, `paidDaysFreeze`, `paidDaysUnfreeze`.
- **Consumers:** [[M13-ess-mobile]] (EMP-02/03/04), the web console (DH-03/04, PR-02, HR-29/30, PY-08),
  [[M10-payroll-core]] (the frozen snapshot, read-only), [[M15-reporting-platform]].

### Screens

EMP-02 My attendance *(in progress)* · EMP-03 Mark attendance · EMP-04 Request regularization ·
DH-03 Department attendance · DH-04 Regularization approvals · PR-02 Campus attendance board ·
HR-29 Shifts & rosters · HR-30 Attendance exceptions · PY-08 Paid-days reconciliation.

The **captured Keka benchmark** in `design/reference/keka/` is the structural reference for EMP-02: the
three-card row, the log/calendar/requests tabs, the row-level `⋯` menu carrying *Regularize*, the `W-OFF`
and `PENALTY` pills, the thin-outline tortoise glyph beside an exact lateness, the amber `!` in LOG for an
incomplete punch. Naveya takes the structure and the state vocabulary, not the purple or the typography,
and **diverges deliberately** where Keka is wrong for us: our period pills follow the academic session back
to April, and Keka's unmasked identity numbers are a pattern we explicitly do not copy (`README.md`).

---

## 3 · Data model

Every table below is **tenant-owned**: NOT-NULL `tenant_id` FK, plus `ENABLE` + `FORCE ROW LEVEL SECURITY`
and a `USING`/`WITH CHECK` policy created **in the same migration as the model** ([[M0-foundations]],
`guard-rls-policy`). Policy content is wonder-woman's; the column and migration are oracle's.

### 3.1 `Shift` (§6.8)

`campus_id`, `name`, `start_time`, `end_time`, `type` (`fixed`/`flexi`/`rotating`), `grace_minutes`,
`weekly_off_pattern` (JSON — which weekdays, and whether Saturdays are half working days),
`effective_from`, `superseded_by`. Timings are **effective-dated** (§4.3, **O18**): the verb in the UI is
"Revise, effective from …", never "Edit", and a revision whose effective date falls inside a paid month is
refused.

### 3.2 `ShiftAssignment` — **new**

§6.8 gives `Shift` no employee link and §6.3 `Employee` has no `shift_id`, yet HR-29 assigns staff to
shifts with an effective date and reconciliation cannot run without knowing whose shift is whose. Fields:
`employee_id`, `shift_id`, `effective_from`, `effective_to`, `assigned_by`, `reason`. Assignment defaults
to **effective tomorrow**, never retroactive by default; a retroactive assignment warns that past statuses
would change and requires a reason.

### 3.3 `AttendanceRecord` (§6.8)

| Field | Type | Notes |
|---|---|---|
| `employee_id`, `date` | FK, date | **one row per employee per day** (§6.8: "One/day") |
| `shift_id` | FK | resolved from `ShiftAssignment` as at `date` |
| `first_in`, `last_out` | ts | server-authoritative times |
| `source` | enum `biometric/mobile/web` | provenance, rendered on every row (**O6**, **O15**) |
| `geo` | point, nullable | mobile only, **at the punch only** |
| `selfie_ref` | encrypted ref, nullable | mobile only; never returned to another employee (**O15**) |
| `status` | enum `present/absent/half_day/leave/holiday/weekly_off` | §6.8's set — **see OQ-M9-01: it has no value for "not in service" and none for a vacation day** |
| `worked_hours` | Decimal | |
| `is_late`, `late_by` | bool, interval | drives the tortoise-glyph treatment; derived from shift + grace |
| `computed_reason` | text/i18n key | *why* this status — the sentence EMP-02's day panel shows |
| `locked_by_run_id` | FK nullable | set at paid-days freeze |

### 3.4 `PunchEvent` — **new (the ingest staging row)**

A raw punch, normalised by an [[M16-integrations]] adapter and stored before it is reconciled into a day.
Fields: `employee_ref` (the device's identifier for the person), `employee_id` (resolved, nullable —
an unmatched card is an exception, not a discard), `punch_ts`, `direction` (`in`/`out`/`unknown` — many
devices do not say), `device_id`, `gate/zone`, `source`, `raw_hash`, `ingest_batch_id`, `received_at`.

Keeping raw punches is what makes a disputed day arguable (**O15**: "show provenance on every attendance
row … so a disputed day is arguable"). Reconciliation is a **pure function of punches → day**, so it can
be re-run without losing information — the single most important property in this module.

### 3.5 `Regularization` (§6.8)

`attendance_id`, `requested_status`, `requested_in`/`requested_out`, `reason` (**required**),
`reason_category`, `evidence_ref`, `approval_chain` (JSON), `status`
(`pending/approved/rejected/withdrawn`). `absent` is not an available `requested_status` — nobody requests
to be marked absent.

### 3.6 `AttendanceException` — **new**

The nightly job's output, so that "exception" is a queryable row rather than a UI filter recomputed on
every page load. Fields: `employee_id`, `date`, `kind` (`missing_punch` / `single_punch` /
`out_of_geofence` / `device_gap` / `leave_conflict` / `unassigned_shift` / `unmatched_device_id`),
`status` (`open/resolved/accepted_as_lop`), `resolved_by`, `resolution_reason`, `outage_window_id`.

### 3.7 `DeviceOutageWindow` — **new**

HR-30 groups a device outage rather than showing it per person, PR-02 must lead with the outage rather
than the absences, and DH-03 must show "awaiting device data" instead of a wall of absences. None of that
is possible without the outage being a record. Fields: `campus_id`, `device_id` (nullable — a campus-wide
gap), `from_ts`, `to_ts`, `raised_by`, `source` (`detected`/`declared`), `note`.

### 3.8 `PaidDaysSnapshot` + `PaidDaysLine` — **new, and the module's most load-bearing tables**

M9 §Business rules defines paid days as a formula, PY-08 renders it as a register, and M10 §Workflow makes
it the payroll run's first input — but no entity in §6 holds it. Without one, payroll either recomputes it
(two implementations of one rule) or reads it live (a figure that moves under a run).

`PaidDaysSnapshot`: `legal_entity_id`, `campus_id`, `period` (YYYY-MM), `status`
(`draft/reconciled/frozen`), `frozen_at`, `frozen_by`, `payroll_run_id`, `exception_count_at_freeze`.

`PaidDaysLine`: `snapshot_id`, `employee_id`, `present`, `paid_leave`, `holidays`, `weekly_offs`, `lop`,
`not_in_service`, `paid_days` — all `Decimal(4,1)` for half-day precision — plus `flags`
(`joiner`/`leaver`/`lop`/`changed_after_freeze`/`paid_by_units`).

**Append-only after freeze.** A frozen snapshot is never edited; a later correction produces a new
adjustment through [[M10c-arrears-pay-revision]] (**O6**, §4.2).

### 3.9 `ExtraDutyLog` — **conditional, pending CF-M9-C**

Only if extra duty is confirmed MVP. `employee_id`, `date`, `kind` (`exam_duty`/`extra_class`/
`hostel_warden`/`transport`), `units`, `unit_type`, `approved_by`. See §8 — this is also the most plausible
answer to screen-inventory **Q1** (where honorarium units come from now that period-level attendance is
deferred).

---

## 4 · Behaviour walk-through

### 4.1 Happy path — a day, end to end

1. **07:52** — a teacher taps the fingerprint reader at Gate 2. The device pushes to
   [[M16-integrations]]; the ZKTeco adapter normalises it into a `PunchEvent` and posts it to
   `POST /attendance/ingest` under a **service token**, with an idempotency key derived from
   `(device_id, employee_ref, punch_ts)`.
2. **16:31** — she taps out. A second `PunchEvent`.
3. **Overnight** — reconciliation runs per campus: resolves her `ShiftAssignment` as at that date, applies
   `start_time` + `grace_minutes`, computes `first_in`, `last_out`, `worked_hours`, sets `status=present`,
   `is_late=false`, and writes `computed_reason` so EMP-02's day panel can say *why*.
4. **Month end** — PY-08 runs paid-days reconciliation for the period. Her line reads
   `present 21 · paid_leave 1 · holidays 1 · weekly_offs 5 · lop 0 · not_in_service 0 · paid_days 28`, and
   the columns sum to her days in service.
5. The Payroll Operator resolves every blocking exception, then **freezes** the snapshot and binds it to
   the run. [[M10-payroll-core]] computes on the frozen figure and nothing else.

### 4.2 Capture — the three sources, and what each is allowed to collect (**O15**)

| Source | Collects | Never collects |
|---|---|---|
| **Biometric** | A timestamp, a device id, a gate/zone, the device's identifier for the person | No image leaves the device to us; no template is stored by Naveya |
| **Mobile** | A timestamp, a **geo point at the moment of the punch**, a **selfie** where the campus enables anti-proxy | Background location; location between punches; anything at all when the app is closed |
| **Web** | A timestamp and a source marker | Geo, selfie |

Binding rules, all from **O15** and **O1**:

- The **notice comes before the first capture** on a device — what is collected, why, who sees it, how long
  it is kept, in the language the user is reading — and a **persistent indicator** shows at each punch that
  a location and a photo are being recorded. Geo or selfie collected before the notice has been shown at
  least once on that device is a defect, not a configuration choice.
- The employee can see **their own** geo/selfie history and its retention window.
- **Provenance is on every row** — device, gate, source — because a day someone disputes must be arguable.
- **No live map of staff positions**, ever. A punch is a point in time, not a track.
- One employee's selfie or geo is never visible to another employee, and DH-03/PR-02 show a
  "verified by geo/selfie" mark rather than coordinates or an image.
- Retention of the selfie beyond the attendance-dispute window must be **stated** — and the window itself
  is an open policy question (OQ-M9-07, matching O15's own `[judgement]` marker).

**A punch is a fact and is irreversible** (A30). A wrong punch is corrected through a regularization
request (A31), never by editing the punch.

### 4.3 Ingest — vendor isolation and idempotency

- The vendor SDK for **every** device family lives only in `backend/integrations/adapters/`
  (`guard-vendor-isolation`). M9's domain code imports a port — `PunchEventPort` — and would compile with
  every adapter deleted. A ZKTeco payload shape must not be visible anywhere in M9.
- Ingest is **idempotent and visibly so** (**O17**): a device replaying a batch after a network failure —
  which they do routinely — creates no duplicate `PunchEvent` and moves no day. The idempotency key is
  derived from device, person-reference and punch timestamp, and **contains no PII** (**O11**).
- An **unmatched `employee_ref`** (a card issued but never mapped, or a person who left) is captured as an
  `unmatched_device_id` exception with the raw event retained — never silently dropped, because a silently
  dropped punch becomes an unexplained absence a month later.
- Ingest authenticates with a **service token**, not a user JWT, and the token carries the tenant
  ([[M0-foundations]] OQ-M0-04 flags that `ServiceToken` does not yet exist — M9 is its first consumer and
  it must land before Sprint 6).
- A device pushing a punch for an employee outside its campus is refused by scope, not accepted and
  reassigned.

### 4.4 Reconciliation — the nightly job

Inputs: `PunchEvent`s, the `ShiftAssignment` as at the date, the campus `HolidayCalendar`
([[M7-academic-calendar]]), the shift's weekly-off pattern, approved leave days from [[M8-leave]], and
`is_vacation_staff` + `Term.type` for the forced-vacation rule ([[M8-leave]] §4.1.5).

Precedence, stated explicitly because the order changes the answer:

1. **Not in service** — before date of joining or after last working day ([[M3-core-hr-people]]). Neither
   paid nor LOP.
2. **Holiday** (campus calendar) → `holiday`.
3. **Vacation term + vacation staff** → a paid non-working day. *Which `status` value carries this is
   unresolved — §6.8's enum has no `vacation` member (OQ-M9-01).*
4. **Weekly off** (shift pattern) → `weekly_off`.
5. **Approved leave** ([[M8-leave]]) → `leave`, carrying whether it is paid or LOP.
6. **Punches present** → `present` / `half_day` / `late` per shift and grace.
7. **Nothing at all** → an **exception**, not an absence, until a human or a rule resolves it.

Properties: **idempotent** (re-running a date range produces the same result and no duplicate exceptions),
**re-runnable** while the period is unfrozen, **refuses to run** over a frozen period, and always writes
`computed_reason` — an unexplained status is a support ticket waiting to happen.

Working on a holiday or weekly-off is allowed with a confirmation, and proposes a `CompOffCredit` in
[[M8-leave]] (§3.7 there) rather than silently becoming an extra present day.

### 4.5 Half-day, and the deferred period boundary

Half-day is MVP and is expressed two ways: a half-day **leave** from [[M8-leave]] (first-half or
second-half), and a half-day **attendance** status where a shift's rules make a short day a half day. Both
contribute 0.5 to paid days. Saturdays configured as half working days are counted as **present**, not as
a weekly-off (the built HR-30/PY-08 make this explicit) — otherwise a six-day school's paid days come out
systematically wrong.

**Period-level attendance is not modelled at all** (D2). Not a nullable column, not a flag, not a
"periods" JSON blob. A half-built period model is worse than none: it invites a resolver to read it and a
report to sum it while the timetable it depends on does not exist.

### 4.6 Exceptions and regularization

The employee raises the correction; the manager decides it. HR administers, and only HR may edit a record
directly.

- **EMP-04** — the employee selects a `requested_status`, gives a **required reason**, optionally attaches
  evidence, and submits. Withdrawable while pending.
- **DH-04** — the Dept Head sees the day, its computed status, the requested status, the reason, and the
  employee's recent pattern (the judgement context), and approves or rejects **with a reason**. Approval
  updates the record and **recomputes paid days for the month**.
- **HR-30** — HR with `attendance.manage` may correct a record directly with a required reason
  (A32/Q9: whether this needs a second pair of eyes is open — OQ-M9-04), and may **bulk-resolve a device
  outage** with a **preview that lists everyone affected** so genuinely absent people can be excluded
  before the correction commits.
- **DH-03** — a manager may *flag* a day for the employee to regularize, but **does not create the
  correction**: preserving request → approve is what makes the trail meaningful.
- Every one of these is refused over a **frozen month** and routed to arrears (A31/A32 notes; §4.2).

### 4.7 Device outage — the trust property

A dead device must never present as a wall of absences.

- A gap is **detected** (no events from a device that normally reports) or **declared** by HR/Group Admin,
  and becomes a `DeviceOutageWindow`.
- Affected days show **"awaiting device sync"**, never `absent`, on EMP-02, DH-03 and PR-02.
- HR-30 groups the outage as one item, not one row per person.
- PR-02 **leads with the outage** above the absence numbers.
- Bulk resolution applies `present`/`as-rostered` for the window with a required reason, references the
  ingestion incident, and audits every affected row individually (**O6**).

### 4.8 Paid-days reconciliation — the auditable bridge (the heart of this module)

**The formula** (M9 §Business rules): `paid_days = present + paid_leave + holidays + weekly_offs − LOP`.

**The invariants**, which the register must satisfy row by row and which the design already asserts in the
rendered DOM:

1. `present + paid_leave + holidays + weekly_offs + lop = days_in_service_in_period`
2. `paid_days = days_in_service_in_period − lop`

`days_in_service` respects date of joining and last working day, so a mid-month joiner's earlier days are
`not_in_service` — **neither paid nor LOP**. This is exactly M9 §Acceptance's "paid-days compute correctly
for a mid-month joiner", and §6.8's `status` enum currently cannot express it (OQ-M9-01).

**Ownership** — the contract that stops an ambiguity becoming a wrong salary:

| Concern | Owner | Rule |
|---|---|---|
| Whether a leave day is unpaid | [[M8-leave]] | The LOP *cause* for leave |
| Whether an unexplained day is unpaid | **M9** | An absence with no leave and no approved regularization |
| **The paid-days figure** | **M9 — single writer** | Computed by reconciliation from attendance + leave + calendar + shift. Nobody else computes it |
| The money | [[M10-payroll-core]] | Reads the frozen snapshot; **never recomputes**; **refuses to compute** where no frozen snapshot exists for the period |
| A change after the freeze | [[M10c-arrears-pay-revision]] | An arrear adjustment, never a rewrite |

**The freeze** is the gate. PY-08 freezes only when blocking exceptions are zero; the snapshot binds to the
run; attendance recorded afterwards is flagged `changed_after_freeze` and does not move the figure by
itself. Unfreeze is possible only while the run is `draft`. "Accept as LOP" — the act of deciding that an
unexplained absence really is unpaid — is available before the freeze and **disabled with the reason
afterwards**, because cutting someone's pay after the freeze is an arrears decision taken on the run.

**No money appears on PY-08.** Days are decided there; what a day is worth is decided on the run. This is
not a UI preference: it keeps the paid-days decision separable from the pay decision in the audit trail,
and it keeps salary off a screen HR and department heads legitimately need to see (**O3**, **O7**).

**Guest / visiting faculty paid per lecture** are flagged `paid_by_units` and carry no meaningful
paid-days figure — days do not price them, units do, on the run ([[M10-payroll-core]]'s `HonorariumRule`).
The register must say so rather than showing a misleading zero.

### 4.9 States and error paths

| Situation | Behaviour |
|---|---|
| Punch outside the geo-fence | **Blocked by default**, with the distance shown and a route to regularization — but the enforcement mode is genuinely unspecified in the spec (screen-inventory **Q3**, OQ-M9-03) |
| Location or camera permission denied | Explain what is needed and offer the web/desk alternative; never fail silently |
| Already punched in | Show the recorded time; no second write (idempotent) |
| Punch on a holiday or weekly-off | Allowed with a confirm; becomes comp-off evidence ([[M8-leave]]) |
| Employee on approved leave punches in | Allowed, flagged as a `leave_conflict` exception for HR; the leave is **not** silently overwritten |
| Device clock skew | The **server** timestamp is authoritative; show both if they differ |
| Two devices punch simultaneously | Idempotency key; one record |
| Offline punch | Queued locally with the device timestamp and shown **explicitly as queued**; syncs on reconnect; on conflict the **server record wins**, the user is told, and regularization is offered |
| Correction requested for a day before joining | Refused |
| Month frozen | Everything read-only with the run reference and an arrears route |
| Employee transferred mid-month between campuses | Two shift contexts in one month — inter-branch transfer is P2, but the *display* problem exists in MVP |
| Staff shared across departments | `Employee.department_id` is single-valued, so a teacher teaching across departments has one owner (screen-inventory flag, unresolved) |

### 4.10 Concurrency

- **Ingest** is idempotent by construction and safe under replay and concurrent batches from several
  devices (**O17**).
- **Reconciliation** takes a per-campus-per-date advisory lock; a second run queues rather than
  interleaving, and re-running produces identical output and no duplicate exceptions.
- **Freeze** is a serialised transition: it re-counts blocking exceptions inside the transaction, so a
  regularization approved microseconds earlier cannot slip past the gate.
- **Regularization approval racing the freeze**: whichever commits first wins; if the freeze wins, the
  approval is refused with the run reference and routed to arrears.
- **Two managers deciding the same regularization**: the second sees the first's decision, not an error.
- **The offline queue** is idempotent per device punch, so a sync retried three times on a flaky bus-depot
  connection produces one record.

### 4.11 i18n and accessibility

- Full **Hindi + English** parity (`guard-i18n-strings`, **O12**), including every refusal reason, every
  `computed_reason` sentence, the geo/selfie notice and its retention line — a consent notice is precisely
  the kind of thing **O12** forbids shipping half-translated, and Devanagari needs ~25% more line height in
  those blocks.
- Weekday and month short forms are translator-authored, never sliced from the full word.
- Status is **word + glyph**, never colour alone: the tortoise-and-lateness treatment works because the
  exact duration is printed beside it. The Keka benchmark's expressive glyphs are adopted as thin-outline
  drawings of our own — never emoji, never colour-only.
- The month register is a real table with row and column headers; the totals reconcile in the rendered
  DOM, not only in the API payload.
- The offline-queued state is announced, not merely styled — a teacher on a weak connection must know her
  punch has not reached the server.
- Times render in a 12/24-hour toggle, dates in Indian format, the period frame is the **academic session**
  (April onward), not a rolling calendar year.

### 4.12 Privacy and logging

Geo and selfie are personal data (**O1**, **O15**). Selfies are encrypted at rest under the per-tenant key
namespace, served only by short-lived signed URL, access-logged, and never returned to a peer. Coordinates
are never rendered to a manager — a "geo-verified" mark is sufficient and is all DH-03/PR-02 may show. No
attendance PII goes into logs, telemetry, crash reports, URLs, page titles or client caches beyond what the
offline queue genuinely needs (**O11**). Exports are scope-stamped ("*this export contains 118 staff from
Indiranagar campus — the scope you hold*", **O7**) and audited.

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M9-AC-01 | Every M9 table carries a NOT-NULL `tenant_id` FK **and** `ENABLE`+`FORCE ROW LEVEL SECURITY` **and** a `USING`/`WITH CHECK` policy, all in the **same migration** as the model. | §3, `guard-rls-policy`, [[M0-foundations]] |
| M9-AC-02 | Tenant A's context reads zero of tenant B's attendance, punch, shift, exception and paid-days rows over both the ORM and raw SQL, and cannot insert one. **Ingest under tenant A's service token cannot write a row for tenant B**, even when the device payload names a foreign employee. | §8, §11, **O7** |
| M9-AC-03 | Attendance surfaces state the scope the user holds and apply it to lists, filters, pickers, exports, counts and dashboards; an out-of-scope record **does not exist in the response** and a deep link 404s rather than 403-ing with a name. | **O7**, M9 §Permissions |
| M9-AC-04 | **A biometric push creates attendance records** through an [[M16-integrations]] adapter; **no vendor SDK symbol appears anywhere outside `backend/integrations/adapters/`**, and M9's domain code imports only the normalised port. | **M16 §Acceptance**, `guard-vendor-isolation`, M9 §Business rules |
| M9-AC-05 | Ingest is **idempotent**: replaying an identical batch creates no duplicate `PunchEvent` and changes no day. The idempotency key contains no PII. Retries after a network failure are visibly safe. | §7 Concurrency, **O17**, **O11** |
| M9-AC-06 | Ingest authenticates with a **service token** carrying the tenant, never a user JWT, and a punch for an employee outside the device's campus is refused by scope. | M9 §Permissions, [[M0-foundations]] |
| M9-AC-07 | An **unmatched device identifier** is retained as an `unmatched_device_id` exception with the raw event; no punch is ever silently discarded. | M9 §Business rules, §4.2 |
| M9-AC-08 | **A full day's punches reconcile to `present`**; shift start, `grace_minutes` and the weekly-off pattern come from the `Shift` as at that date, never from constants. | **M9 §Acceptance**, §6.8, `guard-hardcoded-values` |
| M9-AC-09 | **A missing punch raises an exception a manager can regularize** — it is never posted as `absent` without passing through the exception queue. | **M9 §Acceptance** |
| M9-AC-10 | Reconciliation is **idempotent and re-runnable** over an unfrozen period, produces no duplicate exceptions, **refuses to run** over a frozen period, and writes a `computed_reason` on every day. | M9 §Workflow, §4.2 |
| M9-AC-11 | The reconciliation precedence — not-in-service → holiday → vacation-term → weekly-off → approved leave → punches → exception — is applied in that order and is covered by a test per branch. | M9 §Business rules, [[M7-academic-calendar]], [[M8-leave]] |
| M9-AC-12 | **Mobile capture collects geo and a selfie at the punch only.** No background location, no location between punches, no capture at all before the notice has been shown once on the device. | **O15**, **O1**, blueprint §2 |
| M9-AC-13 | The capture surface shows an itemised **notice before the first capture** (what, why, who sees it, retention, how to withdraw) in the language being read, plus a **persistent indicator at each punch**; the employee can view **their own** geo/selfie history and its retention window. | **O1**, **O15**, **O2** |
| M9-AC-14 | **No live map of staff positions exists anywhere in the product**, and one employee's selfie or geo is never visible to another employee. Managers see a "geo-verified" mark — never coordinates, never an image. | **O15**, §8 PII classification |
| M9-AC-15 | Selfies are encrypted at rest in the per-tenant key namespace and served only via short-lived signed URLs; a signed URL cannot be minted for tenant A's selfie from tenant B's context; every access is logged. | §8, [[M0-foundations]] |
| M9-AC-16 | **Provenance appears on every attendance row** — source, device family, gate — so a disputed day is arguable; a correction renders as a supersession with both values, the reason and the person, never as a silently changed number. | **O15**, **O6** |
| M9-AC-17 | **A punch is irreversible.** There is no edit-a-punch path for the employee; corrections go through a regularization **request with a reason**, visible to the employee — never a silent HR overwrite. | **A30**, **A31**, **O15** |
| M9-AC-18 | Offline capture queues locally with the device timestamp, is shown **explicitly as queued**, syncs on reconnect, and is idempotent across repeated syncs. On conflict the **server record wins**, the user is told, and regularization is offered. The **server timestamp is authoritative** where the device clock differs. | §9 Mobile offline, M13 §Business rules |
| M9-AC-19 | **Half-day granularity is supported** end to end — status, leave interaction and paid-days at 0.5 precision — and Saturdays configured as half working days count as **present**, not weekly-off. | M9 §Business rules, **D2**, §6.8 |
| M9-AC-20 | **No period, subject or timetable reference exists** in the M9 model, schema, API or UI; reconciliation emits `attendance.reconciled` for a future Phase-2 subscriber. | **D2** |
| M9-AC-21 | `Shift` timings are **effective-dated**: the UI verb is "Revise, effective from …", superseded rows stay visible, past records are untouched, and a revision whose effective date falls inside a paid month is **refused** with the run reference. | §4.3, **O18**, HR-29 |
| M9-AC-22 | Shift assignment defaults to **effective tomorrow**, is never retroactive by default, and a retroactive assignment warns that past statuses would change and requires a reason. | HR-29, §4.3 |
| M9-AC-23 | A regularization carries a **required reason**, is decided by a manager (not the requester — self-approval refused server-side), and on approval **recomputes paid days for the month**. | **M9 §Acceptance**, **A31**, §8 |
| M9-AC-24 | HR's direct correction (`attendance.manage`) requires a reason and writes before/after to the audit; a **bulk** correction shows a **preview listing every affected person** so genuine absences can be excluded, and audits each affected row individually. | **A32**, §4.2, HR-30 |
| M9-AC-25 | A manager may **flag** a day for regularization but **cannot create the correction**; `attendance.manage` is absent from the Dept Head role and an API attempt returns 403. | DH-03, M9 §Permissions |
| M9-AC-26 | Any regularization, correction or bulk correction targeting a **frozen** period is refused with the run reference and routed to [[M10c-arrears-pay-revision]] — never silently applied. | §2.5 note, M10 §Arrears |
| M9-AC-27 | **A device outage reads as an outage, not as absences:** affected days show "awaiting device sync" on the employee, department and campus surfaces; HR-30 groups the window as one item; PR-02 leads with the outage above the absence figures. | **M16 §Acceptance**, PR-02, DH-03 |
| M9-AC-28 | **Paid-days arithmetic holds row by row:** `present + paid_leave + holidays + weekly_offs + lop = days_in_service`, and `paid_days = days_in_service − lop`. A row that does not reconcile **blocks the freeze** and says so. | **M9 §Business rules**, PY-08 |
| M9-AC-29 | **Paid-days compute correctly for a mid-month joiner and a mid-month leaver:** days outside service are `not_in_service` — neither paid nor LOP — and are flagged on the register. | **M9 §Acceptance** |
| M9-AC-30 | **M9 is the single writer of paid days.** [[M10-payroll-core]] reads the frozen snapshot, never recomputes it, and **refuses to compute** where no frozen snapshot exists for the period. | M9 §Business rules, M10 §Workflow |
| M9-AC-31 | **The freeze is a real gate:** it succeeds only with zero blocking exceptions, re-counts them inside the transaction, binds the snapshot to the run, and marks later attendance changes `changed_after_freeze` without moving the figure. Unfreeze is possible only while the run is `draft`. | PY-08, **O17** |
| M9-AC-32 | A frozen `PaidDaysSnapshot` is **append-only**; a post-freeze correction produces an arrear adjustment and never mutates a paid month. | §4.2, **O6**, M10 §Arrears |
| M9-AC-33 | **No rupee figure appears on the paid-days reconciliation surface**; days are decided there and priced on the run. | PY-08, **O3**, **O7** |
| M9-AC-34 | Guest/visiting faculty paid per lecture are flagged `paid_by_units` and the register **states that days do not price them**, rather than showing a misleading zero. | §6.9 `HonorariumRule`, PY-08 |
| M9-AC-35 | An employee on approved leave who punches in is recorded and flagged as a `leave_conflict` exception; the leave is **not** silently overwritten. | M9 §Business rules, [[M8-leave]] |
| M9-AC-36 | Working a holiday or weekly-off is permitted with a confirmation and proposes a comp-off credit in [[M8-leave]] rather than silently adding a present day. | M8 §Business rules ("comp-off for holiday work") |
| M9-AC-37 | **Forced vacation:** inside a `vacation` term a vacation-staff employee's day is a paid non-working day producing no absence and no LOP, while a non-vacation-staff employee's day is an ordinary working day. | blueprint §3, [[M7-academic-calendar]], [[M8-leave]] §4.1.5 |
| M9-AC-38 | Every consequential act — punch, regularization decision, correction, bulk correction, shift revision, reconciliation run, freeze, unfreeze — writes an audit row with actor, before/after and reason, and the attribution is **readable in the UI where the decision is read**. | §4.2, **O6** |
| M9-AC-39 | All M9 user-facing copy — including every `computed_reason`, refusal, the capture notice and the retention line — exists in **Hindi and English** with no English fallback. | `guard-i18n-strings`, **O12** |
| M9-AC-40 | Status is conveyed by **word + glyph**, never colour alone; lateness prints the exact duration beside its glyph; the month register's totals reconcile in the rendered DOM. | **O12**, `design/reference/keka/README.md`, WCAG AA |
| M9-AC-41 | No attendance PII — geo, selfie reference, device identifier tied to a name — reaches logs, telemetry, crash reports, URLs or page titles; notification bodies carry no location. | `guard-pii-logging`, **O11** |
| M9-AC-42 | GraphQL resolvers over records, exceptions and paid-days lines run under `DjangoOptimizerExtension`/dataloaders; a campus month grid for 2,000 staff issues a bounded number of queries and uses the `(tenant_id, employee_id, date)` index. | §7, `guard-missing-dataloader`, §9 Performance |
| M9-AC-43 | Attendance exports are scope-stamped, audited, and queued with a notice for large ranges. | **O7**, §8 |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | The reconciliation function as a **pure mapping** of (punches, shift, calendar, leave, service dates) → day, table-driven across: full day, single punch, no punch, late within grace, late beyond grace, half-day, holiday, weekly-off, vacation-term × {vacation, non-vacation} staff, pre-joining, post-exit, leave-conflict. Paid-days arithmetic incl. both invariants, for a full-month employee, a mid-month joiner, a mid-month leaver, a joiner-and-leaver in one month, and a `paid_by_units` guest. Shift/grace boundary arithmetic at the exact minute. Idempotency-key derivation (stable, PII-free). Offline-queue conflict resolution. Decimal half-day precision and refusal of `float`. **No DB where the behaviour is not persistence** |
| Integration | **bane** | Ingest → `PunchEvent` → reconciliation → `AttendanceRecord`, through a **fake adapter** (never a real device SDK). Replayed batch creating no duplicate. Unmatched device id becoming an exception. Regularization approval recomputing paid days. Correction over a frozen period refused with the run reference. Device-outage window suppressing false absences across all three surfaces. Freeze refusing with open exceptions and succeeding at zero |
| RLS / isolation | **bane** | The isolation matrix across all M9 tables × {select, insert, update, delete} × {ORM, raw SQL}; **ingest under tenant A's service token writing a tenant B employee is rejected at the policy**; a signed selfie URL cannot be minted cross-tenant; zero-context queries return nothing |
| Permissions | **bane** | `attendance.read` self/manager; `attendance.manage` HR-only — a Dept Head correction attempt 403s; requester cannot approve their own regularization; scope holds on exports and counts (**O7**) |
| Concurrency | **bane** | Concurrent ingest batches; two reconciliation runs on one campus-date; regularization approval racing the freeze; the offline queue synced three times producing one record |
| **Payroll-correctness / golden file** | **bane** + **riddler** | The paid-days register for a seeded campus month diffs byte-for-byte against a committed golden file; any drift fails the gate and must be an intentional, reviewed change to the golden. This is the regression guard that stops a reconciliation tweak silently changing everybody's pay |
| E2E / workflow | **bane** | Punch (mobile, geo+selfie) → missing-punch exception → regularization → approval → paid days → freeze → [[M10-payroll-core]] computes on the frozen figure; then a post-freeze correction that produces an arrear rather than a rewrite |
| Compliance review | **gordon** | **O15** in full: notice-before-capture, no background location, no live map, no peer visibility, retention stated; **O1/O2** consent and retention on geo/selfie; **O11** absence of PII in logs; **O6** audit completeness and visible attribution |
| UI / a11y | **two-face** | Hindi + English parity including the capture notice and every `computed_reason`; greyscale-distinguishable statuses; word-plus-glyph lateness; the outage state reading as an outage; the register totals reconciling in the DOM |
| Performance smoke | **bane** | A 2,000-staff campus month grid and a full-entity paid-days reconciliation within §9's targets, on the intended index |

Assertions reference the source of truth — shift fixtures, calendar fixtures, factories, i18n keys, the
golden register — never a re-typed literal (`CLAUDE.md` Testing standards).

---

## 7 · Proposed stories

Sprint 6 unless noted. Owners per `docs/development-specification.md` module ownership.

| # | Title | Intent | Owner | Pts | Depends on | Sprint |
|---|---|---|---|---|---|---|
| M9-S01 | `Shift` + `ShiftAssignment` models + RLS migration | Effective-dated shifts and the assignment link the spec is missing but reconciliation cannot run without. | oracle | 5 | M0-S05, M1 campus | 6 |
| M9-S02 | `PunchEvent` staging model + RLS migration | Raw punches kept, so reconciliation is a re-runnable pure function and a disputed day is arguable. | oracle | 3 | M0-S05 | 6 |
| M9-S03 | `AttendanceRecord` + `Regularization` + RLS migration | The one-row-per-day record with provenance and a `computed_reason`. **Needed by [[M8-leave]] in Sprint 5 — see the dependency note.** | oracle | 5 | M9-S02 | **5** |
| M9-S04 | `AttendanceException` + `DeviceOutageWindow` + RLS migration | Exceptions and outages as records, not as UI filters. | oracle | 3 | M9-S03 | 6 |
| M9-S05 | `PaidDaysSnapshot` + `PaidDaysLine` + RLS migration | The bridge entity §6 does not have and payroll cannot work without. | oracle | 5 | M9-S03 | 6 |
| M9-S06 | **Reconciliation engine** — precedence, shift/grace, statuses, `computed_reason` | The pure function everything else in the module is a view over. | riddler | 8 | M9-S03, M7, M8-S11 | 6 |
| M9-S07 | RLS policy content for all M9 tables incl. the **ingest service-token predicate** | Self/manager/campus scope, and a device that cannot write across a tenant or campus. | wonder-woman | 5 | M9-S01..S05 | 6 |
| M9-S08 | **Ingest endpoint + `PunchEventPort`** (REST edge, service token, idempotent) | The vendor-agnostic front door; adapters plug in behind it. | cyborg | 8 | M9-S02, M0 ServiceToken | 6 |
| M9-S08a | **Biometric adapters (ZKTeco / eSSL / Matrix / Realtime) behind the port** | Vendor code confined to `backend/integrations/adapters/`, with a fake adapter for tests. | martian | 8 | M9-S08 | 6 |
| M9-S09 | **Paid-days reconciliation + freeze/unfreeze** | The auditable bridge, the invariants, and the gate payroll depends on. | riddler | 8 | M9-S06, M9-S05 | 6 |
| M9-S10 | Regularization request/approve/reject/withdraw API | Employee requests, manager decides, paid days recompute. | cyborg | 5 | M9-S03 | 6 |
| M9-S11 | HR direct + bulk correction with preview and required reason | HR administers; the preview is what stops a bulk correction paying the genuinely absent. | cyborg | 5 | M9-S10, M9-S04 | 6 |
| M9-S12 | Device-outage detection, declaration and suppression of false absences | The trust property: an outage reads as an outage everywhere. | cyborg | 5 | M9-S04, M9-S08a | 6 |
| M9-S13 | Attendance query API (records, exceptions, snapshot) with dataloaders | The read surface every screen in the module sits on, N+1-resistant from the first resolver. | cyborg | 5 | M9-S06 | 6 |
| M9-S14 | **Mobile capture: geo + selfie + notice + offline queue** ([[M13-ess-mobile]]) | The phone-first surface, O15-compliant, that survives a weak signal. | nightwing | 8 | M9-S08 | 6 |
| M9-S15 | EMP-02 My attendance + EMP-04 regularization (mobile) | The register with provenance, the day panel that says *why*, and the correction request. | nightwing | 8 | M9-S13, M9-S10 | 6 |
| M9-S16 | EMP-02 web parity (Keka-benchmark structure, academic-session pills) | The web register with the tabs, row menu, state pills and lateness treatment. | green-lantern | 5 | M9-S13 | 6 |
| M9-S17 | HR-29 Shifts & rosters (web) | Where shift, grace and weekly-off patterns are configured — build before the screens that consume them. | green-lantern | 5 | M9-S01 | 6 |
| M9-S18 | HR-30 Attendance exceptions (web) | Exception queue, outage grouping, bulk resolution with preview. | green-lantern | 8 | M9-S11, M9-S12 | 6 |
| M9-S19 | DH-03 Department attendance + DH-04 Regularization approvals (web) | The manager pair, built together so they do not duplicate. | green-lantern | 8 | M9-S10 | 6 |
| M9-S20 | PR-02 Campus attendance board (web) | Campus roll-up that leads with the outage, not the absences. | green-lantern | 5 | M9-S12 | 6 |
| M9-S21 | **PY-08 Paid-days reconciliation (web)** | The arithmetic shown not asserted, the exception gate, the freeze — and no money on the screen. | green-lantern | 8 | M9-S09 | 6 |
| M9-S22 | Attendance notifications ([[M14-notifications]] events) | Regularization decisions, outage alerts, freeze-imminent warnings. | cyborg | 3 | M9-S10 | 7 |
| M9-S23 | Attendance & paid-days exports, scope-stamped and audited | The inspection artefacts, with the scope printed on them. | cyborg | 3 | M9-S13 | 7 |
| M9-S24 | Unit suite for reconciliation + paid-days arithmetic | Highest test density; every precedence branch and every service-boundary case. | deathstroke | 8 | M9-S06, M9-S09 | 6 |
| M9-S25 | Integration + RLS + concurrency suite incl. the fake adapter | Isolation matrix, ingest idempotency, freeze races, cross-tenant ingest refusal. | bane | 8 | M9-S09 | 6 |
| M9-S26 | **Golden-file paid-days regression** | A seeded campus month whose register diffs byte-for-byte; drift must be an intentional change. | bane | 5 | M9-S25 | 6 |
| M9-S27 | E2E: punch → exception → regularize → paid days → freeze → payroll | The workflow that proves the bridge holds. | bane | 5 | M9-S26 | 7 |
| M9-S28 | Compliance review of M9 (O15-focused) | Notice, no background location, no live map, no peer visibility, retention, audit. | gordon | 5 | M9-S15 | 7 |
| M9-S29 | UI/a11y audit of the M9 surfaces | Hindi/English parity incl. the capture notice; greyscale statuses; outage legibility. | two-face | 3 | M9-S21 | 7 |

**Total: 30 stories, 168 points.**

**Dependency edges that constrain sprint order:**

1. **M9-S03 must land in Sprint 5, not Sprint 6.** [[M8-leave]]'s approval side-effect (M8-S11) stamps
   `AttendanceRecord.status = leave` at final approval, so the record model is required a sprint before M9
   nominally starts. Either M9-S03 moves forward or M8-S11 slips — it cannot be scheduled as the build plan
   currently reads. **This is the single most important scheduling finding in this lane.**
2. **[[M0-foundations]]'s `ServiceToken` must exist before M9-S08.** It is currently only an open question
   (OQ-M0-04) with no owner. Ingest cannot authenticate without it.
3. **M7 must precede M9-S06** — the holiday calendar and vacation terms are reconciliation inputs.
4. **[[M3-core-hr-people]] must supply date-of-joining, last-working-day and `is_vacation_staff`** before
   M9-S06, or `not_in_service` and the forced-vacation branch cannot be computed.
5. **M9-S09 blocks [[M10-payroll-core]]'s entire Sprint 7.** M10 §Workflow's first step is
   `Eng->>Att: Paid-days per employee`; without the frozen snapshot the payroll run has no input.
6. **M9-S08a (adapters) is martian's and sits in [[M16-integrations]]'s territory but is needed in Sprint 6**,
   four sprints before the build plan's integrations milestone (Sprint 11). Either the biometric adapters
   are pulled forward or Sprint 6 ships with the fake adapter only and real devices arrive later —
   **a decision BATMAN should take explicitly rather than discover.**
7. M9-S26's golden file must exist before any later change to the reconciliation engine.

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M9-01 | **`AttendanceRecord.status` cannot express two states the product requires.** §6.8 enumerates `present/absent/half_day/leave/holiday/weekly_off`. There is no value for **"not in service"** (before joining, after exit) and none for a **vacation day** for vacation staff. The built PY-08 already renders a sixth code, `N — Not in service`. | Without `not_in_service`, a mid-month joiner's pre-joining days must be either paid, LOP, or missing — all three are wrong, and M9 §Acceptance explicitly requires mid-month joiners to be correct. Without a vacation value, the differentiating case is stored as a lie. | Extend the enum with `not_in_service` and `vacation`. Cheap now; a data migration over millions of rows later. **Needs an oracle/BATMAN data-model ruling.** |
| OQ-M9-02 | **There is no paid-days entity in §6 at all**, yet M10 §Workflow's first step consumes it and PY-08 renders and freezes it. | If it is not a table, payroll either recomputes the rule (two implementations, guaranteed to diverge) or reads live attendance (a figure that moves under a run). Both are wrong-salary generators. | Adopt `PaidDaysSnapshot` / `PaidDaysLine` (§3.8) and add them to §6.8. **Blocking for Sprint 7.** |
| OQ-M9-03 | **Is an out-of-geo-fence punch blocked or flagged?** (Screen-inventory **Q3**.) Geo-fencing is MVP; the enforcement mode is unstated. | Blocking strands a teacher on a legitimate field trip; flagging makes the fence advisory and the anti-proxy claim hollow. The two produce different products. | Per-campus configuration (`geofence_mode`: `block` / `flag`), defaulting to **flag with an exception raised** — a punch that happened is evidence, and blocking it destroys the record. The built EMP-03 currently proposes `block`. **Needs a product ruling; the design and this recommendation differ.** |
| OQ-M9-04 | **Does HR's direct attendance edit need a second pair of eyes?** (Screen-inventory **Q9**; guardrail **A32** marks it `[judgement]`.) It changes paid days — and therefore pay — with no manager involved. | It is the widest unreviewed money-moving power in the product, and a bulk version of it can move a whole campus's pay. | Single edits: audited, no gate. **Bulk** corrections: preview + typed count + a second approver, because A32 already demands the ritual and the blast radius is the argument. §8's maker-checker list should be amended or explicitly declared exhaustive. **Needs a ruling.** |
| OQ-M9-05 | **Regularization has no escalation path** when the approver is absent or the post is vacant (screen-inventory **Q10**). M8 §Workflow escalates leave *by policy*; M9 has no escalation clause at all. | A regularization stuck behind an absent manager becomes an LOP day at the freeze — the employee loses pay because of somebody else's leave. | Reuse [[M8-leave]]'s manual reassignment (HR-30 "push to the manager" plus a reassign control), audited; and **make an unresolved regularization a blocking exception at the freeze** so it cannot silently become LOP. |
| OQ-M9-06 | **Is there a correction window?** EMP-02/EMP-04 both reference one as `[proposed]`; the spec sets none. | Without a window, a teacher can dispute a day from eighteen months ago against a filed statutory return. With too short a window, a genuine device failure discovered at month end is uncorrectable. | A per-tenant window defaulting to **the end of the following month**, plus the absolute rule that a frozen month is closed to correction and open only to arrears. |
| OQ-M9-07 | **How long are geo points and selfies retained?** **O15** flags this itself; §8 requires retention windows; nothing states a number. | A selfie of every member of staff, twice a day, held indefinitely is a DPDP liability with no operational purpose once the day is undisputed. | Retain until the correction window closes plus a short dispute buffer (proposal: 90 days), then delete the image and keep the *fact* that it was geo/selfie-verified. **Needs a legal/product ruling; gordon should own the recommendation.** |
| OQ-M9-08 | **Where do honorarium `units` come from?** (Screen-inventory **Q1**.) Period-level attendance is D2-deferred, so nothing counts lectures — yet the per-lecture honorarium engine is MVP and is differentiator 3. | A payroll module that cannot obtain its own inputs is not shippable. This is currently the largest unowned gap adjacent to this lane. | **M9 is the natural source**: an `ExtraDutyLog` (§3.9) of approved units — lectures, exam duty, extra classes, hostel-warden hours — captured on the attendance surface (the built EMP-02 already ships the empty tab for it) and read by [[M10-payroll-core]]. This is *not* period-level attendance: it is a counted, approved duty log, not a timetable. **Needs a ruling on whether M9 owns it.** |
| OQ-M9-09 | **Are biometric adapters pulled into Sprint 6?** The build plan puts integrations in Sprint 11, but attendance ingest is Sprint 6 and "a biometric push creates attendance records" is M16's acceptance criterion. | Sprint 6 either ships with no real device support (and the demo is mobile-only), or martian's work moves five sprints earlier. | Pull the adapters for **one** device family into Sprint 6 behind the port; the remaining families follow in Sprint 11. Ship the fake adapter for tests from day one. |
| OQ-M9-10 | **What is the shift default when none is assigned?** HR-29's states include "no shifts (default shift assumed — must be explicit)" and "unassigned staff (they will reconcile against nothing)". | Every unassigned employee's day is otherwise undefined, which at scale means an entire category of staff silently produces exceptions or absences. | A per-campus **default shift**, explicitly created at campus setup, plus an `unassigned_shift` exception so the gap is visible rather than assumed. |
| OQ-M9-11 | **Can an employee belong to two campuses in a month** (transfer), and which campus's shift, calendar and scope apply? | Inter-branch transfer is P2, but a campus change inside MVP still produces two shift contexts in one month and a paid-days line that spans two scopes. | Attribute each day to the campus in force on that date; the paid-days snapshot is per legal entity, so a transfer within an entity reconciles. **Confirm that transfers within a legal entity are in MVP.** |
| OQ-M9-12 | **How does §6.8's one-row-per-day model handle a night shift crossing midnight** (hostel wardens, security — both named MVP shift users)? | `first_in` 22:00 and `last_out` 06:00 belong to different calendar dates under a one-row-per-day model, so worked hours come out as either negative or absurd. | Anchor the record to the **shift start date** and allow `last_out` to fall on the following day. Needs to be settled before M9-S06, not discovered in test. |

### Conflicts between documents

| # | Conflict | Sides | Proposed resolution |
|---|---|---|---|
| CF-M9-A | **Period-wise attendance is tagged `[MVP]` in blueprint PART C item 2** ("Attendance — biometric + geo/selfie mobile, shifts/rosters, **half-day & period-level**, regularization, auto paid-days") and in §2 ("★ Half-day AND period-level attendance **[MVP]**"), while **D2 defers it**. PART C is the authoritative in/out list and contradicts itself: its own "Locked-scope deltas" paragraph, immediately below, defers period-level attendance. | `functionality-blueprint.md` PART C item 2 + §2 vs the same document's locked-scope deltas and `decisions-to-finalize.md` **D2**. | **D2 wins** (a locked decision beats a summary list) and M9 builds half-day only. But PART C's numbered list must be corrected, since agents are told to treat it as authoritative. Extends screen-inventory **Q30**. **Reported, not applied.** |
| CF-M9-B | **"Offline attendance capture (poor-connectivity campuses)" is tagged `[P2]` in blueprint §2** — while M13 §Business rules names "offline attendance tolerance" as MVP, §9 Non-functional requires "attendance degrades gracefully on weak connectivity, syncs on reconnect", and the built EMP-03 ships an offline-queued state. | `functionality-blueprint.md` §2 vs `development-specification.md` M13 + §9 + `design/v3/pages/attendance.jsx`. | **Dev spec wins — offline capture is MVP.** It is a non-functional requirement, not a feature, and the primary client is a phone carried around a campus. The blueprint tag is wrong. **Reported, not applied.** |
| CF-M9-C | **Overtime / extra-duty: `[P2]` in blueprint §2** ("Overtime / extra-duty auto-calculation with configurable rates **[P2]**") but **`[MVP]` in PART C item 4** ("LOP proration, **extra-duty pay**, investment declaration"); blueprint §2 also includes **OT inside the MVP paid-days formula** ("auto paid-days calculation reconciling attendance + leave + **OT** + holidays + weekly-offs **[MVP]**") while M9 §Business rules' formula omits OT entirely — and the built EMP-02 ships an "Overtime & extra duty" tab with an empty state and no backing entity. | `functionality-blueprint.md` §2 vs PART C item 4 vs `development-specification.md` M9 §Business rules vs `design/v3/pages/attendance.jsx`. | Split the question: **extra-duty capture** (a counted, approved duty log) is plausibly MVP and is the answer to OQ-M9-08; **overtime rates and auto-pay** are P2. The paid-days formula in M9 §Business rules is the authority and does **not** include OT — extra duty is paid as honorarium units, not as paid days. **Needs a ruling; three documents currently disagree.** |
| CF-M9-D | **The ShriConnect deck presents period-level attendance as a shipping capability** — slide 04 lists it among "Five things not one competitor does" and slide 06's head-to-head ticks "Substitute + period-level attendance" for Naveya with no Phase-2 marker. | `docs/Naveya-School-HRMS-Voxturrlabs.pdf` (22 July) vs the dev spec and **D2**. | **Dev spec wins.** Recorded as a commercial rather than an engineering conflict — the expectation exists outside the repo because the deck was shown to the partner. Same finding as [[M8-leave]] CF-M8-F. |
| CF-M9-E | **The same deck (slide 09) says "single-click with variance detection"**, which the 2026-08-11 product ruling explicitly forbids: release always requires a distinct checker and is never one click. | `Naveya-School-HRMS-Voxturrlabs.pdf` slide 09 and `functionality-blueprint.md` PART C item 4 ("single-click run with variance detection") vs `development-specification.md` M10 "Compute vs release *(wording corrected 2026-08-11)*". | **The dev spec's correction wins.** Adjacent to this lane rather than inside it — but the paid-days **freeze** is the first gate in that sequence, so it is recorded here. The blueprint's PART C copy still carries the forbidden phrase and should be corrected with it. |
| CF-M9-F | **The Keka benchmark's own patterns include one we must not copy:** its My Finances page renders an **unmasked bank account number**. | `design/reference/keka/README.md` vs `ui-compliance-requirements.md` **O3**. | Already resolved in the reference README and repeated here because M9 is the module the captures were taken for: Naveya masks with an audited reveal. No M9 screen carries bank data at all, so the divergence costs nothing here — it matters when the same component vocabulary reaches Profile and Payslips. |

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
