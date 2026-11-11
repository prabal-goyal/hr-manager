/* @jsxRuntime classic */
/* ============================================================
   Naveya — HR Operator, wave 1 · window.Pages3.{HRHome,HRStaff,HRDocs}

   Three screens, one persona: Meera Iyer, HR Operator, campus-scoped
   (dev-spec M3 staff records, M4 document governance; docs/screen-
   inventory.md HR-01 / HR-02 / HR-09; docs/ui-compliance-requirements.md
   O3 masking, §4.1 field-level PII).

   HR-01 · WORK QUEUE (home) — "what is waiting on me?" The densest
   home in the product, deliberately the opposite of a teacher's calm
   Home: a Register of obligations, oldest first, each row routing
   into its owning queue. It carries counts and routes ONLY — never the
   actions themselves (those live where the row sends you), never a
   payroll figure, never a campus-blended total (HR-01 §Scope: a group
   HR sees campus-segmented counts, never one undifferentiated pile —
   the campus switcher here changes the numbers, not just a label).

   HR-02 · STAFF REGISTER — "who works here?" A register built to scale
   to hundreds of rows: server-shaped filters, a stated (not blank) PII
   absence, and a bulk-select bar because HR's real workday is "select
   twelve people, do one thing to all of them." Salary/bank/statutory
   IDs are not columns here by spec (M3 §Field-level access) — the one
   place PII-bearing intent surfaces is the export flow, gated behind a
   permission note and a required reason, never a default column.

   HR-09 · DOCUMENT CONTROL QUEUE — the HR half of the M4 loop whose
   employee half is documents.jsx. An employee only ever RESPONDS; HR
   INITIATES and VERIFIES. So this screen is drawn to answer the two
   questions in the brief: what is HR still waiting to raise/chase
   (awaiting employee / overdue), and what has come back that HR must
   look at before it becomes the record (to verify / rejected). The one
   rule worth a real interaction, not just a comment: verifying a
   response you have not opened is the exact failure mode this queue
   invites, so "Verify & promote" stays disabled until "Open the
   response" has been pressed for that row (HR-09 Actions, "the control
   is disabled until the file has been opened [proposed]"). Expiry is a
   different question with a different owner (HR-11) — this screen only
   links toward it, never rebuilds it.

   Composed only from window.G3 / window.UI3. kit.jsx, tokens.jsx,
   screens.jsx, the other pages/*.jsx files and v3.html are untouched by
   this file — this dispatch owns exactly this one file.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark,
    Icon, ActionMenu, EmptyState, Field, Input, Select, Switch, Tabs, TabPanel,
    Figure, num, inr, StackBar, Meter, Swatch, Band,
    CampusSwitch, campusLabel, inCampus, CAMPUS_ALL,
  } = UI;

  /* ============================================================
     STRINGS — hr3.* is this dispatch's whole namespace. EN and HI
     carry exactly the same key set; every demo value — names, reasons,
     notes, dates — is authored in both languages (the i18n leak this
     system keeps re-finding is untranslated mock content, not missing
     UI chrome).
     ============================================================ */
  addStrings({
    en: {
      /* --- persona + shared chrome --- */
      "hr3.role": "HR Operator",
      "hr3.name": "Meera Iyer",
      "hr3.identity": "HR Operator · Meera Iyer · {campus}",
      "hr3.campus.indiranagar": "Indiranagar",
      "hr3.campus.whitefield": "Whitefield",
      "hr3.campus.switchAria": "Choose a campus",
      "hr3.campus.single": "Single-campus assignments hide this switch — Meera holds two, so it stays visible (HR-01 Actions).",

      "hr3.mon.01": "Jan", "hr3.mon.02": "Feb", "hr3.mon.03": "Mar",
      "hr3.mon.04": "Apr", "hr3.mon.05": "May", "hr3.mon.06": "Jun",
      "hr3.mon.07": "Jul", "hr3.mon.08": "Aug", "hr3.mon.09": "Sep",
      "hr3.mon.10": "Oct", "hr3.mon.11": "Nov", "hr3.mon.12": "Dec",

      /* --- HR-01 · work queue --- */
      "hr4.greeting": "Good morning, Meera.",
      "hr4.today.title": "What is waiting on you",
      "hr4.today.sub": "{campus} · Tuesday, 11 August 2026",
      "hr4.today.date": "Tuesday, 11 August 2026",
      "hr4.today.leave": "On leave today",
      "hr4.today.leaveNote": "approved, and not expected in",
      "hr4.today.noword": "Absent, no word",
      "hr4.today.nowordNote": "no punch and no leave on record",
      "hr4.today.overdue": "Overdue document requests",
      "hr4.today.overdueNote": "answer these before anything else",
      "hr4.today.breach": "Past their SLA",
      "hr4.today.breachNote": "of {n} lines waiting, across every queue below",
      "hr4.today.joiners": "Joined this week",
      "hr4.today.joinersNote": "new starters on the register",
      "hr4.today.leavers": "Left this week",
      "hr4.today.leaversNote": "exits completing",
      "hr4.today.first": "Where to start",
      "hr4.mix.past": "Past their SLA",
      "hr4.mix.soon": "Due soon",
      "hr4.mix.review": "Waiting on a review",
      "hr4.d.pay": "Pay requests",
      "hr4.d.payUnit": "waiting on you",
      "hr4.d.payNote": "Across both campuses — a pay request is raised by a person, not a campus.",
      "hr4.d.claims": "Reimbursements",
      "hr4.d.ot": "Overtime",
      "hr4.d.loans": "Loans",
      "hr4.d.rises": "Appraisal rises",
      "hr4.d.payFoot": "{n} already sent on, waiting with payroll.",
      "hr4.away.title": "On leave today",
      "hr4.away.sub1": "One person is approved to be away",
      "hr4.away.subN": "{n} people are approved to be away",
      "hr4.away.none": "Everybody on the roll is expected in today.",
      "hr4.away.open": "Open leave admin",
      "hr4.cel.sub": "Across the school, over the next month",
      "hr3.h1.title": "Work queue",
      "hr3.h1.slaBanner": "{count} things are breaching their SLA",
      "hr3.h1.addEmployee": "Add an employee",
      "hr3.h1.addEmployeeHint": "Check the register first \u2014 a second record for the same person breaks their gratuity continuity.",
      "hr3.h1.raiseRequest": "Raise a document request",

      "hr3.queue.title": "What needs you",
      "hr3.queue.col.item": "Queue",
      "hr3.queue.col.state": "State",
      "hr3.queue.col.meta": "Since / until",
      "hr3.queue.col.go": "Open",
      "hr3.queue.open": "Open {item}",
      "hr3.queue.footNote": "No staff on record yet? Start with a bulk import or bring candidates over from an offer.",

      "hr3.w.onTrack": "Nothing waiting",
      "hr3.w.dueSoon": "Due soon",
      "hr3.w.overdue": "Overdue",
      "hr3.w.breach": "Breaching SLA",
      "hr3.w.review": "Needs review",
      "hr3.w.joined": "Joined",
      "hr3.w.left": "Left",

      "hr3.meta.oldest": "oldest {n} days",
      "hr3.meta.oldestHours": "oldest {n} hours",
      "hr3.meta.soonest": "soonest in {n} days",
      "hr3.meta.thisWeek": "this week",
      "hr3.meta.clear": "—",

      "hr3.q.docsVerify": "Documents to verify",
      "hr3.q.docsOverdue": "Overdue document requests",
      "hr3.q.onboarding": "Onboarding tasks due",
      "hr3.q.probation": "Probation & confirmations due",
      "hr3.q.contracts": "Contracts expiring",
      "hr3.q.candidates": "Candidates awaiting action",
      "hr3.q.helpdesk": "Helpdesk tickets breaching SLA",
      "hr3.q.attendance": "Attendance exceptions unresolved",
      "hr3.q.joiners": "Joiners this week",
      "hr3.q.leavers": "Leavers this week",

      /* --- HR-02 · staff register --- */
      "hr3.st.title": "Staff register",
      "hr3.st.band": "What the roll is made of",
      "hr3.st.bandSub": "Teaching and everybody who keeps a school running, with the two things that will change the roll: probations and contracts falling due.",
      "hr3.st.bandFoot": "The register runs to {total}; this view holds {n}. Salary, bank and statutory identifiers live on a person's own record.",
      "hr3.st.m.roll": "On the register",
      "hr3.st.m.rollNote": "Active staff across both campuses.",
      "hr3.st.m.prob": "On probation",
      "hr3.st.m.probNote": "Each one has a confirmation date that falls due.",
      "hr3.st.m.ends": "Contracts ending",
      "hr3.st.m.endsNote": "Fixed-term and guest faculty, with a date on them.",
      "hr3.st.m.notice": "On notice",
      "hr3.st.m.noticeNote": "A last working day is set; payroll and exits are counting from it.",
      "hr3.st.export": "Export the register",
      "hr3.st.searchPh": "Search by name or staff ID",
      "hr3.st.searchNote": "Search by phone, PAN or UAN only if your account holds people.pii.read — the numbers themselves are never shown in this list.",
      "hr3.st.filter.dept": "Department",
      "hr3.st.filter.deptAll": "All departments",
      "hr3.st.filter.category": "Staff category",
      "hr3.st.filter.categoryAll": "All categories",
      "hr3.st.filter.employment": "Employment type",
      "hr3.st.filter.employmentAll": "All types",
      "hr3.st.filter.status": "Status",
      "hr3.st.filter.statusAll": "Active staff",
      "hr3.st.filter.includeExited": "Include exited staff",
      "hr3.st.filter.expiringOnly": "Contract expiring soon only",

      "hr3.cat.teaching": "Teaching",
      "hr3.cat.non_teaching": "Non-teaching",
      "hr3.cat.support": "Support",
      "hr3.cat.guest": "Guest faculty",

      "hr3.emp.permanent": "Permanent",
      "hr3.emp.probation": "Probation",
      "hr3.emp.contract": "Fixed-term",
      "hr3.emp.guest": "Per-lecture",
      "hr3.st.vacation": "Teaching staff",

      "hr3.st.status.active": "Active",
      "hr3.st.status.notice": "On notice",
      "hr3.st.status.exited": "Exited",
      "hr3.st.status.noLogin": "No login yet",

      "hr3.st.col.code": "Staff ID",
      "hr3.st.col.name": "Name",
      "hr3.st.col.category": "Category",
      "hr3.st.col.dept": "Department",
      "hr3.st.col.campus": "Campus",
      "hr3.st.col.employment": "Employment",
      "hr3.st.col.status": "Status",
      "hr3.st.col.doj": "Joined",
      "hr3.st.col.contractEnd": "Contract ends",
      "hr3.st.col.actions": "Actions",
      "hr3.st.ongoing": "Ongoing",
      "hr3.st.closedOnExit": "Closed on exit",

      "hr3.st.selectRow": "Select {name}",
      "hr3.st.selectAll": "Select every visible row",
      "hr3.st.selectedCount1": "1 person selected",
      "hr3.st.selectedCountN": "{count} people selected",
      "hr3.st.bulkAssign": "Bulk assign department / shift",
      "hr3.st.bulkRaise": "Raise a document request",
      "hr3.st.bulkClear": "Clear selection",

      "hr3.st.menu.aria": "Actions for {name}",
      "hr3.st.menu.open": "Open the record",
      "hr3.st.menu.raise": "Raise a document request",
      "hr3.ex.title": "Start her exit",
      "hr3.ex.sub": "{name} · {code} · {desig}",
      "hr3.ex.lwd": "Last working day",
      "hr3.ex.lwdHint": "Paid days, the settlement and the day her sign-in stops are all counted from this date.",
      "hr3.ex.lwdMissing": "An exit needs a last working day. Everything else is computed from it.",
      "hr3.ex.reason": "Reason",
      "hr3.ex.reasonPh": "Choose a reason",
      "hr3.ex.reasonMissing": "Choose the reason. It is on the service book and on the relieving letter.",
      "hr3.ex.r.resigned": "Resigned",
      "hr3.ex.r.ended": "Contract ended",
      "hr3.ex.r.retired": "Retired",
      "hr3.ex.r.released": "Released by the school",
      "hr3.ex.notice": "Notice period",
      "hr3.ex.noticeHint": "Her contract carries 60 days.",
      "hr3.ex.noticePh": "Choose one",
      "hr3.ex.noticeMissing": "Say how notice is being handled — the settlement changes with it.",
      "hr3.ex.n.serve": "She serves it in full",
      "hr3.ex.n.waive": "Waived by the school",
      "hr3.ex.n.payInLieu": "Paid in lieu of notice",
      "hr3.ex.next": "What happens next",
      "hr3.ex.n1": "She moves to On notice today and stays on the register until the last working day.",
      "hr3.ex.n2": "An entry is written on her service book with your name against it.",
      "hr3.ex.n3": "Payroll picks her up for the month with paid days counted to the last working day, and a full & final settlement is opened.",
      "hr3.ex.n4": "Her sign-in and her app access stop at the end of the last working day; her record stays readable to HR.",
      "hr3.ex.reversible": "Nothing is deleted. An exit initiated in error is withdrawn, and both the start and the withdrawal stay on the service book.",
      "hr3.ex.cancel": "Not now",
      "hr3.ex.confirm": "Put her on notice",
      "hr3.ex.done": "{name} is on notice. Last working day {date}. A service-book entry and a settlement have been opened.",
      "hr3.ex.lastDay": "Last day {date}",
      "hr3.emp.exited": "Left the school",
      "hr3.st.leftOn": "Left {date}",
      "hr3.st.menu.changeLwd": "Change the last working day",
      "hr3.st.menu.withdrawExit": "Withdraw the exit",
      "hr3.st.menu.exitGone": "This person has already left.",

      "hr3.nc.title": "Change the last working day",
      "hr3.nc.sub": "{name} is on notice with {date} as her last working day. Later extends her notice; earlier releases her sooner.",
      "hr3.nc.newDate": "New last working day",
      "hr3.nc.newDateHint": "Everything below is recomputed from this date the moment you save it.",
      "hr3.nc.errMissing": "Pick the new last working day.",
      "hr3.nc.errSame": "That is the date she already has.",
      "hr3.nc.reason": "Why it is moving",
      "hr3.nc.reasonPh": "Choose a reason",
      "hr3.nc.errReason": "Choose the reason. It goes on her service book.",
      "hr3.nc.r.replacement": "Her replacement has not joined yet",
      "hr3.nc.r.term": "She is staying to the end of the term",
      "hr3.nc.r.handover": "Handover is not finished",
      "hr3.nc.r.employee": "She asked to change the date",
      "hr3.nc.r.released": "The school is releasing her early",
      "hr3.nc.why": "In a line",
      "hr3.nc.whyHint": "What you would tell the principal if she asked. It is saved with the change.",
      "hr3.nc.whyPh": "Staying through the exam fortnight at her own request",
      "hr3.nc.errWhy": "One line, please — a moved leaving date with no explanation is the thing nobody can answer for later.",
      "hr3.nc.laterNote": "Her notice is extended. She stays on the roll, keeps her sign-in and is paid to the new date.",
      "hr3.nc.earlierWarn": "This shortens the notice her contract carries. If the school is releasing her early, pay in lieu is settled in the full & final.",
      "hr3.nc.moves": "What moves with it",
      "hr3.nc.m1": "Paid days for the month, up to the new last working day.",
      "hr3.nc.m2": "The full & final settlement, which is recomputed and stays open until it is approved.",
      "hr3.nc.m3": "The day her sign-in and app access stop.",
      "hr3.nc.m4": "Her leave balance — anything she takes between the two dates is deducted as usual.",
      "hr3.nc.audit": "A dated entry is added to her service book naming both dates, with your name against it. The earlier date is never erased.",
      "hr3.nc.confirm": "Move the date",
      "hr3.nc.doneLater": "{name}'s notice now runs to {date}. Payroll and the settlement have been recomputed.",
      "hr3.nc.doneEarlier": "{name}'s last working day is now {date}. Check the notice pay in her settlement.",
      "hr3.nc.extendedFrom": "extended from {date}",
      "hr3.nc.broughtFrom": "brought forward from {date}",

      "hr3.wd.title": "Withdraw the exit",
      "hr3.wd.sub": "{name} was leaving on {date}. Withdrawing puts her back on the roll as though the notice had not been served.",
      "hr3.wd.why": "Why it is being withdrawn",
      "hr3.wd.whyHint": "Saved with the withdrawal. Both the exit and this stay on her service book.",
      "hr3.wd.whyPh": "She has taken back her resignation",
      "hr3.wd.errWhy": "Say why. An exit that appears and disappears with no reason is unreadable a year later.",
      "hr3.wd.audit": "The settlement that was opened is closed unpaid, and payroll stops counting her out. Nothing on her record is deleted.",
      "hr3.wd.confirm": "Withdraw it",
      "hr3.wd.done": "{name} is back on the roll. The exit and its withdrawal are both on her service book.",
      "hr3.st.menu.exit": "Initiate exit",
      "hr3.st.menu.exitDisabled": "An exit is already running — change the last working day, or withdraw it.",
      "hr3.st.menu.noLoginDisabled": "No login on record yet",

      "hr3.st.empty.head": "No one matches these filters",
      "hr3.st.empty.body": "Try clearing a filter, or turn on “Include exited staff” if you are looking for someone who has left.",
      "hr3.st.footNote": "Showing {shown} of {total} in scope. Refine the filters rather than scrolling \u2014 the list runs to hundreds.",

      /* --- export panel --- */
      "hr3.exp.title": "Export the register",
      "hr3.exp.format": "Format",
      "hr3.exp.formatCsv": "CSV",
      "hr3.exp.formatPdf": "PDF",
      "hr3.exp.includePII": "Include statutory IDs and bank details",
      "hr3.exp.includePIIHint": "Off by default, for everyone, including HR. Turning this on needs a reason and is logged against your account (people.pii.read).",
      "hr3.exp.reasonLabel": "Reason for including these fields",
      "hr3.exp.reasonPh": "e.g. Provident-fund audit requested by the trust office",
      "hr3.exp.reasonHint": "Required once statutory IDs or bank details are included.",
      "hr3.exp.go": "Export",
      "hr3.exp.cancel": "Cancel",
      "hr3.exp.note": "Every export is scoped to what you can already see, counted, and written to the access log.",

      /* --- HR-09 · document control queue --- */
      "hr3.dq.title": "Document control queue",
      "hr3.dq.expiryLink": "Looking for what is about to lapse instead? See the expiry watchlist",
      "hr3.dq.bulk.title": "Raise requests in bulk",
      "hr3.dq.bulk.sub": "One paper, asked of a group at once. Everyone answers on their own phone, and every response comes back to you to check.",
      "hr3.dq.bulk.type": "Which document",
      "hr3.dq.bulk.typePh": "Choose the document",
      "hr3.dq.bulk.campus": "Campus",
      "hr3.dq.bulk.campusAll": "Both campuses",
      "hr3.dq.bulk.dept": "Department",
      "hr3.dq.bulk.cat": "Staff category",
      "hr3.dq.bulk.catAll": "Every category",
      "hr3.dq.bulk.due": "Answer by",
      "hr3.dq.bulk.dueHint": "The same date for everyone in this batch. You can extend any one of them later.",
      "hr3.dq.bulk.skip": "Skip those who already hold a current copy",
      "hr3.dq.bulk.skipNote": "Asking 180 people for a certificate 60 of them have already sent is how a school stops answering.",
      "hr3.dq.bulk.willAsk": "people will be asked",
      "hr3.dq.bulk.matched": "{n} people match this group.",
      "hr3.dq.bulk.skipped": "{n} of them already hold a current copy and are skipped.",
      "hr3.dq.bulk.pickFirst": "Choose a document and the count appears here before you send anything.",
      "hr3.dq.bulk.note": "Each request is separate once sent: it can be extended, reminded or withdrawn on its own row.",
      "hr3.dq.bulk.cancel": "Not now",
      "hr3.dq.bulk.confirm": "Raise the requests",
      "hr3.dq.bulk.errType": "Choose which document you are asking for.",
      "hr3.dq.bulk.errDue": "Give them a date to answer by.",
      "hr3.dq.bulk.errNobody": "Nobody in this group needs to be asked. Widen it, or turn off the skip.",
      "hr3.dq.bulk.done": "{n} requests raised for the {doc}, due {date}. They are in Awaiting employee.",

      "hr3.dq.ext.title": "Extend the due date",
      "hr3.dq.ext.body": "{name} was asked for the {doc}, due {date}.",
      "hr3.dq.ext.newDate": "New date to answer by",
      "hr3.dq.ext.newDateHint": "It must be later than {date}. A due date is never moved earlier — that would make somebody late without warning.",
      "hr3.dq.ext.errMissing": "Pick the new date.",
      "hr3.dq.ext.errEarlier": "That is not later than the date she already has.",
      "hr3.dq.ext.tell": "{name} is told on her phone, and the request stops being overdue.",
      "hr3.dq.ext.confirm": "Move the date",
      "hr3.dq.ext.done": "{name} now has until {date}.",
      "hr3.dq.ext.moved": "moved from {date}",

      "hr3.dq.rem.title": "Send a reminder",
      "hr3.dq.rem.body": "{name} has not answered the request for the {doc}, due {date}.",
      "hr3.dq.rem.note": "Add a line, if it helps",
      "hr3.dq.rem.notePh": "The tax office needs it before the 20th.",
      "hr3.dq.rem.tell": "One message to {name}, now. Only one reminder a day, so this stops being noise.",
      "hr3.dq.rem.confirm": "Send it",
      "hr3.dq.rem.done": "Reminder sent to {name}.",
      "hr3.dq.rem.sentToday": "reminded today",
      "hr3.dq.act.noteHint": "It is shown to her with the request. Optional.",

      "hr3.dq.can.title": "Withdraw this request",
      "hr3.dq.can.body": "{name} was asked for the {doc}, due {date}. Withdrawing it stops the asking; nothing on her record changes.",
      "hr3.dq.can.note": "Why it is being withdrawn",
      "hr3.dq.can.notePh": "Asked twice by mistake",
      "hr3.dq.can.tell": "{name} sees it close on her phone. The request stays on her file as withdrawn, with your name on it.",
      "hr3.dq.can.confirm": "Withdraw it",
      "hr3.dq.can.done": "The request to {name} for the {doc} is withdrawn.",
      "hr3.dq.menu.remindAlready": "She has already been reminded today.",
      "hr3.dq.raiseBulk": "Raise requests in bulk",

      "hr3.dq.handoff": "{n} responses are waiting to be checked",
      "hr3.dq.handoffGo": "Go and check them",
      "hr3.dq.lane.toVerify": "To verify",
      "hr3.dq.band": "What is out with staff",
      "hr3.dq.m.awaiting": "Awaiting the employee",
      "hr3.dq.m.awaitingNote": "in date, nobody has answered",
      "hr3.dq.m.out": "Requests out",
      "hr3.dq.m.outNote": "raised, not yet settled",
      "hr3.dq.m.overdue": "Past the date asked for",
      "hr3.dq.m.overdueNote": "the due date has gone",
      "hr3.dq.m.back": "Sent back",
      "hr3.dq.m.backNote": "returned with a reason",
      "hr3.dq.m.verify": "Waiting on your check",
      "hr3.dq.m.verifyNote": "answered, in the next tab",
      "hr3.dq.m.clear": "Nothing has come back that needs checking.",
      "hr3.dq.lane.awaiting": "Awaiting employee",
      "hr3.dq.lane.overdue": "Overdue",
      "hr3.dq.lane.rejected": "Sent back",
      "hr3.dq.tabsAria": "Document queue lines",

      "hr3.dq.filter.docType": "Document type",
      "hr3.dq.filter.docTypeAll": "All document types",
      "hr3.dq.filter.dept": "Department",
      "hr3.dq.filter.deptAll": "All departments",

      "hr3.dq.col.requester": "Raised by",
      "hr3.dq.col.employee": "Employee",
      "hr3.dq.col.docType": "Document",
      "hr3.dq.col.age": "Age",
      "hr3.dq.col.due": "Due",
      "hr3.dq.col.actions": "Actions",
      "hr3.dq.days": "days",
      "hr3.dq.select": "Show the detail for {doc}, {name}",

      "hr3.dq.batch": "ATS import batch",

      "hr3.dq.type.pan": "PAN card",
      "hr3.dq.type.aadhaar": "Aadhaar",
      "hr3.dq.type.bankProof": "Bank account proof",
      "hr3.dq.type.medical": "Medical fitness certificate",
      "hr3.dq.type.police": "Police verification",
      "hr3.dq.type.training": "Child-protection training certificate",
      "hr3.dq.type.degree": "Degree certificate",
      "hr3.dq.type.bed": "B.Ed. certificate",
      "hr3.dq.type.address": "Address proof",
      "hr3.dq.type.license": "Driving licence",

      "hr3.dq.menu.open": "Open the response",
      "hr3.dq.menu.verify": "Verify & promote",
      "hr3.dq.menu.verifyDisabled": "Open the response first",
      "hr3.dq.menu.reject": "Reject",
      "hr3.dq.menu.remind": "Send a reminder",
      "hr3.dq.menu.remindDisabled": "Not due yet",
      "hr3.dq.menu.extend": "Extend the due date",
      "hr3.dq.menu.cancel": "Cancel the request",
      "hr3.dq.menu.reRequest": "Re-request",

      "hr3.dq.det.empty.head": "Pick a request",
      "hr3.dq.det.empty.body": "Choose a row on the left — its full detail, and the actions open to it, appear here.",
      "hr3.dq.det.employeeNote": "What the employee wrote to HR",
      "hr3.dq.det.noNote": "The employee did not add a note.",
      "hr3.dq.det.askedOn": "Asked on {date}",
      "hr3.dq.det.dueOn": "Due {date}",
      "hr3.dq.det.ageLine": "{n} days since it was raised",
      "hr3.dq.det.openedNote": "You opened this response — Verify & promote is now available.",
      "hr3.dq.det.notOpenedNote": "Open the response before you verify it. Verifying without a look is the mistake this queue exists to prevent.",
      "hr3.dq.det.rejectedBy": "Sent back by {who} on {date}",
      "hr3.dq.det.rejectReasonLabel": "Reason HR gave",

      "hr3.dq.reject.title": "Send this back",
      "hr3.dq.reject.pickerLabel": "Reason",
      "hr3.dq.reject.pickerPh": "Choose a reason",
      "hr3.dq.reject.illegible": "Illegible",
      "hr3.dq.reject.wrongDoc": "Wrong document",
      "hr3.dq.reject.expired": "Expired",
      "hr3.dq.reject.nameMismatch": "Name mismatch",
      "hr3.dq.reject.other": "Other",
      "hr3.dq.reject.noteLabel": "A line for the employee (optional)",
      "hr3.dq.reject.notePh": "What should they fix before sending it again?",
      "hr3.dq.reject.confirm": "Confirm — send back",
      "hr3.dq.reject.cancel": "Cancel",
      "hr3.dq.reject.reasonRequired": "A reason is required before this can be sent back.",

      "hr3.dq.who.meera": "Meera Iyer, HR",
      "hr3.dq.who.rajan": "Rajan Pillai, HR",

      "hr3.dq.reg.empty.head": "Nothing in this line",
      "hr3.dq.reg.empty.bodyToVerify": "Every response HR has received is checked. New submissions will appear here.",
      "hr3.dq.reg.empty.bodyAwaiting": "Nobody is currently waiting to answer a request in this campus.",
      "hr3.dq.reg.empty.bodyOverdue": "Nothing has run past its due date.",
      "hr3.dq.reg.empty.bodyRejected": "Nothing sent back is waiting on a re-request.",
      "hr3.dq.reg.footNote": "400 records can land at once after an ATS conversion — work the batch chip first, in order, rather than the newest row.",
    },

  });

  /* ============================================================
     DEMO CONTENT — synthetic throughout. Two campuses (Indiranagar,
     Whitefield) give the campus switcher real numbers to change, not
     just a label (HR-01 §Scope: campus-segmented counts, never one
     blended pile). Every identifier is fictional; nothing here could
     be mistaken for a real PAN, Aadhaar or account number — and none
     of the three screens renders one anyway (see the file header).
     ============================================================ */

  const CAMPUSES = [
    { id: "indiranagar", labelKey: "hr3.campus.indiranagar" },
    { id: "whitefield", labelKey: "hr3.campus.whitefield" },
  ];

  /* HR-01 queue rows, one dataset per campus — a group HR would see
     both blended into segmented counts; a campus HR (Meera) sees one
     campus at a time, chosen by the switcher. */
  const QUEUE_BY_CAMPUS = {
    indiranagar: [
      { id: "docsVerify", icon: "scan", labelKey: "hr3.q.docsVerify", count: 6, role: "late", wordKey: "hr3.w.dueSoon", metaKey: "hr3.meta.oldest", metaN: 4, route: "hrDocs" },
      { id: "docsOverdue", icon: "clock", labelKey: "hr3.q.docsOverdue", count: 5, role: "absent", wordKey: "hr3.w.overdue", metaKey: "hr3.meta.oldest", metaN: 9, route: "hrDocs" },
      { id: "onboarding", icon: "briefcase", labelKey: "hr3.q.onboarding", count: 3, role: "late", wordKey: "hr3.w.dueSoon", metaKey: "hr3.meta.oldest", metaN: 2, route: "hrOnboarding" },
      { id: "probation", icon: "half", labelKey: "hr3.q.probation", count: 2, role: "late", wordKey: "hr3.w.dueSoon", metaKey: "hr3.meta.oldest", metaN: 6, route: "hrProbation" },
      { id: "contracts", icon: "filing", labelKey: "hr3.q.contracts", count: 4, role: "late", wordKey: "hr3.w.dueSoon", metaKey: "hr3.meta.soonest", metaN: 12, route: "hrExpiry" },
      { id: "candidates", icon: "staff", labelKey: "hr3.q.candidates", count: 3, role: "ltEL", wordKey: "hr3.w.review", metaKey: "hr3.meta.oldest", metaN: 5, route: "hrPipeline" },
      { id: "helpdesk", icon: "alert", labelKey: "hr3.q.helpdesk", count: 2, role: "absent", wordKey: "hr3.w.breach", metaKey: "hr3.meta.oldestHours", metaN: 6, route: "hrHelpdesk" },
      { id: "attendance", icon: "attendance", labelKey: "hr3.q.attendance", count: 7, role: "late", wordKey: "hr3.w.dueSoon", metaKey: "hr3.meta.oldest", metaN: 3, route: "hrExceptions" },
      { id: "joiners", icon: "arrowUp", labelKey: "hr3.q.joiners", count: 2, role: "present", wordKey: "hr3.w.joined", metaKey: "hr3.meta.thisWeek", metaN: null, route: "hrStaff" },
      { id: "leavers", icon: "signout", labelKey: "hr3.q.leavers", count: 1, role: "off", wordKey: "hr3.w.left", metaKey: "hr3.meta.thisWeek", metaN: null, route: "hrStaff" },
    ],
    whitefield: [
      { id: "docsVerify", icon: "scan", labelKey: "hr3.q.docsVerify", count: 3, role: "late", wordKey: "hr3.w.dueSoon", metaKey: "hr3.meta.oldest", metaN: 2, route: "hrDocs" },
      { id: "docsOverdue", icon: "clock", labelKey: "hr3.q.docsOverdue", count: 2, role: "absent", wordKey: "hr3.w.overdue", metaKey: "hr3.meta.oldest", metaN: 5, route: "hrDocs" },
      { id: "onboarding", icon: "briefcase", labelKey: "hr3.q.onboarding", count: 1, role: "late", wordKey: "hr3.w.dueSoon", metaKey: "hr3.meta.oldest", metaN: 1, route: "hrOnboarding" },
      { id: "probation", icon: "half", labelKey: "hr3.q.probation", count: 0, role: "present", wordKey: "hr3.w.onTrack", metaKey: "hr3.meta.clear", metaN: null, route: "hrProbation" },
      { id: "contracts", icon: "filing", labelKey: "hr3.q.contracts", count: 2, role: "late", wordKey: "hr3.w.dueSoon", metaKey: "hr3.meta.soonest", metaN: 19, route: "hrExpiry" },
      { id: "candidates", icon: "staff", labelKey: "hr3.q.candidates", count: 2, role: "ltEL", wordKey: "hr3.w.review", metaKey: "hr3.meta.oldest", metaN: 2, route: "hrPipeline" },
      { id: "helpdesk", icon: "alert", labelKey: "hr3.q.helpdesk", count: 0, role: "present", wordKey: "hr3.w.onTrack", metaKey: "hr3.meta.clear", metaN: null, route: "hrHelpdesk" },
      { id: "attendance", icon: "attendance", labelKey: "hr3.q.attendance", count: 4, role: "late", wordKey: "hr3.w.dueSoon", metaKey: "hr3.meta.oldest", metaN: 2, route: "hrExceptions" },
      { id: "joiners", icon: "arrowUp", labelKey: "hr3.q.joiners", count: 1, role: "present", wordKey: "hr3.w.joined", metaKey: "hr3.meta.thisWeek", metaN: null, route: "hrStaff" },
      { id: "leavers", icon: "signout", labelKey: "hr3.q.leavers", count: 0, role: "off", wordKey: "hr3.w.onTrack", metaKey: "hr3.meta.clear", metaN: null, route: "hrStaff" },
    ],
  };

  /* "both" is MERGED, not a third hand-typed dataset: counts add, the
     state is the more urgent of the two, and the meta figure takes the
     worse reading (the older "oldest", the sooner "soonest"). A third
     list would drift from the two it summarises. */
  const QUEUE_URGENCY = { absent: 0, late: 1, ltEL: 2, present: 3, off: 3 };
  QUEUE_BY_CAMPUS.both = QUEUE_BY_CAMPUS.indiranagar.map(function (a) {
    const b = QUEUE_BY_CAMPUS.whitefield.filter(function (x) { return x.id === a.id; })[0] || a;
    const worse = (QUEUE_URGENCY[a.role] <= QUEUE_URGENCY[b.role]) ? a : b;
    const soonest = a.metaKey === "hr3.meta.soonest";
    const metaN = a.metaN == null ? b.metaN : b.metaN == null ? a.metaN
      : soonest ? Math.min(a.metaN, b.metaN) : Math.max(a.metaN, b.metaN);
    return Object.assign({}, worse, { count: a.count + b.count, metaN: metaN });
  });

  /* HR-02 staff register — spans both campuses, every category,
     employment type, vacation flag and status the spec names. */
  const STAFF = [
    { id: "e1", code: "NAV-0142", name: "Ananya Rao", desig: "PGT, Physics", cat: "teaching", dept: "Science", campus: "indiranagar", emp: "permanent", vacation: true, status: "active", doj: ["12", "04", "2024"], contractEnd: null },
    { id: "e2", code: "NAV-0118", name: "Vikram Sen", desig: "TGT, Mathematics", cat: "teaching", dept: "Mathematics", campus: "indiranagar", emp: "permanent", vacation: true, status: "active", doj: ["3", "06", "2021"], contractEnd: null },
    { id: "e3", code: "NAV-0207", name: "Kavya Nair", desig: "PRT, Class III", cat: "teaching", dept: "Primary", campus: "indiranagar", emp: "probation", vacation: true, status: "active", doj: ["18", "02", "2026"], contractEnd: null },
    { id: "e4", code: "NAV-0233", name: "Farah Sheikh", desig: "NTT, Pre-primary", cat: "teaching", dept: "Pre-primary", campus: "whitefield", emp: "probation", vacation: true, status: "active", doj: ["4", "01", "2026"], contractEnd: null },
    { id: "e5", code: "NAV-0161", name: "Rohit Malhotra", desig: "Guest faculty, Sanskrit", cat: "guest", dept: "Languages", campus: "indiranagar", emp: "guest", vacation: false, status: "active", doj: ["10", "07", "2025"], contractEnd: ["31", "03", "2026"] },
    { id: "e6", code: "NAV-0088", name: "Meenakshi Pillai", desig: "Head of Science", cat: "teaching", dept: "Science", campus: "indiranagar", emp: "permanent", vacation: true, status: "active", doj: ["6", "06", "2016"], contractEnd: null },
    { id: "e7", code: "NAV-0176", name: "Suresh Kamath", desig: "Accounts executive", cat: "non_teaching", dept: "Administration", campus: "indiranagar", emp: "permanent", vacation: false, status: "active", doj: ["21", "11", "2019"], contractEnd: null },
    { id: "e8", code: "NAV-0199", name: "Divya Prakash", desig: "Front office executive", cat: "non_teaching", dept: "Administration", campus: "whitefield", emp: "contract", vacation: false, status: "active", doj: ["2", "05", "2025"], contractEnd: ["1", "05", "2027"] },
    { id: "e9", code: "NAV-0054", name: "Manjunath Gowda", desig: "Bus driver, Route 4", cat: "support", dept: "Transport", campus: "indiranagar", emp: "permanent", vacation: false, status: "active", doj: ["14", "08", "2014"], contractEnd: null },
    /* mid-exit: the last working day is the fact everything else on
       her row is computed from, so it lives on the record, not in the
       head of whoever initiated it */
    { id: "e10", code: "NAV-0221", name: "Lakshmi Venkat", desig: "Hostel warden", cat: "support", dept: "Hostel", campus: "whitefield", emp: "permanent", vacation: false, status: "notice", doj: ["9", "09", "2018"], contractEnd: null, lwd: ["30", "09", "2026"], exitReasonKey: "hr3.ex.r.resigned" },
    { id: "e11", code: "NAV-0245", name: "Arvind Krishnan", desig: "PGT, Chemistry", cat: "teaching", dept: "Science", campus: "whitefield", emp: "contract", vacation: true, status: "active", doj: ["19", "06", "2025"], contractEnd: ["18", "06", "2026"] },
    { id: "e12", code: "NAV-0250", name: "Neha Bhatt", desig: "PRT, Class V", cat: "teaching", dept: "Primary", campus: "indiranagar", emp: "permanent", vacation: true, status: "noLogin", doj: ["1", "08", "2026"], contractEnd: null },
    { id: "e13", code: "NAV-0034", name: "Ramesh Iyengar", desig: "Facilities in-charge", cat: "non_teaching", dept: "Administration", campus: "indiranagar", emp: "permanent", vacation: false, status: "active", doj: ["3", "03", "2011"], contractEnd: null },
    /* gone: the row keeps every fact it had, and gains the two that
       only matter after someone leaves — when, and why */
    { id: "e14", code: "NAV-0011", name: "Sunita Menon", desig: "TGT, English", cat: "teaching", dept: "Languages", campus: "indiranagar", emp: "permanent", vacation: true, status: "exited", doj: ["12", "06", "2012"], contractEnd: null, lwd: ["30", "06", "2025"], exitReasonKey: "hr3.ex.r.resigned" },
    { id: "e15", code: "NAV-0263", name: "Zoya Ahmed", desig: "Guest faculty, Art", cat: "guest", dept: "Arts", campus: "whitefield", emp: "guest", vacation: false, status: "active", doj: ["1", "02", "2026"], contractEnd: ["30", "04", "2026"] },
    { id: "e16", code: "NAV-0067", name: "Prakash Bhandari", desig: "Sports coach", cat: "support", dept: "Sports", campus: "indiranagar", emp: "permanent", vacation: false, status: "active", doj: ["8", "07", "2017"], contractEnd: null },
  ];
  /* the roll by one of its own fields. The register runs to hundreds
     and this canvas holds sixteen of them, so this counts the shape
     rather than claiming to be the whole — which the band's own foot
     says in words. */
  function rollBy(field, value) {
    return STAFF.filter(function (x) { return x[field] === value && x.status !== "exited"; }).length;
  }
  const TOTAL_IN_SCOPE = 214; /* what the footer cites — the register is built to run to hundreds, not to hold exactly sixteen rows */

  const DEPARTMENTS = ["Science", "Mathematics", "Primary", "Pre-primary", "Languages", "Administration", "Transport", "Hostel", "Arts", "Sports"];

  /* HR-09 document control queue — spans all four lanes. */
  const DOC_QUEUE = [
    {
      id: "q1", lane: "toVerify", requesterKey: "hr3.dq.who.meera", employee: "Ananya Rao", dept: "Science",
      typeKey: "hr3.dq.type.pan", age: 3, due: ["20", "08", "2026"],
      noteKey: null,
    },
    {
      id: "q2", lane: "toVerify", requesterKey: "hr3.dq.who.rajan", employee: "Suresh Kamath", dept: "Administration",
      typeKey: "hr3.dq.type.bankProof", age: 1, due: ["25", "08", "2026"],
      noteKey: "hr3.dq.det.noNote", noteText: "Sending the new HDFC cheque leaf as proof — please check the account name matches the salary register.",
    },
    {
      id: "q3", lane: "toVerify", requesterKey: "hr3.dq.who.rajan", employee: "Farah Sheikh", dept: "Pre-primary",
      typeKey: "hr3.dq.type.degree", age: 6, due: ["14", "08", "2026"],
      noteKey: null, batch: true,
    },
    {
      id: "q4", lane: "toVerify", requesterKey: "hr3.dq.who.rajan", employee: "Zoya Ahmed", dept: "Arts",
      typeKey: "hr3.dq.type.aadhaar", age: 6, due: ["14", "08", "2026"],
      noteKey: null, batch: true,
    },
    {
      id: "q5", lane: "awaiting", requesterKey: "hr3.dq.who.meera", employee: "Kavya Nair", dept: "Primary",
      typeKey: "hr3.dq.type.training", age: 2, due: ["28", "08", "2026"],
      noteKey: null,
    },
    {
      id: "q6", lane: "awaiting", requesterKey: "hr3.dq.who.meera", employee: "Neha Bhatt", dept: "Primary",
      typeKey: "hr3.dq.type.police", age: 4, due: ["30", "08", "2026"],
      noteKey: null,
    },
    {
      id: "q7", lane: "overdue", requesterKey: "hr3.dq.who.meera", employee: "Manjunath Gowda", dept: "Transport",
      typeKey: "hr3.dq.type.license", age: 9, due: ["4", "08", "2026"],
      noteKey: null,
    },
    {
      id: "q8", lane: "overdue", requesterKey: "hr3.dq.who.rajan", employee: "Lakshmi Venkat", dept: "Hostel",
      typeKey: "hr3.dq.type.medical", age: 12, due: ["1", "08", "2026"],
      noteKey: null,
    },
    {
      id: "q9", lane: "rejected", requesterKey: "hr3.dq.who.meera", employee: "Rohit Malhotra", dept: "Languages",
      typeKey: "hr3.dq.type.address", age: 8, due: ["6", "08", "2026"],
      noteKey: null, rejectedBy: "hr3.dq.who.meera", rejectedOn: ["7", "08", "2026"],
      rejectReasonText: "The scan cuts off the pin code — please resend with the full page visible.",
    },
  ];

  const DOC_TYPES = ["pan", "aadhaar", "bankProof", "medical", "police", "training", "degree", "bed", "address", "license"];

  /* ============================================================
     HELPERS
     ============================================================ */
  function dmy(t, d) {
    if (!d) return null;
    return d[0] + " " + t("hr3.mon." + d[1]) + " " + d[2];
  }

  function initials(name) {
    const parts = name.split(" ").filter(Boolean);
    return ((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "");
  }

  /* a compact filter control — kit's Field carries a fixed 20px bottom
     margin meant for a vertical form; a horizontal filter bar needs a
     tighter version of the same label-above-control shape. Local for
     now (kit.jsx is out of scope for this dispatch). */
  function FilterField({ label, children, minWidth }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: minWidth || 150, flex: "1 1 150px" }}>
        <span style={ty("caption", { color: c.inkMuted })}>{label}</span>
        {children}
      </div>
    );
  }

  /* an avatar-in-lieu-of-photo initials chip — never a real photo in a
     design mock, and never anything that reads as an identifier */
  function Avatar({ name, size }) {
    const { c } = useTheme();
    const s = size || 32;
    return (
      <span
        aria-hidden="true"
        style={{
          width: s, height: s, borderRadius: G3.r.pill, background: c.sunken, color: c.inkMuted,
          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          fontFamily: G3.font.ui, fontSize: s * 0.36, fontWeight: 700,
        }}
      >
        {initials(name)}
      </span>
    );
  }

  /* ============================================================
     TOP STRIP + PAGE HEAD — the shape every v3 page shares
     (Attendance, Documents, Profile). `campus` is the extra HR carries:
     scope is echoed in the header always (HR-01 Actions, "Switch
     campus").
     ============================================================ */
  function TopStrip({ navKey, campus, onCampus, showCampus }) {
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
          {showCampus ? <CampusSwitch value={campus} onChange={onCampus} /> : null}
          <ThemeToggle />
        </div>
      </div>
    );
  }

  /* ============================================================
     HR-01 · WORK QUEUE
     ============================================================ */
  /* THE ONE RANKING ON THIS SCREEN. A breach outranks a deadline, a
     deadline outranks a review, and within a kind the oldest wins.
     The card names the top of this list and the register IS the list,
     so the ordering is computed once and the two cannot drift. */
  const URGENCY = { absent: 0, late: 1, ltEL: 2, present: 3, off: 3 };
  function urgentFirst(rows) {
    return rows.filter((q) => q.count > 0)
      .slice()
      .sort(function (a, b) {
        const ua = URGENCY[a.role] == null ? 9 : URGENCY[a.role];
        const ub = URGENCY[b.role] == null ? 9 : URGENCY[b.role];
        if (ua !== ub) return ua - ub;
        return (b.metaN || 0) - (a.metaN || 0);
      })
      .concat(rows.filter((q) => q.count === 0));
  }

  function QueueRegister({ rows, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    const columns = [
      { key: "item", label: t("hr3.queue.col.item") },
      { key: "state", label: t("hr3.queue.col.state") },
      { key: "meta", label: t("hr3.queue.col.meta"), mono: true },
      { key: "go", label: t("hr3.queue.col.go"), align: "right", width: 46 },
    ];

    const rowData = urgentFirst(rows).map((q) => {
      const meta = q.metaN != null ? t(q.metaKey, { n: q.metaN }) : t(q.metaKey);
      return {
        id: q.id,
        cells: {
          item: (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden="true" style={{ display: "flex", color: c.inkMuted, flexShrink: 0 }}><Icon name={q.icon} size={17} /></span>
              <span style={ty("small", { color: c.ink, fontWeight: 700, minWidth: 0 })}>{t(q.labelKey)}</span>
            </span>
          ),
          state: <StatusMark role={q.role} word={t(q.wordKey)} count={q.count} />,
          meta: <span style={G3.fig("xs", { color: c.inkFaint })}>{meta}</span>,
          go: (
            <button
              type="button"
              aria-label={t("hr3.queue.open", { item: t(q.labelKey) })}
              onClick={() => onNavigate && onNavigate(q.route)}
              style={{
                width: 30, height: 30, borderRadius: G3.r.pill, border: "1px solid " + c.border,
                background: "transparent", color: c.inkMuted, display: "inline-flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              <Icon name="arrow" size={14} />
            </button>
          ),
        },
      };
    });

    return (
      <Register
        title={t("hr3.queue.title")}
        columns={columns}
        rows={rowData}
        footer={<span style={ty("caption", { color: c.inkFaint, maxWidth: 720 })}>{t("hr3.queue.footNote")}</span>}
      />
    );
  }

  /* THE DAY, AS THE SAME BAND THE REGISTERS SCREEN USES: the mix on
     top with a colour-coded legend, the figures beneath it, each with
     the colour of the thing it counts. Four bare figures said how big
     the job was and nothing about its shape; the bar says in one read
     that seven of the thirty-two are already late. */
  function TodayCard({ rows, campus, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    const queue = rows.filter((q) => q.id !== "joiners" && q.id !== "leavers");
    const waiting = queue.reduce((n, q) => n + q.count, 0);
    const breaching = rows.filter((q) => q.role === "absent").reduce((n, q) => n + q.count, 0);
    const overdueDocs = (rows.filter((q) => q.id === "docsOverdue")[0] || {}).count || 0;
    const joiners = (rows.filter((q) => q.id === "joiners")[0] || {}).count || 0;
    const leavers = (rows.filter((q) => q.id === "leavers")[0] || {}).count || 0;
    /* the same ordering the register uses, so the line named here is
       the line at the top of the table */
    const first = urgentFirst(queue)[0] || null;

    /* who is not at work today, read off the attendance screen rather
       than counted a second time here */
    const AT = window.Pages3 && window.Pages3.AttToday;
    const onLeave = AT ? AT.countOf(campus, "leave") : 0;
    const noWord = AT ? AT.countOf(campus, "missing") : 0;

    const metrics = [
      /* the one line that is actually late, which is what "where to
         start" below has been pointing at all along */
      { k: "overdue", label: t("hr4.today.overdue"), value: num(overdueDocs), n: overdueDocs,
        note: t("hr4.today.overdueNote"), tone: c.chartRed, warn: overdueDocs > 0 },
      /* the overdue requests are INSIDE this, so it takes no band: it is
         a cut across the queue, not a sixth population of the day */
      { k: "breach", label: t("hr4.today.breach"), value: num(breaching), n: breaching, bar: false,
        note: t("hr4.today.breachNote", { n: num(waiting) }), tone: c.chartAmber },
      { k: "leave", label: t("hr4.today.leave"), value: num(onLeave), n: onLeave,
        note: t("hr4.today.leaveNote"), tone: c.chartTeal },
      { k: "noword", label: t("hr4.today.noword"), value: num(noWord), n: noWord,
        note: t("hr4.today.nowordNote"), tone: noWord ? c.chartAmber : c.chartGreen },
      { k: "joiners", label: t("hr4.today.joiners"), value: num(joiners), n: joiners, note: t("hr4.today.joinersNote"), tone: c.chartGreen },
      { k: "leavers", label: t("hr4.today.leavers"), value: num(leavers), n: leavers, note: t("hr4.today.leaversNote"), tone: c.chartPurple },
    ];

    return (
      <Band
        head={t("hr4.today.title")}
        sub={t("hr4.today.sub", { campus: campusLabel(t, campus) })}
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button kind="secondary" size="sm" iconLeft="staff" onClick={() => onNavigate && onNavigate("hrAdd")}>{t("hr3.h1.addEmployee")}</Button>
            <Button kind="primary" size="sm" iconLeft="document" onClick={() => onNavigate && onNavigate("hrDocs")}>{t("hr3.h1.raiseRequest")}</Button>
          </div>
        }
        /* the queue cut three ways -- the lines past their service level,
           the ones with a clock running, and the rest. Written out
           because `waiting` is the whole of it and `breach` is part of
           it, which no derivation can tell apart. */
        metrics={metrics}
        foot={first ? (
          /* a count says how big the job is; this says which part of it
             to do, and the register below lists the rest in this order */
          <button
            type="button" onClick={() => onNavigate && onNavigate(first.route)}
            style={{
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", border: "none",
              padding: "5px 2px", margin: "-5px -2px", background: "transparent",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={ty("caption", {
              color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
            })}>{t("hr4.today.first")}</span>
            <StatusMark role={first.role} word={t(first.wordKey, { n: num(first.count) })} count={first.count} />
            <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(first.labelKey)}</span>
            <span style={ty("caption", { color: c.inkMuted })}>
              {first.metaN != null ? t(first.metaKey, { n: first.metaN }) : t(first.metaKey)}
            </span>
            <span aria-hidden="true" style={{ display: "flex", color: c.action }}><Icon name="arrow" size={14} /></span>
          </button>
        ) : null}
      />
    );
  }

  /* WHO IS OUT TODAY. The figure on the band says how many; a name is
     what somebody actually needs when a class has no teacher in front
     of it. Read off HR-39's roll, the same place the figure is counted,
     so the card and the band cannot disagree about a morning. */
  function OnLeaveCard({ campus, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const AT = window.Pages3 && window.Pages3.AttToday;
    const away = AT ? AT.roll(campus).filter(function (p) { return p.state === "leave"; }) : [];

    /* No heading icon: every row below opens with an avatar, and a
       tinted round tile above three more tinted round tiles reads as a
       fourth person rather than as a heading. */
    return (
      <Card
        title={t("hr4.away.title")}
        sub={away.length === 1 ? t("hr4.away.sub1") : t("hr4.away.subN", { n: num(away.length) })}
      >
        {away.length === 0 ? (
          <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("hr4.away.none")}</p>
        ) : (
          <div>
            {away.map(function (p, i) {
              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "10px 0", borderTop: i ? "1px solid " + c.rule : "none",
                }}>
                  <Avatar name={t(p.nameKey)} size={34} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(p.nameKey)}</span>
                    <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>
                      {t(p.desigKey)} · {t(p.deptKey)}
                    </span>
                  </span>
                  {campus === CAMPUS_ALL
                    ? <span style={ty("caption", { color: c.inkFaint, whiteSpace: "nowrap" })}>{t(p.campusKey)}</span>
                    : null}
                </div>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + c.border }}>
          <LinkButton onClick={function () { onNavigate && onNavigate("hrLeaveAtt"); }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              {t("hr4.away.open")}
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="arrow" size={14} /></span>
            </span>
          </LinkButton>
        </div>
      </Card>
    );
  }

  /* ============================================================
     PAY REQUESTS — the one module the queue does not speak for.

     The queue above holds documents, onboarding, probation, contracts,
     candidates, helpdesk and attendance, so a tile for any of those
     would be the second telling of one fact. What it never says is
     what HR owes payroll: HR verifies, payroll decides the money, and
     nothing moves until the first half is done.
     ============================================================ */
  function PayRequestsTile({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const Q = window.NaveyaPayRequests || null;

    const kindN = function (k) {
      return Q ? Q.byKind(k).filter(function (r) { return r.state === "withHR"; }).length : 0;
    };
    const withHR = Q ? Q.all().filter(function (r) { return r.state === "withHR"; }).length : 0;
    const sentOn = Q ? Q.all().filter(function (r) { return r.state === "withPayroll"; }).length : 0;
    const kinds = [
      { k: "claim", label: t("hr4.d.claims"), color: c.chartAmber },
      { k: "ot", label: t("hr4.d.ot"), color: c.chartTeal },
      { k: "loan", label: t("hr4.d.loans"), color: c.chartPurple },
      { k: "rise", label: t("hr4.d.rises"), color: c.chartGreen },
    ].map(function (x) { return Object.assign({ v: kindN(x.k) }, x); });

    return (
      <button
        type="button" className="nv3-tile" aria-label={t("hr4.d.pay")}
        onClick={function () { onNavigate && onNavigate("hrPay"); }}
        style={{
          display: "block", width: "100%", textAlign: "left", cursor: "pointer",
          border: "1px solid " + c.rule, borderRadius: G3.r.md,
          background: c.surface, padding: "18px 20px 20px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
          <span aria-hidden="true" style={{
            width: 26, height: 26, borderRadius: G3.r.pill, flexShrink: 0,
            background: withHR ? c.lateTint : c.sunken, color: withHR ? c.lateText : c.inkMuted,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name="payslip" size={15} /></span>
          <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("hr4.d.pay")}</span>
          <span aria-hidden="true" style={{ marginInlineStart: "auto", display: "flex", color: c.inkFaint }}>
            <Icon name="arrow" size={15} />
          </span>
        </span>

        <span style={{ display: "block" }}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span style={G3.fig("xl", { color: c.ink, fontWeight: 700, lineHeight: 1 })}>{num(withHR)}</span>
            <span style={ty("small", { color: c.inkMuted })}>{t("hr4.d.payUnit")}</span>
          </span>
          <span style={ty("caption", { color: c.inkMuted, marginTop: 5, display: "block" })}>{t("hr4.d.payNote")}</span>

          {/* the four subjects across the column, in the same strip the
              band above uses, so the page has one way of showing a row
              of figures rather than two */}
          <span style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            marginTop: 16, paddingTop: 15, borderTop: "1px solid " + c.rule,
          }}>
            {kinds.map(function (x, i) {
              return (
                <span key={x.k} style={{
                  minWidth: 0, paddingInlineEnd: 16,
                  paddingInlineStart: i ? 16 : 0,
                  borderInlineStart: i ? "1px solid " + c.rule : "none",
                }}>
                  <span style={ty("caption", {
                    color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                    display: "block",
                  })}>{x.label}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 9 }}>
                    <Swatch tone={x.color} />
                    <span style={G3.fig("lg", {
                      color: x.v > 0 ? c.ink : c.inkFaint, fontWeight: 700, lineHeight: 1.1,
                    })}>{num(x.v)}</span>
                  </span>
                </span>
              );
            })}
          </span>

          {/* and the one bar they add up to. The four kinds are everybody
              waiting on HR, so this bar IS that queue. Built from spans
              rather than MetricStrip because the whole tile is a button,
              and a button may not hold a div. */}
          {withHR > 0 ? (
            <span
              role="img" aria-label={kinds.map(function (x) { return x.label + " " + x.v; }).join(", ")}
              style={{
                display: "flex", height: 10, marginTop: 18, borderRadius: G3.r.pill,
                overflow: "hidden", background: c.gutter,
              }}
            >
              {kinds.filter(function (x) { return x.v > 0; }).map(function (x) {
                return <span key={x.k} aria-hidden="true" style={{ flex: x.v, background: x.color }} />;
              })}
            </span>
          ) : null}
        </span>

        <span style={ty("caption", {
          color: c.inkFaint, marginTop: 16, paddingTop: 13, display: "block",
          borderTop: "1px solid " + c.rule,
        })}>{t("hr4.d.payFoot", { n: num(sentOn) })}</span>
      </button>
    );
  }

  function HRHome({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [campus, setCampus] = useState("indiranagar");
    const rows = QUEUE_BY_CAMPUS[campus] || QUEUE_BY_CAMPUS[CAMPUS_ALL];
    const queueRows = rows.filter((q) => q.id !== "joiners" && q.id !== "leavers");

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrHome" onNavigate={onNavigate} initials="MI" />

        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip navKey="nav.hrHome" campus={campus} onCampus={setCampus} showCampus />

            {/* a plain head, as on every other home */}
            <div style={{ marginBottom: L.gap }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("hr4.greeting")}</h1>
              <p style={ty("body", { margin: "7px 0 0", color: c.inkMuted })}>
                {t("hr3.identity", { campus: campusLabel(t, campus) })}
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                {t("hr4.today.date")}
              </p>
            </div>

            <TodayCard rows={rows} campus={campus} onNavigate={onNavigate} />

            {/* the queue itself leads the columns — it IS the job — with
                the week's movement and the dates beside it */}
            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", marginTop: L.gap }}>
              <div style={{ flex: "1.5 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                <QueueRegister rows={queueRows} onNavigate={onNavigate} />
                {/* under the queue, because it IS queue work -- the one
                    kind the eight lines above do not carry */}
                <PayRequestsTile onNavigate={onNavigate} />
              </div>
              {/* today, then this month, then the term: who is out now is
                  the only one of the three anybody acts on */}
              <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                <OnLeaveCard campus={campus} onNavigate={onNavigate} />
                {window.LeaveFlow && window.LeaveFlow.CelebrationsCard
                  ? React.createElement(window.LeaveFlow.CelebrationsCard, { excludeId: null, sub: t("hr4.cel.sub") })
                  : null}
                {window.NaveyaHolidays && window.NaveyaHolidays.Card
                  ? React.createElement(window.NaveyaHolidays.Card, { onOpen: () => onNavigate && onNavigate("hrLeaveAtt") })
                  : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     HR-02 · STAFF REGISTER
     ============================================================ */
  function ExportPanel({ onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [format, setFormat] = useState("csv");
    const [includePII, setIncludePII] = useState(false);
    const [reason, setReason] = useState("");
    const canGo = !includePII || reason.trim().length > 0;

    return (
      <Card fill={c.sunken} border={c.border} style={{ marginBottom: 18 }}>
        <h3 style={ty("h3", { margin: "0 0 14px", color: c.ink })}>{t("hr3.exp.title")}</h3>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <FilterField label={t("hr3.exp.format")} minWidth={140}>
            <Select
              id="hr3-exp-format" value={format} onChange={setFormat}
              options={[{ value: "csv", label: t("hr3.exp.formatCsv") }, { value: "pdf", label: t("hr3.exp.formatPdf") }]}
            />
          </FilterField>
          <div style={{ flex: "1 1 260px", minWidth: 220 }}>
            <Switch id="hr3-exp-pii" checked={includePII} onChange={setIncludePII} label={t("hr3.exp.includePII")} />
            <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0", maxWidth: 420 })}>{t("hr3.exp.includePIIHint")}</p>
          </div>
        </div>

        {includePII ? (
          <div style={{ marginTop: 16, maxWidth: 460 }}>
            <Field id="hr3-exp-reason" label={t("hr3.exp.reasonLabel")} hint={t("hr3.exp.reasonHint")}>
              <Input id="hr3-exp-reason" value={reason} onChange={setReason} placeholder={t("hr3.exp.reasonPh")} />
            </Field>
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
          <Button kind="primary" size="sm" disabled={!canGo} onClick={canGo ? undefined : (e) => e.preventDefault()}>{t("hr3.exp.go")}</Button>
          <Button kind="secondary" size="sm" onClick={onClose}>{t("hr3.exp.cancel")}</Button>
          <span style={ty("caption", { color: c.inkFaint, flex: "1 1 260px" })}>{t("hr3.exp.note")}</span>
        </div>
      </Card>
    );
  }

  function StaffFilters({ f, setF }) {
    const { t } = useLang();
    return (
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
        <FilterField label={t("hr3.st.searchPh")} minWidth={220}>
          <Input id="hr3-st-search" value={f.q} onChange={(v) => setF(Object.assign({}, f, { q: v }))} placeholder={t("hr3.st.searchPh")} />
        </FilterField>
        <FilterField label={t("hr3.st.filter.dept")}>
          <Select
            id="hr3-st-dept" value={f.dept} onChange={(v) => setF(Object.assign({}, f, { dept: v }))}
            options={[{ value: "all", label: t("hr3.st.filter.deptAll") }].concat(DEPARTMENTS.map((d) => ({ value: d, label: d })))}
          />
        </FilterField>
        <FilterField label={t("hr3.st.filter.category")}>
          <Select
            id="hr3-st-cat" value={f.cat} onChange={(v) => setF(Object.assign({}, f, { cat: v }))}
            options={[{ value: "all", label: t("hr3.st.filter.categoryAll") }, { value: "teaching", label: t("hr3.cat.teaching") }, { value: "non_teaching", label: t("hr3.cat.non_teaching") }, { value: "support", label: t("hr3.cat.support") }, { value: "guest", label: t("hr3.cat.guest") }]}
          />
        </FilterField>
        <FilterField label={t("hr3.st.filter.employment")}>
          <Select
            id="hr3-st-emp" value={f.emp} onChange={(v) => setF(Object.assign({}, f, { emp: v }))}
            options={[
              { value: "all", label: t("hr3.st.filter.employmentAll") },
              { value: "permanent", label: t("hr3.emp.permanent") },
              { value: "probation", label: t("hr3.emp.probation") },
              { value: "contract", label: t("hr3.emp.contract") },
              { value: "guest", label: t("hr3.emp.guest") },
              { value: "exited", label: t("hr3.emp.exited") },
            ]}
          />
        </FilterField>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", paddingBottom: 4 }}>
          <Switch id="hr3-st-exited" checked={f.includeExited} onChange={(v) => setF(Object.assign({}, f, { includeExited: v }))} label={t("hr3.st.filter.includeExited")} />
          <Switch id="hr3-st-expiring" checked={f.expiringOnly} onChange={(v) => setF(Object.assign({}, f, { expiringOnly: v }))} label={t("hr3.st.filter.expiringOnly")} />
        </div>
      </div>
    );
  }

  /* EXIT — the one lifecycle action that ends somebody's employment,
     so it is deliberately the longest form in this file: the date, the
     reason, whether notice is served, and a written account of what
     the school does next. Nothing is irreversible on the day it is
     initiated — the person goes ON NOTICE and the last working day is
     what everything else (payroll's paid days, the F&F, the access
     cut-off) is computed from. */
  function ExitFlow({ person, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [lwd, setLwd] = useState("");
    const [reason, setReason] = useState("");
    const [notice, setNotice] = useState("");
    const [err, setErr] = useState({});

    function submit() {
      const e = {};
      if (!lwd) e.lwd = "hr3.ex.lwdMissing";
      if (!reason) e.reason = "hr3.ex.reasonMissing";
      if (!notice) e.notice = "hr3.ex.noticeMissing";
      setErr(e);
      if (Object.keys(e).length) return;
      onDone(lwd, reason);
    }

    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          role="dialog" aria-modal="true" aria-label={t("hr3.ex.title")}
          style={{ position: "relative", width: 580, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: 24 }}
        >
          <h2 style={ty("h2", { margin: "0 0 4px", color: c.ink })}>{t("hr3.ex.title")}</h2>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 18px" })}>
            {t("hr3.ex.sub", { name: person.name, code: person.code, desig: person.desig })}
          </p>

          <Field id="hr3-ex-lwd" label={t("hr3.ex.lwd")} hint={t("hr3.ex.lwdHint")} error={err.lwd ? t(err.lwd) : null}>
            <Input id="hr3-ex-lwd" type="date" value={lwd} onChange={(v) => { setLwd(v); setErr({}); }} />
          </Field>

          <Field id="hr3-ex-reason" label={t("hr3.ex.reason")} error={err.reason ? t(err.reason) : null}>
            <Select
              id="hr3-ex-reason" value={reason} onChange={(v) => { setReason(v); setErr({}); }}
              options={[
                { value: "", label: t("hr3.ex.reasonPh") },
                { value: "resigned", label: t("hr3.ex.r.resigned") },
                { value: "ended", label: t("hr3.ex.r.ended") },
                { value: "retired", label: t("hr3.ex.r.retired") },
                { value: "released", label: t("hr3.ex.r.released") },
              ]}
            />
          </Field>

          <Field id="hr3-ex-notice" label={t("hr3.ex.notice")} hint={t("hr3.ex.noticeHint")} error={err.notice ? t(err.notice) : null}>
            <Select
              id="hr3-ex-notice" value={notice} onChange={(v) => { setNotice(v); setErr({}); }}
              options={[
                { value: "", label: t("hr3.ex.noticePh") },
                { value: "serve", label: t("hr3.ex.n.serve") },
                { value: "waive", label: t("hr3.ex.n.waive") },
                { value: "payInLieu", label: t("hr3.ex.n.payInLieu") },
              ]}
            />
          </Field>

          {/* what the school does next, in the order it happens —
              written out before the button, not discovered after it */}
          <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: "14px 16px", marginBottom: 18 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("hr3.ex.next")}</div>
            {["hr3.ex.n1", "hr3.ex.n2", "hr3.ex.n3", "hr3.ex.n4"].map((k, i) => (
              <div key={k} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: i ? 7 : 0 }}>
                <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: G3.r.pill, background: c.inkFaint, marginTop: 7, flexShrink: 0 }} />
                <span style={ty("caption", { color: c.inkMuted })}>{t(k)}</span>
              </div>
            ))}
          </div>

          <p style={ty("caption", { color: c.inkFaint, margin: "0 0 14px" })}>{t("hr3.ex.reversible")}</p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button kind="ghost" size="sm" onClick={onClose}>{t("hr3.ex.cancel")}</Button>
            <Button kind="primary" size="sm" onClick={submit}>{t("hr3.ex.confirm")}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  /* CHANGING A NOTICE THAT IS ALREADY RUNNING. The exit flow states
     what happens when it starts; this one states what MOVES when the
     date changes, because by now a settlement is open and payroll has
     her in the month. Later and earlier are the same control with
     different consequences, and the earlier case warns rather than
     refuses — a school does sometimes release somebody early, and the
     product should let HR record what happened instead of making them
     withdraw the exit and start it again. */
  function NoticeChangeDialog({ person, current, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [date, setDate] = useState("");
    const [reason, setReason] = useState("");
    const [why, setWhy] = useState("");
    const [err, setErr] = useState({});

    const currentIso = current[2] + "-" + current[1] + "-" + (current[0].length === 1 ? "0" + current[0] : current[0]);
    const later = date && date > currentIso;
    const earlier = date && date < currentIso;

    function submit() {
      const e = {};
      if (!date) e.date = "hr3.nc.errMissing";
      else if (date === currentIso) e.date = "hr3.nc.errSame";
      if (!reason) e.reason = "hr3.nc.errReason";
      if (!why.trim()) e.why = "hr3.nc.errWhy";
      setErr(e);
      if (Object.keys(e).length) return;
      const p = date.split("-");
      onDone([String(Number(p[2])), p[1], p[0]], later);
    }

    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          role="dialog" aria-modal="true" aria-label={t("hr3.nc.title")}
          style={{ position: "relative", width: 580, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: 24 }}
        >
          <h2 style={ty("h2", { margin: "0 0 4px", color: c.ink })}>{t("hr3.nc.title")}</h2>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>
            {t("hr3.nc.sub", { name: person.name, date: dmy(t, current) })}
          </p>

          <Field id="hr3-nc-date" label={t("hr3.nc.newDate")} hint={t("hr3.nc.newDateHint")} error={err.date ? t(err.date) : null}>
            <Input id="hr3-nc-date" type="date" value={date} onChange={(v) => { setDate(v); setErr({}); }} />
          </Field>

          {/* the same control, two different consequences — said in
              words the moment the date makes one of them true */}
          {later ? (
            <div style={{ background: c.sunken, borderRadius: G3.r.md, padding: "11px 13px", marginBottom: 18 }}>
              <span style={ty("caption", { color: c.inkMuted })}>{t("hr3.nc.laterNote")}</span>
            </div>
          ) : null}
          {earlier ? (
            <div style={{ background: c.lateTint, borderRadius: G3.r.md, padding: "11px 13px", marginBottom: 18 }}>
              <span style={ty("caption", { color: c.lateText, fontWeight: 600 })}>{t("hr3.nc.earlierWarn")}</span>
            </div>
          ) : null}

          <Field id="hr3-nc-reason" label={t("hr3.nc.reason")} error={err.reason ? t(err.reason) : null}>
            <Select
              id="hr3-nc-reason" value={reason} onChange={(v) => { setReason(v); setErr({}); }}
              options={[
                { value: "", label: t("hr3.nc.reasonPh") },
                { value: "replacement", label: t("hr3.nc.r.replacement") },
                { value: "term", label: t("hr3.nc.r.term") },
                { value: "handover", label: t("hr3.nc.r.handover") },
                { value: "employee", label: t("hr3.nc.r.employee") },
                { value: "released", label: t("hr3.nc.r.released") },
              ]}
            />
          </Field>

          <Field id="hr3-nc-why" label={t("hr3.nc.why")} hint={t("hr3.nc.whyHint")} error={err.why ? t(err.why) : null}>
            <Input id="hr3-nc-why" value={why} onChange={(v) => { setWhy(v); setErr({}); }} placeholder={t("hr3.nc.whyPh")} invalid={!!err.why} />
          </Field>

          <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: "14px 16px", marginBottom: 18 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("hr3.nc.moves")}</div>
            {["hr3.nc.m1", "hr3.nc.m2", "hr3.nc.m3", "hr3.nc.m4"].map((k, i) => (
              <div key={k} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: i ? 7 : 0 }}>
                <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: G3.r.pill, background: c.inkFaint, marginTop: 7, flexShrink: 0 }} />
                <span style={ty("caption", { color: c.inkMuted })}>{t(k)}</span>
              </div>
            ))}
          </div>

          <p style={ty("caption", { color: c.inkFaint, margin: "0 0 14px" })}>{t("hr3.nc.audit")}</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button kind="ghost" size="sm" onClick={onClose}>{t("hr3.ex.cancel")}</Button>
            <Button kind="primary" size="sm" iconLeft="clock" onClick={submit}>{t("hr3.nc.confirm")}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  /* Withdrawing an exit is the one restorative action here, so it is
     a plain confirm rather than a form: the date and the reason on
     the record are the thing being undone, and both stay readable. */
  function WithdrawExitDialog({ person, current, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [why, setWhy] = useState("");
    const [err, setErr] = useState(false);

    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          role="dialog" aria-modal="true" aria-label={t("hr3.wd.title")}
          style={{ position: "relative", width: 540, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: 24 }}
        >
          <h2 style={ty("h2", { margin: "0 0 4px", color: c.ink })}>{t("hr3.wd.title")}</h2>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>
            {t("hr3.wd.sub", { name: person.name, date: dmy(t, current) })}
          </p>
          <Field id="hr3-wd-why" label={t("hr3.wd.why")} hint={t("hr3.wd.whyHint")} error={err ? t("hr3.wd.errWhy") : null}>
            <Input id="hr3-wd-why" value={why} onChange={(v) => { setWhy(v); setErr(false); }} placeholder={t("hr3.wd.whyPh")} invalid={err} />
          </Field>
          <p style={ty("caption", { color: c.inkFaint, margin: "0 0 14px" })}>{t("hr3.wd.audit")}</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button kind="ghost" size="sm" onClick={onClose}>{t("hr3.ex.cancel")}</Button>
            <Button kind="primary" size="sm" iconLeft="check" onClick={() => { if (!why.trim()) { setErr(true); return; } onDone(); }}>{t("hr3.wd.confirm")}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function HRStaff({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const [showExport, setShowExport] = useState(false);
    const [selected, setSelected] = useState({});
    const [f, setF] = useState({ q: "", dept: "all", cat: "all", emp: "all", includeExited: false, expiringOnly: false });
    /* an exit in flight: id -> { lwd, reason }. The register is the
       only place that can show what "initiate" actually did, so it
       shows it — On notice, with the last working day. */
    const [notices, setNotices] = useState({});
    const [exiting, setExiting] = useState(null);
    /* changing or withdrawing an exit that is already running */
    const [changing, setChanging] = useState(null);
    const [withdrawing, setWithdrawing] = useState(null);
    const [withdrawn, setWithdrawn] = useState({});
    const [done, setDone] = useState(null);

    /* the last working day of somebody on notice, wherever it came
       from — seeded on the record, or written by the exit flow — and
       whatever it has since been moved to */
    function lwdOf(s) {
      const n = notices[s.id];
      return (n && n.lwd) || s.lwd || null;
    }

    const filtered = useMemo(() => {
      const q = f.q.trim().toLowerCase();
      return STAFF.filter((s) => {
        /* "Left" is a value of the employment filter now, and choosing
           it means exactly that: only the people who have gone. */
        if (f.emp === "exited") return s.status === "exited";
        if (!f.includeExited && s.status === "exited") return false;
        if (!inCampus(campus, s.campus)) return false;
        if (f.dept !== "all" && s.dept !== f.dept) return false;
        if (f.cat !== "all" && s.cat !== f.cat) return false;
        if (f.emp !== "all" && s.emp !== f.emp) return false;
        if (f.expiringOnly && !s.contractEnd) return false;
        if (q && s.name.toLowerCase().indexOf(q) === -1 && s.code.toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
    }, [f, campus]);

    const selectedIds = Object.keys(selected).filter((k) => selected[k]);
    const selCount = selectedIds.length;

    function toggleRow(id) {
      setSelected((cur) => Object.assign({}, cur, { [id]: !cur[id] }));
    }
    function toggleAll() {
      if (selCount === filtered.length) { setSelected({}); return; }
      const next = {};
      filtered.forEach((s) => { next[s.id] = true; });
      setSelected(next);
    }

    const STATUS_ROLE = { active: "present", notice: "late", exited: "off", noLogin: "missing" };
    const STATUS_WORD = { active: "hr3.st.status.active", notice: "hr3.st.status.notice", exited: "hr3.st.status.exited", noLogin: "hr3.st.status.noLogin" };

    const columns = [
      { key: "sel", label: <input type="checkbox" aria-label={t("hr3.st.selectAll")} checked={filtered.length > 0 && selCount === filtered.length} onChange={toggleAll} />, width: 32 },
      { key: "code", label: t("hr3.st.col.code"), mono: true },
      { key: "name", label: t("hr3.st.col.name") },
      { key: "category", label: t("hr3.st.col.category") },
      { key: "dept", label: t("hr3.st.col.dept") },
      { key: "campus", label: t("hr3.st.col.campus") },
      { key: "employment", label: t("hr3.st.col.employment") },
      { key: "status", label: t("hr3.st.col.status") },
      { key: "doj", label: t("hr3.st.col.doj"), mono: true },
      { key: "contractEnd", label: t("hr3.st.col.contractEnd"), mono: true },
      { key: "act", label: t("hr3.st.col.actions"), align: "right", width: 48 },
    ];

    const rows = filtered.map((s) => {
      const noticed = notices[s.id];
      const status = withdrawn[s.id] ? "active" : (noticed ? "notice" : s.status);
      const lastDay = status === "notice" ? lwdOf(s) : null;
      const items = [
        { key: "open", icon: "profile", label: t("hr3.st.menu.open"), onSelect: () => onNavigate && onNavigate("hrRecord") },
        { key: "raise", icon: "document", label: t("hr3.st.menu.raise"), onSelect: () => onNavigate && onNavigate("hrDocs") },
      ];

      /* a notice that is already running can be moved or called off —
         the two things HR could not do until now, and the reason a
         stale last working day used to sit on this screen */
      if (status === "notice" && lastDay) {
        items.push({
          key: "moveLwd", icon: "clock", label: t("hr3.st.menu.changeLwd"),
          onSelect: () => { setDone(null); setChanging({ person: s, current: lastDay }); },
        });
        items.push({
          key: "withdraw", icon: "check", label: t("hr3.st.menu.withdrawExit"),
          onSelect: () => { setDone(null); setWithdrawing({ person: s, current: lastDay }); },
        });
      }

      items.push({
        key: "exit", icon: "signout", label: t("hr3.st.menu.exit"), tone: "danger",
        disabled: status !== "active",
        reason: status !== "active"
          ? (status === "exited" ? t("hr3.st.menu.exitGone") : t("hr3.st.menu.exitDisabled"))
          : undefined,
        onSelect: status === "active" ? () => { setDone(null); setExiting(s); } : undefined,
      });
      return {
        id: s.id,
        cells: {
          sel: <input type="checkbox" aria-label={t("hr3.st.selectRow", { name: s.name })} checked={!!selected[s.id]} onChange={() => toggleRow(s.id)} />,
          code: s.code,
          name: (
            <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <Avatar name={s.name} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{s.name}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{s.desig}</span>
              </span>
            </span>
          ),
          category: <Chip>{t("hr3.cat." + s.cat)}</Chip>,
          dept: s.dept,
          campus: t("hr3.campus." + s.campus),
          employment: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink })}>{t("hr3.emp." + s.emp)}</span>
              {status === "exited" && s.lwd ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>
                  {t("hr3.st.leftOn", { date: dmy(t, s.lwd) })}
                  {s.exitReasonKey ? " · " + t(s.exitReasonKey) : ""}
                </span>
              ) : s.vacation ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{t("hr3.st.vacation")}</span>
              ) : null}
            </span>
          ),
          status: (
            <span>
              <StatusMark role={STATUS_ROLE[status]} word={t(STATUS_WORD[status])} />
              {lastDay ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>
                  {t("hr3.ex.lastDay", { date: dmy(t, lastDay) })}
                </span>
              ) : null}
              {noticed && noticed.movedFrom ? (
                <span style={ty("caption", { display: "block", color: c.lateText, marginTop: 2 })}>
                  {t(noticed.extended ? "hr3.nc.extendedFrom" : "hr3.nc.broughtFrom", { date: dmy(t, noticed.movedFrom) })}
                </span>
              ) : null}
            </span>
          ),
          doj: dmy(t, s.doj),
          contractEnd: s.contractEnd ? dmy(t, s.contractEnd) : (status === "exited" ? t("hr3.st.closedOnExit") : t("hr3.st.ongoing")),
          act: (
            <span style={{ display: "flex", justifyContent: "flex-end" }}>
              <ActionMenu ariaLabel={t("hr3.st.menu.aria", { name: s.name })} items={items} />
            </span>
          ),
        },
      };
    });

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrStaff" onNavigate={onNavigate} initials="MI" />

        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip navKey="nav.hrStaff" campus={campus} onCampus={setCampus} showCampus />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("hr3.st.title")}</h1>
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                <Button kind="secondary" size="sm" iconLeft="download" onClick={() => setShowExport((v) => !v)}>{t("hr3.st.export")}</Button>
                <Button kind="primary" size="sm" iconLeft="staff" onClick={() => onNavigate && onNavigate("hrAdd")}>{t("hr3.h1.addEmployee")}</Button>
              </div>
            </div>

            {showExport ? <ExportPanel onClose={() => setShowExport(false)} /> : null}

            <Band
              head={t("hr3.st.band")} sub={t("hr3.st.bandSub")}
              foot={t("hr3.st.bandFoot", { n: num(STAFF.length), total: num(TOTAL_IN_SCOPE) })}
              metrics={[
                { k: "roll", label: t("hr3.st.m.roll"), value: num(TOTAL_IN_SCOPE), n: TOTAL_IN_SCOPE, total: true,
                  note: t("hr3.st.m.rollNote"), tone: c.chartBlue },
                { k: "prob", label: t("hr3.st.m.prob"), value: num(rollBy("emp", "probation")), n: rollBy("emp", "probation"),
                  note: t("hr3.st.m.probNote"), tone: c.chartAmber },
                { k: "ends", label: t("hr3.st.m.ends"), value: num(STAFF.filter(function (x) { return !!x.contractEnd && x.status !== "exited"; }).length),
                  note: t("hr3.st.m.endsNote"), tone: c.chartPurple },
                { k: "notice", label: t("hr3.st.m.notice"), value: num(STAFF.filter(function (x) { return x.status === "notice"; }).length),
                  /* leaving is a state, not an error */
                  note: t("hr3.st.m.noticeNote"), tone: c.chartTeal },
              ]}
            />

            <StaffFilters f={f} setF={setF} />

            {selCount > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: c.accentSoft, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: "10px 16px", marginBottom: 14 }}>
                <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{selCount === 1 ? t("hr3.st.selectedCount1") : t("hr3.st.selectedCountN", { count: selCount })}</span>
                <Button kind="secondary" size="sm">{t("hr3.st.bulkAssign")}</Button>
                <Button kind="secondary" size="sm" onClick={() => onNavigate && onNavigate("hrDocs")}>{t("hr3.st.bulkRaise")}</Button>
                <LinkButton onClick={() => setSelected({})}>{t("hr3.st.bulkClear")}</LinkButton>
              </div>
            ) : null}

            {done ? (
              <div style={{ marginBottom: 14 }}>
                <Card fill={c.presentTint} border={c.presentBorder || c.border} pad={14}>
                  <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{done}</span>
                </Card>
              </div>
            ) : null}

            {exiting ? (
              <ExitFlow
                person={exiting}
                onClose={() => setExiting(null)}
                onDone={(lwd, reasonKey) => {
                  const p = lwd.split("-");
                  const dmyLwd = [String(Number(p[2])), p[1], p[0]];
                  setNotices(Object.assign({}, notices, { [exiting.id]: { lwd: dmyLwd, reason: reasonKey } }));
                  /* AND PAYROLL IS TOLD. An exit is the one HR act the
                     settlement desk cannot learn any other way, so it
                     goes down the channel the moment it is recorded,
                     and arrives there as a settlement nobody has
                     started. */
                  if (window.NaveyaExits) {
                    window.NaveyaExits.record({
                      staff: exiting.code, name: exiting.name, desig: exiting.desig,
                      lwdIso: lwd, reasonKey: reasonKey,
                      campusKey: exiting.campus === "whitefield" ? "pyo.camp.white" : "pyo.camp.indira",
                      groupKey: exiting.cat === "teaching" ? "pyo.pg.teach" : "pyo.pg.admin",
                      joinedIso: exiting.doj
                        ? exiting.doj[2] + "-" + exiting.doj[1] + "-" + String(exiting.doj[0]).padStart(2, "0")
                        : null,
                    });
                  }
                  setDone(t("hr3.ex.done", { name: exiting.name, date: dmy(t, dmyLwd) }));
                  setExiting(null);
                }}
              />
            ) : null}

            {changing ? (
              <NoticeChangeDialog
                person={changing.person}
                current={changing.current}
                onClose={() => setChanging(null)}
                onDone={(newLwd, later) => {
                  const prev = notices[changing.person.id] || {};
                  setNotices(Object.assign({}, notices, {
                    [changing.person.id]: Object.assign({}, prev, {
                      lwd: newLwd,
                      movedFrom: changing.current,
                      extended: later,
                    }),
                  }));
                  setDone(t(later ? "hr3.nc.doneLater" : "hr3.nc.doneEarlier", { name: changing.person.name, date: dmy(t, newLwd) }));
                  setChanging(null);
                }}
              />
            ) : null}

            {withdrawing ? (
              <WithdrawExitDialog
                person={withdrawing.person}
                current={withdrawing.current}
                onClose={() => setWithdrawing(null)}
                onDone={() => {
                  setWithdrawn(Object.assign({}, withdrawn, { [withdrawing.person.id]: true }));
                  const next = Object.assign({}, notices);
                  delete next[withdrawing.person.id];
                  setNotices(next);
                  setDone(t("hr3.wd.done", { name: withdrawing.person.name }));
                  setWithdrawing(null);
                }}
              />
            ) : null}

            {filtered.length === 0 ? (
              <Card>
                <EmptyState head={t("hr3.st.empty.head")} body={t("hr3.st.empty.body")} />
              </Card>
            ) : (
              <Register
                columns={columns}
                rows={rows}
                footer={<span style={ty("caption", { color: c.inkFaint })}>{t("hr3.st.footNote", { shown: filtered.length, total: TOTAL_IN_SCOPE })}</span>}
              />
            )}
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     HR-09 · DOCUMENT CONTROL QUEUE
     ============================================================ */
  const DQ_STATE = {
    toVerify: { role: "ltEL", wordKey: "hr3.dq.lane.toVerify", glyph: "scan" },
    awaiting: { role: "late", wordKey: "hr3.dq.lane.awaiting", glyph: "clock" },
    overdue: { role: "absent", wordKey: "hr3.dq.lane.overdue", glyph: "alert" },
    rejected: { role: "penalty", wordKey: "hr3.dq.lane.rejected", glyph: "arrow" },
  };

  function RejectForm({ onCancel }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [reason, setReason] = useState("");
    const [note, setNote] = useState("");
    return (
      <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: 14, marginTop: 14 }}>
        <h4 style={ty("small", { margin: "0 0 10px", color: c.ink, fontWeight: 700 })}>{t("hr3.dq.reject.title")}</h4>
        <Field id="hr3-dq-reason" label={t("hr3.dq.reject.pickerLabel")}>
          <Select
            id="hr3-dq-reason" value={reason} onChange={setReason}
            options={[
              { value: "", label: t("hr3.dq.reject.pickerPh") },
              { value: "illegible", label: t("hr3.dq.reject.illegible") },
              { value: "wrongDoc", label: t("hr3.dq.reject.wrongDoc") },
              { value: "expired", label: t("hr3.dq.reject.expired") },
              { value: "nameMismatch", label: t("hr3.dq.reject.nameMismatch") },
              { value: "other", label: t("hr3.dq.reject.other") },
            ]}
          />
        </Field>
        <Field id="hr3-dq-note" label={t("hr3.dq.reject.noteLabel")} hint={!reason ? t("hr3.dq.reject.reasonRequired") : undefined}>
          <Input id="hr3-dq-note" value={note} onChange={setNote} placeholder={t("hr3.dq.reject.notePh")} />
        </Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Button kind="primary" size="sm" disabled={!reason} onClick={reason ? undefined : (e) => e.preventDefault()}>{t("hr3.dq.reject.confirm")}</Button>
          <Button kind="secondary" size="sm" onClick={onCancel}>{t("hr3.dq.reject.cancel")}</Button>
        </div>
      </div>
    );
  }

  function DocDetail({ item, opened, onOpen, onAct }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [showReject, setShowReject] = useState(false);

    if (!item) {
      return (
        <Card icon="document" iconTone="accent" title={t("hr3.dq.det.empty.head")}>
          <EmptyState head={t("hr3.dq.det.empty.head")} body={t("hr3.dq.det.empty.body")} compact />
        </Card>
      );
    }

    const st = DQ_STATE[item.lane];
    const isOpened = !!opened[item.id];

    return (
      <Card icon="document" iconTone="accent" title={t(item.typeKey)} sub={item.employee + " · " + item.dept}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <StatusMark role={st.role} glyph={st.glyph} word={t(st.wordKey)} />
          <span style={ty("caption", { color: c.inkFaint })}>{t("hr3.dq.det.ageLine", { n: item.age })}</span>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={ty("caption", { color: c.inkMuted, marginBottom: 4 })}>{t("hr3.dq.det.employeeNote")}</div>
          {item.noteText ? (
            <div style={{ background: c.sunken, borderRadius: G3.r.md, padding: "10px 12px" }}>
              <p style={ty("small", { margin: 0, color: c.ink })}>{item.noteText}</p>
            </div>
          ) : (
            <p style={ty("small", { margin: 0, color: c.inkFaint })}>{t("hr3.dq.det.noNote")}</p>
          )}
        </div>

        <div style={G3.fig("xs", { color: c.inkFaint, marginBottom: 14 })}>
          {t("hr3.dq.det.dueOn", { date: dmy(t, item.due) })}
        </div>

        {item.lane === "rejected" ? (
          <div style={{ background: c.penaltyTint, borderRadius: G3.r.md, padding: "10px 12px", marginBottom: 14 }}>
            <div style={ty("caption", { color: c.penaltyText, marginBottom: 3 })}>
              {t("hr3.dq.det.rejectedBy", { who: t(item.rejectedBy), date: dmy(t, item.rejectedOn) })}
            </div>
            <div style={ty("small", { color: c.ink })}>{item.rejectReasonText}</div>
          </div>
        ) : null}

        {/* the "to verify" lane left this panel when Doc control
            merged: checking a response happens on its own tab, with
            the document open beside the decision */}

        {item.lane === "awaiting" || item.lane === "overdue" ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              kind="secondary" size="sm" iconLeft="mail" disabled={item.lane !== "overdue"}
              onClick={item.lane === "overdue" ? () => onAct("remind", item) : undefined}
            >{t("hr3.dq.menu.remind")}</Button>
            <Button kind="secondary" size="sm" iconLeft="clock" onClick={() => onAct("extend", item)}>{t("hr3.dq.menu.extend")}</Button>
            <Button kind="secondary" size="sm" onClick={() => onAct("cancel", item)}>{t("hr3.dq.menu.cancel")}</Button>
          </div>
        ) : null}

        {item.lane === "rejected" ? (
          <Button kind="primary" size="sm" iconLeft="document">{t("hr3.dq.menu.reRequest")}</Button>
        ) : null}
      </Card>
    );
  }

  /* Who a bulk request would reach. The roster is the staff register's
     own, so the number in this dialog and the number of rows on HR-02
     can never disagree — and "already holds a current copy" is
     derived, not typed, so the preview and the result match. */
  function holdsDoc(code, type) {
    const n = parseInt(String(code).replace(/\D/g, ""), 10) || 0;
    const k = ["degree", "bed", "tet", "pan", "aadhaar", "police", "medical", "address"].indexOf(type) + 1;
    return (n + k * 7) % 3 === 0;
  }

  function BulkRaiseDialog({ onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [type, setType] = useState("");
    const [campus, setCampus] = useState("all");
    const [dept, setDept] = useState("all");
    const [cat, setCat] = useState("all");
    const [skipHeld, setSkipHeld] = useState(true);
    const [due, setDue] = useState("");
    const [err, setErr] = useState({});

    const matched = STAFF.filter((s) => {
      if (s.status === "exited") return false;
      if (campus !== "all" && s.campus !== campus) return false;
      if (dept !== "all" && s.dept !== dept) return false;
      if (cat !== "all" && s.cat !== cat) return false;
      return true;
    });
    const held = type ? matched.filter((s) => holdsDoc(s.code, type)).length : 0;
    const willAsk = type ? (skipHeld ? matched.length - held : matched.length) : 0;

    function submit() {
      const e = {};
      if (!type) e.type = "hr3.dq.bulk.errType";
      if (!due) e.due = "hr3.dq.bulk.errDue";
      if (type && willAsk === 0) e.type = "hr3.dq.bulk.errNobody";
      setErr(e);
      if (Object.keys(e).length) return;
      onDone(willAsk, type, due);
    }

    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          role="dialog" aria-modal="true" aria-label={t("hr3.dq.bulk.title")}
          style={{ position: "relative", width: 600, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: 24 }}
        >
          <h2 style={ty("h2", { margin: "0 0 4px", color: c.ink })}>{t("hr3.dq.bulk.title")}</h2>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 18px" })}>{t("hr3.dq.bulk.sub")}</p>

          <Field id="hr3-bulk-type" label={t("hr3.dq.bulk.type")} error={err.type ? t(err.type) : null}>
            <Select
              id="hr3-bulk-type" value={type} onChange={(v) => { setType(v); setErr({}); }}
              options={[{ value: "", label: t("hr3.dq.bulk.typePh") }].concat(DOC_TYPES.map((k) => ({ value: k, label: t("hr3.dq.type." + k) })))}
            />
          </Field>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 170px", minWidth: 0 }}>
              <Field id="hr3-bulk-campus" label={t("hr3.dq.bulk.campus")}>
                <Select
                  id="hr3-bulk-campus" value={campus} onChange={setCampus}
                  options={[{ value: "all", label: t("hr3.dq.bulk.campusAll") }, { value: "indiranagar", label: t("hr3.campus.indiranagar") }, { value: "whitefield", label: t("hr3.campus.whitefield") }]}
                />
              </Field>
            </div>
            <div style={{ flex: "1 1 170px", minWidth: 0 }}>
              <Field id="hr3-bulk-dept" label={t("hr3.dq.bulk.dept")}>
                <Select
                  id="hr3-bulk-dept" value={dept} onChange={setDept}
                  options={[{ value: "all", label: t("hr3.dq.filter.deptAll") }].concat(DEPARTMENTS.map((d) => ({ value: d, label: d })))}
                />
              </Field>
            </div>
            <div style={{ flex: "1 1 170px", minWidth: 0 }}>
              <Field id="hr3-bulk-cat" label={t("hr3.dq.bulk.cat")}>
                <Select
                  id="hr3-bulk-cat" value={cat} onChange={setCat}
                  options={[{ value: "all", label: t("hr3.dq.bulk.catAll") }, { value: "teaching", label: t("hr3.cat.teaching") }, { value: "non_teaching", label: t("hr3.cat.non_teaching") }, { value: "support", label: t("hr3.cat.support") }, { value: "guest", label: t("hr3.cat.guest") }]}
                />
              </Field>
            </div>
          </div>

          <Field id="hr3-bulk-due" label={t("hr3.dq.bulk.due")} hint={t("hr3.dq.bulk.dueHint")} error={err.due ? t(err.due) : null}>
            <Input id="hr3-bulk-due" type="date" value={due} onChange={(v) => { setDue(v); setErr({}); }} />
          </Field>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>
            <Switch id="hr3-bulk-skip" checked={skipHeld} onChange={setSkipHeld} label={t("hr3.dq.bulk.skip")} />
            <p style={ty("caption", { margin: 0, color: c.inkFaint, flex: 1, minWidth: 240 })}>{t("hr3.dq.bulk.skipNote")}</p>
          </div>

          {/* the count, before the button. This is the whole point of
              the dialog: nobody should send 180 requests to find out
              how many they sent. */}
          <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: "14px 16px", marginBottom: 18 }}>
            {type ? (
              <React.Fragment>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <Figure value={num(willAsk)} size={26} weight={700} color={c.ink} align="left" />
                  <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{t("hr3.dq.bulk.willAsk")}</span>
                </div>
                <p style={ty("caption", { margin: "6px 0 0", color: c.inkMuted })}>
                  {t("hr3.dq.bulk.matched", { n: num(matched.length) })}
                  {skipHeld && held ? " " + t("hr3.dq.bulk.skipped", { n: num(held) }) : ""}
                </p>
              </React.Fragment>
            ) : (
              <p style={ty("small", { margin: 0, color: c.inkMuted })}>{t("hr3.dq.bulk.pickFirst")}</p>
            )}
          </div>

          <p style={ty("caption", { color: c.inkFaint, margin: "0 0 14px" })}>{t("hr3.dq.bulk.note")}</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button kind="ghost" size="sm" onClick={onClose}>{t("hr3.dq.bulk.cancel")}</Button>
            <Button kind="primary" size="sm" iconLeft="mail" onClick={submit}>{t("hr3.dq.bulk.confirm")}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  /* EXTEND · REMIND · CANCEL — one small dialog, because they are one
     shape: a fact about the request, one input at most, and a line
     saying what the employee sees. */
  /* this file keeps dates as [dd, mm, yyyy] (dmy renders them) while a
     date input speaks ISO, so the two are converted at the edge rather
     than compared by accident — the first draft of this dialog called
     every later date "not later" for exactly that reason */
  function toIso(d) { return Array.isArray(d) ? d[2] + "-" + d[1] + "-" + (d[0].length === 1 ? "0" + d[0] : d[0]) : d; }
  function fromIso(s) { const p = String(s).split("-"); return [String(Number(p[2])), p[1], p[0]]; }

  function RequestActDialog({ kind, item, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [date, setDate] = useState("");
    const [note, setNote] = useState("");
    const [err, setErr] = useState(null);

    const isExtend = kind === "extend";
    const dueIso = toIso(item.due);

    function submit() {
      if (isExtend) {
        if (!date) { setErr("hr3.dq.ext.errMissing"); return; }
        if (date <= dueIso) { setErr("hr3.dq.ext.errEarlier"); return; }
        onDone(fromIso(date));
        return;
      }
      onDone(note);
    }

    const title = isExtend ? "hr3.dq.ext.title" : kind === "remind" ? "hr3.dq.rem.title" : "hr3.dq.can.title";
    const body = isExtend ? "hr3.dq.ext.body" : kind === "remind" ? "hr3.dq.rem.body" : "hr3.dq.can.body";
    const confirm = isExtend ? "hr3.dq.ext.confirm" : kind === "remind" ? "hr3.dq.rem.confirm" : "hr3.dq.can.confirm";

    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          role="dialog" aria-modal="true" aria-label={t(title)}
          style={{ position: "relative", width: 540, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: 24 }}
        >
          <h2 style={ty("h2", { margin: "0 0 4px", color: c.ink })}>{t(title)}</h2>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>
            {t(body, { name: item.employee, doc: t(item.typeKey), date: dmy(t, item.due) })}
          </p>

          {isExtend ? (
            <Field id="hr3-ext-date" label={t("hr3.dq.ext.newDate")} hint={t("hr3.dq.ext.newDateHint", { date: dmy(t, item.due) })} error={err ? t(err) : null}>
              <Input id="hr3-ext-date" type="date" value={date} onChange={(v) => { setDate(v); setErr(null); }} />
            </Field>
          ) : (
            <Field id="hr3-act-note" label={t(kind === "remind" ? "hr3.dq.rem.note" : "hr3.dq.can.note")} hint={t("hr3.dq.act.noteHint")}>
              <Input id="hr3-act-note" value={note} onChange={setNote} placeholder={t(kind === "remind" ? "hr3.dq.rem.notePh" : "hr3.dq.can.notePh")} />
            </Field>
          )}

          <p style={ty("caption", { color: c.inkFaint, margin: "0 0 14px" })}>
            {t(isExtend ? "hr3.dq.ext.tell" : kind === "remind" ? "hr3.dq.rem.tell" : "hr3.dq.can.tell", { name: item.employee })}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button kind="ghost" size="sm" onClick={onClose}>{t("hr3.dq.bulk.cancel")}</Button>
            <Button kind={kind === "cancel" ? "secondary" : "primary"} size="sm" onClick={submit}>{t(confirm)}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  /* HR-09, as a panel of Doc control. It no longer owns a screen: the
     merged module carries the rail, the page head and the campus
     strip, and this is the part that is about REQUESTS — what has
     been asked of whom, and what is late. */
  /* the queue names a person; the register knows where they work */
  function campusOfName(name) {
    const hit = STAFF.filter(function (x) { return x.name === name; })[0];
    return hit ? hit.campus : null;
  }

  function DocRequests({ onNavigate, onGoVerify, toVerifyCount, campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [lane, setLane] = useState("awaiting");
    const [docType, setDocType] = useState("all");
    const [dept, setDept] = useState("all");
    const [selected, setSelected] = useState(DOC_QUEUE.find((d) => d.lane === "awaiting").id);
    const [opened, setOpened] = useState({});
    /* what the flows change: a due date moved, a request withdrawn, a
       reminder sent, and a batch of new asks. The table reads these,
       so an action is visible in the row it acted on. */
    const [dueMap, setDueMap] = useState({});
    const [cancelled, setCancelled] = useState({});
    const [reminded, setReminded] = useState({});
    const [bulk, setBulk] = useState(false);
    const [act, setAct] = useState(null);
    const [banner, setBanner] = useState(null);
    const TABS_ID = "hr3-dq-lanes";

    function dueOf(item) { return dueMap[item.id] || item.due; }
    function openAct(kind, item) { setBanner(null); setAct({ kind: kind, item: item }); }

    const counts = useMemo(() => {
      const out = { toVerify: 0, awaiting: 0, overdue: 0, rejected: 0 };
      DOC_QUEUE.filter((d) => inCampus(campus, campusOfName(d.employee)))
        .forEach((d) => { out[d.lane] += 1; });
      return out;
    }, [campus]);

    /* the "to verify" lane is gone from here: checking a response is
       its own tab, with the document open beside the decision */

    const laneItems = useMemo(
      () => DOC_QUEUE.filter((d) => d.lane === lane && inCampus(campus, campusOfName(d.employee)))
        .filter((d) => !cancelled[d.id])
        .filter((d) => docType === "all" || d.typeKey === "hr3.dq.type." + docType)
        .filter((d) => dept === "all" || d.dept === dept),
      // eslint-disable-next-line
      [lane, docType, dept, cancelled, campus]
    );

    const selectedItem = DOC_QUEUE.find((d) => d.id === selected) || null;

    const TAB_ITEMS = [
      { key: "awaiting", label: t("hr3.dq.lane.awaiting") + " (" + counts.awaiting + ")" },
      { key: "overdue", label: t("hr3.dq.lane.overdue") + " (" + counts.overdue + ")" },
      { key: "rejected", label: t("hr3.dq.lane.rejected") + " (" + counts.rejected + ")" },
    ];

    const EMPTY_BODY = {
      toVerify: "hr3.dq.reg.empty.bodyToVerify",
      awaiting: "hr3.dq.reg.empty.bodyAwaiting",
      overdue: "hr3.dq.reg.empty.bodyOverdue",
      rejected: "hr3.dq.reg.empty.bodyRejected",
    };

    const columns = [
      { key: "requester", label: t("hr3.dq.col.requester") },
      { key: "employee", label: t("hr3.dq.col.employee") },
      { key: "doc", label: t("hr3.dq.col.docType") },
      { key: "age", label: t("hr3.dq.col.age"), mono: true },
      { key: "due", label: t("hr3.dq.col.due"), mono: true },
      { key: "act", label: t("hr3.dq.col.actions"), align: "right", width: 56 },
    ];

    function rowMenu(item) {
      if (item.lane === "rejected") {
        return [{ key: "reRequest", icon: "document", label: t("hr3.dq.menu.reRequest"), onSelect: () => setSelected(item.id) }];
      }
      const dueSoon = item.lane === "awaiting" && item.age < 5;
      const already = !!reminded[item.id];
      return [
        {
          key: "remind", icon: "mail", label: t("hr3.dq.menu.remind"),
          disabled: dueSoon || already,
          reason: already ? t("hr3.dq.menu.remindAlready") : dueSoon ? t("hr3.dq.menu.remindDisabled") : undefined,
          onSelect: () => openAct("remind", item),
        },
        { key: "extend", icon: "clock", label: t("hr3.dq.menu.extend"), onSelect: () => openAct("extend", item) },
        { key: "cancel", icon: "arrow", label: t("hr3.dq.menu.cancel"), tone: "danger", onSelect: () => openAct("cancel", item) },
      ];
    }

    const rows = laneItems.map((d) => ({
      id: d.id,
      highlight: d.id === selected,
      cells: {
        requester: t(d.requesterKey),
        employee: (
          <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Avatar name={d.employee} size={28} />
            <span style={{ minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{d.employee}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{d.dept}</span>
            </span>
          </span>
        ),
        doc: (
          <span>
            <button
              type="button"
              onClick={() => setSelected(d.id)}
              aria-pressed={d.id === selected}
              aria-label={t("hr3.dq.select", { doc: t(d.typeKey), name: d.employee })}
              style={ty("small", {
                background: "none", border: "none", textAlign: "left", color: c.ink, fontWeight: 700,
                cursor: "pointer", padding: "5px 2px", margin: "-5px -2px",
              })}
            >
              {t(d.typeKey)}
            </button>
            {d.batch ? <span style={{ display: "block", marginTop: 3 }}><Chip bg={c.sunken} fg={c.inkMuted}>{t("hr3.dq.batch")}</Chip></span> : null}
          </span>
        ),
        age: d.age + " " + t("hr3.dq.days"),
        due: (
          <span>
            <span style={G3.fig("sm", { color: c.ink })}>{dmy(t, dueOf(d))}</span>
            {dueMap[d.id] ? (
              <span style={ty("caption", { display: "block", color: c.lateText, marginTop: 2 })}>
                {t("hr3.dq.ext.moved", { date: dmy(t, d.due) })}
              </span>
            ) : null}
            {reminded[d.id] ? (
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t("hr3.dq.rem.sentToday")}</span>
            ) : null}
          </span>
        ),
        act: (
          <span style={{ display: "flex", justifyContent: "flex-end" }}>
            <ActionMenu ariaLabel={t("hr3.st.menu.aria", { name: d.employee })} items={rowMenu(d)} />
          </span>
        ),
      },
    }));

    return (
      <div>

        {banner ? (
          <div style={{ marginBottom: 16 }}>
            <Card fill={c.presentTint} border={c.border} pad={14}>
              <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{banner}</span>
            </Card>
          </div>
        ) : null}

        {/* the mix first. Three lane tabs told a reader how many were
            in each only if they read three labels; the bar says it in
            one. Responses waiting on a decision are the NEXT tab, so
            the band hands them over in its foot rather than drawing a
            second, worse version of that queue here. */}
        <Band
          head={t("hr3.dq.band")}
          action={
            <Button kind="primary" size="sm" iconLeft="document"
              onClick={() => { setBanner(null); setBulk(true); }}>{t("hr3.dq.raiseBulk")}</Button>
          }
          metrics={[
            { k: "out", label: t("hr3.dq.m.out"), value: num(counts.awaiting + counts.overdue + counts.rejected), n: counts.awaiting + counts.overdue + counts.rejected,
              total: true, note: t("hr3.dq.m.outNote"), tone: c.chartBlue },
            { k: "awaiting", label: t("hr3.dq.m.awaiting"), value: num(counts.awaiting), n: counts.awaiting,
              note: t("hr3.dq.m.awaitingNote"), tone: c.chartAmber },
            { k: "overdue", label: t("hr3.dq.m.overdue"), value: num(counts.overdue), n: counts.overdue,
              note: t("hr3.dq.m.overdueNote"), tone: c.chartRed, warn: counts.overdue > 0 },
            /* keyed to the lane it IS, so the figure and the slice are one */
            { k: "rejected", label: t("hr3.dq.m.back"), value: num(counts.rejected), n: counts.rejected,
              note: t("hr3.dq.m.backNote"), tone: c.chartTeal },
            { k: "verify", label: t("hr3.dq.m.verify"), value: num(toVerifyCount || 0), n: toVerifyCount || 0,
              note: t("hr3.dq.m.verifyNote"), tone: c.chartPurple },
          ]}
          foot={
            toVerifyCount ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <StatusMark role="late" word={t("hr3.dq.handoff", { n: num(toVerifyCount) })} count={toVerifyCount} />
                <LinkButton onClick={onGoVerify}>{t("hr3.dq.handoffGo")}</LinkButton>
              </span>
            ) : t("hr3.dq.m.clear")
          }
        />

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
          <FilterField label={t("hr3.dq.filter.docType")}>
            <Select
              id="hr3-dq-type" value={docType} onChange={setDocType}
              options={[{ value: "all", label: t("hr3.dq.filter.docTypeAll") }].concat(DOC_TYPES.map((k) => ({ value: k, label: t("hr3.dq.type." + k) })))}
            />
          </FilterField>
          <FilterField label={t("hr3.dq.filter.dept")}>
            <Select
              id="hr3-dq-dept" value={dept} onChange={setDept}
              options={[{ value: "all", label: t("hr3.dq.filter.deptAll") }].concat(DEPARTMENTS.map((d) => ({ value: d, label: d })))}
            />
          </FilterField>
        </div>

        <Tabs items={TAB_ITEMS} active={lane} onChange={(k) => { setLane(k); const first = DOC_QUEUE.find((d) => d.lane === k); if (first) setSelected(first.id); }} ariaLabel={t("hr3.dq.tabsAria")} idBase={TABS_ID} />

        <TabPanel idBase={TABS_ID} tabKey={lane} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {rows.length === 0 ? (
                <Card>
                  <EmptyState head={t("hr3.dq.reg.empty.head")} body={t(EMPTY_BODY[lane])} compact />
                </Card>
              ) : (
                <Register
                  columns={columns}
                  rows={rows}
                  /* the row IS the request: clicking it shows that one
                     beside the table, which is what the panel is for */
                  onSelect={(id) => setSelected(id)}
                  footer={<span style={ty("caption", { color: c.inkFaint, maxWidth: 720 })}>{t("hr3.dq.reg.footNote")}</span>}
                />
              )}
            </div>
            <div style={{ flex: "0 0 " + L.colNarrow + "px", minWidth: 0 }}>
              <DocDetail
                item={selectedItem && !cancelled[selectedItem.id] ? Object.assign({}, selectedItem, { due: dueOf(selectedItem) }) : null}
                opened={opened}
                onOpen={(id) => setOpened((c2) => Object.assign({}, c2, { [id]: true }))}
                onAct={openAct}
              />
            </div>
          </div>
        </TabPanel>

        {bulk ? (
          <BulkRaiseDialog
            onClose={() => setBulk(false)}
            onDone={(n, type, due) => {
              setBulk(false);
              setBanner(t("hr3.dq.bulk.done", { n: num(n), doc: t("hr3.dq.type." + type), date: dmy(t, fromIso(due)) }));
            }}
          />
        ) : null}

        {act ? (
          <RequestActDialog
            kind={act.kind}
            item={Object.assign({}, act.item, { due: dueOf(act.item) })}
            onClose={() => setAct(null)}
            onDone={(value) => {
              if (act.kind === "extend") {
                setDueMap(Object.assign({}, dueMap, { [act.item.id]: value }));
                setBanner(t("hr3.dq.ext.done", { name: act.item.employee, date: dmy(t, value) }));
              } else if (act.kind === "remind") {
                setReminded(Object.assign({}, reminded, { [act.item.id]: true }));
                setBanner(t("hr3.dq.rem.done", { name: act.item.employee }));
              } else {
                setCancelled(Object.assign({}, cancelled, { [act.item.id]: true }));
                setBanner(t("hr3.dq.can.done", { name: act.item.employee, doc: t(act.item.typeKey) }));
              }
              setAct(null);
            }}
          />
        ) : null}
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  /* THE REGISTER, FOR THE SCREENS THAT MAY ONLY READ IT. The
     principal's and the director's Staff list (PR-05 / DR-05) draw
     these rows rather than keeping a second copy, so a name, a
     designation or a resignation cannot read one way here and another
     way there. They get the LIST and nothing else: the identifiers,
     the documents and the edit rights stay on this screen. */
  window.NaveyaStaff = { LIST: STAFF, TOTAL: TOTAL_IN_SCOPE };

  window.Pages3.HRHome = HRHome;
  window.Pages3.HRStaff = HRStaff;
  /* Doc control mounts this; there is no standalone HRDocs screen any
     more (the module is assembled in hr-compliance.jsx). */
  window.Pages3.DocRequests = DocRequests;
})();
