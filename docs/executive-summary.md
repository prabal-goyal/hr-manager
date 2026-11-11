# Executive Summary — Naveya

> **Naveya** — *nava* (new) + *nāv* (vessel / to navigate): "a new vessel that carries a school's people
> forward." Tagline: **"Naveya — AI-powered HRMS, built by schools, for schools."** Built by **Voxturr
> Labs** in collaboration with **ShriConnect**, the technology arm of The Shri Ram Schools group.

## The opportunity

Every school and college in India runs on staff — teachers, administrators, support and transport
personnel — yet the HR and payroll software they use is built for corporate offices, not classrooms.
The market leaders (**Keka, Zoho People, greytHR, HROne**) are capable corporate platforms that schools
*adapt to*, working around the mismatch between a corporate calendar and an academic one, between office
staff and teaching staff, between a monthly salary and a per-lecture honorarium.

We are building **Naveya**, an **HRMS purpose-built for Indian educational institutions** — starting with
**private, multi-branch K-12 school groups** — that matches those incumbents on compliance-grade payroll
while leading on the things none of them do. Naveya is a Voxturr Labs product built in collaboration with
**ShriConnect** (the technology arm of The Shri Ram Schools group), whose on-the-ground school-operations
experience directly shapes the feature set.

## What makes it different

Four capabilities, structural to schools, are absent from every competitor we studied:

1. **Academic-calendar-driven leave** — leave cycles follow the academic session, term and vacation
   structure, not the January–December corporate year.
2. **Vacation-staff vs. non-vacation-staff logic** — teachers receive long vacations *in lieu of* earned
   leave, while 12-month office staff accrue it normally. This single distinction changes both leave
   *and* salary calculations.
3. **Multi-scale payroll** — regular salaried staff and per-lecture / per-period guest faculty are paid
   in the same payroll run, each by its own logic, with statutory correctness throughout.
4. **Substitute-teacher arrangement** *(Phase 2)* — when a teacher is absent, the system arranges cover
   from the live timetable and feeds the substitution honorarium into payroll. No competitor offers this.

Items 1–3 ship in the first release; item 4 follows in Phase 2, and the data model is designed for it
from day one.

**Broadened v1 (ShriConnect alignment, 2026-07-22).** Beyond the education differentiators, five modules
from ShriConnect's operating experience are now in the first release: **Performance Appraisal / PAMS**
(corporate goal/KRA baseline plus classroom observation, student-result linkage and student/parent 360°),
**Loans & Advances**, **Reimbursements / FBP**, **Arrears & retrospective pay-revision** with statutory /
ex-gratia **Bonus**, and an **HR Helpdesk** for staff queries and grievances. This makes Naveya a complete
day-one HR platform, not just a payroll engine — while the deepest college-specific extras (UGC-API scoring,
CPD tracking) stay on the roadmap.

## MVP in one line

> A **compliance-grade Indian staff-payroll HRMS that is unmistakably built for schools** — matching
> greytHR/Keka on statutory payroll across multiple campuses, and leading with academic-calendar leave,
> vacation-staff logic, and multi-scale payroll.

## Scope at a glance

| Dimension | Decision |
|---|---|
| **Market** | India — full statutory stack (PF, ESI, Professional Tax, TDS, gratuity, bonus, LWF) |
| **First customer** | Private / self-financed K-12 schools, **multi-branch** groups and trusts |
| **Long-term scope** | Any educational institution — pre-school, K-12, coaching, college/university (schema designed for it; MVP targets K-12) |
| **Delivery** | Multi-tenant SaaS (default) + single-tenant on-premise for enterprise clients |
| **Clients** | Web (browser) + mobile app for staff self-service |
| **Full hire-to-retire in v1** | **Recruitment/ATS is in the first release** — requisition → posting → shortlist → interview → offer → auto-convert to employee — so the joiner journey is complete end-to-end, not bolted on later |
| **Governed employee records** | HR uploads staff documents at enrollment; employees **cannot self-edit** — any change flows through an **HR-initiated request → employee upload → HR verification**, fully audited |
| **Complete HR platform in v1** *(ShriConnect alignment)* | Adds **Performance Appraisal / PAMS**, **Loans & Advances**, **Reimbursements / FBP**, **Arrears & retrospective pay-revision + statutory/ex-gratia Bonus**, and an **HR Helpdesk** — all in the first release, with financial finalizations under maker-checker and bonus rates read from the versioned statutory config |

## Technology at a glance

| Layer | Choice |
|---|---|
| Backend | Django + Django REST Framework, PostgreSQL |
| Web front-end | Next.js (React / TypeScript) |
| Mobile | Flutter |
| API | strawberry-django **GraphQL** (primary) + **DRF REST edge** (ingestion/files/auth/integrations); GraphQL SDL + OpenAPI generate the web (TypeScript) and mobile (Dart) clients, and are exposed to school-ERP integrators |
| Hosting | Multi-tenant SaaS; single-tenant on-premise from the same codebase |
| Team | ~2 engineers working with AI agents — favouring proven, low-maintenance technology |

## Delivery approach

The build is **layered so each stage depends only on those before it** — tenancy and org structure
first, then identity, people, the academic calendar, leave, attendance, payroll, statutory compliance,
and finally self-service. This lets a small team deliver a coherent, testable product incrementally,
and lets the business demonstrate value at each layer rather than waiting for a big-bang release.

The remainder of this document covers the competitor analysis that informed scope, the full
functionality blueprint (every feature tagged MVP / Phase 2 / Later), and the foundational data model and
workflows for the first release.
