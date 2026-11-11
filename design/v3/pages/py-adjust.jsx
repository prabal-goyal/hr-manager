/* @jsxRuntime classic */
/* ============================================================
   Naveya — Adjustments · window.Pages3.PYAdjust

   The three amounts that attach to a run without being part of
   anybody's salary structure: money we recover (loans and advances),
   money we owe (claims), and money we owe for months already paid
   (arrears).

   WHAT WAS WRONG. Each tab was one long screen with every action
   stacked UNDER the table: open a loan's schedule and it unrolled
   below the register; foreclose it and the panel appeared below
   that; skip an instalment and a third card joined the pile. By the
   third action the row you were acting on had scrolled out of sight,
   and nothing on screen said which loan the panel belonged to.

   THE RULING (designer, 2026-10-07): "whatever action is being shown
   at the bottom of the table of loans and advancements i need that
   inside their own respective screens", and the module as a whole
   should be "simple in terms of UI and the overall usability UX and
   related actions, with the internal screens, modals and others to
   support this screen".

   SO: A REGISTER OPENS A RECORD. Every tab is a band, a register,
   and a record carrying its own actions. Nothing stacks underneath a
   table any more.

   AMENDED 2026-10-15, twice over.

   THE RECORD IS A PANEL, NOT A PAGE (designer: "when I click on the
   row I am taken to a screen -- eliminate a new screen and open a
   side modal on the same screen for the details"). A record here is
   one row read in full: a schedule, a bill, a set of hours. You open
   it, read it, decide, and go back to the row below it -- and
   replacing the page for that loses your place in the table, your
   filter and your scroll. The panel keeps all three, and the one
   question a record may ask opens as a dialog over it, because a
   drawer over a drawer is two of them fighting.

   AND FORECLOSURE IS GONE (designer: "I cannot foreclose the loan
   until it is fully paid -- remove that option"). What is left is
   the pair that matters, and they now DO something: deferring moves
   an instalment to the end and leaves the balance alone, waiving
   forgives it and takes it off the balance for good. Both are
   written to the loan, and `loanOutstanding` learned the difference
   so every screen that reads it -- this one, the run's loan tab,
   PY-18's loan report -- is right without being told.

   AND THE CLAIMS ARE THE EMPLOYEES'. They were drawn as rows of a
   payout batch, which is what payroll does with them, not what they
   are. They are reimbursement claims that staff submitted and their
   head of department approved; the batch is one thing that happens
   to them. So the register leads with the claimant and what they
   spent, and the batch is a state on the row.

   SPEC — docs/screen-inventory.md PY-13 (loans), PY-14 (payout
   batches), PY-15 (arrears); M10 Loans / Reimbursements / Arrears.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark,
    Icon, EmptyState, Field, Input, Select, Tabs, TabPanel, ActionMenu,
    SideScreen, Modal, BackBar, Avatar, StackBar, Meter, MetricCell, inr, num, Band,
    CampusSwitch, campusLabel, campusOptions, inCampus, campusOfCode, CAMPUS_ALL,
  } = UI;

  const A = (window.Pages3 && window.Pages3.PYAdjData) || null;

  addStrings({
    en: {
      "pya.crumb": "Payroll",
      "pya.entity": "Naveya Vidya Trust — Bengaluru",
      "pya.title": "Adjustments",
      "pya.maker": "Sunita Kulkarni",
      "pya.roleMaker": "Payroll Officer",
      "pya.run": "AUG-2026",
      "pya.awaiting": "With the checker",
      "pya.tab.loans": "Loans & advances",
      "pya.tab.claims": "Claims",
      "pya.tab.arrears": "Arrears",
      "pya.tab.ot": "Overtime",
      "pya.tab.rise": "Appraisal rises",
      "pya.q.col.pct": "Increase",
      "pya.q.fromAppr": "Appraisal {id}",
      "pya.q.col.settled": "You set it at",
      "pya.q.riseCheckerNote": "A rise is not an adjustment to a run — it changes standing pay from the date you set. Staff & salaries reads the same record.",
      "pya.q.rise.doneTitle": "Rises you have settled",
      "pya.q.rise.doneSub": "What the percentage became, and what it was refused for.",
      "pya.q.rise.noneHead": "Nothing settled yet",
      "pya.q.rise.noneBody": "A rise appears here once you have turned HR's percentage into components.",
      "pya.q.rs.title": "Turn the percentage into components",
      "pya.q.rs.body": "HR agreed {pct}% on a gross of {v} and entered no amount. The components are yours, and you may land elsewhere.",
      "pya.q.rs.gross": "New monthly gross",
      "pya.q.rs.grossHint": "The percentage comes to {v}. Change it if the grade or the band says otherwise.",
      "pya.q.rs.basicPct": "Basic, % of gross",
      "pya.q.rs.hraPct": "HRA, % of basic",
      "pya.q.rs.l.basic": "Basic",
      "pya.q.rs.l.hra": "House rent allowance",
      "pya.q.rs.l.other": "Other allowances",
      "pya.q.rs.l.gross": "Gross",
      "pya.q.rs.lands": "This lands at {pct}% against the {asked}% agreed.",
      "pya.q.rs.negative": "Basic and HRA come to more than the gross. Lower one of them, or raise the gross.",
      "pya.q.rs.from": "Effective from",
      "pya.q.rs.fromHint": "Arrears are raised automatically if the date is before the open run.",
      "pya.q.rs.nov": "1 November 2026",
      "pya.q.rs.dec": "1 December 2026",
      "pya.q.rs.go": "Set the breakdown",
      "pya.q.rs.done": "Set at {v}. HR sees it, and it goes to the checker with the run.",
      "pya.q.sub.rise": "HR recorded the percentage an appraisal agreed. Turning it into basic, HRA and the rest is this desk's work.",
      "pya.q.reg.rise": "Rises recorded by HR",

      "pya.q.head": "{n} waiting on you from HR",
      "pya.q.sub.claim": "An HR operator checked the bill and the policy. What is left is the tax treatment and which run pays it \u2014 both yours.",
      "pya.q.sub.loan": "An HR operator recorded the request and recommended a tenure. The principal, the rate and the instalment are yours.",
      "pya.q.sub.ot": "An HR operator verified the hours against the roster. Pricing them is yours, from the pinned configuration.",
      "pya.q.oldest": "{who} has been waiting {n} days.",
      "pya.q.reg.claim": "Claims verified by HR",
      "pya.q.reg.loan": "Loan requests verified by HR",
      "pya.q.reg.ot": "Overtime verified by HR",
      "pya.q.regSub": "A row opens the request, where every act on it carries a name and a date.",
      "pya.q.col.who": "Who asked",
      "pya.q.col.what": "What for",
      "pya.q.col.v": "What HR passed on",
      "pya.q.col.hr": "Verified",
      "pya.q.col.act": "Actions",
      "pya.q.col.hoursShort": "Hours",
      "pya.q.col.state": "State",
      "pya.q.hours": "{n} h",
      "pya.q.months": "{n} months",
      "pya.q.noPurpose": "Not stated",
      "pya.q.act.open": "Open the request",
      "pya.q.act.decide": "Set the figure and approve",
      "pya.q.act.decline": "Decline it",
      "pya.q.actions": "What you can do",
      "pya.q.checkerNote": "An approval here puts it in the run. The run itself still goes to the checker before anything is paid.",

      "pya.q.chain": "Where it has got to",
      "pya.q.waiting": "It has been on your desk for {n} days.",
      "pya.q.stop.raised": "Raised",
      "pya.q.stop.hr": "HR",
      "pya.q.stop.you": "You",
      "pya.q.stop.paid": "Paid",
      "pya.q.stop.waiting": "waiting",
      "pya.q.hrWho": "Meera Iyer, HR",
      "pya.q.mon.1": "January", "pya.q.mon.2": "February", "pya.q.mon.3": "March",
      "pya.q.mon.4": "April", "pya.q.mon.5": "May", "pya.q.mon.6": "June",
      "pya.q.mon.7": "July", "pya.q.mon.8": "August", "pya.q.mon.9": "September",
      "pya.q.mon.10": "October", "pya.q.mon.11": "November", "pya.q.mon.12": "December",

      "pya.q.kind.claim": "Reimbursement",
      "pya.q.kind.loan": "Loan request",
      "pya.q.kind.ot": "Overtime",
      "pya.q.kind.rise": "Appraisal rise",
      "pya.q.st.approved": "Approved",
      "pya.q.st.paid": "Paid",
      "pya.q.st.declined": "Declined",

      "pya.q.hero.claim": "Amount claimed",
      "pya.q.hero.loan": "Amount asked",
      "pya.q.hero.ot": "Hours HR verified",
      "pya.q.hero.rise": "Increase agreed",
      "pya.q.hrDid.claim": "HR checked the bill and the policy. The amount is the employee's statement; you decide the tax treatment and the run.",
      "pya.q.hrDid.loan": "HR recorded the request and what they recommend. No principal, rate or instalment has been set; that is this screen.",
      "pya.q.hrDid.ot": "HR verified these hours against the roster and may have reduced them. The hours are settled; the money is not.",
      "pya.q.hrDid.rise": "HR recorded the percentage an appraisal agreed. Turning it into components is this desk's work.",

      "pya.q.f.staff": "Staff number",
      "pya.q.f.group": "Pay group",
      "pya.q.f.campus": "Campus",
      "pya.q.f.cat": "Category",
      "pya.q.f.bill": "Bill number",
      "pya.q.f.purpose": "Purpose",
      "pya.q.f.asked": "Months asked for",
      "pya.q.f.rec": "HR recommends",
      "pya.q.f.gross": "Monthly gross",
      "pya.q.f.period": "Period",
      "pya.q.f.detected": "Hours detected",
      "pya.q.f.source": "Read from",
      "pya.q.src.device": "Biometric punches",
      "pya.q.src.manual": "Entered by hand by HR",

      "pya.q.price": "What the hours come to",
      "pya.q.p.line": "{n} hours at {rate} an hour, times {mult}",
      "pya.q.p.evenings": "Evenings worked",
      "pya.q.p.eveningsNote": "Each one read off the device roll",
      "pya.q.p.hoursCut": "HR cut it from {n} detected",
      "pya.q.p.month": "Rostered that month",
      "pya.q.p.monthNote": "What these evenings were on top of",
      "pya.q.p.daysTitle": "The evenings",
      "pya.q.p.daysSub": "When they came in, when they left, and what they were rostered for.",
      "pya.q.p.col.day": "Day",
      "pya.q.p.col.span": "In and out",
      "pya.q.p.col.roster": "Rostered",
      "pya.q.p.col.over": "Over",
      "pya.q.p.daysTot": "{n} evenings",
      "pya.q.p.daysFoot": "Over is time past the roster on that day. The month is the sum of them.",
      "pya.q.p.daysFootCut": "Over is time past the roster on that day. HR paid fewer hours than these add to — their figure governs.",
      "pya.q.p.value": "comes to",
      "pya.q.noRate": "No rate on file for this person",
      "pya.q.noRateWhy": "Overtime is priced on basic and dearness pay, and this row carries none. Assign a salary in Staff & salaries and it prices itself.",
      "pya.q.priceWhy": "Not less than twice the normal rate of wages (Code on Wages 2019, s.14). The hourly rate is basic and DA over 26 days and an 8-hour day.",

      "pya.q.exposure": "What they would be carrying",
      "pya.q.exposureSub": "Against a year of their own pay, which is the question a sanction turns on.",
      "pya.q.exRunning": "already running",
      "pya.q.exAsked": "asked for now",
      "pya.q.exFree": "the rest of the year",
      "pya.q.exYear": "a year's pay is {v}",

      "pya.q.riseCardSub": "What the appraisal settled; the components are yours",
      "pya.q.riseLine": "{now} a month now, and {inc} more every month from the date you set.",
      "pya.q.riseYear": "Over a full year",
      "pya.q.riseYearNote": "Before the employer share moves with it",
      "pya.q.riseNow": "on a gross of",
      "pya.q.riseTo": "a new gross of",

      "pya.q.d.title.claim": "Approve this claim",
      "pya.q.d.title.loan": "Sanction this loan",
      "pya.q.d.title.ot": "Price these hours",
      "pya.q.d.title.rise": "Approve this rise",
      "pya.q.d.body.claim": "The amount and the category belong to the employee and to HR. What you are setting is the run that pays it.",
      "pya.q.d.body.loan": "You are sanctioning a principal, a tenure and a rate. The instalment follows from them, and the loan joins the register below.",
      "pya.q.d.body.ot": "The hours are HR's and are not editable here. The rate and the multiple come from the configuration this run is pinned to.",
      "pya.q.d.body.rise": "Approving records that the percentage is accepted. The components are set against the person in Staff & salaries.",
      "pya.q.d.principal": "Principal",
      "pya.q.d.principalHint": "They asked for {v}. Sanctioning less is normal and the record keeps both figures.",
      "pya.q.d.tenure": "Months",
      "pya.q.d.tenureHint": "HR recommends {n}.",
      "pya.q.d.rate": "Interest rate, per cent a year",
      "pya.q.d.emi": "The instalment that follows",
      "pya.q.d.emiWhy": "Principal, plus interest where a rate is set, over the months. The loan register recovers it from the run.",
      "pya.q.d.otWhy": "{h} hours at {r} an hour, doubled.",
      "pya.q.d.batch": "Run that pays it",
      "pya.q.d.batchHint": "The open run, or the next one if this month is already with the checker.",
      "pya.q.d.go": "Approve it",
      "pya.q.d.done": "Approved into {run}. HR sees it move on their side.",
      "pya.q.cancel": "Cancel",
      "pya.q.x.title": "Decline this request",
      "pya.q.x.body": "It stops here. Your name and your reason stay on the record, and HR and the employee are told.",
      "pya.q.x.reason": "Why",
      "pya.q.x.note": "Anything else",
      "pya.q.x.done": "Declined. HR sees it on their side.",

      "pya.q.ot.doneTitle": "Overtime this desk has priced",
      "pya.q.ot.doneSub": "Approved into a run, or already paid.",
      "pya.q.ot.noneHead": "Nothing priced yet",
      "pya.q.ot.noneBody": "Overtime appears here once you have set a figure against the hours HR verified.",
      "pya.tabs.aria": "Adjustments to the run",

      /* ---- loans ---- */
      "pya.l.band": "What is being recovered",
      "pya.l.bandFoot": "An advance leaves before the salary it belongs to; a loan runs from the month it starts. Both come back the same way — one line on the run.",
      "pya.l.f.kind": "Which kind",
      "pya.l.f.kindAll": "Loans and advances",
      "pya.l.f.state": "Where it stands",
      "pya.l.f.stateOpen": "Still being recovered",
      "pya.l.f.stateAll": "Everything on record",
      "pya.l.seg.active": "Being recovered",
      "pya.l.seg.pending": "Awaiting approval",
      "pya.l.seg.atExit": "Moved to a settlement",
      "pya.l.seg.closed": "Closed",
      "pya.l.seg.foreclosed": "Foreclosed",
      "pya.l.m.loans": "loans running",
      "pya.l.m.loansNote": "spread over a year or more",
      "pya.l.m.adv": "advances running",
      "pya.l.m.advNote": "{v} of it still to come back",
      "pya.l.m.advNone": "nothing taken early",
      "pya.l.m.outstandingNote": "Principal and interest, less everything recovered",
      "pya.l.m.outstanding": "still to recover",
      "pya.l.m.run": "deducted this month",
      "pya.l.m.runNote": "One line on the run",
      "pya.l.m.pending": "awaiting approval",
      "pya.l.m.pendingNote": "Nothing deducts until released",
      "pya.l.m.pendingNone": "Every loan on the list is released",
      "pya.l.reg.title": "Loans and advances",
      "pya.l.reg.sub": "{n} open. A row opens that loan, where its schedule and every action on it live.",
      "pya.l.col.person": "Who",
      "pya.l.col.kind": "Kind",
      "pya.l.col.principal": "Principal",
      "pya.l.col.out": "Outstanding",
      "pya.l.col.emi": "This month",
      "pya.l.col.state": "State",
      "pya.l.kind.loan": "Loan",
      "pya.l.kind.advance": "Advance",
      "pya.l.st.active": "Recovering",
      "pya.l.st.pending": "Awaiting approval",
      "pya.l.st.atExit": "With the settlement",
      "pya.l.st.closed": "Closed",
      "pya.l.st.foreclosed": "Foreclosed",
      "pya.l.tot": "Open loans",
      "pya.l.new": "New loan or advance",

      "pya.l.d.m.out": "outstanding",
      "pya.l.d.m.emi": "this month",
      "pya.l.d.m.paid": "instalments paid",
      "pya.l.d.facts": "The loan",
      "pya.l.d.purpose": "What it is for",
      "pya.l.d.since": "Recovering since",
      "pya.l.d.tenure": "Over",
      "pya.l.d.months": "{n} months",
      "pya.l.d.rate": "Interest",
      "pya.l.d.rateNone": "None",
      "pya.l.d.ratePerq": "{n}% — the benefit is a perquisite and is taxed",
      "pya.l.d.net": "Their net this month",
      "pya.l.d.sched": "The schedule",
      "pya.l.d.schedSub": "Every instalment, and the one the open run will deduct.",
      "pya.l.d.col.n": "No.",
      "pya.l.d.col.when": "Month",
      "pya.l.d.col.amt": "Instalment",
      "pya.l.d.col.left": "Left after it",
      "pya.l.d.col.mark": "",
      "pya.l.d.paidMark": "Paid",
      "pya.l.d.thisMark": "This run",
      "pya.l.d.dueMark": "To come",
      "pya.l.d.actions": "What you can do with it",
      "pya.l.d.skip": "Defer or waive an instalment",
      "pya.l.d.skipWhy": "Defer this month to the end, or forgive it. They are not the same thing and the screen will make you choose.",
      "pya.l.d.pendingHead": "Nothing is deducted yet",
      "pya.l.d.pendingBody": "{who} raised this on {on}. It deducts nothing until a distinct approver releases it — and that approver is not you.",
      "pya.l.d.exitHead": "This balance left the payroll",
      "pya.l.d.exitBody": "They left on {on}. The outstanding balance moved to settlement {ff}, so no instalment is taken from a payslip.",
      "pya.l.d.closedHead": "Nothing left to recover",
      "pya.l.d.closedBody": "Closed on {on}.",
      "pya.l.d.waived": "{v} was waived when it was foreclosed.",
      "pya.l.d.skipped": "{n} deferred, last in {on}. The schedule runs that much longer and the money is still owed.",
      "pya.l.d.skipped1": "One instalment deferred in {on}. The schedule runs a month longer and the money is still owed.",
      "pya.l.d.waivedN": "{n} instalments waived, {v} in all, last in {on}. That money is not owed by anybody.",
      "pya.l.d.waivedN1": "One instalment waived in {on} — {v}. That money is not owed by anybody.",
      "pya.l.d.waivedMark": "Waived",
      "pya.l.d.m.paidNote": "Instalments recovered so far",
      "pya.l.d.m.emiNote": "Comes off the open run",
      "pya.l.d.lead": "{lent} lent since {since}",
      "pya.l.d.m.paidSkipped": "{n} deferred to the end",
      "pya.l.d.m.paidSkipped1": "One deferred to the end",
      "pya.l.d.m.paidWaived": "{n} forgiven and never recovered",
      "pya.l.d.m.paidWaived1": "One forgiven and never recovered",


      "pya.l.sk.title": "Defer or waive this month",
      "pya.l.sk.thisMonth": "Comes off this month",
      "pya.l.sk.thisMonthNote": "Either way, nothing is recovered",
      "pya.l.sk.nothing": "Nothing",
      "pya.l.sk.balance": "Balance after",
      "pya.l.sk.balanceDown": "Down by {v}, and never recovered",
      "pya.l.sk.balanceSame": "Unchanged — they still owe it",
      "pya.l.sk.ends": "Instalments still to recover",
      "pya.l.sk.endsLater": "Unchanged — it moves to the end",
      "pya.l.sk.endsFewer": "One fewer — it is forgiven",
      "pya.l.sk.reasonWhy": "Recorded against your name on the loan. The checker reads it.",
      "pya.l.sk.sub": "{name} · {id}",
      "pya.l.sk.body": "These are different things, and the difference is whether they still owe the money.",
      "pya.l.sk.defer": "Defer it",
      "pya.l.sk.deferWhy": "Nothing is deducted this month. The instalment moves to the end and the schedule runs a month longer. They still owe it.",
      "pya.l.sk.waive": "Waive it",
      "pya.l.sk.waiveWhy": "The instalment is forgiven. The balance reduces by {v} and they never repay it. This is a waiver and the checker reads it.",
      "pya.l.sk.reason": "Why",
      "pya.l.sk.reasonPh": "A sentence is enough.",
      "pya.l.sk.go": "Record it",
      "pya.l.sk.doneDefer": "Deferred. {name}’s schedule now runs to {n} instalments.",
      "pya.l.sk.doneWaive": "Waived. {v} has come off {name}’s balance.",

      /* ---- claims ---- */
      "pya.c.band": "What staff have claimed",
      "pya.c.bandSub": "Reimbursements employees submitted and their head of department approved. Payroll decides which of them this run pays.",
      "pya.c.m.claims": "approved claims",
      "pya.c.m.claimsNote": "Approved by a head of department, not yet paid",
      "pya.c.m.peopleNote": "Some have more than one",
      "pya.c.m.totalNote": "What the school owes them in all",
      "pya.c.m.people": "members of staff",
      "pya.c.m.total": "approved and unpaid",
      "pya.c.m.batch": "in this month’s batch",
      "pya.c.m.batchNote": "Awaiting the checker",
      "pya.c.reg.title": "Claims from staff",
      "pya.c.reg.sub": "{n} approved and waiting to be paid. A row opens the claim.",
      "pya.c.col.who": "Who claimed",
      "pya.c.col.what": "What for",
      "pya.c.col.amount": "Amount",
      "pya.c.col.tax": "Tax treatment",
      "pya.c.col.approved": "Approved",
      "pya.c.col.state": "State",
      "pya.c.st.batched": "In this batch",
      "pya.c.st.waiting": "Not batched yet",
      "pya.c.tot": "Approved and unpaid",
      "pya.c.d.m.amount": "claimed",
      "pya.c.d.m.taxable": "taxable part",
      "pya.c.d.m.exempt": "exempt part",
      "pya.c.d.facts": "The claim",
      "pya.c.d.cat": "Category",
      "pya.c.d.approvedOn": "Approved on",
      "pya.c.d.treat": "How it is taxed",
      "pya.c.d.batch": "Payment",
      "pya.c.d.inBatch": "In batch {id}, which is with {who} to release. It pays when the run disburses.",
      "pya.c.d.notBatch": "Not in a batch yet. It is eligible for this month’s payout.",
      "pya.c.d.add": "Add it to this month’s batch",
      "pya.c.d.remove": "Take it out of the batch",
      "pya.c.d.added": "Added to the batch.",
      "pya.c.d.removed": "Taken out of the batch.",
      "pya.c.d.noEdit": "You cannot change what they claimed",
      "pya.c.d.noEditWhy": "The amount and the category are the employee’s and their approver’s. Payroll decides when it is paid, not what it was.",

      /* ---- arrears ---- */
      "pya.a.band": "What we owe for months already paid",
      "pya.a.bandSub": "Each one recomputes every affected month on the statutory config that month was originally pinned to — never the current one.",
      "pya.a.m.runs": "arrears computations",
      "pya.a.m.runsNote": "Each recomputed on the rules its months ran on",
      "pya.a.m.peopleNote": "Counted once, across every computation",
      "pya.a.m.grossNote": "Before statutory deductions come off it",
      "pya.a.m.awaitingNote": "Nothing posts to a run until a checker agrees",
      "pya.a.m.awaitingNone": "Nothing is waiting on a checker",
      "pya.a.m.people": "people affected",
      "pya.a.m.gross": "gross arrears",
      "pya.a.m.awaiting": "awaiting the checker",
      "pya.a.reg.title": "Arrears",
      "pya.a.reg.sub": "{n} computations. A row opens its month-by-month split.",
      "pya.a.col.id": "Reference",
      "pya.a.col.source": "Why",
      "pya.a.col.people": "People",
      "pya.a.col.range": "Months",
      "pya.a.col.gross": "Gross",
      "pya.a.col.state": "State",
      "pya.a.st.draft": "Draft",
      "pya.a.st.awaiting": "With the checker",
      "pya.a.st.approved": "Approved",
      "pya.a.st.posted": "Posted",
      "pya.a.d.m.gross": "gross arrears",
      "pya.a.d.lead": "{n} people · {m} months recomputed · {from} to {to}",
      "pya.a.d.f.state": "Where it stands",
      "pya.a.d.f.draftNote": "Nobody has been asked to check it yet",
      "pya.a.d.f.awaitingNote": "{who} has to agree before it posts",
      "pya.a.d.f.postedNote": "Posted {on}",
      "pya.a.d.f.by": "Worked out by",
      "pya.a.d.f.byNote": "On {on}",
      "pya.a.d.f.target": "Posts to",
      "pya.a.d.f.targetNone": "No run yet",
      "pya.a.d.f.targetNote": "It is paid with that run, not before",
      "pya.a.d.f.targetNoneNote": "A run is chosen when it is submitted",
      "pya.a.d.split": "Month by month",
      "pya.a.d.splitSub": "Each month is recomputed on the config it was pinned to. Using today's config on a past month is what this screen must never do.",
      "pya.a.d.col.month": "Month",
      "pya.a.d.col.cfg": "Config then",
      "pya.a.d.col.old": "Was",
      "pya.a.d.col.new": "Should have been",
      "pya.a.d.col.delta": "Owed",
      "pya.a.d.excluded": "Months left out",
      "pya.a.d.excludedWhy": "These months could not be recomputed and are excluded rather than guessed.",
      "pya.a.d.tot": "Total",
      "pya.a.d.stale": "An input changed since this was computed",
      "pya.a.d.staleWhy": "Recompute before it goes any further, or the checker is reading a figure that no longer follows from the data.",

      "pya.cancel": "Cancel",
      "pya.none": "Nothing here",
    },
  });

  const MON = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtIso(s) {
    if (!s) return "";
    const p = String(s).split("-");
    return String(Number(p[2])) + " " + MON[Number(p[1])] + " " + p[0];
  }
  function monName(m) { return MON[m] || String(m); }

  /* ------------------------------------------------------------
     The frame, and the band every tab wears. A band is a heading,
     a split you can pick from, and measured figures with bars --
     the same shape in all three tabs so moving between them does
     not mean learning a new layout.
     ------------------------------------------------------------ */
  function Shell({ role, onNavigate, title, q, back, chips, tabs, campus, onCampus, children }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "payrollOfficer"} active="pyAdjust" onNavigate={onNavigate} initials="SK" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("pya.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
                <span>{t("pya.entity")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
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

  /* one helper for the whole module: every row here carries the staff
     number of the person it belongs to, and the number says which
     campus. */
  function onCampus(campus, rows) {
    return rows.filter(function (r) { return inCampus(campus, campusOfCode(r.staff)); });
  }

  function Fact({ label, children, note }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ minWidth: 0 }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={ty("small", { color: c.ink, fontWeight: 600, marginTop: 3 })}>{children}</div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{note}</div> : null}
      </div>
    );
  }

  /* WHAT A RECORD LEADS WITH, inside a panel.

     One figure at a size the panel can hold, and the rest of what the
     reader needs in words beside it. The old row put four of them
     across at `fig("lg")` with a tinted meter under each -- written
     for a 1,560-pixel page, and five pixels too wide for a 760-pixel
     drawer, which is how a rupee figure came to hang outside it. */
  function Lead({ label, value, line, facts, note, flush }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{
        border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
        padding: "16px 20px 18px", marginBottom: flush ? 0 : G3.layout.gap,
      }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={G3.fig("xl", { color: c.ink, fontWeight: 700, marginTop: 4, lineHeight: 1.1 })}>{value}</div>
        {line ? <div style={ty("small", { color: c.inkMuted, marginTop: 7 })}>{line}</div> : null}
        {facts && facts.length ? (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px 20px",
            marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule,
          }}>
            {facts.map(function (f) {
              return <Fact key={f.k} label={f.label} note={f.note}>{f.value}</Fact>;
            })}
          </div>
        ) : null}
        {note ? <p style={ty("caption", { color: c.inkMuted, margin: "14px 0 0", maxWidth: "78ch" })}>{note}</p> : null}
      </div>
    );
  }

  /* kept for the one record that genuinely compares three amounts */
  function Figures({ items }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface, padding: "16px 0", marginBottom: G3.layout.gap }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", rowGap: 18 }}>
          {items.map(function (m, i) {
            return (
              <div key={m.k} style={{ minWidth: 0, borderInlineStart: i ? "1px solid " + c.rule : "none", paddingInline: 18 }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{m.label}</div>
                <div style={G3.fig("md", { color: c.ink, fontWeight: 700, marginTop: 5, lineHeight: 1.1, overflowWrap: "anywhere" })}>{m.value}</div>
                {m.note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 6 })}>{m.note}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function Note({ role, glyph, head, body, action }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <Card>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <StatusMark role={role} glyph={glyph} word={head} />
          <div style={{ minWidth: 0, flex: "1 1 320px" }}>
            <p style={ty("small", { color: c.ink, margin: 0, maxWidth: "74ch" })}>{body}</p>
            {action ? <div style={{ marginTop: 10 }}>{action}</div> : null}
          </div>
        </div>
      </Card>
    );
  }

  const LOAN_STATES = ["active", "pending", "atExit", "foreclosed", "closed"];
  const LOAN_TONE = { active: "chartTeal", pending: "chartAmber", atExit: "chartPurple", foreclosed: "chartRed", closed: "chartSand" };

  function loanMark(t, l) {
    if (l.state === "pending") return <StatusMark role="late" glyph="clock" word={t("pya.l.st.pending")} />;
    if (l.state === "atExit") return <StatusMark role="leave" glyph="signout" word={t("pya.l.st.atExit")} />;
    if (l.state === "foreclosed") return <StatusMark role="penalty" glyph="alert" word={t("pya.l.st.foreclosed")} />;
    if (l.state === "closed") return <StatusMark role="off" glyph="check" word={t("pya.l.st.closed")} />;
    return <StatusMark role="present" glyph="check" word={t("pya.l.st.active")} />;
  }

  /* ============================================================
     PY-13 -- LOANS AND ADVANCES, as a register that opens records.
     ============================================================ */
  function LoansTab({ onOpen, campus }) {
    const { c } = useTheme();
    const { t } = useLang();
    const [kindF, setKindF] = useState("all");
    const [pick, setPick] = useState("open");

    const byState = {};
    const LOANS = onCampus(campus, A.LOANS);
    LOAN_STATES.forEach(function (s) { byState[s] = LOANS.filter(function (l) { return l.state === s; }); });
    const open = LOANS.filter(function (l) { return l.state === "active" || l.state === "atExit" || l.state === "pending"; });
    const rows = LOANS.filter(function (l) {
      if (kindF !== "all" && l.kind !== kindF) return false;
      if (pick === "open") return l.state === "active" || l.state === "atExit" || l.state === "pending";
      if (pick !== "all" && l.state !== pick) return false;
      return true;
    });

    /* A LOAN AND AN ADVANCE ARE NOT ONE POPULATION (designer). They
       are recovered the same way and taken for opposite reasons: a
       loan is years of somebody's plan, an advance is this month's
       emergency, and "how much of this is advances" had no answer on
       the screen. The two counts share the bar; the money they move
       does not, because rupees and people are not comparable. */
    const activeLoans = LOANS.filter(function (l) { return l.kind === "loan" && (l.state === "active" || l.state === "atExit"); });
    const activeAdv = LOANS.filter(function (l) { return l.kind === "advance" && (l.state === "active" || l.state === "atExit"); });
    const advOut = activeAdv.reduce(function (n, l) { return n + A.loanOutstanding(l); }, 0);
    const metrics = [
      { k: "l", label: t("pya.l.m.loans"), value: num(activeLoans.length), n: activeLoans.length,
        note: t("pya.l.m.loansNote"), tone: c.chartBlue },
      { k: "a", label: t("pya.l.m.adv"), value: num(activeAdv.length), n: activeAdv.length,
        note: activeAdv.length ? t("pya.l.m.advNote", { v: inr(advOut) }) : t("pya.l.m.advNone"),
        tone: c.chartTeal },
      { k: "w", label: t("pya.l.m.pending"), value: num(byState.pending.length), n: byState.pending.length,
        note: byState.pending.length ? t("pya.l.m.pendingNote") : t("pya.l.m.pendingNone"),
        tone: c.chartPurple },
      { k: "r", label: t("pya.l.m.run"), value: inr(A.LOAN_RUN_TOTAL), bar: false,
        note: t("pya.l.m.runNote"), tone: c.chartAmber },
      { k: "o", label: t("pya.l.m.outstanding"), value: inr(A.LOAN_OUTSTANDING_TOTAL), bar: false,
        note: t("pya.l.m.outstandingNote"), tone: c.chartSand },
    ];

    return (
      <div>
        <Band head={t("pya.l.band")} metrics={metrics} foot={t("pya.l.bandFoot")} />

        {/* two questions, one row: which kind, and where each stands */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
          <div style={{ flex: "1 1 220px", minWidth: 0, maxWidth: 320 }}>
            <Field id="pya-l-kind" label={t("pya.l.f.kind")}>
              <Select id="pya-l-kind" value={kindF} onChange={setKindF}
                options={[{ value: "all", label: t("pya.l.f.kindAll") }].concat(
                  ["loan", "advance"].map(function (k) { return { value: k, label: t("pya.l.kind." + k) }; }))} />
            </Field>
          </div>
          <div style={{ flex: "1 1 240px", minWidth: 0, maxWidth: 340 }}>
            <Field id="pya-l-state" label={t("pya.l.f.state")}>
              <Select id="pya-l-state" value={pick} onChange={setPick}
                options={[
                  { value: "open", label: t("pya.l.f.stateOpen") },
                  { value: "all", label: t("pya.l.f.stateAll") },
                ].concat(LOAN_STATES.map(function (st) { return { value: st, label: t("pya.l.seg." + st) }; }))} />
            </Field>
          </div>
        </div>
        <Register
          title={t("pya.l.reg.title")}
          sub={t("pya.l.reg.sub", { n: num(open.length) })}
          onSelect={onOpen}
          columns={[
            { key: "who", label: t("pya.l.col.person") },
            { key: "cmp", label: t("kit.campus.label"), width: 140 },
            { key: "kind", label: t("pya.l.col.kind"), width: 110 },
            { key: "principal", label: t("pya.l.col.principal"), align: "end", mono: true, width: 130 },
            { key: "out", label: t("pya.l.col.out"), align: "end", mono: true, width: 130 },
            { key: "emi", label: t("pya.l.col.emi"), align: "end", mono: true, width: 125, weight: 700 },
            { key: "state", label: t("pya.l.col.state"), width: 170 },
          ]}
          rows={rows.map(function (l) {
            const running = l.state === "active";
            return {
              id: l.id,
              tone: (l.state === "closed" || l.state === "foreclosed") ? "dim" : undefined,
              cells: {
                who: (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                    <Avatar name={t(l.personKey)} size={26} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{t(l.personKey)}</div>
                      <div style={G3.fig("micro", { color: c.inkFaint })}>{l.id}</div>
                    </div>
                  </div>
                ),
                cmp: campusLabel(t, campusOfCode(l.staff)),
                kind: <Chip bg={c.sunken} fg={c.inkMuted}>{t("pya.l.kind." + l.kind)}</Chip>,
                principal: inr(l.principal),
                out: (l.state === "closed" || l.state === "foreclosed") ? "—" : inr(A.loanOutstanding(l)),
                emi: running ? inr(A.loanEmi(l)) : "—",
                state: loanMark(t, l),
              },
            };
          })}
          totals={{
            label: t("pya.l.tot"),
            cells: {
              who: t("pya.l.tot"),
              principal: inr(A.LOAN_PRINCIPAL_TOTAL),
              out: inr(A.LOAN_OUTSTANDING_TOTAL),
              emi: inr(A.LOAN_RUN_TOTAL),
            },
          }}
        />
      </div>
    );
  }

  /* ============================================================
     ONE LOAN. Everything that used to stack under the register --
     the schedule, the foreclosure, the skip -- lives here, on the
     screen that carries the person's name.
     ============================================================ */
  function LoanRecord({ loan, onBack, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [panel, setPanel] = useState(null);
    const emi = A.loanEmi(loan);
    const out = A.loanOutstanding(loan);
    const running = loan.state === "active";
    const skipped = loan.skipped || 0;
    const waived = loan.waived || 0;
    /* every month the loan runs for: its tenure, plus one for each
       instalment deferred to the end */
    const total = loan.tenure + skipped;

    /* the schedule is DERIVED from tenure, what has been paid, what
       was forgiven and what was deferred, so it cannot disagree with
       the figures above it. `left` is what is still RECOVERABLE after
       each row -- a waived instalment leaves the balance the moment
       it is forgiven, and a deferred one does not. */
    const rows = [];
    let stillOwed = Math.max(0, loan.tenure - loan.paid - waived) * emi;
    for (let i = 1; i <= total; i++) {
      const paid = i <= loan.paid;
      const gone = !paid && i <= loan.paid + waived;
      const isThis = running && i === loan.paid + waived + 1;
      if (!paid && !gone) stillOwed = Math.max(0, stillOwed - emi);
      rows.push({ n: i, paid: paid, gone: gone, isThis: isThis, amt: emi, left: stillOwed });
    }

    return (
      <div>
        {/* what the reader came for is the balance; the rest of it
            is a sentence and three plain facts */}
        <Lead
          label={t("pya.l.d.m.out")}
          value={(loan.state === "closed" || loan.state === "foreclosed") ? "—" : inr(out)}
          line={t("pya.l.d.lead", { lent: inr(loan.principal), since: fmtIso(loan.since) })}
          facts={[
            { k: "e", label: t("pya.l.d.m.emi"), value: running ? inr(emi) : "—",
              note: running ? t("pya.l.d.m.emiNote") : null },
            { k: "n", label: t("pya.l.d.m.paid"), value: num(loan.paid) + " / " + num(total),
              note: waived ? t(waived === 1 ? "pya.l.d.m.paidWaived1" : "pya.l.d.m.paidWaived", { n: num(waived) })
                : skipped ? t(skipped === 1 ? "pya.l.d.m.paidSkipped1" : "pya.l.d.m.paidSkipped", { n: num(skipped) })
                  : t("pya.l.d.m.paidNote") },
          ]}
        />

        {loan.state === "pending" ? (
          <div style={{ marginBottom: G3.layout.gap }}>
            <Note role="late" glyph="clock" head={t("pya.l.d.pendingHead")}
              body={t("pya.l.d.pendingBody", { who: t(A.HR_OFFICER.nameKey), on: fmtIso(loan.raisedIso) })} />
          </div>
        ) : null}
        {loan.state === "atExit" ? (
          <div style={{ marginBottom: G3.layout.gap }}>
            <Note role="leave" glyph="signout" head={t("pya.l.d.exitHead")}
              body={t("pya.l.d.exitBody", { on: fmtIso(loan.exitIso), ff: loan.settlement })} />
          </div>
        ) : null}
        {(loan.state === "closed" || loan.state === "foreclosed") ? (
          <div style={{ marginBottom: G3.layout.gap }}>
            <Note role="off" glyph="check" head={t("pya.l.d.closedHead")}
              body={t("pya.l.d.closedBody", { on: fmtIso(loan.closedIso) })
                + (loan.waiver ? " " + t("pya.l.d.waived", { v: inr(loan.waiver) }) : "")} />
          </div>
        ) : null}

        <Card>
          <h2 style={ty("h3", { margin: "0 0 12px", color: c.ink })}>{t("pya.l.d.facts")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            <Fact label={t("pya.l.d.purpose")}>{t(loan.purposeKey)}</Fact>
            <Fact label={t("pya.l.d.since")}>{fmtIso(loan.since)}</Fact>
            <Fact label={t("pya.l.d.tenure")}>{t("pya.l.d.months", { n: num(loan.tenure) })}</Fact>
            <Fact label={t("pya.l.d.rate")}
              note={loan.rate ? t("pya.l.d.ratePerq", { n: String(loan.rate) }) : null}>
              {loan.rate ? loan.rate + "%" : t("pya.l.d.rateNone")}
            </Fact>
            {loan.net != null ? <Fact label={t("pya.l.d.net")}>{inr(loan.net)}</Fact> : null}
          </div>
          {skipped || waived ? (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
              {skipped ? (
                <p style={ty("caption", { color: c.inkMuted, margin: 0 })}>
                  {t(skipped === 1 ? "pya.l.d.skipped1" : "pya.l.d.skipped", { n: num(skipped), on: fmtIso(loan.skipIso) })}
                  {loan.skipNote ? " “" + loan.skipNote + "”" : ""}
                </p>
              ) : null}
              {waived ? (
                <p style={ty("caption", { color: c.inkMuted, margin: skipped ? "6px 0 0" : 0 })}>
                  {t(waived === 1 ? "pya.l.d.waivedN1" : "pya.l.d.waivedN", { n: num(waived), v: inr(loan.waiver || 0), on: fmtIso(loan.waiveIso) })}
                  {loan.waiveNote ? " “" + loan.waiveNote + "”" : ""}
                </p>
              ) : null}
            </div>
          ) : null}
        </Card>

        <div style={{ marginTop: G3.layout.gap }}>
          <Register
            title={t("pya.l.d.sched")}
            sub={t("pya.l.d.schedSub")}
            columns={[
              { key: "n", label: t("pya.l.d.col.n"), align: "end", mono: true, width: 60 },
              { key: "amt", label: t("pya.l.d.col.amt"), align: "end", mono: true, width: 140 },
              { key: "left", label: t("pya.l.d.col.left"), align: "end", mono: true, width: 150 },
              { key: "mark", label: t("pya.l.d.col.mark") },
            ]}
            rows={rows.map(function (r) {
              return {
                id: String(r.n),
                highlight: r.isThis,
                tone: r.paid || r.gone ? "dim" : undefined,
                cells: {
                  n: num(r.n),
                  amt: inr(r.amt),
                  left: inr(r.left),
                  mark: r.gone
                    ? <StatusMark role="leave" glyph="check" word={t("pya.l.d.waivedMark")} />
                    : r.isThis
                      ? <StatusMark role="present" glyph="check" word={t("pya.l.d.thisMark")} />
                      : r.paid
                        ? <span style={ty("caption", { color: c.inkFaint })}>{t("pya.l.d.paidMark")}</span>
                        : <span style={ty("caption", { color: c.inkMuted })}>{t("pya.l.d.dueMark")}</span>,
                },
              };
            })}
          />
        </div>

        {running ? (
          <Card style={{ marginTop: G3.layout.gap }}>
            <h2 style={ty("h3", { margin: "0 0 4px", color: c.ink })}>{t("pya.l.d.actions")}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginTop: 12 }}>
              <div>
                <Button size="sm" kind="secondary" iconLeft="clock" onClick={function () { setPanel("skip"); }}>{t("pya.l.d.skip")}</Button>
                <p style={ty("caption", { color: c.inkMuted, margin: "7px 0 0", maxWidth: "46ch" })}>{t("pya.l.d.skipWhy")}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {panel === "skip" ? (
          <SkipPanel loan={loan} emi={emi} total={total} out={out} onClose={function () { setPanel(null); }}
            onDone={function (w) { setPanel(null); onDone(w); }} />
        ) : null}
      </div>
    );
  }

  /* DEFER OR WAIVE. The two differ in exactly one way -- whether the
     money is still owed -- so the panel shows the two figures that
     differ, before and after, rather than describing them twice. */
  function SkipPanel({ loan, emi, total, out, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [mode, setMode] = useState(null);
    const [why, setWhy] = useState("");
    const ready = !!mode && why.trim().length >= 4;
    const nextOut = mode === "waive" ? A.r2(out - emi) : out;
    /* the instalments still to be RECOVERED. A deferral moves one to
       the end and does not change the count; a waiver removes one
       from it, because nobody ever pays it. */
    const leftN = Math.max(0, loan.tenure - loan.paid - (loan.waived || 0));

    function commit() {
      if (mode === "waive") {
        A.waiveInstalment(loan.id, { note: why.trim() });
        onDone(t("pya.l.sk.doneWaive", { v: inr(emi), name: t(loan.personKey) }));
      } else {
        A.deferInstalment(loan.id, { note: why.trim() });
        onDone(t("pya.l.sk.doneDefer", { name: t(loan.personKey), n: num(total + 1) }));
      }
    }

    return (
      <Modal
        title={t("pya.l.sk.title")} sub={t("pya.l.sk.sub", { name: t(loan.personKey), id: loan.id })}
        onClose={onClose} width={620}
        footer={
          <React.Fragment>
            <Button kind="primary" disabled={!ready} onClick={commit}>{t("pya.l.sk.go")}</Button>
            <Button kind="quiet" onClick={onClose}>{t("pya.cancel")}</Button>
          </React.Fragment>
        }
      >
        <p style={ty("small", { color: c.ink, margin: "0 0 14px", maxWidth: "62ch" })}>{t("pya.l.sk.body")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { k: "defer", label: t("pya.l.sk.defer"), why: t("pya.l.sk.deferWhy") },
            { k: "waive", label: t("pya.l.sk.waive"), why: t("pya.l.sk.waiveWhy", { v: inr(emi) }) },
          ].map(function (o) {
            const on = mode === o.k;
            return (
              <button
                key={o.k} type="button" aria-pressed={on} onClick={function () { setMode(o.k); }}
                style={{
                  textAlign: "start", cursor: "pointer", padding: "13px 15px", borderRadius: G3.r.sm,
                  background: on ? (c.sel || c.sunken) : c.surface,
                  border: "1px solid " + (on ? c.accent : c.rule), color: c.ink,
                }}
              >
                <div style={ty("small", { fontWeight: 700 })}>{o.label}</div>
                <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0", maxWidth: "56ch" })}>{o.why}</p>
              </button>
            );
          })}
        </div>
        {/* WHAT IT DOES, in the two figures that move. A panel that
            explains a consequence in a sentence and shows nothing is
            how the old one came to do nothing at all. */}
        {mode ? (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16,
            border: "1px solid " + c.border, borderRadius: G3.r.md, background: c.sunken,
            padding: "14px 16px", marginTop: 16,
          }}>
            <Fact label={t("pya.l.sk.thisMonth")} note={t("pya.l.sk.thisMonthNote")}>
              {t("pya.l.sk.nothing")}
            </Fact>
            <Fact label={t("pya.l.sk.balance")}
              note={mode === "waive" ? t("pya.l.sk.balanceDown", { v: inr(emi) }) : t("pya.l.sk.balanceSame")}>
              {inr(nextOut)}
            </Fact>
            <Fact label={t("pya.l.sk.ends")}
              note={mode === "defer" ? t("pya.l.sk.endsLater") : t("pya.l.sk.endsFewer")}>
              {num(mode === "waive" ? Math.max(0, leftN - 1) : leftN)}
            </Fact>
          </div>
        ) : null}
        <div style={{ marginTop: 16 }}>
          <Field id="pya-sk-why" label={t("pya.l.sk.reason")} hint={t("pya.l.sk.reasonWhy")}>
            <Input id="pya-sk-why" value={why} onChange={setWhy} placeholder={t("pya.l.sk.reasonPh")} />
          </Field>
        </div>
      </Modal>
    );
  }

  /* ============================================================
     PY-14 -- CLAIMS. Drawn as what they are: reimbursements staff
     submitted and a head of department approved. The payout batch
     is one thing that happens to them, so it is a STATE on the row
     and not the subject of the screen.
     ============================================================ */
  function ClaimsTab({ onOpen, batched, campus }) {
    const { c } = useTheme();
    const { t } = useLang();
    const [pick, setPick] = useState(null);
    const CLAIMS = onCampus(campus, A.CLAIMS);

    const cats = A.CLAIM_ORDER.filter(function (k) {
      return CLAIMS.some(function (x) { return x.cat === k; });
    });
    const tone = { lta: "chartTeal", med: "chartRed", tel: "chartBlue", books: "chartPurple", fuel: "chartAmber" };
    const segments = cats.map(function (k) {
      return {
        key: k, label: t(A.CLAIM_CATS[k].labelKey),
        value: CLAIMS.filter(function (x) { return x.cat === k; }).length,
        color: c[tone[k]] || c.accent,
      };
    });

    const rows = pick ? CLAIMS.filter(function (x) { return x.cat === pick; }) : CLAIMS;
    const totalV = CLAIMS.reduce(function (s, x) { return s + x.v; }, 0);
    const people = {};
    CLAIMS.forEach(function (x) { people[x.staff] = 1; });
    const inBatch = CLAIMS.filter(function (x) { return batched[x.id] !== false; });
    const batchV = inBatch.reduce(function (s, x) { return s + x.v; }, 0);

    const metrics = [
      { k: "n", label: t("pya.c.m.claims"), value: num(A.CLAIMS.length), n: A.CLAIMS.length, tone: c.chartBlue,
        note: t("pya.c.m.claimsNote") },
      { k: "p", label: t("pya.c.m.people"), value: num(Object.keys(people).length), n: Object.keys(people).length,
tone: c.chartPurple, note: t("pya.c.m.peopleNote") },
      { k: "v", label: t("pya.c.m.total"), value: inr(totalV), tone: c.chartTeal,
        note: t("pya.c.m.totalNote") },
      { k: "b", label: t("pya.c.m.batch"), value: inr(batchV), note: t("pya.c.m.batchNote"),
tone: c.chartAmber || c.warn },
    ];

    return (
      <div>
        <Band
          head={t("pya.c.band")} sub={t("pya.c.bandSub")} metrics={metrics}
        />
        <Register
          title={t("pya.c.reg.title")}
          sub={t("pya.c.reg.sub", { n: num(A.CLAIMS.length) })}
          onSelect={onOpen}
          columns={[
            { key: "who", label: t("pya.c.col.who") },
            { key: "cmp", label: t("kit.campus.label"), width: 140 },
            { key: "what", label: t("pya.c.col.what"), width: 180 },
            { key: "amount", label: t("pya.c.col.amount"), align: "end", mono: true, width: 130, weight: 700 },
            { key: "tax", label: t("pya.c.col.tax"), width: 150 },
            { key: "approved", label: t("pya.c.col.approved"), width: 130 },
            { key: "state", label: t("pya.c.col.state"), width: 160 },
          ]}
          rows={rows.map(function (x) {
            const cat = A.CLAIM_CATS[x.cat];
            const inB = batched[x.id] !== false;
            return {
              id: x.id,
              cells: {
                who: (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                    <Avatar name={t(x.personKey)} size={26} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{t(x.personKey)}</div>
                      <div style={G3.fig("micro", { color: c.inkFaint })}>{x.staff}</div>
                    </div>
                  </div>
                ),
                cmp: campusLabel(t, campusOfCode(x.staff)),
                what: t(cat.labelKey),
                amount: inr(x.v),
                tax: <Chip bg={c.sunken} fg={c.inkMuted}>{t(cat.taxKey)}</Chip>,
                approved: fmtIso(x.approvedIso),
                state: inB
                  ? <StatusMark role="late" glyph="clock" word={t("pya.c.st.batched")} />
                  : <StatusMark role="off" glyph="half" word={t("pya.c.st.waiting")} />,
              },
            };
          })}
          totals={{ label: t("pya.c.tot"), cells: { who: t("pya.c.tot"), amount: inr(totalV) } }}
        />
      </div>
    );
  }

  function ClaimRecord({ claim, inBatch, onToggle, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const cat = A.CLAIM_CATS[claim.cat];
    const taxable = cat.taxable ? claim.v : 0;
    return (
      <div>
        <Figures items={[
          { k: "a", label: t("pya.c.d.m.amount"), value: inr(claim.v), tone: c.chartBlue },
          { k: "t", label: t("pya.c.d.m.taxable"), value: inr(taxable), tone: c.chartAmber || c.warn },
          { k: "e", label: t("pya.c.d.m.exempt"), value: inr(claim.v - taxable), tone: c.chartGreen || c.present },
        ]} />

        <Card>
          <h2 style={ty("h3", { margin: "0 0 12px", color: c.ink })}>{t("pya.c.d.facts")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16 }}>
            <Fact label={t("pya.c.d.cat")}>{t(cat.labelKey)}</Fact>
            <Fact label={t("pya.c.d.approvedOn")}>{fmtIso(claim.approvedIso)}</Fact>
            <Fact label={t("pya.c.d.treat")} note={t(cat.noteKey)}>{t(cat.taxKey)}</Fact>
          </div>
          <div style={{
            marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule,
            display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
          }}>
            <div style={{ minWidth: 0, maxWidth: "58ch" }}>
              <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("pya.c.d.noEdit")}</div>
              <p style={ty("caption", { color: c.inkMuted, margin: "3px 0 0" })}>{t("pya.c.d.noEditWhy")}</p>
            </div>
          </div>
        </Card>

        <Card style={{ marginTop: G3.layout.gap }}>
          <h2 style={ty("h3", { margin: "0 0 10px", color: c.ink })}>{t("pya.c.d.batch")}</h2>
          <p style={ty("small", { color: c.ink, margin: 0, maxWidth: "70ch" })}>
            {inBatch
              ? t("pya.c.d.inBatch", { id: A.BATCH.id, who: t(A.CHECKER.nameKey) })
              : t("pya.c.d.notBatch")}
          </p>
          <div style={{ marginTop: 12 }}>
            <Button size="sm" kind={inBatch ? "secondary" : "primary"} onClick={function () {
              onToggle(); onDone(inBatch ? t("pya.c.d.removed") : t("pya.c.d.added"));
            }}>
              {inBatch ? t("pya.c.d.remove") : t("pya.c.d.add")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  /* ============================================================
     PY-15 -- ARREARS.
     ============================================================ */
  const ARR_TONE = { draft: "chartSand", awaiting: "chartAmber", approved: "chartTeal", posted: "chartGreen" };

  function arrMark(t, a) {
    if (a.state === "draft") return <StatusMark role="off" glyph="half" word={t("pya.a.st.draft")} />;
    if (a.state === "awaiting") return <StatusMark role="late" glyph="clock" word={t("pya.a.st.awaiting")} />;
    if (a.state === "approved") return <StatusMark role="present" glyph="check" word={t("pya.a.st.approved")} />;
    return <StatusMark role="present" glyph="check" word={t("pya.a.st.posted")} />;
  }

  function ArrearsTab({ onOpen }) {
    const { c } = useTheme();
    const { t } = useLang();
    const [pick, setPick] = useState(null);
    const states = ["draft", "awaiting", "approved", "posted"];
    const byState = {};
    states.forEach(function (s) { byState[s] = A.ARREARS.filter(function (a) { return a.state === s; }); });
    const segments = states.filter(function (s) { return byState[s].length; }).map(function (s) {
      return { key: s, label: t("pya.a.st." + s), value: byState[s].length, color: c[ARR_TONE[s]] || c.accent };
    });
    const rows = pick ? A.ARREARS.filter(function (a) { return a.state === pick; }) : A.ARREARS;
    const grossAll = A.ARREARS.reduce(function (s, a) { return s + A.arrGross(a); }, 0);
    const peopleAll = A.ARREARS.reduce(function (s, a) { return s + a.people; }, 0);

    const metrics = [
      { k: "r", label: t("pya.a.m.runs"), value: num(A.ARREARS.length), n: A.ARREARS.length, tone: c.chartBlue,
        note: t("pya.a.m.runsNote") },
      { k: "p", label: t("pya.a.m.people"), value: num(peopleAll), n: peopleAll, tone: c.chartPurple,
        note: t("pya.a.m.peopleNote") },
      { k: "g", label: t("pya.a.m.gross"), value: inr(grossAll), tone: c.chartTeal,
        note: t("pya.a.m.grossNote") },
      { k: "a", label: t("pya.a.m.awaiting"), value: num(byState.awaiting.length), n: byState.awaiting.length,
tone: c.chartAmber || c.warn,
        note: byState.awaiting.length ? t("pya.a.m.awaitingNote") : t("pya.a.m.awaitingNone") },
    ];

    return (
      <div>
        <Band
          head={t("pya.a.band")} sub={t("pya.a.bandSub")} metrics={metrics}
        />
        <Register
          title={t("pya.a.reg.title")}
          sub={t("pya.a.reg.sub", { n: num(A.ARREARS.length) })}
          onSelect={onOpen}
          columns={[
            { key: "id", label: t("pya.a.col.id"), mono: true, width: 130 },
            { key: "src", label: t("pya.a.col.source") },
            { key: "people", label: t("pya.a.col.people"), align: "end", mono: true, width: 90 },
            { key: "range", label: t("pya.a.col.range"), width: 200 },
            { key: "gross", label: t("pya.a.col.gross"), align: "end", mono: true, width: 140, weight: 700 },
            { key: "state", label: t("pya.a.col.state"), width: 170 },
          ]}
          rows={rows.map(function (a) {
            return {
              id: a.id,
              cells: {
                id: a.id,
                src: t(a.sourceKey),
                people: num(a.people),
                range: fmtIso(a.rangeFromIso) + " – " + fmtIso(a.rangeToIso),
                gross: inr(A.arrGross(a)),
                state: arrMark(t, a),
              },
            };
          })}
          totals={{ label: t("pya.a.d.tot"), cells: { id: t("pya.a.d.tot"), gross: inr(grossAll) } }}
        />
      </div>
    );
  }

  function ArrearsRecord({ arr }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const gross = A.arrGross(arr);
    return (
      <div>
        <Lead
          label={t("pya.a.d.m.gross")}
          value={inr(gross)}
          line={t("pya.a.d.lead", {
            n: num(arr.people), m: num(arr.months.length),
            from: fmtIso(arr.rangeFromIso), to: fmtIso(arr.rangeToIso),
          })}
          facts={[
            { k: "s", label: t("pya.a.d.f.state"), value: t("pya.a.st." + arr.state),
              note: arr.state === "draft" ? t("pya.a.d.f.draftNote")
                : arr.state === "awaiting" ? t("pya.a.d.f.awaitingNote", { who: t(arr.checker.nameKey) })
                  : t("pya.a.d.f.postedNote", { on: fmtIso(arr.postedIso) }) },
            { k: "w", label: t("pya.a.d.f.by"), value: t(arr.maker.nameKey),
              note: t("pya.a.d.f.byNote", { on: fmtIso(arr.createdIso) }) },
            { k: "t", label: t("pya.a.d.f.target"), value: arr.target || t("pya.a.d.f.targetNone"),
              note: arr.target ? t("pya.a.d.f.targetNote") : t("pya.a.d.f.targetNoneNote") },
          ]}
        />

        {arr.stale ? (
          <div style={{ marginBottom: G3.layout.gap }}>
            <Note role="danger" glyph="alert" head={t("pya.a.d.stale")} body={t("pya.a.d.staleWhy")} />
          </div>
        ) : null}

        <Register
          title={t("pya.a.d.split")}
          sub={t("pya.a.d.splitSub")}
          columns={[
            { key: "m", label: t("pya.a.d.col.month"), width: 110 },
            { key: "cfg", label: t("pya.a.d.col.cfg"), mono: true, width: 130 },
            { key: "old", label: t("pya.a.d.col.old"), align: "end", mono: true, width: 140 },
            { key: "neu", label: t("pya.a.d.col.new"), align: "end", mono: true, width: 160 },
            { key: "d", label: t("pya.a.d.col.delta"), align: "end", mono: true, width: 140, weight: 700 },
          ]}
          rows={arr.months.map(function (x) {
            return {
              id: String(x.m),
              cells: {
                m: monName(x.m) + " 2026",
                cfg: x.cfg.v,
                old: inr(x.old),
                neu: inr(x.neu),
                d: inr(A.monDelta(x)),
              },
            };
          })}
          totals={{ label: t("pya.a.d.tot"), cells: { m: t("pya.a.d.tot"), d: inr(gross) } }}
        />

        {arr.excluded && arr.excluded.length ? (
          <Card style={{ marginTop: G3.layout.gap }}>
            <h2 style={ty("h3", { margin: "0 0 6px", color: c.ink })}>{t("pya.a.d.excluded")}</h2>
            <p style={ty("caption", { color: c.inkMuted, margin: "0 0 10px", maxWidth: "70ch" })}>{t("pya.a.d.excludedWhy")}</p>
            {arr.excluded.map(function (e) {
              return (
                <div key={e.m} style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "8px 0", borderTop: "1px solid " + c.rule }}>
                  <span style={ty("small", { color: c.ink, fontWeight: 600, width: 110 })}>{monName(e.m) + " 2026"}</span>
                  <span style={ty("caption", { color: c.inkMuted })}>{t(e.reasonKey)}</span>
                </div>
              );
            })}
          </Card>
        ) : null}
      </div>
    );
  }

  /* ============================================================
     WHAT HR HAS SENT OVER. The other end of the chain the HR module
     opened: a request an HR operator verified and passed on, waiting
     for the one decision only this desk can make.

     It sits at the TOP of the tab that owns its subject rather than
     in a module of its own, because a loan request and the loan it
     becomes are one object at two ages, and a person looking for
     "the loans" should not have to guess which of two rail items
     holds the one they mean.

     THE SPLIT IS THE ONE pay-handoff.jsx SET AND THE HR MODULE
     OBEYS: HR verified the FACT -- the bill, the roster, the
     purpose -- and this screen sets the FIGURE. Nothing here
     recomputes what HR verified. The hours, the amount claimed and
     the months asked for are inputs, not suggestions.
     ============================================================ */
  const Q = window.NaveyaPayRequests || null;

  /* payroll reads the same chain HR reads, from its own side: the
     stop called "you" over there is called "HR" here. */
  function QueueRail({ req }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const stops = [
      req.kind === "rise" ? null : { k: "raised", label: t("pya.q.stop.raised"), on: req.raisedIso, who: req.raisedBy === "hr" ? t("pya.q.hrWho") : t(req.personKey) },
      { k: "hr", label: t("pya.q.stop.hr"), on: req.hr ? req.hr.on : null, who: t("pya.q.hrWho"),
        note: req.hr && req.hr.reasonKey ? t(req.hr.reasonKey) : req.hr && req.hr.noteKey ? t(req.hr.noteKey) : (req.hr && req.hr.note) || null },
      { k: "you", label: t("pya.q.stop.you"), waiting: req.state === "withPayroll", on: req.payroll ? req.payroll.on : null },
      { k: "paid", label: t("pya.q.stop.paid"), on: req.paidIso || null },
    ].filter(Boolean);
    /* approved is PAST this desk: what happens next is a run paying
       it, so the ring moves on rather than sitting on a stop already
       done. A refusal rings this desk, in red. */
    const declinedHere = req.state === "declined" && req.declined && req.declined.at === "payroll";
    const pos = (req.paidIso || req.payroll) && !declinedHere ? stops.length - 1 : stops.length - 2;
    return (
      <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface, padding: "18px 20px 10px" }}>
        <h2 style={ty("h3", { margin: "0 0 2px", color: c.ink })}>{t("pya.q.chain")}</h2>
        <p style={ty("caption", { color: c.inkMuted, margin: "0 0 16px" })}>
          {t("pya.q.waiting", { n: num(Q.waitingDays(req)) })}
        </p>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {stops.map(function (s, i) {
            const done = i < pos;
            const here = i === pos;
            const live = done || here;
            return (
              <li key={s.k} style={{ display: "flex", gap: 13, alignItems: "flex-start", paddingBottom: i < stops.length - 1 ? 18 : 14, position: "relative" }}>
                {i < stops.length - 1 ? (
                  <span aria-hidden="true" style={{ position: "absolute", insetInlineStart: 9, top: 19, bottom: 0, width: 2, background: done ? c.accent : c.gutter }} />
                ) : null}
                <span aria-hidden="true" style={{
                  position: "relative", flexShrink: 0, marginTop: 2, width: 20, height: 20, borderRadius: G3.r.pill,
                  boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
                  background: c.surface,
                  border: "2px solid " + (here ? (declinedHere ? c.chartRed : c.accent) : "transparent"),
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: G3.r.pill, background: here && declinedHere ? c.chartRed : live ? c.accent : c.gutter }} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                    <span style={ty("small", { color: live ? c.ink : c.inkFaint, fontWeight: here ? 700 : 600 })}>{s.label}</span>
                    <span style={G3.fig("xs", { color: c.inkMuted, whiteSpace: "nowrap" })}>
                      {s.on ? fmtQDate(t, s.on) : s.waiting ? t("pya.q.stop.waiting") : ""}
                    </span>
                  </div>
                  {s.who ? <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{s.who}</div> : null}
                  {s.note ? <p style={ty("caption", { color: c.inkMuted, margin: "5px 0 0" })}>{s.note}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  function fmtQDate(t, iso) {
    if (!iso) return "—";
    const p = iso.split("-");
    return num(+p[2]) + " " + t("pya.q.mon." + (+p[1])) + " " + p[0];
  }

  /* the queue that sits above a register. One row per request, the
     figure HR passed on, and what this desk owes it. */
  function IncomingQueue({ kind, onOpen, campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!Q) return null;
    const rows = onCampus(campus, Q.byKind(kind)).filter(function (r) { return r.state === "withPayroll"; });
    if (!rows.length) return null;

    const oldest = rows.slice().sort(function (a, b) { return Q.waitingDays(b) - Q.waitingDays(a); })[0];

    const notice = (
      <div key="n" style={{
        display: "flex", gap: 13, alignItems: "flex-start", width: "100%",
        borderRadius: G3.r.md, background: c.lateTint, padding: "13px 16px",
      }}>
        <span aria-hidden="true" style={{ display: "flex", marginTop: 1, color: c.lateText }}><Icon name="arrow" size={17} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={ty("small", { color: c.lateText, fontWeight: 700 })}>
            {t("pya.q.head", { n: num(rows.length) })}
          </div>
          <p style={ty("caption", { color: c.ink, margin: "3px 0 0", maxWidth: "84ch" })}>
            {t("pya.q.sub." + kind)}
          </p>
          <p style={ty("caption", { color: c.inkMuted, margin: "3px 0 0" })}>
            {t("pya.q.oldest", { who: t(oldest.personKey), n: num(Q.waitingDays(oldest)) })}
          </p>
        </div>
      </div>
    );

    return (
      <section style={{ marginBottom: G3.layout.gap }}>
        <Register
          title={t("pya.q.reg." + kind)}
          sub={t("pya.q.regSub")}
          chips={notice}
          onSelect={onOpen}
          columns={[
            { key: "who", label: t("pya.q.col.who") },
            { key: "what", label: t("pya.q.col.what"), width: 210 },
            { key: "v", label: t("pya.q.col.v"), align: "right", mono: true, width: 150, weight: 700 },
            { key: "hr", label: t("pya.q.col.hr"), width: 150 },
            { key: "act", label: t("pya.q.col.act"), align: "right", width: 60 },
          ]}
          rows={rows.map(function (r) {
            return {
              id: r.id,
              cells: {
                who: (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                    <Avatar name={t(r.personKey)} size={26} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{t(r.personKey)}</div>
                      <div style={G3.fig("micro", { color: c.inkFaint })}>{r.staff}</div>
                    </div>
                  </div>
                ),
                /* four kinds, four answers. The last branch used to be
                   overtime's, which printed "undefined h" for a rise. */
                what: kind === "claim" ? t("pyo.cat." + r.cat)
                  : kind === "loan" ? t(r.purposeKey || "pya.q.noPurpose")
                    : kind === "ot" ? t(r.periodKey)
                      : t("pya.q.fromAppr", { id: r.apprId }),
                v: kind === "claim" ? inr(r.amount)
                  : kind === "loan" ? inr(r.amountAsked)
                    : kind === "ot" ? t("pya.q.hours", { n: String(Q.otHours(r)) })
                      : "+" + r.pct + "%",
                hr: <StatusMark role="present" glyph="check" word={fmtQDate(t, r.hr ? r.hr.on : r.raisedIso)} />,
                act: (
                  <span style={{ display: "flex", justifyContent: "flex-end" }} onClick={function (e) { e.stopPropagation(); }}>
                    <ActionMenu
                      ariaLabel={t(r.personKey)} size={30}
                      items={[
                        { key: "open", icon: "document", label: t("pya.q.act.open"), onSelect: function () { onOpen(r.id); } },
                        { key: "decide", icon: "check", label: t("pya.q.act.decide"), tone: "go", onSelect: function () { onOpen(r.id, "decide"); } },
                        { key: "decline", icon: "alert", label: t("pya.q.act.decline"), tone: "danger", onSelect: function () { onOpen(r.id, "decline"); } },
                      ]}
                    />
                  </span>
                ),
              },
            };
          })}
        />
      </section>
    );
  }

  /* the request, from payroll's side: what HR confirmed, then the
     figure this desk is being asked to set. */
  function QueueRecord({ req, onAct, said }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const r = req;
    const inc = r.kind === "rise" ? Math.max(0, r.targetGross - r.currentGross) : 0;

    const facts = [
      { k: "staff", label: t("pya.q.f.staff"), value: r.staff },
      { k: "group", label: t("pya.q.f.group"), value: t(r.groupKey) },
      { k: "campus", label: t("pya.q.f.campus"), value: t(r.campusKey) },
      r.kind === "claim" ? { k: "cat", label: t("pya.q.f.cat"), value: t("pyo.cat." + r.cat) } : null,
      r.kind === "claim" ? { k: "bill", label: t("pya.q.f.bill"), value: r.billNo || "—" } : null,
      r.kind === "loan" ? { k: "purpose", label: t("pya.q.f.purpose"), value: t(r.purposeKey || "pya.q.noPurpose") } : null,
      r.kind === "loan" ? { k: "asked", label: t("pya.q.f.asked"), value: t("pya.q.months", { n: num(r.tenureAsked) }) } : null,
      r.kind === "loan" && r.hr && r.hr.recommendTenure ? { k: "rec", label: t("pya.q.f.rec"), value: t("pya.q.months", { n: num(r.hr.recommendTenure) }) } : null,
      r.kind === "loan" ? { k: "gross", label: t("pya.q.f.gross"), value: inr(r.monthlyGross) } : null,
      r.kind === "ot" ? { k: "per", label: t("pya.q.f.period"), value: t(r.periodKey) } : null,
      r.kind === "ot" ? { k: "det", label: t("pya.q.f.detected"), value: t("pya.q.hours", { n: String(r.detected) }) } : null,
      r.kind === "ot" ? { k: "src", label: t("pya.q.f.source"), value: t("pya.q.src." + r.source) } : null,
    ].filter(Boolean);

    const figure = r.kind === "claim" ? inr(r.amount)
      : r.kind === "loan" ? inr(r.amountAsked)
        : r.kind === "ot" ? t("pya.q.hours", { n: String(Q.otHours(r)) })
          : "+" + r.pct + "%";
    const figLabel = r.kind === "claim" ? t("pya.q.hero.claim")
      : r.kind === "loan" ? t("pya.q.hero.loan")
        : r.kind === "ot" ? t("pya.q.hero.ot")
          : t("pya.q.hero.rise");

    return (
      <div>
        {said ? (
          <div role="status" style={{
            display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
            border: "1px solid " + c.presentText, borderRadius: G3.r.md, background: c.presentTint,
            padding: "12px 16px", marginBottom: G3.layout.gap,
          }}>
            <span aria-hidden="true" style={{ display: "flex", color: c.presentText }}><Icon name="check" size={17} /></span>
            <span style={ty("small", { color: c.presentText, fontWeight: 600 })}>{said}</span>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: G3.layout.gap, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "3 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
            {/* a rise leads with the new gross, below; a second figure
                this size on the same panel makes the reader rank them */}
            {r.kind === "rise" ? null : (
              <section style={{ border: "1px solid " + c.borderStrong, borderRadius: G3.r.md, background: c.surface, padding: "20px 22px 18px" }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{figLabel}</div>
                <div style={G3.fig("xl", { color: c.ink, fontWeight: 700, lineHeight: 1, marginTop: 4 })}>{figure}</div>
                <p style={ty("caption", { color: c.inkMuted, margin: "14px 0 0", maxWidth: "78ch" })}>{t("pya.q.hrDid." + r.kind)}</p>
              </section>
            )}

            {/* overtime arrives as hours and leaves as money: the whole
                of what this desk adds is on this one panel */}
            {r.kind === "ot" ? <OTPriceCard req={r} /> : null}
            {r.kind === "loan" ? <LoanAskCard req={r} /> : null}
            {/* what the percentage becomes is the figure; what it is
                now and what it goes up by are the sentence. Three equal
                cells made the reader rank them. A JSX comment may not
                be a sibling of a ternary's single element, so it sits
                out here with the other children. */}
            {r.kind === "rise" ? (
              <Lead
                flush
                label={t("pya.q.riseTo")}
                value={inr(r.targetGross)}
                line={t("pya.q.riseLine", { now: inr(r.currentGross), inc: inr(inc) })}
                facts={[
                  { k: "y", label: t("pya.q.riseYear"), value: inr(inc * 12), note: t("pya.q.riseYearNote") },
                  { k: "p", label: t("pya.q.hero.rise"), value: "+" + r.pct + "%", note: t("pya.q.riseCardSub") },
                ]}
                note={t("pya.q.hrDid.rise")}
              />
            ) : null}

            <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface, padding: "18px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "18px 28px" }}>
                {facts.map(function (f) {
                  return (
                    <div key={f.k} style={{ minWidth: 0 }}>
                      <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{f.label}</div>
                      <div style={ty("small", { color: c.ink, fontWeight: 600, marginTop: 3 })}>{f.value}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div style={{ flex: "1 1 320px", minWidth: 300, display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
            <QueueRail req={r} />
            <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface, padding: "18px 20px 20px" }}>
              <h2 style={ty("h3", { margin: "0 0 3px", color: c.ink })}>{t("pya.q.actions")}</h2>
              <p style={ty("caption", { color: c.inkMuted, margin: "0 0 14px" })}>{t(Q.decisionKey(r))}</p>
              <Button kind="primary" full iconLeft="check" onClick={function () { onAct("decide"); }}>
                {r.kind === "rise" ? t("pya.q.rs.go") : t("pya.q.act.decide")}
              </Button>
              <div style={{ marginTop: 12 }}>
                <Button kind="secondary" size="sm" full onClick={function () { onAct("decline"); }}>{t("pya.q.act.decline")}</Button>
              </div>
              <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0" })}>
                {r.kind === "rise" ? t("pya.q.riseCheckerNote") : t("pya.q.checkerNote")}
              </p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  /* overtime, priced. The hours came from HR; the rate and the
     multiple come from the pinned configuration, and the Code on
     Wages puts the multiple at not less than two. */
  function OTPriceCard({ req }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const hourly = Q.otHourly(req);
    const hrs = Q.otHours(req);
    const value = hourly == null ? null : Math.round(hourly * Q.OT_MULTIPLE * hrs * 100) / 100;
    /* no pay on the row means no rate, and a screen that invents one
       would price six different people identically */
    if (hourly == null) {
      return (
        <Card title={t("pya.q.price")}>
          <StatusMark role="danger" glyph="alert" word={t("pya.q.noRate")} />
          <p style={ty("caption", { color: c.inkMuted, margin: "10px 0 0", maxWidth: "76ch" })}>{t("pya.q.noRateWhy")}</p>
        </Card>
      );
    }
    /* THE DAYS ARE THE CLAIM. Four cells reading 11 h, a rate, a
       multiple and a figure answered none of the questions an
       overtime claim raises -- which evenings, how late, and were
       they asked for. HR verified these one by one. */
    const days = req.days || [];
    const overAll = days.reduce(function (a, d) { return a + d.over; }, 0);
    const rosterAll = days.reduce(function (a, d) { return a + d.roster; }, 0);

    return (
      <div>
        <Lead
          label={t("pya.q.p.value")}
          value={inr(value)}
          line={t("pya.q.p.line", { n: String(hrs), rate: inr(hourly), mult: String(Q.OT_MULTIPLE) })}
          facts={[
            { k: "d", label: t("pya.q.p.evenings"), value: num(days.length),
              note: hrs !== req.detected ? t("pya.q.p.hoursCut", { n: String(req.detected) }) : t("pya.q.p.eveningsNote") },
            { k: "m", label: t("pya.q.p.month"), value: t("pya.q.hours", { n: String(rosterAll) }),
              note: t("pya.q.p.monthNote") },
          ]}
        />

        {days.length ? (
          <Register
            title={t("pya.q.p.daysTitle")}
            sub={t("pya.q.p.daysSub")}
            columns={[
              { key: "day", label: t("pya.q.p.col.day") },
              { key: "span", label: t("pya.q.p.col.span"), width: 150 },
              { key: "roster", label: t("pya.q.p.col.roster"), align: "end", mono: true, width: 110 },
              { key: "over", label: t("pya.q.p.col.over"), align: "end", mono: true, width: 110, weight: 700 },
            ]}
            rows={days.map(function (d) {
              return {
                id: d.iso,
                cells: {
                  day: fmtIso(d.iso),
                  span: <span style={G3.fig("sm", { color: c.inkMuted })}>{d.inT + " – " + d.outT}</span>,
                  roster: String(d.roster) + " h",
                  over: String(d.over) + " h",
                },
              };
            })}
            totals={{
              label: t("pya.q.p.daysTot", { n: num(days.length) }),
              cells: {
                day: t("pya.q.p.daysTot", { n: num(days.length) }),
                roster: String(rosterAll) + " h",
                over: String(overAll) + " h",
              },
            }}
            footer={
              <span style={ty("caption", { color: c.inkMuted, maxWidth: "80ch" })}>
                {t(hrs !== overAll ? "pya.q.p.daysFootCut" : "pya.q.p.daysFoot")}
              </span>
            }
          />
        ) : null}

        <p style={ty("caption", { color: c.inkMuted, margin: "14px 0 0", maxWidth: "80ch" })}>{t("pya.q.priceWhy")}</p>
      </div>
    );
  }

  function LoanAskCard({ req }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const year = (req.monthlyGross || 0) * 12;
    const running = req.runningOut || 0;
    const asked = req.amountAsked || 0;
    const free = Math.max(0, year - running - asked);
    const bars = [
      running ? { k: "run", v: running, color: c.chartRed, figure: inr(running), label: t("pya.q.exRunning") } : null,
      { k: "ask", v: asked, color: c.chartBlue, figure: inr(asked), label: t("pya.q.exAsked") },
      free ? { k: "free", v: free, color: c.gutter, figure: inr(free), label: t("pya.q.exFree") } : null,
    ].filter(Boolean);
    return (
      <Card title={t("pya.q.exposure")} sub={t("pya.q.exposureSub")}>
        <div style={{ display: "flex", gap: 2, height: 14, borderRadius: G3.r.pill, overflow: "hidden", background: c.gutter, marginTop: 4 }}>
          {bars.map(function (b) { return <span key={b.k} aria-hidden="true" style={{ flex: Math.max(0.0001, b.v), background: b.color }} />; })}
        </div>
        <div style={ty("caption", { color: c.inkFaint, marginTop: 6, textAlign: "end" })}>{t("pya.q.exYear", { v: inr(year) })}</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
          {bars.map(function (b) {
            return (
              <span key={b.k} style={ty("caption", { display: "inline-flex", alignItems: "baseline", gap: 7, color: c.inkMuted })}>
                <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 3, background: b.color, alignSelf: "center" }} />
                <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{b.figure}</span>
                <span>{b.label}</span>
              </span>
            );
          })}
        </div>
      </Card>
    );
  }

  /* ---- the decision itself, one panel per kind ---- */
  function DecidePanel({ req, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const isLoan = req.kind === "loan";
    const isOT = req.kind === "ot";
    const [principal, setPrincipal] = useState(isLoan ? String(req.amountAsked) : "");
    const [tenure, setTenure] = useState(isLoan ? String((req.hr && req.hr.recommendTenure) || req.tenureAsked) : "");
    const [rate, setRate] = useState("0");
    const [batch, setBatch] = useState(Q.RUN_OPEN);
    const emi = isLoan ? Q.emiFor(Number(principal) || 0, Number(tenure) || 0, Number(rate) || 0) : 0;
    const hourly = isOT ? Q.otHourly(req) : 0;
    const value = isOT && hourly != null ? Math.round(hourly * Q.OT_MULTIPLE * Q.otHours(req) * 100) / 100 : null;
    const ready = isLoan
      ? Number(principal) > 0 && Number(tenure) > 0
      : isOT ? hourly != null : true;

    return (
      <Modal
        title={t("pya.q.d.title." + req.kind)} sub={t(req.personKey) + " · " + req.id} onClose={onClose} width={560}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", width: "100%" }}>
            <Button kind="secondary" onClick={onClose}>{t("pya.q.cancel")}</Button>
            <Button kind="primary" disabled={!ready} onClick={function () {
              onDone({
                batch: batch,
                principal: isLoan ? Number(principal) : undefined,
                tenure: isLoan ? Number(tenure) : undefined,
                rate: isLoan ? Number(rate) : undefined,
                emi: isLoan ? emi : undefined,
                hourly: isOT ? hourly : undefined,
                multiple: isOT ? Q.OT_MULTIPLE : undefined,
                value: isOT ? value : undefined,
              });
            }}>{t("pya.q.d.go")}</Button>
          </div>
        }
      >
        <p style={ty("small", { color: c.ink, margin: "0 0 16px", maxWidth: "62ch" })}>{t("pya.q.d.body." + req.kind)}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isLoan ? (
            <React.Fragment>
              <Field id="pya-q-pr" label={t("pya.q.d.principal")} hint={t("pya.q.d.principalHint", { v: inr(req.amountAsked) })}>
                <Input id="pya-q-pr" value={principal} onChange={setPrincipal} inputMode="numeric" />
              </Field>
              <Field id="pya-q-tn" label={t("pya.q.d.tenure")} hint={t("pya.q.d.tenureHint", { n: num((req.hr && req.hr.recommendTenure) || req.tenureAsked) })}>
                <Input id="pya-q-tn" value={tenure} onChange={setTenure} inputMode="numeric" />
              </Field>
              <Field id="pya-q-rt" label={t("pya.q.d.rate")}>
                <Input id="pya-q-rt" value={rate} onChange={setRate} inputMode="decimal" />
              </Field>
              <div style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.alt, padding: "14px 16px" }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("pya.q.d.emi")}</div>
                <div style={G3.fig("lg", { color: c.ink, fontWeight: 700, marginTop: 4 })}>{inr(emi)}</div>
                <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>{t("pya.q.d.emiWhy")}</p>
              </div>
            </React.Fragment>
          ) : null}

          {isOT && hourly == null ? (
            <StatusMark role="danger" glyph="alert" word={t("pya.q.noRate")} />
          ) : null}
          {isOT && hourly != null ? (
            <div style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.alt, padding: "14px 16px" }}>
              <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("pya.q.p.value")}</div>
              <div style={G3.fig("lg", { color: c.ink, fontWeight: 700, marginTop: 4 })}>{inr(value)}</div>
              <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>
                {t("pya.q.d.otWhy", { h: String(Q.otHours(req)), r: inr(hourly) })}
              </p>
            </div>
          ) : null}

          <Field id="pya-q-b" label={t("pya.q.d.batch")} hint={t("pya.q.d.batchHint")}>
            <Select id="pya-q-b" value={batch} onChange={setBatch} ariaLabel={t("pya.q.d.batch")}
              options={[
                { value: Q.RUN_OPEN, label: Q.RUN_OPEN },
                { value: "PR-2026-11", label: "PR-2026-11" },
              ]} />
          </Field>
        </div>
      </Modal>
    );
  }

  function DeclinePanel({ req, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const list = ["pq.dec.r.notCovered", "pq.dec.r.duplicate", "pq.dec.r.exposure", "pq.dec.r.other"];
    const [reason, setReason] = useState(list[0]);
    const [note, setNote] = useState("");
    const needNote = reason.indexOf(".other") >= 0;
    return (
      <Modal
        title={t("pya.q.x.title")} sub={t(req.personKey) + " · " + req.id} onClose={onClose} width={540} danger
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", width: "100%" }}>
            <Button kind="secondary" onClick={onClose}>{t("pya.q.cancel")}</Button>
            <Button kind="danger" disabled={needNote && !note.trim()}
              onClick={function () { onDone({ reasonKey: reason, note: note }); }}>{t("pya.q.act.decline")}</Button>
          </div>
        }
      >
        <p style={ty("small", { color: c.ink, margin: "0 0 16px", maxWidth: "62ch" })}>{t("pya.q.x.body")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field id="pya-q-xr" label={t("pya.q.x.reason")}>
            <Select id="pya-q-xr" value={reason} onChange={setReason} ariaLabel={t("pya.q.x.reason")}
              options={list.map(function (k) { return { value: k, label: t(k) }; })} />
          </Field>
          <Field id="pya-q-xn" label={t("pya.q.x.note")}>
            <Input id="pya-q-xn" value={note} onChange={setNote} />
          </Field>
        </div>
      </Modal>
    );
  }

  /* OVERTIME. New here, because overtime had no home on this desk at
     all: HR verified hours and nothing read them. The tab is the
     queue plus what this desk has already priced. */
  function OvertimeTab({ onOpen, campus }) {
    const { c } = useTheme();
    const { t } = useLang();
    if (!Q) return <Card><EmptyState head={t("pya.none")} /></Card>;
    const settled = onCampus(campus, Q.byKind("ot")).filter(function (r) { return r.state === "approved" || r.state === "paid"; });
    return (
      <div>
        <IncomingQueue kind="ot" onOpen={onOpen} />
        {settled.length ? (
          <Register
            title={t("pya.q.ot.doneTitle")}
            sub={t("pya.q.ot.doneSub")}
            onSelect={onOpen}
            columns={[
              { key: "who", label: t("pya.q.col.who") },
              { key: "per", label: t("pya.q.f.period"), width: 170 },
              { key: "h", label: t("pya.q.col.hoursShort"), align: "right", mono: true, width: 110 },
              { key: "v", label: t("pya.q.p.value"), align: "right", mono: true, width: 150, weight: 700 },
              { key: "st", label: t("pya.q.col.state"), width: 150 },
            ]}
            rows={settled.map(function (r) {
              return {
                id: r.id,
                tone: r.state === "paid" ? "dim" : undefined,
                cells: {
                  who: t(r.personKey),
                  per: t(r.periodKey),
                  h: t("pya.q.hours", { n: String(Q.otHours(r)) }),
                  v: r.payroll && r.payroll.value != null ? inr(r.payroll.value) : "\u2014",
                  st: r.state === "paid"
                    ? <StatusMark role="present" glyph="check" word={t("pya.q.st.paid")} />
                    : <StatusMark role="leave" glyph="clock" word={t("pya.q.st.approved")} />,
                },
              };
            })}
          />
        ) : (
          <Card><EmptyState head={t("pya.q.ot.noneHead")} body={t("pya.q.ot.noneBody")} /></Card>
        )}
      </div>
    );
  }

  /* APPRAISAL RISES. HR agreed a percentage and entered no amount at
     all; turning it into components is this desk's whole job here.
     The settle panel writes through to pay-handoff, which is the same
     state Staff & salaries reads -- two surfaces, one record, so they
     cannot drift apart. */
  function RisesTab({ onOpen, campus }) {
    const { c } = useTheme();
    const { t } = useLang();
    if (!Q) return <Card><EmptyState head={t("pya.none")} /></Card>;
    const settled = onCampus(campus, Q.byKind("rise")).filter(function (r) { return r.state !== "withPayroll"; });
    return (
      <div>
        <IncomingQueue kind="rise" onOpen={onOpen} />
        {settled.length ? (
          <Register
            title={t("pya.q.rise.doneTitle")}
            sub={t("pya.q.rise.doneSub")}
            onSelect={onOpen}
            columns={[
              { key: "who", label: t("pya.q.col.who") },
              { key: "pct", label: t("pya.q.col.pct"), align: "right", mono: true, width: 110, weight: 700 },
              { key: "from", label: t("pya.q.riseNow"), align: "right", mono: true, width: 150 },
              { key: "to", label: t("pya.q.col.settled"), align: "right", mono: true, width: 160 },
              { key: "st", label: t("pya.q.col.state"), width: 150 },
            ]}
            rows={settled.map(function (r) {
              return {
                id: r.id,
                tone: r.state === "declined" ? "dim" : undefined,
                cells: {
                  who: t(r.personKey),
                  pct: "+" + r.pct + "%",
                  from: inr(r.currentGross),
                  to: r.payroll && r.payroll.gross != null ? inr(r.payroll.gross) : "\u2014",
                  st: r.state === "declined"
                    ? <StatusMark role="danger" glyph="alert" word={t("pya.q.st.declined")} />
                    : <StatusMark role="present" glyph="check" word={t("pya.q.st.approved")} />,
                },
              };
            })}
          />
        ) : (
          <Card><EmptyState head={t("pya.q.rise.noneHead")} body={t("pya.q.rise.noneBody")} /></Card>
        )}
      </div>
    );
  }

  /* the breakdown a percentage becomes. Gross opens on the arithmetic
     and is editable, because landing somewhere else is the officer's
     prerogative; basic and HRA are the two components the structure
     actually turns on, and what is left falls to other allowances --
     derived, never typed, so the three always sum to the gross. */
  function SettleRisePanel({ req, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [gross, setGross] = useState(String(Math.round(req.targetGross)));
    const [basicPct, setBasicPct] = useState("50");
    const [hraPct, setHraPct] = useState("40");
    const [from, setFrom] = useState("2026-11-01");
    const g = Number(gross) || 0;
    const basic = Math.round(g * (Number(basicPct) || 0) / 100);
    const hra = Math.round(basic * (Number(hraPct) || 0) / 100);
    const other = g - basic - hra;
    const ok = g > 0 && basic > 0 && other >= 0;
    const delta = g - req.currentGross;
    const realPct = req.currentGross ? Math.round((delta / req.currentGross) * 1000) / 10 : 0;

    return (
      <Modal
        title={t("pya.q.rs.title")} sub={t(req.personKey) + " \u00b7 " + req.id} onClose={onClose} width={580}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", width: "100%" }}>
            <Button kind="secondary" onClick={onClose}>{t("pya.q.cancel")}</Button>
            <Button kind="primary" disabled={!ok} onClick={function () {
              onDone({
                gross: g, basic: basic, effectiveFrom: from,
                lines: [
                  { key: "pya.q.rs.l.basic", v: basic },
                  { key: "pya.q.rs.l.hra", v: hra },
                  { key: "pya.q.rs.l.other", v: other },
                ],
              });
            }}>{t("pya.q.rs.go")}</Button>
          </div>
        }
      >
        <p style={ty("small", { color: c.ink, margin: "0 0 16px", maxWidth: "62ch" })}>
          {t("pya.q.rs.body", { pct: req.pct, v: inr(req.currentGross) })}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field id="pya-rs-g" label={t("pya.q.rs.gross")} hint={t("pya.q.rs.grossHint", { v: inr(req.targetGross) })}>
            <Input id="pya-rs-g" value={gross} onChange={setGross} inputMode="numeric" />
          </Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field id="pya-rs-b" label={t("pya.q.rs.basicPct")}>
                <Input id="pya-rs-b" value={basicPct} onChange={setBasicPct} inputMode="decimal" />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field id="pya-rs-h" label={t("pya.q.rs.hraPct")}>
                <Input id="pya-rs-h" value={hraPct} onChange={setHraPct} inputMode="decimal" />
              </Field>
            </div>
          </div>

          <div style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.alt, padding: "14px 16px" }}>
            {[
              { k: "b", label: t("pya.q.rs.l.basic"), v: basic },
              { k: "h", label: t("pya.q.rs.l.hra"), v: hra },
              { k: "o", label: t("pya.q.rs.l.other"), v: other, bad: other < 0 },
            ].map(function (l, i) {
              return (
                <div key={l.k} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12,
                  padding: i ? "9px 0 0" : 0,
                }}>
                  <span style={ty("small", { color: l.bad ? c.dangerText : c.ink, fontWeight: 600 })}>{l.label}</span>
                  <span style={G3.fig("sm", { color: l.bad ? c.dangerText : c.ink, fontWeight: 700 })}>{inr(l.v)}</span>
                </div>
              );
            })}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12,
              marginTop: 11, paddingTop: 11, borderTop: "2px solid " + (c.ruleStrong || c.rule),
            }}>
              <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("pya.q.rs.l.gross")}</span>
              <span style={G3.fig("md", { color: c.ink, fontWeight: 700 })}>{inr(g)}</span>
            </div>
            <p style={ty("caption", { color: c.inkMuted, margin: "10px 0 0" })}>
              {other < 0
                ? t("pya.q.rs.negative")
                : t("pya.q.rs.lands", { pct: String(realPct), asked: String(req.pct) })}
            </p>
          </div>

          <Field id="pya-rs-f" label={t("pya.q.rs.from")} hint={t("pya.q.rs.fromHint")}>
            <Select id="pya-rs-f" value={from} onChange={setFrom} ariaLabel={t("pya.q.rs.from")}
              options={[
                { value: "2026-11-01", label: t("pya.q.rs.nov") },
                { value: "2026-12-01", label: t("pya.q.rs.dec") },
              ]} />
          </Field>
        </div>
      </Modal>
    );
  }

  /* ============================================================
     THE MODULE.
     ============================================================ */
  function PYAdjust({ role, onNavigate }) {
    /* the officer holds both campuses; everything below answers this */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t } = useLang();
    const [tab, setTab] = useState("loans");
    const [openId, setOpenId] = useState(null);
    const [done, setDone] = useState(null);
    const [batched, setBatched] = useState({});
    const [qPanel, setQPanel] = useState(null);     /* decide | decline */
    const [qSaid, setQSaid] = useState(null);
    Q && Q.usePayRequests();

    if (!A) {
      return (
        <Shell campus={campus} onCampus={setCampus} role={role} onNavigate={onNavigate} title={t("pya.title")}>
          <Card><EmptyState head={t("pya.none")} /></Card>
        </Shell>
      );
    }

    const chips = (
      <React.Fragment>
        <Chip bg={c.sunken} fg={c.inkMuted} mono>{t("pya.run")}</Chip>
        <StatusMark role="late" glyph="clock" word={t("pya.awaiting")} />
      </React.Fragment>
    );

    function closeRecord() {
      setOpenId(null); setDone(null); setQPanel(null); setQSaid(null);
    }

    function openQ(id, act) { setOpenId(id); setQSaid(null); setQPanel(act || null); }

    /* WHAT IS OPEN, worked out once. A request HR sent over, a loan,
       a claim or an arrears run -- each knows its own title and the
       component that reads it, and the panel below draws whichever
       it is. */
    const qReq = openId && Q ? Q.byId(openId) : null;
    let record = null;
    if (qReq) {
      record = {
        title: t(qReq.personKey),
        sub: qReq.id + " \u00b7 " + t("pya.q.kind." + qReq.kind) + " \u00b7 " + t(qReq.campusKey),
        avatar: t(qReq.personKey),
        body: <QueueRecord req={qReq} said={qSaid} onAct={function (a) { setQPanel(a); }} />,
      };
    } else if (openId) {
      const loan = A.LOANS.filter(function (l) { return l.id === openId; })[0];
      const cl = A.CLAIMS.filter(function (x) { return x.id === openId; })[0];
      const ar = A.ARREARS.filter(function (x) { return x.id === openId; })[0];
      if (loan) {
        record = {
          title: t(loan.personKey), sub: loan.id + " \u00b7 " + t("pya.l.kind." + loan.kind),
          avatar: t(loan.personKey),
          body: <LoanRecord loan={loan} onBack={closeRecord} onDone={setDone} />,
        };
      } else if (cl) {
        const inB = batched[cl.id] !== false;
        record = {
          title: t(cl.personKey), sub: cl.id + " \u00b7 " + t(A.CLAIM_CATS[cl.cat].labelKey),
          avatar: t(cl.personKey),
          body: (
            <ClaimRecord
              claim={cl} inBatch={inB}
              onToggle={function () { setBatched(Object.assign({}, batched, { [cl.id]: !inB })); }}
              onDone={setDone}
            />
          ),
        };
      } else if (ar) {
        record = { title: ar.id, sub: t(ar.sourceKey), width: 860, body: <ArrearsRecord arr={ar} /> };
      }
    }

    const items = [
      { key: "loans", label: t("pya.tab.loans") },
      { key: "claims", label: t("pya.tab.claims") },
      { key: "ot", label: t("pya.tab.ot") },
      { key: "rise", label: t("pya.tab.rise") },
      { key: "arrears", label: t("pya.tab.arrears") },
    ];

    return (
      <Shell campus={campus} onCampus={setCampus}
        role={role} onNavigate={onNavigate} title={t("pya.title")} chips={chips}
        tabs={<Tabs items={items} active={tab} onChange={function (k) { setTab(k); setOpenId(null); setDone(null); setQPanel(null); setQSaid(null); }} ariaLabel={t("pya.tabs.aria")} idBase="pyadj" />}
      >
        <div style={{ marginTop: G3.layout.gap }}>
          {done ? <div role="status" style={{ marginBottom: G3.layout.gap }}><Card><StatusMark role="present" glyph="check" word={done} /></Card></div> : null}
          {tab === "loans" ? (
            <TabPanel idBase="pyadj" tabKey="loans">
              <IncomingQueue kind="loan" campus={campus} onOpen={openQ} />
              <LoansTab campus={campus} onOpen={setOpenId} />
            </TabPanel>
          ) : null}
          {tab === "claims" ? (
            <TabPanel idBase="pyadj" tabKey="claims">
              <IncomingQueue kind="claim" campus={campus} onOpen={openQ} />
              <ClaimsTab campus={campus} onOpen={setOpenId} batched={batched} />
            </TabPanel>
          ) : null}
          {tab === "ot" ? <TabPanel idBase="pyadj" tabKey="ot"><OvertimeTab campus={campus} onOpen={openQ} /></TabPanel> : null}
          {tab === "rise" ? <TabPanel idBase="pyadj" tabKey="rise"><RisesTab campus={campus} onOpen={openQ} /></TabPanel> : null}
          {tab === "arrears" ? <TabPanel idBase="pyadj" tabKey="arrears"><ArrearsTab onOpen={setOpenId} /></TabPanel> : null}
        </div>

        {/* ---- the record, beside its list ---- */}
        {record ? (
          <SideScreen
            title={record.title} sub={record.sub} width={record.width || 760}
            avatar={record.avatar} onClose={closeRecord}
          >
            {done ? (
              <div role="status" style={{ marginBottom: G3.layout.gap }}>
                <Card><StatusMark role="present" glyph="check" word={done} /></Card>
              </div>
            ) : null}
            {record.body}
          </SideScreen>
        ) : null}

        {/* ---- and the one question a record may ask, over it ---- */}
        {qReq && qPanel === "decide" && qReq.kind === "rise" ? (
          <SettleRisePanel req={qReq} onClose={function () { setQPanel(null); }}
            onDone={function (payload) {
              Q.payrollApprove(qReq.id, payload);
              setQPanel(null);
              setQSaid(t("pya.q.rs.done", { v: inr(payload.gross) }));
            }} />
        ) : null}
        {qReq && qPanel === "decide" && qReq.kind !== "rise" ? (
          <DecidePanel req={qReq} onClose={function () { setQPanel(null); }}
            onDone={function (payload) {
              Q.payrollApprove(qReq.id, payload);
              setQPanel(null);
              setQSaid(t("pya.q.d.done", { run: payload.batch }));
            }} />
        ) : null}
        {qReq && qPanel === "decline" ? (
          <DeclinePanel req={qReq} onClose={function () { setQPanel(null); }}
            onDone={function (payload) {
              Q.payrollDecline(qReq.id, payload);
              setQPanel(null);
              setQSaid(t("pya.q.x.done"));
            }} />
        ) : null}
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.PYAdjust = PYAdjust;
})();
