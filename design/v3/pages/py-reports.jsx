/* @jsxRuntime classic */
/* ============================================================
   Naveya — Registers and reports · window.Pages3.PYReports

   WHAT THIS MODULE IS FOR. Somebody asks the payroll officer for a
   number: the auditor, the trustee, the principal, the bank, the
   accountant closing the books. This is where every number the
   school might be asked for is kept, and the module's whole job is
   that none of them can be handed over without its provenance.

   THE THESIS, KEPT FROM THE SCREEN IT REPLACES: every report states
   THE PERIOD it covers, THE RUN it derives from, THE CONFIGURATION
   VERSION that run pinned, and THE LINE THAT RECONCILES IT. A figure
   without those four is a figure somebody will have to defend from
   memory a year later.

   AND THE ONE RULE THAT MATTERS MOST: a report from a run that is
   not approved is PROVISIONAL, and says so on its face. A working
   figure handed over as final is the fastest way to lose a school's
   trust, so provisional is not a footnote here -- it is on the
   period, on every row derived from it, and on the export.

   WHY IT IS A CATALOGUE AND NOT A TAB BAR. There are fourteen
   registers across four subjects. Tabs would make the reader learn
   a new layout per subject and would hide the thing they came for.
   A catalogue answers "where is the number I was asked for" in one
   read: the subject, what the report answers, what it covers, and
   whether it is safe to send.

   WHAT IT COVERS, AND WHERE EACH ONE READS FROM:
     THE RUN       the run history, the payroll register (PY-10), the
                   variance review (PY-09), the bank file (PY-11),
                   statutory contributions, the pay-group summary and
                   paid days.
     ADJUSTMENTS   reimbursement claims, overtime, loans and
                   advances, arrears, and the rises payroll settled --
                   read from the adjustments module and the shared
                   pay-request store, never retyped.
     EXITS         full and final settlements, from the exits module.
     PEOPLE        headcount movement and cost over the session.

   Three of them are existing screens -- the register, the variance
   review and the bank file are STAGES OF A RUN as well as reports,
   and they open here the same way they open from the run. One
   object, two ways in, no second copy.

   SPEC — docs/development-specification.md M10, M15 (a payroll
   register reconciles to the sum of payslips); screen-inventory
   PY-18, and PY-09/PY-10/PY-11 for the three shared stages.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark,
    Icon, EmptyState, Field, Input, Select, ActionMenu, Switch, Tabs, Modal,
    BackBar, Meter, MetricCell, inr, num, Band,
    CampusSwitch, campusLabel, inCampus, campusOfCode, CAMPUS_ALL,
  } = UI;

  const D = (window.Pages3 && window.Pages3.PYRunData) || null;
  const A = (window.Pages3 && window.Pages3.PYAdjData) || null;
  const X = (window.Pages3 && window.Pages3.PYExitData) || null;
  const Q = window.NaveyaPayRequests || null;

  const GROUPS_OF = ["run", "adjust", "exit", "people"];
  /* a register of four hundred people is read a screen at a time */
  const PAGE = 25;

  addStrings({
    en: {
      "pyrp.crumb": "Payroll",
      "pyrp.entity": "Naveya Vidya Trust — Bengaluru",
      "pyrp.title": "Registers and reports",
      "pyb.tab.registers": "Registers",
      "pyb.tab.reports": "Reports",
      "pyb.box": "What do you need?",
      "pyb.boxSub": "What you need, over what stretch of time, and in what form. The strip at the foot says what the artefact will contain.",
      "pyb.f.module": "Module",
      "pyb.f.report": "Report",
      "pyb.f.reportPick": "Choose a report",
      "pyb.f.span": "Covering",
      "pyb.span.month": "One month",
      "pyb.span.quarter": "A quarter",
      "pyb.span.fy": "The session so far",
      "pyb.span.range": "Between two dates",
      "pyb.f.month": "Month",
      "pyb.f.quarter": "Quarter",
      "pyb.f.from": "From",
      "pyb.f.to": "To",
      "pyb.q1": "Quarter 1 · April to June",
      "pyb.q2": "Quarter 2 · July to September",
      "pyb.fyLabel": "April onward",
      "pyb.err.order": "The second date comes before the first",
      "pyb.err.empty": "No month on this desk falls in that range",
      "pyb.f.format": "Format",
      "pyb.fmt.csv": "CSV — for working with",
      "pyb.fmt.pdf": "PDF — for sending",
      "pyb.f.pii": "Include personal identifiers",
      "pyb.f.piiHint": "Bank account, PAN and UAN. Off unless somebody outside this desk needs them \u2014 an export of these is a disclosure.",
      "pyb.f.piiReason": "Why they are needed",
      "pyb.f.piiReasonHint": "Required. It is recorded with the export and is what an auditor reads first.",
      "pyb.f.piiPick": "Choose a reason",
      "pyb.pii1": "The bank asked for it against a returned payment",
      "pyb.pii2": "The statutory auditor’s sample for this year",
      "pyb.pii3": "A correction the accountant needs per employee",
      "pyb.out.covers": "Covers",
      "pyb.out.months": "{n} months",
      "pyb.out.month1": "1 month",
      "pyb.out.lines": "Lines",
      "pyb.out.linesNote": "{per} per month across {n}.",
      "pyb.out.linesFlat": "A summary, not a line per person.",
      "pyb.out.total": "Total it reports",
      "pyb.out.from": "Derives from",
      "pyb.out.cfg": "Computed on",
      "pyb.out.cfgOne": "One version across the whole range.",
      "pyb.out.cfgMany": "The range crosses a change of rules. The artefact names the version each month used \u2014 an average across a change will not reconcile.",
      "pyb.out.state": "Safe to send",
      "pyb.out.finalNote": "Every run in this range is disbursed.",
      "pyb.out.provNote": "{m} is not disbursed yet, so everything derived from it is a working figure. The artefact is marked provisional on every page.",
      "pyb.go": "Produce it",
      "pyb.goReady": "Ready to produce.",
      "pyb.goBlocked": "Choose a report and a range first",
      "pyb.goNeedWhy": "Say why the identifiers are needed first",
      "pyb.hist": "The reports",
      "pyb.histSub": "What this desk produced on its own and what you built. Every export carrying personal detail is recorded.",
      "pyb.histFoot": "Append-only \u2014 an export cannot be removed, because it is the evidence that a disclosure happened.",
      "pyb.col.what": "Report",
      "pyb.col.range": "Covering",
      "pyb.col.how": "Produced",
      "pyb.col.when": "When",
      "pyb.col.scope": "Scope",
      "pyb.col.state": "State",
      "pyb.how.you": "By you, on request",
      "pyb.how.auto": "Automatically, {when}",
      "pyb.when.onApproval": "when the run was approved",
      "pyb.when.onDisburse": "when the bank file went out",
      "pyb.when.onPublish": "when the payslips were published",
      "pyb.when.onCompute": "when the run was computed",
      "pyb.when.monthEnd": "at the month’s close",
      "pyb.aug": "{d} August 2026",
      "pyb.pii.carries": "carries personal data",
      "pyb.pii.without": "without personal identifiers",
      "pyb.download": "Download it",
      "pyb.close": "Close",
      "pyb.again": "Build another",
      "pyb.ready": "It is ready",
      "pyb.readySub": "Recorded against your name, with the range and the scope.",
      "pyb.readyBody": "{name}, {range}, {rows} lines, {scope}. It carries the configuration each month used and the runs it came from.",
      "pyb.dl.sub": "An audited download. Who took it and when is recorded against the artefact.",
      "pyb.dl.body": "Covering {range}. {how}. {state}. The file itself is unchanged by being taken — only the fact that you took it is added.",
      "pyb.r.register": "Payroll register",
      "pyb.r.registerQ": "The run as it was approved — earnings, deductions and net, person by person.",
      "pyb.r.variance": "Variance between months",
      "pyb.r.varianceQ": "What moved and why, which is the evidence the checker asks to have seen.",
      "pyb.r.bank": "Bank file summary",
      "pyb.r.bankQ": "What left the bank, to how many accounts, against which run.",
      "pyb.r.payslips": "Payslip issue register",
      "pyb.r.payslipsQ": "Which payslips were published, for whom, and when they were opened.",
      "pyb.r.cost": "Cost to the school",
      "pyb.r.costQ": "Gross, deductions, net and the employer-side cost, by pay group.",
      "pyb.r.paidDays": "Paid days",
      "pyb.r.paidDaysQ": "Days paid against days in the month, per person, with the loss of pay named.",
      "pyb.r.claims": "Reimbursement claims",
      "pyb.r.claimsQ": "Every claim with its category, its tax treatment and the run that paid it.",
      "pyb.r.ot": "Overtime",
      "pyb.r.otQ": "Hours settled, the rate they were priced at, and what each came to.",
      "pyb.r.loans": "Loans and advances",
      "pyb.r.loansQ": "Principal, tenure, what is recovered and what is still outstanding.",
      "pyb.r.arrears": "Arrears raised",
      "pyb.r.arrearsQ": "Month by month, each recomputed on the version in force when it belonged.",
      "pyb.r.rises": "Appraisal rises",
      "pyb.r.risesQ": "A percentage turned into components, and the run it first appeared in.",
      "pyb.r.settle": "Full and final settlements",
      "pyb.r.settleQ": "What each leaver was owed, line by line, against the three statutory clocks.",
      "pyb.r.head": "Headcount movement",
      "pyb.r.headQ": "Who joined, who left and what the roll came to at the end of each month.",
      "pyb.r.unpriced": "People with no salary assigned",
      "pyb.r.unpricedQ": "Created by HR and not yet priced — the ones a run cannot be sent with.",

      "pyrp.band": "{mon} {y}",
      "pyrp.seg.run": "The run",
      "pyrp.seg.adjust": "Adjustments",
      "pyrp.seg.exit": "Exits",
      "pyrp.seg.people": "People",

      "pyrp.m.count": "Registers",
      "pyrp.m.countNote": "Across four subjects.",
      "pyrp.m.final": "Safe to send",
      "pyrp.m.finalNote": "From a run that is paid and locked.",
      "pyrp.m.finalNone": "Nothing until {run} is approved.",
      "pyrp.m.provNone": "Every register here is final.",
      "pyrp.m.prov": "Provisional",
      "pyrp.m.provNote": "{run} is not approved yet.",
      "pyrp.m.live": "Live registers",
      "pyrp.m.liveNote": "The position now, not a month's.",

      "pyrp.prov.head": "{mon} is provisional",
      "pyrp.prov.body": "{run} is not approved, so every report on this period is a working figure and every export says so on its face.",

      "pyrp.f.period": "Period",
      "pyrp.f.subject": "Subject",
      "pyrp.f.all": "Every subject",
      "pyrp.f.clear": "Clear",

      "pyrp.reg.title": "The registers",
      "pyrp.foot": "{p} are tied to this run and carry its state. {l} are live registers — the current position, not a month's.",
      "pyrp.col.report": "Register",
      "pyrp.col.covers": "Covers",
      "pyrp.col.rows": "Rows",
      "pyrp.col.v": "Total",
      "pyrp.col.state": "State",
      "pyrp.col.act": "Actions",
      "pyrp.act.open": "Open it",
      "pyrp.act.export": "Export",
      "pyrp.act.exported": "Exported. The file says {st} on its face.",
      "pyrp.st.prov": "Provisional",
      "pyrp.st.final": "Final",
      "pyrp.st.live": "Live register",
      /* a request sitting with HR is not sitting with payroll, and
         neither of them was written down until now */
      "pyrp.st.withDesk": "With this desk",
      "pyrp.st.withHR": "With HR",
      "pyrp.none": "Nothing under these filters",
      "pyrp.noneBody": "Clear the filters to see every register.",
      "pyrp.back": "Back to the registers",

      "pyrp.covers.run": "The {mon} run",
      "pyrp.covers.period": "{mon}, across runs",
      "pyrp.covers.live": "Now",
      "pyrp.covers.thisRun": "This run and the last",
      "pyrp.covers.session": "April to September",

      "pyrp.r.history": "Run history",
      "pyrp.r.register": "Payroll register",
      "pyrp.r.variance": "Variance review",
      "pyrp.r.bank": "Bank file and disbursement",
      "pyrp.r.statutory": "Statutory contributions",
      "pyrp.r.groups": "Pay-group summary",
      "pyrp.r.paidDays": "Paid days",
      "pyrp.r.claims": "Reimbursement claims",
      "pyrp.r.ot": "Overtime",
      "pyrp.r.loans": "Loans and advances",
      "pyrp.r.arrears": "Arrears",
      "pyrp.r.rises": "Appraisal rises",
      "pyrp.r.settlements": "Full and final settlements",
      "pyrp.r.headcount": "Headcount movement",
      "pyrp.r.cost": "Cost over the session",

      "pyrp.recon.register": "The column totals reconcile to the run headline, and the run headline is the sum of {n} payslips.",
      "pyrp.recon.statutory": "Employee and employer sides are shown separately; neither is netted against the other.",
      "pyrp.recon.groups": "The pay-group rows sum to the run's gross, deductions and employer cost exactly.",
      "pyrp.recon.paidDays": "Paid days = present + paid leave + holidays + weekly offs, less loss of pay.",
      "pyrp.recon.claims": "Claimed, approved and paid are three different figures and are not netted.",
      "pyrp.recon.ot": "Hours are HR's; the money is this desk's, at the statutory multiple.",
      "pyrp.recon.loans": "Outstanding is principal plus interest, less everything recovered so far.",
      "pyrp.recon.arrears": "Each month is recomputed on the configuration that month originally pinned.",
      "pyrp.recon.rises": "The figure is what payroll set, not what the percentage came to.",
      "pyrp.recon.settlements": "Each settlement is what we owe less what we recover, and may be negative.",
      "pyrp.recon.history": "One row per campus run. The months add to what each month paid, on the rules in force in that month rather than today's.",
      "pyrp.recon.headcount": "Joiners less leavers reconciles to the change in the roll.",
      "pyrp.recon.cost": "Each step is the net difference from the month before it.",

      "pyrp.h.col.heads": "People",
      "pyrp.h.col.net": "Net paid",
      "pyrp.h.col.cfg": "Rules used",
      "pyrp.h.col.campus": "Campus",
      "pyrp.h.col.how": "How it was run",
      "pyrp.h.how.auto": "On Naveya",
      "pyrp.h.how.manual": "In a spreadsheet",
      "pyrp.h.total": "{n} runs",
      "pyrp.h.sub": "A row opens that campus's run for that month.",
      "pyrp.h.col.state": "State",

      "pyrp.s.col.head": "Contribution",
      "pyrp.s.n.PF": "Provident fund",
      "pyrp.s.n.ESI": "Employees\u2019 State Insurance",
      "pyrp.s.n.PT": "Professional tax",
      "pyrp.s.n.TDS": "Income tax",
      "pyrp.s.n.LWF": "Labour welfare fund",
      "pyrp.s.employee": "From the employee",
      "pyrp.s.employer": "From the school",
      "pyrp.s.total": "Owed to the government",

      "pyrp.g.col.group": "Pay group",
      "pyrp.g.col.heads": "People",
      "pyrp.g.col.gross": "Gross",
      "pyrp.g.col.ded": "Deductions",
      "pyrp.g.col.emp": "Employer cost",
      "pyrp.g.col.net": "Net",

      "pyrp.pd.col.group": "Pay group",
      "pyrp.pd.col.heads": "People",
      "pyrp.pd.col.month": "Days in the month",
      "pyrp.pd.col.lop": "Loss of pay",
      "pyrp.pd.col.paid": "Paid days",
      "pyrp.pd.none": "Not applicable",
      "pyrp.pd.noneWhy": "Honorarium staff are paid per unit of work, so paid days do not arise.",

      "pyrp.c.col.who": "Who",
      "pyrp.c.col.cat": "Category",
      "pyrp.c.col.v": "Claimed",
      "pyrp.c.col.state": "State",
      "pyrp.o.col.period": "Period",
      "pyrp.o.col.hours": "Hours",
      "pyrp.o.col.v": "Priced at",
      "pyrp.l.col.id": "Loan",
      "pyrp.l.col.kind": "Kind",
      "pyrp.l.col.out": "Outstanding",
      "pyrp.l.col.emi": "This month",
      "pyrp.a.col.id": "Adjustment",
      "pyrp.a.col.source": "Why",
      "pyrp.a.col.people": "People",
      "pyrp.a.col.gross": "Gross arrears",
      "pyrp.a.col.net": "Net arrears",
      "pyrp.ri.col.pct": "Increase",
      "pyrp.ri.col.from": "On a gross of",
      "pyrp.ri.col.to": "Set at",
      "pyrp.e.col.lwd": "Last working day",
      "pyrp.e.col.net": "Settlement",
      "pyrp.e.col.state": "State",
      "pyrp.hc.col.month": "Month",
      "pyrp.hc.col.heads": "On the roll",
      "pyrp.hc.col.change": "Change",
      /* both of these were called and never written: a missing
         string renders as its own key, and two registers were
         printing "pyrp.h.first" at a reader. */
      "pyrp.h.col.delta": "Change on the month",
      "pyrp.h.first": "nothing before it",
      "pyrp.cz.col.bar": "The step, against the biggest",
      "pyrp.cz.bar": "{v} on the month before",

      "pyrp.gp.total": "{n} pay groups",
      "pyrp.cx.total": "{n} claims",
      "pyrp.ox.total": "{n} priced",
      "pyrp.lx.total": "{n} loans",
      "pyrp.ax.total": "{n} adjustments",
      "pyrp.pdx.total": "Every pay group on days",
      "pyrp.showing": "{a} of {b} shown",
      "pyrp.more": "Show {n} more",
      "pyrp.f.allGroups": "Every pay group",

      "pyrp.rows.history": "One row per campus run",
      "pyrp.rows.register": "One row per person",
      "pyrp.rows.variance": "One row per person whose pay moved",
      "pyrp.rows.bank": "One row per person on the file",
      "pyrp.rows.statutory": "One row per contribution",
      "pyrp.rows.groups": "One row per pay group",
      "pyrp.rows.paidDays": "One row per pay group",
      "pyrp.rows.claims": "One row per claim",
      "pyrp.rows.ot": "One row per overtime claim",
      "pyrp.rows.loans": "One row per loan",
      "pyrp.rows.arrears": "One row per adjustment",
      "pyrp.rows.rises": "One row per rise",
      "pyrp.rows.settlements": "One row per settlement",
      "pyrp.rows.headcount": "One row per month",
      "pyrp.rows.cost": "One row per month",

      "pyrp.hi.lead": "paid since April",
      "pyrp.hi.line": "{n} runs across {k} campuses. Each one was priced on the rules in force that month, never on today\u2019s.",
      "pyrp.hi.f.runs": "runs",
      "pyrp.hi.f.done": "disbursed",
      "pyrp.hi.f.doneNote": "money has left the bank",
      "pyrp.hi.f.open": "not yet paid",
      "pyrp.hi.f.openNote": "with the checker, or sent and not released",
      "pyrp.hi.f.openNone": "every run is closed",

      "pyrp.rg.lead": "net for the month",
      "pyrp.rg.line": "{heads} people in {g} pay groups on the {mon} roll, priced on configuration {cfg}. The columns below sum to this figure.",
      "pyrp.rg.dedNote": "what comes off the gross",
      "pyrp.rg.empNote": "what the school adds on top",
      "pyrp.rg.held": "held back",
      "pyrp.rg.heldNone": "nobody",
      "pyrp.rg.heldNote": "{n} earned this month and are not being paid it",
      "pyrp.rg.search": "Name or staff number",
      "pyrp.rg.searchAria": "Search this register by name or staff number",
      "pyrp.rg.noHit": "Nobody on this register matches that",
      "pyrp.rg.noHitWhy": "Clear the search, or pick every pay group, to see all {n} again.",
      "pyrp.rg.col.who": "Who",
      "pyrp.rg.col.days": "Paid",
      "pyrp.rg.col.campus": "Campus",
      "pyrp.rg.total": "{n} people",

      "pyrp.v.lead": "moved between the two runs",
      "pyrp.v.line": "{prev} to {run}: {n} people\u2019s pay moved at all, and {rest} are unchanged. The gate is {pct} or {amt}, set in pay policy {v} \u2014 it is moved on the run, not here.",
      "pyrp.v.f.crossed": "over the gate",
      "pyrp.v.f.expl": "explained",
      "pyrp.v.f.open": "no reason yet",
      "pyrp.v.f.openNote": "the run cannot be approved until each has one",
      "pyrp.v.f.openNone": "nothing is waiting on a reason",
      "pyrp.v.f.inside": "inside the gate",
      "pyrp.v.col.cause": "Why it moved",
      "pyrp.v.col.prev": "Last run",
      "pyrp.v.col.cur": "This run",
      "pyrp.v.col.delta": "Change",
      "pyrp.v.noPrior": "not on the roll",
      "pyrp.v.st.inside": "Inside the gate",
      "pyrp.v.st.expl": "Explained",
      "pyrp.v.st.open": "Needs a reason",
      "pyrp.recon.variance": "Both runs are shown as they were computed, and the change is the difference between them \u2014 nothing here is re-priced.",

      "pyrp.bk.lead": "leaves the bank",
      "pyrp.bk.line": "{n} people on the {mon} file, against {run}. Releasing it is an act of the run; this is the file as it stands.",
      "pyrp.bk.f.payees": "people paid",
      "pyrp.bk.f.net": "earned in all",
      "pyrp.bk.f.netNote": "the register\u2019s net, before anything is held",
      "pyrp.bk.f.held": "held back",
      "pyrp.bk.f.heldNote": "{n} people, named below with the reason",
      "pyrp.bk.col.st": "On the file",
      "pyrp.bk.col.v": "Pays out",
      "pyrp.bk.st.in": "Paid in this file",
      "pyrp.bk.total": "{n} people paid",
      "pyrp.recon.bank": "What leaves the bank is the register\u2019s net less everything held back, and every person held is named with the reason.",

      "pyrp.sx.lead": "owed to the government",
      "pyrp.sx.line": "{n} contributions on this run, every rate read from configuration {cfg}.",
      "pyrp.sx.eeNote": "deducted from pay",
      "pyrp.sx.erNote": "paid on top of pay",

      "pyrp.gp.line": "{n} pay groups, {heads} people. A group is the smallest row that reconciles to the run exactly.",

      "pyrp.pdx.lead": "paid days in the month",
      "pyrp.pdx.line": "{heads} people across {d} days, less every day of loss of pay.",
      "pyrp.pdx.lopNote": "days nobody is paid for",
      "pyrp.pdx.unit": "paid per unit",
      "pyrp.pdx.unitNote": "pay groups for whom days do not arise",

      "pyrp.cx.lead": "claimed this period",
      "pyrp.cx.line": "{n} claims from {p} people. Claimed, approved and paid are three different figures and are never netted.",
      "pyrp.cx.f.claims": "claims",
      "pyrp.cx.f.people": "people",

      "pyrp.ox.lead": "priced at",
      "pyrp.ox.line": "{n} claims priced, {h} hours in all. The hours are HR\u2019s; the money is this desk\u2019s, at the statutory multiple.",
      "pyrp.ox.f.claims": "claims",
      "pyrp.ox.f.unpriced": "not priced",
      "pyrp.ox.f.unpricedNote": "waiting on this desk, so no figure yet",

      "pyrp.lx.lead": "outstanding",
      "pyrp.lx.line": "{n} loans and advances still being recovered. Outstanding is principal and interest, less everything recovered so far.",
      "pyrp.lx.f.live": "recovering",
      "pyrp.lx.f.emi": "due this month",
      "pyrp.lx.f.emiNote": "the instalments this run will take",
      "pyrp.lx.f.exit": "at exit",
      "pyrp.lx.f.exitNote": "recovered from the settlement, not from pay",

      "pyrp.ax.lead": "net arrears",
      "pyrp.ax.line": "{n} adjustments covering {p} people. Each month is recomputed on the configuration that month pinned, never on today\u2019s.",
      "pyrp.ax.grossNote": "before statutory deductions",

      "pyrp.rx.lead": "added to the monthly payroll",
      "pyrp.rx.line": "Figures are set on {n} of {all}. What is added is the difference between the old gross and the new one.",
      "pyrp.rx.f.set": "figures set",
      "pyrp.rx.f.open": "not set",
      "pyrp.rx.f.openNote": "a percentage is not a figure until this desk sets one",

      "pyrp.ex.lead": "owed on exit",
      "pyrp.ex.line": "{n} settlements. Each is what we owe less what we recover, and may come out negative.",
      "pyrp.ex.f.paid": "settled",
      "pyrp.ex.f.open": "open",
      "pyrp.ex.f.openNote": "computed, and not yet paid",

      "pyrp.hx.lead": "on the roll",
      "pyrp.hx.line": "From {a} in {mon}, across {n} months of the session.",
      "pyrp.hx.f.change": "change since April",
      "pyrp.hx.f.changeNote": "joiners less leavers",
      "pyrp.hx.f.months": "months",

      "pyrp.cz.lead": "net in {mon}",
      "pyrp.cz.line": "{n} months of the session. Each step is the net difference from the month before it.",
      "pyrp.cz.f.first": "net in {mon}",
      "pyrp.cz.f.change": "change since April",
      "pyrp.cz.f.changeNote": "the whole session\u2019s movement",

      "pyrp.empty": "Nothing in this register for this period",
      "pyrp.emptyBody": "That is a fact about the month, not a gap in the data.",
    },
  });

  function fmtRD(t, iso) {
    if (!iso) return "—";
    const p = iso.split("-");
    return num(+p[2]) + " " + t("pyr.mon." + (+p[1])) + " " + p[0];
  }
  const r2 = function (n) { return Math.round(n * 100) / 100; };

  function Shell({ role, onNavigate, title, q, chips, back, campus, onCampus, children }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "payrollOfficer"} active="pyReports" onNavigate={onNavigate} initials="SK" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("pyrp.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
                <span>{t("pyrp.entity")}</span>
                {onCampus ? <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span> : null}
                {onCampus ? <span>{campusLabel(t, campus)}</span> : null}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {onCampus ? <CampusSwitch value={campus} onChange={onCampus} /> : null}
                <ThemeToggle />
              </div>
            </div>
            {back ? <div style={{ marginBottom: 14 }}><BackBar label={back.label} onBack={back.onBack} /></div> : null}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
              <div style={{ minWidth: 320, maxWidth: 820 }}>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{title}</h1>
                <div style={ty("small", { color: c.inkMuted, marginTop: 6 })}>{q}</div>
              </div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>{chips}</div>
            </div>
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
     AN OPENED REGISTER IS A READING, NOT A DESK.

     Fifteen registers, one frame: THE FIGURE it answers, THE
     SENTENCE that accounts for it, THE THREE OR FOUR FACTS a reader
     asks for next, and then the rows. Nothing on an opened register
     changes anything -- moving a variance gate, explaining a row,
     releasing a bank file are acts of a RUN and they stay on the
     run. A screen that is half document and half desk gets read as
     neither, and signed off as both.
     ============================================================ */
  function Fact({ label, value, note }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ minWidth: 0 }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={G3.fig("md", { color: c.ink, fontWeight: 600, marginTop: 3 })}>{value}</div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 2, maxWidth: "30ch" })}>{note}</div> : null}
      </div>
    );
  }

  /* ONE FIGURE, AND THE SENTENCE THAT ACCOUNTS FOR IT -- the run
     module's headline, because a register and a run answer the same
     question and should not look like two products. */
  function Lead({ label, value, line, facts }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const live = (facts || []).filter(Boolean);
    return (
      <Card>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={G3.fig("xl", { color: c.ink, fontWeight: 700, lineHeight: 1.1, marginTop: 4 })}>{value}</div>
        {line ? <p style={ty("small", { color: c.inkMuted, margin: "8px 0 0", maxWidth: "80ch" })}>{line}</p> : null}
        {live.length ? (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: "16px 24px",
            marginTop: 17, paddingTop: 15, borderTop: "1px solid " + c.rule,
          }}>
            {live.map(function (f) { return <Fact key={f.k} label={f.label} value={f.value} note={f.note} />; })}
          </div>
        ) : null}
      </Card>
    );
  }

  function FilterChips({ items, at, onPick }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return items.map(function (x) {
      const on = at === x.k;
      return (
        <button
          key={x.k} type="button" aria-pressed={on ? "true" : "false"}
          onClick={function () { onPick(x.k); }}
          style={ty("caption", {
            border: "1px solid " + (on ? c.accent : c.border),
            background: on ? c.accentSoft : c.surface,
            color: on ? c.accent : c.inkMuted,
            borderRadius: G3.r.pill, padding: "7px 14px", cursor: "pointer",
            fontWeight: 600, display: "inline-flex", gap: 7, alignItems: "center", minHeight: 34,
          })}
        >
          {x.label}
          <span style={G3.fig("xs", { fontWeight: 700 })}>{num(x.n)}</span>
        </button>
      );
    });
  }

  /* a person is a name, a staff number and what they do -- in one
     cell, because three columns of identity push the money off the
     right-hand edge */
  function PersonCell({ name, id, sub, note }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <span style={{ display: "block", minWidth: 0 }}>
        <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{name}</span>
        <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>
          {id}{sub ? " \u00b7 " + sub : ""}
        </span>
        {note ? <span style={ty("caption", { display: "block", color: c.lateText, marginTop: 2, fontWeight: 600 })}>{note}</span> : null}
      </span>
    );
  }

  /* ============================================================
     THE REGISTERS THEMSELVES. Each builder returns one spec --
     columns, rows, totals and the line that reconciles it -- and
     one renderer draws them all, so a register cannot pick up a
     different layout from its neighbour by accident.
     ============================================================ */
  /* a spec may hand the reader on: run history lists runs, and a run
     is a place you can open */
  function ReportView({ spec }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        {spec.lead ? <Lead {...spec.lead} /> : null}
        {spec.rows.length ? (
          <Register
            /* the page's own heading already names the register, so
               the table says what a ROW is instead of saying it twice */
            title={t(spec.rowsKey || spec.titleKey)}
            sub={spec.subKey ? t(spec.subKey) : null}
            action={spec.action}
            chips={spec.chips}
            onSelect={spec.onSelect}
            columns={spec.columns}
            rows={spec.rows}
            totals={spec.totals}
            footer={
              <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", width: "100%" }}>
                <span style={{ color: c.inkMuted, maxWidth: "62ch" }}>{t(spec.reconKey, spec.reconVars || {})}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 14, marginInlineStart: "auto" }}>
                  {spec.more ? (
                    <React.Fragment>
                      <span style={ty("caption", { color: c.inkFaint, whiteSpace: "nowrap" })}>
                        {t("pyrp.showing", { a: num(spec.more.a), b: num(spec.more.b) })}
                      </span>
                      <Button size="sm" onClick={spec.more.onMore}>{t("pyrp.more", { n: num(spec.more.n) })}</Button>
                    </React.Fragment>
                  ) : null}
                  {spec.provenance
                    ? <span style={{ color: c.inkFaint, whiteSpace: "nowrap" }}>{spec.provenance}</span>
                    : null}
                </span>
              </div>
            }
          />
        ) : spec.action || spec.chips ? (
          /* THE WAY OUT STAYS ON THE SCREEN. A filter that empties a
             table must not take its own controls away with it -- the
             reader is left with a sentence and a Back button, and the
             register they wanted is two clicks behind them. */
          <Card title={t(spec.rowsKey || spec.titleKey)} action={spec.action}>
            {spec.chips ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>{spec.chips}</div>
            ) : null}
            <div style={{ borderTop: "1px solid " + c.rule, marginTop: 10, paddingTop: 10 }}>
              <EmptyState
                head={spec.empty ? spec.empty.head : t("pyrp.empty")}
                body={spec.empty ? spec.empty.body : t("pyrp.emptyBody")}
              />
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState
              head={spec.empty ? spec.empty.head : t("pyrp.empty")}
              body={spec.empty ? spec.empty.body : t("pyrp.emptyBody")}
            />
          </Card>
        )}
      </div>
    );
  }

  /* ---- the run ----

     ONE ROW PER RUN, not per month. A run belongs to a campus, was
     done one of two ways, covered a head count and reached a state;
     a month is what several of them add up to. Everything below is
     read from the run store and the roll, so this screen and the run
     module cannot hold two opinions of the same payday. */
  function specHistory(t, c, ctx) {
    const onOpenRun = ctx && ctx.onOpenRun;
    const RL = window.NaveyaRoll;
    const RS = window.NaveyaPayRuns;
    const rows = [];
    let heads = 0, net = 0, n = 0, paidN = 0;

    D.PERIODS.forEach(function (x) {
      (RL ? RL.CAMPUSES : []).forEach(function (cm) {
        if (!cm.groups) return;
        const run = RS ? RS.get(cm.id, x.m) : null;
        if (!run) return;
        const mine = RL.totals(cm.id, x.m > RL.LIVE_MONTH ? RL.LIVE_MONTH : x.m);
        const pay = RS.payableOf(cm.id, x.m);
        const done = run.state === "paid";
        heads += mine.heads; net += pay; n += 1; if (done) paidN += 1;
        rows.push({
          id: cm.id + "|" + x.m,
          tone: done ? undefined : "dim",
          cells: {
            month: (
              <span style={{ display: "block" }}>
                <span style={{ display: "block", fontWeight: 700 }}>{campusLabel(t, cm.id)}</span>
                <span style={{ display: "block", color: c.inkFaint, fontSize: 12, marginTop: 1 }}>
                  {t("pyr.mon." + x.m)} 2026 · {x.run}
                </span>
              </span>
            ),
            how: t("pyrp.h.how." + run.mode),
            heads: num(mine.heads),
            net: inr(pay),
            cfg: x.cfg.v,
            st: done
              ? <StatusMark role="present" glyph="check" word={t("pyrp.st.final")} />
              : run.state === "sent"
                ? <StatusMark role="leave" glyph="lock" word={t("pyr.st.sent")} />
                : <StatusMark role="late" glyph="clock" word={t("pyrp.st.prov")} />,
          },
        });
      });
    });

    const yards = (RL ? RL.CAMPUSES.filter(function (cm) { return cm.groups; }) : []).length;
    return {
      titleKey: "pyrp.r.history", rowsKey: "pyrp.rows.history", reconKey: "pyrp.recon.history",
      subKey: onOpenRun ? "pyrp.h.sub" : null,
      lead: {
        label: t("pyrp.hi.lead"), value: inr(net),
        line: t("pyrp.hi.line", { n: num(n), k: num(yards) }),
        facts: [
          { k: "r", label: t("pyrp.hi.f.runs"), value: num(n) },
          { k: "d", label: t("pyrp.hi.f.done"), value: num(paidN), note: t("pyrp.hi.f.doneNote") },
          { k: "o", label: t("pyrp.hi.f.open"), value: num(n - paidN),
            note: n - paidN ? t("pyrp.hi.f.openNote") : t("pyrp.hi.f.openNone") },
        ],
      },
      onSelect: onOpenRun || null,
      columns: [
        { key: "month", label: t("pyrp.h.col.campus") },
        { key: "how", label: t("pyrp.h.col.how"), width: 175 },
        { key: "heads", label: t("pyrp.h.col.heads"), align: "right", mono: true, width: 110 },
        { key: "net", label: t("pyrp.h.col.net"), align: "right", mono: true, width: 175, weight: 700 },
        { key: "cfg", label: t("pyrp.h.col.cfg"), mono: true, width: 120 },
        { key: "st", label: t("pyrp.h.col.state"), width: 170 },
      ],
      rows: rows,
      /* a head count summed over ten runs counts the same teacher
         five times. The money adds up; the people do not. */
      totals: {
        label: t("pyrp.h.total", { n: num(n) }),
        cells: { month: t("pyrp.h.total", { n: num(n) }), net: inr(net) },
      },
    };
  }

  function statLines() {
    const out = {};
    D.GROUPS.forEach(function (g) {
      g.ded.filter(function (l) { return l.stat; }).forEach(function (l) {
        out[l.code] = out[l.code] || { code: l.code, ee: 0, er: 0 };
        out[l.code].ee += l.v;
      });
      (g.emp || []).filter(function (l) { return l.stat; }).forEach(function (l) {
        /* the school's side of a contribution is the same contribution:
           PFER is PF's employer column, ESIER is ESI's. Two rows for
           one head is exactly what the two columns exist to prevent. */
        const code = l.code === "PFER" ? "PF" : l.code === "ESIER" ? "ESI" : l.code;
        out[code] = out[code] || { code: code, ee: 0, er: 0 };
        out[code].er += l.v;
      });
    });
    return Object.keys(out).map(function (k) { return out[k]; });
  }

  function specStatutory(t, c) {
    const lines = statLines();
    const total = lines.reduce(function (s, l) { return s + l.ee + l.er; }, 0);
    const ee = lines.reduce(function (x, l) { return x + l.ee; }, 0);
    const er = lines.reduce(function (x, l) { return x + l.er; }, 0);
    return {
      titleKey: "pyrp.r.statutory", rowsKey: "pyrp.rows.statutory", reconKey: "pyrp.recon.statutory",
      lead: {
        label: t("pyrp.sx.lead"), value: inr(total),
        line: t("pyrp.sx.line", { n: num(lines.length), cfg: D.CFG_JUL.v }),
        facts: [
          { k: "ee", label: t("pyrp.s.employee"), value: inr(ee), note: t("pyrp.sx.eeNote") },
          { k: "er", label: t("pyrp.s.employer"), value: inr(er), note: t("pyrp.sx.erNote") },
        ],
      },
      columns: [
        { key: "head", label: t("pyrp.s.col.head"), width: 200 },
        { key: "ee", label: t("pyrp.s.employee"), align: "right", mono: true, width: 190 },
        { key: "er", label: t("pyrp.s.employer"), align: "right", mono: true, width: 190 },
        { key: "tot", label: t("pyrp.s.total"), align: "right", mono: true, width: 190, weight: 700 },
      ],
      rows: lines.map(function (l) {
        return {
          id: l.code,
          cells: {
            head: (
              <span style={{ display: "block" }}>
                <span style={{ fontWeight: 600 }}>{t("pyrp.s.n." + l.code)}</span>
                <span style={G3.fig("xs", { color: c.inkFaint, marginInlineStart: 8 })}>{l.code}</span>
              </span>
            ),
            ee: l.ee ? inr(l.ee) : "—",
            er: l.er ? inr(l.er) : "—",
            tot: inr(l.ee + l.er),
          },
        };
      }),
      totals: { label: t("pyrp.s.total"), cells: { head: t("pyrp.s.total"), tot: inr(total) } },
    };
  }

  function specGroups(t) {
    return {
      titleKey: "pyrp.r.groups", rowsKey: "pyrp.rows.groups", reconKey: "pyrp.recon.groups",
      lead: {
        label: t("pyrp.rg.lead"), value: inr(D.RUN_NET),
        line: t("pyrp.gp.line", { n: num(D.GROUPS.length), heads: num(D.RUN_HEADS) }),
        facts: [
          { k: "g", label: t("pyrp.g.col.gross"), value: inr(D.RUN_GROSS) },
          { k: "d", label: t("pyrp.g.col.ded"), value: inr(D.RUN_DED), note: t("pyrp.rg.dedNote") },
          { k: "e", label: t("pyrp.g.col.emp"), value: inr(D.RUN_EMPLOYER), note: t("pyrp.rg.empNote") },
          { k: "h", label: t("pyrp.g.col.heads"), value: num(D.RUN_HEADS) },
        ],
      },
      columns: [
        { key: "g", label: t("pyrp.g.col.group") },
        { key: "h", label: t("pyrp.g.col.heads"), align: "right", mono: true, width: 110 },
        { key: "gr", label: t("pyrp.g.col.gross"), align: "right", mono: true, width: 170 },
        { key: "d", label: t("pyrp.g.col.ded"), align: "right", mono: true, width: 160 },
        { key: "e", label: t("pyrp.g.col.emp"), align: "right", mono: true, width: 160 },
        { key: "n", label: t("pyrp.g.col.net"), align: "right", mono: true, width: 170, weight: 700 },
      ],
      rows: D.GROUPS.map(function (g) {
        return {
          id: g.key,
          cells: {
            g: <span style={{ fontWeight: 600 }}>{t(g.nameKey)}</span>,
            h: num(g.heads),
            gr: inr(D.groupGross(g)),
            d: inr(D.groupDed(g)),
            e: inr(D.groupEmp(g)),
            n: inr(D.groupGross(g) - D.groupDed(g)),
          },
        };
      }),
      totals: {
        label: t("pyrp.gp.total", { n: num(D.GROUPS.length) }),
        cells: {
          g: t("pyrp.gp.total", { n: num(D.GROUPS.length) }), h: num(D.RUN_HEADS), gr: inr(D.RUN_GROSS),
          d: inr(D.RUN_DED), e: inr(D.RUN_EMPLOYER), n: inr(D.RUN_NET),
        },
      },
    };
  }

  function specPaidDays(t, c) {
    const onDays = D.GROUPS.filter(function (g) { return g.lopDays != null; });
    const paidDays = onDays.reduce(function (x, g) { return x + g.heads * D.MONTH_DAYS - g.lopDays; }, 0);
    const lopDays = onDays.reduce(function (x, g) { return x + g.lopDays; }, 0);
    const heads = onDays.reduce(function (x, g) { return x + g.heads; }, 0);
    return {
      titleKey: "pyrp.r.paidDays", rowsKey: "pyrp.rows.paidDays", reconKey: "pyrp.recon.paidDays",
      lead: {
        label: t("pyrp.pdx.lead"), value: num(paidDays),
        line: t("pyrp.pdx.line", { d: num(D.MONTH_DAYS), heads: num(heads) }),
        facts: [
          { k: "l", label: t("pyrp.pd.col.lop"), value: num(lopDays), note: t("pyrp.pdx.lopNote") },
          { k: "u", label: t("pyrp.pdx.unit"), value: num(D.GROUPS.length - onDays.length),
            note: t("pyrp.pdx.unitNote") },
        ],
      },
      columns: [
        { key: "g", label: t("pyrp.pd.col.group") },
        { key: "h", label: t("pyrp.pd.col.heads"), align: "right", mono: true, width: 110 },
        { key: "m", label: t("pyrp.pd.col.month"), align: "right", mono: true, width: 150 },
        { key: "l", label: t("pyrp.pd.col.lop"), align: "right", mono: true, width: 150 },
        { key: "p", label: t("pyrp.pd.col.paid"), align: "right", mono: true, width: 160, weight: 700 },
      ],
      rows: D.GROUPS.map(function (g) {
        const none = g.lopDays == null;
        return {
          id: g.key,
          tone: none ? "dim" : undefined,
          cells: {
            g: (
              <span>
                <span style={{ fontWeight: 600 }}>{t(g.nameKey)}</span>
                {none ? <span style={{ display: "block", color: c.inkMuted }}>{t("pyrp.pd.noneWhy")}</span> : null}
              </span>
            ),
            h: num(g.heads),
            m: none ? "—" : num(g.heads * D.MONTH_DAYS),
            l: none ? "—" : num(g.lopDays),
            p: none ? t("pyrp.pd.none") : num(g.heads * D.MONTH_DAYS - g.lopDays),
          },
        };
      }),
      totals: {
        label: t("pyrp.pdx.total"),
        cells: {
          g: t("pyrp.pdx.total"), h: num(heads),
          m: num(heads * D.MONTH_DAYS), l: num(lopDays), p: num(paidDays),
        },
      },
    };
  }

  /* THE MODULE'S SCOPE. Written once at the top of PYReports' render,
     before any spec or catalogue entry is built, and read by `here()`
     below. A parameter on twelve spec functions and twelve catalogue
     entries would have said the same thing twenty-four times. */
  let SCOPE = CAMPUS_ALL;
  let AT = 8;
  function here(rows) {
    return (rows || []).filter(function (r) { return inCampus(SCOPE, campusOfCode(r.staff)); });
  }

  /* ---- the three that are stages of a run as well as registers ----

     The payroll register, the variance review and the bank file used
     to open here as the run's own working screens: a gate you could
     move, a verification you could run, a file you could release.
     Three desks inside a reading room, and each one a second place
     the same decision could be taken.

     They are read here off THE ROLL -- the same rows the run module
     prices people on -- so a register and the run it belongs to
     cannot hold two opinions of one payday. Every act they used to
     offer belongs to the run and has stayed there. */
  function rollRows() {
    const RL = window.NaveyaRoll;
    if (!RL) return [];
    return RL.roll(SCOPE === CAMPUS_ALL ? "all" : SCOPE, AT);
  }
  function rollTotals(rows) {
    const o = { heads: rows.length, gross: 0, ded: 0, net: 0, emp: 0, lop: 0, held: 0, payees: 0 };
    rows.forEach(function (r) {
      o.gross += r.gross; o.ded += r.ded; o.net += r.net; o.emp += r.emp; o.lop += r.lop || 0;
      if (r.heldKey) o.held += r.net; else if (r.net > 0) o.payees += 1;
    });
    o.gross = r2(o.gross); o.ded = r2(o.ded); o.net = r2(o.net);
    o.emp = r2(o.emp); o.held = r2(o.held); o.payable = r2(o.net - o.held);
    return o;
  }
  function groupsIn(rows) {
    const out = [], seen = {};
    rows.forEach(function (r) {
      if (seen[r.group]) { seen[r.group].n += 1; return; }
      seen[r.group] = { k: r.group, nameKey: r.groupNameKey, n: 1 };
      out.push(seen[r.group]);
    });
    return out;
  }
  /* honorarium staff are paid per unit of work, so a day count is
     not a smaller version of their row -- it is the wrong unit */
  function daysCell(r) {
    const RL = window.NaveyaRoll;
    if (r.group === "visit" && r.units != null) return num(r.units) + "u";
    return num(r.days) + "/" + num(RL ? RL.MONTH_DAYS : 31);
  }
  /* the officer holding one campus already knows which one */
  function campusCol(t) {
    return SCOPE === CAMPUS_ALL
      ? [{ key: "campus", label: t("pyrp.rg.col.campus"), width: 128 }]
      : [];
  }
  function groupChips(t, rows, gs) {
    return [{ k: "all", label: t("pyrp.f.allGroups"), n: rows.length }].concat(
      gs.map(function (g) { return { k: g.k, label: t(g.nameKey), n: g.n }; }));
  }

  function specRegister(t, c, ctx) {
    const rows = rollRows();
    const tot = rollTotals(rows);
    const gs = groupsIn(rows);
    const q = (ctx.q || "").trim().toLowerCase();
    const mine = rows.filter(function (r) {
      if (ctx.at !== "all" && r.group !== ctx.at) return false;
      if (q && (r.name + " " + r.id).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    const page = mine.slice(0, ctx.shown);
    const mon = t("pyr.mon." + AT);
    return {
      titleKey: "pyrp.r.register", rowsKey: "pyrp.rows.register",
      reconKey: "pyrp.recon.register", reconVars: { n: num(tot.heads) },
      lead: {
        label: t("pyrp.rg.lead"), value: inr(tot.net),
        line: t("pyrp.rg.line", { heads: num(tot.heads), g: num(gs.length), mon: mon, cfg: ctx.per.cfg.v }),
        facts: [
          { k: "g", label: t("pyrp.g.col.gross"), value: inr(tot.gross) },
          { k: "d", label: t("pyrp.g.col.ded"), value: inr(tot.ded), note: t("pyrp.rg.dedNote") },
          { k: "e", label: t("pyrp.g.col.emp"), value: inr(tot.emp), note: t("pyrp.rg.empNote") },
          { k: "h", label: t("pyrp.rg.held"), value: tot.held ? inr(tot.held) : t("pyrp.rg.heldNone"),
            note: tot.held ? t("pyrp.rg.heldNote", { n: num(rows.length - tot.payees) }) : null },
        ],
      },
      empty: rows.length
        ? { head: t("pyrp.rg.noHit"), body: t("pyrp.rg.noHitWhy", { n: num(rows.length) }) }
        : { head: t("pyrp.empty"), body: t("pyrp.emptyBody") },
      action: (
        <div style={{ width: 215 }}>
          <Input id="pyrp-rg-q" value={ctx.q} onChange={ctx.setQ}
            placeholder={t("pyrp.rg.search")} ariaLabel={t("pyrp.rg.searchAria")} size="sm" />
        </div>
      ),
      chips: <FilterChips items={groupChips(t, rows, gs)} at={ctx.at} onPick={ctx.setAt} />,
      columns: [
        { key: "who", label: t("pyrp.rg.col.who") },
      ].concat(campusCol(t), [
        { key: "group", label: t("pyrp.g.col.group"), width: 150 },
        { key: "days", label: t("pyrp.rg.col.days"), align: "right", mono: true, width: 84 },
        { key: "gross", label: t("pyrp.g.col.gross"), align: "right", mono: true, width: 138 },
        { key: "ded", label: t("pyrp.g.col.ded"), align: "right", mono: true, width: 132 },
        { key: "net", label: t("pyrp.g.col.net"), align: "right", mono: true, width: 142, weight: 700 },
      ]),
      rows: page.map(function (r) {
        return {
          id: r.id,
          tone: r.heldKey ? "dim" : undefined,
          cells: {
            who: <PersonCell name={r.name} id={r.id} sub={t(r.desigKey)} note={r.heldKey ? t(r.heldKey) : null} />,
            campus: campusLabel(t, r.campus),
            group: t(r.groupNameKey),
            days: daysCell(r),
            gross: inr(r.gross),
            ded: inr(r.ded),
            net: inr(r.net),
          },
        };
      }),
      /* a total under a filtered list is a total of something nobody
         asked for. The whole figure is in the headline either way. */
      totals: mine.length === rows.length ? {
        label: t("pyrp.rg.total", { n: num(tot.heads) }),
        cells: {
          who: t("pyrp.rg.total", { n: num(tot.heads) }),
          gross: inr(tot.gross), ded: inr(tot.ded), net: inr(tot.net),
        },
      } : null,
      more: page.length < mine.length ? {
        a: page.length, b: mine.length, n: Math.min(PAGE, mine.length - page.length),
        onMore: function () { ctx.setShown(ctx.shown + PAGE); },
      } : null,
    };
  }

  function specVariance(t, c) {
    const pol = D.PAY_POLICY;
    const rows = D.VAR_ROWS.map(function (r) {
      return { r: r, crossed: D.crossedBy(r, { pct: pol.varPct, abs: pol.varAbs }), expl: !!r.explBy };
    });
    const moved = rows.reduce(function (sum, x) { return sum + D.varDelta(x.r); }, 0);
    const crossed = rows.filter(function (x) { return x.crossed; });
    const open = crossed.filter(function (x) { return !x.expl; });
    return {
      titleKey: "pyrp.r.variance", rowsKey: "pyrp.rows.variance", reconKey: "pyrp.recon.variance",
      lead: {
        label: t("pyrp.v.lead"), value: (moved >= 0 ? "+" : "") + inr(moved),
        line: t("pyrp.v.line", {
          n: num(rows.length), rest: num(D.VAR_UNMOVED), prev: D.PREV_RUN_ID, run: D.RUN_ID,
          pct: num(pol.varPct) + "%", amt: inr(pol.varAbs, { paise: false }), v: pol.v,
        }),
        facts: [
          { k: "c", label: t("pyrp.v.f.crossed"), value: num(crossed.length) },
          { k: "e", label: t("pyrp.v.f.expl"), value: num(crossed.length - open.length) },
          { k: "o", label: t("pyrp.v.f.open"), value: num(open.length),
            note: open.length ? t("pyrp.v.f.openNote") : t("pyrp.v.f.openNone") },
          { k: "b", label: t("pyrp.v.f.inside"), value: num(rows.length - crossed.length) },
        ],
      },
      columns: [
        { key: "who", label: t("pyrp.rg.col.who") },
        { key: "cause", label: t("pyrp.v.col.cause"), width: 185 },
        { key: "prev", label: t("pyrp.v.col.prev"), align: "right", mono: true, width: 135 },
        { key: "cur", label: t("pyrp.v.col.cur"), align: "right", mono: true, width: 135 },
        { key: "delta", label: t("pyrp.v.col.delta"), align: "right", mono: true, width: 135, weight: 700 },
        { key: "st", label: t("pyrp.col.state"), width: 185 },
      ],
      rows: rows.map(function (x) {
        const r = x.r, d = D.varDelta(r);
        return {
          id: r.id,
          cells: {
            who: <PersonCell name={t(r.nameKey)} id={r.id} sub={t(r.groupKey)} />,
            cause: t(r.causeKey),
            prev: r.prev == null ? <span style={{ color: c.inkFaint }}>{t("pyrp.v.noPrior")}</span> : inr(r.prev.net),
            cur: inr(r.cur.net),
            delta: <span style={{ fontWeight: 700 }}>{(d > 0 ? "+" : "") + inr(d)}</span>,
            st: !x.crossed
              ? <StatusMark role="off" glyph="check" word={t("pyrp.v.st.inside")} />
              : x.expl
                ? <StatusMark role="present" glyph="check" word={t("pyrp.v.st.expl")} />
                : <StatusMark role="late" glyph="clock" word={t("pyrp.v.st.open")} />,
          },
        };
      }),
    };
  }

  function specBank(t, c, ctx) {
    const rows = rollRows();
    const tot = rollTotals(rows);
    const gs = groupsIn(rows);
    const q = (ctx.q || "").trim().toLowerCase();
    const mine = rows.filter(function (r) {
      if (ctx.at !== "all" && r.group !== ctx.at) return false;
      if (q && (r.name + " " + r.id).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    const page = mine.slice(0, ctx.shown);
    const heldN = rows.length - tot.payees;
    return {
      titleKey: "pyrp.r.bank", rowsKey: "pyrp.rows.bank", reconKey: "pyrp.recon.bank",
      reconVars: { n: num(tot.payees) },
      lead: {
        label: t("pyrp.bk.lead"), value: inr(tot.payable),
        line: t("pyrp.bk.line", { n: num(tot.payees), run: ctx.per.run, mon: t("pyr.mon." + AT) }),
        facts: [
          { k: "p", label: t("pyrp.bk.f.payees"), value: num(tot.payees) },
          { k: "n", label: t("pyrp.bk.f.net"), value: inr(tot.net), note: t("pyrp.bk.f.netNote") },
          { k: "h", label: t("pyrp.bk.f.held"), value: heldN ? inr(tot.held) : t("pyrp.rg.heldNone"),
            note: heldN ? t("pyrp.bk.f.heldNote", { n: num(heldN) }) : null },
        ],
      },
      empty: rows.length
        ? { head: t("pyrp.rg.noHit"), body: t("pyrp.rg.noHitWhy", { n: num(rows.length) }) }
        : { head: t("pyrp.empty"), body: t("pyrp.emptyBody") },
      action: (
        <div style={{ width: 215 }}>
          <Input id="pyrp-bk-q" value={ctx.q} onChange={ctx.setQ}
            placeholder={t("pyrp.rg.search")} ariaLabel={t("pyrp.rg.searchAria")} size="sm" />
        </div>
      ),
      chips: <FilterChips items={groupChips(t, rows, gs)} at={ctx.at} onPick={ctx.setAt} />,
      columns: [
        { key: "who", label: t("pyrp.rg.col.who") },
      ].concat(campusCol(t), [
        { key: "group", label: t("pyrp.g.col.group"), width: 150 },
        { key: "st", label: t("pyrp.bk.col.st"), width: 180 },
        { key: "v", label: t("pyrp.bk.col.v"), align: "right", mono: true, width: 160, weight: 700 },
      ]),
      /* four hundred and eight green ticks say nothing; the four
         that are NOT on the file are the whole point of the column */
      rows: page.map(function (r) {
        const held = !!r.heldKey;
        return {
          id: r.id,
          tone: held ? "dim" : undefined,
          cells: {
            who: <PersonCell name={r.name} id={r.id} sub={t(r.desigKey)} />,
            campus: campusLabel(t, r.campus),
            group: t(r.groupNameKey),
            st: held
              ? <StatusMark role="penalty" glyph="lock" word={t(r.heldKey)} />
              : <span style={{ color: c.inkFaint }}>{t("pyrp.bk.st.in")}</span>,
            v: held ? "\u2014" : inr(r.net),
          },
        };
      }),
      totals: mine.length === rows.length ? {
        label: t("pyrp.bk.total", { n: num(tot.payees) }),
        cells: { who: t("pyrp.bk.total", { n: num(tot.payees) }), v: inr(tot.payable) },
      } : null,
      more: page.length < mine.length ? {
        a: page.length, b: mine.length, n: Math.min(PAGE, mine.length - page.length),
        onMore: function () { ctx.setShown(ctx.shown + PAGE); },
      } : null,
    };
  }

  /* ---- adjustments ---- */
  function specClaims(t) {
    /* every claim in scope: a register that shows the first
       twenty-four of thirty-one is a third figure nobody asked for */
    const rows = here(A ? A.CLAIMS : []);
    const whoN = [];
    rows.forEach(function (x) { if (whoN.indexOf(x.personKey) === -1) whoN.push(x.personKey); });
    return {
      titleKey: "pyrp.r.claims", rowsKey: "pyrp.rows.claims", reconKey: "pyrp.recon.claims",
      lead: {
        label: t("pyrp.cx.lead"), value: inr(rows.reduce(function (x, r) { return x + r.v; }, 0)),
        line: t("pyrp.cx.line", { n: num(rows.length), p: num(whoN.length) }),
        facts: [
          { k: "n", label: t("pyrp.cx.f.claims"), value: num(rows.length) },
          { k: "p", label: t("pyrp.cx.f.people"), value: num(whoN.length) },
        ],
      },
      columns: [
        { key: "id", label: t("pyrp.l.col.id"), mono: true, width: 130 },
        { key: "who", label: t("pyrp.c.col.who") },
        { key: "cat", label: t("pyrp.c.col.cat"), width: 200 },
        { key: "v", label: t("pyrp.c.col.v"), align: "right", mono: true, width: 150, weight: 700 },
      ],
      rows: rows.map(function (x) {
        return {
          id: x.id,
          cells: { id: x.id, who: t(x.personKey), cat: t("pyo.cat." + x.cat), v: inr(x.v) },
        };
      }),
      totals: {
        label: t("pyrp.cx.total", { n: num(rows.length) }),
        cells: { id: t("pyrp.cx.total", { n: num(rows.length) }), v: inr(rows.reduce(function (s, x) { return s + x.v; }, 0)) },
      },
    };
  }

  function specOT(t) {
    const rows = here(Q ? Q.byKind("ot") : []);
    const priced = rows.filter(function (r) { return r.payroll && r.payroll.value != null; });
    const hours = rows.reduce(function (x, r) { return x + Q.otHours(r); }, 0);
    return {
      titleKey: "pyrp.r.ot", rowsKey: "pyrp.rows.ot", reconKey: "pyrp.recon.ot",
      lead: {
        label: t("pyrp.ox.lead"), value: inr(priced.reduce(function (x, r) { return x + r.payroll.value; }, 0)),
        line: t("pyrp.ox.line", { n: num(priced.length), h: num(hours) }),
        facts: [
          { k: "h", label: t("pyrp.o.col.hours"), value: num(hours) + " h" },
          { k: "n", label: t("pyrp.ox.f.claims"), value: num(rows.length) },
          { k: "w", label: t("pyrp.ox.f.unpriced"), value: num(rows.length - priced.length),
            note: rows.length - priced.length ? t("pyrp.ox.f.unpricedNote") : null },
        ],
      },
      columns: [
        { key: "who", label: t("pyrp.c.col.who") },
        { key: "per", label: t("pyrp.o.col.period"), width: 170 },
        { key: "h", label: t("pyrp.o.col.hours"), align: "right", mono: true, width: 120 },
        { key: "v", label: t("pyrp.o.col.v"), align: "right", mono: true, width: 160, weight: 700 },
        { key: "st", label: t("pyrp.c.col.state"), width: 160 },
      ],
      rows: rows.map(function (r) {
        return {
          id: r.id,
          tone: r.state === "declined" ? "dim" : undefined,
          cells: {
            who: t(r.personKey),
            per: t(r.periodKey),
            h: String(Q.otHours(r)) + " h",
            v: r.payroll && r.payroll.value != null ? inr(r.payroll.value) : "—",
            st: <StatusMark role={r.state === "paid" || r.state === "approved" ? "present" : r.state === "declined" ? "danger" : "late"}
              glyph={r.state === "declined" ? "alert" : r.state === "paid" || r.state === "approved" ? "check" : "clock"}
              word={t(r.state === "withPayroll" ? "pyrp.st.withDesk"
                : r.state === "withHR" ? "pyrp.st.withHR" : "pya.q.st." + r.state)} />,
          },
        };
      }),
      totals: {
        label: t("pyrp.ox.total", { n: num(priced.length) }),
        cells: { who: t("pyrp.ox.total", { n: num(priced.length) }), v: inr(priced.reduce(function (s, r) { return s + r.payroll.value; }, 0)) },
      },
    };
  }

  /* still being recovered: from pay while they are here, from the
     settlement once they are not */
  function loanRows() {
    return here(A ? A.LOANS : []).filter(function (l) { return l.state === "active" || l.state === "atExit"; });
  }
  function specLoans(t) {
    const rows = loanRows();
    const live = rows.filter(function (l) { return l.state === "active"; });
    return {
      titleKey: "pyrp.r.loans", rowsKey: "pyrp.rows.loans", reconKey: "pyrp.recon.loans",
      lead: {
        label: t("pyrp.lx.lead"),
        value: inr(rows.reduce(function (x, l) { return x + A.loanOutstanding(l); }, 0)),
        line: t("pyrp.lx.line", { n: num(rows.length) }),
        facts: [
          { k: "n", label: t("pyrp.lx.f.live"), value: num(live.length) },
          { k: "e", label: t("pyrp.lx.f.emi"),
            value: inr(live.reduce(function (x, l) { return x + A.loanEmi(l); }, 0)),
            note: t("pyrp.lx.f.emiNote") },
          { k: "x", label: t("pyrp.lx.f.exit"), value: num(rows.length - live.length),
            note: rows.length - live.length ? t("pyrp.lx.f.exitNote") : null },
        ],
      },
      columns: [
        { key: "id", label: t("pyrp.l.col.id"), mono: true, width: 150 },
        { key: "who", label: t("pyrp.c.col.who") },
        { key: "kind", label: t("pyrp.l.col.kind"), width: 130 },
        { key: "out", label: t("pyrp.l.col.out"), align: "right", mono: true, width: 170, weight: 700 },
        { key: "emi", label: t("pyrp.l.col.emi"), align: "right", mono: true, width: 150 },
      ],
      rows: rows.map(function (l) {
        return {
          id: l.id,
          cells: {
            id: l.id, who: t(l.personKey),
            kind: t(l.kind === "loan" ? "hrp.d.loan" : "hrp.d.advance"),
            out: inr(A.loanOutstanding(l)),
            emi: l.state === "atExit" ? "—" : inr(A.loanEmi(l)),
          },
        };
      }),
      totals: {
        label: t("pyrp.lx.total", { n: num(rows.length) }),
        cells: {
          id: t("pyrp.lx.total", { n: num(rows.length) }),
          out: inr(rows.reduce(function (s, l) { return s + A.loanOutstanding(l); }, 0)),
          emi: inr(live.reduce(function (s, l) { return s + A.loanEmi(l); }, 0)),
        },
      },
    };
  }

  function specArrears(t) {
    const rows = A ? A.ARREARS : [];
    return {
      titleKey: "pyrp.r.arrears", rowsKey: "pyrp.rows.arrears", reconKey: "pyrp.recon.arrears",
      lead: {
        label: t("pyrp.ax.lead"), value: inr(rows.reduce(function (x, a) { return x + A.arrNet(a); }, 0)),
        line: t("pyrp.ax.line", {
          n: num(rows.length), p: num(rows.reduce(function (x, a) { return x + a.people; }, 0)),
        }),
        facts: [
          { k: "g", label: t("pyrp.a.col.gross"), value: inr(rows.reduce(function (x, a) { return x + A.arrGross(a); }, 0)),
            note: t("pyrp.ax.grossNote") },
          { k: "p", label: t("pyrp.a.col.people"), value: num(rows.reduce(function (x, a) { return x + a.people; }, 0)) },
        ],
      },
      columns: [
        { key: "id", label: t("pyrp.a.col.id"), mono: true, width: 150 },
        { key: "src", label: t("pyrp.a.col.source") },
        { key: "p", label: t("pyrp.a.col.people"), align: "right", mono: true, width: 110 },
        { key: "g", label: t("pyrp.a.col.gross"), align: "right", mono: true, width: 170 },
        { key: "n", label: t("pyrp.a.col.net"), align: "right", mono: true, width: 170, weight: 700 },
      ],
      rows: rows.map(function (a) {
        return {
          id: a.id,
          cells: {
            id: a.id, src: t(a.sourceKey), p: num(a.people),
            g: inr(A.arrGross(a)), n: inr(A.arrNet(a)),
          },
        };
      }),
      totals: {
        label: t("pyrp.ax.total", { n: num(rows.length) }),
        cells: {
          id: t("pyrp.ax.total", { n: num(rows.length) }),
          p: num(rows.reduce(function (s, a) { return s + a.people; }, 0)),
          g: inr(rows.reduce(function (s, a) { return s + A.arrGross(a); }, 0)),
          n: inr(rows.reduce(function (s, a) { return s + A.arrNet(a); }, 0)),
        },
      },
    };
  }

  function specRises(t) {
    const rows = here(Q ? Q.byKind("rise") : []);
    const set = rows.filter(function (r) { return r.payroll && r.payroll.gross != null; });
    const added = set.reduce(function (x, r) { return x + (r.payroll.gross - r.currentGross); }, 0);
    return {
      titleKey: "pyrp.r.rises", rowsKey: "pyrp.rows.rises", reconKey: "pyrp.recon.rises",
      lead: {
        label: t("pyrp.rx.lead"), value: (added >= 0 ? "+" : "") + inr(added),
        line: t("pyrp.rx.line", { n: num(set.length), all: num(rows.length) }),
        facts: [
          { k: "s", label: t("pyrp.rx.f.set"), value: num(set.length) },
          { k: "w", label: t("pyrp.rx.f.open"), value: num(rows.length - set.length),
            note: rows.length - set.length ? t("pyrp.rx.f.openNote") : null },
        ],
      },
      columns: [
        { key: "who", label: t("pyrp.c.col.who") },
        { key: "pct", label: t("pyrp.ri.col.pct"), align: "right", mono: true, width: 120, weight: 700 },
        { key: "from", label: t("pyrp.ri.col.from"), align: "right", mono: true, width: 170 },
        { key: "to", label: t("pyrp.ri.col.to"), align: "right", mono: true, width: 170 },
        { key: "st", label: t("pyrp.c.col.state"), width: 150 },
      ],
      rows: rows.map(function (r) {
        return {
          id: r.id,
          tone: r.state === "declined" ? "dim" : undefined,
          cells: {
            who: t(r.personKey), pct: "+" + r.pct + "%", from: inr(r.currentGross),
            to: r.payroll && r.payroll.gross != null ? inr(r.payroll.gross) : "—",
            st: <StatusMark role={r.state === "declined" ? "danger" : r.state === "approved" ? "present" : "late"}
              glyph={r.state === "declined" ? "alert" : r.state === "approved" ? "check" : "clock"}
              word={t(r.state === "withPayroll" ? "pyrp.st.withDesk" : "pya.q.st." + r.state)} />,
          },
        };
      }),
    };
  }

  /* ---- exits ---- */
  function specSettlements(t) {
    const rows = X ? X.EXITS.filter(function (e) { return e.id; }) : [];
    const netOf = function (e) {
      return e.net != null ? e.net
        : e.lines ? X.sum(e.lines)
          : e.live ? X.sum(X.settlementLines(e, {})) : 0;
    };
    const paid = rows.filter(function (e) { return e.state === "paid"; });
    return {
      titleKey: "pyrp.r.settlements", rowsKey: "pyrp.rows.settlements", reconKey: "pyrp.recon.settlements",
      lead: {
        label: t("pyrp.ex.lead"), value: inr(rows.reduce(function (x, e) { return x + netOf(e); }, 0)),
        line: t("pyrp.ex.line", { n: num(rows.length) }),
        facts: [
          { k: "p", label: t("pyrp.ex.f.paid"), value: num(paid.length) },
          { k: "o", label: t("pyrp.ex.f.open"), value: num(rows.length - paid.length),
            note: rows.length - paid.length ? t("pyrp.ex.f.openNote") : null },
        ],
      },
      columns: [
        { key: "id", label: t("pyrp.l.col.id"), mono: true, width: 150 },
        { key: "who", label: t("pyrp.c.col.who") },
        { key: "lwd", label: t("pyrp.e.col.lwd"), width: 160 },
        { key: "net", label: t("pyrp.e.col.net"), align: "right", mono: true, width: 170, weight: 700 },
        { key: "st", label: t("pyrp.e.col.state"), width: 150 },
      ],
      rows: rows.map(function (e) {
        const net = e.net != null ? e.net : e.lines ? X.sum(e.lines) : e.live ? X.sum(X.settlementLines(e, {})) : null;
        return {
          id: e.id,
          tone: e.state === "paid" ? "dim" : undefined,
          cells: {
            id: e.id, who: t(e.personKey), lwd: X.fmtDate(t, e.lwdIso),
            net: net == null ? "—" : inr(net),
            st: <StatusMark role={e.state === "paid" || e.state === "approved" ? "present" : "late"}
              glyph={e.state === "paid" || e.state === "approved" ? "check" : "clock"}
              word={t("pyx.st." + e.state)} />,
          },
        };
      }),
    };
  }

  /* ---- people ---- */
  function specHeadcount(t, c) {
    const first = D.PERIODS[0], last = D.PERIODS[D.PERIODS.length - 1];
    return {
      titleKey: "pyrp.r.headcount", rowsKey: "pyrp.rows.headcount", reconKey: "pyrp.recon.headcount",
      lead: {
        label: t("pyrp.hx.lead"), value: num(last.heads),
        line: t("pyrp.hx.line", { a: num(first.heads), mon: t("pyr.mon." + first.m), n: num(D.PERIODS.length) }),
        facts: [
          { k: "d", label: t("pyrp.hx.f.change"),
            value: (last.heads - first.heads >= 0 ? "+" : "\u2212") + num(Math.abs(last.heads - first.heads)),
            note: t("pyrp.hx.f.changeNote") },
          { k: "m", label: t("pyrp.hx.f.months"), value: num(D.PERIODS.length) },
        ],
      },
      columns: [
        { key: "m", label: t("pyrp.hc.col.month"), width: 190 },
        { key: "h", label: t("pyrp.hc.col.heads"), align: "right", mono: true, width: 150, weight: 700 },
        { key: "d", label: t("pyrp.hc.col.change"), align: "right", mono: true, width: 160 },
      ],
      rows: D.PERIODS.map(function (x, i) {
        const prev = i > 0 ? D.PERIODS[i - 1] : null;
        const d = prev ? x.heads - prev.heads : null;
        return {
          id: x.run,
          cells: {
            m: t("pyr.mon." + x.m) + " 2026",
            h: num(x.heads),
            d: d == null
              ? <span style={{ color: c.inkFaint }}>{t("pyrp.h.first")}</span>
              : <span style={{ fontWeight: 700 }}>{(d >= 0 ? "+" : "−") + num(Math.abs(d))}</span>,
          },
        };
      }),
    };
  }

  function specCost(t, c) {
    const first = D.PERIODS[0], last = D.PERIODS[D.PERIODS.length - 1];
    const step = r2(last.net - first.net);
    return {
      titleKey: "pyrp.r.cost", rowsKey: "pyrp.rows.cost", reconKey: "pyrp.recon.cost",
      lead: {
        label: t("pyrp.cz.lead", { mon: t("pyr.mon." + last.m) }), value: inr(last.net),
        line: t("pyrp.cz.line", { mon: t("pyr.mon." + last.m), n: num(D.PERIODS.length) }),
        facts: [
          { k: "a", label: t("pyrp.cz.f.first", { mon: t("pyr.mon." + first.m) }), value: inr(first.net) },
          { k: "d", label: t("pyrp.cz.f.change"), value: (step >= 0 ? "+" : "") + inr(step),
            note: t("pyrp.cz.f.changeNote") },
        ],
      },
      columns: [
        { key: "m", label: t("pyrp.hc.col.month"), width: 190 },
        { key: "n", label: t("pyrp.h.col.net"), align: "right", mono: true, width: 180, weight: 700 },
        { key: "d", label: t("pyrp.h.col.delta"), align: "right", mono: true, width: 170 },
        { key: "bar", label: t("pyrp.cz.col.bar") },
      ],
      /* THE BAR DRAWS THE STEP, NOT THE TOTAL. Five months of a
         payroll are within two per cent of each other, so five bars
         of the total are five full bars -- a picture of nothing,
         beside the one column that does move. */
      rows: D.PERIODS.map(function (x, i) {
        const prev = i > 0 ? D.PERIODS[i - 1] : null;
        const d = prev ? r2(x.net - prev.net) : null;
        const step = D.PERIODS.reduce(function (m, y, j) {
          return j === 0 ? m : Math.max(m, Math.abs(r2(y.net - D.PERIODS[j - 1].net)));
        }, 0) || 1;
        return {
          id: x.run,
          cells: {
            m: t("pyr.mon." + x.m) + " 2026",
            n: inr(x.net),
            d: d == null
              ? <span style={{ color: c.inkFaint }}>{t("pyrp.h.first")}</span>
              : <span style={{ fontWeight: 700 }}>{(d >= 0 ? "+" : "\u2212") + inr(Math.abs(d))}</span>,
            bar: d == null ? null
              : <Meter frac={Math.abs(d) / step} bar={c.chartTeal} height={8}
                  label={t("pyrp.cz.bar", { v: inr(Math.abs(d)) })} />,
          },
        };
      }),
    };
  }

  /* ============================================================
     THE CATALOGUE. Fourteen registers across four subjects. Tabs
     would make the reader learn a layout per subject and hide the
     one they came for; a catalogue answers "where is the number I
     was asked for" in a single read.
     ============================================================ */
  /* how many runs the history holds, so the catalogue's row count is
     the number of rows the reader will actually find in it */
  function runCount() {
    const RL = window.NaveyaRoll, RS = window.NaveyaPayRuns;
    if (!RL || !RS) return D.PERIODS.length;
    let n = 0;
    D.PERIODS.forEach(function (x) {
      RL.CAMPUSES.forEach(function (cm) {
        if (cm.groups && RS.get(cm.id, x.m)) n += 1;
      });
    });
    return n;
  }

  function catalogue(t, c) {
    /* the row and the register it opens are counted from one place:
       a catalogue that says 412 over a register that lists 401 is
       two answers to one question */
    const rt = rollTotals(rollRows());
    const live = { covers: "live", state: "live" };
    const run = { covers: "run", state: "run" };
    const period = { covers: "period", state: "run" };
    const session = { covers: "session", state: "live" };
    return [
      { k: "history", g: "run", spec: specHistory, n: runCount(), v: null, meta: session },
      { k: "register", g: "run", spec: specRegister, n: rt.heads, v: rt.net, meta: run },
      /* not `run`: the movement it lists is between the last run and
         the one on the desk, and no other pair. A period picker over
         it would date it to a month it never looked at. */
      { k: "variance", g: "run", spec: specVariance, n: D.VAR_ROWS.length, v: null,
        meta: { covers: "thisRun", state: "live" } },
      { k: "bank", g: "run", spec: specBank, n: rt.payees, v: rt.payable, meta: run },
      { k: "statutory", g: "run", spec: specStatutory,
        n: statLines().length, v: statLines().reduce(function (s, l) { return s + l.ee + l.er; }, 0), meta: run },
      { k: "groups", g: "run", spec: specGroups, n: D.GROUPS.length, v: D.RUN_NET, meta: run },
      { k: "paidDays", g: "run", spec: specPaidDays, n: D.GROUPS.length, v: null, meta: run },

      { k: "claims", g: "adjust", spec: specClaims,
        n: here(A ? A.CLAIMS : []).length,

        v: here(A ? A.CLAIMS : []).reduce(function (s, x) { return s + x.v; }, 0), meta: period },
      { k: "ot", g: "adjust", spec: specOT,
        n: here(Q ? Q.byKind("ot") : []).length,
        v: here(Q ? Q.byKind("ot") : []).reduce(function (s, r) { return s + ((r.payroll && r.payroll.value) || 0); }, 0),
        /* the overtime queue holds July, August and September claims at
           once -- it is a position, not a month's artefact, and dating
           it to the period picker put September rows under "August" */
        meta: live },
      { k: "loans", g: "adjust", spec: specLoans,
        /* counted off the rows the register will actually list, and
           summed from the loans in scope rather than the stored trust
           total: a count that narrows beside a figure that does not
           is two different answers on one row */
        n: loanRows().length,
        v: loanRows().reduce(function (n, l) { return n + A.loanOutstanding(l); }, 0),
        meta: live },
      { k: "arrears", g: "adjust", spec: specArrears,
        n: A ? A.ARREARS.length : 0,
        v: A ? A.ARREARS.reduce(function (s, a) { return s + A.arrNet(a); }, 0) : 0, meta: period },
      { k: "rises", g: "adjust", spec: specRises, n: here(Q ? Q.byKind("rise") : []).length, v: null, meta: live },

      { k: "settlements", g: "exit", spec: specSettlements,
        n: X ? X.EXITS.filter(function (e) { return e.id; }).length : 0, v: null, meta: live },

      { k: "headcount", g: "people", spec: specHeadcount, n: D.PERIODS.length, v: null, meta: session },
      { k: "cost", g: "people", spec: specCost, n: D.PERIODS.length, v: D.PERIODS[D.PERIODS.length - 1].net, meta: session },
    ];
  }

  /* WHAT THE PAYROLL DESK PRODUCES WITHOUT BEING ASKED. The register
     when a run is approved, the bank summary when the file goes out,
     the payslip pack when it is published, the paid-days sheet at the
     month's close. Listed beside the ones the officer builds, because
     somebody looking for last month's register does not care which of
     the two made it — only whether it is final and what it covers. */
  const AUTO_REPORTS = [
    { id: "pa1", auto: true, nameKey: "pyb.r.register", rangeKey: "pyr.mon.7", whenKey: "pyb.when.onApproval",
      on: 2, fmt: "pdf", rows: 412, pii: false, prov: false },
    { id: "pa2", auto: true, nameKey: "pyb.r.bank", rangeKey: "pyr.mon.7", whenKey: "pyb.when.onDisburse",
      on: 3, fmt: "csv", rows: 410, pii: false, prov: false },
    { id: "pa3", auto: true, nameKey: "pyb.r.payslips", rangeKey: "pyr.mon.7", whenKey: "pyb.when.onPublish",
      on: 4, fmt: "pdf", rows: 412, pii: false, prov: false },
    { id: "pa4", auto: true, nameKey: "pyb.r.paidDays", rangeKey: "pyr.mon.7", whenKey: "pyb.when.monthEnd",
      on: 1, fmt: "csv", rows: 412, pii: false, prov: false },
    { id: "pa5", auto: true, nameKey: "pyb.r.variance", rangeKey: "pyr.mon.8", whenKey: "pyb.when.onCompute",
      on: 9, fmt: "pdf", rows: 6, pii: false, prov: true },
  ];

  /* what the officer can ask for, and over what. `per` is lines per
     month where a report is one line per person; `flat` where it is a
     summary. Nothing here holds a figure — the totals are read from
     the run data that owns them. */
  const PY_REPORTS = [
    { id: "register", seg: "run", nameKey: "pyb.r.register", qKey: "pyb.r.registerQ", per: 412, pii: true, total: "net" },
    { id: "variance", seg: "run", nameKey: "pyb.r.variance", qKey: "pyb.r.varianceQ", per: 6 },
    { id: "bank", seg: "run", nameKey: "pyb.r.bank", qKey: "pyb.r.bankQ", per: 410, pii: true, total: "payable" },
    { id: "payslips", seg: "run", nameKey: "pyb.r.payslips", qKey: "pyb.r.payslipsQ", per: 412, pii: true },
    { id: "cost", seg: "run", nameKey: "pyb.r.cost", qKey: "pyb.r.costQ", flat: 12, total: "employer" },
    { id: "paidDays", seg: "run", nameKey: "pyb.r.paidDays", qKey: "pyb.r.paidDaysQ", per: 412 },
    { id: "claims", seg: "adjust", nameKey: "pyb.r.claims", qKey: "pyb.r.claimsQ", per: 31 },
    { id: "ot", seg: "adjust", nameKey: "pyb.r.ot", qKey: "pyb.r.otQ", per: 18 },
    { id: "loans", seg: "adjust", nameKey: "pyb.r.loans", qKey: "pyb.r.loansQ", per: 14, pii: true },
    { id: "arrears", seg: "adjust", nameKey: "pyb.r.arrears", qKey: "pyb.r.arrearsQ", per: 4 },
    { id: "rises", seg: "adjust", nameKey: "pyb.r.rises", qKey: "pyb.r.risesQ", per: 3 },
    { id: "settle", seg: "exit", nameKey: "pyb.r.settle", qKey: "pyb.r.settleQ", per: 2, pii: true },
    { id: "head", seg: "people", nameKey: "pyb.r.head", qKey: "pyb.r.headQ", flat: 8 },
    { id: "unpriced", seg: "people", nameKey: "pyb.r.unpriced", qKey: "pyb.r.unpricedQ", flat: 3 },
  ];
  const PY_SEGS = ["run", "adjust", "exit", "people"];
  const PY_QUARTERS = { q1: [4, 5, 6], q2: [7, 8, 9] };

  /* ---------- the builder, the module's second tab ---------- */
  function ReportBuilder({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [seg, setSeg] = useState("run");
    const [rep, setRep] = useState("");
    const [span, setSpan] = useState("month");
    const [mon, setMon] = useState(8);
    const [quarter, setQuarter] = useState("q2");
    const [from, setFrom] = useState("2026-04-01");
    const [to, setTo] = useState("2026-08-31");
    const [fmt, setFmt] = useState("csv");
    const [pii, setPii] = useState(false);
    const [why, setWhy] = useState("");
    const [made, setMade] = useState([]);
    const [ready, setReady] = useState(null);
    const [got, setGot] = useState(null);

    const inSeg = PY_REPORTS.filter(function (r) { return r.seg === seg; });
    const R = PY_REPORTS.filter(function (r) { return r.id === rep; })[0] || null;

    const badOrder = span === "range" && from && to && from > to;
    let months = [];
    if (span === "month") months = D.PERIODS.filter(function (x) { return x.m === mon; });
    else if (span === "quarter") months = D.PERIODS.filter(function (x) { return PY_QUARTERS[quarter].indexOf(x.m) >= 0; });
    else if (span === "fy") months = D.PERIODS.slice();
    else if (!badOrder && from && to) {
      months = D.PERIODS.filter(function (x) {
        const mm = Number(from.slice(5, 7)), mx = Number(to.slice(5, 7));
        return x.m >= mm && x.m <= mx;
      });
    }
    const emptyRange = span === "range" && !badOrder && months.length === 0;

    const rangeWord = months.length === 0 ? "\u2014"
      : months.length === 1 ? t("pyr.mon." + months[0].m)
        : t("pyr.mon." + months[0].m) + " \u2013 " + t("pyr.mon." + months[months.length - 1].m);

    const cfgs = [];
    months.forEach(function (x) { if (cfgs.indexOf(x.cfg.v) < 0) cfgs.push(x.cfg.v); });
    const unapproved = months.filter(function (x) { return x.state !== "disbursed"; });
    const provisional = !!R && unapproved.length > 0;
    const lines = !R ? 0 : (R.per == null ? R.flat : R.per * Math.max(1, months.length));

    const total = !R || !R.total ? null
      : R.total === "net" ? months.reduce(function (n, x) { return n + x.net; }, 0)
        : R.total === "payable" ? months.reduce(function (n, x) { return n + x.net; }, 0)
          : D.RUN_EMPLOYER;

    const canGo = !!R && months.length > 0 && !badOrder && (!R.pii || !pii || !!why);

    function produce() {
      setMade([{
        id: R.id + "-" + made.length, nameKey: R.nameKey, range: rangeWord, fmt: fmt,
        pii: R.pii && pii, prov: provisional, rows: lines,
      }].concat(made));
      setReady(R);
    }

    /* a date range, a line count and a configuration version are not
       parts of one another, so this strip has no bar to draw */
    function Fact({ label, value, note, tone, warn }) {
      return <MetricCell label={label} value={value} note={note} tone={tone} warn={warn} />;
    }

    return (
      <React.Fragment>
        {/* ONE BOX: what, over what, and in what form are one question
            filled in a single pass, and the preview is its footer. */}
        <section aria-label={t("pyb.box")} style={{
          border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
          overflow: "hidden", marginBottom: G3.layout.gap,
        }}>
          <header style={{ padding: "16px 20px 14px" }}>
            <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("pyb.box")}</h2>
            <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0", maxWidth: "90ch" })}>{t("pyb.boxSub")}</p>
          </header>

          <div style={{
            borderTop: "1px solid " + c.rule, padding: "16px 20px 6px",
            display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start",
          }}>
            <div style={{ flex: "0 1 190px", minWidth: 0 }}>
              <Field id="pyb-seg" label={t("pyb.f.module")}>
                <Select id="pyb-seg" value={seg}
                  onChange={function (v) { setSeg(v); setRep(""); setPii(false); setWhy(""); }}
                  options={PY_SEGS.map(function (k) { return { value: k, label: t("pyrp.seg." + k) }; })} />
              </Field>
            </div>
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <Field id="pyb-rep" label={t("pyb.f.report")}>
                <Select id="pyb-rep" value={rep}
                  onChange={function (v) { setRep(v); setPii(false); setWhy(""); }}
                  options={[{ value: "", label: t("pyb.f.reportPick") }].concat(
                    inSeg.map(function (r) { return { value: r.id, label: t(r.nameKey) }; }))} />
              </Field>
            </div>
            <div style={{ flex: "0 1 190px", minWidth: 0 }}>
              <Field id="pyb-span" label={t("pyb.f.span")}>
                <Select id="pyb-span" value={span} onChange={setSpan}
                  options={[
                    { value: "month", label: t("pyb.span.month") },
                    { value: "quarter", label: t("pyb.span.quarter") },
                    { value: "fy", label: t("pyb.span.fy") },
                    { value: "range", label: t("pyb.span.range") },
                  ]} />
              </Field>
            </div>
            {span === "month" ? (
              <div style={{ flex: "0 1 170px", minWidth: 0 }}>
                <Field id="pyb-mon" label={t("pyb.f.month")}>
                  <Select id="pyb-mon" value={String(mon)} onChange={function (v) { setMon(+v); }}
                    options={D.PERIODS.map(function (x) { return { value: String(x.m), label: t("pyr.mon." + x.m) }; })} />
                </Field>
              </div>
            ) : null}
            {span === "quarter" ? (
              <div style={{ flex: "0 1 230px", minWidth: 0 }}>
                <Field id="pyb-q" label={t("pyb.f.quarter")}>
                  <Select id="pyb-q" value={quarter} onChange={setQuarter}
                    options={[{ value: "q1", label: t("pyb.q1") }, { value: "q2", label: t("pyb.q2") }]} />
                </Field>
              </div>
            ) : null}
            {span === "fy" ? (
              <div style={{ flex: "0 1 220px", minWidth: 0, paddingTop: 26 }}>
                <StatusMark role="leave" glyph="clock" word={t("pyb.fyLabel")} />
              </div>
            ) : null}
            {span === "range" ? (
              <React.Fragment>
                <div style={{ flex: "0 1 170px", minWidth: 0 }}>
                  <Field id="pyb-from" label={t("pyb.f.from")}>
                    <Input id="pyb-from" type="date" value={from} onChange={setFrom} />
                  </Field>
                </div>
                <div style={{ flex: "0 1 170px", minWidth: 0 }}>
                  <Field id="pyb-to" label={t("pyb.f.to")}
                    error={badOrder ? t("pyb.err.order") : emptyRange ? t("pyb.err.empty") : null}>
                    <Input id="pyb-to" type="date" value={to} onChange={setTo} />
                  </Field>
                </div>
              </React.Fragment>
            ) : null}
            <div style={{ flex: "0 1 220px", minWidth: 0 }}>
              <Field id="pyb-fmt" label={t("pyb.f.format")}>
                <Select id="pyb-fmt" value={fmt} onChange={setFmt}
                  options={[{ value: "csv", label: t("pyb.fmt.csv") }, { value: "pdf", label: t("pyb.fmt.pdf") }]} />
              </Field>
            </div>
          </div>

          <div style={{ padding: "4px 20px 14px" }}>
            {R ? <p style={ty("caption", { color: c.inkMuted, margin: 0, maxWidth: "90ch" })}>{t(R.qKey)}</p> : null}
            {R && R.pii ? (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <div style={{ flex: "1 1 340px", minWidth: 0 }}>
                    <Switch id="pyb-pii" checked={pii} onChange={function (v) { setPii(v); if (!v) setWhy(""); }} label={t("pyb.f.pii")} />
                    <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0", maxWidth: 520 })}>{t("pyb.f.piiHint")}</p>
                  </div>
                  {pii ? (
                    <div style={{ flex: "0 1 300px", minWidth: 0 }}>
                      <Field id="pyb-why" label={t("pyb.f.piiReason")} hint={t("pyb.f.piiReasonHint")}>
                        <Select id="pyb-why" value={why} onChange={setWhy}
                          options={[{ value: "", label: t("pyb.f.piiPick") }].concat(
                            ["1", "2", "3"].map(function (n) { return { value: n, label: t("pyb.pii" + n) }; }))} />
                      </Field>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {R && months.length ? (
            <div style={{
              borderTop: "1px solid " + c.rule, display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", padding: "16px 0",
            }}>
              <Fact label={t("pyb.out.covers")} value={rangeWord} tone={c.chartBlue}
                note={months.length === 1 ? t("pyb.out.month1") : t("pyb.out.months", { n: num(months.length) })} />
              <Fact label={t("pyb.out.lines")} value={num(lines)} tone={c.chartBlue}
                note={R.per == null ? t("pyb.out.linesFlat") : t("pyb.out.linesNote", { per: num(R.per), n: num(months.length) })} />
              {total != null ? (
                <Fact label={t("pyb.out.total")} value={inr(total)} tone={c.chartTeal}
                  note={t("pyb.out.from") + ": " + months.map(function (x) { return x.run; }).join(" \u00b7 ")} />
              ) : null}
              <Fact label={t("pyb.out.cfg")} value={cfgs.join(" \u00b7 ")} tone={c.chartPurple} warn={cfgs.length > 1}
                note={cfgs.length > 1 ? t("pyb.out.cfgMany") : t("pyb.out.cfgOne")} />
              <Fact label={t("pyb.out.state")}
                value={provisional ? t("pyrp.st.prov") : t("pyrp.st.final")}
                tone={provisional ? c.chartAmber : c.chartGreen} warn={provisional}
                note={provisional ? t("pyb.out.provNote", { m: t("pyr.mon." + unapproved[0].m) }) : t("pyb.out.finalNote")} />
            </div>
          ) : null}

          <div style={{
            borderTop: "1px solid " + c.rule, padding: "14px 20px 18px",
            display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
          }}>
            <Button kind="primary" iconLeft="download" disabled={!canGo}
              onClick={!canGo ? undefined : produce}>{t("pyb.go")}</Button>
            <span style={ty("caption", { color: canGo ? c.inkMuted : c.lateText, flex: "1 1 260px" })}>
              {canGo ? t("pyb.goReady")
                : !R ? t("pyb.goBlocked")
                  : badOrder ? t("pyb.err.order")
                    : months.length === 0 ? t("pyb.err.empty")
                      : t("pyb.goNeedWhy")}
            </span>
          </div>
        </section>

        <Register
          title={t("pyb.hist")} sub={t("pyb.histSub")}
          columns={[
            { key: "what", label: t("pyb.col.what") },
            { key: "range", label: t("pyb.col.range") },
            { key: "how", label: t("pyb.col.how") },
            { key: "when", label: t("pyb.col.when"), mono: true },
            { key: "scope", label: t("pyb.col.scope") },
            { key: "state", label: t("pyb.col.state") },
            { key: "act", label: "", align: "right", width: 52 },
          ]}
          rows={made.concat(AUTO_REPORTS).map(function (m) {
            return {
              id: m.id,
              cells: {
                what: (
                  <span style={{ display: "block" }}>
                    <span style={ty("small", { color: c.ink, fontWeight: 600, display: "block" })}>{t(m.nameKey)}</span>
                    <span style={G3.fig("xs", { color: c.inkFaint, display: "block", marginTop: 1 })}>
                      {m.fmt.toUpperCase()} · {num(m.rows)}
                    </span>
                  </span>
                ),
                range: <span style={ty("caption", { color: c.inkMuted })}>{m.auto ? t(m.rangeKey) : m.range}</span>,
                how: m.auto
                  ? <span style={ty("caption", { color: c.inkMuted })}>{t("pyb.how.auto", { when: t(m.whenKey) })}</span>
                  : <span style={ty("caption", { color: c.ink, fontWeight: 600 })}>{t("pyb.how.you")}</span>,
                when: m.auto ? t("pyb.aug", { d: num(m.on) }) : t("pyb.aug", { d: num(12) }),
                scope: m.pii
                  ? <StatusMark role="late" glyph="lock" word={t("pyb.pii.carries")} />
                  : <span style={ty("caption", { color: c.inkFaint })}>{t("pyb.pii.without")}</span>,
                state: <StatusMark role={m.prov ? "late" : "present"} glyph={m.prov ? "clock" : "check"}
                  word={m.prov ? t("pyrp.st.prov") : t("pyrp.st.final")} />,
                act: (
                  <ActionMenu ariaLabel={t("pyb.download")} items={[
                    { key: "dl", label: t("pyb.download"), icon: "download", tone: "go", onSelect: function () { setGot(m); } },
                  ]} />
                ),
              },
            };
          })}
          footer={<span style={ty("caption", { color: c.inkFaint, maxWidth: "85ch" })}>{t("pyb.histFoot")}</span>}
        />

        {ready ? (
          <Modal
            icon="check" iconTone="present" title={t("pyb.ready")} sub={t("pyb.readySub")}
            onClose={function () { setReady(null); }}
            footer={
              <React.Fragment>
                <Button kind="primary" size="sm" iconLeft="download" onClick={function () { setReady(null); }}>{t("pyb.download")}</Button>
                <Button kind="secondary" size="sm" onClick={function () { setReady(null); setRep(""); }}>{t("pyb.again")}</Button>
              </React.Fragment>
            }
          >
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
              {t("pyb.readyBody", {
                name: t(ready.nameKey), range: rangeWord, rows: num(lines),
                scope: ready.pii && pii ? t("pyb.pii.carries") : t("pyb.pii.without"),
              })}
            </p>
          </Modal>
        ) : null}

        {got ? (
          <Modal
            icon="download" title={t(got.nameKey)} sub={t("pyb.dl.sub")}
            onClose={function () { setGot(null); }}
            footer={
              <React.Fragment>
                <Button kind="primary" size="sm" iconLeft="download" onClick={function () { setGot(null); }}>{t("pyb.download")}</Button>
                <Button kind="secondary" size="sm" onClick={function () { setGot(null); }}>{t("pyb.close")}</Button>
              </React.Fragment>
            }
          >
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
              {t("pyb.dl.body", {
                range: got.auto ? t(got.rangeKey) : got.range,
                how: got.auto ? t("pyb.how.auto", { when: t(got.whenKey) }) : t("pyb.how.you"),
                state: got.prov ? t("pyrp.st.prov") : t("pyrp.st.final"),
              })}
            </p>
          </Modal>
        ) : null}
      </React.Fragment>
    );
  }

  function PYReports({ role, onNavigate }) {
    /* the officer holds both campuses; everything below answers this */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    SCOPE = campus;   /* set before any spec or catalogue entry is read */
    const { c } = useTheme();
    const { t, ty } = useLang();
    Q && Q.usePayRequests();

    const [periodM, setPeriodM] = useState(8);
    const [subject, setSubject] = useState("");
    const [pick, setPick] = useState(null);
    const [open, setOpen] = useState(null);
    const [said, setSaid] = useState(null);
    /* the three registers that run to four hundred rows carry a
       search, a pay-group filter and a page. That state belongs to
       the module: a spec is rebuilt on every render. */
    const [q, setQ] = useState("");
    const [at, setAt] = useState("all");
    const [shown, setShown] = useState(PAGE);
    AT = periodM;   /* read, like SCOPE, by the specs below */
    /* TWO TABS, ONE MODULE. The registers are a shelf you browse —
       fifteen named things this month produced, each opened and read.
       A report is a request you make: say what and over what stretch
       of time, and it is built then. Same module, different act, so
       the registers are left exactly as they were. */
    const [tab, setTab] = useState("registers");

    /* run history lists runs, and a run is a place: the row hands the
       campus and the month to the run module, which is the same
       screen the run list opens. One object, two ways in. */
    /* a register is opened clean: last register's search term
       filtering this one is a bug the reader cannot see */
    function openReg(k) {
      setOpen(k); setSaid(null);
      setQ(""); setAt("all"); setShown(PAGE);
    }

    function openRun(key) {
      const bits = String(key).split("|");
      if (bits.length !== 2) return;
      window.Pages3 = window.Pages3 || {};
      window.Pages3.pyRunAt = { campus: bits[0], month: parseInt(bits[1], 10) };
      onNavigate && onNavigate("pyRunOpen");
    }

    if (!D) {
      return (
        <Shell campus={campus} onCampus={setCampus} role={role} onNavigate={onNavigate} title={t("pyrp.title")}>
          <Card><EmptyState head={t("pyrp.empty")} /></Card>
        </Shell>
      );
    }

    const per = D.PERIODS.filter(function (x) { return x.m === periodM; })[0] || D.PERIODS[D.PERIODS.length - 1];
    const provisional = per.state !== "disbursed";
    const all = catalogue(t, c);

    function TabBar() {
      return (
        <div style={{ marginBottom: G3.layout.gap }}>
          <Tabs
            idBase="pyrp" ariaLabel={t("pyrp.title")} active={tab} onChange={setTab}
            items={[
              { key: "registers", label: t("pyb.tab.registers") },
              { key: "reports", label: t("pyb.tab.reports") },
            ]}
          />
        </div>
      );
    }

    if (tab === "reports" && !open) {
      /* a report is built from a run, and a run is the month's, so this
         tab has no campus scope and does not pretend to one */
      return (
        <Shell role={role} onNavigate={onNavigate} title={t("pyrp.title")}>
          <TabBar />
          <ReportBuilder onNavigate={onNavigate} />
        </Shell>
      );
    }

    /* ---- one register, opened ---- */
    if (open) {
      const item = all.filter(function (x) { return x.k === open; })[0];
      const ctx = {
        onOpenRun: openRun, per: per, provisional: provisional,
        q: q, setQ: function (v) { setQ(v); setShown(PAGE); },
        at: at, setAt: function (v) { setAt(v); setShown(PAGE); },
        shown: shown, setShown: setShown,
      };
      const spec = Object.assign(item.spec(t, c, ctx), {
        provenance: item.meta.covers === "run" ? per.run + " · " + per.cfg.v
          : item.meta.covers === "thisRun" ? D.RUN_ID + " · " + D.CFG_JUL.v : "",
      });
      if (item.reconKey) spec.reconKey = item.reconKey;
      if (!spec.reconVars) spec.reconVars = { n: num(D.RUN_HEADS) };
      return (
        <Shell campus={campus} onCampus={setCampus}
          role={role} onNavigate={onNavigate}
          title={t("pyrp.r." + item.k)}
          back={{ label: t("pyrp.back"), onBack: function () { setOpen(null); } }}
          chips={[
            item.meta.covers === "run" || item.meta.covers === "thisRun"
              ? <Chip key="r" bg={c.sunken} fg={c.inkMuted} mono>{item.meta.covers === "thisRun" ? D.RUN_ID : per.run}</Chip>
              : null,
            item.meta.state === "live"
              ? <StatusMark key="s" role="leave" glyph="scan" word={t("pyrp.st.live")} />
              : provisional
                ? <StatusMark key="s" role="late" glyph="clock" word={t("pyrp.st.prov")} />
                : <StatusMark key="s" role="present" glyph="check" word={t("pyrp.st.final")} />,
          ]}
        >
          {item.meta.state !== "live" && provisional ? (
            <div style={{
              display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap",
              borderRadius: G3.r.md, background: c.lateTint, padding: "14px 17px", marginBottom: G3.layout.gap,
            }}>
              <span aria-hidden="true" style={{ display: "flex", marginTop: 1, color: c.lateText }}><Icon name="alert" size={17} /></span>
              <div style={{ minWidth: 0 }}>
                <div style={ty("small", { color: c.lateText, fontWeight: 700 })}>{t("pyrp.prov.head", { mon: t("pyr.mon." + per.m) })}</div>
                <p style={ty("caption", { color: c.ink, margin: "3px 0 0", maxWidth: "84ch" })}>{t("pyrp.prov.body", { run: per.run })}</p>
              </div>
            </div>
          ) : null}
          <ReportView spec={spec} />
        </Shell>
      );
    }

    /* ---- the catalogue ---- */
    let rows = all.filter(function (x) {
      if (subject && x.g !== subject) return false;
      if (pick && x.g !== pick) return false;
      return true;
    });

    const segments = GROUPS_OF.map(function (g) {
      return {
        key: g, label: t("pyrp.seg." + g),
        value: all.filter(function (x) { return x.g === g; }).length,
        color: c[{ run: "chartBlue", adjust: "chartAmber", exit: "chartPurple", people: "chartTeal" }[g]] || c.accent,
      };
    });

    /* THE STRIP COUNTS REGISTERS, because that is what this screen
       is made of. A figure slot holds a quantity: "Provisional" and
       "2026.3" are words, and at figure size they read as data and
       measure nothing. The three parts add to the total exactly. */
    const liveN = all.filter(function (x) { return x.meta.state === "live"; }).length;
    const tiedN = all.length - liveN;
    const finalN = provisional ? 0 : tiedN;
    const provN = provisional ? tiedN : 0;

    /* EVERY CELL CARRIES ITS LINE, or none of them does. Four bare
       figures beside one with a note read as unfinished -- and a
       zero is the figure that most needs saying, because zero of
       something means nothing until the reader knows why. */
    const metrics = [
      { k: "f", label: t("pyrp.m.final"), value: num(finalN), tone: c.chartGreen,
        note: finalN ? t("pyrp.m.finalNote") : t("pyrp.m.finalNone", { run: per.run }) },
      { k: "p", label: t("pyrp.m.prov"), value: num(provN), tone: c.chartAmber,
        note: provN ? t("pyrp.m.provNote", { run: per.run }) : t("pyrp.m.provNone") },
      { k: "l", label: t("pyrp.m.live"), value: num(liveN), tone: c.chartBlue,
        note: t("pyrp.m.liveNote") },
      { k: "n", label: t("pyrp.m.count"), value: num(all.length), total: true,
        tone: c.chartTeal, note: t("pyrp.m.countNote") },
    ];

    return (
      <Shell campus={campus} onCampus={setCampus}
        role={role} onNavigate={onNavigate} title={t("pyrp.title")}
        chips={[
          <Chip key="r" bg={c.sunken} fg={c.inkMuted} mono>{per.run}</Chip>,
          provisional
            ? <StatusMark key="s" role="late" glyph="clock" word={t("pyrp.st.prov")} />
            : <StatusMark key="s" role="present" glyph="check" word={t("pyrp.st.final")} />,
        ]}
      >
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

        <TabBar />

        <Band
          head={t("pyrp.band", { mon: t("pyr.mon." + per.m), y: "2026" })}
          metrics={metrics}
        />

        {provisional ? (
          <div style={{
            display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap",
            borderRadius: G3.r.md, background: c.lateTint, padding: "14px 17px", marginBottom: G3.layout.gap,
          }}>
            <span aria-hidden="true" style={{ display: "flex", marginTop: 1, color: c.lateText }}><Icon name="alert" size={17} /></span>
            <div style={{ minWidth: 0 }}>
              <div style={ty("small", { color: c.lateText, fontWeight: 700 })}>{t("pyrp.prov.head", { mon: t("pyr.mon." + per.m) })}</div>
              <p style={ty("caption", { color: c.ink, margin: "3px 0 0", maxWidth: "86ch" })}>{t("pyrp.prov.body", { run: per.run })}</p>
            </div>
          </div>
        ) : null}

        <div style={{
          display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center",
          marginBottom: G3.layout.gap, padding: "10px 16px",
          border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
        }}>
          <FilterPair id="pyrp-per" label={t("pyrp.f.period")} width={190}>
            <Select id="pyrp-per" value={String(periodM)} onChange={function (v) { setPeriodM(+v); setSaid(null); }}
              ariaLabel={t("pyrp.f.period")} size="sm"
              options={D.PERIODS.map(function (x) { return { value: String(x.m), label: t("pyr.mon." + x.m) + " 2026" }; })} />
          </FilterPair>
          <FilterPair id="pyrp-sub" label={t("pyrp.f.subject")} width={200}>
            <Select id="pyrp-sub" value={subject} onChange={setSubject} ariaLabel={t("pyrp.f.subject")} size="sm"
              options={[{ value: "", label: t("pyrp.f.all") }].concat(
                GROUPS_OF.map(function (g) { return { value: g, label: t("pyrp.seg." + g) }; }))} />
          </FilterPair>
          {(subject || pick || periodM !== 8) ? (
            <LinkButton onClick={function () { setSubject(""); setPick(null); setPeriodM(8); }}>{t("pyrp.f.clear")}</LinkButton>
          ) : null}
        </div>

        {!rows.length ? (
          <Card><EmptyState head={t("pyrp.none")} body={t("pyrp.noneBody")} /></Card>
        ) : (
          <Register
            title={t("pyrp.reg.title")}
            onSelect={openReg}
            columns={[
              { key: "rep", label: t("pyrp.col.report") },
              { key: "cov", label: t("pyrp.col.covers"), width: 190 },
              { key: "n", label: t("pyrp.col.rows"), align: "right", mono: true, width: 110 },
              { key: "v", label: t("pyrp.col.v"), align: "right", mono: true, width: 170, weight: 700 },
              { key: "st", label: t("pyrp.col.state"), width: 160 },
              { key: "act", label: t("pyrp.col.act"), align: "right", width: 60 },
            ]}
            rows={rows.map(function (x) {
              const liveOne = x.meta.state === "live";
              return {
                id: x.k,
                cells: {
                  rep: <span style={{ fontWeight: 600 }}>{t("pyrp.r." + x.k)}</span>,
                  cov: x.meta.covers === "run" ? t("pyrp.covers.run", { mon: t("pyr.mon." + per.m) })
                    : x.meta.covers === "thisRun" ? t("pyrp.covers.thisRun", { run: D.RUN_ID })
                      : x.meta.covers === "period" ? t("pyrp.covers.period", { mon: t("pyr.mon." + per.m) })
                        : x.meta.covers === "session" ? t("pyrp.covers.session")
                          : t("pyrp.covers.live"),
                  n: x.n ? num(x.n) : "—",
                  v: x.v == null ? "—" : inr(x.v),
                  st: liveOne
                    ? <StatusMark role="leave" glyph="scan" word={t("pyrp.st.live")} />
                    : provisional
                      ? <StatusMark role="late" glyph="clock" word={t("pyrp.st.prov")} />
                      : <StatusMark role="present" glyph="check" word={t("pyrp.st.final")} />,
                  act: (
                    <span style={{ display: "flex", justifyContent: "flex-end" }} onClick={function (e) { e.stopPropagation(); }}>
                      <ActionMenu
                        ariaLabel={t("pyrp.r." + x.k)} size={30}
                        items={[
                          { key: "open", icon: "document", label: t("pyrp.act.open"), tone: "go", onSelect: function () { openReg(x.k); } },
                          { key: "exp", icon: "download", label: t("pyrp.act.export"),
                            onSelect: function () {
                              setSaid(t("pyrp.act.exported", {
                                st: liveOne ? t("pyrp.st.live") : provisional ? t("pyrp.st.prov") : t("pyrp.st.final"),
                              }));
                            } },
                        ]}
                      />
                    </span>
                  ),
                },
              };
            })}
            footer={
              <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", width: "100%" }}>
                <span style={{ color: c.inkMuted, maxWidth: "76ch" }}>
                  {t("pyrp.foot", {
                    p: num(rows.filter(function (x) { return x.meta.state !== "live"; }).length),
                    l: num(rows.filter(function (x) { return x.meta.state === "live"; }).length),
                  })}
                </span>
                <span style={{ color: c.inkFaint, whiteSpace: "nowrap" }}>{per.run + " · " + per.cfg.v}</span>
              </div>
            }
          />
        )}
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.PYReports = PYReports;
  window.Pages3.PYReportsStrings = true;
})();

