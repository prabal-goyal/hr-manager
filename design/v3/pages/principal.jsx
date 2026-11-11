/* @jsxRuntime classic */
/* ============================================================
   Naveya — Campus Principal · window.Pages3.{PRHome,PRAttendance,PRLeave}

   PR-01 Campus home            — "how is my campus running today?"
   PR-02 Campus attendance board — "where are the attendance problems on my campus?"
   PR-03 Leave escalations & campus leave — "which leave decisions have escalated to me?"

   Spec: docs/screen-inventory.md §5 Campus Principal (PR-01/02/03),
   cross-referenced against M8 §Workflow (leave + escalation), M9
   §Business rules (attendance, device outage distinct from absence),
   M15 §Business rules (campus dashboards), M7 §6.6 (Term blackout),
   M2 §Acceptance ("a Principal scoped to Campus A cannot read Campus
   B data"). PII: docs/ui-compliance-requirements.md O3 (salary/bank
   never shown to a Principal), O7 (campus-only scope, no group
   totals), §8-F14/A27 (leave TYPE and REASON are health-adjacent and
   must never appear on a SHARED roster/calendar — they appear ONLY on
   the escalation DECISION surface itself, which is DH-02/PR-03's own
   "must contain" list, not a passive board), A25 (police-verification
   OUTCOME/detail stays HR-restricted; the Principal sees the compliance
   COUNT and WHO is overdue, never the verification file).

   The Principal is also an Employee (own attendance/leave/payslips/
   documents/profile stay on the rail via the self.* permission set —
   see kit.jsx ROLE_PERMISSIONS.principal) and holds Dept-Head-shaped
   powers campus-wide BY ESCALATION ONLY: PR-01/02 read the campus in
   aggregate and drill into a single department read-only (routes to
   the real dhAttendance key — DH-03 — already wired in v3.html, so the
   drill-in lights up the moment that file lands); PR-03 decides ONLY
   items that have escalated past a Dept Head, never routine
   department-level approvals (DH-02's own queue — see the "Must NOT
   contain" line on both PR-01 and PR-03: no duplicated destinations).

   Three routes referenced here are real inventory codes with no page
   built yet in this canvas: PR-04 (requisition approvals), PR-05
   (appraisal moderation), HR-25 (renewal queue), GA-11 (device-health
   board), HR-12 (child-safety board). Rather than a dead click, each
   is passed straight to onNavigate as its own code STRING (e.g.
   "PR-04") — v3.html's ROUTES lookup does not have that key, so the
   shared NotBuilt fallback renders and — because NotBuilt's label
   falls back to the raw screen key when it is not in CODES either —
   the placeholder honestly reads "PR-04 — not built yet". No file in
   scope for this dispatch is edited to make this work; it is the
   generic gap-is-visible mechanism v3.html's own header comment
   describes, used here for routes this file's action tables demand
   but do not own.

   "Today" for all three screens is Tuesday, 11 August 2026 —
   TODAY_ISO, matching screens.jsx / attendance.jsx / leave.jsx /
   depthead.jsx / payroll.jsx / accountant.jsx, so v3.html's role
   switcher never jumps the clock five weeks when a reviewer flips
   from another role to Principal (re-anchored 2026-09-03; this file
   originally sat alone at 15 Sep 2026 — see agent memory). The Term-1
   examinations blackout (14–19 Sep, `lv.win.exam1` / `lv.win.exam1d`,
   REUSED verbatim from leave.jsx's own blackout calendar rather than
   inventing a second one — cross-screen mock constants) is therefore
   an UPCOMING constraint from 11 Aug, not a live one — PR-01/PR-03
   say so truthfully ("starts in {n} days", computed from TODAY_ISO,
   never a hand-typed number). PR-01's own non-happy path and PR-03's
   reason for existing both want the live-blackout copy reachable for
   review, and it still is: BlackoutBanner carries a
   demo-only "preview" Switch (local component state, in the spirit of
   groupadmin.jsx's scenario Segmented for its loading/error/first-run
   states) that swaps the BANNER TEXT between upcoming/live without
   ever moving TODAY_ISO. The override flow's justification
   requirement is unaffected by the toggle either way — it triggers
   off an escalation's own `cause === "blackout"` plus its leave dates
   falling inside the window, never off what "today" is.

   Composed only from window.G3 / window.UI3. kit.jsx, tokens.jsx,
   screens.jsx and every other file under pages/ are unedited. Local
   promotion candidates (kit.jsx is out of scope for this dispatch):
   IconMark (a TitleMark that takes a raw bg/fg pair instead of one of
   the six named iconTones — needed for danger/overdue marks TitleMark
   cannot express), Chain (an approval trail — a 3rd independent build
   of the exact shape as documents.jsx's Trail and leave.jsx's
   TrailStep; promote it next kit touch), TextArea + FilterPills
   (already 2x-built in leave.jsx; this is the 3rd).
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, WelcomeBand, Card, CardHeader, Button, LinkButton,
    Chip, StatusMark, Meter, Figure, Icon, num, Select, Switch,
    Tabs, TabPanel, ActionMenu, EmptyState, SegmentDonut, Tip, Band, Split, StackBar, MetricCell, MetricStrip,
  } = UI;
  /* Register (the shared table primitive) and inr (money formatting)
     are deliberately NOT used: every table here needs richer per-cell
     content than Register's column model gives (matching documents.jsx
     /leave.jsx's own divergence), and this screen never renders a
     rupee figure at all — a Principal does not see salary (O3). */

  /* ============================================================
     STRINGS — pr.* is this file's own namespace. Weekday/month full
     names and the Term-1 exam blackout window are REUSED from
     screens.jsx (att.d0..d6) and leave.jsx (lv.mon.*, lv.win.exam1 /
     lv.win.exam1d) — safe because this file's <script> tag loads last,
     after every other page file, in v3.html's fixed load order.
     ============================================================ */
  addStrings({
    en: {
      /* ---- shared chrome ---- */
      "pr.school": "Sunrise Public School",
      "pr.campus": "Indiranagar Campus",
      "pr.identity": "Principal · Sunrise Public School, Indiranagar Campus",
      "pr.today": "Tuesday, 11 August 2026",

      "pr.blackout.upcoming": "Exam blackout \u2014 {name}, {dates} \u00b7 starts in {days} days. Leave inside it needs your override.",
      "pr.blackout.live": "Exam blackout active — {name}, {dates}. Leave inside this window needs your override, not just the department head's.",
      "pr.blackout.chipSoon": "{n} escalated requests fall inside this window",
      "pr.demo.previewLive": "Preview: treat as live",

      /* ---- PR-01 Campus home ---- */
      "pr.home.kicker": "Campus home",
      "pr.home.greeting": "Good morning, Radhika",
      "pr.home.meta": "{today} · {school}, {campus}",
      "pr.home.figureLabel": "Confirmed present today",
      "pr.home.figureNote": "{awaiting} attendance records still awaiting device sync — not counted as absent",

      "pr.dept.title": "Today's shape, by department",
      "pr.dept.sub": "Present · absent · late · on leave, as of this morning",
      "pr.dept.viewAll": "Open the campus attendance board",

      "pr.leave.title": "Staff on leave today",
      "pr.leave.sub": "Absence only — never the leave type or reason on a shared list",
      "pr.leave.count": "{n} staff",
      "pr.leave.markWord": "On leave",
      "pr.leave.empty.head": "No one is on leave today",
      "pr.leave.empty.body": "Every member of staff is expected on campus.",

      "pr.queue.title": "Your decision queues",
      "pr.queue.sub": "Escalated to you — routine department approvals stay with the department head",
      "pr.queue.leave": "Leave escalations",
      "pr.queue.leaveSub": "Past a department head, a blackout, or a vacant post",
      "pr.queue.req": "Requisition approvals",
      "pr.queue.reqSub": "New positions awaiting budget sign-off",
      "pr.queue.renew": "Renewal decisions",
      "pr.queue.renewSub": "Fixed-term contracts due for a call",
      "pr.queue.appraisal": "Appraisal moderation",
      "pr.queue.appraisalSub": "Department recommendations awaiting your moderation",
      "pr.queue.count": "{n} pending",
      "pr.queue.overdue": "{n} overdue",
      "pr.queue.empty": "Nothing waiting",
      "pr.queue.open": "Open",

      "pr.head.title": "Headcount by category",
      "pr.head.teaching": "Teaching",
      "pr.head.support": "Non-teaching & support",
      "pr.head.total": "{n} staff on campus",


      "pr.switch.note": "Switch campus is hidden \u2014 this account holds one campus. It appears only for a Principal holding two or more.",

      /* ---- PR-02 Campus attendance board ---- */
      "pr.att.pageTitle": "Campus attendance board",

      "pr.att.range.day": "Day",
      "pr.att.range.week": "Week",
      "pr.att.range.month": "Month",
      "pr.att.rangeAria": "Choose a range",

      "pr.outage.banner": "Device outage \u2014 East gate scanner, Primary block \u00b7 since 07:40. {n} punches await sync and are NOT counted as absent.",
      "pr.outage.action": "Open the device-health view",

      "pr.shape.title": "Today's shape",
      "pr.shape.sub": "Whole campus, all departments",
      "pr.shape.present": "Present",
      "pr.shape.absent": "Absent",
      "pr.shape.late": "Late",
      "pr.shape.leave": "On leave",
      "pr.shape.awaiting": "Awaiting sync",

      "pr.hot.title": "Hot spots",
      "pr.hot.sub": "Highest absence + late rate today",
      "pr.hot.rate": "{pct}% of {n}",
      "pr.hot.empty.head": "No hot spots today",
      "pr.hot.empty.body": "No department is running noticeably higher absence or lateness.",

      "pr.shift.title": "Shift coverage",
      "pr.shift.sub": "Transport · hostel · security",
      "pr.shift.covered": "{n} of {total} shifts covered",
      "pr.shift.gap": "{n} shift uncovered",
      "pr.shift.gapPlural": "{n} shifts uncovered",
      "pr.shift.ok": "Fully covered",


      "pr.matrix.title": "Department × status, today",
      "pr.matrix.sub": "Click a department to open its attendance, read-only",
      "pr.matrix.col.dept": "Department",
      "pr.matrix.col.present": "Present",
      "pr.matrix.col.absent": "Absent",
      "pr.matrix.col.late": "Late",
      "pr.matrix.col.leave": "On leave",
      "pr.matrix.col.exceptions": "Exceptions",
      "pr.matrix.exceptionsN": "{n}",
      "pr.matrix.noExceptions": "—",
      "pr.matrix.viewDept": "View {dept} (read-only)",
      "pr.matrix.awaitingCell": "{n} awaiting sync",
      "pr.matrix.footNote": "Exceptions route to each department head's own attendance screen for regularization — a Principal does not decide them here.",

      "pr.filter.dept": "Department",
      "pr.filter.deptAll": "All departments",
      "pr.filter.category": "Category",
      "pr.filter.categoryAll": "All categories",
      "pr.filter.categoryTeaching": "Teaching",
      "pr.filter.categorySupport": "Non-teaching & support",
      "pr.filter.exceptionsOnly": "Exceptions only",
      "pr.filter.note": "Shift is a filter on Shift coverage above — at department-grain the matrix cannot slice by an individual shift.",

      "pr.export": "Export campus register",
      "pr.export.sub": "CSV/PDF · current month · recorded against your account",
      "pr.export.done": "Exported — {n} records, {scope}, {month}. This download is recorded in the audit log.",

      "pr.matrix.empty.head": "No departments match this filter",
      "pr.matrix.empty.body": "Clear a filter to see the campus again.",

      /* ---- PR-03 Leave escalations & campus leave ---- */
      "pr.lv.pageTitle": "Leave escalations",
      "pr.lv2.pageTitle": "Leave",
      "pr.lv2.tabMine": "Waiting on you",
      "pr.lv2.tabCampus": "The whole campus",
      "pr.lv2.mineTitle": "Your decisions",
      "pr.lv2.band": "Leave across the campus",
      "pr.lv2.bandSub": "What stops with you, what has gone to the director, what is settled \u2014 and how much of the campus is about to be away.",
      "pr.lv2.s.mine": "With you",
      "pr.lv2.s.up": "With the director",
      "pr.lv2.s.done": "Settled",
      "pr.lv2.m.mine": "Waiting on you",
      "pr.lv2.m.mineNote": "Three days or more; under that a head of department decides.",
      "pr.lv2.m.days": "Days asked for",
      "pr.lv2.m.daysNote": "Across what is waiting on you.",
      "pr.lv2.m.campus": "On the campus",
      "pr.lv2.m.campusNote": "Every request raised here this session.",
      "pr.lv2.m.long": "Long leave",
      "pr.lv2.m.longNote": "Fifteen days or more — the director signs these after you.",
      "pr.lv2.mineSub": "{n} waiting · oldest first",
      "pr.lv2.campusTitle": "Leave on this campus",
      "pr.lv2.campusSub": "{shown} of {total} · undecided first",
      "pr.lv2.mineEmpty": "Nothing is waiting on you",
      "pr.lv2.mineEmptyBody": "One- and two-day leave stays with the heads. What reaches you is three days up, and any head's own leave.",
      "pr.lv2.stateAll": "Every state",
      "pr.lv2.dTitle": "Request {id}",
      "pr.lv2.why": "It reached you because of its length. {rule}",
      "pr.lv2.whyShort": "Its length. {rule}",
      "pr.lv2.whyHeadShort": "She heads {dept} — a head never approves her own",
      "pr.lv2.unpaid": "{n} days have no balance behind them",
      "pr.lv2.whyHead": "She heads {dept}, so her own leave starts with you — a head never approves herself.",
      "pr.lv2.coverageNone": "Nobody else on this campus is away in those days.",
      "pr.lv2.blockLocked": "{mon} payroll is already closed. These days go through arrears, not through an approval here.",
      "pr.lv2.calSub": "Everyone away on this campus between today and the end of September",
      "pr.lv2.calRange": "11 August – 30 September 2026",
      "pr.lv2.calNote": "Approved leave and leave still climbing the chain, together — planning cover needs both.",
      "pr.lv2.toastClose": "Dismiss",

      "pr.lv.pageNote": "Requests that have escalated past a department head — routine approvals stay with the head and never reach this screen.",
      "pr.lv.sla": "Principal-level decisions are expected within 48 hours of escalation.",

      "pr.lv.tab.escalated": "Escalated decisions",
      "pr.lv.tab.calendar": "Campus leave calendar",

      "pr.lv.f.pending": "Escalated + pending",
      "pr.lv.f.overdue": "Overdue only",
      "pr.lv.f.all": "All",
      "pr.lv.f.aria": "Filter escalations by status",

      "pr.lv.col.who": "Applicant",
      "pr.lv.col.type": "Type",
      "pr.lv.col.dates": "Dates",
      "pr.lv.col.cause": "Escalated because",
      "pr.lv.col.aged": "Escalated",
      "pr.lv.col.actions": "Actions",

      "pr.lv.aged.days": "{n}d ago",
      "pr.lv.aged.overdue": "Overdue by {n}d",

      "pr.lv.cause.deptHead": "Applicant is a department head",
      "pr.lv.cause.threshold": "Longer than 3 days",
      "pr.lv.cause.blackout": "Falls inside an exam blackout",
      "pr.lv.cause.lop": "Balance exhausted — Loss of Pay",
      "pr.lv.cause.vacant": "Head of department post is vacant",

      "pr.lv.menu.open": "Open decision",
      "pr.lv.menu.reassign": "Reassign the approver",
      "pr.lv.menu.reassignDisabled": "Only offered when the department head post is vacant and the decision is still pending",
      "pr.lv.menu.aria": "Actions for {id}",

      "pr.lv.status.pending": "Awaiting your decision",
      "pr.lv.status.approved": "Approved",
      "pr.lv.status.rejected": "Not approved",

      "pr.lv.d.pick": "Select an escalation",
      "pr.lv.d.pickBody": "Choose a row on the left to see its chain, coverage and your decision.",
      "pr.lv.d.reason": "Why they need it",
      "pr.lv.d.cause": "Why this reached you",
      "pr.lv.d.retro": "Retrospective request — dates have already passed",
      "pr.lv.d.chain": "Chain, so far",
      "pr.lv.d.coverage": "Coverage that week",
      "pr.lv.d.lopNote": "If approved, {n} {unit} will be recorded as Loss of Pay — no rupee figure is shown here; payroll computes it.",
      "pr.lv.d.dayNote": "{n} {unit} · {type}",
      "pr.lv.d.day": "day",
      "pr.lv.d.days": "days",
      "pr.lv.d.appendOnly": "Every decision here is append-only and visible on the employee's own record.",

      "pr.lv.act.approve": "Approve",
      "pr.lv.act.reject": "Reject",
      "pr.lv.act.noteLabel": "Note (optional)",
      "pr.lv.act.notePh": "Visible to the employee and the department head.",
      "pr.lv.act.reasonLabel": "Reason (required)",
      "pr.lv.act.reasonPh": "The employee will see this.",
      "pr.lv.act.errReason": "A reason is required before you can reject this request.",
      "pr.lv.act.approvedBy": "Approved by Radhika Menon · {date}",
      "pr.lv.act.rejectedBy": "Not approved by Radhika Menon · {date}",
      "pr.lv.act.selfNote": "You applied for this yourself, so it cannot be decided here — HR completes it (M2 self-approval rule).",

      "pr.lv.bo.banner": "This request falls inside {name} ({dates}). Approving it needs a justification, recorded against the term.",
      "pr.lv.bo.label": "Override justification (required)",
      "pr.lv.bo.ph": "Why this override is warranted.",
      "pr.lv.bo.err": "A justification is required to override the blackout.",
      "pr.lv.bo.cta": "Override & approve",
      "pr.lv.bo.rate": "3 overrides this term \u00b7 about 1 in 8 blackout requests. If it keeps climbing, the policy needs a look, not another override.",

      "pr.lv.reassign.label": "Assign to",
      "pr.lv.reassign.ph": "Choose a covering head",
      "pr.lv.reassign.cta": "Reassign",
      "pr.lv.reassign.done": "Reassigned to {who} · {date}",
      "pr.lv.reassign.note": "The post is currently vacant, so this decision can go to a covering head instead of you.",

      "pr.lv.empty.head": "Nothing matches this filter",
      "pr.lv.empty.body": "Try Overdue only or All, or clear the department filter.",

      "pr.lv.cal.title": "Who else is away",
      "pr.lv.cal.sub": "Approved leave, campus-wide — absence only, never the type",
      "pr.lv.cal.range": "This week · 10–16 Aug 2026",
      "pr.lv.col.name": "Staff",
      "pr.lv.col.dept": "Department",
      "pr.lv.col.dates2": "Dates",
      "pr.lv.col.status2": "Status",
    },
  });

  /* ============================================================
     MOCK DATA — one shared "today" (TODAY_ISO, 11 Aug 2026) across
     all three screens, so PR-01's headline figure, PR-02's matrix and
     PR-03's escalation aging all reconcile with each other
     (cross-screen mock constants — see agent memory). The Term-1 exam
     blackout stays 14–19 Sep, the same window leave.jsx owns — from
     11 Aug that is an UPCOMING window, not a live one; see
     BlackoutBanner below for how the live copy stays reachable.
     ============================================================ */
  const TODAY_ISO = "2026-08-11";
  /* start of the Term-1 blackout leave.jsx already owns (lv.win.exam1
     / lv.win.exam1d text is reused verbatim; this raw ISO is needed
     only for the "starts in {n} days" arithmetic below). */
  const BLACKOUT_START_ISO = "2026-09-14";

  function daysBetween(aIso, bIso) {
    function parse(s) { const p = s.split("-"); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
    return Math.round((parse(bIso) - parse(aIso)) / 86400000);
  }

  /* today's roll lives in v3/campus.jsx — one source for PR-01, PR-02
     and the director's campus screen, so a name on one board and a
     number on another cannot drift apart */
  const CD = window.CampusData;
  const MY_CAMPUS_KEY = "lf.c.main";
  const DEPARTMENTS = CD.departmentsOf(MY_CAMPUS_KEY);
  const TOTALS = CD.totalsOf(MY_CAMPUS_KEY);
  const TREND = CD.absenceSeriesOf(MY_CAMPUS_KEY);
  function exceptionsOf(deptKey) { return CD.exceptionsOf(MY_CAMPUS_KEY, deptKey); }
  const ON_LEAVE_TODAY = CD.campus(MY_CAMPUS_KEY).exceptions.filter((x) => x.status === "leave");

  const TEACHING_TOTAL = CD.teachingOf(MY_CAMPUS_KEY);
  /* the words for the roll this file draws. The DATA moved to
     v3/campus.jsx; these names and labels stay here until the
     director's screen needs them too. */
  addStrings({
    en: {
      "pr.n.suresh": "Suresh Kulkarni", "pr.n.ritu": "Ritu Malhotra", "pr.n.devesh": "Devesh Pillai",
      "pr.n.ayesha": "Ayesha Siddiqui", "pr.n.lata": "Lata Menon", "pr.n.rameshY": "Ramesh Yadav",
      "pr.n.gopal": "Gopal Krishnan",
      "pr1.today.title": "The campus this week",
      "pr1.band.in": "In school",
      "pr2.band": "The campus today",
      "pr1.band.leave": "On leave",
      "pr1.band.absent": "Unexplained",
      "pr1.band.awaiting": "Not read yet",
      "pr1.today.inLabel": "In school today",
      "pr1.today.inNote": "of {total} on the roll · {pct}%",
      "pr1.today.awayLabel": "Away today",
      "pr1.today.awayNote": "{leave} on leave · {absent} unexplained",
      "pr1.today.pendingLabel": "No reading yet",
      "pr1.today.pendingNote": "readers still to report — counted neither way",
      "pr1.today.weekLabel": "Five-day average",
      "pr1.today.weekNote": "{pct}% of the roll, across the last five school days",
      "pr1.today.weekTitle": "Not in school, last five school days",
      "pr1.today.outage": "Readers down",
      "pr1.today.plusUnread": "+{n} unread",
      "pr1.today.awayN": "{n} away",
      "pr1.today.barAria": "{day}: {n} of {total} not in school",
      "pr1.today.thinTitle": "Thinner than the campus today",
      "pr1.thin.head": "Five days, and where it is thin",
      "pr1.thin.weekWhy": "read left to right \u2014 the doubt extends the bar",
      "pr1.thin.thinWhy": "{n} of {total} departments under the campus average",
      "pr1.thin.thinClear": "every department at or above it",
      "pr1.thin.foot": "Under the average is not a problem by itself \u2014 it is where to look first if cover has to be found.",
      "pr1.today.thinNone": "Every department is at or above the campus average today.",
      "pr1.today.thinWhy": "{out} of {total} away today",
      "pr1.today.ofN": "of {n}",
      "pr1.today.outageWhy": "{n} records still awaiting device sync — nobody here is marked absent for it",

      "pr1.esc.title": "Leave approvals",

      "pr1.done.title": "What you have decided",
      "pr1.done.sub": "Your last few signatures, newest first",
      "pr1.done.on": "you decided {date}",
      "pr1.done.climbing": "Gone to the director",
      "pr1.done.all": "Open the escalation queue",
      "pr1.done.noneHead": "Nothing decided yet",
      "pr1.done.noneBody": "Requests you approve or decline appear here.",
      /* --- the people the campus board names --- */
      "pr.n.nikhil": "Nikhil Barua", "pr.n.imran": "Imran Qureshi", "pr.n.farida": "Farida Sheikh",
      "pr.g.tgtMaths": "TGT, Mathematics", "pr.g.pgtEnglish": "PGT, English",
      "pr.g.tgtEnglish": "TGT, English", "pr.g.tgtSocial": "TGT, Social Science",
      "pr.g.tgtHindi": "TGT, Hindi", "pr.g.tgtSanskrit": "TGT, Sanskrit",
      "pr.g.prt": "PRT, Primary Wing", "pr.g.office": "Office administrator", "pr.g.support": "Support staff",

      /* --- PR-02, rebuilt --- */
      "pr2.strip.presentNote": "{pct}% of the campus roll",
      "pr2.strip.lateNote": "after the ten-minute grace",
      "pr2.strip.absentNote": "no punch, no leave on record",
      "pr2.strip.leaveNote": "approved leave",
      "pr2.strip.awaitingNote": "readers still to report",

      "pr.att.exOnly": "Only departments with a problem",
      "pr.matrix.foot": "Exceptions route to each department head's own attendance screen for regularisation — a principal does not decide them here.",
      "pr.trend.title": "Absence rate today",
      "pr2.trend.of": "{n} unexplained absences of {readable} records read today",
      "pr2.trend.avgLabel": "Ten-day average",
      "pr2.trend.range": "between {lo}% and {hi}% over the ten days",
      "pr2.trend.avgMark": "average",
      "pr2.trend.aria": "Absence rate across {n} school days: {today}% today against a {avg}% average",
      "pr2.trend.above": "{n} points above the ten-day average",
      "pr2.trend.below": "{n} points below the ten-day average",
      "pr2.trend.first": "ten school days ago",
      "pr2.trend.last": "today",
      "pr2.legend.title": "What the colours mean",
      "pr2.board.title": "Departments today",
      "pr2.board.sub": "Pick one to see who is missing from it",
      "pr2.board.line": "{present} of {total} in school",
      "pr2.board.outageLine": "{n} of the wing has no reading yet — the gate reader is down",
      "pr2.board.out": "not in",

      "pr2.people.sub": "{present} of {total} in school",
      "pr2.people.outage": "The east gate reader has been down since 07:40. {n} punches have not synced \u2014 nobody here is counted absent.",
      "pr2.people.noneHead": "Everyone is in",
      "pr2.people.noneBody": "Nobody in {dept} is absent, late or on leave today.",
      "pr2.people.foot": "Read-only. A correction to any of these days is the department head's to approve, on her own attendance screen.",
      "pr2.people.open": "Open {dept}'s register",
      "pr1.head.identity": "Principal · Sunrise Public School, Indiranagar Campus",
      "pr1.cel.title": "Birthdays and anniversaries",
      "pr1.cel.sub": "Across the campus, over the next month",


      "pr1.esc.sub": "{n} leave requests past a department head",
      "pr1.esc.more": "and {n} more in the queue",
      "pr1.esc.open": "Open the escalation queue",
      "pr1.esc.noneSub": "Nothing is held up with you",
      "pr1.esc.noneHead": "Your queue is clear",
      "pr1.esc.noneBody": "Every department is deciding its own leave right now.",
      "pr1.esc.blackout": "{name} ({dates}) starts in {n} days. Leave inside that window needs your override, not just the department head's.",

      "pr.dept.science": "Science", "pr.dept.math": "Mathematics", "pr.dept.english": "English",
      "pr.dept.socialSci": "Social Science", "pr.dept.languages": "Languages",
      "pr.dept.primary": "Primary Wing", "pr.dept.admin": "Admin & support",
    },
  });

  const SUPPORT_TOTAL = DEPARTMENTS.filter((d) => d.category === "support").reduce((s, d) => s + d.total, 0);

  const SHIFT_COVERAGE = [
    { key: "transport", label: "pr.shift.transport", staff: 6, covered: 6 },
    { key: "security", label: "pr.shift.security", staff: 4, covered: 3 },
    { key: "hostel", label: "pr.shift.hostel", staff: 5, covered: 5 },
  ];
  addStrings({
    en: { "pr.shift.transport": "Transport", "pr.shift.security": "Security", "pr.shift.hostel": "Hostel" },
  });

  const QUEUES = [
    { key: "leave", icon: "leave", count: null, overdue: 0, route: "prLeave" },
    { key: "req", icon: "briefcase", count: 2, overdue: 0, route: "PR-04" },
    { key: "renew", icon: "document", count: 0, overdue: 0, route: "HR-25" },
    { key: "appraisal", icon: "staff", count: 1, overdue: 0, route: "PR-05" },
  ];


  /* ---- escalations (PR-03) — five live causes, one already-decided
     item kept OUT of the default filter to demonstrate "already
     actioned downstream (stale)". Reasons/types are shown here
     because THIS is the decision surface (DH-02's own must-contain
     list), never a passive roster. */
  /* dates are stored ISO and formatted through fmtDate(t, iso) at
     render time (reusing lv.mon.* month names) so a Hindi reader never
     hits a stray "14 Sep 2026" — the exact leak this file's own memory
     lesson warns about (i18n demo content leaks). Reasons are i18n
     keys, not literal English, for the same reason. */
  /* agedDays is the honest gap between escalatedOn and TODAY_ISO
     (11 Aug); overdue follows the same 48-hour SLA pr.lv.sla states
     — agedDays > 2 while still pending. Nothing here is applied for,
     approved, or escalated after TODAY_ISO; only the leave dates
     themselves (`from`/`to`) may sit in the future — that is normal,
     it is what a leave REQUEST is. */
  /* The queue lives in window.LeaveFlow — one list behind DH-02,
     PR-03, DR-02 and HR-28. The reason strings below stay here
     because this is where they were written; the store points at
     them by key. */

  addStrings({
    en: {
      "pr.reason.anjali": "Family wedding out of town.",
      "pr.reason.meera": "Family function out of state; travel adds two extra days.",
      "pr.reason.rahul": "Pre-planned family travel, booked before the exam schedule was finalised.",
      "pr.reason.priya": "Recovering from a minor surgery; balance is already used up this year.",
      "pr.reason.farah": "Sudden family matter.",
      "pr.reason.devika": "Personal work.",
      "pr.chain.applied": "{name} applied · {dates}",
      "pr.chain.approved": "{name} approved",
      "pr.lv.coverage.overlap": "{name} ({dept}) is also away {dates}.",
    },
  });

  function fmtDate(t, iso) {
    const p = iso.split("-");
    const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return d.getDate() + " " + t("lv.mon." + (d.getMonth() + 1)) + " " + d.getFullYear();
  }

  const TYPE_LABEL = { CL: "lv.type.cl", SL: "lv.type.sl" };
  const TYPE_ROLE = { CL: "ltCasual", SL: "ltSick" };
  const CAUSE_KEY = {
    deptHead: "pr.lv.cause.deptHead", threshold: "pr.lv.cause.threshold",
    blackout: "pr.lv.cause.blackout", lop: "pr.lv.cause.lop", vacant: "pr.lv.cause.vacant",
  };

  /* the same LR-0296 / LR-0255 dates the escalation register carries
     — one still-pending request and one already-decided one, both
     visible on the campus calendar (cross-screen mock constants). */
  /* ============================================================
     SHARED LOCAL PRIMITIVES
     ============================================================ */

  /* IconMark — PROMOTION CANDIDATE: TitleMark restricted to six named
     iconTones (accent/present/brass/leave/off/info); this file needs a
     seventh (danger) for compliance/overdue marks TitleMark cannot
     express without editing kit.jsx, which is out of scope. */
  function IconMark({ icon, bg, fg, size }) {
    const s = size || 32;
    return (
      <span
        aria-hidden="true"
        style={{
          width: s, height: s, borderRadius: G3.r.sm, flex: "0 0 auto",
          background: bg, color: fg, display: "inline-flex",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon name={icon} size={Math.round(s * 0.55)} />
      </span>
    );
  }

  function TextArea({ id, value, onChange, placeholder, invalid, rows }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <textarea
        id={id} name={id} value={value} rows={rows || 3} placeholder={placeholder}
        aria-invalid={invalid ? "true" : undefined}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        style={ty("body", {
          width: "100%", resize: "vertical",
          border: "1px solid " + (invalid ? c.danger : c.borderStrong),
          borderRadius: G3.r.md, background: c.surface, color: c.ink,
          padding: "12px 15px", outlineOffset: 1,
        })}
      />
    );
  }

  /* the append-only chain — a third independent build of documents.jsx
     Trail / leave.jsx TrailStep; promote on next kit touch. */
  function Chain({ items }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: i < items.length - 1 ? 14 : 0 }}>
            <span aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, alignSelf: "stretch" }}>
              <span style={{ width: 8, height: 8, borderRadius: G3.r.pill, background: c[it.tone || "accent"] || c.accent, marginTop: 5, flexShrink: 0 }} />
              {i < items.length - 1 ? <span style={{ width: 1, flex: 1, background: c.border, marginTop: 4 }} /> : null}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{it.text}</span>
              {it.date ? <span style={G3.fig("xs", { display: "block", color: c.inkFaint, marginTop: 2 })}>{it.date}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  function TopStrip({ crumbKey }) {
    const { t, ty } = useLang();
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
        <div style={ty("small", { color: c.inkMuted })}>
          <span style={{ color: c.ink, fontWeight: 700 }}>{t(crumbKey)}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
          <span>{t("pr.school")}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
          <span>{t("pr.campus")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
        </div>
      </div>
    );
  }

  /* prominent — used on PR-01 (compact) and PR-03 (full). TODAY_ISO
     (11 Aug) sits BEFORE `lv.win.exam1d` (14–19 Sep), so by default
     this reads as an upcoming constraint, computed honestly via
     daysBetween(TODAY_ISO, BLACKOUT_START_ISO) — never a hand-typed
     "34". The local `preview` Switch is a demo-only affordance (never
     wired to any other state, never changes TODAY_ISO) that swaps the
     copy to the live-blackout wording, so that non-happy path stays
     reviewable without lying about what day it is. */
  function BlackoutBanner({ compact }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [preview, setPreview] = useState(false);
    const daysUntil = daysBetween(TODAY_ISO, BLACKOUT_START_ISO);
    return (
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: 12,
          background: c.brassSoft, border: "1px solid " + c.brassBorder, borderRadius: G3.r.lg,
          padding: compact ? "12px 16px" : "16px 20px", marginBottom: G3.layout.gap,
        }}
      >
        <span aria-hidden="true" style={{ color: c.brass, display: "flex", marginTop: 1, flexShrink: 0 }}><Icon name="alert" size={17} /></span>
        <p role="status" style={ty("small", { margin: 0, flex: 1, minWidth: 0, color: c.ink, fontWeight: 600, maxWidth: 720 })}>
          {preview
            ? t("pr.blackout.live", { name: t("lv.win.exam1"), dates: t("lv.win.exam1d") })
            : t("pr.blackout.upcoming", { name: t("lv.win.exam1"), dates: t("lv.win.exam1d"), days: num(daysUntil) })}
        </p>
        <span style={{ flexShrink: 0 }}>
          <Switch id={"pr-blackout-preview-" + (compact ? "home" : "leave")} checked={preview} onChange={setPreview} label={t("pr.demo.previewLive")} />
        </span>
      </div>
    );
  }

  function deptLabel(t, key) {
    const d = DEPARTMENTS.find((x) => x.key === key);
    return d ? t(d.label) : key;
  }

  /* ============================================================
     PR-01 — CAMPUS HOME
     ============================================================ */

  /* A head of department reads a roll: seven people, who is in. A
     principal cannot — 118 staff is not a list, and the individual
     name is her department heads' business, not hers. What she carries
     is the campus as a NUMBER OVER TIME and the places it is thinning:

       · is the campus staffed today, and how confidently (17 records
         still unsynced means "unknown", never "absent");
       · is attendance holding across the week, or slipping;
       · which departments are running below the campus itself;
       · how many of her people are away, today and across the week.

     Nothing here asks her to arrange a substitute: no screen in the
     product does that, and a dashboard that names a gap it cannot
     close is a dashboard that nags.
     ============================================================ */

  /* the last five school days, ending today. Today's figure is the
     CONFIRMED one — the 17 unsynced records are drawn as the doubt
     they are, not counted either way. */
  /* "Wed 5", "Tue 11" — the bar labels; the full date stays in the
     bar's accessible name */
  function weekdayShort(t, iso) {
    const p = iso.split("-");
    const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return t("att.d" + d.getDay()) + " " + d.getDate();
  }

  const WEEK = [
    { iso: "2026-08-05", inSchool: 113, pending: 0 },
    { iso: "2026-08-06", inSchool: 109, pending: 0 },
    { iso: "2026-08-07", inSchool: 112, pending: 0 },
    { iso: "2026-08-10", inSchool: 108, pending: 0 },
    { iso: "2026-08-11", inSchool: TOTALS.present + TOTALS.late, pending: TOTALS.awaiting },
  ];
  const WEEK_AVG = Math.round(WEEK.reduce((s, d) => s + d.inSchool, 0) / WEEK.length);

  function CampusTodayCard({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    const inSchool = TOTALS.present + TOTALS.late;
    const share = (n) => Math.round((n / TOTALS.total) * 100);

    /* a department is "thin" when a larger share of it is missing than
       of the campus as a whole — that is the comparison a principal
       actually makes, and it needs no substitute-assignment feature to
       be useful */
    const campusOut = (TOTALS.absent + TOTALS.leave) / TOTALS.total;
    const thin = DEPARTMENTS
      .map((d) => ({ d: d, out: (d.absent + d.leave) / d.total, n: d.absent + d.leave }))
      .filter((x) => x.d.outage || x.out > campusOut + 0.001)
      .sort((a, b) => (b.d.outage ? 1 : 0) - (a.d.outage ? 1 : 0) || b.out - a.out)
      .slice(0, 4);

    const facts = [
      {
        key: "in", label: t("pr1.today.inLabel"), value: num(inSchool), n: inSchool,
        note: t("pr1.today.inNote", { total: num(TOTALS.total), pct: num(share(inSchool)) }),
        bar: c.presentChart || c.present,
      },
      {
        key: "away", label: t("pr1.today.awayLabel"), value: num(TOTALS.leave + TOTALS.absent), n: TOTALS.leave + TOTALS.absent,
        note: t("pr1.today.awayNote", { leave: num(TOTALS.leave), absent: num(TOTALS.absent) }),
        bar: c.absentChart || c.absent,
      },
      {
        key: "pending", label: t("pr1.today.pendingLabel"), value: num(TOTALS.awaiting), n: TOTALS.awaiting,
        note: t("pr1.today.pendingNote"), bar: c.chartAmber,
      },
      {
        /* an average OF the three above it, over five days -- not a
           fourth part of today */
        key: "week", label: t("pr1.today.weekLabel"), value: num(WEEK_AVG), n: WEEK_AVG, noBar: true,
        note: t("pr1.today.weekNote", { pct: num(share(WEEK_AVG)) }), bar: c.chartBlue,
      },
    ];

    const out = (d) => TOTALS.total - d.inSchool - d.pending;
    const top = Math.max.apply(null, WEEK.map((x) => out(x) + x.pending));

    /* TWO BOXES, BECAUSE THERE ARE TWO QUESTIONS. This card answers how
       much of the campus is in this morning — the mix, four figures,
       and the roll they are measured against. The five days behind
       today and the departments under the average answer a different
       one: where to look, and for how long it has been like this. So
       they leave this border and take a box built from different parts
       (no bar, no meters, a vertical rule between the halves, a tint on
       the half that wants her). */
    return (
      <React.Fragment>
      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={ty("h2", { margin: 0, color: c.ink })}>{t("pr1.today.title")}</h2>
            <p style={ty("caption", { margin: "6px 0 0", color: c.inkFaint })}>{t("pr.today")} · {t("pr.campus")}</p>
          </div>
          <LinkButton onClick={() => onNavigate("prAttendance")}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              {t("pr.dept.viewAll")}
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="arrow" size={14} /></span>
            </span>
          </LinkButton>
        </div>

        {/* 1 · the mix, then the figures. "Not read yet" is neither in
               nor out, so it gets a segment of its own rather than
               being folded into one of the two. */}
        <MetricStrip
          pad={0} style={{ marginBottom: 22 }}
          metrics={facts.map(function (f) {
            return { k: f.key, label: f.label, value: f.value, n: f.n, bar: f.noBar ? false : undefined, tone: f.bar, note: f.note };
          })}
        />

        {/* who is on the roll at all — the denominator behind every
            figure above */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule, display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <span style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{t("pr.head.total", { n: num(TOTALS.total) })}</span>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
            <Figure value={num(TEACHING_TOTAL)} size="md" weight={700} color={c.ink} />
            <span style={ty("caption", { color: c.inkMuted })}>{t("pr.head.teaching")}</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
            <Figure value={num(SUPPORT_TOTAL)} size="md" weight={700} color={c.ink} />
            <span style={ty("caption", { color: c.inkMuted })}>{t("pr.head.support")}</span>
          </span>
          <span style={ty("caption", { color: c.inkFaint, flex: "1 1 220px" })}>
            {t("pr.home.figureNote", { awaiting: num(TOTALS.awaiting) })}
          </span>
        </div>
      </Card>

      <div style={{ marginTop: G3.layout.gap }}>
        <Split
          head={t("pr1.thin.head")}
          foot={t("pr1.thin.foot")}
          sides={[
            {
              key: "week", label: t("pr1.today.weekTitle"),
              verdict: t("pr1.thin.weekWhy"),
              children: (
                <React.Fragment>
                  {/* five days as ROWS, not columns: at most 27 of 118 are
                      ever out, so a vertical chart is nine-tenths empty air.
                      Read left to right, the doubt EXTENDS the bar — which is
                      exactly what 17 unread records mean: it could be 10, it
                      could be 27. */}
                  <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                    {WEEK.map(function (d) {
                      const today = d.iso === TODAY_ISO;
                      const n = out(d);
                      return (
                        <div key={d.iso} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={ty("caption", {
                            flex: "0 0 62px", color: today ? c.ink : c.inkFaint,
                            fontWeight: today ? 700 : 500, whiteSpace: "nowrap",
                          })}>
                            {weekdayShort(t, d.iso)}
                          </span>
                          <span
                            role="img"
                            aria-label={t("pr1.today.barAria", { day: fmtDate(t, d.iso), n: num(n), total: num(TOTALS.total) })}
                            style={{ flex: 1, minWidth: 0, height: 12, background: c.gutter, borderRadius: G3.r.pill, display: "flex", overflow: "hidden" }}
                          >
                            <span style={{ width: (n / top) * 100 + "%", background: today ? c.accent : c.inkFaint }} />
                            {d.pending ? <span style={{ width: (d.pending / top) * 100 + "%", background: c.missingChart || c.missing, opacity: 0.45 }} /> : null}
                          </span>
                          <span style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "baseline", gap: 5, whiteSpace: "nowrap" }}>
                            <Figure value={num(n)} size="sm" weight={700} color={today ? c.ink : c.inkMuted} />
                            {d.pending ? <span style={ty("caption", { color: c.inkFaint })}>{t("pr1.today.plusUnread", { n: num(d.pending) })}</span> : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              ),
            },
            {
              key: "thin", label: t("pr1.today.thinTitle"), count: thin.length,
              urgent: thin.length > 0, tone: c.lateText, tint: c.lateTint,
              verdict: thin.length
                ? t("pr1.thin.thinWhy", { n: num(thin.length), total: num(DEPARTMENTS.length) })
                : t("pr1.thin.thinClear"),
              empty: t("pr1.today.thinNone"),
              children: thin.length
                ? thin.map(function (x, i) {
                  return (
                    <button
                      key={x.d.key} type="button" onClick={function () { onNavigate("prAttendance"); }}
                      aria-label={t("pr.matrix.viewDept", { dept: t(x.d.label) })}
                      className="nv3-tile"
                      style={{
                        display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                        border: "none", background: "transparent", cursor: "pointer",
                        /* the row is clickable, so the hover fill spans the
                           column edge to edge rather than stopping at the
                           text — the padding is given back by the margin */
                        width: "calc(100% + 40px)", margin: "0 -20px",
                        padding: "12px 20px", borderTop: i ? "1px solid " + c.rule : "none",
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(x.d.label)}</span>
                        <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>
                          {x.d.outage
                            ? t("pr1.today.outageWhy", { n: num(x.d.awaiting) })
                            : t("pr1.today.thinWhy", { out: num(x.n), total: num(x.d.total) })}
                        </span>
                      </span>
                      <StatusMark
                        role={x.d.outage ? "missing" : "leave"}
                        glyph={x.d.outage ? "scan" : undefined}
                        word={x.d.outage ? t("pr1.today.outage") : t("pr1.today.awayN", { n: num(x.n) })}
                      />
                    </button>
                  );
                })
                : null,
            },
          ]}
        />
      </div>
      </React.Fragment>
    );
  }

  function LeaveTodayCard() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!ON_LEAVE_TODAY.length) {
      return (
        <Card icon="leave" iconTone="leave" title={t("pr.leave.title")} sub={t("pr.leave.sub")}>
          <EmptyState head={t("pr.leave.empty.head")} body={t("pr.leave.empty.body")} compact />
        </Card>
      );
    }
    return (
      <Card
        icon="leave" iconTone="leave" title={t("pr.leave.title")} sub={t("pr.leave.sub")}
        action={<Chip bg={c.sunken} fg={c.inkMuted} mono>{t("pr.leave.count", { n: num(ON_LEAVE_TODAY.length) })}</Chip>}
      >
        <div>
          {ON_LEAVE_TODAY.map((p, i) => (
            <div
              key={p.key}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0",
                borderBottom: i < ON_LEAVE_TODAY.length - 1 ? "1px dashed " + c.border : "none",
              }}
            >
              <span>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(p.key)}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint })}>{deptLabel(t, p.deptKey)}</span>
              </span>
              <StatusMark role="leave" word={t("pr.leave.markWord")} />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  function QueueRow({ q, last, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div
        style={{
          display: "flex", alignItems: "center", gap: 14, padding: "13px 0",
          borderBottom: last ? "none" : "1px dashed " + c.border,
        }}
      >
        <IconMark icon={q.icon} bg={c.accentSoft} fg={c.action} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("pr.queue." + q.key)}</div>
          <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{t("pr.queue." + q.key + "Sub")}</div>
        </div>
        {q.count > 0 ? (
          <button
            type="button"
            onClick={() => onNavigate(q.route)}
            aria-label={t("pr.queue.open") + " · " + t("pr.queue." + q.key)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
              background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0,
            }}
          >
            <span style={G3.fig("md", { fontWeight: 700, color: c.ink })}>{num(q.count)}</span>
            {q.overdue ? (
              <span style={ty("caption", { color: c.dangerText, fontWeight: 700 })}>{t("pr.queue.overdue", { n: q.overdue })}</span>
            ) : (
              <span style={ty("caption", { color: c.action, fontWeight: 700 })}>{t("pr.queue.open")}</span>
            )}
          </button>
        ) : (
          <span style={ty("caption", { color: c.inkFaint, fontWeight: 600, flexShrink: 0 })}>{t("pr.queue.empty")}</span>
        )}
      </div>
    );
  }

  /* what has escalated to her, as the requests themselves — a tile
     saying "9" gives the size of the job, not the reason to open it */
  function EscalatedCard({ reqs, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const LF = window.LeaveFlow;
    const mine = reqs.filter((r) => LF.isWaitingOn(r, "principal"));
    /* four, then a count: enough to judge whether to open the queue
       now, not the queue itself */
    const shown = mine.slice(0, 4);

    return (
      <Card
        icon="leave" iconTone="leave"
        title={t("pr1.esc.title")}
        sub={mine.length ? t("pr1.esc.sub", { n: num(mine.length) }) : t("pr1.esc.noneSub")}
      >
        {mine.length === 0 ? (
          <EmptyState compact head={t("pr1.esc.noneHead")} body={t("pr1.esc.noneBody")} />
        ) : (
          <React.Fragment>
            <div>
              {shown.map((r, i) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(r.person.nameKey)}</div>
                    <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>
                      {LF.fmtRange(t, r.from, r.to)} · {LF.daysWord(t, r.days, r.half)} · {LF.subLine(t, r.person, false)}
                    </div>
                  </div>
                  <LF.FlagChips req={r} />
                </div>
              ))}
            </div>
            {mine.length > shown.length ? (
              <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0" })}>{t("pr1.esc.more", { n: num(mine.length - shown.length) })}</p>
            ) : null}
          </React.Fragment>
        )}
        <div style={{ marginTop: 16 }}>
          <Button kind="primary" full iconRight="arrow" onClick={() => onNavigate("prLeave")}>{t("pr1.esc.open")}</Button>
        </div>
        <p style={ty("caption", { color: c.inkFaint, margin: "14px 0 0", paddingTop: 12, borderTop: "1px solid " + c.border })}>
          {t("pr1.esc.blackout", { name: t("lv.win.exam1"), dates: t("lv.win.exam1d"), n: num(daysBetween(TODAY_ISO, BLACKOUT_START_ISO)) })}
        </p>
      </Card>
    );
  }

  /* What she has already signed. The approvals card above is the
     queue; this is the trail — same store, so a decision taken on
     PR-03 appears here the moment it is made, and "approved" is never
     confused with "settled" (a request she cleared may still be
     climbing to the director). */
  function DecidedCard({ reqs, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const LF = window.LeaveFlow;

    const mine = reqs
      .filter((r) => (r.stages || []).some((s) => s.role === "principal" && s.outcome))
      .map((r) => ({ req: r, stage: r.stages.filter((s) => s.role === "principal" && s.outcome)[0] }))
      .sort((a, b) => (a.stage.onISO < b.stage.onISO ? 1 : -1))
      .slice(0, 3);

    return (
      <Card icon="document" iconTone="info" title={t("pr1.done.title")} sub={t("pr1.done.sub")}>
        {mine.length === 0 ? (
          <EmptyState compact head={t("pr1.done.noneHead")} body={t("pr1.done.noneBody")} />
        ) : (
          <div>
            {mine.map((x, i) => {
              const settled = LF.statusOf(x.req);
              return (
                <div key={x.req.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(x.req.person.nameKey)}</span>
                    <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>
                      {LF.fmtRange(t, x.req.from, x.req.to)} · {t("pr1.done.on", { date: LF.fmtDate(t, x.stage.onISO) })}
                    </span>
                  </span>
                  {x.stage.outcome === "rejected"
                    ? <StatusMark role="absent" glyph="alert" word={t("lf.st.rejected")} />
                    : settled === "pending"
                      ? <StatusMark role="late" word={t("pr1.done.climbing")} />
                      : <StatusMark role="present" word={t("lf.st.approved")} />}
                </div>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <LinkButton onClick={() => onNavigate("prLeave")}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              {t("pr1.done.all")}
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="arrow" size={14} /></span>
            </span>
          </LinkButton>
        </div>
      </Card>
    );
  }

  function PRHome({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    /* read at render, so a decision taken on PR-03 shows here at once */
    const reqs = window.LeaveFlow.useRequests();
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "principal"} active="prHome" onNavigate={onNavigate} initials="RM" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip crumbKey="nav.prHome" />

            {/* Switch-campus is deliberately absent: this mock principal
                holds exactly one campus RoleAssignment, and the spec's
                own default for that case is "hidden", not a
                single-option picker (see pr.switch.note, kept as a code
                comment rather than dead UI on screen). The exam-blackout
                banner and its preview toggle have left this screen too:
                the window is an UPCOMING constraint on her own decisions,
                so it is a line at the foot of the card that carries those
                decisions, not a strip across the top of the page. The
                live-blackout preview still lives on PR-03, where the
                override actually happens. */}

            {/* head: who she is, which campus, what day — the dark
                welcome slab with its one big figure is gone; the figure
                it carried is the middle of the campus donut below, where
                the rest of the roll is standing next to it */}
            <div style={{ marginBottom: L.gap }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("pr.home.kicker")}</h1>
            </div>

            <CampusTodayCard onNavigate={onNavigate} />

            {/* three columns of two, paired so they finish near each
                other: what has escalated to her and the other queues ·
                who is away and the school calendar · the compliance she
                is answerable for and the campus headcount */}
            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", marginTop: L.gap }}>
              {/* what she has to decide */}
              <div style={{ flex: "1.15 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                <EscalatedCard reqs={reqs} onNavigate={onNavigate} />
              </div>
              {/* the campus's absences: who is away today, and what she
                  has already signed */}
              <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                <LeaveTodayCard />
                <DecidedCard reqs={reqs} onNavigate={onNavigate} />
              </div>
              {/* the dates ahead: the school's, then her staff's */}
              <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                {window.NaveyaHolidays && window.NaveyaHolidays.Card
                  ? React.createElement(window.NaveyaHolidays.Card, { onOpen: () => onNavigate("prAttendance") })
                  : null}
                {/* the campus's birthdays and work anniversaries — the
                    same card both other homes mount, campus-wide here
                    (day and month only, never an age) */}
                {window.LeaveFlow.CelebrationsCard
                  ? React.createElement(window.LeaveFlow.CelebrationsCard, { excludeId: "radhika", title: t("pr1.cel.title"), sub: t("pr1.cel.sub") })
                  : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     PR-02 — CAMPUS ATTENDANCE BOARD
     ============================================================ */

  function RangeToggle({ value, onChange }) {
    const { c } = useTheme();
    const { t } = useLang();
    const OPTS = [{ key: "day", label: t("pr.att.range.day") }, { key: "week", label: t("pr.att.range.week") }, { key: "month", label: t("pr.att.range.month") }];
    return (
      <div role="group" aria-label={t("pr.att.rangeAria")} style={{ display: "flex", gap: 6 }}>
        {OPTS.map((o) => {
          const on = o.key === value;
          return (
            <button
              key={o.key} type="button" aria-pressed={on ? "true" : "false"} onClick={() => onChange(o.key)}
              style={{
                border: "1px solid " + (on ? c.accent : c.border), borderRadius: G3.r.pill,
                padding: "6px 14px", background: on ? c.accent : c.surface, color: on ? c.onAccent : c.ink,
                fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 600,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  function OutageBanner({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const primary = DEPARTMENTS.find((d) => d.outage);
    return (
      <div
        role="alert"
        style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          background: c.missingTint, border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg,
          padding: "16px 20px", marginBottom: G3.layout.gap,
        }}
      >
        <IconMark icon="alert" bg={c.surface} fg={c.missingText} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={ty("small", { margin: 0, color: c.ink, fontWeight: 600, maxWidth: 760 })}>
            {t("pr.outage.banner", { n: num(primary ? primary.awaiting : 0) })}
          </p>
        </div>
        <Button kind="secondary" size="sm" onClick={() => onNavigate("GA-11")}>{t("pr.outage.action")}</Button>
      </div>
    );
  }

  const ATT_ROLE = { present: "present", late: "late", absent: "absent", leave: "leave", awaiting: "missing" };
  const ROLL_KEYS = ["present", "late", "absent", "leave", "awaiting"];

  /* ten days as a LINE, with the average drawn as the thing to be
     above or below and today as the only marked point. An SVG, so it
     scales with the column instead of being a fixed row of blocks. */
  function Sparkline({ series, avg }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const W = 100, H = 34, pad = 3;
    const lo = Math.min.apply(null, series.concat([avg]));
    const hi = Math.max.apply(null, series.concat([avg]));
    const span = hi - lo || 1;
    const x = (i) => (i / (series.length - 1)) * W;
    const y = (v) => pad + (1 - (v - lo) / span) * (H - pad * 2);
    const line = series.map((v, i) => x(i) + "," + y(v)).join(" ");
    const area = "0," + H + " " + line + " " + W + "," + H;
    const last = series.length - 1;

    const lastY = ((y(series[last]) / H) * 100).toFixed(2) + "%";
    return (
      <div>
        <div style={{ position: "relative" }}>
        <svg
          viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none"
          style={{ width: "100%", height: 62, display: "block", overflow: "visible" }}
          role="img"
          aria-label={t("pr2.trend.aria", { today: series[last].toFixed(1), avg: avg.toFixed(1), n: num(series.length) })}
        >
          <polygon points={area} fill={c.accent} opacity="0.10" />
          <line x1="0" y1={y(avg)} x2={W} y2={y(avg)} stroke={c.inkFaint} strokeWidth="0.5" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <polyline points={line} fill="none" stroke={c.accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <span
          aria-hidden="true"
          style={{
            position: "absolute", left: "100%", top: lastY, width: 9, height: 9,
            marginLeft: -5, marginTop: -4.5, borderRadius: 9,
            background: c.surface, border: "2px solid " + c.accent,
          }}
        />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={ty("caption", { color: c.inkFaint })}>{t("pr2.trend.first")}</span>
          <span style={ty("caption", { color: c.inkFaint })}>
            <span aria-hidden="true" style={{ display: "inline-block", width: 14, borderTop: "1px dashed " + c.inkFaint, marginInlineEnd: 6, transform: "translateY(-3px)" }} />
            {t("pr2.trend.avgMark")}
          </span>
          <span style={ty("caption", { color: c.ink, fontWeight: 700 })}>{t("pr2.trend.last")}</span>
        </div>
      </div>
    );
  }

  /* the five colours, named on the page — a legend, not a tooltip,
     because colour coding nobody can see without hovering is colour
     coding that is not there */
  function RollLegend() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ display: "flex", gap: "8px 16px", flexWrap: "wrap" }}>
        {ROLL_KEYS.map((k) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span aria-hidden="true" style={{
              width: 10, height: 10, borderRadius: 3, flexShrink: 0,
              background: c[ATT_ROLE[k] + "Chart"] || c[ATT_ROLE[k]],
              opacity: k === "awaiting" ? 0.5 : 1,
            }} />
            <span style={ty("caption", { color: c.inkMuted })}>{t("pr.shape." + k)}</span>
          </span>
        ))}
      </div>
    );
  }

  /* one department's roll: the bar, and the same numbers in words for
     anyone who hovers, focuses or uses a screen reader */
  function RollBar({ d, width }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const parts = ROLL_KEYS.map((k) => ({ key: k, n: d[k] || 0 })).filter((x) => x.n > 0);
    const label = t(d.label) + ": " + parts.map((x) => num(x.n) + " " + t("pr.shape." + x.key)).join(", ");
    return (
      <Tip
        label={label}
        width={230}
        body={
          <React.Fragment>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 7 })}>{t(d.label)}</div>
            {parts.map((x) => (
              <div key={x.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                <span aria-hidden="true" style={{
                  width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                  background: c[ATT_ROLE[x.key] + "Chart"] || c[ATT_ROLE[x.key]],
                  opacity: x.key === "awaiting" ? 0.5 : 1,
                }} />
                <Figure value={num(x.n)} size="sm" weight={700} color={c.ink} />
                <span style={ty("caption", { color: c.inkMuted })}>{t("pr.shape." + x.key)}</span>
              </div>
            ))}
          </React.Fragment>
        }
      >
        <span aria-hidden="true" style={{ width: width || 210, height: 12, borderRadius: G3.r.pill, background: c.gutter, display: "flex", overflow: "hidden" }}>
          {ROLL_KEYS.map((k) => (
            (d[k] || 0) > 0
              ? <span key={k} style={{
                  width: ((d[k] || 0) / d.total) * 100 + "%",
                  background: c[ATT_ROLE[k] + "Chart"] || c[ATT_ROLE[k]],
                  opacity: k === "awaiting" ? 0.5 : 1,
                }} />
              : null
          ))}
        </span>
      </Tip>
    );
  }

  /* the day in one line of figures, with the ten-day absence trend
     beside it — same subject, so they stop being two cards */
  function DayStrip({ range }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    const facts = [
      { key: "present", value: TOTALS.present, note: t("pr2.strip.presentNote", { pct: num(Math.round((TOTALS.present / TOTALS.total) * 100)) }), strong: true },
      { key: "late", value: TOTALS.late, note: t("pr2.strip.lateNote") },
      { key: "absent", value: TOTALS.absent, note: t("pr2.strip.absentNote") },
      { key: "leave", value: TOTALS.leave, note: t("pr2.strip.leaveNote") },
      { key: "awaiting", value: TOTALS.awaiting, note: t("pr2.strip.awaitingNote") },
    ];
    const today = TREND[TREND.length - 1];
    const avg = TREND.reduce((s, v) => s + v, 0) / TREND.length;
    const lo = Math.min.apply(null, TREND);
    const hi = Math.max.apply(null, TREND);

    return (
      <Card>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          marginBottom: 20,
        }}>
          {facts.map(function (f, i) {
            const roll = facts.reduce(function (a, x) { return a + x.value; }, 0);
            return (
              <MetricCell
                key={f.key} first={i === 0} label={t("pr.shape." + f.key)} value={num(f.value)}
               
                tone={c[ATT_ROLE[f.key] + "Chart"] || c[ATT_ROLE[f.key]]}
                warn={f.key === "absent" && f.value > 0}
                note={f.note}
              />
            );
          })}
        </div>

        {/* THE ABSENCE RATE. Ten equal grey blocks told the reader
            nothing about the shape of the fortnight — same width, same
            colour, no baseline they could be measured against. A line
            has a direction; the average has a line of its own to be
            above or below; today is the one point that is marked. */}
        <div style={{ paddingTop: 18, borderTop: "1px solid " + c.rule, display: "flex", gap: 30, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 auto", minWidth: 150 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("pr.trend.title")}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
              <Figure value={today.toFixed(1) + "%"} size="lg" weight={700} color={c.ink} />
              <span style={ty("caption", { color: today > avg ? c.absentText : c.presentText, fontWeight: 700 })}>
                {t(today > avg ? "pr2.trend.above" : "pr2.trend.below", { n: Math.abs(today - avg).toFixed(1) })}
              </span>
            </div>
            <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>{t("pr2.trend.of", { n: num(TOTALS.absent), readable: num(TOTALS.total - TOTALS.awaiting) })}</div>
          </div>

          <div style={{ flex: "1 1 320px", minWidth: 260 }}>
            <Sparkline series={TREND} avg={avg} />
          </div>

          <div style={{ flex: "0 0 auto", minWidth: 150 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("pr2.trend.avgLabel")}</div>
            <Figure value={avg.toFixed(1) + "%"} size="md" weight={700} color={c.inkMuted} />
            <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>{t("pr2.trend.range", { lo: lo.toFixed(1), hi: hi.toFixed(1) })}</div>
          </div>
        </div>
      </Card>
    );
  }

  /* the campus as a list of departments, and the department as a list
     of PEOPLE. Selecting a row on the left fills the panel on the
     right — the principal never has to leave the board to learn who is
     missing, and she still cannot decide anything here (regularisation
     belongs to the head of department, PR-02's own "must not contain"). */
  function BoardCard({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [openKey, setOpenKey] = useState(DEPARTMENTS[0].key);
    const [exOnly, setExOnly] = useState(false);
    const open = DEPARTMENTS.filter((d) => d.key === openKey)[0];
    const rows = exOnly
      ? DEPARTMENTS.filter((d) => d.absent + d.late + d.awaiting > 0)
      : DEPARTMENTS;

    /* the unread records are NOT counted out — that is the whole point
       of the outage line beside them */
    function shareOut(d) { return (d.absent + d.leave) / (d.total - d.awaiting); }

    return (
      <div style={{ display: "flex", gap: G3.layout.gap, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Card
          style={{ flex: "1.55 1 620px", minWidth: 0 }}
          title={t("pr2.board.title")} sub={t("pr2.board.sub")}
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Switch id="pr2-ex" checked={exOnly} onChange={setExOnly} label={t("pr.att.exOnly")} />
            </div>
          }
        >
          {/* the colour key sits with the bars it decodes, not two
              cards away under a number about something else */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", paddingBottom: 14, marginBottom: 4, borderBottom: "1px solid " + c.rule }}>
            <span style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{t("pr2.legend.title")}</span>
            <RollLegend />
          </div>
          <div>
            {rows.map((d, i) => {
              const on = d.key === openKey;
              const inSchool = d.present + d.late;
              return (
                <button
                  key={d.key} type="button" onClick={() => setOpenKey(d.key)}
                  aria-pressed={on ? "true" : "false"}
                  aria-label={t("pr.matrix.viewDept", { dept: t(d.label) })}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
                    border: "none", borderRadius: G3.r.md, cursor: "pointer",
                    background: on ? c.sel : "transparent",
                    padding: "12px 12px", marginInline: -12, width: "calc(100% + 24px)",
                    borderTop: i ? "1px solid " + c.rule : "none",
                  }}
                >
                  <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                    <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(d.label)}</span>
                    <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>
                      {d.outage
                        ? t("pr2.board.outageLine", { n: num(d.awaiting) })
                        : t("pr2.board.line", { present: num(inSchool), total: num(d.total) })}
                    </span>
                  </span>

                  {/* the roll as one bar: what is in, what is out, what
                      has not reported — proportions, not five chips.
                      Hover or focus it for the same numbers in words. */}
                  <span style={{ flex: "0 0 auto" }}><RollBar d={d} width={260} /></span>

                  <span style={{ flex: "0 0 62px", textAlign: "right" }}>
                    <Figure value={num(Math.round(shareOut(d) * 100)) + "%"} size="sm" weight={700} color={shareOut(d) > 0.15 ? c.absentText : c.inkMuted} />
                    <span style={ty("caption", { display: "block", color: c.inkFaint })}>{t("pr2.board.out")}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p style={ty("caption", { color: c.inkFaint, margin: "16px 0 0", paddingTop: 12, borderTop: "1px solid " + c.border })}>{t("pr.matrix.foot")}</p>
        </Card>

        <Card
          style={{ flex: "1 1 340px", minWidth: 0 }}
          icon="staff" iconTone="accent"
          title={t(open.label)}
          sub={t("pr2.people.sub", { present: num(open.present + open.late), total: num(open.total) })}
        >
          {open.outage ? (
            <p style={ty("small", { margin: "0 0 14px", padding: "11px 13px", borderRadius: G3.r.md, background: c.missingTint, color: c.missingText, fontWeight: 600 })}>
              {t("pr2.people.outage", { n: num(open.awaiting) })}
            </p>
          ) : null}

          {exceptionsOf(open.key).length === 0 ? (
            <EmptyState compact head={t("pr2.people.noneHead")} body={t("pr2.people.noneBody", { dept: t(open.label) })} />
          ) : (
            <div>
              {exceptionsOf(open.key).map((x, i) => (
                <div key={x.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(x.key)}</span>
                    <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t(x.desig)}</span>
                  </span>
                  {x.inTime ? <span style={G3.fig("sm", { color: c.ink, fontWeight: 600 })}>{x.inTime}</span> : null}
                  <StatusMark role={ATT_ROLE[x.status]} word={t("pr.shape." + x.status)} />
                </div>
              ))}
            </div>
          )}

          <p style={ty("caption", { color: c.inkFaint, margin: "16px 0 0", paddingTop: 12, borderTop: "1px solid " + c.border })}>{t("pr2.people.foot")}</p>
          <div style={{ marginTop: 10 }}>
            <LinkButton onClick={() => onNavigate("dhAttendance")}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                {t("pr2.people.open", { dept: t(open.label) })}
                <span aria-hidden="true" style={{ display: "flex" }}><Icon name="arrow" size={14} /></span>
              </span>
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  function PRAttendance({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [range, setRange] = useState("day");
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "principal"} active="prAttendance" onNavigate={onNavigate} initials="RM" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip crumbKey="nav.prAttendance" />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
              <div>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("pr.att.pageTitle")}</h1>
              </div>
              <RangeToggle value={range} onChange={setRange} />
            </div>

            {/* the outage leads — it is drawn BEFORE the day's counts,
                per PR-02's own non-happy path: a wrong-looking absence
                number destroys trust faster than a slow one */}
            <OutageBanner onNavigate={onNavigate} />

            <DayStrip range={range} />

            <div style={{ marginTop: L.gap }}>
              <BoardCard onNavigate={onNavigate} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     PR-03 — LEAVE ESCALATIONS & CAMPUS LEAVE
     ============================================================ */

  /* ============================================================
     PR-03 — LEAVE
     The principal is the SECOND rung, and she is the only rung for
     the people who report to nobody below her:

       · longer than 3 days   — the head of department has already
                                approved it; she settles it
       · longer than 15 days  — she clears it and the DIRECTOR signs
       · a head of department — her own leave starts here, because a
                                head never approves herself

     Nothing routine reaches this screen: up to three days the head
     decides and it never leaves the department. That is not a filter
     on this page, it is the chain in window.LeaveFlow.

     She cannot apply for leave here at all — the role has no
     self-service Leave item, because there is nobody above her to
     approve it (kit.jsx ROLE_PERMISSIONS).
     ============================================================ */
  const LF = window.LeaveFlow;
  const MY_CAMPUS = "lf.c.main";

  /* what stops her, and what merely warns her. A closed month is
     payroll's rule and she cannot override it. A blackout window is
     the campus calendar's — HERS — so she may set it aside, with the
     justification recorded against the term. */
  function prBlock(t, req) {
    if (req.lockedMonth) return t("pr.lv2.blockLocked", { mon: t("lv.mon." + (Number(req.from.split("-")[1]))) });
    return null;
  }
  function prWarn(t, req) {
    if (req.blackoutKey) return t("pr.lv.bo.banner", { name: t(req.blackoutKey), dates: t(req.blackoutKey + "d") });
    return null;
  }

  function PRToast({ text, onClose }) {
    const { c, shadow } = useTheme();
    const { t, ty } = useLang();
    if (!text) return null;
    return ReactDOM.createPortal(
      <div
        role="status"
        style={{
          position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 26, zIndex: 3000,
          display: "flex", alignItems: "center", gap: 14, maxWidth: 560,
          background: c.rail, color: c.onRail, borderRadius: G3.r.lg, padding: "12px 16px", boxShadow: shadow(3),
        }}
      >
        <span style={ty("small", { fontWeight: 600 })}>{text}</span>
        <LinkButton onDark onClick={onClose}>{t("pr.lv2.toastClose")}</LinkButton>
      </div>,
      document.body
    );
  }

  function PRRequestPanel({ req, onDone }) {
    const { t } = useLang();
    if (!req) return <LF.RequestPanel req={null} />;

    const block = prBlock(t, req);
    const warn = prWarn(t, req);
    const cover = req.coverWith ? LF.personById(req.coverWith.who) : null;
    /* who else on campus is out in the same window */
    const clash = LF.all().filter((x) =>
      x.id !== req.id && x.person.campusKey === req.person.campusKey &&
      LF.statusOf(x) !== "rejected" && LF.statusOf(x) !== "cancelled" &&
      x.from <= req.to && x.to >= req.from);

    const facts = [
      { k: t("lf.fact.cover"), v: cover ? LF.coverLine(t, req) : t("lf.fact.coverNone"), tone: LF.coverState(req) === "declined" ? "absentText" : null },
      clash.length ? { k: t("lf.fact.away"), v: LF.awayText(t, clash) } : null,
      req.shortDays ? { k: t("lf.fact.unpaid"), v: LF.unpaidText(t, req.shortDays), tone: "penaltyText" } : null,
    ];

    const decision = (
      <LF.DecisionBox
        req={req} you="principal"
        blocked={block} warn={warn}
        approveNeedsNote={!!warn}
        approveNoteLabel={t("pr.lv.bo.label")}
        approveLabel={warn ? t("pr.lv.bo.cta") : null}
        onDone={onDone}
      />
    );

    return (
      <LF.RequestPanel
        req={req} you="principal" facts={facts} decision={decision}
        note={warn && LF.isWaitingOn(req, "principal") ? t("pr.lv.bo.rate") : null}
      />
    );
  }

  /* who is away on campus, in the weeks around today — the calendar
     the principal actually plans against, read from the same store as
     the decisions above it */
  function CalendarTab() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [dept, setDept] = useState("all");
    const reqs = LF.useRequests();
    const FROM = TODAY_ISO, TO = "2026-09-30";
    const rows = reqs
      .filter((r) => {
        const st = LF.statusOf(r);
        if (st === "rejected" || st === "cancelled") return false;
        if (r.person.campusKey !== MY_CAMPUS) return false;
        if (dept !== "all" && r.person.deptKey !== dept) return false;
        return r.to >= FROM && r.from <= TO;
      })
      .sort((a, b) => (a.from < b.from ? -1 : 1));
    const columns = [
      { key: "name", label: t("pr.lv.col.name") },
      { key: "dept", label: t("pr.lv.col.dept") },
      { key: "dates", label: t("pr.lv.col.dates2") },
      { key: "status", label: t("pr.lv.col.status2") },
    ];
    return (
      <Card pad={0}>
        <div style={{ padding: G3.layout.cardPad + "px " + G3.layout.cardPad + "px 0" }}>
          <CardHeader title={t("pr.lv.cal.title")} sub={t("pr.lv2.calSub")} />
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap" }}>
            <Chip bg={c.sunken} fg={c.inkMuted}>{t("pr.lv2.calRange")}</Chip>
            <label style={{ minWidth: 190, marginLeft: "auto" }}>
              <span style={ty("caption", { display: "block", color: c.inkMuted, fontWeight: 700, marginBottom: 5 })}>{t("pr.filter.dept")}</span>
              <Select
                id="pr-lv-cal-dept" value={dept} onChange={setDept}
                options={[{ value: "all", label: t("pr.filter.deptAll") }].concat(Object.keys(LF.DEPTS).map((k) => ({ value: k, label: t(LF.DEPTS[k]) })))}
              />
            </label>
          </div>
        </div>
        {rows.length ? (
          <div style={{ padding: "0 " + (G3.layout.cardPad - 10) + "px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                  {columns.map((col) => <th key={col.key} scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 10px 9px", textTransform: "uppercase", whiteSpace: "nowrap" })}>{col.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < rows.length - 1 ? "1px solid " + c.rule : "none" }}>
                    <td style={ty("small", { padding: "10px 10px", color: c.ink, fontWeight: 700 })}>{t(r.person.nameKey)}</td>
                    <td style={ty("small", { padding: "10px 10px", color: c.ink })}>{t(LF.DEPTS[r.person.deptKey])}</td>
                    <td style={ty("small", { padding: "10px 10px", color: c.ink })}>{LF.fmtRange(t, r.from, r.to)}</td>
                    <td style={{ padding: "10px 10px" }}><LF.StageChip req={r} you="principal" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={ty("caption", { color: c.inkFaint, margin: "12px 10px 0" })}>{t("pr.lv2.calNote")}</p>
          </div>
        ) : (
          <EmptyState head={t("pr.lv.empty.head")} body={t("pr.lv.empty.body")} />
        )}
        <div style={{ height: 12 }} />
      </Card>
    );
  }

  function PRLeave({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const reqs = LF.useRequests();

    const [tab, setTab] = useState("mine");
    const [dept, setDept] = useState("all");
    const [state, setState] = useState("all");
    const [openId, setOpenId] = useState(null);
    const [toast, setToast] = useState(null);

    const campus = reqs.filter((r) => r.person.campusKey === MY_CAMPUS);
    const mine = campus.filter((r) => LF.isWaitingOn(r, "principal"));
    const all = campus
      .filter((r) => dept === "all" || r.person.deptKey === dept)
      .filter((r) => state === "all" || LF.statusOf(r) === state)
      .sort((a, b) => {
        const pa = LF.statusOf(a) === "pending", pb = LF.statusOf(b) === "pending";
        if (pa !== pb) return pa ? -1 : 1;
        return LF.ageOf(b) - LF.ageOf(a);
      });

    const rows = tab === "mine" ? mine : all;
    const picked = openId ? campus.filter((r) => r.id === openId)[0] : null;
    const shown = picked && rows.some((r) => r.id === picked.id) ? picked : (rows[0] || null);

    const filters = (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ minWidth: 190 }}>
          <Select id="pr-lv-dept" size="sm" value={dept} onChange={setDept}
            options={[{ value: "all", label: t("pr.filter.deptAll") }].concat(Object.keys(LF.DEPTS).map((k) => ({ value: k, label: t(LF.DEPTS[k]) })))} />
        </div>
        <div style={{ minWidth: 168 }}>
          <Select id="pr-lv-state" size="sm" value={state} onChange={setState}
            options={[{ value: "all", label: t("pr.lv2.stateAll") }, { value: "pending", label: t("lf.st.pending") }, { value: "approved", label: t("lf.st.approved") }, { value: "rejected", label: t("lf.st.rejected") }, { value: "cancelled", label: t("lf.st.cancelled") }]} />
        </div>
      </div>
    );

    const TAB_ITEMS = [
      { key: "mine", label: t("pr.lv2.tabMine") + " · " + num(mine.length) },
      { key: "campus", label: t("pr.lv2.tabCampus") + " · " + num(campus.length) },
      { key: "calendar", label: t("pr.lv.tab.calendar") },
    ];

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "principal"} active="prLeave" onNavigate={onNavigate} initials="RM" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip crumbKey="nav.prLeave" />

            <div style={{ marginBottom: 18 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("pr.lv2.pageTitle")}</h1>
            </div>

            <BlackoutBanner />

            <Tabs items={TAB_ITEMS} active={tab} onChange={setTab} ariaLabel={t("pr.lv2.pageTitle")} idBase="pr-lv-tabs" />

            {tab === "calendar" ? (
              <TabPanel idBase="pr-lv-tabs" tabKey="calendar" style={{ marginTop: 18 }}><CalendarTab /></TabPanel>
            ) : (
              <div style={{ marginTop: 18 }}>
                <Band
                  head={t("pr.lv2.band")} sub={t("pr.lv2.bandSub")}
                  metrics={[
                    { k: "mine", label: t("pr.lv2.m.mine"), value: num(mine.length), n: mine.length,
                      note: t("pr.lv2.m.mineNote"), tone: c.chartAmber, warn: mine.length > 0 },
                    { k: "days", label: t("pr.lv2.m.days"),
                      value: num(mine.reduce(function (n, r) { return n + (r.days || 0); }, 0)),
                      note: t("pr.lv2.m.daysNote"), tone: c.chartTeal },
                    { k: "campus", label: t("pr.lv2.m.campus"), value: num(campus.length), n: campus.length,
                      note: t("pr.lv2.m.campusNote"), tone: c.chartBlue },
                    { k: "long", label: t("pr.lv2.m.long"),
                      value: num(campus.filter(function (r) { return (r.days || 0) >= 15; }).length),
                      note: t("pr.lv2.m.longNote"), tone: c.chartPurple },
                  ]}
                />
              <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
                <LF.QueueTable
                  title={tab === "mine" ? t("pr.lv2.mineTitle") : t("pr.lv2.campusTitle")}
                  sub={tab === "mine" ? t("pr.lv2.mineSub", { n: num(mine.length) }) : t("pr.lv2.campusSub", { shown: num(all.length), total: num(campus.length) })}
                  chips={tab === "campus" ? filters : null}
                  rows={rows} selected={shown ? shown.id : null} onSelect={setOpenId}
                  you="principal"
                  emptyHead={tab === "mine" ? t("pr.lv2.mineEmpty") : undefined}
                  emptyBody={tab === "mine" ? t("pr.lv2.mineEmptyBody") : undefined}
                />
                <PRRequestPanel req={shown} onDone={(outcome, message) => setToast(message)} />
              </div>
              </div>
            )}
          </div>
        </main>
        <PRToast text={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.PRHome = PRHome;
  window.Pages3.PRAttendance = PRAttendance;
  window.Pages3.PRLeave = PRLeave;
})();
