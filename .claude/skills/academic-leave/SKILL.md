---
name: academic-leave
description: Use when scaffolding or changing Naveya's academic-year leave engine — vacation-staff vs non-vacation-staff rules, term/vacation calendar, blackout windows, and loss-of-pay (LOP) linkage into payroll. Dispatch oracle + cyborg + riddler.
---

# Academic-Year Leave Engine

Dispatch **oracle** (models + RLS) → **cyborg** (GraphQL/REST + service) → **riddler** (LOP → payroll linkage). One unit of work, per the leave/academic-calendar modules in `docs/development-specification.md`. Educational-institution leave is **not** the generic corporate model — it is anchored to the academic year and staff category.

## Domain rules to model

1. **Academic year, not calendar year.** Leave balances, accruals, and carry-forward are keyed to the **academic year** (e.g. Apr–Mar or the institution's configured session), defined per tenant/branch. All balance math resolves against the academic year containing the leave dates.

2. **Vacation-staff vs non-vacation-staff.** Teaching/"vacation" staff earn and consume leave differently from non-vacation staff (admin/support): vacation staff are expected to take leave during declared **vacation periods** and typically have restricted earned-leave accrual during term; non-vacation staff accrue and take leave year-round. The staff category drives which leave types, accrual rules, and encashment rules apply. Model the category on the employee and branch the engine on it.

3. **Term / vacation calendar.** A per-tenant/per-branch calendar declares **terms** (working periods), **vacations** (summer/winter/festival breaks), and **holidays**. The engine reads this calendar to: determine working days for LOP, decide whether a date falls in a vacation window, and validate leave requests against the session.

4. **Blackout windows.** Certain periods (examinations, admissions, result declaration, first/last weeks of term) are **blackout** windows where leave is restricted or requires elevated approval. Blackouts are configured on the calendar and enforced at request time (block or route to higher approval), with clear Hindi+English messaging.

5. **LOP (loss-of-pay) linkage.** When approved leave exceeds balance, falls on a non-permitted day, or is unpaid by type, it produces **LOP days** that feed the payroll run. The leave engine emits LOP as a typed, tenant-scoped record that **riddler's payroll calculation consumes** — the leave engine never computes salary itself; it hands LOP days to payroll (see payroll-statutory skill). Keep the boundary clean: leave decides *how many LOP days*, payroll decides *how much money*.

## Scaffold

- **Models (oracle):** tenant-scoped (`tenant_id` + RLS, see rls-model skill) — `LeaveType`, `LeavePolicy` (per staff category + academic year), `AcademicCalendar` (terms/vacations/holidays/blackouts), `LeaveBalance` (per employee per academic year), `LeaveRequest`, `LOPRecord`. Append-only audit on approvals; money never stored here (LOP is in *days*).
- **Service + API (cyborg):** balance calculation, request validation (calendar + blackout + category rules), the approval workflow (maker-checker where policy requires), and LOP emission. Expose via strawberry-django GraphQL (+ DRF edge if needed) per the strawberry-api skill: tenant-scoped, DataLoaders on nested relations, Hindi+English strings.
- **LOP → payroll (riddler):** the contract by which `LOPRecord` days enter a payroll run; golden-file coverage that a given leave scenario yields the expected LOP days and the expected pay reduction for a pinned StatutoryConfig version.

## Tests
- TDD throughout. Cover: academic-year boundary crossings, carry-forward, vacation-staff vs non-vacation-staff divergence, blackout enforcement (block + elevated-approval paths), and the full leave→LOP→payroll linkage (with riddler's golden case). Cross-tenant isolation test for every new tenant-owned model (bane's suite).

## Gate
deathstroke review; **gordon `/compliance-check`** because LOP touches pay and leave records touch employee PII/audit; ADR in `docs/adr/` if the academic-year or category model changes assumptions.
