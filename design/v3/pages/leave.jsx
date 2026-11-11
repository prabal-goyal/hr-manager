/* @jsxRuntime classic */
/* ============================================================
   Naveya — Leave · window.Pages3.Leave

   SPEC: M8 (Leave) with its entity catalog §6.7, on the M7 academic-
   calendar frame; the LOP link is M8 -> M10 "unpaid/exhausted -> LOP
   into payroll". Guardrails: docs/ui-compliance-requirements.md A26
   (apply — disabled+reason in a blackout term or when balance is
   short, with the rule stated), A28 (an approved leave is HR's to
   cancel, not the employee's), O6 (attribution visible where the
   decision is read), §4 Employee row ("no self-approval").

   ONE SCREEN, ONE QUESTION — "what leave do I have, and how do I ask
   for more?" Four blocks answer it:
     1. What you have      — LeaveBalance per type, as accrued on a
                             stated date, with the ledger that makes
                             the balance checkable (opening + accrued
                             − taken = balance) and the accrual RULE
                             in words, because accrual is the thing
                             teachers misunderstand.
     2. Apply              — the request, with every school-specific
                             constraint surfaced BEFORE submission:
                             day count, balance, LOP in rupees,
                             exam/admission blackout, term-vs-vacation,
                             the cover arrangement, and where it goes
                             for approval.
     3. When school can't  — the M7 windows that shape 2.
        spare you
     4. Your requests      — the audit-legible trail: who decided,
                             when, and on what note.

   WHAT THIS SCREEN DELIBERATELY REFUSES
   · No approve / reject / any second-person control. Approval is the
     Dept Head's and the Principal's screen (M8 workflow), never the
     applicant's — "no self-approval of anything".
   · No withdraw on an APPROVED request. Once approved it has touched
     paid-days; cancelling it is HR's action with a stated payroll
     consequence (A28). The menu item stays visible and disabled with
     the reason, per the offered/disabled/absent rule.
   · No Earned-leave application path. M8: `applies_to_vacation_staff`
     gates EL for teachers, and the acceptance criterion is explicit —
     "a teacher (teaching staff) cannot accrue EL". So EL is shown as a
     rule, not as a balance she can spend, and it is absent from the
     type picker.
   · No colleague's leave, anywhere. A shared "who is out" list leaks
     absence and, worse, leave TYPE (medical = health data) — §8-F14.
   · No invented projection. LeaveBalance (§6.7) carries opening /
     accrued / used / balance and LeaveType carries accrual_rule; a
     year-end figure is shown ONLY where that rule makes it
     deterministic, and it is labelled as expected, not promised.

   2026-09-18 designer pass (NA-63): balances cut to a figure, a vivid
   bar and one line; applying is a guided side screen (details → cover
   your classes → review) that also serves an existing request waiting
   on cover; the request table selects whole rows; the detail panel
   shows the reason as a note. Composed from window.G3 + window.UI3.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo, useRef, useEffect } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Field, Input, Select, Switch,
    StatusMark, Meter, Figure, Icon, EmptyState, inr, num, profileFor,
    SideScreen,
  } = UI;

  /* ============================================================
     STRINGS — lv.* is this screen's namespace. Short weekday names
     are REUSED from att.* (screens.jsx): one source per fact.
     ============================================================ */
  addStrings({
    en: {
      "lv.pageTitle": "Leave",
      "lv.session": "Academic session 2026–27 · Term 1",

      "lv.mon.1": "January", "lv.mon.2": "February", "lv.mon.3": "March",
      "lv.mon.4": "April", "lv.mon.5": "May", "lv.mon.6": "June",
      "lv.mon.7": "July", "lv.mon.8": "August", "lv.mon.9": "September",
      "lv.mon.10": "October", "lv.mon.11": "November", "lv.mon.12": "December",

      /* ---- balances ---- */
      "lv.bal.leftOf": "left of {n}",
      "lv.bal.earned": "left of {n} earned",
      "lv.bal.days": "days",
      "lv.bal.day": "day",
      "lv.bal.ledger": "Opened with {o} · added {a} · taken {u}",
      "lv.bal.aria": "{name}: {have} days left of {total}",
      "lv.bal.held": "{n} of these are held by a request still awaiting approval.",

      "lv.type.cl": "Casual leave",
      "lv.type.sl": "Medical leave",
      "lv.type.comp": "Comp-off",
      "lv.type.el": "Earned leave",

      "lv.rule.cl": "Credited in full on 1 April. It does not build up month by month, so an unused day is not money in the bank.",
      "lv.rule.sl": "One day is added at the end of every month, up to {cap} in a session.",
      "lv.rule.comp": "Earned by working a holiday or a Sunday — never granted. Each day lapses 90 days after you earn it.",
      "lv.rule.el": "Earned leave does not accrue for teaching staff \u2014 your paid break is the school vacation itself.",
      "lv.rule.elMark": "Not for teaching staff",
      "lv.proj.sl": "If you take none, you will have {n} by 31 March 2027.",
      "lv.lapse.comp": "The older day lapses on 10 October 2026.",

      /* ---- the one thing demanding action ---- */
      "lv.cover.chip": "Waiting on you",
      "lv.cover.title": "Your August leave needs a cover arrangement",
      "lv.cover.body": "Anjali Deshpande cannot approve 24\u201325 August until someone covers your classes. Pick a colleague and she will be asked to confirm.",
      "lv.cover.meta": "Casual leave · Mon 24 – Tue 25 August · applied 9 August",
      "lv.cover.cta": "Nominate a colleague",
      "lv.cover.view": "See the request",

      /* ---- apply ---- */
      "lv.apply.title": "Ask for leave",
      "lv.apply.sub": "Nothing is deducted until it is approved.",
      "lv.apply.type": "Kind of leave",
      "lv.apply.typeLeft": "{name} · {n} left",
      "lv.apply.from": "First day",
      "lv.apply.to": "Last day",
      "lv.apply.half": "Only half the day",
      "lv.apply.halfWhich": "Which half",
      "lv.apply.halfFirst": "First half (morning)",
      "lv.apply.halfSecond": "Second half (afternoon)",
      "lv.apply.reason": "Why you need it",
      "lv.apply.reasonHint": "Your head of department reads this. It is not shown on any shared roster.",
      "lv.apply.reasonPh": "A line is enough.",
      "lv.apply.errReason": "Tell your head of department why — one line is enough.",
      "lv.apply.errOrder": "The last day cannot come before the first day.",
      "lv.apply.errNone": "These dates are all Sundays or school holidays, so there is nothing to apply for.",
      "lv.apply.submit": "Send for approval",
      "lv.apply.foot": "You can withdraw it yourself any time before it is approved.",
      "lv.apply.sent": "Sent to Anjali Deshpande. You will get a message when she decides.",

      "lv.chk.title": "What this means",
      "lv.chk.days": "{n} school days — {range}. Sundays and school holidays are not counted.",
      "lv.chk.daysHalf": "Half a day — {range}.",
      "lv.chk.balOk": "All {n} come out of your {name}, and you will still have {left} after.",
      "lv.chk.balShort": "Only {have} can come from your {name}. The other {short} has nothing left to draw on.",
      "lv.chk.wordLop": "Unpaid",
      "lv.chk.lopOne": "One thirtieth of your monthly gross, for the day with no balance left. The exact figure is worked out in the {mon} run.",
      "lv.chk.lopMany": "{n} thirtieths of your monthly gross, for the days with no balance left. The exact figure is worked out in the {mon} run.",
      "lv.chk.blackClear": "Clear of every closed window. The nearest is {name}, {dates}.",
      "lv.chk.blackHit": "{name} runs {dates}. Leave cannot be approved inside it — pick dates outside that window.",
      "lv.chk.term": "School is open on these days, so they come out of your balance. A vacation window would not.",
      "lv.chk.vac": "These days fall inside {name} ({dates}), when school is closed. Vacation needs no leave application.",
      "lv.chk.cover": "Someone must cover your classes across these days before Anjali Deshpande can approve it.",
      "lv4.reasonBy": "What you wrote · applied {date}",
      "lv5.pol.cl": "12 days a session, credited 1 April, lapsing 31 March. Up to two days your head decides; from three the principal signs too.",
      "lv5.pol.sl": "One day added at the end of every month, up to 10 a session. Beyond three days in a row, a medical certificate is asked for.",
      "lv5.pol.comp": "Earned a day at a time by working a rostered holiday or an exam duty. Each credit lapses 90 days after the day that earned it.",
      "lv5.pol.elTeaching": "Earned leave is not part of teaching terms \u2014 the vacations take its place. Absent rather than zero, because the right does not exist.",
      "lv5.pol.elOffice": "12-month staff accrue monthly, up to 15 days a session. Unused days carry forward to the policy cap and are paid out on exit.",
      "lv4.st.coverGone": "Cover declined",
      "lv4.tCover.asked": "{who} asked to take the classes",
      "lv4.tCover.accepted": "{who} agreed to take the classes",
      "lv4.tCover.declined": "{who} cannot take the classes",
      "lv4.act.rename": "Name another colleague",
      "lv4.act.renameSend": "Ask this colleague",
      "lv4.act.renameWhy": "{who} cannot take these classes, so the request is stuck here until somebody else does.",
      "lv4.act.renameDone": "{who} has been asked to take your classes for {id}.",
      "lv4.cov.required": "Somebody has to hold these classes before the request can go anywhere. Choose one colleague — you cannot leave it for later.",
      "lv4.chain1": "{a} decides it.",
      "lv4.chain2": "{a} first, then {b}.",
      "lv4.chain3": "{a}, then {b}, then {c} signs.",
      "lv4.stepThen": "{name} approves, and passes it on",
      "lv4.stepLast": "{name} approves or declines",
      "lv4.tWith": "With {name} now",
      "lv4.tThen": "Then {name}",
      "lv4.top.head": "Leave is not yours to apply for",
      "lv4.top.body": "You are at the top of the chain, so yours is arranged with the trust office outside Naveya. What you do here is decide everyone else's.",
      "lv4.top.cta": "Go to leave decisions",

      "lv.chk.route": "Goes to Anjali Deshpande, Head of Science. From three days the Principal signs too; past fifteen, the Director as well.",
      "lv.chk.wordOk": "All good",
      "lv.chk.wordCheck": "Careful",
      "lv.chk.wordStop": "Blocked",
      "lv.chk.wordNote": "Note",

      /* ---- windows ---- */
      "lv.win.title": "Dates that affect your leave",
      "lv.win.sub": "Exam and admission weeks take no leave; vacations need none.",
      "lv.win.closedWord": "No leave",
      "lv.win.vacWord": "School closed",
      "lv.win.exam1": "Term-1 examinations", "lv.win.exam1d": "14 – 19 September 2026",
      "lv.win.admis": "Admissions week", "lv.win.admisd": "5 – 10 January 2027",
      "lv.win.result": "Result week", "lv.win.resultd": "26 – 31 March 2027",
      "lv.win.autumn": "Autumn break", "lv.win.autumnd": "12 – 21 October 2026",
      "lv.win.winter": "Winter vacation", "lv.win.winterd": "24 December 2026 – 3 January 2027",

      /* ---- history ---- */
      "lv.hist.title": "Your leave requests",
      "lv.hist.colDates": "Dates",
      "lv.hist.colType": "Kind",
      "lv.hist.colDays": "Days",
      "lv.hist.colStatus": "Where it stands",
      "lv.hist.colWho": "Decided by",
      "lv.hist.rowAria": "Open request {id}",

      "lv.f.all": "All", "lv.f.pending": "Awaiting approval", "lv.f.approved": "Approved",
      "lv.f.rejected": "Not approved", "lv.f.withdrawn": "Withdrawn",
      "lv.f.aria": "Filter your requests",
      "lv.empty.head": "Nothing withdrawn this session",
      "lv.empty.body": "Anything still awaiting approval can be withdrawn from its own row.",

      "lv.st.pending": "Awaiting approval",
      "lv.st.cover": "Waiting on your cover",
      "lv.st.approved": "Approved",
      "lv.st.rejected": "Not approved",
      "lv.st.withdrawn": "Withdrawn",

      "lv.act.withdraw": "Withdraw this request",

      /* ---- detail ---- */
      "lv.d.title": "Request {id}",
      "lv.d.pick": "Pick a request",
      "lv.d.pickBody": "Choose a row on the left to see who decided it, when, and what they wrote.",
      "lv.d.reason": "What you wrote",
      "lv.d.effect": "Effect on your balance",
      "lv.d.effectPending": "{n} {unit} will come off your {name} when it is approved. Nothing has been deducted yet.",
      "lv.d.effectApproved": "{n} {unit} came off your {name} on {date}.",
      "lv.d.effectRejected": "Nothing was deducted. Your {name} is untouched.",
      "lv.d.trail": "The trail",
      "lv.d.tApplied": "You applied",
      "lv.d.tRouted": "Sent to Anjali Deshpande, Head of Science",
      "lv.d.tCover": "Waiting for a cover arrangement from you",
      "lv.d.tApproved": "Approved by Anjali Deshpande",
      "lv.d.tRejected": "Not approved by Anjali Deshpande",
      "lv.d.note.preboard": "“Class 12 pre-board invigilation is on those days. Try the week after.”",

      "lv.person.hod": "Anjali Deshpande",
      "lv.r.wedding": "Cousin’s wedding in Jaipur — travelling with family.",
      "lv.r.family": "Family commitment at home.",
      "lv.r.travel": "Booked travel with family.",
      "lv.r.fever": "Viral fever, on the doctor’s advice.",
      "lv.r.personal": "Personal work.",
      "lv.r.draft": "Escorting my parents to Haridwar — the tickets are already booked.",
      "lv.half.first": "First half",
      "lv.half.second": "Second half",
    },

  });

  /* ============================================================
     DATA — one school, one teacher, figures that reconcile.
     Ananya Rao, PGT Physics, Sunrise Public School (the same person
     Home and My Attendance describe). Today is 11 August 2026.
     ============================================================ */
  const TODAY_ISO = "2026-08-11";

  /* Her monthly gross, taken from the July payslip Home already shows
     (screens.jsx PAY.gross) so the LOP figure this screen quotes and
     the payslip she will later open agree. A day of loss of pay is one
     thirtieth of monthly gross — the paid-days convention in M9
     ("paid-days = present + paid-leave + holidays + weekly-offs − LOP"). */
  const MONTHLY_GROSS = 94800.0;
  const LOP_DAY_RATE = MONTHLY_GROSS / 30;

  /* campus holiday calendar (M7 Holiday) — a leave day is never spent
     on one of these, so they are not counted in a request */
  const HOLIDAYS = [
    "2026-08-15", "2026-08-28", "2026-09-04", "2026-10-02",
    "2026-10-20", "2026-11-05", "2027-01-26", "2027-03-04",
  ];

  /* M7 Term windows, chronological. `blackout` = leave cannot be
     approved inside it (M8 "exam/admission blackout validation against
     Term"); `vacation` = school is closed, so leave is not the right
     instrument at all — the vacation-staff distinction made concrete. */
  const WINDOWS = [
    { key: "lv.win.exam1", dateKey: "lv.win.exam1d", kind: "blackout", from: "2026-09-14", to: "2026-09-19" },
    { key: "lv.win.autumn", dateKey: "lv.win.autumnd", kind: "vacation", from: "2026-10-12", to: "2026-10-21" },
    { key: "lv.win.winter", dateKey: "lv.win.winterd", kind: "vacation", from: "2026-12-24", to: "2027-01-03" },
    { key: "lv.win.admis", dateKey: "lv.win.admisd", kind: "blackout", from: "2027-01-05", to: "2027-01-10" },
    { key: "lv.win.result", dateKey: "lv.win.resultd", kind: "blackout", from: "2027-03-26", to: "2027-03-31" },
  ];

  /* LeaveBalance (§6.7): opening + accrued − used = balance. The
     balance is DERIVED below, never typed, so the ledger a reader can
     add up is the ledger the code adds up.
     `mode` names the LeaveType.accrual_rule in plain terms:
       credited — the whole entitlement lands on 1 April
       monthly  — one day at the end of each completed month, capped
       earned   — only by working a holiday; lapses
       none     — the type does not apply to this employee at all
                  (M8: `applies_to_vacation_staff` gates EL for
                  teachers, and the acceptance criterion is that a
                  vacation-staff teacher CANNOT accrue EL) */
  const BALANCES = [
    { code: "CL", key: "lv.type.cl", role: "ltCasual", mode: "credited", opening: 12, accrued: 0, used: 4, annual: 12 },
    { code: "SL", key: "lv.type.sl", role: "ltSick", mode: "monthly", opening: 4, accrued: 4, used: 2, annual: 10, perMonth: 1, monthsLeft: 8 },
    { code: "COMP", key: "lv.type.comp", role: "ltComp", mode: "earned", opening: 0, accrued: 3, used: 1, annual: null },
    { code: "EL", key: "lv.type.el", role: "ltEL", mode: "none", opening: 0, accrued: 0, used: 0, annual: null },
  ];
  BALANCES.forEach((b) => { b.balance = b.opening + b.accrued - b.used; });
  /* 12-month (non-vacation) staff accrue Earned leave monthly — the
     other half of the vacation-staff rule */
  const EL_OFFICE = { code: "EL", key: "lv.type.el", role: "ltEL", mode: "elMonthly", opening: 0, accrued: 5, used: 1, annual: 15 };
  EL_OFFICE.balance = EL_OFFICE.opening + EL_OFFICE.accrued - EL_OFFICE.used;
  /* the signed-in person's profile (set by the page each render) */
  let ME = null;
  function me() { return ME || profileFor("employee"); }
  function balancesNow() { return me().vacationStaff ? BALANCES : BALANCES.map((b) => (b.code === "EL" ? EL_OFFICE : b)); }
  function applyTypesNow() { return me().vacationStaff ? APPLY_TYPES : APPLY_TYPES.concat(["EL"]); }
  function approver(t) { return t(me().approverKey); }
  function approverLong(t) { return t(me().approverKey + "Long"); }
  const LF = window.LeaveFlow;
  /* who has to say yes to a request this long. A department head's own
     approver IS the principal, so she never appears twice. */
  function chainNamesFor(t, n) {
    const out = [approver(t)];
    const pr = t("prof.a.principal"), dr = t("prof.a.director");
    if (n >= 3 && out.indexOf(pr) === -1) out.push(pr);
    if (n > 15 && out.indexOf(dr) === -1) out.push(dr);
    return out;
  }
  function chainLine(t, n) {
    const x = chainNamesFor(t, n);
    return x.length === 1 ? t("lv4.chain1", { a: x[0] })
      : x.length === 2 ? t("lv4.chain2", { a: x[0], b: x[1] })
        : t("lv4.chain3", { a: x[0], b: x[1], c: x[2] });
  }
  function balanceOf(code) {
    const b = balancesNow().filter((x) => x.code === code)[0];
    return b ? b.balance : 0;
  }

  /* LeaveRequest (§6.7) rows for this session. `used` above is exactly
     the sum of the APPROVED days here — a pending request holds days
     but has not spent them, and that difference is stated on the
     balance card rather than hidden. */
  const REQUESTS = [
    { id: "LR-0219", type: "CL", from: "2026-08-24", to: "2026-08-25", days: 2, status: "pending", applied: "2026-08-09", reason: "lv.r.wedding",
      coverBy: { one: "meeraj", note: "" }, coverAsked: "2026-08-09", coverState: "asked" },
    { id: "LR-0207", type: "CL", from: "2026-08-05", to: "2026-08-05", days: 1, status: "approved", applied: "2026-08-01", decided: "2026-08-03", reason: "lv.r.family" },
    { id: "LR-0198", type: "CL", from: "2026-07-22", to: "2026-07-24", days: 3, status: "rejected", applied: "2026-07-15", decided: "2026-07-18", reason: "lv.r.travel", note: "lv.d.note.preboard" },
    { id: "LR-0186", type: "SL", from: "2026-07-09", to: "2026-07-10", days: 2, status: "approved", applied: "2026-07-08", decided: "2026-07-08", reason: "lv.r.fever" },
    { id: "LR-0171", type: "COMP", from: "2026-07-03", to: "2026-07-03", days: 1, status: "approved", applied: "2026-06-29", decided: "2026-07-01", reason: "lv.r.personal" },
    { id: "LR-0154", type: "CL", from: "2026-06-17", to: "2026-06-17", days: 0.5, half: "second", status: "approved", applied: "2026-06-15", decided: "2026-06-16", reason: "lv.r.personal" },
    { id: "LR-0132", type: "CL", from: "2026-05-22", to: "2026-05-22", days: 0.5, half: "first", status: "approved", applied: "2026-05-20", decided: "2026-05-21", reason: "lv.r.personal" },
    { id: "LR-0108", type: "CL", from: "2026-04-20", to: "2026-04-21", days: 2, status: "approved", applied: "2026-04-15", decided: "2026-04-17", reason: "lv.r.family" },
  ];
  /* days a pending request is holding, per type — computed, not typed */
  function heldOf(code) {
    return REQUESTS.reduce((s, r) => (r.type === code && r.status === "pending" ? s + r.days : s), 0);
  }

  /* the types she can actually apply for. EL is ABSENT rather than
     disabled: the right does not exist for teaching staff at all, and
     the offered/disabled/absent rule says a right the role never
     carries is not drawn. The rule itself is still taught, once, on
     the balance card. */
  const APPLY_TYPES = ["CL", "SL", "COMP"];

  /* ============================================================
     Dates — every weekday is derived from a real Date, never typed.
     ISO strings are parsed as LOCAL dates (new Date("2026-10-08") is
     UTC midnight and can slide a day depending on the box's zone).
     ============================================================ */
  function parseISO(s) {
    const p = s.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function toISO(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dayLabel(t, iso) {
    const d = parseISO(iso);
    return t("att.d" + d.getDay()) + " " + d.getDate() + " " + t("lv.mon." + (d.getMonth() + 1)) + " " + d.getFullYear();
  }
  function rangeLabel(t, from, to) {
    return from === to ? dayLabel(t, from) : dayLabel(t, from) + " – " + dayLabel(t, to);
  }
  function monthName(t, iso) { return t("lv.mon." + (parseISO(iso).getMonth() + 1)); }

  /* half days are real (M8 `allows_half_day` / `is_half_day`), so a
     balance is never rounded away */
  function days(n) {
    return n % 1 === 0 ? num(n) : num(Math.floor(n)) + "." + String(Math.round((n % 1) * 10));
  }

  /* school days in a range: Sundays and campus holidays are not leave */
  function workingDays(from, to, half) {
    if (half) return 0.5;
    let n = 0;
    const end = parseISO(to);
    const d = parseISO(from);
    while (d <= end) {
      const iso = toISO(d);
      if (d.getDay() !== 0 && HOLIDAYS.indexOf(iso) === -1) n += 1;
      d.setDate(d.getDate() + 1);
    }
    return n;
  }
  function overlapWindow(from, to, kind) {
    for (let i = 0; i < WINDOWS.length; i++) {
      const w = WINDOWS[i];
      if (w.kind !== kind) continue;
      if (parseISO(from) <= parseISO(w.to) && parseISO(to) >= parseISO(w.from)) return w;
    }
    return null;
  }
  function nextWindowAfter(iso, kind) {
    const from = parseISO(iso);
    for (let i = 0; i < WINDOWS.length; i++) {
      const w = WINDOWS[i];
      if (w.kind === kind && parseISO(w.to) >= from) return w;
    }
    return null;
  }

  /* short codes are AUTHORED per language, never sliced from the full
     name — truncating Devanagari mid-syllable makes two leave types
     collide, which is exactly the bug the weekday pills already hit */
  addStrings({
    en: {
      "lv.code.CL": "CL", "lv.code.SL": "ML", "lv.code.COMP": "CO", "lv.code.EL": "EL",
      "lv.hist.since": "with her since {date}",
      "lv.hist.halfNote": "{which} only",
      "lv.hist.selfNote": "you",
    },
  });

  const TYPE_KEY = { CL: "lv.type.cl", SL: "lv.type.sl", COMP: "lv.type.comp", EL: "lv.type.el" };
  const TYPE_ROLE = { CL: "ltCasual", SL: "ltSick", COMP: "ltComp", EL: "ltEL" };
  const STATUS_ROLE = { pending: "late", approved: "present", rejected: "absent", withdrawn: "off" };

  /* compact register form of a range: "24 – 25 Aug 2026" */
  function shortRange(t, from, to) {
    const a = parseISO(from), b = parseISO(to);
    const ma = t("lv.mon." + (a.getMonth() + 1)), mb = t("lv.mon." + (b.getMonth() + 1));
    if (from === to) return a.getDate() + " " + ma + " " + a.getFullYear();
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
      return a.getDate() + " – " + b.getDate() + " " + ma + " " + a.getFullYear();
    }
    return a.getDate() + " " + ma + " – " + b.getDate() + " " + mb + " " + b.getFullYear();
  }

  /* ============================================================
     Local primitives — PROMOTION CANDIDATES for kit.jsx, kept local
     here because this dispatch owns only its own page files.
     ============================================================ */

  /* TextArea — the kit has Input and Select but no multi-line field,
     and a leave reason is the first place the product needs one. */
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

  /* CodeMark — the leave type's authored short code in its own tint.
     The CODE is the label; the tint only reinforces it, so the card
     survives greyscale (DESIGN 8). */
  function CodeMark({ code, size }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const role = TYPE_ROLE[code] || "ltEL";
    const s = size || 26;
    return (
      <span
        aria-hidden="true"
        style={ty("caption", {
          width: s, minWidth: s, height: s, borderRadius: G3.r.xs,
          background: c[role + "Tint"], color: c[role + "Text"],
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 10.5, flexShrink: 0, letterSpacing: "0",
        })}
      >
        {t("lv.code." + code)}
      </span>
    );
  }

  /* CheckRow — one honest consequence of the request being drafted.
     Word AND colour, always; a stopped check reads as "Blocked" even
     with every colour removed. */
  function CheckRow({ tone, word, icon, text, figure, last }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <li
        style={{
          display: "flex", gap: 12, alignItems: "flex-start",
          padding: "11px 0", listStyle: "none",
          borderBottom: last ? "none" : "1px dashed " + c.border,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 26, height: 26, borderRadius: G3.r.xs, flexShrink: 0,
            background: c[tone + "Tint"], color: c[tone + "Text"],
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name={icon} size={14} />
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={ty("small", { display: "block", color: c[tone + "Text"], fontWeight: 700 })}>{word}</span>
          {figure != null ? (
            <span style={{ display: "block", margin: "3px 0 2px" }}>
              <Figure value={figure} size="md" weight={700} color={c[tone + "Text"]} />
            </span>
          ) : null}
          <span style={ty("small", { display: "block", color: c.inkMuted })}>{text}</span>
        </span>
      </li>
    );
  }

  /* ============================================================
     2026-09-18 designer pass (NA-63) — new strings. lv2.* so the old
     lv.* vocabulary above stays untouched for anything still using it.
     ============================================================ */
  addStrings({
    en: {
      "lv2.apply": "Apply for leave",
      "lv3.tRouted": "Sent to {name}",
      "lv3.tApproved": "Approved by {name}",
      "lv3.tRejected": "Not approved by {name}",
      "lv3.bal.el": "Earned monthly, 15 a year",
      "lv2.bal.of": "of {n}",
      "lv2.bal.ofEarned": "of {n} earned",
      "lv2.bal.held": "{n} on hold for a pending request",
      "lv2.bal.cl": "Credited in full on 1 April",
      "lv2.bal.sl": "+1 day each month, up to {cap}",
      "lv2.bal.comp": "1 day lapses on 10 Oct",
      "lv2.bal.el": "Covered by school vacations",

      "lv2.banner.title": "{id} needs someone to take your classes",
      "lv2.banner.cta": "Choose a colleague",
      "lv2.banner.view": "View request",
      "lv2.banner.waitTitle": "Waiting for {who} to confirm cover",
      "lv2.banner.waitBody": "{id} · {dates}. You'll get a message when they reply; then it goes to {name}.",

      "lv2.step.details": "Leave details",
      "lv2.step.cover": "Cover your classes",
      "lv2.step.review": "Review",
      "lv2.step.of": "Step {n} of {total}",
      "lv2.next": "Continue",
      "lv2.back": "Back",
      "lv2.send": "Send request",
      "lv2.cancel": "Cancel",
      "lv2.close": "Close",

      "lv2.f.type": "Leave type",
      "lv2.f.left": "{n} left",
      "lv2.f.from": "First day",
      "lv2.f.to": "Last day",
      "lv2.f.session": "Which part of the day",
      "lv2.f.full": "Full day",
      "lv2.f.first": "First half",
      "lv2.f.second": "Second half",
      "lv2.f.reason": "Reason",
      "lv2.f.reasonPh": "A line is enough. Only your head of department sees it.",
      "lv2.sum": "{n} school days · {left} {name} left after this",
      "lv2.sumOne": "{n} school day · {left} {name} left after this",
      "lv2.iss.blackout": "{name} runs {dates}. Leave can't be approved inside it.",
      "lv2.iss.vacation": "{name} ({dates}) — school is closed, no leave needed.",
      "lv2.iss.short": "Only {have} left, so {short} day will be unpaid (loss of pay).",
      "lv2.iss.shortPl": "Only {have} left, so {short} days will be unpaid (loss of pay).",
      "lv2.iss.none": "These are all Sundays or school holidays — nothing to apply for.",
      "lv2.iss.order": "The last day can't be before the first day.",
      "lv2.iss.reason": "Add a reason to continue",
      "lv2.cov.q": "Who will take your classes on {dates}?",
      "lv2.cov.avail": "Available",
      "lv2.banner.body2": "{type} · {dates}. {name} approves once a colleague has agreed to cover.",
      "lv2.cov.none": "You have no classes on these days, so nobody needs to cover.",
      "lv2.cov.suggested": "Best match",
      "lv2.cov.onLeave": "On leave these days",
      "lv2.cov.load": "{n} covers this month",
      "lv2.cov.loadOne": "{n} cover this month",
      "lv2.cov.pick": "Choose a colleague",
      "lv2.cov.note": "Note for your colleague (optional)",
      "lv2.cov.notePh": "e.g. XI-A: revise Ch 5 numericals; lab manuals are in the Physics lab cupboard",
      "lv2.cov.needOne": "Choose a colleague to continue",

      "lv2.rev.leave": "Leave",
      "lv2.rev.dates": "Dates",
      "lv2.rev.balance": "Balance after",
      "lv2.rev.reason": "Reason",
      "lv2.rev.cover": "Cover",
      "lv2.rev.next": "What happens next",
      "lv2.rev.step1": "{who} confirms the cover",
      "lv2.rev.step2": "{name} approves or declines",
      "lv2.rev.step2only": "{name} approves or declines",
      "lv2.rev.withdraw": "You can withdraw it yourself any time before it's approved.",
      "lv2.rev.none": "No classes to cover",

      "lv2.sent": "{id} sent. {who} will be asked to confirm cover first.",
      "lv2.sentNoCover": "{id} sent to {name}.",
      "lv2.coverSent": "{who} has been asked to cover {id}.",
      "lv2.withdrawn": "{id} withdrawn.",
      "lv2.dismiss": "Dismiss",

      "lv2.st.coverWait": "Cover being confirmed",
      "lv2.d.note": "Reason for leave",
      "lv2.d.cover": "Cover",
      "lv2.d.tCoverAsked": "Asked {who} to cover",
      "lv2.row.aria": "Open request {id}",
    },
  });

  /* ============================================================
     TIMETABLE + COLLEAGUES (mock). In the product these come from the
     campus timetable (substitution, M7/M9) — the same Science
     department Anjali Deshpande's screen lists.
     ============================================================ */
  /* the school has no timetable in the product yet, so cover is
     arranged by DAY, not by period: one colleague takes her classes on
     the days she is away. Availability is simply "not on leave". */
  const COLLEAGUES = [
    /* ids match the shared roster in leaveflow.jsx, so a cover named
       here resolves in the queue the approvers read */
    { id: "meeraj", name: "Meera Joshi", role: "PGT Physics", physics: true, load: 1 },
    { id: "karan", name: "Karan Mehta", role: "PGT Physics", physics: true, load: 3 },
    { id: "sanjay", name: "Sanjay Verma", role: "TGT Chemistry", physics: false, load: 0, away: ["2026-08-18", "2026-08-22"] },
    { id: "ramesh", name: "Ramesh Iyer", role: "PGT Chemistry", physics: false, load: 2 },
    { id: "priya", name: "Priya Nair", role: "TGT Biology", physics: false, load: 1, away: ["2026-08-24", "2026-08-28"] },
  ];
  function colleague(id) { return COLLEAGUES.filter((x) => x.id === id)[0]; }
  /* the name is the shared roster's, translated with everything else —
     COLLEAGUES only carries the cover facts (subject, load, away days) */
  function colName(t, id) {
    const p = LF && LF.personById ? LF.personById(id) : null;
    if (p) return t(p.nameKey);
    const base = colleague(id);
    return base ? base.name : "";
  }

  /* the school days in a range she'd be away (not Sundays, holidays or vacation) */
  function schoolDaysFor(from, to) {
    const out = [];
    if (!from || !to || parseISO(to) < parseISO(from)) return out;
    const end = parseISO(to);
    const d = parseISO(from);
    while (d <= end) {
      const iso = toISO(d);
      const inVac = WINDOWS.some((w) => w.kind === "vacation" && parseISO(iso) >= parseISO(w.from) && parseISO(iso) <= parseISO(w.to));
      if (d.getDay() !== 0 && HOLIDAYS.indexOf(iso) === -1 && !inVac) out.push(iso);
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  function awayOn(col, isos) {
    return !!col.away && isos.some((iso) => parseISO(iso) >= parseISO(col.away[0]) && parseISO(iso) <= parseISO(col.away[1]));
  }
  /* ranked: available first, then same subject, then fewest covers this month */
  function rankColleagues(isos) {
    return COLLEAGUES.map((col) => ({ col: col, away: awayOn(col, isos) }))
      .sort((a, b) => (a.away - b.away) || ((b.col.physics ? 1 : 0) - (a.col.physics ? 1 : 0)) || (a.col.load - b.col.load));
  }

  /* ============================================================
     LOCAL PRIMITIVES — side-screen dialog, choice cards, toast.
     Same pattern as My Attendance (attendance.jsx); promotion
     candidates for kit.jsx.
     ============================================================ */
  /* the toast's dismiss glyph — the side panel's own close button
     now lives in kit.jsx with the panel it belongs to */
  function CloseGlyph() {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  /* numbered step indicator — the steps ARE a sequence, so the numbers carry meaning */
  function Steps({ steps, at }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <ol aria-label={t("lv2.step.of", { n: at + 1, total: steps.length })} style={{ display: "flex", gap: 8, listStyle: "none", margin: "16px 0 0", padding: 0 }}>
        {steps.map((s, i) => {
          const done = i < at, on = i === at;
          return (
            <li key={s} aria-current={on ? "step" : undefined} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ height: 4, borderRadius: 99, background: done || on ? c.accent : c.sunken, marginBottom: 7 }} />
              <span style={ty("caption", { color: on ? c.ink : done ? c.inkMuted : c.inkFaint, fontWeight: on ? 700 : 600, display: "flex", gap: 6, alignItems: "center" })}>
                <span style={G3.fig("micro", { color: on ? c.action : c.inkFaint, fontWeight: 700 })}>{i + 1}</span>{t(s)}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

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
      if (!items[j].disabled) { onChange(items[j].key); if (refs.current[j]) refs.current[j].focus(); }
    }
    return (
      <div role="radiogroup" aria-label={name} style={{ display: "grid", gridTemplateColumns: "repeat(" + (cols || 2) + ", minmax(0, 1fr))", gap: 8 }}>
        {items.map((it, i) => {
          const on = it.key === value;
          return (
            <button key={it.key} ref={(el) => { refs.current[i] = el; }} type="button" role="radio"
              aria-checked={on ? "true" : "false"} aria-disabled={it.disabled ? "true" : undefined} tabIndex={on ? 0 : -1}
              onClick={() => { if (!it.disabled) onChange(it.key); }} onKeyDown={(e) => onKey(e, i)}
              style={{ textAlign: "left", borderRadius: G3.r.md, padding: "11px 13px", cursor: it.disabled ? "default" : "pointer", border: "1.5px solid " + (on ? c.accent : c.border), background: on ? c.accentSoft : c.surface, opacity: it.disabled ? 0.55 : 1, display: "flex", gap: 10, alignItems: "center" }}>
              {it.lead || null}
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{it.label}</span>
                {it.sub ? <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 1, fontWeight: 500 })}>{it.sub}</span> : null}
              </span>
              {it.trail || null}
            </button>
          );
        })}
      </div>
    );
  }

  /* the secondary action style: clay outline on a soft clay fill —
     clearly not the solid primary, still clearly a button */
  function SoftButton({ icon, onClick, children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <button type="button" onClick={onClick}
        style={ty("ui", { display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", borderRadius: G3.r.md, border: "1.5px solid " + c.accent, background: c.accentSoft, color: c.action, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" })}>
        {icon ? <Icon name={icon} size={16} /> : null}{children}
      </button>
    );
  }

  function Issue({ tone, icon, children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const bg = tone === "stop" ? c.absentTint : tone === "warn" ? c.lateTint : c.sunken;
    const fg = tone === "stop" ? c.absentText : tone === "warn" ? c.lateText : c.inkMuted;
    return (
      <div role={tone === "stop" ? "alert" : undefined} style={{ display: "flex", gap: 9, alignItems: "flex-start", background: bg, borderRadius: G3.r.md, padding: "9px 12px" }}>
        <span aria-hidden="true" style={{ color: fg, display: "flex", marginTop: 1, flexShrink: 0 }}><Icon name={icon || "alert"} size={14} /></span>
        <span style={ty("small", { color: fg, fontWeight: 600 })}>{children}</span>
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
          <button type="button" onClick={onClose} aria-label={t("lv2.dismiss")} style={{ border: "none", background: "transparent", color: c.onRailMuted, cursor: "pointer", display: "flex", padding: 6 }}><CloseGlyph /></button>
        </div>
      </div>,
      document.body
    );
  }

  function Initials({ name, size }) {
    const { c } = useTheme();
    const s = size || 32;
    const ini = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
    const tone = UI.avatarTone(name, c, { bg: c.sunken, fg: c.inkMuted });
    return <span aria-hidden="true" style={{ width: s, height: s, borderRadius: 99, background: tone.bg, color: tone.fg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: G3.font.ui, fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}>{ini}</span>;
  }

  /* ============================================================
     1. WHAT YOU HAVE — one line of text per type, a big figure and a
     vivid bar. The accrual rules live in the policy, not on the card.
     ============================================================ */
  /* the policy behind a balance, on hover AND on focus. `title` alone
     is not enough here: the accrual rule is the thing teachers
     misunderstand, so it gets a real panel with room to say it. */
  function PolicyTip({ label, body, children }) {
    const { c, shadow } = useTheme();
    const { ty } = useLang();
    const [rect, setRect] = useState(null);
    const ref = useRef(null);
    const show = () => { if (ref.current) setRect(ref.current.getBoundingClientRect()); };
    const hide = () => setRect(null);
    const W = 268;
    const left = rect ? Math.max(8, Math.min(rect.left, window.innerWidth - W - 8)) : 0;
    const above = rect ? rect.top > 240 : false;
    return (
      <span
        ref={ref} tabIndex={0} aria-label={label + " — " + body}
        onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}
        onKeyDown={(e) => { if (e.key === "Escape") hide(); }}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "help", borderRadius: 6 }}
      >
        {children}
        <span aria-hidden="true" style={{
          width: 15, height: 15, borderRadius: 99, display: "grid", placeItems: "center",
          background: c.sunken, color: c.inkFaint, fontFamily: G3.font.ui, fontSize: 10, fontWeight: 700,
        }}>i</span>
        {rect ? ReactDOM.createPortal(
          <div role="tooltip" style={Object.assign({
            position: "fixed", left: left, width: W, zIndex: 1600, pointerEvents: "none",
            background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.lg,
            boxShadow: shadow(3), padding: "11px 13px",
          }, above ? { top: rect.top - 8, transform: "translateY(-100%)" } : { top: rect.bottom + 8 })}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 4 })}>{label}</div>
            <div style={ty("small", { color: c.ink, lineHeight: 1.5 })}>{body}</div>
          </div>,
          document.body
        ) : null}
      </span>
    );
  }

  function BalanceBlock({ b, first, held }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const na = b.mode === "none";
    const total = b.mode === "earned" ? b.opening + b.accrued : b.annual;
    const line = held > 0 ? t("lv2.bal.held", { n: days(held) })
      : b.mode === "credited" ? t("lv2.bal.cl")
      : b.mode === "monthly" ? t("lv2.bal.sl", { cap: days(b.annual) })
      : b.mode === "earned" ? t("lv2.bal.comp")
      : b.mode === "elMonthly" ? t("lv3.bal.el")
      : t("lv2.bal.el");
    return (
      <div data-wrap-divider="" style={{ flex: "1 1 140px", minWidth: 0, paddingLeft: first ? 0 : 22, borderLeft: first ? "none" : "1px solid " + c.border }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
          <CodeMark code={b.code} />
          <PolicyTip label={t(b.key)} body={t(policyKeyOf(b))}>
            <span style={ty("h3", { color: c.ink })}>{t(b.key)}</span>
          </PolicyTip>
        </div>
        {na ? (
          <div style={{ marginBottom: 10 }}><StatusMark role="off" word={t("lv.rule.elMark")} glyph="lock" /></div>
        ) : (
          <React.Fragment>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <Figure value={days(b.balance)} size={30} weight={700} color={c.ink} style={{ lineHeight: 1.1 }} />
              <span style={ty("small", { color: c.inkMuted })}>{b.mode === "earned" ? t("lv2.bal.ofEarned", { n: days(total) }) : t("lv2.bal.of", { n: days(total) })}</span>
            </div>
            <Meter frac={total ? b.balance / total : 0} bar={c[b.role + "Bar"]} track={c.sunken} height={10}
              label={t("lv.bal.aria", { name: t(b.key), have: days(b.balance), total: days(total) })} />
          </React.Fragment>
        )}
        <div style={ty("caption", { color: held > 0 ? c.lateText : c.inkMuted, fontWeight: held > 0 ? 700 : 500, marginTop: 10 })}>{line}</div>
      </div>
    );
  }

  /* one policy line per balance — the office EL rule differs from the
     teaching one, which is the whole point of the vacation-staff model */
  function policyKeyOf(b) {
    if (b.code === "EL") return b.mode === "none" ? "lv5.pol.elTeaching" : "lv5.pol.elOffice";
    return "lv5.pol." + b.code.toLowerCase();
  }

  function BalancesCard({ requests }) {
    const { t } = useLang();
    return (
      /* NO HEADING OVER A ROW OF FIGURES (designer, 2026-10-27 — the
         same ruling the Band already carries). Four balances each
         carrying a name, a figure, a bar and its own rule said what a
         title and a date line over them said again. */
      <Card>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 22, rowGap: 24, alignItems: "flex-start" }}>
          {balancesNow().map((b, i) => (
            <BalanceBlock key={b.code} b={b} first={i === 0}
              held={requests.reduce((s, r) => (r.type === b.code && r.status === "pending" ? s + r.days : s), 0)} />
          ))}
        </div>
      </Card>
    );
  }

  /* ============================================================
     The request still waiting on her — a slim banner, not a card
     competing with the page. One action: choose a colleague.
     ============================================================ */
  function coverWho(t, coverBy) {
    return coverBy && coverBy.one ? colName(t, coverBy.one) : "";
  }

  /* ============================================================
     THE CALENDAR THAT SHAPES EVERYTHING — M7 terms (unchanged)
     ============================================================ */
  function WindowsCard() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Card icon="festival" iconTone="brass" title={t("lv.win.title")} sub={t("lv.win.sub")}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {WINDOWS.filter((w) => me().vacationStaff || w.kind !== "vacation").map((w, i, arr) => {
            const closed = w.kind === "blackout";
            return (
              <div key={w.key} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px dashed " + c.border : "none" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(w.key)}</div>
                  <div style={ty("caption", { color: c.inkMuted })}>{t(w.dateKey)}</div>
                </div>
                <StatusMark role={closed ? "penalty" : "holiday"} glyph={closed ? "lock" : "festival"} word={t(closed ? "lv.win.closedWord" : "lv.win.vacWord")} />
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  /* ============================================================
     2. APPLY — a guided side screen: details → cover your classes →
     review. The cover step appears only when the dates cost teaching
     periods; "cover only" mode reuses it for a request already sent.
     Only real problems are shown, one line each (the old "What this
     means" list is gone).
     ============================================================ */
  function CoverStep({ isos, from, to, cover, setCover }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!isos.length) return <Issue tone="info" icon="check">{t("lv2.cov.none")}</Issue>;
    const ranked = rankColleagues(isos);
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <span style={ty("h3", { color: c.ink, display: "block" })}>{t("lv2.cov.q", { dates: shortRange(t, from, to) })}</span>
          <span style={ty("small", { color: c.inkMuted, display: "block", marginTop: 6 })}>{t("lv4.cov.required")}</span>
        </div>
        <Choice name={t("lv2.cov.pick")} cols={1} value={cover.one} onChange={(id) => setCover(Object.assign({}, cover, { one: id }))}
          items={ranked.map((r, i) => ({
            key: r.col.id, label: colName(t, r.col.id),
            sub: r.col.role + " · " + (r.away ? t("lv2.cov.onLeave") : t("lv2.cov.avail")) + " · " + t(r.col.load === 1 ? "lv2.cov.loadOne" : "lv2.cov.load", { n: r.col.load }),
            disabled: r.away, lead: <Initials name={colName(t, r.col.id)} />,
            trail: i === 0 && !r.away ? <StatusMark role="present" glyph="check" word={t("lv2.cov.suggested")} /> : null,
          }))} />
        <Field id="lv2-cov-note" label={t("lv2.cov.note")}>
          <TextArea id="lv2-cov-note" value={cover.note} onChange={(v) => setCover(Object.assign({}, cover, { note: v }))} placeholder={t("lv2.cov.notePh")} rows={2} />
        </Field>
      </div>
    );
  }

  /* a colleague said no. This is the repair — the same choice step,
     for a request that already exists, never a way to apply without
     cover in the first place. */
  function RenameCover({ request, onClose, onSend }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [cover, setCover] = useState({ one: null, note: "" });
    const isos = schoolDaysFor(request.from, request.to);
    const declined = request.coverBy ? colleague(request.coverBy.one) : null;
    return (
      <SideScreen
        title={t("lv4.act.rename")}
        sub={request.id + " · " + shortRange(t, request.from, request.to)}
        onClose={onClose}
        footer={
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Button kind="ghost" onClick={onClose}>{t("lv2.cancel")}</Button>
            <Button kind="primary" disabled={!cover.one} onClick={() => onSend(request.id, cover)}>{t("lv4.act.renameSend")}</Button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 18 }}>
          {declined ? (
            <p style={ty("small", { color: c.absentText, background: c.absentTint, borderRadius: G3.r.md, padding: "10px 13px", margin: 0, fontWeight: 600 })}>
              {t("lv4.act.renameWhy", { who: declined.name })}
            </p>
          ) : null}
          <CoverStep isos={isos} from={request.from} to={request.to} cover={cover} setCover={setCover} />
        </div>
      </SideScreen>
    );
  }

  function ApplyFlow({ onClose, onSend, requests }) {
    const { c, mode } = useTheme();
    const { t, ty } = useLang();
    const [type, setType] = useState("CL");
    const [from, setFrom] = useState("2026-09-02");
    const [to, setTo] = useState("2026-09-03");
    const [session, setSession] = useState("full");
    const [reason, setReason] = useState(t("lv.r.draft"));
    const [cover, setCover] = useState({ one: null, note: "" });
    const [step, setStep] = useState(0);

    const sameDay = from === to;
    const half = sameDay && session !== "full" ? session : null;
    const badOrder = parseISO(to) < parseISO(from);
    const count = badOrder ? 0 : workingDays(from, to, !!half);
    const bal = balanceOf(type) - requests.reduce((s, r) => (r.type === type && r.status === "pending" ? s + r.days : s), 0);
    const short = Math.max(0, count - Math.max(0, bal));
    const blackout = badOrder ? null : overlapWindow(from, to, "blackout");
    const vacation = badOrder || !me().vacationStaff ? null : overlapWindow(from, to, "vacation");
    const coverDays = badOrder ? [] : schoolDaysFor(from, to);
    const hasCover = me().cover && coverDays.length > 0;
    const steps = hasCover ? ["lv2.step.details", "lv2.step.cover", "lv2.step.review"] : ["lv2.step.details", "lv2.step.review"];
    const cur = steps[step];

    let block = null;
    if (cur === "lv2.step.details") {
      block = badOrder ? t("lv2.iss.order") : count === 0 ? t("lv2.iss.none") : blackout ? t("lv2.iss.blackout", { name: t(blackout.key), dates: t(blackout.dateKey) }) : !reason.trim() ? t("lv2.iss.reason") : null;
    } else if (cur === "lv2.step.cover") {
      block = !hasCover || cover.one ? null : t("lv2.cov.needOne");
    }
    const who = hasCover && cover.one ? colName(t, cover.one) : null;

    function next() {
      if (block) return;
      if (step < steps.length - 1) { setStep(step + 1); return; }
      onSend({ type: type, from: from, to: to, half: half, days: count, reason: reason.trim(), cover: hasCover ? { one: cover.one, note: cover.note } : null, who: who });
    }

    const typeItems = applyTypesNow().map((code) => ({
      key: code, label: t(TYPE_KEY[code]), sub: t("lv2.f.left", { n: days(balanceOf(code)) }), lead: <CodeMark code={code} size={24} />,
    }));
    const left = Math.max(0, bal - count);

    return (
      <SideScreen
        title={t("lv2.apply")}
        sub={null}
        onClose={onClose}
        head={<Steps steps={steps} at={step} />}
        footer={(
          <React.Fragment>
            <div style={ty("caption", { flex: 1, minWidth: 160, color: block ? c.lateText : c.inkMuted, fontWeight: block ? 700 : 500 })}>{block || (cur === "lv2.step.review" ? t("lv2.rev.withdraw") : "")}</div>
            {step > 0 ? <Button kind="ghost" onClick={() => setStep(step - 1)}>{t("lv2.back")}</Button> : <Button kind="ghost" onClick={onClose}>{t("lv2.cancel")}</Button>}
            <Button kind="primary" iconRight={cur === "lv2.step.review" ? null : "arrow"} disabled={!!block} onClick={next}>{cur === "lv2.step.review" ? t("lv2.send") : t("lv2.next")}</Button>
          </React.Fragment>
        )}
      >
        {cur === "lv2.step.details" ? (
          <div style={{ colorScheme: mode }}>
            <div style={ty("small", { color: c.ink, fontWeight: 600, marginBottom: 8 })}>{t("lv2.f.type")}</div>
            <Choice name={t("lv2.f.type")} cols={typeItems.length > 3 ? 2 : 3} items={typeItems} value={type} onChange={setType} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
              <Field id="lv2-from" label={t("lv2.f.from")}><Input id="lv2-from" type="date" value={from} onChange={(v) => { setFrom(v); if (parseISO(to) < parseISO(v)) setTo(v); }} /></Field>
              <Field id="lv2-to" label={t("lv2.f.to")}><Input id="lv2-to" type="date" value={to} onChange={setTo} invalid={badOrder} /></Field>
            </div>
            {sameDay ? (
              <div style={{ marginTop: -4, marginBottom: 18 }}>
                <div style={ty("small", { color: c.ink, fontWeight: 600, marginBottom: 8 })}>{t("lv2.f.session")}</div>
                <Choice name={t("lv2.f.session")} cols={3} value={session} onChange={setSession}
                  items={[{ key: "full", label: t("lv2.f.full") }, { key: "first", label: t("lv2.f.first") }, { key: "second", label: t("lv2.f.second") }]} />
              </div>
            ) : null}
            <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
              {!badOrder && count > 0 && !blackout ? (
                <Issue tone="info" icon="leave">{t(count === 1 ? "lv2.sumOne" : "lv2.sum", { n: days(count), left: days(left), name: t(TYPE_KEY[type]) })}</Issue>
              ) : null}
              {badOrder ? <Issue tone="stop">{t("lv2.iss.order")}</Issue> : null}
              {!badOrder && count === 0 ? <Issue tone="stop">{t("lv2.iss.none")}</Issue> : null}
              {blackout ? <Issue tone="stop" icon="lock">{t("lv2.iss.blackout", { name: t(blackout.key), dates: t(blackout.dateKey) })}</Issue> : null}
              {vacation ? <Issue tone="info" icon="festival">{t("lv2.iss.vacation", { name: t(vacation.key), dates: t(vacation.dateKey) })}</Issue> : null}
              {short > 0 && !blackout ? <Issue tone="warn">{t(short === 1 ? "lv2.iss.short" : "lv2.iss.shortPl", { have: days(Math.max(0, bal)), short: days(short) })}</Issue> : null}
            </div>
            <Field id="lv2-reason" label={t("lv2.f.reason")}>
              <TextArea id="lv2-reason" value={reason} onChange={setReason} placeholder={t("lv2.f.reasonPh")} rows={3} />
            </Field>
          </div>
        ) : null}

        {cur === "lv2.step.cover" ? <CoverStep isos={coverDays} from={from} to={to} cover={cover} setCover={setCover} /> : null}

        {cur === "lv2.step.review" ? (
          <div style={{ display: "grid", gap: 18 }}>
            <dl style={{ margin: 0, border: "1px solid " + c.border, borderRadius: G3.r.lg, overflow: "hidden" }}>
              {[
                ["lv2.rev.leave", t(TYPE_KEY[type])],
                ["lv2.rev.dates", (half ? dayLabel(t, from) + " · " + t(half === "first" ? "lv2.f.first" : "lv2.f.second") : rangeLabel(t, from, to)) + " · " + days(count) + " " + (count === 1 ? t("lv.bal.day") : t("lv.bal.days"))],
                ["lv2.rev.balance", days(left) + " " + t(TYPE_KEY[type])],
                ["lv2.rev.reason", reason.trim()],
                ["lv2.rev.cover", hasCover ? who : t("lv2.rev.none")],
              ].filter(Boolean).map((row, i) => (
                <div key={row[0]} style={{ display: "grid", gridTemplateColumns: "140px minmax(0,1fr)", gap: 12, padding: "11px 14px", borderTop: i ? "1px solid " + c.rule : "none", background: i % 2 ? c.raised : c.surface }}>
                  <dt style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{t(row[0])}</dt>
                  <dd style={ty("small", { color: c.ink, margin: 0, fontWeight: 600 })}>{row[1]}</dd>
                </div>
              ))}
            </dl>
            {short > 0 ? <Issue tone="warn">{t(short === 1 ? "lv2.iss.short" : "lv2.iss.shortPl", { have: days(Math.max(0, bal)), short: days(short) })}</Issue> : null}
            <div>
              <div style={ty("small", { color: c.ink, fontWeight: 700, marginBottom: 10 })}>{t("lv2.rev.next")}</div>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                {(hasCover ? [t("lv2.rev.step1", { who: who })] : []).concat(
                  chainNamesFor(t, count).map((name, i, all) =>
                    i === all.length - 1 ? t("lv4.stepLast", { name: name }) : t("lv4.stepThen", { name: name }))
                ).map((s, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={G3.fig("xs", { width: 24, height: 24, borderRadius: 99, background: c.sunken, color: c.inkMuted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 })}>{i + 1}</span>
                    <span style={ty("small", { color: c.ink })}>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </SideScreen>
    );
  }

  /* ============================================================
     4. YOUR REQUESTS — whole rows open the request; every cell,
     including Days, is left-aligned.
     ============================================================ */
  const FILTERS = [
    { key: "all", label: "lv.f.all" },
    { key: "pending", label: "lv.f.pending" },
    { key: "approved", label: "lv.f.approved" },
    { key: "rejected", label: "lv.f.rejected" },
    { key: "withdrawn", label: "lv.f.withdrawn" },
  ];

  function FilterPills({ value, onChange, requests }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div role="group" aria-label={t("lv.f.aria")} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const on = f.key === value;
          const n = f.key === "all" ? requests.length : requests.filter((r) => r.status === f.key).length;
          return (
            <button key={f.key} type="button" aria-pressed={on ? "true" : "false"} onClick={() => onChange(f.key)}
              style={{ border: "1px solid " + (on ? c.accent : c.border), borderRadius: G3.r.pill, padding: "6px 14px", background: on ? c.accent : c.surface, color: on ? c.onAccent : c.ink, fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
              <span>{t(f.label)}</span>
              <span style={G3.fig("micro", { fontWeight: 700, color: on ? c.onAccent : c.inkFaint })}>{num(n)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  function statusWordOf(t, r) {
    if (r.status === "pending") return r.coverState === "declined" ? t("lv4.st.coverGone") : t("lv.st.pending");
    return t("lv.st." + r.status);
  }

  function HistoryRegister({ requests, filter, setFilter, selectedId, onSelect }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [hover, setHover] = useState(null);
    const rows = requests.filter((r) => filter === "all" || r.status === filter);
    const pad = G3.layout.cardPad;
    const cols = [
      { key: "dates", label: t("lv.hist.colDates") },
      { key: "type", label: t("lv.hist.colType") },
      { key: "days", label: t("lv.hist.colDays"), w: 70 },
      { key: "status", label: t("lv.hist.colStatus") },
    ];
    const td = { padding: "12px 10px", verticalAlign: "middle", textAlign: "left" };
    return (
      <Card pad={0} style={{ flex: 1, minWidth: 0 }}>
        <div style={{ padding: pad + "px " + pad + "px 14px" }}>
          <h3 style={ty("h2", { margin: "0 0 14px", color: c.ink })}>{t("lv.hist.title")}</h3>
          <FilterPills value={filter} onChange={setFilter} requests={requests} />
        </div>
        {!rows.length ? (
          <div style={{ padding: "0 " + pad + "px " + pad + "px" }}><EmptyState compact head={t("lv.empty.head")} body={t("lv.empty.body")} /></div>
        ) : (
          <div style={{ padding: "0 " + (pad - 10) + "px 10px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                  {cols.map((col) => <th key={col.key} scope="col" style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase", padding: "0 10px 10px", textAlign: col.right ? "right" : "left", whiteSpace: "nowrap", width: col.w })}>{col.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const sel = r.id === selectedId;
                  return (
                    <tr key={r.id} tabIndex={0} aria-current={sel ? "true" : undefined} aria-label={t("lv2.row.aria", { id: r.id })}
                      onClick={() => onSelect(r.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(r.id); } }}
                      onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)}
                      style={{ cursor: "pointer", borderBottom: i < rows.length - 1 ? "1px solid " + c.rule : "none", background: sel ? c.sunken : hover === r.id ? c.raised : "transparent", outline: sel ? "1.5px solid " + c.borderStrong : "none", outlineOffset: -1.5 }}>
                      <td style={td}>
                        <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{shortRange(t, r.from, r.to)}</span>
                        <span style={G3.fig("micro", { display: "block", color: c.inkFaint, marginTop: 2 })}>{r.id}</span>
                        {r.half ? <span style={ty("caption", { display: "block", color: c.inkFaint })}>{t("lv.hist.halfNote", { which: t(r.half === "first" ? "lv.half.first" : "lv.half.second") })}</span> : null}
                      </td>
                      <td style={td}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <CodeMark code={r.type} size={22} />
                          <span style={ty("small", { color: c.ink })}>{t(TYPE_KEY[r.type])}</span>
                        </span>
                      </td>
                      <td style={G3.fig("sm", Object.assign({}, td, { color: c.ink, fontWeight: 600 }))}>{days(r.days)}</td>
                      <td style={td}><StatusMark role={STATUS_ROLE[r.status]} word={statusWordOf(t, r)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  }

  function TrailStep({ label, date, note, tone, last }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <li style={{ display: "flex", gap: 12, listStyle: "none", paddingBottom: last ? 0 : 14 }}>
        <span style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: G3.r.pill, background: c[tone] || c.accent, marginTop: 4 }} />
          {last ? null : <span aria-hidden="true" style={{ width: 2, flex: 1, background: c.border, marginTop: 4 }} />}
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{label}</span>
          {date ? <span style={ty("caption", { display: "block", color: c.inkFaint })}>{date}</span> : null}
          {note ? <span style={ty("small", { display: "block", color: c.inkMuted, marginTop: 6 })}>{note}</span> : null}
        </span>
      </li>
    );
  }

  /* the request's own panel: status, the REASON as a note (it replaces
     the old "Effect on your balance" box), cover, and the trail */
  function RequestDetail({ request, handlers }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    if (!request) {
      return <Card style={{ width: L.colNarrow, flex: "0 0 " + L.colNarrow + "px" }}><EmptyState head={t("lv.d.pick")} body={t("lv.d.pickBody")} compact /></Card>;
    }
    const r = request;
    const shared = LF && LF.byId ? LF.byId(r.id) : null;
    /* applied, then the approvals — nothing else. The cover has its
       own line in the request above; repeating it here buried the one
       thing the trail is for. */
    const steps = [{ key: "applied", label: t("lv.d.tApplied"), date: dayLabel(t, r.applied), tone: "inkFaint" }];
    if (!shared) steps.push({ key: "routed", label: t("lv3.tRouted", { name: approverLong(t) }), date: dayLabel(t, r.applied), tone: "inkFaint" });
    if (!shared || r.status === "withdrawn") {
      if (r.status === "approved") steps.push({ key: "ok", label: t("lv3.tApproved", { name: approver(t) }), date: dayLabel(t, r.decided), tone: "present" });
      if (r.status === "rejected") steps.push({ key: "no", label: t("lv3.tRejected", { name: approver(t) }), date: dayLabel(t, r.decided), tone: "absent", note: r.note ? t(r.note) : null });
      if (r.status === "withdrawn") steps.push({ key: "wd", label: t("lv.st.withdrawn"), date: dayLabel(t, r.decided), tone: "off" });
    } else {
      /* every rung, with whoever holds it now and whoever is still to
         come — the approver's screen and hers are one record */
      shared.stages.forEach((s) => {
        const who = s.holderNameKey ? t(s.holderNameKey) : "";
        if (s.outcome === "approved") steps.push({ key: s.role, label: t("lv3.tApproved", { name: who }), date: dayLabel(t, s.onISO), tone: "present" });
        else if (s.outcome === "rejected") steps.push({ key: s.role, label: t("lv3.tRejected", { name: who }), date: dayLabel(t, s.onISO), tone: "absent", note: s.note || (s.noteKey ? t(s.noteKey) : null) });
        else if (LF.currentStage(shared) && LF.currentStage(shared).role === s.role) steps.push({ key: s.role, label: t("lv4.tWith", { name: who }), tone: "late" });
        else steps.push({ key: s.role, label: t("lv4.tThen", { name: who }), tone: "inkFaint" });
      });
    }
    const gone = r.status === "pending" && r.coverState === "declined";
    return (
      <Card icon="document" iconTone="info"
        title={<span style={{ whiteSpace: "nowrap" }}>{t("lv.d.title", { id: r.id })}</span>}
        sub={shortRange(t, r.from, r.to) + " · " + t(TYPE_KEY[r.type])}
        style={{ width: L.colNarrow, flex: "0 0 " + L.colNarrow + "px" }}>
        <div style={{ marginTop: -4, marginBottom: 14 }}><StatusMark role={STATUS_ROLE[r.status]} word={statusWordOf(t, r)} /></div>

        <div style={{ borderInlineStart: "2px solid " + c.accent, paddingInlineStart: 13, marginBottom: 18 }}>
          <p style={ty("body", { color: c.ink, margin: 0, lineHeight: 1.5 })}>{r.reasonText || t(r.reason)}</p>
          <div style={ty("caption", { color: c.inkFaint, marginTop: 7 })}>{t("lv4.reasonBy", { date: dayLabel(t, r.applied) })}</div>
        </div>

        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 10 })}>{t("lv.d.trail")}</div>
        <ul style={{ margin: 0, padding: 0 }}>
          {steps.map((s, i) => <TrailStep key={s.key} {...s} last={i === steps.length - 1} />)}
        </ul>

        {/* A DECIDED REQUEST ENDS ON ITS TRAIL. There is nothing to do to
            it, and a sentence standing where a button would be is not
            an explanation, it is a button-shaped absence with words in
            it. The trail above already says who decided and when. */}
        {r.status === "pending" ? (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + c.border, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {gone ? <SoftButton icon="staff" onClick={() => handlers.rename(r.id)}>{t("lv4.act.rename")}</SoftButton> : null}
            <Button kind="secondary" iconLeft="signout" onClick={() => handlers.withdraw(r.id)}>{t("lv.act.withdraw")}</Button>
          </div>
        ) : null}
      </Card>
    );
  }

  /* ============================================================
     COVER REQUESTS FROM COLLEAGUES — colleagues asking HER to take
     their classes. Privacy rule from this file's header holds: a
     colleague's leave TYPE is never shown (medical = health data),
     only the dates they're away and the note they chose to write.

     One shared store (window.NaveyaCover) so accepting on Home and on
     Leave is the same fact; Home renders HomeCard from here.
     ============================================================ */
  addStrings({
    en: {
      "cv.title": "Classes you have been asked to cover",
      "cv.f.pending": "Waiting on you",
      "cv.f.accepted": "Accepted",
      "cv.f.declined": "Declined",
      "cv.f.all": "All",
      "cv.col.who": "Colleague",
      "cv.col.dates": "Dates",
      "cv.col.days": "Days",
      "cv.col.asked": "Asked on",
      "cv.col.status": "Status",
      "cv.st.pending": "Waiting on you",
      "cv.st.upcoming": "Accepted · upcoming",
      "cv.st.done": "Covered",
      "cv.st.declined": "Declined",
      "cv.empty": "Nothing here",
      "cv.emptyBody": "When a colleague asks you to cover their classes, it shows up here.",
      "cv.view": "View request",
      "cv.accept": "Accept cover",
      "cv.acceptShort": "Accept",
      "cv.col.answer": "Your answer",
      "cv.clashShort": "You are on leave on these days yourself.",
      "cv.decidedOn": "you answered {date}",
      "cv.decline": "Decline",
      "cv.row": "Open cover request {id}",

      "cv.banner.one": "{name} asked you to cover their classes",
      "cv.banner.many": "{n} colleagues asked you to cover their classes",
      "cv.banner.sub": "Reply so their leave can go to {hod}.",
      "cv.banner.cta": "Review requests",

      "cv.d.title": "Cover request",
      "cv.d.sub": "{id} · asked {date}",
      "cv.d.asks": "asks you to take their classes",
      "cv.d.dates": "Dates",
      "cv.d.daysN": "{n} school days",
      "cv.d.daysOne": "{n} school day",
      "cv.d.note": "Their note",
      "cv.d.noNote": "No note added",
      "cv.d.respondBy": "Reply by",
      "cv.d.free": "You're free on these days",
      "cv.d.clash": "You're on leave on {date} yourself ({id}), so you can't take this one. Decline it so they can ask someone else.",
      "cv.d.means": "Accepting means you take {name}'s classes on these days. {hod} is told, and it shows on your Home.",
      "cv.d.decided": "{st} on {date}",
      "cv.d.yourReason": "Your reason",
      "cv.d.why": "Why you can't take it",
      "cv.d.r.duty": "I have my own duty or classes then",
      "cv.d.r.away": "I'm away or on leave",
      "cv.d.r.load": "I've taken too many covers this month",
      "cv.d.r.other": "Something else",
      "cv.d.notePh": "Optional — a line for {name}",
      "cv.d.sendDecline": "Send decline",
      "cv.d.back": "Back",
      "cv.d.close": "Close",
      "cv.toast.accept": "You'll cover {name}'s classes on {dates}.",
      "cv.toast.decline": "{name} has been told you can't cover {dates}.",

      "cv.home.title": "Covering for colleagues",
      "cv.home.ask": "asks you to cover",
      "cv.home.upcoming": "Upcoming covers",
      "cv.home.none": "No cover requests right now.",
      "cv.home.all": "All cover requests",

      "cv.r.karan": "XI-B: continue Ch 6 (rotational motion). The worksheet is in the staffroom tray.",
      "cv.r.meera": "XII-A: practical-file check. The lab assistant has the list.",
      "cv.r.priya": "IX-C: revision class, question bank on my desk.",
      "cv.r.karan2": "XI-A: unit test is already set; please invigilate.",
      "cv.r.ramesh": "XII-B: chemistry practicals.",
      "cv.dr.duty": "I have my own duty or classes then",
    },
  });

  const INCOMING_SEED = [
    { id: "CR-0311", from: "karan", start: "2026-08-20", end: "2026-08-21", asked: "2026-08-10", by: "2026-08-18", noteKey: "cv.r.karan", status: "pending" },
    { id: "CR-0314", from: "meeraj", start: "2026-08-25", end: "2026-08-25", asked: "2026-08-11", by: "2026-08-20", noteKey: "cv.r.meera", status: "pending" },
    { id: "CR-0296", from: "priya", start: "2026-08-13", end: "2026-08-13", asked: "2026-08-06", noteKey: "cv.r.priya", status: "accepted", decided: "2026-08-07" },
    { id: "CR-0288", from: "karan", start: "2026-07-29", end: "2026-07-29", asked: "2026-07-23", noteKey: "cv.r.karan2", status: "accepted", decided: "2026-07-24" },
    { id: "CR-0270", from: "ramesh", start: "2026-07-16", end: "2026-07-16", asked: "2026-07-13", noteKey: "cv.r.ramesh", status: "declined", decided: "2026-07-14", why: "duty" },
  ];

  /* a tiny shared store: one list, many readers (Home + Leave) */
  const CoverStore = window.NaveyaCover && window.NaveyaCover.store ? window.NaveyaCover.store : (function () {
    let list = INCOMING_SEED.map((x) => Object.assign({}, x));
    const subs = [];
    return {
      get: () => list,
      update: (id, patch) => { list = list.map((x) => (x.id === id ? Object.assign({}, x, patch) : x)); subs.forEach((f) => f()); },
      subscribe: (f) => { subs.push(f); return () => { const i = subs.indexOf(f); if (i >= 0) subs.splice(i, 1); }; },
      openId: null,
    };
  })();
  function useCoverList() {
    const [, setN] = useState(0);
    useEffect(() => CoverStore.subscribe(() => setN((n) => n + 1)), []);
    return CoverStore.get();
  }
  function coverPhase(r) {
    if (r.status === "pending") return "pending";
    if (r.status === "declined") return "declined";
    return parseISO(r.end) < parseISO(TODAY_ISO) ? "done" : "upcoming";
  }
  const PHASE_ROLE = { pending: "late", upcoming: "present", done: "off", declined: "absent" };
  const PHASE_GLYPH = { pending: "clock", upcoming: "check", done: "check", declined: "alert" };

  /* her own leave on any of those days blocks accepting — stated, not hidden */
  function ownClash(r, own) {
    const days = schoolDaysFor(r.start, r.end);
    for (let i = 0; i < own.length; i++) {
      const q = own[i];
      if (q.status !== "pending" && q.status !== "approved") continue;
      const hit = days.filter((d) => parseISO(d) >= parseISO(q.from) && parseISO(d) <= parseISO(q.to))[0];
      if (hit) return { date: hit, id: q.id };
    }
    return null;
  }

  function CoverStatus({ r }) {
    const { t } = useLang();
    const ph = coverPhase(r);
    return <StatusMark role={PHASE_ROLE[ph]} glyph={PHASE_GLYPH[ph]} word={t("cv.st." + ph)} />;
  }

  /* the request, read and answered in one place — Home uses it too */
  function CoverRequestDialog({ id, own, initMode, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const list = useCoverList();
    const r = list.filter((x) => x.id === id)[0];
    const [mode, setMode] = useState(initMode || "view");
    const [why, setWhy] = useState("duty");
    const [note, setNote] = useState("");
    if (!r) return null;
    const col = colleague(r.from);
    const n = schoolDaysFor(r.start, r.end).length;
    const clash = r.status === "pending" ? ownClash(r, own || REQUESTS) : null;
    const dates = shortRange(t, r.start, r.end);
    const ph = coverPhase(r);

    function accept() {
      CoverStore.update(r.id, { status: "accepted", decided: TODAY_ISO });
      onDone && onDone(t("cv.toast.accept", { name: colName(t, r.from), dates: dates }));
      onClose();
    }
    function decline() {
      CoverStore.update(r.id, { status: "declined", decided: TODAY_ISO, why: why, whyNote: note.trim() });
      onDone && onDone(t("cv.toast.decline", { name: colName(t, r.from), dates: dates }));
      onClose();
    }

    let footer;
    if (r.status !== "pending") {
      footer = <React.Fragment><span style={{ flex: 1 }} /><Button kind="primary" onClick={onClose}>{t("cv.d.close")}</Button></React.Fragment>;
    } else if (mode === "decline") {
      footer = (
        <React.Fragment>
          <span style={{ flex: 1 }} />
          <Button kind="ghost" onClick={() => setMode("view")}>{t("cv.d.back")}</Button>
          <Button kind="primary" onClick={decline}>{t("cv.d.sendDecline")}</Button>
        </React.Fragment>
      );
    } else {
      footer = (
        <React.Fragment>
          <div style={ty("caption", { flex: 1, minWidth: 160, color: clash ? c.lateText : c.inkMuted, fontWeight: clash ? 700 : 500 })}>{clash ? t("cv.d.clash", { date: dayLabel(t, clash.date), id: clash.id }).split(".")[0] + "." : ""}</div>
          <Button kind="ghost" onClick={() => setMode("decline")}>{t("cv.decline")}</Button>
          <Button kind="primary" iconLeft="check" disabled={!!clash} onClick={() => { if (!clash) accept(); }}>{t("cv.accept")}</Button>
        </React.Fragment>
      );
    }

    return (
      <SideScreen title={t("cv.d.title")} sub={t("cv.d.sub", { id: r.id, date: dayLabel(t, r.asked) })} onClose={onClose} footer={footer}>
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Initials name={colName(t, r.from)} size={44} />
            <div>
              <div style={ty("h3", { color: c.ink })}>{colName(t, r.from)}</div>
              <div style={ty("caption", { color: c.inkMuted })}>{col.role + " · " + t("cv.d.asks")}</div>
            </div>
            <span style={{ marginLeft: "auto" }}><CoverStatus r={r} /></span>
          </div>

          <dl style={{ margin: 0, border: "1px solid " + c.border, borderRadius: G3.r.lg, overflow: "hidden" }}>
            {[
              ["cv.d.dates", rangeLabel(t, r.start, r.end) + " · " + t(n === 1 ? "cv.d.daysOne" : "cv.d.daysN", { n: n })],
              ["cv.d.note", r.noteKey ? t(r.noteKey) : t("cv.d.noNote")],
              r.status === "pending" && r.by ? ["cv.d.respondBy", dayLabel(t, r.by)] : null,
              r.status !== "pending" ? ["cv.col.status", t("cv.d.decided", { st: t("cv.st." + (r.status === "declined" ? "declined" : "upcoming")).split(" ·")[0], date: dayLabel(t, r.decided) })] : null,
              r.status === "declined" && r.why ? ["cv.d.yourReason", t("cv.d.r." + r.why) + (r.whyNote ? " — " + r.whyNote : "")] : null,
            ].filter(Boolean).map((row, i) => (
              <div key={row[0]} style={{ display: "grid", gridTemplateColumns: "130px minmax(0,1fr)", gap: 12, padding: "11px 14px", borderTop: i ? "1px solid " + c.rule : "none", background: i % 2 ? c.raised : c.surface }}>
                <dt style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{t(row[0])}</dt>
                <dd style={ty("small", { color: c.ink, margin: 0, fontWeight: 600 })}>{row[1]}</dd>
              </div>
            ))}
          </dl>

          {r.status === "pending" && mode === "view" ? (
            <React.Fragment>
              {clash ? <Issue tone="stop" icon="alert">{t("cv.d.clash", { date: dayLabel(t, clash.date), id: clash.id })}</Issue> : <Issue tone="info" icon="check">{t("cv.d.free")}</Issue>}
              <div style={ty("small", { color: c.inkMuted })}>{t("cv.d.means", { name: colName(t, r.from).split(" ")[0], hod: approver(t) })}</div>
            </React.Fragment>
          ) : null}

          {r.status === "pending" && mode === "decline" ? (
            <div>
              <div style={ty("small", { color: c.ink, fontWeight: 600, marginBottom: 8 })}>{t("cv.d.why")}</div>
              <Choice name={t("cv.d.why")} cols={1} value={why} onChange={setWhy}
                items={["duty", "away", "load", "other"].map((k) => ({ key: k, label: t("cv.d.r." + k) }))} />
              <div style={{ height: 14 }} />
              <Field id="cv-note" label={t("lv2.cov.note").replace(/\s*\(.*\)$/, "")}>
                <TextArea id="cv-note" value={note} onChange={setNote} placeholder={t("cv.d.notePh", { name: colName(t, r.from).split(" ")[0] })} rows={2} />
              </Field>
            </div>
          ) : null}
        </div>
      </SideScreen>
    );
  }

  /* one slim banner for everything colleagues are waiting on */
  function IncomingBanner({ onReview }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const pending = useCoverList().filter((x) => x.status === "pending");
    if (!pending.length) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: "14px 18px", marginTop: 12 }}>
        <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 12, background: c.accentSoft, color: c.action, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="staff" size={17} /></span>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={ty("small", { color: c.ink, fontWeight: 700 })}>
            {pending.length === 1 ? t("cv.banner.one", { name: colName(t, pending[0].from) }) : t("cv.banner.many", { n: pending.length })}
          </div>
          <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{t("cv.banner.sub", { hod: approver(t) })}</div>
        </div>
        <Button kind="primary" onClick={onReview}>{t("cv.banner.cta")}</Button>
      </div>
    );
  }

  const CV_FILTERS = ["pending", "accepted", "declined", "all"];

  function CoversCard({ filter, setFilter, onOpen, onDecline, onAccept, own }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const list = useCoverList();
    const [hover, setHover] = useState(null);
    const rows = list.filter((r) => filter === "all" || r.status === filter);
    const pad = G3.layout.cardPad;
    const td = { padding: "12px 10px", verticalAlign: "middle", textAlign: "left" };
    return (
      <Card pad={0} style={{ marginTop: G3.layout.gap }}>
        <div id="cv-card" style={{ padding: pad + "px " + pad + "px 14px" }}>
          <h3 style={ty("h2", { margin: "0 0 14px", color: c.ink })}>{t("cv.title")}</h3>
          <div role="group" aria-label={t("cv.title")} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CV_FILTERS.map((k) => {
              const on = filter === k;
              const n = k === "all" ? list.length : list.filter((r) => r.status === k).length;
              return (
                <button key={k} type="button" aria-pressed={on ? "true" : "false"} onClick={() => setFilter(k)}
                  style={{ border: "1px solid " + (on ? c.accent : c.border), borderRadius: G3.r.pill, padding: "6px 14px", background: on ? c.accent : c.surface, color: on ? c.onAccent : c.ink, fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                  <span>{t("cv.f." + k)}</span>
                  <span style={G3.fig("micro", { fontWeight: 700, color: on ? c.onAccent : c.inkFaint })}>{num(n)}</span>
                </button>
              );
            })}
          </div>
        </div>
        {!rows.length ? (
          <div style={{ padding: "0 " + pad + "px " + pad + "px" }}><EmptyState compact head={t("cv.empty")} body={t("cv.emptyBody")} /></div>
        ) : (
          <div style={{ padding: "0 " + (pad - 10) + "px 10px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 840 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                  {["who", "dates", "days", "asked"].map((k) => <th key={k} scope="col" style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase", padding: "0 10px 10px", textAlign: "left", whiteSpace: "nowrap" })}>{t("cv.col." + k)}</th>)}
                  <th scope="col" style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase", padding: "0 10px 10px", textAlign: "right", whiteSpace: "nowrap", width: 206 })}>{t("cv.col.answer")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const col = colleague(r.from);
                  const clash = r.status === "pending" ? ownClash(r, own) : null;
                  return (
                    <tr key={r.id} tabIndex={0} aria-label={t("cv.row", { id: r.id })}
                      onClick={() => onOpen(r.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(r.id); } }}
                      onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)}
                      style={{ cursor: "pointer", borderBottom: i < rows.length - 1 ? "1px solid " + c.rule : "none", background: hover === r.id ? c.raised : "transparent" }}>
                      <td style={td}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          <Initials name={colName(t, r.from)} size={30} />
                          <span>
                            <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{colName(t, r.from)}</span>
                            <span style={ty("caption", { display: "block", color: c.inkFaint })}>{col.role}</span>
                          </span>
                        </span>
                      </td>
                      <td style={ty("small", Object.assign({}, td, { color: c.ink, fontWeight: 600, whiteSpace: "nowrap" }))}>{shortRange(t, r.start, r.end)}</td>
                      <td style={G3.fig("sm", Object.assign({}, td, { color: c.ink, fontWeight: 600 }))}>{schoolDaysFor(r.start, r.end).length}</td>
                      <td style={ty("small", Object.assign({}, td, { color: c.inkMuted, whiteSpace: "nowrap" }))}>{shortRange(t, r.asked, r.asked)}</td>
                      {/* ONE DECISION COLUMN. A Status cell reading
                          "Waiting on you" beside two buttons that are
                          the waiting said the same thing twice, so the
                          status moved in here: the buttons ARE the
                          state while it is open, and the answer with
                          its date is the state once it is closed.
                          Declining still opens the panel, because a
                          refusal without a reason is one a colleague
                          cannot plan around. */}
                      <td style={Object.assign({}, td, { textAlign: "right" })}>
                        {r.status !== "pending" ? (
                          <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <CoverStatus r={r} />
                            <span style={ty("caption", { color: c.inkFaint })}>{t("cv.decidedOn", { date: shortRange(t, r.decided, r.decided) })}</span>
                          </span>
                        ) : (
                          <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                            <span style={{ display: "inline-flex", gap: 8 }}>
                              <Button kind="ghost" size="sm" onClick={() => onDecline(r.id)}>{t("cv.decline")}</Button>
                              <Button kind="primary" size="sm" iconLeft="check" disabled={!!clash} onClick={() => { if (!clash) onAccept(r); }}>{t("cv.acceptShort")}</Button>
                            </span>
                            {clash ? <span style={ty("caption", { color: c.inkFaint })}>{t("cv.clashShort")}</span> : null}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  }

  /* Home dashboard card: what's waiting on her, and what she's agreed to */
  function HomeCoverCard({ onNavigate }) {
    ME = profileFor("employee");  /* Home is the teacher's own dashboard */
    const { c } = useTheme();
    const { t, ty } = useLang();
    const list = useCoverList();
    const [openId, setOpenId] = useState(null);
    const [toast, setToast] = useState(null);
    const pending = list.filter((r) => r.status === "pending");
    const upcoming = list.filter((r) => coverPhase(r) === "upcoming");
    return (
      <Card icon="staff" iconTone="accent" title={t("cv.home.title")}>
        {!pending.length && !upcoming.length ? <div style={ty("small", { color: c.inkMuted })}>{t("cv.home.none")}</div> : null}
        <div>
          {pending.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
              <Initials name={colName(t, r.from)} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{colName(t, r.from)}</div>
                <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{t("cv.home.ask") + " · " + shortRange(t, r.start, r.end)}</div>
              </div>
              <Button kind="secondary" size="sm" onClick={() => setOpenId(r.id)}>{t("cv.view")}</Button>
            </div>
          ))}
        </div>
        {upcoming.length ? (
          <div style={{ marginTop: pending.length ? 16 : 0 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("cv.home.upcoming")}</div>
            {upcoming.map((r, i) => {
              const col = colleague(r.from);
              return (
                <button key={r.id} type="button" onClick={() => setOpenId(r.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", border: "none", background: "transparent", padding: "9px 0", borderTop: i ? "1px solid " + c.rule : "none", cursor: "pointer", textAlign: "left" }}>
                  <Initials name={colName(t, r.from)} size={28} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{colName(t, r.from)}</span>
                    <span style={ty("caption", { display: "block", color: c.inkMuted })}>{shortRange(t, r.start, r.end)}</span>
                  </span>
                  <StatusMark role="present" glyph="check" word={t("cv.f.accepted")} />
                </button>
              );
            })}
          </div>
        ) : null}
        <div style={{ marginTop: 14 }}>
          <LinkButton onClick={() => { CoverStore.openFilter = "all"; onNavigate && onNavigate("leave"); }}>{t("cv.home.all")}</LinkButton>
        </div>
        {openId ? <CoverRequestDialog id={openId} own={REQUESTS} onClose={() => setOpenId(null)} onDone={(text) => setToast({ id: Date.now(), text: text })} /> : null}
        <Toast toast={toast} onClose={() => setToast(null)} />
      </Card>
    );
  }

  window.NaveyaCover = { store: CoverStore, HomeCard: HomeCoverCard, Dialog: CoverRequestDialog };

  /* Every role that can apply for leave sees the same balances, from
     one definition. `role` sets who is asking (teaching staff get no
     earned leave; office staff do), so the card is correct wherever
     it is mounted. */
  function BalancesFor({ role, requests }) {
    ME = profileFor(role || "employee");
    return <BalancesCard requests={requests || []} />;
  }
  /* the apply flow is mounted from the Requests module too — one
     definition of "how leave is applied for", cover step included,
     rather than a thinner second form that could forget the rule. */
  function ApplyFor({ role, onClose, onSent }) {
    ME = profileFor(role || "employee");
    const prof = profileFor(role || "employee");
    const [live] = useState(REQUESTS.map((r) => Object.assign({}, r, prof.cover ? {} : { coverBy: undefined, coverState: undefined })));
    return (
      <ApplyFlow
        requests={live}
        onClose={onClose}
        onSend={(draft) => { onSent && onSent(draft); }}
      />
    );
  }
  window.NaveyaLeave = { Balances: BalancesFor, PolicyTip: PolicyTip, Apply: ApplyFor };

  /* ============================================================
     PAGE
     ============================================================ */
  function Leave({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const prof = profileFor(role);
    ME = prof;
    /* the teacher's LR-0219 waits on class cover; nobody else's leave does */
    const [requests, setRequests] = useState(REQUESTS.map((r) => Object.assign({}, r, prof.cover ? {} : { coverBy: undefined, coverState: undefined })));
    /* subscribe to the shared queue: the ids this page shares with the
       approver screens take their status and their dates from there */
    LF.useRequests();
    const [filter, setFilter] = useState("all");
    const [selectedId, setSelectedId] = useState(REQUESTS[0].id);
    const [flow, setFlow] = useState(null);
    const [toast, setToast] = useState(null);
    const seq = useRef(220);
    const [cvFilter, setCvFilter] = useState(CoverStore.openFilter || "pending");
    const [cvOpen, setCvOpen] = useState(null);
    useEffect(() => {
      /* arriving from Home's "All cover requests" */
      if (CoverStore.openFilter) {
        CoverStore.openFilter = null;
        setTimeout(() => { const el = document.getElementById("cv-card"); if (el) el.scrollIntoView({ block: "start" }); }, 50);
      }
    }, []);
    function reviewIncoming() {
      setCvFilter("pending");
      const el = document.getElementById("cv-card");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function say(text) { setToast({ id: Date.now(), text: text }); }
    function openRequest(id) {
      const r = requests.filter((x) => x.id === id)[0];
      if (r && filter !== "all" && r.status !== filter) setFilter("all");
      setSelectedId(id);
    }
    const handlers = {
      rename: (id) => setFlow({ renameFor: requests.filter((x) => x.id === id)[0] }),
      withdraw: (id) => {
        setRequests((rs) => rs.map((r) => (r.id === id ? Object.assign({}, r, { status: "withdrawn", decided: TODAY_ISO }) : r)));
        const s = LF.byId(id);
        if (s) LF.withdraw(id, s.person.nameKey);
        say(t("lv2.withdrawn", { id: id }));
      },
    };
    function send(v) {
      const id = "LR-" + String(seq.current++).padStart(4, "0");
      /* cover is part of the request, so it is written with it and
         starts as "asked" — there is no state in which a request
         exists and its classes have nobody against them */
      const row = { id: id, type: v.type, from: v.from, to: v.to, days: v.days, half: v.half || undefined, status: "pending", coverBy: v.cover || undefined, coverAsked: v.cover ? TODAY_ISO : undefined, coverState: v.cover ? "asked" : undefined, applied: TODAY_ISO, reasonText: v.reason };
      setRequests((rs) => [row].concat(rs));
      setFlow(null); setFilter("all"); setSelectedId(id);
      say(v.cover ? t("lv2.sent", { id: id, who: v.who }) : t("lv2.sentNoCover", { id: id, name: approver(t) }));
    }

    const live = requests.map((r) => {
      const s = LF.byId(r.id);
      if (!s || r.status === "withdrawn") return r;
      const st = LF.statusOf(s);
      const done = s.stages.filter((x) => x.outcome);
      const last = done.length ? done[done.length - 1] : null;
      return Object.assign({}, r, {
        status: st === "cancelled" ? "withdrawn" : st,
        decided: last ? last.onISO : r.decided,
      });
    });
    /* the principal and the director have nobody above them, so there
       is no leave for them to apply for. Their rail carries no Leave
       item at all; this only catches a typed URL, and it says why
       rather than showing an empty version of somebody else's screen. */
    if (prof.topOfChain) {
      return (
        <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
          <Rail role={role || "principal"} active="leave" onNavigate={onNavigate} />
          <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
            <Motif />
            <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "80px " + L.contentPadX + "px 56px" }}>
              <EmptyState
                head={t("lv4.top.head")}
                body={t("lv4.top.body")}
                action={<Button kind="secondary" iconLeft="leave" onClick={() => onNavigate(role === "director" ? "drLeave" : "prLeave")}>{t("lv4.top.cta")}</Button>}
              />
            </div>
          </main>
        </div>
      );
    }

    const selected = live.filter((r) => r.id === selectedId)[0] || null;

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "employee"} active="leave" onNavigate={onNavigate} />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.leave")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
              <div>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("lv.pageTitle")}</h1>
                <div style={ty("small", { color: c.inkMuted, marginTop: 8 })}>{t("lv.session")}</div>
              </div>
              <Button kind="primary" size="lg" iconLeft="leave" onClick={() => setFlow({})}>{t("lv2.apply")}</Button>
            </div>

            <BalancesCard requests={live} />

            {prof.cover ? (
              <CoversCard
                filter={cvFilter} setFilter={setCvFilter} own={live}
                onOpen={(id) => setCvOpen({ id: id })}
                onDecline={(id) => setCvOpen({ id: id, mode: "decline" })}
                onAccept={(r) => {
                  CoverStore.update(r.id, { status: "accepted", decided: TODAY_ISO });
                  say(t("cv.toast.accept", { name: colName(t, r.from), dates: shortRange(t, r.start, r.end) }));
                }}
              />
            ) : null}

            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", marginTop: L.gap }}>
              <HistoryRegister requests={live} filter={filter} setFilter={setFilter} selectedId={selectedId} onSelect={openRequest} />
              <div style={{ display: "flex", flexDirection: "column", gap: L.gap, width: L.colNarrow, flex: "0 0 " + L.colNarrow + "px" }}>
                <RequestDetail request={selected} handlers={handlers} />
                <WindowsCard />
              </div>
            </div>

          </div>
        </main>
        {cvOpen ? <CoverRequestDialog id={cvOpen.id} initMode={cvOpen.mode} own={live} onClose={() => setCvOpen(null)} onDone={say} /> : null}
        {flow && flow.renameFor
      ? <RenameCover
          request={flow.renameFor} onClose={() => setFlow(null)}
          onSend={(id, cover) => {
            setRequests((rs) => rs.map((r) => (r.id === id ? Object.assign({}, r, { coverBy: cover, coverAsked: TODAY_ISO, coverState: "asked" }) : r)));
            setFlow(null); setSelectedId(id);
            say(t("lv4.act.renameDone", { who: colName(t, cover.one), id: id }));
          }}
        />
      : flow ? <ApplyFlow onClose={() => setFlow(null)} onSend={send} requests={live} /> : null}
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.Leave = Leave;
})();
