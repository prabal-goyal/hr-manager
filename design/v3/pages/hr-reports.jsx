/* @jsxRuntime classic */
/* ============================================================
   Naveya — HR Reports & setup · window.Pages3.HRReports

   HR-08 · STAFF CATEGORIES & TAXONOMY (setup) — "what kinds of staff
   exist here, and what does each kind imply?" (dev-spec §6.3
   StaffCategory, M3 §API, M5 §Business rules; docs/screen-inventory.md
   HR-08). The quietly-consequential screen: `is_vacation_staff` decides
   whether a person accrues Earned Leave at all (pages/hr-leaveatt.jsx
   HR-26 renders the effect — EL does not apply to teaching staff), and
   a category usually implies a probation length too. Pay groups are
   PY-02's, not this screen's (screen-inventory "Must NOT contain: pay
   groups") — editing a category here only cross-references payroll, it
   never sets it. Every edit that touches the vacation flag is
   effective-dated, states the affected headcount, and forces an
   explicit recalculate-vs-grandfather choice with NO default — the
   same shape hr-leaveatt.jsx HR-26 uses for its own supersession.

   HR-34 · NOTIFICATION TEMPLATES (setup) — "what does the system say,
   to whom, on which channel?" (M14 §API "admin templates", M13
   §Business rules "Hindi + English via i18n"). A template missing its
   Hindi body silently sends English to a Hindi-preferring teacher, so
   language completeness is rendered as a first-class, visible state —
   never a quiet gap. An unresolved merge field in a template body is a
   defect this screen catches before it ships, not after.

   HR-35 · APPRAISAL CYCLE SETUP (setup) — "how does this appraisal
   round run?" (§6.12 AppraisalCycle, M17 §API `/open` `/lock` `/close`).
   The rating matrix is authored here with NO hardcoded 1–5
   (guard-hardcoded-values) — every rating screen in the product reads
   this matrix, never a literal scale.

   HR-36 · APPRAISAL PROGRESS & REPORTS (destination) — "how far has
   this cycle got, and what does it say by department?" (M17 §Business
   rules "performance reports + department-wise tracking", M17
   §Acceptance "reports reconcile to the underlying reviews"). Shows
   COMPLETION as an operational fact for every department regardless of
   size, but score distribution and recommendation counts — outcome
   data — are suppressed wherever the underlying finalized-review count
   is small enough that a breakdown would point at one person. This is
   demonstrated LIVE in this file: the open cycle's finalized count (4)
   is below the threshold and is suppressed with a stated reason; the
   closed cycle's (6) clears it and renders in full.

   HR-37 · HR REPORTS (destination) — "what HR report do I need to
   produce?" (M15 §Purpose, M3/M4/M5/M6/M8/M9). One report-runner
   component, reused per screen-inventory's own instruction ("the same
   report-runner component as PR-06/HR-37... duplicating its action
   table would repeat the very mistake this document exists to stop").
   Reports respect the ACADEMIC SESSION (2026–27, from 1 April 2026),
   never a calendar year. Every run/export is audited and says so
   (docs/ui-compliance-requirements.md A64: state scope, row count, and
   that it is recorded).

   Composed only from window.G3 / window.UI3. kit.jsx, tokens.jsx,
   screens.jsx, the other pages/*.jsx files and v3.html are untouched by
   this dispatch — this file owns exactly HR-08/34/35/36/37.
   Demo clock: 11 August 2026 (matches hr.jsx, hr-leaveatt.jsx,
   principal.jsx). Persona: Meera Iyer, HR Operator (hr3.name).
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, ColorCard, Register, TitleMark, Button, LinkButton,
    Chip, StatusMark, Icon, ActionMenu, EmptyState, Field, Input, Select,
    Switch, Tabs, TabPanel, SideScreen, Avatar, inr, num, Band,
    CampusSwitch, campusLabel, inCampus, CAMPUS_ALL,
  } = UI;

  /* ============================================================
     STRINGS — hrr.* is this dispatch's whole namespace. EN and HI carry
     exactly the same key set; every demo value (names, reasons, dates,
     template bodies) is authored in both languages.
     ============================================================ */
  addStrings({
    en: {
      /* --- shared chrome --- */
      "hrr.title": "Reports & setup",
      "hrr.meta": "{school} · HR Operator · {campus}",
      "hrr.scopeShort": "Group-scoped",
      "hrr.tabs.aria": "Reports and setup sections",
      "hrr.tab.categories": "Staff categories",
      "hrr.tab.templates": "Notification templates",
      "hrr.tab.appraisalSetup": "Appraisal cycles",
      "hrr.tab.appraisalProgress": "Appraisal progress",
      "hrr.tab.reports": "HR reports",
      "hrr.tab.appraisals": "Appraisals",
      "hrr.q.appraisals": "Who has been appraised, what it decided, and who is overdue one.",
      "hrr.ap.view.done": "Appraised",
      "hrr.ap.view.late": "Overdue one",
      "hrr.ap.f.dept": "Department",
      "hrr.ap.f.view": "Show",
      "hrr.ap.f.done": "Reviewed",
      "hrr.ap.f.doneNote": "most recent {name}",
      "hrr.ap.f.doneNone": "none reviewed yet",
      "hrr.ap.f.late": "Overdue a review",
      "hrr.ap.f.lateNote": "{name} the oldest",
      "hrr.ap.f.lateNone": "nobody is overdue",
      "hrr.ap.f.moved": "Moved post",
      "hrr.ap.f.movedNote": "most recently to {post}",
      "hrr.ap.f.movedNone": "nobody changed post",
      "hrr.ap.f.deptAll": "Every department",
      "hrr.ap.export": "Export the list",
      "hrr.ap.exported": "{n} rows exported as CSV, against your name. Pay is not in the file.",
      "hrr.ap.title": "Appraisals on record",
      "hrr.ap.sub": "The conversation happens between the head of department and HR. This is what it decided.",
      "hrr.ap.foot": "Append-only. An appraisal is superseded by the next one and never rewritten.",
      "hrr.ap.col.who": "Who",
      "hrr.ap.col.on": "Decided on",
      "hrr.ap.col.post": "Post",
      "hrr.ap.col.postNow": "Post today",
      "hrr.ap.col.last": "Last appraised",
      "hrr.ap.col.chase": "",
      "hrr.ap.col.act": "Actions",
      "hrr.ap.stayed": "Stayed {post}",
      "hrr.ap.menuAria": "Actions on {name}’s appraisal",
      "hrr.ap.menuOpen": "Open what was decided",
      "hrr.ap.menuRecord": "Open the employee record",
      "hrr.ap.lateTitle": "Nobody has sat down with these people",
      "hrr.ap.lateSub": "A year is the school’s own expectation. Recording one is done on the person’s record, after the conversation.",
      "hrr.ap.lateFoot": "Read from the last appraisal on record — there is no flag anybody sets, so this list cannot be quietly cleared.",
      "hrr.ap.monthsAgo": "{n} months ago",
      "hrr.ap.never": "Never appraised",
      "hrr.ap.said": "What was said",
      "hrr.ap.pay": "Pay",
      "hrr.ap.payHidden": "Not shown",
      "hrr.ap.payShow": "Show it",
      "hrr.ap.payHide": "Hide it",
      "hrr.ap.rise": "{n}% more",
      "hrr.ap.by": "Recorded by {who} · {id}",
      "hrr.ap.detailNote": "Opening a pay figure is on the record, here as on the employee’s own.",
      "hrr.ap.close": "Close",
      "hrr.ap.d.science": "Science",
      "hrr.ap.d.admin": "Administration",
      "hrr.ap.d.primary": "Primary",
      "hrr.ap.d.transport": "Transport",
      "hrr.ap.by.anjali": "Anjali Deshpande, Head of Science",
      "hrr.ap.by.rajan": "Rajan Pillai, HR",
      "hrr.ap.s.ananya": "Board results held at last year's average with nobody below the pass mark. Remedial hours slipped in the exam weeks.",
      "hrr.ap.s.meenakshi": "Has run the department in all but name for two terms \u2014 cover roster, lab budget and Class XII moderation. Making it the title too.",
      "hrr.ap.s.ramesh": "Kept the buildings running through the monsoon term with no lost teaching day. Wants a second hand for the hostel block.",
      "hrr.ap.s.kavya": "Settled well into Class III; parent evenings are her strongest hour. Another year before we talk about moving her up.",
      "hrr.rep.foot": "Every range is this academic session — 1 April 2026 onward, not a calendar year.",
      "hrr.rep.menuAria": "Actions on {report}",
      "hrr.rep.openLast": "Open the last one",
      "hrr.rep.openLastNo": "It has not been run yet.",
      "hrr.rep.ranDone": "{report} produced — {n} rows, against your name.",
      "hrr.rep.again": "Run it again",
      "hrr.rep.rangeFixed": "Range: {range}. Reports follow the academic session and the range is not a choice.",
      "hrr.rep.resultNote": "Produced from the register as it stands now. Nothing here is stored — running it again tomorrow gives tomorrow’s answer.",
      "hrr.rep.scope.ind": "Indiranagar only",
      "hrr.rep.scope.wf": "Whitefield only",
      "hrr.act.cancel": "Not now",
      "hrr.q.categories": "What kinds of staff exist here, and what does each kind imply for leave and hiring?",
      "hrr.q.templates": "What does the system say to people on our behalf, and in which languages?",
      "hrr.q.appraisalSetup": "Set up this year's appraisal round — the matrix every rating screen will read.",
      "hrr.q.appraisalProgress": "Who has done theirs, and where is this round stalled?",
      "hrr.q.reports": "The numbers someone will ask you to produce.",

      "hrr.mo.1": "January", "hrr.mo.2": "February", "hrr.mo.3": "March", "hrr.mo.4": "April",
      "hrr.mo.5": "May", "hrr.mo.6": "June", "hrr.mo.7": "July", "hrr.mo.8": "August",
      "hrr.mo.9": "September", "hrr.mo.10": "October", "hrr.mo.11": "November", "hrr.mo.12": "December",

      "hrr.act.cancel": "Cancel",
      "hrr.act.save": "Save",
      "hrr.act.close": "Close",
      "hrr.act.confirm": "Confirm",
      "hrr.act.run": "Run",
      "hrr.act.download": "Download",
      "hrr.act.export": "Export",
      "hrr.dismiss": "Dismiss",
      "hrr.flash.aria": "Confirmation",
      "hrr.reason.label": "Reason",
      "hrr.reason.hint": "This is recorded against your account.",
      "hrr.reason.missing": "A reason is required.",
      "hrr.reason.short": "Say a little more — at least a few words.",
      "hrr.who.meera": "Meera Iyer, HR",


      "hrr.dept.science": "Science",
      "hrr.dept.mathematics": "Mathematics",
      "hrr.dept.primary": "Primary",
      "hrr.dept.prePrimary": "Pre-primary",
      "hrr.dept.languages": "Languages",

      /* real people, reused by name+code from pages/hr-leaveatt.jsx's
         own Science roster (same 8 teachers) — new demo people below
         them (fresh codes, this file only) for the self-assessment
         laggard example. */
      "hrr.p.ananya": "Ananya Rao",
      "hrr.p.meenak": "Meenakshi Pillai",
      "hrr.p.karan": "Karan Mehta",
      "hrr.p.rameshi": "Ramesh Iyer",
      "hrr.p.priya": "Priya Nair",
      "hrr.p.divya": "Divya Kapoor",
      "hrr.p.meeraj": "Meera Joshi",
      "hrr.p.sanjay": "Sanjay Verma",
      "hrr.p.farhan": "Farhan Qureshi",
      "hrr.p.bhavna": "Bhavna Iyer",
      "hrr.p.ritika": "Ritika Menon",
      "hrr.p.omprakash": "Om Prakash Yadav",
      "hrr.p.sana": "Sana Fatima",
      "hrr.p.deepika": "Deepika Nair",
      "hrr.p.imran": "Imran Sheikh",
      "hrr.p.charu": "Charu Bansal",

      /* ============================================================
         HR-08 · STAFF CATEGORIES
         ============================================================ */
      "hrr.cat.title": "Staff categories & taxonomy",
      "hrr.cat.sub": "Every category decides whether its people accrue earned leave and roughly how long probation runs. It does not set pay \u2014 that is PY-02.",
      "hrr.cat.add": "Add a category",
      "hrr.cat.scopeNote": "Categories apply across every campus in this group. Per-campus categories would be a change to the product, not a setting.",
      "hrr.cat.qualWarnHead": "1 category has no qualification norm set",
      "hrr.cat.qualWarnBody": "Support \u2014 Security & housekeeping has no minimum qualification recorded, so applications cannot be screened against a norm at shortlist.",

      "hrr.cat.col.name": "Category",
      "hrr.cat.f.use": "In use",
      "hrr.cat.f.useNote": "{n} staff between them",
      "hrr.cat.f.unused": "Nobody in them",
      "hrr.cat.f.unusedNone": "every one has staff",
      "hrr.cat.f.vac": "Vacation staff",
      "hrr.cat.f.vacNote": "their leave year follows the terms",
      "hrr.cat.f.qual": "No qualification set",
      "hrr.cat.f.qualNote": "hiring has nothing to check against",
      "hrr.cat.f.qualNone": "every one states a minimum",
      "hrr.cat.col.kind": "Kind",
      "hrr.cat.col.minQual": "Minimum qualification",
      "hrr.cat.col.vacation": "Teaching staff",
      "hrr.cat.col.probation": "Probation",
      "hrr.cat.col.count": "Staff",
      "hrr.cat.col.menu": "",

      "hrr.cat.kind.teaching": "Teaching",
      "hrr.cat.kind.non_teaching": "Non-teaching",
      "hrr.cat.kind.support": "Support",
      "hrr.cat.kind.guest": "Guest",

      "hrr.cat.vac.yes": "Accrues no EL",
      "hrr.cat.vac.no": "Accrues EL",
      "hrr.cat.probation.n": "{n} months",
      "hrr.cat.probation.none": "Not applicable — fixed-term",
      "hrr.cat.minQual.unset": "Not set",
      "hrr.cat.state.unused": "Unused",
      "hrr.cat.leaveRef": "Full entitlements are set in Leave policy",

      "hrr.cat.n.pgt": "PGT — Post-Graduate Teacher",
      "hrr.cat.n.tgt": "TGT — Trained Graduate Teacher",
      "hrr.cat.n.prt": "PRT — Primary Teacher",
      "hrr.cat.n.ntt": "NTT — Pre-primary Teacher",
      "hrr.cat.n.sen": "Special Educator (SEN)",
      "hrr.cat.n.guest": "Guest faculty (per-lecture)",
      "hrr.cat.n.nonTeachAdmin": "Non-teaching — Administration",
      "hrr.cat.n.transport": "Support — Transport",
      "hrr.cat.n.hostelFacilities": "Support — Hostel & facilities",
      "hrr.cat.n.sports": "Support — Sports & co-curricular",
      "hrr.cat.n.securityHousekeeping": "Support — Security & housekeeping",

      "hrr.cat.mq.pgt": "Post-graduate degree + B.Ed (NET preferred for select subjects)",
      "hrr.cat.mq.tgt": "Graduate degree + B.Ed",
      "hrr.cat.mq.prt": "Senior secondary + D.El.Ed / B.El.Ed",
      "hrr.cat.mq.ntt": "NTT / Early Childhood Care & Education diploma",
      "hrr.cat.mq.sen": "B.Ed (Special Education) + RCI registration",
      "hrr.cat.mq.guest": "Subject postgraduate — per-lecture engagement",
      "hrr.cat.mq.nonTeachAdmin": "Graduate (role-dependent)",
      "hrr.cat.mq.transport": "Valid commercial driving licence",
      "hrr.cat.mq.hostelFacilities": "Senior secondary (role-dependent)",
      "hrr.cat.mq.sports": "Diploma in sports coaching (role-dependent)",

      "hrr.cat.menu.aria": "Actions for {name}",
      "hrr.cat.menu.edit": "Edit this category",
      "hrr.cat.menu.viewStaff": "View staff in this category",
      "hrr.cat.menu.deactivate": "Deactivate",
      "hrr.cat.menu.deactivateDisabled": "In use by {n} staff",
      "hrr.cat.viewStaff.hint": "Opens the staff register — filter it to {name} there.",

      "hrr.cat.add.title": "Add a category",
      "hrr.cat.field.name": "Name",
      "hrr.cat.field.namePh": "e.g. Librarian",
      "hrr.cat.field.kind": "Kind",
      "hrr.cat.field.kindPh": "Choose one",
      "hrr.cat.field.minQual": "Minimum qualification",
      "hrr.cat.field.minQualPh": "What must someone hold to be screened into this category?",
      "hrr.cat.field.probation": "Probation length, in months",
      "hrr.cat.field.probationPh": "e.g. 6",
      "hrr.cat.field.probationHint": "Leave this blank for a fixed-term category with no probation (guest faculty, for example).",
      "hrr.cat.field.vacQ": "Does this category accrue Earned Leave?",
      "hrr.cat.field.vacYes": "No — it's a vacation-staff category",
      "hrr.cat.field.vacYesNote": "Teaching roles that follow the long breaks typically do not accrue earned leave. Entitlements are set in Leave policy.",
      "hrr.cat.field.vacNo": "Yes — it accrues EL like a year-round role",
      "hrr.cat.field.vacNoNote": "Non-teaching, support and most guest roles work through the year and accrue EL under the standard policy.",
      "hrr.cat.field.vacMissing": "Choose one — this has no safe default.",
      "hrr.cat.field.kindMissing": "Choose a kind.",
      "hrr.cat.field.nameMissing": "Give it a name.",
      "hrr.cat.add.confirm": "Add category",
      "hrr.cat.add.done": "Added {name}. It has no staff yet — assign people to it from the staff register.",

      "hrr.cat.edit.title": "Edit {name}",
      "hrr.cat.edit.unchangedNote": "Applies going forward from today; existing contracts are not retro-changed. Audited.",
      "hrr.cat.edit.vacChangedHead": "This changes who accrues Earned Leave",
      "hrr.cat.edit.vacChangedBody": "{n} people are in {name}. This decides whether they accrue EL going forward, and may change which pay group they belong in.",
      "hrr.cat.edit.effLabel": "Effective from",
      "hrr.cat.edit.balLabel": "What happens to leave already accrued?",
      "hrr.cat.edit.bal.recalc": "Recalculate — re-run accrual for every affected person from the effective date",
      "hrr.cat.edit.bal.recalcNote": "Re-derives the balance for all {n} people in this category. The change is visible on their ledger immediately.",
      "hrr.cat.edit.bal.grand": "Grandfather — leave existing balances as they are; only future accrual changes",
      "hrr.cat.edit.bal.grandNote": "Nobody's current balance moves. Only what accrues from {eff} onward follows the new rule.",
      "hrr.cat.edit.balMissing": "Choose one — recalculate or grandfather. There is no default here.",
      "hrr.cat.edit.save": "Save the change",
      "hrr.cat.edit.done": "Saved. {name} now {vac}, effective {eff}.",

      "hrr.cat.deactivate.title": "Deactivate {name}",
      "hrr.cat.deactivate.body": "This hides {name} from new contracts. Historical records that already reference it are unaffected — nothing is deleted.",
      "hrr.cat.deactivate.confirm": "Deactivate",
      "hrr.cat.deactivate.done": "{name} is deactivated. It stays visible on past records.",

      /* ============================================================
         HR-34 · NOTIFICATION TEMPLATES
         ============================================================ */
      "hrr.tpl.f.both": "In both languages",
      "hrr.tpl.f.bothNote": "English and Hindi, ready to send",
      "hrr.tpl.f.en": "English only",
      "hrr.tpl.f.enNone": "every one is written twice",
      "hrr.tpl.f.sch": "Sent on a schedule",
      "hrr.tpl.f.schNote": "the rest are sent by an event",
      "hrr.tpl.title": "Notification templates",
      "hrr.tpl.sub": "Every event the system sends on this school's behalf, the channels it goes on, and the words it uses — in English and Hindi.",
      "hrr.tpl.complianceHead": "1 template can't be fully turned off",
      "hrr.tpl.missingHiHead": "Some templates are missing a Hindi body",
      "hrr.tpl.complianceBody": "Statutory due-date reminders are a compliance event, so at least one channel must stay on.",
      "hrr.tpl.col.event": "Event",
      "hrr.tpl.col.recipient": "Goes to",
      "hrr.tpl.col.channels": "Channels",
      "hrr.tpl.col.language": "Language",
      "hrr.tpl.col.leadTime": "Lead time",
      "hrr.tpl.col.menu": "",
      "hrr.tpl.ch.inApp": "In-app",
      "hrr.tpl.ch.push": "Push",
      "hrr.tpl.ch.sms": "SMS",
      "hrr.tpl.ch.email": "Email",
      "hrr.tpl.lang.both": "English + Hindi",
      "hrr.tpl.lang.missing": "Hindi missing — sends English",
      "hrr.tpl.lockedNote": "Locked — a compliance event needs at least one channel",
      "hrr.tpl.lastChannelBlocked": "Can't turn off the last channel on a compliance event — the reminder must reach someone.",
      "hrr.tpl.leadDays": "{n} days before",
      "hrr.tpl.leadSuffix": "days before",
      "hrr.tpl.leadNone": "—",
      "hrr.tpl.menu.edit": "Edit the template",
      "hrr.tpl.menu.sendTest": "Send a test to myself",
      "hrr.tpl.menu.sendTestDisabled": "Fix the unresolved field first",

      "hrr.tpl.ev.approvalRequested.name": "Approval requested",
      "hrr.tpl.ev.approvalRequested.recipient": "The approver in the chain",
      "hrr.tpl.ev.approvalDecided.name": "Approval decided",
      "hrr.tpl.ev.approvalDecided.recipient": "The person who asked",
      "hrr.tpl.ev.docRequestRaised.name": "Document request raised",
      "hrr.tpl.ev.docRequestRaised.recipient": "The employee",
      "hrr.tpl.ev.docRequestOverdue.name": "Document request overdue",
      "hrr.tpl.ev.docRequestOverdue.recipient": "The employee, and HR",
      "hrr.tpl.ev.expiryAlert.name": "Document / contract expiry",
      "hrr.tpl.ev.expiryAlert.recipient": "The employee, their HOD, and HR",
      "hrr.tpl.ev.payslipReleased.name": "Payslip released",
      "hrr.tpl.ev.payslipReleased.recipient": "The employee",
      "hrr.tpl.ev.statutoryDueDate.name": "Statutory due date",
      "hrr.tpl.ev.statutoryDueDate.recipient": "The Accountant",
      "hrr.tpl.ev.helpdeskSlaBreach.name": "Helpdesk SLA breach",
      "hrr.tpl.ev.helpdeskSlaBreach.recipient": "HR, and the ticket's owner",
      "hrr.tpl.ev.appraisalWindow.name": "Appraisal window open",
      "hrr.tpl.ev.appraisalWindow.recipient": "The employee, and their manager",

      "hrr.tpl.body.en": "English body",
      "hrr.tpl.body.hi": "Hindi body",
      "hrr.tpl.body.hiEmptyHint": "Leave this blank and the send falls back to the English body — but it stays flagged here until someone fills it in.",
      "hrr.tpl.mergeFields": "Fields this event provides: {list}",
      "hrr.tpl.previewLabel": "Preview with sample data",
      "hrr.tpl.unresolvedField": "This body uses {field}, which this event does not provide. Fix it before saving.",
      "hrr.tpl.editSaved": "Saved. Applies to sends from now on.",
      "hrr.tpl.editBlocked": "Can't save while {field} is unresolved.",

      "hrr.tpl.test.title": "Send a test",
      "hrr.tpl.test.body": "Sends this template to you (Meera Iyer), marked as a test. It is recorded.",
      "hrr.tpl.test.confirm": "Send the test",
      "hrr.tpl.test.done": "Test sent to you and recorded.",
      "hrr.tpl.test.noProviderHead": "SMS has no provider configured",
      "hrr.tpl.test.noProviderBody": "This tenant has no SMS provider, so an SMS test cannot be delivered. Provider setup lives in Integrations (GA-10).",

      /* ============================================================
         HR-35 · APPRAISAL CYCLE SETUP
         ============================================================ */
      "hrr.apc.title": "Appraisal cycles",
      "hrr.apc.sub": "Every rating screen in the product reads the matrix defined here — nothing hardcodes a scale.",
      "hrr.apc.matrixWarnHead": "Annual Appraisal 2026–27 can't open yet",
      "hrr.apc.matrixWarnBody": "Its rating matrix has no scale points defined. Add at least three and set weights that sum to 100% before this cycle can open.",
      "hrr.apc.col.name": "Cycle",
      "hrr.apc.col.type": "Type",
      "hrr.apc.col.ay": "Academic year",
      "hrr.apc.col.scope": "Scope",
      "hrr.apc.col.window": "Window",
      "hrr.apc.col.status": "Status",
      "hrr.apc.col.population": "Population",
      "hrr.apc.type.term": "Term",
      "hrr.apc.type.annual": "Annual",
      "hrr.apc.type.probation": "Probation",
      "hrr.apc.status.draft": "Draft",
      "hrr.apc.status.open": "Open",
      "hrr.apc.status.locked": "Locked",
      "hrr.apc.status.closed": "Closed",
      "hrr.apc.scope.group": "Both campuses",
      "hrr.apc.scope.indiranagar": "Indiranagar only",
      "hrr.apc.window.n": "{from} – {to}",
      "hrr.apc.population.n": "{n} people ({label})",
      "hrr.apc.pop.all": "everyone",
      "hrr.apc.pop.teaching": "teaching staff",
      "hrr.apc.pop.probationOnly": "staff on probation",

      "hrr.apc.name.annual2627": "Annual Appraisal 2026–27",
      "hrr.apc.name.term1_2627": "Term 1 Appraisal 2026–27",
      "hrr.apc.name.probationAug2026": "Probation Review — August 2026",

      "hrr.apc.detail.matrixTitle": "Rating matrix",
      "hrr.apc.detail.matrixVersion": "v{v} — defined by {by} on {on}",
      "hrr.apc.detail.matrixNone": "No scale points defined yet.",
      "hrr.apc.detail.matrixWeighting": "Weighting: self {self}% · manager {manager}% · peer {peer}%",
      "hrr.apc.detail.matrixAddPoint": "Add a scale point",
      "hrr.apc.matrix.label": "Label",
      "hrr.apc.matrix.labelPh": "e.g. Meets expectations",
      "hrr.apc.matrix.descriptor": "Descriptor",
      "hrr.apc.matrix.descriptorPh": "What does this band mean, in a sentence?",
      "hrr.apc.matrix.add": "Add",
      "hrr.apc.matrix.count": "{n} of a minimum 3 scale points defined",
      "hrr.apc.matrix.weightSelf": "Self %",
      "hrr.apc.matrix.weightManager": "Manager %",
      "hrr.apc.matrix.weightPeer": "Peer %",
      "hrr.apc.matrix.weightSum": "These must add to 100% — currently {n}%.",
      "hrr.apc.matrix.saveWeighting": "Save the weighting",

      "hrr.apc.label.needsImprovement": "Needs improvement",
      "hrr.apc.label.developing": "Developing",
      "hrr.apc.label.meets": "Meets expectations",
      "hrr.apc.label.exceeds": "Exceeds expectations",
      "hrr.apc.label.outstanding": "Outstanding",

      "hrr.apc.detail.sourcesTitle": "360° sources",
      "hrr.apc.src.manager": "Manager review",
      "hrr.apc.src.managerNote": "Always included — every cycle reads a manager review.",
      "hrr.apc.src.peer": "Peer / classroom observation",
      "hrr.apc.src.peerNote": "On by default when the population includes teaching staff.",
      "hrr.apc.src.studentResult": "Student-result linkage",
      "hrr.apc.src.studentResultNote": "Links exam outcomes into the review — set once per cycle.",
      "hrr.apc.src.laterNote": "Student and parent 360° feedback is a later-phase capability (amendment A) and isn't offered here yet.",

      "hrr.apc.detail.actionsTitle": "Lifecycle",
      "hrr.apc.act.open": "Open the cycle",
      "hrr.apc.act.openDisabledMatrix": "Define the rating matrix first",
      "hrr.apc.act.lock": "Lock the cycle",
      "hrr.apc.act.close": "Close the cycle",
      "hrr.apc.act.closeDisabled": "Lock the cycle first",
      "hrr.apc.act.extend": "Extend the window",
      "hrr.apc.act.viewProgress": "View its progress and reports",

      "hrr.apc.open.title": "Open {name}",
      "hrr.apc.open.body": "This activates goals and self-appraisal for {n} staff and their managers. Everyone in scope is notified.",
      "hrr.apc.open.confirm": "Open the cycle",
      "hrr.apc.open.done": "{name} is open. Goals and self-appraisal are now available to {n} people.",

      "hrr.apc.lock.title": "Lock {name}",
      "hrr.apc.lock.body": "Locking stops new self and manager submissions. {n} people have not submitted a self-assessment yet.",
      "hrr.apc.lock.confirm": "Lock the cycle",
      "hrr.apc.lock.done": "{name} is locked. No new self or manager submissions will be accepted.",

      "hrr.apc.close.title": "Close {name}",
      "hrr.apc.close.body": "{n} reviews are not yet finalized. Closing needs every review finalized, or explicitly waived with a reason.",
      "hrr.apc.close.waiveLabel": "Reason for waiving the remaining {n} reviews",
      "hrr.apc.close.waivePh": "Why are these being closed without a final review?",
      "hrr.apc.close.confirm": "Waive and close",
      "hrr.apc.close.done": "{name} is closed. This cannot be reopened.",

      "hrr.apc.extend.title": "Extend the window",
      "hrr.apc.extend.newEnd": "New end date",
      "hrr.apc.extend.reasonLabel": "Reason for extending",
      "hrr.apc.extend.reasonPh": "Why does this cycle need more time?",
      "hrr.apc.extend.confirm": "Extend",
      "hrr.apc.extend.done": "Window extended to {date}. Everyone in scope is notified.",
      "hrr.apc.extend.pastBlocked": "Choose a date after the current window end.",

      /* ============================================================
         HR-36 · APPRAISAL PROGRESS & REPORTS
         ============================================================ */
      "hrr.apr.title": "Appraisal progress & reports",
      "hrr.apr.sub": "Completion by stage and department, and what the finalized reviews say — in aggregate only.",
      "hrr.apr.pick.open": "This term (open)",
      "hrr.apr.pick.closed": "Probation review (closed)",
      "hrr.apr.reconcile": "{done} of {total} in scope have started. Every number below reconciles to these {total} reviews.",
      "hrr.apr.stalledHead": "Moderation is where this round has stalled",
      "hrr.apr.stalledBody": "Submissions fall off fastest between peer review and moderation ({peer} \u2192 {mod}). That is where a nudge helps most.",

      "hrr.apr.col.dept": "Department",
      "hrr.apr.col.headcount": "In scope",
      "hrr.apr.col.self": "Self",
      "hrr.apr.col.manager": "Manager",
      "hrr.apr.col.peer": "360°",
      "hrr.apr.col.moderation": "Moderation",
      "hrr.apr.col.finalized": "Finalized",
      "hrr.apr.col.chase": "",
      "hrr.apr.frac": "{done}/{total}",
      "hrr.apr.total": "Total",
      "hrr.apr.chase": "Chase",
      "hrr.apr.chaseDisabled": "Everyone has submitted",

      "hrr.apr.chase.title": "Chase self-assessment",
      "hrr.apr.chase.body": "{n} people have not yet submitted a self-assessment. Sending a reminder is recorded against you.",
      "hrr.apr.chase.col.name": "Name",
      "hrr.apr.chase.col.dept": "Department",
      "hrr.apr.chase.send": "Send the reminder to all {n}",
      "hrr.apr.chase.done": "Reminder sent to {n} people.",

      "hrr.apr.dist.title": "Score distribution",
      "hrr.apr.dist.sub": "By department, across the {n} reviews finalized so far this cycle.",
      "hrr.apr.dist.suppressedCell": "Too few finalized reviews here (fewer than 5) to break down safely — showing a distribution would point at specific people.",
      "hrr.apr.dist.suppressedAll": "Only {n} reviews are finalized, below the 5-review floor this screen needs to show a distribution. The closed probation cycle below is a worked example.",
      "hrr.apr.dist.noneYet": "No reviews finalized here yet.",

      "hrr.apr.rec.title": "Recommendations",
      "hrr.apr.rec.sub": "From the {n} finalized reviews in this cycle.",
      "hrr.apr.rec.increment": "Increment",
      "hrr.apr.rec.promotion": "Promotion",
      "hrr.apr.rec.pip": "Performance improvement plan",
      "hrr.apr.rec.none": "No change recommended",

      "hrr.apr.drill.title": "{dept} — who has done what",
      "hrr.apr.drill.note": "Completion only — this is not where a rating shows.",
      "hrr.apr.drill.col.name": "Name",
      "hrr.apr.drill.col.code": "Staff ID",
      "hrr.apr.drill.unavailable": "Person-level detail isn't modelled for {dept} in this preview — Science demonstrates the shape below.",
      "hrr.apr.drill.open": "Drill in",

      "hrr.apr.export": "Export this view",
      "hrr.apr.export.done": "Exported {n} rows for {cycle}. Recorded in the export log against your account.",

      /* ============================================================
         HR-37 · HR REPORTS
         ============================================================ */
      "hrr.rep.title": "HR reports",
      "hrr.rep.sub": "The standard report library. Every range defaults to this academic session — 1 April 2026 onward, not a calendar year.",
      "hrr.rep.refusalHead": "Gender and age aren't offered as breakdowns here",
      "hrr.rep.refusalBody": "Crossed with campus or department, either one can narrow a report to a single person. A regulatory return takes a different, audited path.",
      "hrr.rep.col.name": "Report",
      "hrr.rep.f.all": "In the library",
      "hrr.rep.f.allNote": "staff, leave, documents, hiring and pay",
      "hrr.rep.f.ran": "Run before",
      "hrr.rep.f.ranNote": "last {name}, {date}",
      "hrr.rep.f.ranNone": "none has been run",
      "hrr.rep.f.never": "Never run",
      "hrr.rep.f.neverNone": "every one has been run",
      "hrr.rep.neverRunBody": "Run it to see what it holds. Nothing is generated until you ask for it.",
      "hrr.rep.col.scope": "Scope",
      "hrr.rep.col.lastRun": "Last generated",
      "hrr.rep.col.menu": "",
      "hrr.rep.neverRun": "Not generated yet",
      "hrr.rep.lastRunOn": "{date}, by {by}",
      "hrr.rep.scope.group": "Both campuses",

      "hrr.rep.n.headcount": "Headcount & demographics",
      "hrr.rep.d.headcount": "Who works here, by category, campus and employment type.",
      "hrr.rep.n.attrition": "Joiners, leavers & attrition",
      "hrr.rep.d.attrition": "Who joined and left this session, and the resulting attrition rate.",
      "hrr.rep.n.docCompliance": "Document compliance",
      "hrr.rep.d.docCompliance": "Verified, pending and expired documents across the register.",
      "hrr.rep.n.contractExpiry": "Contract expiry",
      "hrr.rep.d.contractExpiry": "Fixed-term contracts running out in the next 90 days.",
      "hrr.rep.n.recruitment": "Recruitment funnel",
      "hrr.rep.d.recruitment": "Applied through joined, this session. Time-to-hire is not in this release.",
      "hrr.rep.n.leaveAttendance": "Leave & attendance register",
      "hrr.rep.d.leaveAttendance": "Leave liability by category, and unresolved attendance exceptions.",
      "hrr.rep.n.probation": "Probation & confirmation",
      "hrr.rep.d.probation": "Who is on probation, due for review, or confirmed this session.",

      "hrr.rep.run": "Run this report",
      "hrr.rep.rangeLabel": "Range",
      "hrr.rep.rangeValue": "1 Apr 2026 – {today}",
      "hrr.rep.scopeLabel": "Scope",
      "hrr.rep.formatLabel": "Format",
      "hrr.rep.format.pdf": "PDF",
      "hrr.rep.format.csv": "CSV",
      "hrr.rep.schedule": "Schedule",
      "hrr.rep.scheduleDisabled": "Not available in this release — standard reports don't schedule yet",
      "hrr.rep.saveView": "Save this view",
      "hrr.rep.saveViewDisabled": "Not available in this release",
      "hrr.rep.download": "Download",
      "hrr.rep.export.done": "Exported {n} rows for {report}, {range}. Recorded in the export log against your account.",
      "hrr.rep.generatedOn": "Generated {date} · {n} rows in scope",

      "hrr.rep.hc.byCategory": "By category",
      "hrr.rep.hc.byCampus": "By campus",
      "hrr.rep.hc.byEmployment": "By employment type",
      "hrr.rep.hc.col.group": "Group",
      "hrr.rep.hc.col.count": "Staff",
      "hrr.rep.hc.emp.permanent": "Permanent",
      "hrr.rep.hc.emp.probation": "On probation",
      "hrr.rep.hc.emp.contract": "Fixed-term",
      "hrr.rep.hc.emp.guest": "Guest, per-lecture",

      "hrr.rep.att.month": "Month",
      "hrr.rep.att.joiners": "Joined",
      "hrr.rep.att.leavers": "Left",
      "hrr.rep.att.rateLine": "Attrition this session: {rate}% — {leavers} leavers ÷ {headcount} current headcount, not annualised.",

      "hrr.rep.dc.verified": "Verified",
      "hrr.rep.dc.pending": "Pending",
      "hrr.rep.dc.expired": "Expired",
      "hrr.rep.dc.link": "Full queue is on the Document control tab",

      "hrr.rep.ce.window": "Window",
      "hrr.rep.ce.count": "Contracts ending",
      "hrr.rep.ce.d30": "Within 30 days",
      "hrr.rep.ce.d60": "31–60 days",
      "hrr.rep.ce.d90": "61–90 days",

      "hrr.rep.rf.stage": "Stage",
      "hrr.rep.rf.count": "Count",
      "hrr.rep.rf.applied": "Applied",
      "hrr.rep.rf.screened": "Screened",
      "hrr.rep.rf.interviewed": "Interviewed",
      "hrr.rep.rf.offered": "Offered",
      "hrr.rep.rf.joined": "Joined",

      "hrr.rep.la.category": "Category",
      "hrr.rep.la.count": "Staff",
      "hrr.rep.la.avgBalance": "Avg. EL balance",
      "hrr.rep.la.avgBalanceDays": "{n} days",
      "hrr.rep.la.dailyRate": "Avg. daily rate",
      "hrr.rep.la.liability": "Liability",
      "hrr.rep.la.total": "Total leave liability",
      "hrr.rep.la.formula": "Liability = staff × average balance days × average daily rate, summed per category — never a typed total.",
      "hrr.rep.la.exceptions": "{n} attendance exceptions remain unresolved across both campuses — see the Leave & attendance console.",

      "hrr.rep.pr.onProbation": "On probation now",
      "hrr.rep.pr.dueThisMonth": "Review due this month",
      "hrr.rep.pr.confirmedSession": "Confirmed this session",
    },

  });

  /* ============================================================
     DEMO DATA — HR-08 categories. 10 active categories sum to 214,
     the exact TOTAL_IN_SCOPE hr.jsx's staff register cites, so a
     headcount report built from these numbers agrees with the
     register rather than inventing a second truth. `sen` is seeded
     with zero staff so the "unused" / deactivatable state has a real
     example on screen, not just a description.
     ============================================================ */
  const CATEGORIES_SEED = [
    { id: "pgt", nameKey: "hrr.cat.n.pgt", kind: "teaching", minQualKey: "hrr.cat.mq.pgt", vac: true, probation: 6, count: 38, state: "active" },
    { id: "tgt", nameKey: "hrr.cat.n.tgt", kind: "teaching", minQualKey: "hrr.cat.mq.tgt", vac: true, probation: 6, count: 46, state: "active" },
    { id: "prt", nameKey: "hrr.cat.n.prt", kind: "teaching", minQualKey: "hrr.cat.mq.prt", vac: true, probation: 6, count: 34, state: "active" },
    { id: "ntt", nameKey: "hrr.cat.n.ntt", kind: "teaching", minQualKey: "hrr.cat.mq.ntt", vac: true, probation: 6, count: 12, state: "active" },
    { id: "guest", nameKey: "hrr.cat.n.guest", kind: "guest", minQualKey: "hrr.cat.mq.guest", vac: false, probation: null, count: 9, state: "active" },
    { id: "nonTeachAdmin", nameKey: "hrr.cat.n.nonTeachAdmin", kind: "non_teaching", minQualKey: "hrr.cat.mq.nonTeachAdmin", vac: false, probation: 3, count: 22, state: "active" },
    { id: "transport", nameKey: "hrr.cat.n.transport", kind: "support", minQualKey: "hrr.cat.mq.transport", vac: false, probation: 3, count: 14, state: "active" },
    { id: "hostelFacilities", nameKey: "hrr.cat.n.hostelFacilities", kind: "support", minQualKey: "hrr.cat.mq.hostelFacilities", vac: false, probation: 3, count: 18, state: "active" },
    { id: "sports", nameKey: "hrr.cat.n.sports", kind: "support", minQualKey: "hrr.cat.mq.sports", vac: false, probation: 3, count: 6, state: "active" },
    { id: "securityHousekeeping", nameKey: "hrr.cat.n.securityHousekeeping", kind: "support", minQualKey: null, vac: false, probation: 3, count: 15, state: "active" },
    { id: "sen", nameKey: "hrr.cat.n.sen", kind: "teaching", minQualKey: "hrr.cat.mq.sen", vac: true, probation: 6, count: 0, state: "unused" },
  ];
  const CATEGORY_TOTAL = CATEGORIES_SEED.reduce((n, c) => n + c.count, 0); /* 214 — hr.jsx's TOTAL_IN_SCOPE */

  /* ============================================================
     HR-34 · notification events. `docRequestRaised` demonstrates the
     "missing Hindi" state; `docRequestOverdue` ships with a genuinely
     unresolved merge field ({employee_name} — the event only provides
     {name}) so the editor's validation has something real to catch;
     `statutoryDueDate` is the one compliance event that cannot be
     fully switched off. PROVIDERS models a tenant with no SMS
     provider configured, so "send a test" has a real failure path.
     ============================================================ */
  const PROVIDERS = { inApp: true, push: true, sms: false, email: true };

  const EVENTS_SEED = [
    { id: "approvalRequested", scheduled: false, compliance: false, channels: { inApp: true, push: true, sms: false, email: true }, leadDays: null,
      fields: ["{name}", "{type}", "{date}"],
      bodyEn: "{name} has asked you to approve a {type} request raised on {date}. Open it in Naveya to decide.",
      bodyHi: "{name} ने {date} को उठाए गए एक {type} अनुरोध पर आपकी स्वीकृति माँगी है। तय करने के लिए इसे Naveya में खोलें।" },
    { id: "approvalDecided", scheduled: false, compliance: false, channels: { inApp: true, push: true, sms: false, email: true }, leadDays: null,
      fields: ["{name}", "{decision}", "{date}"],
      bodyEn: "Your request has been {decision} by {name} on {date}.",
      bodyHi: "आपका अनुरोध {name} द्वारा {date} को {decision} कर दिया गया है।" },
    { id: "docRequestRaised", scheduled: false, compliance: false, channels: { inApp: true, push: true, sms: false, email: false }, leadDays: null,
      fields: ["{doc_type}", "{due_date}"],
      bodyEn: "HR needs your {doc_type} by {due_date}. Please upload it from the Documents tab.",
      bodyHi: "" /* deliberately missing — HR-34's "missing Hindi" state */ },
    { id: "docRequestOverdue", scheduled: false, compliance: false, channels: { inApp: true, push: false, sms: true, email: true }, leadDays: null,
      fields: ["{name}", "{doc_type}", "{due_date}"],
      /* {employee_name} is not in `fields` — an unresolved merge field
         in BOTH languages, the defect this screen's editor must catch */
      bodyEn: "{employee_name}'s {doc_type} was due on {due_date} and is still outstanding.",
      bodyHi: "{employee_name} का {doc_type} {due_date} को देय था और अभी लंबित है।" },
    { id: "expiryAlert", scheduled: true, compliance: false, channels: { inApp: true, push: true, sms: false, email: true }, leadDays: 30,
      fields: ["{name}", "{item}", "{expires_on}"],
      bodyEn: "{name}'s {item} expires on {expires_on}. Start a renewal before it lapses.",
      bodyHi: "{name} का {item} {expires_on} को समाप्त हो रहा है। समाप्त होने से पहले नवीनीकरण शुरू करें।" },
    { id: "payslipReleased", scheduled: false, compliance: false, channels: { inApp: true, push: true, sms: false, email: true }, leadDays: null,
      fields: ["{name}", "{month}"],
      bodyEn: "{name}, your payslip for {month} is ready in Naveya.",
      bodyHi: "{name}, {month} की आपकी पेस्लिप Naveya में तैयार है।" },
    { id: "statutoryDueDate", scheduled: true, compliance: true, channels: { inApp: true, push: false, sms: false, email: true }, leadDays: 15,
      fields: ["{filing}", "{due_date}"],
      bodyEn: "{filing} is due on {due_date}. Confirm it has been filed.",
      bodyHi: "{filing} {due_date} को देय है। पुष्टि करें कि यह दाख़िल हो चुका है।" },
    { id: "helpdeskSlaBreach", scheduled: false, compliance: false, channels: { inApp: true, push: true, sms: false, email: true }, leadDays: null,
      fields: ["{ticket_id}", "{category}"],
      bodyEn: "Ticket {ticket_id} ({category}) has passed its promised response time.",
      bodyHi: "टिकट {ticket_id} ({category}) अपने वादा किए गए उत्तर-समय से आगे निकल गया है।" },
    { id: "appraisalWindow", scheduled: false, compliance: false, channels: { inApp: true, push: false, sms: false, email: true }, leadDays: null,
      fields: ["{cycle_name}", "{window_end}"],
      bodyEn: "{cycle_name} is open. Complete your part before {window_end}.",
      bodyHi: "{cycle_name} खुला है। {window_end} से पहले अपना हिस्सा पूरा करें।" },
  ];
  /* returns the first {merge_field} token in `body` that isn't in `fields`, or null */
  function unresolvedField(body, fields) {
    const matches = body.match(/\{[a-z_]+\}/g) || [];
    for (let i = 0; i < matches.length; i++) { if (fields.indexOf(matches[i]) === -1) return matches[i]; }
    return null;
  }

  /* ============================================================
     HR-35/36 · appraisal cycles. The open cycle's own progress
     numbers are DERIVED below from DEPT_PROGRESS (one source), never
     typed twice. Scope is Indiranagar only, a smaller and more
     believable population than the whole group.
     ============================================================ */
  const MATRIX_LABELS = ["needsImprovement", "developing", "meets", "exceeds", "outstanding"];

  const DEPT_NAME_KEY = {
    Science: "hrr.dept.science", Mathematics: "hrr.dept.mathematics", Primary: "hrr.dept.primary",
    "Pre-primary": "hrr.dept.prePrimary", Languages: "hrr.dept.languages",
  };
  const DEPT_PROGRESS = [
    /* dept, headcount, self, manager, peer(360), moderation, finalized — all "done" counts, out of headcount */
    { dept: "Science", headcount: 8, self: 8, manager: 6, peer: 5, moderation: 3, finalized: 2 },
    { dept: "Mathematics", headcount: 6, self: 4, manager: 3, peer: 2, moderation: 1, finalized: 1 },
    { dept: "Primary", headcount: 10, self: 8, manager: 6, peer: 5, moderation: 2, finalized: 1 },
    { dept: "Pre-primary", headcount: 4, self: 2, manager: 1, peer: 1, moderation: 0, finalized: 0 },
    { dept: "Languages", headcount: 6, self: 4, manager: 3, peer: 2, moderation: 1, finalized: 0 },
  ];
  const OPEN_POPULATION = DEPT_PROGRESS.reduce((n, d) => n + d.headcount, 0); /* 34 */
  function stageSum(stage) { return DEPT_PROGRESS.reduce((n, d) => n + d[stage], 0); }

  const OPEN_CYCLE = {
    id: "term1_2627", nameKey: "hrr.apc.name.term1_2627", type: "term", ay: "2026-27",
    scope: "indiranagar", windowStart: "2026-07-15", windowEnd: "2026-08-31", status: "open",
    matrixVersion: 2, matrixDefinedByKey: "hrr.who.meera", matrixDefinedOnISO: "2026-07-10",
    matrixLabels: MATRIX_LABELS, weighting: { self: 20, manager: 50, peer: 30 },
    sources: { manager: true, peer: true, studentResult: true },
    popKey: "hrr.apc.pop.teaching", populationCount: OPEN_POPULATION,
    recommendation: { increment: 2, promotion: 0, pip: 1, none: 1 }, /* sums to finalized (4) */
  };

  const CLOSED_CYCLE = {
    id: "probationAug2026", nameKey: "hrr.apc.name.probationAug2026", type: "probation", ay: "2026-27",
    scope: "indiranagar", windowStart: "2026-07-01", windowEnd: "2026-07-31", status: "closed",
    matrixVersion: 1, matrixDefinedByKey: "hrr.who.meera", matrixDefinedOnISO: "2026-06-20",
    matrixLabels: MATRIX_LABELS, weighting: { self: 20, manager: 60, peer: 20 },
    sources: { manager: true, peer: false, studentResult: false },
    popKey: "hrr.apc.pop.probationOnly", populationCount: 6,
    finalized: 6, /* all 6 finalized — this cycle is closed */
    distribution: { needsImprovement: 0, developing: 1, meets: 3, exceeds: 1, outstanding: 1 }, /* sums to 6 */
    recommendation: { increment: 3, promotion: 0, pip: 1, none: 2 }, /* sums to 6 */
  };

  const DRAFT_CYCLE = {
    id: "annual2627", nameKey: "hrr.apc.name.annual2627", type: "annual", ay: "2026-27",
    scope: "group", windowStart: "2026-10-01", windowEnd: "2026-11-30", status: "draft",
    matrixVersion: null, matrixLabels: [], weighting: null,
    sources: { manager: true, peer: false, studentResult: false },
    popKey: "hrr.apc.pop.all", populationCount: CATEGORY_TOTAL,
  };

  const CYCLES_SEED = [DRAFT_CYCLE, OPEN_CYCLE, CLOSED_CYCLE];

  const FINALIZE_THRESHOLD = 5; /* below this, distribution/recommendation aggregates are suppressed */

  /* Science drill-in — the 8 people ARE hr-leaveatt.jsx's own Science
     roster (same codes, same names), each assigned a single
     furthest-reached stage that reconciles exactly to DEPT_PROGRESS's
     Science row (self 8, manager 6, peer 5, moderation 3, finalized 2). */
  const STAGE_ORDER = ["self", "manager", "peer", "moderation", "finalized"];
  const SCIENCE_PEOPLE = [
    { code: "NAV-0142", nameKey: "hrr.p.ananya", furthest: "finalized" },
    { code: "NAV-0088", nameKey: "hrr.p.meenak", furthest: "finalized" },
    { code: "NAV-0156", nameKey: "hrr.p.karan", furthest: "moderation" },
    { code: "NAV-0149", nameKey: "hrr.p.rameshi", furthest: "peer" },
    { code: "NAV-0171", nameKey: "hrr.p.priya", furthest: "peer" },
    { code: "NAV-0178", nameKey: "hrr.p.divya", furthest: "manager" },
    { code: "NAV-0163", nameKey: "hrr.p.meeraj", furthest: "self" },
    { code: "NAV-0184", nameKey: "hrr.p.sanjay", furthest: "self" },
  ];
  function stageDone(person, stage) {
    return STAGE_ORDER.indexOf(person.furthest) >= STAGE_ORDER.indexOf(stage);
  }

  /* self-assessment laggards (8, matching the 34-26=8 gap above,
     distributed exactly per department's own self-assessment gap:
     Science 0, Mathematics 2, Primary 2, Pre-primary 2, Languages 2).
     Fresh codes (NAV-0271..0278) — distinct from every code used
     elsewhere in the build. */
  const SELF_LAGGARDS = [
    { code: "NAV-0271", nameKey: "hrr.p.farhan", dept: "Mathematics" },
    { code: "NAV-0272", nameKey: "hrr.p.bhavna", dept: "Mathematics" },
    { code: "NAV-0273", nameKey: "hrr.p.ritika", dept: "Primary" },
    { code: "NAV-0274", nameKey: "hrr.p.omprakash", dept: "Primary" },
    { code: "NAV-0275", nameKey: "hrr.p.sana", dept: "Pre-primary" },
    { code: "NAV-0276", nameKey: "hrr.p.deepika", dept: "Pre-primary" },
    { code: "NAV-0277", nameKey: "hrr.p.imran", dept: "Languages" },
    { code: "NAV-0278", nameKey: "hrr.p.charu", dept: "Languages" },
  ];

  /* ============================================================
     HR-37 · report library. Every figure below is either a plain
     seed constant or, for the leave-liability report, computed from
     per-category parts at render time (never a typed total).
     ============================================================ */
  const TODAY_ISO = "2026-08-11";
  const AY_START_ISO = "2026-04-01";

  const HEADCOUNT_BY_CAMPUS = [
    { id: "indiranagar", key: "kit.campus.indiranagar", count: 132 },
    { id: "whitefield", key: "kit.campus.whitefield", count: 82 },
  ];
  const HEADCOUNT_BY_EMPLOYMENT = [
    { key: "hrr.rep.hc.emp.permanent", count: 168 },
    { key: "hrr.rep.hc.emp.probation", count: 14 },
    { key: "hrr.rep.hc.emp.contract", count: 23 },
    { key: "hrr.rep.hc.emp.guest", count: 9 },
  ];

  const ATTRITION_MONTHS = [
    { m: 4, joiners: 3, leavers: 1 },
    { m: 5, joiners: 2, leavers: 0 },
    { m: 6, joiners: 5, leavers: 2 },
    { m: 7, joiners: 4, leavers: 1 },
    { m: 8, joiners: 3, leavers: 1 },
  ];

  const DOC_COMPLIANCE = { verified: 187, pending: 19, expired: 11 };
  const CONTRACT_EXPIRY = { d30: 4, d60: 6, d90: 3 };
  const RECRUITMENT_FUNNEL = [
    { key: "hrr.rep.rf.applied", count: 86 },
    { key: "hrr.rep.rf.screened", count: 41 },
    { key: "hrr.rep.rf.interviewed", count: 18 },
    { key: "hrr.rep.rf.offered", count: 7 },
    { key: "hrr.rep.rf.joined", count: 5 },
  ];

  /* leave liability — only categories where is_vacation_staff is false
     accrue EL at all (hr-leaveatt.jsx HR-26: EL does not apply to
     teaching staff). Guest faculty are fixed-term and excluded from
     the same ledger for the same reason attendance.jsx/leave.jsx never
     accrue them a balance. avgBalance/dailyRate are per-category
     averages; `liability` is computed, never typed. */
  const LEAVE_LIABILITY_CATS = [
    { nameKey: "hrr.cat.n.nonTeachAdmin", count: 22, avgBalance: 10, dailyRate: 1500 },
    { nameKey: "hrr.cat.n.transport", count: 14, avgBalance: 8, dailyRate: 1000 },
    { nameKey: "hrr.cat.n.hostelFacilities", count: 18, avgBalance: 9, dailyRate: 1150 },
    { nameKey: "hrr.cat.n.sports", count: 6, avgBalance: 7, dailyRate: 1250 },
    { nameKey: "hrr.cat.n.securityHousekeeping", count: 15, avgBalance: 6, dailyRate: 900 },
  ];
  const ATTENDANCE_EXCEPTIONS_OPEN = 11;

  const PROBATION_REPORT = { onProbation: 14, dueThisMonth: 3, confirmedSession: 9 };

  const DEPARTMENTS_TEACHING = ["Science", "Mathematics", "Primary", "Pre-primary", "Languages"];

  const REPORTS_SEED = [
    { id: "headcount", icon: "staff", lastRunISO: "2026-08-05", lastRunByKey: "hrr.who.meera" },
    { id: "attrition", icon: "arrowUp", lastRunISO: null, lastRunByKey: null },
    { id: "docCompliance", icon: "document", lastRunISO: "2026-08-09", lastRunByKey: "hrr.who.meera" },
    { id: "contractExpiry", icon: "clock", lastRunISO: null, lastRunByKey: null },
    { id: "recruitment", icon: "briefcase", lastRunISO: null, lastRunByKey: null },
    { id: "leaveAttendance", icon: "leave", lastRunISO: "2026-08-01", lastRunByKey: "hrr.who.meera" },
    { id: "probation", icon: "half", lastRunISO: null, lastRunByKey: null },
  ];

  /* ============================================================
     HELPERS — the shape every HR v3 file repeats locally (kit.jsx is
     out of scope for this dispatch; each is a promotion candidate,
     named again in the self-check at the end of this file).
     ============================================================ */
  function parseISO(s) { const p = s.split("-"); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function fmt(t, iso) { const d = parseISO(iso); return d.getDate() + " " + t("hrr.mo." + (d.getMonth() + 1)) + " " + d.getFullYear(); }

  function TopStrip({ navKey, campus, onCampus }) {
    const { t } = useLang();
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 0 }}>
          <span style={{ fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 700, color: c.ink }}>{t(navKey)}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint, fontFamily: G3.font.ui, fontSize: 12.5 }}>·</span>
          <span style={{ fontFamily: G3.font.ui, fontSize: 12.5, color: c.inkMuted }}>{t("home.school")}, {campusLabel(t, campus)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onCampus ? <CampusSwitch value={campus} onChange={onCampus} /> : null}
          <ThemeToggle />
        </div>
      </div>
    );
  }

  function PageHeader({ title, sub, meta, right }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={ty("h1", { margin: 0, color: c.ink })}>{title}</h1>
          {sub ? <p style={ty("body", { margin: "6px 0 0", color: c.inkMuted, maxWidth: 780 })}>{sub}</p> : null}
          {meta ? <p style={ty("caption", { margin: "8px 0 0", color: c.inkFaint })}>{meta}</p> : null}
        </div>
        {right ? <div style={{ flexShrink: 0, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{right}</div> : null}
      </header>
    );
  }

  function Note({ children, style }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return <p style={ty("caption", Object.assign({ color: c.inkFaint, margin: "10px 2px 0", maxWidth: 820 }, style || {}))}>{children}</p>;
  }

  /* a tinted, iconed, WORDED panel — the tint/text pair is a data
     role's, never a bespoke colour, and the word always accompanies it */
  function Callout({ tone, icon, title, body, children, action, compact }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const key = tone || "off";
    const tint = c[key + "Tint"] || c.sunken;
    const text = c[key + "Text"] || c.inkMuted;
    return (
      <div style={{ background: tint, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: compact ? "12px 14px" : "15px 17px", display: "flex", gap: 13, alignItems: "flex-start" }}>
        <span aria-hidden="true" style={{ color: text, display: "flex", paddingTop: 2, flexShrink: 0 }}><Icon name={icon || "alert"} size={17} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          {title ? <div style={ty("h3", { color: text, margin: 0 })}>{title}</div> : null}
          {body ? <p style={ty("small", { color: c.ink, margin: title ? "5px 0 0" : 0 })}>{body}</p> : null}
          {children}
        </div>
        {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
      </div>
    );
  }

  function Flash({ text, onDismiss }) {
    const { c } = useTheme();
    const { ty, t } = useLang();
    if (!text) return null;
    return (
      <div
        role="status" aria-label={t("hrr.flash.aria")}
        style={{ display: "flex", alignItems: "flex-start", gap: 11, background: c.presentTint, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: "12px 14px", marginBottom: G3.layout.gap }}
      >
        <span aria-hidden="true" style={{ color: c.presentText, display: "flex", paddingTop: 1 }}><Icon name="check" size={16} /></span>
        <p style={ty("small", { margin: 0, color: c.ink, flex: 1 })}>{text}</p>
        <LinkButton onClick={onDismiss}>{t("hrr.dismiss")}</LinkButton>
      </div>
    );
  }

  function FieldError({ children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    if (!children) return null;
    return (
      <p role="alert" style={ty("caption", { color: c.dangerText, margin: "6px 2px 0", display: "flex", gap: 6, alignItems: "center" })}>
        <span aria-hidden="true" style={{ display: "flex" }}><Icon name="alert" size={13} /></span>{children}
      </p>
    );
  }

  function TextArea({ id, value, onChange, placeholder, invalid, rows }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <textarea
        id={id} rows={rows || 3} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid ? "true" : undefined}
        style={ty("small", {
          width: "100%", resize: "vertical", padding: "11px 13px",
          borderRadius: G3.r.md, background: c.surface, color: c.ink,
          border: "1px solid " + (invalid ? c.danger : c.borderStrong),
          fontFamily: "inherit",
        })}
      />
    );
  }

  /* a native radio group — real inputs for platform keyboard/SR
     behaviour, with a description per option for the choices in this
     product that carry a real consequence. NEVER pre-selected when the
     choice has no safe default (value starts ""). */
  function ChoiceList({ name, value, onChange, options, label, error }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <fieldset style={{ border: 0, margin: "12px 0 0", padding: 0, minWidth: 0 }}>
        {label ? <legend style={ty("caption", { color: c.inkMuted, fontWeight: 700, padding: 0, marginBottom: 8 })}>{label}</legend> : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {options.map((o) => (
            <label
              key={o.value} htmlFor={name + "-" + o.value}
              style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 13px", borderRadius: G3.r.md, cursor: "pointer",
                background: value === o.value ? c.accentSoft : c.alt,
                border: "1px solid " + (value === o.value ? c.accent : c.border) }}
            >
              <input
                type="radio" id={name + "-" + o.value} name={name} value={o.value}
                checked={value === o.value} onChange={() => onChange(o.value)}
                style={{ accentColor: c.accent, marginTop: 2, flexShrink: 0 }}
              />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{o.label}</span>
                {o.note ? <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 3 })}>{o.note}</span> : null}
              </span>
            </label>
          ))}
        </div>
        <FieldError>{error}</FieldError>
      </fieldset>
    );
  }

  /* label / value pair, used everywhere a record is read rather than edited */
  function DefRow({ label, children, mono }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "7px 0", borderBottom: "1px solid " + c.rule }}>
        <span style={ty("caption", { color: c.inkFaint, width: 150, flexShrink: 0 })}>{label}</span>
        <span style={mono ? G3.fig("sm", { color: c.ink, flex: 1 }) : ty("small", { color: c.ink, flex: 1 })}>{children}</span>
      </div>
    );
  }

  /* a centred, portal-rendered confirm dialog — for every act on these
     screens that must not be one click in a card. */
  function ConfirmDialog({ title, body, children, confirmLabel, cancelLabel, onConfirm, onCancel, tone }) {
    const { c, shadow } = useTheme();
    const { ty, lang } = useLang();
    const boxRef = React.useRef(null);
    React.useEffect(() => {
      function onKey(e) { if (e.key === "Escape") onCancel(); }
      document.addEventListener("keydown", onKey);
      if (boxRef.current) boxRef.current.focus();
      return () => document.removeEventListener("keydown", onKey);
      // eslint-disable-next-line
    }, []);
    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div aria-hidden="true" onClick={onCancel} style={{ position: "absolute", inset: 0, background: G3.dark.page, opacity: 0.55 }} />
        <div
          ref={boxRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
          className="nv3"
          style={{
            position: "relative", width: "min(600px, 100%)", maxHeight: "88vh", overflowY: "auto",
            background: c.surface, color: c.ink, border: "1px solid " + c.border, borderRadius: G3.r.card,
            boxShadow: shadow(4), padding: G3.layout.cardPad,
            fontFamily: G3.font.ui,
          }}
        >
          <h2 style={ty("h2", { margin: 0, color: c.ink })}>{title}</h2>
          {body ? <p style={ty("small", { color: c.inkMuted, margin: "8px 0 0" })}>{body}</p> : null}
          {children}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18, flexWrap: "wrap" }}>
            <Button kind="ghost" onClick={onCancel}>{cancelLabel}</Button>
            <Button kind={tone === "brass" ? "brass" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function Actions({ children }) {
    return <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>{children}</div>;
  }

  /* a money figure with its derivation printed beside it — a rupee
     figure on an HR screen never floats free of where it came from */
  function Money({ value, note, tone }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
        <span style={G3.fig("md", { color: tone || c.ink, fontWeight: 600 })}>{inr(value)}</span>
        {note ? <span style={ty("caption", { color: c.inkFaint })}>{note}</span> : null}
      </span>
    );
  }

  /* ============================================================
     HR-08 · STAFF CATEGORIES & TAXONOMY
     "what kinds of staff exist here, and what does each kind imply?"

     Pay groups are never shown or set here (screen-inventory "Must
     NOT contain: pay groups — PY-02 owns pay logic") — only a
     cross-reference note when the vacation flag changes, since that
     flag usually implies a pay-group review too. Full leave
     entitlements are hr-leaveatt.jsx's (HR-26); this screen carries
     only the boolean that decides whether EL applies at all.
     ============================================================ */
  function CategoriesTab({ flash, setFlash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [categories, setCategories] = useState(CATEGORIES_SEED);
    const [addOpen, setAddOpen] = useState(false);
    const [addDraft, setAddDraft] = useState({ name: "", kind: "", minQual: "", probation: "", vac: "" });
    const [addErr, setAddErr] = useState({});
    const [editId, setEditId] = useState(null);
    const [editDraft, setEditDraft] = useState(null);
    const [editEffISO, setEditEffISO] = useState("2026-09-01");
    const [editChoice, setEditChoice] = useState("");
    const [editErr, setEditErr] = useState({});
    const [deactivateId, setDeactivateId] = useState(null);

    const qualUnsetCount = categories.filter((x) => !x.minQualKey && x.state === "active").length;
    const editingCat = editId ? categories.filter((x) => x.id === editId)[0] : null;

    function kindLabel(kind) { return t("hrr.cat.kind." + kind); }

    function openEdit(cat) {
      setEditId(cat.id);
      setEditDraft({ kind: cat.kind, minQualKey: cat.minQualKey, probation: cat.probation, vac: cat.vac });
      setEditEffISO("2026-09-01");
      setEditChoice("");
      setEditErr({});
    }

    function vacChanged() { return editingCat && editDraft && editDraft.vac !== editingCat.vac; }

    function doSaveEdit() {
      const errs = {};
      if (vacChanged() && !editChoice) errs.choice = t("hrr.cat.edit.balMissing");
      if (Object.keys(errs).length) { setEditErr(errs); return; }
      const name = t(editingCat.nameKey);
      setCategories((prev) => prev.map((x) => (x.id === editId
        ? Object.assign({}, x, { kind: editDraft.kind, minQualKey: editDraft.minQualKey, probation: editDraft.probation, vac: editDraft.vac })
        : x)));
      setFlash(t("hrr.cat.edit.done", { name, vac: t(editDraft.vac ? "hrr.cat.vac.yes" : "hrr.cat.vac.no"), eff: fmt(t, editEffISO) }));
      setEditId(null); setEditDraft(null); setEditErr({});
    }

    function doAdd() {
      const errs = {};
      if (!addDraft.name.trim()) errs.name = t("hrr.cat.field.nameMissing");
      if (!addDraft.kind) errs.kind = t("hrr.cat.field.kindMissing");
      if (!addDraft.vac) errs.vac = t("hrr.cat.field.vacMissing");
      if (Object.keys(errs).length) { setAddErr(errs); return; }
      const id = "custom-" + Date.now();
      setCategories((prev) => prev.concat([{
        id, nameKey: null, nameText: addDraft.name.trim(), kind: addDraft.kind,
        minQualKey: null, minQualText: addDraft.minQual.trim() || null,
        vac: addDraft.vac === "yes", probation: addDraft.probation ? Number(addDraft.probation) : null,
        count: 0, state: "unused",
      }]));
      setFlash(t("hrr.cat.add.done", { name: addDraft.name.trim() }));
      setAddOpen(false); setAddDraft({ name: "", kind: "", minQual: "", probation: "", vac: "" }); setAddErr({});
    }

    function catName(cat) { return cat.nameKey ? t(cat.nameKey) : cat.nameText; }
    function catMinQual(cat) { return cat.minQualKey ? t(cat.minQualKey) : cat.minQualText; }

    const columns = [
      { key: "name", label: t("hrr.cat.col.name") },
      { key: "kind", label: t("hrr.cat.col.kind") },
      { key: "minQual", label: t("hrr.cat.col.minQual") },
      { key: "vacation", label: t("hrr.cat.col.vacation") },
      { key: "probation", label: t("hrr.cat.col.probation") },
      { key: "count", label: t("hrr.cat.col.count"), align: "right", width: 70 },
      { key: "menu", label: t("hrr.cat.col.menu"), align: "right", width: 44 },
    ];

    const rows = categories.map((cat) => {
      const name = catName(cat);
      const minQual = catMinQual(cat);
      return {
        id: cat.id,
        cells: {
          name: (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TitleMark icon="staff" iconTone={cat.state === "unused" ? "off" : "accent"} size={28} />
              <span>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{name}</span>
                {cat.state === "unused" ? <StatusMark role="off" word={t("hrr.cat.state.unused")} /> : null}
              </span>
            </span>
          ),
          kind: <Chip bg={c.sunken} fg={c.inkMuted}>{kindLabel(cat.kind)}</Chip>,
          minQual: minQual
            ? <span style={ty("small", { color: c.ink })}>{minQual}</span>
            : <StatusMark role="late" word={t("hrr.cat.minQual.unset")} />,
          vacation: cat.vac
            ? <StatusMark role="leave" glyph="leave" word={t("hrr.cat.vac.yes")} />
            : <StatusMark role="present" glyph="check" word={t("hrr.cat.vac.no")} />,
          probation: cat.probation != null
            ? <span style={G3.fig("sm", { color: c.ink })}>{t("hrr.cat.probation.n", { n: num(cat.probation) })}</span>
            : <span style={ty("caption", { color: c.inkFaint })}>{t("hrr.cat.probation.none")}</span>,
          count: <span style={G3.fig("sm", { color: c.ink, fontWeight: 600 })}>{num(cat.count)}</span>,
          menu: (
            <ActionMenu
              ariaLabel={t("hrr.cat.menu.aria", { name })}
              items={[
                { key: "edit", icon: "filing", label: t("hrr.cat.menu.edit"), onSelect: () => openEdit(cat) },
                { key: "view", icon: "staff", label: t("hrr.cat.menu.viewStaff"), disabled: cat.count === 0, reason: cat.count === 0 ? t("hrr.cat.state.unused") : undefined, onSelect: () => setFlash(t("hrr.cat.viewStaff.hint", { name })) },
                cat.count > 0
                  ? { key: "deact", icon: "lock", label: t("hrr.cat.menu.deactivate"), disabled: true, reason: t("hrr.cat.menu.deactivateDisabled", { n: num(cat.count) }) }
                  : { key: "deact", icon: "lock", label: t("hrr.cat.menu.deactivate"), onSelect: () => setDeactivateId(cat.id) },
              ]}
            />
          ),
        },
      };
    });

    const deactivateCat = deactivateId ? categories.filter((x) => x.id === deactivateId)[0] : null;

    /* every category is in use or it is not; the other two figures
       are about the people and the gaps, and belong out of the bar */
    const inUse = categories.filter((x) => x.count > 0);
    const unused = categories.filter((x) => x.count === 0);
    const covered = categories.reduce((n, x) => n + x.count, 0);
    const vacCats = categories.filter((x) => x.vac);
    const facts = [
      { k: "use", label: t("hrr.cat.f.use"), value: num(inUse.length), n: inUse.length,
        note: t("hrr.cat.f.useNote", { n: num(covered) }), tone: c.chartGreen },
      { k: "unused", label: t("hrr.cat.f.unused"), value: num(unused.length), n: unused.length,
        note: unused.length ? catName(unused[0]) : t("hrr.cat.f.unusedNone"), tone: c.chartSand },
      { k: "vac", label: t("hrr.cat.f.vac"), value: num(vacCats.length), bar: false,
        note: t("hrr.cat.f.vacNote"), tone: c.chartBlue },
      { k: "qual", label: t("hrr.cat.f.qual"), value: num(qualUnsetCount), bar: false,
        note: qualUnsetCount ? t("hrr.cat.f.qualNote") : t("hrr.cat.f.qualNone"),
        tone: c.chartAmber, warn: qualUnsetCount > 0 },
    ];

    return (
      <div>
        <Band metrics={facts} />

        <Register
          title={t("hrr.cat.title")} sub={t("hrr.cat.sub")}
          action={<Button kind="primary" iconLeft="staff" onClick={() => setAddOpen(true)}>{t("hrr.cat.add")}</Button>}
          columns={columns} rows={rows}
          footer={
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              <Note style={{ margin: 0 }}>{t("hrr.cat.scopeNote")}</Note>
              <Note style={{ margin: 0 }}>{t("hrr.cat.leaveRef") + " — hr-leaveatt.jsx, HR-26."}</Note>
            </div>
          }
        />

        {addOpen ? (
          <ConfirmDialog
            title={t("hrr.cat.add.title")} confirmLabel={t("hrr.cat.add.confirm")} cancelLabel={t("hrr.act.cancel")}
            onCancel={() => { setAddOpen(false); setAddErr({}); }} onConfirm={doAdd}
          >
            <Field id="hrr-add-name" label={t("hrr.cat.field.name")}>
              <Input id="hrr-add-name" value={addDraft.name} placeholder={t("hrr.cat.field.namePh")} onChange={(v) => setAddDraft((d) => Object.assign({}, d, { name: v }))} />
            </Field>
            <FieldError>{addErr.name}</FieldError>
            <Field id="hrr-add-kind" label={t("hrr.cat.field.kind")}>
              <Select
                id="hrr-add-kind" value={addDraft.kind}
                onChange={(v) => setAddDraft((d) => Object.assign({}, d, { kind: v }))}
                options={[{ value: "", label: t("hrr.cat.field.kindPh") }, { value: "teaching", label: t("hrr.cat.kind.teaching") }, { value: "non_teaching", label: t("hrr.cat.kind.non_teaching") }, { value: "support", label: t("hrr.cat.kind.support") }, { value: "guest", label: t("hrr.cat.kind.guest") }]}
              />
            </Field>
            <FieldError>{addErr.kind}</FieldError>
            <Field id="hrr-add-minqual" label={t("hrr.cat.field.minQual")}>
              <Input id="hrr-add-minqual" value={addDraft.minQual} placeholder={t("hrr.cat.field.minQualPh")} onChange={(v) => setAddDraft((d) => Object.assign({}, d, { minQual: v }))} />
            </Field>
            <Field id="hrr-add-probation" label={t("hrr.cat.field.probation")} hint={t("hrr.cat.field.probationHint")}>
              <Input id="hrr-add-probation" inputMode="numeric" value={addDraft.probation} placeholder={t("hrr.cat.field.probationPh")} onChange={(v) => setAddDraft((d) => Object.assign({}, d, { probation: v.replace(/[^0-9]/g, "") }))} />
            </Field>
            <ChoiceList
              name="hrr-add-vac" value={addDraft.vac} onChange={(v) => setAddDraft((d) => Object.assign({}, d, { vac: v }))}
              label={t("hrr.cat.field.vacQ")} error={addErr.vac}
              options={[
                { value: "yes", label: t("hrr.cat.field.vacYes"), note: t("hrr.cat.field.vacYesNote") },
                { value: "no", label: t("hrr.cat.field.vacNo"), note: t("hrr.cat.field.vacNoNote") },
              ]}
            />
          </ConfirmDialog>
        ) : null}

        {editingCat && editDraft ? (
          <ConfirmDialog
            title={t("hrr.cat.edit.title", { name: catName(editingCat) })}
            confirmLabel={t("hrr.cat.edit.save")} cancelLabel={t("hrr.act.cancel")}
            onCancel={() => { setEditId(null); setEditDraft(null); setEditErr({}); }} onConfirm={doSaveEdit}
          >
            <Field id="hrr-edit-kind" label={t("hrr.cat.field.kind")}>
              <Select
                id="hrr-edit-kind" value={editDraft.kind}
                onChange={(v) => setEditDraft((d) => Object.assign({}, d, { kind: v }))}
                options={[{ value: "teaching", label: t("hrr.cat.kind.teaching") }, { value: "non_teaching", label: t("hrr.cat.kind.non_teaching") }, { value: "support", label: t("hrr.cat.kind.support") }, { value: "guest", label: t("hrr.cat.kind.guest") }]}
              />
            </Field>
            <Field id="hrr-edit-probation" label={t("hrr.cat.field.probation")}>
              <Input id="hrr-edit-probation" inputMode="numeric" value={editDraft.probation == null ? "" : String(editDraft.probation)} onChange={(v) => setEditDraft((d) => Object.assign({}, d, { probation: v ? Number(v.replace(/[^0-9]/g, "")) : null }))} />
            </Field>
            <ChoiceList
              name="hrr-edit-vac" value={editDraft.vac ? "yes" : "no"} onChange={(v) => setEditDraft((d) => Object.assign({}, d, { vac: v === "yes" }))}
              label={t("hrr.cat.field.vacQ")}
              options={[
                { value: "yes", label: t("hrr.cat.field.vacYes"), note: t("hrr.cat.field.vacYesNote") },
                { value: "no", label: t("hrr.cat.field.vacNo"), note: t("hrr.cat.field.vacNoNote") },
              ]}
            />
            {vacChanged() ? (
              <div style={{ marginTop: 14 }}>
                <Callout tone="late" icon="alert" title={t("hrr.cat.edit.vacChangedHead")} body={t("hrr.cat.edit.vacChangedBody", { n: num(editingCat.count), name: catName(editingCat) })} compact />
                <Field id="hrr-edit-eff" label={t("hrr.cat.edit.effLabel")}>
                  <Input id="hrr-edit-eff" type="date" value={editEffISO} onChange={setEditEffISO} />
                </Field>
                <ChoiceList
                  name="hrr-edit-bal" value={editChoice} onChange={(v) => { setEditChoice(v); setEditErr({}); }}
                  label={t("hrr.cat.edit.balLabel")} error={editErr.choice}
                  options={[
                    { value: "recalc", label: t("hrr.cat.edit.bal.recalc"), note: t("hrr.cat.edit.bal.recalcNote", { n: num(editingCat.count) }) },
                    { value: "grand", label: t("hrr.cat.edit.bal.grand"), note: t("hrr.cat.edit.bal.grandNote", { eff: fmt(t, editEffISO) }) },
                  ]}
                />
              </div>
            ) : (
              <Note>{t("hrr.cat.edit.unchangedNote")}</Note>
            )}
          </ConfirmDialog>
        ) : null}

        {deactivateCat ? (
          <ConfirmDialog
            title={t("hrr.cat.deactivate.title", { name: catName(deactivateCat) })}
            body={t("hrr.cat.deactivate.body", { name: catName(deactivateCat) })}
            confirmLabel={t("hrr.cat.deactivate.confirm")} cancelLabel={t("hrr.act.cancel")}
            onCancel={() => setDeactivateId(null)}
            onConfirm={() => {
              setCategories((prev) => prev.map((x) => (x.id === deactivateId ? Object.assign({}, x, { state: "deactivated" }) : x)));
              setFlash(t("hrr.cat.deactivate.done", { name: catName(deactivateCat) }));
              setDeactivateId(null);
            }}
          />
        ) : null}
      </div>
    );
  }

  function sampleFor(field) {
    const table = {
      "{name}": "Ananya Rao", "{type}": "Leave", "{date}": "12 Aug 2026",
      "{decision}": "approved", "{doc_type}": "PAN card",
      "{due_date}": "20 Aug 2026", "{item}": "Police verification",
      "{expires_on}": "15 Sep 2026", "{month}": "July 2026",
      "{filing}": "PF/ECR", "{ticket_id}": "TCK-2231", "{category}": "Payroll query",
      "{cycle_name}": "Term 1 Appraisal 2026–27", "{window_end}": "31 Aug 2026",
    };
    return table[field] || field;
  }
  function renderPreview(body, fields) {
    return body.replace(/\{[a-z_]+\}/g, (tok) => (fields.indexOf(tok) === -1 ? tok : sampleFor(tok)));
  }

  /* ============================================================
     HR-34 · NOTIFICATION TEMPLATES
     "what does the system say to people on our behalf?"
     ============================================================ */
  function TemplatesTab({ flash, setFlash }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const [events, setEvents] = useState(EVENTS_SEED);
    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState(null);
    const [editErr, setEditErr] = useState("");
    const [testId, setTestId] = useState(null);

    const editingEv = editingId ? events.filter((e) => e.id === editingId)[0] : null;
    const missingHiCount = events.filter((e) => !e.bodyHi).length;

    function toggleChannel(ev, ch) {
      const enabledCount = Object.keys(ev.channels).filter((k) => ev.channels[k]).length;
      if (ev.compliance && ev.channels[ch] && enabledCount <= 1) {
        setFlash(t("hrr.tpl.lastChannelBlocked"));
        return;
      }
      setEvents((prev) => prev.map((e) => (e.id === ev.id ? Object.assign({}, e, { channels: Object.assign({}, e.channels, { [ch]: !e.channels[ch] }) }) : e)));
    }

    function openEdit(ev) {
      setEditingId(ev.id);
      setEditDraft({ bodyEn: ev.bodyEn, bodyHi: ev.bodyHi });
      setEditErr("");
    }

    function doSaveEdit() {
      const badEn = unresolvedField(editDraft.bodyEn, editingEv.fields);
      const badHi = editDraft.bodyHi ? unresolvedField(editDraft.bodyHi, editingEv.fields) : null;
      const bad = badEn || badHi;
      if (bad) { setEditErr(t("hrr.tpl.unresolvedField", { field: bad })); return; }
      setEvents((prev) => prev.map((e) => (e.id === editingId ? Object.assign({}, e, { bodyEn: editDraft.bodyEn, bodyHi: editDraft.bodyHi }) : e)));
      setFlash(t("hrr.tpl.editSaved"));
      setEditingId(null); setEditDraft(null); setEditErr("");
    }

    function setLeadDays(id, n) {
      setEvents((prev) => prev.map((e) => (e.id === id ? Object.assign({}, e, { leadDays: n }) : e)));
    }

    const testEv = testId ? events.filter((e) => e.id === testId)[0] : null;
    const testBlockedByProvider = testEv && testEv.channels.sms && !PROVIDERS.sms;

    const columns = [
      { key: "event", label: t("hrr.tpl.col.event") },
      { key: "channels", label: t("hrr.tpl.col.channels") },
      { key: "language", label: t("hrr.tpl.col.language") },
      { key: "leadTime", label: t("hrr.tpl.col.leadTime") },
      { key: "menu", label: t("hrr.tpl.col.menu"), align: "right", width: 44 },
    ];

    const rows = events.map((ev) => {
      const name = t("hrr.tpl.ev." + ev.id + ".name");
      const recipient = t("hrr.tpl.ev." + ev.id + ".recipient");
      const bad = unresolvedField(ev.bodyEn, ev.fields) || (ev.bodyHi ? unresolvedField(ev.bodyHi, ev.fields) : null);
      return {
        id: ev.id,
        cells: {
          event: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{name}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{recipient}</span>
              {bad ? <span style={{ display: "block", marginTop: 4 }}><StatusMark role="absent" glyph="alert" word={t("hrr.tpl.unresolvedField", { field: bad })} /></span> : null}
            </span>
          ),
          channels: (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["inApp", "push", "sms", "email"].map((ch) => {
                const on = ev.channels[ch];
                const locked = ev.compliance && on && Object.keys(ev.channels).filter((k) => ev.channels[k]).length <= 1;
                return (
                  <button
                    key={ch} type="button" aria-pressed={on} title={locked ? t("hrr.tpl.lockedNote") : undefined}
                    onClick={() => toggleChannel(ev, ch)}
                    style={{
                      border: "1px solid " + (on ? c.accent : c.border), borderRadius: G3.r.pill, padding: "3px 10px",
                      background: on ? c.accentSoft : "transparent", color: on ? c.ink : c.inkMuted,
                      fontFamily: G3.font.ui, fontSize: 11.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4,
                    }}
                  >
                    {locked ? <Icon name="lock" size={10} /> : null}
                    {t("hrr.tpl.ch." + ch)}
                  </button>
                );
              })}
            </div>
          ),
          language: ev.bodyHi
            ? <StatusMark role="present" glyph="check" word={t("hrr.tpl.lang.both")} />
            : <StatusMark role="missing" glyph="alert" word={t("hrr.tpl.lang.missing")} />,
          leadTime: ev.scheduled
            ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 56 }}>
                  <Input id={"hrr-lead-" + ev.id} inputMode="numeric" value={String(ev.leadDays)} onChange={(v) => setLeadDays(ev.id, v ? Number(v.replace(/[^0-9]/g, "")) : 0)} />
                </div>
                <span style={ty("caption", { color: c.inkFaint, whiteSpace: "nowrap" })}>{t("hrr.tpl.leadSuffix")}</span>
              </div>
            )
            : <span style={ty("caption", { color: c.inkFaint })}>{t("hrr.tpl.leadNone")}</span>,
          menu: (
            <ActionMenu
              ariaLabel={name}
              items={[
                { key: "edit", icon: "filing", label: t("hrr.tpl.menu.edit"), onSelect: () => openEdit(ev) },
                bad
                  ? { key: "test", icon: "mail", label: t("hrr.tpl.menu.sendTest"), disabled: true, reason: t("hrr.tpl.menu.sendTestDisabled") }
                  : { key: "test", icon: "mail", label: t("hrr.tpl.menu.sendTest"), onSelect: () => setTestId(ev.id) },
              ]}
            />
          ),
        },
      };
    });

    /* every event is written in both languages or it is not --
       which is the one thing a school in Karnataka has to know about
       a message it sends to a teacher's phone */
    const both = events.filter((ev) => !!ev.bodyHi);
    const enOnly = events.filter((ev) => !ev.bodyHi);
    const scheduled = events.filter((ev) => ev.scheduled);
    const facts = [
      { k: "both", label: t("hrr.tpl.f.both"), value: num(both.length), n: both.length,
        note: t("hrr.tpl.f.bothNote"), tone: c.chartGreen },
      { k: "en", label: t("hrr.tpl.f.en"), value: num(enOnly.length), n: enOnly.length,
        note: enOnly.length ? t("hrr.tpl.ev." + enOnly[0].id + ".name") : t("hrr.tpl.f.enNone"),
        tone: c.chartAmber, warn: enOnly.length > 0 },
      { k: "sch", label: t("hrr.tpl.f.sch"), value: num(scheduled.length), bar: false,
        note: t("hrr.tpl.f.schNote"), tone: c.chartBlue },
    ];

    return (
      <div>
        <Band metrics={facts} />

        <Register
          title={t("hrr.tpl.title")} sub={t("hrr.tpl.sub")}
          columns={columns} rows={rows}
          footer={<Note style={{ margin: 0 }}>{t("hrr.tpl.complianceBody")}</Note>}
        />

        {editingEv && editDraft ? (
          <ConfirmDialog
            title={t("hrr.tpl.ev." + editingEv.id + ".name")}
            confirmLabel={t("hrr.act.save")} cancelLabel={t("hrr.act.cancel")}
            onCancel={() => { setEditingId(null); setEditDraft(null); setEditErr(""); }} onConfirm={doSaveEdit}
          >
            <Note style={{ marginTop: 0 }}>{t("hrr.tpl.mergeFields", { list: editingEv.fields.join(", ") })}</Note>
            <Field id="hrr-tpl-en" label={t("hrr.tpl.body.en")}>
              <TextArea id="hrr-tpl-en" rows={3} value={editDraft.bodyEn} onChange={(v) => setEditDraft((d) => Object.assign({}, d, { bodyEn: v }))} />
            </Field>
            <Field id="hrr-tpl-hi" label={t("hrr.tpl.body.hi")} hint={!editDraft.bodyHi ? t("hrr.tpl.body.hiEmptyHint") : undefined}>
              <TextArea id="hrr-tpl-hi" rows={3} value={editDraft.bodyHi} onChange={(v) => setEditDraft((d) => Object.assign({}, d, { bodyHi: v }))} />
            </Field>
            <FieldError>{editErr}</FieldError>
            <div style={{ marginTop: 10, padding: "10px 12px", background: c.alt, borderRadius: G3.r.md, border: "1px solid " + c.border }}>
              <div style={ty("caption", { color: c.inkFaint, marginBottom: 5 })}>{t("hrr.tpl.previewLabel")}</div>
              <div style={ty("small", { color: c.ink })}>{renderPreview(editDraft.bodyEn, editingEv.fields)}</div>
            </div>
          </ConfirmDialog>
        ) : null}

        {testEv ? (
          <ConfirmDialog
            title={t("hrr.tpl.test.title")}
            body={testBlockedByProvider ? undefined : t("hrr.tpl.test.body")}
            confirmLabel={t("hrr.tpl.test.confirm")} cancelLabel={t("hrr.act.cancel")}
            onCancel={() => setTestId(null)}
            onConfirm={() => {
              if (testBlockedByProvider) return;
              setFlash(t("hrr.tpl.test.done"));
              setTestId(null);
            }}
          >
            {testBlockedByProvider ? (
              <Callout tone="late" icon="alert" title={t("hrr.tpl.test.noProviderHead")} body={t("hrr.tpl.test.noProviderBody")} compact />
            ) : null}
          </ConfirmDialog>
        ) : null}
      </div>
    );
  }

  function matrixComplete(cycle) {
    if (!cycle.weighting || !cycle.matrixLabels || cycle.matrixLabels.length < 3) return false;
    const sum = cycle.weighting.self + cycle.weighting.manager + cycle.weighting.peer;
    return sum === 100;
  }

  /* ============================================================
     HR-35 · APPRAISAL CYCLE SETUP
     "how does this appraisal round run?" No hardcoded 1–5 scale
     (guard-hardcoded-values) — the draft cycle starts with ZERO scale
     points, and Open stays disabled, with the reason stated beside it,
     until HR defines at least three and weights that sum to 100%.
     ============================================================ */
  /* ============================================================
     APPRAISALS — what has been decided, across the register.
     ============================================================ */
  const APPR_ROWS = [
    { id: "AP-0003", campus: "indiranagar", who: "Ananya Rao", code: "NAV-0142", deptKey: "hrr.ap.d.science", onISO: "2026-03-28",
      fromPost: "Post Graduate Teacher, Physics", toPost: "Post Graduate Teacher, Physics", moved: false,
      byKey: "hrr.ap.by.anjali", grossBefore: 88000, grossAfter: 94800, saidKey: "hrr.ap.s.ananya" },
    { id: "AP-0011", campus: "indiranagar", who: "Meenakshi Pillai", code: "NAV-0088", deptKey: "hrr.ap.d.science", onISO: "2026-03-28",
      fromPost: "Post Graduate Teacher, Chemistry", toPost: "Head of Science", moved: true,
      byKey: "hrr.ap.by.rajan", grossBefore: 96000, grossAfter: 118000, saidKey: "hrr.ap.s.meenakshi" },
    { id: "AP-0009", campus: "whitefield", who: "Ramesh Iyengar", code: "NAV-0301", deptKey: "hrr.ap.d.admin", onISO: "2026-03-26",
      fromPost: "Facilities in-charge", toPost: "Facilities in-charge", moved: false,
      byKey: "hrr.ap.by.rajan", grossBefore: 44000, grossAfter: 46500, saidKey: "hrr.ap.s.ramesh" },
    { id: "AP-0007", campus: "indiranagar", who: "Kavya Nair", code: "NAV-0410", deptKey: "hrr.ap.d.primary", onISO: "2025-03-27",
      fromPost: "Primary Teacher, Class III", toPost: "Primary Teacher, Class III", moved: false,
      byKey: "hrr.ap.by.anjali", grossBefore: 52000, grossAfter: 55000, saidKey: "hrr.ap.s.kavya" },
  ];

  /* the slice that is actually work: nobody has sat down with these
     people in over a year. Derived from the last appraisal on record,
     never a flag somebody sets. */
  const APPR_OVERDUE = [
    { campus: "whitefield", who: "Divya Kapoor", code: "NAV-0233", deptKey: "hrr.ap.d.science", post: "Trained Graduate Teacher, Biology", lastISO: "2024-03-28" },
    { campus: "indiranagar", who: "Suresh Kamath", code: "NAV-0263", deptKey: "hrr.ap.d.admin", post: "Accounts executive", lastISO: "2024-03-28" },
    { campus: "indiranagar", who: "Manjunath Gowda", code: "NAV-0512", deptKey: "hrr.ap.d.transport", post: "Bus driver, Route 4", lastISO: null },
  ];

  function monthsSince(iso) {
    if (!iso) return null;
    const a = iso.split("-").map(Number);
    const b = TODAY_ISO.split("-").map(Number);
    return (b[0] - a[0]) * 12 + (b[1] - a[1]);
  }
  function apprPct(a, b) { return Math.round(((b - a) / a) * 1000) / 10; }

  function AppraisalsTab({ flash, setFlash, onNavigate, campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [view, setView] = useState("done");
    const [dept, setDept] = useState("all");
    const [openId, setOpenId] = useState(null);
    const [pay, setPay] = useState(false);

    const depts = [];
    APPR_ROWS.concat(APPR_OVERDUE).forEach((r) => { if (depts.indexOf(r.deptKey) === -1) depts.push(r.deptKey); });

    const done = APPR_ROWS.filter((r) => inCampus(campus, r.campus) && (dept === "all" || r.deptKey === dept));
    const late = APPR_OVERDUE.filter((r) => inCampus(campus, r.campus) && (dept === "all" || r.deptKey === dept));
    const open = openId ? APPR_ROWS.filter((r) => r.id === openId)[0] : null;

    const doneCols = [
      { key: "who", label: t("hrr.ap.col.who") },
      { key: "on", label: t("hrr.ap.col.on"), width: 140 },
      { key: "post", label: t("hrr.ap.col.post") },
    ];
    const doneRows = done.map((r) => ({
      id: r.id, live: true,
      cells: {
        who: (
          <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
            <Avatar name={r.who} size={30} />
            <span style={{ minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600, whiteSpace: "nowrap" })}>{r.who}</span>
              <span style={G3.fig("micro", { display: "block", color: c.inkFaint, marginTop: 2 })}>{r.code} · {t(r.deptKey)}</span>
            </span>
          </span>
        ),
        on: fmt(t, r.onISO),
        post: r.moved
          ? (
            <span style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
              <span style={ty("small", { color: c.inkMuted })}>{r.fromPost}</span>
              <span aria-hidden="true" style={{ display: "flex", color: c.inkFaint }}><Icon name="arrow" size={14} /></span>
              <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{r.toPost}</span>
            </span>
          )
          : <span style={ty("small", { color: c.inkMuted })}>{t("hrr.ap.stayed", { post: r.toPost })}</span>,
      },
    }));

    const lateCols = [
      { key: "who", label: t("hrr.ap.col.who") },
      { key: "post", label: t("hrr.ap.col.postNow") },
      { key: "last", label: t("hrr.ap.col.last"), width: 240 },
      { key: "chase", label: t("hrr.ap.col.chase"), align: "right", width: 170 },
    ];
    const lateRows = late.map((r) => {
      const m = monthsSince(r.lastISO);
      return {
        id: r.code, live: true,
        cells: {
          who: (
            <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
              <Avatar name={r.who} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600, whiteSpace: "nowrap" })}>{r.who}</span>
                <span style={G3.fig("micro", { display: "block", color: c.inkFaint, marginTop: 2 })}>{r.code} · {t(r.deptKey)}</span>
              </span>
            </span>
          ),
          post: <span style={ty("small", { color: c.inkMuted })}>{r.post}</span>,
          last: m == null
            ? <StatusMark role="absent" glyph="alert" word={t("hrr.ap.never")} />
            : <StatusMark role={m >= 24 ? "absent" : "late"} glyph={m >= 24 ? "alert" : "clock"} word={t("hrr.ap.monthsAgo", { n: num(m) })} />,
          /* ONE ACT, SO IT IS A BUTTON (designer): a menu whose
             only item is "open the record" is a click in the way. */
          chase: (
            <span onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button kind="secondary" size="sm" iconLeft="profile"
                onClick={() => { window.Pages3 = window.Pages3 || {}; window.Pages3.recordTab = "appraisal"; if (onNavigate) onNavigate("hrRecord"); }}>{t("hrr.ap.menuRecord")}</Button>
            </span>
          ),
        },
      };
    });

    /* everybody this tab knows about is in exactly one of the first
       two, and the third counts the ones whose post changed -- a
       subset of the reviewed, so it takes no band of the bar */
    const moved = done.filter((r) => r.moved);
    const oldestLate = late.slice().sort((a, b) => ((a.lastISO || "") < (b.lastISO || "") ? -1 : 1))[0] || null;
    const facts = [
      { k: "done", label: t("hrr.ap.f.done"), value: num(done.length), n: done.length,
        note: done.length ? t("hrr.ap.f.doneNote", { name: done[0].who }) : t("hrr.ap.f.doneNone"),
        tone: c.chartGreen },
      { k: "late", label: t("hrr.ap.f.late"), value: num(late.length), n: late.length,
        note: oldestLate ? t("hrr.ap.f.lateNote", { name: oldestLate.who }) : t("hrr.ap.f.lateNone"),
        tone: c.chartRed, warn: late.length > 0 },
      { k: "moved", label: t("hrr.ap.f.moved"), value: num(moved.length), bar: false,
        note: moved.length ? t("hrr.ap.f.movedNote", { post: moved[0].toPost }) : t("hrr.ap.f.movedNone"),
        tone: c.chartBlue },
    ];

    return (
      <div>
        <Band metrics={facts} />

        {/* two questions, one row: whose reviews, and which of them */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
          <div style={{ flex: "1 1 230px", minWidth: 0, maxWidth: 320 }}>
            <Field id="hrr-ap-view" label={t("hrr.ap.f.view")}>
              <Select id="hrr-ap-view" value={view} onChange={(v) => { setView(v); setOpenId(null); }}
                options={["done", "late"].map((k) => ({ value: k, label: t("hrr.ap.view." + k) }))} />
            </Field>
          </div>
          <div style={{ flex: "1 1 230px", minWidth: 0, maxWidth: 320 }}>
            <Field id="hrr-ap-dept" label={t("hrr.ap.f.dept")}>
              <Select id="hrr-ap-dept" value={dept} onChange={setDept}
                options={[{ value: "all", label: t("hrr.ap.f.deptAll") }].concat(depts.map((d) => ({ value: d, label: t(d) })))} />
            </Field>
          </div>
        </div>

        {view === "done" ? (
          <Register
            title={t("hrr.ap.title")} sub={t("hrr.ap.sub")}
            action={<Button kind="secondary" size="sm" iconLeft="download" onClick={() => setFlash(t("hrr.ap.exported", { n: num(done.length) }))}>{t("hrr.ap.export")}</Button>}
            columns={doneCols} rows={doneRows}
            onSelect={(id) => setOpenId(id)}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("hrr.ap.foot")}</span>}
          />
        ) : (
          <Register
            title={t("hrr.ap.lateTitle")} sub={t("hrr.ap.lateSub")}
            action={<Button kind="secondary" size="sm" iconLeft="download" onClick={() => setFlash(t("hrr.ap.exported", { n: num(late.length) }))}>{t("hrr.ap.export")}</Button>}
            columns={lateCols} rows={lateRows}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("hrr.ap.lateFoot")}</span>}
          />
        )}

        {open ? (
          <SideScreen
            title={open.who}
            sub={open.code + " · " + t(open.deptKey) + " · " + fmt(t, open.onISO)}
            width={620}
            onClose={() => { setOpenId(null); setPay(false); }}
            footer={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", width: "100%", justifyContent: "flex-end" }}>
                <Button kind="ghost" size="sm" onClick={() => { setOpenId(null); setPay(false); }}>{t("hrr.ap.close")}</Button>
                <Button kind="primary" size="sm" iconLeft="profile"
                  onClick={() => { window.Pages3 = window.Pages3 || {}; window.Pages3.recordTab = "appraisal"; if (onNavigate) onNavigate("hrRecord"); }}>{t("hrr.ap.menuRecord")}</Button>
              </div>
            }
          >
            <div style={{ display: "flex", gap: 14, alignItems: "baseline", paddingBottom: 14, borderBottom: "1px solid " + c.rule, flexWrap: "wrap" }}>
              <span style={ty("caption", { color: c.inkFaint, fontWeight: 700, width: 120, flexShrink: 0 })}>{t("hrr.ap.col.post")}</span>
              {open.moved ? (
                <span style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={ty("small", { color: c.inkMuted })}>{open.fromPost}</span>
                  <span aria-hidden="true" style={{ display: "flex", color: c.inkFaint }}><Icon name="arrow" size={14} /></span>
                  <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{open.toPost}</span>
                </span>
              ) : <span style={ty("small", { color: c.ink })}>{t("hrr.ap.stayed", { post: open.toPost })}</span>}
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("hrr.ap.said")}</div>
              <p style={ty("body", { color: c.ink, margin: 0, paddingInlineStart: 14, borderInlineStart: "2px solid " + c.accent, maxWidth: 620 })}>{t(open.saidKey)}</p>
            </div>

            <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid " + c.rule, display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{t("hrr.ap.pay")}</span>
              {pay ? (
                <span style={{ display: "flex", gap: 9, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={G3.fig("sm", { color: c.inkMuted })}>{inr(open.grossBefore)}</span>
                  <span aria-hidden="true" style={{ display: "flex", color: c.inkFaint, alignSelf: "center" }}><Icon name="arrow" size={13} /></span>
                  <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{inr(open.grossAfter)}</span>
                  <span style={ty("caption", { color: c.presentText })}>{t("hrr.ap.rise", { n: String(apprPct(open.grossBefore, open.grossAfter)) })}</span>
                </span>
              ) : <span style={ty("small", { color: c.inkMuted })}>{t("hrr.ap.payHidden")}</span>}
              <button
                type="button" onClick={() => setPay(!pay)} aria-expanded={pay ? "true" : "false"}
                style={ty("caption", { background: "none", border: "none", padding: 0, color: c.action, fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 })}
              >
                {t(pay ? "hrr.ap.payHide" : "hrr.ap.payShow")}
              </button>
            </div>

            <p style={ty("caption", { color: c.inkFaint, margin: "20px 0 0", paddingTop: 14, borderTop: "1px solid " + c.rule })}>
              {t("hrr.ap.by", { who: t(open.byKey), id: open.id })}
            </p>
            <p style={ty("caption", { color: c.inkFaint, margin: "6px 0 0" })}>{t("hrr.ap.detailNote")}</p>
          </SideScreen>
        ) : null}
      </div>
    );
  }

  function ReportsTab({ flash, setFlash, campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [reports, setReports] = useState(REPORTS_SEED);
    const [runFor, setRunFor] = useState(null);     /* the dialog */
    const [resultFor, setResultFor] = useState(null); /* the side screen */

    function rowCountFor(id) {
      if (id === "headcount") return CATEGORIES_SEED.filter((x) => x.state === "active").length + HEADCOUNT_BY_CAMPUS.length + HEADCOUNT_BY_EMPLOYMENT.length;
      if (id === "attrition") return ATTRITION_MONTHS.length;
      if (id === "recruitment") return RECRUITMENT_FUNNEL.length;
      if (id === "leaveAttendance") return LEAVE_LIABILITY_CATS.length;
      return 3;
    }
    function runReport(id, scope) {
      setReports((prev) => prev.map((r) => (r.id === id ? Object.assign({}, r, { lastRunISO: TODAY_ISO, lastRunByKey: "hrr.who.meera", scope: scope }) : r)));
      setRunFor(null);
      setResultFor(id);
      setFlash(t("hrr.rep.ranDone", { report: t("hrr.rep.n." + id), n: num(rowCountFor(id)) }));
    }

    /* WHAT THE LIBRARY HOLDS, AND WHAT HAS BEEN ASKED OF IT. Two
       figures that cut every report in the library one way, and the
       size of the library beside them. */
    const ranBefore = reports.filter((r) => r.lastRunISO);
    const neverRan = reports.filter((r) => !r.lastRunISO);
    const lastRan = ranBefore.slice().sort((a, b) => (a.lastRunISO < b.lastRunISO ? 1 : -1))[0] || null;
    const facts = [
      { k: "all", label: t("hrr.rep.f.all"), value: num(reports.length), bar: false,
        note: t("hrr.rep.f.allNote"), tone: c.chartBlue },
      { k: "ran", label: t("hrr.rep.f.ran"), value: num(ranBefore.length), n: ranBefore.length,
        note: lastRan ? t("hrr.rep.f.ranNote", { name: t("hrr.rep.n." + lastRan.id), date: fmt(t, lastRan.lastRunISO) }) : t("hrr.rep.f.ranNone"),
        tone: c.chartGreen },
      { k: "never", label: t("hrr.rep.f.never"), value: num(neverRan.length), n: neverRan.length,
        note: neverRan.length ? t("hrr.rep.n." + neverRan[0].id) : t("hrr.rep.f.neverNone"),
        tone: c.chartSand },
    ];

    /* no overflow menu: a report opens, and what you can do to it is
       in the screen that opens */
    const columns = [
      { key: "name", label: t("hrr.rep.col.name") },
      { key: "lastRun", label: t("hrr.rep.col.lastRun"), width: 300 },
    ];
    const rows = reports.map((r) => ({
      id: r.id, live: true,
      cells: {
        /* THE NAME, AND NOTHING UNDER IT (designer). What a report
           covers is a paragraph, and a paragraph under every row of a
           list is a wall. It is in the report's own screen, and in
           the dialog that runs it, where somebody is deciding. */
        name: (
          <span style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
            <TitleMark icon={r.icon} iconTone="accent" size={28} />
            <span style={ty("small", { color: c.ink, fontWeight: 600, minWidth: 0 })}>{t("hrr.rep.n." + r.id)}</span>
          </span>
        ),
        lastRun: r.lastRunISO
          ? <StatusMark role="present" glyph="check" word={t("hrr.rep.lastRunOn", { date: fmt(t, r.lastRunISO), by: t(r.lastRunByKey) })} />
          : <span style={ty("caption", { color: c.inkFaint })}>{t("hrr.rep.neverRun")}</span>,
      },
    }));

    const open = resultFor ? reports.filter((r) => r.id === resultFor)[0] : null;
    const running = runFor ? reports.filter((r) => r.id === runFor)[0] : null;

    return (
      <div>
        <Band metrics={facts} />

        <Register
          title={t("hrr.rep.title")} sub={t("hrr.rep.sub")}
          columns={columns} rows={rows}
          onSelect={(id) => setResultFor(id)}
        />

        {running ? (
          <RunReportDialog
            report={running}
            onClose={() => setRunFor(null)}
            campus={campus}
            onRun={(scope) => runReport(running.id, scope)}
          />
        ) : null}

        {open ? (
          <SideScreen
            title={t("hrr.rep.n." + open.id)}
            sub={open.lastRunISO
              ? t("hrr.rep.generatedOn", { date: fmt(t, open.lastRunISO), n: num(rowCountFor(open.id)) })
              : t("hrr.rep.neverRun")}
            width={720}
            onClose={() => setResultFor(null)}
            footer={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", width: "100%", justifyContent: "flex-end" }}>
                {open.lastRunISO ? (
                  <React.Fragment>
                    <Button kind="secondary" size="sm" iconLeft="filing" onClick={() => { setResultFor(null); setRunFor(open.id); }}>{t("hrr.rep.again")}</Button>
                    <Button kind="primary" size="sm" iconLeft="download"
                      onClick={() => setFlash(t("hrr.rep.export.done", { n: num(rowCountFor(open.id)), report: t("hrr.rep.n." + open.id), range: t("hrr.rep.rangeValue", { today: fmt(t, TODAY_ISO) }) }))}
                    >{t("hrr.rep.download")}</Button>
                  </React.Fragment>
                ) : (
                  <Button kind="primary" size="sm" iconLeft="filing" onClick={() => { setResultFor(null); setRunFor(open.id); }}>{t("hrr.rep.run")}</Button>
                )}
              </div>
            }
          >
            {/* WHAT IT COVERS, where somebody is deciding whether to
                run it -- not under its name in a list of seven */}
            <p style={ty("small", { color: c.ink, margin: "0 0 16px", maxWidth: "72ch" })}>{t("hrr.rep.d." + open.id)}</p>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", paddingBottom: 14, borderBottom: "1px solid " + c.rule }}>
              <DefRow label={t("hrr.rep.rangeLabel")}>{t("hrr.rep.rangeValue", { today: fmt(t, TODAY_ISO) })}</DefRow>
              {open.lastRunISO ? (
                <DefRow label={t("hrr.rep.scopeLabel")}>{t(open.scope === "indiranagar" ? "hrr.rep.scope.ind" : open.scope === "whitefield" ? "hrr.rep.scope.wf" : "hrr.rep.scope.group")}</DefRow>
              ) : null}
            </div>
            {open.lastRunISO ? (
              <React.Fragment>
                <div style={{ marginTop: 18 }}>
                  <ReportResult id={open.id} campus={campus} />
                </div>
                <p style={ty("caption", { color: c.inkFaint, margin: "20px 0 0", paddingTop: 14, borderTop: "1px solid " + c.rule })}>{t("hrr.rep.resultNote")}</p>
              </React.Fragment>
            ) : (
              <div style={{ marginTop: 18 }}>
                <EmptyState icon="filing" head={t("hrr.rep.neverRun")} body={t("hrr.rep.neverRunBody")} />
              </div>
            )}
          </SideScreen>
        ) : null}
      </div>
    );
  }

  /* CHOOSING WHAT TO PRODUCE. Three decisions and the one refusal
     this screen has to make — gender and age are not offered as
     breakdowns, and the reason is said here, where somebody is
     actually looking for them, rather than on a banner above a table
     nobody reads twice. */
  /* the dialog OPENS on the page's scope. Running a report wider than
     you meant is the commonest mistake here, and a dialog that starts
     where the reader already is cannot make it. */
  function RunReportDialog({ report, onClose, onRun, campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [scope, setScope] = useState(campus === CAMPUS_ALL || !campus ? "group" : campus);
    const [fmtPick, setFmtPick] = useState("pdf");

    return (
      <ConfirmDialog
        title={t("hrr.rep.run") + " — " + t("hrr.rep.n." + report.id)}
        body={t("hrr.rep.d." + report.id)}
        confirmLabel={t("hrr.rep.run")}
        cancelLabel={t("hrr.act.cancel")}
        onCancel={onClose}
        onConfirm={() => onRun(scope)}
      >
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
          <div style={{ width: 240 }}>
            <Field id="hrr-run-scope" label={t("hrr.rep.scopeLabel")}>
              <Select id="hrr-run-scope" value={scope} onChange={setScope}
                options={[
                  { value: "group", label: t("hrr.rep.scope.group") },
                  { value: "indiranagar", label: t("hrr.rep.scope.ind") },
                  { value: "whitefield", label: t("hrr.rep.scope.wf") },
                ]} />
            </Field>
          </div>
          <div style={{ width: 170 }}>
            <Field id="hrr-run-format" label={t("hrr.rep.formatLabel")}>
              <Select id="hrr-run-format" value={fmtPick} onChange={setFmtPick}
                options={[
                  { value: "pdf", label: t("hrr.rep.format.pdf") },
                  { value: "csv", label: t("hrr.rep.format.csv") },
                ]} />
            </Field>
          </div>
        </div>
        <p style={ty("caption", { color: c.inkMuted, margin: "0 0 12px" })}>{t("hrr.rep.rangeFixed", { range: t("hrr.rep.rangeValue", { today: fmt(t, TODAY_ISO) }) })}</p>
        <div style={{ paddingTop: 12, borderTop: "1px solid " + c.rule }}>
          <StatusMark role="off" glyph="lock" word={t("hrr.rep.refusalHead")} />
          <p style={ty("caption", { color: c.inkMuted, margin: "7px 0 0", maxWidth: 520 })}>{t("hrr.rep.refusalBody")}</p>
        </div>
      </ConfirmDialog>
    );
  }

  function ReportResult({ id, campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    if (id === "headcount") {
      const activeCats = CATEGORIES_SEED.filter((x) => x.state === "active");
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h3 style={ty("h3", { color: c.ink, margin: "0 0 8px" })}>{t("hrr.rep.hc.byCategory")}</h3>
            {activeCats.map((cat) => (
              <DefRow key={cat.id} label={cat.nameKey ? t(cat.nameKey) : cat.nameText}><span style={G3.fig("sm", { color: c.ink })}>{num(cat.count)}</span></DefRow>
            ))}
            <DefRow label={t("hrr.apr.total")}><span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{num(activeCats.reduce((n, x) => n + x.count, 0))}</span></DefRow>
          </div>
          <div>
            <h3 style={ty("h3", { color: c.ink, margin: "0 0 8px" })}>{t("hrr.rep.hc.byCampus")}</h3>
            {HEADCOUNT_BY_CAMPUS.filter((row) => inCampus(campus, row.id)).map((row) => <DefRow key={row.key} label={t(row.key)}><span style={G3.fig("sm", { color: c.ink })}>{num(row.count)}</span></DefRow>)}
            <DefRow label={t("hrr.apr.total")}><span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{num(HEADCOUNT_BY_CAMPUS.filter((x) => inCampus(campus, x.id)).reduce((n, x) => n + x.count, 0))}</span></DefRow>
          </div>
          <div>
            <h3 style={ty("h3", { color: c.ink, margin: "0 0 8px" })}>{t("hrr.rep.hc.byEmployment")}</h3>
            {HEADCOUNT_BY_EMPLOYMENT.map((row) => <DefRow key={row.key} label={t(row.key)}><span style={G3.fig("sm", { color: c.ink })}>{num(row.count)}</span></DefRow>)}
            <DefRow label={t("hrr.apr.total")}><span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{num(HEADCOUNT_BY_EMPLOYMENT.reduce((n, x) => n + x.count, 0))}</span></DefRow>
          </div>
        </div>
      );
    }

    if (id === "attrition") {
      const totalLeavers = ATTRITION_MONTHS.reduce((n, x) => n + x.leavers, 0);
      const totalJoiners = ATTRITION_MONTHS.reduce((n, x) => n + x.joiners, 0);
      const headcount = CATEGORY_TOTAL;
      const rate = ((totalLeavers / headcount) * 100).toFixed(1);
      return (
        <div>
          {ATTRITION_MONTHS.map((row) => (
            <DefRow key={row.m} label={t("hrr.mo." + row.m)}>
              <span style={G3.fig("sm", { color: c.ink })}>{t("hrr.rep.att.joiners")} {num(row.joiners)} · {t("hrr.rep.att.leavers")} {num(row.leavers)}</span>
            </DefRow>
          ))}
          <DefRow label={t("hrr.apr.total")}><span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{t("hrr.rep.att.joiners")} {num(totalJoiners)} · {t("hrr.rep.att.leavers")} {num(totalLeavers)}</span></DefRow>
          <Note>{t("hrr.rep.att.rateLine", { rate, leavers: num(totalLeavers), headcount: num(headcount) })}</Note>
        </div>
      );
    }

    if (id === "docCompliance") {
      return (
        <div>
          <DefRow label={t("hrr.rep.dc.verified")}><StatusMark role="present" glyph="check" word={num(DOC_COMPLIANCE.verified)} /></DefRow>
          <DefRow label={t("hrr.rep.dc.pending")}><StatusMark role="late" glyph="clock" word={num(DOC_COMPLIANCE.pending)} /></DefRow>
          <DefRow label={t("hrr.rep.dc.expired")}><StatusMark role="absent" glyph="alert" word={num(DOC_COMPLIANCE.expired)} /></DefRow>
          <Note>{t("hrr.rep.dc.link")}</Note>
        </div>
      );
    }

    if (id === "contractExpiry") {
      const total = CONTRACT_EXPIRY.d30 + CONTRACT_EXPIRY.d60 + CONTRACT_EXPIRY.d90;
      return (
        <div>
          <DefRow label={t("hrr.rep.ce.d30")}><span style={G3.fig("sm", { color: c.ink })}>{num(CONTRACT_EXPIRY.d30)}</span></DefRow>
          <DefRow label={t("hrr.rep.ce.d60")}><span style={G3.fig("sm", { color: c.ink })}>{num(CONTRACT_EXPIRY.d60)}</span></DefRow>
          <DefRow label={t("hrr.rep.ce.d90")}><span style={G3.fig("sm", { color: c.ink })}>{num(CONTRACT_EXPIRY.d90)}</span></DefRow>
          <DefRow label={t("hrr.apr.total")}><span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{num(total)}</span></DefRow>
        </div>
      );
    }

    if (id === "recruitment") {
      return (
        <div>
          {RECRUITMENT_FUNNEL.map((row) => <DefRow key={row.key} label={t(row.key)}><span style={G3.fig("sm", { color: c.ink })}>{num(row.count)}</span></DefRow>)}
        </div>
      );
    }

    if (id === "leaveAttendance") {
      const rows = LEAVE_LIABILITY_CATS.map((cat) => Object.assign({}, cat, { liability: cat.count * cat.avgBalance * cat.dailyRate }));
      const total = rows.reduce((n, x) => n + x.liability, 0);
      return (
        <div>
          {rows.map((cat) => (
            <div key={cat.nameKey} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "7px 0", borderBottom: "1px solid " + c.rule, flexWrap: "wrap" }}>
              <span style={ty("small", { color: c.ink, flex: "1 1 220px" })}>{t(cat.nameKey)}</span>
              <span style={ty("caption", { color: c.inkFaint })}>{num(cat.count)} × {t("hrr.rep.la.avgBalanceDays", { n: num(cat.avgBalance) })} × {inr(cat.dailyRate)}</span>
              <Money value={cat.liability} />
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", marginTop: 4, borderTop: "2px solid " + c.ruleStrong }}>
            <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("hrr.rep.la.total")}</span>
            <Money value={total} tone={c.ink} />
          </div>
          <Note>{t("hrr.rep.la.formula")}</Note>
          <Note>{t("hrr.rep.la.exceptions", { n: num(ATTENDANCE_EXCEPTIONS_OPEN) })}</Note>
        </div>
      );
    }

    if (id === "probation") {
      return (
        <div>
          <DefRow label={t("hrr.rep.pr.onProbation")}><span style={G3.fig("sm", { color: c.ink })}>{num(PROBATION_REPORT.onProbation)}</span></DefRow>
          <DefRow label={t("hrr.rep.pr.dueThisMonth")}><span style={G3.fig("sm", { color: c.ink })}>{num(PROBATION_REPORT.dueThisMonth)}</span></DefRow>
          <DefRow label={t("hrr.rep.pr.confirmedSession")}><span style={G3.fig("sm", { color: c.ink })}>{num(PROBATION_REPORT.confirmedSession)}</span></DefRow>
        </div>
      );
    }

    return null;
  }

  /* ============================================================
     THE SCREEN — one component, five tabs, the kit's own ARIA-complete
     Tabs/TabPanel pair. Exactly one panel is mounted at a time.
     ============================================================ */
  const TAB_DEFS = [
    { key: "reports", labelKey: "hrr.tab.reports", qKey: "hrr.q.reports" },
    { key: "appraisals", labelKey: "hrr.tab.appraisals", qKey: "hrr.q.appraisals" },
    { key: "categories", labelKey: "hrr.tab.categories", qKey: "hrr.q.categories" },
    { key: "templates", labelKey: "hrr.tab.templates", qKey: "hrr.q.templates" },
  ];

  function HRReports({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [tab, setTab] = useState("reports");
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const [flash, setFlash] = useState("");
    const def = TAB_DEFS.filter((d) => d.key === tab)[0];

    function go(k) { setTab(k); setFlash(""); }

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrReports" onNavigate={onNavigate} initials="MI" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 64px" }}>
            <TopStrip navKey="nav.hrReports" campus={campus} onCampus={setCampus} />
            <PageHeader
              title={t("hrr.title")}
              meta={t("hrr.meta", { school: t("home.school"), campus: campusLabel(t, campus) })}
              right={<Chip bg={c.sunken} fg={c.inkMuted}>
                <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={12} /></span>
                <span>{t("hrr.scopeShort")}</span>
              </Chip>}
            />

            <div style={{ marginBottom: 18 }}>
              <Tabs
                idBase="hrr" ariaLabel={t("hrr.tabs.aria")} active={tab} onChange={go}
                items={TAB_DEFS.map((d) => ({ key: d.key, label: t(d.labelKey) }))}
              />
              <p style={ty("small", { color: c.inkMuted, margin: "12px 2px 0" })}>{t(def.qKey)}</p>
            </div>

            <Flash text={flash} onDismiss={() => setFlash("")} />

            <TabPanel idBase="hrr" tabKey={tab}>
              {tab === "reports" ? <ReportsTab key={campus} campus={campus} flash={flash} setFlash={setFlash} /> : null}
              {tab === "appraisals" ? <AppraisalsTab key={campus} campus={campus} flash={flash} setFlash={setFlash} onNavigate={onNavigate} /> : null}
              {tab === "categories" ? <CategoriesTab flash={flash} setFlash={setFlash} /> : null}
              {tab === "templates" ? <TemplatesTab flash={flash} setFlash={setFlash} /> : null}
            </TabPanel>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     export
     ============================================================ */
  window.Pages3 = window.Pages3 || {};
  window.Pages3.HRReports = HRReports;
})();

/* ============================================================
   SELF-CHECK (informational, read at review time)

   SPEC IMPLEMENTED: HR-08 (M3 §6.3 StaffCategory, M5 §Business rules),
   HR-34 (M14 §API "admin templates", M13 §Business rules), HR-35
   (§6.12 AppraisalCycle, M17 §API), HR-36 (M17 §Business rules,
   §Acceptance), HR-37 (M15 §Purpose, M3/M4/M5/M6/M8/M9).

   OFFERED / DISABLED-WITH-REASON / ABSENT:
   · OFFERED — add/edit/deactivate a category; edit a template body per
     language, toggle a channel, set a lead time, send a test; define a
     rating matrix and weighting, enable 360 sources, open/lock/close/
     extend a cycle; chase a stage, run a report, drill into a
     department, export.
   · DISABLED + REASON — "Open the cycle" while the matrix is
     incomplete (Callout states the exact gap beside it); "Deactivate"
     on any category with staff assigned (names the count); toggling
     off the last channel on a compliance event; "Send a test" while a
     template has an unresolved merge field; "Schedule"/"Save this
     view" everywhere (screen-inventory's own `[proposed]`, refused with
     the spec's stated reason: no scheduling in this release).
   · ABSENT — pay groups anywhere on HR-08 (PY-02's, not this screen's);
     individual ratings anywhere on HR-36 (only completion, band
     DISTRIBUTION counts, and recommendation counts — never a named
     person's score); salary/PAN/Aadhaar/bank/medical detail on any
     report; gender/age as report breakdowns (stated refusal, not a
     missing filter); a student/parent 360° toggle (Later-phase,
     amendment A — named in prose, no control).

   AGGREGATES LEAK — DEMONSTRATED, NOT JUST STATED: HR-36's open cycle
   has 4 finalized reviews, below FINALIZE_THRESHOLD (5); its score
   distribution and recommendation counts are suppressed with the
   reason in words. The closed probation cycle has 6 finalized reviews,
   clears the threshold, and both render in full — a live worked
   example of the same rule the open cycle fails, not a second
   standard. Completion-by-stage is NOT gated the same way, because it
   is operational (who has started), not evaluative (what they scored).

   HR-08 CONSEQUENCE FLOW: changing a category's vacation-staff flag
   shows the affected headcount, requires an effective date (defaults
   forward, editable) and a recalculate-vs-grandfather choice that
   starts blank (`useState("")`) and is validated on click rather than
   hard-disabling the Save button — matching hr-leaveatt.jsx HR-26's
   proven shape (feedback_disabled_submit_click_deadend.md). Editing a
   field that carries no leave/pay consequence (kind, min-qualification,
   probation length) skips the ceremony and just states "applies going
   forward, audited."

   RECONCILIATION IN THE DOM: CATEGORIES_SEED's ten active categories
   sum to 214 — hr.jsx's own TOTAL_IN_SCOPE, not a re-typed figure.
   DEPT_PROGRESS's five department rows sum, per stage, to the exact
   numbers OPEN_CYCLE's population and HR-36's totals row use (computed
   via stageSum(), never duplicated as a second literal). The Science
   drill-in's 8 named people (reusing hr-leaveatt.jsx's own Science
   roster — same codes NAV-0142/0088/0156/0149/0171/0178/0163/0184,
   same names) each carry one "furthest stage reached" that reconciles
   exactly to Science's row (self 8, manager 6, peer 5, moderation 3,
   finalized 2) via stageDone(), not five separate hand-counted totals.
   The leave-liability report computes each category's liability as
   count × avg balance days × avg daily rate and sums them for the
   total — no typed grand total anywhere.

   MONEY: inr(), JetBrains-Mono/tabular via G3.fig, Indian lakh-crore
   grouping. Individual pay is never shown — the leave-liability report
   is the only money on this file, and it is a categorised AGGREGATE
   liability, never a per-person figure.

   APPEND-ONLY / NO DELETE: categories are "deactivated", never
   removed, and historical references are stated to survive it (mirrors
   O18/O6 in docs/ui-compliance-requirements.md); templates "revert to
   default" is not modelled here since none has been customised away
   from its seed — no delete affordance exists on the template register
   either. Appraisal cycles only move forward (draft → open → locked →
   closed); "close" is stated as irreversible in its own confirm dialog.

   NO RAW COLOUR: grep -E "#[0-9A-Fa-f]{3,6}|rgba?\(" over this file
   returns nothing. Every colour is c.* from useTheme() or G3.*.

   PROMOTION CANDIDATES (local here, repeated across every HR v3 file —
   ConfirmDialog, ChoiceList, Callout, Note, FieldError, DefRow, Actions,
   Money, PageHeader, TabLabel): a strong case for kit.jsx promotion,
   flagged again as every sibling dispatch has flagged it.

   SPEC-SILENT CHOICES I MADE (flagged, not hidden):
   · HR-08's "Must NOT contain: pay groups" reads, at first glance, in
     tension with the brief's own framing ("usually implies a pay
     group"). I resolved it by NEVER showing/editing a pay group value
     here, only a cross-reference note pointing at PY-02 when the
     vacation flag changes — the screen states the implication without
     owning the field.
   · The vacation-flag ceremony (effective date + recalc/grandfather,
     no default) fires only when that specific field changes. Other
     field edits (kind, min-qualification, probation) still apply
     "going forward, audited" per the Actions table, but without the
     balance-affecting ceremony, since there is no balance to recalculate
     or grandfather for them.
   · HR-36's department-level score distribution and the cycle-level
     recommendation counts share ONE suppression threshold (5 finalized
     reviews) rather than two different rules, since both are outcome-
     shaped aggregates and a department's small full population (e.g.
     Pre-primary, 4 people) is exactly the case the rule exists for.
   · HR-37 drops a staff-category cut for HR-36's distribution because
     this cycle's population is a single staff category (teaching) —
     noted in the UI rather than fabricated.
   · Locking/unlocking a cycle in HR-35 does not feed back into HR-36's
     numbers (both read the same static seed) — a known limitation of
     a two-tab static preview, not a claim that the two are wired.
   ============================================================ */
