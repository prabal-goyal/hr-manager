/* @jsxRuntime classic */
/* ============================================================
   Naveya — Pay requests (HR) · window.Pages3.HRPay

   WHAT THIS MODULE IS FOR. Everything an employee asks for on top of
   their salary used to be scattered: a reimbursement was a helpdesk
   ticket, a loan was a conversation, overtime was a spreadsheet the
   admin office kept, and a rise was buried in the appraisal tab of
   one person's record. Four different objects, four different
   vocabularies, and no single answer to the question HR is actually
   asked twenty times a month -- "where has my claim got to?"

   THE RULING (designer, 2026-10-08): reimbursements, loans and
   advances, overtime and appraisal rises belong in ONE fresh module;
   HR is the FIRST approver and the payroll officer is the FINAL one;
   and the approval status must be trackable in full, on both desks.

   SO: ONE CHAIN, FOUR SUBJECTS. Every request walks the same four
   stops -- RAISED, HR, PAYROLL, PAID -- and the same strip draws
   them, whatever the request is about. An operator learns the
   vocabulary once. Two exits leave the chain and both are drawn as
   breaks rather than as states that look like progress: RETURNED
   (back to the employee for something missing) and DECLINED (it
   stops, at the desk that stopped it, with a reason and a name).

   THE SPLIT IS THE ONE pay-handoff.jsx ALREADY SET:

     HR VERIFIES THE FACT.  PAYROLL SETS THE FIGURE.

   HR checks the bill, the policy, the roster, the purpose. HR never
   edits the amount on a claim, because the amount is the employee's
   statement and editing it would quietly turn a disagreement into a
   fact. HR never sets a principal, an EMI or an hourly rate. What HR
   can do is verify and pass on, send back for something missing, or
   decline with a reason -- three acts, the same three on every tab.

   OVERTIME IS DERIVED, NEVER TYPED. The hours come from punches
   against the roster, and the record opens on the DAYS that produced
   them, so the figure can always be read back to the person it is
   about. HR may reduce the verified hours -- a department asked for
   two of those evenings and not the other two -- and a reduction
   carries a reason. The money is not here at all: the Code on Wages
   2019 s.14 puts overtime at not less than twice the normal rate of
   wages, and that multiple is payroll's arithmetic against the
   pinned configuration.

   WHO IS NOT ELIGIBLE IS STATED. Teaching staff are not on hourly
   wages. Their detected hours still appear, declined with the reason
   written out, because a row that silently never existed is how a
   school ends up arguing about it in a corridor.

   SPEC — docs/development-specification.md M4, M9, M10, M11;
   screen-inventory HR-40 (register) and HR-41 (record).
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark,
    Icon, EmptyState, Field, Input, Select, Tabs, TabPanel, ActionMenu,
    SideScreen, Modal, BackBar, Avatar, inr, num, Band, Meter,
    CampusSwitch, campusLabel, inCampus, campusOfCode, CAMPUS_ALL,
  } = UI;

  const Q = window.NaveyaPayRequests || null;

  /* the four tabs, in the order the money moves: what people spent,
     what they borrowed, what they worked, what they earned more of */
  const TABS = ["claim", "loan", "ot", "rise"];

  /* one tone per state, used by the stacked bar, the chips and the
     strip, so a colour means the same thing on every tab */
  const STATE_TONE = {
    withHR: "chartAmber", withPayroll: "chartBlue", approved: "chartTeal",
    paid: "chartGreen", returned: "chartSand", declined: "chartRed",
  };

  addStrings({
    en: {
      "hrp.crumb": "People",
      "hrp.entity": "Naveya Vidya Trust — Bengaluru",
      "hrp.sq.title": "Salaries payroll has asked about",
      "hrp.sq.sub1": "One salary. Open the record and put it right.",
      "hrp.sq.sub": "{n} salaries. Open each record and put it right.",
      "hrp.sq.by": "Asked by {who}",
      "hrp.sq.open": "Open the record",
      "hrp.title": "Pay requests",
      "hrp.who": "Meera Iyer",
      "hrp.role": "HR Operator",

      "hrp.tabs.aria": "Kinds of pay request",
      "hrp.tab.claim": "Reimbursements",
      "hrp.tab.loan": "Loans & advances",
      "hrp.tab.ot": "Overtime",
      "hrp.tab.rise": "Appraisal rises",

      "hrp.band.head": "Where every request stands",
      "hrp.band.blocked": "{n} of the claims waiting on you came with no bill attached.",

      "hrp.seg.withHR": "With you",
      "hrp.seg.withPayroll": "With payroll",
      "hrp.seg.approved": "Approved",
      "hrp.seg.paid": "Paid",
      "hrp.seg.returned": "Returned",
      "hrp.seg.declined": "Declined",

      "hrp.st.withHR": "With you",
      "hrp.st.withPayroll": "With payroll",
      "hrp.st.approved": "Approved",
      "hrp.st.paid": "Paid",
      "hrp.st.returned": "Returned",
      "hrp.st.declined": "Declined",

      "hrp.m.yours": "Waiting on you",
      "hrp.m.yoursNone": "your queue is clear",
      "hrp.m.stake": "{v} in all",
      "hrp.m.stakeH": "{v} hours in all",
      "hrp.m.stakeM": "{v} a month in all",
      "hrp.m.payroll": "With payroll",
      "hrp.m.payrollNote": "last sent {date}",
      "hrp.m.payrollNone": "nothing on their desk",
      "hrp.m.back": "Sent back",
      "hrp.m.backNote": "{who}, {n} days ago",
      "hrp.m.backNone": "nothing with an employee",
      "hrp.m.oldest": "Oldest",
      "hrp.m.daysUnit": "days",
      "hrp.m.today": "today",
      "hrp.m.oldestNote2": "{who}",
      "hrp.m.settled": "Settled",
      "hrp.m.settledNote": "{n} of them paid",
      "hrp.m.settledNone": "none settled this month",
      "hrp.m.settledNonePaid": "none paid yet",
      "hrp.m.oldestNone": "nothing is waiting",
      "hrp.m.none": "—",

      "hrp.stop.raised": "Raised",
      "hrp.stop.hr": "You",
      "hrp.stop.payroll": "Payroll",
      "hrp.stop.paid": "Paid",
      "hrp.stop.waiting": "waiting",
      "hrp.stop.stopped": "Stopped here",

      "hrp.f.show": "Show",
      "hrp.f.yours": "Waiting on you",
      "hrp.f.open": "Still open",
      "hrp.f.all": "Everything",
      "hrp.f.campus": "Campus",
      "hrp.f.allCampus": "Every campus",
      "hrp.f.clear": "Clear",

      "hrp.col.who": "Who asked",
      "hrp.col.for": "What for",
      "hrp.col.amount": "Amount claimed",
      "hrp.col.asked": "Amount asked",
      "hrp.col.over": "Over",
      "hrp.col.raised": "Raised",
      "hrp.col.recorded": "Recorded",
      "hrp.col.period": "Period",
      "hrp.col.hours": "Hours",
      "hrp.col.days": "Days",
      "hrp.col.rise": "Increase",
      "hrp.col.to": "Comes to",
      "hrp.col.stage": "Stage",
      "hrp.col.act": "Actions",

      "hrp.months": "{n} months",
      "hrp.hours": "{n} h",
      "hrp.hoursCut": "{v} of {d} h",
      "hrp.ofDays": "{n} days",
      "hrp.byWho": "by {who}",
      "hrp.byThem": "by the employee",
      "hrp.notEligible": "Not eligible",

      "hrp.reg.claim": "Reimbursement claims",
      "hrp.reg.loan": "Loan and advance requests",
      "hrp.reg.ot": "Overtime, read from the attendance ledger",
      "hrp.reg.rise": "Rises agreed at appraisal",
      "hrp.reg.sub": "{n} shown. A row opens the request, where every act on it is listed with a name and a date.",

      "hrp.act.open": "Open the request",
      "hrp.act.verify": "Verify and send to payroll",
      "hrp.act.sendBack": "Send back to the employee",
      "hrp.act.decline": "Decline it",
      "hrp.act.off": "This is no longer yours to act on.",
      "hrp.act.add.claim": "Record a claim",
      "hrp.act.add.loan": "Record a request",
      "hrp.act.add.ot": "Record a missed day",
      "hrp.act.add.rise": "Rises are recorded in the appraisal",
      "hrp.act.addRiseWhy": "A rise comes from an appraisal on a person's record, not from here. This tab is where you watch what happened to it.",
      "hrp.act.goAppraisal": "Open staff records",

      "hrp.none": "Nothing here under these filters",
      "hrp.noneBody": "Clear the filters to see everything.",
      "hrp.noneYours": "Nothing is waiting on you",
      "hrp.noneYoursBody": "Every request on this tab has either moved to payroll or left the chain.",

      "hrp.d.facts": "Who asked, and what for",
      "hrp.d.raisedOn": "Raised on",
      "hrp.d.recordedOn": "Recorded on",
      "hrp.d.flag": "Worth a look",
      "hrp.d.person": "Who",
      "hrp.d.staff": "Staff number",
      "hrp.d.group": "Pay group",
      "hrp.d.campus": "Campus",
      "hrp.d.raised": "Raised",
      "hrp.d.bill": "Bill",
      "hrp.d.billNo": "Bill number",
      "hrp.d.noBill": "None attached",
      "hrp.d.noBillNote": "Nothing came with it when it was raised",
      "hrp.d.amount": "Amount claimed",
      "hrp.d.claimedOn": "Claimed on {date}",
      "hrp.d.capLine": "{cap} a year on this category",
      "hrp.d.capLeft": "{v} of it left",
      "hrp.d.capOver": "{v} over the cap",
      "hrp.d.capNoneLine": "Nothing caps this category.",
      "hrp.d.purpose": "Purpose",
      "hrp.d.purposeNone": "Not stated",
      "hrp.d.loanKind": "Kind",
      "hrp.d.loan": "Loan",
      "hrp.d.advance": "Advance",
      "hrp.d.service": "Continuous service",
      "hrp.d.years": "{n} years",
      "hrp.d.gross": "Monthly gross",
      "hrp.d.running": "Already running",
      "hrp.d.becomes": "Sanctioned as {id}",

      "hrp.d.period": "Period",
      "hrp.d.detected": "Hours detected",
      "hrp.d.verified": "Hours you verified",
      "hrp.d.source": "Read from",
      "hrp.d.src.device": "Biometric punches",
      "hrp.d.src.manual": "Entered by hand, because the device missed the day",
      "hrp.d.evidence": "The days behind the figure",
      "hrp.d.ev.date": "Date",
      "hrp.d.ev.roster": "Rostered that day",
      "hrp.d.ev.over": "Over",
      "hrp.d.otRule": "Payroll prices these hours at the statutory multiple (Code on Wages 2019, s.14).",
      "hrp.d.evSub": "When they came in, when they left, and what they were rostered for.",
      "hrp.d.ev.span": "In and out",
      "hrp.d.ev.daysTot": "{n} evenings",
      "hrp.d.ev.foot": "Over is time past the roster on that day. The figure above is the sum of them.",
      "hrp.d.ev.footCut": "Over is time past the roster on that day. You verified fewer hours than these add to \u2014 your figure governs.",
      "hrp.d.lead.loan": "Over the {n} months they asked for, about {bite} a month.",
      "hrp.d.advAsked": "Advance asked for",
      "hrp.d.lead.adv": "Taken back over the {n} months they asked for, about {bite} a month.",
      "hrp.d.lead.advOne": "Taken back in full from the salary after it.",
      "hrp.d.f.paidOut": "Paid out",
      "hrp.d.f.paidOutV": "Before the next salary",
      "hrp.d.f.paidOutNote": "payroll hands it out inside the open run",
      "hrp.d.f.firstEmi": "First instalment",
      "hrp.d.f.firstEmiV": "The run after it is sanctioned",
      "hrp.d.f.firstEmiNote": "payroll sets the date with the schedule",
      "hrp.d.lead.loanBare": "No tenure stated, so there is no instalment to judge it by yet.",
      "hrp.d.f.runNone": "Nothing",
      "hrp.d.f.runNote": "Outstanding on {id}",
      "hrp.d.f.runNoneNote": "No loan on them today",
      "hrp.d.f.grossNote": "an instalment is {pct}% of it",
      "hrp.d.lead.otRaw": "Straight off the roll. Nobody has verified it yet.",
      "hrp.d.lead.otFull": "You verified every hour the roll read.",
      "hrp.d.lead.otCut": "You verified {v} h of the {d} h the roll read.",
      "hrp.d.f.evenings": "Evenings worked",
      "hrp.d.f.eveningsSpan": "{from} to {to}",
      "hrp.d.f.roster": "Rostered that month",
      "hrp.d.f.rosterNote": "in {period}",
      "hrp.d.lead.rise": "{now} a month now, and {inc} more every month once it lands.",
      "hrp.d.f.newGross": "A new gross of",
      "hrp.d.f.newGrossNote": "{v} more a month",
      "hrp.d.f.year": "Over a full year",
      "hrp.d.f.yearNote": "{v} twelve times",
      "hrp.d.otPriced": "Priced at {rate} an hour × {mult} = {v}",

      "hrp.d.pct": "Increase agreed",
      "hrp.d.appr": "From appraisal",
      "hrp.d.settledAt": "Payroll set it at {v}, effective {from}",

      "hrp.d.chain": "Where it has got to",
      "hrp.d.chainSub": "Every act on this request, with the name and the date it carries.",
      "hrp.d.ev.raised": "Raised by {who}",
      "hrp.d.ev.recorded": "Recorded by {who}",
      "hrp.d.ev.hr": "Verified by {who}",
      "hrp.d.ev.hrCut": "Verified by {who}, reduced from {d} h to {v} h",
      "hrp.d.ev.payroll": "Decided by {who}",
      "hrp.d.ev.paid": "Paid with run {run}",
      "hrp.d.ev.returned": "Sent back by {who}",
      "hrp.d.ev.declined": "Declined by {who}",
      "hrp.d.ev.waiting": "Waiting here since {on}, {n} days",
      "hrp.d.ev.batch": "In the {run} batch",

      "hrp.d.sendBackWhy": "It goes back to the employee with your reason. They can correct it and raise it again.",
      "hrp.d.declineWhy": "It stops here, with your name and your reason on it for as long as the record exists.",
      "hrp.d.closedWhy": "This request has left your desk. You can read every act on it above, but only payroll can move it now.",
      "hrp.d.declinedWhy": "Declined at {where} on {on}. {reason}",
      "hrp.d.at.hr": "your desk",
      "hrp.d.at.payroll": "payroll",
      "hrp.d.returnedWhy": "Sent back to the employee on {on}. {reason}",

      "hrp.v.title": "Verify and send to payroll",
      "hrp.v.body": "You are confirming the fact, not the figure. {who} receives it and decides what is paid and when.",
      "hrp.v.bodyOT": "You are confirming the hours. {who} prices them at the statutory multiple against the pinned configuration.",
      "hrp.v.hours": "Hours you verify",
      "hrp.v.hoursHint": "{n} h were detected. Reduce it if some of those hours were not asked for, and say why.",
      "hrp.v.cutReason": "Why fewer than detected",
      "hrp.v.recommend": "Months you recommend",
      "hrp.v.recommendHint": "They asked for {n}. Payroll sets the instalment from whatever it sanctions.",
      "hrp.v.note": "Anything payroll should read",
      "hrp.v.noteHint": "Optional. A sentence is enough.",
      "hrp.v.go": "Verify and send",
      "hrp.v.done": "Sent to {who}. It is out of your queue and on their desk.",

      "hrp.b.title": "Send back to the employee",
      "hrp.b.body": "They get it back with your reason and can raise it again once it is fixed. Nothing is deleted.",
      "hrp.b.reason": "What is missing",
      "hrp.b.note": "Anything else",
      "hrp.b.go": "Send it back",
      "hrp.b.done": "Sent back to {who}.",

      "hrp.x.title": "Decline this request",
      "hrp.x.body": "This is the end of it. Your name and your reason stay on the record, and the employee is told.",
      "hrp.x.reason": "Why",
      "hrp.x.note": "Anything else",
      "hrp.x.go": "Decline it",
      "hrp.x.done": "Declined. The employee has been told.",

      "hrp.a.title.claim": "Record a claim",
      "hrp.a.title.loan": "Record a loan or advance request",
      "hrp.a.title.ot": "Record a day the device missed",
      "hrp.a.body.claim": "For a paper claim that came to your desk. It enters the chain exactly where an employee's own would, waiting on you.",
      "hrp.a.body.loan": "For a request made in person or on paper. You are recording what was asked for, not sanctioning it.",
      "hrp.a.body.ot": "For a day the biometric device missed. It is marked as entered by hand, and the record says so for as long as it exists.",
      "hrp.a.person": "Who it is for",
      "hrp.a.personPick": "Choose a person",
      "hrp.a.cat": "Category",
      "hrp.a.amount": "Amount",
      "hrp.a.billNo": "Bill number",
      "hrp.a.billDate": "Bill date",
      "hrp.a.loanKind": "Loan or advance",
      "hrp.a.purpose": "Purpose",
      "hrp.a.tenure": "Months asked for",
      "hrp.a.date": "Date worked",
      "hrp.a.in": "In",
      "hrp.a.out": "Out",
      "hrp.a.hours": "Hours over the roster",
      "hrp.a.hoursHint": "Payroll prices them at the statutory multiple.",
      "hrp.a.tenureHint": "What they asked for. Payroll sets the instalment it sanctions.",
      "hrp.a.go": "Record it",
      "hrp.a.done": "Recorded, and waiting on you.",
      "hrp.cancel": "Cancel",
      "hrp.d.ev.recordedShort": "Recorded",
      "hrp.d.ev.cutShort": "{d} h → {v} h",
      "hrp.d.waitingHere": "It has been sitting where it is for {n} days.",
      "hrp.d.sanctioned": "Sanctioned",
      "hrp.hoursUnit": "h",
      "hrp.col.onGross": "On a gross of",
      "hrp.d.pctOnly": "Recorded a rise of {pct}%",
      "hrp.d.pyWho": "Sunita Kulkarni",
      "hrp.mon.1": "January", "hrp.mon.2": "February", "hrp.mon.3": "March",
      "hrp.mon.4": "April", "hrp.mon.5": "May", "hrp.mon.6": "June",
      "hrp.mon.7": "July", "hrp.mon.8": "August", "hrp.mon.9": "September",
      "hrp.mon.10": "October", "hrp.mon.11": "November", "hrp.mon.12": "December",
    },
  });

  /* ------------------------------------------------------------
     Dates. `pyo.mon.*` only runs March to September, and this module
     reaches October, so the months are declared here rather than
     borrowed -- a missing key renders as nothing at all and says so
     to nobody.
     ------------------------------------------------------------ */
  /* num() rounds to a whole number, which is right for people and
     days and WRONG for overtime: half an hour is the unit this is
     measured in, and six days of 3.5 printed as 4 made the evidence
     add up to 24 under a total of 22. */
  function hrsNum(n) {
    if (n == null) return "—";
    const r = Math.round(n * 2) / 2;
    return r % 1 === 0 ? num(r) : num(Math.floor(r)) + ".5";
  }

  /* WHAT IS AT STAKE, in the unit the tab is measured in. A count
     answers how many; this answers how much, which is the second
     question every one of these figures was asked. */
  function stakeWord(t, kind, list) {
    if (!list.length) return null;
    if (kind === "ot") {
      return t("hrp.m.stakeH", { v: hrsNum(list.reduce(function (a, r) { return a + Q.otHours(r); }, 0)) });
    }
    if (kind === "rise") {
      return t("hrp.m.stakeM", {
        v: inr(list.reduce(function (a, r) { return a + Math.max(0, r.targetGross - r.currentGross); }, 0)),
      });
    }
    return t("hrp.m.stake", {
      v: inr(list.reduce(function (a, r) { return a + (r.kind === "loan" ? (r.amountAsked || 0) : (r.amount || 0)); }, 0)),
    });
  }

  function isoParts(iso) { const p = iso.split("-"); return { y: +p[0], m: +p[1], d: +p[2] }; }
  /* "4 Aug" -- a line under a figure has no room for a year every
     other row on the screen already shares */
  function dayMon(t, iso) {
    if (!iso) return "—";
    const p = isoParts(iso);
    return num(p.d) + " " + t("hrp.mon." + p.m);
  }
  function fmtDate(t, iso) {
    if (!iso) return "—";
    const p = isoParts(iso);
    return num(p.d) + " " + t("hrp.mon." + p.m) + " " + p.y;
  }

  /* the people HR can record a request against. Same keys the payroll
     registers use, so one person is one person across both desks. */
  const STAFF = [
    { personKey: "pyo.n.ananya", staff: "NAV-0142", groupKey: "pyo.pg.teach", campusKey: "pyo.camp.indira" },
    { personKey: "pyo.n.joseph", staff: "NAV-0301", groupKey: "pyo.pg.teach", campusKey: "pyo.camp.white" },
    { personKey: "pyo.n.kavita", staff: "NAV-0007", groupKey: "pyo.pg.admin", campusKey: "pyo.camp.indira" },
    { personKey: "pyo.n.farida", staff: "NAV-0388", groupKey: "pyo.pg.admin", campusKey: "pyo.camp.indira" },
    { personKey: "pyo.n.lata", staff: "NAV-0177", groupKey: "pyo.pg.admin", campusKey: "pyo.camp.white" },
    { personKey: "pyo.n.girish", staff: "NAV-0291", groupKey: "pyo.pg.admin", campusKey: "pyo.camp.white" },
    { personKey: "pyo.n.rukmini", staff: "NAV-0195", groupKey: "pyo.pg.admin", campusKey: "pyo.camp.indira" },
    { personKey: "pyo.n.peter", staff: "NAV-0239", groupKey: "pyo.pg.admin", campusKey: "pyo.camp.hyd" },
  ];

  const CLAIM_CATS = ["lta", "med", "tel", "books", "fuel"];
  const PURPOSES = ["pyo.loan.p.home", "pyo.loan.p.vehicle", "pyo.loan.p.education", "pyo.loan.p.medical", "pyo.loan.p.festival"];
  const RETURN_REASONS = ["pq.ret.r.noBill", "pq.ret.r.illegible", "pq.ret.r.noPurpose", "pq.ret.r.wrongPerson", "pq.ret.r.other"];
  const DECLINE_REASONS = ["pq.dec.r.notCovered", "pq.dec.r.duplicate", "pq.dec.r.exposure", "pq.dec.r.notHourly", "pq.dec.r.other"];

  function stateMark(t, r) {
    if (r.state === "paid") return <StatusMark role="present" glyph="check" word={t("hrp.st.paid")} />;
    if (r.state === "approved") return <StatusMark role="present" glyph="check" word={t("hrp.st.approved")} />;
    if (r.state === "withPayroll") return <StatusMark role="leave" glyph="arrow" word={t("hrp.st.withPayroll")} />;
    if (r.state === "withHR") return <StatusMark role="late" glyph="clock" word={t("hrp.st.withHR")} />;
    if (r.state === "returned") return <StatusMark role="off" glyph="arrow" word={t("hrp.st.returned")} />;
    return <StatusMark role="danger" glyph="alert" word={t("hrp.st.declined")} />;
  }

  function Shell({ role, onNavigate, title, q, back, chips, tabs, campus, onCampus, children }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrPay" onNavigate={onNavigate} initials="MI" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("hrp.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
                <span>{t("hrp.entity")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{campusLabel(t, campus)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {onCampus ? <CampusSwitch value={campus} onChange={onCampus} /> : null}
                <ThemeToggle />
              </div>
            </div>
            {back ? <div style={{ marginBottom: 14 }}><BackBar label={back.label} onBack={back.onBack} /></div> : null}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
              <div style={{ minWidth: 320, maxWidth: 780 }}>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{title}</h1>
                <div style={ty("small", { color: c.inkMuted, marginTop: 6 })}>{q}</div>
              </div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>{chips}</div>
            </div>
            {tabs}
            {children}
          </div>
        </main>
      </div>
    );
  }

  function FilterPair({ id, label, width, children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <label htmlFor={id} style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" })}>{label}</label>
        <div style={{ width: width }}>{children}</div>
      </div>
    );
  }

  /* ============================================================
     THE REGISTERS. Six columns per tab, one fact each, and the last
     three -- stage and actions -- are the same everywhere so the eye
     does not have to re-learn the right-hand side on every tab.
     ============================================================ */
  function WhoCell({ r }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <Avatar name={t(r.personKey)} size={26} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{t(r.personKey)}</div>
          <div style={G3.fig("micro", { color: c.inkFaint })}>{r.staff}</div>
        </div>
      </div>
    );
  }

  function RowActions({ r, onOpen }) {
    const { t } = useLang();
    const mine = r.state === "withHR";
    return (
      <span style={{ display: "flex", justifyContent: "flex-end" }} onClick={function (e) { e.stopPropagation(); }}>
        <ActionMenu
          ariaLabel={t(r.personKey)} size={30}
          items={[
            { key: "open", icon: "document", label: t("hrp.act.open"), onSelect: function () { onOpen(r.id); } },
            { key: "verify", icon: "check", label: t("hrp.act.verify"), tone: "go", disabled: !mine,
              reason: mine ? null : t("hrp.act.off"), onSelect: function () { onOpen(r.id, "verify"); } },
            { key: "back", icon: "arrow", label: t("hrp.act.sendBack"), disabled: !mine,
              reason: mine ? null : t("hrp.act.off"), onSelect: function () { onOpen(r.id, "back"); } },
            { key: "decline", icon: "alert", label: t("hrp.act.decline"), tone: "danger", disabled: !mine,
              reason: mine ? null : t("hrp.act.off"), onSelect: function () { onOpen(r.id, "decline"); } },
          ]}
        />
      </span>
    );
  }

  function columnsFor(t, kind) {
    const tail = [
      { key: "cmp", label: t("kit.campus.label"), width: 140 },
      { key: "stage", label: t("hrp.col.stage"), width: 160 },
      { key: "act", label: t("hrp.col.act"), align: "right", width: 60 },
    ];
    if (kind === "claim") {
      return [
        { key: "who", label: t("hrp.col.who") },
        { key: "for", label: t("hrp.col.for"), width: 190 },
        { key: "v", label: t("hrp.col.amount"), align: "right", mono: true, width: 150, weight: 700 },
        { key: "on", label: t("hrp.col.raised"), width: 140 },
      ].concat(tail);
    }
    if (kind === "loan") {
      return [
        { key: "who", label: t("hrp.col.who") },
        { key: "for", label: t("hrp.col.for"), width: 210 },
        { key: "v", label: t("hrp.col.asked"), align: "right", mono: true, width: 150, weight: 700 },
        { key: "over", label: t("hrp.col.over"), align: "right", width: 110 },
      ].concat(tail);
    }
    if (kind === "ot") {
      return [
        { key: "who", label: t("hrp.col.who") },
        { key: "for", label: t("hrp.col.period"), width: 170 },
        { key: "v", label: t("hrp.col.hours"), align: "right", mono: true, width: 130, weight: 700 },
        { key: "over", label: t("hrp.col.days"), align: "right", width: 100 },
      ].concat(tail);
    }
    return [
      { key: "who", label: t("hrp.col.who") },
      { key: "for", label: t("hrp.col.rise"), align: "right", mono: true, width: 130, weight: 700 },
      { key: "v", label: t("hrp.col.onGross"), align: "right", mono: true, width: 160 },
      { key: "on", label: t("hrp.col.recorded"), width: 140 },
    ].concat(tail);
  }

  function cellsFor(t, c, r, onOpen) {
    const base = {
      who: <WhoCell r={r} />, cmp: campusLabel(t, campusOfCode(r.staff)),
      stage: stateMark(t, r), act: <RowActions r={r} onOpen={onOpen} />,
    };
    if (r.kind === "claim") {
      base["for"] = (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>{t("pyo.cat." + r.cat)}</span>
          {r.hasBill ? null : <StatusMark role="danger" glyph="alert" word={t("hrp.d.noBill")} />}
        </span>
      );
      base.v = inr(r.amount);
      base.on = fmtDate(t, r.raisedIso);
      return base;
    }
    if (r.kind === "loan") {
      base["for"] = (
        <span>
          <span style={{ fontWeight: 600 }}>{t(r.loanKind === "loan" ? "hrp.d.loan" : "hrp.d.advance")}</span>
          <span style={{ color: c.inkMuted }}>{" · " + (r.purposeKey ? t(r.purposeKey) : t("hrp.d.purposeNone"))}</span>
        </span>
      );
      base.v = inr(r.amountAsked);
      base.over = t("hrp.months", { n: num(r.tenureAsked) });
      return base;
    }
    if (r.kind === "ot") {
      base["for"] = (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>{t(r.periodKey)}</span>
          {r.eligible ? null : <StatusMark role="danger" glyph="alert" word={t("hrp.notEligible")} />}
        </span>
      );
      base.v = r.verified != null && r.verified !== r.detected
        ? t("hrp.hoursCut", { v: num(r.verified), d: num(r.detected) })
        : t("hrp.hours", { n: num(Q.otHours(r)) });
      base.over = t("hrp.ofDays", { n: num((r.days || []).length) });
      return base;
    }
    base["for"] = "+" + r.pct + "%";
    base.v = inr(r.currentGross);
    base.on = fmtDate(t, r.raisedIso);
    return base;
  }

  function RequestList({ kind, rows, onOpen, show, onAdd, onNavigate }) {
    const { c } = useTheme();
    const { t } = useLang();
    if (!rows.length) {
      return (
        <Card>
          <EmptyState
            head={show === "yours" ? t("hrp.noneYours") : t("hrp.none")}
            body={show === "yours" ? t("hrp.noneYoursBody") : t("hrp.noneBody")}
          />
        </Card>
      );
    }
    return (
      <Register
        title={t("hrp.reg." + kind)}
        sub={t("hrp.reg.sub", { n: num(rows.length) })}
        action={kind === "rise"
          ? <Button kind="secondary" size="sm" iconLeft="arrow" onClick={function () { if (onNavigate) onNavigate("hrStaff"); }}>{t("hrp.act.goAppraisal")}</Button>
          : <Button kind="secondary" size="sm" iconLeft="plus" onClick={onAdd}>{t("hrp.act.add." + kind)}</Button>}
        onSelect={onOpen}
        columns={columnsFor(t, kind)}
        rows={rows.map(function (r) {
          return {
            id: r.id,
            tone: r.state === "paid" || r.state === "declined" ? "dim" : undefined,
            cells: cellsFor(t, c, r, onOpen),
          };
        })}
      />
    );
  }

  /* ============================================================
     THE STATUS RAIL. The horizontal strip and the written-out chain
     log said the same thing twice, in two full-width cards, which is
     where a third of the empty space came from. They are one object:
     a vertical rail where each stop carries its own date, its actor
     and whatever it did. Reading down it IS reading the history.

     Proximity does the grouping -- a stop and its detail sit
     together and the stops are separated by space, not by rules --
     and the one stop that matters is the only one that is ringed.
     ============================================================ */
  function chainAt(r) {
    if (r.state === "declined") {
      return { pos: r.declined && r.declined.at === "payroll" ? 2 : 1, kind: "declined" };
    }
    if (r.state === "returned") return { pos: 1, kind: "returned" };
    return { pos: Q.stop(r), kind: "running" };
  }

  function StatusRail({ req }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const at = chainAt(req);
    const broken = at.kind !== "running";
    /* A RISE HAS NO STOP BEFORE HR. Nobody raises it: the appraisal
       IS where it is agreed, and HR records it there. Drawing a
       "raised" stop with the same name and the same date on it
       invented an approver who does not exist, so the rise's chain
       begins at HR and every index below it shifts by one. */
    const riseOwn = req.kind === "rise";

    /* one entry per stop: who, when, and what they did there */
    const stops = [
      riseOwn ? null : {
        k: "raised", label: t("hrp.stop.raised"), on: req.raisedIso,
        who: req.raisedBy === "hr" ? t("hrp.who") : t(req.personKey),
      },
      (function () {
        if (req.state === "returned") {
          return {
            k: "hr", label: t("hrp.stop.hr"), on: req.returned.on, who: t("hrp.who"),
            verb: t("hrp.st.returned"), dead: true,
            note: req.returned.reasonKey ? t(req.returned.reasonKey) : null,
          };
        }
        if (req.declined && req.declined.at === "hr") {
          return {
            k: "hr", label: t("hrp.stop.hr"), on: req.declined.on, who: t("hrp.who"),
            verb: t("hrp.st.declined"), dead: true,
            note: req.declined.reasonKey ? t(req.declined.reasonKey) : null,
          };
        }
        if (riseOwn) {
          return {
            k: "hr", label: t("hrp.stop.hr"), on: req.raisedIso, who: t("hrp.who"),
            verb: t("hrp.d.pctOnly", { pct: req.pct }),
          };
        }
        if (req.hr) {
          return {
            k: "hr", label: t("hrp.stop.hr"), on: req.hr.on, who: t("hrp.who"),
            verb: req.hr.cutFrom != null
              ? t("hrp.d.ev.cutShort", { d: hrsNum(req.hr.cutFrom), v: hrsNum(req.verified) })
              : null,
            note: req.hr.reasonKey ? t(req.hr.reasonKey) : req.hr.noteKey ? t(req.hr.noteKey) : (req.hr.note || null),
          };
        }
        return { k: "hr", label: t("hrp.stop.hr"), waiting: req.state === "withHR" };
      })(),
      (function () {
        if (req.declined && req.declined.at === "payroll") {
          return {
            k: "payroll", label: t("hrp.stop.payroll"), on: req.declined.on, who: t("hrp.d.pyWho"),
            verb: t("hrp.st.declined"), dead: true,
            note: req.declined.reasonKey ? t(req.declined.reasonKey) : null,
          };
        }
        if (req.payroll) {
          let note = null;
          if (req.kind === "ot" && req.payroll.value != null) {
            note = t("hrp.d.otPriced", { rate: inr(req.payroll.hourly), mult: num(req.payroll.multiple), v: inr(req.payroll.value) });
          } else if (req.kind === "loan" && req.payroll.principal != null) {
            note = inr(req.payroll.principal) + " · " + t("hrp.months", { n: num(req.payroll.tenure) }) + " · " + inr(req.payroll.emi);
          } else if (req.kind === "rise" && req.payroll.gross != null) {
            note = t("hrp.d.settledAt", { v: inr(req.payroll.gross), from: req.payroll.effectiveFrom || "—" });
          } else if (req.payroll.batch) {
            note = t("hrp.d.ev.batch", { run: req.payroll.batch });
          }
          return { k: "payroll", label: t("hrp.stop.payroll"), on: req.payroll.on, who: t("hrp.d.pyWho"), note: note };
        }
        return { k: "payroll", label: t("hrp.stop.payroll"), waiting: req.state === "withPayroll" };
      })(),
      req.paidIso
        ? { k: "paid", label: t("hrp.stop.paid"), on: req.paidIso, note: t("hrp.d.ev.paid", { run: req.paidWith }) }
        : { k: "paid", label: t("hrp.stop.paid") },
    ].filter(Boolean);
    /* chainAt counts against the four-stop chain; a rise draws three */
    const pos = at.pos - (riseOwn ? 1 : 0);

    return (
      <section
        aria-label={t("hrp.d.chain")}
        style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface, padding: "18px 20px 10px" }}
      >
        <h2 style={ty("h3", { margin: "0 0 2px", color: c.ink })}>{t("hrp.d.chain")}</h2>
        <p style={ty("caption", { color: c.inkMuted, margin: "0 0 16px" })}>
          {req.state === "withHR" || req.state === "withPayroll"
            ? t("hrp.d.waitingHere", { n: num(Q.waitingDays(req)) })
            : t("hrp.d.chainSub")}
        </p>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {stops.map(function (s, i) {
            const done = i < pos;
            const here = i === pos;
            const dead = (here && broken) || s.dead;
            const live = done || here;
            const dotFill = dead ? c.chartRed : live ? c.accent : c.gutter;
            return (
              <li key={s.k} style={{ display: "flex", gap: 13, alignItems: "flex-start", paddingBottom: i < stops.length - 1 ? 18 : 14, position: "relative" }}>
                {i < stops.length - 1 ? (
                  <span aria-hidden="true" style={{
                    position: "absolute", insetInlineStart: 9, top: 19, bottom: 0, width: 2,
                    background: done ? c.accent : c.gutter,
                  }} />
                ) : null}
                <span aria-hidden="true" style={{
                  position: "relative", flexShrink: 0, marginTop: 2,
                  width: 20, height: 20, borderRadius: G3.r.pill, boxSizing: "border-box",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: c.surface,
                  border: "2px solid " + (here ? (dead ? c.chartRed : c.accent) : "transparent"),
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: G3.r.pill, background: dotFill }} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                    <span style={ty("small", { color: live || dead ? c.ink : c.inkFaint, fontWeight: here ? 700 : 600 })}>{s.label}</span>
                    <span style={G3.fig("xs", { color: c.inkMuted, whiteSpace: "nowrap" })}>
                      {s.on ? fmtDate(t, s.on) : s.waiting ? t("hrp.stop.waiting") : ""}
                    </span>
                  </div>
                  {s.who ? <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{s.who}</div> : null}
                  {s.verb ? (
                    <div style={{ marginTop: 5 }}>
                      <StatusMark role={dead ? "danger" : "leave"} glyph={dead ? "alert" : "check"} word={s.verb} />
                    </div>
                  ) : null}
                  {s.note ? <p style={ty("caption", { color: c.inkMuted, margin: "5px 0 0" })}>{s.note}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  /* ------------------------------------------------------------
     WHAT A RECORD LEADS WITH. One figure at the size that says it is
     THE figure, a sentence, and two facts under a rule. No bar: the
     hero carried a segmented one with a row of coloured chips naming
     its parts, which is a quantity drawn in colour -- retired across
     payroll, and wrong here for the same reason. The sentence says
     what the chips said, in words, in a drawer 760 pixels wide.
     ------------------------------------------------------------ */
  function Fact({ label, note, tone, children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ minWidth: 0 }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={ty("small", { color: tone || c.ink, fontWeight: 600, marginTop: 3, overflowWrap: "anywhere" })}>{children}</div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{note}</div> : null}
      </div>
    );
  }

  /* THE CLAIM, GIVEN ROOM (designer). "Amount claimed" was a figure,
     a sentence about what HR is not allowed to do, and two
     micro-labelled facts in a grid -- so the one judgement HR is
     actually making, whether this claim fits inside the year's cap,
     was arithmetic in a parenthesis under a label. The amount leads
     with its category beside it, the cap is a meter with its headroom
     written out in rupees, and the bill is the tile underneath. */
  function ClaimLead({ req }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const cap = req.capV || 0;
    const over = cap ? Math.max(0, req.amount - cap) : 0;
    const left = cap ? Math.max(0, cap - req.amount) : 0;
    const frac = cap ? Math.min(1, req.amount / cap) : 0;
    return (
      <section style={{ border: "1px solid " + c.borderStrong, borderRadius: G3.r.md, background: c.surface, padding: "20px 22px 22px" }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
          {t("hrp.d.amount")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 7, flexWrap: "wrap" }}>
          <span style={G3.fig("xl", { color: c.ink, fontWeight: 700, lineHeight: 1.1 })}>{inr(req.amount)}</span>
          <Chip>{t("pyo.cat." + req.cat)}</Chip>
        </div>
        <div style={ty("caption", { color: c.inkMuted, marginTop: 9 })}>
          {t("hrp.d.claimedOn", { date: fmtDate(t, req.raisedIso) })}
        </div>

        <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid " + c.rule }}>
          {cap ? (
            <React.Fragment>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{t("hrp.d.capLine", { cap: inr(cap) })}</span>
                <span style={ty("small", { color: over ? c.dangerText : c.inkMuted, fontWeight: 600 })}>
                  {over ? t("hrp.d.capOver", { v: inr(over) }) : t("hrp.d.capLeft", { v: inr(left) })}
                </span>
              </div>
              <Meter
                frac={frac} bar={over ? c.chartRed : c.chartTeal} track={c.sunken} height={10}
                label={t("hrp.d.capLine", { cap: inr(cap) })}
              />
            </React.Fragment>
          ) : (
            <div style={ty("small", { color: c.inkMuted })}>{t("hrp.d.capNoneLine")}</div>
          )}
        </div>

        <div style={{ marginTop: 18 }}><BillTile req={req} /></div>
      </section>
    );
  }

  function Lead({ label, value, unit, line, facts, note, callout }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const live = (facts || []).filter(Boolean);
    return (
      <section style={{ border: "1px solid " + c.borderStrong, borderRadius: G3.r.md, background: c.surface, padding: "18px 22px 20px" }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          <span style={G3.fig("xl", { color: c.ink, fontWeight: 700, lineHeight: 1.1 })}>{value}</span>
          {unit ? <span style={ty("h3", { color: c.inkMuted, margin: 0 })}>{unit}</span> : null}
        </div>
        {line ? <div style={ty("small", { color: c.inkMuted, marginTop: 8, maxWidth: "70ch" })}>{line}</div> : null}
        {live.length ? (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px 20px",
            marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule,
          }}>
            {live.map(function (f) {
              return <Fact key={f.k} label={f.label} note={f.note} tone={f.tone}>{f.value}</Fact>;
            })}
          </div>
        ) : null}
        {note ? <p style={ty("caption", { color: c.inkMuted, margin: "14px 0 0", maxWidth: "70ch" })}>{note}</p> : null}
        {callout ? <div style={{ marginTop: 14 }}>{callout}</div> : null}
      </section>
    );
  }

  /* WHO IT IS FOR, AS A LIST (designer). The same four facts sat in
     an auto-fitting grid of uppercase micro-caps, which reads as a
     row of tiny headings with something small under each -- six
     columns of label and value, none of them scannable. A hairline
     list with one label column scans down, which is how a reader
     looks for ONE of these facts. Same idiom as the leave request
     panel, so a fact is a fact wherever HR is standing. */
  function FactRows({ head, items }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const live = items.filter(Boolean);
    return (
      <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface, padding: "16px 20px 18px" }}>
        <h2 style={ty("h3", { margin: "0 0 2px", color: c.ink })}>{head}</h2>
        {live.map(function (f, i) {
          return (
            <div key={f.k} style={{
              display: "flex", gap: 18, alignItems: "baseline", flexWrap: "wrap",
              padding: "12px 0", borderTop: "1px solid " + (i ? c.rule : c.border),
            }}>
              <span style={ty("caption", { color: c.inkMuted, width: 124, flexShrink: 0 })}>{f.label}</span>
              <span style={ty("small", {
                color: f.tone || c.ink, fontWeight: 600, flex: "1 1 180px", minWidth: 0, overflowWrap: "anywhere",
              })}>{f.value}</span>
            </div>
          );
        })}
      </section>
    );
  }

  /* an attached document, drawn as one. A sentence saying a bill is
     missing is a sentence; a tile with nothing in it is the fact. */
  function BillTile({ req }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const has = req.hasBill;
    return (
      <div style={{
        display: "flex", gap: 14, alignItems: "center",
        border: "1px solid " + (has ? c.rule : c.dangerText), borderRadius: G3.r.md,
        background: has ? c.alt : c.dangerTint, padding: "14px 16px",
      }}>
        <span aria-hidden="true" style={{
          width: 42, height: 52, borderRadius: G3.r.xs, flexShrink: 0,
          border: "1.5px " + (has ? "solid " + c.borderStrong : "dashed " + c.dangerText),
          background: has ? c.surface : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: has ? c.inkMuted : c.dangerText,
        }}>
          <Icon name={has ? "document" : "alert"} size={20} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={ty("small", { color: has ? c.ink : c.dangerText, fontWeight: 700 })}>
            {has ? (req.billNo || t("hrp.d.bill")) : t("hrp.d.noBill")}
          </div>
          <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>
            {has ? fmtDate(t, req.billIso) : t("hrp.d.noBillNote")}
          </div>
        </div>
      </div>
    );
  }

  /* THE EVENINGS ARE THE CLAIM. Six amber meters told you which
     evening was the long one and nothing else -- not when they came
     in, not when they left, not what they were rostered for. This is
     the same table payroll reads on the other side of the handover,
     so HR verifies against exactly what payroll will price. */
  function Evenings({ req }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const days = req.days || [];
    const overAll = days.reduce(function (a, d) { return a + d.over; }, 0);
    const rosterAll = days.reduce(function (a, d) { return a + d.roster; }, 0);
    const paid = Q.otHours(req);
    return (
      <Register
        title={t("hrp.d.evidence")} sub={t("hrp.d.evSub")}
        columns={[
          { key: "day", label: t("hrp.d.ev.date") },
          { key: "span", label: t("hrp.d.ev.span"), width: 150 },
          { key: "roster", label: t("hrp.d.ev.roster"), align: "end", mono: true, width: 110 },
          { key: "over", label: t("hrp.d.ev.over"), align: "end", mono: true, width: 100, weight: 700 },
        ]}
        rows={days.map(function (d) {
          return {
            id: d.iso,
            cells: {
              day: fmtDate(t, d.iso),
              span: <span style={G3.fig("sm", { color: c.inkMuted })}>{d.inT + " \u2013 " + d.outT}</span>,
              roster: t("hrp.hours", { n: hrsNum(d.roster) }),
              over: t("hrp.hours", { n: hrsNum(d.over) }),
            },
          };
        })}
        totals={{
          label: t("hrp.d.ev.daysTot", { n: num(days.length) }),
          cells: {
            day: t("hrp.d.ev.daysTot", { n: num(days.length) }),
            roster: t("hrp.hours", { n: hrsNum(rosterAll) }),
            over: t("hrp.hours", { n: hrsNum(overAll) }),
          },
        }}
        footer={
          <span style={ty("caption", { color: c.inkMuted, maxWidth: "80ch" })}>
            {t(paid !== overAll ? "hrp.d.ev.footCut" : "hrp.d.ev.foot")}
          </span>
        }
      />
    );
  }

  /* ============================================================
     THE RECORD. Two columns: what the request IS on the left, where
     it has GOT TO and what you can do about it on the right. The
     left column is evidence and the right is state, which is the
     division an operator already holds in their head.
     ============================================================ */
  function RequestRecord({ req, said }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const r = req;
    const mine = r.state === "withHR";
    /* the bill tile and the exposure bar already say these two in
       full. Repeating them in the margin is the same sentence twice. */
    const dupFlag = r.flagKey === "pq.cl.flag.noBill" || r.flagKey === "pq.ln.flag.running";

    /* ---- what it leads with, one per kind ---- */
    let lead = null;
    if (r.kind === "claim") {
      lead = <ClaimLead req={r} />;
    } else if (r.kind === "loan") {
      /* what a month of this would take out of a month's pay, at the
         months THEY asked for. A judgement aid, not a sanction --
         payroll sets the real instalment, and the note says so. */
      const bite = r.tenureAsked ? r.amountAsked / r.tenureAsked : 0;
      const adv = r.loanKind === "advance";
      lead = (
        <Lead
          label={t(adv ? "hrp.d.advAsked" : "hrp.col.asked")} value={inr(r.amountAsked)}
          line={!r.tenureAsked
            ? t("hrp.d.lead.loanBare")
            : adv
              ? t(r.tenureAsked === 1 ? "hrp.d.lead.advOne" : "hrp.d.lead.adv", { n: num(r.tenureAsked), bite: inr(bite) })
              : t("hrp.d.lead.loan", { n: num(r.tenureAsked), bite: inr(bite) })}
          facts={[
            {
              k: "run", label: t("hrp.d.running"),
              value: r.runningId ? inr(r.runningOut || 0) : t("hrp.d.f.runNone"),
              note: r.runningId ? t("hrp.d.f.runNote", { id: r.runningId }) : t("hrp.d.f.runNoneNote"),
            },
            r.monthlyGross
              ? {
                k: "gr", label: t("hrp.d.gross"), value: inr(r.monthlyGross),
                note: bite ? t("hrp.d.f.grossNote", { pct: num(Math.round((bite / r.monthlyGross) * 100)) }) : null,
              }
              : null,
            /* WHEN IT LEAVES, AND WHEN IT COMES BACK. An advance is
               money out before a payday and in from the ones after
               it; a loan is a schedule from the month it starts. */
            {
              k: "when", label: t(adv ? "hrp.d.f.paidOut" : "hrp.d.f.firstEmi"),
              value: t(adv ? "hrp.d.f.paidOutV" : "hrp.d.f.firstEmiV"),
              note: t(adv ? "hrp.d.f.paidOutNote" : "hrp.d.f.firstEmiNote"),
            },
          ]}
        />
      );
    } else if (r.kind === "ot") {
      const hrsV = Q.otHours(r);
      const otDays = r.days || [];
      const cut = r.verified != null && r.verified !== r.detected;
      lead = (
        <Lead
          label={r.verified != null ? t("hrp.d.verified") : t("hrp.d.detected")}
          value={hrsNum(hrsV)} unit={t("hrp.hoursUnit")}
          line={cut
            ? t("hrp.d.lead.otCut", { v: hrsNum(r.verified), d: hrsNum(r.detected) })
            : t(r.verified == null ? "hrp.d.lead.otRaw" : "hrp.d.lead.otFull")}
          facts={[
            otDays.length
              ? {
                k: "ev", label: t("hrp.d.f.evenings"), value: num(otDays.length),
                note: otDays.length > 1
                  ? t("hrp.d.f.eveningsSpan", { from: dayMon(t, otDays[0].iso), to: dayMon(t, otDays[otDays.length - 1].iso) })
                  : dayMon(t, otDays[0].iso),
              }
              : null,
            {
              k: "ros", label: t("hrp.d.f.roster"),
              value: t("hrp.hours", { n: hrsNum(r.rosterHrs) }),
              note: t("hrp.d.f.rosterNote", { period: t(r.periodKey) }),
            },
          ]}
          note={t("hrp.d.otRule")}
        />
      );
    } else {
      const inc = Math.max(0, r.targetGross - r.currentGross);
      lead = (
        <Lead
          label={t("hrp.d.pct")} value={"+" + r.pct} unit="%"
          line={t("hrp.d.lead.rise", { now: inr(r.currentGross), inc: inr(inc) })}
          facts={[
            { k: "new", label: t("hrp.d.f.newGross"), value: inr(r.targetGross), note: t("hrp.d.f.newGrossNote", { v: inr(inc) }) },
            { k: "yr", label: t("hrp.d.f.year"), value: inr(inc * 12), note: t("hrp.d.f.yearNote", { v: inr(inc) }) },
          ]}
        />
      );
    }

    /* ---- the facts, as context rather than as the subject ---- */
    const facts = [
      { k: "staff", label: t("hrp.d.staff"), value: r.staff },
      { k: "group", label: t("hrp.d.group"), value: t(r.groupKey) },
      { k: "campus", label: t("hrp.d.campus"), value: t(r.campusKey) },
      /* the date it was raised, beside who raised it: two facts that
         were one line apart and one of them was missing */
      {
        k: "raised", label: r.kind === "rise" ? t("hrp.d.recordedOn") : t("hrp.d.raisedOn"),
        value: fmtDate(t, r.raisedIso) + " · " + (r.kind === "rise" || r.raisedBy === "hr"
          ? t("hrp.byWho", { who: t("hrp.who") })
          : t("hrp.byThem")),
      },
      r.kind === "loan" ? { k: "kind", label: t("hrp.d.loanKind"), value: t(r.loanKind === "loan" ? "hrp.d.loan" : "hrp.d.advance") } : null,
      r.kind === "loan" ? {
        k: "purpose", label: t("hrp.d.purpose"),
        value: r.purposeKey ? t(r.purposeKey) : t("hrp.d.purposeNone"),
        tone: r.purposeKey ? null : c.dangerText,
      } : null,
      r.kind === "loan" && r.serviceYears ? { k: "svc", label: t("hrp.d.service"), value: t("hrp.d.years", { n: num(r.serviceYears) }) } : null,
      r.kind === "loan" && r.becomes ? { k: "bec", label: t("hrp.d.sanctioned"), value: t("hrp.d.becomes", { id: r.becomes }) } : null,
      r.kind === "ot" ? { k: "per", label: t("hrp.d.period"), value: t(r.periodKey) } : null,
      r.kind === "ot" ? { k: "src", label: t("hrp.d.source"), value: t("hrp.d.src." + r.source) } : null,
      r.kind === "rise" ? { k: "appr", label: t("hrp.d.appr"), value: r.apprId } : null,
    ].filter(Boolean);

    return (
      <div>
        {said ? (
          <div style={{
            display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
            border: "1px solid " + c.presentText, borderRadius: G3.r.md, background: c.presentTint,
            padding: "12px 16px", marginBottom: G3.layout.gap,
          }}>
            <span aria-hidden="true" style={{ display: "flex", color: c.presentText }}><Icon name="check" size={17} /></span>
            <span style={ty("small", { color: c.presentText, fontWeight: 600 })}>{said}</span>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: G3.layout.gap, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* ---------- left: what it is ---------- */}
          <div style={{ flex: "3 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
            {lead}

            {r.kind === "ot" && r.days && r.days.length ? <Evenings req={r} /> : null}

            <FactRows head={t("hrp.d.facts")} items={facts} />
          </div>

          {/* ---------- right: where it has got to ---------- */}
          <div style={{ flex: "1 1 320px", minWidth: 300, display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
            {r.flagKey && !dupFlag ? (
              <div style={{
                display: "flex", gap: 11, alignItems: "flex-start",
                border: "1px solid " + c.rule, borderRadius: G3.r.md,
                background: r.state === "withHR" ? c.lateTint : c.alt, padding: "14px 16px",
              }}>
                <span aria-hidden="true" style={{ display: "flex", marginTop: 1, color: r.state === "withHR" ? c.lateText : c.inkMuted }}>
                  <Icon name="alert" size={17} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={ty("caption", { color: r.state === "withHR" ? c.lateText : c.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
                    {t("hrp.d.flag")}
                  </div>
                  <p style={ty("caption", { color: c.ink, margin: "3px 0 0" })}>{t(r.flagKey)}</p>
                </div>
              </div>
            ) : null}

            <StatusRail req={r} />

            {/* THE ACTS LIVE IN THE FOOT OF THE SCREEN (designer,
                everywhere): a card headed "What you can do", with a
                sentence under it explaining what each button does,
                was a third of the right-hand column spent on three
                buttons. They are in the screen's foot now, right
                aligned, with Decline in danger outline. */}
            {mine ? null : (
              <div style={{
                display: "flex", gap: 11, alignItems: "flex-start",
                border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.alt, padding: "16px 18px",
              }}>
                <span aria-hidden="true" style={{ display: "flex", marginTop: 1, color: c.inkFaint }}><Icon name="lock" size={17} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={ty("small", { color: c.ink, fontWeight: 600 })}>{t("hrp.act.off")}</div>
                  <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0" })}>{t("hrp.d.closedWhy")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---- HR's three acts, each a side screen that states what it does ---- */
  function VerifyPanel({ req, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const isOT = req.kind === "ot";
    const isLoan = req.kind === "loan";
    const [hrs, setHrs] = useState(isOT ? String(req.detected) : "");
    const [why, setWhy] = useState("");
    const [months, setMonths] = useState(isLoan ? String(req.tenureAsked) : "");
    const [note, setNote] = useState("");
    const cut = isOT && Number(hrs) < req.detected;
    const okHours = !isOT || (Number(hrs) > 0 && Number(hrs) <= req.detected);
    const ready = okHours && (!cut || !!why);

    return (
      <Modal
        title={t("hrp.v.title")} sub={t(req.personKey) + " · " + req.id}
        onClose={onClose} width={560}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", width: "100%" }}>
            <Button kind="secondary" onClick={onClose}>{t("hrp.cancel")}</Button>
            <Button kind="primary" disabled={!ready} onClick={function () {
              onDone({
                verified: isOT ? Number(hrs) : undefined,
                cutFrom: cut ? req.detected : undefined,
                reasonKey: cut ? "pq.ot.cut.notAsked" : undefined,
                note: cut ? why : note,
                recommendTenure: isLoan ? Number(months) || req.tenureAsked : undefined,
              });
            }}>{t("hrp.v.go")}</Button>
          </div>
        }
      >
        <p style={ty("small", { color: c.ink, margin: "0 0 16px", maxWidth: "62ch" })}>
          {t(isOT ? "hrp.v.bodyOT" : "hrp.v.body", { who: t("hrp.d.pyWho") })}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isOT ? (
            <Field id="hrp-v-hrs" label={t("hrp.v.hours")} hint={t("hrp.v.hoursHint", { n: hrsNum(req.detected) })}>
              <Input id="hrp-v-hrs" value={hrs} onChange={setHrs} inputMode="decimal" />
            </Field>
          ) : null}
          {cut ? (
            <Field id="hrp-v-why" label={t("hrp.v.cutReason")}>
              <Input id="hrp-v-why" value={why} onChange={setWhy} />
            </Field>
          ) : null}
          {isLoan ? (
            <Field id="hrp-v-mon" label={t("hrp.v.recommend")} hint={t("hrp.v.recommendHint", { n: num(req.tenureAsked) })}>
              <Input id="hrp-v-mon" value={months} onChange={setMonths} inputMode="numeric" />
            </Field>
          ) : null}
          {!cut ? (
            <Field id="hrp-v-note" label={t("hrp.v.note")} hint={t("hrp.v.noteHint")}>
              <Input id="hrp-v-note" value={note} onChange={setNote} />
            </Field>
          ) : null}
        </div>
      </Modal>
    );
  }

  function ReasonPanel({ req, mode, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const back = mode === "back";
    const list = back ? RETURN_REASONS : DECLINE_REASONS;
    const [reason, setReason] = useState(list[0]);
    const [note, setNote] = useState("");
    const needNote = reason.indexOf(".other") >= 0;
    return (
      <Modal
        title={t(back ? "hrp.b.title" : "hrp.x.title")} sub={t(req.personKey) + " · " + req.id}
        onClose={onClose} width={540} danger={!back}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", width: "100%" }}>
            <Button kind="secondary" onClick={onClose}>{t("hrp.cancel")}</Button>
            <Button kind={back ? "primary" : "danger"} disabled={needNote && !note.trim()}
              onClick={function () { onDone({ reasonKey: reason, note: note }); }}>
              {t(back ? "hrp.b.go" : "hrp.x.go")}
            </Button>
          </div>
        }
      >
        <p style={ty("small", { color: c.ink, margin: "0 0 16px", maxWidth: "62ch" })}>{t(back ? "hrp.b.body" : "hrp.x.body")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field id="hrp-r-reason" label={t(back ? "hrp.b.reason" : "hrp.x.reason")}>
            <Select id="hrp-r-reason" value={reason} onChange={setReason} ariaLabel={t(back ? "hrp.b.reason" : "hrp.x.reason")}
              options={list.map(function (k) { return { value: k, label: t(k) }; })} />
          </Field>
          <Field id="hrp-r-note" label={t(back ? "hrp.b.note" : "hrp.x.note")}>
            <Input id="hrp-r-note" value={note} onChange={setNote} />
          </Field>
        </div>
      </Modal>
    );
  }

  function AddPanel({ kind, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [who, setWho] = useState(STAFF[0].staff);
    const [cat, setCat] = useState("med");
    const [amount, setAmount] = useState("");
    const [billNo, setBillNo] = useState("");
    const [loanKind, setLoanKind] = useState("advance");
    const [purpose, setPurpose] = useState(PURPOSES[4]);
    const [tenure, setTenure] = useState("4");
    const [dayIso, setDayIso] = useState("2026-09-30");
    const [inT, setInT] = useState("08:00");
    const [outT, setOutT] = useState("19:00");
    const [over, setOver] = useState("3");

    const person = STAFF.filter(function (s) { return s.staff === who; })[0];
    const ready = kind === "claim" ? Number(amount) > 0
      : kind === "loan" ? Number(amount) > 0 && Number(tenure) > 0
        : Number(over) > 0;

    return (
      <SideScreen
        title={t("hrp.a.title." + kind)} onClose={onClose} width={540}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", width: "100%" }}>
            <Button kind="secondary" onClick={onClose}>{t("hrp.cancel")}</Button>
            <Button kind="primary" disabled={!ready} onClick={function () {
              const p = {
                kind: kind, personKey: person.personKey, staff: person.staff,
                groupKey: person.groupKey, campusKey: person.campusKey,
              };
              if (kind === "claim") {
                p.cat = cat; p.amount = Number(amount);
                p.billNo = billNo || null; p.hasBill = !!billNo; p.billIso = "2026-09-30";
              } else if (kind === "loan") {
                p.loanKind = loanKind; p.purposeKey = purpose;
                p.amountAsked = Number(amount); p.tenureAsked = Number(tenure);
              } else {
                p.detected = Number(over);
                p.eligible = person.groupKey !== "pyo.pg.teach";
                p.days = [{ iso: dayIso, inT: inT, outT: outT, roster: 8, over: Number(over) }];
              }
              onDone(p);
            }}>{t("hrp.a.go")}</Button>
          </div>
        }
      >
        <p style={ty("small", { color: c.ink, margin: "0 0 16px", maxWidth: "62ch" })}>{t("hrp.a.body." + kind)}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field id="hrp-a-who" label={t("hrp.a.person")}>
            <Select id="hrp-a-who" value={who} onChange={setWho} ariaLabel={t("hrp.a.person")}
              options={STAFF.map(function (s) { return { value: s.staff, label: t(s.personKey) + " · " + s.staff }; })} />
          </Field>

          {kind === "claim" ? (
            <React.Fragment>
              <Field id="hrp-a-cat" label={t("hrp.a.cat")}>
                <Select id="hrp-a-cat" value={cat} onChange={setCat} ariaLabel={t("hrp.a.cat")}
                  options={CLAIM_CATS.map(function (k) { return { value: k, label: t("pyo.cat." + k) }; })} />
              </Field>
              <Field id="hrp-a-amt" label={t("hrp.a.amount")}>
                <Input id="hrp-a-amt" value={amount} onChange={setAmount} inputMode="numeric" />
              </Field>
              <Field id="hrp-a-bill" label={t("hrp.a.billNo")} hint={t("hrp.d.amountWhy")}>
                <Input id="hrp-a-bill" value={billNo} onChange={setBillNo} />
              </Field>
            </React.Fragment>
          ) : null}

          {kind === "loan" ? (
            <React.Fragment>
              <Field id="hrp-a-kind" label={t("hrp.a.loanKind")}>
                <Select id="hrp-a-kind" value={loanKind} onChange={setLoanKind} ariaLabel={t("hrp.a.loanKind")}
                  options={[{ value: "loan", label: t("hrp.d.loan") }, { value: "advance", label: t("hrp.d.advance") }]} />
              </Field>
              <Field id="hrp-a-pur" label={t("hrp.a.purpose")}>
                <Select id="hrp-a-pur" value={purpose} onChange={setPurpose} ariaLabel={t("hrp.a.purpose")}
                  options={PURPOSES.map(function (k) { return { value: k, label: t(k) }; })} />
              </Field>
              <Field id="hrp-a-amt" label={t("hrp.a.amount")}>
                <Input id="hrp-a-amt" value={amount} onChange={setAmount} inputMode="numeric" />
              </Field>
              <Field id="hrp-a-ten" label={t("hrp.a.tenure")} hint={t("hrp.a.tenureHint")}>
                <Input id="hrp-a-ten" value={tenure} onChange={setTenure} inputMode="numeric" />
              </Field>
            </React.Fragment>
          ) : null}

          {kind === "ot" ? (
            <React.Fragment>
              <Field id="hrp-a-day" label={t("hrp.a.date")}>
                <Input id="hrp-a-day" value={dayIso} onChange={setDayIso} />
              </Field>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Field id="hrp-a-in" label={t("hrp.a.in")}><Input id="hrp-a-in" value={inT} onChange={setInT} /></Field>
                </div>
                <div style={{ flex: 1 }}>
                  <Field id="hrp-a-out" label={t("hrp.a.out")}><Input id="hrp-a-out" value={outT} onChange={setOutT} /></Field>
                </div>
              </div>
              <Field id="hrp-a-over" label={t("hrp.a.hours")} hint={t("hrp.a.hoursHint")}>
                <Input id="hrp-a-over" value={over} onChange={setOver} inputMode="decimal" />
              </Field>
            </React.Fragment>
          ) : null}
        </div>
      </SideScreen>
    );
  }

  /* ============================================================
     THE MODULE. One band over four tabs, and a record that opens
     over whichever list you were on.
     ============================================================ */
  /* WHAT PAYROLL HAS ASKED ABOUT A SALARY. Since 2026-10-15 HR sets
     salaries and payroll reads them, so the officer's only move on a
     wrong one is a written question against that person. It lands on
     the record; this is the list of them, where HR's pay work is. */
  function SalaryQuestions({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const H = window.NaveyaPayHandoff;
    const handoff = H && H.useHandoff ? H.useHandoff() : null;
    const open = handoff ? handoff.openChanges() : [];
    if (!open.length) return null;

    return (
      <div style={{ marginBottom: G3.layout.gap }}>
        <Card
          title={t("hrp.sq.title")}
          sub={open.length === 1 ? t("hrp.sq.sub1") : t("hrp.sq.sub", { n: num(open.length) })}
        >
          {open.map(function (x, i) {
            return (
              <div key={x.id} style={{
                display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
                padding: "11px 0", borderTop: i ? "1px solid " + c.rule : "none",
              }}>
                <span style={{ flex: "1 1 240px", minWidth: 0 }}>
                  <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(x.topicKey)}</span>
                  <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>
                    {x.staffId} · {t("hrp.sq.by", { who: t(x.byKey) })}
                  </span>
                  {x.note ? (
                    <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 3 })}>{x.note}</span>
                  ) : null}
                </span>
                <Button size="sm" iconRight="arrow" onClick={function () { onNavigate && onNavigate("hrRecord"); }}>
                  {t("hrp.sq.open")}
                </Button>
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  function HRPay({ role, onNavigate }) {
    const { c } = useTheme();
    const { t } = useLang();
    Q && Q.usePayRequests();
    const [tab, setTab] = useState("claim");
    const [openId, setOpenId] = useState(null);
    const [panel, setPanel] = useState(null);     /* verify | back | decline | add */
    const [said, setSaid] = useState(null);
    const [show, setShow] = useState("open");
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const [pick, setPick] = useState(null);

    if (!Q) {
      return (
        <Shell role={role} onNavigate={onNavigate} title={t("hrp.title")} campus={campus} onCampus={setCampus}>
          <Card><EmptyState head={t("hrp.none")} /></Card>
        </Shell>
      );
    }

    const all = Q.all();
    /* THE FIGURES COUNT WHAT THE TABLE COUNTS (designer).

       They used to range over every kind of request and every campus,
       above a register showing ONE kind on ONE campus — so "6 waiting
       on you" sat over two rows, and nothing on the screen explained
       the other four. The band now reads the same slice the register
       does: this tab, this campus. The rail chip is the only
       whole-desk number left, which is where a whole-desk number
       belongs. */
    const scope = all.filter(function (r) {
      return r.kind === tab && inCampus(campus, campusOfCode(r.staff));
    });
    const mine = scope.filter(Q.isWithHR);
    const withPay = scope.filter(function (r) { return r.state === "withPayroll"; });
    /* sent back and not corrected: HR's to chase, which is why it
       earns a figure where "with payroll" earns only a sentence */
    const sentBack = scope.filter(function (r) { return r.state === "returned"; });
    const settled = scope.filter(function (r) { return r.state === "paid" || r.state === "approved" || r.state === "declined"; });
    const deskAll = all.filter(Q.isWithHR);
    const byWait = function (list) {
      return list.slice().sort(function (a, b) { return Q.waitingDays(b) - Q.waitingDays(a); })[0];
    };
    /* the oldest thing ON THIS DESK. The old one ranged over payroll's
       pile too, so the band's loudest figure was about a request this
       operator is not allowed to move. */
    const oldest = byWait(mine);
    const backOldest = byWait(sentBack);
    /* a claim with no bill cannot be verified at all -- it is the one
       state that changes which button you press */
    const blocked = mine.filter(function (r) { return r.kind === "claim" && !r.hasBill; });

    const states = ["withHR", "withPayroll", "approved", "paid", "returned", "declined"];
    const segments = states.filter(function (s) {
      return all.filter(function (r) { return r.state === s; }).length;
    }).map(function (s) {
      return {
        key: s, label: t("hrp.seg." + s),
        value: all.filter(function (r) { return r.state === s; }).length,
        color: c[STATE_TONE[s]] || c.chartSand,
      };
    });

    /* EVERY LINE IS A FACT (designer). "Nothing moves until you
       verify one" and "Verified by you. Only payroll can move them
       now" explained the label above them to a reader who had just
       read it. A figure's line now carries the money or the hours
       behind the count, the day it last moved, or the name it is
       about -- the thing the figure itself cannot say. */
    const lastSent = withPay.slice().sort(function (a, b) {
      return (a.hr && a.hr.on ? a.hr.on : "") < (b.hr && b.hr.on ? b.hr.on : "") ? 1 : -1;
    })[0];
    const paidOnes = settled.filter(function (r) { return r.state === "paid"; });
    const metrics = [
      { k: "y", label: t("hrp.m.yours"), value: num(mine.length), n: mine.length,
        note: mine.length ? stakeWord(t, tab, mine) : t("hrp.m.yoursNone"),
        tone: mine.length ? c.chartAmber : c.chartGreen, warn: mine.length > 0 },
      { k: "p", label: t("hrp.m.payroll"), value: num(withPay.length), n: withPay.length,
        note: lastSent && lastSent.hr && lastSent.hr.on
          ? t("hrp.m.payrollNote", { date: fmtDate(t, lastSent.hr.on) })
          : t("hrp.m.payrollNone"),
        tone: c.chartBlue },
      { k: "b", label: t("hrp.m.back"), value: num(sentBack.length), n: sentBack.length,
        note: sentBack.length
          ? t("hrp.m.backNote", { who: t(backOldest.personKey), n: num(Q.waitingDays(backOldest)) })
          : t("hrp.m.backNone"),
        tone: c.chartRed },
      /* settled is the fourth state of the same population, so it
         takes its segment of the bar with the other three */
      { k: "s", label: t("hrp.m.settled"), value: num(settled.length), n: settled.length,
        note: !settled.length ? t("hrp.m.settledNone")
          : paidOnes.length ? t("hrp.m.settledNote", { n: num(paidOnes.length) }) : t("hrp.m.settledNonePaid"),
        tone: c.chartGreen },
      /* days are not a share of the counts above, so this one carries
         no `n` and takes no segment of the bar */
      { k: "o", label: t("hrp.m.oldest"), bar: false,
        value: oldest ? (Q.waitingDays(oldest) ? num(Q.waitingDays(oldest)) : t("hrp.m.today")) : t("hrp.m.none"),
        unit: oldest && Q.waitingDays(oldest) ? t("hrp.m.daysUnit") : null,
        note: oldest ? t("hrp.m.oldestNote2", { who: t(oldest.personKey) }) : t("hrp.m.oldestNone"),
        tone: c.chartSand },
    ];

    const sel = openId ? Q.byId(openId) : null;

    function openRow(id, act) {
      setOpenId(id);
      setSaid(null);
      setPanel(act || null);
    }

    let rows = Q.byKind(tab).filter(function (r) {
      if (show === "yours" && r.state !== "withHR") return false;
      if (show === "open" && !Q.isOpen(r)) return false;
      if (!inCampus(campus, campusOfCode(r.staff))) return false;
      if (pick && r.state !== pick) return false;
      return true;
    });

    return (
      <Shell
        role={role} onNavigate={onNavigate} title={t("hrp.title")}
        campus={campus} onCampus={setCampus}
        chips={[
          <StatusMark key="m" role={deskAll.length ? "late" : "present"} glyph={deskAll.length ? "clock" : "check"}
            word={t("hrp.m.yours")} count={deskAll.length} />,
        ]}
        tabs={
          <div style={{ marginBottom: G3.layout.gap }}>
            <Tabs
              items={TABS.map(function (k) { return { key: k, label: t("hrp.tab." + k) }; })}
              active={tab} idBase="hrpay" ariaLabel={t("hrp.tabs.aria")}
              onChange={function (k) { setTab(k); setPick(null); }}
            />
          </div>
        }
      >
        <Band
          head={t("hrp.band.head")}
          metrics={metrics}
          foot={blocked.length ? t("hrp.band.blocked", { n: num(blocked.length) }) : null}
        />

        <SalaryQuestions onNavigate={onNavigate} />

        <div style={{
          display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center",
          marginBottom: G3.layout.gap, padding: "10px 16px",
          border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
        }}>
          <FilterPair id="hrp-show" label={t("hrp.f.show")} width={190}>
            <Select id="hrp-show" value={show} onChange={setShow} ariaLabel={t("hrp.f.show")} size="sm"
              options={[
                { value: "yours", label: t("hrp.f.yours") },
                { value: "open", label: t("hrp.f.open") },
                { value: "all", label: t("hrp.f.all") },
              ]} />
          </FilterPair>
          {(show !== "open" || pick) ? (
            <LinkButton onClick={function () { setShow("open"); setCampus(""); setPick(null); }}>{t("hrp.f.clear")}</LinkButton>
          ) : null}
        </div>

        <TabPanel idBase="hrpay" tabKey={tab}>
          <RequestList
            kind={tab} rows={rows} show={show} onOpen={openRow} onNavigate={onNavigate}
            onAdd={function () { setPanel("add"); }}
          />
        </TabPanel>

        {panel === "add" ? (
          <AddPanel kind={tab} onClose={function () { setPanel(null); }}
            onDone={function (p) {
              const made = Q.add(p);
              setPanel(null);
              setOpenId(made.id);
              setSaid(t("hrp.a.done"));
            }} />
        ) : null}

        {/* ---- one request, beside the queue it came from ---- */}
        {sel ? (
          <SideScreen
            title={t(sel.personKey)}
            sub={sel.id + " \u00b7 " + t("hrp.tab." + sel.kind) + " \u00b7 " + t(sel.campusKey)}
            avatar={t(sel.personKey)} width={700}
            onClose={function () { setOpenId(null); setPanel(null); setSaid(null); }}
            footer={
              Q.isWithHR(sel) ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", width: "100%" }}>
                  <Button kind="dangerOutline" size="sm" onClick={function () { setPanel("decline"); }}>{t("hrp.x.go")}</Button>
                  {/* a claim with no bill cannot be verified at all, so
                      sending it back is the filled act and the verify
                      is the dead one beside it */}
                  {sel.kind === "claim" && !sel.hasBill ? (
                    <React.Fragment>
                      <Button kind="secondary" size="sm" disabled iconLeft="check">{t("hrp.v.go")}</Button>
                      <Button kind="primary" size="sm" iconLeft="arrow" onClick={function () { setPanel("back"); }}>{t("hrp.b.go")}</Button>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Button kind="secondary" size="sm" iconLeft="arrow" onClick={function () { setPanel("back"); }}>{t("hrp.b.go")}</Button>
                      <Button kind="primary" size="sm" iconLeft="check" onClick={function () { setPanel("verify"); }}>{t("hrp.v.go")}</Button>
                    </React.Fragment>
                  )}
                </div>
              ) : null
            }
          >
            <RequestRecord req={sel} said={said} />
          </SideScreen>
        ) : null}

        {/* ---- and the one question it asks, over that ---- */}
        {sel && panel === "verify" ? (
          <VerifyPanel req={sel} onClose={function () { setPanel(null); }}
            onDone={function (p) {
              Q.verify(sel.id, p);
              setPanel(null);
              setSaid(t("hrp.v.done", { who: t("hrp.d.pyWho") }));
            }} />
        ) : null}
        {sel && (panel === "back" || panel === "decline") ? (
          <ReasonPanel req={sel} mode={panel} onClose={function () { setPanel(null); }}
            onDone={function (p) {
              if (panel === "back") { Q.sendBack(sel.id, p); setSaid(t("hrp.b.done", { who: t(sel.personKey) })); }
              else { Q.decline(sel.id, p); setSaid(t("hrp.x.done")); }
              setPanel(null);
            }} />
        ) : null}
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.HRPay = HRPay;
  window.Pages3.HRPayStrings = true;
})();

