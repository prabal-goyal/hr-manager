/* @jsxRuntime classic */
/* ============================================================
   Naveya — Department Head · window.Pages3.{DHHome,DHLeave,DHAttendance}

   SPEC: docs/screen-inventory.md DH-01 (M15 dashboards, M8 §Permissions
   `leave.approve`, M9 §Permissions `attendance.read` manager, M17
   §Permissions `appraisal.review`), DH-02 (M8 §Workflow, M8 §API
   `/approve` `/reject`, M8 §Permissions `leave.approve`), DH-03 (M9
   §Business rules, M9 §Permissions). Guardrails: docs/ui-compliance-
   requirements.md A27 (approve/reject — disabled+reason when the
   approver is the applicant), A31 (regularisation — approver absent
   for the requester), §683 Department Head row ("no bank/PAN/salary
   — the reveal control does not exist for them", "cannot approve
   their own anything", "scope is the department, including in
   pickers").

   PERSONA — Anjali Deshpande, Head of Department (Science), Sunrise
   Public School, Indiranagar. Her reports are the same six teachers
   across all three screens, and two of the leave.jsx / screens.jsx
   facts are reused verbatim rather than re-typed: Ananya Rao (PGT
   Physics, NAV-0142) is one of her reports, and Ananya's LR-0219
   (casual leave, 24–25 Aug 2026, needing a cover arrangement) is the
   exact request leave.jsx shows her applying for — this screen is
   where that request actually gets decided. "Today" is 2026-08-11,
   the same date leave.jsx treats as today.

   THREE SCREENS, THREE QUESTIONS
     DH-01 Department home  — "what does my department need from me
                               today?" Queue counts + routes only; the
                               decisions themselves live on DH-02 (and
                               on DH-04/07/09, not yet built — their
                               queue cards route honestly to an
                               unbuilt screen key, which the harness
                               already renders as "not built yet"
                               rather than a dead click).
     DH-02 Leave approvals  — "whose leave am I holding up?" Approve /
                               reject with a required-for-reject,
                               optional-for-approve note; every
                               decision is attributed; a cover
                               arrangement, a blackout window or a
                               locked payroll month can each make a
                               request un-approvable, and each says so
                               in words, not just a dimmed button.
     DH-03 Department attendance — "who is actually here?" Today's
                               roster + each person's month, sourced
                               from the SAME per-person pattern data
                               so the two screens can never disagree
                               with each other.

   WHAT ALL THREE DELIBERATELY REFUSE
   · Another department, ever. There is exactly one RoleAssignment
     for this Head (M2 §Business rules), so the DH-01 "switch
     department" action is correctly ABSENT (spec: "single assignment
     → hidden"), not disabled — and a scope banner still names the
     department on every screen (O7).
   · Salary, bank, PAN, Aadhaar. The one number that appears is a
     loss-of-pay RUPEE CONSEQUENCE on DH-02 (the spec's own Must-
     contain list requires it, and the LOP figure is a per-request
     result, not the underlying monthly gross, which is never
     printed).
   · Leave TYPE and reason outside DH-02's approval context. DH-01's
     "who is on leave today" and DH-03's roster both say only
     "On leave" (`att.stLeave`, already the system's neutral word),
     never CL/SL/medical. DH-02 is explicitly granted type + reason by
     its own Must-contain list, because the approver needs both to
     decide.
   · Editing an attendance record, or creating a regularisation
     directly (DH-03's day-cell action only asks the employee to
     raise EMP-04 — "the manager does not create the correction").
   · Overriding a blackout (DH-02: hidden for the Dept Head — that
     control belongs to the Principal, PR-03).
   · Raw geo-coordinates or a selfie image (DH-03: a "verified · geo /
     biometric" mark only, per §8).

   Composed only from window.G3 + window.UI3. tokens.jsx, kit.jsx,
   screens.jsx and the other pages/*.jsx files are untouched.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo, useEffect, useRef } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Field, Input, Select,
    Chip, StatusMark, Figure, Icon, ActionMenu, EmptyState, TitleMark,
    Tabs, TabPanel, SegmentDonut, Split, FigureBlocks, inr, num,
  } = UI;

  /* ============================================================
     STRINGS — dh.* is shared across the three screens, dh1/dh2/dh3
     are per-screen. Status words (Present/Late/On leave/Weekly off/
     Absent/Missing punch) are REUSED from screens.jsx (att.st*) and
     attendance.jsx (att2.st*) — one source per fact, never retyped.
     ============================================================ */
  addStrings({
    en: {
      "dh.scope.dept": "Science department",
      "dh.scope.note": "Your department only — Science, not the whole campus.",
      "dh.identity": "Head of Department, Science",
      "dh2b.act.whyCoverGone": "{name} has declined the cover. The classes have nobody on them, so there is nothing to approve until another colleague is named.",
      "dh2b.d.warnBlackout": "These days sit inside {name} ({dates}). You may still pass it on — but only the principal can set that window aside.",
      "dh2b.d.coverTitle": "Cover for the classes",
      "dh2b.d.coverEmpty": "No cover named yet. You decide whether that matters for these dates.",
      "dh1.mine.title": "Your own leave",
      "dh1.mine.sub": "{name} decides yours — a head never approves her own",
      "dh1.mine.all": "See the whole record",
      "dh1.mine.none": "Nothing of yours is waiting on anybody.",

      "dh2b.tabs": "Leave sections",
      "dh2b.tab.team": "Your department",
      "dh2b.tab.own": "Your own leave",
      "dh2b.rule": "Up to two days, your answer ends it. From three days, approving only sends it on to the principal; past fifteen, the director signs after her.",
      "dh2b.f.mine": "Waiting on you",
      "dh2b.f.moved": "Sent upward",
      "dh2b.f.decided": "Closed",
      "dh2b.f.all": "Everything",
      "dh2b.fact.bal": "{bal} {type} left, {n} asked for",
      "dh2b.fact.unpaid": "{n} days · {amt} off the {mon} run",
      "dh2b.fact.unpaidShort": "{n} days have no balance behind them",
      "dh2b.own.subOwn": "Your own leave",
      "dh2b.team.title": "Your department's leave",
      "dh2b.band": "Your department’s leave",
      "dh2b.m.mine": "Waiting on you",
      "dh2b.m.daysUnit": "days",
      "dh2b.n.clear": "Your queue is clear",
      "dh2b.n.none": "Nothing yet this session",
      "dh2b.n.longest": "Oldest {n} days · {who}",
      "dh2b.n.withThem": "Nothing with them",
      "dh2b.n.ap": "{n} approved",
      "dh2b.n.no": "{n} not approved",
      "dh2b.n.wd": "{n} withdrawn",
      "dh2b.m.days": "Days asked for",
      "dh2b.m.moved": "Sent upward",
      "dh2b.m.decided": "Settled",
      "dh2b.team.sub": "{n} waiting on you · the rest is here to follow, not to decide",
      "dh2b.empty.mineHead": "Nothing is waiting on you",
      "dh2b.empty.mineBody": "Every request from Science has an answer. Try \u201cSent upward\u201d for the ones now sitting with the principal.",
      "dh2b.bulk.cta": "Approve the {n} that are ready",
      "dh2b.bulk.askTitle": "Approve {n} requests",
      "dh2b.bulk.askBody": "{days} days in all. {n} of them run three days or longer, so approving sends those on to the principal rather than settling them.",
      "dh2b.bulk.askYes": "Yes, approve {n}",
      "dh2b.bulk.doneTitle": "{n} approved",
      "dh2b.bulk.doneBlocked": "{n} were left where they were — each has something to sort out first, and the reason is on the request itself.",
      "dh2b.bulk.doneClean": "Nothing was left behind.",
      "dh2b.toast.close": "Dismiss",

      "dh2b.own.title": "Your leave",
      "dh2b.own.sub": "What you asked for, and how far each one has got",
      "dh2b.own.apply": "Apply for leave",
      "dh2b.own.rule": "Your own leave is {name}'s to decide — a head never approves her own. Past fifteen days, the director signs after her.",
      "dh2b.own.pickBody": "Open one of your requests to see who is holding it and what they said.",
      "dh2b.own.emptyHead": "You have not applied for anything",
      "dh2b.own.emptyBody": "Apply on your own Leave screen and it appears here the moment you send it.",
      "dh2b.own.waiting": "It is with {name} now. {rule}",
      "dh2b.own.settled": "This one is closed. It stays on the record either way.",
      "dh2b.own.withdraw": "Withdraw this request",
      "dh2b.own.withdrawAsk": "Withdraw it? The days go straight back to your balance and whoever is holding it is told.",
      "dh2b.own.withdrawYes": "Yes, withdraw it",
      "dh2b.own.withdrawn": "{id} withdrawn. The days are back on your balance.",

      "dh.close": "Close",
      "dh.verify.geo": "Verified · geo",
      "dh.verify.bio": "Verified · biometric",
      "dh.person.aria": "Open {name}",

      "dh.desig.pgtPhysics": "PGT, Physics",
      "dh.desig.pgtChem": "PGT, Chemistry",
      "dh.desig.tgtBio": "TGT, Biology",
      "dh.desig.tgtChem": "TGT, Chemistry",

      /* ---- DH-01 Department home ---- */
      "dh1.pageTitle": "Department home",
      "dh1.today": "Today · {date}",

      "dh1.queue.leave.title": "Waiting on your decision",
      "dh1.queue.leave.subCover": "{n} of these cannot be approved until a cover is arranged",

      /* today, full width */
      "dh1.who.title": "Who is in today",
      "dh.m.of": "of {n}",
      "dh.n.none": "Nobody today",
      "dh.n.more": "{names} and {n} more",
      "dh.n.remote": "{n} marked remotely",
      "dh.n.atGate": "All marked at a gate",
      "dh3.n.inSplit": "{p} on time, {l} late",
      "dh3.n.toClear": "to clear",
      "dh1.who.inSchoolShort": "in school",
      "dh1.who.attn": "Needs you today",
      "dh1.who.attnNone": "Nobody is late, absent or away — the whole department is in.",
      "dh1.who.rest": "Everyone else",
      "dh1.who.restNone": "Nobody else is on the roll today.",
      "dh1.roll.head": "The department, person by person",
      "dh1.roll.sub": "The same roll the figures above count, cut by whether it wants you this morning.",
      "dh1.roll.attnWhy": "late, absent, away or unread — each one is a word you owe somebody",
      "dh1.roll.attnClear": "nothing to answer",
      "dh1.roll.restWhy": "in, and on time — nothing to do",
      "dh1.roll.restNone": "nobody else on the roll",
      "dh1.roll.foot": "A missing punch is not an absence. It sits with the people who need you because somebody has to say which of the two it was.",
      "dh1.today.open": "Open dept attendance",

      /* the queue, as the requests themselves */
      "dh1.wait.sub": "{n} leave requests, oldest first",
      "dh1.wait.waited": "waiting {n} days",
      "dh1.wait.oneDay": "waiting since yesterday",
      "dh1.wait.today": "applied today",
      "dh1.wait.more": "and {n} more in the queue",
      "dh1.wait.open": "Open the leave queue",
      "dh1.wait.noneSub": "Nothing is held up with you",
      "dh1.wait.noneHead": "Your queue is clear",
      "dh1.wait.noneBody": "No one in Science is waiting on your decision right now.",

      /* the other three queues */

      /* who is away, and who holds their classes */
      "dh1.away.title": "Away in Science",
      "dh1.away.today": "Today",
      "dh1.away.coming": "Coming up",
      "dh1.away.noneToday": "Everyone is expected in today.",
      "dh1.away.noneComing": "No approved leave ahead this month.",
      "dh1.away.cover": "Cover · {line}",
      "dh1.away.noCover": "No cover named yet",

      /* the month so far */
      "dh1.month.title": "August so far",
      "dh1.month.present": "days present",
      "dh1.month.late": "late arrivals",
      "dh1.month.absent": "days absent",
      "dh1.month.missing": "missing punches",
      "dh1.onleave.title": "On leave today",
      "dh1.onleave.emptyHead": "No one is on leave today",
      "dh1.onleave.emptyBody": "Every teacher in Science is expected in today.",


      "dh1.firstRun.head": "No reports assigned yet",
      "dh1.firstRun.body": "HR sets who reports to you. Once teachers are assigned to Science, their queues and attendance appear here.",

      /* ---- DH-02 Leave approvals ---- */
      "dh2.pageTitle": "Leave",
      "dh2.sub": "Science department · pending your decision",

      "dh2.f.all": "All", "dh2.f.pending": "Pending", "dh2.f.approved": "Approved",
      "dh2.f.rejected": "Not approved", "dh2.f.cancelled": "Withdrawn",
      "dh2.f.aria": "Filter by status",
      "dh2.type.aria": "Filter by leave type",
      "dh2.type.all": "All types",
      "dh2.search.label": "Find a teacher",
      "dh2.search.ph": "Type a name",

      "dh2.col.sel": "",
      "dh2.col.employee": "Teacher",
      "dh2.col.type": "Type",
      "dh2.col.dates": "Dates",
      "dh2.col.days": "Days",
      "dh2.col.flags": "Before you decide",
      "dh2.col.status": "Status",
      "dh2.col.more": "More",
      "dh2.row.selAria": "Select request {id}",
      "dh2.row.openAria": "Open request {id}",
      "dh2.menuAria": "What you can do with request {id}",

      "dh2.badge.cover": "Needs cover",
      "dh2.badge.retro": "Retrospective",
      "dh2.badge.escalates": "Also goes to Principal",
      "dh2.badge.locked": "Month locked",
      "dh2.badge.blackout": "In exam blackout",
      "dh2.badge.lop": "Creates loss of pay",

      "dh2.half.note": "{which} only",
      "dh2.half.first": "First half",
      "dh2.half.second": "Second half",

      "dh2.bulk.selected": "{n} selected",
      "dh2.bulk.approve": "Approve selected",
      "dh2.bulk.needTwo": "Select at least two requests",
      "dh2.bulk.clear": "Clear",
      "dh2.bulk.confirmTitle": "Approve {n} leave requests?",
      "dh2.bulk.confirmBody": "Together these are {days} days. {n2} of them will create loss of pay for the employee.",
      "dh2.bulk.confirmBodyNoLop": "Together these are {days} days. None of them will create loss of pay.",
      "dh2.bulk.confirmCta": "Approve {n}",
      "dh2.bulk.cancel": "Never mind",
      "dh2.bulk.resultTitle": "Result",
      "dh2.bulk.resultOk": "Approved",
      "dh2.bulk.resultFail": "Not approved — {reason}",
      "dh2.bulk.close": "Close",

      "dh2.d.pickHead": "Pick a request",
      "dh2.d.pickBody": "Choose a row on the left to see the full picture before you decide.",
      "dh2.d.title": "Request {id}",
      "dh2.d.reasonTitle": "Why they asked",
      "dh2.d.coverTitle": "Who else is away those days",
      "dh2.d.coverEmpty": "No one else in Science is away those days.",
      "dh2.d.coverRow": "{name} · {dates}",
      "dh2.d.ledgerTitle": "Their {name} balance",
      "dh2.d.ledgerLine": "Opened with {o} · added {a} · taken {u} · {bal} left before this request",
      "dh2.d.consTitle": "What approving this does",
      "dh2.d.consOk": "All {n} days come out of their {name}; {left} would remain.",
      "dh2.d.consShort": "Only {have} of {n} days can come from {name}. The remaining {short} has nothing to draw on.",
      "dh2.d.consLop": "{short} at loss of pay — about {amt}, worked out on the {mon} payroll run and shown on that payslip.",
      "dh2.d.consEscalate": "This is longer than three days, so after your decision it also goes to the Principal.",
      "dh2.d.consChainEnds": "Your decision is final — this does not need to go further.",

      "dh2.act.approve": "Approve",
      "dh2.act.reject": "Reject",
      "dh2.act.moreInfo": "Ask for more information",
      "dh2.act.ledger": "See their balance",
      "dh2.act.trail": "See the approval trail",
      "dh2.act.whyCover": "Needs a cover arrangement before this can be approved.",
      "dh2.act.whyLocked": "{mon} payroll is already locked. Route this to arrears instead.",
      "dh2.act.whyBlackout": "These dates fall inside {name}. Only the Principal can override a blackout.",
      "dh2.act.whyDecided": "Already decided.",
      "dh2.act.whyCancelled": "The teacher withdrew this request.",

      "dh2.note.approveLabel": "A note for the record (optional)",
      "dh2.note.rejectLabel": "Why you're not approving this",
      "dh2.note.rejectRequired": "Tell them why — this is required.",
      "dh2.note.approveConfirm": "Confirm approval",
      "dh2.note.rejectConfirm": "Confirm rejection",
      "dh2.note.cancel": "Never mind",
      "dh2.result.approved": "Approved by you on {date}.",
      "dh2.result.approvedNote": "Approved by you on {date} — “{note}”",
      "dh2.result.rejected": "Not approved by you on {date} — “{note}”",

      "dh2.moreinfo.label": "What you need to know",
      "dh2.moreinfo.ph": "One line is enough.",
      "dh2.moreinfo.send": "Send",
      "dh2.moreinfo.sent": "Sent. {name} stays pending until you decide.",

      "dh2.trail.applied": "{name} applied",
      "dh2.trail.routed": "Sent to you",
      "dh2.trail.info": "You asked for more information",
      "dh2.trail.approved": "You approved it",
      "dh2.trail.rejected": "You did not approve it",
      "dh2.trail.cancelled": "{name} withdrew this request",

      "dh2.empty.head": "Nothing to decide",
      "dh2.empty.body": "No requests match this filter right now.",

      "dh2.r.karanRetro": "Was down with a stomach bug on the 6th and 7th — filing this once I was back.",
      "dh2.r.priyaTravel": "Sister's engagement in Pune — travelling as a family.",
      "dh2.r.sanjayHome": "Helping my parents move house — booked the week already.",
      "dh2.r.meeraJuly": "Cousin's wedding — this was the only week that worked.",
      "dh2.r.meeraSept": "Personal work — I know the dates are tight, wanted to ask anyway.",
      "dh2.r.rameshHome": "Minor surgery, on the doctor's advice.",
      "dh2.r.divyaJuly": "Family function out of town.",
      "dh2.r.karanHalf": "Dentist appointment.",
      "dh2.note.rejPrep": "Term-1 prep week — we're already short-staffed those two days. Please pick a week after the 25th.",

      /* ---- DH-03 Department attendance ---- */
      "dh3.pageTitle": "Department attendance",
      "dh3.sub": "Science department",
      "dh3.tab.today": "Today",
      "dh3.tab.month": "Month pattern",

      "dh3.day.prev": "Previous day",
      "dh3.day.next": "Next day",
      "dh3.day.future.head": "Nothing to show yet",
      "dh3.day.future.body": "This date hasn't happened yet, so there is no attendance to show.",

      "dh3.f.aria": "Filter the register",
      "dh3.f.all": "All", "dh3.f.present": "Present", "dh3.f.late": "Late",
      "dh3.f.absent": "Absent", "dh3.f.leave": "On leave", "dh3.f.exceptions": "Exceptions only",
      "dh3.shift.aria": "Filter by shift",
      "dh3.shift.all": "All shifts",
      "dh3.shift.morning": "Morning",
      "dh3.shift.day": "Day",
      "dh3.shift.morningRange": "Morning · 08:00–14:30",
      "dh3.shift.dayRange": "Day · 08:30–15:00",

      "dh3.col.teacher": "Teacher",
      "dh3.band": "The department today",
      "dh3.band.outage": "Reader down",
      "dh3.band.foot": "A correction belongs on the person’s row, not here.",
      "dh3.m.in": "In school",
      "dh3.m.exc": "Exceptions",
      "dh3.col.shift": "Shift",
      "dh3.col.status": "Status",
      "dh3.col.intime": "In",
      "dh3.col.outtime": "Out",
      "dh3.code.present": "P", "dh3.code.late": "L", "dh3.code.absent": "A",
      "dh3.code.leave": "LV", "dh3.code.missing": "M", "dh3.code.off": "W",
      "dh3.code.outage": "D", "dh3.code.holiday": "H",
      "dh3.col.stillIn": "still in",
      "dh3.col.verify": "How marked",
      "dh3.col.exceptions": "Exceptions",
      "dh3.col.more": "More",

      "dh3.exceptions.n": "{n}",
      "dh3.exceptions.none": "None",
      "dh3.exceptions.aria": "{n} exception for {name}, open regularisation",
      "dh3.stOutage": "Awaiting device data",
      "dh3.outageBody": "The Science block's biometric device did not report for this day — a device gap, not an absence.",

      "dh3.act.openMonth": "Open this month",
      "dh3.act.flag": "Flag for regularisation",
      "dh3.act.flagWhyNoGap": "There is no missing punch on this day.",
      "dh3.act.flagWhyPending": "A correction request is already pending for this day.",
      "dh3.act.flagged": "Flagged — the teacher has been asked to raise a correction",
      "dh3.act.flagNote": "A note (optional)",
      "dh3.act.flagSend": "Notify the teacher",
      "dh3.act.reviewExceptions": "Review exceptions",
      "dh3.act.reviewExceptionsWhy": "No exceptions for this person.",
      "dh3.menuAria": "Actions for {name}",

      "dh3.export.button": "Export register",
      "dh3.export.note": "This export contains {n} staff from {dept} — the scope you hold.",
      "dh3.export.done": "Exported — audited on {date}.",
      "dh3.export.close": "Close",

      "dh3.month.title": "{name}'s month",
      "dh3.month.sub": "{dept} · {monthLabel}",
      "dh3.month.prev": "Previous month",
      "dh3.month.next": "Next month",
      "dh3.month.lockedTitle": "{monthLabel} is locked by payroll",
      "dh3.month.lockedBody": "That month has already been run. Records are read-only.",
      "dh3.month.futureTitle": "{monthLabel} hasn't happened yet",
      "dh3.month.futureBody": "There is nothing to show for a month that hasn't started.",
      "dh3.month.close": "Close",
      "dh3.month.pickHead": "Pick a teacher",
      "dh3.month.pickBody": "Choose a name to see their month, day by day.",
      "dh3.day.aria": "{date}, {status}",

      "dh3.empty.head": "No one matches this filter",
      "dh3.empty.body": "Try a different status or shift.",
      "dh3.holiday.head": "Weekly off",
      "dh3.holiday.body": "Sunday — the whole department is off. Nothing to mark.",
    },

  });

  /* ============================================================
     DATA — one department, six teachers, figures that reconcile
     across DH-01 / DH-02 / DH-03 (and, where the fact is shared,
     with leave.jsx / screens.jsx).
     ============================================================ */
  const TODAY_ISO = "2026-08-11";

  function pad2(n) { return String(n).padStart(2, "0"); }
  function isoAug(d) { return "2026-08-" + pad2(d); }
  function parseISO(s) {
    const p = s.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function dayLabel(t, iso) {
    const d = parseISO(iso);
    return t("att.d" + d.getDay()) + " " + d.getDate() + " " + t("lv.mon." + (d.getMonth() + 1)) + " " + d.getFullYear();
  }
  function shortRange(t, from, to) {
    const a = parseISO(from), b = parseISO(to);
    const ma = t("lv.mon." + (a.getMonth() + 1)), mb = t("lv.mon." + (b.getMonth() + 1));
    if (from === to) return a.getDate() + " " + ma + " " + a.getFullYear();
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
      return a.getDate() + " – " + b.getDate() + " " + ma + " " + a.getFullYear();
    }
    return a.getDate() + " " + ma + " – " + b.getDate() + " " + mb + " " + b.getFullYear();
  }
  function monthName(t, iso) { return t("lv.mon." + (parseISO(iso).getMonth() + 1)); }
  function days(n) { return n % 1 === 0 ? num(n) : num(Math.floor(n)) + "." + String(Math.round((n % 1) * 10)); }

  /* per-person day-by-day pattern for 1–11 August. Sundays are
     "off" automatically; everything else defaults to "present" with a
     seeded but deterministic in-time, then the named overrides win —
     so the ONLY hand-authored facts are the exceptions themselves. */
  /* The month runs to 31 August so the calendar is a whole month, but
     only days up to TODAY carry a record: a future weekday is drawn as
     "not yet", never as present. An out-time is part of every worked
     day — a register that shows when somebody arrived and not when
     they left is half a register. */
  function buildPattern(seed, overrides) {
    const out = {};
    for (let d = 1; d <= 31; d++) {
      const iso = isoAug(d);
      const wd = parseISO(iso).getDay();
      if (wd === 0) { out[iso] = { status: "off" }; continue; }
      if (d > 11) { out[iso] = { status: "ahead" }; continue; }
      const inM = "08:" + pad2(((d + seed) % 12) + 2);
      out[iso] = { status: "present", inTime: inM, outTime: wd === 6 ? "12:1" + ((d + seed) % 9) : "15:" + pad2(((d + seed * 3) % 40) + 20) };
    }
    if (overrides) Object.keys(overrides).forEach((iso) => { out[iso] = Object.assign({}, out[iso], overrides[iso]); });
    return out;
  }

  const STAFF = [
    {
      id: "ananya", empId: "NAV-0142", name: "Ananya Rao", desig: "dh.desig.pgtPhysics",
      shift: "morning", monthlyGross: 94800.0,
      /* HER OWN RECORD, VERBATIM. These are the days EMP-02 shows
         Ananya when she opens My attendance; a head's register that
         told her a different August would be the end of both. Today
         is hers to mark — pages/attendance.jsx owns the live punch
         and My team overlays it on her card. */
      pattern: buildPattern(1, {
        "2026-08-01": { status: "present", inTime: "07:55", outTime: "12:05" },
        "2026-08-03": { status: "present", inTime: "07:48", outTime: "16:50" },
        "2026-08-04": { status: "present", inTime: "07:41", outTime: "15:32" },
        "2026-08-05": { status: "late", inTime: "08:21", outTime: "15:40" },
        "2026-08-06": { status: "missing", inTime: "07:49" },
        "2026-08-07": { status: "present", inTime: "07:41", outTime: "17:10" },
        "2026-08-08": { status: "present", inTime: "07:55", outTime: "12:05" },
        "2026-08-10": { status: "leave", inTime: null },
        "2026-08-11": { status: "missing", inTime: null },
      }),
      verify: "geo",
      balances: { CL: { opening: 12, accrued: 0, used: 4 } },
    },
    {
      id: "karan", empId: "NAV-0156", name: "Karan Mehta", desig: "dh.desig.pgtPhysics",
      shift: "morning", monthlyGross: 71200.0,
      pattern: buildPattern(4, {
        "2026-08-04": { status: "late", inTime: "08:47" },
        "2026-08-06": { status: "missing", inTime: null },
        "2026-08-08": { status: "late", inTime: "08:39" },
        "2026-08-11": { status: "late", inTime: "08:41" },
      }),
      verify: "geo",
      balances: { SL: { opening: 3, accrued: 2, used: 0 }, CL: { opening: 12, accrued: 0, used: 5 } },
    },
    {
      id: "meera", empId: "NAV-0163", name: "Meera Joshi", desig: "dh.desig.pgtPhysics",
      shift: "morning", monthlyGross: 71200.0,
      pattern: buildPattern(2, {
        "2026-08-07": { status: "outage", inTime: null },
        "2026-08-11": { status: "present", inTime: "08:05" },
      }),
      verify: "bio",
      balances: { CL: { opening: 12, accrued: 0, used: 6 } },
    },
    {
      id: "ramesh", empId: "NAV-0149", name: "Ramesh Iyer", desig: "dh.desig.pgtChem",
      shift: "morning", monthlyGross: 68400.0,
      pattern: buildPattern(0, { "2026-08-11": { status: "present", inTime: "07:58" } }),
      verify: "bio",
      balances: { SL: { opening: 4, accrued: 4, used: 2 } },
    },
    {
      id: "priya", empId: "NAV-0171", name: "Priya Nair", desig: "dh.desig.tgtBio",
      shift: "day", monthlyGross: 52400.0,
      pattern: buildPattern(3, { "2026-08-11": { status: "present", inTime: "08:31" } }),
      verify: "geo",
      balances: { CL: { opening: 12, accrued: 0, used: 11 } },
    },
    {
      id: "divya", empId: "NAV-0178", name: "Divya Kapoor", desig: "dh.desig.tgtBio",
      shift: "day", monthlyGross: 52400.0,
      pattern: buildPattern(5, { "2026-08-11": { status: "leave", inTime: null } }),
      verify: "geo",
      balances: { CL: { opening: 12, accrued: 0, used: 4 } },
    },
    {
      id: "sanjay", empId: "NAV-0184", name: "Sanjay Verma", desig: "dh.desig.tgtChem",
      shift: "day", monthlyGross: 58400.0,
      pattern: buildPattern(6, { "2026-08-11": { status: "absent", inTime: null } }),
      verify: "geo",
      balances: { CL: { opening: 12, accrued: 0, used: 6 } },
    },
    /* Science holds ten people and Anjali is one of them, so nine
       report to her -- this register listed seven. */
    {
      id: "rahul", empId: "NAV-0191", name: "Rahul Verma", desig: "dh.desig.pgtPhysics",
      shift: "morning", monthlyGross: 76400.0,
      /* LR-0211 approves his leave for today, and an approved leave
         that the register still reads as a punch is two fixtures
         disagreeing about one man — found when Home started listing
         who is away from the leave store (2026-10-27). */
      pattern: buildPattern(7, {
        "2026-08-05": { status: "late", inTime: "08:38" },
        "2026-08-11": { status: "leave", inTime: null },
      }),
      verify: "bio",
      balances: { CL: { opening: 12, accrued: 0, used: 3 } },
    },
    {
      id: "suresh", empId: "NAV-0137", name: "Suresh Kulkarni", desig: "dh.desig.tgtChem",
      shift: "morning", monthlyGross: 66800.0,
      pattern: buildPattern(9, {
        "2026-08-03": { status: "leave", inTime: null },
        "2026-08-11": { status: "present", inTime: "07:51" },
      }),
      verify: "geo",
      balances: { SL: { opening: 3, accrued: 2, used: 1 }, CL: { opening: 12, accrued: 0, used: 2 } },
    },
  ];
  function staffById(id) { return STAFF.filter((s) => s.id === id)[0]; }
  /* this file's ids and the shared roster's differ in exactly one
     place; the name itself comes from the roster so the screen is one
     language at a time */
  const LF_ID = { meera: "meeraj" };
  function staffName(t, staff) {
    if (!staff) return "";
    const LFx = window.LeaveFlow;
    const p = LFx && LFx.personById ? LFx.personById(LF_ID[staff.id] || staff.id) : null;
    return p ? t(p.nameKey) : staff.name;
  }
  function exceptionsOf(staff) {
    return Object.keys(staff.pattern).filter((iso) => {
      const st = staff.pattern[iso].status;
      return st === "missing" || (st === "absent" && iso === TODAY_ISO) || (st === "absent");
    }).length;
  }

  /* campus blackout window, shared verbatim with leave.jsx's WINDOWS
     — the same M7 calendar shapes both the applicant's screen and the
     approver's */
  const BLACKOUT = { key: "lv.win.exam1", dateKey: "lv.win.exam1d", from: "2026-09-14", to: "2026-09-19" };

  /* The leave queue itself lives in window.LeaveFlow — DH-02 is one
     window onto it, PR-03, DR-02 and HR-28 are the others. What used
     to be a seed array here would have drifted from theirs within a
     week. Counts are read at render, never frozen at load. */

  function decisionView(req) {
    const staff = staffById(req.staffId);
    const bucket = staff.balances[req.type] || { opening: 0, accrued: 0, used: 0 };
    const bal = bucket.opening + bucket.accrued - bucket.used;
    const paid = Math.min(req.days, bal);
    const short = Math.max(0, req.days - bal);
    const lopDay = staff.monthlyGross / 30;
    return { bucket: bucket, bal: bal, paid: paid, short: short, lop: short * lopDay, after: bal - paid };
  }

  function coverageFor(req) {
    if (!req.coverageWith) return [];
    return req.coverageWith.map((c) => ({ staff: staffById(c.staffId), from: c.from, to: c.to }));
  }

  function blockReasonKey(req) {
    if (window.LeaveFlow.coverState(req) === "declined") return "cover";
    if (req.locked) return "locked";
    if (req.blackout) return "blackout";
    return null;
  }

  /* ============================================================
     LOCAL PRIMITIVES — promotion candidates for kit.jsx, kept here
     because this dispatch owns only its own page file.
     ============================================================ */

  /* a small centred, portal-rendered confirm dialog. ActionMenu
     already proves the portal pattern for an anchored popover; this
     is the same idea for a modal that needs no anchor. */
  function ConfirmDialog({ title, body, children, confirmLabel, cancelLabel, onConfirm, onCancel }) {
    const { c, shadow } = useTheme();
    const { ty } = useLang();
    const boxRef = useRef(null);
    useEffect(() => {
      function onKey(e) { if (e.key === "Escape") onCancel(); }
      document.addEventListener("keydown", onKey);
      if (boxRef.current) boxRef.current.focus();
      return () => document.removeEventListener("keydown", onKey);
      // eslint-disable-next-line
    }, []);
    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        {/* the backdrop is a real G3 token (the rail's cocoa) dimmed with
            CSS opacity, not a hand-mixed colour literal — it is a sibling
            of the dialog box, never its parent, so the opacity never
            washes out the dialog's own content */}
        <div
          aria-hidden="true" onMouseDown={onCancel}
          style={{ position: "absolute", inset: 0, background: c.rail, opacity: 0.55 }}
        />
        <div
          ref={boxRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
          style={{ position: "relative", width: 480, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.lg, boxShadow: shadow(4), padding: 24 }}
        >
          <h2 style={ty("h2", { margin: "0 0 10px", color: c.ink })}>{title}</h2>
          {body ? <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{body}</p> : null}
          {children}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 18 }}>
            {cancelLabel ? <Button kind="ghost" onClick={onCancel}>{cancelLabel}</Button> : null}
            {confirmLabel ? <Button kind="primary" onClick={onConfirm}>{confirmLabel}</Button> : null}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function RowCheck({ checked, onChange, disabled, ariaLabel }) {
    const { c } = useTheme();
    return (
      <button
        type="button" role="checkbox" aria-checked={checked ? "true" : "false"} aria-label={ariaLabel}
        disabled={disabled} onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 19, height: 19, borderRadius: 5, flexShrink: 0,
          border: "1.5px solid " + (checked ? c.accent : c.borderStrong),
          background: checked ? c.accent : "transparent",
          color: c.onAccent, display: "flex", alignItems: "center", justifyContent: "center",
          opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer",
        }}
      >
        {checked ? <Icon name="check" size={12} /> : null}
      </button>
    );
  }

  function PillGroup({ ariaLabel, items, value, onChange }) {
    const { c } = useTheme();
    return (
      <div role="group" aria-label={ariaLabel} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {items.map((it) => {
          const on = it.key === value;
          return (
            <button
              key={it.key} type="button" aria-pressed={on ? "true" : "false"} onClick={() => onChange(it.key)}
              style={{
                border: "1px solid " + (on ? c.accent : c.border), borderRadius: G3.r.pill,
                height: G3.layout.controlH, padding: "0 15px",
                background: on ? c.accent : c.surface, color: on ? c.onAccent : c.ink,
                fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 7,
              }}
            >
              <span>{it.label}</span>
              {it.count != null ? <span style={G3.fig("micro", { fontWeight: 700, color: on ? c.onAccent : c.inkFaint })}>{num(it.count)}</span> : null}
            </button>
          );
        })}
      </div>
    );
  }

  function TypeMark({ code, size }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const role = TYPE_ROLE[code] || "ltCasual";
    const s = size || 24;
    return (
      <span
        aria-hidden="true"
        style={ty("caption", {
          width: s, minWidth: s, height: s, borderRadius: G3.r.xs, background: c[role + "Tint"], color: c[role + "Text"],
          display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, flexShrink: 0, letterSpacing: "0",
        })}
      >
        {t("lv.code." + code)}
      </span>
    );
  }

  function VerifyChip({ kind }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <Chip bg={c.presentTint} fg={c.presentText}>
        <span aria-hidden="true" style={{ display: "flex" }}><Icon name="scan" size={12} /></span>
        <span>{t(kind === "bio" ? "dh.verify.bio" : "dh.verify.geo")}</span>
      </Chip>
    );
  }

  /* the shared queue, read by DH-01's cards (DH-02 declares its own
     alias further down; both point at the one store) */
  const LFH = window.LeaveFlow;
  const MY_DEPT_HOME = "science";

  function ScopeBanner() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 13px",
          borderRadius: G3.r.pill, background: c.sunken, border: "1px solid " + c.border,
        }}
      >
        <span aria-hidden="true" style={{ display: "flex", color: c.inkMuted }}><Icon name="briefcase" size={13} /></span>
        <span style={ty("caption", { color: c.inkMuted, fontWeight: 600 })}>{t("dh.scope.note")}</span>
      </div>
    );
  }

  function PersonLine({ staff, sub }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
        <span
          aria-hidden="true"
          style={{
            width: 30, height: 30, borderRadius: G3.r.pill,
            background: UI.avatarTone(staff.name, c, { bg: c.sel, fg: c.action }).bg,
            color: UI.avatarTone(staff.name, c, { bg: c.sel, fg: c.action }).fg,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            fontFamily: G3.font.ui, fontSize: 11.5, fontWeight: 700,
          }}
        >
          {staffName(t, staff).split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{staffName(t, staff)}</span>
          <span style={ty("caption", { display: "block", color: c.inkFaint })}>{sub || t(staff.desig)}</span>
        </span>
      </span>
    );
  }

  /* ============================================================
     DH-01 — Department home, ranked.

     2026-09-23 designer pass (same treatment as EMP-01): it opened on
     four equal queue tiles, three of which repeated the same "built in
     a later wave" sentence, and the two columns below finished 400px
     apart. It now reads

       1 · a plain head (who she is, which department, what day);
       2 · TODAY IN SCIENCE, full width — in class, late, absent, away,
           each naming the person, over one stacked bar of the whole
           roll;
       3 · three columns of TWO cards — what is waiting on her decision
           (the real requests, not a number) and the other queues · who
           is away and who is holding their classes, and the month so
           far · her own leave and the papers coming due.

     No gradients: the roll bar is four solid token segments, which is
     a composition, not a fade.
     ============================================================ */

  /* Seven people, two columns, one row treatment. An earlier pass split
     them into "needs you" rows and a stripped-down list of names for
     everyone else, which read as two different kinds of fact; they are
     the same fact — a person, when they arrived, what the record says.
     The chart to their left is the shape of the roll, and it carries
     nothing the legend beside it does not also say in words. */
  /* A LINE THAT NAMES SOMEBODY. Under a figure, "Karan Mehta" is
     worth more than a sentence explaining what "late" means: the
     figure says how many, the line says who. Two names, then a count
     of the rest -- a column is not a list. */
  function nameLine(t, names, none) {
    if (!names.length) return none || t("dh.n.none");
    if (names.length <= 2) return names.join(", ");
    return t("dh.n.more", { names: names.slice(0, 2).join(", "), n: num(names.length - 2) });
  }

  function whoOf(t, list, pred) {
    return nameLine(t, list.filter(pred).map(function (x) { return x.staff.name; }));
  }

  const REMOTE_MARK = { geo: 1, web: 1 };

  const TODAY_RANK = { absent: 0, missing: 1, outage: 2, late: 3, leave: 4, present: 5, off: 6 };
  const TODAY_ROLE = { present: "present", late: "late", absent: "absent", leave: "leave", missing: "missing", outage: "missing", off: "off" };

  function RosterRow({ entry, first, wordOf }) {
    const { c } = useTheme();
    return (
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "13px 0",
          borderTop: first ? "none" : "1px solid " + c.rule,
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}><PersonLine staff={entry.staff} /></span>
        <span style={G3.fig("sm", { color: entry.inTime ? c.ink : c.inkFaint, fontWeight: 600, whiteSpace: "nowrap" })}>
          {entry.inTime || "—"}
        </span>
        <StatusMark
          role={TODAY_ROLE[entry.status]}
          word={wordOf[entry.status]}
          glyph={entry.status === "outage" ? "scan" : undefined}
        />
      </div>
    );
  }

  function WhoIsInCard({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    const roster = STAFF
      .map((s) => Object.assign({ staff: s }, s.pattern[TODAY_ISO] || { status: "off" }))
      .sort((a, b) => (TODAY_RANK[a.status] - TODAY_RANK[b.status]) || a.staff.name.localeCompare(b.staff.name));

    const n = (st) => roster.filter((r) => r.status === st).length;
    const inSchool = n("present") + n("late");
    const unit = t("dh.m.of", { n: num(STAFF.length) });
    const frac = (v) => (STAFF.length ? v / STAFF.length : 0);
    const remote = roster.filter((r) =>
      (r.status === "present" || r.status === "late") && REMOTE_MARK[r.staff.verify]).length;

    const wordOf = {
      present: t("att.stPresent"), late: t("att.stLate"), absent: t("att2.stAbsent"),
      leave: t("att.stLeave"), missing: t("att2.stMissing"), outage: t("dh3.stOutage"), off: t("att.stOff"),
    };

    /* the roll as a shape, in the chart ramp — a missing punch keeps
       its own slice, because the person may well have been here */
    const slices = [
      { key: "present", role: "present", value: n("present"), word: t("att.stPresent") },
      { key: "late", role: "late", value: n("late"), word: t("att.stLate") },
      { key: "absent", role: "absent", value: n("absent"), word: t("att2.stAbsent") },
      { key: "missing", role: "missing", value: n("missing") + n("outage"), word: t("att2.stMissing") },
      { key: "leave", role: "leave", value: n("leave"), word: t("att.stLeave") },
    ].filter((x) => x.value > 0);
    const segments = slices.map((x) => ({ key: x.key, value: x.value, color: c[x.role + "Chart"] || c[x.role] }));
    const donutLabel = slices.map((x) => num(x.value) + " " + x.word).join(", ");

    const attention = roster.filter((r) => r.status !== "present" && r.status !== "off");
    const rest = roster.filter((r) => r.status === "present" || r.status === "off");

    /* the month, from the same day-by-day patterns DH-03 draws */
    const tally = { present: 0, late: 0, absent: 0, missing: 0 };
    STAFF.forEach((s) => {
      Object.keys(s.pattern).forEach((iso) => {
        const st = s.pattern[iso].status;
        const key = st === "outage" ? "missing" : st;
        if (tally[key] != null) tally[key] += 1;
      });
    });
    const monthRows = [
      { key: "present", role: "present", v: tally.present },
      { key: "late", role: "late", v: tally.late },
      { key: "absent", role: "absent", v: tally.absent },
      { key: "missing", role: "missing", v: tally.missing },
    ];

    /* TWO BOXES, BECAUSE THERE ARE TWO QUESTIONS. The band answers how
       much of the department is in: a mix across the top and the
       month-so-far figures under it. The names answer WHO, and one of
       the two lists is work — so they leave the band and take a box of
       their own, built from different parts (no bar, no meters, a
       vertical rule between the halves, and a tint on the half that
       wants her). Inside one border the two jobs ran together and a
       reader falling out of the figures into a list of people had no
       boundary to stop at. */
    return (
      <React.Fragment>
      {/* TWO QUESTIONS, TWO SENTENCES. The band this replaced put one
          figure about THIS MORNING beside four about the month, drew a
          bar across the four, and then needed a line at the foot to
          explain which was which. The morning is now one line of
          figures over its own bar — five states that cannot overlap,
          and the ratio past a rule, because "6/9" counts the same
          people the bar has already counted. The month follows in
          words under a rule, and needs no sentence saying where it
          came from. */}
      <Card
        pad={20}
        style={{ marginBottom: G3.layout.gap }}
        action={
          <LinkButton onClick={() => onNavigate("dhAttendance")}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              {t("dh1.today.open")}
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="arrow" size={14} /></span>
            </span>
          </LinkButton>
        }
      >
        <FigureBlocks
          style={{ marginTop: 2 }}
          items={[
            { k: "present", label: wordOf.present, value: n("present"), unit: unit,
              frac: frac(n("present")), tone: c.present,
              note: remote ? t("dh.n.remote", { n: num(remote) }) : t("dh.n.atGate") },
            { k: "late", label: wordOf.late, value: n("late"), unit: unit,
              frac: frac(n("late")), tone: c.late, warn: n("late") > 0,
              note: whoOf(t, roster, function (r) { return r.status === "late"; }) },
            { k: "leave", label: wordOf.leave, value: n("leave"), unit: unit,
              frac: frac(n("leave")), tone: c.leave,
              note: whoOf(t, roster, function (r) { return r.status === "leave"; }) },
            { k: "absent", label: wordOf.absent, value: n("absent"), unit: unit,
              frac: frac(n("absent")), tone: c.absent, warn: n("absent") > 0,
              note: whoOf(t, roster, function (r) { return r.status === "absent"; }) },
            { k: "missing", label: wordOf.missing, value: n("missing") + n("outage"), unit: unit,
              frac: frac(n("missing") + n("outage")), tone: c.missing,
              warn: n("missing") + n("outage") > 0,
              note: whoOf(t, roster, function (r) { return r.status === "missing" || r.status === "outage"; }) },
          ]}
        />
        <div style={{
          borderTop: "1px solid " + c.rule, marginTop: 18, paddingTop: 14,
          display: "flex", alignItems: "center", gap: "8px 20px", flexWrap: "wrap",
        }}>
          <span style={ty("caption", { color: c.ink, fontWeight: 700 })}>{t("dh1.month.title")}</span>
          {monthRows.map(function (m) {
            return (
              <span key={m.key} style={ty("small", { color: c.inkMuted, display: "inline-flex", alignItems: "center", gap: 7 })}>
                <span aria-hidden="true" style={{
                  width: 7, height: 7, borderRadius: G3.r.pill, flexShrink: 0,
                  background: c[m.role + "Chart"] || c[m.role],
                }} />
                <span style={{ color: c.ink, fontWeight: 700 }}>{num(m.v)}</span>
                {t("dh1.month." + m.key)}
              </span>
            );
          })}
        </div>
      </Card>

      <Split
        head={t("dh1.roll.head")} sub={t("dh1.roll.sub")}
        foot={t("dh1.roll.foot")}
        sides={[
          {
            key: "attn", label: t("dh1.who.attn"), count: attention.length,
            urgent: attention.length > 0,
            tone: c.lateText, tint: c.lateTint,
            verdict: attention.length ? t("dh1.roll.attnWhy") : t("dh1.roll.attnClear"),
            empty: t("dh1.who.attnNone"),
            children: attention.length
              ? attention.map(function (r, i) {
                return <RosterRow key={r.staff.id} entry={r} first={i === 0} wordOf={wordOf} />;
              })
              : null,
          },
          {
            key: "rest", label: t("dh1.who.rest"), count: rest.length,
            verdict: rest.length ? t("dh1.roll.restWhy") : t("dh1.roll.restNone"),
            empty: t("dh1.who.restNone"),
            children: rest.length
              ? rest.map(function (r, i) {
                return <RosterRow key={r.staff.id} entry={r} first={i === 0} wordOf={wordOf} />;
              })
              : null,
          },
        ]}
      />
      </React.Fragment>
    );
  }

  /* ---- 3a · the queue, as the requests themselves ----
     A tile saying "6" tells her the size of the job; the names, dates
     and the one with a declined cover tell her whether to open it now.
     The rows are read from window.LeaveFlow, so they are the same
     requests DH-02 decides. */
  function WaitingCard({ reqs, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const mine = reqs.filter((r) => r.person.deptKey === MY_DEPT_HOME && r.who !== "anjali" && LFH.isWaitingOn(r, "deptHead"));
    /* three, then a count: a home card shows enough to decide
       whether to open the queue, not the queue itself */
    const shown = mine.slice(0, 3);
    const blocked = mine.filter((r) => LFH.coverState(r) === "declined").length;

    return (
      <Card
        icon="leave" iconTone="leave"
        title={t("dh1.queue.leave.title")}
        sub={mine.length ? t("dh1.wait.sub", { n: num(mine.length) }) : t("dh1.wait.noneSub")}
      >
        {mine.length === 0 ? (
          <EmptyState compact head={t("dh1.wait.noneHead")} body={t("dh1.wait.noneBody")} />
        ) : (
          <React.Fragment>
            {blocked ? (
              <p style={ty("caption", { color: c.lateText, fontWeight: 700, margin: "-4px 0 12px" })}>
                {t("dh1.queue.leave.subCover", { n: num(blocked) })}
              </p>
            ) : null}
            <div>
              {shown.map((r, i) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(r.person.nameKey)}</div>
                    <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>
                      {LFH.fmtRange(t, r.from, r.to)} · {LFH.daysWord(t, r.days, r.half)} · {t(LFH.typeOf(r.type).key)}
                    </div>
                    <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>
                      {/* a request applied this morning has not "waited 0 days" */}
                      {LFH.ageOf(r) === 0
                        ? t("dh1.wait.today")
                        : LFH.ageOf(r) === 1
                          ? t("dh1.wait.oneDay")
                          : t("dh1.wait.waited", { n: num(LFH.ageOf(r)) })}
                    </div>
                  </div>
                  {LFH.coverState(r) === "declined"
                    ? <StatusMark role="late" glyph="alert" word={t("lf.flag.coverGone")} />
                    : <LFH.FlagChips req={r} />}
                </div>
              ))}
            </div>
            {mine.length > shown.length ? (
              <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0" })}>{t("dh1.wait.more", { n: num(mine.length - shown.length) })}</p>
            ) : null}
          </React.Fragment>
        )}
        <div style={{ marginTop: 16 }}>
          <Button kind="primary" full iconRight="arrow" onClick={() => onNavigate("dhLeave")}>{t("dh1.wait.open")}</Button>
        </div>
      </Card>
    );
  }

  /* ---- 3c · who is away, and who is holding their classes ----
     Today comes from the attendance roll; what is coming up comes from
     the shared leave queue, so an approval on DH-02 changes this card. */
  function AwayCard({ reqs, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const today = STAFF.filter((s) => (s.pattern[TODAY_ISO] || {}).status === "leave");
    const coming = reqs
      .filter((r) => r.person.deptKey === MY_DEPT_HOME && LFH.statusOf(r) === "approved" && r.from > TODAY_ISO)
      .sort((a, b) => (a.from < b.from ? -1 : 1))
      .slice(0, 3);

    function coverNote(r) {
      const line = LFH.coverLine(t, r);
      return line ? t("dh1.away.cover", { line: line }) : t("dh1.away.noCover");
    }

    return (
      <Card icon="leave" iconTone="leave" title={t("dh1.away.title")}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("dh1.away.today")}</div>
        {today.length === 0 ? (
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 4px" })}>{t("dh1.away.noneToday")}</p>
        ) : (
          <div>
            {today.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                <PersonLine staff={s} />
                <StatusMark role="leave" word={t("att.stLeave")} />
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("dh1.away.coming")}</div>
          {coming.length === 0 ? (
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("dh1.away.noneComing")}</p>
          ) : (
            <div>
              {coming.map((r, i) => (
                <div key={r.id} style={{ padding: "10px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                    <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(r.person.nameKey)}</span>
                    <span style={G3.fig("xs", { color: c.inkMuted, whiteSpace: "nowrap" })}>{LFH.fmtRange(t, r.from, r.to)}</span>
                  </div>
                  <div style={ty("caption", { color: c.inkMuted, marginTop: 3 })}>{coverNote(r)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }

  /* her own leave, in one card — the rest lives on DH-02's second tab */
  function MyLeaveCard({ reqs, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const LFx = window.LeaveFlow;
    const mine = reqs.filter((r) => r.who === "anjali");
    const live = mine.filter((r) => LFx.statusOf(r) === "pending");
    return (
      <Card
        icon="leave" iconTone="leave"
        title={t("dh1.mine.title")} sub={t("dh1.mine.sub", { name: t("lf.n.radhika") })}
      >
        {live.length === 0 ? (
          <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("dh1.mine.none")}</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {live.map((r) => (
              <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={ty("small", { color: c.ink, fontWeight: 600 })}>{LFx.fmtRange(t, r.from, r.to)}</div>
                  <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>{LFx.daysWord(t, r.days, r.half)} · {t(LFx.typeOf(r.type).key)}</div>
                </div>
                <div style={{ flexShrink: 0 }}><LFx.StageChip req={r} /></div>
              </div>
            ))}
          </div>
        )}
        {/* the action sits with the record, not squeezed into a heading
            that already carries two lines of rule */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <Button kind="secondary" size="sm" iconLeft="leave" onClick={() => onNavigate("leave")}>{t("dh2b.own.apply")}</Button>
          <LinkButton onClick={() => onNavigate("dhLeave")}>{t("dh1.mine.all")}</LinkButton>
        </div>
      </Card>
    );
  }

  function DHHome({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const reqs = window.LeaveFlow.useRequests();
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "deptHead"} active="dhHome" onNavigate={onNavigate} initials="AD" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.dhHome")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            {/* head: who she is, which department, what day — the scope
                chip stays visible on every screen (O7), it just no
                longer takes a line of its own above the title */}
            <div style={{ marginBottom: G3.layout.gap }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("dh1.pageTitle")}</h1>
              <p style={ty("body", { margin: "7px 0 0", color: c.inkMuted })}>
                {t("dh.identity")}
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                {t("dh1.today", { date: dayLabel(t, TODAY_ISO) })}
              </p>
              <div style={{ marginTop: 10 }}><ScopeBanner /></div>
            </div>

            <WhoIsInCard onNavigate={onNavigate} />

            {/* three columns of two: what is waiting on her decision ·
                her department's people · herself and the paperwork.
                Paired so the columns finish near each other instead of
                one trailing 400px past the others. */}
            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", marginTop: L.gap }}>
              <div style={{ flex: "1.2 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                <WaitingCard reqs={reqs} onNavigate={onNavigate} />
              </div>
              {/* her department's people, then her own leave */}
              <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                <AwayCard reqs={reqs} onNavigate={onNavigate} />
                <MyLeaveCard reqs={reqs} onNavigate={onNavigate} />
              </div>
              {/* the dates ahead: the school's, then her team's */}
              <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                {window.NaveyaHolidays && window.NaveyaHolidays.Card
                  ? React.createElement(window.NaveyaHolidays.Card, { onOpen: () => onNavigate("dhAttendance") })
                  : null}
                {window.LeaveFlow.CelebrationsCard
                  ? React.createElement(window.LeaveFlow.CelebrationsCard, { deptKey: "science", excludeId: "anjali" })
                  : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     DH-02 — LEAVE
     Two jobs on one screen, and they are not the same job:

       YOUR TEAM      — she is the FIRST rung of the chain for every
                        person in Science. Up to 3 days her answer
                        ends it; longer and her approval only moves
                        it on to the principal (and past 15 days, to
                        the director). The chain is drawn on every
                        request so "approved" is never mistaken for
                        "settled".
       YOUR OWN LEAVE — she is also a teacher who takes leave. Her
                        own requests go UP: the principal decides
                        them, the director signs the long ones. She
                        can never appear in her own approval queue,
                        because window.LeaveFlow starts a head's
                        chain one rung above her.

     The queue itself lives in window.LeaveFlow, so the moment she
     approves, the principal's screen has it.
     ============================================================ */
  const LF = window.LeaveFlow;
  const ME_ID = "anjali";
  const MY_DEPT = "science";

  /* the store's people and this file's attendance STAFF grew up on
     different screens; one map keeps the balance ledger joinable
     without renaming either side */
  const BAL_ID = { meeraj: "meera" };
  function balanceStaff(req) { return staffById(BAL_ID[req.who] || req.who) || null; }

  /* what the balance says about this request — null when the person
     is not on this screen's attendance roll, in which case the block
     is not drawn at all rather than drawn empty */
  function ledgerView(req) {
    const staff = balanceStaff(req);
    if (!staff) return null;
    const bucket = staff.balances[req.type];
    if (!bucket) return null;
    const bal = bucket.opening + bucket.accrued - bucket.used;
    const paid = Math.min(req.days, bal);
    const short = Math.max(0, req.days - bal);
    return { staff: staff, bucket: bucket, bal: bal, paid: paid, short: short, lop: short * (staff.monthlyGross / 30), after: bal - paid };
  }

  /* what stops her approving. Every one of these is a rule she does
     not hold: cover is the teacher's to arrange, a closed month is
     payroll's, a blocked window is the campus calendar's. */
  function blockFor(t, req) {
    if (LF.coverState(req) === "declined") return t("dh2b.act.whyCoverGone", { name: t(LF.personById(req.coverWith.who).nameKey) });
    if (req.lockedMonth) return t("dh2.act.whyLocked", { mon: monthName(t, req.from) });
    return null;
  }
  function warnFor(t, req) {
    if (req.blackoutKey) return t("dh2b.d.warnBlackout", { name: t(req.blackoutKey), dates: t(req.blackoutKey + "d") });
    return null;
  }

  const TEAM_FILTERS = [
    { key: "mine", label: "dh2b.f.mine" },
    { key: "moved", label: "dh2b.f.moved" },
    { key: "decided", label: "dh2b.f.decided" },
    { key: "all", label: "dh2b.f.all" },
  ];
  function teamMatches(r, key) {
    const st = LF.statusOf(r);
    if (key === "mine") return LF.isWaitingOn(r, "deptHead");
    if (key === "moved") return st === "pending" && LF.hasSeen(r, "deptHead");
    if (key === "decided") return st !== "pending";
    return true;
  }

  function Toast({ text, onClose }) {
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
        <LinkButton onDark onClick={onClose}>{t("dh2b.toast.close")}</LinkButton>
      </div>,
      document.body
    );
  }

  /* ---------- the team's request, opened ----------
     Four labelled lines and a trail. What went: the section headings
     over one-line answers, the ledger paragraph (opening + accrued −
     taken, which nobody reconciles from a side panel), and the
     repeated "who else is away" prose. Nothing it said is lost — it
     is said in a line instead of a block. */
  function TeamDetail({ req, onDone }) {
    const { c } = useTheme();
    const { t } = useLang();
    const [infoOpen, setInfoOpen] = useState(false);
    const [infoNote, setInfoNote] = useState("");
    const [infoSent, setInfoSent] = useState(false);

    if (!req) return <LF.RequestPanel req={null} />;

    const view = ledgerView(req);
    const block = blockFor(t, req);
    const cover = req.coverWith ? LF.personById(req.coverWith.who) : null;
    /* who ELSE in Science is out in the same window — the one fact a
       head cannot get from the request itself */
    const clash = LF.all().filter((x) =>
      x.id !== req.id && x.person.deptKey === MY_DEPT &&
      LF.statusOf(x) !== "rejected" && LF.statusOf(x) !== "cancelled" &&
      x.from <= req.to && x.to >= req.from);

    const facts = [
      { k: t("lf.fact.cover"), v: cover ? LF.coverLine(t, req) : t("lf.fact.coverNone"), tone: LF.coverState(req) === "declined" ? "absentText" : null },
      clash.length ? { k: t("lf.fact.away"), v: LF.awayText(t, clash) } : null,
      view ? { k: t("lf.fact.balance"), v: t("dh2b.fact.bal", { bal: days(view.bal), type: t(LF.typeOf(req.type).key).toLowerCase(), n: days(req.days) }) } : null,
      view && view.short > 0 ? { k: t("lf.fact.unpaid"), v: t("dh2b.fact.unpaid", { n: days(view.short), amt: inr(view.lop), mon: monthName(t, req.from) }), tone: "penaltyText" } : null,
    ];

    const decision = (
      <div>
        <LF.DecisionBox req={req} you="deptHead" blocked={block} warn={warnFor(t, req)} onDone={onDone} />
        {LF.isWaitingOn(req, "deptHead") ? (
          <div style={{ marginTop: 12 }}>
            {infoOpen ? (
              <div style={{ background: c.raised, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: 14 }}>
                <Field id={"dh2-info-" + req.id} label={t("dh2.moreinfo.label")}>
                  <Input id={"dh2-info-" + req.id} value={infoNote} onChange={setInfoNote} placeholder={t("dh2.moreinfo.ph")} />
                </Field>
                <div style={{ display: "flex", gap: 10 }}>
                  <Button kind="secondary" size="sm" disabled={!infoNote.trim()} onClick={() => { setInfoSent(true); setInfoOpen(false); }}>{t("dh2.moreinfo.send")}</Button>
                  <Button kind="ghost" size="sm" onClick={() => setInfoOpen(false)}>{t("dh2.note.cancel")}</Button>
                </div>
              </div>
            ) : (
              <LinkButton onClick={() => setInfoOpen(true)}>{t("dh2.act.moreInfo")}</LinkButton>
            )}
            {infoSent ? <p style={{ margin: "8px 0 0" }}><span style={{ color: c.inkMuted }}>{t("dh2.moreinfo.sent", { name: t(req.person.nameKey) })}</span></p> : null}
          </div>
        ) : null}
      </div>
    );

    return <LF.RequestPanel req={req} you="deptHead" facts={facts} decision={decision} />;
  }

  /* ---------- her own request, opened ---------- */
  function OwnDetail({ req, onWithdraw }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [confirm, setConfirm] = useState(false);
    if (!req) return <LF.RequestPanel req={null} />;

    const pending = LF.statusOf(req) === "pending";
    const cur = LF.currentStage(req);
    const cover = req.coverWith ? LF.personById(req.coverWith.who) : null;
    const facts = [
      cover ? { k: t("lf.fact.cover"), v: t(cover.nameKey) } : null,
      req.shortDays ? { k: t("lf.fact.unpaid"), v: LF.unpaidText(t, req.shortDays), tone: "penaltyText" } : null,
    ];

    const decision = (
      <div>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 12px" })}>
          {pending && cur
            ? t("dh2b.own.waiting", { name: t(cur.holderNameKey), rule: t(LF.ruleKeyForApplicant(req.person, req.days)) })
            : t("dh2b.own.settled")}
        </p>
        {pending ? (
          confirm ? (
            <div style={{ background: c.raised, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: 14 }}>
              <p style={ty("small", { color: c.ink, margin: "0 0 11px", fontWeight: 600 })}>{t("dh2b.own.withdrawAsk")}</p>
              <div style={{ display: "flex", gap: 10 }}>
                <Button kind="primary" size="sm" onClick={() => { onWithdraw(req.id); setConfirm(false); }}>{t("dh2b.own.withdrawYes")}</Button>
                <Button kind="ghost" size="sm" onClick={() => setConfirm(false)}>{t("dh2.note.cancel")}</Button>
              </div>
            </div>
          ) : (
            <Button kind="ghost" size="sm" onClick={() => setConfirm(true)}>{t("dh2b.own.withdraw")}</Button>
          )
        ) : null}
      </div>
    );

    return <LF.RequestPanel req={req} you="applicant" facts={facts} decision={decision} sub={t("dh2b.own.subOwn")} />;
  }

  function DHLeave({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const reqs = LF.useRequests();

    const [tab, setTab] = useState("team");
    const [filter, setFilter] = useState("mine");
    const [typeFilter, setTypeFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [teamId, setTeamId] = useState(null);
    const [ownId, setOwnId] = useState(null);
    const [toast, setToast] = useState(null);

    /* her department, minus herself — a head never decides her own */
    const team = reqs.filter((r) => r.person.deptKey === MY_DEPT && r.who !== ME_ID);
    const mine = reqs.filter((r) => r.who === ME_ID);
    /* the balances card counts days held by PENDING requests, so it is
       handed her own queue in the shape it reads */
    const ownRequests = mine.map((r) => ({ type: r.type, days: r.days, status: LF.statusOf(r) }));
    const waiting = team.filter((r) => LF.isWaitingOn(r, "deptHead"));
    const movedList = team.filter((r) => teamMatches(r, "moved"));
    const decidedList = team.filter((r) => teamMatches(r, "decided"));
    const outcomeLine = (function () {
      const by = { approved: 0, rejected: 0, cancelled: 0 };
      decidedList.forEach((r) => { const st = LF.statusOf(r); if (by[st] != null) by[st] += 1; });
      const parts = [];
      if (by.approved) parts.push(t("dh2b.n.ap", { n: num(by.approved) }));
      if (by.rejected) parts.push(t("dh2b.n.no", { n: num(by.rejected) }));
      if (by.cancelled) parts.push(t("dh2b.n.wd", { n: num(by.cancelled) }));
      return parts.join(", ");
    })();
    const daysWaiting = waiting.reduce((n, r) => n + (r.days || 0), 0);
    const daysAll = team.reduce((n, r) => n + (r.days || 0), 0);
    const longest = waiting.slice().sort((a, b) => (b.days || 0) - (a.days || 0))[0] || null;
    const reqUnit = t("dh.m.of", { n: num(team.length) });
    const reqFrac = (v) => (team.length ? v / team.length : 0);

    const teamRows = team
      .filter((r) => teamMatches(r, filter))
      .filter((r) => typeFilter === "all" || r.type === typeFilter)
      .filter((r) => !search.trim() || t(r.person.nameKey).toLowerCase().indexOf(search.trim().toLowerCase()) !== -1)
      .sort((a, b) => {
        const pa = LF.isWaitingOn(a, "deptHead"), pb = LF.isWaitingOn(b, "deptHead");
        if (pa !== pb) return pa ? -1 : 1;
        return LF.ageOf(b) - LF.ageOf(a);
      });

    const teamPick = teamId ? team.filter((r) => r.id === teamId)[0] : null;
    const teamShown = teamPick && teamRows.some((r) => r.id === teamPick.id) ? teamPick : (teamRows[0] || null);
    const ownPick = ownId ? mine.filter((r) => r.id === ownId)[0] : null;
    const ownShown = ownPick || mine[0] || null;

    const chips = (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <PillGroup
          ariaLabel={t("dh2.f.aria")} value={filter} onChange={setFilter}
          items={TEAM_FILTERS.map((f) => ({ key: f.key, label: t(f.label), count: team.filter((r) => teamMatches(r, f.key)).length }))}
        />
        <div style={{ minWidth: 150 }}>
          <Select id="dh2-type" size="sm" value={typeFilter} onChange={setTypeFilter}
            options={[{ value: "all", label: t("dh2.type.all") }].concat(["CL", "SL", "COMP", "EL"].map((k) => ({ value: k, label: t(LF.typeOf(k).key) })))} />
        </div>
        <div style={{ minWidth: 180 }}>
          <Input id="dh2-search" size="sm" value={search} onChange={setSearch} placeholder={t("dh2.search.ph")} />
        </div>
      </div>
    );

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "deptHead"} active="dhLeave" onNavigate={onNavigate} initials="AD" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.dhLeave")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            <div style={{ marginBottom: 8 }}><ScopeBanner /></div>
            <div style={{ marginBottom: 18 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("dh2.pageTitle")}</h1>
            </div>

            <div style={{ marginBottom: 18 }}>
              <Tabs
                ariaLabel={t("dh2b.tabs")} idBase="dh2-tabs" active={tab} onChange={setTab}
                items={[
                  { key: "team", label: t("dh2b.tab.team") + " · " + num(waiting.length) },
                  { key: "own", label: t("dh2b.tab.own") + " · " + num(mine.length) },
                ]}
              />
            </div>

            {tab === "team" ? (
              <div>
                <Card
                  pad={20}
                  style={{ marginBottom: L.gap }}
                >
                  {/* THE LINE UNDER A FIGURE NAMES SOMEBODY. "Nobody
                      else can move these along" explains what "waiting
                      on you" means, which the label already said;
                      "Karan Mehta, Meera Joshi" is the thing she
                      cannot read off the figure. */}
                  <FigureBlocks
                    style={{ marginTop: 2 }}
                    items={[
                      { k: "mine", label: t("dh2b.m.mine"), value: waiting.length, unit: reqUnit,
                        frac: reqFrac(waiting.length), tone: c.chartAmber, warn: waiting.length > 0,
                        note: nameLine(t, waiting.map(function (r) { return t(r.person.nameKey); }), t("dh2b.n.clear")) },
                      { k: "days", label: t("dh2b.m.days"), value: daysWaiting, unit: t("dh2b.m.daysUnit"),
                        frac: daysAll ? daysWaiting / daysAll : 0, tone: c.chartTeal,
                        note: longest
                          ? t("dh2b.n.longest", { n: num(longest.days), who: t(longest.person.nameKey) })
                          : t("dh2b.n.clear") },
                      { k: "moved", label: t("dh2b.m.moved"), value: movedList.length, unit: reqUnit,
                        frac: reqFrac(movedList.length), tone: c.chartBlue,
                        note: nameLine(t, movedList.map(function (r) { return t(r.person.nameKey); }), t("dh2b.n.withThem")) },
                      { k: "decided", label: t("dh2b.m.decided"), value: decidedList.length, unit: reqUnit,
                        frac: reqFrac(decidedList.length), tone: c.chartGreen,
                        note: decidedList.length ? outcomeLine : t("dh2b.n.none") },
                    ]}
                  />
                  {/* the rule that governs everything above it — what
                      her signature actually ends */}
                  <div style={{ borderTop: "1px solid " + c.rule, marginTop: 20, paddingTop: 13 }}>
                    <span style={ty("caption", { color: c.inkFaint })}>{t("dh2b.rule")}</span>
                  </div>
                </Card>
                <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
                  <LF.QueueTable
                    title={t("dh2b.team.title")}
                    sub={t("dh2b.team.sub", { n: num(waiting.length) })}
                    chips={chips}
                    rows={teamRows} selected={teamShown ? teamShown.id : null} onSelect={setTeamId}
                    you="deptHead"
                    emptyHead={filter === "mine" ? t("dh2b.empty.mineHead") : undefined}
                    emptyBody={filter === "mine" ? t("dh2b.empty.mineBody") : undefined}
                  />
                  <TeamDetail req={teamShown} onDone={(outcome, message) => setToast(message)} />
                </div>
              </div>
            ) : (
              <div>
                <p style={ty("small", { color: c.inkMuted, margin: "0 0 14px", maxWidth: 760 })}>{t("dh2b.own.rule", { name: t("lf.n.radhika") })}</p>
                {window.NaveyaLeave && window.NaveyaLeave.Balances ? (
                  <div style={{ marginBottom: L.gap }}>
                    {React.createElement(window.NaveyaLeave.Balances, { role: "deptHead", requests: ownRequests })}
                  </div>
                ) : null}
                <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
                  <LF.QueueTable
                    title={t("dh2b.own.title")}
                    sub={t("dh2b.own.sub")}
                    action={<Button kind="secondary" size="sm" iconLeft="leave" onClick={() => onNavigate("leave")}>{t("dh2b.own.apply")}</Button>}
                    rows={mine} selected={ownShown ? ownShown.id : null} onSelect={setOwnId}
                    hideWho
                    emptyHead={t("dh2b.own.emptyHead")} emptyBody={t("dh2b.own.emptyBody")}
                  />
                  <OwnDetail
                    req={ownShown}
                    onWithdraw={(id) => { LF.withdraw(id, "lf.n.anjali"); setToast(t("dh2b.own.withdrawn", { id: id })); }}
                  />
                </div>
              </div>
            )}
          </div>
        </main>

        <Toast text={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  /* ============================================================
     DH-03 — Department attendance
     ============================================================ */
  /* the day, before the register of it. Counted from the same
     day-by-day record the table draws, so the two cannot disagree. */
  function DayBand({ dateIso }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const people = STAFF.map(function (x) {
      return Object.assign({ staff: x, exceptions: exceptionsOf(x) }, x.pattern[dateIso] || { status: "off" });
    });
    const n = function (st) { return people.filter(function (p) { return p.status === st; }).length; };
    const present = n("present"), late = n("late"), absent = n("absent");
    const leave = n("leave");
    const exceptions = people.reduce(function (m, p) { return m + (p.exceptions || 0); }, 0);
    const unit = t("dh.m.of", { n: num(people.length) });
    const frac = function (v) { return people.length ? v / people.length : 0; };
    const withExc = people.filter(function (p) { return (p.exceptions || 0) > 0; }).length;
    return (
      <Card
        pad={20}
        style={{ marginBottom: G3.layout.gap }}
      >
        {/* EXCEPTIONS IS NOT A STATE. It counts events rather than
            people and overlaps the columns beside it, so its dot is
            hollow and its meter is read against the department rather
            than as a share of it. The register underneath is where the
            day is read; this is the ledger over it. */}
        <FigureBlocks
          style={{ marginTop: 2 }}
          items={[
            { k: "in", label: t("dh3.m.in"), text: num(present + late), unit: unit,
              frac: frac(present + late), tone: c.present,
              note: t("dh3.n.inSplit", { p: num(present), l: num(late) }) },
            { k: "late", label: t("dh3.f.late"), value: late, unit: unit,
              frac: frac(late), tone: c.late, warn: late > 0,
              note: whoOf(t, people, function (p) { return p.status === "late"; }) },
            { k: "leave", label: t("att.stLeave"), value: leave, unit: unit,
              frac: frac(leave), tone: c.leave,
              note: whoOf(t, people, function (p) { return p.status === "leave"; }) },
            { k: "absent", label: t("dh3.f.absent"), value: absent, unit: unit,
              frac: frac(absent), tone: c.absent, warn: absent > 0,
              note: whoOf(t, people, function (p) { return p.status === "absent"; }) },
            { k: "exc", label: t("dh3.m.exc"), value: exceptions, unit: t("dh3.n.toClear"),
              frac: frac(withExc), tone: c.chartRed, warn: exceptions > 0, hollow: true,
              note: whoOf(t, people, function (p) { return (p.exceptions || 0) > 0; }) },
          ]}
        />
        <div style={{ borderTop: "1px solid " + c.rule, marginTop: 18, paddingTop: 13 }}>
          <span style={ty("caption", { color: c.inkFaint })}>{t("dh3.band.foot")}</span>
        </div>
      </Card>
    );
  }

  const DH3_STATUS_FILTERS = [
    { key: "all", label: "dh3.f.all" },
    { key: "present", label: "dh3.f.present" },
    { key: "late", label: "dh3.f.late" },
    { key: "absent", label: "dh3.f.absent" },
    { key: "leave", label: "dh3.f.leave" },
    { key: "exceptions", label: "dh3.f.exceptions" },
  ];

  function statusWordFor(t, st) {
    if (st === "present") return t("att.stPresent");
    if (st === "late") return t("att.stLate");
    if (st === "leave") return t("att.stLeave");
    if (st === "off") return t("att.stOff");
    if (st === "outage") return t("dh3.stOutage");
    if (st === "missing") return t("att2.stMissing");
    return t("att2.stAbsent");
  }
  const DH3_ROLE = { present: "present", late: "late", leave: "leave", off: "off", outage: "missing", missing: "missing", absent: "absent" };

  function fmtDate(t, iso) {
    const d = parseISO(iso);
    return t("att.d" + d.getDay()) + " " + d.getDate() + " " + t("lv.mon." + (d.getMonth() + 1));
  }

  function TodayRegister({ dateIso, statusFilter, setStatusFilter, shiftFilter, setShiftFilter, selectedId, onSelect }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    const wd = parseISO(dateIso).getDay();
    const dayNum = Number(dateIso.split("-")[2]);
    const future = dayNum > 11;

    if (wd === 0 && !future) {
      return (
        <Card title={t("dh3.pageTitle")} sub={fmtDate(t, dateIso)}>
          <EmptyState compact head={t("dh3.holiday.head")} body={t("dh3.holiday.body")} art={<span aria-hidden="true" style={{ display: "flex" }}><Icon name="festival" size={38} /></span>} />
        </Card>
      );
    }
    if (future) {
      return (
        <Card title={t("dh3.pageTitle")} sub={fmtDate(t, dateIso)}>
          <EmptyState compact head={t("dh3.day.future.head")} body={t("dh3.day.future.body")} />
        </Card>
      );
    }

    let people = STAFF.map((s) => Object.assign({ staff: s, exceptions: exceptionsOf(s) }, s.pattern[dateIso] || { status: "off" }));
    if (shiftFilter !== "all") people = people.filter((p) => p.staff.shift === shiftFilter);
    if (statusFilter === "exceptions") people = people.filter((p) => p.status === "missing" || (p.status === "absent" && dateIso === TODAY_ISO));
    else if (statusFilter !== "all") people = people.filter((p) => p.status === statusFilter);

    const chips = (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <PillGroup ariaLabel={t("dh3.f.aria")} value={statusFilter} onChange={setStatusFilter} items={DH3_STATUS_FILTERS.map((f) => ({ key: f.key, label: t(f.label) }))} />
        <div style={{ minWidth: 150 }}>
          <Select
            id="dh3-shift" size="sm" value={shiftFilter} onChange={setShiftFilter}
            options={[{ value: "all", label: t("dh3.shift.all") }, { value: "morning", label: t("dh3.shift.morning") }, { value: "day", label: t("dh3.shift.day") }]}
          />
        </div>
      </div>
    );

    if (!people.length) {
      return (
        <Card title={t("dh3.pageTitle")} sub={fmtDate(t, dateIso)}>
          <div style={{ marginBottom: 18 }}>{chips}</div>
          <EmptyState head={t("dh3.empty.head")} body={t("dh3.empty.body")} />
        </Card>
      );
    }

    const columns = [
      { key: "teacher", label: t("dh3.col.teacher") },
      { key: "shift", label: t("dh3.col.shift") },
      { key: "status", label: t("dh3.col.status") },
      { key: "intime", label: t("dh3.col.intime"), mono: true, width: 68 },
      { key: "outtime", label: t("dh3.col.outtime"), mono: true, width: 72 },
      { key: "verify", label: t("dh3.col.verify") },
      { key: "exceptions", label: t("dh3.col.exceptions"), width: 90 },
      { key: "more", label: t("dh3.col.more"), align: "right", width: 50 },
    ];

    return (
      <Register
        title={t("dh3.pageTitle")} sub={fmtDate(t, dateIso)} chips={chips} columns={columns}
        onSelect={onSelect}
        rows={people.map((p) => ({
          id: p.staff.id,
          highlight: p.staff.id === selectedId,
          cells: {
            teacher: <PersonLine staff={p.staff} />,
            shift: <span style={ty("small", { color: c.inkMuted })}>{t(p.staff.shift === "morning" ? "dh3.shift.morningRange" : "dh3.shift.dayRange")}</span>,
            status: <StatusMark role={DH3_ROLE[p.status]} glyph={p.status === "outage" ? "scan" : undefined} word={statusWordFor(t, p.status)} />,
            intime: p.inTime || "—",
            /* an out-time belongs to a day somebody actually worked — a
               generated one must not leak onto leave or an absence */
            outtime: (p.status === "present" || p.status === "late")
              ? (p.outTime || t("dh3.col.stillIn"))
              : "—",
            verify: p.status === "present" || p.status === "late" ? <VerifyChip kind={p.staff.verify} /> : "—",
            exceptions: p.exceptions > 0 ? (
              <Button kind="quiet" size="sm" onClick={() => onSelect && onSelect(p.staff.id)} aria-label={t("dh3.exceptions.aria", { n: num(p.exceptions), name: staffName(t, p.staff) })}>
                {t("dh3.exceptions.n", { n: num(p.exceptions) })}
              </Button>
            ) : <span style={ty("caption", { color: c.inkFaint })}>{t("dh3.exceptions.none")}</span>,
            more: (
              <ActionMenu
                ariaLabel={t("dh3.menuAria", { name: staffName(t, p.staff) })}
                items={[
                  { key: "review", icon: "leave", label: t("dh3.act.reviewExceptions"), disabled: p.exceptions === 0, reason: p.exceptions === 0 ? t("dh3.act.reviewExceptionsWhy") : undefined },
                ]}
              />
            ),
          },
        }))}
      />
    );
  }

  /* the person's month grid — 7-column calendar, only "missing" cells
     are actionable (the only day a regularisation flag makes sense).
     monthOffset: 0 = August (real data), -1 = July (locked by
     payroll), +1 = September (hasn't happened yet) — three real
     states from one small dataset. */
  function MonthCell({ iso, entry, flagged, onFlag }) {
    const { c, shadow } = useTheme();
    const { t, ty } = useLang();
    const d = parseISO(iso).getDate();
    const st = entry ? entry.status : null;
    const role = st ? DH3_ROLE[st] : null;
    const canFlag = st === "missing" && !flagged;
    const [open, setOpen] = useState(false);
    const [note, setNote] = useState("");

    if (!st) {
      return <div aria-hidden="true" style={{ minHeight: 46, borderRadius: G3.r.xs }} />;
    }

    /* a day still to come is drawn as paper: no colour, because nothing
       has happened on it yet */
    const ahead = st === "ahead";
    const box = (
      <div
        style={{
          minHeight: 46, borderRadius: G3.r.xs,
          border: "1px solid " + (ahead ? c.border : "transparent"),
          background: ahead ? "transparent" : role ? c[role + "Tint"] : c.sunken,
          padding: "6px 7px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}
      >
        <span style={G3.fig("xs", { color: ahead ? c.inkFaint : role ? c[role + "Text"] : c.inkFaint, fontWeight: 700 })}>{d}</span>
        {/* the code, not a tick: colour alone decides nothing here */}
        <span style={G3.fig("micro", { color: ahead ? c.inkFaint : role ? c[role + "Text"] : c.inkFaint, fontWeight: 700, letterSpacing: "0.04em" })}>
          {ahead ? "" : t("dh3.code." + st)}
        </span>
      </div>
    );

    if (!canFlag && !flagged) {
      return <div aria-label={t("dh3.day.aria", { date: d, status: statusWordFor(t, st) })}>{box}</div>;
    }

    return (
      <div style={{ position: "relative" }}>
        <button
          type="button" onClick={() => setOpen((o) => !o)}
          aria-label={t("dh3.day.aria", { date: d, status: flagged ? t("dh3.act.flagged") : statusWordFor(t, st) })}
          style={{ width: "100%", border: "none", padding: 0, background: "none", cursor: "pointer", textAlign: "left" }}
        >
          {box}
          {flagged ? <span aria-hidden="true" style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: G3.r.pill, background: c.accent }} /> : null}
        </button>
        {open ? (
          <div style={{ position: "absolute", zIndex: 50, top: "100%", left: 0, marginTop: 4, width: 240, background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: 12, boxShadow: shadow(3) }}>
            {flagged ? (
              <p style={ty("small", { color: c.presentText, margin: 0 })}>{t("dh3.act.flagged")}</p>
            ) : (
              <React.Fragment>
                <Field id={"flag-note-" + iso} label={t("dh3.act.flagNote")}>
                  <Input id={"flag-note-" + iso} value={note} onChange={setNote} placeholder="" />
                </Field>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button kind="primary" size="sm" onClick={() => { onFlag(iso, note); setOpen(false); }}>{t("dh3.act.flagSend")}</Button>
                  <Button kind="ghost" size="sm" onClick={() => setOpen(false)}>{t("dh2.note.cancel")}</Button>
                </div>
              </React.Fragment>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  function PersonMonthCard({ staffId }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [monthOffset, setMonthOffset] = useState(0);
    const [flagged, setFlagged] = useState(() => new Set());
    const staff = staffById(staffId);
    if (!staff) return null;

    const monthLabel = monthOffset === 0 ? t("lv.mon.8") + " 2026" : monthOffset === -1 ? t("lv.mon.7") + " 2026" : t("lv.mon.9") + " 2026";

    const firstWd = monthOffset === 0 ? new Date(2026, 7, 1).getDay() : null;
    const cells = [];
    /* the WHOLE month, not the part that has happened — a calendar that
       stops at today reads as a broken grid */
    if (monthOffset === 0) {
      for (let i = 0; i < firstWd; i++) cells.push(<div key={"lead" + i} />);
      for (let d = 1; d <= 31; d++) {
        const iso = isoAug(d);
        cells.push(
          <MonthCell
            key={iso} iso={iso} entry={staff.pattern[iso]} flagged={flagged.has(iso)}
            onFlag={(isoDay) => setFlagged((prev) => { const n = new Set(prev); n.add(isoDay); return n; })}
          />
        );
      }
    }

    /* what the month adds up to, counted not typed */
    const tally = { present: 0, late: 0, absent: 0, leave: 0, missing: 0 };
    Object.keys(staff.pattern).forEach((iso) => {
      const s = staff.pattern[iso].status;
      if (tally[s] != null) tally[s] += 1;
    });
    const LEGEND = ["present", "late", "absent", "leave", "missing"];

    return (
      <Card
        icon="attendance" iconTone="present"
        title={t("dh3.month.title", { name: staffName(t, staff) })}
        sub={t("dh3.month.sub", { dept: t("dh.scope.dept"), monthLabel: monthLabel })}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
          <button type="button" onClick={() => setMonthOffset((o) => o - 1)} aria-label={t("dh3.month.prev")} style={{ border: "1px solid " + c.border, background: c.surface, borderRadius: G3.r.pill, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: c.ink }}>
            <Icon name="arrow" size={14} style={{ transform: "rotate(180deg)" }} />
          </button>
          <span style={ty("small", { color: c.ink, fontWeight: 700, minWidth: 100, textAlign: "center" })}>{monthLabel}</span>
          <button type="button" onClick={() => setMonthOffset((o) => o + 1)} aria-label={t("dh3.month.next")} style={{ border: "1px solid " + c.border, background: c.surface, borderRadius: G3.r.pill, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: c.ink }}>
            <Icon name="arrow" size={14} />
          </button>
        </div>

        {monthOffset === -1 ? (
          <EmptyState compact art={<span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={34} /></span>} head={t("dh3.month.lockedTitle", { monthLabel: monthLabel })} body={t("dh3.month.lockedBody")} />
        ) : monthOffset > 0 ? (
          <EmptyState compact head={t("dh3.month.futureTitle", { monthLabel: monthLabel })} body={t("dh3.month.futureBody")} />
        ) : (
          <React.Fragment>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((wd) => (
                <div key={wd} style={ty("caption", { textAlign: "center", color: c.inkFaint, fontWeight: 700 })}>{t("att.d" + wd)}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>{cells}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", marginTop: 14, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
              {LEGEND.map((s) => (
                <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span aria-hidden="true" style={G3.fig("micro", {
                    width: 18, height: 16, borderRadius: 4, display: "grid", placeItems: "center",
                    background: c[DH3_ROLE[s] + "Tint"], color: c[DH3_ROLE[s] + "Text"], fontWeight: 700,
                  })}>{t("dh3.code." + s)}</span>
                  <span style={ty("caption", { color: c.inkMuted })}>{statusWordFor(t, s)}</span>
                  <span style={G3.fig("xs", { color: c.ink, fontWeight: 700 })}>{num(tally[s])}</span>
                </span>
              ))}
            </div>
          </React.Fragment>
        )}
      </Card>
    );
  }

  function DHAttendance({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;

    const [tab, setTab] = useState("today");
    const [dayNum, setDayNum] = useState(11);
    const [statusFilter, setStatusFilter] = useState("all");
    const [shiftFilter, setShiftFilter] = useState("all");
    /* the panel is part of the screen, not a thing you summon: it
       starts on the first person in the register */
    const [openPersonId, setOpenPersonId] = useState(STAFF[0].id);
    const [exportOpen, setExportOpen] = useState(false);
    const TABS_ID = "dh3-tabs";

    const dateIso = isoAug(dayNum);

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "deptHead"} active="dhAttendance" onNavigate={onNavigate} initials="AD" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.dhAttendance")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            <div style={{ marginBottom: 8 }}><ScopeBanner /></div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
              <div>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("dh3.pageTitle")}</h1>
              </div>
              <Button kind="secondary" iconLeft="download" onClick={() => setExportOpen(true)}>{t("dh3.export.button")}</Button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
              <Tabs
                items={[{ key: "today", label: t("dh3.tab.today") }, { key: "month", label: t("dh3.tab.month") }]}
                active={tab} onChange={setTab} ariaLabel={t("dh3.pageTitle")} idBase={TABS_ID}
              />
              {tab === "today" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button type="button" onClick={() => setDayNum((d) => Math.max(1, d - 1))} aria-label={t("dh3.day.prev")} style={{ border: "1px solid " + c.border, background: c.surface, borderRadius: G3.r.pill, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: c.ink }}>
                    <Icon name="arrow" size={14} style={{ transform: "rotate(180deg)" }} />
                  </button>
                  <span style={ty("small", { color: c.ink, fontWeight: 700, minWidth: 120, textAlign: "center" })}>{fmtDate(t, dateIso)}</span>
                  <button type="button" onClick={() => setDayNum((d) => Math.min(14, d + 1))} aria-label={t("dh3.day.next")} style={{ border: "1px solid " + c.border, background: c.surface, borderRadius: G3.r.pill, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: c.ink }}>
                    <Icon name="arrow" size={14} />
                  </button>
                </div>
              ) : null}
            </div>

            {tab === "today" ? (
              <TabPanel idBase={TABS_ID} tabKey="today">
                <DayBand dateIso={dateIso} />
                <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TodayRegister
                      dateIso={dateIso} statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                      shiftFilter={shiftFilter} setShiftFilter={setShiftFilter}
                      selectedId={openPersonId} onSelect={setOpenPersonId}
                    />
                  </div>
                  <div style={{ width: L.colNarrow, flex: "0 0 " + L.colNarrow + "px" }}>
                    <PersonMonthCard staffId={openPersonId} />
                  </div>
                </div>
              </TabPanel>
            ) : (
              <TabPanel idBase={TABS_ID} tabKey="month">
                {openPersonId ? (
                  <PersonMonthCard staffId={openPersonId} onClose={() => setOpenPersonId(null)} />
                ) : (
                  <Card>
                    <EmptyState compact head={t("dh3.month.pickHead")} body={t("dh3.month.pickBody")} action={
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                        {STAFF.map((s) => <Button key={s.id} kind="secondary" size="sm" onClick={() => setOpenPersonId(s.id)}>{staffName(t, s)}</Button>)}
                      </div>
                    } />
                  </Card>
                )}
              </TabPanel>
            )}
          </div>
        </main>

        {exportOpen ? (
          <ConfirmDialog
            title={t("dh3.export.button")}
            body={t("dh3.export.note", { n: num(STAFF.length), dept: t("dh.scope.dept") })}
            confirmLabel={t("dh3.export.close")}
            onConfirm={() => setExportOpen(false)}
            onCancel={() => setExportOpen(false)}
          >
            <p style={ty("small", { color: c.presentText, background: c.presentTint, borderRadius: G3.r.md, padding: "9px 12px", fontWeight: 600 })}>
              {t("dh3.export.done", { date: dayLabel(t, TODAY_ISO) })}
            </p>
          </ConfirmDialog>
        ) : null}
      </div>
    );
  }

  /* THE DEPARTMENT'S DAY, READ ELSEWHERE. My team (pages/team.jsx)
     shows the same people the same day, so it reads this register
     rather than keeping a second one. Only the roster's ids differ:
     this file calls Meera "meera" and the shared roster calls her
     "meeraj", so the lookup is by the shared id. The head herself has
     no row here -- she is not one of her own reports -- so her day
     comes from the same generator with her own seed. */
  const LF_TO_DH = { meeraj: "meera" };
  const SPARE = { anjali: 8 };
  function dayOf(lfId, iso) {
    const row = staffById(LF_TO_DH[lfId] || lfId);
    if (row) return Object.assign({ verify: row.verify }, row.pattern[iso] || { status: "off" });
    const seed = SPARE[lfId];
    if (seed == null) return null;
    return Object.assign({ verify: "bio" }, buildPattern(seed)[iso] || { status: "off" });
  }
  function monthOf(lfId) {
    const out = {};
    for (let d = 1; d <= 31; d++) { const iso = isoAug(d); out[iso] = dayOf(lfId, iso); }
    return out;
  }
  window.NaveyaDeptDay = { TODAY_ISO: TODAY_ISO, isoAug: isoAug, dayOf: dayOf, monthOf: monthOf };

  window.Pages3 = window.Pages3 || {};
  window.Pages3.DHHome = DHHome;
  window.Pages3.DHLeave = DHLeave;
  window.Pages3.DHAttendance = DHAttendance;
})();
