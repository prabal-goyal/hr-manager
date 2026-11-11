# Open rulings from the development-planning run

Written overnight 2026-09-06/07 by the P1 planning sprint. **Nothing here was
resolved by an agent.** Each item is a real ambiguity, contradiction or gap that
the specification work surfaced, with the recommendation where there is one.

Ordered by consequence, not by module.

---

# DECISION INDEX

Fifty-two items were raised across seventeen sections, appended lane by lane as
each finished. **The sections below are the detailed record; this index is the
decision list.** It groups by the sprint a decision blocks, because that is what
determines when you need to answer it.

**Two sections say the same thing.** §H and §O are one finding — the entity
catalog is thinner than the modules reading from it — recorded twice because two
lanes found it independently. §D and §P likewise overlap on the partner deck.
Nothing is lost by reading §O and §P and skipping §H and §D.

## Nothing blocks Sprint 0

Tenancy, RLS, audit, contracts and CI depend on no open ruling. Sprint 0 is
filed and workable as it stands. Everything below can be decided while it runs.

## Blocks Sprints 1–2 · identity, people, documents

| # | Decision | Where | Recommendation |
|---|---|---|---|
| 1 | **No `Permission` catalogue** — `documents.write` has nothing to validate against | A1, K2 | Make it a first-class entity with code, both-language labels, and a grantable-to-role constraint. Without it the governance rule is a code comment. |
| 2 | **`StaffDocument` has no supersession or verifier field** — O4 unmeetable | K1 | Add both. With #1 these are the two halves of the same guarantee. |
| 3 | **Blueprint §9 still says "Profile/document self-update [MVP]"** | K3, Q | Delete it. It is the opposite of the governance model and predates the July decision. |
| 4 | **No `reports_to` anywhere** — blocks M8, M13, M14, M17 | A2, O | Highest-fanout missing field in the model. |
| 5 | **Vacation-staff flag: category (design) vs contract (spec)** | C2 | Contract authoritative; category carries a proposed default; a flip is a bulk supersession with affected count and recalculate-vs-grandfather, no default. HR-08 already implements this shape. |
| 6 | **Role change on token refresh vs per-request resolution** | C1 | Per-request. A 15-minute window holding a revoked `payroll.approve` is what maker-checker exists to prevent. Copy change on a built screen. |
| 7 | **MFA: "optional" / unqualified / "required" in three documents** | B1 | One answer needed; it protects every money action. |
| 8 | **Audit-log scope: MVP-for-payroll or universal** | B2 | Universal. Narrowing later is cheap; widening is not. GA-08 is built and would show nothing for a role grant. |
| 9 | **M6 has no entities in §6 at all** — HR-22/23 unbuildable | L1 | |
| 10 | **No `CandidateConsent`** though PUB-02 is the highest-risk PII collection point | L3 | |
| 11 | **May a joiner start with police verification outstanding?** | L4 | §8 mandates tracking and names no consequence. This is an adult around children; silence is the one unacceptable answer. |
| 12 | Smaller model gaps: `Campus.state` flat, no `is_active` on M1 entities, no `ServiceRecord.corrects_id`, no status on `Offer`/`JobPosting`/`HolidayCalendar`, `approval_chain` unowned | A3, A4, L2, L8 | |
| 13 | **One bearer primitive, not three token schemes** | K4 | Careers, pre-boarding and offer acceptance are the same shape. |

## Blocks Sprints 5–6 · leave and attendance

| # | Decision | Where | Recommendation |
|---|---|---|---|
| 14 | **`AttendanceRecord` must move to Sprint 5** — otherwise M8-S11 cannot be scheduled at all | F2 | Ordering error, not a preference. |
| 15 | **Biometric adapters needed in Sprint 6, scheduled for 11** — and a LAN device cannot present a bearer token to a cloud tenant | F3, N3 | Needs an on-site agent or pull-mode regardless of scheduling. Found three times independently. |
| 16 | **No paid-days entity in §6 at all**, though payroll's first step consumes it | H1 | Found from both the attendance and payroll sides. |
| 17 | **Retro-dated holiday change has no recompute path** | L6 | Lunar festivals shift; this moves money through paid-days. |
| 18 | `AttendanceRecord.status` cannot express `not_in_service`/`vacation`; `Shift` has no employee link; `is_half_day` boolean loses half a paid day | H4 | The last one is a rounding error that becomes money. |
| 19 | **Forced vacation-leave during school breaks** — MVP in blueprint and deck, absent from the dev spec | G2 | Drafted into M8 §4.1.5 overnight; needs ratifying as scope rather than inherited from a spec written at 1am. |

## Blocks Sprints 7–9 · payroll and statutory

| # | Decision | Where | Recommendation |
|---|---|---|---|
| 20 | **The proration denominator is stated nowhere** — calendar / working / fixed-26 | M1 | Three different salaries for the same absence. Decide before Sprint 7 opens. |
| 21 | **`M11a` versioned config must move to the start of Sprint 7** | F1 | Reached by three independent routes. If Sprint 7 ships a date-resolved lookup, Sprint 9 cannot recover the history. |
| 22 | **No off-cycle run in MVP** — three situations have no payment path | M2 | Either off-cycle enters MVP or all three get a stated manual fallback. |
| 23 | **`ArrearAdjustment.recompute` is JSONB carrying money** | M4 | The likeliest float vector in the product; `guard-money-float` cannot see inside JSONB. Needs a serialisation rule. |
| 24 | **Reimbursement tax must resolve against the elected regime** | M3 | Otherwise new-regime employees are under-deducted every month, surfacing at Form 16. |
| 25 | **Ex-employee access to Form 16 and payslips** | I2 | Open in three documents. A time-boxed read-only post-exit mode resolves four questions at once — the highest-leverage single ruling here. |
| 26 | **Maternity benefit is promised and owned by nobody** | G1 | MVP in blueprint, PART C and the deck; absent from M11 and M8. |
| 27 | **Extra-duty / overtime pay has no entity**; `HonorariumRule` cannot serve it | M5 | Invigilators are salaried CTC teachers, not guest faculty. |
| 28 | Absent entities: `BonusRun`, `FinalSettlementLine`, `StatutoryPayment`, `EmployeeStatutoryProfile`; config pin missing on filings and settlements | H2, H3 | |
| 29 | **Signed Form 16/12BA: `[P2]` in blueprint §5, MVP everywhere else** | I1 | Specified as MVP; the §5 tag change is yours. |
| 30 | **GA-07 gates config activation on a second Group Admin; spec silent** | I4 | Adopted as binding; please ratify. |
| 31 | **AC-04..AC-08 have no built design** — six dense MVP screens | G3 | Design work reappearing inside the development plan; schedule it deliberately. |

## Blocks Sprints 10–12 · mobile, platform, appraisal

| # | Decision | Where | Recommendation |
|---|---|---|---|
| 32 | **Student-result linkage is MVP with no data source** | N1 | Exam system and SIS are both P2. Descope or give it a source; it cannot be built. |
| 33 | **Indian transactional SMS needs TRAI DLT template registration** | N2 | A free-text template editor violates it. Not a launch-day discovery. |
| 34 | **M16, M14, M15, M15.1 have none of their entities** | O | Review as one data-model pass, not module by module. |
| 35 | Scope tags contradicting their own documents: offline capture `[P2]`, webhooks `[P2]`, student/parent 360 in exec summary | I3, Q | |

## Not sprint-blocking, but decide before someone asks

| # | Decision | Where |
|---|---|---|
| 36 | **The 22 July deck documents none of the five scope changes attributed to it** — no PAMS slide, no helpdesk slide, and loans/reimbursements/arrears unnamed in 19 pages. The dev spec is the only record of what was promised. | P, D |
| 37 | The same deck promises substitute arrangement, period-level attendance, single-click payroll and "AI anomaly checks" — against locked D2, maker-checker, and no build contract at all. | D, P |
| 38 | **Is Aadhaar collected at all?** We can only store last-4 and cannot verify it. | E1 |
| 39 | **Who may open a police/BGV record?** O8 makes verification an obligation; it does not say who may read the file. | E2 |
| 40 | **What retention window** sits behind HR-03's built "exited (read-only, retention window)" state? | E3 |
| 41 | **PART C contradicts itself** — items 2 and 3 ship D2-deferred capabilities. It is authoritative *as corrected by the decisions log*. A correction this session owes, having told six lanes otherwise. | J |

---


---

## A · Data-model gaps that block a later sprint

**A1 · There is no `Permission` catalogue.** `§6.2` holds permissions as bare
strings in a JSON blob. So the statement the product's document governance rests
on — *the Employee role lacks `documents.write`* — has nothing to validate
against. GA-05 has nothing to group by, and there are no Hindi labels for a
permission a person must understand.

> **Consequence if unruled:** the M4 governance guarantee degrades from an
> enforced constraint to a code comment. This is the most consequential gap the
> run found. Recommend a first-class `Permission` entity with a stable code,
> both language labels, and a grantable-to-role constraint.

**A2 · There is no `reports_to` anywhere in `§6.3`.** The locked role model
defines a manager as the reports-to relationship, and M8's approval routing
depends on it. As specified, "manager approval" resolves to *anyone in the
department*.

**A3 · `Campus.state` is a flat column.** Changing it silently re-rates every
historical PT and LWF computation. GA-02 as built already demands a reason, an
effective date and a consequence warning — which only makes sense against a
dated row. Recommend effective-dated state.

**A4 · Smaller, same shape.** No `is_active`/archived on M1's four entities
though GA-02 requires archive-never-delete. No `ServiceRecord.corrects_id`
though HR-06 renders a correcting entry that names the one it puts right.

## B · The specification contradicts itself

**B1 · MFA is "optional" in M2 §Business rules, unqualified in §8, and
"required" in O16.** Three documents, three strengths, on the control that
protects every money action. Needs one answer.

**B2 · Audit-log scope.** Blueprint PART B §5 scopes it "[MVP for
payroll/statutory; full P2]"; §4.2 says every mutating action writes one; O6
makes it a compliance contract. GA-08 is a built MVP screen that would have
nothing to show for a role grant.

**B3 · Multi-legal-entity is tagged P2** in the blueprint while M1, §6.9, M11
and GA-03 all make `LegalEntity` the thing every statutory filing keys to.

**B4 · "Configurable custom fields [MVP]"** appears in the blueprint with no
entity anywhere in §6.

**B5 · Post-exit access.** M12 sets `is_active=false` at F&F; §8 requires
retained statutory data; the leaver still needs their Form 16.

## C · The design already answered; the spec has not

**C1 · GA-04 says role changes apply "on the next token refresh."** The spec
work proposes server-side per-request resolution instead, because a ≤15-minute
window in which someone holds a revoked `payroll.approve` is precisely the
failure maker-checker exists to prevent. **Recommended: adopt per-request
resolution and change GA-04's copy.** It is a built screen, so this is a copy
change, not a rebuild.

**C2 · The vacation-staff flag sits in two places.** HR-08 asks the question at
**category** level; `§6.3` puts `is_vacation_staff` on the **contract**. This is
critical-path risk #2, and it ripples into leave and payroll.

> Proposed resolution, needs your ruling: the **contract is authoritative**; the
> category carries a *proposed default*; flipping the category becomes a bulk
> supersession that states the affected count and offers a
> recalculate-vs-grandfather choice **with no default**. HR-08 already
> implements that shape for the identical problem.

**C3 · GA-04 has a built pending/second-Group-Admin approval flow** for
privileged grants, but the spec names maker-checker only for money and filings.

**C4 · HR-05 already renders "Sent for a second approval"** on a contract
revision — so second eyes on the vacation flip and on bank-detail edits are
half-built with no specification behind them.

## D · Commercial exposure — worth a conversation before a demo, not after

The **22 July ShriConnect deck** presents, as first-release:

- **substitute arrangement and period-level attendance** (pp. 4, 6) — against
  locked decision **D2**, which deferred both to Phase 2;
- **"single-click run … then NEFT bank file and payslips"** (p. 13) — against
  the maker-checker requirement, where a run needs a distinct second person
  before it is final.

The dev spec wins as the build contract. But the deck is what a partner has
seen, and the gap will surface in a demo. Better to reconcile the story now.

## E · Legal calls we cannot make

**E1 · Is Aadhaar collected at all?** We can only store the last four digits and
we cannot verify it. If it is not verifiable and not required, the safest
posture is not to collect it.

**E2 · Who may open a police/background-verification record?** O8 makes
child-safety verification an obligation; it does not say who may read the file.

**E3 · What is the retention window** behind HR-03's built "exited (read-only,
retention window)" state? The screen states a window the policy has not defined.

---


---

## F · The build plan is internally inconsistent — sequencing that must change

**F1 · `M11a` versioned StatutoryConfig must move from Sprint 8 to the START of
Sprint 7.** The build plan puts it in Sprint 8, but M10 payroll core in Sprint 7
already pins a config version — and §12's own critical-path risk #3 says it must
be data-versioned *from first use*.

> A Sprint-7 run that pins nothing is unreproducible, makes arrears against
> those months uncomputable, and leaves the golden-file regression with no
> baseline. M11a has no dependency on payroll; payroll has a hard one on it.
> **Recommended: move it, before anything is built against the current order.**

**F2 · `AttendanceRecord` (M9-S03) must move into Sprint 5.** M8's approval
side-effect stamps a day's status, so a Sprint-5 module depends on a Sprint-6
model. As the plan reads today, **M8-S11 cannot be scheduled at all.**

**F3 · Biometric adapters are Sprint-11 work needed in Sprint 6.** Either pull
one device family forward, or accept that Sprint 6 demos mobile-only. Found
independently by two lanes and while filing the module epics — three sightings,
so it is real.

**F4 · `ServiceToken` has no owning module** (it appears only as M0's OQ-04),
and M9's device ingest is its first consumer.

**F5 · Two hard downstream blocks worth knowing:** M9-S09 (paid-days freeze)
blocks the whole of M10's Sprint 7; M8-S14 blocks M12 in Sprint 9. Those are the
critical path through the middle of the build.

## G · Promised to someone, owned by nobody

**G1 · Maternity benefit** is `[MVP]` in blueprint §5, in PART C item 5, and on
deck slide 13 — and **absent from dev-spec M11 and M8 both**. A statutory
entitlement, on a slide a school has seen, that no module claims.

**G2 · Forced vacation-leave during school breaks** is MVP in blueprint §3 and
deck slide 08, with **no heading anywhere in the dev spec**. A school closes and
its vacation staff are on leave whether they asked or not — that is how a school
year works, and it touches accrual and F&F encashment directly. Now drafted into
M8 §4.1.5, but it needs ratifying as scope rather than inheriting it from a spec
written overnight.

**G3 · Six MVP screens have no design.** AC-04..AC-08 exist only as inventory
entries; `accountant.jsx` has AC-01/02/03. That is design-phase work reappearing
inside the development plan, and it should be scheduled deliberately rather than
discovered in Sprint 8.

## H · The data model is thinner than the modules that read from it

**H1 · There is no paid-days entity in §6 at all**, though M10's first workflow
step consumes it. Payroll is specified to read something the data model does not
define.

**H2 · Absent but referenced:** `BonusRun` (M11 §API exposes `/bonus-runs`) ·
`FinalSettlementLine` (PY-17 renders named sourced lines) · `StatutoryPayment`
(without it AC-03's "payable vs paid" is uncomputable) ·
`EmployeeStatutoryProfile` (§6.3 has identifiers, not electives).

**H3 · The config pin is missing** on `StatutoryFiling`, `FinalSettlement` and
arrears-originated contributions — the same version-pinning requirement as A1's
shape: a rule that cannot be enforced without a column to hold it.

**H4 · `AttendanceRecord.status` cannot express `not_in_service` or `vacation`**,
yet the mid-month-joiner AC needs both and the built PY-08 already renders a
sixth code. `Shift` has no employee link. `is_half_day` as a boolean silently
loses half a paid day — a rounding error that becomes money.

## I · More scope-tag contradictions

**I1 · Signed Form 16/12BA** — blueprint §5 says `[P2]`; PART C, dev-spec M11,
the greytHR parity bar and the deck all say MVP. Specified as MVP; the §5 tag
change is yours to make.

**I2 · Ex-employee access to Form 16 and payslips** is open in three documents at
once. A time-boxed read-only post-exit mode would resolve four questions
together. **This is the highest-leverage single ruling outstanding.**

**I3 · Offline capture is mis-tagged `[P2]`** though M13 treats it as core.
**Overtime / extra-duty has three documents disagreeing.**

**I4 · GA-07's built design already gates config activation on a second Group
Admin** where the written spec is silent. Adopted as binding (M11a-AC-06);
please ratify.

## J · A correction I owe on my own instruction

I told all six lanes that **PART C is authoritative** on MVP scope. **PART C
contradicts itself:** items 2 and 3 ship period-level attendance and
leave→substitution, both deferred by locked **D2**, corrected only by the
paragraph beneath them.

The instruction should have been: **PART C is authoritative as corrected by the
decisions log; where they disagree, D1..D7 win, because those are the locked
rulings.** Specs written before this correction should be re-read against it —
lanes A, C and E were affected.


---


---

## K · The document-governance guarantee is unenforceable in the data model

Two independent lanes found the two halves of the same hole. Together they are
the most important thing in this document.

**K1 · `StaffDocument` has no supersession or verifier fields**, which makes
`M4 §Acceptance` and obligation **O4 literally unmeetable**. The model says HR
verifies a response and that verification promotes it to the record, superseding
what was there. Neither the verifier nor the supersession has anywhere to live.

**K2 · There is no `Permission` catalogue** to hold `documents.write` (see A1).

> Between them, **both halves of the rule a school trusts this product for are
> currently unenforceable.** Fix before Sprint 2, not during it.

**K3 · Blueprint §9 still reads "Profile/document self-update [MVP]"** — the
exact opposite of the governance rule, uncorrected from before the 2026-07-15
decision. It needs deleting, not interpreting.

**K4 · One bearer primitive, not three.** `DocumentAccessGrant` (M4-S07) blocks
PUB-04 (M5-S11) and PUB-03 (M6-S07/S08). Careers, pre-boarding and offer
acceptance are the same token shape. Building three schemes is the obvious
mistake and expensive to undo.

## L · Blocking questions, each with a sprint attached

**L1 · M6 has no entities in §6 at all** — onboarding tasks, checklist
templates, bulk-import jobs are absent from the catalog. **HR-22/HR-23 are
unbuildable as specified.** Blocks Sprint 4.

**L2 · Requisition budget-authority thresholds** — `approval_chain` is
unstructured JSON with no setup surface and no owning module. Blocks Sprint 3.

**L3 · No `CandidateConsent` entity** despite §8's lawful-basis mandate. PUB-02
is the product's highest-risk PII collection point and it collects without a
consent record.

**L4 · May a joiner be marked ready with police verification outstanding?** §8
mandates tracking and names **no consequence**. This is an adult around
children; silence is the one unacceptable answer.

**L5 · Expired contract, person still working** — payroll and attendance
behaviour unspecified. Blocks Sprint 7.

**L6 · No recompute path for a retro-dated holiday change.** Lunar festivals
shift, and a holiday change moves money through paid-days. Blocks Sprint 6.

**L7 · Sizing and inversions.** M5 is 107 points against a two-week milestone —
realistically three to four. ATS conversion (Sprint 3) and bulk onboarding
(Sprint 4) both initialise leave balances owned by M8 (Sprint 5); proposal is to
emit a domain event and verify the leave clause in Sprint 5, **recording the
deferral rather than letting the AC look done**. M7 must land before M6 inside
Sprint 4.

**L8 · More absent status fields:** `Offer.status` has no `superseded` though
built PUB-04 renders it · `JobPosting` has no `status` · `HolidayCalendar` has
no `status` · PART C item 8 puts BGV under Recruitment while §8/O8 put it in
documents.


---


---

## M · Payroll cannot start without these

**M1 · The proration denominator is stated nowhere.** Calendar days, working
days, or fixed-26 — three different answers giving three different salaries for
the same absence.

> Every LOP figure, every mid-month joiner, every arrears recomputation and the
> whole golden-file baseline depend on it. **This is the first line of the
> payroll spec that should have existed.** Rule before Sprint 7 starts.

**M2 · Three holes that are one hole.** With **no off-cycle run in MVP**, none
of these has a payment path: an employee excluded from a run for bad bank
details; an exiting employee with an approved reimbursement claim; a leaver owed
arrears. Either off-cycle enters MVP or all three need a stated manual fallback.
"The school will sort it out" is what a payroll product exists to prevent.

**M3 · Reimbursement tax treatment must resolve against the employee's elected
regime**, or new-regime employees are under-deducted every month — a compounding
error that surfaces at Form 16.

**M4 · `ArrearAdjustment.recompute` is JSONB carrying money.** The likeliest
float vector in the product: JSON has no decimal type, so a `Decimal` through
JSONB and back is a float unless something deliberately stops it — and
`guard-money-float` will not catch it, because the column type is JSONB. Needs
an explicit serialisation rule.

**M5 · Extra-duty / overtime pay is blueprint-MVP with no entity**, and
`HonorariumRule` cannot serve it: exam invigilators are salaried CTC teachers,
not guest faculty.

## N · External realities that block a build

**N1 · Student-result linkage is MVP with no data source.** The exam system and
SIS are both P2 and no result entity exists. It can be descoped or given a
source; it cannot be built.

**N2 · Indian transactional SMS requires TRAI DLT template registration.** A
free-text template editor will violate it. Not something to discover at launch.

**N3 · LAN biometric devices cannot present a bearer token to a cloud tenant**,
so `M16 §Acceptance` is unimplementable as written. Needs an on-site agent or
pull-mode — this is the M16/M9 tension resolving into an architectural
requirement, not just a scheduling one.

## O · §6 is systematically thinner than the modules that read from it

Not five separate oversights — one finding about the specification. M6 has no
entities at all. M16 has no device, connection, outbox, webhook or ingestion
tables. M14 has no template, rule, `read_at` or dedupe key. M15 has no report or
DPDP entities. M15.1's category is an enum where its own rules need a
configurable object. M11 lacks five entities its own API exposes. Plus the
absent paid-days entity that both the attendance and payroll lanes found
independently.

Each spec proposes its tables. They need reviewing together, as one data-model
pass, rather than module by module.

**`reports_to` blocks four modules** (M8, M13, M14, M17) — the single
highest-fanout missing field in the model.

## P · The scope-change artefact does not contain the scope change

Two lanes read the 22 July ShriConnect deck independently.

- It **names loans, reimbursements and arrears nowhere** in 19 pages.
- It **contains no PAMS slide and no helpdesk slide**, and its pricing tiers
  list neither.

Those are the five capabilities the decisions log attributes to that meeting.
The 15 July product-definition PDF predates the change. **So the dev spec is the
only record of what was promised for the two largest ShriConnect modules.**

This is not an error in anyone's work — the meeting happened, the log records
its outcome. But the artefact cited as evidence does not contain the evidence,
and someone will eventually ask. Worth reconciling while the people who were in
the room still remember it.

Separately, the deck advertises **"AI anomaly checks"** that appear in no build
contract at all.

## Q · Documentation corrections awaiting a ruling — not applied

- Exec summary and competitor analysis still advertise student/parent 360° as MVP.
- Blueprint §2 line 55 tags offline capture `[P2]`, against its own PART B and
  `M13 §Business rules`.
- Blueprint §15 tags webhooks `[P2]`, against `M16 §Acceptance`.
- Blueprint §9 "Profile/document self-update [MVP]" (see K3) — the most
  dangerous of these, since it contradicts the governance model outright.


---

*Appended to as each planning lane reported. The per-story detail behind each item lived in the
TrackFlow tracker (sprint P1), which has since been removed from this project.*
