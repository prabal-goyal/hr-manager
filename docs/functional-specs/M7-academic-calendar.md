# M7 — Academic Calendar · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M7 Academic Calendar (build-plan Sprint 4, **before** [[M6-onboarding]] within the sprint) ·
> **Epic:** NA-20 lane B · **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` **M7 in full**, §6.6, §6.7, §4.3, §7, §12 ·
> `docs/functionality-blueprint.md` §3 and **PART C item 3** · `docs/decisions-to-finalize.md` D2
> (substitution/timetable deferred — the calendar is **not**) ·
> `docs/ui-compliance-requirements.md` O6, O7, O12, **O18** · `docs/screen-inventory.md` GA-06, PR-07 ·
> `docs/executive-summary.md` differentiator #1.
>
> **Built design screens are the agreed UX.** GA-06 (academic year & terms) and PR-07 (holiday calendar)
> are specified in the inventory with full action tables. The backend must serve what they promise.

---

## 1 · Intent

A school does not run on the calendar year. It runs on a session that opens in April, breaks for summer,
tightens around exams, closes in March, and repeats. Every question the rest of this product answers is
asked *within* that frame: how much leave has a teacher earned this session, whether today is a working day
or a festival holiday at this campus, whether an application for three days in the second week of the board
exams should be entertained at all. The deck's own line for the name says it plainly — the instrument at the
helm, steering leave, pay, documents and people through **the rhythm of the academic year**.

M7 is small: four tables and a few screens. It is also the module that decides whether the product's
headline differentiator is real. The temptation, when [[M8-leave]] is built, will be to keep exam dates as a
leave-module setting and holidays as a payroll constant, because that is a shorter path to a working leave
form. That path produces two calendars that drift, and a school whose exam blackout says one thing on the
leave screen and another on the attendance register. So M7's job is not only to store the session shape —
it is to be the **only** place any module in Naveya can learn what day it is at a given campus. Everything
downstream reads M7; nothing downstream keeps its own copy.

---

## 2 · Scope & surfaces

### In scope

| Area | What M7 delivers |
|---|---|
| Academic year | `AcademicYear` per scope (campus or org), start/end, `is_current` with **exactly one per scope**, roll-over to the next year |
| Terms | `Term` with `type` `(teaching / exam / vacation)` and dates; non-overlapping; contained within the AY. **Vacation terms drive vacation-staff leave; exam terms are the blackout facts** |
| Holiday calendars | `HolidayCalendar` per campus per AY, `Holiday` with `type` `(national / festival / restricted / floating)`; copy/import from another campus or year; draft → published |
| **The calendar query service** | The single read API every other module uses: is-working-day, term-for-date, blackout windows, holiday set, working-day count between two dates, AY-for-date. This is M7's most important deliverable |
| Statutory holiday minimum | The National & Festival Holidays Act per-state minimum count, **read from the versioned `StatutoryConfig`** ([[M11a-statutory-config-versioning]]) and surfaced on PR-07 as a compliance check — never a constant in calendar code |

### Explicitly out of scope

| Out | Owned by |
|---|---|
| Leave policies, leave types, balances, the blackout **rule** (which types are blocked in an exam term) | **[[M8-leave]]** — M7 supplies the window; M8 decides what the window forbids |
| Weekly-off patterns and shift calendars | **[[M9-attendance]]** (`§6.8 Shift`) — deliberately **not** on PR-07, an anti-duplication rule the design already enforces |
| Attendance statuses and paid-day computation | **[[M9-attendance]]** / **[[M10-payroll-core]]** — they *read* the calendar |
| Appraisal cycle windows | **[[M17-performance-appraisal]]** — `AppraisalCycle` references `academic_year_id`, it does not define one |
| Contract end dates and renewal defaults | **[[M6-onboarding]]** / **[[M3-core-hr-people]]** — they read "+1 academic year" from here |
| **Timetable, periods, substitution, teaching load** | **Phase 2** by locked **D2**. M7 stores no period, no class and no subject |
| SIS/ERP academic-calendar import | **Phase 2** (blueprint §14, "design the API from MVP") — the query service in §2 *is* that API surface |
| The statutory minimum's *value* per state | **[[M11a-statutory-config-versioning]]** — M7 reads it, never stores it |

### API surfaces

- **GraphQL (primary):** `academicYears`, `terms`, `holidayCalendars`, `holidays`, and the query service —
  `calendarDay(campusId, date)`, `workingDays(campusId, from, to)`, `termForDate`, `blackoutWindows`,
  `currentAcademicYear(scope)`. Action mutations: `academicYearCreate`, `academicYearSetCurrent`,
  `academicYearRollOver`, `termCreate`, `termUpdateDates`, `holidayAdd`, `holidayCalendarImport`,
  `holidayCalendarPublish`.
- **Internal service interface:** the same logic exposed as a Python service so [[M8-leave]],
  [[M9-attendance]] and [[M10-payroll-core]] call it in-process rather than re-deriving day types. **The
  service, not the tables, is the contract** — a downstream module that queries `holiday` directly has
  duplicated M7 and will drift.
- **REST edge:** none required beyond the standard read; a calendar export (ICS/CSV) is a reasonable
  Phase-2 addition, not MVP.

### Client surfaces

Web (green-lantern): **GA-06** academic year & terms (Group Admin, and a Principal for a campus-scoped AY),
**PR-07** holiday calendar (Principal per campus; Group Admin with a campus switcher).
Consumed by, but not owned by: HR-26 leave policy, HR-27 balances, EMP-06 leave application,
attendance calendars, PY payroll paid-days. Mobile: read-only consumption inside [[M13-ess-mobile]].
The captured Keka reference (`design/reference/keka/calendar-shift-schedule-full.jpg`) shows the shape a
staff-facing calendar takes — a grid printing `HOLIDAY` and `W-OFF` per day — and confirms the boundary:
that surface is a *shift* calendar owned by [[M9-attendance]] reading M7's holiday facts.

---

## 3 · Data model

All four tables are tenant-owned: NOT-NULL `tenant_id` + RLS `ENABLE`+`FORCE`+policy in the **same
migration** as the model (`guard-rls-policy`, [[M0-foundations]] AC-03).

### 3.1 `AcademicYear` (§6.6)

| Field | Type | Notes |
|---|---|---|
| `id`, `tenant_id` | UUID / FK | |
| `scope_level` | enum `org` \| `campus` | §6.6 writes "scope (campus/org)" as one field; modelled as level + id, matching `RoleAssignment` ([[M2-identity-access]]) rather than inventing a second scoping idiom |
| `scope_id` | UUID | org id or campus id ([[M1-organization-tenancy]]) |
| `label` | text | e.g. "2026-27" |
| `start_date`, `end_date` | date | default April–March, the Indian session |
| `is_current` | boolean | **exactly one true per (tenant, scope_level, scope_id)** — a partial unique index, not application logic |

Overlapping academic years within the same scope are refused.

### 3.2 `Term` (§6.6)

`academic_year_id`, `name`, `type` `(teaching / exam / vacation)` (**no default** — the choice decides
behaviour), `start_date`, `end_date`.
Terms must fall inside their AY and must not overlap each other. `type` is the load-bearing field:
- **`vacation`** — the window in which vacation staff are on vacation *in lieu of* earned leave
  ([[M3-core-hr-people]] `is_vacation_staff`, [[M8-leave]] `applies_to_vacation_staff`).
- **`exam`** — the blackout window. **This is a calendar fact, not a leave-module constant.** [[M8-leave]]
  reads the window and applies its own rule about which leave types it forbids.

### 3.3 `HolidayCalendar` (§6.6)

`campus_id` ([[M1-organization-tenancy]]), `academic_year_id`, `name`, and — **proposed** —
`status` `(draft / published)` with `published_at` and `published_by_user_id`. §6.6 has no status field, yet
PR-07's entire interaction model turns on draft-versus-published, because publishing *changes leave
day-counts and attendance statuses for N staff* (OQ-M7-02).
Per campus by design: two campuses of the same trust in different states share an academic year and do not
share holidays.

### 3.4 `Holiday` (§6.6)

`calendar_id`, `date`, `name`, `type` `(national / festival / restricted / floating)`, and — **proposed** —
`recurs_annually` (the design marks it `[proposed]`; a fixed-date national holiday repeats, a lunar festival
does not).
Unique on (`calendar_id`, `date`). **Restricted-holiday quotas are Phase 2** (PR-07 states).

### 3.5 What M7 deliberately does not store

No period, no class-section, no subject, no timetable, no teaching load — all Phase 2 under **D2**. No
weekly-off pattern (that is `Shift`, [[M9-attendance]]). No leave type, no accrual rule, no blackout
*policy*. No statutory holiday-minimum value.

---

## 4 · Behaviour walk-through

### 4.1 Happy path — setting up a session

1. **GA-06.** A Group Admin creates AY 2026-27, 1 Apr 2026 – 31 Mar 2027, at org scope. Overlapping years in
   the same scope are refused.
2. Terms are added: Term 1 (teaching), Half-Yearly Exams (**exam**), Winter Break (**vacation**), Term 2
   (teaching), Board Exams (**exam**), Summer Vacation (**vacation**). The form states the consequence *at
   the point of choice*: a vacation term changes teacher leave behaviour, an exam term creates a leave
   blackout.
3. The AY is set current. The previous `is_current` clears — exactly one per scope, enforced by the index.
4. **PR-07.** Each campus's Principal builds a holiday calendar for that AY: national days, the festivals
   that matter locally, restricted holidays. Bangalore's list differs from Delhi's; both are correct.
5. Publishing confirms with the effect named — *"this changes leave day-counts and attendance statuses for
   N staff"* — and only then do leave `day_count` and attendance reconciliation honour it.
6. [[M8-leave]] can now create a leave policy for the AY (HR-26 blocks with a route here when no AY exists),
   balances can be initialised, and [[M6-onboarding]]'s renewal queue can default a new contract end date
   to +1 academic year.

### 4.2 States

**AcademicYear:** no AY (**blocks leave policy and balances**) · draft · **current** · future · past
(read-only). Two current in one scope must be impossible — a database constraint, not a validation.
**Term:** defined · active (today falls inside it) · past · overlapping (refused).
**HolidayCalendar:** empty (new AY) · draft · **published** · past year (read-only) · conflicts with
existing attendance records.

### 4.3 Edge cases and error paths

| Case | Behaviour |
|---|---|
| Two AYs marked current in one scope | Impossible by partial unique index; a concurrent double set-current makes the second a database error, not a race |
| A term outside its AY, or two overlapping terms | Refused, naming the conflicting term |
| Editing a term's dates when approved leave already exists in the affected window | The affected requests are **listed before the change is allowed** — the day-count consequence is shown, never applied silently |
| Setting a new AY current before balances are initialised | Warned, with the route to initialise ([[M8-leave]] / HR-27) |
| A holiday date already exists in the calendar | Blocked, showing the existing entry |
| A holiday outside the AY's date range | Blocked |
| Importing a calendar from another campus with conflicting dates | Conflicts are **listed for resolution**, never silently overwritten; default is merge, not overwrite |
| **A published holiday is edited or deleted after attendance or approved leave depends on it** | Refused, with the count of affected records and a route to HR — **and the spec has no recompute path for a retro-dated holiday change** (OQ-M7-03). This moves money through paid-days |
| A lunar festival shifts by a few days after publication | The same retro-change path applies; it is the common case, not the exotic one |
| A leave request spans two academic years | The day-count crosses two frames and two balance ledgers — [[M8-leave]]'s ruling (inventory Q11), but M7 must answer `workingDays` correctly across the boundary |
| A campus has no holiday calendar for the current AY | Every day is a working day, which is wrong and silent. The calendar query service must report *unconfigured*, distinctly from *no holidays* |

### 4.4 Concurrency

`ETag`/`If-Match` on AY, term and calendar records. `academicYearSetCurrent` is a compare-and-set inside a
transaction so two admins cannot both leave their year current. Publishing a calendar is idempotent.

### 4.5 Ownership discipline — the rule this module exists to enforce

> Any module needing to know whether a date is a working day, which term contains it, or whether it falls in
> a blackout window **calls the M7 service**. No module stores exam dates, vacation windows or holiday lists
> of its own, and no module hardcodes them.

This is testable, and §6 tests it: a repository check that no other app's code defines a holiday list or an
exam-date constant, plus the assertion that [[M8-leave]]'s blackout validation and [[M9-attendance]]'s day
classification both resolve through the same service call.

### 4.6 i18n and a11y

Term types, holiday types, month and weekday names, and the AY state words are Hindi + English via i18n
(**O12**). Holiday **names** are captured text (often the festival's own name) and are shown as entered, not
translated. Day type on any calendar grid is conveyed as mark + word, never colour alone — a holiday must be
identifiable to someone who cannot see the tint.

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M7-AC-01 | An academic year is created with a label, start and end date, and a scope (org or campus); overlapping years within the same scope are refused. | `§6.6 AcademicYear`, GA-06 |
| M7-AC-02 | **Exactly one `is_current` academic year exists per scope**, enforced by a partial unique database constraint; setting a new one clears the previous in the same transaction, and two concurrent set-current calls cannot both succeed. | `M7 §Business rules` ("one `is_current` AY per scope"), GA-06 |
| M7-AC-03 | A term carries `type` `(teaching / exam / vacation)` with **no default**, lies inside its academic year, and does not overlap another term; both violations are refused naming the conflict. | `§6.6 Term`, GA-06 |
| M7-AC-04 | **Creating AY 2026-27 with a summer vacation term makes vacation-staff leave rules apply in that window** — the acceptance criterion of the module, verified end-to-end against [[M8-leave]] when it lands. | `M7 §Acceptance` (verbatim) |
| M7-AC-05 | **Exam terms are exposed as blackout windows by the calendar service**; [[M8-leave]] reads them and applies its own rule about which leave types they forbid. No exam date is stored, duplicated or hardcoded in the leave module. | `M8 §Business rules` ("blackout validation against `Term`"), HR-26 |
| M7-AC-06 | Holiday calendars are **per campus per academic year**; two campuses in different states can hold different holidays under the same AY. | `M7 §Business rules` ("per-campus, state/festival variance"), PR-07 |
| M7-AC-07 | A holiday carries a date, name and `type`; a duplicate date in the same calendar and a date outside the AY are both refused, naming the reason. | `§6.6 Holiday`, PR-07 |
| M7-AC-08 | Publishing a holiday calendar is an explicit act, confirmed with the effect stated ("changes leave day-counts and attendance statuses for N staff"), audited, and only then honoured by leave day-counts and attendance reconciliation. | PR-07 Actions, **O6** |
| M7-AC-09 | Editing or deleting a **published** holiday on which attendance records or approved leave depend is **refused**, reporting the count of affected records. | PR-07 Actions, **O18** |
| M7-AC-10 | Importing or copying a calendar defaults to **merge, not overwrite**, and lists conflicting dates for resolution rather than silently replacing them. | PR-07 Actions |
| M7-AC-11 | Editing a term's dates lists every approved leave request in the affected window **before** the change is permitted. | GA-06 Actions |
| M7-AC-12 | The **calendar query service** answers is-working-day, term-for-date, blackout-windows, holiday-set, working-day-count and AY-for-date for a campus and date, and is the single source used by [[M8-leave]], [[M9-attendance]] and [[M10-payroll-core]]. | `M7 §Purpose`, `M8/M9/M10 §Business rules` |
| M7-AC-13 | The service distinguishes **"no holidays configured"** from **"no holidays on this date"**; an unconfigured campus calendar is reported as unconfigured and never silently treated as all-working-days. | §4.3, `M7 §Purpose` |
| M7-AC-14 | A repository check asserts that no module outside M7 defines a holiday list, an exam-date constant or a vacation window; day classification resolves only through the M7 service. | `guard-hardcoded-values`, §4.5 |
| M7-AC-15 | The **National & Festival Holidays Act minimum** count is read from the versioned `StatutoryConfig` and displayed as a compliance check on PR-07; it is never a constant in calendar code. | `guard-statutory-hardcode`, §4.4, blueprint §3 MVP, [[M11a-statutory-config-versioning]] |
| M7-AC-16 | `academic_year`, `term`, `holiday_calendar` and `holiday` each carry NOT-NULL `tenant_id` and an RLS `ENABLE`+`FORCE`+policy created in the **same migration**; a cross-tenant read returns zero rows by ORM and by raw SQL. | §3, `guard-rls-policy`, M0-AC-03/05 ([[M0-foundations]]) |
| M7-AC-17 | `calendar.manage` is enforced at campus/group scope: a Principal scoped to Campus A cannot create, publish or edit Campus B's calendar, and campus pickers, counts and exports are scoped identically. | `M7 §Permissions`, **O7** |
| M7-AC-18 | Every academic-year, term, calendar and holiday change writes an `AuditLog` row with actor and before/after; publication records who published and when. | §4.2, **O6** |
| M7-AC-19 | Term types, holiday types, AY states and date formatting are Hindi + English via i18n with Indian date formats; holiday names are shown as captured, never machine-translated. | `guard-i18n-strings`, **O12**, §9 Localisation |
| M7-AC-20 | Day type on any calendar rendering is conveyed as mark + word, never colour alone. | `DESIGN.md` principle 8 |
| M7-AC-21 | Roll-over creates a **draft** next-year AY with terms copied and dates shifted; it never sets the new year current implicitly. | GA-06 `[proposed]` roll-over, **O18** |
| M7-AC-22 | **No timetable, period, class-section, subject or substitution data is created by M7**, in line with locked decision D2. | `decisions-to-finalize.md` D2, GA-06 "must NOT contain" |
| M7-AC-23 | Weekly-off patterns are absent from M7 and PR-07; they live on `Shift` in [[M9-attendance]]. | PR-07 "must NOT contain" (anti-duplication) |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | **The day-classification matrix** — for a seeded campus calendar and term set: working day, national holiday, festival holiday, inside an exam term, inside a vacation term, a day that is both a holiday and inside an exam term, a day outside any term, a day in an unconfigured calendar. Working-day counts across a term boundary, across an AY boundary, and across a published-then-amended calendar. Term overlap and containment validators. Roll-over date shifting incl. a leap year. Every assertion references the AY/term/holiday **fixtures**, never a re-typed date literal |
| Integration | **bane** | `is_current` uniqueness under two concurrent set-current calls (one wins, one fails at the constraint); publication changing downstream day-counts; a retro edit refused when attendance depends on it; import conflicts listed not overwritten; cross-campus variance (two campuses, one AY, different holidays, both correct) |
| Integration / RLS | **bane** | Cross-tenant isolation on all four tables by ORM and raw SQL; `calendar.manage` scope refusal on create/publish/edit and on pickers, counts and exports |
| Contract / ownership | **bane** + CI | The §4.5 discipline check: no holiday list, exam-date constant or vacation window defined outside M7; [[M8-leave]] blackout validation and [[M9-attendance]] day classification both resolve through the M7 service |
| Statutory | **riddler** | The National & Festival Holidays Act minimum resolves from the pinned `StatutoryConfig` version for the campus's state, and changes when the config version changes — asserted against a config fixture, never a literal |
| A11y / UI | **two-face** | GA-06 and PR-07 at WCAG AA; day type legible without colour; Hindi/English parity incl. Indian date formats |

---

## 7 · Proposed stories

Sprint 4 (build plan §12, "Onboarding + Calendar (M6–M7)"). **M7 lands first within the sprint** —
[[M6-onboarding]]'s renewal defaults and DOJ-relative due dates read it, and [[M8-leave]] (Sprint 5) is
blocked without it.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M7-S01 | `AcademicYear`, `Term`, `HolidayCalendar`, `Holiday` models + RLS + the one-current constraint | Four tables, the partial unique index that makes two current years impossible, and policies in the same migration. | oracle | 5 | M0-S04 ([[M0-foundations]]), [[M1-organization-tenancy]] |
| M7-S02 | Academic year & term API: create, set-current, roll-over, overlap and containment validation | The session shape, with the affected-leave listing before a date change. | cyborg | 5 | M7-S01 |
| M7-S03 | **The calendar query service** | is-working-day, term-for-date, blackout-windows, working-day-count, AY-for-date — the single source [[M8-leave]], [[M9-attendance]] and [[M10-payroll-core]] call. | cyborg | 5 | M7-S02 |
| M7-S04 | Holiday calendar: add, import/copy, publish, retro-change guard, statutory-minimum check | Per-campus calendars, merge-not-overwrite, and the Act minimum read from `StatutoryConfig`. | cyborg | 3 | M7-S02, [[M11a-statutory-config-versioning]] |
| M7-S05 | GA-06 academic year & terms (web) | Terms labelled with their consequence at the point of choice. | green-lantern | 5 | M7-S02 |
| M7-S06 | PR-07 holiday calendar (web) | Draft/publish with the effect named; conflict resolution on import. | green-lantern | 5 | M7-S04 |
| M7-S07 | Unit suite: the day-classification and working-day-count matrix | The module's whole correctness surface, asserted against fixtures. | deathstroke | 5 | M7-S03 |
| M7-S08 | Integration: one-current under concurrency, cross-campus variance, RLS, and the ownership discipline check | Including the repository check that nobody else keeps a calendar. | bane | 3 | M7-S04 |

**Total: 8 stories, 36 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M7-01 | **How is AY scope modelled?** §6.6 writes "scope (campus/org)" as a single field. A group with campuses in different states may genuinely need different session dates per campus, while leave policy is often set at group level. | If it is a single nullable `campus_id`, the "exactly one current per scope" rule becomes ambiguous the moment an org-level and a campus-level AY are both current for the same campus. | `scope_level` + `scope_id`, matching `RoleAssignment` ([[M2-identity-access]]), with campus-level resolution falling back to org-level. **The fallback rule needs a ruling** — it decides which AY a campus's leave balances key to. |
| OQ-M7-02 | **`HolidayCalendar` has no `status`.** PR-07's whole interaction model is draft → published, and publication is what makes the calendar affect pay through paid-days. §6.6 has no such field. | Without it, every holiday added takes effect the instant it is typed, mid-session, with no confirmation of the consequence. | Add `status`, `published_at`, `published_by_user_id`. **Dev-spec change — needs BATMAN's sign-off.** |
| OQ-M7-03 | **There is no recompute path for a retro-dated holiday change.** PR-07 refuses the edit when records depend on it, but a lunar festival genuinely does shift after publication, and a school will need to correct it. | Refusing forever is not a workable answer; allowing it silently moves paid-days and therefore money. | A guarded correction: refuse by default, allow with `attendance.manage` + a reason, and emit a recompute request to [[M9-attendance]]/[[M10-payroll-core]] (an arrears path if the month is closed — [[M10c-arrears-pay-revision]]). **Needs a product ruling; blocking before Sprint 6.** |
| OQ-M7-04 | **Where does the National & Festival Holidays Act minimum live?** The blueprint makes the count an MVP compliance check; it is a state-varying statutory number. | A count hardcoded in calendar code is exactly what `guard-statutory-hardcode` exists to stop, and it varies by state like PT and LWF do. | Store it in the versioned `StatutoryConfig` rules JSON alongside the other per-state values ([[M11a-statutory-config-versioning]]); M7 reads it. Confirming with riddler. |
| OQ-M7-05 | **Does a leave request spanning an AY boundary split across two balance ledgers?** (inventory Q11) M7 must count working days across the boundary correctly regardless, but the ledger rule is [[M8-leave]]'s. | Session-end leave that runs into the new year is common — and the answer changes both the balance and the LOP calculation. | Split at the boundary, debiting each AY's ledger for its own days. **[[M8-leave]]'s ruling**, recorded here because M7's `workingDays` must support either answer. |
| OQ-M7-06 | **Does setting a new AY current require a second pair of eyes?** GA-06 marks it `[proposed]`; it re-frames every balance, report and appraisal cycle in the tenant. | It is the single largest-blast-radius non-money action in the product, and it is currently one click. | A confirmation ritual naming what re-frames (already designed) plus an audit entry for MVP; a second approver is defensible but not spec-mandated. Product ruling. |
| OQ-M7-07 | **Are restricted-holiday quotas MVP?** PR-07 marks them **P2**, but restricted holidays are a real Indian construct — an employee picks N from a list — and the `Holiday.type` enum already carries `restricted`. | If `restricted` renders identically to `festival` in MVP, the type is decorative and the leave module cannot honour a quota later without a data change. | Keep the `type` value, keep quotas P2, and state in the UI that restricted holidays are informational in MVP. Confirming. |
| OQ-M7-08 | **Is `Holiday.recurs_annually` in MVP?** Marked `[proposed]` in the design. Fixed-date national holidays repeat; lunar festivals do not. | Without it, every campus retypes Republic Day every year — the exact tedium that makes people stop maintaining the calendar. | Include the flag; roll-over copies recurring holidays and leaves the rest for the Principal. Low cost. |
| **C-M7-01** | **Blueprint §3 tags "period-level leave" and leave→substitution linkage as MVP**, and PART C item 3 repeats it, while locked decision **D2** defers period-level leave, timetable import and substitution to Phase 2. The inventory records this as C5, **still uncorrected**. | Read alone, PART C would have M7 store timetable periods. It must not, under D2. | The locks win: M7 stores no period or timetable data (M7-AC-22). **The blueprint text needs correcting — BATMAN's ruling**, not mine. |
| **C-M7-02** | **GA-06 is a Group Admin screen and PR-07 a Principal screen, but `M7 §Permissions` names one permission, `calendar.manage`, at campus/group scope.** | If the AY and the holiday calendar share one permission, a campus Principal who may set holidays could also re-frame the group's academic year. | Split into `calendar.manage` (holidays, campus) and `academic_year.manage` (AY and terms, group — campus where the AY is campus-scoped). Needs a ruling with [[M2-identity-access]]'s seed roles. |

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
