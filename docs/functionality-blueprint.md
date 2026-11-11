<!-- Draft for scope finalization — v0.1, 2026-07-14 -->
<!-- Sources: research on Keka, Zoho People, greytHR, HROne + education-domain & India-statutory analysis. See competitor-analysis.md -->

> **Status: DRAFT for review.** This document lists candidate functionalities for the school HRMS, tagged MVP / Phase 2 / Later. We finalize this scope *before* writing the full technical spec. Open decisions are collected in `decisions-to-finalize.md`.

# Naveya — HRMS for Indian Educational Institutions — Functionality Blueprint

> **Naveya** (*nava* "new" + *nāv* "vessel / to navigate" → "a new vessel that carries a school's people
> forward") — a Voxturr Labs product built in collaboration with **ShriConnect** (technology arm of The Shri
> Ram Schools group). Tagline: *Naveya — AI-powered HRMS, built by schools, for schools.*

This blueprint defines the build scope as a set of modules. Each functionality is tagged **[MVP]** (v1), **[P2]** (Phase 2), or **[Later]**. Education-specific and India-statutory items are called out with **★** where they are the product's competitive differentiators — the things generic HRMS (Keka, Zoho People, greytHR, HROne) do NOT do.

Priority legend guiding the tagging:
- **MVP** = required to run a school's staff HR, attendance, leave and compliant payroll for at least one campus, plus the minimum education-specific hooks (academic calendar, substitution, vacation-staff leave) that make this product not-a-generic-HRMS on day one.
- **P2** = strengthens differentiation and multi-branch/group scale.
- **Later** = mature-market or nice-to-have.

---

## PART A — CORE PLATFORM MODULES

### 1. Core HR / HRIS (System of Record)
**Purpose:** Single source of truth for all staff data, org structure, and documents that feeds attendance, leave, payroll, substitution and compliance.

- Centralized employee master (personal, job, statutory IDs — PAN/Aadhaar/UAN/ESIC/bank) **[MVP]**
- Configurable custom fields and staff-data structures **[MVP]**
- **★ Staff-type taxonomy specific to education** (permanent PRT/TGT/PGT; contract/probationary; visiting/guest per-lecture; substitute/relief; part-time specialist — music/sports/dance; pre-primary NTT + helpers/ayahs; Class-IV support; transport; hostel; medical/counselling; coaching star-faculty; aided vs self-financed) **[MVP]**
- Org tree / reporting hierarchy and org chart **[MVP]**
- **★ Group→Trust/Society→Campus→Department hierarchy** (multi-branch school group as first-class model, not just multi-location) **[MVP]**
- Document repository (contracts, IDs, policies) with access control **[MVP]**
- **★ HR-controlled document governance** — HR/admin uploads employee documents captured at enrollment; **the employee cannot self-update documents.** Any change happens only through an **HR-initiated update request**, to which the employee responds by uploading; HR then **verifies/approves**. Every document has a verification status and full audit trail **[MVP]**
- **★ Digital service book / faculty dossier** — degrees, B.Ed, TET/CTET/NET/SET, experience certificates, police/background verification **[MVP]**
- **★ Document-expiry alerts** — driver licences + medical fitness (transport), contract end dates (guest/contract faculty), foreign-faculty visas, background-verification validity **[MVP]**
- Confirmation / transfer / promotion / separation lifecycle tracking **[MVP]**
- Asset management and allocation (issue/return, linked to onboarding & exit) **[P2]**
- Letters & templates with mail-merge (offer, appointment, confirmation, salary revision, relieving) **[P2]**
- **★ Qualification-to-post eligibility validation** (PRT/TGT/PGT/Principal norms; TET/NET eligibility) **[P2]**
- **★ Pupil–teacher ratio & sanctioned-post tracking** for affiliation compliance **[P2]**
- **★ Inspection-ready staff registers & affiliation-report exports** (CBSE bye-laws / NCTE / state board / UGC-AICTE) **[Later]**
- Announcements, directory, policy distribution & digital acknowledgement **[P2]**
- Multi-legal-entity support under one tenant **[P2]**

**Who does it well:** greytHR (KYE dossier, letters, 150+ registers), HROne (InboxforHR, multi-entity, digital letter ack), Keka (clean master data). *None* model the education staff taxonomy, service book, PTR or affiliation registers — that is our differentiator.

---

### 2. Staff Attendance & Time Capture
**Purpose:** Tamper-proof, multi-mode attendance across scattered campuses, gates and vehicles, converted directly into payroll (LOP), leave and substitution.

- Biometric device integration (fingerprint/RFID) via push/pull API **[MVP]**
- Web/portal and mobile app punch **[MVP]**
- GPS geo-tagging + geo-fencing (enter/exit) + selfie/photo capture (anti-proxy) **[MVP]**
- Facial recognition **[P2]**
- Offline attendance capture (poor-connectivity campuses) **[P2]**
- Shift & roster management — fixed, rotating, split, flexi, weekend — for hostel/transport/security/mess staff **[MVP]**
- Auto shift allowances **[P2]**
- Attendance policies: late-coming, early-going, exceptions, weekend/holiday rules **[MVP]**
- Regularization workflow (with bulk approvals) **[MVP]**
- **★ Half-day AND period-level attendance** (teacher present for 4 of 6 periods, not just full-day) **[MVP]**
- **★ Timetable-linked / period-wise & subject-wise attendance** mapped to teaching workload **[P2]**
- Overtime / extra-duty auto-calculation with configurable rates **[P2]**
- Auto paid-days calculation reconciling attendance + leave + OT + holidays + weekly-offs **[MVP]**
- **★ Multi-campus consolidated attendance** for group institutions **[MVP]**
- WhatsApp-bot / Teams punch **[Later]**

**Who does it well:** Keka (8 modes, 200+ devices), HROne (WhatsApp bot, real-time push API, geo-fence alerts), greytHR (Geotrack/Geomark/Geofence), Zoho (facial + IP/geo). Generic tools give full-day swipe logs only; **period-level and timetable-linked attendance is our gap-fill**.

---

### 3. Leave Management (Academic-Calendar-Driven) ★
**Purpose:** Leave governed by the academic year/term/vacation/exam structure, not the Jan–Dec corporate calendar. This is one of the sharpest generic-HRMS gaps.

- Configurable leave types: EL/PL, CL, SL, Comp-off, Maternity, LOP **[MVP]**
- **★ Education-specific types**: duty/on-duty leave (exam duty, invigilation, training, escort/competition), study leave, sabbatical, paternity/bereavement/marriage **[MVP]**
- **★ Academic-year leave cycle** (Apr–Mar / session-based) with term & vacation calendars **[MVP]**
- **★ Vacation-staff vs non-vacation-staff rules** — teachers get vacation in lieu of EL (EL doesn't accrue or accrues at reduced rate); non-teaching 12-month staff accrue EL **[MVP]**
- **★ Forced vacation-leave during breaks** and vacation-period pay handling **[MVP]**
- **★ Blackout / restricted-leave windows** around exams, admissions, result declaration **[MVP]**
- **★ Half-day and period-level leave** application **[MVP]**
- Accrual, carry-forward caps, encashment, pro-ration rules per type **[MVP]**
- Probation/seniority-based accrual & grant rules **[P2]**
- Multi-level approval workflows with escalation **[MVP]**
- Location/campus-specific holiday calendars (National & Festival Holidays Act minimums) **[MVP]**
- **★ Leave→substitution linkage** (approved leave triggers period-coverage need) **[MVP]**
- **★ Leave→LOP auto-calculation** into payroll **[MVP]**
- Compensatory-off for holiday/weekend work (admissions, annual day, exams) **[MVP]**
- Leave-year-end process (close, carry-forward, new-year grant, encashment) **[P2]**
- Restricted & floating holidays, sandwich-leave policy **[P2]**
- Team/org leave calendar for managers **[P2]**
- Continuous-service tracking (gratuity 5-yr, maternity 80-day) integrated with leave/attendance ledger **[P2]**

**Who does it well:** greytHR & HROne (configurable engines, comp-off, sandwich/restricted-holiday, leave-year-end), Keka (highly configurable). **None model academic-year cycle, vacation-staff distinction, exam blackout, or period-level leave** — core differentiator.

---

### 4. Payroll Engine — Multi-Scale Education Payroll ★
**Purpose:** Run several pay logics simultaneously (government/UGC pay-scale + management CTC + per-lecture honoraria) with full Indian statutory compliance. This and Module 5 are the product's non-negotiable strengths.

- Configurable salary structures / CTC templates (Basic, DA, HRA, conveyance, special, academic/research allowance) — formula or flat **[MVP]**
- **★ New Labour Code compliance**: enforce excluded allowances ≤ 50% of total wages (raises PF/gratuity/bonus base) **[MVP]**
- **★ Parallel pay groups under one entity**: aided (govt) vs self-financed (management) vs contract **[MVP]**
- **★ 7th/8th Pay Commission & UGC pay-band/grade-pay structures** with pay-matrix, auto DA, annual increment progression **[P2]** (MVP if targeting aided institutions)
- **★ Per-lecture / per-hour / per-period honorarium engine** for visiting/guest/substitute faculty with monthly caps (e.g. UGC ₹1,500/lecture, ~₹50k cap) **[MVP]**
- **★ Arrears & retrospective pay-revision** processing (DA/VDA revisions, pay-commission arrears) with auto PF/ESI/TDS recompute and month-splitting **[MVP]** *(ShriConnect scope, 2026-07-22)*
- Effective-dated salary revisions & increment cycles tied to academic year / DOJ / confirmation **[MVP]**
- Attendance/LOP integration & proration (mid-month join/leave, unpaid leave, part-month contract) **[MVP]**
- **★ Overtime & extra-duty pay**: exam duty, extra classes, hostel-warden duty — configurable rates **[MVP]**
- Loans & advances with EMI schedules, interest/perquisite, auto-deduction, closure on exit **[MVP]** *(ShriConnect scope, 2026-07-22)*
- Reimbursements / FBP (LTA, medical, telephone, books/academic allowance, fuel) with tax treatment **[MVP]** *(ShriConnect scope, 2026-07-22)*
- Investment declaration & proof workflow (old vs new regime election) **[MVP]**
- **★ Perquisite valuation** — rent-free/concessional accommodation for teachers, transport **[P2]**
- Off-cycle / supplementary / bonus-ex-gratia / arrears-only runs **[P2]**
- Single-click payroll **computation** across all pay groups with exception/variance auto-detection **[MVP]** — **release/disbursement always requires a distinct checker (maker-checker); it is never one click** *(wording corrected 2026-08-11: the earlier "single-click payroll run" contradicted the maker-checker non-negotiable and DESIGN.md principle 10)*
- Bank transfer / NEFT salary file generation (bank-wise/batch-wise) **[MVP]**
- Payslip generation (password-protected) + ESS download **[MVP]**
- **★ Full & Final Settlement engine**: final salary, leave encashment (§10(10AA)), gratuity, notice pay/recovery, loan recovery, ex-gratia, TDS true-up **[P2]**
- Accounting JV/GL journal generation; Tally/SAP/Oracle export with pay-head→ledger→cost-centre mapping **[P2]**
- **★ Multi-branch/multi-state payroll** with location-wise statutory profiles **[P2]**
- Year-end: Form 16 generation, proof reconciliation, leave carry-forward **[MVP for Form 16; rest P2]**

**Who does it well:** greytHR (30+ yrs, unlimited components, disbursement), Keka (compliance-first, ECR/24Q/challans/Form 16), HROne (zero-touch, both TDS regimes, 3D analytics). **None run parallel UGC-pay-scale + honorarium + management-CTC logic in one entity, nor per-lecture caps** — key differentiator.

---

### 5. India Statutory Compliance & Filing ★
**Purpose:** Deep, configurable, always-current Indian statutory computation and government-portal filing. Charitable/12A status does NOT exempt these — schools must comply.

**Computation (all MVP):**
- **EPF** — 12% EE; ER 3.67% EPF + 8.33% EPS + ~0.50% EDLI + ~0.50% admin; wage ceiling **configurable** (₹15k → future ₹21k/25k per Jan-2026 SC direction); EPS cap ₹1,250; VPF; Code-on-Social-Security wage-base (excluded allowances ≤50%) **[MVP]**
- **ESI** — 0.75% EE + 3.25% ER on gross; ceiling ₹21k (₹25k for disability); Apr–Sep / Oct–Mar contribution periods with mid-period continuation rule **[MVP]**
- **Professional Tax** — state-configurable slabs & frequency (MH/KA monthly, TN/Kerala half-yearly, WB annual); PTEC + PTRC; not levied in Delhi/UP/Haryana/Rajasthan **[MVP]**
- **TDS on Salary (§192)** — new regime default (FY25-26 slabs, ₹75k std deduction) + old regime; perquisites; monthly challan (ITNS 281) **[MVP]**
- **Gratuity** — 15 × (Basic+DA) × years / 26; ₹20L exempt; **teachers covered** (2009 amendment, SC 2022); continuous-service tracking; provisioning **[P2]**
- **Statutory Bonus** — 8.33–20%, ₹7k calc cap, ₹21k eligibility; **★ note educational-institution exemption (§32)** — support ex-gratia/festival bonus even where statutory bonus doesn't apply **[MVP]** *(ShriConnect scope, 2026-07-22)*
- **LWF** — state- and frequency-aware (half-yearly/annual/monthly) contributions **[P2]**
- **Minimum Wages** — validate gross/components vs current state notification + VDA by category/zone **[P2]**
- **Maternity Benefit** — 26 weeks (12 from 3rd child), 80-day eligibility, crèche obligation flag at 50+ staff **[MVP]**

**Filing & Reports (statutory config keeps everything configurable):**
- EPF monthly **ECR** upload + challan; UAN gen/KYC; Form 5/10 (joiners/leavers); Form 3A/6A; exit 19/10C/10D **[MVP for ECR+challan; rest P2]**
- ESI monthly challan/return; IP registration/TIC; half-yearly returns **[MVP]**
- PT state-wise challans/returns (Form IIIB etc.) **[MVP]**
- TDS quarterly **Form 24Q** (Annex I each Q; II & III in Q4) via RPU/FVU; **Form 16 Part A (TRACES) + Part B**; Form 12BA perquisites **[MVP]**
- **★ Digitally signed Form 16 & Form 12BA** **[P2]**
- LWF state-wise challans/returns **[P2]**
- Gratuity computation statement + Form F (nomination) + actuarial/provision report **[P2]**
- Bonus Form C/D + ex-gratia registers **[Later]**
- Labour-Code registers: consolidated wage register, muster roll, loans/fines/deductions, leave register (Code-on-Wages/OSH formats) **[P2]**
- Reconciliation reports (PF/ESI/PT/TDS payable vs paid); statutory liability provisioning **[MVP]**
- **★ Trust/society audit reports** — 12A/10(23C) charitable-status, Form 10B/10BB inputs, CTC-vs-actual, headcount **[P2]**
- **★ Configurable statutory rule-set with auto-updates & alerts** (ceilings, slabs, Labour-Code effective dates by state) — architected as a versioned config layer from day one **[MVP as architecture; auto-feed P2]**

**Who does it well:** greytHR (Form 24Q + FVU validation, signed Form 16/12BA, multi-state PT, LWF, ECR — deepest), Keka & HROne (strong, both TDS regimes, ECR/challans). We match these AND add trust/charitable-audit + pay-commission-aware bases.

---

### 6. ★ Substitute / Relief Teacher Management (EDUCATION-UNIQUE)
**Purpose:** Teacher absence is a daily safety/supervision event; generic HRMS records the leave but never arranges cover. This module is arguably the single most differentiating feature — **no competitor has it**.

- **★ Auto-detection of vacated periods** from approved leave + live timetable **[MVP]**
- **★ Smart substitute suggestion** ranked by subject expertise, free periods, current workload, fairness/rotation history **[MVP]**
- **★ Daily substitution board / arrangement register** pushed to staff mobile app **[MVP]**
- **★ Per-period / per-day substitution honorarium auto-fed to payroll** **[MVP]**
- **★ Coverage-load tracking** so the same teachers aren't repeatedly burdened **[P2]**
- Manual override & swap requests **[MVP]**
- Substitution analytics (most-substituted subjects/teachers, cost) **[Later]**

**Who does it well:** *No competitor.* Requires timetable integration (Module 14) — the reason academic-system integration is a first-class concern.

---

### 7. ★ Teaching Load / Workload Management (EDUCATION-UNIQUE)
**Purpose:** A teacher's presence and pay tie to periods taught and prescribed teaching-hour norms (e.g. CBSE ~1200 hrs/yr) — a generic time-clock cannot capture this.

- **★ Periods-per-week / per-day load per teacher** with min–max target ranges **[P2]**
- **★ Subject–class–section allocation** and workload balancing across faculty **[P2]**
- **★ Free-period & non-teaching-duty visibility** for fair distribution **[P2]**
- **★ Overload / extra-period tracking → extra-remuneration in payroll** **[P2]**
- **★ Compliance reporting vs mandated teaching-hour norms** **[Later]**

**Who does it well:** *No competitor.* Consumes timetable/SIS data.

---

### 8. Onboarding & Offboarding (Seasonal/Academic)
**Purpose:** Joiner–mover–leaver lifecycle tuned to seasonal, admissions-driven, academic-year-contract hiring.

- Digital pre-boarding with secure document-upload links **[MVP]**
- Onboarding workflows, task checklists, induction **[MVP]**
- **★ Bulk/seasonal onboarding** with fixed academic-year contracts + auto-expiry **[MVP]**
- **★ Admissions-season temp staff** (counsellors, tele-callers, exam invigilators) **[P2]**
- **★ Mass renewal / non-renewal workflow at session end** **[MVP]**
- Confirmation & probation tracking **[MVP]**
- Buddy assignment **[Later]**
- Inter-branch transfer with service continuity (see Module 12) **[P2]**
- Exit/offboarding: clearance checklist, class handover, F&F linkage, access revocation, exit interview **[P2]**
- E-signature on offer/appointment/relieving letters **[P2]**

**Who does it well:** HROne & greytHR (checklists, F&F linkage, pre-boarding links), Keka (ATS→onboarding). Seasonal bulk/academic-contract auto-expiry is our add.

---

### 9. Employee Self-Service (ESS) & Staff Mobile App
**Purpose:** Phone-first for a classroom-bound, campus-scattered workforce that is rarely at a desk. Mobile is not optional — it's primary.

- Mobile leave apply/approve + balance view **[MVP]**
- Attendance mark-in (geo/selfie) + regularization on mobile **[MVP]**
- Payslip, Form 16, tax-slip self-download **[MVP]**
- Investment declaration + proof upload **[MVP]**
- **★ Daily substitution/arrangement duty notifications** **[MVP]**
- **★ Timetable view on the same app used for academics** **[P2]**
- Profile/document self-update **[MVP]**
- Circular/notice + document-request workflows **[P2]**
- Manager self-service (approvals, team views) **[MVP]**
- Native iOS/Android apps **[MVP]**
- HR chatbot (Bella/Zia/One-AI style) **[Later]**
- WhatsApp/Teams bot actions **[Later]**

**Who does it well:** HROne (110+ tasks, award-winning app), greytHR (mobile-first ESS, Bella), Keka & Zoho (solid apps). Substitution-duty push notification is education-specific.

---

### 10. Faculty Performance Appraisal & Professional Development ★ — **NOW MVP (ShriConnect scope, 2026-07-22)**
**Purpose:** Education appraisal uses classroom observation, student/parent feedback, result linkage and UGC API scoring — not corporate KRA/OKR. **PAMS is one of ShriConnect's five headline modules, so the appraisal baseline is pulled into MVP;** the deepest college-specific extras stay later.

- Standard goal-setting / KRA-KPI, self/manager review, 360-degree feedback (corporate baseline) **[MVP]**
- Configurable review/appraisal cycles (term/annual) with rating matrix **[MVP]**
- Confirmation/promotion/increment & pay-scale-progression recommendations **[MVP]**
- Performance reports & department-wise performance tracking **[MVP]**
- **★ Classroom-observation & peer-review workflows** **[MVP]**
- **★ Student result / outcome linkage** into appraisal **[MVP]**
- **★ Student/parent 360-degree feedback** **[Later]** *(demoted from MVP 2026-08-11: Naveya has no student or parent role — the seven seed roles in `development-specification.md` M2 are Group Admin, Campus Principal, HR Operator, Payroll Operator, Accountant, Department Head, Employee. Collecting this would require minor-facing accounts with verifiable parental consent under DPDP. `AppraisalRating.source` keeps the `student`/`parent` enum values so such ratings could arrive via SIS import later; MVP writes only `self`/`manager`/`peer`.)*
- **★ CPD / in-service training-hours tracking & certification** **[P2]**
- **★ UGC API / academic self-appraisal scoring** for college faculty **[Later]**

**Who does it well:** Keka (mature OKR/360/calibration), HROne (9-box/succession), Zoho & greytHR (appraisal cycles). All corporate-shaped; **classroom observation, result-linkage, parent 360, UGC API are our differentiators.**

---

### 11. Recruitment / ATS  ✅ **NOW MVP (scope change 2026-07-15)**
**Purpose:** Hiring teaching and admin staff, with seasonal surges and mandated-qualification screening. **Promoted into Phase 1** — the hire-to-onboard pipeline feeds Core HR directly, so building it in MVP avoids double data entry and gives a complete joiner journey from day one.

- Requisition with budget-based approval routing **[MVP]**
- Career portal + job posting/syndication **[MVP]**
- Resume capture & candidate pipeline (stages, kanban) **[MVP]**
- **★ Qualification/eligibility screening** (TET/CTET/NET/B.Ed) at shortlist **[MVP]**
- Interview scheduling + structured feedback/scorecards **[MVP]**
- Offer letter with CTC calculator + digital acceptance **[MVP]**
- **★ Candidate→Employee auto-conversion** (carries captured documents into the staff record) **[MVP]**
- Background/police verification tracking (child-safety mandate) **[MVP]**
- Resume parsing (AI) **[P2]**
- Recruitment analytics (time-to-hire, source, funnel) **[P2]**
- **★ Coaching-centre commission/incentive-linked faculty & counsellor pay** hooks **[Later]**

**Who does it well:** HROne (BGV vendors, requisition budgets), greytHR Recruit (AI parsing, Lisa bot), Keka Hire. All are add-ons; we bundle qualification-screening and make candidate→employee conversion carry documents into the new document-governance model (Module 1).

---

### 12. ★ Multi-Branch / Trust Group Consolidation (EDUCATION-UNIQUE FRAMING)
**Purpose:** School groups/societies/trusts run many campuses under one entity needing centralized policy with campus-level control — a single-company HRMS can't model this.

- **★ Group→campus hierarchy** with centralized policy + localized execution **[MVP]**
- **★ Inter-branch employee transfer** with service continuity & pay carry-over **[P2]**
- **★ Consolidated cross-campus payroll, PF/ESI & compliance reporting** **[P2]**
- **★ Trust/society-aligned (12A/80G) fund & academic-year accounting integration** **[P2]**
- **★ Campus-wise + group-wide leadership dashboards** **[P2]**
- Aided vs self-financed dual-regime reporting within one campus **[P2]**

**Who does it well:** Keka/HROne (multi-legal-entity/multi-location) partially. The **trust-group hierarchy + service-continuity transfers + 12A/80G accounting** framing is ours.

---

### 13. Expense, Reimbursement & Travel
**Purpose:** Policy-driven claims linked to payroll.

- Mobile expense/claim submission with receipt upload **[MVP]** *(ShriConnect scope, 2026-07-22)*
- Configurable expense policies by category/role **[MVP]** *(ShriConnect scope, 2026-07-22)*
- Multi-level approval workflows **[MVP]** *(ShriConnect scope, 2026-07-22)*
- Reimbursement payout via payroll **[MVP]** *(ShriConnect scope, 2026-07-22)*
- Travel request → expense auto-pull **[Later]**
- Mileage/distance reimbursement for transport/field staff **[Later]**

**Who does it well:** Keka (OCR, travel desk), HROne, greytHR (payroll-integrated claims), Zoho (via Zoho Expense).

---

### 14. ★ Academic-System Integration Layer (STRATEGIC)
**Purpose:** The HRMS must not live in a silo — substitution, workload, exam duty and attendance depend on live academic data. This is what turns four generic-HRMS gaps into features.

- **★ School ERP / SIS connector** (Fedena, Teachmint, myClassCampus, Entab, MasterSoft, edumerge) — staff master, class-section-subject structure, academic calendar **[P2, but design API from MVP]**
- **★ Timetable/scheduling engine integration** — derive teaching load, free periods, exact periods needing substitution **[P2]** (MVP-critical if substitution ships in v1 — minimum: import timetable)
- **★ Examination/result system** — exam-duty (invigilation/evaluation) allocation, duty-leave, honorarium, result-linked appraisal **[P2]**
- **★ Transport/fleet** — driver-conductor rostering, route duty, licence/medical-fitness expiry **[P2]**
- **★ Hostel/boarding** — warden/matron/mess shift rosters **[P2]**
- **★ Admissions/CRM** — trigger seasonal hiring & counsellor incentive pay **[Later]**
- LMS/digital classroom — correlate online-class hours with workload/appraisal **[Later]**
- Government/regulatory portals — CBSE/ICSE/state affiliation, UGC/AICTE, aided-school treasury/DDO **[Later]**

**Who does it well:** *No generic HRMS integrates academic systems* — this is the entire product thesis.

---

### 15. Supporting Modules (Analytics, Helpdesk, Engagement, Workflows, Integrations, Documents)

**HR Analytics & Reporting**
- Standard payroll/attendance/leave/compliance reports (audit-ready) **[MVP]**
- Campus-wise & group dashboards (headcount, attrition, payroll cost, statutory liability) **[P2]**
- Custom report/query builder **[P2]**
- **★ PTR, teaching-hour-norm, sanctioned-post compliance reports** **[P2]**

**HR Helpdesk / Ticketing** — **NOW MVP (ShriConnect scope, 2026-07-22)**
- Ticket categories, auto-assignment, SLA/TAT tracking, grievance handling **[MVP]**

**Engagement & Surveys**
- Pulse/eNPS surveys, recognition/badges, bulletin board, birthday/anniversary greetings **[Later]**

**Workflows & Automation**
- Configurable multi-level approval chains across leave/attendance/payroll/expense/regularization **[MVP]**
- Rule-based routing, notifications, escalations **[MVP]**
- Payroll scheduler, auto-regularization, leave-accrual automation **[P2]**

**Integrations & API**
- Biometric device families (ZKTeco/eSSL/Matrix/Realtime/Spectra) **[MVP]**
- Tally / accounting export **[P2]**
- Open REST API + webhooks **[P2]**
- SMS/WhatsApp/email communication layer (leave approvals, substitution alerts, payslips, circulars) **[MVP for SMS/email; WhatsApp P2]**
- SSO/SAML, Aadhaar AGBAS **[Later]**

**LMS / Staff Training** — staff CPD/in-service training management (not student LMS) **[Later]**

**Who does it well:** greytHR (150+ reports, Tally/Zoho Books), HROne (Tally/SAP/Oracle, 200+ devices, REST), Keka (marketplace), Zoho (suite integration).

---

## PART B — CROSS-CUTTING CONCERNS

**1. Roles/Permissions & Multi-Branch Hierarchy**
- RBAC with role- and department-based data-visibility rules **[MVP]**
- **★ Scoped access by group/trust/campus level** — group admin, campus principal, department head, HR/payroll operator, accountant, employee, manager **[MVP]**
- Field-level PII visibility rules (bank/PAN/Aadhaar/salary) **[MVP]**
- Aided-vs-self-financed data-segment permissions **[P2]**
- Maker-checker on payroll & statutory runs (and reimbursement/arrears/bonus finalization) **[MVP]** *(binding non-negotiable; corrected from stale P2 tag 2026-07-22)*
- **Full & Final settlement maker-checker is CONFIGURABLE per tenant** — F&F may legitimately be completed by a single person **[MVP]** *(product decision 2026-08-11; does NOT relax the mandatory distinct-checker requirement on payroll release, bank file, statutory filing, reimbursement payout batches, arrears posting or bonus runs)*

**2. Employee Lifecycle States**
- Pre-boarding → Onboarding → Probation → Confirmed → Active → On-leave/Sabbatical → Transferred → Notice → Exited/Relieved → F&F-closed **[MVP]**
- **★ Contract/visiting states with auto-expiry** and mass renewal/non-renewal at session end **[MVP]**
- **★ Vacation-staff vs non-vacation-staff attribute** driving leave/pay behavior **[MVP]**
- Service-continuity flag across inter-branch transfers **[P2]**

**3. Mobile / ESS** — phone-first is primary UI (see Module 9); offline tolerance for weak-connectivity campuses **[MVP]**

**4. Notifications** — multi-channel (in-app, push, SMS, email; WhatsApp later): approvals, substitution duty, document-expiry alerts, statutory due-dates, payslip release, contract expiry **[MVP for core channels]**

**5. Audit & Traceability** — immutable audit log on payroll runs, statutory filings, master-data changes, approvals; versioned statutory-config history; who-changed-what-when **[MVP for payroll/statutory; full P2]**

**6. Data Security & PII** — encryption at rest/in transit; password-protected payslips/Form 16; PII field-masking; consent & retention aligned to DPDP Act; **★ child-safety context** (background-verification records, restricted access to staff-of-minors data); role-scoped exports **[MVP]**

**7. Integrations** — architected around a stable internal staff/attendance/timetable API so SIS, biometric, timetable, payroll-accounting and communication connectors plug in without core changes **[MVP as architecture]**

---

## PART C — RECOMMENDED MVP SCOPE SUMMARY

**Thesis for v1:** Ship a *compliant Indian staff-payroll HRMS that is unmistakably built for schools* — i.e. match greytHR/Keka on statutory payroll for one-to-few campuses, and lead with the four education gaps competitors cannot close: academic-calendar leave, vacation-staff logic, period-level attendance/leave, and substitute-teacher arrangement.

**MVP MUST include:**
1. **Core HR** — staff master with **education staff-type taxonomy**, group→trust→campus hierarchy, service book, **document-expiry alerts**, and **HR-controlled document governance** (HR uploads at enrollment; employee updates only via an HR-initiated request → HR verification; no self-update).
2. **Attendance** — biometric + geo/selfie mobile, shifts/rosters, **half-day & period-level**, regularization, auto paid-days, multi-campus consolidation.
3. **Leave** — **academic-year cycle, vacation vs non-vacation staff, exam/admission blackouts, period-level leave, leave→substitution & leave→LOP linkage**, education leave types, holiday calendars, approvals.
4. **Payroll** — configurable structures with **50%-allowance Labour-Code rule, parallel pay groups (aided/self-financed/contract), per-lecture honorarium engine with caps**, LOP proration, extra-duty pay, investment declaration, single-click run with variance detection, bank file, payslips, Form 16, **plus (ShriConnect scope) loans & advances, reimbursements/FBP, arrears & retrospective pay-revision, and statutory/ex-gratia bonus**.
5. **Statutory — FULL greytHR parity (locked D3):** PF (ECR + challan, configurable ceiling), ESI, PT (state-configurable), TDS §192 (both regimes) + **Form 24Q eTDS returns + Form 16 (Part A & B) + Form 12BA, digitally signed**, **gratuity (with continuous-service tracking), statutory bonus, LWF, minimum-wage validation**, Maternity; reconciliation & liability-provisioning reports; **versioned statutory-config layer**.
6. **Full & Final Settlement engine** — MVP-coupled to full statutory parity: final salary, **leave encashment (§10(10AA)), gratuity payout**, notice pay/recovery, loan recovery, TDS true-up.
7. **Onboarding** — with **seasonal bulk + academic-year contract auto-expiry + session-end renewal**.
8. **Recruitment / ATS** *(promoted to MVP, 2026-07-15)* — requisition + approval, job posting/career page, candidate pipeline, **qualification/eligibility screening**, interview scheduling + scorecards, offer + digital acceptance, **candidate→employee conversion carrying documents into HR-governed storage**, BGV/police-verification tracking.
9. **ESS & mobile app** — leave, attendance, payslip/Form 16, investment declaration, manager approvals, **and responding to HR document-update requests** (no unilateral self-update). (Substitution-duty notifications move to Phase 2.)
10. **Cross-cutting** — RBAC with campus-scoped access, lifecycle states (incl. contract auto-expiry & vacation-staff attribute), multi-channel notifications, payroll/statutory audit log, PII security, biometric + SMS/email integration APIs.
11. **Performance Appraisal / PAMS** *(ShriConnect scope, 2026-07-22)* — goal/KRA-KPI, self & manager review, 360-degree feedback, appraisal cycles + rating matrix, increment/promotion recommendations, performance reports & department-wise tracking, plus education extras (classroom observation, peer review, student-**result**/outcome linkage). *Student/parent 360° feedback is **Later** — see Module 10.*
12. **HR Helpdesk** *(ShriConnect scope, 2026-07-22)* — ticket categories, auto-assignment, SLA/TAT tracking, grievance handling, raised from ESS/mobile.

> **Locked-scope deltas:** *(2026-07-14)* Multi-branch **group→trust→campus hierarchy is IN MVP** (D1: multi-location K-12). **Substitute-teacher management is DEFERRED to Phase 2** (D2) — and with it **period-wise attendance/leave, timetable import, and teaching-load/workload**. Half-day granularity stays MVP. Full statutory parity + F&F are pulled INTO MVP (D3). *(2026-07-15)* **Recruitment/ATS is promoted INTO MVP**; **HR-controlled document governance** (HR-upload + request-gated employee updates) is added to Core HR/ESS. *(2026-07-22 — ShriConnect collaboration alignment)* Five modules from ShriConnect's partner feature set are pulled **INTO MVP**: **(1) Performance Appraisal / PAMS** (corporate baseline + classroom-observation/peer-review/result-linkage; UGC-API & CPD stay later; **student/parent-360 demoted back to Later on 2026-08-11 — no student/parent role exists**), **(2) Loans & Advances**, **(3) Reimbursements / FBP + ESS claims**, **(4) Arrears & retrospective pay-revision + statutory/ex-gratia Bonus**, **(5) HR Helpdesk / ticketing & grievance**.

**Explicitly DEFERRED from MVP (Phase 2):** **★ substitute-teacher management, period-level attendance/leave, timetable import, teaching-load balancing** (D2); full pay-commission/UGC pay-matrix engine; AI resume parsing & recruitment analytics *(core ATS is now MVP)*; travel-request/mileage *(expense & reimbursement claims are now MVP; travel stays P2)*; CPD/in-service training tracking; inter-branch transfers with service continuity; deep SIS/exam/transport/hostel integrations; trust 12A/80G accounting; custom report builder. *(Removed from this list on 2026-07-22 — now MVP: arrears/retro pay-revision, faculty appraisal/PAMS baseline, loans & advances, reimbursements, HR helpdesk.)*

**Later:** UGC API scoring, affiliation-inspection exports, engagement/surveys, staff LMS/CPD, WhatsApp bot, admissions/CRM & govt-portal integrations, AI assistants.

**Guiding build principles:**
- Keep **all statutory bases, ceilings, slabs and effective dates configurable/versioned** from day one — the Code on Social Security (in force 21-Nov-2025), the pending PF-ceiling revision, and state-wise PT/LWF/min-wage variance make hard-coding fatal.
- Design the **timetable/SIS/attendance internal API before** substitution and workload — those education features are worthless without live academic data.
- Treat **mobile as the primary client**, not a companion — the teaching workforce is classroom-bound and desk-less.
- The **vacation-staff vs non-vacation-staff attribute and the academic-year calendar are foundational data model decisions** that ripple through leave, attendance and payroll — get them into the schema at MVP, not bolted on later.
