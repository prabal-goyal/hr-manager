/* @jsxRuntime classic */
/* ============================================================
   Naveya — Payroll Operator · window.Pages3.PYHome / PYRun

   THREE SCREENS, ONE FILE, ONE DATASET
   · PY-01 Payroll home        — "where is this month's payroll, and
                                  what is holding it up?"
   · PY-07 Payroll run console — "is this month's payroll correct
                                  enough to approve?"
   · PY-08 Paid-days reconcil. — "why does this person's paid-days
                                  figure say what it says?"

   SPEC — docs/screen-inventory.md PY-01 / PY-07 / PY-08 (each action
   table built in full, honouring offered / disabled-with-reason /
   absent), against docs/development-specification.md:
     M9  §Business rules  — paid-days = present + paid-leave +
                            holidays + weekly-offs − LOP
     M9  §Acceptance      — paid-days for a mid-month joiner
     M10 §Workflow        — start -> paid days -> per-pay-group logic
                            -> statutory (pinned) -> variance -> approve
                            -> lock -> bank file
     M10 §Business rules  — variance review before approval; pins
                            StatutoryConfig; locked payslips; NEFT file
     M10 "Compute vs release" — release is NEVER one click and always
                            needs a distinct checker (payroll.approve)
     M11 / §4.4           — StatutoryConfig is immutable + versioned;
                            each run pins the version it used
     §8                   — maker-checker; append-only audit

   THE FOUR DEFECTS FOUND IN THE PRE-V3 PAYROLL CONSOLE
   (docs/ui-compliance-requirements.md §8-F3/F5/F6/F7), and where each
   is answered here:

   1. SESSION vs PERSON (F3). "Requires the checker's own session" is
      satisfied by the same operator in a second browser. Every screen
      here names two PEOPLE — Sunita Kulkarni (maker, NAV-0031,
      payroll.run) and Rajiv Menon (checker, NAV-0009, payroll.approve)
      — with role and staff ID, side by side, from the moment the run
      exists. The Approve control is ABSENT on this role's screens for
      two independently sufficient reasons, both printed: this person
      prepared the run, and this role does not hold `payroll.approve`.
      See SignOff.

   2. NO RETURN-TO-MAKER PATH (F7). Two directions exist and both are
      built: the checker's return is on the run's trail as a real,
      dated, attributed event with its reason (the run WAS returned
      once and re-submitted); and the maker's own reverse path —
      "Recall from the checker" — is live, and refuses to proceed
      without a reason. Neither direction is a dead end.

   3. NO REASON OR ATTRIBUTION (F8/O6). Nothing consequential happens
      without ReasonPrompt: a controlled reason code PLUS a note, then
      a confirm. Every transition on the trail carries who, when, and
      why. The trail is append-only — recalling the run APPENDS an
      entry, it never rewrites one — and says so in words.

   4. HARDCODED THRESHOLD + SUPPRESSED VARIANCES (F5/F6). The variance
      gate lives in PAY_POLICY, a versioned, effective-dated, published
      policy object, rendered with its version, its effective date and
      who set it — never typed into copy. And nothing is auto-cleared:
      the variance register lists EVERY person whose net moved, marks
      which crossed the gate and which did not, and the operator
      dismisses one only by explaining it.

   WHAT THIS FILE DELIBERATELY REFUSES
   · No statutory rate, percentage, ceiling or slab is printed. Every
     statutory figure is an AMOUNT plus the config version it was read
     from. (The ONE percentage on these screens is the variance
     flagging gate — an operational policy constant, not a statutory
     one — and it is rendered from PAY_POLICY with full provenance.)
   · No re-typed money. Every headline is summed from its parts at
     render time; gross − deductions = net and net − held = net
     payable, in the DOM, both languages, both themes.
   · No full bank account, anywhere, for anyone — payroll included.
   · No Approve, no bank-file generation, no disbursement control on a
     maker's screen. No one-click anything that moves money.
   · No money on PY-08 at all (the inventory forbids it there): a
     post-freeze correction is stated in DAYS, and its price is decided
     on the run.
   · No "auto-clear", no hidden rows, no "N items cleared below the
     gate".

   CROSS-SCREEN ARITHMETIC (a figure that disagrees across screens
   destroys trust in all of them):
   · MONTHLY_GROSS_REF 94,800.00 and a day priced at gross/30 are the
     same as pages/attendance.jsx and pages/leave.jsx.
   · The maker and checker names, run ids and pinned config versions
     are pages/payslips.jsx's: PR-2026-08 prepared by Sunita Kulkarni
     and awaiting a different approver; July's PR-2026-07 approved by
     Rajiv Menon; v2026.2 from 1 April, v2026.3 from 1 July.
   · Ananya Rao (NAV-0142) has 31 of 31 paid days in August, as her
     payslip screen says of July.

   Composed only from window.G3 / window.UI3. Nothing outside this
   file is edited; primitives the kit lacks are defined locally and
   listed as promotion candidates at the bottom.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark, Seal,
    Figure, Icon, EmptyState, Select, Input, Field, Switch, Tabs, TabPanel,
    ActionMenu, SideScreen, Avatar, inr, num,
    campusOptions, inCampus, campusOfCode, CAMPUS_ALL,
  } = UI;

  /* ============================================================
     STRINGS — py.* (shared), py1.* (PY-01), py7.* (PY-07),
     py8.* (PY-08). English and Hindi are authored key-for-key; the
     verification pass asserts exact parity rather than trusting it.
     Demo content is translated too — a mock row that stays English in
     a Hindi UI is a leak, not a placeholder.
     ============================================================ */
  addStrings({
    en: {
      /* ---------- shared ---------- */
      "py.entity": "Sunrise Education Trust",
      "py.entityAlt": "Sunrise Foundation (Pre-school)",
      "py.entityScope": "Payroll runs by legal entity, across every campus. A campus is a filter inside a run, never the edge of one.",
      "py.roleMaker": "Payroll Officer",
      "py.roleChecker": "Accountant",
      "py.roleHead": "Department Head",
      "py.roleHR": "HR Officer",
      "py.maker": "Sunita Kulkarni",
      "py.checker": "Rajiv Menon",
      "py.hrOfficer": "Kavita Sharma",
      "py.deptHead": "Ramesh Bhatt",

      "py.mon.4": "April", "py.mon.5": "May", "py.mon.6": "June",
      "py.mon.7": "July", "py.mon.8": "August", "py.mon.9": "September",
      "py.period": "{mon} 2026",
      "py.staffN": "{n} staff",
      "py.peopleN": "{n} people",
      "py.daysN": "{n} days",

      "py.reason.label": "Reason",
      "py.reason.pick": "Choose a reason",
      "py.reason.note": "What should the record say?",
      "py.reason.notePh": "In your own words, for whoever reads this in a year",
      "py.reason.errPick": "Choose a reason. It goes on the record with your name and cannot be taken off.",
      "py.reason.errNote": "Write the note too. A reason code on its own does not explain a money decision.",
      "py.confirm": "Confirm",
      "py.cancel": "Cancel",
      "py.by": "{who} · {role} · {id}",
      "py.disabledWhy": "Why this is off",
      "py.absentWhy": "Why this is not here",
      "py.appendOnly": "This record is added to, never edited. A correction becomes a new entry beside the old one.",
      "py.justNow": "just now",

      "py.st.draft": "Draft",
      "py.st.computed": "Computed",
      "py.st.variance": "Variance review",
      "py.st.awaiting": "Awaiting checker",
      "py.st.approved": "Approved",
      "py.st.disbursed": "Disbursed",
      "py.st.notStarted": "Not started",
      "py.st.clear": "Clear",

      /* ---------- PY-01 ---------- */
      "py1.title": "Payroll",
      "py1.q": "Where is this month's payroll, and what is holding it up?",
      "py1.entityLabel": "Legal entity",
      "py1.periodLabel": "Period",

      "py1.hero.kicker": "This month",
      "py1.hero.state": "{mon} 2026 is with the checker",
      "py1.hero.netLabel": "Net payable to staff",
      "py1.hero.netNote": "{n} people paid · {h} held · computed on {v}",
      "py1.hero.waiting": "Waiting on {who}, {role}. You prepared this run, so you cannot be the one who approves it.",
      "py1.hero.since": "Signed and sent 10 August. Nothing moves until a second person approves.",
      "py1.hero.open": "Open the run console",
      "py1.hero.paidDays": "Open paid days",

      "py1.ready.title": "Readiness",
      "py1.ready.sub": "Four checks stand between a period and a compute. Each says where to fix it.",
      "py1.ready.paidDays": "Paid days reconciled",
      "py1.ready.paidDaysOk": "Frozen for {run} on 8 August · {n} staff",
      "py1.ready.salary": "Everyone has a salary",
      "py1.ready.salaryOk": "No one in this entity is without a structure or an honorarium rule",
      "py1.ready.joiners": "Joiners inside the period",
      "py1.ready.joinersOk": "Everyone who joined mid-month is priced from their joining date — {n} this period",
      "py1.ready.inclusions": "Loans and claims attached",
      "py1.ready.inclusionsOk": "{n} loan EMIs are inside the run; 1 reimbursement batch is attached and approved separately",
      "py1.ready.open": "Open",

      "py1.cal.title": "Statutory calendar",
      "py1.cal.sub": "What this run feeds, and when it is due. Read from the calendar, not typed on this screen.",
      "py1.cal.ecr": "PF ECR — August",
      "py1.cal.esi": "ESI contribution — August",
      "py1.cal.tds": "TDS deposit — August",
      "py1.cal.pt": "Professional tax — August",
      "py1.cal.due": "Due {d}",
      "py1.cal.blocked": "Nothing can be filed until the run is approved.",
      "py1.cal.note": "Filing is the Accountant's work. This is only the dependency running the other way.",

      "py1.hist.title": "This session, month by month",
      "py1.hist.sub": "One row per period, with the config version each run pinned and what it paid.",
      "py1.col.period": "Period",
      "py1.col.run": "Run",
      "py1.col.state": "State",
      "py1.col.net": "Net payable",
      "py1.col.cfg": "Config pinned",
      "py1.col.act": "Action",
      "py1.hist.start": "Start the run",
      "py1.hist.startOff": "August is not approved yet. Starting September now would corrupt August's arrears.",
      "py1.hist.exists": "A run already exists for this period.",
      "py1.hist.open": "Open",
      "py1.hist.totals": "Disbursed so far this session · {n} runs",
      "py1.hist.note": "A run pins the version in force in ITS month. July still computes on {v}; reopening it does not move it onto a newer one.",

      "py1.else.title": "Waiting elsewhere",
      "py1.else.ff": "Full and final settlements",
      "py1.else.ffN": "{n} awaiting preparation",
      "py1.else.ffNote": "Their names stay on the settlement screen. A home board is not the place to publish someone's exit.",
      "py1.else.batch": "Reimbursement payout batch",
      "py1.else.batchN": "{n} claims, attached to {run}",
      "py1.else.batchNote": "A payout batch is money leaving the school, so it carries its own checker. Approving the run does not approve the batch.",
      "py1.else.open": "Open",

      /* ---------- PY-07 ---------- */
      "py7.title": "Payroll run",
      "py7.q": "Is this month's payroll correct enough for someone else to approve?",
      "py7.head.meta": "{entity} · {mon} 2026 · {n} staff in {g} pay groups",
      "py7.cfg.chip": "Computed on {v}",
      "py7.cfg.detail": "{v}, in force from {d}, is pinned to this run. A later change to the rules does not rewrite it.",
      "py7.cfg.newer": "A newer version ({v}) is effective {d}. It applies from September onward \u2014 not to this run, and not to anything already paid.",
      "py7.cfg.noRates": "No rate, ceiling or slab is printed on this screen. What a checker can verify is the amount and the version it came from.",

      "py7.stage.title": "Where the run stands",
      "py7.stage.sub": "Six stages. Nothing skips one, and nothing here is a single click.",
      "py7.stage.s1": "Started",
      "py7.stage.s1d": "7 August · August 2026, all three pay groups, {v} pinned",
      "py7.stage.s2": "Computed",
      "py7.stage.s2d": "8 August · {n} payslips drafted in 4 min 12 s",
      "py7.stage.s2n": "Compute is idempotent: a retry resumes the same job and never pays twice. Nothing failed this month.",
      "py7.stage.s3": "Variance review",
      "py7.stage.s3d": "{n} people moved · {f} crossed the gate · {u} still unexplained",
      "py7.stage.s4": "Awaiting checker",
      "py7.stage.s4d": "Sent 10 August · with {who}",
      "py7.stage.s4dRecalled": "Recalled by you. The run is open again and the checker no longer holds it.",
      "py7.stage.s5": "Approved",
      "py7.stage.s5d": "Not yet. A different person must approve it.",
      "py7.stage.s6": "Disbursed",
      "py7.stage.s6d": "Bank file and payment come after approval, from the Accountant.",
      "py7.stage.s6n": "The bank file carries every account number in the school. Generated once, after approval, by someone else, and every download recorded.",

      "py7.act.recompute": "Recompute",
      "py7.act.recomputeOff": "Locked while the checker holds the run. Recall it first.",
      "py7.act.recomputeOn": "Replaces the draft payslips. The discarded draft stays on the record.",
      "py7.act.variance": "Open the variances",
      "py7.act.submit": "Sign and send for approval",
      "py7.act.submitOff": "Already signed and sent. {who} has it.",
      "py7.act.discard": "Discard the run",
      "py7.act.discardOff": "Only a draft can be discarded. This one is computed and signed, so its history stays.",
      "py7.act.approve": "Approve and release",
      "py7.act.approveAbsent": "Approve is not on this screen — and that is the control working",
      "py7.act.approveWhy": "You prepared this run, and this role does not hold payroll.approve. Either reason alone is enough.",
      "py7.act.approveServer": "It is refused on the server too, not merely left off the screen.",

      "py7.so.title": "Sign-off",
      "py7.so.sub": "Two people, named, with their staff IDs. That is the whole control.",
      "py7.so.rule": "Whoever prepares a run can never approve it \u2014 not in another browser, not with a second login. A different person, or it does not go.",
      "py7.so.makerHead": "Maker — prepared and signed by",
      "py7.so.checkerHead": "Checker — approves and releases",
      "py7.so.signed": "Signed 10 August, 11:05",
      "py7.so.digest": "Snapshot {x}",
      "py7.so.waiting": "Holding it since 10 August, 11:05",
      "py7.so.waitingNone": "Waiting for a different approver",
      "py7.so.openAgain": "Open again with you — the checker is not holding it",
      "py7.so.locked": "Locked after submission. You cannot change a figure while the run is with the checker.",
      "py7.so.unlocked": "Open. Recompute, explain a variance or release a hold — then sign it again.",
      "py7.so.returnedOnce": "Returned to you once already, on 9 August, with a reason. That path is always open to the checker.",
      "py7.so.willDo": "{who} re-authenticates, types the period, and confirms the exact net payable and headcount. Approval is never a single click.",
      "py7.so.recall": "Recall from the checker",
      "py7.so.recallNote": "This takes the run back from {who} and tells them why.",

      "py7.recall.title": "Recall this run",
      "py7.recall.body": "{who} stops seeing it, the run reopens for you, and your reason goes to them and onto the run's record.",
      "py7.recall.r1": "Figures need correcting",
      "py7.recall.r2": "Attendance changed after compute",
      "py7.recall.r3": "An inclusion is missing",
      "py7.recall.r4": "Sent by mistake",
      "py7.recall.done": "Recalled. The run is yours again and the trail says why.",

      "py7.submit.title": "Sign and send for approval",
      "py7.submit.body": "Check these three against your own working. Your signature is a statement about work you did.",
      "py7.submit.net": "Net payable to bank",
      "py7.submit.payees": "People paid",
      "py7.submit.held": "Held — not paid this cycle",
      "py7.submit.to": "Goes to {who}, {role}, {id}",
      "py7.submit.ack": "I have reviewed this run and I am signing it",
      "py7.submit.ackErr": "Tick the line above first. Signing is not a formality.",
      "py7.submit.go": "Sign and send",
      "py7.submit.done": "Signed and sent to {who}.",

      "py7.tot.title": "What this run pays",
      "py7.tot.sub": "Every figure here is the sum of the lines beneath it. Nothing on this card is typed in.",
      "py7.tot.gross": "Gross earnings",
      "py7.tot.ded": "Less deductions",
      "py7.tot.net": "Net",
      "py7.tot.held": "Less payouts held",
      "py7.tot.payable": "Net payable to bank",
      "py7.tot.employer": "The school pays on top",
      "py7.tot.employerNote": "Employer contributions. Not deducted from anyone and not part of the net above — they go to the staff member's own accounts.",
      "py7.tot.ok": "Gross less deductions is the net; net less holds is what leaves the bank. Checked against the figures you can see.",
      "py7.tot.fail": "These figures do not reconcile. Do not sign and do not approve this run.",

      "py7.block.title": "What is holding this run",
      "py7.block.sub": "Everything that would stop a checker, in one place, whether or not it blocks.",
      "py7.block.inputs": "Inputs changed after compute",
      "py7.block.inputsD": "{p} people, {d} paid days, corrected after paid days were frozen. Recompute, or pay the difference as arrears.",
      "py7.block.inputsAct": "Open paid days",
      "py7.block.exc": "Open exceptions",
      "py7.block.excOk": "None. All three raised in reconciliation were settled by a named person.",
      "py7.block.var": "Unexplained variances",
      "py7.block.varOk": "None. All {n} rows that crossed the gate carry a reason and a name.",
      "py7.block.varBad": "{n} rows crossed the gate with no explanation. Sign-off is blocked until each has one.",
      "py7.block.salary": "Staff without a salary",
      "py7.block.salaryOk": "None. Every one of the {n} would have been listed by name, never quietly paid zero.",
      "py7.block.holds": "Payouts held",
      "py7.block.holdsD": "{n} people will not be paid this cycle. Each hold has a reason and the name of whoever placed it.",

      "py7.tab.groups": "Pay groups and lines",
      "py7.tab.var": "Variances",
      "py7.tab.holds": "Holds and inclusions",
      "py7.tab.trail": "Trail",

      "py7.pg.title": "Pay groups in this run",
      "py7.pg.sub": "Two CTC groups and one honorarium group, computed in one pass.",
      "py7.col.group": "Pay group",
      "py7.col.kind": "Logic",
      "py7.col.heads": "Staff",
      "py7.col.gross": "Gross",
      "py7.col.dedn": "Deductions",
      "py7.col.net": "Net",
      "py7.col.employer": "Employer",
      "py7.pg.teach": "Teaching",
      "py7.pg.admin": "Administration and support",
      "py7.pg.visit": "Visiting faculty",
      "py7.kind.ctc": "CTC structure",
      "py7.kind.hon": "Honorarium · rate times units, capped",
      "py7.pg.total": "All groups",
      "py7.earn.title": "Earnings, all groups",
      "py7.ded.title": "Deductions, all groups",
      "py7.emp.title": "Employer contributions, all groups",
      "py7.col.line": "Line",
      "py7.col.amount": "Amount",
      "py7.stat": "Statutory · amount read from {v}",

      "py7.c.BASIC": "Basic pay",
      "py7.c.DA": "Dearness allowance",
      "py7.c.HRA": "House rent allowance",
      "py7.c.SPL": "Special allowance",
      "py7.c.ACAD": "Academic and books allowance",
      "py7.c.CONV": "Conveyance allowance",
      "py7.c.HON": "Honorarium",
      "py7.c.ARREAR": "Arrears — back-dated revision",
      "py7.c.PF": "Provident fund",
      "py7.c.ESI": "Employees' State Insurance",
      "py7.c.PT": "Professional tax",
      "py7.c.TDS": "Income tax (TDS)",
      "py7.c.LOAN": "Loan and advance recovery",
      "py7.c.PFER": "Provident fund — the school's share",
      "py7.c.ESIER": "Employees' State Insurance — the school's share",
      "py7.c.LWF": "Labour welfare fund — the school's share",

      "py7.var.title": "Everyone whose pay moved since July",
      "py7.var.sub": "Ten people moved. Eight crossed the gate and two did not — and both kinds are listed.",
      "py7.var.gate": "Gate: {pct} of July's net, or {amt}, whichever is reached first",
      "py7.var.gateSrc": "Payroll policy {v}, effective {d}, published by the group administrator. Not a figure this screen owns, and not statutory.",
      "py7.var.noAuto": "Nothing is cleared automatically and nothing is hidden. A variance nobody looked at is a variance that ships.",
      "py7.col.person": "Person",
      "py7.col.cause": "Cause",
      "py7.col.prev": "July net",
      "py7.col.cur": "August net",
      "py7.col.delta": "Change",
      "py7.col.expl": "Explained by",
      "py7.var.crossed": "Crossed the gate",
      "py7.var.below": "Below the gate",
      "py7.var.noPrior": "No July to compare",
      "py7.var.cause.joiner": "Joined mid-month",
      "py7.var.cause.leaver": "Left mid-month",
      "py7.var.cause.lop": "Loss of pay",
      "py7.var.cause.revision": "Salary revision with arrears",
      "py7.var.cause.loan": "Loan recovery started",
      "py7.var.cause.decl": "Investment declaration verified",
      "py7.var.cause.units": "More lectures than July, inside the monthly cap",
      "py7.var.explain": "Explain this row",
      "py7.var.explainOff": "Locked while the checker holds the run. Recall it to change an explanation.",
      "py7.var.unexplained": "Not explained yet",
      "py7.var.menuAria": "Actions for {name}",
      "py7.var.rest": "The other {n} people are paid exactly what they were paid in July.",
      "py7.var.pii": "Net pay shows here because this role holds the salary permission. Opening this tab is recorded against your name.",
      "py7.var.empty": "Nobody's pay moved",
      "py7.var.emptyBody": "Not one person differs from July. That is rare enough to be suspicious — check the gate and the compute before you trust it.",
      "py7.var.explTitle": "Explain this variance",
      "py7.var.explBody": "{name} moved by {amt} against July. The checker reads what you write here; it is the reason the stage exists.",

      "py7.hold.title": "Payouts held",
      "py7.hold.sub": "A hold means a person is not paid this cycle. Each one carries a reason and a name.",
      "py7.col.bank": "Bank",
      "py7.col.reason": "Reason, and who held it",
      "py7.hold.r.bank": "Bank details failed validation",
      "py7.hold.r.dup": "Account number matches another employee",
      "py7.hold.mask": "Only the last four digits are ever shown — to payroll too, not just to the staff member.",
      "py7.hold.release": "Release the hold",
      "py7.hold.releaseOff": "Locked while the checker holds the run.",
      "py7.hold.warn": "Once approved a hold cannot be undone this cycle. The person is paid in the next run or separately, and is told which.",
      "py7.hold.none": "Nobody is held",
      "py7.hold.noneBody": "Every person in this run has valid bank details and a payable net.",

      "py7.inc.title": "Attached to this run",
      "py7.inc.in": "Inside the figures above",
      "py7.inc.out": "Separate approval",
      "py7.inc.loans": "Loan and advance recovery",
      "py7.inc.loansD": "{n} active loans. The EMIs sit inside the deductions above and each one decrements a balance the staff member can see.",
      "py7.inc.arrears": "Arrears from a back-dated revision",
      "py7.inc.arrearsD": "{n} people, inside the gross above. Each affected month was recomputed on the version pinned to that month, never on today's.",
      "py7.inc.reimb": "Reimbursement payout batch",
      "py7.inc.reimbD": "{n} claims, attached to the run but NOT inside the figures above. A payout batch needs its own distinct checker.",
      "py7.inc.bonus": "Bonus",
      "py7.inc.bonusD": "Nothing in this run. Festival and ex-gratia bonus is a run of its own, finalised by somebody else.",

      "py7.tr.title": "Everything that has happened to this run",
      "py7.tr.sub": "Who, when, and why — including the parts nobody enjoys.",
      "py7.tr.e1": "Run started",
      "py7.tr.e1d": "August 2026, all three pay groups, {v} pinned at creation",
      "py7.tr.e2": "Paid days frozen",
      "py7.tr.e2d": "{n} staff, snapshot bound to this run",
      "py7.tr.e3": "Computed",
      "py7.tr.e3d": "{n} payslips drafted in 4 min 12 s",
      "py7.tr.e4": "Two payouts held",
      "py7.tr.e4d": "Bank details failed validation; a second account number matched another employee",
      "py7.tr.e5": "Signed and sent for approval",
      "py7.tr.e5d": "{amt} to {n} people",
      "py7.tr.e6": "Returned to the maker",
      "py7.tr.e6d": "Two visiting-faculty rows crossed the gate with no explanation on them",
      "py7.tr.e7": "Both rows explained",
      "py7.tr.e7d": "More lectures than July, inside the monthly cap held in the pinned config",
      "py7.tr.e8": "Signed and sent again",
      "py7.tr.e8d": "{amt} to {n} people",
      "py7.tr.recall": "Recalled from the checker",
      "py7.tr.submit": "Signed and sent for approval",

      /* ---------- PY-08 ---------- */
      "py8.title": "Paid days",
      "py8.tabsAria": "The two halves of paid days",
      "py8.tab.fix": "Days to fix",
      "py8.tab.reg": "The register",
      "py8.head.month": "{days} days, {offs} weekly offs, {hol} holiday, {work} working",
      "py8.fx.title": "The days that are not accounted for",
      "py8.fx.sub": "{open} of {total} still open",
      "py8.fx.col.day": "The day",
      "py8.fx.col.what": "What is wrong",
      "py8.fx.col.becomes": "What it becomes",
      "py8.fx.becomesLop": "Loss of pay",
      "py8.fx.foot": "These are the same days the register counts as loss of pay — this is the reason column that table has no room for.",
      "py8.fx.foot2": "Nothing here is decided by the nightly job. A day with no punch and no leave stays unpaid until somebody says otherwise.",
      "py8.fx.mismatch": "The queue and the register disagree about which days are unpaid. Do not compute on this.",
      "py8.fx.clearHead": "Every day is accounted for",
      "py8.fx.clearBody": "{n} paid days were added back by the fixes on this screen. The register below is what the run will read.",
      "py8.fx.menuFix": "Put this day right",
      "py8.fx.menuRedo": "Change this decision",
      "py8.fx.menuRecord": "Open the employee record",
      "py8.fx.menuAria": "Actions for {name} on {date}",
      "py8.fx.dismiss": "Dismiss",
      "py8.fx.k.all": "Everything",
      "py8.fx.k.noIn": "No punch in",
      "py8.fx.k.noOut": "No punch out",
      "py8.fx.k.short": "Hours short of the shift",
      "py8.fx.k.noLeave": "Away, no leave applied",
      "py8.fx.kd.noIn": "She punched out at the end of the day, so she was here — but the morning punch never arrived.",
      "py8.fx.kd.noOut": "He punched in and worked the day as far as anybody saw, but no closing punch was recorded.",
      "py8.fx.kd.short": "Both punches are there, and they are hours apart from what the shift asks for.",
      "py8.fx.kd.noLeave": "No punch at all, and no leave request in the portal for the day. The department head says it was leave.",
      "py8.fx.n.sideGate": "The staff-room door is not a reader. People leave by it.",
      "py8.fx.n.halfDay": "In at 09:40, out at 13:05 — three and a half hours of an eight-hour day.",
      "py8.fx.n.outage": "Main gate reader, part of the 3–4 August outage.",
      "py8.fx.n.told": "Her head told the office on the day. Nothing was ever entered.",
      "py8.fx.evidence": "What the readers hold",
      "py8.fx.e.shift": "Shift that day",
      "py8.fx.e.needs": "{n} hours",
      "py8.fx.e.in": "Punch in",
      "py8.fx.e.out": "Punch out",
      "py8.fx.e.nothing": "Nothing recorded",
      "py8.fx.e.untouched": "Left alone it becomes",
      "py8.fx.e.untouchedV": "Loss of pay — one unpaid day",
      "py8.fx.what": "What the school is recording",
      "py8.fx.o.full": "A full working day",
      "py8.fx.o.half": "Half a day",
      "py8.fx.o.leave": "Leave against her balance",
      "py8.fx.o.lop": "Loss of pay",
      "py8.fx.od.full": "One paid day. The other punch, or the head’s word, is the evidence it rests on.",
      "py8.fx.od.half": "Half a paid day. The other half is unpaid and stays on the record as such.",
      "py8.fx.od.leave": "One paid day, and one day off the balance of the type you pick. If the balance is short it becomes loss of pay and says so.",
      "py8.fx.od.lop": "Nothing is added. The day stays unpaid, and your reason is why.",
      "py8.fx.type": "Which leave",
      "py8.fx.typeHint": "It comes off {name}’s balance for that type, dated to the day itself.",
      "py8.fx.lt.CL": "Casual leave",
      "py8.fx.lt.SL": "Medical leave",
      "py8.fx.lt.EL": "Earned leave",
      "py8.fx.why": "Why",
      "py8.fx.whyHint": "It goes on the day, on the audit trail, and on the employee’s own record of the month.",
      "py8.fx.whyPh.noIn": "The gate reader was down that morning; she signed the front-office register at 08:55.",
      "py8.fx.whyPh.noOut": "He left by the staff-room door after the parents’ meeting; the duty roster has him until 17:00.",
      "py8.fx.whyPh.short": "She was sent home unwell at lunch and the head approved it on the day.",
      "py8.fx.whyPh.noLeave": "Her head confirmed the leave in writing on 28 August; it was never entered in the portal.",
      "py8.fx.errPick": "Choose what the day becomes.",
      "py8.fx.errWhy": "Say why. A day that changes without a reason is a day nobody can defend.",
      "py8.fx.errShort": "A sentence, please — enough for somebody reading this in six months.",
      "py8.fx.submit": "Record it",
      "py8.fx.later": "Not now",
      "py8.fx.effect": "Paid days for {name} go from {a} to {b}.",
      "py8.fx.effectNone": "Choose what the day becomes and the effect on paid days appears here.",
      "py8.fx.audit": "Recorded against your name, dated to the day, and appended. It reaches pay when payroll retakes the snapshot for {run}.",
      "py8.fx.done": "{date} · {name} — recorded as {what}. Paid days now {n}.",
      "py8.flag.toFix": "{n} days to fix",
      "py8.flag.toFix1": "{n} day to fix",
      "py8.flag.fixed": "All fixed",
      "py8.menu.fix": "Put the open days right",
      "py8.menu.fixNone": "Nothing of theirs is open.",
      "py8.det.record": "Open her record",
      "py8.det.srcHalf": "Half days, recorded here with a reason",
      "py8.det.arith2": "{serv} days in service, less {x} unpaid, is {paid} paid.",
      "py8.q": "Are the paid days right, before anyone is paid for them?",
      "py8.head.meta": "{entity} · {mon} 2026 · bound to run {run}",
      "py8.rule": "Paid days = present + paid leave + holidays + weekly offs − loss of pay",
      "py8.ruleSrc": "The rule belongs to attendance, not to this screen. Change a day's attendance and this figure changes with it.",
      "py8.noMoney": "No rupee figure appears on this screen. Days are decided here; what a day is worth is decided on the run.",
      "py8.frozen": "Frozen",
      "py8.frozenD": "Snapshot taken 8 August and bound to run {run}. Attendance recorded after that does not move these numbers by itself.",

      "py8.shape.title": "The month itself",
      "py8.shape.sub": "The same for everyone. What differs per person is leave and loss of pay.",
      "py8.shape.days": "Days in August",
      "py8.shape.offs": "Weekly offs",
      "py8.shape.hol": "Holidays",
      "py8.shape.work": "Working days",
      "py8.shape.holName": "Saturday 15 August · Independence Day",
      "py8.shape.offNote": "Five Sundays. Saturdays are half working days here and are counted present, not off.",

      "py8.code.P": "P", "py8.code.L": "L", "py8.code.H": "H", "py8.code.W": "W", "py8.code.X": "X", "py8.code.Y": "½", "py8.code.N": "—",
      "py8.wd.0": "Su", "py8.wd.1": "Mo", "py8.wd.2": "Tu", "py8.wd.3": "We",
      "py8.wd.4": "Th", "py8.wd.5": "Fr", "py8.wd.6": "Sa",
      "py8.det.close": "Close",
      "py8.reg.julyNote": "The July total covers the {n} people who were here in July. {name} joined in August, so there is nothing to compare.",
      "py8.codeName.P": "Present",
      "py8.codeName.L": "Paid leave",
      "py8.codeName.H": "Holiday",
      "py8.codeName.W": "Weekly off",
      "py8.codeName.X": "Loss of pay",
      "py8.codeName.Y": "Half day", "py8.codeName.N": "Not in service",

      "py8.reg.title": "Staff and their paid days",
      "py8.reg.sub": "{shown} of {total} shown. Open a person to see the days behind the figure.",
      "py8.col.person": "Person",
      "py8.col.P": "Present",
      "py8.col.L": "Paid leave",
      "py8.col.H": "Holiday",
      "py8.col.W": "Weekly off",
      "py8.col.X": "LOP",
      "py8.col.serv": "In service",
      "py8.col.paid": "Paid days",
      "py8.col.prev": "July",
      "py8.col.flag": "Note",
      "py8.col.act": "Actions",
      "py8.menu.openDet": "Show the days below",
      "py8.reg.notHere": "{n} days are unaccounted for and counted as loss of pay. They are put right on HR's attendance screen, where the punch was recorded.",
      "py8.reg.totals": "Total · {n} day-based rows",
      "py8.reg.ok": "Every row adds up: days in service, less loss of pay, is paid days. Open a person for the day-by-day derivation.",
      "py8.reg.fail": "A row does not add up. Do not freeze and do not compute on this.",
      "py8.reg.select": "Trace {name}",
      "py8.flag.joiner": "Joined 17 August",
      "py8.flag.leaver": "Left 21 August",
      "py8.flag.lop": "Loss of pay",
      "py8.flag.changed": "Changed after freeze",
      "py8.flag.units": "Paid by units",
      "py8.flag.none": "Full month",
      "py8.units.note": "Visiting faculty are paid per lecture against a monthly cap. Days do not price this person; units do, on the run.",

      "py8.menu.aria": "Actions for {name}",
      "py8.f.period": "Month",
      "py8.f.aug": "August 2026 \u2014 open",
      "py8.f.jul": "July 2026 \u2014 closed",
      "py8.f.jun": "June 2026 \u2014 closed",
      "py8.f.group": "Pay group",
      "py8.f.allGroups": "Every group",
      "py8.f.show": "Show",
      "py8.f.everyone": "Everyone",
      "py8.f.issues": "Only rows that do not reconcile",
      "py8.f.lop": "Only rows with unpaid days",
      "py8.f.moves": "Joiners and leavers",
      "py8.f.withHR": "Sent to HR to verify",
      "py8.f.find": "Find somebody",
      "py8.f.findPh": "Name or staff number",
      "py8.f.clear": "Clear filters",
      "py8.closed.mark": "Closed month",
      "py8.closed.body": "{mon} is paid and closed. A correction to a closed month is made through arrears \u2014 the payslips are locked.",
      "py8.menu.payRecord": "Open the pay record",
      "py8.hr.send": "Send to HR for verification",
      "py8.hr.why": "Use this when the days look wrong and the correction is HR\u2019s to make.",
      "py8.hr.with": "With HR to verify",
      "py8.hr.already": "Already with HR",
      "py8.hr.alreadyWhy": "You sent this one for verification. HR has not answered yet.",
      "py8.hr.title": "Send to HR for verification",
      "py8.hr.sub": "About {name}",
      "py8.hr.bodyN": "{n} days on {name}\u2019s month do not reconcile. HR holds attendance, so the correction is theirs to make.",
      "py8.hr.body0": "This asks HR to check {name}\u2019s month against the register before the run is computed on it.",
      "py8.hr.consequence": "{who} receives this. The run stays blocked on this person until HR answers, because paid days are what pay is prorated from.",
      "py8.hr.who": "Meera Iyer, HR",
      "py8.hr.cancel": "Cancel",
      "py8.hr.go": "Send it",
      "py8.hr.done": "Sent to HR. {name} stays blocked until they answer.",
      "py8.menu.trace": "Trace the days",
      "py8.tr.title": "Where every day came from",
      "py8.tr.sub": "Each date below is attributable to one source. A figure nobody can take apart is a figure nobody should pay on.",
      "py8.tr.from": "The month, by source",
      "py8.tr.nDays": "{n} days",
      "py8.tr.nDay": "{n} day",
      "py8.tr.decided": "Days a person decided",
      "py8.tr.by": "{who}, {role}",
      "py8.tr.open": "Still not accounted for",
      "py8.tr.openNote": "Left this way they stay unpaid. They are on the Days to fix tab.",
      "py8.tr.foot": "Nothing here was typed: every date is read from attendance, leave, the calendar and the roster, and every decided day carries who took it.",
      "py8.back.hrAttendance": "Back to staff attendance",
      "py8.menu.hr": "Send to HR for correction",
      "py8.menu.hrReason": "HR owns attendance corrections. Your reason travels with it.",
      "py8.menu.lop": "Accept as loss of pay",
      "py8.menu.lopOff": "Paid days are frozen for {run}. Cutting someone's pay after the freeze is an arrears decision and it is taken on the run.",

      "py8.det.title": "{name}",
      "py8.det.sub": "{id} · {group} · August 2026",
      "py8.det.paid": "{paid} paid days of {inservice} in service",
      "py8.det.legend": "{n} {name}",
      "py8.det.source": "Where the days came from",
      "py8.det.srcBio": "Present · biometric, Gate 2, and the web punch on Saturdays",
      "py8.det.srcLeave": "Paid leave · LV-2026-0418, approved by {who} on 6 August",
      "py8.det.srcHol": "Holiday · school calendar",
      "py8.det.srcOff": "Weekly off · Sundays",
      "py8.det.srcLop": "Loss of pay · no leave applied and no regularisation raised",
      "py8.det.srcJoin": "Not in service · joined 17 August, priced from that day",
      "py8.det.srcLeft": "Not in service · left 21 August, priced to that day",
      "py8.det.arith": "{P} + {L} + {H} + {W} = {paid} paid days. {X} days of loss of pay are counted in the month and not paid.",
      "py8.det.empty": "Pick a person to see the days behind their figure",
      "py8.det.emptyBody": "Every paid-days number traces back to named days from a named source. A figure nobody can trace is one nobody should pay on.",
      "py8.det.hr": "Send to HR for correction",
      "py8.det.units": "Units, not days",
      "py8.det.unitsBody": "Paid per lecture against a monthly cap. Their pay is not a function of paid days, so there are no days to trace.",

      "py8.exc.title": "Exceptions raised in this reconciliation",
      "py8.exc.sub": "Three were raised. Each one was settled by a person, with a reason on it.",
      "py8.exc.e1": "Device outage · Gate 2 · 3 and 4 August",
      "py8.exc.e1d": "17 staff had no in-punch. Corrected from the gate register.",
      "py8.exc.e2": "Leave applied after the month's cut-off",
      "py8.exc.e2d": "Sanctioned by the department head, so the day counts as paid leave.",
      "py8.exc.e3": "Two absences with no leave and no regularisation",
      "py8.exc.e3d": "Accepted as loss of pay. Nobody was told after the fact — the staff member was asked first.",
      "py8.exc.settled": "Settled {d} by {who}",
      "py8.exc.none": "Nothing is open",
      "py8.exc.noneBody": "No exception is waiting on anyone.",

      "py8.pf.title": "Two corrections landed after the freeze",
      "py8.pf.body": "{p} people, {d} paid days more than this run computed on. The run is with the checker, so nothing changes on its own.",
      "py8.pf.o1": "Recall the run and recompute",
      "py8.pf.o1d": "The cleanest. The run comes back to you, the figures move, and the checker reviews it again from the start.",
      "py8.pf.o2": "Pay the difference as arrears",
      "py8.pf.o2d": "Leaves this run alone. The arrears recompute on August's pinned version and need a distinct checker of their own.",
      "py8.pf.pick": "Neither happens by itself, and neither happens without a reason.",
      "py8.pf.go": "Record this decision",
      "py8.pf.done": "Recorded. It is on the run's trail with your name, and {who} will see it.",
      "py8.pf.r1": "Attendance correction verified",
      "py8.pf.r2": "Device outage confirmed against the gate register",
      "py8.pf.r3": "Leave sanctioned after the cut-off",
      "py8.pf.chg.outage": "Two absences reversed — Gate 2 outage, regularised 11 August",
      "py8.pf.chg.leaveLate": "One day of loss of pay became paid leave, sanctioned 11 August",

      "py8.act.recon": "Run reconciliation",
      "py8.act.reconOff": "Paid days are frozen for {run}. Recall the run to reopen them.",
      "py8.act.freeze": "Freeze paid days for the run",
      "py8.act.freezeDone": "Already frozen on 8 August for {run}.",
      "py8.act.unfreeze": "Unfreeze",
      "py8.act.unfreezeOff": "Only a draft run can be unfrozen. This one is computed and signed.",
      "py8.act.export": "Export the evidence",
      "py8.act.exportNote": "CSV — the reconciliation as the checker will see it. The export is recorded with your name and the row count.",
    },

  });

  /* ============================================================
     CONFIG THAT IS READ, NOT TYPED

     STATUTORY_* are versioned, effective-dated StatutoryConfig
     snapshots (§4.4, M11). A run pins ONE of them and keeps it
     forever; a past month keeps the version in force then. These
     objects carry a version and a date and NOTHING ELSE — no rate, no
     ceiling, no slab — because a number invented in a mock is a number
     that gets implemented (docs/ui-compliance-requirements.md §8-F5).

     PAY_POLICY is the OPERATIONAL policy the group publishes: the
     variance flagging gate. It is versioned, effective-dated and
     attributed exactly like the statutory config, for the same reason
     — the pre-v3 console typed "15%" into a screen. It is rendered
     with its provenance wherever it is shown, and this screen never
     decides it.
     ============================================================ */
  const CFG_APR = { v: "v2026.2", fromEn: "1 April 2026", fromHi: "1 अप्रैल 2026" };
  const CFG_JUL = { v: "v2026.3", fromEn: "1 July 2026", fromHi: "1 जुलाई 2026" };
  const CFG_SEP = { v: "v2026.4", fromEn: "1 September 2026", fromHi: "1 सितंबर 2026" };

  const PAY_POLICY = {
    v: "v2026.2",
    fromEn: "1 April 2026",
    fromHi: "1 अप्रैल 2026",
    varPct: 12,      /* per-person percentage gate */
    varAbs: 4500,    /* per-person absolute gate, in rupees */
  };
  function cfgFrom(cfg) { return cfg.fromEn; }
  /* the gate as a display string, assembled from the policy object —
     never authored inside a translated sentence */
  function gatePct() { return num(PAY_POLICY.varPct) + "%"; }

  /* ============================================================
     PEOPLE — a maker and a checker, both named, both with a staff id
     and a permission. Sunita prepared PR-2026-08 and Rajiv approved
     PR-2026-07: exactly what pages/payslips.jsx tells the teacher.
     ============================================================ */
  const MAKER = { nameKey: "py.maker", roleKey: "py.roleMaker", id: "NAV-0031", perm: "payroll.run" };
  const CHECKER = { nameKey: "py.checker", roleKey: "py.roleChecker", id: "NAV-0009", perm: "payroll.approve" };
  const HR = { nameKey: "py.hrOfficer", roleKey: "py.roleHR", id: "NAV-0007" };
  const DEPT = { nameKey: "py.deptHead", roleKey: "py.roleHead", id: "NAV-0018" };

  const RUN_ID = "PR-2026-08";
  const PREV_RUN_ID = "PR-2026-07";
  const HEADCOUNT = 412;
  const PERIOD_MON = 8;

  /* the same reference gross pages/attendance.jsx and pages/leave.jsx
     price an unpaid day from, and the gross on pages/payslips.jsx */
  const MONTHLY_GROSS_REF = 94800.0;
  const DAY_DIVISOR = 30;
  function dayRate(monthlyGross) { return Math.round((monthlyGross / DAY_DIVISOR) * 100) / 100; }
  function lopDelta(monthlyGross, days) { return -dayRate(monthlyGross) * days; }

  /* ============================================================
     THE RUN'S MONEY — component aggregates per pay group. Every
     headline on PY-01 and PY-07 is summed from these at render time.
     Nothing below is a total; totals are computed.
     ============================================================ */
  const GROUPS = [
    {
      key: "teach", nameKey: "py7.pg.teach", kindKey: "py7.kind.ctc", heads: 268,
      earn: [
        { code: "BASIC", v: 9742500.0 }, { code: "DA", v: 1948500.0 },
        { code: "HRA", v: 4871250.0 }, { code: "SPL", v: 5206800.0 },
        { code: "ACAD", v: 1637400.0 }, { code: "ARREAR", v: 186400.0 },
      ],
      ded: [
        { code: "PF", v: 1286400.0, stat: true }, { code: "PT", v: 53600.0, stat: true },
        { code: "TDS", v: 2914300.0, stat: true }, { code: "LOAN", v: 148000.0 },
      ],
      emp: [{ code: "PFER", v: 1286400.0, stat: true }, { code: "LWF", v: 5360.0, stat: true }],
    },
    {
      key: "admin", nameKey: "py7.pg.admin", kindKey: "py7.kind.ctc", heads: 121,
      earn: [
        { code: "BASIC", v: 3146000.0 }, { code: "DA", v: 629200.0 },
        { code: "HRA", v: 1573000.0 }, { code: "SPL", v: 1290600.0 },
        { code: "CONV", v: 302500.0 },
      ],
      ded: [
        { code: "PF", v: 402600.0, stat: true }, { code: "ESI", v: 41830.0, stat: true },
        { code: "PT", v: 24200.0, stat: true }, { code: "TDS", v: 431750.0, stat: true },
        { code: "LOAN", v: 62500.0 },
      ],
      emp: [
        { code: "PFER", v: 402600.0, stat: true }, { code: "ESIER", v: 136000.0, stat: true },
        { code: "LWF", v: 2420.0, stat: true },
      ],
    },
    {
      key: "visit", nameKey: "py7.pg.visit", kindKey: "py7.kind.hon", heads: 23,
      earn: [{ code: "HON", v: 487200.0 }],
      ded: [{ code: "PT", v: 4600.0, stat: true }, { code: "TDS", v: 48720.0, stat: true }],
      emp: [],
    },
  ];

  const sum = (rows) => rows.reduce((s, r) => s + r.v, 0);
  function groupGross(g) { return sum(g.earn); }
  function groupDed(g) { return sum(g.ded); }
  function groupNet(g) { return groupGross(g) - groupDed(g); }
  function groupEmp(g) { return sum(g.emp); }

  const RUN_GROSS = GROUPS.reduce((s, g) => s + groupGross(g), 0);
  const RUN_DED = GROUPS.reduce((s, g) => s + groupDed(g), 0);
  const RUN_NET = RUN_GROSS - RUN_DED;
  const RUN_EMPLOYER = GROUPS.reduce((s, g) => s + groupEmp(g), 0);
  const RUN_HEADS = GROUPS.reduce((s, g) => s + g.heads, 0);

  /* one merged line per component code, across every group — the
     register a checker reads down. Order is authored (earnings in
     payslip order), amounts are summed. */
  function mergeLines(pick) {
    const order = [];
    const bag = {};
    GROUPS.forEach((g) => {
      pick(g).forEach((l) => {
        if (bag[l.code] == null) { bag[l.code] = { code: l.code, v: 0, stat: !!l.stat }; order.push(l.code); }
        bag[l.code].v += l.v;
        if (l.stat) bag[l.code].stat = true;
      });
    });
    return order.map((code) => bag[code]);
  }
  const EARN_LINES = mergeLines((g) => g.earn);
  const DED_LINES = mergeLines((g) => g.ded);
  const EMP_LINES = mergeLines((g) => g.emp);

  /* A35 — payouts held. A hold means a person is not paid this cycle,
     so it carries a reason and the name of whoever placed it. The
     account is masked here exactly as it is on the teacher's own
     payslip: payroll does not get a better view of it than she does. */
  const HOLDS = [
    { id: "NAV-0356", nameKey: "py.n.aparna", bank: "ICICI ••7712", v: 61240.0, reasonKey: "py7.hold.r.bank", byKey: "py.maker", at: { d: 9, m: 8, time: "16:22" } },
    { id: "NAV-0211", nameKey: "py.n.vikram", bank: "HDFC ••4093", v: 47860.0, reasonKey: "py7.hold.r.dup", byKey: "py.maker", at: { d: 9, m: 8, time: "16:31" } },
  ];
  const HELD_TOTAL = sum(HOLDS);
  const NET_PAYABLE = RUN_NET - HELD_TOTAL;
  const PAYEES = HEADCOUNT - HOLDS.length;

  /* inclusions: loans and arrears are INSIDE the figures above and are
     derived from the very lines that carry them, so the card can never
     drift from the register. The reimbursement batch is NOT. */
  const LOAN_TOTAL = DED_LINES.filter((l) => l.code === "LOAN").reduce((s, l) => s + l.v, 0);
  const ARREAR_TOTAL = EARN_LINES.filter((l) => l.code === "ARREAR").reduce((s, l) => s + l.v, 0);
  const LOAN_COUNT = 14;
  const ARREAR_PEOPLE = 4;
  const REIMB = { claims: 31, v: 268450.0 };

  /* Staff names live in the string table like every other piece of
     copy — a Devanagari UI showing Latin names is a half-translated
     product, and these are demo people, not data. */
  addStrings({
    en: {
      "py.n.ananya": "Ananya Rao", "py.n.mahesh": "Mahesh Pillai", "py.n.farida": "Farida Khan",
      "py.n.ravi": "Ravi Deshmukh", "py.n.lata": "Lata Menon", "py.n.suresh": "Suresh Iyer",
      "py.n.joseph": "Joseph Mathew", "py.n.nusrat": "Nusrat Ali", "py.n.prakash": "Prakash Nair",
      "py.n.imran": "Imran Qureshi", "py.n.aparna": "Aparna Bose", "py.n.vikram": "Vikram Sethi",
      "py.n.kavita": "Kavita Sharma",
    },
  });

  /* ============================================================
     VARIANCES — F5/F6 answered.

     Every person whose net moved is listed. `crossed` is COMPUTED
     from PAY_POLICY, not authored per row, so changing the published
     policy re-flags the register exactly as the real screen would.
     Rows that did not cross are still shown, marked as such: a
     variance nobody looked at is a variance that ships.

     Where the cause is loss of pay the delta is PRICED, not typed —
     gross / 30 per day, the same divisor pages/attendance.jsx uses,
     so the same absent day costs the same rupees on every screen.
     ============================================================ */
  const VAR_ROWS = [
    { id: "NAV-0416", nameKey: "py.n.ravi", groupKey: "py7.pg.teach", prev: null, cur: 38940.0,
      causeKey: "py7.var.cause.joiner", explBy: "py.maker", explAt: { d: 8, m: 8, time: "17:12" } },
    { id: "NAV-0177", nameKey: "py.n.lata", groupKey: "py7.pg.admin", prev: 57120.0, cur: 38680.0,
      causeKey: "py7.var.cause.leaver", explBy: "py.maker", explAt: { d: 8, m: 8, time: "17:15" } },
    { id: "NAV-0209", nameKey: "py.n.mahesh", groupKey: "py7.pg.teach", prev: 61240.0, gross: 68400.0, lopDays: 2,
      causeKey: "py7.var.cause.lop", explBy: "py.maker", explAt: { d: 8, m: 8, time: "17:19" } },
    { id: "NAV-0301", nameKey: "py.n.joseph", groupKey: "py7.pg.teach", prev: 52300.0, cur: 61870.0,
      causeKey: "py7.var.cause.revision", explBy: "py.maker", explAt: { d: 8, m: 8, time: "17:24" } },
    { id: "NAV-0122", nameKey: "py.n.prakash", groupKey: "py7.pg.teach", prev: 58900.0, cur: 52900.0,
      causeKey: "py7.var.cause.loan", explBy: "py.maker", explAt: { d: 8, m: 8, time: "17:28" } },
    { id: "NAV-0007", nameKey: "py.n.kavita", groupKey: "py7.pg.admin", prev: 46200.0, cur: 50700.0,
      causeKey: "py7.var.cause.decl", explBy: "py.maker", explAt: { d: 8, m: 8, time: "17:33" } },
    { id: "NAV-0263", nameKey: "py.n.suresh", groupKey: "py7.pg.visit", prev: 18600.0, cur: 21183.0,
      causeKey: "py7.var.cause.units", explBy: "py.maker", explAt: { d: 10, m: 8, time: "10:41" } },
    { id: "NAV-0270", nameKey: "py.n.imran", groupKey: "py7.pg.visit", prev: 15400.0, cur: 17860.0,
      causeKey: "py7.var.cause.units", explBy: "py.maker", explAt: { d: 10, m: 8, time: "10:44" } },
    { id: "NAV-0388", nameKey: "py.n.farida", groupKey: "py7.pg.admin", prev: 38120.0, gross: 42600.0, lopDays: 2,
      causeKey: "py7.var.cause.lop", explBy: null, explAt: null },
    { id: "NAV-0355", nameKey: "py.n.nusrat", groupKey: "py7.pg.admin", prev: 35410.0, gross: 39600.0, lopDays: 1,
      causeKey: "py7.var.cause.lop", explBy: null, explAt: null },
  ];

  function varCur(r) {
    if (r.cur != null) return r.cur;
    /* priced from the day rate, never typed */
    return r.prev + lopDelta(r.gross, r.lopDays);
  }
  function varDelta(r) { return r.prev == null ? varCur(r) : varCur(r) - r.prev; }
  function varCrossed(r) {
    const d = Math.abs(varDelta(r));
    if (r.prev == null) return true;                       /* no comparator: always a human's call */
    if (d >= PAY_POLICY.varAbs) return true;
    return (d / r.prev) * 100 >= PAY_POLICY.varPct;
  }
  const VAR_CROSSED = VAR_ROWS.filter(varCrossed);
  const VAR_UNCHANGED = HEADCOUNT - VAR_ROWS.length;

  /* ============================================================
     PAID DAYS (M9) — nothing about a person's month is authored
     except the facts: their leave days, their loss-of-pay days, and
     when they joined or left. Present, holidays, weekly offs, paid
     days and the totals are all DERIVED from real Date objects, so
     the arithmetic on screen is the arithmetic in the code.
     ============================================================ */
  const YEAR = 2026;
  const MONTH_IDX = 7;                 /* August */
  const MONTH_DAYS = new Date(YEAR, MONTH_IDX + 1, 0).getDate();
  const HOLIDAYS = { 15: true };       /* Independence Day, a working Saturday here */

  const PEOPLE = [
    { id: "NAV-0142", nameKey: "py.n.ananya", groupKey: "py7.pg.teach", leave: [10], lop: [], prevPaid: 31 },
    { id: "NAV-0209", nameKey: "py.n.mahesh", groupKey: "py7.pg.teach", leave: [], lop: [12, 13], prevPaid: 31,
      change: { days: 1, key: "py8.pf.chg.leaveLate" } },
    { id: "NAV-0388", nameKey: "py.n.farida", groupKey: "py7.pg.admin", leave: [], lop: [3, 4], prevPaid: 31,
      change: { days: 2, key: "py8.pf.chg.outage" } },
    { id: "NAV-0416", nameKey: "py.n.ravi", groupKey: "py7.pg.teach", leave: [], lop: [], joined: 17, prevPaid: null },
    { id: "NAV-0177", nameKey: "py.n.lata", groupKey: "py7.pg.admin", leave: [], lop: [], left: 21, prevPaid: 31 },
    { id: "NAV-0263", nameKey: "py.n.suresh", groupKey: "py7.pg.visit", unitsPaid: true, prevPaid: null },
    { id: "NAV-0007", nameKey: "py.n.kavita", groupKey: "py7.pg.admin", leave: [24], lop: [], prevPaid: 31 },
    { id: "NAV-0301", nameKey: "py.n.joseph", groupKey: "py7.pg.teach", leave: [5, 6], lop: [], prevPaid: 30 },
    { id: "NAV-0355", nameKey: "py.n.nusrat", groupKey: "py7.pg.admin", leave: [], lop: [27], prevPaid: 31 },
    { id: "NAV-0122", nameKey: "py.n.prakash", groupKey: "py7.pg.teach", leave: [], lop: [], prevPaid: 31 },
  ];

  /* one day -> one code. P present · L paid leave · H holiday ·
     W weekly off · X loss of pay · N not in service. */
  function dayCode(p, d) {
    const inService = (p.joined == null || d >= p.joined) && (p.left == null || d <= p.left);
    if (!inService) return "N";
    if (HOLIDAYS[d]) return "H";
    if (new Date(YEAR, MONTH_IDX, d).getDay() === 0) return "W";
    if (p.leave && p.leave.indexOf(d) !== -1) return "L";
    if (p.lop && p.lop.indexOf(d) !== -1) return "X";
    return "P";
  }
  function buildDays(p) {
    const codes = [];
    const counts = { P: 0, L: 0, H: 0, W: 0, X: 0, N: 0 };
    for (let d = 1; d <= MONTH_DAYS; d++) {
      const code = dayCode(p, d);
      codes.push({ d: d, code: code, wd: new Date(YEAR, MONTH_IDX, d).getDay() });
      counts[code] += 1;
    }
    const inService = MONTH_DAYS - counts.N;
    const paid = counts.P + counts.L + counts.H + counts.W;
    return {
      codes: codes, counts: counts, inService: inService, paid: paid,
      /* M9's rule, checked rather than asserted: the five buckets must
         account for every day the person was in service, and paid days
         must be that total less loss of pay. */
      reconciles: counts.P + counts.L + counts.H + counts.W + counts.X === inService && paid === inService - counts.X,
    };
  }
  const DAY_ROWS = PEOPLE.filter((p) => !p.unitsPaid).map((p) => ({ p: p, days: buildDays(p) }));
  const UNIT_ROWS = PEOPLE.filter((p) => p.unitsPaid);
  const ALL_RECONCILE = DAY_ROWS.every((r) => r.days.reconciles);
  const MONTH_OFFS = buildDays({ leave: [], lop: [] }).counts.W;
  const MONTH_HOLS = buildDays({ leave: [], lop: [] }).counts.H;
  const MONTH_WORK = MONTH_DAYS - MONTH_OFFS - MONTH_HOLS;

  /* the corrections that landed AFTER the freeze — stated in days,
     never in rupees: PY-08 does not price a day (the inventory keeps
     money on PY-09/PY-10), the run does. */
  const CHANGED = PEOPLE.filter((p) => p.change);
  const CHANGED_DAYS = CHANGED.reduce((s, p) => s + p.change.days, 0);

  /* ============================================================
     THE TRAIL — append-only (§4.2, O6). Every entry carries an actor,
     a role, a staff id, a time and, where a decision was taken, the
     reason for it. The checker's RETURN is on here as a first-class
     event: a gate whose only recorded outcome is "approved" is not a
     gate, it is a rubber stamp.
     ============================================================ */
  const TRAIL = [
    { key: "e1", by: MAKER, at: { d: 7, m: 8, time: "09:14" }, tone: "off" },
    { key: "e2", by: MAKER, at: { d: 8, m: 8, time: "08:02" }, tone: "off" },
    { key: "e3", by: MAKER, at: { d: 8, m: 8, time: "08:06" }, tone: "off" },
    { key: "e4", by: MAKER, at: { d: 9, m: 8, time: "16:31" }, tone: "late" },
    { key: "e5", by: MAKER, at: { d: 9, m: 8, time: "16:48" }, tone: "off" },
    { key: "e6", by: CHECKER, at: { d: 9, m: 8, time: "17:40" }, tone: "absent", returned: true },
    { key: "e7", by: MAKER, at: { d: 10, m: 8, time: "10:44" }, tone: "present" },
    { key: "e8", by: MAKER, at: { d: 10, m: 8, time: "11:05" }, tone: "off" },
  ];

  /* ============================================================
     PY-01 — the periods of this session, and the statutory dates the
     August run feeds. A run's pinned version is the version in force
     in ITS month: April to June carry v2026.2 and July carries
     v2026.3, matching every payslip already issued.
     ============================================================ */
  const PERIODS = [
    { m: 4, run: "PR-2026-04", state: "disbursed", net: 24980300.0, cfg: CFG_APR },
    { m: 5, run: "PR-2026-05", state: "disbursed", net: 25041700.0, cfg: CFG_APR },
    { m: 6, run: "PR-2026-06", state: "disbursed", net: 25118450.0, cfg: CFG_APR },
    { m: 7, run: PREV_RUN_ID, state: "disbursed", net: 25206900.0, cfg: CFG_JUL },
    { m: 8, run: RUN_ID, state: "awaiting", net: null, cfg: CFG_JUL, current: true },
    { m: 9, run: null, state: "notStarted", net: null, cfg: null },
  ];
  const DISBURSED = PERIODS.filter((p) => p.state === "disbursed");
  const DISBURSED_TOTAL = DISBURSED.reduce((s, p) => s + p.net, 0);

  const DUE_DATES = [
    { key: "py1.cal.tds", dEn: "7 September 2026", dHi: "7 सितंबर 2026" },
    { key: "py1.cal.ecr", dEn: "15 September 2026", dHi: "15 सितंबर 2026" },
    { key: "py1.cal.esi", dEn: "15 September 2026", dHi: "15 सितंबर 2026" },
    { key: "py1.cal.pt", dEn: "20 September 2026", dHi: "20 सितंबर 2026" },
  ];

  /* PY-08's three exceptions, each settled by a named person with a
     reason. F8's answer: a triage action that records nothing is the
     same as no triage at all. */
  const EXCEPTIONS = [
    { key: "e1", by: HR, at: { d: 6, m: 8 } },
    { key: "e2", by: DEPT, at: { d: 7, m: 8 } },
    { key: "e3", by: MAKER, at: { d: 7, m: 8 } },
  ];

  /* ============================================================
     LOCAL PRIMITIVES — the kit does not carry these yet. Each is a
     promotion candidate; see the note at the foot of the file.
     ============================================================ */

  /* a translated timestamp: "9 August 2026, 17:40" / Devanagari */
  function stamp(t, at) {
    if (!at) return "";
    return num(at.d) + " " + t("py.mon." + at.m) + " 2026" + (at.time ? ", " + at.time : "");
  }
  function person(t, who) {
    return t("py.by", { who: t(who.nameKey), role: t(who.roleKey), id: who.id });
  }

  /* SIGNED LEDGER — gross − deductions = net, in one column, with the
     operator in its own gutter. Identical in shape to the ledger on
     pages/payslips.jsx; two independent uses now, so it belongs in
     the kit. */
  function EqRow({ sign, label, value, strong, rule, note }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div>
        <div
          style={{
            display: "flex", alignItems: "baseline", gap: 12,
            padding: strong ? "12px 0 2px" : "8px 0",
            borderTop: rule ? "1px solid " + c.borderStrong : "none",
            marginTop: rule ? 6 : 0,
          }}
        >
          <span aria-hidden="true" style={G3.fig("sm", { width: 16, color: c.inkFaint, flexShrink: 0 })}>{sign}</span>
          <span style={ty("small", { color: strong ? c.ink : c.inkMuted, fontWeight: strong ? 700 : 500, flex: 1, minWidth: 0 })}>{label}</span>
          <Figure value={inr(value)} size={strong ? 22 : "md"} weight={strong ? 700 : 600} color={c.ink} align="right" />
        </div>
        {note ? <div style={ty("caption", { color: c.inkFaint, margin: "0 0 4px 28px" })}>{note}</div> : null}
      </div>
    );
  }

  /* a control that is OFF, with the reason in words beside it. Never a
     bare greyed button: "disabled with no explanation" is the defect
     this exists to prevent. The button stays clickable and announces
     itself as disabled, so a click never dead-ends in silence. */
  function OffAction({ label, reason, iconLeft, kind }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [poked, setPoked] = useState(false);
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Button kind={kind || "secondary"} iconLeft={iconLeft} disabled onClick={() => setPoked(true)}>{label}</Button>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py.disabledWhy")}</div>
          <p role={poked ? "alert" : undefined} style={ty("small", { color: c.inkMuted, margin: "3px 0 0" })}>{reason}</p>
        </div>
      </div>
    );
  }

  /* REASON PROMPT — the shape of every consequential act on these
     screens. A controlled reason code AND a note, then a confirm.
     The confirm is never hard-disabled: a disabled submit swallows the
     click that would have shown the validation, so it is enabled and
     it explains itself instead. */
  function ReasonPrompt({ idBase, title, body, options, confirmLabel, onConfirm, onCancel, extra }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [code, setCode] = useState("");
    const [note, setNote] = useState("");
    const [err, setErr] = useState(null);
    function go() {
      if (!code) { setErr("pick"); return; }
      if (!note.trim()) { setErr("note"); return; }
      setErr(null);
      onConfirm({ codeKey: code, note: note.trim() });
    }
    return (
      <div style={{ background: c.raised, border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: "16px 18px 18px", marginTop: 14 }}>
        <div style={ty("h3", { color: c.ink, margin: 0 })}>{title}</div>
        {body ? <p style={ty("small", { color: c.inkMuted, margin: "6px 0 14px" })}>{body}</p> : <div style={{ height: 12 }} />}
        {extra}
        <Field id={idBase + "-code"} label={t("py.reason.label")} error={err === "pick" ? t("py.reason.errPick") : null}>
          <Select
            id={idBase + "-code"} value={code} onChange={setCode}
            options={[{ value: "", label: t("py.reason.pick") }].concat(options.map((o) => ({ value: o, label: t(o) })))}
          />
        </Field>
        <Field id={idBase + "-note"} label={t("py.reason.note")} error={err === "note" ? t("py.reason.errNote") : null}>
          <Input id={idBase + "-note"} value={note} onChange={setNote} placeholder={t("py.reason.notePh")} />
        </Field>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Button kind="primary" onClick={go}>{confirmLabel || t("py.confirm")}</Button>
          <Button kind="quiet" onClick={onCancel}>{t("py.cancel")}</Button>
        </div>
      </div>
    );
  }

  /* an append-only trail, rendered as a record rather than a feed */
  function TrailList({ entries }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {entries.map((e, i) => {
          const tint = c[(e.tone || "off") + "Tint"] || c.sunken;
          const fg = c[(e.tone || "off") + "Text"] || c.inkMuted;
          return (
            <li key={e.key} style={{ display: "flex", gap: 13, paddingBottom: i === entries.length - 1 ? 0 : 16 }}>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: G3.r.pill, background: tint, color: fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={e.returned ? "signout" : e.tone === "present" ? "check" : e.tone === "late" ? "alert" : "arrow"} size={14} />
                </span>
                {i === entries.length - 1 ? null : <span aria-hidden="true" style={{ width: 2, flex: 1, background: c.border, marginTop: 4 }} />}
              </span>
              <span style={{ minWidth: 0, flex: 1, paddingTop: 1 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{e.title}</span>
                <span style={ty("small", { display: "block", color: c.inkMuted })}>{e.detail}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>{e.who}</span>
                {e.reason ? (
                  <span style={ty("small", { display: "block", color: c.ink, marginTop: 6, padding: "8px 11px", background: tint, borderRadius: G3.r.md })}>{e.reason}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  /* the shell every payroll screen shares: rail, motif, top strip,
     page head. Density is a function of role (DESIGN 5) — this is the
     densest surface in the product, so the chrome is thin and the
     content starts high. */
  function Shell({ role, onNavigate, active, title, question, actions, children, back }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    return (
      <div
        className="nv3"
        style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}
      >
        <Rail role={role || "payrollOfficer"} active={active} onNavigate={onNavigate} initials="SK" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("py1.title")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("py.entity")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            {/* a named return for a reader who was sent here from
                another screen. Not a browser back: it says WHERE. */}
            {back ? (
              <div style={{ marginBottom: 14 }}>
                <LinkButton onClick={back.onBack}>{back.label}</LinkButton>
              </div>
            ) : null}

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
              <div style={{ minWidth: 320 }}>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{title}</h1>
                <div style={ty("small", { color: c.inkMuted, marginTop: 6 })}>{question}</div>
              </div>
              {actions ? <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>{actions}</div> : null}
            </div>

            {children}
          </div>
        </main>
      </div>
    );
  }

  /* a labelled read-out: a small caption over a figure or a word.
     Used wherever a card has to state three or four facts side by
     side without turning into a KPI tile grid. */
  function Fact({ label, children, note, w }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ minWidth: w || 130 }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={{ marginTop: 4 }}>{children}</div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 3 })}>{note}</div> : null}
      </div>
    );
  }

  /* a readiness / blocking check: a state mark, a sentence, and where
     to go. Never colour alone — every one carries a glyph and a word. */
  function CheckRow({ role, glyph, word, head, body, action, last }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 0", borderBottom: last ? "none" : "1px solid " + c.rule }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
            <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{head}</span>
            <StatusMark role={role} glyph={glyph} word={word} />
          </div>
          <p style={ty("small", { color: c.inkMuted, margin: "4px 0 0" })}>{body}</p>
        </div>
        {action ? <div style={{ flexShrink: 0, paddingTop: 2 }}>{action}</div> : null}
      </div>
    );
  }

  /* ============================================================
     PY-01 · PAYROLL HOME
     "Where is this month's payroll, and what is holding it up?"

     Spec: screen-inventory PY-01 (all four actions built), M10
     §Workflow, §6.9 PayrollRun.status, M12 (F&F waiting), §4.4 (each
     period keeps the version it pinned).
     ============================================================ */
  function EntityPeriodPicker() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [entity, setEntity] = useState("main");
    const [period, setPeriod] = useState("8");
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ width: 250 }}>
          <label htmlFor="py-entity" style={ty("caption", { display: "block", color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 })}>
            {t("py1.entityLabel")}
          </label>
          <Select
            id="py-entity" value={entity} onChange={setEntity}
            options={[{ value: "main", label: t("py.entity") }, { value: "pre", label: t("py.entityAlt") }]}
          />
        </div>
        <div style={{ width: 170 }}>
          <label htmlFor="py-period" style={ty("caption", { display: "block", color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 })}>
            {t("py1.periodLabel")}
          </label>
          <Select
            id="py-period" value={period} onChange={setPeriod}
            options={PERIODS.map((p) => ({ value: String(p.m), label: t("py.period", { mon: t("py.mon." + p.m) }) }))}
          />
        </div>
      </div>
    );
  }

  function PYHome({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const go = (k) => (onNavigate ? onNavigate(k) : null);

    const periodCols = [
      { key: "period", label: t("py1.col.period") },
      { key: "run", label: t("py1.col.run"), mono: true, width: 130 },
      { key: "state", label: t("py1.col.state"), width: 190 },
      { key: "net", label: t("py1.col.net"), align: "right", mono: true, width: 170 },
      { key: "cfg", label: t("py1.col.cfg"), mono: true, width: 120 },
      { key: "act", label: t("py1.col.act"), align: "right", width: 230 },
    ];

    function stateMark(p) {
      if (p.state === "disbursed") return <StatusMark role="present" glyph="check" word={t("py.st.disbursed")} />;
      if (p.state === "awaiting") return <StatusMark role="late" glyph="clock" word={t("py.st.awaiting")} />;
      return <StatusMark role="off" glyph="arrow" word={t("py.st.notStarted")} />;
    }
    function rowAction(p) {
      if (p.state === "notStarted") {
        return <Button size="sm" kind="secondary" disabled>{t("py1.hist.start")}</Button>;
      }
      if (p.current) return <Button size="sm" kind="primary" onClick={() => go("pyRun")}>{t("py1.hist.open")}</Button>;
      return <LinkButton onClick={() => go("pyRun")}>{t("py1.hist.open")}</LinkButton>;
    }

    return (
      <Shell
        role={role} onNavigate={onNavigate} active="pyHome"
        title={t("py1.title")} question={t("py1.q")}
        actions={<EntityPeriodPicker />}
      >
        <p style={ty("caption", { color: c.inkFaint, margin: "0 0 18px", maxWidth: 720 })}>{t("py.entityScope")}</p>

        {/* the one honey card on this screen: this month, and the one
            thing to do about it */}
        <Card fill={c.brassSoft} border={c.brassBorder} style={{ marginBottom: L.gap }}>
          <div style={{ display: "flex", gap: 30, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ minWidth: 300, flex: 1 }}>
              <div style={ty("caption", { color: c.brass, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" })}>{t("py1.hero.kicker")}</div>
              <h2 style={ty("h1", { margin: "4px 0 0", color: c.ink })}>{t("py1.hero.state", { mon: t("py.mon." + PERIOD_MON) })}</h2>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 10 }}>
                <Chip bg={c.surface} fg={c.inkMuted} mono>{RUN_ID}</Chip>
                <StatusMark role="late" glyph="clock" word={t("py.st.awaiting")} />
                <Chip bg={c.surface} fg={c.inkMuted}>{t("py7.cfg.chip", { v: CFG_JUL.v })}</Chip>
              </div>
              <p style={ty("body", { color: c.ink, margin: "14px 0 0", maxWidth: 560 })}>
                {t("py1.hero.waiting", { who: t("py.checker"), role: t("py.roleChecker") })}
              </p>
              <p style={ty("small", { color: c.inkMuted, margin: "6px 0 0" })}>{t("py1.hero.since")}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
                <Button kind="primary" iconLeft="payroll" onClick={() => go("pyRun")}>{t("py1.hero.open")}</Button>
                <Button kind="secondary" iconLeft="check" onClick={() => go("pyPaidDays")}>{t("py1.hero.paidDays")}</Button>
              </div>
            </div>
            <div style={{ minWidth: 260, textAlign: "right" }}>
              <div style={ty("caption", { color: c.brass, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py1.hero.netLabel")}</div>
              <Figure value={inr(NET_PAYABLE)} size={34} weight={700} color={c.ink} align="right" style={{ letterSpacing: "-0.015em", lineHeight: 1.15, marginTop: 4 }} />
              <div style={ty("caption", { color: c.inkMuted, marginTop: 6 })}>
                {t("py1.hero.netNote", { n: num(PAYEES), h: num(HOLDS.length), v: CFG_JUL.v })}
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
          <div style={{ width: L.colNarrow, flex: "0 0 " + L.colNarrow + "px", display: "flex", flexDirection: "column", gap: L.gap }}>
            <Card icon="check" iconTone="present" title={t("py1.ready.title")} sub={t("py1.ready.sub")}>
              <CheckRow
                role="present" glyph="check" word={t("py.st.clear")}
                head={t("py1.ready.paidDays")}
                body={t("py1.ready.paidDaysOk", { run: RUN_ID, n: num(HEADCOUNT) })}
                action={<LinkButton onClick={() => go("pyPaidDays")}>{t("py1.ready.open")}</LinkButton>}
              />
              <CheckRow
                role="present" glyph="check" word={t("py.st.clear")}
                head={t("py1.ready.salary")} body={t("py1.ready.salaryOk")}
              />
              <CheckRow
                role="present" glyph="check" word={t("py.st.clear")}
                head={t("py1.ready.joiners")}
                body={t("py1.ready.joinersOk", { n: num(PEOPLE.filter((p) => p.joined).length) })}
              />
              <CheckRow
                role="present" glyph="check" word={t("py.st.clear")} last
                head={t("py1.ready.inclusions")}
                body={t("py1.ready.inclusionsOk", { n: num(LOAN_COUNT) })}
                action={<LinkButton onClick={() => go("pyRun")}>{t("py1.ready.open")}</LinkButton>}
              />
            </Card>

            <Card icon="festival" iconTone="brass" title={t("py1.cal.title")} sub={t("py1.cal.sub")}>
              {DUE_DATES.map((d, i) => (
                <div key={d.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, padding: "9px 0", borderBottom: i === DUE_DATES.length - 1 ? "none" : "1px dashed " + c.border }}>
                  <span style={ty("small", { color: c.ink })}>{t(d.key)}</span>
                  <span style={ty("caption", { color: c.inkMuted, whiteSpace: "nowrap" })}>{t("py1.cal.due", { d: d.dEn })}</span>
                </div>
              ))}
              <p style={ty("small", { color: c.inkMuted, margin: "12px 0 0", paddingTop: 12, borderTop: "1px solid " + c.border })}>{t("py1.cal.blocked")}</p>
              <p style={ty("caption", { color: c.inkFaint, margin: "6px 0 0" })}>{t("py1.cal.note")}</p>
            </Card>
          </div>

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
            <Register
              title={t("py1.hist.title")} sub={t("py1.hist.sub")}
              columns={periodCols}
              rows={PERIODS.map((p) => ({
                id: p.m,
                highlight: !!p.current,
                cells: {
                  period: <span style={ty("small", { color: c.ink, fontWeight: p.current ? 700 : 500 })}>{t("py.period", { mon: t("py.mon." + p.m) })}</span>,
                  run: p.run || "—",
                  state: stateMark(p),
                  net: p.state === "disbursed" ? inr(p.net) : p.current ? inr(NET_PAYABLE) : "—",
                  cfg: p.cfg ? p.cfg.v : "—",
                  act: rowAction(p),
                },
              }))}
              totals={{
                label: "",
                cells: {
                  period: "", run: "",
                  state: <span>{t("py1.hist.totals", { n: num(DISBURSED.length) })}</span>,
                  net: inr(DISBURSED_TOTAL),
                },
              }}
              footer={
                <div>
                  <p style={ty("small", { color: c.ink, margin: 0, display: "flex", gap: 8, alignItems: "flex-start" })}>
                    <span aria-hidden="true" style={{ display: "flex", color: c.brass, flexShrink: 0, marginTop: 2 }}><Icon name="lock" size={13} /></span>
                    <span>{t("py1.hist.startOff")}</span>
                  </p>
                  <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>{t("py1.hist.note", { v: CFG_JUL.v })}</p>
                </div>
              }
            />

            <Card icon="list" iconTone="info" title={t("py1.else.title")}>
              <div style={{ display: "flex", gap: L.gap, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 250 }}>
                  <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("py1.else.ff")}</div>
                  <div style={{ marginTop: 6 }}><StatusMark role="late" glyph="clock" word={t("py1.else.ffN", { n: num(2) })} /></div>
                  <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0" })}>{t("py1.else.ffNote")}</p>
                </div>
                <div style={{ flex: 1, minWidth: 250 }}>
                  <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("py1.else.batch")}</div>
                  <div style={{ marginTop: 6 }}>
                    <Chip bg={c.sunken} fg={c.inkMuted}>{t("py1.else.batchN", { n: num(REIMB.claims), run: RUN_ID })}</Chip>
                  </div>
                  <div style={{ marginTop: 8 }}><Figure value={inr(REIMB.v)} size="md" weight={700} color={c.ink} /></div>
                  <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0" })}>{t("py1.else.batchNote")}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Shell>
    );
  }

  /* ============================================================
     PY-07 · PAYROLL RUN CONSOLE
     "Is this month's payroll correct enough for someone else to
     approve?"

     Spec: screen-inventory PY-07 (every action built), M10 §Workflow,
     M10 §Business rules, M10 "Compute vs release", §6.9 PayrollRun,
     §4.4 pinned StatutoryConfig, §8 maker-checker + append-only audit.

     The run's LIVE state machine on this screen has exactly two
     positions a MAKER can occupy — with the checker, or back with
     you. Approve and disburse are not positions this role can move
     the run into, and the screen says so rather than pretending the
     controls are merely greyed out somewhere off-screen.
     ============================================================ */
  const RECON_OK =
    Math.abs((RUN_GROSS - RUN_DED) - RUN_NET) < 0.005 &&
    Math.abs((RUN_NET - HELD_TOTAL) - NET_PAYABLE) < 0.005 &&
    Math.abs(sum(EARN_LINES) - RUN_GROSS) < 0.005 &&
    Math.abs(sum(DED_LINES) - RUN_DED) < 0.005 &&
    Math.abs(sum(EMP_LINES) - RUN_EMPLOYER) < 0.005;

  function StageSpine({ withChecker, onVariances }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const unexplained = 0;
    const steps = [
      { k: "s1", state: "done", d: t("py7.stage.s1d", { v: CFG_JUL.v }) },
      { k: "s2", state: "done", d: t("py7.stage.s2d", { n: num(HEADCOUNT) }), note: t("py7.stage.s2n") },
      { k: "s3", state: withChecker ? "done" : "now", d: t("py7.stage.s3d", { n: num(VAR_ROWS.length), f: num(VAR_CROSSED.length), u: num(unexplained) }) },
      { k: "s4", state: withChecker ? "now" : "todo", d: withChecker ? t("py7.stage.s4d", { who: t("py.checker") }) : t("py7.stage.s4dRecalled") },
      { k: "s5", state: "todo", d: t("py7.stage.s5d") },
      { k: "s6", state: "todo", d: t("py7.stage.s6d"), note: t("py7.stage.s6n") },
    ];
    return (
      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {steps.map((s, i) => {
          const done = s.state === "done";
          const now = s.state === "now";
          const tint = done ? c.presentTint : now ? c.lateTint : c.sunken;
          const fg = done ? c.presentText : now ? c.lateText : c.inkFaint;
          return (
            <li key={s.k} style={{ display: "flex", gap: 13, paddingBottom: i === steps.length - 1 ? 0 : 14 }}>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: G3.r.pill, background: tint, color: fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={done ? "check" : now ? "clock" : "arrow"} size={14} />
                </span>
                {i === steps.length - 1 ? null : <span aria-hidden="true" style={{ width: 2, flex: 1, background: c.border, marginTop: 4 }} />}
              </span>
              <span style={{ minWidth: 0, flex: 1, paddingTop: 1 }}>
                <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={ty("small", { color: done || now ? c.ink : c.inkMuted, fontWeight: 700 })}>{t("py7.stage." + s.k)}</span>
                  {now ? <StatusMark role="late" glyph="clock" word={t("py.st.awaiting")} /> : null}
                </span>
                <span style={ty("small", { display: "block", color: c.inkMuted })}>{s.d}</span>
                {s.note ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>{s.note}</span> : null}
                {s.k === "s3" ? (
                  <span style={{ display: "inline-flex", marginTop: 6 }}>
                    <LinkButton onClick={onVariances}>{t("py7.act.variance")}</LinkButton>
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  function IdentityPanel({ head, who, line, sub, tone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ flex: 1, minWidth: 260, background: c.surface, border: "1px solid " + (tone === "empty" ? c.borderStrong : c.border), borderRadius: G3.r.lg, padding: "14px 16px 16px" }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" })}>{head}</div>
        <div style={ty("h3", { color: c.ink, marginTop: 5 })}>{t(who.nameKey)}</div>
        <div style={ty("small", { color: c.inkMuted, marginTop: 2 })}>{t(who.roleKey)} · {who.id}</div>
        <div style={G3.fig("micro", { color: c.inkFaint, marginTop: 3 })}>{who.perm}</div>
        <div style={{ marginTop: 10 }}>{line}</div>
        {sub ? <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0" })}>{sub}</p> : null}
      </div>
    );
  }

  function PYRun({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const go = (k) => (onNavigate ? onNavigate(k) : null);

    const [withChecker, setWithChecker] = useState(true);
    const [flow, setFlow] = useState(null);          /* null | "recall" | "submit" */
    const [ack, setAck] = useState(false);
    const [ackErr, setAckErr] = useState(false);
    const [tab, setTab] = useState("groups");
    const [explainId, setExplainId] = useState(null);
    const [extraExpl, setExtraExpl] = useState({});
    const [added, setAdded] = useState([]);          /* appended trail entries — never edited */
    const [flash, setFlash] = useState(null);

    const TABS_ID = "py7-tabs";

    function appendTrail(entry) { setAdded((prev) => prev.concat([entry])); }

    function doRecall(r) {
      appendTrail({
        key: "local-" + added.length, tone: "absent",
        title: t("py7.tr.recall"), detail: "",
        who: person(t, MAKER) + " · " + t("py.justNow"),
        reason: t(r.codeKey) + " — " + r.note,
      });
      setWithChecker(false);
      setFlow(null);
      setFlash(t("py7.recall.done"));
    }
    function doSubmit() {
      if (!ack) { setAckErr(true); return; }
      appendTrail({
        key: "local-" + added.length, tone: "off",
        title: t("py7.tr.submit"), detail: t("py7.tr.e8d", { amt: inr(NET_PAYABLE), n: num(PAYEES) }),
        who: person(t, MAKER) + " · " + t("py.justNow"),
      });
      setWithChecker(true);
      setFlow(null);
      setAck(false);
      setAckErr(false);
      setFlash(t("py7.submit.done", { who: t("py.checker") }));
    }
    function isExplained(r) { return !!(r.explBy || extraExpl[r.id]); }
    const unexplainedCrossed = VAR_CROSSED.filter((r) => !isExplained(r));

    /* ---------- the trail, base + appended ---------- */
    const baseTrail = TRAIL.map((e) => {
      const vars = { v: CFG_JUL.v, n: num(e.key === "e5" || e.key === "e8" ? PAYEES : HEADCOUNT), amt: inr(NET_PAYABLE) };
      return {
        key: e.key, tone: e.tone, returned: e.returned,
        title: t("py7.tr." + e.key),
        detail: e.returned ? "" : t("py7.tr." + e.key + "d", vars),
        who: person(t, e.by) + " · " + stamp(t, e.at),
        reason: e.returned ? t("py7.tr." + e.key + "d", vars) : null,
      };
    });

    /* ---------- pay group + line registers ---------- */
    const groupCols = [
      { key: "g", label: t("py7.col.group") },
      { key: "kind", label: t("py7.col.kind"), width: 230 },
      { key: "heads", label: t("py7.col.heads"), align: "right", mono: true, width: 90 },
      { key: "gross", label: t("py7.col.gross"), align: "right", mono: true, width: 160 },
      { key: "ded", label: t("py7.col.dedn"), align: "right", mono: true, width: 150 },
      { key: "net", label: t("py7.col.net"), align: "right", mono: true, width: 160 },
      { key: "emp", label: t("py7.col.employer"), align: "right", mono: true, width: 150 },
    ];
    function LineReg({ title, lines, totalLabel, total }) {
      const cols = [
        { key: "line", label: t("py7.col.line") },
        { key: "amt", label: t("py7.col.amount"), align: "right", mono: true, width: 150 },
      ];
      return (
        <div style={{ flex: 1, minWidth: 300 }}>
          <Register
            title={title}
            columns={cols}
            rows={lines.map((l) => ({
              id: l.code,
              cells: {
                line: (
                  <span>
                    <span style={ty("small", { display: "block", color: c.ink })}>{t("py7.c." + l.code)}</span>
                    {l.stat ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t("py7.stat", { v: CFG_JUL.v })}</span> : null}
                  </span>
                ),
                amt: inr(l.v),
              },
            }))}
            totals={{ label: totalLabel, cells: { amt: inr(total) } }}
          />
        </div>
      );
    }

    /* ---------- variance register ---------- */
    const varCols = [
      { key: "who", label: t("py7.col.person") },
      { key: "cause", label: t("py7.col.cause"), width: 250 },
      { key: "prev", label: t("py7.col.prev"), align: "right", mono: true, width: 130 },
      { key: "cur", label: t("py7.col.cur"), align: "right", mono: true, width: 130 },
      { key: "delta", label: t("py7.col.delta"), align: "right", mono: true, width: 130 },
      { key: "expl", label: t("py7.col.expl"), width: 230 },
      { key: "menu", label: "", align: "right", width: 46 },
    ];
    const explainTarget = explainId ? VAR_ROWS.filter((r) => r.id === explainId)[0] : null;

    return (
      <Shell
        role={role} onNavigate={onNavigate} active="pyRun"
        title={t("py7.title")} question={t("py7.q")}
        actions={
          <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Chip bg={c.sunken} fg={c.inkMuted} mono>{RUN_ID}</Chip>
            <Chip bg={c.brassSoft} fg={c.brass}>
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="filing" size={13} /></span>
              <span>{t("py7.cfg.chip", { v: CFG_JUL.v })}</span>
            </Chip>
            {withChecker
              ? <StatusMark role="late" glyph="clock" word={t("py.st.awaiting")} />
              : <StatusMark role="off" glyph="arrow" word={t("py.st.variance")} />}
          </div>
        }
      >
        <div style={ty("small", { color: c.inkMuted, margin: "0 0 6px" })}>
          {t("py7.head.meta", { entity: t("py.entity"), mon: t("py.mon." + PERIOD_MON), n: num(RUN_HEADS), g: num(GROUPS.length) })}
        </div>
        <p style={ty("caption", { color: c.inkFaint, margin: "0 0 18px", maxWidth: 900 })}>
          {t("py7.cfg.detail", { v: CFG_JUL.v, d: cfgFrom(CFG_JUL) })}
        </p>

        {flash ? (
          <div role="status" style={ty("small", { color: c.presentText, background: c.presentTint, borderRadius: G3.r.md, padding: "10px 14px", marginBottom: L.gap, fontWeight: 600 })}>{flash}</div>
        ) : null}

        {/* ---- stages + sign-off ---- */}
        <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", marginBottom: L.gap }}>
          <div style={{ width: L.colNarrow, flex: "0 0 " + L.colNarrow + "px" }}>
            <Card icon="payroll" iconTone="accent" title={t("py7.stage.title")} sub={t("py7.stage.sub")}>
              <StageSpine withChecker={withChecker} onVariances={() => setTab("var")} />
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid " + c.border, display: "flex", flexDirection: "column", gap: 14 }}>
                {withChecker
                  ? <OffAction label={t("py7.act.recompute")} reason={t("py7.act.recomputeOff")} iconLeft="scan" />
                  : (
                    <div>
                      <Button kind="secondary" iconLeft="scan">{t("py7.act.recompute")}</Button>
                      <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>{t("py7.act.recomputeOn")}</p>
                    </div>
                  )}
                <OffAction label={t("py7.act.discard")} reason={t("py7.act.discardOff")} iconLeft="signout" />
              </div>
            </Card>
          </div>

          {/* the one honey card on this screen: the two people, and the
              only consequential control this role actually holds */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Card fill={c.brassSoft} border={c.brassBorder} icon="lock" iconTone="brass" title={t("py7.so.title")} sub={t("py7.so.sub")}>
              <p style={ty("body", { color: c.ink, margin: "0 0 16px", maxWidth: 760 })}>{t("py7.so.rule")}</p>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <IdentityPanel
                  head={t("py7.so.makerHead")} who={MAKER}
                  line={<Seal label={t("py7.so.signed")} sub={t("py7.so.digest", { x: "8f31c0a4" })} />}
                  sub={withChecker ? t("py7.so.locked") : t("py7.so.unlocked")}
                />
                <IdentityPanel
                  head={t("py7.so.checkerHead")} who={CHECKER} tone={withChecker ? null : "empty"}
                  line={
                    withChecker
                      ? <StatusMark role="late" glyph="clock" word={t("py7.so.waiting")} />
                      : <StatusMark role="off" glyph="arrow" word={t("py7.so.openAgain")} />
                  }
                  sub={t("py7.so.willDo", { who: t("py.checker") })}
                />
              </div>

              <p style={ty("small", { color: c.ink, margin: "14px 0 0", display: "flex", gap: 9, alignItems: "flex-start" })}>
                <span aria-hidden="true" style={{ display: "flex", color: c.brass, flexShrink: 0, marginTop: 2 }}><Icon name="signout" size={14} /></span>
                <span>{t("py7.so.returnedOnce")}</span>
              </p>

              {/* Approve: ABSENT, and told why. Two independently
                  sufficient reasons, both printed. */}
              <div style={{ marginTop: 16, background: c.surface, border: "1px dashed " + c.borderStrong, borderRadius: G3.r.lg, padding: "13px 15px" }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py.absentWhy")}</div>
                <div style={ty("small", { color: c.ink, fontWeight: 700, marginTop: 4 })}>{t("py7.act.approveAbsent")}</div>
                <p style={ty("small", { color: c.inkMuted, margin: "5px 0 0" })}>{t("py7.act.approveWhy")}</p>
                <p style={ty("caption", { color: c.inkFaint, margin: "6px 0 0" })}>{t("py7.act.approveServer")}</p>
              </div>

              {/* the live control, in whichever direction the run can move */}
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid " + c.brassBorder }}>
                {withChecker ? (
                  flow === "recall" ? (
                    <ReasonPrompt
                      idBase="py7-recall"
                      title={t("py7.recall.title")}
                      body={t("py7.recall.body", { who: t("py.checker") })}
                      options={["py7.recall.r1", "py7.recall.r2", "py7.recall.r3", "py7.recall.r4"]}
                      confirmLabel={t("py7.so.recall")}
                      onConfirm={doRecall}
                      onCancel={() => setFlow(null)}
                    />
                  ) : (
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <Button kind="brass" iconLeft="signout" onClick={() => setFlow("recall")}>{t("py7.so.recall")}</Button>
                      <p style={ty("small", { color: c.inkMuted, margin: 0, flex: 1, minWidth: 240 })}>{t("py7.so.recallNote", { who: t("py.checker") })}</p>
                    </div>
                  )
                ) : flow === "submit" ? (
                  <div style={{ background: c.surface, border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: "16px 18px 18px" }}>
                    <div style={ty("h3", { color: c.ink })}>{t("py7.submit.title")}</div>
                    <p style={ty("small", { color: c.inkMuted, margin: "6px 0 14px" })}>{t("py7.submit.body")}</p>
                    <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginBottom: 14 }}>
                      <Fact label={t("py7.submit.net")} w={190}><Figure value={inr(NET_PAYABLE)} size="lg" weight={700} color={c.ink} /></Fact>
                      <Fact label={t("py7.submit.payees")} w={120}><Figure value={num(PAYEES)} size="lg" weight={700} color={c.ink} /></Fact>
                      <Fact label={t("py7.submit.held")} w={120}><Figure value={num(HOLDS.length)} size="lg" weight={700} color={c.ink} /></Fact>
                    </div>
                    <p style={ty("small", { color: c.inkMuted, margin: "0 0 12px" })}>
                      {t("py7.submit.to", { who: t("py.checker"), role: t("py.roleChecker"), id: CHECKER.id })}
                    </p>
                    <div style={{ marginBottom: 6 }}>
                      <Switch id="py7-ack" checked={ack} onChange={(v) => { setAck(v); setAckErr(false); }} label={t("py7.submit.ack")} />
                    </div>
                    {ackErr ? <div role="alert" style={ty("caption", { color: c.dangerText, marginBottom: 10 })}>{t("py7.submit.ackErr")}</div> : null}
                    <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                      <Button kind="primary" onClick={doSubmit}>{t("py7.submit.go")}</Button>
                      <Button kind="quiet" onClick={() => { setFlow(null); setAckErr(false); }}>{t("py.cancel")}</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <Button kind="brass" iconLeft="check" onClick={() => setFlow("submit")}>{t("py7.act.submit")}</Button>
                    <p style={ty("small", { color: c.inkMuted, margin: 0, flex: 1, minWidth: 240 })}>{t("py7.so.unlocked")}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* ---- what it pays, and what is holding it ---- */}
        <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", marginBottom: L.gap }}>
          <div style={{ width: L.colNarrow, flex: "0 0 " + L.colNarrow + "px" }}>
            <Card icon="payslip" iconTone="accent" title={t("py7.tot.title")} sub={t("py7.tot.sub")}>
              <div style={{ background: c.raised, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: "10px 18px 14px" }}>
                <EqRow sign={"\u00a0"} label={t("py7.tot.gross")} value={RUN_GROSS} />
                <EqRow sign={"−"} label={t("py7.tot.ded")} value={RUN_DED} />
                <EqRow sign={"="} label={t("py7.tot.net")} value={RUN_NET} strong rule />
                <EqRow sign={"−"} label={t("py7.tot.held")} value={HELD_TOTAL} />
                <EqRow sign={"="} label={t("py7.tot.payable")} value={NET_PAYABLE} strong rule />
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.border }}>
                <div style={ty("small", { color: c.ink, fontWeight: 700, marginBottom: 4 })}>{t("py7.tot.employer")}</div>
                <Figure value={inr(RUN_EMPLOYER)} size="lg" weight={700} color={c.ink} />
                <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>{t("py7.tot.employerNote")}</p>
              </div>
              <p
                style={ty("small", {
                  margin: "16px 0 0", padding: "10px 13px", borderRadius: G3.r.md, fontWeight: 600,
                  background: RECON_OK ? c.presentTint : c.dangerTint,
                  color: RECON_OK ? c.presentText : c.dangerText,
                })}
              >
                {RECON_OK ? t("py7.tot.ok") : t("py7.tot.fail")}
              </p>
              <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0" })}>{t("py7.cfg.newer", { v: CFG_SEP.v, d: cfgFrom(CFG_SEP) })}</p>
            </Card>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Card icon="alert" iconTone="brass" title={t("py7.block.title")} sub={t("py7.block.sub")}>
              <CheckRow
                role="late" glyph="alert" word={t("py8.flag.changed")}
                head={t("py7.block.inputs")}
                body={t("py7.block.inputsD", { p: num(CHANGED.length), d: num(CHANGED_DAYS) })}
                action={<Button size="sm" kind="secondary" onClick={() => go("pyPaidDays")}>{t("py7.block.inputsAct")}</Button>}
              />
              <CheckRow role="present" glyph="check" word={num(0)} head={t("py7.block.exc")} body={t("py7.block.excOk")} />
              <CheckRow
                role={unexplainedCrossed.length === 0 ? "present" : "absent"}
                glyph={unexplainedCrossed.length === 0 ? "check" : "alert"}
                word={num(unexplainedCrossed.length)}
                head={t("py7.block.var")}
                body={unexplainedCrossed.length === 0
                  ? t("py7.block.varOk", { n: num(VAR_CROSSED.length) })
                  : t("py7.block.varBad", { n: num(unexplainedCrossed.length) })}
                action={<LinkButton onClick={() => setTab("var")}>{t("py7.act.variance")}</LinkButton>}
              />
              <CheckRow role="present" glyph="check" word={num(0)} head={t("py7.block.salary")} body={t("py7.block.salaryOk", { n: num(HEADCOUNT) })} />
              <CheckRow
                role="late" glyph="alert" word={num(HOLDS.length)} last
                head={t("py7.block.holds")} body={t("py7.block.holdsD", { n: num(HOLDS.length) })}
                action={<LinkButton onClick={() => setTab("holds")}>{t("py1.ready.open")}</LinkButton>}
              />
            </Card>
          </div>
        </div>

        {/* ---- the detail, in tabs ---- */}
        <Tabs
          idBase={TABS_ID} ariaLabel={t("py7.title")} active={tab} onChange={setTab}
          items={[
            { key: "groups", label: t("py7.tab.groups") },
            { key: "var", label: t("py7.tab.var") + " · " + num(VAR_ROWS.length) },
            { key: "holds", label: t("py7.tab.holds") },
            { key: "trail", label: t("py7.tab.trail") },
          ]}
        />

        {tab === "groups" ? (
          <TabPanel idBase={TABS_ID} tabKey="groups" style={{ paddingTop: L.gap }}>
            <div style={{ display: "flex", flexDirection: "column", gap: L.gap }}>
              <Register
                title={t("py7.pg.title")} sub={t("py7.pg.sub")}
                columns={groupCols}
                rows={GROUPS.map((g) => ({
                  id: g.key,
                  cells: {
                    g: <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(g.nameKey)}</span>,
                    kind: <span style={ty("small", { color: c.inkMuted })}>{t(g.kindKey)}</span>,
                    heads: num(g.heads),
                    gross: inr(groupGross(g)),
                    ded: inr(groupDed(g)),
                    net: inr(groupNet(g)),
                    emp: groupEmp(g) === 0 ? "—" : inr(groupEmp(g)),
                  },
                }))}
                totals={{
                  label: t("py7.pg.total"),
                  cells: {
                    g: t("py7.pg.total"), heads: num(RUN_HEADS), gross: inr(RUN_GROSS),
                    ded: inr(RUN_DED), net: inr(RUN_NET), emp: inr(RUN_EMPLOYER),
                  },
                }}
                footer={<p style={ty("caption", { color: c.inkMuted, margin: 0 })}>{t("py7.cfg.noRates")}</p>}
              />
              <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", flexWrap: "wrap" }}>
                <LineReg title={t("py7.earn.title")} lines={EARN_LINES} totalLabel={t("py7.tot.gross")} total={sum(EARN_LINES)} />
                <LineReg title={t("py7.ded.title")} lines={DED_LINES} totalLabel={t("py7.col.dedn")} total={sum(DED_LINES)} />
                <LineReg title={t("py7.emp.title")} lines={EMP_LINES} totalLabel={t("py7.tot.employer")} total={sum(EMP_LINES)} />
              </div>
            </div>
          </TabPanel>
        ) : null}

        {tab === "var" ? (
          <TabPanel idBase={TABS_ID} tabKey="var" style={{ paddingTop: L.gap }}>
            <Register
              title={t("py7.var.title")} sub={t("py7.var.sub")}
              chips={[
                <Chip key="gate" bg={c.accentSoft} fg={c.action}>{t("py7.var.gate", { pct: gatePct(), amt: inr(PAY_POLICY.varAbs, { paise: false }) })}</Chip>,
                <Chip key="src" bg={c.sunken} fg={c.inkMuted} mono>{PAY_POLICY.v}</Chip>,
              ]}
              columns={varCols}
              rows={VAR_ROWS.map((r) => {
                const crossed = varCrossed(r);
                const delta = varDelta(r);
                const expl = extraExpl[r.id];
                return {
                  id: r.id,
                  tone: crossed ? null : "dim",
                  cells: {
                    who: (
                      <span>
                        <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(r.nameKey)}</span>
                        <span style={G3.fig("micro", { display: "block", color: c.inkFaint, marginTop: 2 })}>{r.id} · {t(r.groupKey)}</span>
                      </span>
                    ),
                    cause: (
                      <span>
                        <span style={ty("small", { display: "block", color: c.ink })}>{t(r.causeKey)}</span>
                        <span style={{ display: "inline-flex", marginTop: 4 }}>
                          <StatusMark
                            role={crossed ? "late" : "off"} glyph={crossed ? "alert" : "check"}
                            word={r.prev == null ? t("py7.var.noPrior") : crossed ? t("py7.var.crossed") : t("py7.var.below")}
                          />
                        </span>
                      </span>
                    ),
                    prev: r.prev == null ? "—" : inr(r.prev),
                    cur: inr(varCur(r)),
                    delta: (
                      <span style={{ color: delta < 0 ? c.absentText : c.presentText, fontWeight: 700 }}>
                        {(delta > 0 ? "+" : "") + inr(delta)}
                      </span>
                    ),
                    expl: r.explBy
                      ? <span style={ty("caption", { color: c.inkMuted })}>{t(r.explBy)} · {stamp(t, r.explAt)}</span>
                      : expl
                        ? <span style={ty("caption", { color: c.inkMuted })}>{t("py.maker")} · {t("py.justNow")}<br />{expl.note}</span>
                        : <StatusMark role="off" glyph="clock" word={t("py7.var.unexplained")} />,
                    menu: (
                      <ActionMenu
                        ariaLabel={t("py7.var.menuAria", { name: t(r.nameKey) })}
                        items={[{
                          key: "explain", icon: "document", label: t("py7.var.explain"),
                          disabled: withChecker, reason: withChecker ? t("py7.var.explainOff") : null,
                          onSelect: () => setExplainId(r.id),
                        }]}
                      />
                    ),
                  },
                };
              })}
              footer={
                <div style={{ minWidth: 0 }}>
                  <p style={ty("small", { color: c.ink, margin: 0, fontWeight: 600 })}>{t("py7.var.noAuto")}</p>
                  <p style={ty("caption", { color: c.inkMuted, margin: "5px 0 0" })}>{t("py7.var.gateSrc", { v: PAY_POLICY.v, d: cfgFrom(PAY_POLICY) })}</p>
                  <p style={ty("caption", { color: c.inkMuted, margin: "5px 0 0" })}>{t("py7.var.rest", { n: num(VAR_UNCHANGED) })}</p>
                  <p style={ty("caption", { color: c.inkFaint, margin: "5px 0 0" })}>{t("py7.var.pii")}</p>
                </div>
              }
            />
            {explainTarget ? (
              <ReasonPrompt
                idBase="py7-expl"
                title={t("py7.var.explTitle")}
                body={t("py7.var.explBody", { name: t(explainTarget.nameKey), amt: inr(Math.abs(varDelta(explainTarget))) })}
                options={["py7.var.cause.joiner", "py7.var.cause.leaver", "py7.var.cause.lop", "py7.var.cause.revision", "py7.var.cause.loan", "py7.var.cause.decl", "py7.var.cause.units"]}
                onConfirm={(r) => { setExtraExpl(Object.assign({}, extraExpl, { [explainTarget.id]: r })); setExplainId(null); }}
                onCancel={() => setExplainId(null)}
              />
            ) : null}
          </TabPanel>
        ) : null}

        {tab === "holds" ? (
          <TabPanel idBase={TABS_ID} tabKey="holds" style={{ paddingTop: L.gap }}>
            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Register
                  title={t("py7.hold.title")} sub={t("py7.hold.sub")}
                  columns={[
                    { key: "who", label: t("py7.col.person") },
                    { key: "bank", label: t("py7.col.bank"), mono: true, width: 150 },
                    { key: "amt", label: t("py7.col.amount"), align: "right", mono: true, width: 150 },
                    { key: "why", label: t("py7.col.reason") },
                    { key: "act", label: "", align: "right", width: 180 },
                  ]}
                  rows={HOLDS.map((h) => ({
                    id: h.id,
                    cells: {
                      who: (
                        <span>
                          <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(h.nameKey)}</span>
                          <span style={G3.fig("micro", { display: "block", color: c.inkFaint, marginTop: 2 })}>{h.id}</span>
                        </span>
                      ),
                      bank: h.bank,
                      amt: inr(h.v),
                      why: (
                        <span>
                          <span style={ty("small", { display: "block", color: c.ink })}>{t(h.reasonKey)}</span>
                          <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t(h.byKey)} · {stamp(t, h.at)}</span>
                        </span>
                      ),
                      act: withChecker
                        ? <span style={ty("caption", { color: c.inkFaint })}>{t("py7.hold.releaseOff")}</span>
                        : <Button size="sm" kind="secondary">{t("py7.hold.release")}</Button>,
                    },
                  }))}
                  totals={{ label: t("py7.tot.held"), cells: { amt: inr(HELD_TOTAL) } }}
                  footer={
                    <div>
                      <p style={ty("small", { color: c.ink, margin: 0 })}>{t("py7.hold.warn")}</p>
                      <p style={ty("caption", { color: c.inkMuted, margin: "5px 0 0" })}>{t("py7.hold.mask")}</p>
                    </div>
                  }
                />
              </div>
              <div style={{ width: L.colNarrow, flex: "0 0 " + L.colNarrow + "px" }}>
                <Card icon="list" iconTone="info" title={t("py7.inc.title")}>
                  {[
                    { k: "loans", inRun: true, v: LOAN_TOTAL, d: t("py7.inc.loansD", { n: num(LOAN_COUNT) }) },
                    { k: "arrears", inRun: true, v: ARREAR_TOTAL, d: t("py7.inc.arrearsD", { n: num(ARREAR_PEOPLE) }) },
                    { k: "reimb", inRun: false, v: REIMB.v, d: t("py7.inc.reimbD", { n: num(REIMB.claims) }) },
                    { k: "bonus", inRun: null, v: null, d: t("py7.inc.bonusD") },
                  ].map((row, i, arr) => (
                    <div key={row.k} style={{ padding: "12px 0", borderBottom: i === arr.length - 1 ? "none" : "1px solid " + c.rule }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                        <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("py7.inc." + row.k)}</span>
                        {row.v == null ? <span style={ty("small", { color: c.inkFaint })}>—</span> : <Figure value={inr(row.v)} size="md" weight={700} color={c.ink} />}
                      </div>
                      {row.inRun == null ? null : (
                        <div style={{ marginTop: 6 }}>
                          <Chip bg={row.inRun ? c.presentTint : c.lateTint} fg={row.inRun ? c.presentText : c.lateText}>
                            {t(row.inRun ? "py7.inc.in" : "py7.inc.out")}
                          </Chip>
                        </div>
                      )}
                      <p style={ty("caption", { color: c.inkMuted, margin: "7px 0 0" })}>{row.d}</p>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </TabPanel>
        ) : null}

        {tab === "trail" ? (
          <TabPanel idBase={TABS_ID} tabKey="trail" style={{ paddingTop: L.gap }}>
            <Card icon="filing" iconTone="brass" title={t("py7.tr.title")} sub={t("py7.tr.sub")}>
              <TrailList entries={baseTrail.concat(added)} />
              <p style={ty("small", { color: c.inkMuted, margin: "18px 0 0", paddingTop: 14, borderTop: "1px solid " + c.border })}>{t("py.appendOnly")}</p>
            </Card>
          </TabPanel>
        ) : null}
      </Shell>
    );
  }

  /* ============================================================
     PY-08 · PAID-DAYS RECONCILIATION
     "Why does this person's paid-days figure say what it says?"

     Spec: screen-inventory PY-08 (every action built), M9 §Business
     rules (the paid-days identity), M9 §Acceptance (mid-month joiner),
     M10 §Business rules (proration), M10 §Workflow (this is the run's
     FIRST computational step).

     Money appears nowhere on this screen, on purpose: the inventory
     puts money on PY-09/PY-10, and a day's price is a decision taken
     on the run. What this screen owns is the derivation — every figure
     traceable to named days from a named source.
     ============================================================ */
  const CODE_ROLE = { P: "present", L: "leave", H: "holiday", W: "off", X: "absent", N: "missing", Y: "leave" };

  /* ------------------------------------------------------------
     THE FIVE UNPAID DAYS, EACH WITH ITS CAUSE.

     These are not a second list beside the register's loss-of-pay
     column — they ARE that column, with the reason the column never
     had room for. PEOPLE[].lop and ISSUES[].d are the same days, and
     the screen checks it (PY8_QUEUE_MATCHES) rather than asserting it.

     Four causes, which is what a school actually sees:
       noIn    — punched out, never in (gate reader, side entrance)
       noOut   — punched in, never out (left by another gate)
       short   — both punches, hours well under the shift
       noLeave — away all day, and the leave was never applied for
     ------------------------------------------------------------ */
  const ISSUES = [
    { id: "FX-0118", staffId: "NAV-0209", d: 12, kind: "noOut", inT: "08:12", outT: null, shift: "08:30-16:30", need: 8, noteKey: "py8.fx.n.sideGate" },
    { id: "FX-0119", staffId: "NAV-0209", d: 13, kind: "short", inT: "09:40", outT: "13:05", shift: "08:30-16:30", need: 8, noteKey: "py8.fx.n.halfDay" },
    { id: "FX-0120", staffId: "NAV-0388", d: 3, kind: "noIn", inT: null, outT: "16:41", shift: "09:00-17:00", need: 8, noteKey: "py8.fx.n.outage" },
    { id: "FX-0121", staffId: "NAV-0388", d: 4, kind: "noIn", inT: null, outT: "16:52", shift: "09:00-17:00", need: 8, noteKey: "py8.fx.n.outage" },
    { id: "FX-0122", staffId: "NAV-0355", d: 27, kind: "noLeave", inT: null, outT: null, shift: "09:00-17:00", need: 8, noteKey: "py8.fx.n.told" },
  ];

  /* the queue and the register have to be the same days */
  const PY8_QUEUE_MATCHES = (function () {
    const fromPeople = [];
    PEOPLE.forEach((p) => (p.lop || []).forEach((d) => fromPeople.push(p.id + ":" + d)));
    const fromIssues = ISSUES.map((i) => i.staffId + ":" + i.d);
    return fromPeople.length === fromIssues.length
      && fromPeople.every((k) => fromIssues.indexOf(k) !== -1);
  })();

  const FIX_KINDS = ["noIn", "noOut", "short", "noLeave"];

  /* what a fix is allowed to write, per cause. A day with no punch at
     all and no leave behind it cannot simply become "present" — there
     is nothing to be present on the strength of — so noLeave offers
     leave or loss of pay, and nothing else. */
  const FIX_CHOICES = {
    noIn: ["full", "half", "lop"],
    noOut: ["full", "half", "lop"],
    short: ["full", "half", "lop"],
    noLeave: ["leave", "lop"],
  };
  /* what each outcome is worth in paid days */
  const FIX_CREDIT = { full: 1, leave: 1, half: 0.5, lop: 0 };
  /* and what letter the day then carries on the grid */
  const FIX_CODE = { full: "P", leave: "L", half: "Y", lop: "X" };

  const LEAVE_TYPES = ["CL", "SL", "EL"];

  /* nothing is fixed FROM this screen any more; HR's Days to fix
     owns that. The empty map keeps one figuresFor() serving both the
     register and the trace. */
  const NO_FIXES = {};

  function issuesFor(id) { return ISSUES.filter((i) => i.staffId === id); }
  function creditFor(id, fixes) {
    return issuesFor(id).reduce((s, i) => s + (fixes[i.id] ? FIX_CREDIT[fixes[i.id].outcome] : 0), 0);
  }
  /* one place decides what a person's figures are, so the queue, the
     register, the totals and the day grid cannot disagree */
  function figuresFor(p, fixes) {
    const base = buildDays(p);
    const credit = creditFor(p.id, fixes);
    return {
      base: base,
      inService: base.inService,
      unpaid: base.counts.X - credit,
      paid: base.paid + credit,
    };
  }
  function dayNum(n) { return n === Math.round(n) ? num(n) : num(Math.floor(n)) + "\u00bd"; }
  function fixDate(t, d) { return num(d) + " " + t("py.mon." + PERIOD_MON) + " " + String(YEAR); }

  function DayGrid({ codes }) {
    const { c } = useTheme();
    const { t } = useLang();
    const lead = codes.length ? codes[0].wd : 0;
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(<span key={"b" + i} aria-hidden="true" />);
    codes.forEach((d) => {
      const role = CODE_ROLE[d.code];
      const tint = d.code === "N" ? c.sunken : c[role + "Tint"];
      const fg = d.code === "N" ? c.inkFaint : c[role + "Text"];
      cells.push(
        <span
          key={d.d}
          title={num(d.d) + " · " + t("py8.codeName." + d.code)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            width: 42, height: 44, borderRadius: G3.r.sm, background: tint, color: fg,
          }}
        >
          <span style={G3.fig("micro", { opacity: 0.85 })}>{num(d.d)}</span>
          <span style={G3.fig("xs", { fontWeight: 700, marginTop: 1 })}>{t("py8.code." + d.code)}</span>
        </span>
      );
    });
    const heads = [0, 1, 2, 3, 4, 5, 6].map((w) => (
      <span key={"h" + w} aria-hidden="true" style={G3.fig("micro", { color: c.inkFaint, textAlign: "center", fontWeight: 700, paddingBottom: 2 })}>
        {t("py8.wd." + w)}
      </span>
    ));
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 42px)", gap: 5 }}>{heads.concat(cells)}</div>;
  }

  /* a run of day numbers, printed the way somebody reads a date list
     out loud: 1–6 is a span, 8, 11 are separate. A wall of 24 commas
     is not a trace, it is a hiding place. */
  function dayRun(nums) {
    const s = nums.slice().sort((a, b) => a - b);
    const out = [];
    let i = 0;
    while (i < s.length) {
      let j = i;
      while (j + 1 < s.length && s[j + 1] === s[j] + 1) j += 1;
      out.push(j > i + 1 ? num(s[i]) + "\u2013" + num(s[j]) : j === i + 1 ? num(s[i]) + ", " + num(s[j]) : num(s[i]));
      i = j + 1;
    }
    return out.join(", ");
  }

  /* WHERE EVERY DAY CAME FROM. The register says 29; the detail says
     which five buckets make 29; this says WHICH DATES are in each
     bucket and who put them there. It is the answer to "prove it",
     which is the only question a paid-days figure ever gets asked. */
  function TracePanel({ p, fixes, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const f = figuresFor(p, fixes);
    const mine = issuesFor(p.id);
    const fixedCode = {};
    mine.forEach((i) => { if (fixes[i.id]) fixedCode[i.d] = FIX_CODE[fixes[i.id].outcome]; });

    /* every day, bucketed by where it came from rather than by letter:
       a day put right on this screen is no longer "the readers said so" */
    const bucket = { P: [], L: [], H: [], W: [], X: [], N: [] };
    f.base.codes.forEach((d) => {
      if (fixedCode[d.d]) return;              /* it belongs to the fixes below */
      bucket[d.code].push(d.d);
    });

    const rows = [
      { k: "bio", days: bucket.P, key: "py8.det.srcBio" },
      { k: "leave", days: bucket.L, key: "py8.det.srcLeave", vars: { who: t("py.deptHead") } },
      { k: "hol", days: bucket.H, key: "py8.det.srcHol" },
      { k: "off", days: bucket.W, key: "py8.det.srcOff" },
      { k: "lop", days: bucket.X, key: "py8.det.srcLop" },
      { k: "none", days: bucket.N, key: p.joined ? "py8.det.srcJoin" : "py8.det.srcLeft" },
    ].filter((r) => r.days.length);

    const decided = mine.filter((i) => fixes[i.id]);
    const stillOpen = mine.filter((i) => !fixes[i.id]);

    return (
      <SideScreen
        title={t("py8.tr.title")}
        sub={t(p.nameKey) + " \u00b7 " + p.id + " \u00b7 " + t("py.mon." + PERIOD_MON) + " " + String(YEAR)}
        width={660}
        onClose={onClose}
        footer={<Button kind="ghost" size="sm" onClick={onClose}>{t("py8.det.close")}</Button>}
      >
        <p style={ty("small", { color: c.ink, margin: 0, fontWeight: 600 })}>
          {t("py8.det.arith2", { serv: num(f.inService), x: dayNum(f.unpaid), paid: dayNum(f.paid) })}
        </p>
        <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>{t("py8.tr.sub")}</p>

        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 4 })}>{t("py8.tr.from")}</div>
          {rows.map((r, i) => (
            <div key={r.k} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "11px 0", borderTop: "1px solid " + (i ? c.rule : c.border) }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink })}>{t(r.key, r.vars || {})}</span>
                <span style={G3.fig("micro", { display: "block", color: c.inkFaint, marginTop: 3 })}>{dayRun(r.days)}</span>
              </span>
              <span style={G3.fig("sm", { color: c.ink, fontWeight: 700, flexShrink: 0 })}>{t(r.days.length === 1 ? "py8.tr.nDay" : "py8.tr.nDays", { n: num(r.days.length) })}</span>
            </div>
          ))}
        </div>

        {/* THE DAYS SOMEBODY DECIDED — named, dated, and with the
            reason, because these are the only days on the month that
            a person chose rather than a reader recorded */}
        {decided.length ? (
          <div style={{ marginTop: 22, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 4 })}>{t("py8.tr.decided")}</div>
            {decided.map((i, n) => (
              <div key={i.id} style={{ padding: "11px 0", borderTop: "1px solid " + (n ? c.rule : c.border) }}>
                <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{fixDate(t, i.d)}</span>
                  <StatusMark
                    role={fixes[i.id].outcome === "lop" ? "absent" : fixes[i.id].outcome === "half" ? "leave" : "present"}
                    glyph="check" word={t("py8.fx.o." + fixes[i.id].outcome)}
                  />
                </div>
                <p style={ty("caption", { color: c.inkMuted, margin: "5px 0 0" })}>{t("py8.fx.k." + i.kind)} · {i.id}</p>
                <p style={ty("small", { color: c.ink, margin: "5px 0 0" })}>{"\u201c" + fixes[i.id].why + "\u201d"}</p>
                <p style={ty("caption", { color: c.inkFaint, margin: "4px 0 0" })}>{t("py8.tr.by", { who: t("py.maker"), role: t("py.roleMaker") })}</p>
              </div>
            ))}
          </div>
        ) : null}

        {stillOpen.length ? (
          <div style={{ marginTop: 22, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("py8.tr.open")}</div>
            {stillOpen.map((i) => (
              <div key={i.id} style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "7px 0", flexWrap: "wrap" }}>
                <span style={ty("small", { color: c.ink })}>{fixDate(t, i.d)}</span>
                <StatusMark role="absent" glyph="alert" word={t("py8.fx.k." + i.kind)} />
              </div>
            ))}
            <p style={ty("caption", { color: c.inkMuted, margin: "9px 0 0" })}>{t("py8.tr.openNote")}</p>
          </div>
        ) : null}

        <p style={ty("caption", { color: c.inkFaint, margin: "22px 0 0", paddingTop: 14, borderTop: "1px solid " + c.rule })}>
          {t("py8.tr.foot", { run: RUN_ID })}
        </p>
      </SideScreen>
    );
  }

  function PersonDetail({ row, fixes, onClose, onTrace, onOpenRecord, onSendHR, sentHR }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!row) {
      return (
        <Card icon="scan" iconTone="info" title={t("py8.det.empty")}>
          <EmptyState head={t("py8.det.empty")} body={t("py8.det.emptyBody")} />
        </Card>
      );
    }
    if (row.p.unitsPaid) {
      return (
        <Card
          icon="briefcase" iconTone="brass"
          title={t("py8.det.title", { name: t(row.p.nameKey) })}
          sub={t("py8.det.sub", { id: row.p.id, group: t(row.p.groupKey) })}
          action={<Button size="sm" kind="quiet" onClick={onClose}>{t("py8.det.close")}</Button>}
        >
          <div style={ty("h3", { color: c.ink })}>{t("py8.det.units")}</div>
          <p style={ty("small", { color: c.inkMuted, margin: "6px 0 0", maxWidth: 620 })}>{t("py8.det.unitsBody")}</p>
        </Card>
      );
    }
    /* a fixed day changes its letter here and nowhere else, so the
       grid, the counts and the arithmetic move together */
    const mine = issuesFor(row.p.id);
    const fixedCode = {};
    mine.forEach((i) => { if (fixes[i.id]) fixedCode[i.d] = FIX_CODE[fixes[i.id].outcome]; });
    const codes = row.days.codes.map((d) => (fixedCode[d.d] ? Object.assign({}, d, { code: fixedCode[d.d] }) : d));
    const cn = { P: 0, L: 0, H: 0, W: 0, X: 0, N: 0, Y: 0 };
    codes.forEach((d) => { cn[d.code] += 1; });
    const f = figuresFor(row.p, fixes);

    const sources = [
      { code: "P", n: cn.P, key: "py8.det.srcBio" },
      { code: "L", n: cn.L, key: "py8.det.srcLeave", vars: { who: t("py.deptHead") } },
      { code: "Y", n: cn.Y, key: "py8.det.srcHalf" },
      { code: "H", n: cn.H, key: "py8.det.srcHol" },
      { code: "W", n: cn.W, key: "py8.det.srcOff" },
      { code: "X", n: cn.X, key: "py8.det.srcLop" },
      { code: "N", n: cn.N, key: row.p.joined ? "py8.det.srcJoin" : "py8.det.srcLeft" },
    ].filter((s) => s.n > 0);

    return (
      <Card
        icon="attendance" iconTone="accent"
        title={t("py8.det.title", { name: t(row.p.nameKey) })}
        sub={t("py8.det.sub", { id: row.p.id, group: t(row.p.groupKey) })}
        action={<Button size="sm" kind="quiet" onClick={onClose}>{t("py8.det.close")}</Button>}
      >
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flexShrink: 0 }}>
            <DayGrid codes={codes} />
          </div>
          <div style={{ flex: "1 1 240px", minWidth: 220 }}>
            <Fact label={t("py8.col.paid")} w={220}>
              <Figure value={t("py8.det.paid", { paid: dayNum(f.paid), inservice: num(f.inService) })} size="md" weight={700} color={c.ink} />
            </Fact>
            <p style={ty("small", { color: c.ink, margin: "10px 0 0" })}>
              {t("py8.det.arith2", { serv: num(f.inService), x: dayNum(f.unpaid), paid: dayNum(f.paid) })}
            </p>
            <div style={{ marginTop: 16 }}>
              <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 })}>{t("py8.det.source")}</div>
              {sources.map((s) => (
                <div key={s.code} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", borderBottom: "1px dashed " + c.border }}>
                  <span
                    aria-hidden="true"
                    style={G3.fig("xs", {
                      width: 26, height: 22, borderRadius: G3.r.xs, flexShrink: 0, fontWeight: 700,
                      background: c[CODE_ROLE[s.code] + "Tint"], color: c[CODE_ROLE[s.code] + "Text"],
                      display: "flex", alignItems: "center", justifyContent: "center",
                    })}
                  >
                    {t("py8.code." + s.code)}
                  </span>
                  <span style={ty("small", { color: c.inkMuted, flex: 1, minWidth: 0 })}>{t(s.key, s.vars || {})}</span>
                  <Figure value={num(s.n)} size="sm" weight={700} color={c.ink} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button size="sm" kind="primary" iconLeft="scan" onClick={onTrace}>{t("py8.menu.trace")}</Button>
              <Button size="sm" kind="secondary" iconLeft="payslip" onClick={onOpenRecord}>{t("py8.menu.payRecord")}</Button>
            </div>
            {onSendHR ? (
              <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid " + c.rule }}>
                {sentHR ? (
                  <StatusMark role="leave" glyph="mail" word={t("py8.hr.with")} />
                ) : (
                  <div>
                    <Button size="sm" kind="secondary" iconLeft="mail" onClick={onSendHR}>{t("py8.hr.send")}</Button>
                    <p style={ty("caption", { color: c.inkMuted, margin: "7px 0 0" })}>{t("py8.hr.why")}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  /* Asking HR to look again. It names the days in question, says who
     will receive it, and states the consequence plainly: the run stays
     blocked on this person until HR answers, because paid days are
     what pay is prorated from. */
  function VerifyPrompt({ p, onCancel, onSend }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!p) return null;
    const mine = issuesFor(p.id);
    return (
      <SideScreen
        title={t("py8.hr.title")}
        sub={t("py8.hr.sub", { name: t(p.nameKey) })}
        onClose={onCancel}
        width={560}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button kind="quiet" onClick={onCancel}>{t("py8.hr.cancel")}</Button>
            <Button onClick={onSend}>{t("py8.hr.go")}</Button>
          </div>
        }
      >
        <p style={ty("small", { color: c.ink, margin: 0, maxWidth: "62ch" })}>
          {mine.length
            ? t("py8.hr.bodyN", { n: num(mine.length), name: t(p.nameKey) })
            : t("py8.hr.body0", { name: t(p.nameKey) })}
        </p>
        <p style={ty("caption", { color: c.inkMuted, margin: "12px 0 0", maxWidth: "62ch" })}>
          {t("py8.hr.consequence", { who: t("py8.hr.who") })}
        </p>
      </SideScreen>
    );
  }


  /* ============================================================
     PROMOTION CANDIDATES for design/v3/kit.jsx (not added here —
     kit.jsx is out of this file's scope):
     · EqRow / Ledger      — the signed arithmetic column. Second
                             independent use (pages/payslips.jsx has an
                             identical local copy). Promote.
     · ReasonPrompt        — reason code + note + never-disabled
                             confirm. Needed by AC-02, arrears, F&F,
                             bonus, retention — every screen that
                             finalises money.
     · OffAction           — a control that is off, with the reason in
                             words and a live announcement on click.
     · TrailList           — the append-only activity record; O6 wants
                             one on employee, document, payslip, run,
                             filing, claim and appraisal.
     · IdentityPanel / SignOff — the two-person maker/checker block.
                             AC-02 is the other half of this pattern.
     · Fact                — a labelled read-out, the alternative to a
                             KPI tile grid.
     · DayGrid             — the letter-coded month; Home and My
                             Attendance both draw their own variant.
     ============================================================ */

  window.Pages3 = window.Pages3 || {};
  /* PYHome now lives in pages/py-home.jsx, which answers one
     question -- what needs me today -- instead of mirroring every
     module back at the officer. */
  /* PYRun now lives in pages/py-run.jsx, which makes the pipeline the
     spine of the page and adds the cut-off and the three different
     ways not to pay somebody. This file keeps its other screens. */
})();
