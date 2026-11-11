/* @jsxRuntime classic */
/* ============================================================
   Naveya — Staff & salaries, and one person's pay record
   window.Pages3.PYPeople (PY-05 register + PY-06) · PYRecord (the same
   module, opened on one person)

   WHY THIS FILE EXISTS. The payroll officer had no way to answer the
   question she is asked most often: "what does this person actually
   earn, and why is this month's figure what it is?" PY-05 existed as
   the fourth tab of a module called "Salary", and its detail was a
   380px side panel beside a list — room enough for a gross figure and
   a revise button, and not room enough for the breakdown that makes
   the gross figure believable. So the one screen whose whole job is
   provenance for money was the one screen with no room to show it.

   THE RULING (designer, 2026-10-07): "somewhere a staff record with
   their individual salary breakdown and etc". So the register goes
   full width and the person gets a record of their own.

   AND THE RULING THAT SHAPED IT (designer, 2026-10-16): "the
   information is too differentiated between multiple sections, i dont
   need a detail screen as a whole i need a side modal on the staff
   register screen with the table of info of the pay record."

   The screen had grown to seven cards -- five metric cells, three
   signed columns side by side, a bar for the ceiling, a history, a
   month, an identity list, an actions card -- to answer one question:
   what does this person earn, and how was the figure arrived at. Worse,
   the three columns are three tables with no arithmetic between them:
   nothing on the screen showed that the middle column SUBTRACTS from
   the left one. So the record is a PANEL beside the register now, and
   the arithmetic is ONE TABLE running down it -- the earnings sum to
   the gross in the headline, the deductions close on the net, the
   employer lines close on the cost.

   WHAT ENTITLES THIS SCREEN TO THE FIGURES. HR-03's record is barred
   from salary: docs/screen-inventory.md HR-03 "must NOT contain" ends
   with "the payroll view of an employee (PY-05)", and person.jsx says
   of its own pay block "what the RECORD holds. The month's run is
   payroll's and is never restated here." This is that screen. It is
   the only place in the product where a component breakdown, a
   statutory base and an employer cost appear for one named person.

   AND WHAT IT STILL MAY NOT HOLD (PY-05):
     . the structure EDITOR            -> Pay rules (PY-03). Reading
                                          which components priced this
                                          salary is provenance; editing
                                          them moves everybody on the
                                          group and belongs where that
                                          consequence is stated.
     . payslip PDFs                    -> the run's register (PY-10).
     . appraisal recommendations       -> the proposals tab (PY-06).
                                          They are proposals, not pay.
     . documents, attendance correction-> HR-07, HR-30.

   ONE SET OF FACTS. Every figure is priced by pages/py-salary.jsx's
   own structures and ledgers, published as `PYSalData`, and the
   person's identity comes from window.NaveyaPerson. Nothing is
   re-typed here. Ananya Rao earns 94,800.00 gross and 78,432.00 net
   on this screen because that is what the run register already says
   she earns, and the self-checks at the foot of this file fail if the
   two ever disagree.

   THE 50% RULE IS LIVE ON THIS RECORD. Her excluded allowances come
   to exactly 47,400.00 of a 94,800.00 gross — 50.00%, sitting ON the
   Labour Code ceiling rather than under it. A record that printed
   only the gross would hide that; this one says it, because the next
   revision is the one that breaks it.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark, Seal,
    Figure, Icon, EmptyState, Tabs, TabPanel, ActionMenu, Avatar,
    Meter, SideScreen, Modal, Band, Field, Input, Select, inr, num,
    CampusSwitch, campusLabel, campusOptions, inCampus, campusOfCode, CAMPUS_ALL,
  } = UI;

  const D = (window.Pages3 && window.Pages3.PYSalData) || null;
  const SalParts = (window.Pages3 && window.Pages3.PYSalParts) || {};
  const PERSON = window.NaveyaPerson || null;

  /* ------------------------------------------------------------
     THE LWF QUESTION, resolved here and flagged in the commit.
     pages/py-ops.jsx carries LWF in each pay group's `emp` block —
     an EMPLOYER cost — and its register's net for Ananya (78,432.00)
     excludes it. pages/py-salary.jsx's simulator carries `lwf: 20`
     in the same row as pf/esi/pt/tds, i.e. as an EMPLOYEE deduction,
     which would make her net 78,412.00. Both cannot be true and the
     difference is net pay.

     This record follows py-ops: LWF is shown in the employer column.
     That is the side the run register and RUN_NET already compute on,
     and the register is the artefact the checker reads and the
     golden-file test diffs. The other half of the real statutory
     position — most states levy an employee contribution too — is a
     StatutoryConfig question for riddler, not something to settle by
     picking a number on a design canvas. Flagged, not silently
     averaged.
     ------------------------------------------------------------ */
  const LWF_SIDE = "employer";

  addStrings({
    en: {
      "pyp.crumb": "Payroll",
      "pyp.entity": "Naveya Vidya Trust — Bengaluru",
      "pyp.maker": "Sunita Kulkarni",
      "pyp.roleMaker": "Payroll Officer",

      "pyp.title": "Staff & salaries",
      "pyp.tab.reg": "Salary register",
      "pyp.tab.prop": "Proposed revisions",
      "pyp.tabs.aria": "Staff and salaries",
      "pyp.run": "AUG-2026",
      "pyp.cfg": "Statutory config {v}",

      "pyp.band.aria": "Who can be paid this month",
      "pyp.band.head": "Who can be paid this month",
      "pyp.be.head": "The breakdown",
      "pyp.be.resetAll": "Put every line back",
      "pyp.be.balanceNote": "takes the balance",
      "pyp.be.inWages": "\u00b7 counts as wages",
      "pyp.be.absorbs": "absorbs the rest",
      "pyp.be.overFrom": "changed from {was}",
      "pyp.be.wages": "Wages, which PF is charged on: {wages}",

      "pyp.as.staffType": "Type of staff",
      "pyp.as.staffTypeHint": "This picks the pay group, and the pay group decides what may price them.",
      "pyp.as.structHint": "From Pay rules. Change the type above to see others.",
      "pyp.as.fromRules": "{group} is priced by {n} structure(s) defined in Pay rules. Every line below comes from it.",

      "pyp.pr.band": "Rises waiting for figures",
      "pyp.pr.m.waiting": "waiting on you",
      "pyp.pr.m.becomes": "they come to",
      "pyp.pr.m.impact": "added to the monthly bill",
      "pyp.pr.m.impactNote": "Before statutory; the employer share rises with it.",
      "pyp.pr.m.year": "over a full year",
      "pyp.pr.col.appr": "Appraisal",
      "pyp.pr.col.by": "Agreed by",
      "pyp.pr.col.current": "Current",
      "pyp.pr.col.rise": "Rise",
      "pyp.pr.col.becomes": "Becomes",
      "pyp.pr.col.delta": "Monthly delta",
      "pyp.pr.col.onSet": "You set it",
      "pyp.pr.st.waiting": "Needs figures",
      "pyp.pr.act.declinedWhy": "You declined this one. HR can record a new appraisal if the decision changes.",
      "pyp.pr.reg.title": "Proposed revisions",
      "pyp.pr.reg.sub": "{n} waiting for figures. Settled and declined stay on the list \u2014 a queue with no history is one you work twice.",
      "pyp.pr.reg.foot": "Totals count only the rows still waiting. A percentage is what the appraisal agreed; what it becomes is yours.",
      "pyp.pr.tot": "Waiting on you",
      "pyp.pr.q": "Appraisals your heads of department have recorded. Each one agreed a percentage; you decide the figures it becomes.",
      "pyp.pr.empty": "Nothing waiting",
      "pyp.pr.emptyWhy": "No appraisal has agreed a rise that still needs figures. When one does, it appears here.",
      "pyp.pr.plusPct": "+{pct}%",
      "pyp.pr.card.by": "Agreed by {who}, {on}",
      "pyp.pr.act.set": "Set the new figures",
      "pyp.pr.act.decline": "Decline",
      "pyp.pr.closed": "Already dealt with",
      "pyp.pr.settledBy": "Set by {who}, {on}",
      "pyp.pr.declinedBy": "Declined by {who}, {on}",
      "pyp.pr.st.settled": "Figures set",
      "pyp.pr.st.declined": "Declined",
      "pyp.pr.done": "{name} is on {gross} a month. HR can see the rise on her appraisal.",

      "pyp.pr.panel.title": "Set the new figures",
      "pyp.pr.panel.sub": "For {name}",
      "pyp.pr.panel.agreed": "What the appraisal agreed",
      "pyp.pr.panel.agreedWhy": "{who} recorded this on appraisal {appr}, {on}. The percentage is theirs; the figures below are yours.",
      "pyp.pr.panel.grossHint": "Opens on what the percentage comes to. Change it if the figures should land elsewhere.",
      "pyp.pr.panel.off": "This lands at {pct}, not the {agreed} the appraisal agreed. HR will see what you set.",
      "pyp.pr.panel.consequence": "Saving proposes it. {checker} releases it, and HR then sees the rise against the appraisal.",
      "pyp.pr.panel.go": "Set these figures",

      "pyp.pr.dec.title": "Decline this revision",
      "pyp.pr.dec.body": "The appraisal stands; only the pay change stops here. HR sees the reason against the appraisal.",
      "pyp.pr.dec.r1": "The budget for this grade is already committed",
      "pyp.pr.dec.r2": "This would put the structure over the Labour Code ceiling",
      "pyp.pr.dec.r3": "It needs the trust\u2019s approval before payroll can act",
      "pyp.pr.dec.note": "A declined revision is recorded, not deleted. HR can record a new appraisal if the decision changes.",
      "pyp.pr.dec.go": "Decline it",
      "pyp.pr.dec.done": "Declined. HR can see the reason on {name}\u2019s appraisal.",

      "pyp.band.sub": "Every member of staff in this entity, split by whether payroll can price them this month.",
      "pyp.col.act": "Actions",
      "pyp.col.act.open": "Open the pay record",
      "pyp.col.act.aria": "Actions for {name}",
      "pyp.st.waiting": "Waiting on you",

      "pyp.hand.title1": "One person has no salary yet",
      "pyp.hand.title": "{n} people have no salary yet",
      "pyp.hand.sub": "HR sets the salary. The run blocks on them by name until it does.",
      "pyp.hand.sentBy": "Created by {who} on {on}",
      "pyp.hand.joins": "Joined {d}",
      "pyp.hand.reminded1": "You asked HR once, on {on}",
      "pyp.hand.reminded": "You have asked HR {n} times, last on {on}",
      "pyp.hand.chase": "Ask HR to set it",
      "pyp.ask.what": "What is wrong",
      "pyp.ask.t.wrong": "The salary looks wrong",
      "pyp.ask.t.split": "The split looks wrong",
      "pyp.ask.t.group": "Wrong pay group",
      "pyp.ask.t.date": "Wrong date it starts from",
      "pyp.ask.t.unset": "No salary set",
      "pyp.ask.note": "Anything to add",
      "pyp.ask.notePh": "One line is enough",
      "pyp.ask.go": "Send to HR",
      "pyp.ask.cancel": "Cancel",
      "pyp.ask.lands": "HR sees this against the person in their pay queue.",
      "pyp.ask.unsetBody": "HR has not set a salary for {name}. This asks them to.",
      "pyp.ask.done": "Asked HR about {name}.",

      "pyp.as.title": "Assign a salary",
      "pyp.as.sub": "For {name}",
      "pyp.as.s1": "Who this is, and who sent them",
      "pyp.as.s2": "What will price them",
      "pyp.as.s3": "What they will be paid",
      "pyp.as.doj": "Joining date",
      "pyp.as.sentBy": "Handed over by",
      "pyp.as.groupNote": "The pay group came with the contract and is HR\u2019s to set. The structure, the figure and the date are yours.",
      "pyp.as.gross": "Monthly gross",
      "pyp.as.grossHint": "Rupees, as on the contract. Paise are kept exactly.",
      "pyp.as.basic": "Basic, from the grade scale",
      "pyp.as.basicHint": "Everything else is derived from it, and the balance falls to SPL.",
      "pyp.as.fromDoj": "Their joining date, {d}",
      "pyp.as.fromNext": "The 1st of next month",
      "pyp.as.previewEmpty": "Enter a monthly gross and a basic, and the breakdown appears here before you commit to it.",
      "pyp.as.ceilOk": "Within the Labour Code ceiling",
      "pyp.as.ceilOver": "Over the Labour Code ceiling",
      "pyp.as.refuse": "This cannot be saved. Excluded allowances may not exceed half the total \u2014 raise the basic, or lower the allowances.",
      "pyp.as.consequence": "Saving proposes it. {checker} releases it, and the figure then appears on HR\u2019s record of this person.",
      "pyp.as.cancel": "Cancel",
      "pyp.as.go": "Assign this salary",
      "pyp.as.done": "{name} is on {gross} a month. Sent to {checker} to release, and HR can now see the figure.",
      "pyp.as.errFields": "Pick a structure and enter both figures. The basic cannot be more than the gross.",
      "pyp.as.errCeiling": "Excluded allowances are over the ceiling by {over}.",

      "pyp.m.onPayroll": "on payroll",
      "pyp.m.onPayrollNote": "Priced, and the run can pay them",
      "pyp.m.unassigned": "no salary assigned",
      "pyp.m.unassignedNote": "They will not be paid",
      "pyp.m.unassignedNone": "Everybody has a salary",
      "pyp.m.scheduled": "revision scheduled",
      "pyp.m.scheduledNote": "Dated for a later month",
      "pyp.m.scheduledNone": "Nothing dated ahead",
      "pyp.m.atLimit": "at the 50% ceiling",
      "pyp.m.atLimitNote": "Basic is half the gross or more",
      "pyp.m.atLimitNone": "Every basic is under half",
      "pyp.m.monthly": "monthly gross",
      "pyp.m.monthlyNote": "Before anything comes off",

      "pyp.col.staff": "Staff",
      "pyp.col.group": "Pay group",
      "pyp.col.structure": "Structure",
      "pyp.col.gross": "Monthly gross",
      "pyp.col.from": "Effective from",
      "pyp.col.state": "State",
      "pyp.reg.title": "Salary register",
      "pyp.reg.sub": "{n} staff. Unassigned first — a person with no salary row is not paid at all, and the run blocks on them.",
      "pyp.reg.open": "Open the pay record",
      "pyp.reg.empty": "Nobody on this campus yet.",

      "pyp.st.assigned": "Assigned",
      "pyp.st.hourly": "Paid by the hour",
      "pyp.st.unassigned": "Not set up",
      "pyp.st.scheduled": "From {d}",
      "pyp.st.joiner": "Joined {d}",

      "pyp.rec.code": "Staff no.",

      "pyp.rec.m.gross": "monthly gross",

      "pyp.rec.f.month": "this month",
      "pyp.rec.f.revised": "last revised",

      "pyp.rec.h.table": "How it adds up",
      "pyp.rec.showAll": "Show every line",
      "pyp.rec.hideAll": "Hide every line",
      "pyp.rec.meta.earn": "{n} components",
      "pyp.rec.meta.ded": "{n} come off",
      "pyp.rec.meta.emp": "{n} contributions",
      "pyp.rec.meta.revs": "{n} recorded \u00b7 current since {d}",
      "pyp.rec.meta.filed": "UAN, ESIC, PAN, salary account",
      "pyp.rec.meta.filedNone": "held on the staff file",
      "pyp.rec.c.PF": "Provident fund",
      "pyp.rec.c.ESI": "Employees\u2019 State Insurance",
      "pyp.rec.c.PT": "Professional tax",
      "pyp.rec.c.TDS": "Income tax",
      "pyp.rec.c.PFER": "Provident fund",
      "pyp.rec.c.ESIER": "Employees\u2019 State Insurance",
      "pyp.rec.c.LWF": "Labour welfare fund",

      "pyp.rec.h.revs": "Every revision",
      "pyp.rec.rev.who": "{who} proposed it, {appr} released it",
      "pyp.rec.rev.pending": "Proposed, and with {who} to release",
      "pyp.rec.rev.returned": "Sent back by {who}, and not re-proposed",
      "pyp.rec.h.filed": "Filed in their name",

      "pyp.rec.earn": "Earnings",
      "pyp.rec.ded": "Deductions",
      "pyp.rec.emp": "What the school pays on top",
      "pyp.rec.gross": "Gross",
      "pyp.rec.net": "Net pay",
      "pyp.rec.netNote": "what reaches their bank",
      "pyp.rec.cost": "Cost to the school",
      "pyp.rec.costNote": "the gross, and what the school adds to it",
      "pyp.rec.how.grade": "grade scale",
      "pyp.rec.how.flat": "fixed amount",
      "pyp.rec.how.pct": "{pct}% of {of}",
      "pyp.rec.how.balance": "the balance of gross",
      "pyp.rec.how.pf": "12% of basic and DA, never of the gross",
      "pyp.rec.how.pt": "Karnataka slab for this gross",
      "pyp.rec.how.tds": "old regime, projected to March",
      "pyp.rec.how.lwf": "charged once a year, not monthly",
      "pyp.rec.how.pfEr": "the school matches the deduction above",
      "pyp.rec.how.esi": "the employee’s share",
      "pyp.rec.how.esiEr": "the school’s share, which is the larger one",
      "pyp.rec.how.esiNo": "not applicable — gross is above the ESI wage ceiling",

      "pyp.rec.ceilRules": "Open Pay rules",

      "pyp.rec.histSub": "Effective-dated: a revision adds a row, and nothing here is ever edited in place.",
      "pyp.col.period": "In force",
      "pyp.col.reason": "Reason",
      "pyp.rec.current": "Current",
      "pyp.r.pay_revision": "Pay revision",
      "pyp.r.promotion": "Promotion",
      "pyp.r.correction": "Correction",
      "pyp.r.da_vda": "DA revision",
      "pyp.r.new": "First assignment",
      "pyp.rec.to": "to {d}",
      "pyp.rec.onwards": "onwards",

      "pyp.rec.idsSub": "Masked by default. Revealing one is recorded against your name.",
      "pyp.rec.id.uan": "UAN / PF",
      "pyp.rec.id.esic": "ESIC",
      "pyp.rec.id.pan": "PAN",
      "pyp.rec.id.bank": "Salary account",
      "pyp.rec.id.pt": "Professional tax",
      "pyp.rec.reveal": "Show",
      "pyp.rec.hide": "Hide",
      "pyp.rec.revealed": "Shown to you. This was recorded.",
      "pyp.rec.changedBy": "Last changed by {who}, {when}",
      "pyp.rec.esicNone": "Not registered — gross is above the wage ceiling",
      "pyp.rec.ptState": "Karnataka",
      "pyp.rec.idsAbsent": "Identity numbers are not held on this record",
      "pyp.rec.idsAbsentWhy": "They live in the staff file HR maintains. Payroll reads them at compute, never from this screen.",
      "pyp.rec.idsGo": "Open the staff file",

      "pyp.rec.paidOf": "{paid} of {total} days paid",
      "pyp.rec.noLop": "No unpaid days",
      "pyp.rec.lop": "{n} unpaid",

      "pyp.rec.noAttachedWhy": "Nothing is attached to this month: no loan being recovered, no claim being paid, no arrears owed.",
      "pyp.rec.attGo": "Open Adjustments",

      "pyp.rec.act.revise": "Ask HR to change it",
      "pyp.rec.act.export": "Export this record",
      "pyp.exp.title": "Export {name}\u2019s pay record",
      "pyp.exp.sub": "One person's pay is the densest personal data this product holds. It is recorded against your name, and cannot be recalled.",
      "pyp.exp.what": "What the file carries",
      "pyp.exp.l1": "The salary structure and every component on it",
      "pyp.exp.l2": "The gross, the annual figure and the date it took effect",
      "pyp.exp.l3": "The staff number, the pay group and the campus",
      "pyp.exp.not": "It does NOT carry the bank account, the PAN or the Aadhaar \u2014 those never leave in a salary export.",
      "pyp.exp.recorded": "Recorded against {who}, with today\u2019s date, on the person\u2019s audit trail.",
      "pyp.exp.go": "Make the file",
      "pyp.exp.cancel": "Not now",
      "pyp.exp.doneHead": "The file is made, and recorded",
      "pyp.exp.doneBody": "{name}\u2019s pay record left as a file, recorded against {who}. It is on their audit trail for good.",
      "pyp.exp.ok": "Close",
      "pyp.rec.act.reviseWhy": "A revision opens the maker-checker gate: you propose it, {checker} releases it.",
      "pyp.rec.act.noEditWhy": "No line here can be edited: they are set by the salary structure, and changing one moves everybody on {group}.",
      "pyp.rec.hon": "Not on a salary, and not missing one",
      "pyp.rec.honWhy": "{name} is paid by the hour: {rate} a {unit}, capped at {cap} a month. The rate lives in Pay rules and the month\u2019s units come from the run \u2014 neither is a salary, so neither is here.",
      "pyp.rec.unassigned": "No salary assigned",
      "pyp.rec.unassignedWhy": "This person will not be paid until a salary row exists. The run blocks on them by name.",
    },
  });

  /* ------------------------------------------------------------
     DERIVED FACTS. Nothing below is authored; every number comes
     from PYSalData, which is pages/py-salary.jsx's own dataset.
     ------------------------------------------------------------ */
  const MONTHS_EN = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtD(d) { return d ? d.d + " " + MONTHS_EN[d.m] + " " + d.y : ""; }
  const AUG = 8;

  function stateOf(p) {
    /* visiting faculty have no salary ROW and are not missing one:
       they are priced by an honorarium rule and the run pays them.
       Counting them as unassigned made the band say two people would
       not be paid while the handover card above it named one. */
    if (p.byRule) return "hourly";
    if (p.gross == null) return "unassigned";
    if (p.from && (p.from.y > 2026 || (p.from.y === 2026 && p.from.m > 9))) return "scheduled";
    return "assigned";
  }

  /* the month's deduction row for a person, from the simulator the
     structure editor already previews with */
  function simFor(p) {
    if (!D || p.gross == null) return null;
    const st = D.structureFor(p);
    if (!st) return null;
    const sim = st.group === "teach" ? D.SIM.teach3 : D.SIM.admin2;
    return sim.rows[0];
  }

  /* gross -> deductions -> net, employer separately. LWF sits on the
     employer side; see LWF_SIDE above. */
  function moneyFor(p) {
    const lines = D && p.gross != null ? D.linesFor(p) : null;
    const s = simFor(p);
    if (!lines || !s) return null;
    const ded = [];
    if (s.pf) ded.push({ code: "PF", v: s.pf, how: "pf", stat: true });
    if (s.esi) ded.push({ code: "ESI", v: s.esi, how: null, stat: true });
    if (s.pt) ded.push({ code: "PT", v: s.pt, how: "pt", stat: true });
    if (s.tds) ded.push({ code: "TDS", v: s.tds, how: "tds", stat: true });
    const emp = [];
    if (s.pfEr) emp.push({ code: "PFER", v: s.pfEr, stat: true });
    if (s.esiEr) emp.push({ code: "ESIER", v: s.esiEr, stat: true });
    if (s.lwf && LWF_SIDE === "employer") emp.push({ code: "LWF", v: s.lwf, how: "lwf", stat: true });
    const gross = lines.reduce((a, l) => a + l.v, 0);
    const dedTotal = ded.reduce((a, l) => a + l.v, 0);
    const empTotal = emp.reduce((a, l) => a + l.v, 0);
    return {
      lines: lines, ded: ded, emp: emp, esiApplies: !!s.esi,
      gross: D.r2(gross), dedTotal: D.r2(dedTotal), net: D.r2(gross - dedTotal),
      empTotal: D.r2(empTotal), cost: D.r2(gross + empTotal),
    };
  }

  const ROSTER = D ? D.STAFF.slice().sort(function (a, b) {
    const rank = { unassigned: 0, scheduled: 1, assigned: 2, hourly: 3 };
    const ra = rank[stateOf(a)], rb = rank[stateOf(b)];
    if (ra !== rb) return ra - rb;
    return (b.gross || 0) - (a.gross || 0);
  }) : [];

  /* who the run can pay: a salary or an hourly rate, both priced */
  function payable(p) { const st = stateOf(p); return st === "assigned" || st === "hourly"; }

  const COUNTS = {
    all: ROSTER.length,
    assigned: ROSTER.filter(payable).length,
    unassigned: ROSTER.filter(function (p) { return stateOf(p) === "unassigned"; }).length,
    scheduled: ROSTER.filter(function (p) { return stateOf(p) === "scheduled"; }).length,
  };
  const PAYROLL_TOTAL = ROSTER.reduce(function (s, p) { return s + (p.gross || 0); }, 0);
  const AT_LIMIT_IDS = ROSTER.filter(function (p) {
    if (!D || p.gross == null) return false;
    const l = D.linesFor(p);
    if (!l) return false;
    const v = D.wageVerdict(l);
    return v.state === "at" || v.state === "over";
  }).map(function (p) { return p.id; });

  /* ------------------------------------------------------------
     Small shared pieces. Signed arithmetic, a labelled read-out, and
     a value that is masked until somebody asks and the asking is
     recorded.
     ------------------------------------------------------------ */
  function EqRow({ sign, label, how, value, strong, rule, tone }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{
        display: "flex", alignItems: "baseline", gap: 12, padding: "7px 0",
        borderTop: rule ? "1px solid " + c.rule : "none",
      }}>
        <span aria-hidden="true" style={ty("caption", { color: c.inkFaint, width: 10, flex: "0 0 10px", fontFamily: G3.font.mono })}>{sign || ""}</span>
        <span style={ty("small", { color: c.ink, fontWeight: strong ? 700 : 500, minWidth: 0, flex: "1 1 auto" })}>
          {label}
          {how ? <span style={ty("caption", { color: c.inkFaint, fontWeight: 400, marginInlineStart: 8 })}>{how}</span> : null}
        </span>
        <span style={ty("small", {
          color: tone || c.ink, fontWeight: strong ? 700 : 600,
          fontFamily: G3.font.mono, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
        })}>{value}</span>
      </div>
    );
  }

  /* ONE FIGURE, AND THE SENTENCE THAT ACCOUNTS FOR IT. The same shape
     the HR record panel and the approval gate open with, so a record
     reads the same whichever desk opened it. */
  function Lead({ label, value, line, facts }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const live = (facts || []).filter(Boolean);
    return (
      <section style={{ borderRadius: G3.r.md, background: c.alt, padding: "18px 20px 20px" }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={G3.fig("xl", { color: c.ink, fontWeight: 700, lineHeight: 1.1, marginTop: 4 })}>{value}</div>
        {line ? <div style={ty("small", { color: c.inkMuted, marginTop: 8, maxWidth: "66ch" })}>{line}</div> : null}
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
      </section>
    );
  }

  /* a heading and the thing under it. No card inside a panel that is
     already a surface -- an outline is enough to group. */
  function Block({ head, sub, action, children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface, padding: "16px 18px 18px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <h3 style={ty("h3", { margin: 0, color: c.ink })}>{head}</h3>
          {action}
        </div>
        {sub ? <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0", maxWidth: "66ch" })}>{sub}</p> : null}
        <div style={{ marginTop: 12 }}>{children}</div>
      </section>
    );
  }

  /* a line under a table saying where what it describes is maintained.
     Not an explanation of a control -- the route to it. */
  function FootLine({ text, link, onLink }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap" }}>
        <p style={ty("caption", { color: c.inkMuted, margin: 0, maxWidth: "58ch" })}>{text}</p>
        {link ? <LinkButton onClick={onLink}>{link}</LinkButton> : null}
      </div>
    );
  }

  /* ONE AFFORDANCE FOR "there is more under this". Three one-off
     Show/Hide text links had grown across this product and no two
     looked alike. The whole row is the target, the mark turns, and
     what it governs is named beside it.

     The portal a panel renders into sits outside `.nv3`, so the
     stylesheet's reduced-motion rule does not reach it: ask the
     media query directly rather than animate over somebody's
     accessibility setting. */
  function Chevron({ open }) {
    const { c } = useTheme();
    const still = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return (
      <span aria-hidden="true" style={{
        display: "flex", color: c.inkFaint, flex: "0 0 auto",
        transform: open ? "rotate(180deg)" : "none",
        transition: still ? "none" : "transform 160ms cubic-bezier(.2,.7,.3,1)",
      }}>
        <Icon name="chevron" size={16} />
      </span>
    );
  }

  /* THE LADDER. Five rows say the whole of a salary: what it comes
     to, what comes off it, what reaches the bank, what the school
     adds, what it costs. The twelve component lines that make those
     five are under the row they add up to, and stay shut until
     somebody asks -- a reader who wants the net should not have to
     read the academic allowance to find it. */
  function LadderRow({ sign, label, note, meta, value, strong, band, open, onToggle, panelId }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const [hot, setHot] = useState(false);
    const style = {
      display: "flex", alignItems: "center", gap: 12, width: "100%",
      padding: band ? "13px 14px" : "11px 14px", borderRadius: G3.r.sm,
      border: "none", font: "inherit", color: "inherit", textAlign: "left",
      background: band ? c.sunken : hot ? c.alt : "transparent",
      cursor: onToggle ? "pointer" : "default",
    };
    const body = (
      <React.Fragment>
        <span aria-hidden="true" style={G3.fig("md", {
          color: band ? c.ink : c.inkFaint, width: 13, flex: "0 0 13px", fontWeight: band ? 700 : 500,
        })}>{sign || ""}</span>
        <span style={{ minWidth: 0, flex: "1 1 auto" }}>
          <span style={ty("small", { margin: 0, color: c.ink, fontWeight: strong ? 700 : 600, display: "block" })}>{label}</span>
          {note ? <span style={ty("caption", { color: c.inkMuted, display: "block", marginTop: 1 })}>{note}</span> : null}
        </span>
        {meta ? <span style={ty("caption", { color: c.inkFaint, whiteSpace: "nowrap" })}>{meta}</span> : null}
        <span style={G3.fig("md", {
          color: c.ink, fontWeight: strong ? 700 : 600, whiteSpace: "nowrap", textAlign: "right",
        })}>{value}</span>
        {onToggle ? <Chevron open={open} /> : <span aria-hidden="true" style={{ width: 14, flex: "0 0 14px" }} />}
      </React.Fragment>
    );
    if (!onToggle) return <div style={style}>{body}</div>;
    return (
      <button
        type="button" onClick={onToggle}
        aria-expanded={open ? "true" : "false"} aria-controls={panelId}
        onMouseEnter={function () { setHot(true); }} onMouseLeave={function () { setHot(false); }}
        style={style}
      >{body}</button>
    );
  }

  /* what one ladder row is made of. No column headings: three of them
     repeated over three bands is nine labels for nine facts that say
     themselves, and the caption names the band for a screen reader. */
  function Lines({ id, label, rows }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div id={id} role="region" aria-label={label} style={{
        /* the lines sit UNDER the row they add up to: indented to its
           label, and their amounts in the same column as its amount
           (the row keeps 28px on the right for the caret) */
        background: c.alt, borderRadius: G3.r.sm, padding: "6px 42px 10px 39px", margin: "0 0 4px",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <caption style={{
            position: "absolute", width: 1, height: 1, overflow: "hidden",
            clip: "rect(0 0 0 0)", whiteSpace: "nowrap",
          }}>{label}</caption>
          <colgroup>
            <col style={{ width: "36%" }} /><col /><col style={{ width: 132 }} />
          </colgroup>
          <tbody>
            {rows.map(function (r) {
              return (
                <tr key={r.k} style={{ borderTop: "1px solid " + c.rule }}>
                  <th scope="row" style={ty("small", {
                    textAlign: "left", fontWeight: 500, color: r.dim ? c.inkMuted : c.ink,
                    padding: "7px 12px 7px 0",
                  })}>
                    {r.label}
                    <span style={G3.fig("micro", { color: c.inkFaint, marginInlineStart: 7 })}>{r.code}</span>
                  </th>
                  <td style={ty("caption", { color: c.inkMuted, padding: "8px 12px 8px 0" })}>{r.how}</td>
                  <td style={G3.fig("md", {
                    color: r.dim ? c.inkMuted : c.ink, fontWeight: 500,
                    textAlign: "right", whiteSpace: "nowrap", padding: "8px 0",
                  })}>{r.value}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  /* a section that opens, for the two things a pay record holds that
     are not this month's arithmetic */
  function Fold({ id, open, onToggle, head, meta, children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const [hot, setHot] = useState(false);
    return (
      <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface }}>
        <button
          type="button" onClick={onToggle}
          aria-expanded={open ? "true" : "false"} aria-controls={id}
          onMouseEnter={function () { setHot(true); }} onMouseLeave={function () { setHot(false); }}
          style={{
            display: "flex", alignItems: "center", gap: 14, width: "100%",
            padding: "15px 18px", borderRadius: G3.r.md, border: "none",
            background: hot && !open ? c.alt : "transparent",
            font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer",
          }}
        >
          <h3 style={ty("h3", { margin: 0, color: c.ink, flex: "1 1 auto" })}>{head}</h3>
          {meta ? <span style={ty("caption", { color: c.inkMuted })}>{meta}</span> : null}
          <Chevron open={open} />
        </button>
        {open ? (
          <div id={id} role="region" aria-label={head} style={{ padding: "0 18px 18px" }}>{children}</div>
        ) : null}
      </section>
    );
  }

  /* EVERY REVISION, including the two that are not history yet: one
     with the checker and one sent back. The record is where a payroll
     officer reads both; the proposals tab is where she acts on them. */
  function Revisions({ rows }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!rows.length) return null;
    const head = function (align) {
      return ty("colLabel", { color: c.inkFaint, textAlign: align, textTransform: "uppercase", padding: "0 0 8px" });
    };
    return (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
            <th scope="col" style={head("left")}>{t("pyp.col.period")}</th>
            <th scope="col" style={head("left")}>{t("pyp.col.reason")}</th>
            <th scope="col" style={head("right")}>{t("pyp.col.gross")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(function (r) {
            const row = r.row;
            return (
              <tr key={r.k} style={{ borderTop: "1px solid " + c.rule }}>
                <td style={{ padding: "9px 12px 9px 0", verticalAlign: "top" }}>
                  <div style={ty("small", { color: r.dim ? c.inkMuted : c.ink, fontWeight: 600 })}>{fmtD(row.from)}</div>
                  <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>
                    {row.to ? t("pyp.rec.to", { d: fmtD(row.to) }) : t("pyp.rec.onwards")}
                  </div>
                </td>
                <td style={{ padding: "9px 12px 9px 0", verticalAlign: "top" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={ty("small", { color: r.dim ? c.inkMuted : c.ink })}>{t("pyp.r." + row.reason)}</span>
                    {row.current ? <Chip bg={c.sunken} fg={c.inkMuted}>{t("pyp.rec.current")}</Chip> : null}
                  </div>
                  {r.note ? <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>{r.note}</div> : null}
                </td>
                <td style={G3.fig("sm", {
                  color: r.dim ? c.inkMuted : c.ink, fontWeight: 600,
                  textAlign: "right", whiteSpace: "nowrap", padding: "9px 0", verticalAlign: "top",
                })}>{inr(row.gross)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  function Fact({ label, children, note, tone }) {
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

  function Masked({ label, masked, full, changedBy, changedOn, note }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [shown, setShown] = useState(false);
    const canReveal = !!full;
    return (
      <div style={{ minWidth: 0, borderTop: "1px solid " + c.rule, padding: "9px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", flex: "1 1 120px" })}>{label}</div>
          <div style={ty("small", { color: c.ink, fontWeight: 600, fontFamily: G3.font.mono, fontVariantNumeric: "tabular-nums" })}>
            {shown && canReveal ? full : masked}
          </div>
          {canReveal ? (
            <LinkButton onClick={() => setShown(!shown)}>{shown ? t("pyp.rec.hide") : t("pyp.rec.reveal")}</LinkButton>
          ) : null}
        </div>
        {shown && canReveal ? (
          <div role="status" style={ty("caption", { color: c.inkMuted, marginTop: 3 })}>{t("pyp.rec.revealed")}</div>
        ) : null}
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 3 })}>{note}</div> : null}
        {changedBy ? (
          <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>
            {t("pyp.rec.changedBy", { who: t(changedBy), when: changedOn })}
          </div>
        ) : null}
      </div>
    );
  }

  /* a control that is NOT drawn, and says why -- the absent-vs-disabled
     rule this product keeps re-arguing */
  function Absent({ head, body, action }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{
        border: "1px dashed " + c.rule, borderRadius: G3.r.md, padding: "13px 15px", background: c.sunken,
      }}>
        <div style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
          <Icon name="lock" size={14} color={c.inkFaint} />
          <div style={{ minWidth: 0 }}>
            <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{head}</div>
            <p style={ty("caption", { color: c.inkMuted, margin: "3px 0 0", maxWidth: "66ch" })}>{body}</p>
            {action ? <div style={{ marginTop: 7 }}>{action}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  function Shell({ role, onNavigate, active, title, q, chips, tabs, campus, onCampus, children }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "payrollOfficer"} active={active} onNavigate={onNavigate} initials="SK" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("pyp.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
                <span>{t("pyp.entity")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
                <span>{campusLabel(t, campus)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {onCampus ? <CampusSwitch value={campus} onChange={onCampus} /> : null}
                <ThemeToggle />
              </div>
            </div>
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

  /* ============================================================
     THE HANDOFF, AT THE TOP OF PAYROLL'S REGISTER.

     People HR has created and nobody has priced are not just "rows
     with a blank figure" -- they are work sent to this desk by a
     named person on a known date, and the run will block on them.
     So they lead the module as their own card, above the band,
     rather than sorting to the top of a list where they would read
     as a data-quality problem.
     ============================================================ */
  function PendingFromHR({ rows, onAssign, onOpen }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!rows.length) return null;
    return (
      <div style={{
        border: "1px solid " + (c.brassBorder || c.rule), borderRadius: G3.r.md,
        background: c.brassSoft || c.sunken, padding: "16px 18px", marginBottom: G3.layout.gap,
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
          <Icon name="alert" size={15} color={c.brass || c.ink} />
          <h2 style={ty("h3", { margin: 0, color: c.ink })}>
            {rows.length === 1 ? t("pyp.hand.title1") : t("pyp.hand.title", { n: num(rows.length) })}
          </h2>
        </div>
        <p style={ty("caption", { color: c.inkMuted, margin: "5px 0 0", maxWidth: "78ch" })}>{t("pyp.hand.sub")}</p>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(function (r) {
            const last = r.reminders.length ? r.reminders[r.reminders.length - 1] : null;
            return (
              <div key={r.id} style={{
                display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
                background: c.surface, border: "1px solid " + c.rule, borderRadius: G3.r.sm, padding: "12px 14px",
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 220, flex: "1 1 240px" }}>
                  <Avatar name={t(r.nameKey)} size={30} />
                  <div style={{ minWidth: 0 }}>
                    <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(r.nameKey)}</div>
                    <div style={ty("caption", { color: c.inkFaint })}>
                      <span style={{ fontFamily: G3.font.mono }}>{r.id}</span>
                      {r.desigKey ? " · " + t(r.desigKey) : ""}
                    </div>
                  </div>
                </div>
                <div style={{ flex: "1 1 240px", minWidth: 200 }}>
                  <div style={ty("caption", { color: c.inkMuted })}>
                    {t("pyp.hand.sentBy", { who: t(r.createdByKey), on: fmtD(r.createdOn) })}
                  </div>
                  <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>
                    {t("pyp.hand.joins", { d: fmtD(r.doj) })}
                  </div>
                  {last ? (
                    <div style={ty("caption", { color: c.brass || c.inkMuted, marginTop: 3, fontWeight: 600 })}>
                      {r.reminders.length === 1
                        ? t("pyp.hand.reminded1", { on: fmtD(last.on) })
                        : t("pyp.hand.reminded", { n: num(r.reminders.length), on: fmtD(last.on) })}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
                  <LinkButton onClick={function () { onOpen(r.id); }}>{t("pyp.col.act.open")}</LinkButton>
                  <Button size="sm" iconLeft="arrow" onClick={function () { onAssign(r.id); }}>{t("pyp.hand.chase")}</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ============================================================
     THE BREAKDOWN EDITOR. Shared by "Assign a salary" (PY-05) and
     "Set the new figures" (PY-06), because they are the same act on
     two occasions: turn an agreed total into named components.

     HOW IT BEHAVES. The structure derives every line -- basic from
     the grade, DA and HRA as percentages of it, allowances flat --
     and the LAST component absorbs the balance, so the lines always
     sum to the gross. The officer may override any derived line; the
     balance takes the difference, and the 50% verdict re-decides
     live. That is the real move: redistributing within a total to
     keep the wage base lawful, which is exactly what "change the HRA
     detail to detail" means in practice.

     An overridden line says what it was derived as, so nothing is
     quietly different from what the structure would have produced.
     ============================================================ */
  function priceWith(struct, basic, gross, ov) {
    if (!struct || !(gross > 0)) return null;
    const lines = D.priceComponents(struct, basic, gross).map(function (l) {
      const o = ov ? ov[l.code] : null;
      const isBal = l.cp.calc === "balance";
      return {
        code: l.code, cp: l.cp, derived: l.v,
        v: (!isBal && o != null && o !== "" && !isNaN(Number(o))) ? Number(o) : l.v,
        over: !isBal && o != null && o !== "" && !isNaN(Number(o)) && Number(o) !== l.v,
      };
    });
    const bal = lines.filter(function (l) { return l.cp.calc === "balance"; })[0];
    if (bal) {
      const others = lines.reduce(function (s, l) { return l === bal ? s : s + l.v; }, 0);
      bal.v = D.r2(gross - others);
    }
    return lines;
  }

  function howOfCp(t, cp) {
    if (cp.calc === "grade") return t("pyp.rec.how.grade");
    if (cp.calc === "flat") return t("pyp.rec.how.flat");
    if (cp.calc === "pct") return t("pyp.rec.how.pct", { pct: num(cp.pct), of: cp.of });
    return t("pyp.rec.how.balance");
  }

  function BreakdownEditor({ struct, basic, gross, ov, setOv }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const lines = priceWith(struct, basic, gross, ov);
    if (!lines) {
      return <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("pyp.as.previewEmpty")}</p>;
    }
    const verdict = D.wageVerdict(lines);
    const touched = Object.keys(ov || {}).filter(function (k) { return ov[k] !== "" && ov[k] != null; });

    return (
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("pyp.be.head")}</div>
          {touched.length ? (
            <LinkButton onClick={function () { setOv({}); }}>{t("pyp.be.resetAll")}</LinkButton>
          ) : null}
        </div>

        {lines.map(function (l) {
          const isBal = l.cp.calc === "balance";
          return (
            <div
              key={l.code}
              style={{
                display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
                padding: "8px 0", borderTop: "1px solid " + c.rule,
              }}
            >
              <div style={{ flex: "1 1 170px", minWidth: 140 }}>
                <div style={ty("small", { color: c.ink, fontWeight: 600 })}>{l.code}</div>
                <div style={ty("caption", { color: c.inkFaint })}>
                  {isBal ? t("pyp.be.balanceNote") : howOfCp(t, l.cp)}
                  {l.cp.pf ? <span style={{ marginInlineStart: 6 }}>{t("pyp.be.inWages")}</span> : null}
                </div>
              </div>
              <div style={{ flex: "0 0 150px", minWidth: 130 }}>
                {isBal ? (
                  <div style={G3.fig("sm", { color: c.ink, fontWeight: 700, textAlign: "right" })}>{inr(l.v)}</div>
                ) : (
                  <Input
                    id={"pybe-" + l.code}
                    ariaLabel={l.code}
                    value={ov && ov[l.code] != null && ov[l.code] !== "" ? String(ov[l.code]) : String(l.derived)}
                    onChange={function (v) { setOv(Object.assign({}, ov, { [l.code]: v })); }}
                    inputMode="decimal"
                  />
                )}
              </div>
              <div style={{ flex: "0 0 150px", minWidth: 120, textAlign: "end" }}>
                {l.over ? (
                  <span style={ty("caption", { color: c.brass || c.inkMuted, fontWeight: 600 })}>
                    {t("pyp.be.overFrom", { was: inr(l.derived) })}
                  </span>
                ) : isBal ? (
                  <span style={ty("caption", { color: c.inkFaint })}>{t("pyp.be.absorbs")}</span>
                ) : null}
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 10, marginTop: 2, borderTop: "2px solid " + (c.ruleStrong || c.rule) }}>
          <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("pyp.rec.gross")}</span>
          <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{inr(verdict.gross)}</span>
        </div>

        <div style={{ marginTop: 14 }}>
          <StatusMark
            role={verdict.state === "over" ? "danger" : verdict.state === "at" ? "late" : "ok"}
            glyph={verdict.state === "over" ? "alert" : verdict.state === "at" ? "clock" : "check"}
            word={verdict.state === "over" ? t("pyp.as.ceilOver") : verdict.state === "at" ? t("pyp.m.atLimit") : t("pyp.as.ceilOk")}
          />
          <p style={ty("caption", { color: c.inkMuted, margin: "7px 0 0", maxWidth: "70ch" })}>
            {verdict.state === "over"
              ? t("pyp.rec.ceilingOver", { excl: inr(verdict.excluded), gross: inr(verdict.gross), pct: verdict.share.toFixed(2) + "%", over: inr(verdict.over) })
              : verdict.state === "at"
                ? t("pyp.rec.ceilingAt", { excl: inr(verdict.excluded), gross: inr(verdict.gross), pct: verdict.share.toFixed(2) + "%" })
                : t("pyp.rec.ceilingUnder", { excl: inr(verdict.excluded), gross: inr(verdict.gross), pct: verdict.share.toFixed(2) + "%" })}
          </p>
          <p style={ty("caption", { color: c.inkFaint, margin: "4px 0 0" })}>
            {t("pyp.be.wages", { wages: inr(verdict.wages) })}
          </p>
          {verdict.state === "over" ? (
            <p style={ty("caption", { color: c.dangerText || c.ink, margin: "6px 0 0", fontWeight: 600, maxWidth: "70ch" })}>{t("pyp.as.refuse")}</p>
          ) : null}
        </div>
      </div>
    );
  }

  /* the structures a given pay group may be priced by */
  function structuresFor(group) {
    return D.STRUCTURES.filter(function (s) { return s.group === group && s.state === "inUse"; });
  }
  /* pay groups that run CTC logic -- honorarium groups are paid by
     units against a rate and have no structure to price (PY-04) */
  function ctcGroups() {
    return D.PAY_GROUPS.filter(function (g) { return g.kind !== "honorarium" && g.structure; });
  }

  /* ============================================================
     ASSIGN A SALARY (PY-05, the action). The whole process: who this
     is and who sent them, WHAT TYPE OF STAFF they are -- which picks
     the pay group and therefore the structure that prices them, from
     Pay rules -- the total, the breakdown that total resolves into
     line by line with every line editable, the Labour Code verdict
     that can REFUSE the save, the date, and a plain statement that
     saving opens the maker-checker gate and puts the figure on HR's
     record.
     ============================================================ */
  function AssignFlow({ person, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const groups = ctcGroups();
    const [groupKey, setGroupKey] = useState(person.group || (groups.length ? groups[0].key : ""));
    const avail = structuresFor(groupKey);
    const [structKey, setStructKey] = useState(avail.length ? avail[0].key : "");
    /* revising opens on what they are on today -- an empty form for
       somebody who already has a salary makes the officer re-key
       figures the product already holds. A first assignment opens
       empty, because there is nothing to open on. */
    const [gross, setGross] = useState(person.gross != null ? String(person.gross) : "");
    const [basic, setBasic] = useState(person.basic != null ? String(person.basic) : "");
    const [ov, setOv] = useState({});
    const [fromKey, setFromKey] = useState(person.doj ? "doj" : "next");
    const [err, setErr] = useState(null);

    /* changing the staff type changes what may price them, so the
       structure follows rather than going stale on the old group */
    function pickGroup(k) {
      setGroupKey(k);
      const next = structuresFor(k);
      setStructKey(next.length ? next[0].key : "");
      setOv({});
    }

    const struct = D.structByKey(structKey);
    const grp = D.groupByKey(groupKey);
    const gN = Number(String(gross).replace(/[, ]/g, ""));
    const bN = Number(String(basic).replace(/[, ]/g, ""));
    const ready = !!struct && gN > 0 && bN > 0 && bN <= gN;
    const lines = ready ? priceWith(struct, bN, gN, ov) : null;
    const verdict = lines ? D.wageVerdict(lines) : null;
    const blocked = !!verdict && verdict.state === "over";
    const effFrom = (fromKey === "doj" && person.doj) ? person.doj : { d: 1, m: 11, y: 2026 };

    function submit() {
      if (!ready) { setErr(t("pyp.as.errFields")); return; }
      if (blocked) { setErr(t("pyp.as.errCeiling", { over: inr(verdict.over) })); return; }
      const H = window.NaveyaPayHandoff;
      if (H) {
        H.assign(person.id, {
          structureKey: structKey, group: groupKey, gross: gN, basic: bN,
          lines: lines.map(function (l) { return { code: l.code, v: l.v, over: l.over }; }),
          effectiveFrom: effFrom,
        });
      }
      onDone(t("pyp.as.done", { name: t(person.nameKey), gross: inr(gN), checker: t(D.CHECKER.nameKey) }));
    }

    return (
      <SideScreen
        title={t("pyp.as.title")}
        sub={t("pyp.as.sub", { name: t(person.nameKey) })}
        onClose={onClose}
        width={760}
        footer={
          <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <p style={ty("caption", { color: c.inkMuted, margin: 0, maxWidth: "46ch" })}>
              {t("pyp.as.consequence", { checker: t(D.CHECKER.nameKey) })}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Button kind="quiet" onClick={onClose}>{t("pyp.as.cancel")}</Button>
              <Button onClick={submit} disabled={!ready || blocked}>{t("pyp.as.go")}</Button>
            </div>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <section>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 })}>{t("pyp.as.s1")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
              <Fact label={t("pyp.rec.code")}>{person.id}</Fact>
              {person.doj ? <Fact label={t("pyp.as.doj")}>{fmtD(person.doj)}</Fact> : null}
              {person.createdByKey
                ? <Fact label={t("pyp.as.sentBy")} note={fmtD(person.createdOn)}>{t(person.createdByKey)}</Fact>
                : <Fact label={t("pyp.col.gross")}>{person.gross == null ? "—" : inr(person.gross)}</Fact>}
            </div>
          </section>

          <section style={{ borderTop: "1px solid " + c.rule, paddingTop: 16 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 })}>{t("pyp.as.s2")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
              <Field id="pyas-group" label={t("pyp.as.staffType")} hint={t("pyp.as.staffTypeHint")}>
                <Select
                  id="pyas-group" value={groupKey} onChange={pickGroup} ariaLabel={t("pyp.as.staffType")}
                  options={groups.map(function (g) { return { value: g.key, label: t(g.nameKey) }; })}
                />
              </Field>
              <Field id="pyas-struct" label={t("pyp.col.structure")} hint={t("pyp.as.structHint")}>
                <Select
                  id="pyas-struct" value={structKey} onChange={function (v) { setStructKey(v); setOv({}); }}
                  ariaLabel={t("pyp.col.structure")}
                  options={avail.map(function (s) { return { value: s.key, label: t(s.nameKey) }; })}
                />
              </Field>
              <Field id="pyas-gross" label={t("pyp.as.gross")} hint={t("pyp.as.grossHint")}>
                <Input id="pyas-gross" value={gross} onChange={setGross} placeholder="0.00" inputMode="decimal" />
              </Field>
              <Field id="pyas-basic" label={t("pyp.as.basic")} hint={t("pyp.as.basicHint")}>
                <Input id="pyas-basic" value={basic} onChange={setBasic} placeholder="0.00" inputMode="decimal" />
              </Field>
              <Field id="pyas-from" label={t("pyp.col.from")}>
                <Select
                  id="pyas-from" value={fromKey} onChange={setFromKey} ariaLabel={t("pyp.col.from")}
                  options={[
                    { value: "next", label: t("pyp.as.fromNext") },
                  ].concat(person.doj ? [{ value: "doj", label: t("pyp.as.fromDoj", { d: fmtD(person.doj) }) }] : [])}
                />
              </Field>
            </div>
            {grp ? (
              <p style={ty("caption", { color: c.inkMuted, margin: "10px 0 0", maxWidth: "72ch" })}>
                {t("pyp.as.fromRules", { group: t(grp.nameKey), n: num(avail.length) })}
              </p>
            ) : null}
          </section>

          <section style={{ borderTop: "1px solid " + c.rule, paddingTop: 16 }}>
            <BreakdownEditor struct={struct} basic={bN} gross={gN} ov={ov} setOv={setOv} />
          </section>

          {err ? <div role="alert" style={ty("small", { color: c.dangerText || c.ink, fontWeight: 600 })}>{err}</div> : null}
        </div>
      </SideScreen>
    );
  }

  /* ============================================================
     PY-06 -- SET THE NEW FIGURES. The other half of the appraisal
     handoff: HR agreed a percentage, and this turns it into
     components. It opens on the arithmetic -- current, the rise, and
     what that comes to -- and the officer is free to land elsewhere,
     because a percentage is a judgement and the figures are theirs.
     ============================================================ */
  function SettleFlow({ prop, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const H = window.NaveyaPayHandoff;
    const target = H ? H.targetGross(prop) : prop.currentGross;
    const person = D.staffById(prop.staffId);
    const avail = structuresFor(prop.group);
    const [structKey, setStructKey] = useState(
      (person && D.structureFor(person) && D.structureFor(person).key) || (avail.length ? avail[0].key : "")
    );
    const [gross, setGross] = useState(String(target));
    const [basic, setBasic] = useState(person && person.basic != null ? String(person.basic) : "");
    const [ov, setOv] = useState({});
    const [err, setErr] = useState(null);

    const struct = D.structByKey(structKey);
    const gN = Number(String(gross).replace(/[, ]/g, ""));
    const bN = Number(String(basic).replace(/[, ]/g, ""));
    const ready = !!struct && gN > 0 && bN > 0 && bN <= gN;
    const lines = ready ? priceWith(struct, bN, gN, ov) : null;
    const verdict = lines ? D.wageVerdict(lines) : null;
    const blocked = !!verdict && verdict.state === "over";
    const landed = gN - prop.currentGross;
    const landedPct = prop.currentGross ? (landed / prop.currentGross) * 100 : 0;

    function submit() {
      if (!ready) { setErr(t("pyp.as.errFields")); return; }
      if (blocked) { setErr(t("pyp.as.errCeiling", { over: inr(verdict.over) })); return; }
      if (H) {
        H.settleProposal(prop.id, {
          gross: gN, basic: bN, structureKey: structKey,
          lines: lines.map(function (l) { return { code: l.code, v: l.v, over: l.over }; }),
          effectiveFrom: { d: 1, m: 11, y: 2026 },
        });
      }
      onDone(t("pyp.pr.done", { name: t(prop.nameKey), gross: inr(gN) }));
    }

    return (
      <SideScreen
        title={t("pyp.pr.panel.title")}
        sub={t("pyp.pr.panel.sub", { name: t(prop.nameKey) })}
        onClose={onClose}
        width={760}
        footer={
          <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <p style={ty("caption", { color: c.inkMuted, margin: 0, maxWidth: "46ch" })}>
              {t("pyp.pr.panel.consequence", { checker: t(D.CHECKER.nameKey) })}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Button kind="quiet" onClick={onClose}>{t("pyp.as.cancel")}</Button>
              <Button onClick={submit} disabled={!ready || blocked}>{t("pyp.pr.panel.go")}</Button>
            </div>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* the arithmetic HR handed over, stated before anything is editable */}
          <section style={{ background: c.sunken, borderRadius: G3.r.md, padding: "14px 16px" }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("pyp.pr.panel.agreed")}</div>
            <div style={{ display: "flex", gap: 18, alignItems: "baseline", flexWrap: "wrap", marginTop: 8 }}>
              <span style={G3.fig("sm", { color: c.inkMuted })}>{inr(prop.currentGross)}</span>
              <span style={ty("small", { color: c.brass || c.ink, fontWeight: 700 })}>{t("pyp.pr.plusPct", { pct: num(prop.pct) })}</span>
              <span aria-hidden="true" style={{ color: c.inkFaint }}>&rarr;</span>
              <span style={G3.fig("md", { color: c.ink, fontWeight: 700 })}>{inr(target)}</span>
            </div>
            <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0", maxWidth: "70ch" })}>
              {t("pyp.pr.panel.agreedWhy", { who: t(prop.byKey), appr: prop.apprId, on: fmtD(prop.on) })}
            </p>
          </section>

          <section>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <Field id="pyset-struct" label={t("pyp.col.structure")}>
                <Select
                  id="pyset-struct" value={structKey} onChange={function (v) { setStructKey(v); setOv({}); }}
                  ariaLabel={t("pyp.col.structure")}
                  options={avail.map(function (s) { return { value: s.key, label: t(s.nameKey) }; })}
                />
              </Field>
              <Field id="pyset-gross" label={t("pyp.as.gross")} hint={t("pyp.pr.panel.grossHint")}>
                <Input id="pyset-gross" value={gross} onChange={setGross} inputMode="decimal" />
              </Field>
              <Field id="pyset-basic" label={t("pyp.as.basic")} hint={t("pyp.as.basicHint")}>
                <Input id="pyset-basic" value={basic} onChange={setBasic} inputMode="decimal" />
              </Field>
            </div>
            {gN > 0 && Math.abs(gN - target) > 0.5 ? (
              <p style={ty("caption", { color: c.brass || c.inkMuted, margin: "10px 0 0", fontWeight: 600 })}>
                {t("pyp.pr.panel.off", { pct: landedPct.toFixed(2) + "%", agreed: num(prop.pct) + "%" })}
              </p>
            ) : null}
          </section>

          <section style={{ borderTop: "1px solid " + c.rule, paddingTop: 16 }}>
            <BreakdownEditor struct={struct} basic={bN} gross={gN} ov={ov} setOv={setOv} />
          </section>

          {err ? <div role="alert" style={ty("small", { color: c.dangerText || c.ink, fontWeight: 600 })}>{err}</div> : null}
        </div>
      </SideScreen>
    );
  }

  /* ============================================================
     PY-06 -- PROPOSED REVISIONS.

     First it was a nine-column workbench with bulk accept and four
     modes. Then it over-corrected into a row of cards that carried
     four facts and no totals, and the designer read it as thin and
     unanchored -- "very less data, and the table is without bg
     colour, use proper table UI component".

     So: the kit's Register, which is the table every other module
     uses and which brings its own card, header and totals row with
     it. The columns are the ones the inventory actually asks for --
     employee, the appraisal behind it, who agreed it, current,
     the percentage, what it becomes, the monthly delta, when it
     takes effect, where it has got to -- and the TOTAL COST IMPACT
     is a real totals row rather than a sentence, because PY-06's
     "must contain" names it and because the officer's first question
     about a queue of rises is what the lot of them come to.
     ============================================================ */
  /* THE RECORDED EXPORT. Two controls offered to take one person's pay
     record out of the product and did nothing. An export of this is a
     recorded act, so it names what leaves, whose name it is recorded
     against, and that the record of it is permanent. */
  function ExportGate({ person, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [made, setMade] = useState(false);
    const who = UI.profileFor("payrollOfficer").name;
    const name = t(person.nameKey);
    if (made) {
      return (
        <Modal
          icon="check" iconTone="present" title={t("pyp.exp.doneHead")} onClose={onClose}
          footer={<Button kind="primary" size="sm" onClick={onClose}>{t("pyp.exp.ok")}</Button>}
        >
          <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
            {t("pyp.exp.doneBody", { name: name, who: who })}
          </p>
        </Modal>
      );
    }
    return (
      <Modal
        icon="download" title={t("pyp.exp.title", { name: name })} sub={t("pyp.exp.sub")}
        onClose={onClose} width={560}
        footer={
          <React.Fragment>
            <Button kind="primary" size="sm" iconLeft="download" onClick={function () { setMade(true); }}>
              {t("pyp.exp.go")}
            </Button>
            <Button kind="secondary" size="sm" onClick={onClose}>{t("pyp.exp.cancel")}</Button>
          </React.Fragment>
        }
      >
        <div style={{ border: "1px solid " + c.rule, borderRadius: G3.r.sm, padding: "12px 14px" }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
            {t("pyp.exp.what")}
          </div>
          <ul style={{ margin: "8px 0 0", paddingInlineStart: 18 }}>
            {["pyp.exp.l1", "pyp.exp.l2", "pyp.exp.l3"].map(function (k) {
              return <li key={k} style={ty("small", { color: c.ink, marginTop: 3 })}>{t(k)}</li>;
            })}
          </ul>
          <p style={ty("caption", { color: c.inkMuted, margin: "10px 0 0" })}>{t("pyp.exp.not")}</p>
        </div>
        <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0" })}>
          {t("pyp.exp.recorded", { who: who })}
        </p>
      </Modal>
    );
  }

  function ProposedRevisions({ onOpen }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const H = window.NaveyaPayHandoff;
    const handoff = H && H.useHandoff ? H.useHandoff() : null;
    const [settling, setSettling] = useState(null);
    const [declining, setDeclining] = useState(null);
    const [done, setDone] = useState(null);

    if (!handoff) return <Card><EmptyState head={t("pyp.pr.empty")} /></Card>;
    const all = handoff.proposals();
    const open = all.filter(function (p) { return p.state === "pending"; });

    function target(p) { return handoff.targetGross(p); }
    function delta(p) {
      return p.state === "settled" ? D.r2(p.settled.gross - p.currentGross) : D.r2(target(p) - p.currentGross);
    }
    const openDelta = open.reduce(function (s, p) { return s + delta(p); }, 0);
    const openTarget = open.reduce(function (s, p) { return s + target(p); }, 0);

    function stateCell(p) {
      if (p.state === "pending") return <StatusMark role="late" glyph="clock" word={t("pyp.pr.st.waiting")} />;
      if (p.state === "settled") return <StatusMark role="present" glyph="check" word={t("pyp.pr.st.settled")} />;
      return <StatusMark role="off" glyph="signout" word={t("pyp.pr.st.declined")} />;
    }

    const columns = [
      { key: "who", label: t("pyp.col.staff") },
      { key: "appr", label: t("pyp.pr.col.appr"), width: 108 },
      { key: "by", label: t("pyp.pr.col.by"), width: 180 },
      { key: "cur", label: t("pyp.pr.col.current"), align: "end", mono: true, width: 120 },
      { key: "pct", label: t("pyp.pr.col.rise"), align: "end", mono: true, width: 78 },
      { key: "new", label: t("pyp.pr.col.becomes"), align: "end", mono: true, width: 130, weight: 700 },
      { key: "delta", label: t("pyp.pr.col.delta"), align: "end", mono: true, width: 120 },
      { key: "from", label: t("pyp.col.from"), width: 120 },
      { key: "state", label: t("pyp.col.state"), width: 150 },
      { key: "act", label: t("pyp.col.act"), align: "end", width: 60 },
    ];

    const rows = all.map(function (p) {
      const settled = p.state === "settled";
      const shown = settled ? p.settled.gross : target(p);
      const items = [];
      if (p.state === "pending") {
        items.push({ key: "set", icon: "payslip", label: t("pyp.pr.act.set"), onSelect: function () { setSettling(p.id); } });
        items.push({ key: "dec", icon: "signout", label: t("pyp.pr.act.decline"), onSelect: function () { setDeclining(p.id); } });
      } else if (settled) {
        items.push({
          key: "open", icon: "payslip", label: t("pyp.col.act.open"),
          onSelect: function () { onOpen && onOpen(p.staffId); },
        });
      } else {
        items.push({
          key: "set", icon: "payslip", label: t("pyp.pr.act.set"), disabled: true,
          reason: t("pyp.pr.act.declinedWhy"),
        });
      }
      return {
        id: p.id,
        tone: p.state === "declined" ? "dim" : undefined,
        cells: {
          who: (
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <Avatar name={t(p.nameKey)} size={26} />
              <div style={{ minWidth: 0 }}>
                <div style={ty("small", { color: c.ink, fontWeight: 600 })}>{t(p.nameKey)}</div>
                <div style={ty("caption", { color: c.inkFaint })}>{t(p.desigKey)}</div>
              </div>
            </div>
          ),
          appr: <span style={G3.fig("xs", { color: c.inkMuted })}>{p.apprId}</span>,
          by: (
            <div style={{ minWidth: 0 }}>
              <div style={ty("caption", { color: c.ink })}>{t(p.byKey)}</div>
              <div style={ty("caption", { color: c.inkFaint })}>{fmtD(p.on)}</div>
            </div>
          ),
          cur: inr(p.currentGross),
          pct: <span style={{ color: c.brass || c.ink, fontWeight: 700 }}>{"+" + p.pct + "%"}</span>,
          new: inr(shown),
          delta: <span style={{ color: c.ink }}>{"+" + inr(delta(p))}</span>,
          from: settled ? fmtD(p.settled.effectiveFrom) : t("pyp.pr.col.onSet"),
          state: stateCell(p),
          act: (
            <span style={{ display: "flex", justifyContent: "flex-end" }} onClick={function (e) { e.stopPropagation(); }}>
              <ActionMenu ariaLabel={t("pyp.col.act.aria", { name: t(p.nameKey) })} size={30} items={items} />
            </span>
          ),
        },
      };
    });

    return (
      <div>
        {done ? (
          <div role="status" style={{ marginBottom: G3.layout.gap }}>
            <Card><StatusMark role="present" glyph="check" word={done} /></Card>
          </div>
        ) : null}

        {/* the three measurements an officer wants before opening a
            single row: how many are waiting, what they come to, and
            what they add to the monthly bill */}
        <section
          aria-label={t("pyp.pr.band")}
          style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface, marginBottom: G3.layout.gap, overflow: "hidden" }}
        >
          <header style={{ padding: "15px 20px 0" }}>
            <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("pyp.pr.band")}</h2>
            <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0", maxWidth: "78ch" })}>{t("pyp.pr.q")}</p>
          </header>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", padding: "16px 0", marginTop: 10, borderTop: "1px solid " + c.rule }}>
            {[
              { k: "n", label: t("pyp.pr.m.waiting"), value: num(open.length) },
              { k: "to", label: t("pyp.pr.m.becomes"), value: inr(openTarget) },
              { k: "d", label: t("pyp.pr.m.impact"), value: "+" + inr(openDelta), note: t("pyp.pr.m.impactNote") },
              { k: "y", label: t("pyp.pr.m.year"), value: "+" + inr(openDelta * 12) },
            ].map(function (m, i) {
              return (
                <div key={m.k} style={{ minWidth: 0, borderInlineStart: i ? "1px solid " + c.rule : "none", paddingInline: 20 }}>
                  <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{m.label}</div>
                  <div style={G3.fig("lg", { color: c.ink, fontWeight: 700, marginTop: 5, lineHeight: 1.1 })}>{m.value}</div>
                  {m.note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 5 })}>{m.note}</div> : null}
                </div>
              );
            })}
          </div>
        </section>

        {all.length === 0 ? (
          <Card><EmptyState head={t("pyp.pr.empty")} body={t("pyp.pr.emptyWhy")} /></Card>
        ) : (
          <Register
            title={t("pyp.pr.reg.title")}
            sub={t("pyp.pr.reg.sub", { n: num(open.length) })}
            columns={columns}
            rows={rows}
            totals={{
              label: t("pyp.pr.tot"),
              cells: {
                who: t("pyp.pr.tot"),
                cur: inr(open.reduce(function (s, p) { return s + p.currentGross; }, 0)),
                new: inr(openTarget),
                delta: "+" + inr(openDelta),
              },
            }}
            footer={
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: "80ch" })}>{t("pyp.pr.reg.foot")}</p>
            }
          />
        )}

        {settling ? (
          <SettleFlow
            prop={handoff.proposalById(settling)}
            onClose={function () { setSettling(null); }}
            onDone={function (w) { setSettling(null); setDone(w); }}
          />
        ) : null}

        {declining ? (
          <DeclinePrompt
            prop={handoff.proposalById(declining)}
            onClose={function () { setDeclining(null); }}
            onDone={function (w) { setDeclining(null); setDone(w); }}
          />
        ) : null}
      </div>
    );
  }

  function DeclinePrompt({ prop, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const REASONS = ["pyp.pr.dec.r1", "pyp.pr.dec.r2", "pyp.pr.dec.r3"];
    const [reason, setReason] = useState(null);
    return (
      <SideScreen
        title={t("pyp.pr.dec.title")}
        sub={t("pyp.pr.panel.sub", { name: t(prop.nameKey) })}
        onClose={onClose}
        width={520}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button kind="quiet" onClick={onClose}>{t("pyp.as.cancel")}</Button>
            <Button
              disabled={!reason}
              onClick={function () {
                const H = window.NaveyaPayHandoff;
                if (H) H.declineProposal(prop.id, { reasonKey: reason });
                onDone(t("pyp.pr.dec.done", { name: t(prop.nameKey) }));
              }}
            >{t("pyp.pr.dec.go")}</Button>
          </div>
        }
      >
        <p style={ty("small", { color: c.ink, margin: 0, maxWidth: "58ch" })}>{t("pyp.pr.dec.body")}</p>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {REASONS.map(function (k) {
            const on = reason === k;
            return (
              <button
                key={k} type="button" aria-pressed={on}
                onClick={function () { setReason(k); }}
                style={Object.assign(ty("small", {}), {
                  textAlign: "start", cursor: "pointer", padding: "11px 13px",
                  borderRadius: G3.r.sm, background: on ? c.sel || c.sunken : c.surface,
                  border: "1px solid " + (on ? c.accent : c.rule), color: c.ink,
                })}
              >{t(k)}</button>
            );
          })}
        </div>
        <p style={ty("caption", { color: c.inkMuted, margin: "14px 0 0", maxWidth: "58ch" })}>{t("pyp.pr.dec.note")}</p>
      </SideScreen>
    );
  }

  /* ============================================================
     PY-05 -- THE SALARY REGISTER.
     ============================================================ */
  function SalaryRegister({ onOpen, onAssign, campus, openId, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [exporting, setExporting] = useState(null);
    const H = window.NaveyaPayHandoff;
    const handoff = H && H.useHandoff ? H.useHandoff() : null;
    const pending = handoff ? handoff.pending() : [];

    /* the campus narrows the ROSTER, and the figures below are read
       off the narrowed one — a headline describing a roll the table
       is not showing is worse than no headline */
    const roll = ROSTER.filter(function (p) { return inCampus(campus, campusOfCode(p.id)); });
    const rows = roll;
    const counts = {
      all: roll.length,
      assigned: roll.filter(payable).length,
      unassigned: roll.filter(function (p) { return stateOf(p) === "unassigned"; }).length,
      scheduled: roll.filter(function (p) { return stateOf(p) === "scheduled"; }).length,
    };
    const atLimit = roll.filter(function (p) { return AT_LIMIT_IDS.indexOf(p.id) !== -1; }).length;
    const payrollTotal = roll.reduce(function (n, p) { return n + (p.gross || 0); }, 0);

    /* `n` is the raw count, and it is what the bar above is made of.
       Monthly gross has none — money is not a share of a headcount —
       so it sits in the strip and not in the bar. */
    const metrics = [
      { k: "on", label: t("pyp.m.onPayroll"), value: num(counts.assigned), n: counts.assigned,
tone: c.chartTeal, note: t("pyp.m.onPayrollNote") },
      { k: "un", label: t("pyp.m.unassigned"), value: num(counts.unassigned), n: counts.unassigned,
tone: c.chartRed || c.danger,
        note: counts.unassigned ? t("pyp.m.unassignedNote") : t("pyp.m.unassignedNone") },
      { k: "sc", label: t("pyp.m.scheduled"), value: num(counts.scheduled), n: counts.scheduled,
tone: c.chartAmber || c.warn,
        note: counts.scheduled ? t("pyp.m.scheduledNote") : t("pyp.m.scheduledNone") },
      { k: "at", label: t("pyp.m.atLimit"), value: num(atLimit), n: atLimit,
tone: c.chartPurple,
        note: atLimit ? t("pyp.m.atLimitNote") : t("pyp.m.atLimitNone") },
      { k: "tot", label: t("pyp.m.monthly"), value: inr(payrollTotal),
tone: c.chartBlue, note: t("pyp.m.monthlyNote") },
    ];
    return (
      <div>
        <PendingFromHR rows={pending} onAssign={onAssign} onOpen={onOpen} />

        <Band
          head={t("pyp.band.head")} sub={t("pyp.band.sub")}
          metrics={metrics}
        />

        {rows.length === 0 ? (
          <Card><EmptyState head={t("pyp.reg.empty")} /></Card>
        ) : (
          <Register
              title={t("pyp.reg.title")}
              sub={t("pyp.reg.sub", { n: num(counts.all) })}
              onSelect={onOpen}
              columns={[
                { key: "who", label: t("pyp.col.staff") },
                { key: "cmp", label: t("kit.campus.label"), width: 130 },
                { key: "grp", label: t("pyp.col.group") },
                { key: "str", label: t("pyp.col.structure") },
                { key: "gross", label: t("pyp.col.gross"), align: "end" },
                { key: "from", label: t("pyp.col.from") },
                { key: "state", label: t("pyp.col.state") },
                { key: "act", label: t("pyp.col.act"), align: "end", width: 132 },
              ]}
              rows={rows.map(function (p) {
                const st = stateOf(p);
                const grp = D.groupByKey(p.group);
                const str = D.structureFor(p);
                const waiting = handoff ? handoff.isPending(p.id) : false;
                return {
                  id: p.id,
                  highlight: p.id === openId,
                  cells: {
                    who: (
                      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                        <Avatar name={t(p.nameKey)} size={26} />
                        <div style={{ minWidth: 0 }}>
                          <div style={ty("small", { color: c.ink, fontWeight: 600 })}>{t(p.nameKey)}</div>
                          <div style={ty("caption", { color: c.inkFaint, fontFamily: G3.font.mono })}>{p.id}</div>
                        </div>
                      </div>
                    ),
                    cmp: campusLabel(t, campusOfCode(p.id)),
                    grp: grp ? t(grp.nameKey) : "—",
                    str: str ? t(str.nameKey) : "—",
                    gross: p.gross == null ? "—" : inr(p.gross),
                    from: p.from ? fmtD(p.from) : "—",
                    state: st === "unassigned"
                      ? <StatusMark role={waiting ? "late" : "danger"} glyph={waiting ? "clock" : "alert"} word={waiting ? t("pyp.st.waiting") : t("pyp.st.unassigned")} />
                      : st === "scheduled"
                        ? <StatusMark role="late" glyph="clock" word={t("pyp.st.scheduled", { d: fmtD(p.from) })} />
                        : st === "hourly"
                          ? <StatusMark role="off" glyph="clock" word={t("pyp.st.hourly")} />
                          : <StatusMark role="present" glyph="check" word={t("pyp.st.assigned")} />,
                    /* the actions column the designer asked for. It
                       stops the click from also selecting the row, so
                       the menu and the row are two separate targets
                       rather than one that fires twice. */
                    act: (
                      <span
                        style={{ display: "flex", justifyContent: "flex-end" }}
                        onClick={function (e) { e.stopPropagation(); }}
                      >
                        <ActionMenu
                          ariaLabel={t("pyp.col.act.aria", { name: t(p.nameKey) })}
                          size={30}
                          items={[
                            { key: "open", icon: "payslip", label: t("pyp.col.act.open"), onSelect: function () { onOpen(p.id); } },
                            st === "unassigned"
                              ? { key: "assign", icon: "arrow", label: t("pyp.hand.chase"), onSelect: function () { onAssign(p.id); } }
                              : st === "hourly"
                                ? { key: "rules", icon: "payroll", label: t("pyp.rec.ceilRules"), onSelect: function () { if (onNavigate) onNavigate("pyRules"); } }
                                : { key: "revise", icon: "arrow", label: t("pyp.rec.act.revise"), onSelect: function () { onAssign(p.id); } },
                            { key: "export", icon: "download", label: t("pyp.rec.act.export"),
                              onSelect: function () { setExporting(p); } },
                          ]}
                        />
                      </span>
                    ),
                  },
                };
              })}
          />
        )}
        {exporting ? (
          <ExportGate person={exporting} onClose={function () { setExporting(null); }} />
        ) : null}
      </div>
    );
  }

  /* ============================================================
     PY-05 -- THE PAY RECORD. One person, the whole arithmetic of
     their pay, in a panel beside the register they were picked from.
     ============================================================ */
  /* PAYROLL'S ONE MOVE ON A SALARY. Not an editor -- a written
     request against the person, which lands in HR's pay queue. The
     topic is picked from a short list so HR reads a category rather
     than a paragraph, and the note is where the rest goes. */
  function AskHR({ person, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [topic, setTopic] = useState("wrong");
    const [note, setNote] = useState("");
    const name = t(person.nameKey);
    const unset = !person.gross;

    const TOPICS = unset
      ? [{ v: "unset", k: "pyp.ask.t.unset" }]
      : [
        { v: "wrong", k: "pyp.ask.t.wrong" },
        { v: "split", k: "pyp.ask.t.split" },
        { v: "group", k: "pyp.ask.t.group" },
        { v: "date", k: "pyp.ask.t.date" },
      ];

    return (
      <Modal
        title={unset ? t("pyp.hand.chase") : t("pyp.rec.act.revise")}
        sub={name + " · " + person.id}
        onClose={onClose}
        footer={
          <React.Fragment>
            <Button kind="primary" iconLeft="arrow" onClick={function () {
              const H = window.NaveyaPayHandoff;
              if (H) {
                if (unset && H.remind) H.remind(person.id, "ph.who.sunita");
                else if (H.requestChange) H.requestChange(person.id, { topicKey: TOPICS.filter(function (x) { return x.v === topic; })[0].k, note: note, byKey: "ph.who.sunita" });
              }
              onDone(t("pyp.ask.done", { name: name }));
            }}>{t("pyp.ask.go")}</Button>
            <LinkButton onClick={onClose}>{t("pyp.ask.cancel")}</LinkButton>
          </React.Fragment>
        }
      >
        {unset ? (
          <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("pyp.ask.unsetBody", { name: name })}</p>
        ) : (
          <Field id="pyp-topic" label={t("pyp.ask.what")}>
            <Select
              id="pyp-topic" value={topic} onChange={setTopic}
              options={TOPICS.map(function (x) { return { value: x.v, label: t(x.k) }; })}
            />
          </Field>
        )}
        <Field id="pyp-note" label={t("pyp.ask.note")}>
          <Input id="pyp-note" value={note} onChange={setNote} placeholder={t("pyp.ask.notePh")} />
        </Field>
        <p style={ty("caption", { color: c.inkFaint, margin: 0 })}>{t("pyp.ask.lands")}</p>
      </Modal>
    );
  }

  function PayRecordPanel({ p, onNavigate, onClose, onAssign }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [exporting, setExporting] = useState(false);
    /* nothing is open at rest. A record answers "what do they earn and
       what reaches them" in five rows; the twelve lines that make those
       five are a second question, and asking it is one click. */
    const [open, setOpen] = useState({});
    const fold = function (k) {
      return function () {
        setOpen(function (o) {
          const next = {};
          Object.keys(o).forEach(function (x) { next[x] = o[x]; });
          next[k] = !o[k];
          return next;
        });
      };
    };
    const pid = function (k) { return "pyrec-" + p.id + "-" + k; };
    const m = moneyFor(p);
    const grp = D.groupByKey(p.group);
    const period = D.periodOf(AUG);
    const days = period ? period.days : 31;
    /* a null augPaid is a full month -- which is what py-salary's own
       paidDaysOf() reads it as, and what the screen before this did
       not: it printed an em dash for nine people out of eleven. */
    const paid = p.augPaid == null ? days : p.augPaid;
    const canon = PERSON && p.id === PERSON.code ? PERSON : null;
    const cur = (p.ledger || []).filter(function (r) { return r.current; })[0] || null;
    const hon = p.byRule && D.honByKey ? D.honByKey(p.byRule) : null;
    const name = t(p.nameKey);

    /* how a line got its figure. The wages flag rides along, because
       the ceiling fact in the headline is counting exactly that. */
    const howOf = function (cp) {
      const how = cp.calc === "grade" ? t("pyp.rec.how.grade")
        : cp.calc === "flat" ? t("pyp.rec.how.flat")
          : cp.calc === "pct" ? t("pyp.rec.how.pct", { pct: num(cp.pct), of: cp.of })
            : cp.calc === "balance" ? t("pyp.rec.how.balance") : "";
      return cp.pf ? how + " " + t("pyp.be.inWages") : how;
    };
    /* every one of these states the RULE, not the sum: the figures
       come from py-salary's simulator, which prices a whole pay group
       at its sample person, so a "12% of 21,600.00" beside an amount
       that is 12% of something else would be a lie the table makes
       easy to catch. The rule is true of every row. */
    const dedHow = function (code, how) {
      if (how === "pf") return t("pyp.rec.how.pf");
      if (how === "pt") return t("pyp.rec.how.pt");
      if (how === "tds") return t("pyp.rec.how.tds");
      if (how === "lwf") return t("pyp.rec.how.lwf");
      if (code === "ESI") return t("pyp.rec.how.esi");
      if (code === "PFER") return t("pyp.rec.how.pfEr");
      if (code === "ESIER") return t("pyp.rec.how.esiEr");
      return null;
    };

    /* the three bands of the ladder, each the lines under one row */
    const earnRows = m ? m.lines.map(function (l) {
      return { k: l.code, code: l.code, label: t("pys3.c." + l.code), how: howOf(l.cp), value: inr(l.v) };
    }) : [];
    const dedRows = m ? m.ded.map(function (l) {
      return { k: l.code, code: l.code, label: t("pyp.rec.c." + l.code), how: dedHow(l.code, l.how), value: inr(-l.v) };
    }).concat(m.esiApplies ? [] : [{
      k: "ESI", code: "ESI", label: t("pyp.rec.c.ESI"),
      how: t("pyp.rec.how.esiNo"), value: "\u2014", dim: true,
    }]) : [];
    const empRows = m ? m.emp.map(function (l) {
      return { k: l.code, code: l.code, label: t("pyp.rec.c." + l.code), how: dedHow(l.code, l.how), value: inr(l.v) };
    }) : [];
    const allShown = !!open.earn && !!open.ded && !!open.emp;

    const revs = [];
    if (p.pending) {
      revs.push({
        k: "pending", row: p.pending, dim: true,
        note: t("pyp.rec.rev.pending", { who: t(D.CHECKER.nameKey) }),
      });
    }
    if (p.returned) {
      revs.push({
        k: "returned", row: p.returned, dim: true,
        note: t("pyp.rec.rev.returned", { who: t(p.returned.ret.by.nameKey) }),
      });
    }
    (p.ledger || []).slice().reverse().forEach(function (row, n) {
      revs.push({
        k: "l" + n, row: row,
        note: row.made ? t("pyp.rec.rev.who", {
          who: t(row.made.by.nameKey),
          appr: row.appr ? t(row.appr.by.nameKey) : "\u2014",
        }) : null,
      });
    });

    return (
      <SideScreen
        title={name} avatar={name} width={720}
        sub={p.id + " \u00b7 " + campusLabel(t, campusOfCode(p.id)) + (grp ? " \u00b7 " + t(grp.nameKey) : "")}
        onClose={onClose}
        footer={m ? (
          <React.Fragment>
            <p style={ty("caption", { color: c.inkMuted, margin: 0, flex: "1 1 200px", maxWidth: "44ch" })}>
              {t("pyp.rec.act.reviseWhy", { checker: t(D.CHECKER.nameKey) })}
            </p>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginInlineStart: "auto" }}>
              <Button size="sm" kind="secondary" iconLeft="download" onClick={function () { setExporting(true); }}>
                {t("pyp.rec.act.export")}
              </Button>
              {onAssign ? (
                <Button size="sm" iconLeft="arrow" onClick={function () { onAssign(p.id); }}>
                  {t("pyp.rec.act.revise")}
                </Button>
              ) : null}
            </div>
          </React.Fragment>
        ) : null}
      >
        {m == null ? (
          hon ? (
            /* an honorarium is not a missing salary. The screen before
               this told fourteen visiting lecturers they would not be
               paid until somebody set one. */
            <Absent
              head={t("pyp.rec.hon")}
              body={t("pyp.rec.honWhy", {
                name: name, rate: inr(hon.rate), unit: hon.unit, cap: inr(hon.cap),
              })}
              action={<LinkButton onClick={function () { if (onNavigate) onNavigate("pyRules"); }}>{t("pyp.rec.ceilRules")}</LinkButton>}
            />
          ) : (
            <Absent
              head={t("pyp.rec.unassigned")} body={t("pyp.rec.unassignedWhy")}
              action={onAssign
                ? <Button size="sm" iconLeft="arrow" onClick={function () { onAssign(p.id); }}>{t("pyp.hand.chase")}</Button>
                : null}
            />
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 12 }}>
            <Lead
              label={t("pyp.rec.m.gross")} value={inr(m.gross)}
              facts={[
                {
                  k: "month", label: t("pyp.rec.f.month"),
                  value: t("pyp.rec.paidOf", { paid: num(paid), total: num(days) }),
                  note: paid < days ? t("pyp.rec.lop", { n: num(days - paid) }) : t("pyp.rec.noLop"),
                },
                {
                  k: "rev", label: t("pyp.rec.f.revised"),
                  value: cur ? t("pyp.r." + cur.reason) + ", " + fmtD(cur.from) : "\u2014",
                  note: cur && cur.made
                    ? t("pyp.rec.rev.who", {
                      who: t(cur.made.by.nameKey),
                      appr: cur.appr ? t(cur.appr.by.nameKey) : "\u2014",
                    })
                    : null,
                },
              ]}
            />

            <Block
              head={t("pyp.rec.h.table")}
              action={
                <LinkButton onClick={function () {
                  const v = !allShown;
                  setOpen(function (o) {
                    const next = { earn: v, ded: v, emp: v };
                    next.revs = o.revs; next.filed = o.filed;
                    return next;
                  });
                }}>{t(allShown ? "pyp.rec.hideAll" : "pyp.rec.showAll")}</LinkButton>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", margin: "0 -14px" }}>
                <LadderRow
                  label={t("pyp.rec.gross")} meta={t("pyp.rec.meta.earn", { n: num(earnRows.length) })}
                  value={inr(m.gross)} open={!!open.earn} onToggle={fold("earn")} panelId={pid("earn")}
                />
                {open.earn ? <Lines id={pid("earn")} label={t("pyp.rec.earn")} rows={earnRows} /> : null}

                <LadderRow
                  sign={"\u2212"} label={t("pyp.rec.ded")} meta={t("pyp.rec.meta.ded", { n: num(m.ded.length) })}
                  value={inr(-m.dedTotal)} open={!!open.ded} onToggle={fold("ded")} panelId={pid("ded")}
                />
                {open.ded ? <Lines id={pid("ded")} label={t("pyp.rec.ded")} rows={dedRows} /> : null}

                <div aria-hidden="true" style={{ height: 1, background: c.rule, margin: "7px 14px" }} />
                <LadderRow
                  band strong sign="=" label={t("pyp.rec.net")} note={t("pyp.rec.netNote")}
                  value={inr(m.net)}
                />

                <LadderRow
                  sign="+" label={t("pyp.rec.emp")} meta={t("pyp.rec.meta.emp", { n: num(empRows.length) })}
                  value={inr(m.empTotal)} open={!!open.emp} onToggle={fold("emp")} panelId={pid("emp")}
                />
                {open.emp ? <Lines id={pid("emp")} label={t("pyp.rec.emp")} rows={empRows} /> : null}

                <div aria-hidden="true" style={{ height: 1, background: c.rule, margin: "7px 14px" }} />
                <LadderRow
                  band strong sign="=" label={t("pyp.rec.cost")} note={t("pyp.rec.costNote")} value={inr(m.cost)}
                />
              </div>

              <div style={{
                marginTop: 14, paddingTop: 13, borderTop: "1px solid " + c.rule,
                display: "flex", flexDirection: "column", gap: 9,
              }}>
                <FootLine
                  text={t("pyp.rec.act.noEditWhy", { group: grp ? t(grp.nameKey) : "" })}
                  link={t("pyp.rec.ceilRules")}
                  onLink={function () { if (onNavigate) onNavigate("pyRules"); }}
                />
                <FootLine
                  text={t("pyp.rec.noAttachedWhy")}
                  link={t("pyp.rec.attGo")}
                  onLink={function () { if (onNavigate) onNavigate("pyAdjust"); }}
                />
              </div>
            </Block>

            {revs.length ? (
              <Fold
                id={pid("revs")} open={!!open.revs} onToggle={fold("revs")}
                head={t("pyp.rec.h.revs")}
                meta={cur ? t("pyp.rec.meta.revs", { n: num(revs.length), d: fmtD(cur.from) }) : null}
              >
                <p style={ty("caption", { color: c.inkMuted, margin: "0 0 10px", maxWidth: "66ch" })}>
                  {t("pyp.rec.histSub")}
                </p>
                <Revisions rows={revs} />
              </Fold>
            ) : null}

            <Fold
              id={pid("filed")} open={!!open.filed} onToggle={fold("filed")}
              head={t("pyp.rec.h.filed")}
              meta={t(canon ? "pyp.rec.meta.filed" : "pyp.rec.meta.filedNone")}
            >
              {canon ? (
                <div>
                  <p style={ty("caption", { color: c.inkMuted, margin: "0 0 2px", maxWidth: "66ch" })}>
                    {t("pyp.rec.idsSub")}
                  </p>
                  <Masked label={t("pyp.rec.id.uan")} masked={canon.ids.uan.masked} full={canon.ids.uan.full}
                    changedBy={canon.ids.uan.changedBy} changedOn={canon.ids.uan.changedOn} />
                  <Masked label={t("pyp.rec.id.esic")} masked={m.esiApplies ? canon.ids.esic.masked : t("pyp.rec.esicNone")}
                    full={m.esiApplies ? canon.ids.esic.full : null} />
                  <Masked label={t("pyp.rec.id.pan")} masked={canon.ids.pan.masked} full={canon.ids.pan.full}
                    changedBy={canon.ids.pan.changedBy} changedOn={canon.ids.pan.changedOn} />
                  <Masked label={t("pyp.rec.id.bank")} masked={canon.ids.bank.masked} full={canon.ids.bank.full}
                    changedBy={canon.ids.bank.changedBy} changedOn={canon.ids.bank.changedOn} />
                  <Masked label={t("pyp.rec.id.pt")} masked={t("pyp.rec.ptState")} full={null} />
                </div>
              ) : (
                <Absent
                  head={t("pyp.rec.idsAbsent")} body={t("pyp.rec.idsAbsentWhy")}
                  action={<LinkButton onClick={function () { if (onNavigate) onNavigate("hrRecord"); }}>{t("pyp.rec.idsGo")}</LinkButton>}
                />
              )}
            </Fold>
          </div>
        )}
        {exporting ? <ExportGate person={p} onClose={function () { setExporting(false); }} /> : null}
      </SideScreen>
    );
  }

  /* ============================================================
     THE MODULE. Register and proposals are peers, and the record is
     neither: it is a panel over whichever of them you opened it from,
     with the row you opened still highlighted behind it.
     ============================================================ */
  function PYPeople({ role, onNavigate }) {
    /* the officer holds both campuses; everything below answers this */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    /* the payroll run routes here to fix an unpriced person. The flat
       router passes no props, so the id arrives on window.Pages3 and
       is consumed once -- arriving later from the rail must not
       reopen whoever the run last complained about. */
    const handedAssign = React.useMemo(function () {
      const h = window.Pages3 && window.Pages3.pyAssignId;
      if (h) { window.Pages3.pyAssignId = null; return h; }
      return null;
    }, []);
    /* and the run's register routes here to READ one person's pay. Same
       one-shot handover: arriving from the rail later must not reopen
       whoever was last looked at. */
    const handedRecord = React.useMemo(function () {
      const h = window.Pages3 && window.Pages3.pyRecordId;
      if (h) { window.Pages3.pyRecordId = null; return h; }
      return null;
    }, []);
    const { c } = useTheme();
    const { t } = useLang();
    const [tab, setTab] = useState("reg");
    const [openId, setOpenId] = useState(handedRecord);
    const [assignId, setAssignId] = useState(handedAssign);
    const [done, setDone] = useState(null);

    if (!D) {
      return (
        <Shell campus={campus} onCampus={setCampus} role={role} onNavigate={onNavigate} active="pyPeople" title={t("pyp.title")}>
          <Card><EmptyState head={t("pyp.reg.empty")} /></Card>
        </Shell>
      );
    }
    const openPerson = openId ? (D.staffById(openId) || null) : null;
    const assignPerson = assignId
      ? (function () {
        const H = window.NaveyaPayHandoff;
        return (H && H.forId(assignId)) || D.staffById(assignId) || null;
      })()
      : null;

    const items = [
      { key: "reg", label: t("pyp.tab.reg") },
      { key: "prop", label: t("pyp.tab.prop") },
    ];
    return (
      <Shell campus={campus} onCampus={setCampus}
        role={role} onNavigate={onNavigate} active="pyPeople"
        title={t("pyp.title")}
        chips={
          <React.Fragment>
            <Chip bg={c.sunken} fg={c.inkMuted} mono>{t("pyp.run")}</Chip>
            <Chip bg={c.sunken} fg={c.inkMuted}>{t("pyp.cfg", { v: D.CFG_PINNED.v })}</Chip>
          </React.Fragment>
        }
        tabs={<Tabs items={items} active={tab} onChange={setTab} ariaLabel={t("pyp.tabs.aria")} idBase="pypeople" />}
      >
        <div style={{ marginTop: G3.layout.gap }}>
          {tab === "reg" ? (
            <TabPanel idBase="pypeople" tabKey="reg">
              {done ? (
                <div role="status" style={{ marginBottom: G3.layout.gap }}>
                  <Card><StatusMark role="present" glyph="check" word={done} /></Card>
                </div>
              ) : null}
              <SalaryRegister
                campus={campus} openId={openId} onNavigate={onNavigate}
                onOpen={setOpenId} onAssign={setAssignId} />
            </TabPanel>
          ) : null}
          {tab === "prop" ? (
            <TabPanel idBase="pypeople" tabKey="prop">
              <ProposedRevisions onOpen={function (id) { setTab("reg"); setOpenId(id); }} />
            </TabPanel>
          ) : null}
        </div>
        {openPerson ? (
          <PayRecordPanel
            p={openPerson} onNavigate={onNavigate}
            onClose={function () { setOpenId(null); }}
            onAssign={function (id) { setOpenId(null); setAssignId(id); }}
          />
        ) : null}
        {assignPerson ? (
          <AskHR
            person={assignPerson}
            onClose={function () { setAssignId(null); }}
            onDone={function (word) { setAssignId(null); setDone(word); }}
          />
        ) : null}
      </Shell>
    );
  }

  /* ============================================================
     SELF-CHECKS. The record's arithmetic is asserted against the
     figures the run register already publishes, so the two cannot
     drift apart silently.
     ============================================================ */
  const CHECKS = (function () {
    if (!D) return { dataLoaded: false };
    const a = D.staffById("NAV-0142");
    const m = a ? moneyFor(a) : null;
    const v = m ? D.wageVerdict(m.lines) : null;
    return {
      dataLoaded: true,
      /* person.jsx, py-salary.jsx and py-ops.jsx all say 94,800.00 */
      grossAgrees: !!m && Math.abs(m.gross - 94800.0) < 0.005,
      personAgrees: !PERSON || Math.abs(PERSON.pay.grossMonthly - 94800.0) < 0.005,
      /* py-ops.jsx's register prints this net for her */
      netAgrees: !!m && Math.abs(m.net - 78432.0) < 0.005,
      /* every column sums */
      earnSums: !!m && Math.abs(m.lines.reduce(function (s, l) { return s + l.v; }, 0) - m.gross) < 0.005,
      netIsGrossLessDed: !!m && Math.abs(m.gross - m.dedTotal - m.net) < 0.005,
      costIsGrossPlusEmp: !!m && Math.abs(m.gross + m.empTotal - m.cost) < 0.005,
      /* PF is 12% of basic + DA, not of gross */
      pfOnWages: !!m && !!v && Math.abs(m.ded.filter(function (l) { return l.code === "PF"; })[0].v - D.r2(v.wages * 0.12)) < 0.01,
      /* she sits exactly ON the Labour Code ceiling */
      atCeiling: !!v && v.state === "at" && Math.abs(v.share - 50) < 0.005,
      /* ESI is absent because the gross is over the ceiling, not because it is zero */
      esiAbsent: !!m && m.esiApplies === false,
      /* the register's rows are the dataset's, unassigned first */
      rosterSorted: ROSTER.length === D.STAFF.length
        && (COUNTS.unassigned === 0 || stateOf(ROSTER[0]) === "unassigned"),
    };
  })();
  const ALL_CHECKS_PASS = Object.keys(CHECKS).every(function (k) { return CHECKS[k]; });

  window.Pages3 = window.Pages3 || {};
  window.Pages3.PYPeople = PYPeople;
  /* the `pyRecord` route is the module with one record open: the panel
     cannot exist without the register behind it, and the run's
     "open pay record" hands the id over the same way it always did. */
  window.Pages3.PYRecord = PYPeople;
  window.Pages3.PYPeopleChecks = CHECKS;
  window.Pages3.PYPeopleChecksPass = ALL_CHECKS_PASS;
})();
