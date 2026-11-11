/* @jsxRuntime classic */
/* ============================================================
   Naveya — My Attendance · window.Pages3.Attendance
   EMP-02 (destination) + its tasks EMP-03 mark attendance (web
   clock-in, breaks), EMP-04 regularise, EMP-06 apply leave, plus the
   on-duty / partial-day / overtime requests M9 carries.

   STRUCTURE — rebuilt against real Keka screenshots (design/reference/
   keka/*.jpg + its README) and drawn in the v3 language (G3/UI3).
   Period pills follow the ACADEMIC SESSION; "Overtime requests"
   becomes "Overtime & extra duty" (exam duty, extra classes, hostel-
   warden hours, per M9).

   2026-09-18 designer pass (NA-62) — what changed and why:
   · Web clock-in is a real flow: a dialog (live clock, shift, arrival
     preview, optional note) → a live "time since clock-in" counter in
     Actions, a started bar in Timings, and today's row in the record.
   · Breaks are designed, not implied: lunch is rostered (12:30–1:30,
     60 min, deducted automatically); short and personal breaks are
     started/ended from Actions (or by stepping out through a gate);
     every break is listed on the day, with the policy one click away.
   · One day bar (ShiftBar) everywhere: end to end across the rostered
     day, a visible 60-min lunch gap, late start and beyond-roster time
     drawn in their own roles. It replaces the kit DayTimeline here,
     whose 7:30–17:30 frame left the bar floating in empty track.
   · Arrival is coded early / on time / late — colour AND word, never
     colour alone (DESIGN.md principle 8).
   · The record: status chips sit right of the title, no tags under the
     dates, the whole row opens the day, a visible right-aligned ⋯ with
     only Regularise / Partial day / Leave (each a dialog; Regularise is
     a full side screen), "Hours this month" on the right.
   · Pay impact is gone from the day panel (it belongs to Payslips).
   · Requests tab: one filterable ledger instead of three empty cards;
     Overtime tab: a ledger + a request form whose hours are fetched
     from the chosen day's punches.

   In the product every policy number below (grace, lunch window, short-
   break allowance, cutoff) comes from the M9 attendance policy config;
   they are named constants here because the canvas has no config
   service. Nothing on this page renders PAN/Aadhaar/bank data.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo, useEffect, useRef } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Button, LinkButton, Chip, StatusMark, Seal,
    Figure, Icon, Switch, Tabs, TabPanel, EmptyState, Field, Input, Select,
    profileFor,
  } = UI;

  /* the signed-in person (set by the page each render). Teachers get the
     school-duty vocabulary (exam invigilation, answer-script evaluation,
     hostel duty…); 12-month office staff get their own. */
  let ME = null;
  function me() { return ME || profileFor("employee"); }
  function teaching() { return me().work === "teaching"; }
  function approverName(t) { return t(me().approverKey); }
  function approverLong(t) { return t(me().approverKey + "Long"); }
  function approverOf(t, key) { return key === "att2.hodName" ? approverName(t) : t(key); }

  /* ============================================================
     STRINGS — att2.* is this screen's namespace; weekday names and the
     record's summary words are REUSED from att.* (screens.jsx).
     ============================================================ */
  addStrings({
    en: {
      "att2.pageTitle": "My Attendance",
      "att2.session": "Academic session 2026–27 · Term 1",
      "att2.monthPrev": "Previous month",
      "att2.monthNext": "Next month",

      "att2.monFull.07": "July",
      "att2.monFull.08": "August",
      "att2.monShort.04": "Apr",
      "att2.monShort.05": "May",
      "att2.monShort.06": "Jun",
      "att2.monShort.07": "Jul",
      "att2.monShort.08": "Aug",

      "att2.wd.1": "M", "att2.wd.2": "T", "att2.wd.3": "W", "att2.wd.4": "T",
      "att2.wd.5": "F", "att2.wd.6": "S", "att2.wd.0": "S",

      "att2.stats.title": "How this month is going",
      "att2.stats.avgHours": "Avg hours / day",
      "att2.stats.onTime": "On-time arrival",
      "att2.stats.ofContracted": "of {v} rostered",
      "att2.stats.ofDays": "{n} of {total} marked days",

      "att2.roster.title": "Your roster",
      "att2.roster.weekdays": "Mon – Fri",
      "att2.roster.saturday": "Saturday",
      "att2.roster.sunday": "Sunday",
      "att2.timings.notYet": "Not clocked in yet",
      "att2.bar.break": "{min}m lunch",
      "att2.bar.aria": "Shift {from} to {to}. {state}",
      "att2.meter.of": "{v} of {r} rostered",

      "att2.actions.clockIn": "Web clock-in",
      "att2.actions.policy": "Attendance policy",
      "att2.detail.acts": "What you can do",
      "att2.home.title": "Your day",
      "att2.home.notIn": "Not clocked in yet",
      "att2.home.in": "Clocked in",
      "att2.home.out": "Clocked out",
      "att2.home.onClock": "On the clock",
      "att2.home.rostered": "Rostered",
      "att2.home.gate": "Or mark at the gate device as usual.",

      "att2.logsHeading": "Your record and your requests",
      "att2.format24": "24-hour format",

      "att2.tab.log": "Attendance log",
      "att2.tab.calendar": "Calendar",
      "att2.tab.requests": "Attendance requests",
      "att2.tab.overtime": "Overtime & extra duty",

      "att2.period.groupAria": "Choose a period",
      "att2.period.noData": "No record before the session began",

      "att2.registerTitle": "Attendance record",
      "att2.toDate": "1–{d} {mon} · to date",
      "att2.complete": "1–{n} {mon} · complete month",
      "att2.today": "Today",
      "att2.hoursEff": "effective",

      "att2.col.date": "Date",
      "att2.col.visual": "The day",
      "att2.col.effective": "Effective",
      "att2.col.in": "In",
      "att2.col.out": "Out",
      "att2.col.stillIn": "still in",

      "att2.visual.noEntries": "No punch recorded",
      "att2.visual.weeklyOff": "Weekly off",
      "att2.visual.holiday": "Public holiday",
      "att2.visual.onLeave": "On approved leave",
      "att2.visual.missing": "Missing punch",
      "att2.visual.regPending": "Missing punch · regularisation pending",
      "att2.visual.notYet": "Not clocked in yet",
      "att2.row.aria": "Show details for {date}",
      "att2.detail.pickHead": "Pick a day",
      "att2.detail.pickBody": "Choose a row on the left for its hours, where the punch came from, and what you can do about it.",

      "att2.arr.early": "Early · {m}m",
      "att2.arr.ontime": "On time",
      "att2.arr.late": "Late · {m}m",
      "att2.arr.earlyLong": "Early by {m} min",
      "att2.arr.lateLong": "Late by {m} min",
      "att2.arr.ontimeLong": "On time · within the {g}-min grace",

      "att2.detail.effective": "Effective",
      "att2.detail.gross": "Gross",
      "att2.detail.break": "Break",
      "att2.detail.arrival": "Arrival",
      "att2.detail.breaks": "Breaks",
      "att2.detail.howBreaks": "How breaks work",
      "att2.detail.noBreaks": "No breaks recorded",
      "att2.detail.regPending": "Regularisation pending · {id}",
      "att2.detail.regPendingSub": "With {name} for approval",
      "att2.detail.notYetHead": "You haven't clocked in today",
      "att2.detail.notYetBody": "Clock in from the web if the gate biometric isn't available.",
      "att2.legend.worked": "Worked",
      "att2.legend.lateStart": "Late start",
      "att2.legend.beyond": "Beyond roster",
      "att2.legend.break": "Break",

      "att2.brk.lunch": "Lunch break",
      "att2.brk.short": "Short break",
      "att2.brk.personal": "Personal break",
      "att2.brk.src.roster": "Rostered · deducted automatically",
      "att2.brk.src.gate": "Out and back in through the gate · biometric",
      "att2.brk.src.web": "Started from the web",
      "att2.brk.ongoing": "ongoing",

      "att2.regularise": "Regularise this day",
      "att2.regularised": "Regularised",
      "att2.regularisedSub": "{by} · {date}",
      "att2.hrName": "Meera Nair, HR",
      "att2.hodName": "Anjali Deshpande",
      "att2.hodRole": "Anjali Deshpande · Head of Science",
      "att2.hrRole": "Meera Nair · HR",
      "att2.stAbsent": "Absent",
      "att2.stHoliday": "Holiday",
      "att2.stMissing": "Missing punch",
      "att2.stNotYet": "Not clocked in",
      "att2.prov.gate1": "Marked by biometric · Gate 1, Main Block · eSSL K10",
      "att2.prov.gate2": "Marked by biometric · Gate 2, Senior Block · eSSL K30",
      "att2.prov.web": "Web clock-in · this browser, school network",
      "att2.prov.leave": "Casual leave · approved by Meera Nair, HR",
      "att2.prov.off": "Weekly off · Sunday roster",
      "att2.prov.holiday": "School calendar · gazetted holiday",
      "att2.prov.missing": "No out-punch recorded · Gate 2, Senior Block",
      "att2.prov.absent": "No punch recorded · no leave on file",

      "att2.menu.regularise": "Regularise",
      "att2.menu.partial": "Apply partial day",
      "att2.menu.leave": "Apply leave",
      "att2.menu.reason.nonWorkingReg": "Nothing to regularise on a non-working day",
      "att2.menu.reason.onLeaveReg": "Already on approved leave — nothing to regularise",
      "att2.menu.reason.todayOpen": "You can regularise this once the day closes",
      "att2.menu.reason.pending": "A regularisation is already pending ({id})",
      "att2.menu.reason.nonWorkingPartial": "No partial-day request applies to a non-working day",
      "att2.menu.reason.onLeavePartial": "You're on approved leave this day",
      "att2.menu.reason.nonWorkingLeave": "No leave needed on a non-working day",
      "att2.menu.reason.onLeaveLeave": "Already on casual leave",
      "att2.menu.reason.locked": "Locked — the {mon} payroll run is approved and paid",

      /* dialogs — shared */
      "att2.m.close": "Close",
      "att2.m.cancel": "Cancel",
      "att2.m.submit": "Send request",
      "att2.m.note": "Note",
      "att2.m.noteOpt": "Note (optional)",
      "att2.m.reason": "Reason",
      "att2.m.date": "Date",
      "att2.m.from": "From",
      "att2.m.to": "To",
      "att2.m.approver": "Goes to {name} for approval, then HR.",
      "att2.m.needNote": "Add a note to send this request",
      "att2.dismiss": "Dismiss",

      /* web clock-in */
      "att2.ci.title": "Web clock-in",
      "att2.ci.shift": "Today's shift",
      "att2.ci.willBe": "You'll be marked",
      "att2.ci.where": "Recorded from this browser on the school network · Sunrise Public School, Indiranagar",
      "att2.ci.notePh": "e.g. Gate 1 biometric isn't reading today",
      "att2.ci.cta": "Clock in",
      "att2.ci.done": "Clocked in at {t}",
      "att2.co.title": "Clock out",
      "att2.co.in": "Clocked in",
      "att2.co.worked": "On the clock",
      "att2.co.early": "Your day runs until {t}. Clocking out now marks an early departure; apply for a partial day if you need to.",
      "att2.co.notePh": "e.g. Leaving for exam duty at DPS Whitefield",
      "att2.co.cta": "Clock out",
      "att2.co.done": "Clocked out at {t}",

      /* on duty */
      "att2.od.title": "Apply on duty",
      "att2.od.sub": "For school work away from your campus. You're marked present and no leave is used.",
      "att2.od.type": "Duty",
      "att2.od.t.exam": "Board exam invigilation",
      "att2.od.t.eval": "Answer-script evaluation",
      "att2.od.t.escort": "Student escort or competition",
      "att2.od.t.training": "Training or workshop",
      "att2.od.t.meeting": "Official meeting",
      "att2.od.t.bank": "Bank or statutory-office visit",
      "att2.od.t.vendor": "Vendor or site visit",
      "att2.od.t.audit": "Audit support at the Trust office",
      "att2.ot.d.close": "Month-end close",
      "att2.ot.d.filing": "Statutory filing deadline",
      "att2.ot.d.admissions": "Admissions-week support",
      "att2.ot.d.eventSupport": "School event support",
      "att2.ot.d.office": "Other office work",
      "att2.tab.overtimeOffice": "Overtime",
      "att2.pol.subOffice": "Sunrise Education Trust · policy v2026.1 · office staff",
      "att2.seed.od1o": "Bank and EPFO office visit · Indiranagar branch",
      "att2.od.span": "Timing",
      "att2.od.full": "Full day",
      "att2.od.part": "Part of the day",
      "att2.od.venue": "Venue",
      "att2.od.venuePh": "e.g. DPS Whitefield exam centre",
      "att2.od.venuePhOffice": "e.g. SBI Indiranagar branch",
      "att2.od.notePh": "Who assigned the duty, and anything HR should know",
      "att2.od.needVenue": "Add the venue to send this request",
      "att2.od.badRange": "The end date is before the start date",
      "att2.od.badTime": "The end time is before the start time",
      "att2.od.days": "{n} day on duty",
      "att2.od.daysPl": "{n} days on duty",
      "att2.od.done": "On-duty request {id} sent to {name}",

      /* partial day */
      "att2.pd.title": "Apply partial day",
      "att2.pd.sub": "For part of a working day: arriving late, leaving early, or half a day off.",
      "att2.pd.kind": "What do you need?",
      "att2.pd.late": "Late arrival",
      "att2.pd.early": "Early departure",
      "att2.pd.first": "First half off",
      "att2.pd.second": "Second half off",
      "att2.pd.lateSub": "Come in after the shift starts",
      "att2.pd.earlySub": "Leave before the shift ends",
      "att2.pd.firstSub": "Off until mid-day",
      "att2.pd.secondSub": "Off from mid-day",
      "att2.pd.duration": "Time away",
      "att2.pd.short": "Short leave · {used} of 2 used this month · no leave deducted",
      "att2.pd.half": "Half day · 0.5 day from Casual leave · {left} of 12 left after this",
      "att2.pd.tooLong": "Short leave is up to 2 hours. For longer, choose a half day.",
      "att2.pd.notePh": "e.g. Doctor's appointment",
      "att2.pd.done": "Partial-day request {id} sent to {name}",

      /* leave */
      "att2.lv.title": "Apply leave",
      "att2.lv.type": "Leave type",
      "att2.lv.cl": "Casual leave · {n} left",
      "att2.lv.ml": "Medical leave · {n} left",
      "att2.lv.co": "Comp-off · {n} available",
      "att2.lv.session": "Session",
      "att2.lv.full": "Full day",
      "att2.lv.firstHalf": "First half",
      "att2.lv.secondHalf": "Second half",
      "att2.lv.summary": "{n} day · {left} left after this",
      "att2.lv.summaryPl": "{n} days · {left} left after this",
      "att2.lv.short": "Not enough balance: {n} requested, {have} left",
      "att2.lv.noBlackout": "No exam or admissions blackout on these dates",
      "att2.lv.notePh": "Reason for leave",
      "att2.lv.done": "Leave request {id} sent to {name}. Track it in Leave.",

      /* regularise — a full side screen */
      "att2.rg.title": "Regularise attendance",
      "att2.rg.pick": "Day",
      "att2.rg.noPunch": "No punch recorded",
      "att2.rg.recLine": "Recorded · in {in} · out {out}",
      "att2.rg.notRec": "not recorded",
      "att2.rg.inTime": "Clock-in time",
      "att2.rg.outTime": "Clock-out time",
      "att2.rg.r.forgot": "Forgot to punch out",
      "att2.rg.r.device": "Biometric didn't read my face or finger",
      "att2.rg.r.duty": "Was on duty outside campus",
      "att2.rg.r.outage": "Power or network outage at the gate",
      "att2.rg.r.other": "Something else",
      "att2.rg.notePh": "What happened, in a line or two",
      "att2.rg.attach": "Attach proof (optional)",
      "att2.rg.attached": "Gate-register photo attached",
      "att2.rg.remove": "Remove",
      "att2.rg.sla": "Usually decided within 2 working days. Send it before the {d} payroll cutoff.",
      "att2.rg.needOut": "Add your clock-out time",
      "att2.rg.badOrder": "Clock-out must be after clock-in",
      "att2.rg.sentTitle": "Request {id} sent",
      "att2.rg.sentBody": "{name} reviews it first, then HR. You'll get a notification when it's decided; until then the day shows as pending.",
      "att2.rg.done": "Done",

      /* policy */
      "att2.pol.title": "Attendance policy",
      "att2.pol.sub": "Sunrise Education Trust · policy v2026.1 · teaching staff",
      "att2.pol.shift": "Shift and grace",
      "att2.pol.shiftBody": "Mon\u2013Fri 7:45 AM \u2013 3:30 PM, Saturday 7:45 AM \u2013 12:15 PM. Up to 10 minutes after the start is on time; after that, late.",
      "att2.pol.breaks": "Breaks",
      "att2.pol.breaks1": "One break: lunch, 12:30 to 1:30 PM. Part of the roster and deducted automatically, so there is nothing to apply for.",
      "att2.pol.missing": "Missing punches",
      "att2.pol.missingBody": "Regularise a missing or wrong punch within 7 days, and before the 25th payroll cutoff. Your Head of Department approves, then HR.",
      "att2.pol.duty": "On duty, partial days, overtime",
      "att2.pol.dutyBody": "On-duty days count as present. Short leave (2 hours, twice a month) needs no balance; a half day uses 0.5 casual. Overtime is claimed within 30 days.",
      "att2.pol.ok": "Got it",

      /* requests tab */
      "att2.rq.title": "Attendance requests",
      "att2.rq.sub": "{from} – {to}",
      "att2.rq.new": "New request",
      "att2.rq.newAria": "Choose the kind of request",
      "att2.rq.filterAria": "Filter by request type",
      "att2.rq.all": "All",
      "att2.rq.k.onduty": "On duty",
      "att2.rq.k.regularise": "Regularisation",
      "att2.rq.k.partial": "Partial day",
      "att2.rq.col.request": "Request",
      "att2.rq.col.dates": "Date",
      "att2.rq.col.details": "Details",
      "att2.rq.col.submitted": "Sent",
      "att2.rq.col.approver": "Approver",
      "att2.rq.col.status": "Status",
      "att2.rq.st.pending": "Pending",
      "att2.rq.st.approved": "Approved",
      "att2.rq.st.rejected": "Rejected",
      "att2.rq.st.withdrawn": "Withdrawn",
      "att2.rq.summary": "{p} pending · {a} approved",
      "att2.rq.withdraw": "Withdraw",
      "att2.rq.withdrawn": "Request {id} withdrawn",
      "att2.rq.emptyHead": "No requests of this kind",
      "att2.rq.emptyBody": "Requests you send appear here with their status.",
      "att2.rq.decidedOn": "on {d}",
      "att2.rq.rowAria": "Show request {id}",
      "att2.rq.pickHead": "Pick a request",
      "att2.rq.pickBody": "Choose a row on the left for what you asked for, who has it now, and whether you can still take it back.",
      "att2.rq.d.decided": "Decided on {d}.",
      "att2.rq.d.settled": "The record stands.",
      "att2.rq.d.withdrawFoot": "It has not been decided yet, so it is still yours to take back.",

      "att2.seed.rg1": "Missing out-punch · corrected to 3:28 PM",
      "att2.seed.od1": "Board exam invigilation · DPS Whitefield centre",
      "att2.seed.pd1": "Late arrival 7:45 – 8:21 AM · Doctor's appointment",

      /* overtime */
      "att2.ot.title": "Overtime & extra duty",
      "att2.ot.sub": "Hours beyond your rostered day, claimed for pay or comp-off",
      "att2.ot.cta": "Request overtime",
      "att2.ot.col.id": "Request",
      "att2.ot.col.date": "Date",
      "att2.ot.col.duty": "Duty",
      "att2.ot.col.punches": "Punches",
      "att2.ot.col.beyond": "Beyond roster",
      "att2.ot.col.claimed": "Claimed",
      "att2.ot.col.comp": "For",
      "att2.ot.col.status": "Status",
      "att2.ot.comp.pay": "Pay",
      "att2.ot.comp.co": "Comp-off",
      "att2.ot.paidIn": "paid in the {mon} run",
      "att2.ot.foot": "Overtime counts from 30 minutes past a full rostered day, from your punches. You can claim less, never more. Within 30 days.",
      "att2.ot.m.title": "Request overtime",
      "att2.ot.m.sub": "For time you worked beyond your rostered day",
      "att2.ot.m.none": "Less than 30 minutes beyond a full rostered day, so there's nothing to claim.",
      "att2.ot.m.dup": "Already claimed in {id}",
      "att2.ot.m.hours": "Hours to claim",
      "att2.ot.m.duty": "Duty",
      "att2.ot.d.exam": "Exam duty or invigilation",
      "att2.ot.d.eval": "Answer-script evaluation",
      "att2.ot.d.extra": "Extra or remedial class",
      "att2.ot.d.hostel": "Hostel-warden duty",
      "att2.ot.d.event": "School event (annual day, sports day)",
      "att2.ot.d.ptm": "Parent–teacher meeting",
      "att2.ot.m.comp": "Compensate as",
      "att2.ot.m.compPay": "Pay at overtime rate",
      "att2.ot.m.compCo": "Comp-off",
      "att2.ot.m.notePh": "What was the duty, and who asked you to stay?",
      "att2.ot.m.done": "Overtime request {id} sent to {name}",
      "att2.ot.m.noDays": "No August working day has time beyond your roster yet",
      "att2.ot.m.noWork": "No working hours recorded on this day",
      "att2.ot.m.dayHint": "From your punches · clocked {in} – {out}",
      "att2.ot.m.upTo": "Up to {d}",
    },
  });
  addStrings({ en: { "att2.am": "AM", "att2.pm": "PM" } });

  /* ============================================================
     POLICY + CLOCK
     ============================================================ */
  const ROSTER_WEEKDAY = { from: "07:45", to: "15:30", lunchFrom: "12:30", lunchTo: "13:30" };
  const ROSTER_SATURDAY = { from: "07:45", to: "12:15", lunchFrom: null, lunchTo: null };
  const GRACE_MIN = 10;
  const SHORT_LEAVE_MAX_MIN = 120;
  const SHORT_LEAVE_USED = 0;
  const CASUAL_LEFT = 8;
  const LEAVE_BAL = { cl: 8, ml: 6, co: 2 };
  const CUTOFF_DAY = 25;
  const OT_MIN_CLAIM = 30;

  function rosterFor(wd) { return wd === 0 ? null : wd === 6 ? ROSTER_SATURDAY : ROSTER_WEEKDAY; }
  function rosterNetMin(rs) {
    const lunch = rs.lunchFrom ? toMin(rs.lunchTo) - toMin(rs.lunchFrom) : 0;
    return toMin(rs.to) - toMin(rs.from) - lunch;
  }
  /* the day the stats measure against: the weekday roster, less lunch */
  const CONTRACTED_DAY_MIN = rosterNetMin(ROSTER_WEEKDAY);

  /* The page's clock. "Today" is Tue 11 Aug; the demo opens at 7:40 AM,
     before the shift, so web clock-in can be walked through. It then
     ticks in real time from the moment the script loads. */
  const PAGE_START_SEC = 7 * 3600 + 40 * 60;
  const BOOT_MS = Date.now();
  function nowSec() { return PAGE_START_SEC + Math.floor((Date.now() - BOOT_MS) / 1000); }

  function useTick(ms) {
    const [, setN] = useState(0);
    useEffect(() => {
      const id = setInterval(() => setN((n) => n + 1), ms);
      return () => clearInterval(id);
    }, [ms]);
  }
  /* the page re-renders once a minute; second-level counters tick on their own */
  function useNowMin() {
    const [m, setM] = useState(Math.floor(nowSec() / 60));
    useEffect(() => {
      const id = setInterval(() => {
        const next = Math.floor(nowSec() / 60);
        setM((prev) => (prev === next ? prev : next));
      }, 1000);
      return () => clearInterval(id);
    }, []);
    return m;
  }

  /* ONE CLOCK, TWO SCREENS. Home and My attendance each kept their
     own idea of whether she had clocked in -- Home asserted a 07:52
     face scan while this page said "not clocked in yet" about the same
     day, which is the drift a teacher notices once and then trusts
     neither screen. The state lives here, beside the dialogs that
     change it; Home renders ClockHomeCard off the same store. */
  const ClockStore = (function () {
    let st = { clockInSec: null, clockOutSec: null, breaks: [] };
    const subs = [];
    return {
      get: function () { return st; },
      set: function (next) {
        st = typeof next === "function" ? next(st) : next;
        subs.forEach(function (f) { f(); });
      },
      subscribe: function (f) {
        subs.push(f);
        return function () { const i = subs.indexOf(f); if (i >= 0) subs.splice(i, 1); };
      },
    };
  })();
  function useClock() {
    const [, setN] = useState(0);
    useEffect(function () {
      return ClockStore.subscribe(function () { setN(function (n) { return n + 1; }); });
    }, []);
    return ClockStore.get();
  }

  function toMin(hhmm) {
    if (!hhmm) return null;
    const p = hhmm.split(":");
    return (+p[0]) * 60 + (+p[1]);
  }
  function hhmm(min) {
    return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
  }
  function fmtClock(v, is24, t) {
    if (v == null || v === "") return "—";
    const s = typeof v === "number" ? hhmm(v) : v;
    if (is24) return s;
    const p = s.split(":");
    const hh = +p[0], mm = p[1];
    const period = hh >= 12 ? t("att2.pm") : t("att2.am");
    let h12 = hh % 12; if (h12 === 0) h12 = 12;
    return h12 + ":" + mm + " " + period;
  }
  function fmtHMS(sec) {
    const s = Math.max(0, sec);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(x).padStart(2, "0");
  }
  function fmtClockSec(sec, is24, t) {
    const min = Math.floor(sec / 60);
    const secs = String(sec % 60).padStart(2, "0");
    const base = fmtClock(min, true, t);
    if (is24) return base + ":" + secs;
    const hh = Math.floor(min / 60);
    let h12 = hh % 12; if (h12 === 0) h12 = 12;
    return h12 + ":" + String(min % 60).padStart(2, "0") + ":" + secs + " " + (hh >= 12 ? t("att2.pm") : t("att2.am"));
  }

  /* early / on time / late, measured against the day's rostered start */
  function arrivalOf(inT, rs) {
    if (!inT || !rs) return null;
    const diff = toMin(inT) - toMin(rs.from);
    if (diff < 0) return { kind: "early", min: -diff };
    if (diff <= GRACE_MIN) return { kind: "ontime", min: diff };
    return { kind: "late", min: diff };
  }

  /* ============================================================
     DATA — two real months (Jul + Aug 2026). Weekdays come from real
     Date objects. July is `locked`: its payroll run is approved and
     paid, so any action that would change a paid day is disabled.
     ============================================================ */
  const MONTHS = [
    {
      id: "2026-07", year: 2026, month: 6, mm: "07",
      nameKey: "att2.monFull.07", shortKey: "att2.monShort.07",
      today: null, holidays: {}, locked: true,
      overrides: {
        3: { status: "present", inT: "07:50", outT: "15:28", regularised: true, regDate: { d: 5, mm: "07", y: 2026 } },
        8: { status: "leave" },
        17: { status: "late", inT: "08:15", outT: "15:40" },
        22: { status: "absent" },
        24: { status: "present", inT: "07:40", outT: "18:05" },
      },
    },
    {
      id: "2026-08", year: 2026, month: 7, mm: "08",
      nameKey: "att2.monFull.08", shortKey: "att2.monShort.08",
      today: 11, holidays: { 15: true }, locked: false,
      overrides: {
        3: { outT: "16:50" },
        5: { status: "late", inT: "08:21", outT: "15:40" },
        6: { status: "missing", inT: "07:49", outT: null },
        7: { status: "present", inT: "07:41", outT: "17:10" },
        10: { status: "leave" },
      },
    },
  ];
  const TABS_ID = "att2-logs";

  const SESSION_PILLS = [
    { key: "04", monKey: "att2.monShort.04", monthIdx: null },
    { key: "05", monKey: "att2.monShort.05", monthIdx: null },
    { key: "06", monKey: "att2.monShort.06", monthIdx: null },
    { key: "07", monKey: "att2.monShort.07", monthIdx: 0 },
    { key: "08", monKey: "att2.monShort.08", monthIdx: 1 },
  ];

  function breakMin(b, endMin) {
    const to = b.to == null ? endMin : b.to;
    return Math.max(0, to - b.from);
  }

  /* live = today's state: { clockInSec, breaks: [{type, from, to, src}] } */
  function buildMonth(meta, live, nowMin) {
    const last = new Date(meta.year, meta.month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= last; d++) {
      const wd = new Date(meta.year, meta.month, d).getDay();
      const isFuture = meta.today != null && d > meta.today;
      const isToday = meta.today != null && d === meta.today;
      const gate = d % 2 === 0 ? "gate2" : "gate1";
      const rs = rosterFor(wd);
      let e = { d: d, wd: wd, rs: rs, elapsed: !isFuture, isToday: isToday, breaks: [] };
      const o = meta.overrides[d] || {};

      if (meta.holidays[d]) {
        e.status = "holiday"; e.src = "holiday";
      } else if (wd === 0) {
        e.status = "off"; e.src = "off";
      } else if (isFuture) {
        e.status = null;
      } else if (isToday) {
        if (live && live.clockInSec != null) {
          e.inT = hhmm(Math.floor(live.clockInSec / 60)); e.src = "web";
          const endM = live.clockOutSec != null ? Math.floor(live.clockOutSec / 60) : nowMin;
          if (live.clockOutSec != null) {
            e.outT = hhmm(endM);
            const arr = arrivalOf(e.inT, rs);
            e.status = arr && arr.kind === "late" ? "late" : "present";
          } else {
            e.status = "progress";
          }
          /* lunch is rostered and deducted automatically once it has passed */
          if (rs && rs.lunchFrom && endM >= toMin(rs.lunchTo) && toMin(e.inT) <= toMin(rs.lunchFrom)) {
            e.breaks.push({ type: "lunch", from: toMin(rs.lunchFrom), to: toMin(rs.lunchTo), src: "roster" });
          }
        } else {
          e.status = "notyet";
        }
      } else if (o.status === "leave" || o.status === "absent" || o.status === "off") {
        e.status = o.status; e.src = o.status;
      } else {
        const sat = wd === 6;
        const defIn = sat ? "07:55" : (d % 2 === 0 ? "07:41" : "07:48");
        const defOut = sat ? "12:05" : (d % 2 === 0 ? "15:32" : "15:36");
        e.status = o.status || "present";
        e.inT = o.inT || defIn;
        e.outT = o.status === "missing" ? null : (o.outT || defOut);
        e.src = gate;
        if (e.outT && rs && rs.lunchFrom && toMin(e.outT) >= toMin(rs.lunchTo)) {
          e.breaks.push({ type: "lunch", from: toMin(rs.lunchFrom), to: toMin(rs.lunchTo), src: "roster" });
        }
        (o.extraBreaks || []).forEach((b) => e.breaks.push(b));
        if (o.regularised) { e.regularised = true; e.regDate = o.regDate; }
      }

      if (e.inT) {
        const inM = toMin(e.inT);
        const endM = e.status === "progress" ? nowMin : (e.outT ? toMin(e.outT) : null);
        if (endM != null) {
          const brk = e.breaks.reduce((s, b) => s + breakMin(b, endM), 0);
          e.gross = Math.max(0, endM - inM); e.brk = brk; e.eff = Math.max(0, e.gross - brk);
        } else {
          e.gross = null; e.brk = 0; e.eff = null;
        }
        e.arrival = arrivalOf(e.inT, rs);
        /* overtime is time past the rostered end, capped by how far the
           day ran past a FULL rostered day — a late start isn't repaid by
           staying late — and claimable only from OT_MIN_CLAIM minutes */
        e.beyond = e.outT && rs ? Math.max(0, Math.min(toMin(e.outT) - toMin(rs.to), (toMin(e.outT) - inM) - (toMin(rs.to) - toMin(rs.from)))) : 0;
        e.otClaimable = e.beyond >= OT_MIN_CLAIM ? e.beyond : 0;
      }
      days.push(e);
    }
    const rows = days.filter((x) => x.status != null && x.elapsed);
    const counts = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
    const totalEff = rows.reduce((s, r) => s + (r.eff || 0), 0);
    return { days: days, rows: rows, counts: counts, totalEff: totalEff, last: last };
  }

  const STATUS_WORD_KEY = {
    present: "att.stPresent", late: "att.stLate", leave: "att.stLeave", off: "att.stOff",
    progress: "att.stProgress", holiday: "att2.stHoliday", absent: "att2.stAbsent", missing: "att2.stMissing",
    notyet: "att2.stNotYet",
  };
  function statusWord(t, st) { return t(STATUS_WORD_KEY[st] || st); }
  const STATUS_ICON = {
    present: "check", late: "clock", leave: "leave", off: "arrow",
    holiday: "leave", missing: "alert", absent: "alert", progress: "clock", notyet: "clock",
  };

  function provenanceFor(e, t) {
    if (e.status === "leave") return t("att2.prov.leave");
    if (e.status === "off") return t("att2.prov.off");
    if (e.status === "holiday") return t("att2.prov.holiday");
    if (e.status === "absent") return t("att2.prov.absent");
    if (e.status === "missing") return t("att2.prov.missing");
    if (e.src === "web") return t("att2.prov.web");
    return e.src === "gate1" ? t("att2.prov.gate1") : t("att2.prov.gate2");
  }

  function monShort(t, mm) { return t("att2.monShort." + mm); }
  function rowDateLabel(r, meta, t) { return t("att.d" + r.wd) + ", " + r.d + " " + t(meta.shortKey); }
  function fullDateLabel(r, meta, t) { return rowDateLabel(r, meta, t) + " " + meta.year; }
  function isoOf(meta, d) { return meta.year + "-" + meta.mm + "-" + String(d).padStart(2, "0"); }
  function dayFromIso(iso) {
    const p = (iso || "").split("-");
    return { y: +p[0], mm: p[1], d: +p[2] };
  }
  function isoLabel(iso, t) {
    const x = dayFromIso(iso);
    if (!x.d) return "—";
    const wd = new Date(x.y, (+x.mm) - 1, x.d).getDay();
    return t("att.d" + wd) + ", " + x.d + " " + monShort(t, x.mm);
  }

  function computeStats(month) {
    /* today is still open, so the stats (labelled "to date") stop at yesterday */
    const worked = month.rows.filter((r) => !r.isToday && (r.status === "present" || r.status === "late"));
    const onTime = worked.filter((r) => r.arrival && r.arrival.kind !== "late").length;
    const avgEff = worked.length ? Math.round(worked.reduce((s, r) => s + (r.eff || 0), 0) / worked.length) : 0;
    const onTimePct = worked.length ? Math.round((onTime / worked.length) * 100) : 0;
    return { avgEff: avgEff, onTimePct: onTimePct, worked: worked.length, onTime: onTime };
  }

  /* the row menu: three request actions only, each gated per the
     absent/disabled/offered rule — an item this day can't take is
     disabled with its reason printed, never hidden */
  function buildRowActions(e, meta, t, pendingReg, open) {
    const locked = !!meta.locked;
    const lockedReason = locked ? t("att2.menu.reason.locked", { mon: t(meta.nameKey) }) : null;
    const nonWorking = e.status === "off" || e.status === "holiday";
    const onLeave = e.status === "leave";
    const todayOpen = e.isToday;
    function gate(nonWorkingKey, onLeaveKey, extra) {
      if (locked) return { disabled: true, reason: lockedReason };
      if (nonWorking) return { disabled: true, reason: t(nonWorkingKey) };
      if (onLeave) return { disabled: true, reason: t(onLeaveKey) };
      if (extra) return extra;
      return { disabled: false, reason: null };
    }
    const reg = gate("att2.menu.reason.nonWorkingReg", "att2.menu.reason.onLeaveReg",
      todayOpen ? { disabled: true, reason: t("att2.menu.reason.todayOpen") }
        : pendingReg ? { disabled: true, reason: t("att2.menu.reason.pending", { id: pendingReg }) } : null);
    const partial = gate("att2.menu.reason.nonWorkingPartial", "att2.menu.reason.onLeavePartial");
    const leave = gate("att2.menu.reason.nonWorkingLeave", "att2.menu.reason.onLeaveLeave");
    const iso = isoOf(meta, e.d);
    return [
      { key: "regularise", icon: "scan", label: t("att2.menu.regularise"), disabled: reg.disabled, reason: reg.reason, onSelect: () => open("regularise", { iso: iso }) },
      { key: "partial", icon: "half", label: t("att2.menu.partial"), disabled: partial.disabled, reason: partial.reason, onSelect: () => open("partial", { iso: iso }) },
      { key: "leave", icon: "leave", label: t("att2.menu.leave"), disabled: leave.disabled, reason: leave.reason, onSelect: () => open("leave", { iso: iso }) },
    ];
  }

  /* ============================================================
     LOCAL PRIMITIVES — dialog, drawer, textarea, choice cards, toast.
     Candidates for kit.jsx; kept here because this pass owns only
     this page (the kit Register/ActionMenu are shared by other pages).
     ============================================================ */
  function CloseGlyph() {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  const FOCUSABLE = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

  function Dialog({ title, sub, onClose, footer, children, width, drawer, labelId }) {
    const { c, shadow } = useTheme();
    const { t, ty } = useLang();
    const boxRef = useRef(null);
    const id = labelId || "att2-dialog-title";
    useEffect(() => {
      const prev = document.activeElement;
      const box = boxRef.current;
      function onKey(e) {
        if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
        if (e.key === "Tab" && box) {
          const items = Array.prototype.slice.call(box.querySelectorAll(FOCUSABLE));
          if (!items.length) return;
          const first = items[0], last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener("keydown", onKey);
      const firstField = box && box.querySelector("input:not([disabled]), select, textarea, [role='radio']");
      (firstField || box).focus();
      const oldOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = oldOverflow;
        if (prev && prev.focus) prev.focus();
      };
      // eslint-disable-next-line
    }, []);
    const boxStyle = drawer
      ? { position: "absolute", top: 0, right: 0, bottom: 0, width: width || 600, maxWidth: "100%", borderRadius: G3.r.lg + "px 0 0 " + G3.r.lg + "px" }
      : { position: "relative", width: width || 540, maxWidth: "100%", maxHeight: "calc(100vh - 48px)", borderRadius: G3.r.lg };
    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: drawer ? 0 : 24 }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "absolute", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          ref={boxRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id}
          style={Object.assign({ background: c.surface, border: "1px solid " + c.border, boxShadow: shadow(4), display: "flex", flexDirection: "column", outline: "none" }, boxStyle)}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "22px 24px 16px", borderBottom: "1px solid " + c.rule }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 id={id} style={ty("h1", { margin: 0, color: c.ink })}>{title}</h2>
              {sub ? <div style={ty("small", { color: c.inkMuted, marginTop: 5 })}>{sub}</div> : null}
            </div>
            <button
              type="button" onClick={onClose} aria-label={t("att2.m.close")} title={t("att2.m.close")}
              style={{ width: 34, height: 34, borderRadius: G3.r.pill, border: "1px solid " + c.border, background: c.surface, color: c.inkMuted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
            >
              <CloseGlyph />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 24px 6px" }}>{children}</div>
          {footer ? (
            <div style={{ padding: "14px 24px 18px", borderTop: "1px solid " + c.rule, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>{footer}</div>
          ) : null}
        </div>
      </div>,
      document.body
    );
  }

  /* footer: optional reason on the left, buttons on the right. A
     disabled submit always says why (the absent/disabled/offered rule). */
  function DialogFooter({ reason, onCancel, submitLabel, onSubmit, disabled, icon }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <React.Fragment>
        <div style={ty("caption", { flex: 1, minWidth: 180, color: disabled ? c.lateText : c.inkMuted })}>
          {disabled && reason ? reason : null}
        </div>
        <Button kind="ghost" onClick={onCancel}>{t("att2.m.cancel")}</Button>
        <Button kind="primary" iconLeft={icon} disabled={disabled} onClick={() => { if (!disabled) onSubmit(); }}>{submitLabel || t("att2.m.submit")}</Button>
      </React.Fragment>
    );
  }

  function TextArea({ id, value, onChange, placeholder, rows }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <textarea
        id={id} name={id} value={value} rows={rows || 3} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={ty("body", {
          width: "100%", border: "1px solid " + c.borderStrong, borderRadius: G3.r.md, background: c.surface,
          color: c.ink, padding: "11px 14px", resize: "vertical", display: "block", boxSizing: "border-box",
        })}
      />
    );
  }

  function NativeInput({ id, type, value, onChange, min, max, invalid }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <input
        id={id} name={id} type={type} value={value} min={min} max={max}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid ? "true" : undefined}
        style={G3.fig("sm", {
          width: "100%", height: 46, border: "1px solid " + (invalid ? c.danger : c.borderStrong), borderRadius: G3.r.md,
          background: c.surface, color: c.ink, padding: "0 12px", boxSizing: "border-box", colorScheme: "inherit",
        })}
      />
    );
  }

  /* radio cards — the choice IS the explanation, so each option carries
     its consequence as a sub-line */
  function Choice({ name, items, value, onChange, cols }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const refs = useRef([]);
    function onKey(e, i) {
      let j = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % items.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + items.length) % items.length;
      if (j == null) return;
      e.preventDefault();
      let k = j, guard = 0;
      while (items[k].disabled && guard < items.length) { k = (k + (j > i ? 1 : -1) + items.length) % items.length; guard++; }
      onChange(items[k].key); if (refs.current[k]) refs.current[k].focus();
    }
    return (
      <div role="radiogroup" aria-label={name} style={{ display: "grid", gridTemplateColumns: "repeat(" + (cols || 2) + ", minmax(0, 1fr))", gap: 8 }}>
        {items.map((it, i) => {
          const on = it.key === value;
          return (
            <button
              key={it.key} ref={(el) => { refs.current[i] = el; }}
              type="button" role="radio" aria-checked={on ? "true" : "false"} aria-disabled={it.disabled ? "true" : undefined}
              tabIndex={on ? 0 : -1}
              onClick={() => { if (!it.disabled) onChange(it.key); }}
              onKeyDown={(e) => onKey(e, i)}
              style={{
                textAlign: "left", borderRadius: G3.r.md, padding: "11px 13px", cursor: it.disabled ? "default" : "pointer",
                border: "1.5px solid " + (on ? c.accent : c.border), background: on ? c.accentSoft : c.surface,
                opacity: it.disabled ? 0.55 : 1, display: "flex", gap: 10, alignItems: "flex-start",
              }}
            >
              <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: 99, border: "1.5px solid " + (on ? c.accent : c.borderStrong), marginTop: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {on ? <span style={{ width: 8, height: 8, borderRadius: 99, background: c.accent }} /> : null}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{it.label}</span>
                {it.sub ? <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2, fontWeight: 500 })}>{it.sub}</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  function Toast({ toast, onClose }) {
    const { c, shadow } = useTheme();
    const { t, ty } = useLang();
    useEffect(() => {
      if (!toast) return;
      const id = setTimeout(onClose, 5200);
      return () => clearTimeout(id);
      // eslint-disable-next-line
    }, [toast && toast.id]);
    if (!toast) return null;
    return ReactDOM.createPortal(
      <div role="status" aria-live="polite" style={{ position: "fixed", left: "50%", bottom: 28, transform: "translateX(-50%)", zIndex: 2100, maxWidth: "calc(100vw - 32px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: c.rail, color: c.onRail, borderRadius: G3.r.lg, padding: "12px 12px 12px 16px", boxShadow: shadow(4) }}>
          <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 99, background: c.present, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="check" size={14} /></span>
          <span style={ty("small", { fontWeight: 600, color: c.onRail })}>{toast.text}</span>
          <button type="button" onClick={onClose} aria-label={t("att2.dismiss")} style={{ border: "none", background: "transparent", color: c.onRailMuted, cursor: "pointer", display: "flex", padding: 6 }}><CloseGlyph /></button>
        </div>
      </div>,
      document.body
    );
  }

  function SectionLabel({ children, style }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return <div style={ty("colLabel", Object.assign({ color: c.inkFaint, textTransform: "uppercase", marginBottom: 10 }, style || {}))}>{children}</div>;
  }

  function InfoRow({ icon, children, tone }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const bg = tone === "ok" ? c.presentTint : tone === "warn" ? c.lateTint : c.sunken;
    const fg = tone === "ok" ? c.presentText : tone === "warn" ? c.lateText : c.inkMuted;
    return (
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: bg, borderRadius: G3.r.md, padding: "10px 12px" }}>
        <span aria-hidden="true" style={{ color: fg, display: "flex", marginTop: 1, flexShrink: 0 }}><Icon name={icon || "check"} size={15} /></span>
        <span style={ty("small", { color: fg, fontWeight: 600 })}>{children}</span>
      </div>
    );
  }

  function ApproverLine() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, marginBottom: 14 }}>
        <span aria-hidden="true" style={{ color: c.inkFaint, display: "flex" }}><Icon name="staff" size={15} /></span>
        <span style={ty("caption", { color: c.inkMuted })}>{t("att2.m.approver", { name: approverLong(t) })}</span>
      </div>
    );
  }

  /* ============================================================
     WorkMeter — the record's bar. A plain progress bar: it always fills
     from the left, and its length is effective hours out of that day's
     rostered hours, so a full bar is a full day. (The time-positioned
     ShiftBar read as "sometimes centred, sometimes right" — designer,
     2026-09-18; the Timings card keeps the timeline because there the
     question IS where you are in today's shift.)
     ============================================================ */
  function WorkMeter({ e, height, label }) {
    const { c } = useTheme();
    const { t, ty, dur } = useLang();
    const net = e.rs ? rosterNetMin(e.rs) : 0;
    const eff = e.eff || 0;
    const frac = net ? Math.min(1, eff / net) : 0;
    const text = t("att2.meter.of", { v: dur(eff), r: dur(net) });
    const H = height || 8;
    return (
      <div role="img" aria-label={text} title={text} style={{ width: "100%" }}>
        <div style={{ position: "relative", height: H, borderRadius: G3.r.pill, background: c.sunken, boxShadow: "inset 0 0 0 1px " + c.ruleStrong, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (frac * 100).toFixed(1) + "%", borderRadius: G3.r.pill, background: c.presentBar }} />
        </div>
        {label ? (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={ty("caption", { color: c.inkMuted })}>{text}</span>
            <span style={G3.fig("xs", { color: c.ink, fontWeight: 700 })}>{Math.round(frac * 100) + "%"}</span>
          </div>
        ) : null}
      </div>
    );
  }

  /* ============================================================
     ShiftBar — ONE day bar for the whole page. End to end across the
     rostered day (stretched to cover an early arrival or a late
     finish), a real 60-min gap where lunch sits, and each stretch of
     time in its own role: worked (sage), late start (late tint),
     beyond roster (brass), other breaks (notched out).
     ============================================================ */
  function ShiftBar({ e, rs, nowMin, height, labels, is24, variant }) {
    const { c, mode } = useTheme();
    const { t, ty } = useLang();
    const H = height || 8;
    const R = rs || ROSTER_WEEKDAY;
    const rS = toMin(R.from), rE = toMin(R.to);
    const inM = e && e.inT ? toMin(e.inT) : null;
    const endM = e && e.status === "progress" ? nowMin : (e && e.outT ? toMin(e.outT) : null);
    const wS = inM != null ? Math.min(rS, inM) : rS;
    const wE = Math.max(rE, endM || 0);
    /* record rows: one continuous bar, no lunch gap (designer, 2026-09-18) */
    const lunch = R.lunchFrom && variant !== "record" ? [toMin(R.lunchFrom), toMin(R.lunchTo)] : null;
    const tracks = lunch ? [[wS, lunch[0]], [lunch[1], wE]] : [[wS, wE]];
    /* the record uses one continuous vivid green (presentBar) */
    const softGreen = { background: c.presentBar };
    const span = wE - wS;
    const pct = (m) => ((m - wS) / span) * 100;
    const breaks = e ? (e.breaks || []).filter((b) => b.type !== "lunch") : [];

    function pieces(a, b) {
      const out = [];
      function add(x, y, bg, key) {
        const s = Math.max(x, a), f = Math.min(y, b);
        if (f > s) out.push({ s: s, f: f, bg: bg, key: key + s });
      }
      if (inM != null && (variant === "record" || variant === "green")) {
        add(inM, endM != null ? endM : inM, "SOFT", "w");
        return out;
      }
      if (inM != null) {
        if (e.arrival && e.arrival.kind === "late") add(rS, inM, c.late, "late");
        const workEnd = endM != null ? endM : inM;
        add(inM, Math.min(workEnd, Math.max(rE, inM)), c.presentBar, "w");
        if (workEnd > rE) add(rE, workEnd, c.brass, "ot");
        breaks.forEach((bk, i) => add(bk.from, bk.to == null ? nowMin : bk.to, c.gutter, "b" + i));
      }
      return out;
    }
    const lunchTaken = lunch && endM != null && endM >= lunch[1];
    const aria = t("att2.bar.aria", {
      from: fmtClock(R.from, is24, t), to: fmtClock(R.to, is24, t),
      state: inM == null ? t("att2.timings.notYet") : fmtClock(e.inT, is24, t) + " – " + (endM != null ? fmtClock(endM, is24, t) : "—"),
    });
    return (
      <div role="img" aria-label={aria} style={{ width: "100%" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", height: H + 10 }}>
          {tracks.map((tr, i) => (
            <React.Fragment key={i}>
              {i === 1 ? (
                <div aria-hidden="true" style={{ flex: (lunch[1] - lunch[0]) + " 1 0", minWidth: 12, display: "flex", alignItems: "center", padding: "0 3px" }}>
                  <div style={{ width: "100%", borderTop: "2px dotted " + (lunchTaken ? c.inkFaint : c.borderStrong) }} />
                </div>
              ) : null}
              <div style={{ flex: (tr[1] - tr[0]) + " 1 0", minWidth: 0, position: "relative", height: H, borderRadius: G3.r.pill, background: variant === "green" ? "transparent" : c.sunken, boxShadow: variant === "green" ? "none" : "inset 0 0 0 1px " + c.ruleStrong, overflow: "hidden" }}>
                {variant === "green" ? <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: c.presentBar }} /> : null}
                {pieces(tr[0], tr[1]).map((p) => (
                  <div key={p.key} style={Object.assign({ position: "absolute", top: 0, bottom: 0, left: ((p.s - tr[0]) / (tr[1] - tr[0])) * 100 + "%", width: ((p.f - p.s) / (tr[1] - tr[0])) * 100 + "%", borderRadius: variant === "record" ? G3.r.pill : 0 }, p.bg === "SOFT" ? softGreen : { background: p.bg })} />
                ))}
              </div>
            </React.Fragment>
          ))}
          {e && e.status === "progress" && nowMin > wS ? (
            <span
              aria-hidden="true"
              style={{
                position: "absolute", left: "calc(" + Math.min(100, pct(nowMin)) + "% - " + ((H + 8) / 2) + "px)", top: "50%", marginTop: -(H + 8) / 2,
                width: H + 8, height: H + 8, borderRadius: 99, background: c.knob, border: "3px solid " + c.presentBar, boxShadow: c.knobShadow, boxSizing: "border-box",
              }}
            />
          ) : null}
        </div>
        {labels ? (
          <div aria-hidden="true" style={{ position: "relative", height: 18, marginTop: 4 }}>
            <span style={G3.fig("micro", { position: "absolute", left: 0, color: c.inkFaint })}>{fmtClock(wS, is24, t)}</span>
            {lunch ? (
              <span style={ty("caption", { position: "absolute", left: pct((lunch[0] + lunch[1]) / 2) + "%", transform: "translateX(-50%)", color: c.inkFaint, whiteSpace: "nowrap", fontSize: 11 })}>
                {t("att2.bar.break", { min: lunch[1] - lunch[0] })}
              </span>
            ) : null}
            <span style={G3.fig("micro", { position: "absolute", right: 0, color: c.inkFaint })}>{fmtClock(wE, is24, t)}</span>
          </div>
        ) : null}
      </div>
    );
  }

  /* the record's arrival: just the time, coloured green (early / on
     time) or amber (late). The word stays available to screen readers
     and as a hover title, so the state isn't carried by colour alone
     for anyone who can't see the colour. */
  /* the other half of the pair: when they left. An open day is named
     as open — a dash would read as a missing punch. */
  function DepartTime({ e, is24, nowMin }) {
    const { c } = useTheme();
    const { t } = useLang();
    if (e.isToday && e.inT && !e.outT) {
      return <span style={G3.fig("sm", { color: c.presentText, fontWeight: 600, whiteSpace: "nowrap" })}>{t("att2.col.stillIn")}</span>;
    }
    if (!e.outT) return <span style={{ color: c.inkFaint }}>—</span>;
    return (
      <span style={G3.fig("sm", { color: c.ink, fontWeight: 600, whiteSpace: "nowrap" })}>{fmtClock(e.outT, is24, t)}</span>
    );
  }

  function ArrivalTime({ e, is24 }) {
    const { c } = useTheme();
    const { t } = useLang();
    if (!e.inT) return <span style={{ color: c.inkFaint }}>—</span>;
    const a = e.arrival;
    const word = !a ? "" : a.kind === "early" ? t("att2.arr.earlyLong", { m: a.min }) : a.kind === "late" ? t("att2.arr.lateLong", { m: a.min }) : t("att2.arr.ontime");
    return (
      <span title={word} style={G3.fig("sm", { color: a && a.kind === "late" ? c.lateVivid : c.presentText, fontWeight: 700, whiteSpace: "nowrap" })}>
        {fmtClock(e.inT, is24, t)}
        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{" · " + word}</span>
      </span>
    );
  }

  function StatusChip({ st }) {
    const { c, mode } = useTheme();
    const { t } = useLang();
    if (st === "progress" || st === "notyet") {
      return (
        <Chip bg={st === "progress" ? c.accentSoft : c.sunken} fg={st === "progress" ? (mode === "dark" ? c.accent : c.action) : c.inkMuted}>
          <span aria-hidden="true" style={{ display: "flex" }}><Icon name="clock" size={12} /></span>
          <span>{statusWord(t, st)}</span>
        </Chip>
      );
    }
    return <StatusMark role={st} word={statusWord(t, st)} />;
  }

  function MonthNavButton({ dir, enabled, onClick }) {
    const { c } = useTheme();
    const { t } = useLang();
    const label = t(dir === "prev" ? "att2.monthPrev" : "att2.monthNext");
    return (
      <button
        type="button" onClick={enabled ? onClick : undefined} disabled={!enabled}
        aria-label={label} title={label}
        style={{
          width: 30, height: 30, borderRadius: G3.r.pill, border: "1px solid " + c.border, background: c.surface,
          display: "flex", alignItems: "center", justifyContent: "center", color: enabled ? c.ink : c.inkFaint,
          opacity: enabled ? 1 : 0.45, cursor: enabled ? "pointer" : "default", flexShrink: 0,
        }}
      >
        <Icon name="arrow" size={13} style={{ transform: dir === "prev" ? "rotate(180deg)" : "none" }} />
      </button>
    );
  }

  function StatBlock({ label, value, color, size }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={ty("caption", { color: c.inkFaint, marginBottom: 4 })}>{label}</div>
        <Figure value={value} size={size || "md"} weight={600} color={color || c.ink} />
      </div>
    );
  }

  /* a measured stat: the figure, the reference it's measured against,
     and the bar. (The month-over-month delta line was removed on the
     designer's call, 2026-09-18.) */
  function MeasuredStat({ label, value, frac, reference }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const pct = Math.max(0, Math.min(1, frac || 0));
    return (
      <div style={{ minWidth: 0 }}>
        <div style={ty("caption", { color: c.inkFaint, marginBottom: 5 })}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <Figure value={value} size="lg" weight={600} color={c.ink} />
          <span style={ty("caption", { color: c.inkMuted })}>{reference}</span>
        </div>
        {/* sage, not clay: this bar is a measurement, and on this page
            clay means "act here". Every other bar that measures a worked
            day is already the present colour. */}
        <div role="presentation" style={{ height: 8, borderRadius: G3.r.pill, background: c.sunken, boxShadow: "inset 0 0 0 1px " + c.rule, marginTop: 10, overflow: "hidden" }}>
          <div style={{ width: (pct * 100).toFixed(1) + "%", height: "100%", borderRadius: G3.r.pill, background: c.present }} />
        </div>
      </div>
    );
  }

  /* ============================================================
     Top three-card row — always "now" (today, 11 Aug)
     ============================================================ */
  function StatsCard({ month, meta }) {
    const { c } = useTheme();
    const { t, ty, dur } = useLang();
    const stats = computeStats(month);
    return (
      /* a card on a teacher's own page does not need a row saying
         "Me" with a person icon beside it */
      <Card
        style={{ flex: 1, minWidth: 0 }}
        icon="attendance" iconTone="present"
        title={t("att2.stats.title")}
        sub={t("att2.toDate", { d: meta.today - 1, mon: t(meta.shortKey) })}
      >
        {/* ONE READING PER LINE. Side by side in a column this narrow
            each bar measured about 150px and the reference wrapped
            under its own figure; a measured reading needs the width to
            BE measured against something (designer, 2026-10-27). */}
        <div style={{ display: "grid", gap: 22 }}>
          <MeasuredStat
            label={t("att2.stats.avgHours")} value={dur(stats.avgEff)}
            frac={stats.avgEff / CONTRACTED_DAY_MIN}
            reference={t("att2.stats.ofContracted", { v: dur(CONTRACTED_DAY_MIN) })}
          />
          <MeasuredStat
            label={t("att2.stats.onTime")} value={stats.onTimePct + "%"}
            frac={stats.onTimePct / 100}
            reference={t("att2.stats.ofDays", { n: stats.onTime, total: stats.worked })}
          />
        </div>
      </Card>
    );
  }

  const ROSTER_ROWS = [
    { key: "att2.roster.weekdays", rs: ROSTER_WEEKDAY },
    { key: "att2.roster.saturday", rs: ROSTER_SATURDAY },
    { key: "att2.roster.sunday", rs: null },
  ];

  function breakTypeLabel(t, type) { return t("att2.brk." + type); }

  /* ============================================================
     Period pills
     ============================================================ */
  function PeriodPills({ monthIdx, setMonthIdx }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div role="group" aria-label={t("att2.period.groupAria")} style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {SESSION_PILLS.map((p) => {
          const disabled = p.monthIdx == null;
          const on = !disabled && p.monthIdx === monthIdx;
          return (
            <button
              key={p.key} type="button" aria-disabled={disabled ? "true" : undefined} aria-pressed={on ? "true" : "false"}
              title={disabled ? t("att2.period.noData") : undefined}
              onClick={() => { if (!disabled) setMonthIdx(p.monthIdx); }}
              style={{
                border: "1px solid " + (on ? c.accent : c.border), borderRadius: G3.r.pill, padding: "6px 15px",
                background: on ? c.accent : c.surface, color: on ? c.onAccent : disabled ? c.inkFaint : c.ink,
                fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 600, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.55 : 1,
              }}
            >
              {t(p.monKey)}
            </button>
          );
        })}
      </div>
    );
  }

  /* ============================================================
     The record — a Register-shaped table owned by this page, because
     it needs whole-row selection, header chips on the right and a
     right-hand total, none of which the shared kit Register has.
     ============================================================ */
  function VisualCell({ r, nowMin, is24, pendingReg }) {
    const { c } = useTheme();
    const { t } = useLang();
    if (r.status === "present" || r.status === "late" || r.status === "progress") {
      return <WorkMeter e={r} height={8} />;
    }
    const key = r.status === "off" ? "att2.visual.weeklyOff"
      : r.status === "holiday" ? "att2.visual.holiday"
        : r.status === "leave" ? "att2.visual.onLeave"
          : r.status === "missing" ? (pendingReg ? "att2.visual.regPending" : "att2.visual.missing")
            : r.status === "notyet" ? "att2.visual.notYet"
              : "att2.visual.noEntries";
    const warn = r.status === "missing" || r.status === "absent";
    const leave = r.status === "leave";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span aria-hidden="true" style={{ display: "flex", color: warn ? c.lateText : leave ? c.leaveText : c.inkFaint }}><Icon name={STATUS_ICON[r.status] || "check"} size={13} /></span>
        <span style={{ fontFamily: G3.font.ui, fontSize: 12, color: warn ? c.lateText : leave ? c.leaveText : c.inkMuted, fontWeight: warn || leave ? 700 : 500 }}>{t(key)}</span>
      </div>
    );
  }

  /* EVERY ACT FOR A DAY IS IN THE DAY'S PANEL. The record carried a
     menu on each of its thirty-one rows -- three items, two of them
     usually disabled -- which is thirty-one invitations to leave a
     reading. Selecting the row opens the panel on the right, and the
     panel is where the day is both read and acted on. */
  function DayAction({ item }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const [hot, setHot] = useState(false);
    const off = !!item.disabled;
    return (
      <button
        type="button" disabled={off} onClick={item.onSelect}
        onMouseEnter={() => setHot(true)} onMouseLeave={() => setHot(false)}
        style={{
          display: "flex", alignItems: "flex-start", gap: 10, width: "100%", textAlign: "left",
          font: "inherit", border: "1px solid " + (item.urgent ? c.accent : "transparent"),
          borderRadius: G3.r.md, padding: "9px 10px", marginInline: -10,
          background: item.urgent ? c.accentSoft : off ? "transparent" : hot ? c.raised : "transparent",
          cursor: off ? "default" : "pointer", transition: "background " + G3.mo.hover,
        }}
      >
        <span aria-hidden="true" style={{ display: "flex", marginTop: 1, flexShrink: 0, color: off ? c.inkFaint : c.action }}>
          <Icon name={item.icon} size={15} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={ty("small", { display: "block", fontWeight: item.urgent ? 700 : 600, color: off ? c.inkFaint : c.action })}>{item.label}</span>
          {off && item.reason ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{item.reason}</span> : null}
        </span>
      </button>
    );
  }

  function MonthRecord({ month, meta, selectedDay, onSelectDay, is24, nowMin, pendingRegs, open }) {
    const { c } = useTheme();
    const { t, ty, dur } = useLang();
    const [hover, setHover] = useState(null);
    const shortMon = t(meta.shortKey);
    const rangeSub = meta.today != null ? t("att2.toDate", { d: meta.today, mon: shortMon }) : t("att2.complete", { n: month.last, mon: shortMon });
    const counts = month.counts;
    const pad = G3.layout.cardPad;
    const cols = [
      { key: "date", label: t("att2.col.date"), w: 128 },
      { key: "visual", label: t("att2.col.visual") },
      { key: "in", label: t("att2.col.in"), w: 92 },
      { key: "out", label: t("att2.col.out"), w: 92 },
      { key: "effective", label: t("att2.col.effective"), align: "right", w: 110 },
    ];
    const th = (col) => ty("colLabel", { color: c.inkFaint, textAlign: col.align || "left", padding: "0 10px 10px", textTransform: "uppercase", whiteSpace: "nowrap", width: col.w });
    /* a column of durations is read DOWN, so it is aligned on its last
       digit; an em dash sits where the minutes would be, quietly. */
    const num = (v, strong) => G3.fig("sm", {
      textAlign: "right", whiteSpace: "nowrap", padding: "12px 10px",
      fontWeight: strong ? 700 : 500, color: v == null ? c.inkFaint : undefined,
    });

    return (
      <Card pad={0}>
        <div style={{ padding: pad + "px " + pad + "px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={ty("h2", { margin: 0, color: c.ink })}>{t("att2.registerTitle")}</h3>
            <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>{rangeSub}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <StatusMark role="present" word={t("att.sumPresent")} count={counts.present || 0} />
            <StatusMark role="late" word={t("att.sumLate")} count={counts.late || 0} />
            <StatusMark role="leave" word={t("att.sumLeave")} count={counts.leave || 0} />
            <StatusMark role="off" word={t("att.sumOff")} count={counts.off || 0} />
          </div>
        </div>
        <div style={{ padding: "0 " + (pad - 10) + "px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                {cols.map((col) => <th key={col.key} scope="col" style={th(col)}>{col.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {month.rows.map((r, i) => {
                const sel = r.d === selectedDay;
                const dim = r.status === "off" || r.status === "holiday";
                const dateTxt = rowDateLabel(r, meta, t);
                const pendingReg = pendingRegs[isoOf(meta, r.d)];
                return (
                  <tr
                    key={r.d} tabIndex={0} aria-current={sel ? "true" : undefined}
                    aria-label={t("att2.row.aria", { date: fullDateLabel(r, meta, t) })}
                    onClick={() => onSelectDay(r.d)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectDay(r.d); } }}
                    onMouseEnter={() => setHover(r.d)} onMouseLeave={() => setHover(null)}
                    style={{
                      cursor: "pointer", outlineOffset: -1.5,
                      borderBottom: i < month.rows.length - 1 ? "1px solid " + c.rule : "none",
                      /* selection is neutral (a sunken fill + outline); leave
                         rows are purple; off days stay untinted (designer,
                         2026-09-18) */
                      background: sel ? c.sunken : r.status === "leave" ? c.leaveTint : hover === r.d ? c.raised : "transparent",
                      outline: sel ? "1.5px solid " + c.borderStrong : "none",
                      color: dim ? c.inkFaint : c.ink, transition: "background " + G3.mo.hover,
                    }}
                  >
                    <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                      <span style={G3.fig("sm", { fontWeight: sel ? 700 : 600, color: dim ? c.inkFaint : c.ink })}>{dateTxt}</span>
                      {r.isToday ? <span style={ty("caption", { marginLeft: 8, background: c.accentSoft, color: c.action, borderRadius: 99, padding: "1px 8px", fontWeight: 700, fontSize: 10.5 })}>{t("att2.today")}</span> : null}
                    </td>
                    <td style={{ padding: "12px 14px 12px 10px", minWidth: 190 }}>
                      <VisualCell r={r} nowMin={nowMin} is24={is24} pendingReg={pendingReg} />
                    </td>
                    <td style={{ padding: "12px 10px" }}><ArrivalTime e={r} is24={is24} /></td>
                    <td style={{ padding: "12px 10px" }}><DepartTime e={r} is24={is24} nowMin={nowMin} /></td>
                    <td style={num(r.eff, true)}>{r.eff == null ? "—" : dur(r.eff)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 14, padding: "14px " + pad + "px 18px", borderTop: "2px solid " + c.ruleStrong, marginTop: 2 }}>
          <span style={ty("small", { color: c.inkMuted, fontWeight: 700 })}>{t("att.total")}</span>
          <span style={G3.fig("md", { color: c.ink, fontWeight: 700 })}>{dur(month.totalEff)}</span>
          <span style={ty("caption", { color: c.inkFaint })}>{t("att2.hoursEff")}</span>
        </div>
      </Card>
    );
  }

  /* ============================================================
     Selected-day detail — bar + legend, figures, arrival, BREAKS (with
     the policy one click away), provenance. Pay impact removed: it
     belongs to Payslips.
     ============================================================ */
  function DayDetail({ entry, meta, nowMin, is24, pendingReg, open }) {
    const { c } = useTheme();
    const { t, ty, dur } = useLang();
    if (!entry) return <Card><EmptyState compact head={t("att2.detail.pickHead")} body={t("att2.detail.pickBody")} /></Card>;
    const dateLabel = entry.d + " " + t(meta.nameKey) + " " + meta.year;
    const weekday = t("att.d" + entry.wd);
    const worked = entry.status === "present" || entry.status === "late" || entry.status === "progress";
    const a = entry.arrival;
    const arrWord = !a ? null : a.kind === "early" ? t("att2.arr.earlyLong", { m: a.min }) : a.kind === "late" ? t("att2.arr.lateLong", { m: a.min }) : t("att2.arr.ontimeLong", { g: GRACE_MIN });
    return (
      <Card title={dateLabel} sub={weekday} action={<StatusChip st={entry.status} />}>
        {entry.status === "notyet" ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("att2.detail.notYetHead")}</div>
            <div style={ty("caption", { color: c.inkMuted })}>{t("att2.detail.notYetBody")}</div>
            {/* the day panel draws the SAME bar the record column draws —
                one continuous green. The default variant paints late
                arrival and overtime in amber, which is a second story
                the panel does not need to tell. */}
            <ShiftBar e={entry} rs={entry.rs} nowMin={nowMin} height={12} labels is24={is24} variant="record" />
            <Button kind="primary" iconLeft="clock" onClick={() => open("clockin")}>{t("att2.actions.clockIn")}</Button>
          </div>
        ) : null}

        {worked ? (
          <div>
            <WorkMeter e={entry} height={12} label />
          </div>
        ) : null}
        {entry.status === "missing" ? (
          <div style={{ display: "flex", gap: 18 }}>
            <StatBlock label={t("att.colIn")} value={fmtClock(entry.inT, is24, t)} />
            <StatBlock label={t("att.colOut")} value="—" />
          </div>
        ) : null}

        {entry.status !== "notyet" ? (
          <div style={{ display: "flex", gap: 18, marginTop: (worked || entry.status === "missing") ? 16 : 2, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
            <StatBlock label={t("att2.detail.effective")} value={entry.eff == null ? "—" : dur(entry.eff)} />
            <StatBlock label={t("att2.detail.gross")} value={entry.gross == null ? "—" : dur(entry.gross)} />
            <StatBlock label={t("att2.detail.break")} value={entry.brk ? dur(entry.brk) : "—"} />
          </div>
        ) : null}

        {a ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14, paddingTop: 13, borderTop: "1px solid " + c.rule }}>
            <span style={ty("caption", { color: c.inkFaint })}>{t("att2.detail.arrival")}</span>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <span style={G3.fig("sm", { color: a.kind === "late" ? c.lateVivid : c.presentText, fontWeight: 700 })}>{fmtClock(entry.inT, is24, t)}</span>
              <span style={ty("caption", { color: a.kind === "late" ? c.lateVivid : c.presentText, fontWeight: 700 })}>{arrWord}</span>
            </span>
          </div>
        ) : null}


        {entry.status !== "notyet" ? (
          <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid " + c.rule }}>
            {entry.regularised ? (
              <Seal label={t("att2.regularised")} sub={t("att2.regularisedSub", { by: t("att2.hrName"), date: entry.regDate.d + " " + monShort(t, entry.regDate.mm) + " " + entry.regDate.y })} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: c.inkMuted, display: "flex", flexShrink: 0 }}><Icon name="scan" size={15} /></span>
                <span style={ty("caption", { color: c.inkMuted })}>{provenanceFor(entry, t)}</span>
              </div>
            )}
          </div>
        ) : null}

        {entry.status === "missing" && pendingReg ? (
          <div style={{ marginTop: 16 }}>
            <InfoRow icon="clock" tone="warn">
              {t("att2.detail.regPending", { id: pendingReg })}
              <span style={{ display: "block", fontWeight: 500, marginTop: 2 }}>{t("att2.detail.regPendingSub", { name: approverName(t) })}</span>
            </InfoRow>
          </div>
        ) : null}

        {/* THE ACTIONS FOR THIS DAY, BESIDE THE DAY. A row of the record
            used to carry its own menu; a reading and a desk in the same
            cell is two screens pretending to be one. The day the record
            is missing a punch puts its one real act first, tinted --
            everything else is a quiet row with its reason under it. */}
        <div style={{ marginTop: 16, paddingTop: 13, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("att2.detail.acts")}</div>
          <div style={{ display: "grid", gap: 1 }}>
            {buildRowActions(entry, meta, t, pendingReg, open).map((it) => (
              <DayAction
                key={it.key}
                item={Object.assign({}, it, {
                  urgent: it.key === "regularise" && entry.status === "missing" && !it.disabled,
                })}
              />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  /* ============================================================
     Calendar tab — every date cell carries a hover/focus tooltip with
     the day's in/out and figures (designer item 9). The tooltip is a
     fixed-position portal so the grid's rounded clip never cuts it.
     ============================================================ */
  function DayTooltip({ tip, meta, is24 }) {
    const { c, shadow } = useTheme();
    const { t, ty, dur } = useLang();
    if (!tip) return null;
    const e = tip.day;
    const r = tip.rect;
    const W = 250;
    const left = Math.max(8, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - 8));
    const above = r.top > 230;
    const pos = above ? { top: r.top - 8, transform: "translateY(-100%)" } : { top: r.bottom + 8 };
    const worked = e.inT != null;
    const row = (label, value, color) => (
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "3px 0" }}>
        <span style={ty("caption", { color: c.inkFaint })}>{label}</span>
        <span style={G3.fig("xs", { color: color || c.ink, fontWeight: 600 })}>{value}</span>
      </div>
    );
    return ReactDOM.createPortal(
      <div role="tooltip" id="att2-cal-tip" style={Object.assign({ position: "fixed", left: left, width: W, zIndex: 1500, pointerEvents: "none", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.lg, boxShadow: shadow(3), padding: "12px 14px" }, pos)}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{fullDateLabel(e, meta, t)}</span>
          <StatusChip st={e.status} />
        </div>
        {worked ? (
          <div style={{ borderTop: "1px solid " + c.rule, paddingTop: 6 }}>
            {row(t("att.colIn"), fmtClock(e.inT, is24, t), e.arrival && e.arrival.kind === "late" ? c.lateVivid : c.presentText)}
            {row(t("att.colOut"), e.status === "progress" ? "—" : fmtClock(e.outT, is24, t))}
            {row(t("att2.detail.effective"), e.eff == null ? "—" : dur(e.eff))}
            {row(t("att2.detail.break"), e.brk ? dur(e.brk) : "—")}
            {e.arrival ? (
              <div style={ty("caption", { marginTop: 6, color: e.arrival.kind === "late" ? c.lateVivid : c.presentText, fontWeight: 700 })}>
                {e.arrival.kind === "early" ? t("att2.arr.earlyLong", { m: e.arrival.min }) : e.arrival.kind === "late" ? t("att2.arr.lateLong", { m: e.arrival.min }) : t("att2.arr.ontimeLong", { g: GRACE_MIN })}
              </div>
            ) : null}
          </div>
        ) : null}
        <div style={ty("caption", { color: c.inkMuted, marginTop: 8, fontSize: 11 })}>
          {e.status === "notyet" ? t("att2.detail.notYetHead") : provenanceFor(e, t)}
        </div>
      </div>,
      document.body
    );
  }

  function CalendarGrid({ month, meta, selectedDay, onSelect, nav, is24 }) {
    const { c } = useTheme();
    const { t } = useLang();
    const [tip, setTip] = useState(null);
    const jsFirstWd = new Date(meta.year, meta.month, 1).getDay();
    const lead = (jsFirstWd + 6) % 7;
    const weekdays = [1, 2, 3, 4, 5, 6, 0].map((wd) => t("att.d" + wd));
    const cells = new Array(lead).fill(null).concat(month.days);
    const trail = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < trail; i++) cells.push(null);
    function show(day, el) { if (day.status != null) setTip({ day: day, rect: el.getBoundingClientRect() }); }
    useEffect(() => {
      if (!tip) return;
      function hide() { setTip(null); }
      window.addEventListener("scroll", hide, true);
      return () => window.removeEventListener("scroll", hide, true);
    }, [tip]);

    return (
      <Card title={t("att2.tab.calendar")} action={nav}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: c.rule, border: "1px solid " + c.rule, borderRadius: G3.r.sm, overflow: "hidden" }}>
          {weekdays.map((w) => (
            <div key={w} style={{ background: c.sunken, padding: "8px 8px 7px", fontFamily: G3.font.ui, fontSize: 10.5, fontWeight: 700, color: c.inkFaint, textTransform: "uppercase", letterSpacing: "0.06em" }}>{w}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={"b" + i} style={{ background: c.surface, minHeight: 76 }} />;
            const isFuture = day.status == null;
            const isSel = day.d === selectedDay;
            const isToday = meta.today != null && day.d === meta.today;
            const showBar = day.status === "present" || day.status === "late" || day.status === "progress";
            const tipOn = tip && tip.day.d === day.d;
            return (
              <button
                key={day.d} type="button" disabled={isFuture}
                aria-describedby={tipOn ? "att2-cal-tip" : undefined}
                onClick={() => onSelect(day.d)}
                onMouseEnter={(ev) => show(day, ev.currentTarget)} onMouseLeave={() => setTip(null)}
                onFocus={(ev) => show(day, ev.currentTarget)} onBlur={() => setTip(null)}
                style={{
                  background: isSel ? c.sel : tipOn ? c.sunken : c.surface, border: "none", minHeight: 76, textAlign: "left",
                  padding: "8px 8px 9px", cursor: isFuture ? "default" : "pointer",
                  outline: isToday ? "1.5px solid " + c.accent : "none", outlineOffset: -1.5,
                  display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 6,
                }}
              >
                <span style={G3.fig("xs", { color: isFuture ? c.inkFaint : c.ink, fontWeight: isToday ? 700 : 500, opacity: isFuture ? 0.5 : 1 })}>{day.d}</span>
                {!isFuture && day.status ? (
                  showBar ? (
                    <span style={{ display: "grid", gap: 4, width: "100%" }}>
                      <span aria-hidden="true" style={{ height: 4, width: "100%", borderRadius: 2, background: day.arrival && day.arrival.kind === "late" ? c.late : c.presentBar }} />
                      <span style={G3.fig("micro", { color: c.inkMuted })}>{fmtClock(day.inT, is24, t) + (day.outT ? " – " + fmtClock(day.outT, is24, t) : "")}</span>
                    </span>
                  ) : (
                    <span style={{ fontFamily: G3.font.ui, fontSize: 10.5, fontWeight: 700, color: c[day.status + "Text"] || c.inkMuted, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Icon name={STATUS_ICON[day.status] || "check"} size={10} />{statusWord(t, day.status)}
                    </span>
                  )
                ) : null}
              </button>
            );
          })}
        </div>
        <DayTooltip tip={tip} meta={meta} is24={is24} />
      </Card>
    );
  }

  /* ============================================================
     Requests tab — ONE ledger with a type filter, a clear header and a
     single "New request" entry point (designer item 10), instead of
     three near-empty cards.
     ============================================================ */
  const REQ_ICON = { onduty: "briefcase", regularise: "scan", partial: "half" };
  const REQ_TONE = { pending: "late", approved: "present", rejected: "absent", withdrawn: "off" };
  const REQ_GLYPH = { pending: "clock", approved: "check", rejected: "alert", withdrawn: "arrow" };

  function ReqStatus({ st }) {
    const { t } = useLang();
    return <StatusMark role={REQ_TONE[st]} glyph={REQ_GLYPH[st]} word={t("att2.rq.st." + st)} />;
  }

  function RequestsTab({ requests, open, onWithdraw }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [filter, setFilter] = useState("all");
    const [selId, setSelId] = useState(null);
    const [hover, setHover] = useState(null);
    const kinds = ["onduty", "regularise", "partial"];
    const rows = requests.filter((r) => filter === "all" || r.kind === filter);
    /* the first row stands selected rather than the panel opening a
       hole beside the table until somebody presses something */
    const sel = rows.filter((r) => r.id === selId)[0] || rows[0] || null;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const range = t("att2.rq.sub", { from: "1 " + t(MONTHS[0].shortKey) + " " + MONTHS[0].year, to: MONTHS[1].today + " " + t(MONTHS[1].shortKey) + " " + MONTHS[1].year });
    const newItems = [
      { key: "onduty", icon: "briefcase", label: t("att2.rq.k.onduty"), onSelect: () => open("onduty", {}) },
      { key: "partial", icon: "half", label: t("att2.rq.k.partial"), onSelect: () => open("partial", {}) },
      { key: "regularise", icon: "scan", label: t("att2.rq.k.regularise"), onSelect: () => open("regularise", {}) },
    ];
    const pad = G3.layout.cardPad;
    const th = { padding: "0 12px 10px", textAlign: "left", whiteSpace: "nowrap" };
    return (
      /* ONE DESK, NOT A BUTTON PER ROW. Withdraw used to sit at the end
         of its row, which is a reading and a desk in the same cell -
         the same thing the record's old row menu did. The row is the
         reading; the panel beside it is the desk, and everything the
         request says and everything you can still do with it live
         there now. */
      <div style={{ display: "flex", gap: G3.layout.gap, alignItems: "flex-start" }}>
      <Card pad={0} style={{ flex: 1, minWidth: 0 }}>
        <div style={{ padding: pad + "px " + pad + "px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={ty("h2", { margin: 0, color: c.ink })}>{t("att2.rq.title")}</h3>
            <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>{range + " · " + t("att2.rq.summary", { p: pending, a: approved })}</div>
          </div>
          <NewRequestButton items={newItems} />
        </div>

        <div role="group" aria-label={t("att2.rq.filterAria")} style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 " + pad + "px 16px" }}>
          {["all"].concat(kinds).map((k) => {
            const on = filter === k;
            const n = k === "all" ? requests.length : requests.filter((r) => r.kind === k).length;
            return (
              <button key={k} type="button" aria-pressed={on ? "true" : "false"} onClick={() => setFilter(k)}
                style={ty("small", { border: "1px solid " + (on ? c.ink : c.border), background: on ? c.ink : c.surface, color: on ? c.page : c.ink, borderRadius: 99, padding: "6px 14px", fontWeight: 600, cursor: "pointer", display: "inline-flex", gap: 8, alignItems: "center" })}>
                {k === "all" ? t("att2.rq.all") : t("att2.rq.k." + k)}
                <span style={G3.fig("xs", { fontWeight: 700, opacity: 0.75 })}>{n}</span>
              </button>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: "8px " + pad + "px " + pad + "px" }}>
            <EmptyState compact head={t("att2.rq.emptyHead")} body={t("att2.rq.emptyBody")} />
          </div>
        ) : (
          <div style={{ padding: "0 " + (pad - 12) + "px 12px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 470 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                  {["request", "dates", "submitted", "status"].map((k) => (
                    <th key={k} scope="col" style={ty("colLabel", Object.assign({ color: c.inkFaint, textTransform: "uppercase" }, th))}>{t("att2.rq.col." + k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.id} tabIndex={0} aria-current={sel && sel.id === r.id ? "true" : undefined}
                    aria-label={t("att2.rq.rowAria", { id: r.id })}
                    onClick={() => setSelId(r.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelId(r.id); } }}
                    onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)}
                    style={{
                      cursor: "pointer", outlineOffset: -1.5,
                      borderBottom: i < rows.length - 1 ? "1px solid " + c.rule : "none",
                      background: sel && sel.id === r.id ? c.sunken : hover === r.id ? c.raised : "transparent",
                      outline: sel && sel.id === r.id ? "1.5px solid " + c.borderStrong : "none",
                      transition: "background " + G3.mo.hover,
                    }}
                  >
                    <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 10, background: c.accentSoft, color: c.action, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={REQ_ICON[r.kind]} size={15} /></span>
                        <span>
                          <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t("att2.rq.k." + r.kind)}</span>
                          <span style={G3.fig("micro", { display: "block", color: c.inkFaint, marginTop: 2 })}>{r.id}</span>
                        </span>
                      </div>
                    </td>
                    <td style={G3.fig("xs", { padding: "14px 12px", verticalAlign: "top", color: c.ink, whiteSpace: "nowrap", fontWeight: 600 })}>
                      {isoLabel(r.from, t) + (r.to && r.to !== r.from ? " – " + isoLabel(r.to, t) : "")}
                    </td>
                    <td style={G3.fig("xs", { padding: "14px 12px", verticalAlign: "top", color: c.inkMuted, whiteSpace: "nowrap" })}>{isoLabel(r.sent, t)}</td>
                    <td style={{ padding: "12px 12px", verticalAlign: "top" }}>
                      <ReqStatus st={r.status} />
                      {r.decided ? <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{t("att2.rq.decidedOn", { d: isoLabel(r.decided, t) })}</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div style={{ flex: "0 0 " + G3.layout.colNarrow + "px", minWidth: 0, position: "sticky", top: 18, alignSelf: "flex-start" }}>
        <RequestDetail r={sel} onWithdraw={onWithdraw} />
      </div>
      </div>
    );
  }

  /* the one request, beside the list it came from */
  function RequestDetail({ r, onWithdraw }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!r) return <Card><EmptyState compact head={t("att2.rq.pickHead")} body={t("att2.rq.pickBody")} /></Card>;
    const lines = [
      [t("att2.rq.col.dates"), isoLabel(r.from, t) + (r.to && r.to !== r.from ? " \u2013 " + isoLabel(r.to, t) : "")],
      [t("att2.rq.col.details"), r.detailKey ? t(r.detailKey) : r.detail],
      [t("att2.rq.col.submitted"), isoLabel(r.sent, t)],
      [t("att2.rq.col.approver"), approverOf(t, r.approverKey)],
    ];
    return (
      <Card
        icon={REQ_ICON[r.kind]} iconTone="accent"
        title={t("att2.rq.k." + r.kind)} sub={r.id}
        action={<ReqStatus st={r.status} />}
      >
        <dl style={{ margin: 0, border: "1px solid " + c.border, borderRadius: G3.r.md, overflow: "hidden" }}>
          {lines.map((row, i) => (
            <div key={row[0]} style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr)", gap: 12, padding: "11px 13px", borderTop: i ? "1px solid " + c.rule : "none", background: i % 2 ? c.raised : c.surface }}>
              <dt style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{row[0]}</dt>
              <dd style={ty("small", { color: c.ink, margin: 0, fontWeight: 600 })}>{row[1]}</dd>
            </div>
          ))}
        </dl>
        <div style={{ marginTop: 15, paddingTop: 13, borderTop: "1px solid " + c.rule }}>
          {r.status === "pending" ? (
            <React.Fragment>
              <div style={ty("caption", { color: c.inkMuted, marginBottom: 10 })}>{t("att2.rq.d.withdrawFoot")}</div>
              <Button kind="secondary" full iconLeft="signout" onClick={() => onWithdraw(r.id)}>{t("att2.rq.withdraw")}</Button>
            </React.Fragment>
          ) : (
            <div style={ty("caption", { color: c.inkMuted })}>
              {(r.decided ? t("att2.rq.d.decided", { d: isoLabel(r.decided, t) }) + " " : "") + t("att2.rq.d.settled")}
            </div>
          )}
        </div>
      </Card>
    );
  }

  /* a labelled "New request" menu button. The kit ActionMenu trigger is
     icon-only, so this is a small local menu with the same behaviour:
     aria-haspopup, arrow keys, Escape and outside-click close. */
  function NewRequestButton({ items }) {
    const { c, shadow } = useTheme();
    const { t, ty } = useLang();
    const [openM, setOpenM] = useState(false);
    const wrap = useRef(null);
    const refs = useRef([]);
    useEffect(() => {
      if (!openM) return;
      function onDown(e) { if (wrap.current && !wrap.current.contains(e.target)) setOpenM(false); }
      function onKey(e) { if (e.key === "Escape") setOpenM(false); }
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey);
      if (refs.current[0]) refs.current[0].focus();
      return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
    }, [openM]);
    function onItemKey(e, i) {
      let j = null;
      if (e.key === "ArrowDown") j = (i + 1) % items.length;
      if (e.key === "ArrowUp") j = (i - 1 + items.length) % items.length;
      if (j != null) { e.preventDefault(); refs.current[j].focus(); }
    }
    return (
      <div ref={wrap} style={{ position: "relative" }}>
        <Button kind="primary" iconLeft="list" iconRight="arrow" onClick={() => setOpenM((o) => !o)}>{t("att2.rq.new")}</Button>
        {openM ? (
          <div role="menu" aria-label={t("att2.rq.newAria")} style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 230, background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.lg, boxShadow: shadow(3), padding: 6, zIndex: 50 }}>
            {items.map((it, i) => (
              <button key={it.key} ref={(el) => { refs.current[i] = el; }} type="button" role="menuitem"
                onKeyDown={(e) => onItemKey(e, i)} onClick={() => { setOpenM(false); it.onSelect(); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", border: "none", background: "transparent", borderRadius: G3.r.md, padding: "9px 10px", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.sunken; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <span aria-hidden="true" style={{ color: c.inkMuted, display: "flex" }}><Icon name={it.icon} size={16} /></span>
                <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{it.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  /* ============================================================
     Overtime tab — a ledger + a request CTA (designer item 11)
     ============================================================ */
  function OvertimeTab({ ot, open, months, is24 }) {
    const { c } = useTheme();
    const { t, ty, dur } = useLang();
    const pad = G3.layout.cardPad;
    const cols = ["id", "date", "duty", "punches", "beyond", "claimed", "comp", "status"];
    const right = { beyond: 1, claimed: 1 };
    return (
      <Card pad={0}>
        <div style={{ padding: pad + "px " + pad + "px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={ty("h2", { margin: 0, color: c.ink })}>{t(teaching() ? "att2.ot.title" : "att2.tab.overtimeOffice")}</h3>
            <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>{t("att2.ot.sub")}</div>
          </div>
          <Button kind="primary" iconLeft="clock" onClick={() => open("overtime", {})}>{t("att2.ot.cta")}</Button>
        </div>
        <div style={{ padding: "0 " + (pad - 12) + "px 6px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                {cols.map((k) => <th key={k} scope="col" style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase", padding: "0 12px 10px", textAlign: right[k] ? "right" : "left", whiteSpace: "nowrap" })}>{t("att2.ot.col." + k)}</th>)}
              </tr>
            </thead>
            <tbody>
              {ot.map((r, i) => {
                const day = dayFromIso(r.iso);
                const meta = months.find((m) => m.mm === day.mm);
                return (
                  <tr key={r.id} style={{ borderBottom: i < ot.length - 1 ? "1px solid " + c.rule : "none" }}>
                    <td style={G3.fig("xs", { padding: "14px 12px", color: c.ink, fontWeight: 700, whiteSpace: "nowrap" })}>{r.id}</td>
                    <td style={G3.fig("xs", { padding: "14px 12px", color: c.ink, whiteSpace: "nowrap" })}>{isoLabel(r.iso, t)}</td>
                    <td style={ty("small", { padding: "14px 12px", color: c.ink, maxWidth: 230 })}>
                      {t("att2.ot.d." + r.duty)}
                      {r.note ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{r.note}</span> : null}
                    </td>
                    <td style={G3.fig("xs", { padding: "14px 12px", color: c.inkMuted, whiteSpace: "nowrap" })}>{fmtClock(r.inT, is24, t) + " – " + fmtClock(r.outT, is24, t)}</td>
                    <td style={G3.fig("xs", { padding: "14px 12px", color: c.inkMuted, textAlign: "right", whiteSpace: "nowrap" })}>{dur(r.beyond)}</td>
                    <td style={G3.fig("sm", { padding: "14px 12px", color: c.ink, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" })}>{dur(r.claimed)}</td>
                    <td style={ty("small", { padding: "14px 12px", color: c.ink, whiteSpace: "nowrap" })}>{t(r.comp === "pay" ? "att2.ot.comp.pay" : "att2.ot.comp.co")}</td>
                    <td style={{ padding: "12px 12px" }}>
                      <ReqStatus st={r.status} />
                      {r.paidMon ? <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{t("att2.ot.paidIn", { mon: t("att2.monFull." + r.paidMon) })}</div> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "14px " + pad + "px 18px", borderTop: "1px solid " + c.rule }}>
          <span aria-hidden="true" style={{ color: c.inkFaint, display: "flex", marginTop: 1 }}><Icon name="alert" size={14} /></span>
          <span style={ty("caption", { color: c.inkMuted })}>{t("att2.ot.foot")}</span>
        </div>
      </Card>
    );
  }

  /* ============================================================
     DIALOGS
     ============================================================ */
  function ClockInDialog({ today, is24, onClose, onConfirm }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [note, setNote] = useState("");
    useTick(1000);
    const nowM = Math.floor(nowSec() / 60);
    const rs = today.rs;
    const a = arrivalOf(hhmm(nowM), rs);
    const aWord = a.kind === "early" ? t("att2.arr.earlyLong", { m: a.min }) : a.kind === "late" ? t("att2.arr.lateLong", { m: a.min }) : t("att2.arr.ontimeLong", { g: GRACE_MIN });
    return (
      <Dialog
        title={t("att2.ci.title")} sub={fullDateLabel(today, MONTHS[1], t)} onClose={onClose} width={500}
        footer={<DialogFooter onCancel={onClose} submitLabel={t("att2.ci.cta")} icon="clock" onSubmit={() => onConfirm(note)} />}
      >
        <div style={{ textAlign: "center", padding: "6px 0 18px" }}>
          <div style={G3.fig("xl", { color: c.ink, fontWeight: 600 })}>{fmtClockSec(nowSec(), is24, t)}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: c.raised, border: "1px solid " + c.border, borderRadius: G3.r.md, padding: "10px 12px" }}>
            <div style={ty("caption", { color: c.inkFaint })}>{t("att2.ci.shift")}</div>
            <div style={G3.fig("sm", { color: c.ink, fontWeight: 700, marginTop: 3 })}>{fmtClock(rs.from, is24, t) + " – " + fmtClock(rs.to, is24, t)}</div>
          </div>
          <div style={{ background: a.kind === "late" ? c.lateTint : c.presentTint, borderRadius: G3.r.md, padding: "10px 12px" }}>
            <div style={ty("caption", { color: a.kind === "late" ? c.lateText : c.presentText })}>{t("att2.ci.willBe")}</div>
            <div style={ty("small", { color: a.kind === "late" ? c.lateText : c.presentText, fontWeight: 700, marginTop: 3 })}>{aWord}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 16 }}>
          <span aria-hidden="true" style={{ color: c.inkFaint, display: "flex", marginTop: 1 }}><Icon name="globe" size={15} /></span>
          <span style={ty("caption", { color: c.inkMuted })}>{t("att2.ci.where")}</span>
        </div>
        <Field id="att2-ci-note" label={t("att2.m.noteOpt")}>
          <TextArea id="att2-ci-note" value={note} onChange={setNote} placeholder={t("att2.ci.notePh")} rows={2} />
        </Field>
      </Dialog>
    );
  }

  function ClockOutDialog({ today, live, is24, onClose, onConfirm }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [note, setNote] = useState("");
    useTick(1000);
    const nowM = Math.floor(nowSec() / 60);
    const rs = today.rs;
    const early = rs && nowM < toMin(rs.to);
    return (
      <Dialog
        title={t("att2.co.title")} sub={fullDateLabel(today, MONTHS[1], t)} onClose={onClose} width={500}
        footer={<DialogFooter onCancel={onClose} submitLabel={t("att2.co.cta")} icon="signout" onSubmit={() => onConfirm(note)} />}
      >
        <div style={{ textAlign: "center", padding: "6px 0 18px" }}>
          <div style={G3.fig("xl", { color: c.ink, fontWeight: 600 })}>{fmtClockSec(nowSec(), is24, t)}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: c.raised, border: "1px solid " + c.border, borderRadius: G3.r.md, padding: "10px 12px" }}>
            <div style={ty("caption", { color: c.inkFaint })}>{t("att2.co.in")}</div>
            <div style={G3.fig("sm", { color: c.ink, fontWeight: 700, marginTop: 3 })}>{fmtClock(Math.floor(live.clockInSec / 60), is24, t)}</div>
          </div>
          <div style={{ background: c.presentTint, borderRadius: G3.r.md, padding: "10px 12px" }}>
            <div style={ty("caption", { color: c.presentText })}>{t("att2.co.worked")}</div>
            <div style={G3.fig("sm", { color: c.presentText, fontWeight: 700, marginTop: 3 })}>{fmtHMS(nowSec() - live.clockInSec)}</div>
          </div>
        </div>
        {early ? <div style={{ marginBottom: 14 }}><InfoRow icon="alert" tone="warn">{t("att2.co.early", { t: fmtClock(rs.to, is24, t) })}</InfoRow></div> : null}
        <Field id="att2-co-note" label={t("att2.m.noteOpt")}>
          <TextArea id="att2-co-note" value={note} onChange={setNote} placeholder={t("att2.co.notePh")} rows={2} />
        </Field>
      </Dialog>
    );
  }

  function OnDutyDialog({ initIso, is24, onClose, onSubmit }) {
    const { t, ty } = useLang();
    const { c } = useTheme();
    const [duty, setDuty] = useState(teaching() ? "exam" : "bank");
    const [from, setFrom] = useState(initIso || "2026-08-11");
    const [to, setTo] = useState(initIso || "2026-08-11");
    const [span, setSpan] = useState("full");
    const [tFrom, setTFrom] = useState("09:00");
    const [tTo, setTTo] = useState("13:00");
    const [venue, setVenue] = useState("");
    const [note, setNote] = useState("");
    const days = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
    const badRange = days < 1;
    const badTime = span === "part" && toMin(tTo) <= toMin(tFrom);
    const reason = badRange ? t("att2.od.badRange") : badTime ? t("att2.od.badTime") : !venue.trim() ? t("att2.od.needVenue") : !note.trim() ? t("att2.m.needNote") : null;
    const dutyOpts = (teaching() ? ["exam", "eval", "escort", "training", "meeting"] : ["bank", "meeting", "training", "vendor", "audit"]).map((k) => ({ value: k, label: t("att2.od.t." + k) }));
    return (
      <Dialog
        title={t("att2.od.title")} sub={t("att2.od.sub")} onClose={onClose} width={560}
        footer={<DialogFooter onCancel={onClose} disabled={!!reason} reason={reason} onSubmit={() => onSubmit({ duty: duty, from: from, to: span === "part" ? from : to, span: span, tFrom: tFrom, tTo: tTo, venue: venue.trim(), note: note.trim() })} />}
      >
        <Field id="att2-od-duty" label={t("att2.od.type")}><Select id="att2-od-duty" value={duty} onChange={setDuty} options={dutyOpts} /></Field>
        <SectionLabel>{t("att2.od.span")}</SectionLabel>
        <Choice name={t("att2.od.span")} items={[{ key: "full", label: t("att2.od.full") }, { key: "part", label: t("att2.od.part") }]} value={span} onChange={setSpan} />
        <div style={{ height: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: span === "full" ? "1fr 1fr" : "1.3fr 1fr 1fr", gap: 12 }}>
          <Field id="att2-od-from" label={span === "full" ? t("att2.m.from") : t("att2.m.date")}><NativeInput id="att2-od-from" type="date" value={from} onChange={(v) => { setFrom(v); if (span === "part") setTo(v); }} min="2026-08-01" invalid={badRange} /></Field>
          {span === "full" ? (
            <Field id="att2-od-to" label={t("att2.m.to")} error={badRange ? t("att2.od.badRange") : null} hint={!badRange ? t(days === 1 ? "att2.od.days" : "att2.od.daysPl", { n: days }) : null}>
              <NativeInput id="att2-od-to" type="date" value={to} onChange={setTo} min="2026-08-01" invalid={badRange} />
            </Field>
          ) : (
            <React.Fragment>
              <Field id="att2-od-tf" label={t("att2.m.from")}><NativeInput id="att2-od-tf" type="time" value={tFrom} onChange={setTFrom} /></Field>
              <Field id="att2-od-tt" label={t("att2.m.to")} error={badTime ? t("att2.od.badTime") : null}><NativeInput id="att2-od-tt" type="time" value={tTo} onChange={setTTo} invalid={badTime} /></Field>
            </React.Fragment>
          )}
        </div>
        <Field id="att2-od-venue" label={t("att2.od.venue")}><Input id="att2-od-venue" value={venue} onChange={setVenue} placeholder={t(teaching() ? "att2.od.venuePh" : "att2.od.venuePhOffice")} /></Field>
        <Field id="att2-od-note" label={t("att2.m.note")}><TextArea id="att2-od-note" value={note} onChange={setNote} placeholder={t("att2.od.notePh")} /></Field>
        <ApproverLine />
      </Dialog>
    );
  }

  const PD_KINDS = {
    late: { from: "07:45", to: "09:15", fixed: "from" },
    early: { from: "14:00", to: "15:30", fixed: "to" },
    first: { from: "07:45", to: "11:40", fixed: "both" },
    second: { from: "11:40", to: "15:30", fixed: "both" },
  };

  function PartialDialog({ initIso, is24, onClose, onSubmit }) {
    const { t, ty, dur } = useLang();
    const [iso, setIso] = useState(initIso || "2026-08-11");
    const [kind, setKind] = useState("late");
    const [tFrom, setTFrom] = useState(PD_KINDS.late.from);
    const [tTo, setTTo] = useState(PD_KINDS.late.to);
    const [note, setNote] = useState("");
    function pick(k) { setKind(k); setTFrom(PD_KINDS[k].from); setTTo(PD_KINDS[k].to); }
    const mins = toMin(tTo) - toMin(tFrom);
    const half = kind === "first" || kind === "second";
    const tooLong = !half && mins > SHORT_LEAVE_MAX_MIN;
    const bad = mins <= 0;
    const reason = bad ? t("att2.od.badTime") : tooLong ? t("att2.pd.tooLong") : !note.trim() ? t("att2.m.needNote") : null;
    const fixed = PD_KINDS[kind].fixed;
    return (
      <Dialog
        title={t("att2.pd.title")} sub={t("att2.pd.sub")} onClose={onClose} width={560}
        footer={<DialogFooter onCancel={onClose} disabled={!!reason} reason={reason} onSubmit={() => onSubmit({ iso: iso, kind: kind, tFrom: tFrom, tTo: tTo, mins: mins, note: note.trim() })} />}
      >
        <Field id="att2-pd-date" label={t("att2.m.date")}><NativeInput id="att2-pd-date" type="date" value={iso} onChange={setIso} min="2026-08-01" /></Field>
        <SectionLabel>{t("att2.pd.kind")}</SectionLabel>
        <Choice name={t("att2.pd.kind")} value={kind} onChange={pick} items={[
          { key: "late", label: t("att2.pd.late"), sub: t("att2.pd.lateSub") },
          { key: "early", label: t("att2.pd.early"), sub: t("att2.pd.earlySub") },
          { key: "first", label: t("att2.pd.first"), sub: t("att2.pd.firstSub") },
          { key: "second", label: t("att2.pd.second"), sub: t("att2.pd.secondSub") },
        ]} />
        <div style={{ height: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
          <Field id="att2-pd-tf" label={t("att2.m.from")}>
            {fixed === "from" || fixed === "both" ? <ReadOnlyTime v={tFrom} is24={is24} /> : <NativeInput id="att2-pd-tf" type="time" value={tFrom} onChange={setTFrom} invalid={bad} />}
          </Field>
          <Field id="att2-pd-tt" label={t("att2.m.to")}>
            {fixed === "to" || fixed === "both" ? <ReadOnlyTime v={tTo} is24={is24} /> : <NativeInput id="att2-pd-tt" type="time" value={tTo} onChange={setTTo} invalid={bad || tooLong} />}
          </Field>
          <Field id="att2-pd-dur" label={t("att2.pd.duration")}><ReadOnlyTime text={bad ? "—" : dur(mins)} /></Field>
        </div>
        <InfoRow icon={tooLong ? "alert" : "check"} tone={tooLong ? "warn" : "ok"}>
          {tooLong ? t("att2.pd.tooLong") : half ? t("att2.pd.half", { left: CASUAL_LEFT - 0.5 }) : t("att2.pd.short", { used: SHORT_LEAVE_USED })}
        </InfoRow>
        <div style={{ height: 16 }} />
        <Field id="att2-pd-note" label={t("att2.m.reason")}><TextArea id="att2-pd-note" value={note} onChange={setNote} placeholder={t("att2.pd.notePh")} /></Field>
        <ApproverLine />
      </Dialog>
    );
  }

  function ReadOnlyTime({ v, is24, text }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div style={G3.fig("sm", { height: 46, display: "flex", alignItems: "center", padding: "0 12px", borderRadius: G3.r.md, background: c.sunken, color: c.ink, fontWeight: 700, border: "1px solid " + c.border })}>
        {text != null ? text : fmtClock(v, is24, t)}
      </div>
    );
  }

  function LeaveDialog({ initIso, onClose, onSubmit }) {
    const { t } = useLang();
    const [type, setType] = useState("cl");
    const [from, setFrom] = useState(initIso || "2026-08-12");
    const [to, setTo] = useState(initIso || "2026-08-12");
    const [session, setSession] = useState("full");
    const [note, setNote] = useState("");
    const span = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
    const n = session === "full" ? span : 0.5;
    const have = LEAVE_BAL[type];
    const badRange = span < 1;
    const short = n > have;
    const reason = badRange ? t("att2.od.badRange") : short ? t("att2.lv.short", { n: n, have: have }) : !note.trim() ? t("att2.m.needNote") : null;
    const typeOpts = [
      { value: "cl", label: t("att2.lv.cl", { n: LEAVE_BAL.cl }) },
      { value: "ml", label: t("att2.lv.ml", { n: LEAVE_BAL.ml }) },
      { value: "co", label: t("att2.lv.co", { n: LEAVE_BAL.co }) },
    ];
    return (
      <Dialog
        title={t("att2.lv.title")} sub={isoLabel(from, t) + (to !== from ? " – " + isoLabel(to, t) : "")} onClose={onClose} width={540}
        footer={<DialogFooter onCancel={onClose} disabled={!!reason} reason={reason} onSubmit={() => onSubmit({ type: type, from: from, to: to, n: n })} />}
      >
        <Field id="att2-lv-type" label={t("att2.lv.type")}><Select id="att2-lv-type" value={type} onChange={setType} options={typeOpts} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field id="att2-lv-from" label={t("att2.m.from")}><NativeInput id="att2-lv-from" type="date" value={from} onChange={(v) => { setFrom(v); if (session !== "full") setTo(v); }} min="2026-08-01" /></Field>
          <Field id="att2-lv-to" label={t("att2.m.to")} error={badRange ? t("att2.od.badRange") : null}><NativeInput id="att2-lv-to" type="date" value={to} onChange={setTo} min="2026-08-01" invalid={badRange} /></Field>
        </div>
        <SectionLabel>{t("att2.lv.session")}</SectionLabel>
        <Choice name={t("att2.lv.session")} cols={3} value={session} onChange={(k) => { setSession(k); if (k !== "full") setTo(from); }} items={[
          { key: "full", label: t("att2.lv.full") }, { key: "first", label: t("att2.lv.firstHalf") }, { key: "second", label: t("att2.lv.secondHalf") },
        ]} />
        <div style={{ display: "grid", gap: 8, margin: "16px 0" }}>
          {!badRange ? (
            <InfoRow icon={short ? "alert" : "check"} tone={short ? "warn" : "ok"}>
              {short ? t("att2.lv.short", { n: n, have: have }) : t(n === 1 || n === 0.5 ? "att2.lv.summary" : "att2.lv.summaryPl", { n: n, left: have - n })}
            </InfoRow>
          ) : null}
          <InfoRow icon="check" tone="ok">{t("att2.lv.noBlackout")}</InfoRow>
        </div>
        <Field id="att2-lv-note" label={t("att2.m.reason")}><TextArea id="att2-lv-note" value={note} onChange={setNote} placeholder={t("att2.lv.notePh")} /></Field>
        <ApproverLine />
      </Dialog>
    );
  }

  /* Regularise — a full side screen: record → correction → preview →
     approval path, then a confirmation state inside the same screen */
  function RegulariseScreen({ initIso, months, built, pendingRegs, is24, onClose, onSubmit }) {
    const { c } = useTheme();
    const { t, ty, dur } = useLang();
    const aug = months[1];
    const eligible = built[1].rows.filter((r) => !r.isToday && (r.status === "present" || r.status === "late" || r.status === "missing" || r.status === "absent") && !pendingRegs[isoOf(aug, r.d)]);
    const start = (initIso && eligible.find((r) => isoOf(aug, r.d) === initIso)) || eligible.find((r) => r.status === "missing") || eligible[0];
    const [d, setD] = useState(start ? start.d : null);
    const day = eligible.find((r) => r.d === d) || start;
    const [inT, setInT] = useState(day && day.inT ? day.inT : "07:45");
    const [outT, setOutT] = useState(day && day.outT ? day.outT : "");
    const [why, setWhy] = useState(day && day.status === "missing" ? "forgot" : "device");
    const [note, setNote] = useState("");
    const [proof, setProof] = useState(false);
    const [sent, setSent] = useState(null);
    function pickDay(v) {
      const nd = eligible.find((r) => String(r.d) === String(v));
      setD(nd.d); setInT(nd.inT || "07:45"); setOutT(nd.outT || ""); setWhy(nd.status === "missing" ? "forgot" : "device");
    }
    if (!day) return null;
    const rs = day.rs;
    const inM = toMin(inT), outM = toMin(outT);
    const bad = outT && inT && outM <= inM;
    const reason = !outT ? t("att2.rg.needOut") : bad ? t("att2.rg.badOrder") : !note.trim() ? t("att2.m.needNote") : null;
    const dayOpts = eligible.map((r) => ({ value: String(r.d), label: rowDateLabel(r, aug, t) + " · " + statusWord(t, r.status) }));
    const reasons = ["forgot", "device", "duty", "outage", "other"].map((k) => ({ value: k, label: t("att2.rg.r." + k) }));
    const cutoff = CUTOFF_DAY + " " + t(aug.shortKey);

    if (sent) {
      return (
        <Dialog drawer title={t("att2.rg.title")} sub={fullDateLabel(day, aug, t)} onClose={onClose} width={600}
          footer={<React.Fragment><span style={{ flex: 1 }} /><Button kind="primary" onClick={onClose}>{t("att2.rg.done")}</Button></React.Fragment>}>
          <div style={{ display: "grid", gap: 16, paddingTop: 10 }}>
            <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 99, background: c.presentTint, color: c.presentText, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={26} /></span>
            <h3 style={ty("h1", { margin: 0, color: c.ink })}>{t("att2.rg.sentTitle", { id: sent })}</h3>
            <p style={ty("body", { margin: 0, color: c.inkMuted })}>{t("att2.rg.sentBody", { name: approverName(t) })}</p>
            <div style={{ background: c.raised, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: 16, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ty("caption", { color: c.inkFaint })}>{t("att2.rg.inTime")}</span><span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{fmtClock(inT, is24, t)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ty("caption", { color: c.inkFaint })}>{t("att2.rg.outTime")}</span><span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{fmtClock(outT, is24, t)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ty("caption", { color: c.inkFaint })}>{t("att2.m.reason")}</span><span style={ty("small", { color: c.ink, fontWeight: 600 })}>{t("att2.rg.r." + why)}</span></div>
            </div>
            <ReqStatus st="pending" />
          </div>
        </Dialog>
      );
    }

    return (
      <Dialog
        drawer title={t("att2.rg.title")} sub={fullDateLabel(day, aug, t)} onClose={onClose} width={620}
        footer={<DialogFooter onCancel={onClose} disabled={!!reason} reason={reason} onSubmit={() => {
          const id = onSubmit({ iso: isoOf(aug, day.d), inT: inT, outT: outT, why: why, note: note.trim(), proof: proof });
          setSent(id);
        }} />}
      >
        <Field id="att2-rg-day" label={t("att2.rg.pick")} hint={t("att2.rg.recLine", { in: day.inT ? fmtClock(day.inT, is24, t) : "—", out: day.outT ? fmtClock(day.outT, is24, t) : t("att2.rg.notRec") })}>
          <Select id="att2-rg-day" value={String(day.d)} onChange={pickDay} options={dayOpts} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field id="att2-rg-in" label={t("att2.rg.inTime")}><NativeInput id="att2-rg-in" type="time" value={inT} onChange={setInT} /></Field>
          <Field id="att2-rg-out" label={t("att2.rg.outTime")} error={bad ? t("att2.rg.badOrder") : null}><NativeInput id="att2-rg-out" type="time" value={outT} onChange={setOutT} invalid={bad} /></Field>
        </div>
        <Field id="att2-rg-why" label={t("att2.m.reason")}><Select id="att2-rg-why" value={why} onChange={setWhy} options={reasons} /></Field>
        <Field id="att2-rg-note" label={t("att2.m.note")}><TextArea id="att2-rg-note" value={note} onChange={setNote} placeholder={t("att2.rg.notePh")} rows={2} /></Field>
        <div style={{ marginTop: -6, marginBottom: 16 }}>
          {proof ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span aria-hidden="true" style={{ color: c.inkMuted, display: "flex" }}><Icon name="document" size={15} /></span>
              <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{t("att2.rg.attached")}</span>
              <button type="button" onClick={() => setProof(false)} style={ty("caption", { border: "none", background: "none", color: c.action, fontWeight: 700, cursor: "pointer" })}>{t("att2.rg.remove")}</button>
            </span>
          ) : (
            <Button kind="ghost" size="sm" iconLeft="document" onClick={() => setProof(true)}>{t("att2.rg.attach")}</Button>
          )}
        </div>
        <ApproverLine />
        <div style={ty("caption", { color: c.inkFaint, marginTop: -8, marginBottom: 14 })}>{t("att2.rg.sla", { d: cutoff })}</div>
      </Dialog>
    );
  }

  /* minimal: a date, the from / to / hours it fetches from that day's
     punches, the duty, how to compensate, and a note */
  function OvertimeDialog({ built, months, ot, is24, onClose, onSubmit }) {
    const { t, dur } = useLang();
    const aug = months[1];
    const rows = built[1].rows;
    const claimedBy = (iso) => ot.find((o) => o.iso === iso && o.status !== "withdrawn");
    const worked = (r) => r && !r.isToday && (r.status === "present" || r.status === "late");
    const firstGood = rows.slice().reverse().find((r) => worked(r) && r.otClaimable > 0 && !claimedBy(isoOf(aug, r.d)));
    const [iso, setIso] = useState(firstGood ? isoOf(aug, firstGood.d) : isoOf(aug, aug.today - 1));
    const day = rows.find((r) => isoOf(aug, r.d) === iso);
    const ok = worked(day);
    const dup = ok ? claimedBy(iso) : null;
    const max = ok ? day.otClaimable : 0;
    const steps = [];
    for (let m = 15; m < max; m += 15) steps.push(m);
    if (max > 0) steps.push(max);
    const [claim, setClaim] = useState(String(max));
    useEffect(() => { setClaim(String(max)); }, [iso]);
    const [duty, setDuty] = useState(teaching() ? "eval" : "close");
    const [comp, setComp] = useState("pay");
    const [note, setNote] = useState("");
    const dayErr = !ok ? t("att2.ot.m.noWork") : dup ? t("att2.ot.m.dup", { id: dup.id }) : max <= 0 ? t("att2.ot.m.none") : null;
    const reason = dayErr || (!note.trim() ? t("att2.m.needNote") : null);
    const fromT = ok && max > 0 ? hhmm(toMin(day.outT) - max) : null;
    const dutyOpts = (teaching() ? ["exam", "eval", "extra", "hostel", "event", "ptm"] : ["close", "filing", "admissions", "eventSupport", "office"]).map((k) => ({ value: k, label: t("att2.ot.d." + k) }));
    return (
      <Dialog
        title={t("att2.ot.m.title")} sub={t("att2.ot.m.sub")} onClose={onClose} width={600}
        footer={<DialogFooter onCancel={onClose} disabled={!!reason} reason={reason} onSubmit={() => onSubmit({ iso: iso, inT: day.inT, outT: day.outT, beyond: max, claimed: +claim, duty: duty, comp: comp, note: note.trim() })} />}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 12 }}>
          <Field id="att2-ot-date" label={t("att2.m.date")}>
            <NativeInput id="att2-ot-date" type="date" value={iso} onChange={setIso} min="2026-08-01" max={isoOf(aug, aug.today - 1)} invalid={!!dayErr} />
          </Field>
          <Field id="att2-ot-from" label={t("att2.m.from")}><ReadOnlyTime text={fromT ? fmtClock(fromT, is24, t) : "—"} /></Field>
          <Field id="att2-ot-to" label={t("att2.m.to")}><ReadOnlyTime text={fromT ? fmtClock(day.outT, is24, t) : "—"} /></Field>
          <Field id="att2-ot-hours" label={t("att2.ot.m.hours")}>
            {!dayErr ? <Select id="att2-ot-hours" value={claim} onChange={setClaim} options={steps.map((m) => ({ value: String(m), label: dur(m) }))} /> : <ReadOnlyTime text="—" />}
          </Field>
        </div>
        <FieldNote err={dayErr} text={!dayErr ? t("att2.ot.m.dayHint", { in: fmtClock(day.inT, is24, t), out: fmtClock(day.outT, is24, t) }) + " · " + t("att2.ot.m.upTo", { d: dur(max) }) : null} />
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
          <Field id="att2-ot-duty" label={t("att2.ot.m.duty")}><Select id="att2-ot-duty" value={duty} onChange={setDuty} options={dutyOpts} /></Field>
          <Field id="att2-ot-comp" label={t("att2.ot.m.comp")}><Select id="att2-ot-comp" value={comp} onChange={setComp} options={[{ value: "pay", label: t("att2.ot.m.compPay") }, { value: "co", label: t("att2.ot.m.compCo") }]} /></Field>
        </div>
        <Field id="att2-ot-note" label={t("att2.m.note")}><TextArea id="att2-ot-note" value={note} onChange={setNote} placeholder={t("att2.ot.m.notePh")} rows={2} /></Field>
        <ApproverLine />
      </Dialog>
    );
  }

  /* one line under a field row: the error in the late role, or the hint */
  function FieldNote({ err, text }) {
    const { c } = useTheme();
    const { ty } = useLang();
    if (!err && !text) return null;
    return <div role={err ? "alert" : undefined} style={ty("caption", { color: err ? c.lateText : c.inkMuted, fontWeight: err ? 700 : 500, margin: "-10px 0 18px" })}>{err || text}</div>;
  }

  function PolicyDialog({ onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const sections = [
      { h: "att2.pol.shift", icon: "clock", body: ["att2.pol.shiftBody"], roster: true },
      { h: "att2.pol.breaks", icon: "leave", body: ["att2.pol.breaks1"] },
      { h: "att2.pol.missing", icon: "scan", body: ["att2.pol.missingBody"] },
      { h: "att2.pol.duty", icon: "briefcase", body: ["att2.pol.dutyBody"] },
    ];
    return (
      <Dialog title={t("att2.pol.title")} sub={t(teaching() ? "att2.pol.sub" : "att2.pol.subOffice")} onClose={onClose} width={620}
        footer={<React.Fragment><span style={{ flex: 1 }} /><Button kind="primary" onClick={onClose}>{t("att2.pol.ok")}</Button></React.Fragment>}>
        <div style={{ display: "grid", gap: 18, paddingBottom: 14 }}>
          {sections.map((s) => (
            <section key={s.h} style={{ display: "flex", gap: 14 }}>
              <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 11, background: c.accentSoft, color: c.action, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={s.icon} size={16} /></span>
              <div style={{ minWidth: 0 }}>
                <h3 style={ty("h3", { margin: "5px 0 6px", color: c.ink })}>{t(s.h)}</h3>
                {s.body.map((b) => <p key={b} style={ty("body", { margin: "0 0 8px", color: c.inkMuted })}>{t(b)}</p>)}
                {s.roster ? (
                  <React.Fragment>
                  <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginTop: 12 })}>{t("att2.roster.title")}</div>
                  <dl style={{ margin: "10px 0 0", border: "1px solid " + c.border, borderRadius: G3.r.md, overflow: "hidden" }}>
                    {ROSTER_ROWS.map((r, i) => (
                      <div key={r.key} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "9px 13px", borderTop: i ? "1px solid " + c.rule : "none", background: i % 2 ? c.raised : c.surface }}>
                        <dt style={ty("caption", { color: c.inkMuted })}>{t(r.key)}</dt>
                        <dd style={{ margin: 0 }}>
                          {r.rs
                            ? <Figure value={fmtClock(r.rs.from, false, t) + " – " + fmtClock(r.rs.to, false, t)} size="xs" color={c.ink} weight={600} />
                            : <span style={ty("caption", { color: c.inkFaint })}>{t("att.stOff")}</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  </React.Fragment>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </Dialog>
    );
  }

  /* ============================================================
     Seed requests (mock) — ISO dates, i18n detail keys
     ============================================================ */
  const SEED_REQUESTS = [
    { id: "PD-0042", kind: "partial", from: "2026-08-05", to: "2026-08-05", detailKey: "att2.seed.pd1", sent: "2026-08-04", approverKey: "att2.hodName", status: "pending" },
    { id: "OD-0088", kind: "onduty", from: "2026-07-28", to: "2026-07-28", detailKey: "att2.seed.od1", sent: "2026-07-21", approverKey: "att2.hodName", status: "approved", decided: "2026-07-22" },
    { id: "RG-0131", kind: "regularise", from: "2026-07-03", to: "2026-07-03", detailKey: "att2.seed.rg1", sent: "2026-07-04", approverKey: "att2.hrName", status: "approved", decided: "2026-07-05" },
  ];
  const SEED_OT = [
    { id: "OT-0027", iso: "2026-08-07", inT: "07:41", outT: "17:10", beyond: 100, claimed: 90, duty: "eval", comp: "co", status: "pending" },
    { id: "OT-0021", iso: "2026-07-24", inT: "07:40", outT: "18:05", beyond: 155, claimed: 150, duty: "event", comp: "pay", status: "approved", paidMon: "07" },
  ];

  /* ============================================================
     PAGE
     ============================================================ */
  function Attendance({ role, onNavigate }) {
    const prof = profileFor(role);
    ME = prof;
    const { c } = useTheme();
    const { t, ty, lang, dur } = useLang();
    const L = G3.layout;

    const nowMin = useNowMin();
    const [monthIdx, setMonthIdx] = useState(1);
    const [activeTab, setActiveTab] = useState("log");
    const [is24, setIs24] = useState(false);
    const live = useClock();
    const setLive = ClockStore.set;
    const [requests, setRequests] = useState(prof.work === "teaching" ? SEED_REQUESTS : SEED_REQUESTS.map((r) => (r.detailKey === "att2.seed.od1" ? Object.assign({}, r, { detailKey: "att2.seed.od1o" }) : r)));
    const [ot, setOt] = useState(prof.work === "teaching" ? SEED_OT : SEED_OT.map((r) => Object.assign({}, r, { duty: r.duty === "eval" ? "close" : "eventSupport" })));
    const [pendingRegs, setPendingRegs] = useState({});
    const [modal, setModal] = useState(null);
    const [toast, setToast] = useState(null);
    const seq = useRef({ RG: 142, OD: 89, PD: 43, LR: 220, OT: 28 });

    function nextId(prefix) { const n = seq.current[prefix]++; return prefix + "-" + String(n).padStart(4, "0"); }
    function say(text) { setToast({ id: Date.now(), text: text }); }
    function open(kind, props) { setModal({ kind: kind, props: props || {} }); }
    function close() { setModal(null); }
    const todayIso = isoOf(MONTHS[1], MONTHS[1].today);

    const built = useMemo(() => MONTHS.map((m) => buildMonth(m, live, nowMin)), [live, nowMin]);
    const meta = MONTHS[monthIdx];
    const month = built[monthIdx];
    const current = built[1];
    const today = current.days.find((d) => d.d === MONTHS[1].today);
    const [selectedDay, setSelectedDay] = useState(MONTHS[1].today);
    useEffect(() => {
      const m = MONTHS[monthIdx];
      setSelectedDay(m.today != null ? m.today : built[monthIdx].last);
      // eslint-disable-next-line
    }, [monthIdx]);
    const selectedEntry = month.days.find((d) => d.d === selectedDay) || null;

    function doClockIn() {
      const s = nowSec();
      setLive({ clockInSec: s, clockOutSec: null, breaks: [] });
      close();
      setMonthIdx(1); setSelectedDay(MONTHS[1].today); setActiveTab("log");
      say(t("att2.ci.done", { t: fmtClock(Math.floor(s / 60), is24, t) }));
    }
    function doClockOut() {
      const s = nowSec();
      setLive((lv) => Object.assign({}, lv, { clockOutSec: s }));
      close();
      say(t("att2.co.done", { t: fmtClock(Math.floor(s / 60), is24, t) }));
    }
    function addRequest(r) { setRequests((rs) => [r].concat(rs)); }

    const prevEnabled = monthIdx > 0;
    const nextEnabled = monthIdx < MONTHS.length - 1;
    const calNav = (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <MonthNavButton dir="prev" enabled={prevEnabled} onClick={() => setMonthIdx((i) => i - 1)} />
        <span style={ty("small", { color: c.ink, fontWeight: 700, minWidth: 84, textAlign: "center" })}>{t(meta.nameKey) + " " + meta.year}</span>
        <MonthNavButton dir="next" enabled={nextEnabled} onClick={() => setMonthIdx((i) => i + 1)} />
      </div>
    );
    const TAB_ITEMS = [
      { key: "log", label: t("att2.tab.log") },
      { key: "calendar", label: t("att2.tab.calendar") },
      { key: "requests", label: t("att2.tab.requests") },
      { key: "overtime", label: t(teaching() ? "att2.tab.overtime" : "att2.tab.overtimeOffice") },
    ];

    let dialog = null;
    if (modal) {
      const p = modal.props;
      if (modal.kind === "clockin") dialog = <ClockInDialog today={today} is24={is24} onClose={close} onConfirm={doClockIn} />;
      if (modal.kind === "clockout") dialog = <ClockOutDialog today={today} live={live} is24={is24} onClose={close} onConfirm={doClockOut} />;
      if (modal.kind === "policy") dialog = <PolicyDialog onClose={close} />;
      if (modal.kind === "onduty") dialog = (
        <OnDutyDialog initIso={p.iso} is24={is24} onClose={close} onSubmit={(v) => {
          const id = nextId("OD");
          const detail = t("att2.od.t." + v.duty) + " · " + v.venue + (v.span === "part" ? " · " + fmtClock(v.tFrom, is24, t) + " – " + fmtClock(v.tTo, is24, t) : "");
          addRequest({ id: id, kind: "onduty", from: v.from, to: v.to, detail: detail, sent: todayIso, approverKey: "att2.hodName", status: "pending" });
          close(); say(t("att2.od.done", { id: id, name: approverName(t) }));
        }} />
      );
      if (modal.kind === "partial") dialog = (
        <PartialDialog initIso={p.iso} is24={is24} onClose={close} onSubmit={(v) => {
          const id = nextId("PD");
          const detail = t("att2.pd." + v.kind) + " " + fmtClock(v.tFrom, is24, t) + " – " + fmtClock(v.tTo, is24, t) + " · " + v.note;
          addRequest({ id: id, kind: "partial", from: v.iso, to: v.iso, detail: detail, sent: todayIso, approverKey: "att2.hodName", status: "pending" });
          close(); say(t("att2.pd.done", { id: id, name: approverName(t) }));
        }} />
      );
      if (modal.kind === "leave") dialog = (
        <LeaveDialog initIso={p.iso} onClose={close} onSubmit={() => {
          const id = nextId("LR");
          close(); say(t("att2.lv.done", { id: id, name: approverName(t) }));
        }} />
      );
      if (modal.kind === "regularise") dialog = (
        <RegulariseScreen initIso={p.iso} months={MONTHS} built={built} pendingRegs={pendingRegs} is24={is24} onClose={close} onSubmit={(v) => {
          const id = nextId("RG");
          const detail = t("att2.rg.r." + v.why) + " · " + fmtClock(v.inT, is24, t) + " – " + fmtClock(v.outT, is24, t);
          addRequest({ id: id, kind: "regularise", from: v.iso, to: v.iso, detail: detail, sent: todayIso, approverKey: "att2.hodName", status: "pending" });
          setPendingRegs((m) => Object.assign({}, m, { [v.iso]: id }));
          return id;
        }} />
      );
      if (modal.kind === "overtime") dialog = (
        <OvertimeDialog built={built} months={MONTHS} ot={ot} is24={is24} onClose={close} onSubmit={(v) => {
          const id = nextId("OT");
          setOt((list) => [Object.assign({ id: id, status: "pending" }, v)].concat(list));
          close(); say(t("att2.ot.m.done", { id: id, name: approverName(t) }));
        }} />
      );
    }

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "employee"} active="attendance" onNavigate={onNavigate} />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.attendance")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            {/* page header. The post and the staff ID came out on
                2026-10-27: the breadcrumb above already names the screen
                and the school, the rail already carries who is signed
                in, and a teacher does not need her own code quoted back
                at her on every page. What is left is the one fact this
                screen is read against — which session it is. */}
            <div style={{ marginBottom: 22 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("att2.pageTitle")}</h1>
              <div style={ty("small", { color: c.inkMuted, marginTop: 8 })}>{t("att2.session")}</div>
            </div>

            {/* TODAY IS ONE FACT, NOT THREE CARDS. The row used to run
                the whole width: the month's stats, a roster table, and a
                desk of links with a ticking wall clock on it — break,
                expected out and effective-so-far all asserted about a
                day she is standing in the middle of, which the record
                below answers properly once the day closes. What is left
                is the one clock (the SAME card Home renders, so there is
                one of them in the product) and how the month is going,
                and the pair deliberately does not reach the right edge.
                The roster moved into the policy, where reference
                material belongs; on duty and partial day are on the New
                request menu a tab away. */}
            {/* THE PAIR IS SIZED TO WHAT IT SAYS, NOT TO THE ROW
                (designer, 2026-10-27). Grown to fill 1560 these two
                became 728 apiece — a clock time and a pair of
                bars adrift in a field, with the figures at one end and
                nothing at the other. They each take the narrow column
                this canvas already uses for a column of facts, grow no
                further, and stop well short of the right edge. They
                still STRETCH to one another's height: two cards that
                share a row share a height. */}
            <div style={{ display: "flex", gap: L.gap, alignItems: "stretch", flexWrap: "wrap" }}>
              <div style={{ flex: "0 1 440px", minWidth: 300, display: "flex" }}>
                <ClockHomeCard onPolicy={() => open("policy")} style={{ flex: 1, minWidth: 0 }} />
              </div>
              <div style={{ flex: "0 1 440px", minWidth: 300, display: "flex" }}>
                <StatsCard month={current} meta={MONTHS[1]} />
              </div>
            </div>

            <div style={{ marginTop: L.gap }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h2 style={ty("h2", { margin: 0, color: c.ink })}>{t("att2.logsHeading")}</h2>
                <Switch id="att2-24h" checked={is24} onChange={setIs24} label={t("att2.format24")} />
              </div>
              <Tabs items={TAB_ITEMS} active={activeTab} onChange={setActiveTab} ariaLabel={t("att2.logsHeading")} idBase={TABS_ID} />

              {activeTab === "log" ? (
                <TabPanel idBase={TABS_ID} tabKey="log" style={{ marginTop: 18 }}>
                  <PeriodPills monthIdx={monthIdx} setMonthIdx={setMonthIdx} />
                  <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <MonthRecord month={month} meta={meta} selectedDay={selectedDay} onSelectDay={setSelectedDay} is24={is24} nowMin={nowMin} pendingRegs={pendingRegs} open={open} />
                    </div>
                    <div style={{ flex: "0 0 " + G3.layout.colNarrow + "px", minWidth: 0, position: "sticky", top: 18, alignSelf: "flex-start" }}>
                      <DayDetail entry={selectedEntry} meta={meta} nowMin={nowMin} is24={is24} pendingReg={pendingRegs[selectedEntry ? isoOf(meta, selectedEntry.d) : ""]} open={open} />
                    </div>
                  </div>
                </TabPanel>
              ) : null}
              {activeTab === "calendar" ? (
                <TabPanel idBase={TABS_ID} tabKey="calendar" style={{ marginTop: 18 }}>
                  <CalendarGrid month={month} meta={meta} selectedDay={selectedDay} is24={is24} onSelect={(d) => { setSelectedDay(d); setActiveTab("log"); }} nav={calNav} />
                </TabPanel>
              ) : null}
              {activeTab === "requests" ? (
                <TabPanel idBase={TABS_ID} tabKey="requests" style={{ marginTop: 18 }}>
                  <RequestsTab requests={requests} open={open} onWithdraw={(id) => {
                    setRequests((rs) => rs.map((r) => (r.id === id ? Object.assign({}, r, { status: "withdrawn", decided: todayIso }) : r)));
                    setPendingRegs((m) => { const n = Object.assign({}, m); Object.keys(n).forEach((k) => { if (n[k] === id) delete n[k]; }); return n; });
                    say(t("att2.rq.withdrawn", { id: id }));
                  }} />
                </TabPanel>
              ) : null}
              {activeTab === "overtime" ? (
                <TabPanel idBase={TABS_ID} tabKey="overtime" style={{ marginTop: 18 }}>
                  <OvertimeTab ot={ot} open={open} months={MONTHS} is24={is24} />
                </TabPanel>
              ) : null}
            </div>
          </div>
        </main>
        {dialog}
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  /* ============================================================
     HOME'S CLOCK. Not the strip Home used to carry -- that one read
     clocked in / effective so far / expected out / how much of the day
     had passed, four facts about a day she is standing in the middle
     of, three of which this page answers properly. What Home owes her
     is the time she came in and the one button that is hers to press.

     It is rendered FROM HERE so there is one clock: the store, the
     dialogs that move it and the card that reports it are one file.
     ============================================================ */
  function ClockHomeCard({ onPolicy, style }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const live = useClock();
    const nowMin = useNowMin();
    const [modal, setModal] = useState(null);
    const [toast, setToast] = useState(null);
    const is24 = false;
    const meta = MONTHS[1];
    const month = buildMonth(meta, live, nowMin);
    const today = month.days.filter(function (d) { return d.d === meta.today; })[0];

    /* webIn is a punch made here; inSec is whatever marked her in
       today, gate device included. Only the first can be undone from a
       browser. */
    const webIn = live.clockInSec;
    const inSec = webIn != null ? webIn
      : today && today.inT ? toMin(today.inT) * 60 : null;
    const outSec = live.clockOutSec;
    const arrival = inSec != null && today ? today.arrival : null;

    function doIn() {
      const sec = nowSec();
      ClockStore.set({ clockInSec: sec, clockOutSec: null, breaks: [] });
      setModal(null);
      setToast({ id: Date.now(), text: t("att2.ci.done", { t: fmtClock(Math.floor(sec / 60), is24, t) }) });
    }
    function doOut() {
      const sec = nowSec();
      ClockStore.set(function (lv) { return Object.assign({}, lv, { clockOutSec: sec }); });
      setModal(null);
      setToast({ id: Date.now(), text: t("att2.co.done", { t: fmtClock(Math.floor(sec / 60), is24, t) }) });
    }

    const running = inSec != null && outSec == null;

    /* THE DAY IS ONE READING AND ONE ACT. The counter that used to
       tick under it is gone: it asserted "7:47:46 left of your day"
       about a day nobody can spend watching it run down.

       BEFORE THE DAY STARTS, THE READING IS THE ROSTER (designer,
       2026-10-27). There is no punch to report yet, and a card with
       nothing in it but a button says nothing; the window she is
       expected in is the one fact that is true at that hour, and it is
       what the arrival she is about to make will be judged against.
       The moment she is in, the punch replaces it — the roster is
       on the policy below and under every row of the record. Each
       state swaps the reading rather than changing the shape. */
    const blocks = [];
    if (inSec != null) {
      blocks.push({
        k: "in", label: t("att2.home.in"), big: true,
        value: fmtClock(Math.floor(inSec / 60), is24, t),
        color: running ? c.presentText : c.ink,
      });
      if (outSec != null) {
        blocks.push({ k: "out", label: t("att2.home.out"), value: fmtClock(Math.floor(outSec / 60), is24, t) });
        blocks.push({ k: "worked", label: t("att2.home.onClock"), value: fmtHMS(outSec - inSec) });
      }
    } else if (today && today.rs) {
      /* NOT at headline size: a rostered window is two times and a
         dash, and set in the figure the punch uses it both outranks
         the punch it stands in for and wraps onto two lines. */
      blocks.push({
        k: "roster", label: t("att2.home.rostered"),
        value: fmtClock(today.rs.from, is24, t) + " – " + fmtClock(today.rs.to, is24, t),
      });
    }
    /* the act, when there is one. A gate punch is undone at the gate,
       never from a browser, so clocking out is offered only for a
       punch made here. */
    const act = inSec == null
      ? <Button kind="primary" full iconLeft="globe" onClick={function () { setModal("in"); }}>{t("att2.actions.clockIn")}</Button>
      : outSec == null && webIn != null
        ? <Button kind="secondary" full iconLeft="signout" onClick={function () { setModal("out"); }}>{t("att2.co.title")}</Button>
        : null;
    return (
      /* A STRETCHED CARD CENTRES WHAT IT HAS. Pinning the policy link
         to the foot put every spare pixel in one hole under the
         button; the card is a column whose body takes the spare height
         and centres in it, so the air is split above and below and
         reads as room rather than as something missing. */
      <Card
        style={Object.assign({ display: "flex", flexDirection: "column" }, style || {})}
        icon="clock" iconTone={inSec == null ? "off" : outSec != null ? "off" : "present"}
        title={t("att2.home.title")}
        /* a card called "Your day" that never says which day */
        sub={today ? fullDateLabel(today, meta, t) : null}
        action={inSec == null
          ? <StatusMark role="off" glyph="clock" word={t("att2.home.notIn")} />
          : outSec == null && arrival
            ? <StatusMark
              role={arrival.kind === "late" ? "late" : "present"}
              word={arrival.kind === "late" ? t("att2.arr.late", { m: arrival.min }) : arrival.kind === "early" ? t("att2.arr.early", { m: arrival.min }) : t("att2.arr.ontime")}
            />
            : null}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, minHeight: 0 }}>
          {blocks.length ? (
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              {blocks.map(function (bl) {
                /* THE PUNCH IS THE HEADLINE — a size step is a claim
                   about rank, and what time you came in outranks what
                   came after it. */
                return <StatBlock key={bl.k} label={bl.label} value={bl.value} color={bl.color} size={bl.big ? 28 : "md"} />;
              })}
            </div>
          ) : null}
          {act ? (
            /* THE WIDTH OF THE CARD (designer, 2026-10-27). A button
               floating at a third of the width reads as a leftover, so
               the act takes the card and the reading sits above it
               rather than beside it. */
            <div>
              {act}
              {inSec == null ? (
                <div style={ty("caption", { color: c.inkFaint, marginTop: 8 })}>{t("att2.home.gate")}</div>
              ) : null}
            </div>
          ) : null}

          {onPolicy ? (
            <div><LinkButton onClick={onPolicy}>{t("att2.actions.policy")}</LinkButton></div>
          ) : null}
        </div>

        {modal === "in" && today ? <ClockInDialog today={today} is24={is24} onClose={function () { setModal(null); }} onConfirm={doIn} /> : null}
        {modal === "out" && today ? <ClockOutDialog today={today} live={live} is24={is24} onClose={function () { setModal(null); }} onConfirm={doOut} /> : null}
        <Toast toast={toast} onClose={function () { setToast(null); }} />
      </Card>
    );
  }

  /* THE READER'S LIVE PUNCH, IN THE REGISTER'S WORDS. My team draws
     every card from the department register, which was written this
     morning; the one row that can change while the page is open is the
     reader's own, because she can clock in from Home. This answers in
     DH-03's vocabulary so the card does not have to know two, and the
     grace period and the roster are applied here, where they are
     defined. Null when she has not punched here. */
  function myDayNow() {
    const live = ClockStore.get();
    /* ONLY A LIVE PUNCH ANSWERS. Without one this would hand back the
       personal attendance fixture, which every role shares -- and a
       head of department would read her own card as "no punch yet"
       while everybody else read her register row. A punch she has just
       made here is hers whoever she is; anything else belongs to the
       register. */
    if (live.clockInSec == null) return null;
    const nowMin = Math.floor(nowSec() / 60);
    const meta = MONTHS[1];
    const month = buildMonth(meta, live, nowMin);
    const e = month.days.filter(function (d) { return d.d === meta.today; })[0];
    if (!e) return null;
    const kind = e.arrival ? e.arrival.kind : null;
    const status = e.status === "progress" || e.status === "present" || e.status === "late"
      ? (kind === "late" ? "late" : "present")
      : e.status === "notyet" ? "missing" : e.status;
    return { status: status, inTime: e.inT || null, verify: e.src === "web" ? "web" : "bio" };
  }

  window.NaveyaClock = { store: ClockStore, use: useClock, HomeCard: ClockHomeCard, myDayNow: myDayNow };

  window.Pages3 = window.Pages3 || {};
  window.Pages3.Attendance = Attendance;
})();
