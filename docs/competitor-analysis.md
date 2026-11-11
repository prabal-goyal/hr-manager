# Competitor Analysis — HRMS Reference Products

Research basis for **Naveya** (the school HRMS). Four India-first HR platforms were studied for feature depth,
strengths, weaknesses, pricing, and fit for educational institutions. **Key takeaway: all four are
horizontal corporate HRMS with *no* education edition** — they handle staff back-office HR well but
model none of the academic-domain needs (substitution, academic-calendar leave, vacation-staff pay,
period-level attendance, timetable/SIS linkage). That gap is our product thesis.

---

## Side-by-side comparison

| Dimension | **Keka** | **Zoho People** | **greytHR** | **HROne** |
|---|---|---|---|---|
| Vendor | Keka Technologies (Hyderabad) | Zoho Corp | Greytip Software | HROne (Uneecops) |
| Positioning | All-in-one, design-led HRMS | Suite-integrated, low-cost HRMS | India payroll & compliance specialist | All-in-one India HCM, mobile-first |
| **Native payroll** | ✅ Strong, compliance-first | ❌ Needs separate **Zoho Payroll** | ✅ Deepest (30+ yrs) | ✅ Strong, zero-touch |
| India statutory (PF/ESI/PT/TDS/LWF) | ✅ ECR, 24Q, challans, signed F16 | Via Zoho Payroll | ✅ 24Q+FVU, signed F16/12BA, multi-state PT | ✅ Both TDS regimes, ECR, challans |
| **Native ATS** | ✅ Keka Hire (add-on) | ❌ Needs **Zoho Recruit** | ✅ greytHR Recruit (AI, Lisa bot) | ✅ (Enterprise tier) |
| Attendance modes | 8 modes, 200+ devices | Biometric, facial, geo/IP | Biometric, geo (Geotrack/fence), mobile | Geo-fence, selfie, biometric, **WhatsApp bot** |
| Performance/PMS | ✅ Mature (OKR, 360, calibration) | ✅ KRA/OKR/360 | Add-on (~₹35/user) | ✅ 9-box, succession |
| LMS | Keka Learn (add-on, staff) | ✅ Enterprise tier (staff) | ❌ (Academy = HR content only) | ✅ Staff training |
| Mobile app | Solid (lags web) | Native iOS/Android | Mobile-first, Bella bot | **Award-winning, 110+ tasks** |
| Multi-entity / multi-branch | ✅ Multi-legal-entity | Custom orgs | ✅ | ✅ Multi-legal-entity |
| Pricing model | ₹9,999–15,999/mo band (≤100 staff) + add-ons, setup fee, 18% GST | **$1.25–$4.50/user/mo** (5-user min); payroll/ATS separate | Per-user, India-focused, tiered | Base ₹4,950/mo (50 users) + ₹99+/user; 50-user min |
| Best-fit segment | Mid-market, adoption-sensitive | SMB / already-in-Zoho, budget | Compliance-heavy India payroll | 50–150 employees |
| Review avg | ~4.5 G2 | Value-leader, mixed UX | Strong on compliance | ~4.2–4.4 aggregate |

---

## Per-product notes

### Keka
- **Strengths:** Cleanest UI (low training overhead), true hire-to-retire integration, compliance-first
  payroll, very flexible attendance (8 modes / 200+ devices), mature performance module.
- **Weaknesses:** Limited customization for non-standard processes; support/turnaround complaints;
  mobile lags web; many high-value modules are paid add-ons; effective cost ~35–55% above headline
  (setup fee 2× monthly, 18% GST, quarterly minimum billing).
- **Education fit:** Has a dedicated Education industry page — fits staff shift-scheduling, leave→payroll,
  biometric campus attendance. No SIS/academic modules; Keka Learn is corporate training, not student LMS.

### Zoho People
- **Strengths:** Lowest cost/user, broad module coverage, deep Zoho-suite integration, highly
  customizable (no-code forms/workflows/custom apps), Zia AI, generous free tier (≤5 users).
- **Weaknesses:** Steep setup/learning curve ("feels like you need a developer"), cluttered DB-heavy UI,
  **no native payroll or ATS** (needs Zoho Payroll + Zoho Recruit), LMS & Helpdesk gated to Enterprise,
  weaker non-Zoho integrations.
- **Education fit:** Generic HR fit only; good for budget-conscious schools already in Zoho. Must pair
  with a school ERP/SIS. India statutory via Zoho Payroll.

### greytHR
- **Strengths:** **Deepest India payroll & statutory compliance** (Form 24Q + FVU validation, signed
  Form 16/12BA, multi-state PT, LWF, ECR, PayNow disbursement), 150+ admin/MIS registers, KYE staff
  dossier, mail-merge letters, strong mobile-first ESS.
- **Weaknesses:** PMS is a newer add-on (less mature); no embedded corporate LMS; doesn't sell biometric
  hardware (integrates only).
- **Education fit:** Compliance backbone maps well to schools/trusts; leave engine flexible (comp-off,
  maternity, sandwich/restricted holidays, leave-year-end). No academic modules.

### HROne
- **Strengths:** Deep India statutory out-of-box, 127 HR processes in one suite, **award-winning mobile
  app (110+ tasks, WhatsApp bot)**, budget-friendly transparent pricing, robust integrations
  (Tally/SAP/Oracle, 200+ biometric families, REST/webhooks), One AI voice agents.
- **Weaknesses:** Aggregate ratings more moderate than vendor claims; UI learning curve; mobile
  performance complaints; rigid/limited custom audit reports; advanced modules only in Enterprise tier;
  50-user minimum.
- **Education fit:** Generic back-office fit (attendance, payroll, leave, ESS, multi-entity for trusts).
  No substitute-teacher, credential tracking, tenure, or timetable/academic-calendar linkage. Must pair
  with a school ERP/SIS.

---

## Per-module capability matrix

Legend: ● native & strong · ◐ present / partial · ○ add-on or separate product · ✕ absent

| Module | Keka | Zoho People | greytHR | HROne | **Naveya (MVP)** |
|---|:--:|:--:|:--:|:--:|:--:|
| Core HR / HRIS | ● | ● | ● | ● | ● + education staff taxonomy |
| Multi-entity / multi-branch | ● | ◐ | ● | ● | ● group→trust→campus |
| Attendance (biometric/geo/selfie) | ● | ● | ● | ● | ● (+ half-day) |
| Period-level attendance | ✕ | ✕ | ✕ | ✕ | Phase 2 |
| Leave management | ● | ● | ● | ● | ● academic-calendar |
| Vacation-staff leave logic | ✕ | ✕ | ✕ | ✕ | ● |
| Payroll engine | ● | ○ (Zoho Payroll) | ● | ● | ● |
| Per-lecture honorarium payroll | ✕ | ✕ | ✕ | ✕ | ● |
| India statutory (PF/ESI/PT/TDS) | ● | ◐ | ● | ● | ● full parity |
| Signed Form 16 / 24Q / ECR | ● | ◐ | ● | ● | ● |
| Gratuity / bonus / LWF | ◐ | ◐ | ● | ● | ● |
| Full & Final settlement | ◐ | ◐ | ● | ● | ● |
| Substitute-teacher arrangement | ✕ | ✕ | ✕ | ✕ | Phase 2 (schema-ready) |
| Performance / appraisal | ● | ● | ○ | ● | **MVP** (education-shaped PAMS: classroom obs + result linkage + parent 360) |
| Recruitment / ATS | ○ | ○ | ● | ◐ | **MVP** (requisition→offer→convert) |
| HR-controlled document governance | ◐ | ◐ | ● | ◐ | ● MVP (request-gated employee updates) |
| LMS / training | ○ | ◐ | ✕ | ◐ | Later |
| Employee self-service + mobile | ● | ● | ● | ● | ● mobile-first |
| Expense & travel | ● | ○ | ● | ◐ | **MVP** reimbursements/FBP (travel Later) |
| Helpdesk / ticketing | ● | ◐ | ✕ | ◐ | **MVP** (categories, auto-assign, SLA/TAT, grievance) |
| Academic-system (SIS/timetable) integration | ✕ | ✕ | ✕ | ✕ | Phase 2 |

The empty column down the middle — period-level attendance, vacation-staff leave, honorarium payroll,
substitution, academic integration — is the product thesis in one view.

## What NONE of them do (our differentiation)

1. **Academic-calendar-driven leave** — leave cycles tied to session/term/vacation, not Jan–Dec.
2. **Vacation-staff vs non-vacation-staff logic** — teachers get vacation in lieu of EL; 12-month staff accrue EL. Drives both leave *and* pay.
3. **Period-level attendance & leave** — teacher present for 4 of 6 periods; half-day/period granularity.
4. **Substitute / relief-teacher arrangement** — auto-detect vacated periods from timetable, suggest cover, push duty, feed per-period honorarium to payroll. **No competitor has this.**
5. **Multi-scale education payroll** — parallel aided (govt/UGC pay-scale) + self-financed (management CTC) + per-lecture honorarium logic in one entity.
6. **Academic-system integration** — live SIS/timetable/exam/transport/hostel data as first-class inputs.
