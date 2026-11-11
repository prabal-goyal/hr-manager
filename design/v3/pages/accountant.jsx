/* @jsxRuntime classic */
/* ============================================================
   Naveya — Accountant · window.Pages3.ACHome / ACGate / ACLiability

   AC-01 Compliance calendar   "what is due, to whom, and how long have I got"
   AC-02 Maker-checker gate    "what is waiting for a second pair of eyes"
   AC-03 Liability & recon     "does what we owe match what we computed and what we paid"

   SPEC (docs/screen-inventory.md 8 - Accountant; docs/development-specification.md)
   · AC-01 - M14 (scheduled scans for statutory due dates), M11 (filings),
     spec 8 Maker-checker, M15. Scope is by legal entity: two entities here,
     because a filing is per LegalEntity (6.1).
   · AC-02 - spec 8 Maker-checker, M10 Permissions (payroll.approve covers
     runs, loans, reimbursement batches, arrears), M11 Permissions
     (statutory.file, bonus runs), M12 API /approve, M10 Acceptance
     ("the maker cannot self-approve"), DESIGN principle 10.
     ONE queue, not five: the spec spreads maker-checker across five
     modules, a checker experiences it as one question
     (.claude/agent-memory/alfred/screen-inventory-decomposition.md).
   · AC-03 - M11 Business rules (reconciliation + liability provisioning),
     blueprint 5, 6.10 StatutoryContribution / StatutoryFiling, 4.4
     versioned config.

   GUARDRAILS from docs/ui-compliance-requirements.md
   · O5 - a distinct second person. Both identities are drawn from the
     moment the item exists; the empty checker panel IS the point. The
     maker sees Approve disabled with the rule in the first person, never
     hidden, never enabled. Send back with a reason has equal weight to
     Approve. Approve is a two-step release with re-authentication - a
     filing and a payout are the definition of irreversible.
   · O6 - append-only. Every transition carries who and why. There is no
     Delete anywhere on these three screens; a correction supersedes.
   · O9 - no rate, ceiling, slab or percentage is printed as copy on any
     of these screens. Every statutory figure is an AMOUNT that names the
     StatutoryConfig version it was read from, and an arrears line names
     the version pinned to ITS month, not today's.
   · O3 - identifiers are masked (UAN, challan payer account). The
     Accountant reads aggregate money, not per-person bank details.
   · Availability convention - never a right here: ABSENT. Right exists,
     state unmet: VISIBLE, DISABLED, reason in words. Right exists, this
     person barred from this instance: VISIBLE, DISABLED, rule in the
     first person.

   FIGURES ARE SHARED, NOT INVENTED
   Run PR-2026-08 (gross, deductions, net, holds, net payable, employer
   contributions, headcount, payees) is summed from the SAME component
   aggregates as pages/payroll.jsx, so the gate and the run console agree
   to the paisa. July's PR-2026-07 net is payroll.jsx's disbursed figure.
   The reimbursement batch is payroll.jsx's REIMB (31 claims). The arrears
   already inside PR-2026-08 are its ARREAR line. Config versions v2026.2
   / v2026.3 / v2026.4 and the people (Sunita Kulkarni NAV-0031 maker,
   Rajiv Menon NAV-0009 checker) are payroll.jsx's and payslips.jsx's.
   Nothing on these screens is a re-typed total: every total is reduced
   from its parts at render time.

   WHAT THESE SCREENS DELIBERATELY REFUSE
   · No Approve for the maker, under any circumstance, including a
     "confirm you understand" override. There is no break-glass path.
   · No Edit on a pending item - editing would make the checker the maker.
   · No Delete, anywhere.
   · No single-click release: Approve opens a confirmation restating type,
     period, exact amount, headcount and maker, and asks for the password.
   · No dismissing an overdue filing.
   · No payroll computation, no HR content, no document expiry watchlist
     (HR-11 is a different calendar with a different owner).
   · No filing artefacts (AC-04/AC-05) and no rate configuration (GA-07).

   Composed only from window.G3 / window.UI3. No colour literal appears
   in this file; every colour is a semantic role read from the theme.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useEffect, useRef } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, ColorCard, Register, TitleMark, Button, LinkButton,
    Field, Input, Select, Tabs, TabPanel, ActionMenu, Chip, StatusMark, Seal,
    Figure, Icon, EmptyState, ErrorState, Skeleton, Meter, MetricStrip, Modal, Avatar, inr, num,
    CampusSwitch, campusLabel, campusOptions, inCampus, campusOfCode, CAMPUS_ALL,
  } = UI;

  /* ============================================================
     COPY - English. The Hindi block below mirrors it key for key.
     No rate, ceiling, slab or percentage appears in any value here.
     ============================================================ */
  addStrings({
    en: {
      /* ---------- shared vocabulary ---------- */
      "ac.mon.4": "April", "ac.mon.5": "May", "ac.mon.6": "June",
      "ac.mon.7": "July", "ac.mon.8": "August", "ac.mon.9": "September",
      "ac.mon.10": "October", "ac.mon.11": "November", "ac.mon.12": "December",
      "ac.date": "{d} {mon} {y}",

      "ac.ent.trust": "Sunrise Education Trust",
      "ac.ent.found": "Sunrise Foundation (Pre-school)",
      "ac.ent.label": "Legal entity",
      "ac.ent.both": "Sunrise Education Trust and Sunrise Foundation (Pre-school)",
      "ac.ent.note": "Filings are made per legal entity, so every figure belongs to one. A campus is a filter inside an entity.",
      "ac.st.ka": "Karnataka",
      "ac.st.tg": "Telangana",
      "ac.period.label": "Period",
      "ac.period.2026-07": "July 2026",
      "ac.period.2026-06": "June 2026",

      "ac.p.rajiv": "Rajiv Menon",
      "ac.p.rajiv.role": "Accountant",
      "ac.p.sunita": "Sunita Kulkarni",
      "ac.p.sunita.role": "Payroll Officer",
      "ac.p.kavita": "Kavita Sharma",
      "ac.p.kavita.role": "HR Officer",
      "ac.p.nandini": "Nandini Rao",
      "ac.p.nandini.role": "Group Admin",
      "ac.p.priya": "Priya Deshmukh",
      "ac.p.priya.role": "Director",
      "ac.p.ritu": "Ritu Bansal",
      "ac.p.imran": "Imran Qureshi",

      /* ---------- due state: never colour alone ---------- */
      "ac.due.filed": "Filed",
      "ac.due.overdue": "Overdue",
      "ac.due.soon": "Due soon",
      "ac.due.later": "Not due yet",
      "ac.due.short": "Short paid",
      "ac.due.daysLeft": "{n} days left",
      "ac.due.daysLate": "{n} days late",
      "ac.due.daysAway": "{n} days away",
      "ac.due.filedOn": "filed {date}",
      "ac.due.shortBy": "short by {amt}",

      /* ---------- filing kinds ---------- */
      "ac.f.ecr": "Provident fund — electronic challan",
      "ac.f.esi": "Employees’ State Insurance contribution",
      "ac.f.pt": "Professional tax challan",
      "ac.f.tds": "Income tax challan — section 192",
      "ac.f.lwf": "Labour welfare fund contribution",
      "ac.f.24q": "Form 24Q — quarterly return",
      "ac.f.16": "Form 16",
      "ac.f.q2": "Quarter 2 · July to September 2026",
      "ac.f.fy2526": "Financial year 2025–26",
      "ac.f.forState": "{kind} · {state}",

      /* consequence of a slip — stated in words, never as a rate */
      "ac.cons.ecr": "A late deposit carries interest and damages, and the delay stays on this establishment’s record with the provident fund office.",
      "ac.cons.esi": "Interest runs for every day of delay, and a late contribution can put a claim at risk for the staff it covers.",
      "ac.cons.pt": "The state charges interest and a penalty on a late challan, and the entity’s enrolment can be flagged.",
      "ac.cons.tds": "A late deposit carries interest. A late return carries a fee for every day it stays unfiled, and the deduction can be disallowed.",
      "ac.cons.24q": "Until this is filed, the tax you deducted does not show against your staff's PANs, and their own returns will not match.",
      "ac.cons.16": "Staff cannot file their own return without it.",
      "ac.cons.lwf": "The state charges interest on a late contribution.",

      /* ---------- statutory heads and their lines ---------- */
      "ac.k.pf": "Provident fund",
      "ac.k.esi": "Employees’ State Insurance",
      "ac.k.pt": "Professional tax",
      "ac.k.tds": "Income tax deducted at source",
      "ac.k.lwf": "Labour welfare fund",
      "ac.l.pf.emp": "Employee share",
      "ac.l.pf.er": "Employer share — provident fund",
      "ac.l.pf.eps": "Employer share — pension",
      "ac.l.pf.edli": "Deposit-linked insurance",
      "ac.l.pf.adm": "Administration charges",
      "ac.l.pf.arr": "On June arrears, recomputed on the version in force that month",
      "ac.l.esi.emp": "Employee share",
      "ac.l.esi.er": "Employer share",
      "ac.l.pt.ka": "Karnataka",
      "ac.l.pt.tg": "Telangana",
      "ac.l.tds.192": "Deducted from salaries under section 192",
      "ac.l.lwf.ka": "Karnataka",
      "ac.l.lwf.tg": "Telangana — falls due once a year, not in this period",

      /* ============ AC-01 · compliance calendar ============ */
      "ac1.crumb": "Compliance calendar",
      "ac1.gate.title": "Waiting for your sign-off",
      "ac1.gate.note": "{n} items you can release. Nothing in them moves while they wait.",
      "ac1.gate.oldest": "oldest, {n} days",
      "ac1.gate.open": "Open the approval gate",
      "ac1.gate.run": "Payroll runs",
      "ac1.gate.batch": "Reimbursements",
      "ac1.gate.loan": "Loan sanctions",
      "ac1.gate.ff": "Settlements",
      "ac1.gate.foot": "{n} more are waiting that you cannot release \u2014 you prepared one, one went stale. Both are on the gate with the reason.",
      "ac1.late.title": "Past a statutory deadline",
      "ac1.late.unit": "overdue",
      "ac1.late.sub": "Interest and a penalty run from the due date, and the delay stays on the entity’s record.",
      "ac1.late.over": "{n} days late",
      "ac1.late.go": "Open the filings",
      "ac1.late.clean": "Nothing is past a statutory deadline",
      "ac1.wait.title": "Waiting on you",
      "ac1.wait.unit": "waiting on you",
      "ac1.wait.sub": "Across every module on this desk, oldest first. A row goes straight there.",
      "ac1.wait.old": "Oldest",
      "ac1.wait.days": "{n} days",
      "ac1.wait.today": "today",
      "ac1.wait.none": "Nothing is waiting on you. Every queue on this desk is clear.",
      "ac1.w.gate": "Finalisations awaiting a second person",
      "ac1.w.overdue": "Returns past their due date",
      "ac1.w.due": "Returns due shortly",
      "ac1.w.proofs": "Proofs waiting on your check",
      "ac1.w.owed": "Liability not yet deposited",
      "ac1.t.filings": "Filings",
      "ac1.t.filingsUnit": "open",
      "ac1.t.filingsNote": "Where each return stands, by kind and entity.",
      "ac1.t.fOverdue": "Overdue",
      "ac1.t.fDue": "Due shortly",
      "ac1.t.fLater": "Not due yet",
      "ac1.t.fFiled": "Filed and acknowledged",
      "ac1.t.liability": "Liability",
      "ac1.t.liabilityNote": "What is owed and not yet deposited, across both entities.",
      "ac1.t.byPeriod": "By period",
      "ac1.t.byEntity": "By entity",
      "ac1.t.decl": "Declarations",
      "ac1.t.declUnit": "heads to check",
      "ac1.t.declNote": "Proofs against what staff declared for the year.",
      "ac1.t.declWho": "Who declares",
      "ac1.t.declOld": "On the old regime",
      "ac1.t.declNew": "On the new regime",
      "ac1.t.declMoney": "The money",
      "ac1.t.declClaimed": "Declared",
      "ac1.t.declAccepted": "Accepted so far",
      "ac1.t.contrib": "Contributions",
      "ac1.t.contribNote": "What July generated for the Trust, by head. The lines every filing is built from.",
      "ac1.t.contribFoot": "Computed on {v} and pinned to the run that produced them. Nothing here can be typed.",
      "ac1.t.rules": "Rules in force",
      "ac1.t.rulesNote": "Pinned to the July run, in force from {d}.",
      "ac1.t.rulesNext": "Published, not yet in force",
      "ac1.t.rulesBonus": "What it supplies",
      "ac1.t.rulesBonusRow": "The bonus band, cap and ceiling",
      "ac1.t.rulesBonusVal": "Read, never typed",
      "ac1.t.rulesFoot": "A version is never edited. A rate change is published as a new version, and each run keeps the one it computed against.",
      "ac1.title": "What is due, and what is waiting for you",

      "ac1.late.head": "One filing is late",
      "ac1.late.body": "{kind} for {period} was due on {due}. It is {late} and nothing has been deposited against it.",
      "ac1.late.amt": "Outstanding",
      "ac1.late.recon": "See it in the reconciliation",
      "ac1.late.noDismiss": "An overdue filing cannot be acknowledged away. It clears when it is paid and filed.",

      "ac1.gate.title": "Waiting for your sign-off",
      "ac1.gate.count": "{n} items you can release",
      "ac1.gate.stake": "Money held up",
      "ac1.gate.oldest": "The oldest has been waiting {n} days.",
      "ac1.gate.types": "{n} × {label}",
      "ac1.gate.open": "Open the approval gate",
      "ac1.gate.blocked": "{n} more are waiting that you cannot release",
      "ac1.gate.blockedWhy": "You prepared one of them, and one has gone stale since it was submitted. Both are shown on the gate with the reason.",
      "ac1.gate.empty.head": "Nothing is waiting for you",
      "ac1.gate.empty.body": "When payroll, HR or you submit something that needs a second person, it appears here first.",

      "ac1.cal.title": "Statutory due dates",
      "ac1.cal.sub": "Read from the same versioned configuration as the amounts — per state, per entity, never assumed.",
      "ac1.cal.col.filing": "Filing",
      "ac1.cal.col.entity": "Entity",
      "ac1.cal.col.period": "Period",
      "ac1.cal.col.amount": "Amount",
      "ac1.cal.col.due": "Due",
      "ac1.cal.col.state": "State",
      "ac1.cal.col.act": "Actions",
      "ac1.cal.chip.open": "Open ({n})",
      "ac1.cal.chip.all": "Everything ({n})",
      "ac1.cal.settled": "{n} settled this cycle, hidden. Switch to Everything to read them.",
      "ac1.cal.aria": "Actions for {kind}, {period}",
      "ac1.cal.act.open": "Open the filing",
      "ac1.cal.act.openWhy": "The period’s payroll has not been approved. Filing a draft run would be a false return.",
      "ac1.cal.act.ack": "Acknowledge — stop reminding me",
      "ac1.cal.act.ackWhy": "Overdue filings cannot be dismissed.",
      "ac1.cal.act.recon": "See it in the reconciliation",
      "ac1.cal.acked": "Acknowledged by you",
      "ac1.cal.empty.head": "Nothing is open",
      "ac1.cal.empty.body": "Every statutory filing for both entities is paid, filed and acknowledged. The settled list is still there under Everything.",

      "ac1.liab.title": "What we owe right now",
      "ac1.liab.sub": "Both entities, July 2026, plus anything carried from earlier.",
      "ac1.liab.computed": "Computed from the runs",
      "ac1.liab.paid": "Deposited so far",
      "ac1.liab.out": "Still outstanding",
      "ac1.liab.carried": "Carried from June",
      "ac1.liab.total": "Total outstanding",
      "ac1.liab.go": "Open the reconciliation",
      "ac1.liab.note": "Provisioned against the payroll that produced it, so this figure moves only when a run or a payment does.",

      "ac1.cfg.title": "Rules in force",
      "ac1.cfg.pinned": "Pinned to the July run",
      "ac1.cfg.pinnedV": "{v} · in force from {d}",
      "ac1.cfg.new": "A newer version is published",
      "ac1.cfg.newV": "{v} · in force from {d}",
      "ac1.cfg.newBy": "Published by {who} on {date}. It applies from the September run onward; nothing already computed moves onto it.",
      "ac1.cfg.immutable": "A version is never edited. A rate change is published as a new version, and each run keeps the one it computed against.",
      "ac1.cfg.see": "See what changed",

      "ac1.portal.title": "Government portals",
      "ac1.portal.ok": "{name} · last checked 09:38",
      "ac1.portal.up": "Reachable",
      "ac1.portal.err.head": "The income-tax portal is not responding",
      "ac1.portal.err.body": "No TRACES since 09:10. Form 24Q keeps retrying on its own. Depositing the challan goes through the bank and is unaffected.",
      "ac1.portal.retry": "Try again now",
      "ac1.portal.epfo": "Provident fund portal",
      "ac1.portal.esic": "Insurance portal",

      /* ============ AC-02 · maker-checker gate ============ */
      "ac2.crumb": "Approval gate",
      "ac2.title": "Should this money leave, or this return go out?",

      "ac2.t.run": "Payroll run",
      "ac2.t.batch": "Reimbursement payout batch",
      "ac2.t.loan": "Loan sanction",
      "ac2.t.arrears": "Arrears posting",
      "ac2.t.bonus": "Bonus run",
      "ac2.t.ff": "Full and final settlement",

      "ac2.filter.mine": "Awaiting me ({n})",
      "ac2.filter.blocked": "I cannot release ({n})",
      "ac2.filter.done": "Decided ({n})",
      "ac2.filter.type": "Type",
      "ac2.filter.allTypes": "Every type",
      "ac2.filter.allCampuses": "Both campuses",
      "ac2.filter.label": "Show",

      "ac2.q.title": "The queue",
      "ac2.q.by": "Prepared by {who}",
      "ac2.q.on": "Submitted {date}",
      "ac2.q.aria": "Open {type} {id}",
      "ac2.q.empty.head": "Nothing here",
      "ac2.q.empty.body": "No item matches this filter. Try Awaiting me, or widen the type.",
      "ac2.q.empty.action": "Show everything awaiting me",

      "ac2.d.rules": "Rules",
      "ac2.d.rulesNote": "Pinned {d}, and a later change does not rewrite it",
      "ac2.d.rulesEach": "One per month",
      "ac2.d.rulesEachNote": "Each month on the version pinned to it, never today's",
      "ac2.so.on": "Signed {date}",
      "ac2.so.permNote": "You hold {perm} here and did not prepare it",
      "ac2.so.notYou": "It cannot be {who}, who prepared it",
      "ac2.sum.run": "{n} of {all} people are paid. Gross {gross}, less {ded} deducted.",
      "ac2.sum.runHeld": "{n} of {all} people are paid. Gross {gross}, less {ded} deducted and {held} held back.",
      "ac2.sum.batch": "{n} claims, approved and not yet paid.",
      "ac2.sum.loan": "A sanction for {who}, repaid over {n} months at {emi}.",
      "ac2.sum.ff": "Everything owed to {who} on leaving.",
      "ac2.sum.heads": "{n} people.",
      "ac2.ev.people": "The people",
      "ac2.ppl.all": "Everyone",
      "ac2.ppl.held": "Not being paid",
      "ac2.ppl.search": "Find a name or number",
      "ac2.ppl.col.who": "Who",
      "ac2.ppl.col.group": "Pay group",
      "ac2.ppl.col.gross": "Gross",
      "ac2.ppl.col.ded": "Deductions",
      "ac2.ppl.col.net": "Net",
      "ac2.ppl.col.cat": "Spent on",
      "ac2.ppl.col.ref": "Claim",
      "ac2.ppl.col.amount": "Amount",
      "ac2.ppl.notPaid": "Held",
      "ac2.ppl.nothing": "Nothing due",
      "ac2.ppl.tot": "{n} people",
      "ac2.ppl.more": "Show {n} more",
      "ac2.ppl.allShown": "Every one of them is on this page.",
      "ac2.ppl.none": "Nobody matches that.",
      "ac2.st.pending": "Awaiting you",
      "ac2.st.mine": "You prepared this",
      "ac2.st.stale": "Inputs changed",
      "ac2.st.approved": "Released",
      "ac2.st.sentBack": "Sent back",
      "ac2.st.outOfScope": "Read only for you",

      "ac2.d.amount": "Amount to release",
      "ac2.d.locked": "Locked since it was submitted",

      "ac2.so.maker": "Prepared by",
      "ac2.so.checker": "Released by",
      "ac2.so.awaiting": "Awaiting a different approver",
      "ac2.so.wouldBe": "This would be you",
      "ac2.so.perm": "{perm} · {id}",

      "ac2.ev.title": "The evidence",
      "ac2.ev.seen": "You have read all {n}.",
      "ac2.ev.unseen": "{n} of {total} read.",
      "ac2.ev.aria": "Evidence for {id}",

      "ac2.ev.var": "What moved since July",
      "ac2.ev.stat": "Statutory in this run",
      "ac2.ev.claims": "The claims",
      "ac2.ev.sched": "Repayment schedule",
      "ac2.ev.split": "Month split",
      "ac2.ev.basis": "How it was worked out",
      "ac2.ev.lines": "Settlement lines",

      "ac2.col.line": "Line",
      "ac2.col.amount": "Amount",
      "ac2.col.people": "People",
      "ac2.col.cause": "Cause",
      "ac2.col.claims": "Claims",
      "ac2.col.month": "Month",
      "ac2.col.version": "Computed on",
      "ac2.col.inst": "Instalment",
      "ac2.col.due": "Falls due",
      "ac2.col.left": "Left to repay",
      "ac2.col.campus": "Campus",
      "ac2.col.head": "Head",
      "ac2.col.emp": "Employee share",
      "ac2.col.er": "Employer share",

      "ac2.reg.gross": "Gross earnings",
      "ac2.reg.ded": "Less deductions",
      "ac2.reg.net": "Net",
      "ac2.reg.held": "Less payouts held",
      "ac2.reg.payable": "Leaves the bank",
      "ac2.reg.employer": "Paid by the school on top, not deducted from anyone",
      "ac2.reg.heldNote": "{n} people are not being paid this cycle. Each hold carries a reason and the name of whoever placed it, on the run console.",

      "ac2.var.moved": "Net moved by {amt} against July.",
      "ac2.var.movedNote": "Six people moved, and every one of them was explained by {who} on {date} before this was submitted.",
      "ac2.var.joiner": "Joined during the month",
      "ac2.var.leaver": "Left during the month",
      "ac2.var.lop": "Loss of pay",
      "ac2.var.revision": "Pay revision",
      "ac2.var.loan": "Loan repayment started",
      "ac2.var.decl": "Investment declaration verified",

      "ac2.claims.lta": "Leave travel",
      "ac2.claims.med": "Medical",
      "ac2.claims.tel": "Telephone",
      "ac2.claims.books": "Books and academic",
      "ac2.claims.fuel": "Fuel",
      "ac2.claims.note": "Receipts sit against each claim. Open one on the payout batch screen; you cannot edit anything from here.",

      "ac2.loan.for": "For {who} · {id}",
      "ac2.loan.principal": "Principal",
      "ac2.loan.interest": "Interest over the term",
      "ac2.loan.total": "Total repayable",
      "ac2.loan.emi": "Monthly instalment",
      "ac2.loan.tenure": "{n} months",
      "ac2.loan.note": "Once released, the instalment is deducted every run until the loan closes. First four shown of {n}.",

      "ac2.split.note": "One posting, {n} months. Each month carries the version that was in force then — that is why two of these differ.",

      "ac2.bonus.eligible": "Eligible staff",
      "ac2.bonus.excluded": "Not eligible this year",
      "ac2.bonus.exgratia": "Paid as ex-gratia",
      "ac2.bonus.exgratiaNote": "Statutory bonus does not apply to this institution, so this is ex-gratia. Eligibility, cap and percentage all come from {v}.",
      "ac2.bonus.excludedNote": "{n} staff joined after the eligibility date or are still on probation. They are listed on the bonus run itself.",

      "ac2.ff.for": "For {who} · {id}",
      "ac2.ff.lwd": "Last working day",
      "ac2.ff.pending": "Salary still owed",
      "ac2.ff.encash": "Leave encashment",
      "ac2.ff.gratuity": "Gratuity",
      "ac2.ff.notice": "Notice recovery",
      "ac2.ff.noticeNone": "Full notice served",
      "ac2.ff.loan": "Loan recovery",
      "ac2.ff.tds": "Income tax true-up",
      "ac2.ff.net": "Net payable",
      "ac2.ff.access": "Releasing this closes {who}'s access today. Payslips, Form 16, PF, insurance and service book stay on file as the law requires.",

      "ac2.act.approve": "Release it",
      "ac2.act.approveWhyEv": "Open every evidence tab first. {n} still unread.",
      "ac2.act.approveWhyMine": "You prepared this on {date}. A different approver has to release it, and there is no override.",
      "ac2.act.approveWhyStale": "The figures changed after submission, so approving would release numbers that no longer match. {who} has to submit again.",
      "ac2.act.send": "Send it back with a reason",
      "ac2.act.menu": "More on {id}",
      "ac2.act.delegate": "Hand it to another checker",
      "ac2.act.delegateWhy": "You cannot hand your own work to someone as their check — it is already theirs to do.",
      "ac2.act.trail": "Read the full trail",

      "ac2.mine.head": "You prepared this one",
      "ac2.mine.body": "You created {id} on {date}. Somebody else has to release it. Two people at this entity hold the permission and can: {a} and {b}.",
      "ac2.mine.alone": "If you were the only holder, Naveya would refuse the release rather than let it through. There is no emergency path.",
      "ac2.mine.ask": "Ask one of them to look",

      "ac2.stale.head": "The ground moved under this one",
      "ac2.stale.body": "{who} submitted this on {sub}. On {when} a pay revision effective 1 July was recorded against two of the three. These amounts are the old ones.",
      "ac2.stale.action": "Send it back to be recomputed",

      "ac2.conf.head": "Read this back before you release it",
      "ac2.conf.type": "What it is",
      "ac2.conf.period": "Period",
      "ac2.conf.amount": "Amount",
      "ac2.conf.heads": "People",
      "ac2.conf.maker": "Prepared by",
      "ac2.conf.entity": "Entity",
      "ac2.conf.irrev": "The release point. It cannot be undone \u2014 a mistake is corrected by a compensating action, itself checked by a second person.",
      "ac2.conf.pwd": "Your password",
      "ac2.conf.pwdHint": "Naveya asks again at the moment of release. The release is recorded against your name, with the time and the figure.",
      "ac2.conf.periodErr": "Type the period exactly as it is shown, so the release cannot be a slip of the hand.",
      "ac2.conf.pwdErr": "Enter your password to release this.",
      "ac2.conf.go": "Yes, release it",
      "ac2.conf.cancel": "Not yet",

      "ac2.send.head": "Send it back to {who}",
      "ac2.send.hint": "{who} sees exactly what you write. Say what to change, not just that something is wrong.",
      "ac2.send.ph": "For example: two claims carry the same receipt number — check claim 11 and claim 17.",
      "ac2.send.go": "Send it back",
      "ac2.send.cancel": "Keep it here",

      "ac2.done.approved": "Released by {who} on {date}",
      "ac2.done.approvedNote": "Prepared by {maker}, released by {checker} — two different people, which is the whole point.",
      "ac2.done.sentBack": "Sent back to {who} on {date}",
      "ac2.done.reason": "Reason given",
      "ac2.done.resub": "It came back as {id} and is in the queue above.",
      "ac2.done.noUndo": "A decision is never edited or removed. It stays on the record, and a change of mind is a new action on top of it.",
      "ac2.done.inRun": "Posted inside run {run}, so it is already in the gross that run pays.",

      "ac2.trail.title": "Everything that happened to it",
      "ac2.trail.created": "Prepared",
      "ac2.trail.submitted": "Signed and submitted for a second person",
      "ac2.trail.locked": "Locked",
      "ac2.trail.stale": "Flagged as out of date",
      "ac2.trail.approved": "Released",
      "ac2.trail.sentBack": "Sent back",

      "ac2.toast.released": "{id} released. {who} has been told, and the payment moves on the schedule the item carries.",
      "ac2.toast.sent": "{id} is back with {who}, with your reason attached.",

      /* ============ AC-03 · liability and reconciliation ============ */
      "ac3.campusAll": "Both campuses",
      "ac3.crumb": "Liability",
      "ac3.title": "What we owe, and whether it matches",

      "ac3.recon.computed": "Computed by the run",
      "ac3.recon.computedNote": "Summed from every statutory contribution the {period} run produced.",
      "ac3.recon.paid": "Deposited",
      "ac3.recon.paidNote": "Challans recorded against this period.",
      "ac3.recon.filed": "Declared in a return",
      "ac3.recon.filedNote": "The part a filed return has already declared.",
      "ac3.recon.out": "Still to deposit",
      "ac3.recon.balanced": "Balanced — computed, deposited and declared agree.",
      "ac3.recon.run": "Reconcile this period again",
      "ac3.recon.at": "Last reconciled {date} at 09:38 by {who}.",
      "ac3.recon.busy": "Recomputing the position from the contributions and the recorded payments…",
      "ac3.recon.noPay": "Nothing has been deposited for this period, so the whole liability is outstanding. Not a variance \u2014 simply unpaid.",
      "ac3.recon.outNote": "Part deposited, part not. The list beside this one names every head.",

      "ac3.var.title": "Where the three do not agree",
      "ac3.var.short": "{head} — deposited {paid} against {payable}",
      "ac3.var.shortAmt": "Short by {amt}",
      "ac3.var.unpaid": "{head} — nothing deposited yet",
      "ac3.var.due": "Due {date}",
      "ac3.var.late": "{n} days late",
      "ac3.var.reason": "Recorded reason",
      "ac3.var.r.esi": "Two staff crossed into coverage after the challan was prepared.",
      "ac3.var.r.pt": "Three June joiners were added to the state register after the challan.",
      "ac3.var.r.tg": "The Hyderabad enrolment certificate arrived late; no challan was raised.",
      "ac3.var.none.head": "Nothing is out of line",
      "ac3.var.none.body": "Every head was computed, deposited and declared at the same figure.",
      "ac3.var.fix": "Record a payment against it",

      "ac3.grp.title": "Head by head",
      "ac3.grp.sub": "Every line is an amount, and every amount names the configuration version it was computed on.",
      "ac3.col.line": "Line",
      "ac3.col.computed": "Computed",
      "ac3.col.paid": "Deposited",
      "ac3.col.filed": "Declared",
      "ac3.col.diff": "Difference",
      "ac3.grp.sub.total": "{head} total",
      "ac3.grp.grand": "All heads",
      "ac3.grp.notDue": "Not due in this period",
      "ac3.grp.aria": "Actions for {head}",
      "ac3.grp.act.pay": "Record a payment or challan",
      "ac3.grp.act.payWhy": "There is nothing outstanding under this head.",
      "ac3.grp.act.drill": "Show the payslips behind this figure",
      "ac3.grp.act.correct": "Correct a recorded challan",
      "ac3.pay.modalSub": "A challan recorded against this head. What is typed here is what the bank and the portal must agree with.",
      "ac3.pay.done.sub": "On the record, with your name and the time.",
      "ac3.corr.title": "Correct the {head} challan",
      "ac3.corr.close": "Close",
      "ac3.corr.sub": "A correction supersedes the entry; it does not replace it. Both stay, and the reason tells them apart a year from now.",
      "ac3.corr.onRecord": "On record now",
      "ac3.corr.keeps": "This entry stays, with whoever recorded it and when. The correction is written beside it.",
      "ac3.corr.ref": "Corrected challan number",
      "ac3.corr.when": "Corrected date",
      "ac3.corr.amount": "Corrected amount",
      "ac3.corr.why": "Why it is being corrected",
      "ac3.corr.whyHint": "Required. A figure that moved with no stated cause is the first thing an auditor asks about.",
      "ac3.corr.whyPick": "Choose a reason",
      "ac3.corr.r1": "The challan number was typed wrongly",
      "ac3.corr.r2": "The bank debited a different amount",
      "ac3.corr.r3": "It was recorded against the wrong head",
      "ac3.corr.r4": "The deposit date on the receipt differs",
      "ac3.corr.settles": "With this correction the head balances — nothing is left outstanding.",
      "ac3.corr.leaves": "This correction leaves {v} {word}. The variance is named, not reconciled away.",
      "ac3.corr.short": "still to deposit",
      "ac3.corr.over": "deposited beyond the liability",
      "ac3.corr.go": "Record the correction",
      "ac3.corr.cancel": "Leave it as it is",
      "ac3.corr.done.head": "The correction is on the record",
      "ac3.corr.done.sub": "Append-only: the earlier entry was not removed.",
      "ac3.corr.done.body": "{old} is superseded by {ref} at {amt} \u2014 {why}. Recorded by {who}. The filing that cites it will show both.",
      "ac3.grp.act.correctWhy": "No challan has been recorded under this head yet.",
      "ac3.grp.correctNote": "A correction supersedes the earlier entry; the earlier entry stays on the record with the reason and your name.",

      "ac3.drill.title": "The payslips behind {head}",
      "ac3.drill.sub": "Provenance, not a report. {n} payslips contribute to this figure; the four largest are shown.",
      "ac3.drill.subOne": "Provenance, not a report. {n} of the {of} payslips behind this figure are at {campus}. The figure itself is the establishment\u2019s \u2014 one challan, under one code.",
      "ac3.drill.col.who": "Staff",
      "ac3.drill.col.uan": "Member number",
      "ac3.drill.col.base": "On wages of",
      "ac3.drill.col.amt": "Contribution",
      "ac3.drill.mask": "Member and account numbers are shown to the last four digits only, here and everywhere else.",
      "ac3.drill.close": "Close",

      "ac3.pay.title": "Record a payment against {head}",
      "ac3.pay.challan": "Challan or reference number",
      "ac3.pay.challanHint": "Exactly as the portal or the bank issued it. It goes on the filing.",
      "ac3.pay.date": "Date deposited",
      "ac3.pay.amount": "Amount deposited",
      "ac3.pay.amountHint": "Prefilled with what is outstanding. Change it if the challan was for a different figure.",
      "ac3.pay.mode": "How it was paid",
      "ac3.pay.mode.net": "Internet banking",
      "ac3.pay.mode.neft": "Bank transfer",
      "ac3.pay.mode.cheque": "Cheque",
      "ac3.pay.variance": "This is {diff} against the {payable} outstanding. It will be recorded as a variance with your name on it, not quietly reconciled.",
      "ac3.pay.errChallan": "A challan number is required. A payment with no reference cannot be tied to a filing.",
      "ac3.pay.errAmount": "Enter the amount that was actually deposited.",
      "ac3.pay.go": "Send it for a second check",
      "ac3.pay.cancel": "Cancel",
      "ac3.pay.checkNote": "Recording a payment is itself checked \u2014 a payment that did not happen would hide a default.",
      "ac3.pay.done.head": "Recorded, and waiting for a second person",
      "ac3.pay.done.body": "{amt} against {head}, challan {ref}, submitted by you on {date}. It clears the liability only once another approver signs it.",
      "ac3.pay.done.go": "See it on the approval gate",

      "ac3.carry.title": "Carried from earlier periods",
      "ac3.carry.body": "{head} for {period} is still outstanding, {late}.",
      "ac3.carry.go": "Open June 2026",
      "ac3.carry.none": "Nothing is outstanding from any earlier period.",
      "ac3.carry.total": "Carried outstanding",

      "ac3.cfg.title": "What these figures were computed on",
      "ac3.cfg.body": "The {period} run computed on {v}, from {d}. The PF arrears line recomputed on {v2}, the version in force in its own month.",
      "ac3.cfg.chip": "on {v}",

      "ac3.export": "Export the reconciliation",
      "ac3.export.aria": "Export options",
      "ac3.export.csv": "Comma-separated file",
      "ac3.export.pdf": "Audit-ready document",
      "ac3.export.note": "Every export is recorded against your name, with what you exported and when.",
      "ac3.export.done": "Exported. Recorded against your name at 09:41.",

      "ac3.empty.head": "This entity had no payroll in {period}",
      "ac3.empty.body": "Sunrise Foundation was registered on 1 July 2026 and its first run was July. There is nothing to reconcile before that.",
      "ac3.empty.go": "Open July 2026",
    },

    /* ---------------- हिंदी — same keys, same order ---------------- */
  });

  /* ============================================================
     WHO IS SIGNED IN, AND WHAT THEY CARRY

     Rajiv Menon is pages/payroll.jsx's checker, staff id and permission
     included, so the run Sunita submits there is recognisably the run he
     releases here. His approve capability is scoped to ONE legal entity —
     which is what lets AC-02 show the difference between
       "absent, because you never carry this right here"  and
       "present but refused, because you carry it and this instance
        forbids YOU".
     ============================================================ */
  const ME = { key: "ac.p.rajiv", roleKey: "ac.p.rajiv.role", id: "NAV-0009", scope: "trust", perm: "statutory.file" };
  const SUNITA = { key: "ac.p.sunita", roleKey: "ac.p.sunita.role", id: "NAV-0031", perm: "payroll.run" };
  const KAVITA = { key: "ac.p.kavita", roleKey: "ac.p.kavita.role", id: "NAV-0007", perm: "people.manage" };
  const NANDINI = { key: "ac.p.nandini", roleKey: "ac.p.nandini.role", id: "NAV-0104" };
  const PRIYA = { key: "ac.p.priya", roleKey: "ac.p.priya.role", id: "NAV-0002" };
  const PERM_APPROVE = "payroll.approve";
  const PERM_FILE = "statutory.file";
  /* the capabilities this session holds, and where. A capability the
     session does not hold at an item's entity makes the control ABSENT. */
  const MY_CAPS = [
    { perm: PERM_APPROVE, entity: "trust" },
    { perm: PERM_FILE, entity: "trust" },
  ];
  function iHold(perm, entity) {
    return MY_CAPS.some((cap) => cap.perm === perm && cap.entity === entity);
  }

  /* today, in the same timeline as pages/payroll.jsx and payslips.jsx:
     PR-2026-08 was prepared on 8 August and signed on 9 August, and is
     still waiting for a second person. */
  const TODAY = "2026-08-12";

  const CFG_APR = { v: "v2026.2", fromEn: "1 April 2026", fromHi: "1 अप्रैल 2026" };
  const CFG_JUL = { v: "v2026.3", fromEn: "1 July 2026", fromHi: "1 जुलाई 2026" };
  const CFG_SEP = { v: "v2026.4", fromEn: "1 September 2026", fromHi: "1 सितंबर 2026" };
  function cfgFrom(cfg) { return cfg.fromEn; }

  const ENTITIES = [
    { key: "trust", nameKey: "ac.ent.trust" },
    { key: "found", nameKey: "ac.ent.found" },
  ];
  const PERIODS = ["2026-07", "2026-06"];

  /* ============================================================
     6.10 StatutoryContribution, rolled to the period. Every line is an
     AMOUNT and names the config version it was computed on. Not one
     rate, ceiling, slab or percentage appears here or in the copy —
     a number invented in a mock is a number that gets implemented.
     ============================================================ */
  const CONTRIB = [
    /* --- Sunrise Education Trust · July 2026 (run PR-2026-07) --- */
    { e: "trust", p: "2026-07", k: "pf", line: "ac.l.pf.emp", v: 1672400.0, cfg: CFG_JUL },
    { e: "trust", p: "2026-07", k: "pf", line: "ac.l.pf.er", v: 787800.0, cfg: CFG_JUL },
    { e: "trust", p: "2026-07", k: "pf", line: "ac.l.pf.eps", v: 884600.0, cfg: CFG_JUL },
    { e: "trust", p: "2026-07", k: "pf", line: "ac.l.pf.edli", v: 26180.0, cfg: CFG_JUL },
    { e: "trust", p: "2026-07", k: "pf", line: "ac.l.pf.adm", v: 33450.0, cfg: CFG_JUL },
    { e: "trust", p: "2026-07", k: "pf", line: "ac.l.pf.arr", v: 41880.0, cfg: CFG_APR, prior: true },
    { e: "trust", p: "2026-07", k: "esi", line: "ac.l.esi.emp", v: 41220.0, cfg: CFG_JUL },
    { e: "trust", p: "2026-07", k: "esi", line: "ac.l.esi.er", v: 134050.0, cfg: CFG_JUL },
    { e: "trust", p: "2026-07", k: "pt", line: "ac.l.pt.ka", v: 76600.0, cfg: CFG_JUL, st: "ka" },
    { e: "trust", p: "2026-07", k: "pt", line: "ac.l.pt.tg", v: 5000.0, cfg: CFG_JUL, st: "tg" },
    { e: "trust", p: "2026-07", k: "tds", line: "ac.l.tds.192", v: 3358940.0, cfg: CFG_JUL },
    { e: "trust", p: "2026-07", k: "lwf", line: "ac.l.lwf.ka", v: 7660.0, cfg: CFG_JUL, st: "ka" },
    { e: "trust", p: "2026-07", k: "lwf", line: "ac.l.lwf.tg", v: 0.0, cfg: CFG_JUL, st: "tg", notDue: true },

    /* --- Sunrise Education Trust · June 2026 (run PR-2026-06) --- */
    { e: "trust", p: "2026-06", k: "pf", line: "ac.l.pf.emp", v: 1658200.0, cfg: CFG_APR },
    { e: "trust", p: "2026-06", k: "pf", line: "ac.l.pf.er", v: 780900.0, cfg: CFG_APR },
    { e: "trust", p: "2026-06", k: "pf", line: "ac.l.pf.eps", v: 877300.0, cfg: CFG_APR },
    { e: "trust", p: "2026-06", k: "pf", line: "ac.l.pf.edli", v: 25940.0, cfg: CFG_APR },
    { e: "trust", p: "2026-06", k: "pf", line: "ac.l.pf.adm", v: 33160.0, cfg: CFG_APR },
    { e: "trust", p: "2026-06", k: "esi", line: "ac.l.esi.emp", v: 40880.0, cfg: CFG_APR },
    { e: "trust", p: "2026-06", k: "esi", line: "ac.l.esi.er", v: 132910.0, cfg: CFG_APR },
    { e: "trust", p: "2026-06", k: "pt", line: "ac.l.pt.ka", v: 75800.0, cfg: CFG_APR, st: "ka" },
    { e: "trust", p: "2026-06", k: "pt", line: "ac.l.pt.tg", v: 4800.0, cfg: CFG_APR, st: "tg" },
    { e: "trust", p: "2026-06", k: "tds", line: "ac.l.tds.192", v: 3321460.0, cfg: CFG_APR },
    { e: "trust", p: "2026-06", k: "lwf", line: "ac.l.lwf.ka", v: 7600.0, cfg: CFG_APR, st: "ka" },
    { e: "trust", p: "2026-06", k: "lwf", line: "ac.l.lwf.tg", v: 0.0, cfg: CFG_APR, st: "tg", notDue: true },

    /* --- Sunrise Foundation (Pre-school) · July 2026, its first run --- */
    { e: "found", p: "2026-07", k: "pf", line: "ac.l.pf.emp", v: 41400.0, cfg: CFG_JUL },
    { e: "found", p: "2026-07", k: "pf", line: "ac.l.pf.er", v: 19480.0, cfg: CFG_JUL },
    { e: "found", p: "2026-07", k: "pf", line: "ac.l.pf.eps", v: 21920.0, cfg: CFG_JUL },
    { e: "found", p: "2026-07", k: "pf", line: "ac.l.pf.edli", v: 660.0, cfg: CFG_JUL },
    { e: "found", p: "2026-07", k: "pf", line: "ac.l.pf.adm", v: 840.0, cfg: CFG_JUL },
    { e: "found", p: "2026-07", k: "esi", line: "ac.l.esi.emp", v: 1240.0, cfg: CFG_JUL },
    { e: "found", p: "2026-07", k: "esi", line: "ac.l.esi.er", v: 4030.0, cfg: CFG_JUL },
    { e: "found", p: "2026-07", k: "pt", line: "ac.l.pt.ka", v: 3600.0, cfg: CFG_JUL, st: "ka" },
    { e: "found", p: "2026-07", k: "tds", line: "ac.l.tds.192", v: 18400.0, cfg: CFG_JUL },
    { e: "found", p: "2026-07", k: "lwf", line: "ac.l.lwf.ka", v: 360.0, cfg: CFG_JUL, st: "ka" },
  ];

  /* Recorded challans. `filed` means a return has DECLARED it, which is
     not the same as having deposited it — that gap is the third number
     AC-03 exists to show. */
  const PAYMENTS = [
    { e: "trust", p: "2026-07", k: "tds", v: 3358940.0, on: "2026-08-07", ref: "CIN 0510308-07082026-00194", filed: false },
    { e: "trust", p: "2026-07", k: "esi", v: 173900.0, on: "2026-08-11", ref: "ESIC 51000123450008-2607", filed: true, shortKey: "ac3.var.r.esi" },
    { e: "trust", p: "2026-07", k: "lwf", v: 7660.0, on: "2026-08-11", ref: "KA-LWF/2026-07/2218", filed: true },

    { e: "trust", p: "2026-06", k: "pf", v: 3375500.0, on: "2026-07-14", ref: "ECR 4471120260614", filed: true },
    { e: "trust", p: "2026-06", k: "esi", v: 173790.0, on: "2026-07-12", ref: "ESIC 51000123450007-2606", filed: true },
    { e: "trust", p: "2026-06", k: "pt", v: 74100.0, on: "2026-07-18", ref: "KA-PT/2026-06/44821", filed: true, shortKey: "ac3.var.r.pt", st: "ka" },
    { e: "trust", p: "2026-06", k: "tds", v: 3321460.0, on: "2026-07-07", ref: "CIN 0510308-07072026-00171", filed: true },
    { e: "trust", p: "2026-06", k: "lwf", v: 7600.0, on: "2026-07-12", ref: "KA-LWF/2026-06/2181", filed: true },

    { e: "found", p: "2026-07", k: "tds", v: 18400.0, on: "2026-08-07", ref: "CIN 0510308-07082026-00195", filed: false },
    { e: "found", p: "2026-07", k: "esi", v: 5270.0, on: "2026-08-11", ref: "ESIC 51000987650008-2607", filed: true },
    { e: "found", p: "2026-07", k: "lwf", v: 360.0, on: "2026-08-11", ref: "KA-LWF/2026-07/2219", filed: true },
  ];

  const HEADS = ["pf", "esi", "pt", "tds", "lwf"];
  const HEAD_LABEL = { pf: "ac.k.pf", esi: "ac.k.esi", pt: "ac.k.pt", tds: "ac.k.tds", lwf: "ac.k.lwf" };
  const HEAD_CONS = { pf: "ac.cons.ecr", esi: "ac.cons.esi", pt: "ac.cons.pt", tds: "ac.cons.tds", lwf: "ac.cons.lwf" };

  const sumV = (rows) => rows.reduce((s, r) => s + r.v, 0);
  function contribOf(e, p, k) { return CONTRIB.filter((r) => r.e === e && r.p === p && (k == null || r.k === k)); }
  function paymentsOf(e, p, k) { return PAYMENTS.filter((r) => r.e === e && r.p === p && (k == null || r.k === k)); }
  function payableOf(e, p, k) { return sumV(contribOf(e, p, k)); }
  function paidOf(e, p, k) { return sumV(paymentsOf(e, p, k)); }
  function filedOf(e, p, k) { return sumV(paymentsOf(e, p, k).filter((r) => r.filed)); }
  function outstandingOf(e, p, k) { return payableOf(e, p, k) - paidOf(e, p, k); }
  function hasData(e, p) { return contribOf(e, p).length > 0; }

  /* ============================================================
     6.10 StatutoryFiling rows. `amountFn` reads the liability rather
     than carrying its own copy of it, so the calendar and the
     reconciliation can never drift apart.
     ============================================================ */
  const FILINGS = [
    { id: "f-pt-tg-06", kindKey: "ac.f.pt", stKey: "ac.st.tg", e: "trust", p: "2026-06", due: "2026-07-20",
      k: "pt", stateFilter: "tg", consKey: "ac.cons.pt", amountFn: () => 4800.0, periodReady: true },
    { id: "f-ecr-07", kindKey: "ac.f.ecr", e: "trust", p: "2026-07", due: "2026-08-15",
      k: "pf", consKey: "ac.cons.ecr", amountFn: () => outstandingOf("trust", "2026-07", "pf"), periodReady: true },
    { id: "f-ecr-07-f", kindKey: "ac.f.ecr", e: "found", p: "2026-07", due: "2026-08-15",
      k: "pf", consKey: "ac.cons.ecr", amountFn: () => outstandingOf("found", "2026-07", "pf"), periodReady: true },
    { id: "f-esi-07", kindKey: "ac.f.esi", e: "trust", p: "2026-07", due: "2026-08-15", filedOn: "2026-08-11",
      k: "esi", consKey: "ac.cons.esi", amountFn: () => paidOf("trust", "2026-07", "esi"),
      shortFn: () => outstandingOf("trust", "2026-07", "esi"), periodReady: true },
    { id: "f-esi-07-f", kindKey: "ac.f.esi", e: "found", p: "2026-07", due: "2026-08-15", filedOn: "2026-08-11",
      k: "esi", consKey: "ac.cons.esi", amountFn: () => paidOf("found", "2026-07", "esi"), periodReady: true },
    { id: "f-pt-ka-07", kindKey: "ac.f.pt", stKey: "ac.st.ka", e: "trust", p: "2026-07", due: "2026-08-20",
      k: "pt", stateFilter: "ka", consKey: "ac.cons.pt", amountFn: () => 76600.0, periodReady: true },
    { id: "f-pt-tg-07", kindKey: "ac.f.pt", stKey: "ac.st.tg", e: "trust", p: "2026-07", due: "2026-08-20",
      k: "pt", stateFilter: "tg", consKey: "ac.cons.pt", amountFn: () => 5000.0, periodReady: true },
    { id: "f-pt-ka-07-f", kindKey: "ac.f.pt", stKey: "ac.st.ka", e: "found", p: "2026-07", due: "2026-08-20",
      k: "pt", stateFilter: "ka", consKey: "ac.cons.pt", amountFn: () => 3600.0, periodReady: true },
    { id: "f-24q-q2", kindKey: "ac.f.24q", e: "trust", pLabelKey: "ac.f.q2", p: "2026-07", due: "2026-10-31",
      k: "tds", consKey: "ac.cons.24q", amountFn: () => paidOf("trust", "2026-07", "tds"), periodReady: false },
    { id: "f-tds-07", kindKey: "ac.f.tds", e: "trust", p: "2026-07", due: "2026-08-07", filedOn: "2026-08-07",
      k: "tds", consKey: "ac.cons.tds", amountFn: () => paidOf("trust", "2026-07", "tds"), periodReady: true },
    { id: "f-tds-07-f", kindKey: "ac.f.tds", e: "found", p: "2026-07", due: "2026-08-07", filedOn: "2026-08-07",
      k: "tds", consKey: "ac.cons.tds", amountFn: () => paidOf("found", "2026-07", "tds"), periodReady: true },
    { id: "f-lwf-07", kindKey: "ac.f.lwf", stKey: "ac.st.ka", e: "trust", p: "2026-07", due: "2026-08-15", filedOn: "2026-08-11",
      k: "lwf", consKey: "ac.cons.lwf", amountFn: () => paidOf("trust", "2026-07", "lwf"), periodReady: true },
    { id: "f-16-2526", kindKey: "ac.f.16", e: "trust", pLabelKey: "ac.f.fy2526", p: "2026-06", due: "2026-06-15", filedOn: "2026-06-12",
      k: "tds", consKey: "ac.cons.16", amountFn: () => null, periodReady: true },
    { id: "f-ecr-06", kindKey: "ac.f.ecr", e: "trust", p: "2026-06", due: "2026-07-15", filedOn: "2026-07-14",
      k: "pf", consKey: "ac.cons.ecr", amountFn: () => paidOf("trust", "2026-06", "pf"), periodReady: true },
    { id: "f-pt-ka-06", kindKey: "ac.f.pt", stKey: "ac.st.ka", e: "trust", p: "2026-06", due: "2026-07-20", filedOn: "2026-07-18",
      k: "pt", stateFilter: "ka", consKey: "ac.cons.pt", amountFn: () => 74100.0,
      shortFn: () => 75800.0 - 74100.0, periodReady: true },
  ];

  /* ---------- dates, days and the due state ---------- */
  function parseISO(s) { const a = s.split("-"); return new Date(Number(a[0]), Number(a[1]) - 1, Number(a[2])); }
  function fmtDate(t, iso) {
    const d = parseISO(iso);
    return t("ac.date", { d: d.getDate(), mon: t("ac.mon." + (d.getMonth() + 1)), y: d.getFullYear() });
  }
  function daysUntil(iso) {
    const ms = parseISO(iso).getTime() - parseISO(TODAY).getTime();
    return Math.round(ms / 86400000);
  }
  /* A filing is one of: filed · short paid (filed, but not for the whole
     liability) · overdue · due soon · not due yet. Never colour alone —
     each carries a glyph, a word AND a count of days. */
  function dueState(f) {
    const short = f.shortFn ? f.shortFn() : 0;
    if (f.filedOn) return { key: short > 0.005 ? "short" : "filed", days: null, short: short, open: short > 0.005 };
    const d = daysUntil(f.due);
    if (d < 0) return { key: "overdue", days: -d, short: 0, open: true };
    return { key: d <= 10 ? "soon" : "later", days: d, short: 0, open: true };
  }
  const DUE_ROLE = { filed: "present", short: "late", overdue: "absent", soon: "late", later: "off" };
  const DUE_GLYPH = { filed: "check", short: "alert", overdue: "alert", soon: "clock", later: "arrow" };
  function dueWords(t, f, s) {
    if (s.key === "filed") return t("ac.due.filedOn", { date: fmtDate(t, f.filedOn) });
    if (s.key === "short") return t("ac.due.shortBy", { amt: inr(s.short) });
    if (s.key === "overdue") return t("ac.due.daysLate", { n: num(s.days) });
    if (s.key === "soon") return t("ac.due.daysLeft", { n: num(s.days) });
    return t("ac.due.daysAway", { n: num(s.days) });
  }
  const DUE_ORDER = { overdue: 0, soon: 1, short: 2, later: 3, filed: 4 };
  function sortedFilings() {
    return FILINGS.slice().sort((a, b) => {
      const sa = dueState(a), sb = dueState(b);
      if (DUE_ORDER[sa.key] !== DUE_ORDER[sb.key]) return DUE_ORDER[sa.key] - DUE_ORDER[sb.key];
      return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
    });
  }
  const OVERDUE = FILINGS.filter((f) => dueState(f).key === "overdue");

  /* ============================================================
     AC-02 · THE ONE QUEUE

     Run PR-2026-08's money is rebuilt from the SAME component
     aggregates pages/payroll.jsx sums its console from — the same
     component codes, the same amounts, per pay group. Nothing is a
     typed total, so the run console and the gate cannot disagree.
     ============================================================ */
  const RUN_GROUPS = [
    { key: "teach", heads: 268,
      earn: [9742500.0, 1948500.0, 4871250.0, 5206800.0, 1637400.0, 186400.0],
      ded: [1286400.0, 53600.0, 2914300.0, 148000.0],
      emp: [1286400.0, 5360.0] },
    { key: "admin", heads: 121,
      earn: [3146000.0, 629200.0, 1573000.0, 1290600.0, 302500.0],
      ded: [402600.0, 41830.0, 24200.0, 431750.0, 62500.0],
      emp: [402600.0, 136000.0, 2420.0] },
    { key: "visit", heads: 23,
      earn: [487200.0],
      ded: [4600.0, 48720.0],
      emp: [] },
  ];
  const addAll = (a) => a.reduce((s, n) => s + n, 0);
  const RUN_GROSS = addAll(RUN_GROUPS.map((g) => addAll(g.earn)));
  const RUN_DED = addAll(RUN_GROUPS.map((g) => addAll(g.ded)));
  const RUN_NET = RUN_GROSS - RUN_DED;
  const RUN_EMPLOYER = addAll(RUN_GROUPS.map((g) => addAll(g.emp)));
  const RUN_HEADS = addAll(RUN_GROUPS.map((g) => g.heads));
  /* two payouts held on the run console, each with a reason and the
     name of whoever placed it — the gate states the count, never the
     people's bank details */
  const RUN_HOLDS = [61240.0, 47860.0];
  const RUN_HELD = addAll(RUN_HOLDS);
  const RUN_PAYABLE = RUN_NET - RUN_HELD;
  const RUN_PAYEES = RUN_HEADS - RUN_HOLDS.length;
  const PREV_RUN_PAYABLE = 25206900.0;   /* July's disbursed net, PR-2026-07 */

  /* ---- the Indiranagar slice of the August run -------------------
     A run belongs to one campus (PY-07), so the item in this gate is
     PR-2026-08-IND. Its money is each pay group's split on head count,
     with Indiranagar taking the remainder -- the same rule and the
     same numbers pages/py-run.jsx renders, so the two desks cannot
     quote different figures for the same run. */
  const IND_HEADS = { teach: 164, admin: 74, visit: 15 };
  function indOf(pick) {
    return RUN_GROUPS.reduce(function (sum, g) {
      const v = addAll(pick(g));
      return sum + (v - Math.round(v * (g.heads - IND_HEADS[g.key]) / g.heads));
    }, 0);
  }
  const IND_GROSS = indOf(function (g) { return g.earn; });
  const IND_DED = indOf(function (g) { return g.ded; });
  const IND_EMPLOYER = indOf(function (g) { return g.emp; });
  const IND_HEADCOUNT = IND_HEADS.teach + IND_HEADS.admin + IND_HEADS.visit;
  /* both holds on the run console are Indiranagar staff */
  const IND_HELD = RUN_HELD;
  const IND_PAYABLE = IND_GROSS - IND_DED - IND_HELD;
  const IND_PAYEES = IND_HEADCOUNT - RUN_HOLDS.length;
  /* a contribution has no pay-group dimension in this seed, so a
     campus's share of it is its share of the WAGES it is computed on */
  const IND_WAGE_SHARE = IND_GROSS / RUN_GROSS;
  function indStat(v) { return v ? Math.round(v * IND_WAGE_SHARE) : v; }
  const PREV_IND_PAYABLE = PREV_RUN_PAYABLE - Math.round(PREV_RUN_PAYABLE * (412 - IND_HEADCOUNT) / 412);

  /* the August run's statutory lines, in the same shape AC-03 reads a
     period in. Employee-side statutory + loans = the run's deductions,
     which is asserted by a check at the bottom of this file. */
  const RUN_STAT = [
    { k: "pf", emp: 1689000.0, er: 1689000.0 },
    { k: "esi", emp: 41830.0, er: 136000.0 },
    { k: "pt", emp: 82400.0, er: 0.0 },
    { k: "tds", emp: 3394770.0, er: 0.0 },
    { k: "lwf", emp: 0.0, er: 7780.0 },
  ];
  const RUN_STAT_EMP = addAll(RUN_STAT.map((r) => r.emp));
  const RUN_STAT_ER = addAll(RUN_STAT.map((r) => r.er));
  const RUN_LOANS = RUN_DED - RUN_STAT_EMP;

  const RUN_VAR = [
    { causeKey: "ac2.var.joiner", n: 1 }, { causeKey: "ac2.var.leaver", n: 1 },
    { causeKey: "ac2.var.lop", n: 1 }, { causeKey: "ac2.var.revision", n: 1 },
    { causeKey: "ac2.var.loan", n: 1 }, { causeKey: "ac2.var.decl", n: 1 },
  ];

  /* pages/payroll.jsx's REIMB: 31 claims, 268,450.00, outside the run */
  const CLAIMS = [
    { key: "ac2.claims.lta", n: 5, v: 89400.0 },
    { key: "ac2.claims.med", n: 9, v: 62300.0 },
    { key: "ac2.claims.tel", n: 6, v: 27150.0 },
    { key: "ac2.claims.books", n: 7, v: 61200.0 },
    { key: "ac2.claims.fuel", n: 4, v: 28400.0 },
  ];
  const CLAIM_TOTAL = sumV(CLAIMS.map((r) => ({ v: r.v })));
  const CLAIM_COUNT = CLAIMS.reduce((s, r) => s + r.n, 0);

  const LOAN = { principal: 200000.0, emi: 8900.0, months: 24 };
  const LOAN_TOTAL = LOAN.emi * LOAN.months;
  const LOAN_INTEREST = LOAN_TOTAL - LOAN.principal;

  /* the arrears already POSTED into PR-2026-08 (its ARREAR earnings
     line, 186,400.00 over four people) — a decided item, not a pending
     one, because payroll.jsx already carries it inside the gross */
  const ARR_DONE = [
    { m: 4, v: 42300.0, cfg: CFG_APR }, { m: 5, v: 45800.0, cfg: CFG_APR },
    { m: 6, v: 48200.0, cfg: CFG_APR }, { m: 7, v: 50100.0, cfg: CFG_JUL },
  ];
  const ARR_DONE_TOTAL = sumV(ARR_DONE);
  /* the arrears that went stale after submission */
  const ARR_STALE = [
    { m: 6, v: 28400.0, cfg: CFG_APR }, { m: 7, v: 32100.0, cfg: CFG_JUL },
    { m: 8, v: 33700.0, cfg: CFG_JUL },
  ];
  const ARR_STALE_TOTAL = sumV(ARR_STALE);

  const BONUS = [
    { campusKey: "ac2.bonus.c.indira", n: 214, v: 816200.0 },
    { campusKey: "ac2.bonus.c.white", n: 149, v: 568400.0 },
    { campusKey: "ac2.bonus.c.hyd", n: 26, v: 101800.0 },
  ];
  const BONUS_TOTAL = sumV(BONUS);
  const BONUS_ELIGIBLE = BONUS.reduce((s, r) => s + r.n, 0);
  const BONUS_EXCLUDED = RUN_HEADS - BONUS_ELIGIBLE;

  const FF = [
    { key: "ac2.ff.pending", v: 62400.0 },
    { key: "ac2.ff.encash", v: 138600.0 },
    { key: "ac2.ff.gratuity", v: 284600.0 },
    { key: "ac2.ff.notice", v: 0.0, noteKey: "ac2.ff.noticeNone" },
    { key: "ac2.ff.loan", v: -48200.0 },
    { key: "ac2.ff.tds", v: -19540.0 },
  ];
  const FF_NET = sumV(FF);

  /* the Foundation's own August run — a legitimate item this session can
     READ but never release, because the approve capability is scoped to
     the other legal entity. Approve is ABSENT on it, not disabled. */
  const FRUN = { gross: 984600.0, ded: 148300.0, heads: 18 };
  const FRUN_NET = FRUN.gross - FRUN.ded;

  const QUEUE = [
    { id: "PR-2026-08-IND", type: "run", state: "pending", e: "trust", p: "2026-07", perm: PERM_APPROVE,
      periodCode: "2026-08", periodKey: "ac.mon.8", maker: SUNITA, submitted: "2026-08-09", created: "2026-08-08",
      whoId: null, campusKey: "indiranagar",
      total: IND_PAYABLE, heads: IND_HEADCOUNT, payees: IND_PAYEES, cfg: CFG_JUL,
      ev: ["reg", "var", "stat"] },
    { id: "RB-2026-08", type: "batch", state: "pending", e: "trust", perm: PERM_APPROVE,
      periodCode: "2026-08", periodKey: "ac.mon.8", maker: SUNITA, submitted: "2026-08-10", created: "2026-08-10",
      total: CLAIM_TOTAL, heads: CLAIM_COUNT, cfg: CFG_JUL, ev: ["claims"] },
    /* `whoId` is the staff number, not a campus: the campus is read off
       it, so the gate cannot disagree with the register about where
       Imran or Ritu works. An item with no whoId is the trust's. */
    { id: "LN-2026-041", type: "loan", state: "pending", e: "trust", perm: PERM_APPROVE, whoId: "NAV-0206",
      periodCode: "2026-08", periodKey: "ac.mon.8", maker: KAVITA, submitted: "2026-08-11", created: "2026-08-11",
      total: LOAN.principal, cfg: CFG_JUL, ev: ["sched"] },
    { id: "FF-2026-014", type: "ff", state: "pending", e: "trust", perm: PERM_APPROVE, whoId: "NAV-0088",
      periodCode: "2026-08", periodKey: "ac.mon.8", maker: KAVITA, submitted: "2026-08-08", created: "2026-08-07",
      total: FF_NET, cfg: CFG_JUL, ev: ["lines"] },

    { id: "BN-2026-01", type: "bonus", state: "mine", e: "trust", perm: PERM_FILE,
      periodCode: "2026-08", periodKey: "ac.mon.8", maker: ME, submitted: "2026-08-05", created: "2026-08-05",
      total: BONUS_TOTAL, heads: BONUS_ELIGIBLE, cfg: CFG_JUL, ev: ["basis"] },
    { id: "AR-2026-09", type: "arrears", state: "stale", e: "trust", perm: PERM_APPROVE,
      periodCode: "2026-09", periodKey: "ac.mon.9", maker: SUNITA, submitted: "2026-08-11", created: "2026-08-11",
      staleOn: "2026-08-12", total: ARR_STALE_TOTAL, heads: 3, cfg: CFG_JUL, ev: ["split"] },
    { id: "PR-F-2026-08", type: "run", state: "outOfScope", e: "found", perm: PERM_APPROVE,
      periodCode: "2026-08", periodKey: "ac.mon.8", maker: KAVITA, submitted: "2026-08-10", created: "2026-08-10",
      total: FRUN_NET, heads: FRUN.heads, payees: FRUN.heads, cfg: CFG_JUL, ev: ["reg"] },

    { id: "PR-2026-07", type: "run", state: "approved", e: "trust", perm: PERM_APPROVE,
      periodCode: "2026-07", periodKey: "ac.mon.7", maker: SUNITA, submitted: "2026-07-28", created: "2026-07-27",
      checker: ME, decidedOn: "2026-07-29", total: PREV_RUN_PAYABLE, heads: 408, cfg: CFG_JUL, ev: ["reg"] },
    { id: "AR-2026-08", type: "arrears", state: "approved", e: "trust", perm: PERM_APPROVE,
      periodCode: "2026-08", periodKey: "ac.mon.8", maker: SUNITA, submitted: "2026-08-06", created: "2026-08-06",
      checker: ME, decidedOn: "2026-08-07", inRun: "PR-2026-08", total: ARR_DONE_TOTAL, heads: 4,
      cfg: CFG_JUL, ev: ["split"] },
    { id: "RB-2026-07", type: "batch", state: "sentBack", e: "trust", perm: PERM_APPROVE,
      periodCode: "2026-07", periodKey: "ac.mon.7", maker: SUNITA, submitted: "2026-07-23", created: "2026-07-23",
      checker: ME, decidedOn: "2026-07-24", reasonKey: "ac2.rb.reason", resubAs: "RB-2026-08",
      total: 162400.0, heads: 19, cfg: CFG_JUL, ev: ["claims"] },
  ];
  function campusOfItem(q) {
    return q.campusKey ? q.campusKey : (q.whoId ? campusOfCode(q.whoId) : null);
  }
  const TYPE_KEY = { run: "ac2.t.run", batch: "ac2.t.batch", loan: "ac2.t.loan", arrears: "ac2.t.arrears", bonus: "ac2.t.bonus", ff: "ac2.t.ff" };
  const TYPE_ICON = { run: "payroll", batch: "payslip", loan: "briefcase", arrears: "list", bonus: "festival", ff: "signout" };
  const PENDING = QUEUE.filter((q) => q.state === "pending");
  const BLOCKED = QUEUE.filter((q) => q.state === "mine" || q.state === "stale" || q.state === "outOfScope");
  const DECIDED = QUEUE.filter((q) => q.state === "approved" || q.state === "sentBack");
  const AT_STAKE = PENDING.reduce((s, q) => s + q.total, 0);
  const OLDEST_WAIT = Math.max.apply(null, PENDING.map((q) => -daysUntil(q.submitted)));

  /* ---- copy that belongs with the data above ---- */
  addStrings({
    en: {
      "ac2.bonus.c.indira": "Indiranagar",
      "ac2.bonus.c.white": "Whitefield",
      "ac2.bonus.c.hyd": "Hyderabad",
      "ac2.rb.reason": "Two claims carry the same receipt number. Check claim 11 and claim 17 before you send it again.",
      "ac2.rsn.label": "Reason",
      "ac2.rsn.pick": "Choose a reason",
      "ac2.rsn.note": "What should the record say?",
      "ac2.rsn.errPick": "Choose a reason. It goes on the record with your name and cannot be taken off.",
      "ac2.rsn.errNote": "Write the note too. A reason code on its own does not explain a money decision.",
      "ac2.rsn.figures": "The figures do not match the evidence",
      "ac2.rsn.evidence": "The evidence is missing or incomplete",
      "ac2.rsn.period": "Wrong period, entity or scope",
      "ac2.rsn.correct": "Something in it needs correcting first",
      "ac2.rsn.stale": "Recompute — the inputs have changed",
      "ac2.out.head": "This one is not yours to release",
      "ac2.out.body": "Your approval capability is at {mine}; {id} belongs to {theirs}, so {who} releases it. You can read it because you carry the group liability.",
      "ac2.out.absent": "There is no Release control on this item, and no disabled one either. A control you can never use should not be drawn at all.",
      "ac3.n.sunil": "Sunil Prabhu",
      "ac3.n.rekha": "Rekha Iyer",
      "ac3.n.ali": "Mohd Ali Baig",
      "ac3.n.grace": "Grace Fernandes",
    },
  });

  const SEND_REASONS = ["ac2.rsn.figures", "ac2.rsn.evidence", "ac2.rsn.period", "ac2.rsn.correct", "ac2.rsn.stale"];

  /* the four largest payslips behind the provident-fund figure. Member
     numbers are masked to the last four digits, here and everywhere. */
  const DRILL = [
    { key: "ac3.n.sunil", uan: "•••• 7412", base: 94800.0, v: 5688.0, campus: "indiranagar" },
    { key: "ac3.n.rekha", uan: "•••• 2065", base: 91200.0, v: 5472.0, campus: "whitefield" },
    { key: "ac3.n.ali", uan: "•••• 8830", base: 88600.0, v: 5316.0, campus: "indiranagar" },
    { key: "ac3.n.grace", uan: "•••• 5194", base: 86400.0, v: 5184.0, campus: "indiranagar" },
  ];
  const DRILL_OF = 412;
  /* the roll split the way pages/py-ops.jsx seeds it on each pay group,
     which is where the authority for it lives. Duplicated here the way
     RUN_GROUPS is -- deliberately, and guarded by RECONCILES below. */
  const CAMPUS_HEADS = { indiranagar: 253, whitefield: 159 };

  const FF_PERSON = { key: "ac.p.ritu", id: "NAV-0088", lwd: "2026-07-31" };
  const LOAN_PERSON = { key: "ac.p.imran", id: "NAV-0206" };

  /* ---- WHO THIS ITEM PAYS ---------------------------------------
     The checker reads the MAKER'S OWN register, never a second seed
     of the same run: the gate calls the store the run console wrote
     to, so the two desks cannot quote different people -- or
     different totals -- for one payroll. Looked up on each call
     because these stores load as pages do, not before them. */
  function rollStore() { return window.NaveyaRoll || null; }
  function adjStore() { return (window.Pages3 && window.Pages3.PYAdjData) || null; }

  function peopleFor(item) {
    if (item.id === "PR-2026-08-IND") {
      const R = rollStore();
      if (!R) return null;
      return { kind: "run", rows: R.roll("indiranagar", 8) };
    }
    if (item.id === "RB-2026-08") {
      const A2 = adjStore();
      if (!A2 || !A2.CLAIMS) return null;
      return { kind: "batch", rows: A2.CLAIMS };
    }
    return null;
  }

  /* the evidence an item carries, with its people first where it has
     any. A run that lists its 253 does not also need the four-line
     ladder: the register's own total row IS that ladder. */
  function evidenceOf(item) {
    const ppl = peopleFor(item);
    if (!ppl) return item.ev;
    return ["people"].concat(item.ev.filter(function (k) { return k !== "reg"; }));
  }

  /* ============================================================
     LOCAL PRIMITIVES (promotion candidates for kit.jsx — listed in the
     report). Defined here rather than in the kit because five agents
     are writing pages in parallel and the kit is not mine this pass.
     ============================================================ */

  /* the page frame every Accountant screen shares */
  function Shell({ role, active, onNavigate, crumb, title, sub, aside, campus, onCampus, children }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    return (
      <div
        className="nv3"
        style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink,
                 fontFamily: G3.font.ui }}
      >
        <Rail role={role || "accountant"} active={active} onNavigate={onNavigate} initials="RM" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto",
                        padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{crumb}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("ac.ent.both")}</span>
                {onCampus ? <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span> : null}
                {onCampus ? <span>{campusLabel(t, campus)}</span> : null}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {onCampus ? <CampusSwitch value={campus} onChange={onCampus} /> : null}
                <ThemeToggle />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                          gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
              <div style={{ minWidth: 0, maxWidth: 760 }}>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{title}</h1>
                <p style={ty("body", { color: c.inkMuted, margin: "8px 0 0" })}>{sub}</p>
              </div>
              {aside ? <div style={{ flexShrink: 0 }}>{aside}</div> : null}
            </div>

            {children}
          </div>
        </main>
      </div>
    );
  }

  /* a label above a value — the instrument-panel unit on these screens */
  function Fact({ label, note, w, children, align }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ minWidth: w || 150, textAlign: align || "left" }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase",
                                    letterSpacing: "0.06em", marginBottom: 5 })}>{label}</div>
        <div>{children}</div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 5, maxWidth: 320 })}>{note}</div> : null}
      </div>
    );
  }

  /* label · value row, used down the money summaries */
  function DefRow({ label, note, value, strong, rule, tone, sign }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18,
                    padding: "9px 0", borderTop: rule ? "1px solid " + c.rule : "none" }}>
        <div style={{ minWidth: 0 }}>
          <span style={ty("small", { color: strong ? c.ink : c.inkMuted, fontWeight: strong ? 700 : 500 })}>
            {sign ? <span style={G3.fig("xs", { color: c.inkFaint, marginRight: 7 })}>{sign}</span> : null}
            {label}
          </span>
          {note ? <div style={ty("caption", { color: c.inkFaint, marginTop: 3, maxWidth: 420 })}>{note}</div> : null}
        </div>
        <Figure value={value} size={strong ? "md" : "sm"} weight={strong ? 700 : 500} color={tone || c.ink} />
      </div>
    );
  }

  /* the two-panel sign-off: maker on the left, checker on the right,
     both drawn from the moment the item exists. The empty checker panel
     IS the control (docs/ui-compliance-requirements.md O5). */
  /* the append-only trail is rendered at the foot of this screen, so
     the menu entry that names it moves the reader there rather than
     drawing a second copy of the same list */
  function goToTrail() {
    const el = document.getElementById("ac2-trail");
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  /* ONE FIGURE, AND THE SENTENCE THAT ACCOUNTS FOR IT -- the shape
     the run console settled on. Under it, the chain of custody as
     plain facts: who made it, who may release it, which rules it was
     computed on. Those were a card of their own with two tinted
     panels in it, saying in eighty words what three facts say. */
  function GateFact({ label, note, children }) {
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

  function Headline({ label, value, line, facts }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const live = (facts || []).filter(Boolean);
    return (
      <Card>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={G3.fig("xl", { color: c.ink, fontWeight: 700, marginTop: 5, lineHeight: 1.1 })}>{value}</div>
        {line ? <div style={ty("small", { color: c.inkMuted, marginTop: 8, maxWidth: "72ch" })}>{line}</div> : null}
        {live.length ? (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px 24px",
            marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule,
          }}>
            {live.map(function (f) {
              return <GateFact key={f.k} label={f.label} note={f.note}>{f.value}</GateFact>;
            })}
          </div>
        ) : null}
      </Card>
    );
  }

  /* THE PEOPLE. What a second person is for. */
  const PEOPLE_PAGE = 20;

  function PeopleEvidence({ data }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [q, setQ] = useState("");
    const [cut, setCut] = useState("all");
    const [shown, setShown] = useState(PEOPLE_PAGE);
    const run = data.kind === "run";

    const all = data.rows;
    /* ONE predicate, used by the chip, the column and the totals. The
       roll counts a zero-net row out of its payees, so a filter that
       knew only about holds disagreed with the headline by one. */
    const unpaid = function (r) { return !!r.heldKey || !(r.net > 0); };
    const held = run ? all.filter(unpaid) : [];
    const matches = function (r) {
      if (!q) return true;
      const hay = run ? (r.name + " " + r.id) : (t(r.personKey) + " " + r.staff + " " + r.id);
      return hay.toLowerCase().indexOf(q.toLowerCase()) !== -1;
    };
    const rows = all.filter(function (r) {
      if (run && cut === "held" && !unpaid(r)) return false;
      if (run && cut !== "all" && cut !== "held" && r.group !== cut) return false;
      if (!run && cut !== "all" && r.cat !== cut) return false;
      return matches(r);
    });
    const page = rows.slice(0, shown);

    const chips = run
      ? [{ k: "all", label: t("ac2.ppl.all"), n: all.length }]
        .concat(["teach", "admin", "visit"].map(function (g) {
          const n = all.filter(function (r) { return r.group === g; }).length;
          return n ? { k: g, label: t("pyo.pg." + g), n: n } : null;
        }).filter(Boolean))
        .concat(held.length ? [{ k: "held", label: t("ac2.ppl.held"), n: held.length }] : [])
      : [{ k: "all", label: t("ac2.ppl.all"), n: all.length }]
        .concat(["lta", "med", "tel", "books", "fuel"].map(function (k) {
          const n = all.filter(function (r) { return r.cat === k; }).length;
          return n ? { k: k, label: t("pyo.cat." + k), n: n } : null;
        }).filter(Boolean));

    const sum = function (list, k) { return list.reduce(function (a, r) { return a + (r[k] || 0); }, 0); };

    const columns = run
      ? [
        { key: "who", label: t("ac2.ppl.col.who") },
        { key: "group", label: t("ac2.ppl.col.group"), width: 160 },
        { key: "gross", label: t("ac2.ppl.col.gross"), align: "end", mono: true, width: 130 },
        { key: "ded", label: t("ac2.ppl.col.ded"), align: "end", mono: true, width: 130 },
        { key: "net", label: t("ac2.ppl.col.net"), align: "end", mono: true, width: 140, weight: 700 },
      ]
      : [
        { key: "who", label: t("ac2.ppl.col.who") },
        { key: "cat", label: t("ac2.ppl.col.cat"), width: 190 },
        { key: "ref", label: t("ac2.ppl.col.ref"), width: 110 },
        { key: "v", label: t("ac2.ppl.col.amount"), align: "end", mono: true, width: 140, weight: 700 },
      ];

    const who = function (name, sub) {
      return (
        <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
          <Avatar name={name} size={30} />
          <span style={{ minWidth: 0 }}>
            <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600, whiteSpace: "nowrap" })}>{name}</span>
            <span style={G3.fig("micro", { display: "block", color: c.inkFaint, marginTop: 2 })}>{sub}</span>
          </span>
        </span>
      );
    };

    return (
      <div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 230 }}>
            <Input id="ac2-ppl-q" value={q} onChange={function (v) { setQ(v); setShown(PEOPLE_PAGE); }}
              placeholder={t("ac2.ppl.search")} ariaLabel={t("ac2.ppl.search")} size="sm" />
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {chips.map(function (ch) {
              const on = cut === ch.k;
              return (
                <button key={ch.k} type="button" aria-pressed={on ? "true" : "false"}
                  onClick={function () { setCut(ch.k); setShown(PEOPLE_PAGE); }}
                  style={ty("caption", {
                    border: "1px solid " + (on ? c.borderStrong : c.border), background: on ? c.sel : "transparent",
                    color: c.ink, borderRadius: G3.r.pill, padding: "6px 13px", cursor: "pointer",
                    fontWeight: on ? 700 : 500,
                  })}>
                  {ch.label} <span style={G3.fig("micro", { opacity: 0.7 })}>{num(ch.n)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {page.length ? (
          <Register
            columns={columns}
            rows={page.map(function (r) {
              return run ? {
                id: r.id,
                tone: unpaid(r) ? "dim" : null,
                cells: {
                  who: who(r.name, r.id + (r.heldKey ? " \u00b7 " + t(r.heldKey) : "")),
                  group: t(r.groupNameKey),
                  gross: inr(r.gross),
                  ded: inr(r.ded),
                  net: r.heldKey ? t("ac2.ppl.notPaid") : !(r.net > 0) ? t("ac2.ppl.nothing") : inr(r.net),
                },
              } : {
                id: r.id,
                cells: {
                  who: who(t(r.personKey), r.staff),
                  cat: t("pyo.cat." + r.cat),
                  ref: <span style={G3.fig("xs", { color: c.inkMuted })}>{r.id}</span>,
                  v: inr(r.v),
                },
              };
            })}
            totals={run ? {
              label: t("ac2.ppl.tot", { n: num(rows.length) }),
              cells: {
                who: t("ac2.ppl.tot", { n: num(rows.length) }),
                gross: inr(sum(rows, "gross")),
                ded: inr(sum(rows, "ded")),
                net: inr(sum(rows.filter(function (r) { return !unpaid(r); }), "net")),
              },
            } : {
              label: t("ac2.ppl.tot", { n: num(rows.length) }),
              cells: {
                who: t("ac2.ppl.tot", { n: num(rows.length) }),
                v: inr(sum(rows, "v")),
              },
            }}
            footer={rows.length > page.length
              ? <LinkButton onClick={function () { setShown(shown + 60); }}>
                {t("ac2.ppl.more", { n: num(rows.length - page.length) })}
              </LinkButton>
              : <span style={ty("caption", { color: c.inkFaint })}>{t("ac2.ppl.allShown")}</span>}
          />
        ) : (
          <EmptyState head={t("ac2.ppl.none")} compact />
        )}
      </div>
    );
  }

  function SignOff({ item, decided, canRelease }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const checker = decided ? decided.checker : item.checker;
    function Panel({ kicker, person, perm, when, empty, note, filled }) {
      return (
        <div style={{ flex: 1, minWidth: 240, border: "1px solid " + (filled ? c.borderStrong : c.border),
                      borderRadius: G3.r.lg, padding: 16, background: filled ? c.raised : c.alt }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase",
                                      letterSpacing: "0.06em", marginBottom: 8 })}>{kicker}</div>
          {person ? (
            <React.Fragment>
              <div style={ty("h3", { color: c.ink })}>{t(person.key)}</div>
              <div style={ty("small", { color: c.inkMuted, marginTop: 2 })}>{t(person.roleKey)}</div>
              <div style={G3.fig("xs", { color: c.inkFaint, marginTop: 4 })}>
                {t("ac2.so.perm", { perm: perm || item.perm, id: person.id })}
              </div>
              {when ? <div style={ty("caption", { color: c.inkMuted, marginTop: 8 })}>{when}</div> : null}
            </React.Fragment>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
              <span aria-hidden="true" style={{ color: c.inkFaint, display: "flex", marginTop: 2 }}>
                <Icon name="clock" size={16} />
              </span>
              <div>
                <div style={ty("h3", { color: c.inkMuted })}>{empty}</div>
                {note ? <div style={ty("caption", { color: c.inkFaint, marginTop: 5, maxWidth: 300 })}>{note}</div> : null}
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <TitleMark icon="staff" iconTone="accent" size={28} />
          <span style={ty("h3", { color: c.ink })}>{t("ac2.so.title")}</span>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Panel
            kicker={t("ac2.so.maker")} person={item.maker} perm={item.maker.perm} filled
            when={t("ac2.so.signedAt", { date: fmtDate(t, item.submitted) })}
          />
          {checker ? (
            <Panel
              kicker={t("ac2.so.checker")} person={checker} perm={item.perm} filled
              when={t("ac2.so.signedAt", { date: fmtDate(t, decided ? decided.on : item.decidedOn) })}
            />
          ) : (
            <Panel
              kicker={t("ac2.so.checker")}
              empty={canRelease ? t("ac2.so.wouldBe") : t("ac2.so.awaiting")}
              note={canRelease
                ? t("ac2.so.youAre", { perm: item.perm })
                : t("ac2.so.awaitingNote", { who: t(item.maker.key) })}
            />
          )}
        </div>
      </div>
    );
  }

  /* a dense sub-table inside a card: the AC-03 head groups and every
     piece of AC-02 evidence use it. Totals are always passed in as a
     computed value, never authored. */
  function MiniTable({ columns, rows, total, note }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid " + c.ruleStrong }}>
              {columns.map((col) => (
                <th key={col.key} scope="col"
                    style={ty("colLabel", { color: c.inkFaint, textAlign: col.align || "left",
                                            padding: "0 8px 8px", textTransform: "uppercase",
                                            whiteSpace: "nowrap", width: col.width })}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id == null ? i : row.id}
                  style={{ borderBottom: i < rows.length - 1 ? "1px solid " + c.rule : "none",
                           background: row.dim ? c.alt : "transparent" }}>
                {columns.map((col) => (
                  <td key={col.key}
                      style={col.mono
                        ? G3.fig("sm", { padding: "9px 8px", textAlign: col.align || "left",
                                         color: row.dim ? c.inkFaint : c.ink, whiteSpace: "nowrap", verticalAlign: "top" })
                        : ty("small", { padding: "9px 8px", textAlign: col.align || "left",
                                        color: row.dim ? c.inkFaint : c.ink, verticalAlign: "top" })}>
                    {row.cells[col.key] == null ? "—" : row.cells[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {total ? (
            <tfoot>
              <tr style={{ borderTop: "2px solid " + c.ruleStrong }}>
                {columns.map((col, i) => (
                  <td key={col.key}
                      style={col.mono
                        ? G3.fig("md", { padding: "12px 8px", textAlign: col.align || "left",
                                         color: c.ink, fontWeight: 700, whiteSpace: "nowrap" })
                        : ty("small", { padding: "12px 8px", textAlign: col.align || "left",
                                        color: c.ink, fontWeight: 700 })}>
                    {total.cells[col.key] != null ? total.cells[col.key] : (i === 0 ? total.label : null)}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
        {note ? <p style={ty("caption", { color: c.inkMuted, margin: "10px 2px 0" })}>{note}</p> : null}
      </div>
    );
  }

  /* append-only activity. Nothing on these screens can remove a line. */
  function Trail({ rows, note }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {rows.map((r, i) => (
            <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start",
                                 padding: "10px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
              <span aria-hidden="true"
                    style={{ width: 24, height: 24, borderRadius: G3.r.pill, flex: "0 0 auto", marginTop: 1,
                             background: c.sunken, color: c.inkMuted,
                             display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={r.glyph || "check"} size={12} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={ty("small", { color: c.ink, fontWeight: 600 })}>{r.title}</div>
                {r.detail ? <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{r.detail}</div> : null}
              </div>
              <div style={G3.fig("xs", { color: c.inkFaint, whiteSpace: "nowrap", marginTop: 2 })}>{r.when}</div>
            </li>
          ))}
        </ol>
        {note ? <p style={ty("caption", { color: c.inkFaint, margin: "12px 2px 0" })}>{note}</p> : null}
      </div>
    );
  }

  /* a control that exists but is refused, with the reason in words next
     to it. Never a bare disabled button: the reason is the teaching. */
  function RefusedAction({ label, reason, icon }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Button kind="primary" disabled iconLeft={icon}>{label}</Button>
        <p style={ty("caption", { color: c.inkMuted, margin: 0, flex: 1, minWidth: 260, maxWidth: 460,
                                  display: "flex", gap: 8, alignItems: "flex-start" })}>
          <span aria-hidden="true" style={{ color: c.brass, display: "flex", flexShrink: 0, marginTop: 1 }}>
            <Icon name="lock" size={13} />
          </span>
          <span>{reason}</span>
        </p>
      </div>
    );
  }

  /* reason code plus a note, the shape pages/payroll.jsx captures a
     reason in. The confirm is never hard-disabled — it refuses and says
     why, so the click that reveals the error is never swallowed. */
  function ReasonPrompt({ idBase, options, submitLabel, cancelLabel, onSubmit, onCancel, head, hint, placeholder }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [code, setCode] = useState("");
    const [note, setNote] = useState("");
    const [err, setErr] = useState(null);
    function go() {
      if (!code) { setErr("pick"); return; }
      if (!note.trim()) { setErr("note"); return; }
      setErr(null);
      onSubmit({ code: code, note: note.trim() });
    }
    return (
      <div style={{ border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: 18, background: c.raised }}>
        <div style={ty("h3", { color: c.ink, marginBottom: 4 })}>{head}</div>
        {hint ? <p style={ty("caption", { color: c.inkMuted, margin: "0 0 14px" })}>{hint}</p> : null}
        <Field id={idBase + "-code"} label={t("ac2.rsn.label")} error={err === "pick" ? t("ac2.rsn.errPick") : null}>
          <Select
            id={idBase + "-code"} value={code} onChange={(v) => { setCode(v); setErr(null); }}
            options={[{ value: "", label: t("ac2.rsn.pick") }].concat(options.map((o) => ({ value: o, label: t(o) })))}
          />
        </Field>
        <Field id={idBase + "-note"} label={t("ac2.rsn.note")} error={err === "note" ? t("ac2.rsn.errNote") : null}>
          <Input id={idBase + "-note"} value={note} onChange={(v) => { setNote(v); setErr(null); }} placeholder={placeholder} />
        </Field>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button kind="primary" onClick={go}>{submitLabel}</Button>
          <Button kind="ghost" onClick={onCancel}>{cancelLabel}</Button>
        </div>
      </div>
    );
  }

  /* ============================================================
     AC-01 · COMPLIANCE CALENDAR (home)
     What is due, to whom, and how long have I got. Overdue leads;
     approvals awaiting me are the single call to action.
     ============================================================ */

  /* the liability position — every figure reduced from the same
     contributions and payments AC-03 reconciles, so the desk and the
     reconciliation can never quote different numbers */
  const CUR_P = "2026-07";
  const PREV_P = "2026-06";
  function groupTotal(fn, p) { return ENTITIES.reduce((s, e) => s + (hasData(e.key, p) ? fn(e.key, p) : 0), 0); }
  const GRP_PAYABLE = groupTotal(payableOf, CUR_P);
  const GRP_PAID = groupTotal(paidOf, CUR_P);
  const GRP_OUT = GRP_PAYABLE - GRP_PAID;
  const GRP_CARRIED = groupTotal(outstandingOf, PREV_P);
  const GRP_TOTAL_OUT = GRP_OUT + GRP_CARRIED;

  /* ============================================================
     THE PARTS THE DESK IS BUILT FROM — the same six-column grid and
     the same tile shapes the payroll officer's desk uses, because an
     accountant who learns one of these screens should not have to
     learn the other.

     A thing earns a place here only if it is waiting on THIS person
     or if not knowing it would cost them the day. Which is why the
     gate leads: it is the only block on this screen where money
     stops moving until somebody acts.
     ============================================================ */
  function Panel({ span, children, onOpen, label }) {
    const { c } = useTheme();
    const base = {
      gridColumn: "span " + span, minWidth: 0,
      border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
      padding: "18px 20px 20px", display: "flex", flexDirection: "column",
    };
    if (!onOpen) return <section aria-label={label} style={base}>{children}</section>;
    return (
      <button type="button" onClick={onOpen} aria-label={label} className="nv3-tile"
        style={Object.assign({ textAlign: "left", cursor: "pointer" }, base)}>
        {children}
      </button>
    );
  }

  function PHead({ icon, name, tone, go }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <span aria-hidden="true" style={{
          width: 26, height: 26, borderRadius: G3.r.pill, flexShrink: 0,
          background: tone ? c[tone + "Tint"] : c.sunken, color: tone ? c[tone + "Text"] : c.inkMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon name={icon} size={15} /></span>
        <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{name}</span>
        {go ? (
          <span aria-hidden="true" style={{ marginInlineStart: "auto", display: "flex", color: c.inkFaint }}>
            <Icon name="arrow" size={15} />
          </span>
        ) : null}
      </span>
    );
  }

  function PFigure({ v, unit, note }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <span style={{ display: "block" }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
          <span style={G3.fig("xl", { color: c.ink, fontWeight: 700, lineHeight: 1 })}>{v}</span>
          {unit ? <span style={ty("small", { color: c.inkMuted })}>{unit}</span> : null}
        </span>
        {note ? <span style={ty("caption", { color: c.inkMuted, marginTop: 5, display: "block" })}>{note}</span> : null}
      </span>
    );
  }

  function PFoot({ children, tone }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <span style={ty("caption", {
        color: tone ? c[tone + "Text"] : c.inkFaint, fontWeight: tone ? 600 : 400,
        marginTop: "auto", paddingTop: 13, display: "block", borderTop: "1px solid " + c.rule,
      })}>{children}</span>
    );
  }

  /* GROUPED — two kinds of fact in one tile */
  function PGroups({ groups }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <span style={{
        display: "flex", flexDirection: "column", flex: "1 0 auto",
        marginTop: 16, paddingTop: 16, borderTop: "1px solid " + c.rule,
      }}>
        {groups.map(function (g, gi) {
          return (
            <span key={g.k} style={{ display: "block", marginTop: gi ? 16 : 0 }}>
              <span style={ty("caption", {
                color: c.inkFaint, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.06em", display: "block",
              })}>{g.label}</span>
              {g.rows.map(function (r) {
                return (
                  <span key={r.k} style={{
                    display: "flex", alignItems: "baseline", justifyContent: "space-between",
                    gap: 12, padding: "7px 0 0",
                  }}>
                    <span style={ty("small", { color: c.ink, minWidth: 0 })}>{r.label}</span>
                    <span style={G3.fig("sm", {
                      color: g.warn && r.v > 0 ? c.dangerText : c.ink, fontWeight: 700, whiteSpace: "nowrap",
                    })}>{r.display != null ? r.display : num(r.v)}</span>
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    );
  }

  /* TRACK — a sequence, read down */
  function PTrack({ steps }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <span style={{
        display: "flex", flexDirection: "column", flex: "1 0 auto",
        marginTop: 15, paddingTop: 3, borderTop: "1px solid " + c.rule,
      }}>
        {steps.map(function (st, i) {
          const last = i === steps.length - 1;
          const hot = !!st.warn && st.v > 0;
          return (
            <span key={st.k} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingTop: 11 }}>
              <span aria-hidden="true" style={{ position: "relative", width: 12, flexShrink: 0, alignSelf: "stretch" }}>
                {last ? null : (
                  <span style={{ position: "absolute", insetInlineStart: 5, top: 17, bottom: -13, width: 2, background: c.gutter }} />
                )}
                <span style={{
                  position: "absolute", top: 5, insetInlineStart: 0, width: 12, height: 12, borderRadius: G3.r.pill,
                  background: hot ? c.danger : st.v > 0 ? c.accent : c.gutter,
                }} />
              </span>
              <span style={ty("small", { flex: 1, minWidth: 0, color: st.v > 0 ? c.ink : c.inkMuted, fontWeight: 600 })}>
                {st.label}
              </span>
              <span style={G3.fig("md", { color: hot ? c.dangerText : st.v > 0 ? c.ink : c.inkFaint, fontWeight: 700 })}>
                {st.display != null ? st.display : num(st.v)}
              </span>
            </span>
          );
        })}
      </span>
    );
  }

  /* STRIP — figures laid across a wide tile, the band's own unit, and
     the one bar they add up to. */
  function PStrip({ cells }) {
    const { c } = useTheme();
    return (
      <div style={{ marginTop: 16, paddingTop: 15, borderTop: "1px solid " + c.rule }}>
        <MetricStrip
          pad={0}
          metrics={cells.map(function (x) {
            return { k: x.k, label: x.label, value: x.v, tone: x.tone, warn: x.warn, bar: x.bar };
          })}
        />
      </div>
    );
  }

  function ACHome({ role, onNavigate }) {
    /* the accountant holds both campuses; everything below answers this */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const go = function (k) { if (onNavigate) onNavigate(k); };

    /* ---- what is waiting on this person, across every module ---- */
    const mine = PENDING.filter(function (q) { return iHold(q.perm, q.e); });
    /* the ones that are waiting and CANNOT be released by this person:
       the one they prepared, the one that went stale, and the entity
       their capability does not reach. They are not in PENDING, which
       is why counting them there returned nothing. */
    const notMine = QUEUE.filter(function (q) {
      return q.state === "mine" || q.state === "stale" || q.state === "outOfScope";
    });
    const held = mine.reduce(function (n, q) { return n + (q.total || 0); }, 0);
    const oldest = mine.map(function (q) { return daysUntil(q.submitted) * -1; })
      .reduce(function (a, b) { return Math.max(a, b); }, 0);

    const open = FILINGS.filter(function (f) { return dueState(f).key !== "filed"; });
    const overdue = FILINGS.filter(function (f) { return dueState(f).key === "overdue"; });
    const soon = open.filter(function (f) { const k = dueState(f).key; return k === "soon" || k === "short"; });
    const owed = ENTITIES.reduce(function (n, e) {
      return n + PERIODS.reduce(function (m, p) { return m + Math.max(0, outstandingOf(e.key, p, null)); }, 0);
    }, 0);
    const DECLD = (window.Pages3 && window.Pages3.ACDeclData) || null;

    const WAIT = [
      {
        k: "gate", n: mine.length, days: oldest, to: "acGate", urgent: true,
        nameKey: "ac1.w.gate", color: c.chartPurple,
      },
      {
        k: "overdue", n: overdue.length, days: overdue.length ? -daysUntil(overdue[0].due) : 0, to: "acFilings",
        nameKey: "ac1.w.overdue", color: c.chartRed, urgent: true,
      },
      {
        k: "due", n: soon.length, days: soon.length ? daysUntil(soon[0].due) : 0, to: "acFilings",
        nameKey: "ac1.w.due", color: c.chartAmber,
      },
      {
        k: "proofs", n: DECLD ? DECLD.pending : 0, days: 0, to: "acDecl",
        nameKey: "ac1.w.proofs", color: c.chartTeal,
      },
      {
        k: "owed", n: owed > 0 ? 1 : 0, days: 0, to: "acLiability", display: inr(owed),
        nameKey: "ac1.w.owed", color: c.chartBlue,
      },
    ].filter(function (r) { return r.n > 0; });
    const waitingTotal = WAIT.reduce(function (n, r) { return n + r.n; }, 0);

    const byType = function (ty2) { return mine.filter(function (q) { return q.type === ty2; }).length; };

    return (
      <Shell campus={campus} onCampus={setCampus} role={role} active="acHome" onNavigate={onNavigate}
        crumb={t("ac1.crumb")} title={t("ac1.title")}>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: G3.layout.gap, alignItems: "stretch",
        }}>

          {/* ---- the gate: the only block where money stops ---- */}
          <Panel span={4} label={t("ac1.gate.title")}>
            <span style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
              <span style={{ minWidth: 0 }}>
                <PHead icon="lock" name={t("ac1.gate.title")} tone={mine.length ? "late" : null} />
                <PFigure v={inr(held)} note={t("ac1.gate.note", { n: num(mine.length) })} />
              </span>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                {oldest > 0 ? <StatusMark role="late" glyph="clock" word={t("ac1.gate.oldest", { n: num(oldest) })} /> : null}
                <Button kind="primary" size="sm" iconLeft="lock" onClick={function () { go("acGate"); }}>
                  {t("ac1.gate.open")}
                </Button>
              </span>
            </span>

            <PStrip cells={[
              { k: "run", label: t("ac1.gate.run"), v: num(byType("run")), tone: c.chartPurple },
              { k: "batch", label: t("ac1.gate.batch"), v: num(byType("batch")), tone: c.chartAmber },
              { k: "loan", label: t("ac1.gate.loan"), v: num(byType("loan")), tone: c.chartBlue },
              { k: "ff", label: t("ac1.gate.ff"), v: num(byType("ff")), tone: c.chartTeal },
            ]} />

            <PFoot>{t("ac1.gate.foot", { n: num(notMine.length) })}</PFoot>
          </Panel>

          {/* ---- what is already past a statutory deadline ---- */}
          <Panel span={2} label={t("ac1.late.title")}>
            <PHead icon="alert" name={t("ac1.late.title")}
              tone={overdue.length ? "danger" : "present"} />
            {overdue.length ? (
              <React.Fragment>
                <PFigure v={num(overdue.length)} unit={t("ac1.late.unit")} note={t("ac1.late.sub")} />
                <span style={{ display: "block", marginTop: 14 }}>
                  {overdue.slice(0, 4).map(function (f, i) {
                    const late = -daysUntil(f.due);
                    return (
                      <span key={f.id} style={{ display: "block", padding: i ? "11px 0 0" : 0 }}>
                        <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                          <span style={ty("caption", { color: c.inkMuted, minWidth: 0 })}>
                            {t(f.kindKey)}{f.stKey ? " \u00b7 " + t(f.stKey) : ""}
                          </span>
                          <span style={G3.fig("xs", { color: c.dangerText, fontWeight: 700, whiteSpace: "nowrap" })}>
                            {t("ac1.late.over", { n: num(late) })}
                          </span>
                        </span>
                        <span style={{ display: "block", marginTop: 5 }}>
                          <Meter frac={Math.min(1, late / 60)} bar={c.danger} height={7} label={t(f.kindKey)} />
                        </span>
                      </span>
                    );
                  })}
                </span>
                <span style={{ marginTop: "auto", paddingTop: 16, display: "block" }}>
                  <Button kind="primary" size="sm" full iconLeft="document" onClick={function () { go("acFilings"); }}>
                    {t("ac1.late.go")}
                  </Button>
                </span>
              </React.Fragment>
            ) : (
              <span style={ty("small", { color: c.presentText, fontWeight: 600 })}>{t("ac1.late.clean")}</span>
            )}
          </Panel>

          {/* ---- waiting on you, across every module ---- */}
          <Panel span={6} label={t("ac1.wait.title")}>
            <span style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <span style={{ minWidth: 0 }}>
                <PHead icon="list" name={t("ac1.wait.title")} />
                <PFigure v={num(waitingTotal)} unit={t("ac1.wait.unit")} note={t("ac1.wait.sub")} />
              </span>
              {WAIT.length ? (
                <span style={{ textAlign: "end", flexShrink: 0 }}>
                  <span style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block" })}>
                    {t("ac1.wait.old")}
                  </span>
                  <span style={G3.fig("lg", { color: c.dangerText, fontWeight: 700, marginTop: 5, display: "block", lineHeight: 1.1 })}>
                    {t("ac1.wait.days", { n: num(Math.max.apply(null, WAIT.map(function (r) { return Math.max(0, r.days); }))) })}
                  </span>
                  <span style={ty("caption", { color: c.inkMuted, marginTop: 4, display: "block" })}>
                    {t(WAIT.slice().sort(function (a, b) { return b.days - a.days; })[0].nameKey)}
                  </span>
                </span>
              ) : null}
            </span>

            {WAIT.length ? (
              <span style={{ display: "block", marginTop: 14 }}>
                {WAIT.map(function (r, n) {
                  const top = Math.max.apply(null, WAIT.map(function (x) { return x.n; }));
                  return (
                    <button
                      key={r.k} type="button" onClick={function () { go(r.to); }}
                      className="nv3-tile"
                      style={{
                        display: "flex", alignItems: "center", gap: 14, width: "100%",
                        textAlign: "left", border: "none", background: "transparent",
                        cursor: "pointer", padding: "9px 6px", margin: "0 -6px",
                        borderTop: n ? "1px solid " + c.rule : "none",
                      }}
                    >
                      <span style={ty("small", { color: c.ink, fontWeight: 600, flex: "0 0 244px", minWidth: 0 })}>
                        {t(r.nameKey)}
                      </span>
                      {/* the row IS the bar: its length is the count and
                          its colour is the queue's */}
                      <span
                        aria-hidden="true"
                        style={{
                          flex: 1, minWidth: 40, height: 12, borderRadius: G3.r.pill,
                          background: c.gutter, overflow: "hidden", display: "flex",
                        }}
                      >
                        <span style={{ width: Math.max(6, (r.n / top) * 100) + "%", background: r.color }} />
                      </span>
                      <span style={G3.fig("md", { color: c.ink, fontWeight: 700, flex: "0 0 auto", textAlign: "end", whiteSpace: "nowrap" })}>
                        {r.display || num(r.n)}
                      </span>
                      <span style={G3.fig("xs", {
                        color: r.urgent ? c.dangerText : c.inkMuted,
                        flex: "0 0 72px", textAlign: "end", whiteSpace: "nowrap",
                      })}>
                        {r.days > 0 ? t("ac1.wait.days", { n: num(r.days) }) : t("ac1.wait.today")}
                      </span>
                    </button>
                  );
                })}
              </span>
            ) : (
              <span style={ty("small", { color: c.inkMuted, marginTop: 14, display: "block" })}>{t("ac1.wait.none")}</span>
            )}
          </Panel>

          {/* ---- filings ---- */}
          <Panel span={2} onOpen={function () { go("acFilings"); }} label={t("ac1.t.filings")}>
            <PHead icon="document" name={t("ac1.t.filings")} go tone={overdue.length ? "danger" : null} />
            <PFigure v={num(open.length)} unit={t("ac1.t.filingsUnit")} note={t("ac1.t.filingsNote")} />
            <PTrack steps={[
              { k: "o", label: t("ac1.t.fOverdue"), v: overdue.length, warn: true },
              { k: "d", label: t("ac1.t.fDue"), v: soon.length },
              { k: "l", label: t("ac1.t.fLater"), v: open.length - overdue.length - soon.length },
              { k: "f", label: t("ac1.t.fFiled"), v: FILINGS.length - open.length },
            ]} />
          </Panel>

          {/* ---- liability ---- */}
          <Panel span={2} onOpen={function () { go("acLiability"); }} label={t("ac1.t.liability")}>
            <PHead icon="filing" name={t("ac1.t.liability")} go tone={owed > 0 ? "late" : null} />
            <PFigure v={inr(owed)} note={t("ac1.t.liabilityNote")} />
            <PGroups groups={[
              {
                k: "p", label: t("ac1.t.byPeriod"), rows: PERIODS.map(function (p2) {
                  const v = ENTITIES.reduce(function (n, e) { return n + Math.max(0, outstandingOf(e.key, p2, null)); }, 0);
                  return { k: p2, label: t("ac.mon." + Number(p2.split("-")[1])), v: v, display: inr(v) };
                }),
              },
              {
                k: "e", label: t("ac1.t.byEntity"), rows: ENTITIES.map(function (e) {
                  const v = PERIODS.reduce(function (n, p2) { return n + Math.max(0, outstandingOf(e.key, p2, null)); }, 0);
                  return { k: e.key, label: t(e.nameKey), v: v, display: inr(v) };
                }),
              },
            ]} />
          </Panel>

          {/* ---- declarations ---- */}
          <Panel span={2} onOpen={function () { go("acDecl"); }} label={t("ac1.t.decl")}>
            <PHead icon="scan" name={t("ac1.t.decl")} go tone={DECLD && DECLD.pending ? "late" : null} />
            <PFigure v={num(DECLD ? DECLD.pending : 0)} unit={t("ac1.t.declUnit")} note={t("ac1.t.declNote")} />
            <PGroups groups={[
              {
                k: "d", label: t("ac1.t.declWho"), rows: [
                  { k: "s", label: t("ac1.t.declOld"), v: DECLD ? DECLD.staff : 0 },
                  { k: "n", label: t("ac1.t.declNew"), v: DECLD ? DECLD.newRegime : 0 },
                ],
              },
              {
                k: "m", label: t("ac1.t.declMoney"), rows: [
                  { k: "c", label: t("ac1.t.declClaimed"), v: DECLD ? DECLD.declared : 0, display: inr(DECLD ? DECLD.declared : 0) },
                  { k: "a", label: t("ac1.t.declAccepted"), v: DECLD ? DECLD.accepted : 0, display: inr(DECLD ? DECLD.accepted : 0) },
                ],
              },
            ]} />
          </Panel>

          {/* ---- contributions, wide ---- */}
          <Panel span={3} onOpen={function () { go("acContrib"); }} label={t("ac1.t.contrib")}>
            <PHead icon="list" name={t("ac1.t.contrib")} go />
            <PFigure v={inr(payableOf("trust", "2026-07", null))} note={t("ac1.t.contribNote")} />
            <span style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "0 28px", flex: "1 0 auto",
              marginTop: 16, paddingTop: 15, borderTop: "1px solid " + c.rule,
            }}>
              {HEADS.map(function (k) {
                return (
                  <span key={k} style={{
                    display: "flex", alignItems: "baseline", justifyContent: "space-between",
                    gap: 12, padding: "7px 0",
                  }}>
                    <span style={ty("small", { color: c.ink, minWidth: 0 })}>{t(HEAD_LABEL[k])}</span>
                    <span style={G3.fig("sm", { color: c.ink, fontWeight: 700, whiteSpace: "nowrap" })}>
                      {inr(payableOf("trust", "2026-07", k))}
                    </span>
                  </span>
                );
              })}
            </span>
            <PFoot>{t("ac1.t.contribFoot", { v: CFG_JUL.v })}</PFoot>
          </Panel>

          {/* ---- the rules in force, wide ---- */}
          <Panel span={3} onOpen={function () { go("acBonus"); }} label={t("ac1.t.rules")}>
            <PHead icon="festival" name={t("ac1.t.rules")} go />
            <PFigure v={CFG_JUL.v} note={t("ac1.t.rulesNote", { d: cfgFrom(CFG_JUL) })} />
            <PGroups groups={[
              {
                k: "n", label: t("ac1.t.rulesNext"), rows: [
                  { k: "v", label: CFG_SEP.v, v: 1, display: cfgFrom(CFG_SEP) },
                ],
              },
              {
                k: "b", label: t("ac1.t.rulesBonus"), rows: [
                  { k: "b", label: t("ac1.t.rulesBonusRow"), v: 1, display: t("ac1.t.rulesBonusVal") },
                ],
              },
            ]} />
            <PFoot>{t("ac1.t.rulesFoot")}</PFoot>
          </Panel>
        </div>
      </Shell>
    );
  }

  /* ============================================================
     AC-02 · EVIDENCE
     Read-only, in context. The checker approves or rejects; editing
     any of this would make them the maker, so nothing here is a field.
     ============================================================ */
  function Evidence({ item, tab }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const money = { align: "right", mono: true };

    if (tab === "reg") {
      const isMain = item.id === "PR-2026-08-IND";
      const gross = isMain ? IND_GROSS : FRUN.gross;
      const ded = isMain ? IND_DED : FRUN.ded;
      const net = gross - ded;
      return (
        <div>
          <DefRow label={t("ac2.reg.gross")} value={inr(gross)} />
          <DefRow label={t("ac2.reg.ded")} value={inr(ded)} rule sign={"−"} />
          <DefRow label={t("ac2.reg.net")} value={inr(net)} rule strong />
          {isMain ? (
            <React.Fragment>
              <DefRow label={t("ac2.reg.held")} value={inr(IND_HELD)} rule sign={"−"}
                      note={t("ac2.reg.heldNote", { n: num(RUN_HOLDS.length) })} />
              <DefRow label={t("ac2.reg.payable")} value={inr(IND_PAYABLE)} rule strong />
              <DefRow label={t("ac2.reg.employer")} value={inr(IND_EMPLOYER)} rule />
            </React.Fragment>
          ) : null}
        </div>
      );
    }

    if (tab === "var") {
      const moved = IND_PAYABLE - PREV_IND_PAYABLE;
      return (
        <div>
          <Fact label={t("ac2.ev.var")}>
            <span style={ty("body", { color: c.ink })}>{t("ac2.var.moved", { amt: inr(moved) })}</span>
          </Fact>
          <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 14px", maxWidth: 560 })}>
            {t("ac2.var.movedNote", { who: t(SUNITA.key), date: fmtDate(t, "2026-08-08") })}
          </p>
          <MiniTable
            columns={[{ key: "cause", label: t("ac2.col.cause") }, { key: "n", label: t("ac2.col.people"), align: "right", mono: true }]}
            rows={RUN_VAR.map((r, i) => ({ id: i, cells: { cause: t(r.causeKey), n: num(r.n) } }))}
            total={{ label: t("ac2.col.people"), cells: { n: num(RUN_VAR.reduce((s, r) => s + r.n, 0)) } }}
          />
        </div>
      );
    }

    if (tab === "stat") {
      return (
        <div>
          <MiniTable
            columns={[
              { key: "head", label: t("ac2.col.head") },
              { key: "emp", label: t("ac2.col.emp"), align: "right", mono: true },
              { key: "er", label: t("ac2.col.er"), align: "right", mono: true },
            ]}
            rows={RUN_STAT.map((r) => ({
              id: r.k,
              cells: { head: t(HEAD_LABEL[r.k]), emp: r.emp ? inr(indStat(r.emp)) : null,
                       er: r.er ? inr(indStat(r.er)) : null },
            }))}
            total={{ label: t("ac3.grp.grand"),
                     cells: { emp: inr(indStat(RUN_STAT_EMP)), er: inr(indStat(RUN_STAT_ER)) } }}
            note={t("ac2.d.cfg", { v: item.cfg.v, d: cfgFrom(item.cfg) })}
          />
        </div>
      );
    }

    if (tab === "claims") {
      const isPrev = item.id === "RB-2026-07";
      const rows = isPrev ? CLAIMS.slice(0, 4) : CLAIMS;
      const tot = isPrev ? item.total : CLAIM_TOTAL;
      const cnt = isPrev ? item.heads : CLAIM_COUNT;
      return (
        <MiniTable
          columns={[
            { key: "cat", label: t("ac2.col.line") },
            { key: "n", label: t("ac2.col.claims"), align: "right", mono: true },
            { key: "v", label: t("ac2.col.amount"), align: "right", mono: true },
          ]}
          rows={rows.map((r) => ({ id: r.key, cells: { cat: t(r.key), n: num(r.n), v: inr(r.v) } }))}
          total={{ label: t("ac3.grp.grand"), cells: { n: num(cnt), v: inr(tot) } }}
          note={t("ac2.claims.note")}
        />
      );
    }

    if (tab === "sched") {
      const rows = [];
      for (let i = 1; i <= 4; i += 1) {
        rows.push({ id: i, cells: { i: num(i), due: t("ac.mon." + (8 + i > 12 ? 8 + i - 12 : 8 + i)) + " 2026",
                                    emi: inr(LOAN.emi), left: inr(LOAN_TOTAL - LOAN.emi * i) } });
      }
      return (
        <div>
          <div style={{ marginBottom: 14 }}>
            <span style={ty("body", { color: c.ink, fontWeight: 600 })}>
              {t("ac2.loan.for", { who: t(LOAN_PERSON.key), id: LOAN_PERSON.id })}
            </span>
          </div>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginBottom: 16 }}>
            <Fact label={t("ac2.loan.principal")}><Figure value={inr(LOAN.principal)} size="md" weight={700} color={c.ink} /></Fact>
            <Fact label={t("ac2.loan.interest")}><Figure value={inr(LOAN_INTEREST)} size="md" weight={700} color={c.ink} /></Fact>
            <Fact label={t("ac2.loan.total")}><Figure value={inr(LOAN_TOTAL)} size="md" weight={700} color={c.ink} /></Fact>
            <Fact label={t("ac2.loan.emi")} note={t("ac2.loan.tenure", { n: num(LOAN.months) })}>
              <Figure value={inr(LOAN.emi)} size="md" weight={700} color={c.ink} />
            </Fact>
          </div>
          <MiniTable
            columns={[
              { key: "i", label: t("ac2.col.inst"), mono: true, width: 70 },
              { key: "due", label: t("ac2.col.due") },
              { key: "emi", label: t("ac2.loan.emi"), align: "right", mono: true },
              { key: "left", label: t("ac2.col.left"), align: "right", mono: true },
            ]}
            rows={rows}
            note={t("ac2.loan.note", { n: num(LOAN.months) })}
          />
        </div>
      );
    }

    if (tab === "split") {
      const src = item.id === "AR-2026-08" ? ARR_DONE : ARR_STALE;
      const tot = item.id === "AR-2026-08" ? ARR_DONE_TOTAL : ARR_STALE_TOTAL;
      return (
        <MiniTable
          columns={[
            { key: "m", label: t("ac2.col.month") },
            { key: "v", label: t("ac2.col.amount"), align: "right", mono: true },
            { key: "cfg", label: t("ac2.col.version"), mono: true },
          ]}
          rows={src.map((r) => ({ id: r.m, cells: { m: t("ac.mon." + r.m) + " 2026", v: inr(r.v), cfg: r.cfg.v } }))}
          total={{ label: t("ac3.grp.grand"), cells: { v: inr(tot) } }}
          note={t("ac2.split.note", { n: num(src.length) })}
        />
      );
    }

    if (tab === "basis") {
      return (
        <div>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginBottom: 16 }}>
            <Fact label={t("ac2.bonus.eligible")}><Figure value={num(BONUS_ELIGIBLE)} size="md" weight={700} color={c.ink} /></Fact>
            <Fact label={t("ac2.bonus.excluded")} note={t("ac2.bonus.excludedNote", { n: num(BONUS_EXCLUDED) })}>
              <Figure value={num(BONUS_EXCLUDED)} size="md" weight={700} color={c.ink} />
            </Fact>
            <Fact label={t("ac2.bonus.exgratia")}><Figure value={inr(BONUS_TOTAL)} size="md" weight={700} color={c.ink} /></Fact>
          </div>
          <MiniTable
            columns={[
              { key: "campus", label: t("ac2.col.campus") },
              { key: "n", label: t("ac2.col.people"), align: "right", mono: true },
              { key: "v", label: t("ac2.col.amount"), align: "right", mono: true },
            ]}
            rows={BONUS.map((r) => ({ id: r.campusKey, cells: { campus: t(r.campusKey), n: num(r.n), v: inr(r.v) } }))}
            total={{ label: t("ac3.grp.grand"), cells: { n: num(BONUS_ELIGIBLE), v: inr(BONUS_TOTAL) } }}
            note={t("ac2.bonus.exgratiaNote", { v: item.cfg.v })}
          />
        </div>
      );
    }

    /* tab === "lines" — the settlement */
    return (
      <div>
        <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginBottom: 14 }}>
          <Fact label={t("ac2.ff.for", { who: t(FF_PERSON.key), id: FF_PERSON.id })} w={260}>
            <span style={ty("body", { color: c.ink })}>
              {t("ac2.ff.lwd")}{": "}{fmtDate(t, FF_PERSON.lwd)}
            </span>
          </Fact>
        </div>
        <MiniTable
          columns={[
            { key: "line", label: t("ac2.col.line") },
            { key: "v", label: t("ac2.col.amount"), align: "right", mono: true },
          ]}
          rows={FF.map((r) => ({
            id: r.key,
            cells: {
              line: r.noteKey
                ? <span>{t(r.key)}<span style={ty("caption", { display: "block", color: c.inkFaint })}>{t(r.noteKey)}</span></span>
                : t(r.key),
              v: inr(r.v),
            },
          }))}
          total={{ label: t("ac2.ff.net"), cells: { v: inr(FF_NET) } }}
          note={t("ac2.ff.access", { who: t(FF_PERSON.key) })}
        />
      </div>
    );
  }

  /* ============================================================
     AC-02 · THE GATE
     ============================================================ */
  function trailFor(t, item, decision) {
    const rows = [
      { glyph: "list", title: t("ac2.trail.created"),
        detail: t("ac2.q.by", { who: t(item.maker.key) }), when: fmtDate(t, item.created) },
      { glyph: "check", title: t("ac2.trail.submitted"),
        detail: t("ac2.so.perm", { perm: item.maker.perm, id: item.maker.id }), when: fmtDate(t, item.submitted) },
      { glyph: "lock", title: t("ac2.trail.locked"), detail: t("ac2.d.locked"), when: fmtDate(t, item.submitted) },
    ];
    if (item.staleOn) {
      rows.push({ glyph: "alert", title: t("ac2.trail.stale"),
        detail: t("ac2.act.approveWhyStale", { who: t(item.maker.key) }), when: fmtDate(t, item.staleOn) });
    }
    const st = decision ? decision.state : item.state;
    if (st === "approved") {
      rows.push({ glyph: "check", title: t("ac2.trail.approved"),
        detail: t("ac2.done.approvedNote", {
          maker: t(item.maker.key),
          checker: t((decision ? decision.checker : item.checker).key),
        }),
        when: fmtDate(t, decision ? decision.on : item.decidedOn) });
    }
    if (st === "sentBack") {
      rows.push({ glyph: "arrow", title: t("ac2.trail.sentBack"),
        detail: decision
          ? t(decision.code) + " — " + decision.note
          : t(item.reasonKey),
        when: fmtDate(t, decision ? decision.on : item.decidedOn) });
    }
    return rows;
  }

  function Confirm({ item, onCancel, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [period, setPeriod] = useState("");
    const [pwd, setPwd] = useState("");
    const [err, setErr] = useState(null);
    function go() {
      if (period.trim() !== item.periodCode) { setErr("period"); return; }
      if (!pwd) { setErr("pwd"); return; }
      setErr(null);
      onDone();
    }
    return (
      <div style={{ border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: 18, background: c.raised }}>
        <div style={ty("h3", { color: c.ink, marginBottom: 14 })}>{t("ac2.conf.head")}</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 }}>
          <Fact label={t("ac2.conf.type")} w={170}>
            <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(TYPE_KEY[item.type])}</span>
          </Fact>
          <Fact label={t("ac2.conf.period")} w={130}>
            <span style={G3.fig("sm", { color: c.ink, fontWeight: 600 })}>{item.periodCode}</span>
          </Fact>
          <Fact label={t("ac2.conf.amount")} w={190}>
            <Figure value={inr(item.total)} size="lg" weight={700} color={c.ink} />
          </Fact>
          {item.heads != null ? (
            <Fact label={t("ac2.conf.heads")} w={110}>
              <Figure value={num(item.payees != null ? item.payees : item.heads)} size="md" weight={700} color={c.ink} />
            </Fact>
          ) : null}
          <Fact label={t("ac2.conf.maker")} w={170}>
            <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(item.maker.key)}</span>
          </Fact>
          <Fact label={t("ac2.conf.entity")} w={200}>
            <span style={ty("small", { color: c.ink, fontWeight: 700 })}>
              {t(ENTITIES.filter((x) => x.key === item.e)[0].nameKey)}
            </span>
          </Fact>
        </div>
        <p style={ty("caption", { color: c.inkMuted, margin: "0 0 16px", maxWidth: 620 })}>{t("ac2.conf.irrev")}</p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 220, flex: 1 }}>
            <Field id="ac2-period" label={t("ac2.conf.period")}
                   hint={item.periodCode}
                   error={err === "period" ? t("ac2.conf.periodErr") : null}>
              <Input id="ac2-period" value={period} onChange={(v) => { setPeriod(v); setErr(null); }} placeholder={item.periodCode} />
            </Field>
          </div>
          <div style={{ minWidth: 220, flex: 1 }}>
            <Field id="ac2-pwd" label={t("ac2.conf.pwd")} hint={t("ac2.conf.pwdHint")}
                   error={err === "pwd" ? t("ac2.conf.pwdErr") : null}>
              <Input id="ac2-pwd" type="password" value={pwd} onChange={(v) => { setPwd(v); setErr(null); }} autoComplete="current-password" />
            </Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button kind="primary" iconLeft="check" onClick={go}>{t("ac2.conf.go")}</Button>
          <Button kind="ghost" onClick={onCancel}>{t("ac2.conf.cancel")}</Button>
        </div>
      </div>
    );
  }

  function Detail({ item, decision, onDecide, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const ev = evidenceOf(item);
    const [tab, setTab] = useState(ev[0]);
    const [seen, setSeen] = useState([ev[0]]);
    const [mode, setMode] = useState(null);   /* null | "confirm" | "send" */
    const [toast, setToast] = useState(null);

    useEffect(() => { setTab(ev[0]); setSeen([ev[0]]); setMode(null); setToast(null); }, [item.id]);

    const state = decision ? decision.state : item.state;
    const settled = state === "approved" || state === "sentBack";
    const holds = iHold(item.perm, item.e);
    const iAmMaker = item.maker === ME;
    const unread = ev.length - seen.length;

    function openTab(k) {
      setTab(k);
      if (seen.indexOf(k) === -1) setSeen(seen.concat([k]));
    }

    const ppl = peopleFor(item);
    const checker = decision ? decision.checker : item.checker;
    const entity = t(ENTITIES.filter(function (e) { return e.key === item.e; })[0].nameKey);

    /* the sentence that accounts for the figure. A run that knows its
       people says so from the register itself, so the summary and the
       rows below can never drift apart. */
    let line = null;
    if (ppl && ppl.kind === "run") {
      const rows = ppl.rows;
      const gross = rows.reduce(function (a, r) { return a + r.gross; }, 0);
      const ded = rows.reduce(function (a, r) { return a + r.ded; }, 0);
      const heldRows = rows.filter(function (r) { return r.heldKey; });
      const heldV = heldRows.reduce(function (a, r) { return a + r.net; }, 0);
      const paid = rows.filter(function (r) { return !r.heldKey && r.net > 0; }).length;
      line = t(heldV ? "ac2.sum.runHeld" : "ac2.sum.run", {
        n: num(paid), all: num(rows.length), gross: inr(gross), ded: inr(ded), held: inr(heldV),
      });
    } else if (ppl && ppl.kind === "batch") {
      line = t("ac2.sum.batch", { n: num(ppl.rows.length) });
    } else if (item.type === "loan") {
      line = t("ac2.sum.loan", { who: t(LOAN_PERSON.key), n: num(LOAN.months), emi: inr(LOAN.emi) });
    } else if (item.type === "ff") {
      line = t("ac2.sum.ff", { who: t(FF_PERSON.key) });
    } else if (item.heads != null) {
      line = t("ac2.sum.heads", { n: num(item.heads) });
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        {/* ---- what it is, and where it has got to ---- */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={ty("h1", { margin: 0, color: c.ink })}>{t(TYPE_KEY[item.type])}</h2>
            <div style={ty("small", { color: c.inkMuted, marginTop: 6 })}>
              <span style={G3.fig("sm", { color: c.inkMuted })}>{item.id}</span>
              {" \u00b7 " + t(item.periodKey) + " 2026 \u00b7 " + entity}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <StatusMark
              role={state === "approved" ? "present" : state === "sentBack" ? "leave"
                : state === "pending" ? "late" : "absent"}
              glyph={state === "approved" ? "check" : state === "pending" ? "clock" : "alert"}
              word={t("ac2.st." + state)}
            />
            <Chip bg={c.sunken} fg={c.inkMuted}>
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={13} /></span>
              <span>{t("ac2.d.locked")}</span>
            </Chip>
          </div>
        </div>

        {/* ---- the figure, the sentence, and the chain of custody ---- */}
        <Headline
          label={t("ac2.d.amount")}
          value={inr(item.total)}
          line={line}
          facts={[
            { k: "m", label: t("ac2.so.maker"), value: t(item.maker.key),
              note: t("ac2.so.on", { date: fmtDate(t, item.submitted) }) },
            {
              k: "ch", label: t("ac2.so.checker"),
              value: checker ? t(checker.key) : holds && !iAmMaker ? t("ac2.so.wouldBe") : t("ac2.so.awaiting"),
              note: checker
                ? t("ac2.so.on", { date: fmtDate(t, decision ? decision.on : item.decidedOn) })
                : holds && !iAmMaker ? t("ac2.so.permNote", { perm: item.perm })
                  : t("ac2.so.notYou", { who: t(item.maker.key) }),
            },
            { k: "cfg", label: t("ac2.d.rules"), value: item.type === "arrears" ? t("ac2.d.rulesEach") : item.cfg.v,
              note: item.type === "arrears" ? t("ac2.d.rulesEachNote") : t("ac2.d.rulesNote", { d: cfgFrom(item.cfg) }) },
          ]}
        />

        {/* ---- evidence ---- */}
        <Card title={t("ac2.ev.title")}
              action={<span style={G3.fig("xs", { color: c.inkMuted })}>
                {unread === 0 ? t("ac2.ev.seen", { n: num(ev.length) })
                              : t("ac2.ev.unseen", { n: num(seen.length), total: num(ev.length) })}
              </span>}>
          <Tabs
            idBase={"ac2-ev-" + item.id}
            ariaLabel={t("ac2.ev.aria", { id: item.id })}
            items={ev.map((k) => ({ key: k, label: t("ac2.ev." + k) }))}
            active={tab} onChange={openTab}
          />
          <TabPanel idBase={"ac2-ev-" + item.id} tabKey={tab} style={{ paddingTop: 20 }}>
            {tab === "people" && ppl ? <PeopleEvidence data={ppl} /> : <Evidence item={item} tab={tab} />}
          </TabPanel>
        </Card>

        {/* ---- what this session may and may not do ---- */}
        <Card>
          {toast ? (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16,
                          padding: 14, borderRadius: G3.r.lg, background: c.presentTint }}>
              <span aria-hidden="true" style={{ color: c.presentText, display: "flex", marginTop: 1 }}>
                <Icon name="check" size={16} />
              </span>
              <span style={ty("small", { color: c.presentText })} role="status">{toast}</span>
            </div>
          ) : null}

          {settled ? (
            <div>
              <Seal
                label={state === "approved"
                  ? t("ac2.done.approved", {
                      who: t((decision ? decision.checker : item.checker).key),
                      date: fmtDate(t, decision ? decision.on : item.decidedOn) })
                  : t("ac2.done.sentBack", {
                      who: t(item.maker.key),
                      date: fmtDate(t, decision ? decision.on : item.decidedOn) })}
                sub={state === "approved"
                  ? t("ac2.done.approvedNote", {
                      maker: t(item.maker.key),
                      checker: t((decision ? decision.checker : item.checker).key) })
                  : null}
              />
              {state === "sentBack" ? (
                <div style={{ marginTop: 14 }}>
                  <Fact label={t("ac2.done.reason")}>
                    <span style={ty("body", { color: c.ink })}>
                      {decision ? t(decision.code) + " — " + decision.note : t(item.reasonKey)}
                    </span>
                  </Fact>
                  {item.resubAs ? (
                    <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0" })}>
                      {t("ac2.done.resub", { id: item.resubAs })}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {item.inRun ? (
                <p style={ty("caption", { color: c.inkMuted, margin: "12px 0 0" })}>
                  {t("ac2.done.inRun", { run: item.inRun })}
                </p>
              ) : null}
              <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0", paddingTop: 12,
                                        borderTop: "1px solid " + c.rule })}>{t("ac2.done.noUndo")}</p>
            </div>
          ) : !holds ? (
            /* ABSENT, not disabled: this session never carries the right
               at this entity, so no Release control is drawn at all. */
            <div>
              <div style={ty("h3", { color: c.ink, marginBottom: 6 })}>{t("ac2.out.head")}</div>
              <p style={ty("body", { color: c.inkMuted, margin: 0, maxWidth: 640 })}>
                {t("ac2.out.body", {
                  mine: t("ac.ent.trust"), theirs: t("ac.ent.found"), id: item.id, who: t(NANDINI.key),
                })}
              </p>
              <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0", maxWidth: 640 })}>{t("ac2.out.absent")}</p>
            </div>
          ) : mode === "confirm" ? (
            <Confirm
              item={item}
              onCancel={() => setMode(null)}
              onDone={() => {
                setMode(null);
                onDecide(item.id, { state: "approved", checker: ME, on: TODAY });
                setToast(t("ac2.toast.released", { id: item.id, who: t(item.maker.key) }));
              }}
            />
          ) : mode === "send" ? (
            <ReasonPrompt
              idBase={"ac2-send-" + item.id}
              head={t("ac2.send.head", { who: t(item.maker.key) })}
              hint={t("ac2.send.hint", { who: t(item.maker.key) })}
              placeholder={t("ac2.send.ph")}
              options={SEND_REASONS}
              submitLabel={t("ac2.send.go")}
              cancelLabel={t("ac2.send.cancel")}
              onCancel={() => setMode(null)}
              onSubmit={(r) => {
                setMode(null);
                onDecide(item.id, { state: "sentBack", checker: ME, on: TODAY, code: r.code, note: r.note });
                setToast(t("ac2.toast.sent", { id: item.id, who: t(item.maker.key) }));
              }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {iAmMaker ? (
                <React.Fragment>
                  <div>
                    <div style={ty("h3", { color: c.ink, marginBottom: 6 })}>{t("ac2.mine.head")}</div>
                    <p style={ty("body", { color: c.inkMuted, margin: 0, maxWidth: 640 })}>
                      {t("ac2.mine.body", {
                        id: item.id, date: fmtDate(t, item.created),
                        a: t(NANDINI.key) + " (" + t(NANDINI.roleKey) + ")",
                        b: t(PRIYA.key) + " (" + t(PRIYA.roleKey) + ")",
                      })}
                    </p>
                    <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0", maxWidth: 640 })}>{t("ac2.mine.alone")}</p>
                  </div>
                  <RefusedAction
                    icon="check"
                    label={t("ac2.act.approve")}
                    reason={t("ac2.act.approveWhyMine", { date: fmtDate(t, item.created) })}
                  />
                  <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <LinkButton>{t("ac2.mine.ask")}</LinkButton>
                    <ActionMenu
                      ariaLabel={t("ac2.act.menu", { id: item.id })}
                      items={[
                        { key: "del", icon: "staff", label: t("ac2.act.delegate"),
                          disabled: true, reason: t("ac2.act.delegateWhy"), onSelect: () => {} },
                        { key: "trail", icon: "list", label: t("ac2.act.trail"), onSelect: goToTrail },
                      ]}
                    />
                  </div>
                </React.Fragment>
              ) : state === "stale" ? (
                <React.Fragment>
                  <div>
                    <div style={ty("h3", { color: c.ink, marginBottom: 6 })}>{t("ac2.stale.head")}</div>
                    <p style={ty("body", { color: c.inkMuted, margin: 0, maxWidth: 640 })}>
                      {t("ac2.stale.body", {
                        who: t(item.maker.key), sub: fmtDate(t, item.submitted), when: fmtDate(t, item.staleOn),
                      })}
                    </p>
                  </div>
                  <RefusedAction
                    icon="check"
                    label={t("ac2.act.approve")}
                    reason={t("ac2.act.approveWhyStale", { who: t(item.maker.key) })}
                  />
                  <div>
                    <Button kind="secondary" iconLeft="arrow" onClick={() => setMode("send")}>{t("ac2.stale.action")}</Button>
                  </div>
                </React.Fragment>
              ) : unread > 0 ? (
                <React.Fragment>
                  <RefusedAction
                    icon="check"
                    label={t("ac2.act.approve")}
                    reason={t("ac2.act.approveWhyEv", { n: num(unread) })}
                  />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button kind="secondary" iconLeft="arrow" onClick={() => setMode("send")}>{t("ac2.act.send")}</Button>
                    <ActionMenu
                      ariaLabel={t("ac2.act.menu", { id: item.id })}
                      items={[
                        { key: "del", icon: "staff", label: t("ac2.act.delegate"),
                          disabled: true, reason: t("ac2.act.delegateWhy"), onSelect: () => {} },
                        { key: "trail", icon: "list", label: t("ac2.act.trail"), onSelect: goToTrail },
                      ]}
                    />
                  </div>
                </React.Fragment>
              ) : (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <Button kind="primary" size="lg" iconLeft="check" onClick={() => setMode("confirm")}>
                    {t("ac2.act.approve")}
                  </Button>
                  <Button kind="secondary" size="lg" iconLeft="arrow" onClick={() => setMode("send")}>
                    {t("ac2.act.send")}
                  </Button>
                  <ActionMenu
                    ariaLabel={t("ac2.act.menu", { id: item.id })}
                    items={[
                      { key: "del", icon: "staff", label: t("ac2.act.delegate"),
                        disabled: true, reason: t("ac2.act.delegateWhy"), onSelect: () => {} },
                      { key: "trail", icon: "list", label: t("ac2.act.trail"), onSelect: goToTrail },
                    ]}
                  />
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ---- append-only trail ---- */}
        <Card id="ac2-trail" title={t("ac2.trail.title")}>
          <Trail rows={trailFor(t, item, decision)} />
        </Card>
      </div>
    );
  }

  function QueueRow({ item, decision, selected, onSelect }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const state = decision ? decision.state : item.state;
    const role = state === "approved" ? "present" : state === "sentBack" ? "leave"
      : state === "pending" ? "late" : "absent";
    const glyph = state === "approved" ? "check" : state === "pending" ? "clock" : "alert";
    return (
      <button
        type="button"
        aria-label={t("ac2.q.aria", { type: t(TYPE_KEY[item.type]), id: item.id })}
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(item.id)}
        style={{
          display: "block", width: "100%", textAlign: "left", padding: "12px 12px", marginBottom: 2,
          border: "1px solid " + (selected ? c.borderStrong : "transparent"),
          borderRadius: G3.r.md, background: selected ? c.sel : "transparent", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <span style={{ minWidth: 0 }}>
            <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(TYPE_KEY[item.type])}</span>
            <span style={G3.fig("xs", { display: "block", color: c.inkFaint, marginTop: 2 })}>{item.id}</span>
            {campusOfItem(item) ? (
              <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>
                {campusLabel(t, campusOfItem(item))}
              </span>
            ) : null}
          </span>
          <Figure value={inr(item.total)} size="sm" weight={700} color={c.ink} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <StatusMark role={role} glyph={glyph} word={t("ac2.st." + state)} />
          <span style={ty("caption", { color: c.inkMuted })}>
            {t("ac2.q.by", { who: t(item.maker.key) })} · {t("ac2.q.on", { date: fmtDate(t, item.submitted) })}
          </span>
        </div>
      </button>
    );
  }

  function ACGate({ role, onNavigate }) {
    /* the queue is narrowed by bucket, by type and by campus, and all
       three controls sit together above the list they narrow */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [bucket, setBucket] = useState("mine");
    const [typeF, setTypeF] = useState("");
    const [decisions, setDecisions] = useState({});
    const [selected, setSelected] = useState(PENDING.length ? PENDING[0].id : QUEUE[0].id);

    function stateOf(q) { return decisions[q.id] ? decisions[q.id].state : q.state; }
    const mineList = QUEUE.filter((q) => stateOf(q) === "pending");
    const blockedList = QUEUE.filter((q) => ["mine", "stale", "outOfScope"].indexOf(stateOf(q)) !== -1);
    const doneList = QUEUE.filter((q) => ["approved", "sentBack"].indexOf(stateOf(q)) !== -1);
    const buckets = { mine: mineList, blocked: blockedList, done: doneList };
    const shown = buckets[bucket]
      .filter((q) => !typeF || q.type === typeF)
      .filter((q) => inCampus(campus, campusOfItem(q)));

    const item = QUEUE.filter((q) => q.id === selected)[0];

    /* switching bucket has to move the detail too — otherwise the queue
       says "Decided" while the panel still shows something pending */
    function pickBucket(key) {
      setBucket(key);
      const list = key === "mine" ? mineList : key === "blocked" ? blockedList : doneList;
      if (list.length && !list.some((q) => q.id === selected)) setSelected(list[0].id);
    }

    const chip = (key, list) => (
      <button key={key} type="button" onClick={() => pickBucket(key)}
              style={ty("small", { border: "1px solid " + (bucket === key ? c.borderStrong : c.border),
                                   background: bucket === key ? c.sel : "transparent", color: c.ink,
                                   borderRadius: G3.r.pill, padding: "7px 14px",
                                   fontWeight: bucket === key ? 700 : 500, cursor: "pointer" })}>
        {t("ac2.filter." + key, { n: num(list.length) })}
      </button>
    );

    return (
      <Shell role={role} active="acGate" onNavigate={onNavigate}
             crumb={t("ac2.crumb")} title={t("ac2.title")}>
        <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
          <div style={{ width: L.colNarrow, flex: "0 0 " + L.colNarrow + "px",
                        position: "sticky", top: 22, alignSelf: "flex-start" }}>
            <Card icon="lock" iconTone="accent" title={t("ac2.q.title")}>
              <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase",
                                          letterSpacing: "0.06em", marginBottom: 7 })}>{t("ac2.filter.label")}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {chip("mine", mineList)}
                {chip("blocked", blockedList)}
                {chip("done", doneList)}
              </div>
              <div style={{ marginBottom: 8 }}>
                <label htmlFor="ac2-type"
                       style={ty("caption", { display: "block", color: c.inkFaint, fontWeight: 700,
                                              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 })}>
                  {t("ac2.filter.type")}
                </label>
                <Select id="ac2-type" value={typeF} onChange={setTypeF}
                        options={[{ value: "", label: t("ac2.filter.allTypes") }]
                          .concat(Object.keys(TYPE_KEY).map((k) => ({ value: k, label: t(TYPE_KEY[k]) })))} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label htmlFor="ac2-campus"
                       style={ty("caption", { display: "block", color: c.inkFaint, fontWeight: 700,
                                              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 })}>
                  {t("kit.campus.label")}
                </label>
                <Select id="ac2-campus" value={campus} onChange={setCampus}
                        ariaLabel={t("kit.campus.label")}
                        options={campusOptions(t, { allFirst: true, allKey: "ac2.filter.allCampuses" })} />
              </div>
              {shown.length ? (
                <div style={{ margin: "10px -8px 0" }}>
                  {shown.map((q) => (
                    <QueueRow key={q.id} item={q} decision={decisions[q.id]}
                              selected={q.id === selected} onSelect={setSelected} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  head={t("ac2.q.empty.head")} body={t("ac2.q.empty.body")}
                  action={<Button kind="secondary" onClick={() => { setTypeF(""); pickBucket("mine"); }}>
                    {t("ac2.q.empty.action")}
                  </Button>}
                />
              )}
            </Card>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Detail
              item={item} decision={decisions[item.id]} onNavigate={onNavigate}
              onDecide={(id, d) => setDecisions(Object.assign({}, decisions, { [id]: d }))}
            />
          </div>
        </div>
      </Shell>
    );
  }

  /* ============================================================
     AC-03 · STATUTORY LIABILITY AND RECONCILIATION
     Three figures that must agree: computed, deposited, declared.
     Where they do not, the difference is the content.
     ============================================================ */
  function dueFilingFor(e, p, k) {
    const open = FILINGS.filter((f) => f.e === e && f.p === p && f.k === k && !f.filedOn);
    return open.length ? open[0] : null;
  }
  function variancesFor(e, p) {
    const out = [];
    HEADS.forEach((k) => {
      const payable = payableOf(e, p, k);
      if (payable <= 0.005) return;
      const paid = paidOf(e, p, k);
      const diff = payable - paid;
      if (diff <= 0.005) return;
      const pay = paymentsOf(e, p, k)[0];
      const f = dueFilingFor(e, p, k);
      out.push({
        k: k, payable: payable, paid: paid, diff: diff,
        kind: paid > 0.005 ? "short" : "unpaid",
        reasonKey: pay && pay.shortKey ? pay.shortKey : (k === "pt" && p === "2026-06" ? "ac3.var.r.tg" : null),
        due: f ? f.due : null,
      });
    });
    return out;
  }

  function ReconBand({ e, p, busy, onRun, lastAt }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const payable = payableOf(e, p);
    const paid = paidOf(e, p);
    const filed = filedOf(e, p);
    const out = payable - paid;
    const cell = (labelKey, noteKey, value, strong) => (
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase",
                                    letterSpacing: "0.06em", marginBottom: 6 })}>{t(labelKey)}</div>
        {busy
          ? <Skeleton h={28} w="72%" />
          : <Figure value={inr(value)} size={strong ? 30 : 22} weight={700} color={c.ink}
                    style={{ letterSpacing: "-0.01em", lineHeight: 1.14 }} />}
        <p style={ty("caption", { color: c.inkMuted, margin: "7px 0 0", maxWidth: 260 })}>
          {t(noteKey, { period: t("ac.period." + p) })}
        </p>
      </div>
    );
    return (
      <Card style={{ marginBottom: G3.layout.gap }} elev={2}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          {cell("ac3.recon.computed", "ac3.recon.computedNote", payable)}
          {cell("ac3.recon.paid", "ac3.recon.paidNote", paid)}
          {cell("ac3.recon.filed", "ac3.recon.filedNote", filed)}
          <div style={{ flex: 1, minWidth: 210, borderLeft: "1px solid " + c.rule, paddingLeft: 22 }}>
            {cell("ac3.recon.out",
                  out <= 0.005 ? "ac3.recon.balanced" : paid <= 0.005 ? "ac3.recon.noPay" : "ac3.recon.outNote",
                  out, true)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
                      marginTop: 18, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <Button kind="secondary" iconLeft="scan" onClick={onRun}>{t("ac3.recon.run")}</Button>
          <span style={ty("caption", { color: c.inkFaint })} role="status" aria-live="polite">
            {busy ? t("ac3.recon.busy") : t("ac3.recon.at", { date: fmtDate(t, TODAY), who: t(ME.key) })}
          </span>
        </div>
      </Card>
    );
  }

  function VarianceCard({ e, p, onFix }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const rows = variancesFor(e, p);
    if (!rows.length) {
      return (
        <Card icon="check" iconTone="present" title={t("ac3.var.title")}>
          <EmptyState head={t("ac3.var.none.head")} body={t("ac3.var.none.body")} compact />
        </Card>
      );
    }
    return (
      <Card icon="alert" iconTone="accent" title={t("ac3.var.title")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {rows.map((r) => {
            const late = r.due ? daysUntil(r.due) : null;
            return (
              <div key={r.k} style={{ borderTop: "1px solid " + c.rule, paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={ty("small", { color: c.ink, fontWeight: 700 })}>
                      {r.kind === "short"
                        ? t("ac3.var.short", { head: t(HEAD_LABEL[r.k]), paid: inr(r.paid), payable: inr(r.payable) })
                        : t("ac3.var.unpaid", { head: t(HEAD_LABEL[r.k]) })}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 7 }}>
                      <StatusMark role={late != null && late < 0 ? "absent" : "late"}
                                  glyph={late != null && late < 0 ? "alert" : "clock"}
                                  word={late != null && late < 0 ? t("ac.due.overdue") : t("ac.due.soon")} />
                      {r.due ? (
                        <Chip bg={c.sunken} fg={c.inkMuted} mono>
                          {late < 0 ? t("ac3.var.late", { n: num(-late) }) : t("ac3.var.due", { date: fmtDate(t, r.due) })}
                        </Chip>
                      ) : null}
                    </div>
                    {r.reasonKey ? (
                      <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0", maxWidth: 460 })}>
                        <strong style={{ color: c.ink }}>{t("ac3.var.reason")}{": "}</strong>{t(r.reasonKey)}
                      </p>
                    ) : null}
                  </div>
                  <div style={{ textAlign: "right", minWidth: 150 }}>
                    <Figure value={inr(r.diff)} size="lg" weight={700} color={c.dangerText} align="right" />
                    <div style={ty("caption", { color: c.inkMuted, marginTop: 3 })}>
                      {r.kind === "short" ? t("ac3.var.shortAmt", { amt: inr(r.diff) }) : t("ac3.recon.out")}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <LinkButton onClick={() => onFix(r.k)}>{t("ac3.var.fix")}</LinkButton>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  function PayForm({ head, outstanding, onCancel, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [ref, setRef] = useState("");
    const [amt, setAmt] = useState(outstanding.toFixed(2));
    const [when, setWhen] = useState("");
    const [mode, setMode] = useState("net");
    const [err, setErr] = useState(null);
    const typed = parseFloat(amt);
    const diff = isNaN(typed) ? 0 : typed - outstanding;
    function go() {
      if (!ref.trim()) { setErr("ref"); return; }
      if (isNaN(typed) || typed <= 0) { setErr("amt"); return; }
      setErr(null);
      onDone({ ref: ref.trim(), amount: typed });
    }
    return (
      <div style={{ border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: 18, background: c.raised }}>
        <div style={ty("h3", { color: c.ink, marginBottom: 14 })}>{t("ac3.pay.title", { head: t(HEAD_LABEL[head]) })}</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Field id="ac3-ref" label={t("ac3.pay.challan")} hint={t("ac3.pay.challanHint")}
                   error={err === "ref" ? t("ac3.pay.errChallan") : null}>
              <Input id="ac3-ref" value={ref} onChange={(v) => { setRef(v); setErr(null); }} />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field id="ac3-when" label={t("ac3.pay.date")}>
              <Input id="ac3-when" type="date" value={when} onChange={setWhen} />
            </Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Field id="ac3-amt" label={t("ac3.pay.amount")} hint={t("ac3.pay.amountHint")}
                   error={err === "amt" ? t("ac3.pay.errAmount") : null}>
              <Input id="ac3-amt" value={amt} inputMode="decimal" onChange={(v) => { setAmt(v); setErr(null); }} />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field id="ac3-mode" label={t("ac3.pay.mode")}>
              <Select id="ac3-mode" value={mode} onChange={setMode}
                      options={[
                        { value: "net", label: t("ac3.pay.mode.net") },
                        { value: "neft", label: t("ac3.pay.mode.neft") },
                        { value: "cheque", label: t("ac3.pay.mode.cheque") },
                      ]} />
            </Field>
          </div>
        </div>
        {Math.abs(diff) > 0.005 ? (
          <p style={ty("caption", { color: c.ink, margin: "0 0 14px", padding: "10px 12px",
                                    borderRadius: G3.r.sm, background: c.lateTint })} role="status">
            {t("ac3.pay.variance", { diff: inr(diff), payable: inr(outstanding) })}
          </p>
        ) : null}
        <p style={ty("caption", { color: c.inkMuted, margin: "0 0 14px", maxWidth: 560 })}>{t("ac3.pay.checkNote")}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button kind="primary" onClick={go}>{t("ac3.pay.go")}</Button>
          <Button kind="ghost" onClick={onCancel}>{t("ac3.pay.cancel")}</Button>
        </div>
      </div>
    );
  }

  /* the challan currently on record, and what it is being replaced by */
  function CorrectForm({ head, pay, payable, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [ref, setRef] = useState(pay ? pay.ref : "");
    const [amt, setAmt] = useState(pay ? pay.v.toFixed(2) : "");
    const [when, setWhen] = useState("");
    const [why, setWhy] = useState("");
    const typed = parseFloat(amt);
    const changedRef = pay && ref.trim() !== pay.ref;
    const changedAmt = pay && !isNaN(typed) && Math.abs(typed - pay.v) > 0.005;
    const ok = ref.trim() && !isNaN(typed) && typed > 0 && why && (changedRef || changedAmt || when);
    const newDiff = isNaN(typed) ? null : payable - typed;

    return (
      <Modal
        icon="document" title={t("ac3.corr.title", { head: t(HEAD_LABEL[head]) })} sub={t("ac3.corr.sub")}
        onClose={onClose} width={580}
        footer={
          <React.Fragment>
            <Button kind="primary" size="sm" iconLeft="check" disabled={!ok}
              onClick={!ok ? undefined : function () { onDone({ ref: ref.trim(), amount: typed, whyKey: "ac3.corr." + why }); }}>
              {t("ac3.corr.go")}
            </Button>
            <Button kind="secondary" size="sm" onClick={onClose}>{t("ac3.corr.cancel")}</Button>
          </React.Fragment>
        }
      >
        {/* what is on the record now, which the correction supersedes */}
        <div style={{ border: "1px solid " + c.rule, borderRadius: G3.r.sm, padding: "11px 14px", background: c.sunken }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
            {t("ac3.corr.onRecord")}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, marginTop: 6 }}>
            <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{pay ? pay.ref : "\u2014"}</span>
            <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{pay ? inr(pay.v) : "\u2014"}</span>
          </div>
          <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>
            {t("ac3.corr.keeps")}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
          <div style={{ flex: "1 1 220px", minWidth: 0 }}>
            <Field id="ac3-corr-ref" label={t("ac3.corr.ref")} hint={t("ac3.pay.challanHint")}>
              <Input id="ac3-corr-ref" value={ref} onChange={setRef} />
            </Field>
          </div>
          <div style={{ flex: "1 1 180px", minWidth: 0 }}>
            <Field id="ac3-corr-when" label={t("ac3.corr.when")}>
              <Input id="ac3-corr-when" type="date" value={when} onChange={setWhen} />
            </Field>
          </div>
        </div>
        <Field id="ac3-corr-amt" label={t("ac3.corr.amount")} hint={t("ac3.pay.amountHint")}>
          <Input id="ac3-corr-amt" value={amt} inputMode="decimal" onChange={setAmt} />
        </Field>
        <Field id="ac3-corr-why" label={t("ac3.corr.why")} hint={t("ac3.corr.whyHint")}>
          <Select id="ac3-corr-why" value={why} onChange={setWhy}
            options={[{ value: "", label: t("ac3.corr.whyPick") }].concat(
              ["r1", "r2", "r3", "r4"].map(function (r) { return { value: r, label: t("ac3.corr." + r) }; }))} />
        </Field>

        {/* what the correction does to the variance, before it is made */}
        {newDiff != null ? (
          <div style={{
            borderRadius: G3.r.sm, padding: "11px 14px",
            background: Math.abs(newDiff) <= 0.005 ? c.presentTint : c.lateTint,
          }}>
            <span style={ty("caption", { color: Math.abs(newDiff) <= 0.005 ? c.presentText : c.lateText, fontWeight: 600 })}>
              {Math.abs(newDiff) <= 0.005
                ? t("ac3.corr.settles")
                : t("ac3.corr.leaves", { v: inr(Math.abs(newDiff)), word: newDiff > 0 ? t("ac3.corr.short") : t("ac3.corr.over") })}
            </span>
          </div>
        ) : null}
      </Modal>
    );
  }

  function HeadGroup({ e, p, k, open, onOpen, onNavigate, campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const lines = contribOf(e, p, k);
    if (!lines.length) return null;
    const payable = payableOf(e, p, k);
    const paid = paidOf(e, p, k);
    const filed = filedOf(e, p, k);
    const diff = payable - paid;
    const pay = paymentsOf(e, p, k)[0];
    const openF = dueFilingFor(e, p, k);
    const late = openF ? daysUntil(openF.due) < 0 : false;
    const [recorded, setRecorded] = useState(null);
    const [corrected, setCorrected] = useState(null);
    const [dlg, setDlg] = useState(null);

    const columns = [
      { key: "line", label: t("ac3.col.line") },
      { key: "computed", label: t("ac3.col.computed"), align: "right", mono: true },
      { key: "cfg", label: t("ac2.col.version"), mono: true, width: 96 },
    ];
    const rows = lines.map((l) => ({
      id: l.line + l.cfg.v,
      dim: !!l.notDue,
      cells: {
        line: l.notDue
          ? <span>{t(l.line)}</span>
          : t(l.line),
        computed: l.notDue ? t("ac3.grp.notDue") : inr(l.v),
        cfg: t("ac3.cfg.chip", { v: l.cfg.v }),
      },
    }));

    return (
      <div style={{ borderTop: "1px solid " + c.rule, paddingTop: 16, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TitleMark icon="filing" iconTone={diff > 0.005 ? "accent" : "present"} size={28} />
              <span style={ty("h3", { color: c.ink })}>{t(HEAD_LABEL[k])}</span>
            </div>
            <p style={ty("caption", { color: c.inkFaint, margin: "6px 0 0", maxWidth: 420 })}>{t(HEAD_CONS[k])}</p>
          </div>
          <div style={{ display: "flex", gap: 22, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Fact label={t("ac3.col.paid")} align="right" w={130}>
              <Figure value={inr(paid)} size="sm" weight={600} color={c.ink} align="right" />
              {pay ? <div style={G3.fig("micro", { color: c.inkFaint, marginTop: 3 })}>{pay.ref}</div> : null}
            </Fact>
            <Fact label={t("ac3.col.filed")} align="right" w={130}>
              <Figure value={inr(filed)} size="sm" weight={600} color={c.ink} align="right" />
            </Fact>
            <Fact label={t("ac3.col.diff")} align="right" w={140}>
              <Figure value={inr(diff)} size="md" weight={700}
                      color={diff <= 0.005 ? c.presentText : late ? c.dangerText : c.ink} align="right" />
            </Fact>
            <ActionMenu
              ariaLabel={t("ac3.grp.aria", { head: t(HEAD_LABEL[k]) })}
              items={[
                { key: "pay", icon: "payslip", label: t("ac3.grp.act.pay"), tone: "go",
                  disabled: diff <= 0.005, reason: diff <= 0.005 ? t("ac3.grp.act.payWhy") : null,
                  onSelect: () => setDlg("pay") },
                { key: "drill", icon: "list", label: t("ac3.grp.act.drill"),
                  onSelect: () => onOpen(open === "drill:" + k ? null : "drill:" + k) },
                { key: "correct", icon: "document", label: t("ac3.grp.act.correct"),
                  disabled: !pay, reason: pay ? null : t("ac3.grp.act.correctWhy"),
                  onSelect: () => setDlg("correct") },
              ]}
            />
          </div>
        </div>

        <MiniTable
          columns={columns} rows={rows}
          total={{ label: t("ac3.grp.sub.total", { head: t(HEAD_LABEL[k]) }), cells: { computed: inr(payable) } }}
        />

        {open === "drill:" + k ? (
          <div style={{ marginTop: 14, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: 16 }}>
            <div style={ty("h3", { color: c.ink, marginBottom: 4 })}>{t("ac3.drill.title", { head: t(HEAD_LABEL[k]) })}</div>
            <p style={ty("caption", { color: c.inkMuted, margin: "0 0 12px" })}>
              {campus === CAMPUS_ALL
                ? t("ac3.drill.sub", { n: num(DRILL_OF) })
                : t("ac3.drill.subOne", { n: num(CAMPUS_HEADS[campus]), of: num(DRILL_OF), campus: campusLabel(t, campus) })}
            </p>
            <MiniTable
              columns={[
                { key: "who", label: t("ac3.drill.col.who") },
                { key: "cmp", label: t("kit.campus.label"), width: 130 },
                { key: "uan", label: t("ac3.drill.col.uan"), mono: true },
                { key: "base", label: t("ac3.drill.col.base"), align: "right", mono: true },
                { key: "amt", label: t("ac3.drill.col.amt"), align: "right", mono: true },
              ]}
              rows={DRILL.filter((d) => inCampus(campus, d.campus)).map((d) => ({
                id: d.key,
                cells: { who: t(d.key), cmp: campusLabel(t, d.campus), uan: d.uan, base: inr(d.base), amt: inr(d.v) },
              }))}
              note={t("ac3.drill.mask")}
            />
            <div style={{ marginTop: 12 }}><Button kind="ghost" onClick={() => onOpen(null)}>{t("ac3.drill.close")}</Button></div>
          </div>
        ) : null}

        {/* RECORDING AND CORRECTING ARE ACTS, so they interrupt rather
            than unfolding under the figure they act on. A form that
            opens below a long group takes the reader away from the
            number they are deciding about. */}
        {dlg === "pay" ? (
          <Modal
            icon="payslip" title={t("ac3.pay.title", { head: t(HEAD_LABEL[k]) })} sub={t("ac3.pay.modalSub")}
            onClose={function () { setDlg(null); }} width={580}
            footer={null}
          >
            <PayForm head={k} outstanding={diff}
              onCancel={function () { setDlg(null); }}
              onDone={function (r) { setRecorded(r); setDlg("paid"); }} />
          </Modal>
        ) : null}

        {dlg === "paid" ? (
          <Modal
            icon="check" iconTone="present" title={t("ac3.pay.done.head")} sub={t("ac3.pay.done.sub")}
            onClose={function () { setDlg(null); }}
            footer={
              <React.Fragment>
                <Button kind="primary" size="sm" onClick={function () { setDlg(null); }}>{t("ac3.corr.close")}</Button>
                <Button kind="secondary" size="sm" iconRight="arrow" onClick={function () { onNavigate && onNavigate("acFilings"); }}>
                  {t("ac3.pay.done.go")}
                </Button>
              </React.Fragment>
            }
          >
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
              {t("ac3.pay.done.body", {
                amt: inr(recorded ? recorded.amount : 0), head: t(HEAD_LABEL[k]),
                ref: recorded ? recorded.ref : "", date: fmtDate(t, TODAY),
              })}
            </p>
          </Modal>
        ) : null}

        {dlg === "correct" ? (
          <CorrectForm head={k} pay={pay} payable={payable}
            onClose={function () { setDlg(null); }}
            onDone={function (r) { setCorrected(r); setDlg("corrected"); }} />
        ) : null}

        {dlg === "corrected" ? (
          <Modal
            icon="check" iconTone="present" title={t("ac3.corr.done.head")} sub={t("ac3.corr.done.sub")}
            onClose={function () { setDlg(null); }}
            footer={<Button kind="primary" size="sm" onClick={function () { setDlg(null); }}>{t("ac3.corr.close")}</Button>}
          >
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
              {t("ac3.corr.done.body", {
                old: pay ? pay.ref : "", ref: corrected ? corrected.ref : "",
                amt: inr(corrected ? corrected.amount : 0),
                why: corrected ? t(corrected.whyKey) : "", who: t(ME.key),
              })}
            </p>
          </Modal>
        ) : null}

      </div>
    );
  }

  function ACLiability({ role, onNavigate }) {
    /* a liability has no campus -- one establishment, one challan -- so
       this narrows the payslips BEHIND each figure, and sits with the
       entity and the period because that is this screen's row of scopes */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [entity, setEntity] = useState("trust");
    const [period, setPeriod] = useState(CUR_P);
    const [open, setOpen] = useState(null);
    const [busy, setBusy] = useState(false);
    const [exported, setExported] = useState(false);
    const timer = useRef(null);

    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
    function runRecon() {
      setBusy(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setBusy(false), 700);
    }

    const present = hasData(entity, period);
    const carried = PERIODS.filter((p) => p !== period)
      .map((p) => ({ p: p, out: hasData(entity, p) ? outstandingOf(entity, p) : 0 }))
      .filter((r) => r.out > 0.005);
    const carriedTotal = carried.reduce((s, r) => s + r.out, 0);
    const grand = payableOf(entity, period);

    const controls = (
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ minWidth: 230 }}>
          <label htmlFor="ac3-entity"
                 style={ty("caption", { display: "block", color: c.inkFaint, fontWeight: 700,
                                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 })}>
            {t("ac.ent.label")}
          </label>
          <Select id="ac3-entity" value={entity} onChange={setEntity}
                  options={ENTITIES.map((e) => ({ value: e.key, label: t(e.nameKey) }))} />
        </div>
        <div style={{ minWidth: 150 }}>
          <label htmlFor="ac3-period"
                 style={ty("caption", { display: "block", color: c.inkFaint, fontWeight: 700,
                                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 })}>
            {t("ac.period.label")}
          </label>
          <Select id="ac3-period" value={period} onChange={setPeriod}
                  options={PERIODS.map((p) => ({ value: p, label: t("ac.period." + p) }))} />
        </div>
        <div style={{ minWidth: 190 }}>
          <label htmlFor="ac3-campus"
                 style={ty("caption", { display: "block", color: c.inkFaint, fontWeight: 700,
                                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 })}>
            {t("kit.campus.label")}
          </label>
          <Select id="ac3-campus" value={campus} onChange={setCampus}
                  ariaLabel={t("kit.campus.label")}
                  options={campusOptions(t, { allFirst: true, allKey: "ac3.campusAll" })} />
        </div>
        <ActionMenu
          ariaLabel={t("ac3.export.aria")}
          items={[
            { key: "csv", icon: "download", label: t("ac3.export.csv"), onSelect: () => setExported(true) },
            { key: "pdf", icon: "download", label: t("ac3.export.pdf"), onSelect: () => setExported(true) },
          ]}
        />
      </div>
    );

    return (
      <Shell role={role} active="acLiability" onNavigate={onNavigate}
             crumb={t("ac3.crumb")} title={t("ac3.title")} aside={controls}>
        {!present ? (
          <Card>
            <EmptyState
              head={t("ac3.empty.head", { period: t("ac.period." + period) })}
              body={t("ac3.empty.body")}
              action={<Button kind="secondary" onClick={() => setPeriod(CUR_P)}>{t("ac3.empty.go")}</Button>}
            />
          </Card>
        ) : (
          <React.Fragment>
            <ReconBand e={entity} p={period} busy={busy} onRun={runRecon} />
            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Card icon="filing" iconTone="accent" title={t("ac3.grp.title")} sub={t("ac3.grp.sub")}>
                  {busy ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
                      {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} h={18} w={i % 2 ? "84%" : "96%"} />)}
                    </div>
                  ) : (
                    <React.Fragment>
                      {HEADS.map((k) => (
                        <HeadGroup key={k} e={entity} p={period} k={k} campus={campus}
                                   open={open} onOpen={setOpen} onNavigate={onNavigate} />
                      ))}
                      <div style={{ borderTop: "2px solid " + c.ruleStrong, marginTop: 18, paddingTop: 14 }}>
                        <DefRow label={t("ac3.grp.grand")} value={inr(grand)} strong />
                        <p style={ty("caption", { color: c.inkFaint, margin: "10px 2px 0" })}>{t("ac3.grp.correctNote")}</p>
                      </div>
                    </React.Fragment>
                  )}
                </Card>
              </div>
              <div style={{ width: L.colNarrow, flex: "0 0 " + L.colNarrow + "px",
                            display: "flex", flexDirection: "column", gap: L.gap }}>
                <VarianceCard e={entity} p={period} onFix={(k) => setOpen(k)} />

                <Card icon="clock" iconTone="brass" title={t("ac3.carry.title")}>
                  {carried.length ? (
                    <React.Fragment>
                      {carried.map((r) => {
                        const v = variancesFor(entity, r.p);
                        const first = v.length ? v[0] : null;
                        const late = first && first.due ? daysUntil(first.due) : null;
                        return (
                          <div key={r.p} style={{ marginBottom: 12 }}>
                            <p style={ty("small", { color: c.ink, margin: 0 })}>
                              {t("ac3.carry.body", {
                                head: first ? t(HEAD_LABEL[first.k]) : t("ac3.recon.out"),
                                period: t("ac.period." + r.p),
                                late: late != null && late < 0 ? t("ac.due.daysLate", { n: num(-late) }) : t("ac.due.overdue"),
                              })}
                            </p>
                            <div style={{ marginTop: 8 }}>
                              <LinkButton onClick={() => setPeriod(r.p)}>{t("ac3.carry.go")}</LinkButton>
                            </div>
                          </div>
                        );
                      })}
                      <DefRow label={t("ac3.carry.total")} value={inr(carriedTotal)} strong rule />
                    </React.Fragment>
                  ) : (
                    <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("ac3.carry.none")}</p>
                  )}
                </Card>

                <Card icon="lock" iconTone="brass" title={t("ac3.cfg.title")}>
                  <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
                    {t("ac3.cfg.body", {
                      period: t("ac.period." + period),
                      v: period === CUR_P ? CFG_JUL.v : CFG_APR.v,
                      d: cfgFrom(period === CUR_P ? CFG_JUL : CFG_APR),
                      v2: CFG_APR.v,
                    })}
                  </p>
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
                    <Button kind="secondary" iconLeft="download" onClick={() => setExported(true)}>{t("ac3.export")}</Button>
                    <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0" })} role="status">
                      {exported ? t("ac3.export.done") : t("ac3.export.note")}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </React.Fragment>
        )}
      </Shell>
    );
  }

  /* ============================================================
     Arithmetic that has to hold, checked at load rather than trusted.
     If any of these ever fails the console says so once, loudly, in
     development — a money screen that quietly stops reconciling is
     worse than one that does not render.
     ============================================================ */
  const RECONCILES =
    Math.abs((RUN_GROSS - RUN_DED) - RUN_NET) < 0.005 &&
    Math.abs((RUN_NET - RUN_HELD) - RUN_PAYABLE) < 0.005 &&
    Math.abs((RUN_STAT_EMP + RUN_LOANS) - RUN_DED) < 0.005 &&
    Math.abs(CLAIM_TOTAL - 268450.0) < 0.005 &&
    Math.abs((LOAN.principal + LOAN_INTEREST) - LOAN_TOTAL) < 0.005 &&
    Math.abs(ARR_DONE_TOTAL - 186400.0) < 0.005 &&
    (CAMPUS_HEADS.indiranagar + CAMPUS_HEADS.whitefield) === DRILL_OF &&
    Math.abs((GRP_PAYABLE - GRP_PAID) - GRP_OUT) < 0.005 &&
    Math.abs((GRP_OUT + GRP_CARRIED) - GRP_TOTAL_OUT) < 0.005 &&
    ENTITIES.every((e) => PERIODS.every((p) =>
      !hasData(e.key, p) ||
      Math.abs((payableOf(e.key, p) - paidOf(e.key, p)) - outstandingOf(e.key, p)) < 0.005));
  if (!RECONCILES && window.console && window.console.warn) {
    window.console.warn("accountant.jsx: a money identity no longer holds");
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.ACHome = ACHome;
  window.Pages3.ACGate = ACGate;
  window.Pages3.ACLiability = ACLiability;

  /* ============================================================
     WHAT THE REST OF THE ACCOUNTANT'S DESK READS.

     This file owns the accountant's facts — the two legal entities,
     the periods, every StatutoryContribution line and the payments
     recorded against them, the filings and their due dates, the
     approval queue, and the config versions each of those was
     computed on. The filings workspace, the contributions register,
     the declaration review and the bonus run all READ from here.

     A second copy of a statutory figure is a second opinion about
     what a school owes the government, so there is one.
     ============================================================ */
  window.Pages3.ACData = {
    ME: ME, SUNITA: SUNITA, KAVITA: KAVITA, NANDINI: NANDINI, PRIYA: PRIYA,
    PERM_APPROVE: PERM_APPROVE, PERM_FILE: PERM_FILE, MY_CAPS: MY_CAPS, iHold: iHold,
    TODAY: TODAY, CFG_APR: CFG_APR, CFG_JUL: CFG_JUL, CFG_SEP: CFG_SEP, cfgFrom: cfgFrom,
    ENTITIES: ENTITIES, PERIODS: PERIODS,
    CONTRIB: CONTRIB, PAYMENTS: PAYMENTS,
    HEADS: HEADS, HEAD_LABEL: HEAD_LABEL, HEAD_CONS: HEAD_CONS,
    contribOf: contribOf, paymentsOf: paymentsOf, payableOf: payableOf, paidOf: paidOf,
    filedOf: filedOf, outstandingOf: outstandingOf, hasData: hasData,
    FILINGS: FILINGS, sortedFilings: sortedFilings, OVERDUE: OVERDUE,
    dueState: dueState, dueWords: dueWords, DUE_ROLE: DUE_ROLE, DUE_GLYPH: DUE_GLYPH,
    fmtDate: fmtDate, daysUntil: daysUntil, parseISO: parseISO,
    QUEUE: QUEUE, PENDING: PENDING,
    RUN_HEADS: RUN_HEADS, RUN_PAYABLE: RUN_PAYABLE, RUN_NET: RUN_NET, RUN_STAT: RUN_STAT,
    BONUS: BONUS, BONUS_TOTAL: BONUS_TOTAL, BONUS_ELIGIBLE: BONUS_ELIGIBLE,
    BONUS_EXCLUDED: BONUS_EXCLUDED,
    sumV: sumV, addAll: addAll,
  };
  /* the shell and the small parts, so a new accountant screen cannot
     drift into a second layout for the same role */
  window.Pages3.ACParts = {
    Shell: Shell, Fact: Fact, DefRow: DefRow, MiniTable: MiniTable, Trail: Trail,
    RefusedAction: RefusedAction, ReasonPrompt: ReasonPrompt,
  };
})();
