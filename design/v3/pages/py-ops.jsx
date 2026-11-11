/* @jsxRuntime classic */
/* ============================================================
   Naveya — Payroll operations · window.Pages3.PYOps

   TEN SCREENS, ONE FILE, ONE DATASET. This completes the Payroll
   Operator role, alongside pages/payroll.jsx (PY-01/07/08) and
   pages/py-salary.jsx (PY-02..06).

   docs/screen-inventory.md, built in full (offered / disabled-with-
   reason / absent honoured on every action row):

     PY-09 Variance review          "what changed since last month,
                                     and can every change be explained?"
     PY-10 Payslip register         "what exactly did this run produce,
                                     person by person?"
     PY-11 Disbursement & bank file "how does the money actually leave
                                     the bank?"
     PY-12 Payslip publication      "have staff been given their
                                     payslips?"
     PY-13 Loans & advances         "who owes what, and what will be
                                     deducted this month?"
     PY-14 Reimbursement payouts    "which approved claims are we
                                     paying, and who signs it off?"
     PY-15 Arrears workbench        "what does this back-dated revision
                                     owe, month by month?"
     PY-16 Exits & settlements      "who is leaving, and where has each
                                     settlement got to?"
     PY-17 Full & final settlement  "what do we owe this leaver, or
                                     they us?"
     PY-18 Reports & registers      "what payroll register do I need
                                     to produce?"

   HOW TEN SCREENS BECAME SIX TABS — grouped by the question, not by
   the inventory's numbering:

     1 "Variance & register"  PY-09 + PY-10. Both answer *is the
       computed run right*: one from the direction of change, one from
       the direction of the record. They share a nested tablist because
       a reviewer moves between them constantly. Neither can be worked
       without the other open.
     2 "Pay & publish"        PY-11 + PY-12. Both are release: money
       out of the bank, then payslips out to staff. Stacked, in that
       order, because a school may do either first and must see both
       states side by side.
     3 "Loans & advances"     PY-13 alone. A standing ledger recovered
       over months — it does not belong to any one run.
     4 "Claims & arrears"     PY-14 + PY-15. Both are amounts ADDED to
       a run by a maker and released by a distinct checker. Nested
       tablist: each is a full workbench.
     5 "Exits & settlements"  PY-16 + PY-17. Register and detail of one
       subject. Master/detail, never two screens.
     6 "Reports & registers"  PY-18 alone. What someone asks payroll
       for.

   SPEC — docs/development-specification.md
     M9  Business rules    paid-days = present + paid-leave + holidays
                           + weekly-offs - LOP; proration
     M10 Business rules    variance review before approval; pins
                           StatutoryConfig; locked payslips; NEFT file
     M10 Compute vs release  release (run approval, bank-file
                           generation, disbursement) always needs a
                           distinct checker and is never one click
     M10 Loans             EMI schedule; interest may be a perquisite;
                           active EMI auto-deducts each run and
                           decrements the balance; outstanding flows to
                           M12 loan_recovery on exit; foreclosure and
                           waiver are audited; payroll.approve
     M10 Reimbursements    per-category tax treatment; approved claims
                           pay out only in a payout batch attached to a
                           run; the batch is a financial finalisation,
                           so payroll.approve maker-checker
     M10 Arrears           month split; each affected month recomputes
                           PF/ESI/TDS on THAT MONTH'S ORIGINALLY PINNED
                           StatutoryConfig version, never the current
                           one, never hardcoded; append-only; distinct
                           checker before posting
     M10 Workflow          compute -> variance -> approve -> lock ->
                           bank file + password-protected payslips
     M11 Business rules    config is versioned and pinned per run; a
                           prior month re-opened still computes on its
                           original version
     M12 Business rules    pending salary, leave encashment 10(10AA),
                           gratuity from continuous service, notice
                           recovery, loan recovery, TDS true-up, final
                           payslip, access revoked
     M12 amendment C       F&F maker-checker is a TENANT SETTING and
                           the screen must show which mode is in force
     M15 Acceptance        a payroll register reconciles to the sum of
                           payslips
     Section 4.4           StatutoryConfig immutable and versioned
     Section 8             maker-checker; append-only audit

   WHAT THIS FILE REFUSES, DELIBERATELY
   . No statutory rate, ceiling, slab or percentage is printed as copy,
     anywhere. Every statutory figure is an AMOUNT plus the config
     version it was read from. Where a threshold decides an outcome
     (gratuity eligibility, the 10(10AA) exemption, the perquisite
     valuation) the screen names the VERSION and the OUTCOME and never
     the number.
   . No Approve, anywhere, in any tab. This role is the maker. Every
     gate names Rajiv Menon and says why the control is not here.
   . No bank-file generation on a run the checker has not released.
   . No full bank account number, for anyone, including payroll.
   . No re-typed money. Every total on this page is summed in code
     from the parts printed beside it.
   . No one-click anything that moves money, and no dead ends: every
     refusal states the rule and the way forward.
   . No named individual's exit outside tab 5. pages/payroll.jsx shows
     F&F as a COUNT on the home board for exactly this reason
     (docs/ui-compliance-requirements.md section 8, F13); tab 5 is the
     settlement surface itself, which is where the names belong.

   CROSS-SCREEN ARITHMETIC (a figure that disagrees across screens
   destroys trust in all of them). Everything below is reconciled
   against pages/payroll.jsx, pages/accountant.jsx and
   pages/payslips.jsx, and the checks are asserted in code at the foot
   of this file rather than promised in a comment:
   . PR-2026-08 gross 3,10,21,350.00, deductions 54,18,500.00,
     net 2,56,02,850.00, held 1,09,100.00, payable 2,54,93,750.00,
     412 staff — pages/payroll.jsx GROUPS, line for line.
   . The LOAN deduction line inside that run, 2,10,500.00 over 14
     people, is the SUM of this file's loan register.
   . The ARREAR earnings line, 1,86,400.00 over 4 people, is
     AR-2026-08, approved by Rajiv Menon on 7 August.
   . RB-2026-08 is 31 claims and 2,68,450.00, the batch
     pages/accountant.jsx holds at its gate.
   . FF-2026-014 is Ritu Bansal, NAV-0088, last working day
     31 July 2026, net 4,17,860.00 — the settlement in that same gate.
   . Ananya Rao's August payslip is pages/payslips.jsx's July payslip:
     gross 94,800.00, an unpaid day priced at 3,160.00 (gross / 30).
   . v2026.3 has been in force since 1 July, so August pins it;
     v2026.4 takes effect from 1 September and does not touch August.

   Composed only from window.G3 / window.UI3. Nothing outside this file
   is edited; primitives the kit lacks are defined locally and listed
   as promotion candidates at the foot of the file.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark, Seal,
    Figure, Icon, EmptyState, Select, Input, Field, Switch, Tabs, TabPanel,
    ActionMenu, inr, num,
  } = UI;

  /* ============================================================
     0 . SHARED VOCABULARY — pyo.* only.

     kit.jsx's string table is global and last-write-wins, and
     pages/payroll.jsx already owns the py.* namespace. Redefining a
     py.* key here would silently rewrite that screen's copy, so every
     key in this file is prefixed pyo.* even where the wording is
     deliberately identical. Same words, own keys.
     ============================================================ */
  addStrings({
    en: {
      "pyo.title": "Payroll operations",
      "pyo.entity": "Sunrise Education Trust",
      "pyo.crumb": "Payroll",

      "pyo.maker": "Sunita Kulkarni",
      "pyo.checker": "Rajiv Menon",
      "pyo.hr": "Kavita Sharma",
      "pyo.roleMaker": "Payroll Officer",
      "pyo.roleChecker": "Accountant",
      "pyo.roleHR": "HR Officer",
      "pyo.by": "{who} - {role} - {id}",

      "pyo.mon.3": "March", "pyo.mon.4": "April", "pyo.mon.5": "May",
      "pyo.mon.6": "June", "pyo.mon.7": "July", "pyo.mon.8": "August",
      "pyo.mon.9": "September",
      "pyo.period": "{mon} 2026",
      "pyo.peopleN": "{n} people",
      "pyo.daysN": "{n} days",
      "pyo.monthsN": "{n} months",

      "pyo.tab.var": "Variance & register",
      "pyo.tab.pay": "Pay & publish",
      "pyo.tab.loans": "Loans & advances",
      "pyo.tab.adj": "Claims & arrears",
      "pyo.tab.exits": "Exits & settlements",
      "pyo.tab.reports": "Reports & registers",
      "pyo.tabs.aria": "Payroll operations",

      "pyo.cfg.chip": "Computed on {v}",
      "pyo.cfg.note": "{v}, in force from {d}, pinned to this run. A later version does not rewrite it.",
      "pyo.cfg.never": "Read from the pinned configuration. The rates and ceilings behind them are not printed on a screen.",

      "pyo.st.draft": "Draft",
      "pyo.st.computed": "Computed",
      "pyo.st.awaiting": "Awaiting checker",
      "pyo.st.approved": "Approved",
      "pyo.st.disbursed": "Disbursed",
      "pyo.st.paid": "Paid",
      "pyo.st.posted": "Posted",
      "pyo.st.notStarted": "Not started",
      "pyo.st.sentBack": "Sent back",
      "pyo.st.recompute": "Recompute needed",
      "pyo.st.provisional": "Provisional",
      "pyo.st.overdue": "Overdue",
      "pyo.st.active": "Active",
      "pyo.st.closing": "Closing this month",
      "pyo.st.closed": "Closed",
      "pyo.st.foreclosed": "Foreclosed",
      "pyo.st.explained": "Explained",
      "pyo.st.unexplained": "Not explained",

      "pyo.disabledWhy": "Why this is off",
      "pyo.absentWhy": "Why this is not here",
      "pyo.appendOnly": "This record is added to, never edited. A correction becomes a new entry beside the old one.",
      "pyo.confirm": "Confirm",
      "pyo.cancel": "Cancel",
      "pyo.close": "Close",
      "pyo.export": "Export",
      "pyo.exported": "Every export is recorded against your name, with what you took and when.",
      "pyo.open": "Open",

      "pyo.reason.label": "Reason",
      "pyo.reason.pick": "Choose a reason",
      "pyo.reason.note": "What should the record say?",
      "pyo.reason.notePh": "In your own words, for whoever reads this in a year",
      "pyo.reason.errPick": "Choose a reason. It goes on the record with your name and cannot be taken off.",
      "pyo.reason.errNote": "Write the note too. A reason code on its own does not explain a money decision.",
      "pyo.recorded": "Recorded against your name at {when}. Nothing here was overwritten.",
      "pyo.justNow": "just now",


      "pyo.money.reconciles": "Every total on this card is added up from the lines above it.",

      /* people this file introduces or reuses */
      "pyo.n.ananya": "Ananya Rao",
      "pyo.n.mahesh": "Mahesh Pillai",
      "pyo.n.farida": "Farida Khan",
      "pyo.n.ravi": "Ravi Deshmukh",
      "pyo.n.lata": "Lata Menon",
      "pyo.n.suresh": "Suresh Iyer",
      "pyo.n.joseph": "Joseph Mathew",
      "pyo.n.nusrat": "Nusrat Ali",
      "pyo.n.prakash": "Prakash Nair",
      "pyo.n.imran": "Imran Qureshi",
      "pyo.n.aparna": "Aparna Bose",
      "pyo.n.vikram": "Vikram Sethi",
      "pyo.n.kavita": "Kavita Sharma",
      "pyo.n.anil": "Anil Verma",
      "pyo.n.harpreet": "Harpreet Kaur",
      "pyo.n.vandana": "Vandana Rege",
      "pyo.n.shalini": "Shalini Nair",
      "pyo.n.girish": "Girish Kamath",
      "pyo.n.rukmini": "Rukmini Das",
      "pyo.n.peter": "Peter D'Souza",
      "pyo.n.nandita": "Nandita Ghosh",
      "pyo.n.salim": "Salim Ansari",
      "pyo.n.lakshmi": "Lakshmi Narayan",
      "pyo.n.devika": "Devika Bhattacharya",
      "pyo.n.tarun": "Tarun Bakshi",
      "pyo.n.ashok": "Ashok Raghavan",
      "pyo.n.zainab": "Zainab Sheikh",
      "pyo.n.ritu": "Ritu Bansal",
      "pyo.n.meera": "Meera Joshi",
      "pyo.n.bhavna": "Bhavna Trivedi",
      "pyo.n.sudha": "Sudha Balakrishnan",

      "pyo.pg.teach": "Teaching (CTC)",
      "pyo.pg.admin": "Administration (CTC)",
      "pyo.pg.visit": "Visiting faculty (honorarium)",
      "pyo.camp.indira": "Indiranagar",
      "pyo.camp.white": "Whitefield",
      "pyo.camp.hyd": "Hyderabad",
    },
  });

  /* ============================================================
     1 . THE VERSIONED, EFFECTIVE-DATED CONFIGURATION.

     Section 4.4 / M11: StatutoryConfig is immutable and versioned, and
     a run pins the version in force in ITS month. Nothing on this page
     prints a rate, a ceiling or a slab; every statutory amount carries
     the version it was read from instead.

     PAY_POLICY is the school's own operational policy object (the
     variance gate) — versioned, effective-dated and attributed for the
     same reason, and identical to the object pages/payroll.jsx renders
     so both screens flag the same rows.
     ============================================================ */
  const CFG_APR = { v: "v2026.2", fromEn: "1 April 2026", fromHi: "1 अप्रैल 2026" };
  const CFG_JUL = { v: "v2026.3", fromEn: "1 July 2026", fromHi: "1 जुलाई 2026" };
  const CFG_SEP = { v: "v2026.4", fromEn: "1 September 2026", fromHi: "1 सितंबर 2026" };
  function cfgFrom(cfg) { return cfg.fromEn; }

  const PAY_POLICY = {
    v: "v2026.2",
    fromEn: "1 April 2026",
    fromHi: "1 अप्रैल 2026",
    varPct: 12,
    varAbs: 4500,
  };

  /* ============================================================
     2 . PEOPLE. A maker and a checker, never the same person.
     ============================================================ */
  const MAKER = { nameKey: "pyo.maker", roleKey: "pyo.roleMaker", id: "NAV-0031", perm: "payroll.run" };
  const CHECKER = { nameKey: "pyo.checker", roleKey: "pyo.roleChecker", id: "NAV-0009", perm: "payroll.approve" };
  const HR_OFFICER = { nameKey: "pyo.hr", roleKey: "pyo.roleHR", id: "NAV-0007", perm: "people.manage" };

  const RUN_ID = "PR-2026-08";
  const PREV_RUN_ID = "PR-2026-07";
  const PERIOD_MON = 8;
  const MONTH_DAYS = new Date(2026, 8, 0).getDate();   /* August 2026 = 31 */
  const DAY_DIVISOR = 30;
  /* The two divisors are NOT the same number, and using one for both
     understates what a leaver is owed. Notice recovery is priced on a
     calendar month (gross / 30 x unserved days). Leave encashment and
     gratuity are priced on WORKING days, which the Payment of Gratuity
     Act and settled encashment practice both put at 26 -- the month
     less its weekly offs. At 30,000 basic+DA and 8 earned-leave days
     that is 9,230.77 rather than 8,000. */
  const NOTICE_DIVISOR = 30;
  const ENCASH_DIVISOR = 26;
  const GRATUITY_DIVISOR = 26;

  const MONTHLY_GROSS_REF = 94800.0;                   /* Ananya Rao */
  function r2(n) { return Math.round(n * 100) / 100; }
  function dayRate(monthlyGross) { return r2(monthlyGross / DAY_DIVISOR); }
  const UNPAID_DAY_REF = dayRate(MONTHLY_GROSS_REF);   /* 3,160.00 */

  /* ============================================================
     3 . THE RUN'S MONEY — pages/payroll.jsx's pay-group component
     aggregates, line for line. Nothing below is a total; every total
     on every tab is summed from these at render time.
     ============================================================ */
  const GROUPS = [
    {
      key: "teach", nameKey: "pyo.pg.teach", heads: 268, lopDays: 40,
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
      key: "admin", nameKey: "pyo.pg.admin", heads: 121, lopDays: 22,
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
      key: "visit", nameKey: "pyo.pg.visit", heads: 23, lopDays: null,
      earn: [{ code: "HON", v: 487200.0 }],
      ded: [{ code: "PT", v: 4600.0, stat: true }, { code: "TDS", v: 48720.0, stat: true }],
      emp: [],
    },
  ];

  const sum = (rows) => rows.reduce((s, r) => s + r.v, 0);
  const groupGross = (g) => sum(g.earn);
  const groupDed = (g) => sum(g.ded);
  const groupNet = (g) => groupGross(g) - groupDed(g);
  const groupEmp = (g) => sum(g.emp);
  const groupPaidDays = (g) => (g.lopDays == null ? null : g.heads * MONTH_DAYS - g.lopDays);

  const RUN_GROSS = GROUPS.reduce((s, g) => s + groupGross(g), 0);
  const RUN_DED = GROUPS.reduce((s, g) => s + groupDed(g), 0);
  const RUN_NET = RUN_GROSS - RUN_DED;
  const RUN_EMPLOYER = GROUPS.reduce((s, g) => s + groupEmp(g), 0);
  const RUN_HEADS = GROUPS.reduce((s, g) => s + g.heads, 0);

  const HOLDS = [
    { id: "NAV-0356", nameKey: "pyo.n.aparna", bank: "ICICI ••7712", v: 61240.0 },
    { id: "NAV-0211", nameKey: "pyo.n.vikram", bank: "HDFC ••4093", v: 47860.0 },
  ];
  const HELD_TOTAL = sum(HOLDS);
  const NET_PAYABLE = RUN_NET - HELD_TOTAL;
  const PAYEES = RUN_HEADS - HOLDS.length;

  const LOAN_LINE = GROUPS.reduce(
    (s, g) => s + g.ded.filter((l) => l.code === "LOAN").reduce((a, l) => a + l.v, 0), 0);
  const ARREAR_LINE = GROUPS.reduce(
    (s, g) => s + g.earn.filter((l) => l.code === "ARREAR").reduce((a, l) => a + l.v, 0), 0);

  /* the periods of this session — a run keeps the version in force in
     its own month, so April to June carry v2026.2 and July v2026.3 */
  const PERIODS = [
    { m: 4, run: "PR-2026-04", state: "disbursed", net: 24980300.0, cfg: CFG_APR, heads: 401 },
    { m: 5, run: "PR-2026-05", state: "disbursed", net: 25041700.0, cfg: CFG_APR, heads: 403 },
    { m: 6, run: "PR-2026-06", state: "disbursed", net: 25118450.0, cfg: CFG_APR, heads: 406 },
    { m: 7, run: PREV_RUN_ID, state: "disbursed", net: 25206900.0, cfg: CFG_JUL, heads: 408 },
    { m: 8, run: RUN_ID, state: "awaiting", net: NET_PAYABLE, cfg: CFG_JUL, heads: RUN_HEADS, current: true },
  ];
  const PREV_PAYABLE = 25206900.0;

  /* ============================================================
     4 . PAYSLIP LINES — derived, never typed.

     A payslip is authored as a CONTRACT: a monthly gross, the paid
     days behind it, and the deduction amounts. The earnings breakdown
     is derived from the gross by the salary structure's own ratios
     (5/12 basic, 1/12 dearness, 5/24 house rent, the balance as
     special pay) and the last line absorbs the remainder, so the
     lines can never fail to add to the gross. Loss of pay is a
     separate deduction line priced at gross / 30 — the same divisor
     pages/attendance.jsx and pages/leave.jsx use, so an unpaid day
     costs the same rupees on every screen in the product.

     Income tax is the RESIDUAL: gross minus net minus every other
     line. It is the only line that can absorb a rounding, and it is
     the line that genuinely varies with a declaration. Nothing here
     implies a rate.
     ============================================================ */
  function earnLines(gross, extra) {
    const basic = r2(gross * 5 / 12);
    const da = r2(gross / 12);
    const hra = r2(gross * 5 / 24);
    const spl = r2(gross - basic - da - hra);
    const rows = [
      { codeKey: "pyo.c.basic", v: basic },
      { codeKey: "pyo.c.da", v: da },
      { codeKey: "pyo.c.hra", v: hra },
      { codeKey: "pyo.c.spl", v: spl },
    ];
    return extra ? rows.concat(extra) : rows;
  }

  /* a month of one person's payslip. `paid` earnings, then deductions;
     tax is whatever is left once the net is honoured. */
  function slip(spec) {
    const earn = spec.hon != null
      ? [{ codeKey: "pyo.c.hon", v: spec.hon, note: spec.honNote }]
      : earnLines(spec.gross, spec.arrear ? [{ codeKey: "pyo.c.arrear", v: spec.arrear }] : null);
    const gross = sum(earn);
    const ded = [];
    if (spec.lop) ded.push({ codeKey: "pyo.c.lop", v: r2(dayRate(spec.gross) * spec.lop), lopDays: spec.lop });
    if (spec.pf) ded.push({ codeKey: "pyo.c.pf", v: spec.pf, stat: true });
    if (spec.esi) ded.push({ codeKey: "pyo.c.esi", v: spec.esi, stat: true });
    if (spec.pt) ded.push({ codeKey: "pyo.c.pt", v: spec.pt, stat: true });
    if (spec.loan) ded.push({ codeKey: "pyo.c.loan", v: spec.loan });
    const known = sum(ded);
    const tds = r2(gross - spec.net - known);
    ded.push({ codeKey: "pyo.c.tds", v: tds, stat: true });
    return { earn: earn, ded: ded, gross: gross, dedTotal: sum(ded), net: r2(gross - sum(ded)), paidDays: spec.paidDays, lectures: spec.lectures };
  }

  /* ============================================================
     5 . PY-09 — VARIANCE.

     Every person whose net moved is here, and the two who moved least
     are here too. `crossed` is COMPUTED from the live gate, never
     authored per row, so moving the gate re-flags the register exactly
     as the real screen would. Nothing is auto-cleared and nothing is
     hidden.

     Each row carries BOTH months as real payslips, so the drill-in is
     a genuine line-by-line comparison rather than a headline pair, and
     the delta the register prints is the difference between two
     figures that each add up.
     ============================================================ */
  const VAR_ROWS = [
    {
      id: "NAV-0416", nameKey: "pyo.n.ravi", groupKey: "pyo.pg.teach", causeKey: "pyo.cause.joiner",
      explBy: MAKER, explAt: { d: 8, time: "17:12" }, explKey: "pyo.expl.joiner",
      prev: null,
      cur: slip({ gross: 45000.0, net: 38940.0, pf: 2250.0, pt: 200.0, paidDays: 15 }),
      curNote: "pyo.var.note.joiner",
    },
    {
      id: "NAV-0177", nameKey: "pyo.n.lata", groupKey: "pyo.pg.admin", causeKey: "pyo.cause.leaver",
      explBy: MAKER, explAt: { d: 8, time: "17:15" }, explKey: "pyo.expl.leaver",
      prev: slip({ gross: 74400.0, net: 57120.0, pf: 3720.0, pt: 200.0, paidDays: 31 }),
      cur: slip({ gross: 50400.0, net: 38680.0, pf: 2520.0, pt: 200.0, paidDays: 21 }),
      curNote: "pyo.var.note.leaver",
    },
    {
      id: "NAV-0209", nameKey: "pyo.n.mahesh", groupKey: "pyo.pg.teach", causeKey: "pyo.cause.lop",
      explBy: MAKER, explAt: { d: 8, time: "17:19" }, explKey: "pyo.expl.lop",
      prev: slip({ gross: 68400.0, net: 61240.0, pf: 3420.0, pt: 200.0, paidDays: 31 }),
      cur: slip({ gross: 68400.0, net: 56680.0, pf: 3420.0, pt: 200.0, lop: 2, paidDays: 29 }),
    },
    {
      id: "NAV-0301", nameKey: "pyo.n.joseph", groupKey: "pyo.pg.teach", causeKey: "pyo.cause.revision",
      explBy: MAKER, explAt: { d: 8, time: "17:24" }, explKey: "pyo.expl.revision",
      prev: slip({ gross: 60000.0, net: 52300.0, pf: 3000.0, pt: 200.0, paidDays: 31 }),
      cur: slip({ gross: 64800.0, arrear: 4800.0, net: 61870.0, pf: 3240.0, pt: 200.0, paidDays: 31 }),
      curNote: "pyo.var.note.revision",
    },
    {
      id: "NAV-0122", nameKey: "pyo.n.prakash", groupKey: "pyo.pg.teach", causeKey: "pyo.cause.loan",
      explBy: MAKER, explAt: { d: 8, time: "17:28" }, explKey: "pyo.expl.loan",
      prev: slip({ gross: 66000.0, net: 58900.0, pf: 3300.0, pt: 200.0, paidDays: 31 }),
      cur: slip({ gross: 66000.0, net: 52900.0, pf: 3300.0, pt: 200.0, loan: 6000.0, paidDays: 31 }),
      curNote: "pyo.var.note.loan",
    },
    {
      id: "NAV-0007", nameKey: "pyo.n.kavita", groupKey: "pyo.pg.admin", causeKey: "pyo.cause.decl",
      explBy: MAKER, explAt: { d: 8, time: "17:33" }, explKey: "pyo.expl.decl",
      prev: slip({ gross: 57600.0, net: 46200.0, pf: 2880.0, pt: 200.0, paidDays: 30 }),
      cur: slip({ gross: 57600.0, net: 50700.0, pf: 2880.0, pt: 200.0, paidDays: 31 }),
      curNote: "pyo.var.note.decl",
    },
    {
      id: "NAV-0263", nameKey: "pyo.n.suresh", groupKey: "pyo.pg.visit", causeKey: "pyo.cause.units",
      explBy: MAKER, explAt: { d: 10, time: "10:41" }, explKey: "pyo.expl.units",
      prev: slip({ hon: 21250.0, net: 18600.0, pt: 200.0, lectures: 34 }),
      cur: slip({ hon: 23750.0, net: 21183.0, pt: 200.0, lectures: 38 }),
    },
    {
      id: "NAV-0270", nameKey: "pyo.n.imran", groupKey: "pyo.pg.visit", causeKey: "pyo.cause.units",
      explBy: MAKER, explAt: { d: 10, time: "10:44" }, explKey: "pyo.expl.units",
      prev: slip({ hon: 17500.0, net: 15400.0, pt: 200.0, lectures: 28 }),
      cur: slip({ hon: 20000.0, net: 17860.0, pt: 200.0, lectures: 32 }),
    },
    {
      id: "NAV-0388", nameKey: "pyo.n.farida", groupKey: "pyo.pg.admin", causeKey: "pyo.cause.lop",
      explBy: null, explAt: null, explKey: null,
      prev: slip({ gross: 42600.0, net: 38120.0, pf: 2130.0, pt: 200.0, paidDays: 30 }),
      cur: slip({ gross: 42600.0, net: 35280.0, pf: 2130.0, pt: 200.0, lop: 2, paidDays: 29 }),
    },
    {
      id: "NAV-0355", nameKey: "pyo.n.nusrat", groupKey: "pyo.pg.admin", causeKey: "pyo.cause.lop",
      explBy: null, explAt: null, explKey: null,
      prev: slip({ gross: 39600.0, net: 35410.0, pf: 1980.0, pt: 200.0, paidDays: 31 }),
      cur: slip({ gross: 39600.0, net: 34090.0, pf: 1980.0, pt: 200.0, lop: 1, paidDays: 30 }),
    },
  ];

  function varDelta(r) { return r.prev == null ? r.cur.net : r2(r.cur.net - r.prev.net); }
  function varPct(r) { return r.prev == null ? null : Math.abs(varDelta(r)) / r.prev.net * 100; }
  function crossedBy(r, gate) {
    if (r.prev == null) return true;                 /* no comparator: always a human's call */
    if (Math.abs(varDelta(r)) >= gate.abs) return true;
    return varPct(r) >= gate.pct;
  }
  const VAR_UNMOVED = RUN_HEADS - VAR_ROWS.length;

  addStrings({
    en: {
      "pyo.c.basic": "Basic pay",
      "pyo.c.da": "Dearness allowance",
      "pyo.c.hra": "House rent allowance",
      "pyo.c.spl": "Special allowance",
      "pyo.c.arrear": "Arrears of pay",
      "pyo.c.hon": "Honorarium",
      "pyo.c.lop": "Loss of pay",
      "pyo.c.pf": "Provident fund",
      "pyo.c.esi": "State insurance",
      "pyo.c.pt": "Professional tax",
      "pyo.c.tds": "Income tax",
      "pyo.c.loan": "Loan instalment",

      "pyo.cause.joiner": "Joined mid-month",
      "pyo.cause.leaver": "Left mid-month",
      "pyo.cause.lop": "Loss of pay",
      "pyo.cause.revision": "Salary revision with arrears",
      "pyo.cause.loan": "Loan recovery started",
      "pyo.cause.decl": "Investment declaration verified",
      "pyo.cause.units": "More lectures than July, inside the monthly cap",

      "pyo.expl.joiner": "Joined on 17 August. Fifteen paid days of a thirty-one day month; the contract is unchanged.",
      "pyo.expl.leaver": "Last working day 21 August. Twenty-one paid days; the settlement is separate and is on the exits tab.",
      "pyo.expl.lop": "Two days of unapproved absence, confirmed with the department head on 7 August.",
      "pyo.expl.revision": "Pay revision effective 1 August, with April to July arrears posted through AR-2026-08.",
      "pyo.expl.loan": "First instalment of the advance sanctioned in July. Twenty-four instalments, none skipped.",
      "pyo.expl.decl": "Investment proofs verified on 4 August, so the monthly tax deduction fell for the rest of the year.",
      "pyo.expl.units": "Lectures taken rose against July and stayed under the honorarium rule's monthly cap.",

      "pyo.var.note.joiner": "15 of 31 paid days. Full monthly gross 93,000.00, prorated on paid days.",
      "pyo.var.note.leaver": "21 of 31 paid days, to the last working day.",
      "pyo.var.note.revision": "Includes 4,800.00 of arrears from AR-2026-08.",
      "pyo.var.note.loan": "First loan instalment. The tax line did not move; a repayment is not a deduction against income.",
      "pyo.var.note.decl": "The tax line fell by 4,500.00. Nothing else on the payslip moved.",
    },
  });

  /* ============================================================
     6 . DATES. Stored ISO, formatted at render, never pre-formatted
     into a string — a date baked into copy cannot be localised and
     cannot be arithmetic. The demo clock is 11 August 2026.
     ============================================================ */
  const TODAY_ISO = "2026-08-11";
  function isoParts(iso) { const p = iso.split("-"); return { y: +p[0], m: +p[1], d: +p[2] }; }
  function fmtDate(t, iso) {
    if (!iso) return "—";
    const p = isoParts(iso);
    return num(p.d) + " " + t("pyo.mon." + p.m) + " " + p.y;
  }
  function daysBetween(aIso, bIso) {
    const a = isoParts(aIso), b = isoParts(bIso);
    return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
  }
  function stamp(t, iso, time) { return fmtDate(t, iso) + (time ? ", " + time : ""); }
  function person(t, who) { return t("pyo.by", { who: t(who.nameKey), role: t(who.roleKey), id: who.id }); }

  /* ============================================================
     7 . PY-13 — LOANS AND ADVANCES.

     A loan is authored as a CONTRACT — principal, tenure, an annual
     simple rate — and everything a reader can add up is derived:
       interest    = principal x rate x tenure / 1200
       instalment  = (principal + interest) / tenure
       outstanding = instalment x (tenure - instalments paid)
     A deferral moves the schedule out by a month; it does not change
     what is owed, so the outstanding formula is untouched by it.

     The fourteen loans with an instalment falling in PR-2026-08 sum to
     exactly the LOAN deduction line inside that run. That is asserted
     in code at the foot of this file, not hoped for.

     `perquisite` is the M10 flag, not a valuation: where a loan is
     interest-free the perquisite VALUE is computed by the run from the
     pinned configuration. This screen states that it applies and names
     the version. It never prints the rate behind it.
     ============================================================ */
  const LOANS = [
    { id: "LN-2026-039", personKey: "pyo.n.prakash", staff: "NAV-0122", kind: "loan", principal: 144000.0, tenure: 24, rate: 0, paid: 0, state: "active", net: 52900.0, since: "2026-08-01", purposeKey: "pyo.loan.p.home" },
    { id: "LN-2025-014", personKey: "pyo.n.anil", staff: "NAV-0182", kind: "loan", principal: 360000.0, tenure: 24, rate: 5.0, paid: 9, state: "active", net: 61400.0, since: "2025-11-01", purposeKey: "pyo.loan.p.home" },
    { id: "LN-2026-006", personKey: "pyo.n.harpreet", staff: "NAV-0258", kind: "loan", principal: 240000.0, tenure: 24, rate: 6.0, paid: 4, state: "active", net: 43800.0, since: "2026-04-01", purposeKey: "pyo.loan.p.vehicle" },
    { id: "LN-2026-002", personKey: "pyo.n.vandana", staff: "NAV-0217", kind: "loan", principal: 252000.0, tenure: 12, rate: 0, paid: 5, state: "active", net: 38200.0, since: "2026-03-01", purposeKey: "pyo.loan.p.education" },
    { id: "LN-2025-021", personKey: "pyo.n.ashok", staff: "NAV-0374", kind: "loan", principal: 369000.0, tenure: 18, rate: 0, paid: 11, state: "active", net: 47600.0, since: "2025-09-01", purposeKey: "pyo.loan.p.medical" },
    { id: "AD-2026-118", personKey: "pyo.n.shalini", staff: "NAV-0308", kind: "advance", principal: 72000.0, tenure: 4, rate: 0, paid: 2, state: "active", net: 29500.0, since: "2026-06-01", purposeKey: "pyo.loan.p.festival" },
    { id: "AD-2026-131", personKey: "pyo.n.girish", staff: "NAV-0291", kind: "advance", principal: 80400.0, tenure: 3, rate: 0, paid: 1, state: "active", net: 18600.0, since: "2026-07-01", purposeKey: "pyo.loan.p.festival" },
    { id: "AD-2026-124", personKey: "pyo.n.rukmini", staff: "NAV-0195", kind: "advance", principal: 62000.0, tenure: 4, rate: 0, paid: 2, state: "active", net: 24300.0, since: "2026-06-01", purposeKey: "pyo.loan.p.medical" },
    { id: "AD-2026-104", personKey: "pyo.n.peter", staff: "NAV-0239", kind: "advance", principal: 87000.0, tenure: 6, rate: 0, paid: 5, state: "active", net: 31900.0, since: "2026-03-01", purposeKey: "pyo.loan.p.education" },
    { id: "LN-2025-032", personKey: "pyo.n.nandita", staff: "NAV-0252", kind: "loan", principal: 348000.0, tenure: 24, rate: 0, paid: 8, state: "active", net: 45200.0, since: "2025-12-01", purposeKey: "pyo.loan.p.home" },
    { id: "LN-2026-001", personKey: "pyo.n.salim", staff: "NAV-0281", kind: "loan", principal: 252000.0, tenure: 18, rate: 0, paid: 5, state: "active", net: 36700.0, since: "2026-02-01", skipped: 1, skipIso: "2026-06-01", skipReasonKey: "pyo.loan.skip.reason", purposeKey: "pyo.loan.p.medical" },
    { id: "LN-2025-047", personKey: "pyo.n.lakshmi", staff: "NAV-0322", kind: "loan", principal: 192000.0, tenure: 24, rate: 0, paid: 5, state: "active", net: 51300.0, since: "2026-03-01", purposeKey: "pyo.loan.p.education" },
    { id: "AD-2026-109", personKey: "pyo.n.devika", staff: "NAV-0349", kind: "advance", principal: 66000.0, tenure: 6, rate: 0, paid: 3, state: "active", net: 22800.0, since: "2026-05-01", purposeKey: "pyo.loan.p.festival" },
    { id: "LN-2024-088", personKey: "pyo.n.tarun", staff: "NAV-0361", kind: "loan", principal: 312000.0, tenure: 24, rate: 0, paid: 12, state: "active", net: 58400.0, since: "2025-08-01", purposeKey: "pyo.loan.p.home" },

    /* still active, but NOT deducted in this run: both people have left,
       so the balance moves to the settlement rather than to a payslip
       (M10 Loans -> M12 loan_recovery) */
    { id: "LN-2025-063", personKey: "pyo.n.zainab", staff: "NAV-0224", kind: "loan", principal: 240000.0, tenure: 24, rate: 0, paid: 10, state: "atExit", net: null, since: "2025-10-01", exitIso: "2026-07-31", settlement: "FF-2026-015", purposeKey: "pyo.loan.p.home" },
    { id: "LN-2024-097", personKey: "pyo.n.ritu", staff: "NAV-0088", kind: "loan", principal: 289200.0, tenure: 24, rate: 0, paid: 20, state: "atExit", net: null, since: "2024-11-01", exitIso: "2026-07-31", settlement: "FF-2026-014", purposeKey: "pyo.loan.p.vehicle" },

    /* sanctioned by HR, waiting on a distinct approver — no schedule
       runs and nothing is deducted until it is released */
    { id: "LN-2026-041", personKey: "pyo.n.imran", staff: "NAV-0206", kind: "loan", principal: 200000.0, tenure: 24, rate: 3.4, paid: 0, state: "pending", net: 41200.0, since: "2026-09-01", raisedBy: HR_OFFICER, raisedIso: "2026-08-11", purposeKey: "pyo.loan.p.home" },

    { id: "AD-2026-071", personKey: "pyo.n.arvind", staff: "NAV-0244", kind: "advance", principal: 84000.0, tenure: 6, rate: 0, paid: 4, state: "foreclosed", net: null, since: "2026-01-01", closedIso: "2026-07-18", waiver: 4000.0, purposeKey: "pyo.loan.p.medical" },
    { id: "LN-2024-052", personKey: "pyo.n.jyoti", staff: "NAV-0228", kind: "loan", principal: 216000.0, tenure: 18, rate: 0, paid: 18, state: "closed", net: null, since: "2024-12-01", closedIso: "2026-05-31", purposeKey: "pyo.loan.p.education" },
  ];

  function loanInterest(l) { return r2(l.principal * l.rate / 100 * (l.tenure / 12)); }
  function loanRepayable(l) { return r2(l.principal + loanInterest(l)); }
  function loanEmi(l) { return r2(loanRepayable(l) / l.tenure); }
  /* what is still to be recovered. A DEFERRED instalment is still
     owed and does not appear here; a WAIVED one never will be, so it
     leaves the balance the moment it is forgiven. */
  function loanOutstanding(l) { return r2(loanEmi(l) * Math.max(0, l.tenure - l.paid - (l.waived || 0))); }
  function loanThisRun(l) { return l.state === "active" ? loanEmi(l) : 0; }
  function loanClosing(l) { return l.state === "active" && l.tenure - l.paid === 1; }
  const LOANS_ACTIVE = LOANS.filter((l) => l.state === "active");
  const LOAN_RUN_TOTAL = LOANS_ACTIVE.reduce((s, l) => s + loanEmi(l), 0);
  const LOAN_OUTSTANDING_TOTAL = LOANS.filter((l) => l.state === "active" || l.state === "atExit")
    .reduce((s, l) => s + loanOutstanding(l), 0);
  const LOAN_OPEN = LOANS.filter((l) => l.state === "active" || l.state === "atExit" || l.state === "pending");
  const LOAN_PRINCIPAL_TOTAL = LOAN_OPEN.reduce((s, l) => s + l.principal, 0);
  const LOANS_AT_EXIT = LOANS.filter((l) => l.state === "atExit");

  /* the borrowers a new recovery may be raised against, with the pay
     each of them actually receives this month AFTER everything already
     committed. A further instalment may not exceed it. */
  const LOAN_CANDIDATES = LOANS.filter((l) => l.net != null).map((l) => ({
    key: l.personKey, staff: l.staff, net: l.net, committed: loanThisRun(l),
  }));

  /* ============================================================
     8 . PY-14 — REIMBURSEMENT CLAIMS AND THE PAYOUT BATCH.

     Thirty-one approved, unpaid claims. The batch total, the count,
     and the taxable / exempt split are all summed from these rows, so
     removing a claim moves every one of them. The categories and their
     tax treatment are M10's (LTA, medical, telephone, books and
     academic allowance, fuel).
     ============================================================ */
  const CLAIM_CATS = {
    lta: { labelKey: "pyo.cat.lta", taxKey: "pyo.tax.exempt", noteKey: "pyo.tax.lta", taxable: false },
    med: { labelKey: "pyo.cat.med", taxKey: "pyo.tax.taxable", noteKey: "pyo.tax.med", taxable: true },
    tel: { labelKey: "pyo.cat.tel", taxKey: "pyo.tax.exempt", noteKey: "pyo.tax.tel", taxable: false },
    books: { labelKey: "pyo.cat.books", taxKey: "pyo.tax.fbp", noteKey: "pyo.tax.books", taxable: false },
    fuel: { labelKey: "pyo.cat.fuel", taxKey: "pyo.tax.taxable", noteKey: "pyo.tax.fuel", taxable: true },
  };
  const CLAIM_ORDER = ["lta", "med", "tel", "books", "fuel"];

  const CLAIMS = [
    { id: "RC-4101", cat: "lta", personKey: "pyo.n.ananya", staff: "NAV-0142", v: 22400.0, approvedIso: "2026-07-28" },
    { id: "RC-4102", cat: "lta", personKey: "pyo.n.joseph", staff: "NAV-0301", v: 18600.0, approvedIso: "2026-07-29" },
    { id: "RC-4103", cat: "lta", personKey: "pyo.n.anil", staff: "NAV-0182", v: 16900.0, approvedIso: "2026-08-01" },
    { id: "RC-4104", cat: "lta", personKey: "pyo.n.nandita", staff: "NAV-0252", v: 15800.0, approvedIso: "2026-08-03" },
    { id: "RC-4105", cat: "lta", personKey: "pyo.n.tarun", staff: "NAV-0361", v: 15700.0, approvedIso: "2026-08-04" },
    { id: "RC-4106", cat: "med", personKey: "pyo.n.nusrat", staff: "NAV-0355", v: 12400.0, approvedIso: "2026-07-30" },
    { id: "RC-4107", cat: "med", personKey: "pyo.n.girish", staff: "NAV-0291", v: 9800.0, approvedIso: "2026-07-31" },
    { id: "RC-4108", cat: "med", personKey: "pyo.n.rukmini", staff: "NAV-0195", v: 8600.0, approvedIso: "2026-08-01" },
    { id: "RC-4109", cat: "med", personKey: "pyo.n.peter", staff: "NAV-0239", v: 7200.0, approvedIso: "2026-08-02" },
    { id: "RC-4110", cat: "med", personKey: "pyo.n.shalini", staff: "NAV-0308", v: 6900.0, approvedIso: "2026-08-03" },
    { id: "RC-4111", cat: "med", personKey: "pyo.n.devika", staff: "NAV-0349", v: 6400.0, approvedIso: "2026-08-04" },
    { id: "RC-4112", cat: "med", personKey: "pyo.n.salim", staff: "NAV-0281", v: 4500.0, approvedIso: "2026-08-05" },
    { id: "RC-4113", cat: "med", personKey: "pyo.n.harpreet", staff: "NAV-0258", v: 3600.0, approvedIso: "2026-08-06" },
    { id: "RC-4114", cat: "med", personKey: "pyo.n.vandana", staff: "NAV-0217", v: 2900.0, approvedIso: "2026-08-07" },
    { id: "RC-4115", cat: "tel", personKey: "pyo.n.lakshmi", staff: "NAV-0322", v: 6300.0, approvedIso: "2026-07-29" },
    { id: "RC-4116", cat: "tel", personKey: "pyo.n.ananya", staff: "NAV-0142", v: 5400.0, approvedIso: "2026-07-30" },
    { id: "RC-4117", cat: "tel", personKey: "pyo.n.joseph", staff: "NAV-0301", v: 4800.0, approvedIso: "2026-08-01" },
    { id: "RC-4118", cat: "tel", personKey: "pyo.n.anil", staff: "NAV-0182", v: 4200.0, approvedIso: "2026-08-03" },
    { id: "RC-4119", cat: "tel", personKey: "pyo.n.nandita", staff: "NAV-0252", v: 3600.0, approvedIso: "2026-08-04" },
    { id: "RC-4120", cat: "tel", personKey: "pyo.n.tarun", staff: "NAV-0361", v: 2850.0, approvedIso: "2026-08-05" },
    { id: "RC-4121", cat: "books", personKey: "pyo.n.mahesh", staff: "NAV-0209", v: 14500.0, approvedIso: "2026-07-28" },
    { id: "RC-4122", cat: "books", personKey: "pyo.n.prakash", staff: "NAV-0122", v: 11800.0, approvedIso: "2026-07-30" },
    { id: "RC-4123", cat: "books", personKey: "pyo.n.kavita", staff: "NAV-0007", v: 9600.0, approvedIso: "2026-08-01" },
    { id: "RC-4124", cat: "books", personKey: "pyo.n.nusrat", staff: "NAV-0355", v: 8400.0, approvedIso: "2026-08-02" },
    { id: "RC-4125", cat: "books", personKey: "pyo.n.girish", staff: "NAV-0291", v: 7300.0, approvedIso: "2026-08-03" },
    { id: "RC-4126", cat: "books", personKey: "pyo.n.rukmini", staff: "NAV-0195", v: 5400.0, approvedIso: "2026-08-05" },
    { id: "RC-4127", cat: "books", personKey: "pyo.n.peter", staff: "NAV-0239", v: 4200.0, approvedIso: "2026-08-06" },
    { id: "RC-4128", cat: "fuel", personKey: "pyo.n.shalini", staff: "NAV-0308", v: 9600.0, approvedIso: "2026-07-31" },
    { id: "RC-4129", cat: "fuel", personKey: "pyo.n.devika", staff: "NAV-0349", v: 7800.0, approvedIso: "2026-08-02" },
    { id: "RC-4130", cat: "fuel", personKey: "pyo.n.salim", staff: "NAV-0281", v: 6200.0, approvedIso: "2026-08-04" },
    { id: "RC-4131", cat: "fuel", personKey: "pyo.n.harpreet", staff: "NAV-0258", v: 4800.0, approvedIso: "2026-08-06" },
  ];
  const CLAIM_WITHDRAWN = { id: "RC-4099", cat: "med", personKey: "pyo.n.mahesh", staff: "NAV-0209", v: 5200.0, withdrawnIso: "2026-08-09" };

  const BATCH = {
    id: "RB-2026-08", runId: RUN_ID, state: "awaiting",
    maker: MAKER, checker: CHECKER,
    createdIso: "2026-08-10", submittedIso: "2026-08-10", submittedTime: "12:40",
    cfg: CFG_JUL,
  };
  const BATCH_PREV = {
    id: "RB-2026-07", runId: PREV_RUN_ID, state: "sentBack",
    maker: MAKER, checker: CHECKER,
    submittedIso: "2026-07-23", decidedIso: "2026-07-24", decidedTime: "09:20",
    reasonKey: "pyo.batch.sentBackReason", resubAs: "RB-2026-08",
    total: 162400.0, claims: 19,
  };

  /* ============================================================
     9 . PY-15 — ARREARS. Month split, and each month on the version
     that was pinned to IT. A month whose original run cannot be
     resolved is LISTED and EXCLUDED, never quietly computed on
     today's configuration — that is the single most important
     correctness rule on this screen (M10 Arrears).
     ============================================================ */
  const ARREARS = [
    {
      id: "AR-2026-10", state: "draft", sourceKey: "pyo.arr.src.correction",
      people: 2, target: null, createdIso: "2026-08-11", maker: MAKER,
      rangeFromIso: "2026-03-01", rangeToIso: "2026-06-30",
      months: [
        { m: 4, cfg: CFG_APR, old: 152000.0, neu: 170600.0, pf: 1116.0, esi: 0.0, tds: 1860.0 },
        { m: 5, cfg: CFG_APR, old: 154000.0, neu: 173400.0, pf: 1164.0, esi: 0.0, tds: 1940.0 },
        { m: 6, cfg: CFG_APR, old: 156000.0, neu: 176200.0, pf: 1212.0, esi: 0.0, tds: 2020.0 },
      ],
      excluded: [{ m: 3, reasonKey: "pyo.arr.excl.noConfig" }],
    },
    {
      id: "AR-2026-09", state: "awaiting", sourceKey: "pyo.arr.src.davda",
      people: 3, target: "PR-2026-09", createdIso: "2026-08-11", maker: MAKER, checker: CHECKER,
      submittedIso: "2026-08-11", submittedTime: "11:05", stale: true, staleCauseKey: "pyo.arr.staleCause",
      rangeFromIso: "2026-06-01", rangeToIso: "2026-08-31",
      months: [
        { m: 6, cfg: CFG_APR, old: 284000.0, neu: 312400.0, pf: 1704.0, esi: 0.0, tds: 2840.0 },
        { m: 7, cfg: CFG_JUL, old: 296000.0, neu: 328100.0, pf: 2247.0, esi: 0.0, tds: 3852.0 },
        { m: 8, cfg: CFG_JUL, old: 302000.0, neu: 335700.0, pf: 2359.0, esi: 0.0, tds: 4044.0 },
      ],
      excluded: [],
    },
    {
      id: "AR-2026-08", state: "posted", sourceKey: "pyo.arr.src.revision",
      people: 4, target: RUN_ID, createdIso: "2026-08-06", maker: MAKER, checker: CHECKER,
      submittedIso: "2026-08-06", decidedIso: "2026-08-07", decidedTime: "10:12", postedIso: "2026-08-08",
      rangeFromIso: "2026-04-01", rangeToIso: "2026-07-31",
      months: [
        { m: 4, cfg: CFG_APR, old: 318000.0, neu: 360300.0, pf: 2538.0, esi: 0.0, tds: 4230.0 },
        { m: 5, cfg: CFG_APR, old: 322000.0, neu: 367800.0, pf: 2748.0, esi: 0.0, tds: 4580.0 },
        { m: 6, cfg: CFG_APR, old: 326000.0, neu: 374200.0, pf: 2892.0, esi: 0.0, tds: 4820.0 },
        { m: 7, cfg: CFG_JUL, old: 330000.0, neu: 380100.0, pf: 3507.0, esi: 0.0, tds: 6012.0 },
      ],
      excluded: [],
    },
  ];
  function monDelta(x) { return r2(x.neu - x.old); }
  function monStat(x) { return r2(x.pf + x.esi + x.tds); }
  function monNet(x) { return r2(monDelta(x) - monStat(x)); }
  function arrGross(a) { return a.months.reduce((s, x) => s + monDelta(x), 0); }
  function arrStat(a) { return a.months.reduce((s, x) => s + monStat(x), 0); }
  function arrNet(a) { return a.months.reduce((s, x) => s + monNet(x), 0); }

  /* ============================================================
     10 . PY-16 / PY-17 — EXITS AND SETTLEMENTS.

     This is the ONLY surface in this file that names a leaver, and it
     is the surface whose whole purpose is the settlement. The payroll
     home board deliberately reports F&F as a count with no names
     (ui-compliance section 8, F13) — two settlements are awaiting
     preparation there, and they are the two "not started" rows here.
     ============================================================ */
  const EXITS = [
    {
      id: "FF-2026-015", personKey: "pyo.n.zainab", staff: "NAV-0224", groupKey: "pyo.pg.admin",
      campusKey: "pyo.camp.indira", lwdIso: "2026-07-31", state: "computed",
      joinedIso: "2023-03-20", serviceKey: "pyo.ff.svc.zainab",
      noticeContract: 30, noticeServed: 12, monthlyGross: 60000.0, basicDa: 30000.0,
      elDays: 8, maker: MAKER, checker: CHECKER, cfg: CFG_JUL,
      loan: "LN-2025-063", live: true,
    },
    {
      id: "FF-2026-014", personKey: "pyo.n.ritu", staff: "NAV-0088", groupKey: "pyo.pg.teach",
      campusKey: "pyo.camp.white", lwdIso: "2026-07-31", state: "awaiting",
      joinedIso: "2017-06-12", serviceKey: "pyo.ff.svc.ritu",
      noticeContract: 90, noticeServed: 90, monthlyGross: 96000.0, basicDa: 48000.0,
      elDays: 42, maker: HR_OFFICER, checker: CHECKER, cfg: CFG_JUL,
      submittedIso: "2026-08-08", submittedTime: "15:30", loan: "LN-2024-097",
      lines: [
        { key: "pyo.ff.l.salary", v: 62400.0 },
        { key: "pyo.ff.l.encash", v: 138600.0 },
        { key: "pyo.ff.l.gratuity", v: 284600.0, stat: true },
        { key: "pyo.ff.l.notice", v: 0.0, noteKey: "pyo.ff.noticeFull" },
        { key: "pyo.ff.l.loan", v: -48200.0 },
        { key: "pyo.ff.l.tds", v: -19540.0, stat: true },
      ],
    },
    {
      id: null, personKey: "pyo.n.meera", staff: "NAV-0333", groupKey: "pyo.pg.admin",
      campusKey: "pyo.camp.indira", lwdIso: "2026-08-06", state: "notStarted",
      joinedIso: "2021-01-11", blockerKey: "pyo.ff.block.service", accessActive: true,
    },
    {
      id: null, personKey: "pyo.n.lata", staff: "NAV-0177", groupKey: "pyo.pg.admin",
      campusKey: "pyo.camp.white", lwdIso: "2026-08-21", state: "notStarted",
      joinedIso: "2019-04-01", provisional: true,
    },
    {
      id: "FF-2026-013", personKey: "pyo.n.sudha", staff: "NAV-0341", groupKey: "pyo.pg.admin",
      campusKey: "pyo.camp.hyd", lwdIso: "2026-06-12", state: "approved",
      joinedIso: "2018-07-02", net: 84250.0, overdue: true,
      maker: MAKER, checker: CHECKER, decidedIso: "2026-06-29",
    },
    {
      id: "FF-2026-011", personKey: "pyo.n.bhavna", staff: "NAV-0367", groupKey: "pyo.pg.teach",
      campusKey: "pyo.camp.indira", lwdIso: "2026-06-30", state: "paid",
      joinedIso: "2016-06-01", net: 296400.0,
      maker: MAKER, checker: CHECKER, decidedIso: "2026-07-24", paidIso: "2026-07-31", paidWith: PREV_RUN_ID,
    },
  ];
  const EXITS_NOT_STARTED = EXITS.filter((e) => e.state === "notStarted");

  /* the tenant's F&F setting (M12 amendment C). It is CONFIGURATION,
     not a control on this screen — the screen's duty is to say which
     mode is in force, in words, before anything is committed. */
  const TENANT_FF_CHECKER_REQUIRED = true;

  /* Zainab's settlement, computed line by line from the facts above.
     Every component is sourced; the gratuity line is a refusal with a
     reason, not a zero. */
  function noticeShortfall(e) { return Math.max(0, e.noticeContract - e.noticeServed); }
  function settlementLines(e, opts) {
    const o = opts || {};
    const dayGross = r2(e.monthlyGross / NOTICE_DIVISOR);
    const encashDay = r2(e.basicDa / ENCASH_DIVISOR);
    const notice = o.noticeWaived ? 0 : -r2(dayGross * noticeShortfall(e));
    const loanRow = LOANS.filter((l) => l.id === e.loan)[0];
    const loanRec = loanRow ? -loanOutstanding(loanRow) : 0;
    return [
      { key: "pyo.ff.l.salary", v: 0.0, srcKey: "pyo.ff.src.salary" },
      { key: "pyo.ff.l.encash", v: r2(encashDay * e.elDays), srcKey: "pyo.ff.src.encash",
        detail: { days: e.elDays, rate: encashDay } },
      { key: "pyo.ff.l.gratuity", v: 0.0, srcKey: "pyo.ff.src.gratuity", stat: true, refusedKey: "pyo.ff.noGratuity" },
      { key: "pyo.ff.l.exgratia", v: o.exGratia || 0.0, srcKey: "pyo.ff.src.exgratia", discretionary: true },
      { key: "pyo.ff.l.notice", v: notice, srcKey: "pyo.ff.src.notice", discretionary: true,
        detail: { days: noticeShortfall(e), rate: dayGross }, waived: !!o.noticeWaived },
      { key: "pyo.ff.l.loan", v: loanRec, srcKey: "pyo.ff.src.loan", linkLoan: e.loan },
      { key: "pyo.ff.l.reimb", v: 0.0, srcKey: "pyo.ff.src.reimb", proposed: true },
      /* a deduction, so it is NEGATIVE. It was authored positive here
         while the worked example two rows up had it at -19,540, which
         put income tax on the "what we owe them" side of a settlement. */
      { key: "pyo.ff.l.tds", v: -4200.0, srcKey: "pyo.ff.src.tds", stat: true },
    ];
  }

  /* ============================================================
     11 . PY-11 — DISBURSEMENT AND THE BANK FILE.

     August cannot generate: the run is with the checker, and that is
     the hard gate M10 states. July is the complete history — excluded
     employees named before generation, a v1 that was superseded, the
     v2 that was uploaded, the reference it came back with, and the
     supplementary file for the two people who were left out.

     Account numbers are masked to the last four digits here exactly as
     they are on the employee's own payslip. Payroll does not get a
     better view of a bank account than its owner does.
     ============================================================ */
  const BANK_BATCHES = [
    { bankKey: "pyo.bank.hdfc", payees: 268, v: 16814300.0 },
    { bankKey: "pyo.bank.icici", payees: 84, v: 5138600.0 },
    { bankKey: "pyo.bank.sbi", payees: 41, v: 2394100.0 },
    { bankKey: "pyo.bank.axis", payees: 13, v: 817510.0 },
  ];
  const BANK_TOTAL = sum(BANK_BATCHES);
  const BANK_PAYEES = BANK_BATCHES.reduce((s, b) => s + b.payees, 0);

  const JULY_EXCLUDED = [
    { personKey: "pyo.n.devika", staff: "NAV-0349", mask: "ICICI ••3308", reasonKey: "pyo.bank.x.checksum", v: 23150.0, fixedIso: "2026-08-04", fixedBy: HR_OFFICER },
    { personKey: "pyo.n.girish", staff: "NAV-0291", mask: null, reasonKey: "pyo.bank.x.none", v: 19240.0, fixedIso: "2026-08-05", fixedBy: HR_OFFICER },
  ];
  const JULY_EXCLUDED_TOTAL = sum(JULY_EXCLUDED);

  const AUG_EXCLUDED = [
    { personKey: "pyo.n.rukmini", staff: "NAV-0195", mask: "ICICI ••7461", reasonKey: "pyo.bank.x.checksum", v: 24300.0 },
    { personKey: "pyo.n.meera", staff: "NAV-0333", mask: null, reasonKey: "pyo.bank.x.none", v: 31600.0 },
    { personKey: "pyo.n.tarun", staff: "NAV-0361", mask: "HDFC ••7154", reasonKey: "pyo.bank.x.ifsc", v: 58400.0 },
  ];
  const AUG_EXCLUDED_TOTAL = sum(AUG_EXCLUDED);

  const JULY_FILE = {
    version: 2, supersedes: 1,
    supersededIso: "2026-07-30", supersededTime: "16:12", supersedeReasonKey: "pyo.bank.v1Reason",
    generatedIso: "2026-07-30", generatedTime: "16:41", by: MAKER,
    formatKey: "pyo.bank.format", checksum: "8F2C-41BD-77A0-E619",
    idem: "bankfile:PR-2026-07:v2",
    valueDateIso: "2026-07-31",
    downloadedIso: "2026-07-30", downloadedTime: "16:44",
    disbursedIso: "2026-07-31", utr: "HDFCN26073100418827",
  };
  const SUPP_FILE = { id: "SF-2026-07-01", payees: JULY_EXCLUDED.length, v: JULY_EXCLUDED_TOTAL };

  /* ============================================================
     12 . PY-12 — PAYSLIP PUBLICATION.
     ============================================================ */
  const PUB_JULY = {
    runId: PREV_RUN_ID, state: "released",
    releasedIso: "2026-07-31", releasedTime: "18:00", by: MAKER,
    total: 408, delivered: 404,
    failures: [
      { channelKey: "pyo.pub.ch.email", n: 3, reasonKey: "pyo.pub.f.bounced" },
      { channelKey: "pyo.pub.ch.sms", n: 1, reasonKey: "pyo.pub.f.mobile" },
    ],
    reissue: {
      personKey: "pyo.n.suresh", staff: "NAV-0263", onIso: "2026-08-07",
      reasonKey: "pyo.pub.reissueReason", source: "AR-2026-08",
    },
  };
  const PUB_FAILED = PUB_JULY.failures.reduce((s, f) => s + f.n, 0);

  /* ============================================================
     13 . PY-18 — THE REPORT SET. Payroll's own registers only:
     statutory filings and challans belong to the Accountant
     (AC-04 / AC-05) and are absent here on purpose.
     ============================================================ */
  const REPORTS = [
    { key: "py18.rep.register", scope: "run", reconKey: "py18.recon.register" },
    { key: "py18.rep.salary", scope: "run", reconKey: "py18.recon.salary" },
    { key: "py18.rep.deductions", scope: "run", reconKey: "py18.recon.deductions" },
    { key: "py18.rep.loans", scope: "period", reconKey: "py18.recon.loans" },
    { key: "py18.rep.reimb", scope: "period", reconKey: "py18.recon.reimb" },
    { key: "py18.rep.arrears", scope: "period", reconKey: "py18.recon.arrears" },
    { key: "py18.rep.cost", scope: "session", reconKey: "py18.recon.cost" },
    { key: "py18.rep.payGroup", scope: "run", reconKey: "py18.recon.payGroup" },
    { key: "py18.rep.campus", scope: "run", reconKey: "py18.recon.campus" },
  ];
  const CAMPUS_SPLIT = [
    { key: "pyo.camp.indira", heads: 214, v: 13284900.0 },
    { key: "pyo.camp.white", heads: 172, v: 10692400.0 },
    { key: "pyo.camp.hyd", heads: 26, v: 1516450.0 },
  ];
  const CAMPUS_TOTAL = sum(CAMPUS_SPLIT);
  const CAMPUS_HEADS = CAMPUS_SPLIT.reduce((s, r) => s + r.heads, 0);

  addStrings({
    en: {
      "pyo.n.arvind": "Arvind Bhosale",
      "pyo.n.jyoti": "Jyoti Sawant",

      /* ---------- PY-09 ---------- */
      "py09.title": "What moved since July",
      "py09.reg.title": "Everyone whose pay moved",
      "py09.reg.sub": "Ten people moved against July. {c} crossed the gate and {b} did not, and both kinds are listed.",
      "py09.q": "What changed since last month, and can every change be explained?",
      "py09.sub": "Everyone whose net differs from July, gate or no gate. What you write here is what the checker reads.",
      "py09.gate.title": "The flagging gate",
      "py09.gate.line": "{pct} of July's net, or {amt}, whichever is reached first.",
      "py09.gate.src": "Payroll policy {v}, effective {d}, set by the group administrator. Operational, not statutory.",
      "py09.gate.pct": "Percentage of July's net",
      "py09.gate.abs": "Or an amount, whichever comes first",
      "py09.gate.apply": "Re-flag the register",
      "py09.gate.restore": "Restore the published policy",
      "py09.gate.local": "Working with a local gate of {pct} or {amt}. The published policy is unchanged; restore it whenever you like.",
      "py09.gate.err": "Both figures have to be numbers above zero. A gate of zero flags everybody and reviews nothing.",
      "py09.noAuto": "Nothing is cleared automatically and nothing is hidden. A variance nobody looked at is a variance that ships.",

      "py09.col.person": "Staff",
      "py09.col.group": "Pay group",
      "py09.col.cause": "Cause",
      "py09.col.prev": "July net",
      "py09.col.cur": "August net",
      "py09.col.delta": "Change",
      "py09.col.flag": "Against the gate",
      "py09.col.expl": "Explained",
      "py09.col.act": "",
      "py09.crossed": "Crossed",
      "py09.below": "Within",
      "py09.noPrior": "No July to compare",
      "py09.select": "Select {name} for a bulk explanation",
      "py09.selected": "{n} selected",
      "py09.bulk.title": "Explain the selected rows together",
      "py09.bulk.same": "All {n} share one cause: {cause}. One explanation covers them, recorded on each row.",
      "py09.bulk.mixed": "Blocked. The {n} rows carry {k} different causes. One explanation across different causes explains nothing.",
      "py09.bulk.go": "Explain these {n}",
      "py09.bulk.clear": "Clear the selection",
      "py09.rest": "The other {n} people are paid exactly what they were paid in July.",
      "py09.unexplained": "{n} still unexplained",
      "py09.allExplained": "Every flagged row is explained",
      "py09.complete": "Mark the review complete",
      "py09.completeOff": "{n} flagged rows have no explanation yet. Explain them, or the run cannot go to {who}.",
      "py09.completeDone": "Review marked complete on {when}. The run may now be sent for approval from the run console.",
      "py09.completeNote": "Marking it complete does not approve anything. It records that a person read every flagged row and said why it moved.",
      "py09.approvalHere": "The approval control is not on this screen, and not on this page.",
      "py09.approvalWhy": "Approving the run is the checker's act and it lives on their gate. What belongs here is the evidence they will read.",
      "py09.export": "Export the variance report",
      "py09.exportNote": "CSV and PDF. This is the artefact the checker opens, so taking it is recorded with your name.",
      "py09.menu.aria": "Actions for {name}",
      "py09.menu.explain": "Explain this row",
      "py09.menu.reexplain": "Change the explanation",
      "py09.menu.drill": "Open July beside August",
      "py09.menu.editSalary": "Edit the salary",
      "py09.menu.editSalaryWhy": "Not from here. A salary revision is PY-05, and doing it mid-review would strand the figures you are reading.",
      "py09.expl.title": "Explain this variance",
      "py09.expl.body": "{name}'s net moved by {amt} against July. Choose the cause the system detected, or a different one, and say what happened.",
      "py09.expl.saved": "Explained by {who} on {when}",
      "py09.drill.title": "{name} - July beside August",
      "py09.drill.sub": "Every line of both payslips. The two nets are the two figures on the register row.",
      "py09.drill.col.line": "Line",
      "py09.drill.col.prev": "July",
      "py09.drill.col.cur": "August",
      "py09.drill.col.delta": "Change",
      "py09.drill.earn": "Earnings",
      "py09.drill.ded": "Deductions",
      "py09.drill.gross": "Gross",
      "py09.drill.dedTotal": "Total deductions",
      "py09.drill.net": "Net",
      "py09.drill.noPrev": "No July payslip \u2014 {name} joined this month. The register compares against the salary the offer assigned.",
      "py09.drill.days": "{n} of {t} paid days",
      "py09.drill.lect": "{n} lectures",
      "py09.drill.close": "Close the comparison",
      "py09.empty.head": "Nobody's pay moved",
      "py09.empty.body": "Not one person differs from July. That is rare enough to be suspicious - check the gate and the compute before you trust it.",
      "py09.pii": "Net pay shows here because this role holds the salary permission. Opening this tab is recorded against your name.",

      /* ---------- PY-10 ---------- */
      "py10.title": "The payslip register",
      "py10.q": "What exactly did this run produce, person by person?",
      "py10.sub": "{n} payslips in {g} pay groups. The column totals are the run's headline figures - they are the same numbers, added up here.",
      "py10.col.group": "Pay group",
      "py10.col.staff": "Staff",
      "py10.col.days": "Paid days",
      "py10.col.gross": "Gross",
      "py10.col.ded": "Deductions",
      "py10.col.emp": "Employer cost",
      "py10.col.net": "Net",
      "py10.total": "The whole run",
      "py10.units": "Paid on lectures",
      "py10.unitsNote": "Visiting faculty are paid per lecture under an honorarium rule, so a paid-days figure would be meaningless for them.",
      "py10.filter.label": "Show",
      "py10.filter.all": "Every pay group",
      "py10.filter.note": "Filtering changes which payslips are listed. The totals above always describe the whole run.",
      "py10.locked": "Draft - not locked yet",
      "py10.lockedNote": "Payslips lock when the checker approves the run. After that a correction is an arrears posting, never an edit.",
      "py10.verify.title": "Does the register add up?",
      "py10.verify": "Verify the reconciliation",
      "py10.verify.ok": "Register {a} = sum of payslips {b} = the run's headline {c}. They agree.",
      "py10.verify.fail": "They do not agree. Register {a}, payslips {b}, headline {c}. Approval is blocked until the run is recomputed.",
      "py10.verify.note": "Run this before you send it. A register that does not reconcile is the one defect nobody downstream catches.",
      "py10.preview": "Preview the mismatch state",
      "py10.previewNote": "A demonstration only. It shows what a failed reconciliation looks like; it changes no figure and nothing is recorded.",
      "py10.people.title": "Payslips in {group}",
      "py10.people.sub": "{n} of {t} shown. The group's own total is the row above; this list is a sample, so it deliberately carries no total of its own.",
      "py10.people.col.person": "Staff",
      "py10.people.col.days": "Paid days",
      "py10.people.col.gross": "Gross",
      "py10.people.col.ded": "Deductions",
      "py10.people.col.net": "Net",
      "py10.people.open": "Open the payslip",
      "py10.slip.title": "{name} - {mon} 2026",
      "py10.slip.sub": "Every line, with where it came from.",
      "py10.slip.close": "Close the payslip",
      "py10.slip.prov": "Provenance",
      "py10.slip.prov.struct": "Salary structure, effective-dated",
      "py10.slip.prov.stat": "Statutory, computed on {v}",
      "py10.slip.prov.loan": "Loan schedule {id}",
      "py10.slip.prov.arrear": "Arrears posting AR-2026-08",
      "py10.slip.prov.lop": "Paid-days reconciliation, {n} unpaid at {rate} a day",
      "py10.slip.prov.hon": "Honorarium rule, {n} lectures",
      "py10.edit.absent": "There is no Edit on a payslip, for anyone.",
      "py10.edit.absentWhy": "Before approval, recompute the run. After approval, post arrears that supersede. Editing a payslip in place breaks both the register and the audit.",
      "py10.export": "Export the register",
      "py10.exportNote": "CSV and PDF. This export is the artefact the payroll regression compares against, so it is taken, recorded, and never edited.",
      "py10.bank.absent": "The bank file is not on this tab. It is on Pay & publish, and it cannot be generated until the checker approves.",

      /* ---------- PY-11 ---------- */
      "py11.title": "Disbursement and the bank file",
      "py11.q": "How does the money actually leave the bank?",
      "py11.aug.state": "August cannot generate a file yet",
      "py11.aug.why": "{run} is with {who}, {role}. A payment instruction before a second person releases the run is what maker-checker prevents.",
      "py11.aug.payable": "Would leave the bank",
      "py11.aug.payableNote": "{n} payees, {h} payouts held, computed on {v}",
      "py11.gen": "Generate the bank file",
      "py11.genOff": "Awaiting {who}. The run has to be approved first.",
      "py11.aug.fixFirst": "Fix these before the file is generated",
      "py11.aug.fixNote": "{n} people would be left out of the file for {amt}. Resolve each one and they go into this file, not a supplementary run.",
      "py11.x.col.person": "Staff",
      "py11.x.col.account": "Account",
      "py11.x.col.why": "Why they would be excluded",
      "py11.x.col.amount": "Their net",
      "py11.x.col.act": "",
      "py11.x.none": "No account on file",
      "py11.x.resolve": "Fix the bank details",
      "py11.x.resolveNote": "Opens the employee's bank fields in HR. A bank-detail change is checked by a second person before it takes effect.",
      "py11.x.fixed": "Corrected {when} by {who}",
      "py11.mask": "Only the last four digits are ever shown, to anyone, including payroll.",

      "py11.july.title": "July's file, from start to reference",
      "py11.july.state": "Disbursed on {d}",
      "py11.file.versionLabel": "Version",
      "py11.file.version": "File v{n}",
      "py11.file.supersedes": "Supersedes v{n}",
      "py11.file.superseded": "v{n} was superseded on {when}. {why}",
      "py11.file.doubleUpload": "Do not upload both. v{n} replaces v{p} in full; uploading the superseded file pays everybody twice.",
      "py11.file.format": "Format",
      "py11.file.checksum": "Checksum",
      "py11.file.idem": "Idempotency key",
      "py11.file.idemNote": "A retry with the same key returns the same file. It cannot create a second payment instruction.",
      "py11.file.valueDate": "Value date",
      "py11.file.generated": "Generated {when} by {who}",
      "py11.file.downloaded": "Downloaded {when}. Every download of this file is recorded - it moves money.",
      "py11.file.download": "Download the file",
      "py11.file.batches": "Split by bank",
      "py11.b.col.bank": "Bank",
      "py11.b.col.payees": "Payees",
      "py11.b.col.amount": "Amount",
      "py11.b.total": "In the file",
      "py11.disbursed": "Marked disbursed",
      "py11.disbursedOn": "{d}, reference {utr}",
      "py11.disbursedNote": "There is no undo. A reversal is a matter for the bank, recorded as a note against this run.",

      "py11.supp.title": "The two who were left out of July",
      "py11.supp.sub": "{who} has corrected both sets of bank details. This file covers exactly these {n} people for {amt}.",
      "py11.supp.proposed": "No off-cycle run exists in the first release, so a supplementary file is a proposal, not a settled rule.",
      "py11.supp.gen": "Generate the supplementary file",
      "py11.supp.generated": "{id} generated - {n} payees, {amt}, checksum {c}",
      "py11.supp.download": "Download it",
      "py11.supp.downloaded": "Downloaded. Now record what the bank gave back.",
      "py11.supp.mark": "Mark as disbursed",
      "py11.supp.date": "Disbursement date",
      "py11.supp.utr": "Bank reference or UTR",
      "py11.supp.utrPh": "As it appears on the bank's confirmation",
      "py11.supp.errUtr": "The bank's reference is required. Without it there is no way to prove this money left, and no way to trace it if a payment fails.",
      "py11.supp.errDate": "Give the date the bank processed it.",
      "py11.supp.done": "{id} disbursed on {d}, reference {utr}. Recorded against your name.",
      "py11.supp.noReturn": "No bank return-file ingestion in this release, so a partial rejection is found on the bank statement and recorded here by hand.",

      /* ---------- PY-12 ---------- */
      "py12.title": "Payslip publication",
      "py12.q": "Have staff been given their payslips?",
      "py12.aug.state": "August is not released",
      "py12.aug.why": "{run} is not approved. Publishing a payslip nobody has released puts an unchecked figure in front of {n} people.",
      "py12.release": "Release payslips",
      "py12.releaseOff": "The run is not approved yet.",
      "py12.channels": "Channels",
      "py12.ch.inapp": "In the app",
      "py12.ch.email": "Email",
      "py12.ch.sms": "SMS notice",
      "py12.ch.note": "In-app cannot be turned off \u2014 it is where the payslip lives. Email and SMS carry a notice, never the payslip.",
      "py12.password": "How the PDF is protected",
      "py12.passwordNote": "Every payslip PDF is password-protected, on the scheme published in the staff handbook. Payroll cannot read it off a screen.",
      "py12.july.title": "July, released",
      "py12.july.state": "Released {when} by {who}",
      "py12.july.delivered": "{d} of {t} delivered",
      "py12.july.failed": "{n} deliveries failed",
      "py12.f.col.channel": "Channel",
      "py12.f.col.n": "Failed",
      "py12.f.col.why": "Why",
      "py12.f.total": "Failed altogether",
      "py12.retry": "Retry the failed deliveries",
      "py12.retryNote": "Only the {n} that failed are sent again. Nobody who already has their payslip is sent a second one.",
      "py12.retried": "Retried {when}. The result appears against each channel as the sends come back.",
      "py12.unsee": "A released payslip cannot be unreleased.",
      "py12.unseeWhy": "Somebody has read it. A correction is a reissue that is published beside the original, and both are kept.",
      "py12.reissue.title": "One July payslip was reissued",
      "py12.reissue.body": "{name}, {id}, reissued on {when}. {why} The original stays on file and both versions are visible to them.",
      "py12.reissue.reason": "The correction came through arrears {src}, which a distinct checker approved. The reissue only publishes it.",
      "py12.reissue.do": "Reissue after a correction",
      "py12.reissue.prompt": "Reissuing publishes a second payslip beside the original. Say why, in words the employee will read.",

      /* ---------- PY-13 ---------- */
      "py13.title": "Loans and advances",
      "py13.q": "Who owes what, and what will be deducted this month?",
      "py13.hero.label": "Recovering this month",
      "py13.hero.note": "{n} instalments inside {run}. This is the loan deduction line in the run, to the rupee.",
      "py13.hero.out": "Still owed across every open loan",
      "py13.sameName": "Another member of staff carries this name \u2014 NAV-0270, visiting faculty, no loan. Read the staff ID before you act.",
      "py13.col.person": "Staff",
      "py13.col.kind": "Kind",
      "py13.col.principal": "Principal",
      "py13.col.emi": "Instalment",
      "py13.col.progress": "Paid",
      "py13.col.out": "Outstanding",
      "py13.col.run": "This run",
      "py13.col.state": "State",
      "py13.col.act": "",
      "py13.kind.loan": "Loan",
      "py13.kind.advance": "Advance",
      "py13.progress": "{p} of {t}",
      "py13.total": "Across the register",
      "py13.perq": "Perquisite",
      "py13.perqNote": "Interest-free, so the run computes a perquisite value from {v} and it appears on the payslip.",
      "py13.noPerq": "Carries interest at {r} a year under the loan's own terms, so no perquisite arises.",
      "py13.skipped": "One instalment deferred in {mon}; the schedule runs a month longer. What is owed did not change.",
      "py13.atExit": "Left on {d}. No instalment in this run - the balance moves to settlement {id}.",
      "py13.pendingRow": "Raised by {who} on {d}. Nothing is deducted and no schedule runs until a distinct approver releases it.",
      "py13.foreclosedRow": "Foreclosed {d}, with {amt} written off. The waiver is on the audit record with the reason.",
      "py13.closedRow": "Closed {d}. Every instalment paid.",
      "py13.menu.aria": "Actions for {name}",
      "py13.menu.schedule": "View the repayment schedule",
      "py13.menu.foreclose": "Foreclose this loan",
      "py13.menu.forecloseOff": "Only an active loan can be foreclosed.",
      "py13.menu.skip": "Defer one instalment",
      "py13.menu.skipOff": "Nothing is scheduled this month to defer.",
      "py13.menu.waive": "Write off one instalment",
      "py13.menu.waiveOff": "Nothing is scheduled this month to write off.",
      "py13.menu.settlement": "Open the settlement",
      "py13.menu.approve": "Approve this loan",
      "py13.menu.approveWhy": "Not here. A loan sanction is released by someone holding payroll.approve who did not raise it.",
      "py13.sched.title": "{name} - repayment schedule",
      "py13.sched.sub": "{id}. Principal {p}, interest {i}, repayable {r} over {t}.",
      "py13.sched.col.n": "No.",
      "py13.sched.col.due": "Falls due",
      "py13.sched.col.principal": "Principal",
      "py13.sched.col.interest": "Interest",
      "py13.sched.col.emi": "Instalment",
      "py13.sched.col.state": "State",
      "py13.sched.col.where": "Deducted in",
      "py13.sched.st.paid": "Paid",
      "py13.sched.st.this": "This run",
      "py13.sched.st.due": "Scheduled",
      "py13.sched.st.skipped": "Deferred",
      "py13.sched.total": "Over the whole schedule",
      "py13.sched.close": "Close the schedule",
      "py13.skip.title": "Defer or write off - they are not the same thing",
      "py13.skip.body": "Deferring moves this instalment to the end; {name} still owes it. Writing it off reduces the balance for good.",
      "py13.skip.defer": "Defer it",
      "py13.skip.waive": "Write it off",
      "py13.skip.waiveSecond": "Writing off moves money, so it goes to a second person before it takes effect.",
      "py13.fc.title": "Foreclose {id}",
      "py13.fc.body": "{name} owes {amt}. A settlement below that figure is a write-off, and a write-off needs a reason and a second person.",
      "py13.fc.amount": "Settlement amount",
      "py13.fc.short": "That is {amt} short of the outstanding balance. Say why the school is writing it off - a shortfall with no reason is refused.",
      "py13.fc.ok": "Settles the balance in full.",
      "py13.new.title": "Raise a loan or advance",
      "py13.new.sub": "A schedule is built the moment this is saved, but nothing is deducted until a distinct approver releases it.",
      "py13.new.person": "Who is it for",
      "py13.new.kind": "Kind",
      "py13.new.principal": "Principal",
      "py13.new.tenure": "Instalments",
      "py13.new.perq": "Interest-free - flag the perquisite",
      "py13.new.start": "First instalment",
      "py13.new.startNext": "Next run, September 2026",
      "py13.new.emi": "Each instalment works out at {amt}.",
      "py13.new.submit": "Save and send for approval",
      "py13.new.errPrincipal": "Give a principal above zero.",
      "py13.new.errTenure": "Give at least one instalment.",
      "py13.new.errNet": "Refused. {name} takes home {net}; an instalment of {emi} leaves {left}. Recovery may not push pay below zero.",
      "py13.new.errNetShort": "This would take their pay below zero",
      "py13.new.errLocked": "Refused. September is the first run this can start in; August is with the checker and a locked period cannot take a new schedule.",
      "py13.new.ok": "Saved as {id}, awaiting {who}. Nothing is deducted until they release it.",
      "py13.new.headroom": "{name} takes home {net} this month, with {c} already going to an existing recovery.",
      "py13.export": "Export the register",
      "py13.exportNote": "CSV. The loans and deductions register, as the labour codes ask for it.",
      "py13.empty.head": "No loan or advance is open",
      "py13.empty.body": "Nothing is being recovered from anybody this month. Raise one when a member of staff asks.",
    },
  });

  addStrings({
    en: {
      "pyo.loan.p.home": "Housing",
      "pyo.loan.p.vehicle": "Vehicle",
      "pyo.loan.p.education": "Children's education",
      "pyo.loan.p.medical": "Medical",
      "pyo.loan.p.festival": "Festival advance",
      "pyo.loan.skip.reason": "Hospital bill in the same month; deferred at the employee's written request.",

      "pyo.bank.hdfc": "HDFC Bank",
      "pyo.bank.icici": "ICICI Bank",
      "pyo.bank.sbi": "State Bank of India",
      "pyo.bank.axis": "Axis Bank",
      "pyo.bank.format": "NEFT bulk, the trust's own bank layout",
      "pyo.bank.x.checksum": "The account number fails the bank's own check",
      "pyo.bank.x.none": "No bank account on the employee record",
      "pyo.bank.x.ifsc": "The branch code is not one the bank recognises",
      "pyo.bank.v1Reason": "v1 carried the wrong value date, so it was regenerated before anything was uploaded.",

      "pyo.pub.ch.email": "Email",
      "pyo.pub.ch.sms": "SMS notice",
      "pyo.pub.f.bounced": "The address bounced",
      "pyo.pub.f.mobile": "The mobile number is not reachable",
      "pyo.pub.reissueReason": "A lecture count was corrected after release.",

      "pyo.cat.lta": "Leave travel",
      "pyo.cat.med": "Medical",
      "pyo.cat.tel": "Telephone",
      "pyo.cat.books": "Books and academic allowance",
      "pyo.cat.fuel": "Fuel",
      "pyo.tax.exempt": "Exempt",
      "pyo.tax.taxable": "Taxable",
      "pyo.tax.fbp": "Flexible benefit",
      "pyo.tax.lta": "Exempt against the journey proof already verified with the claim.",
      "pyo.tax.med": "Taxable in the employee's hands and added to the month's taxable pay.",
      "pyo.tax.tel": "Reimbursement of an actual bill, so nothing is added to taxable pay.",
      "pyo.tax.books": "Inside the flexible benefit each of these employees declared, so it is not added to taxable pay.",
      "pyo.tax.fuel": "A perquisite. Its taxable value is computed by the run from the pinned configuration.",

      "pyo.arr.src.revision": "Pay revision",
      "pyo.arr.src.davda": "Dearness allowance revision",
      "pyo.arr.src.promotion": "Promotion",
      "pyo.arr.src.correction": "Correction",
      "pyo.arr.excl.noConfig": "The version pinned to March 2026 is not in this tenant's archive, so the month is excluded rather than recomputed on today's.",
      "pyo.arr.staleCause": "A September revision for one of these three was accepted after you submitted, so the checker is holding figures the inputs no longer produce.",
      "pyo.batch.sentBackReason": "Two claims carry the same receipt number. Check claim 11 and claim 17 before you send it again.",

      "pyo.ff.l.salary": "Salary still owed",
      "pyo.ff.l.encash": "Leave encashment",
      "pyo.ff.l.gratuity": "Gratuity",
      "pyo.ff.l.exgratia": "Ex-gratia",
      "pyo.ff.l.notice": "Notice recovery",
      "pyo.ff.l.loan": "Loan recovery",
      "pyo.ff.l.reimb": "Reimbursements owed",
      "pyo.ff.l.tds": "Income tax true-up",
      "pyo.ff.noticeFull": "Full notice served, so nothing is recovered.",
      "pyo.ff.svc.zainab": "3 years 4 months",
      "pyo.ff.svc.ritu": "9 years 1 month",
      "pyo.ff.block.service": "A four-month gap in 2023 is unclosed. Continuous service cannot be established, so gratuity cannot be computed.",
      "pyo.ff.noGratuity": "Not payable. Service is {svc}; the qualifying period in {v} is not met. Stated rather than left as a silent zero.",
      "pyo.ff.src.salary": "Paid days after the last run",
      "pyo.ff.src.encash": "Leave ledger, at basic and dearness pay",
      "pyo.ff.src.gratuity": "Service record and the pinned configuration",
      "pyo.ff.src.exgratia": "Discretionary, at the school's decision",
      "pyo.ff.src.notice": "Employment contract",
      "pyo.ff.src.loan": "Loan register",
      "pyo.ff.src.reimb": "Approved, unpaid claims",
      "pyo.ff.src.tds": "Tax computed to date on the pinned version",
    },
  });

  addStrings({
    en: {
      /* ---------- PY-14 ---------- */
      "py14.title": "Reimbursement payout batch",
      "py14.q": "Which approved claims are we paying this month, and who signs it off?",
      "py14.sub": "Claims were approved one by one by the people who could judge them. Paying them is a separate act, and it is this one.",
      "py14.hero.label": "In the batch",
      "py14.hero.note": "{n} claims, attached to {run}, awaiting {who}",
      "py14.state": "Sent to {who} on {when}",
      "py14.stateNote": "Nothing in the batch changes while it waits. To take a claim out, recall the batch, change it, and send it again.",
      "py14.split.taxable": "Taxable",
      "py14.split.exempt": "Not taxable",
      "py14.split.note": "The split is summed from the claims themselves, category by category. It is what the run adds to each person's taxable pay.",
      "py14.cat.col.cat": "Category",
      "py14.cat.col.n": "Claims",
      "py14.cat.col.tax": "Tax treatment",
      "py14.cat.col.v": "Amount",
      "py14.cat.total": "The batch",
      "py14.claims.title": "Every claim in the batch",
      "py14.claims.sub": "{n} claims. Removing one changes the total, the split and the count, here and on the checker's copy.",
      "py14.claims.filter": "Category",
      "py14.claims.all": "Every category",
      "py14.c.col.id": "Claim",
      "py14.c.col.person": "Staff",
      "py14.c.col.cat": "Category",
      "py14.c.col.approved": "Approved",
      "py14.c.col.v": "Amount",
      "py14.c.col.act": "",
      "py14.c.shown": "Showing {n} of {t}",
      "py14.c.remove": "Take it out of the batch",
      "py14.c.removeOff": "The batch is with the checker. Recall it first; a batch cannot change under someone who is reading it.",
      "py14.c.add": "Put it back in",
      "py14.c.removed": "{n} taken out of this draft",
      "py14.withdrawn": "{name} withdrew claim {id} for {amt} on {when}, so it was dropped from the draft before it was sent. It is not in the total.",
      "py14.recall": "Recall it from the checker",
      "py14.recallPrompt": "This takes the batch back from {who}. Not an undo \u2014 the recall goes on the record with your reason.",
      "py14.recalled": "Recalled {when}. The batch is a draft again and {who} has been told why.",
      "py14.send": "Send for approval",
      "py14.sendPrompt": "{n} claims, {amt}, to {who}, {role}, {id}. Once sent, nothing in it can change until they decide.",
      "py14.approve.absent": "There is no Approve on this tab.",
      "py14.approve.absentWhy": "You built this batch, so {who} releases it. A payout batch is separate precisely so a different person signs it.",
      "py14.prev.title": "Last month, this batch came back",
      "py14.prev.body": "{id} was sent on {sent} and returned by {who} on {back}. It was corrected and resubmitted as {again}.",
      "py14.prev.reasonLabel": "What they wrote",
      "py14.export": "Export the batch",
      "py14.exportNote": "CSV, claim by claim, with the tax treatment against each one.",
      "py14.empty.head": "No claim is waiting to be paid",
      "py14.empty.body": "Every approved claim has been paid out in an earlier batch. New ones appear here as they are approved.",

      /* ---------- PY-15 ---------- */
      "py15.title": "Arrears workbench",
      "py15.q": "What does this back-dated revision owe, month by month?",
      "py15.sub": "Each month is recomputed on the configuration version pinned to THAT month, never today's.",
      "py15.list.title": "Arrears postings",
      "py15.l.col.id": "Posting",
      "py15.l.col.source": "Source",
      "py15.l.col.people": "People",
      "py15.l.col.range": "Months",
      "py15.l.col.gross": "Gross arrears",
      "py15.l.col.state": "State",
      "py15.range": "{from} to {to}",
      "py15.detail.title": "{id} - the month split",
      "py15.m.col.month": "Month",
      "py15.m.col.cfg": "Computed on",
      "py15.m.col.old": "Paid then",
      "py15.m.col.new": "Should have been",
      "py15.m.col.delta": "Arrears",
      "py15.m.col.pf": "Provident fund",
      "py15.m.col.tds": "Income tax",
      "py15.m.col.net": "Reaches them",
      "py15.m.total": "The whole posting",
      "py15.pinNote": "Two versions appear because the months straddle {d}. One version down the column would mean a past month was recomputed on today's rules.",
      "py15.excl.title": "Months this computation refuses",
      "py15.excl.body": "{mon} 2026 is listed, not silently included and not silently dropped.",
      "py15.excl.resolve": "Ask the group administrator to restore the archived version",
      "py15.excl.blocks": "While a month is excluded this posting cannot be sent. A partial arrears posting is a debt the school forgets it owes.",
      "py15.create": "Start an arrears computation",
      "py15.create.source": "Source",
      "py15.create.sourceNone": "Choose the source",
      "py15.create.from": "From",
      "py15.create.to": "To",
      "py15.create.people": "Who it covers",
      "py15.create.errSource": "Choose a source. Every arrears posting has to say what caused it before anyone can judge it.",
      "py15.compute": "Compute the split",
      "py15.computeOff": "Give it a source and a range first.",
      "py15.computed": "Computed {when}. Recompute as often as you like while it is a draft; nothing is recorded against a draft.",
      "py15.send": "Send for approval",
      "py15.sendOff": "{n} month is excluded and unresolved. Resolve it or narrow the range, then send.",
      "py15.sendPrompt": "{amt} of gross arrears across {n} months and {p} people, to {who}, {role}, {id}.",
      "py15.post": "Post to a run",
      "py15.postOff": "Not approved yet. {who} has to release it first.",
      "py15.postTarget": "Target run",
      "py15.postedIn": "Posted into {run} on {when}. It is the arrears line inside that run's gross.",
      "py15.postBlocked": "A run that is already approved cannot take a posting. That is why this one targets {run}, not the month it is fixing.",
      "py15.stale": "Inputs changed after you sent this",
      "py15.staleBody": "{who} cannot release it as it stands. Recall, recompute and send it again.",
      "py15.recompute": "Recall and recompute",
      "py15.supersede": "Supersede with a correction",
      "py15.supersedePrompt": "A correction does not edit {id}. It creates a new adjustment beside it, and the original stays exactly as it was posted.",
      "py15.approve.absent": "There is no Approve on this tab either.",
      "py15.approve.absentWhy": "Posting arrears is a financial finalisation, so it goes to {who} like everything else on this page.",
      "py15.export": "Export the arrears statement",
      "py15.exportNote": "CSV, month by month, with the configuration version against each month.",
      "py15.notComputed.head": "Nothing has been computed yet",
      "py15.notComputed.body": "Give this posting a source and a range, then compute. Nothing is recorded against a draft, so compute it as often as you need.",
      "py15.empty.head": "No arrears are outstanding",
      "py15.empty.body": "Nothing back-dated is waiting to be computed. A back-dated revision in PY-05 offers to start one here.",

      /* ---------- PY-16 ---------- */
      "py16.title": "Exits and settlements",
      "py16.q": "Who is leaving, and where has each settlement got to?",
      "py16.scope": "The settlement surface, so people are named on it. The payroll home board reports settlements as a count.",
      "py16.filter.label": "Show",
      "py16.filter.open": "Still open",
      "py16.holding": "What is holding these up",
      "py16.filter.all": "Everyone who has left",
      "py16.filter.campus": "Campus",
      "py16.filter.allCampus": "Every campus",
      "py16.col.person": "Staff",
      "py16.col.campus": "Campus",
      "py16.col.lwd": "Last working day",
      "py16.col.clock": "Since",
      "py16.col.notice": "Notice",
      "py16.col.state": "Settlement",
      "py16.col.net": "Net payable",
      "py16.col.act": "",
      "py16.clock.days": "{n} days",
      "py16.clock.future": "In {n} days",
      "py16.clock.note": "Days since the last working day. A settlement that drifts past the statutory timeline is a liability, not an inconvenience.",
      "py16.notice.full": "Served in full",
      "py16.notice.short": "{n} days short",
      "py16.start": "Start the settlement",
      "py16.startOff": "The service record has to be whole first.",
      "py16.provisional": "Their last working day has not arrived. A settlement prepared now stays provisional until the final month reconciles.",
      "py16.accessGap": "Still has access, five days after leaving",
      "py16.accessBody": "The last working day has passed and this account is still active. Nobody should wait on the settlement to close it.",
      "py16.accessFix": "Close the account in HR",
      "py16.overdue": "Approved on {d} and still unpaid.",
      "py16.paidWith": "Paid on {d} with {run}.",
      "py16.menu.aria": "Actions for {name}",
      "py16.menu.open": "Open the settlement",
      "py16.menu.loan": "Open their loan",
      "py16.menu.access": "Flag the access gap",
      "py16.export": "Export",
      "py16.exportNote": "CSV. Everything on this list, with the compliance clock against each row.",
      "py16.empty.head": "Nobody is leaving",
      "py16.empty.body": "No exit is open under this filter. Widen it to see settlements already paid.",
      "py16.notStartedN": "{n} settlements are waiting to be prepared. On the payroll home board they appear as that number and nothing else.",

      /* ---------- PY-17 ---------- */
      "py17.title": "Full and final settlement",
      "py17.q": "What do we owe this leaver, or they us?",
      "py17.for": "{name} - {id}",
      "py17.meta": "{group}, {campus}. Last working day {lwd}. Continuous service {svc}.",
      "py17.mode.required": "This settlement needs a second approver",
      "py17.mode.requiredBody": "Your school is configured that way, so it goes to {who}, {role}, {id} before anything is paid or recovered.",
      "py17.mode.single": "Your school allows single-person completion",
      "py17.mode.singleBody": "No second approver on this settlement. It is recorded as completed by you alone, and the record says so.",
      "py17.mode.preview": "Preview the other configuration",
      "py17.mode.previewNote": "A preview of a school configured the other way. It changes nothing \u2014 the mode is tenant configuration, not a control.",
      "py17.mode.narrow": "The only exception in the product. Runs, bank files, filings, payout batches, arrears and bonus always need two people.",

      "py17.l.col.line": "Component",
      "py17.l.col.source": "Where it comes from",
      "py17.l.col.v": "Amount",
      "py17.l.col.act": "",
      "py17.net": "Net payable",
      "py17.netRecover": "Net recoverable from them",
      "py17.negative": "The recoveries come to more than the payments",
      "py17.negativeBody": "{name} owes the school {amt}, raised as a receivable and pursued outside payroll. A settlement may be negative; a payslip may not.",
      "py17.encashDetail": "{n} days at {rate}, on basic and dearness pay. The 10(10AA) exemption is applied from {v}.",
      "py17.noticeDetail": "Contract notice {c} days, served {s}. {n} days short at {rate} a day.",
      "py17.loanDetail": "Balance on {id} after the last instalment that ran. It leaves the loan register and lands here, once.",
      "py17.reimbNote": "No approved, unpaid claim is on file. Whether such claims belong in a settlement is an open question the specification does not answer.",
      "py17.override": "Override this amount",
      "py17.overrideOff": "Computed from the configuration and the service record. Overriding a statutory line makes a settlement no rule can reproduce.",
      "py17.overrideTitle": "Override {line}",
      "py17.overrideBody": "The computed amount stays on the record next to yours. Whoever reads this later sees both figures and your reason.",
      "py17.overrideAmount": "Your amount",
      "py17.overrideDone": "Computed {c}, overridden to {o} by {who}",
      "py17.waive": "Waive the notice recovery",
      "py17.waiveOff": "There is nothing to waive - notice was served in full.",
      "py17.waiveTitle": "Waive the notice recovery",
      "py17.waiveBody": "This gives up {amt}. It goes on the record with your name and your reason, and the checker sees it.",
      "py17.waived": "Waived by {who}. The computed recovery of {amt} is still on the record.",
      "py17.compute": "Recompute the settlement",
      "py17.computed": "Computed {when} from the service record, the leave ledger, the loan register and {v}.",
      "py17.send": "Send for approval",
      "py17.sendPrompt": "{name}'s settlement, {amt}, to {who}, {role}, {id}. Say nothing more until they have read it.",
      "py17.complete": "Complete the settlement",
      "py17.completePrompt": "Your school allows single-person completion, so this is recorded as completed by you alone. It closes her access today.",
      "py17.completeAbsent": "There is no single-person completion on this settlement.",
      "py17.completeAbsentWhy": "Your school requires a second approver on settlements, so the control does not exist here at all.",
      "py17.approve.absent": "There is no Approve here.",
      "py17.approve.absentWhy": "You computed this settlement. It goes to {who}, {role}, {id}, who did not.",
      "py17.access": "Releasing this closes {name}'s access today. Payslips, Form 16, PF, insurance and service book stay on file as the law requires.",
      "py17.payslip": "Generate the final payslip",
      "py17.payslipOff": "After approval. The final payslip is the settlement, and the settlement is not approved.",
      "py17.export": "Export the settlement statement",
      "py17.exportNote": "PDF. This is the sheet the leaver signs, so it is generated from the record and never retyped.",
      "py17.readonly": "Prepared by {who} and already with {checker}. Nothing on it can change while they hold it.",
      "py17.pick": "Choose a settlement from the register above.",

      /* ---------- PY-18 ---------- */
      "py18.title": "Reports and registers",
      "py18.q": "What payroll register do I need to produce?",
      "py18.sub": "Every report states its period, the run it derives from, the configuration that run pinned, and a line that reconciles it.",
      "py18.provisional": "August is provisional",
      "py18.provisionalBody": "{run} is not approved, so anything from it is a working figure and every export says so on its face.",
      "py18.periodLabel": "Period",
      "py18.col.report": "Report",
      "py18.col.scope": "Covers",
      "py18.col.source": "Derived from",
      "py18.col.cfg": "Pinned",
      "py18.col.state": "State",
      "py18.col.act": "",
      "py18.scope.run": "One run",
      "py18.scope.period": "A period",
      "py18.scope.session": "The session so far",
      "py18.final": "Final",
      "py18.prov": "Provisional",
      "py18.run": "Run it",
      "py18.download": "Download",
      "py18.schedule": "Send it monthly",
      "py18.scheduleWhy": "Scheduling is not built. The screen inventory marks it proposed, so it is named here rather than quietly left out.",
      "py18.saveView": "Save this view",
      "py18.saveViewWhy": "Saved views are proposed and unsettled in the same way. When they are decided they will appear here.",
      "py18.ran": "{name} produced for {period} from {run}, on {cfg}. {recon}",
      "py18.rep.register": "Payroll register",
      "py18.rep.salary": "Salary register",
      "py18.rep.deductions": "Deductions register",
      "py18.rep.loans": "Loans register",
      "py18.rep.reimb": "Reimbursement register",
      "py18.rep.arrears": "Arrears statement",
      "py18.rep.cost": "Month on month cost",
      "py18.rep.payGroup": "Split by pay group",
      "py18.rep.campus": "Split by campus",
      "py18.recon.register": "Reconciles to the sum of {n} payslips.",
      "py18.recon.salary": "Earnings add to the run's gross.",
      "py18.recon.deductions": "Employee deductions add to the run's deduction total.",
      "py18.recon.loans": "Instalments add to the loan line inside the run.",
      "py18.recon.reimb": "Claims add to the payout batch attached to the run.",
      "py18.recon.arrears": "Months add to the arrears line inside the run.",
      "py18.recon.cost": "Each month is that run's own net, on that run's own version.",
      "py18.recon.payGroup": "Pay groups add to the run's net.",
      "py18.recon.campus": "Campuses add to the run's net.",
      "py18.cost.title": "Month on month, this session",
      "py18.cost.col.period": "Period",
      "py18.cost.col.run": "Run",
      "py18.cost.col.heads": "Staff",
      "py18.cost.col.net": "Net",
      "py18.cost.col.change": "Against the month before",
      "py18.cost.col.cfg": "Pinned",
      "py18.cost.note": "April to June pinned {a}; July and August pin {b}. A month keeps the version in force in it \u2014 history, not a setting.",
      "py18.scopeOfThis": "What this screen does not produce",
      "py18.filings.absent": "Challans, returns and filings are not here.",
      "py18.filings.absentWhy": "Filing is the Accountant's work, on their screens. Two copies owned by two roles is how a school files the wrong one.",
      "py18.campus.title": "Split by campus, {mon} 2026",
      "py18.campus.col.campus": "Campus",
      "py18.campus.col.heads": "Staff",
      "py18.campus.col.net": "Net",
      "py18.campus.total": "The whole run",
    },
  });

  /* ============================================================
     14 . LOCAL PRIMITIVES. The kit does not carry these yet; each is
     listed as a promotion candidate at the foot of the file.
     ============================================================ */

  /* a labelled read-out — the alternative to a grid of KPI tiles */
  function Fact({ label, children, note, w }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ minWidth: w || 140 }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={{ marginTop: 4 }}>{children}</div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 3, maxWidth: 420 })}>{note}</div> : null}
      </div>
    );
  }

  /* a control that is OFF with the reason in words beside it. The
     button stays clickable and announces itself, so a click never dead
     ends in silence. */
  function OffAction({ label, reason, iconLeft, kind, size }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [poked, setPoked] = useState(false);
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Button kind={kind || "secondary"} size={size} iconLeft={iconLeft} disabled onClick={() => setPoked(true)}>{label}</Button>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("pyo.disabledWhy")}</div>
          <p role={poked ? "alert" : undefined} style={ty("small", { color: c.inkMuted, margin: "3px 0 0", maxWidth: 620 })}>{reason}</p>
        </div>
      </div>
    );
  }

  /* a control that is NOT DRAWN, and says so. Absent, not disabled:
     a capability this role can never hold is not a greyed button. */
  function AbsentNote({ head, body, icon }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: c.sunken, border: "1px dashed " + c.borderStrong, borderRadius: G3.r.lg, padding: "13px 15px" }}>
        <span aria-hidden="true" style={{ color: c.inkFaint, display: "flex", marginTop: 1 }}><Icon name={icon || "lock"} size={17} /></span>
        <div style={{ minWidth: 0 }}>
          <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{head}</div>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 7 })}>{t("pyo.absentWhy")}</div>
          <p style={ty("small", { color: c.inkMuted, margin: "3px 0 0", maxWidth: 640 })}>{body}</p>
        </div>
      </div>
    );
  }

  /* a plain statement panel: a glyph, a headline and a paragraph.
     Tone comes from a data role, and the glyph carries it too, so the
     state is never colour alone. */
  function Panel({ tone, glyph, head, body, children, dashed }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const key = tone || "off";
    const tint = c[key + "Tint"] || c.sunken;
    const fg = c[key + "Text"] || c.inkMuted;
    return (
      <div style={{ display: "flex", gap: 13, alignItems: "flex-start", background: tint, border: (dashed ? "1px dashed " : "1px solid ") + fg, borderRadius: G3.r.lg, padding: "14px 16px" }}>
        <span aria-hidden="true" style={{ color: fg, display: "flex", marginTop: 1, flexShrink: 0 }}><Icon name={glyph || "alert"} size={18} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          {head ? <div style={ty("small", { color: fg, fontWeight: 700 })}>{head}</div> : null}
          {body ? <p style={ty("small", { color: c.ink, margin: head ? "4px 0 0" : 0, maxWidth: 720 })}>{body}</p> : null}
          {children}
        </div>
      </div>
    );
  }

  /* a signed arithmetic column: the parts, then the rule, then the
     total — where the total is summed in code from the parts above it */
  function EqRow({ sign, label, value, strong, rule, note, tone }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div>
        <div
          style={{
            display: "flex", alignItems: "baseline", gap: 12,
            padding: strong ? "12px 0 2px" : "7px 0",
            borderTop: rule ? "1px solid " + c.borderStrong : "none",
            marginTop: rule ? 6 : 0,
          }}
        >
          <span aria-hidden="true" style={G3.fig("sm", { width: 16, color: c.inkFaint, flexShrink: 0 })}>{sign}</span>
          <span style={ty("small", { color: strong ? c.ink : c.inkMuted, fontWeight: strong ? 700 : 500, flex: 1, minWidth: 0 })}>{label}</span>
          <Figure value={inr(value)} size={strong ? 22 : "md"} weight={strong ? 700 : 600} color={tone || c.ink} align="right" />
        </div>
        {note ? <div style={ty("caption", { color: c.inkFaint, margin: "0 0 4px 28px", maxWidth: 560 })}>{note}</div> : null}
      </div>
    );
  }

  /* a table that lives INSIDE a card the caller already opened. The
     kit's Register brings its own card, which is right for a page's
     principal record and wrong for a table inside a section. */
  function MiniTable({ columns, rows, total, note, emptyKey }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!rows.length) {
      return <p style={ty("small", { color: c.inkMuted, margin: "10px 0 0" })}>{t(emptyKey || "py09.empty.head")}</p>;
    }
    const th = (col) => ty("colLabel", {
      color: c.inkFaint, textAlign: col.align || "left", padding: "0 9px 8px",
      textTransform: "uppercase", whiteSpace: "nowrap", width: col.width,
    });
    return (
      <div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
              {columns.map((col) => <th key={col.key} scope="col" style={th(col)}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id == null ? i : row.id} style={{ borderBottom: i < rows.length - 1 ? "1px solid " + c.rule : "none", background: row.highlight ? c.sel : "transparent" }}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={col.mono
                      ? G3.fig("sm", { padding: "9px 9px", textAlign: col.align || "left", color: row.dim ? c.inkFaint : c.ink, fontWeight: 500, whiteSpace: "nowrap", verticalAlign: "middle" })
                      : ty("small", { padding: "9px 9px", textAlign: col.align || "left", color: row.dim ? c.inkFaint : c.ink, verticalAlign: "middle" })}
                  >
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
                  <td
                    key={col.key}
                    style={col.mono
                      ? G3.fig("md", { padding: "12px 9px", textAlign: col.align || "left", color: c.ink, fontWeight: 700, whiteSpace: "nowrap" })
                      : ty("small", { padding: "12px 9px", textAlign: col.align || "left", color: c.ink, fontWeight: 700 })}
                  >
                    {total.cells[col.key] != null ? total.cells[col.key] : (i === 0 ? total.label : null)}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
        {note ? <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0", maxWidth: 760 })}>{note}</p> : null}
      </div>
    );
  }

  /* reason code + free note + a confirm that is NEVER hard-disabled —
     a disabled submit swallows the click that would have shown the
     validation, so it stays live and explains itself instead. */
  function ReasonPrompt({ idBase, title, body, options, confirmLabel, onConfirm, onCancel, extra, amountField, amountLabel, amountValue, onAmount, amountError }) {
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
        {body ? <p style={ty("small", { color: c.inkMuted, margin: "6px 0 14px", maxWidth: 700 })}>{body}</p> : <div style={{ height: 12 }} />}
        {extra}
        {amountField ? (
          <Field id={idBase + "-amt"} label={amountLabel} error={amountError}>
            <Input id={idBase + "-amt"} value={amountValue} onChange={onAmount} inputMode="decimal" />
          </Field>
        ) : null}
        <Field id={idBase + "-code"} label={t("pyo.reason.label")} error={err === "pick" ? t("pyo.reason.errPick") : null}>
          <Select
            id={idBase + "-code"} value={code} onChange={setCode}
            options={[{ value: "", label: t("pyo.reason.pick") }].concat(options.map((o) => ({ value: o, label: t(o) })))}
          />
        </Field>
        <Field id={idBase + "-note"} label={t("pyo.reason.note")} error={err === "note" ? t("pyo.reason.errNote") : null}>
          <Input id={idBase + "-note"} value={note} onChange={setNote} placeholder={t("pyo.reason.notePh")} />
        </Field>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Button kind="primary" onClick={go}>{confirmLabel || t("pyo.confirm")}</Button>
          <Button kind="quiet" onClick={onCancel}>{t("pyo.cancel")}</Button>
        </div>
      </div>
    );
  }

  /* a confirm that RESTATES what is about to happen, names the person
     it goes to, and cannot be reached by one click from a row */
  function ConfirmPanel({ title, body, confirmLabel, onConfirm, onCancel, children }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ background: c.raised, border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: "16px 18px 18px", marginTop: 14 }}>
        <div style={ty("h3", { color: c.ink, margin: 0 })}>{title}</div>
        <p style={ty("small", { color: c.inkMuted, margin: "6px 0 14px", maxWidth: 700 })}>{body}</p>
        {children}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 14 }}>
          <Button kind="primary" onClick={onConfirm}>{confirmLabel || t("pyo.confirm")}</Button>
          <Button kind="quiet" onClick={onCancel}>{t("pyo.cancel")}</Button>
        </div>
      </div>
    );
  }

  /* the two-person block: who made it, who must release it, and why
     the second name is not yet filled in */
  function SignOff({ maker, checker, madeIso, madeTime, decidedIso, awaitingKey }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240, background: c.sunken, borderRadius: G3.r.lg, padding: "12px 14px" }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py14.so.maker")}</div>
          <div style={ty("small", { color: c.ink, fontWeight: 700, marginTop: 4 })}>{t(maker.nameKey)}</div>
          <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{t(maker.roleKey)} · {maker.id} · {maker.perm}</div>
          {madeIso ? <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{stamp(t, madeIso, madeTime)}</div> : null}
        </div>
        <div style={{ flex: 1, minWidth: 240, background: c.sunken, borderRadius: G3.r.lg, padding: "12px 14px", border: decidedIso ? "1px solid " + c.presentText : "1px dashed " + c.borderStrong }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py14.so.checker")}</div>
          <div style={ty("small", { color: decidedIso ? c.ink : c.inkMuted, fontWeight: 700, marginTop: 4 })}>{decidedIso ? t(checker.nameKey) : t("py14.so.awaiting")}</div>
          <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{t(checker.roleKey)} · {checker.id} · {checker.perm}</div>
          <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>
            {decidedIso ? stamp(t, decidedIso) : t(awaitingKey || "py14.so.awaitingNote", { who: t(maker.nameKey) })}
          </div>
        </div>
      </div>
    );
  }

  addStrings({
    en: {
      "py14.so.maker": "Prepared by",
      "py14.so.checker": "Released by",
      "py14.so.awaiting": "Awaiting a different person",
      "py14.so.awaitingNote": "This panel stays empty until somebody other than {who} signs it.",
    },
  });

  /* a row check for a bulk bar */
  function RowCheck({ checked, onChange, label }) {
    const { c } = useTheme();
    return (
      <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
        <input
          type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
          style={{ width: 16, height: 16, accentColor: c.accent, cursor: "pointer", margin: 0 }}
        />
      </label>
    );
  }

  /* the shell every payroll operations tab shares */
  function Shell({ role, onNavigate, active, children }) {
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
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("pyo.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("pyo.entity")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
              <div style={{ minWidth: 320, maxWidth: 780 }}>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("pyo.title")}</h1>
              </div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
                <Chip bg={c.sunken} fg={c.inkMuted} mono>{RUN_ID}</Chip>
                <StatusMark role="late" glyph="clock" word={t("pyo.st.awaiting")} />
                <Chip bg={c.sunken} fg={c.inkMuted}>{t("pyo.cfg.chip", { v: CFG_JUL.v })}</Chip>
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     15 . PY-09 — VARIANCE REVIEW.
     Inventory actions, all six: set the gate, explain a row,
     bulk-explain by cause, drill into an employee, export, mark the
     review complete. Approve is absent, and says why.
     ============================================================ */
  function VarianceScreen() {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;

    const [gate, setGate] = useState({ pct: PAY_POLICY.varPct, abs: PAY_POLICY.varAbs });
    const [pctDraft, setPctDraft] = useState(String(PAY_POLICY.varPct));
    const [absDraft, setAbsDraft] = useState(String(PAY_POLICY.varAbs));
    const [gateErr, setGateErr] = useState(false);
    const [expl, setExpl] = useState({});          /* id -> { when } */
    const [openExpl, setOpenExpl] = useState(null);
    const [drill, setDrill] = useState(null);
    const [picked, setPicked] = useState({});
    const [bulkOpen, setBulkOpen] = useState(false);
    const [complete, setComplete] = useState(null);

    const custom = gate.pct !== PAY_POLICY.varPct || gate.abs !== PAY_POLICY.varAbs;
    const rows = VAR_ROWS.map((r) => ({
      r: r,
      crossed: crossedBy(r, gate),
      explained: !!r.explBy || !!expl[r.id],
    }));
    const flagged = rows.filter((x) => x.crossed);
    const unexplained = flagged.filter((x) => !x.explained);
    const pickedIds = Object.keys(picked).filter((k) => picked[k]);
    const pickedRows = rows.filter((x) => picked[x.r.id]);
    const pickedCauses = [];
    pickedRows.forEach((x) => { if (pickedCauses.indexOf(x.r.causeKey) === -1) pickedCauses.push(x.r.causeKey); });

    function applyGate() {
      const p = parseFloat(pctDraft), a = parseFloat(absDraft);
      if (!(p > 0) || !(a > 0)) { setGateErr(true); return; }
      setGateErr(false);
      setGate({ pct: p, abs: a });
    }
    function restoreGate() {
      setPctDraft(String(PAY_POLICY.varPct));
      setAbsDraft(String(PAY_POLICY.varAbs));
      setGate({ pct: PAY_POLICY.varPct, abs: PAY_POLICY.varAbs });
      setGateErr(false);
    }
    function markExplained(ids) {
      const next = Object.assign({}, expl);
      ids.forEach((id) => { next[id] = { when: t("pyo.justNow") }; });
      setExpl(next);
      setPicked({});
      setOpenExpl(null);
      setBulkOpen(false);
    }

    const cols = [
      { key: "pick", label: "", width: 34 },
      { key: "person", label: t("py09.col.person") },
      { key: "group", label: t("py09.col.group"), width: 160 },
      { key: "cause", label: t("py09.col.cause"), width: 190 },
      { key: "prev", label: t("py09.col.prev"), align: "right", mono: true, width: 120 },
      { key: "cur", label: t("py09.col.cur"), align: "right", mono: true, width: 120 },
      { key: "delta", label: t("py09.col.delta"), align: "right", mono: true, width: 120 },
      { key: "flag", label: t("py09.col.flag"), width: 150 },
      { key: "expl", label: t("py09.col.expl"), width: 170 },
      { key: "act", label: t("py09.col.act"), align: "right", width: 44 },
    ];

    function rowCells(x) {
      const r = x.r;
      const d = varDelta(r);
      return {
        pick: <RowCheck
          checked={!!picked[r.id]}
          onChange={(v) => setPicked(Object.assign({}, picked, { [r.id]: v }))}
          label={t("py09.select", { name: t(r.nameKey) })}
        />,
        person: (
          <span>
            <span style={{ fontWeight: 600 }}>{t(r.nameKey)}</span>
            <span style={G3.fig("xs", { color: c.inkFaint, marginLeft: 8 })}>{r.id}</span>
          </span>
        ),
        group: t(r.groupKey),
        cause: t(r.causeKey),
        prev: r.prev == null ? <span style={{ color: c.inkFaint }}>{t("py09.noPrior")}</span> : inr(r.prev.net),
        cur: inr(r.cur.net),
        delta: r.prev == null
          ? <span style={{ color: c.inkFaint }}>{"—"}</span>
          : <span style={{ color: d < 0 ? c.absentText : c.presentText, fontWeight: 600 }}>{(d > 0 ? "+" : "") + inr(d)}</span>,
        flag: x.crossed
          ? <StatusMark role="late" glyph="alert" word={t("py09.crossed")} />
          : <StatusMark role="off" glyph="check" word={t("py09.below")} />,
        expl: x.explained
          ? <StatusMark role="present" glyph="check" word={t("pyo.st.explained")} />
          : <StatusMark role={x.crossed ? "absent" : "off"} glyph={x.crossed ? "alert" : "clock"} word={t("pyo.st.unexplained")} />,
        act: (
          <ActionMenu
            ariaLabel={t("py09.menu.aria", { name: t(r.nameKey) })}
            items={[
              { key: "expl", icon: "document", label: x.explained ? t("py09.menu.reexplain") : t("py09.menu.explain"),
                onSelect: () => { setDrill(null); setOpenExpl(r.id); } },
              { key: "drill", icon: "scan", label: t("py09.menu.drill"),
                onSelect: () => { setOpenExpl(null); setDrill(r.id); } },
              { key: "sal", icon: "payslip", label: t("py09.menu.editSalary"), disabled: true, reason: t("py09.menu.editSalaryWhy") },
            ]}
          />
        ),
      };
    }

    const drillRow = drill ? VAR_ROWS.filter((r) => r.id === drill)[0] : null;
    const explRow = openExpl ? VAR_ROWS.filter((r) => r.id === openExpl)[0] : null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: L.gap }}>
        <Card icon="scan" iconTone="accent" title={t("py09.title")} sub={t("py09.q")}>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px", maxWidth: 780 })}>{t("py09.sub")}</p>

          <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: "14px 16px" }}>
            <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("py09.gate.title")}</div>
            <div style={ty("body", { color: c.ink, marginTop: 4 })}>
              {t("py09.gate.line", { pct: num(gate.pct) + "%", amt: inr(gate.abs, { paise: false }) })}
            </div>
            <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 12px", maxWidth: 720 })}>
              {t("py09.gate.src", { v: PAY_POLICY.v, d: PAY_POLICY.fromEn })}
            </p>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ width: 210 }}>
                <Field id="py09-pct" label={t("py09.gate.pct")}>
                  <Input id="py09-pct" value={pctDraft} onChange={setPctDraft} inputMode="decimal" />
                </Field>
              </div>
              <div style={{ width: 230 }}>
                <Field id="py09-abs" label={t("py09.gate.abs")}>
                  <Input id="py09-abs" value={absDraft} onChange={setAbsDraft} inputMode="decimal" />
                </Field>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <Button kind="secondary" onClick={applyGate}>{t("py09.gate.apply")}</Button>
                {custom ? <Button kind="quiet" onClick={restoreGate}>{t("py09.gate.restore")}</Button> : null}
              </div>
            </div>
            {gateErr ? <p role="alert" style={ty("small", { color: c.dangerText, margin: "0 0 8px" })}>{t("py09.gate.err")}</p> : null}
            {custom ? (
              <Panel tone="late" glyph="alert" body={t("py09.gate.local", { pct: num(gate.pct) + "%", amt: inr(gate.abs, { paise: false }) })} />
            ) : null}
            <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0", maxWidth: 720 })}>{t("py09.noAuto")}</p>
          </div>
        </Card>

        {!rows.length ? (
          <Card icon="scan" iconTone="off" title={t("py09.reg.title")}>
            <EmptyState head={t("py09.empty.head")} body={t("py09.empty.body")} />
          </Card>
        ) : (
        <Register
          title={t("py09.reg.title")}
          sub={t("py09.reg.sub", { c: num(flagged.length), b: num(rows.length - flagged.length) })}
          action={<Button kind="secondary" size="sm" iconLeft="download" onClick={() => null}>{t("py09.export")}</Button>}
          chips={[
            <StatusMark key="f" role="late" glyph="alert" word={t("py09.crossed")} count={flagged.length} />,
            <StatusMark key="u" role={unexplained.length ? "absent" : "present"} glyph={unexplained.length ? "alert" : "check"}
              word={unexplained.length ? t("py09.unexplained", { n: num(unexplained.length) }) : t("py09.allExplained")} />,
            <Chip key="r" bg={c.sunken} fg={c.inkMuted}>{t("py09.rest", { n: num(VAR_UNMOVED) })}</Chip>,
          ]}
          columns={cols}
          rows={rows.map((x) => ({ id: x.r.id, cells: rowCells(x), highlight: drill === x.r.id || openExpl === x.r.id }))}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", width: "100%" }}>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 620 })}>{t("py09.pii")}</p>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 320 })}>{t("py09.exportNote")}</p>
            </div>
          }
        />
        )}

        {pickedIds.length ? (
          <Card icon="list" iconTone="info" title={t("py09.bulk.title")}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <Chip bg={c.sunken} fg={c.inkMuted}>{t("py09.selected", { n: num(pickedIds.length) })}</Chip>
              {pickedCauses.map((ck) => <Chip key={ck} bg={c.accentSoft} fg={c.action}>{t(ck)}</Chip>)}
            </div>
            {pickedCauses.length === 1 ? (
              <div>
                <Panel tone="present" glyph="check" body={t("py09.bulk.same", { n: num(pickedIds.length), cause: t(pickedCauses[0]) })} />
                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  <Button kind="primary" onClick={() => setBulkOpen(true)}>{t("py09.bulk.go", { n: num(pickedIds.length) })}</Button>
                  <Button kind="quiet" onClick={() => setPicked({})}>{t("py09.bulk.clear")}</Button>
                </div>
              </div>
            ) : (
              <div>
                <Panel tone="absent" glyph="alert" body={t("py09.bulk.mixed", { n: num(pickedIds.length), k: num(pickedCauses.length) })} />
                <div style={{ marginTop: 14 }}>
                  <Button kind="quiet" onClick={() => setPicked({})}>{t("py09.bulk.clear")}</Button>
                </div>
              </div>
            )}
            {bulkOpen && pickedCauses.length === 1 ? (
              <ReasonPrompt
                idBase="py09-bulk"
                title={t("py09.bulk.title")}
                body={t("py09.bulk.same", { n: num(pickedIds.length), cause: t(pickedCauses[0]) })}
                options={["pyo.cause.joiner", "pyo.cause.leaver", "pyo.cause.lop", "pyo.cause.revision", "pyo.cause.loan", "pyo.cause.decl", "pyo.cause.units"]}
                onConfirm={() => markExplained(pickedIds)}
                onCancel={() => setBulkOpen(false)}
              />
            ) : null}
          </Card>
        ) : null}

        {explRow ? (
          <Card icon="document" iconTone="accent" title={t("py09.expl.title")}>
            <ReasonPrompt
              idBase="py09-expl"
              title={t("py09.expl.title")}
              body={t("py09.expl.body", { name: t(explRow.nameKey), amt: inr(Math.abs(varDelta(explRow))) })}
              options={["pyo.cause.joiner", "pyo.cause.leaver", "pyo.cause.lop", "pyo.cause.revision", "pyo.cause.loan", "pyo.cause.decl", "pyo.cause.units"]}
              onConfirm={() => markExplained([explRow.id])}
              onCancel={() => setOpenExpl(null)}
            />
          </Card>
        ) : null}

        {drillRow ? <VarianceDrill row={drillRow} onClose={() => setDrill(null)} /> : null}

        <Card
          fill={c.brassSoft} border={c.brassBorder}
          icon={unexplained.length ? "alert" : "check"} iconTone={unexplained.length ? "brass" : "present"}
          title={unexplained.length ? t("py09.unexplained", { n: num(unexplained.length) }) : t("py09.allExplained")}
        >
          {complete ? (
            <Panel tone="present" glyph="check" body={t("py09.completeDone", { when: complete })} />
          ) : unexplained.length ? (
            <OffAction
              kind="primary" iconLeft="check" label={t("py09.complete")}
              reason={t("py09.completeOff", { n: num(unexplained.length), who: t("pyo.checker") })}
            />
          ) : (
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
              <Button kind="primary" iconLeft="check" onClick={() => setComplete(t("pyo.justNow"))}>{t("py09.complete")}</Button>
              <p style={ty("small", { color: c.inkMuted, margin: 0, flex: 1, minWidth: 260, maxWidth: 620 })}>{t("py09.completeNote")}</p>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <AbsentNote head={t("py09.approvalHere")} body={t("py09.approvalWhy")} />
          </div>
        </Card>
      </div>
    );
  }

  /* the side-by-side drill-in: two real payslips, line by line */
  function VarianceDrill({ row, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const prev = row.prev, cur = row.cur;

    function pairRows(pick) {
      const keys = [];
      const bag = {};
      (prev ? pick(prev) : []).forEach((l) => { if (!bag[l.codeKey]) { bag[l.codeKey] = { prev: 0, cur: 0 }; keys.push(l.codeKey); } bag[l.codeKey].prev += l.v; });
      pick(cur).forEach((l) => { if (!bag[l.codeKey]) { bag[l.codeKey] = { prev: 0, cur: 0 }; keys.push(l.codeKey); } bag[l.codeKey].cur += l.v; });
      return keys.map((k) => ({ key: k, prev: bag[k].prev, cur: bag[k].cur, delta: r2(bag[k].cur - bag[k].prev) }));
    }
    const earnPairs = pairRows((s) => s.earn);
    const dedPairs = pairRows((s) => s.ded);

    const cols = [
      { key: "line", label: t("py09.drill.col.line") },
      { key: "prev", label: t("py09.drill.col.prev"), align: "right", mono: true, width: 130 },
      { key: "cur", label: t("py09.drill.col.cur"), align: "right", mono: true, width: 130 },
      { key: "delta", label: t("py09.drill.col.delta"), align: "right", mono: true, width: 130 },
    ];
    function line(p) {
      return {
        id: p.key,
        cells: {
          line: t(p.key),
          prev: prev ? inr(p.prev) : "—",
          cur: inr(p.cur),
          delta: p.delta === 0 ? "—" : <span style={{ color: p.delta < 0 ? c.absentText : c.presentText, fontWeight: 600 }}>{(p.delta > 0 ? "+" : "") + inr(p.delta)}</span>,
        },
      };
    }
    function totalRow(labelKey, a, b) {
      return { id: labelKey, cells: { line: <strong>{t(labelKey)}</strong>, prev: prev ? inr(a) : "—", cur: inr(b), delta: prev ? inr(r2(b - a)) : "—" } };
    }

    return (
      <Card icon="scan" iconTone="info" title={t("py09.drill.title", { name: t(row.nameKey) })} sub={t("py09.drill.sub")}
        action={<Button kind="quiet" size="sm" onClick={onClose}>{t("py09.drill.close")}</Button>}>
        {!prev ? <div style={{ marginBottom: 14 }}><Panel tone="late" glyph="alert" body={t("py09.drill.noPrev", { name: t(row.nameKey) })} /></div> : null}
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginBottom: 14 }}>
          <Fact label={t("py09.col.group")}><span style={ty("small", { color: c.ink })}>{t(row.groupKey)}</span></Fact>
          <Fact label={t("py09.col.cause")}><span style={ty("small", { color: c.ink })}>{t(row.causeKey)}</span></Fact>
          <Fact label={t("py09.col.cur")} w={180}>
            <span style={ty("small", { color: c.ink })}>
              {cur.paidDays != null ? t("py09.drill.days", { n: num(cur.paidDays), t: num(MONTH_DAYS) }) : t("py09.drill.lect", { n: num(cur.lectures) })}
            </span>
          </Fact>
        </div>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 })}>{t("py09.drill.earn")}</div>
        <MiniTable columns={cols} rows={earnPairs.map(line)}
          total={{ label: t("py09.drill.gross"), cells: { line: t("py09.drill.gross"), prev: prev ? inr(prev.gross) : "—", cur: inr(cur.gross), delta: prev ? inr(r2(cur.gross - prev.gross)) : "—" } }} />
        <div style={{ height: 22 }} />
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 })}>{t("py09.drill.ded")}</div>
        <MiniTable columns={cols} rows={dedPairs.map(line)}
          total={{ label: t("py09.drill.dedTotal"), cells: { line: t("py09.drill.dedTotal"), prev: prev ? inr(prev.dedTotal) : "—", cur: inr(cur.dedTotal), delta: prev ? inr(r2(cur.dedTotal - prev.dedTotal)) : "—" } }} />
        <div style={{ marginTop: 18, maxWidth: 520, marginLeft: "auto" }}>
          <EqRow sign={"="} label={t("py09.drill.net")} value={cur.net} strong rule
            note={row.curNote ? t(row.curNote) : null} />
        </div>
        {row.explBy ? (
          <p style={ty("caption", { color: c.inkFaint, margin: "14px 0 0" })}>
            {t("py09.expl.saved", { who: t(row.explBy.nameKey), when: stamp(t, "2026-08-" + (row.explAt.d < 10 ? "0" : "") + row.explAt.d, row.explAt.time) })}
            {" — "}{t(row.explKey)}
          </p>
        ) : null}
      </Card>
    );
  }

  /* ============================================================
     16 . PY-10 — THE PAYSLIP REGISTER.

     The register is by pay group, because the group rows are the only
     rows that can reconcile to the run's headline exactly. Opening a
     group lists real payslips from it, clearly labelled as a sample
     with no total of its own — a sub-total that does not add up to the
     row above it is worse than no sub-total at all.
     ============================================================ */

  /* Ananya Rao's August payslip, line for line the one pages/
     payslips.jsx shows her for July: gross 94,800.00, provident fund
     5,688.00, professional tax 200.00, income tax 10,480.00. */
  const SLIP_SAMPLES = {
    teach: [
      { nameKey: "pyo.n.ananya", staff: "NAV-0142", slip: slip({ gross: 94800.0, net: 78432.0, pf: 5688.0, pt: 200.0, paidDays: 31 }) },
      { nameKey: "pyo.n.mahesh", staff: "NAV-0209", slip: VAR_ROWS[2].cur },
      { nameKey: "pyo.n.joseph", staff: "NAV-0301", slip: VAR_ROWS[3].cur },
      { nameKey: "pyo.n.prakash", staff: "NAV-0122", slip: VAR_ROWS[4].cur, loanId: "LN-2026-039" },
      { nameKey: "pyo.n.ravi", staff: "NAV-0416", slip: VAR_ROWS[0].cur },
    ],
    admin: [
      { nameKey: "pyo.n.kavita", staff: "NAV-0007", slip: VAR_ROWS[5].cur },
      { nameKey: "pyo.n.farida", staff: "NAV-0388", slip: VAR_ROWS[8].cur },
      { nameKey: "pyo.n.nusrat", staff: "NAV-0355", slip: VAR_ROWS[9].cur },
      { nameKey: "pyo.n.lata", staff: "NAV-0177", slip: VAR_ROWS[1].cur },
    ],
    visit: [
      { nameKey: "pyo.n.suresh", staff: "NAV-0263", slip: VAR_ROWS[6].cur },
      { nameKey: "pyo.n.imran", staff: "NAV-0270", slip: VAR_ROWS[7].cur },
    ],
  };

  function RegisterScreen() {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [filter, setFilter] = useState("all");
    const [openGroup, setOpenGroup] = useState(null);
    const [openSlip, setOpenSlip] = useState(null);
    const [verified, setVerified] = useState(false);
    const [preview, setPreview] = useState(false);

    const shown = GROUPS.filter((g) => filter === "all" || g.key === filter);
    const cols = [
      { key: "group", label: t("py10.col.group") },
      { key: "staff", label: t("py10.col.staff"), align: "right", mono: true, width: 90 },
      { key: "days", label: t("py10.col.days"), align: "right", mono: true, width: 120 },
      { key: "gross", label: t("py10.col.gross"), align: "right", mono: true, width: 160 },
      { key: "ded", label: t("py10.col.ded"), align: "right", mono: true, width: 150 },
      { key: "emp", label: t("py10.col.emp"), align: "right", mono: true, width: 150 },
      { key: "net", label: t("py10.col.net"), align: "right", mono: true, width: 160 },
      { key: "act", label: "", align: "right", width: 120 },
    ];

    /* the three assertions M15 asks for, computed here rather than
       claimed: the register's own column, the sum of the payslips it
       lists, and the run's headline. */
    const registerNet = GROUPS.reduce((s, g) => s + groupNet(g), 0);
    const slipsNet = GROUPS.reduce((s, g) => s + (groupGross(g) - groupDed(g)), 0);
    const headline = RUN_NET;
    const reconciles = !preview
      && Math.abs(registerNet - slipsNet) < 0.005
      && Math.abs(slipsNet - headline) < 0.005;
    const shownHeadline = preview ? r2(headline - 1420.0) : headline;

    const slipRow = openSlip
      ? (SLIP_SAMPLES[openGroup] || []).filter((p) => p.staff === openSlip)[0]
      : null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: L.gap }}>
        <Register
          title={t("py10.title")}
          sub={t("py10.q") + " " + t("py10.sub", { n: num(RUN_HEADS), g: num(GROUPS.length) })}
          action={<Button kind="secondary" size="sm" iconLeft="download">{t("py10.export")}</Button>}
          chips={[
            <StatusMark key="l" role="off" glyph="clock" word={t("py10.locked")} />,
            <Chip key="c" bg={c.sunken} fg={c.inkMuted}>{t("pyo.cfg.chip", { v: CFG_JUL.v })}</Chip>,
            <div key="f" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label htmlFor="py10-filter" style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py10.filter.label")}</label>
              <div style={{ width: 230 }}>
                <Select
                  id="py10-filter" value={filter} onChange={(v) => { setFilter(v); setOpenGroup(null); setOpenSlip(null); }}
                  options={[{ value: "all", label: t("py10.filter.all") }].concat(GROUPS.map((g) => ({ value: g.key, label: t(g.nameKey) })))}
                />
              </div>
            </div>,
          ]}
          columns={cols}
          rows={shown.map((g) => ({
            id: g.key,
            highlight: openGroup === g.key,
            cells: {
              group: <span style={{ fontWeight: 600 }}>{t(g.nameKey)}</span>,
              staff: num(g.heads),
              days: groupPaidDays(g) == null ? <span style={ty("caption", { color: c.inkFaint })}>{t("py10.units")}</span> : num(groupPaidDays(g)),
              gross: inr(groupGross(g)),
              ded: inr(groupDed(g)),
              emp: inr(groupEmp(g)),
              net: inr(groupNet(g)),
              act: <LinkButton onClick={() => { setOpenGroup(openGroup === g.key ? null : g.key); setOpenSlip(null); }}>{openGroup === g.key ? t("pyo.close") : t("pyo.open")}</LinkButton>,
            },
          }))}
          totals={{
            label: t("py10.total"),
            cells: {
              group: t("py10.total"),
              staff: num(RUN_HEADS),
              days: num(GROUPS.reduce((s, g) => s + (groupPaidDays(g) || 0), 0)),
              gross: inr(RUN_GROSS),
              ded: inr(RUN_DED),
              emp: inr(RUN_EMPLOYER),
              net: inr(shownHeadline),
            },
          }}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", width: "100%" }}>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 460 })}>{t("py10.filter.note")}</p>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 460 })}>
                {t("py10.unitsNote")}{" "}{t("pyo.cfg.note", { v: CFG_JUL.v, d: cfgFrom(CFG_JUL) })}
              </p>
            </div>
          }
        />

        {openGroup ? (
          <Card icon="staff" iconTone="info"
            title={t("py10.people.title", { group: t(GROUPS.filter((g) => g.key === openGroup)[0].nameKey) })}
            sub={t("py10.people.sub", {
              n: num((SLIP_SAMPLES[openGroup] || []).length),
              t: num(GROUPS.filter((g) => g.key === openGroup)[0].heads),
            })}
            action={<Button kind="quiet" size="sm" onClick={() => { setOpenGroup(null); setOpenSlip(null); }}>{t("pyo.close")}</Button>}
          >
            <MiniTable
              columns={[
                { key: "person", label: t("py10.people.col.person") },
                { key: "days", label: t("py10.people.col.days"), align: "right", mono: true, width: 120 },
                { key: "gross", label: t("py10.people.col.gross"), align: "right", mono: true, width: 130 },
                { key: "ded", label: t("py10.people.col.ded"), align: "right", mono: true, width: 130 },
                { key: "net", label: t("py10.people.col.net"), align: "right", mono: true, width: 130 },
                { key: "act", label: "", align: "right", width: 130 },
              ]}
              rows={(SLIP_SAMPLES[openGroup] || []).map((p) => ({
                id: p.staff,
                highlight: openSlip === p.staff,
                cells: {
                  person: (
                    <span>
                      <span style={{ fontWeight: 600 }}>{t(p.nameKey)}</span>
                      <span style={G3.fig("xs", { color: c.inkFaint, marginLeft: 8 })}>{p.staff}</span>
                    </span>
                  ),
                  days: p.slip.paidDays != null ? num(p.slip.paidDays) + " / " + num(MONTH_DAYS) : t("py09.drill.lect", { n: num(p.slip.lectures) }),
                  gross: inr(p.slip.gross),
                  ded: inr(p.slip.dedTotal),
                  net: inr(p.slip.net),
                  act: <LinkButton onClick={() => setOpenSlip(openSlip === p.staff ? null : p.staff)}>{openSlip === p.staff ? t("py10.slip.close") : t("py10.people.open")}</LinkButton>,
                },
              }))}
            />
          </Card>
        ) : null}

        {slipRow ? <PayslipDetail row={slipRow} onClose={() => setOpenSlip(null)} /> : null}

        <Card icon={reconciles ? "check" : "alert"} iconTone={reconciles ? "present" : "accent"} title={t("py10.verify.title")}>
          {verified || preview ? (
            <Panel
              tone={reconciles ? "present" : "absent"}
              glyph={reconciles ? "check" : "alert"}
              body={t(reconciles ? "py10.verify.ok" : "py10.verify.fail", {
                a: inr(registerNet), b: inr(slipsNet), c: inr(shownHeadline),
              })}
            />
          ) : (
            <Button kind="primary" iconLeft="check" onClick={() => setVerified(true)}>{t("py10.verify")}</Button>
          )}
          <p style={ty("small", { color: c.inkMuted, margin: "12px 0 0", maxWidth: 720 })}>{t("py10.verify.note")}</p>
          <div style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Switch id="py10-preview" checked={preview} onChange={(v) => { setPreview(v); setVerified(true); }} label={t("py10.preview")} />
            <p style={ty("caption", { color: c.inkFaint, margin: 0, flex: 1, minWidth: 260, maxWidth: 560 })}>{t("py10.previewNote")}</p>
          </div>
        </Card>

        <Card icon="lock" iconTone="off" title={t("py10.locked")}>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px", maxWidth: 760 })}>{t("py10.lockedNote")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <AbsentNote head={t("py10.edit.absent")} body={t("py10.edit.absentWhy")} icon="document" />
            <AbsentNote head={t("py10.bank.absent")} body={t("py11.aug.why", { run: RUN_ID, who: t("pyo.checker"), role: t("pyo.roleChecker"), id: CHECKER.id })} icon="payroll" />
          </div>
          <p style={ty("caption", { color: c.inkFaint, margin: "14px 0 0", maxWidth: 720 })}>{t("py10.exportNote")}</p>
        </Card>
      </div>
    );
  }

  function PayslipDetail({ row, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const s = row.slip;
    function provenance(l) {
      if (l.codeKey === "pyo.c.lop") return t("py10.slip.prov.lop", { n: num(l.lopDays), rate: inr(r2(l.v / l.lopDays)) });
      if (l.codeKey === "pyo.c.loan") return t("py10.slip.prov.loan", { id: row.loanId || "" });
      if (l.codeKey === "pyo.c.arrear") return t("py10.slip.prov.arrear");
      if (l.codeKey === "pyo.c.hon") return t("py10.slip.prov.hon", { n: num(s.lectures) });
      if (l.stat) return t("py10.slip.prov.stat", { v: CFG_JUL.v });
      return t("py10.slip.prov.struct");
    }
    const cols = [
      { key: "line", label: t("py09.drill.col.line") },
      { key: "prov", label: t("py10.slip.prov") },
      { key: "v", label: t("py17.l.col.v"), align: "right", mono: true, width: 150 },
    ];
    return (
      <Card icon="payslip" iconTone="accent"
        title={t("py10.slip.title", { name: t(row.nameKey), mon: t("pyo.mon." + PERIOD_MON) })}
        sub={t("py10.slip.sub")}
        action={<Button kind="quiet" size="sm" onClick={onClose}>{t("py10.slip.close")}</Button>}
      >
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 })}>{t("py09.drill.earn")}</div>
        <MiniTable columns={cols}
          rows={s.earn.map((l) => ({ id: l.codeKey, cells: { line: t(l.codeKey), prov: provenance(l), v: inr(l.v) } }))}
          total={{ label: t("py09.drill.gross"), cells: { line: t("py09.drill.gross"), v: inr(s.gross) } }} />
        <div style={{ height: 22 }} />
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 })}>{t("py09.drill.ded")}</div>
        <MiniTable columns={cols}
          rows={s.ded.map((l) => ({ id: l.codeKey, cells: { line: t(l.codeKey), prov: provenance(l), v: inr(l.v) } }))}
          total={{ label: t("py09.drill.dedTotal"), cells: { line: t("py09.drill.dedTotal"), v: inr(s.dedTotal) } }} />
        <div style={{ marginTop: 18, maxWidth: 520, marginLeft: "auto" }}>
          <EqRow sign={"+"} label={t("py09.drill.gross")} value={s.gross} />
          <EqRow sign={"-"} label={t("py09.drill.dedTotal")} value={s.dedTotal} />
          <EqRow sign={"="} label={t("py09.drill.net")} value={s.net} strong rule />
        </div>
        <p style={ty("caption", { color: c.inkFaint, margin: "14px 0 0", maxWidth: 720 })}>{t("pyo.cfg.never")}</p>
      </Card>
    );
  }

  /* ============================================================
     17 . PY-11 + PY-12 — PAY AND PUBLISH.

     August is the hard gate: the run is with the checker, so there is
     no bank file and no release, and both controls say who is holding
     it. July is the whole history, including the file that superseded
     another and the two people who were left out of it.
     ============================================================ */
  function PayPublishScreen() {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [supp, setSupp] = useState("idle");     /* idle | generated | downloaded | done */
    const [utr, setUtr] = useState("");
    const [dDate, setDDate] = useState("2026-08-11");
    const [suppErr, setSuppErr] = useState(null);
    const [retried, setRetried] = useState(false);
    const [reissue, setReissue] = useState(false);
    const [reissued, setReissued] = useState(false);
    const [chEmail, setChEmail] = useState(true);
    const [chSms, setChSms] = useState(false);

    function markDisbursed() {
      if (!dDate.trim()) { setSuppErr("date"); return; }
      if (!utr.trim()) { setSuppErr("utr"); return; }
      setSuppErr(null);
      setSupp("done");
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: L.gap }}>
        {/* ---- the one honey card on this tab: what August would pay,
             and why it cannot yet ---- */}
        <Card fill={c.brassSoft} border={c.brassBorder}>
          <div style={{ display: "flex", gap: 30, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ minWidth: 320, flex: 1 }}>
              <div style={ty("caption", { color: c.brass, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" })}>{t("py11.title")}</div>
              <h2 style={ty("h1", { margin: "4px 0 0", color: c.ink })}>{t("py11.aug.state")}</h2>
              <p style={ty("small", { color: c.inkMuted, margin: "8px 0 0", maxWidth: 620 })}>{t("py11.q")}</p>
              <p style={ty("body", { color: c.ink, margin: "12px 0 0", maxWidth: 620 })}>
                {t("py11.aug.why", { run: RUN_ID, who: t("pyo.checker"), role: t("pyo.roleChecker"), id: CHECKER.id })}
              </p>
              <div style={{ marginTop: 18 }}>
                <OffAction kind="primary" iconLeft="download" label={t("py11.gen")} reason={t("py11.genOff", { who: t("pyo.checker") })} />
              </div>
            </div>
            <div style={{ minWidth: 260, textAlign: "right" }}>
              <div style={ty("caption", { color: c.brass, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py11.aug.payable")}</div>
              <Figure value={inr(NET_PAYABLE)} size={34} weight={700} color={c.ink} align="right" style={{ letterSpacing: "-0.015em", lineHeight: 1.15, marginTop: 4 }} />
              <div style={ty("caption", { color: c.inkMuted, marginTop: 6 })}>
                {t("py11.aug.payableNote", { n: num(PAYEES), h: num(HOLDS.length), v: CFG_JUL.v })}
              </div>
            </div>
          </div>
        </Card>

        {/* ---- excluded before generation, never silently zero-paid ---- */}
        <Card icon="alert" iconTone="accent" title={t("py11.aug.fixFirst")}
          sub={t("py11.aug.fixNote", { n: num(AUG_EXCLUDED.length), amt: inr(AUG_EXCLUDED_TOTAL) })}>
          <MiniTable
            columns={[
              { key: "person", label: t("py11.x.col.person") },
              { key: "acct", label: t("py11.x.col.account"), mono: true, width: 160 },
              { key: "why", label: t("py11.x.col.why") },
              { key: "amt", label: t("py11.x.col.amount"), align: "right", mono: true, width: 130 },
              { key: "act", label: t("py11.x.col.act"), align: "right", width: 170 },
            ]}
            rows={AUG_EXCLUDED.map((x) => ({
              id: x.staff,
              cells: {
                person: (
                  <span>
                    <span style={{ fontWeight: 600 }}>{t(x.personKey)}</span>
                    <span style={G3.fig("xs", { color: c.inkFaint, marginLeft: 8 })}>{x.staff}</span>
                  </span>
                ),
                acct: x.mask || <span style={ty("caption", { color: c.inkFaint })}>{t("py11.x.none")}</span>,
                why: t(x.reasonKey),
                amt: inr(x.v),
                act: <LinkButton>{t("py11.x.resolve")}</LinkButton>,
              },
            }))}
            total={{ label: t("py11.x.col.amount"), cells: { person: t("pyo.peopleN", { n: num(AUG_EXCLUDED.length) }), amt: inr(AUG_EXCLUDED_TOTAL) } }}
            note={t("py11.x.resolveNote") + " " + t("py11.mask")}
          />
        </Card>

        {/* ---- July, start to reference ---- */}
        <Card icon="check" iconTone="present" title={t("py11.july.title")}
          sub={t("py11.july.state", { d: fmtDate(t, JULY_FILE.disbursedIso) })}>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginBottom: 16 }}>
            <Fact label={t("py11.file.versionLabel")} w={150}>
              <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("py11.file.version", { n: num(JULY_FILE.version) })}</span>
              <div style={ty("caption", { color: c.inkMuted })}>{t("py11.file.supersedes", { n: num(JULY_FILE.supersedes) })}</div>
            </Fact>
            <Fact label={t("py11.file.format")} w={230}><span style={ty("small", { color: c.ink })}>{t(JULY_FILE.formatKey)}</span></Fact>
            <Fact label={t("py11.file.valueDate")} w={160}><span style={ty("small", { color: c.ink })}>{fmtDate(t, JULY_FILE.valueDateIso)}</span></Fact>
            <Fact label={t("py11.file.checksum")} w={200}><Figure value={JULY_FILE.checksum} size="sm" /></Fact>
            <Fact label={t("py11.file.idem")} w={230} note={t("py11.file.idemNote")}><Figure value={JULY_FILE.idem} size="xs" /></Fact>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Panel tone="late" glyph="alert"
              head={t("py11.file.superseded", { n: num(JULY_FILE.supersedes), when: stamp(t, JULY_FILE.supersededIso, JULY_FILE.supersededTime), why: t(JULY_FILE.supersedeReasonKey) })}
              body={t("py11.file.doubleUpload", { n: num(JULY_FILE.version), p: num(JULY_FILE.supersedes) })} />
          </div>

          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 })}>{t("py11.file.batches")}</div>
          <MiniTable
            columns={[
              { key: "bank", label: t("py11.b.col.bank") },
              { key: "payees", label: t("py11.b.col.payees"), align: "right", mono: true, width: 130 },
              { key: "amt", label: t("py11.b.col.amount"), align: "right", mono: true, width: 180 },
            ]}
            rows={BANK_BATCHES.map((b) => ({ id: b.bankKey, cells: { bank: t(b.bankKey), payees: num(b.payees), amt: inr(b.v) } }))}
            total={{ label: t("py11.b.total"), cells: { bank: t("py11.b.total"), payees: num(BANK_PAYEES), amt: inr(BANK_TOTAL) } }}
          />
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 18, alignItems: "center" }}>
            <StatusMark role="present" glyph="check" word={t("pyo.st.disbursed")} />
            <Seal label={t("py11.disbursed")} sub={t("py11.disbursedOn", { d: fmtDate(t, JULY_FILE.disbursedIso), utr: JULY_FILE.utr })} />
            <Button kind="secondary" size="sm" iconLeft="download">{t("py11.file.download")}</Button>
            <div style={{ flex: 1, minWidth: 260 }}>
              <p style={ty("caption", { color: c.inkFaint, margin: 0 })}>
                {t("py11.file.generated", { when: stamp(t, JULY_FILE.generatedIso, JULY_FILE.generatedTime), who: t(MAKER.nameKey) })}
                {" · "}
                {t("py11.file.downloaded", { when: stamp(t, JULY_FILE.downloadedIso, JULY_FILE.downloadedTime) })}
              </p>
            </div>
          </div>
          <p style={ty("small", { color: c.inkMuted, margin: "14px 0 0", maxWidth: 780 })}>{t("py11.disbursedNote")}</p>
        </Card>

        {/* ---- the supplementary file: the live generate -> download ->
             record-the-reference chain, refusing without a reference ---- */}
        <Card icon="payroll" iconTone="info" title={t("py11.supp.title")}
          sub={t("py11.supp.sub", { who: t("pyo.hr"), n: num(JULY_EXCLUDED.length), amt: inr(JULY_EXCLUDED_TOTAL) })}>
          <MiniTable
            columns={[
              { key: "person", label: t("py11.x.col.person") },
              { key: "acct", label: t("py11.x.col.account"), mono: true, width: 160 },
              { key: "why", label: t("py11.x.col.why") },
              { key: "fixed", label: "", width: 230 },
              { key: "amt", label: t("py11.x.col.amount"), align: "right", mono: true, width: 130 },
            ]}
            rows={JULY_EXCLUDED.map((x) => ({
              id: x.staff,
              cells: {
                person: (
                  <span>
                    <span style={{ fontWeight: 600 }}>{t(x.personKey)}</span>
                    <span style={G3.fig("xs", { color: c.inkFaint, marginLeft: 8 })}>{x.staff}</span>
                  </span>
                ),
                acct: x.mask || <span style={ty("caption", { color: c.inkFaint })}>{t("py11.x.none")}</span>,
                why: t(x.reasonKey),
                fixed: <StatusMark role="present" glyph="check" word={t("py11.x.fixed", { when: fmtDate(t, x.fixedIso), who: t(x.fixedBy.nameKey) })} />,
                amt: inr(x.v),
              },
            }))}
            total={{ label: t("py11.b.total"), cells: { person: t("py11.b.total"), amt: inr(JULY_EXCLUDED_TOTAL) } }}
          />

          <div style={{ marginTop: 18 }}>
            {supp === "idle" ? (
              <Button kind="primary" iconLeft="payroll" onClick={() => setSupp("generated")}>{t("py11.supp.gen")}</Button>
            ) : null}
            {supp === "generated" ? (
              <div>
                <Panel tone="present" glyph="check"
                  body={t("py11.supp.generated", { id: SUPP_FILE.id, n: num(SUPP_FILE.payees), amt: inr(SUPP_FILE.v), c: "3D91-77E2-0AB4-5C68" })} />
                <div style={{ marginTop: 14 }}>
                  <Button kind="primary" iconLeft="download" onClick={() => setSupp("downloaded")}>{t("py11.supp.download")}</Button>
                </div>
              </div>
            ) : null}
            {supp === "downloaded" ? (
              <div>
                <Panel tone="late" glyph="clock" body={t("py11.supp.downloaded")} />
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 14 }}>
                  <div style={{ width: 220 }}>
                    <Field id="py11-date" label={t("py11.supp.date")} error={suppErr === "date" ? t("py11.supp.errDate") : null}>
                      <Input id="py11-date" value={dDate} onChange={setDDate} />
                    </Field>
                  </div>
                  <div style={{ width: 300 }}>
                    <Field id="py11-utr" label={t("py11.supp.utr")} error={suppErr === "utr" ? t("py11.supp.errUtr") : null}>
                      <Input id="py11-utr" value={utr} onChange={setUtr} placeholder={t("py11.supp.utrPh")} />
                    </Field>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <Button kind="primary" iconLeft="check" onClick={markDisbursed}>{t("py11.supp.mark")}</Button>
                  </div>
                </div>
              </div>
            ) : null}
            {supp === "done" ? (
              <Panel tone="present" glyph="check" body={t("py11.supp.done", { id: SUPP_FILE.id, d: fmtDate(t, dDate), utr: utr })} />
            ) : null}
          </div>
          <p style={ty("caption", { color: c.inkFaint, margin: "14px 0 0", maxWidth: 780 })}>{t("py11.supp.proposed")}</p>
          <p style={ty("caption", { color: c.inkFaint, margin: "8px 0 0", maxWidth: 780 })}>{t("py11.supp.noReturn")}</p>
        </Card>

        {/* ---- PY-12 ---- */}
        <Card icon="mail" iconTone="accent" title={t("py12.title")} sub={t("py12.q")}>
          <div style={{ marginBottom: 18 }}>
            <Panel tone="late" glyph="clock" head={t("py12.aug.state")}
              body={t("py12.aug.why", { run: RUN_ID, n: num(RUN_HEADS) })} />
          </div>
          <OffAction kind="primary" iconLeft="mail" label={t("py12.release")} reason={t("py12.releaseOff")} />

          <div style={{ marginTop: 22 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 })}>{t("py12.channels")}</div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
              <Switch id="py12-inapp" checked onChange={() => null} label={t("py12.ch.inapp")} />
              <Switch id="py12-email" checked={chEmail} onChange={setChEmail} label={t("py12.ch.email")} />
              <Switch id="py12-sms" checked={chSms} onChange={setChSms} label={t("py12.ch.sms")} />
            </div>
            <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0", maxWidth: 760 })}>{t("py12.ch.note")}</p>
          </div>

          <div style={{ marginTop: 22, background: c.sunken, borderRadius: G3.r.lg, padding: "14px 16px" }}>
            <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("py12.password")}</div>
            <p style={ty("small", { color: c.inkMuted, margin: "5px 0 0", maxWidth: 780 })}>{t("py12.passwordNote")}</p>
          </div>
        </Card>

        <Card icon="check" iconTone="present" title={t("py12.july.title")}
          sub={t("py12.july.state", { when: stamp(t, PUB_JULY.releasedIso, PUB_JULY.releasedTime), who: t(MAKER.nameKey) })}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <StatusMark role="present" glyph="check" word={t("py12.july.delivered", { d: num(PUB_JULY.delivered), t: num(PUB_JULY.total) })} />
            <StatusMark role="absent" glyph="alert" word={t("py12.july.failed", { n: num(PUB_FAILED) })} />
          </div>
          <MiniTable
            columns={[
              { key: "ch", label: t("py12.f.col.channel") },
              { key: "n", label: t("py12.f.col.n"), align: "right", mono: true, width: 110 },
              { key: "why", label: t("py12.f.col.why") },
            ]}
            rows={PUB_JULY.failures.map((f) => ({ id: f.channelKey, cells: { ch: t(f.channelKey), n: num(f.n), why: t(f.reasonKey) } }))}
            total={{ label: t("py12.july.failed", { n: num(PUB_FAILED) }), cells: { ch: t("py12.f.total"), n: num(PUB_FAILED) } }}
          />
          <div style={{ marginTop: 16, display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
            {retried
              ? <Panel tone="present" glyph="check" body={t("py12.retried", { when: t("pyo.justNow") })} />
              : <Button kind="secondary" iconLeft="arrow" onClick={() => setRetried(true)}>{t("py12.retry")}</Button>}
            {!retried ? <p style={ty("caption", { color: c.inkFaint, margin: 0, flex: 1, minWidth: 240, maxWidth: 520 })}>{t("py12.retryNote", { n: num(PUB_FAILED) })}</p> : null}
          </div>

          <div style={{ marginTop: 22 }}>
            <AbsentNote head={t("py12.unsee")} body={t("py12.unseeWhy")} icon="lock" />
          </div>

          <div style={{ marginTop: 18, background: c.sunken, borderRadius: G3.r.lg, padding: "14px 16px" }}>
            <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("py12.reissue.title")}</div>
            <p style={ty("small", { color: c.inkMuted, margin: "5px 0 0", maxWidth: 780 })}>
              {t("py12.reissue.body", {
                name: t(PUB_JULY.reissue.personKey), id: PUB_JULY.reissue.staff,
                when: fmtDate(t, PUB_JULY.reissue.onIso), why: t(PUB_JULY.reissue.reasonKey),
              })}
            </p>
            <p style={ty("caption", { color: c.inkFaint, margin: "8px 0 0", maxWidth: 780 })}>{t("py12.reissue.reason", { src: PUB_JULY.reissue.source })}</p>
            {reissued ? (
              <div style={{ marginTop: 14 }}><Panel tone="present" glyph="check" body={t("pyo.recorded", { when: t("pyo.justNow") })} /></div>
            ) : !reissue ? (
              <div style={{ marginTop: 14 }}>
                <Button kind="secondary" size="sm" iconLeft="document" onClick={() => setReissue(true)}>{t("py12.reissue.do")}</Button>
              </div>
            ) : (
              <ReasonPrompt
                idBase="py12-reissue"
                title={t("py12.reissue.do")}
                body={t("py12.reissue.prompt")}
                options={["pyo.arr.src.correction", "pyo.arr.src.revision", "pyo.cause.lop", "pyo.cause.units"]}
                onConfirm={() => { setReissued(true); setReissue(false); }}
                onCancel={() => setReissue(false)}
              />
            )}
          </div>
        </Card>
      </div>
    );
  }

  /* ============================================================
     18 . PY-13 — LOANS AND ADVANCES.
     Every inventory action: create (with the refusal that matters),
     approve (absent for the maker), foreclose, defer, write off, the
     schedule, and the export.
     ============================================================ */
  function LoansScreen() {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [sched, setSched] = useState(null);
    const [fc, setFc] = useState(null);
    const [fcAmt, setFcAmt] = useState("");
    const [fcStage, setFcStage] = useState("amount");
    const [skip, setSkip] = useState(null);
    const [skipMode, setSkipMode] = useState(null);
    const [newOpen, setNewOpen] = useState(false);
    const [nWho, setNWho] = useState(LOAN_CANDIDATES[6].staff);
    const [nKind, setNKind] = useState("advance");
    const [nPrincipal, setNPrincipal] = useState("60000");
    const [nTenure, setNTenure] = useState("2");
    const [nErr, setNErr] = useState(null);
    const [nOk, setNOk] = useState(false);
    const [done, setDone] = useState(null);

    const cand = LOAN_CANDIDATES.filter((x) => x.staff === nWho)[0] || LOAN_CANDIDATES[0];
    const nP = parseFloat(nPrincipal);
    const nT = parseInt(nTenure, 10);
    const nEmi = nP > 0 && nT > 0 ? r2(nP / nT) : null;

    function saveNew() {
      if (!(nP > 0)) { setNErr({ k: "principal" }); return; }
      if (!(nT > 0)) { setNErr({ k: "tenure" }); return; }
      if (nEmi > cand.net) { setNErr({ k: "net" }); return; }
      setNErr(null);
      setNOk(true);
    }

    function stateMark(l) {
      if (l.state === "pending") return <StatusMark role="late" glyph="clock" word={t("pyo.st.awaiting")} />;
      if (l.state === "atExit") return <StatusMark role="leave" glyph="signout" word={t("pyo.st.awaiting")} />;
      if (l.state === "foreclosed") return <StatusMark role="penalty" glyph="alert" word={t("pyo.st.foreclosed")} />;
      if (l.state === "closed") return <StatusMark role="off" glyph="check" word={t("pyo.st.closed")} />;
      if (loanClosing(l)) return <StatusMark role="present" glyph="check" word={t("pyo.st.closing")} />;
      return <StatusMark role="present" glyph="check" word={t("pyo.st.active")} />;
    }
    function rowNote(l) {
      if (l.state === "atExit") return t("py13.atExit", { d: fmtDate(t, l.exitIso), id: l.settlement });
      if (l.state === "pending") {
        return t("py13.pendingRow", { who: t(l.raisedBy.nameKey), d: fmtDate(t, l.raisedIso) })
          + (l.staff === "NAV-0206" ? " " + t("py13.sameName") : "");
      }
      if (l.state === "foreclosed") return t("py13.foreclosedRow", { d: fmtDate(t, l.closedIso), amt: inr(l.waiver) });
      if (l.state === "closed") return t("py13.closedRow", { d: fmtDate(t, l.closedIso) });
      if (l.skipped) return t("py13.skipped", { mon: t("pyo.mon." + parseInt(l.skipIso.split("-")[1], 10)) });
      if (l.rate > 0) return t("py13.noPerq", { r: num(l.rate) + "%" });
      if (l.staff === "NAV-0206") return t("py13.sameName");
      return null;
    }

    const cols = [
      { key: "person", label: t("py13.col.person") },
      { key: "kind", label: t("py13.col.kind"), width: 100 },
      { key: "principal", label: t("py13.col.principal"), align: "right", mono: true, width: 130 },
      { key: "emi", label: t("py13.col.emi"), align: "right", mono: true, width: 120 },
      { key: "progress", label: t("py13.col.progress"), align: "right", mono: true, width: 100 },
      { key: "out", label: t("py13.col.out"), align: "right", mono: true, width: 130 },
      { key: "run", label: t("py13.col.run"), align: "right", mono: true, width: 120 },
      { key: "state", label: t("py13.col.state"), width: 160 },
      { key: "act", label: t("py13.col.act"), align: "right", width: 44 },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: L.gap }}>
        <Card fill={c.brassSoft} border={c.brassBorder}>
          <div style={{ display: "flex", gap: 30, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ minWidth: 300, flex: 1 }}>
              <div style={ty("caption", { color: c.brass, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" })}>{t("py13.title")}</div>
              <h2 style={ty("h1", { margin: "4px 0 0", color: c.ink })}>{t("py13.q")}</h2>
              <p style={ty("small", { color: c.inkMuted, margin: "10px 0 0", maxWidth: 560 })}>
                {t("py13.hero.note", { n: num(LOANS_ACTIVE.length), run: RUN_ID })}
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
                <Button kind="primary" iconLeft="briefcase" onClick={() => setNewOpen(!newOpen)}>{t("py13.new.title")}</Button>
                <Button kind="secondary" iconLeft="download">{t("py13.export")}</Button>
              </div>
            </div>
            <div style={{ minWidth: 240, textAlign: "right" }}>
              <div style={ty("caption", { color: c.brass, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py13.hero.label")}</div>
              <Figure value={inr(LOAN_RUN_TOTAL)} size={34} weight={700} color={c.ink} align="right" style={{ letterSpacing: "-0.015em", lineHeight: 1.15, marginTop: 4 }} />
              <div style={ty("caption", { color: c.inkMuted, marginTop: 8 })}>{t("py13.hero.out")}</div>
              <Figure value={inr(LOAN_OUTSTANDING_TOTAL)} size="lg" weight={600} color={c.ink} align="right" />
            </div>
          </div>
        </Card>

        {newOpen ? (
          <Card icon="briefcase" iconTone="accent" title={t("py13.new.title")} sub={t("py13.new.sub")}
            action={<Button kind="quiet" size="sm" onClick={() => { setNewOpen(false); setNOk(false); setNErr(null); }}>{t("pyo.close")}</Button>}>
            {nOk ? (
              <Panel tone="present" glyph="check" body={t("py13.new.ok", { id: "LN-2026-042", who: t("pyo.checker") })} />
            ) : (
              <div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ width: 280 }}>
                    <Field id="py13-who" label={t("py13.new.person")}>
                      <Select id="py13-who" value={nWho} onChange={(v) => { setNWho(v); setNErr(null); setNOk(false); }}
                        options={LOAN_CANDIDATES.map((x) => ({ value: x.staff, label: t(x.key) + " · " + x.staff }))} />
                    </Field>
                  </div>
                  <div style={{ width: 190 }}>
                    <Field id="py13-kind" label={t("py13.new.kind")}>
                      <Select id="py13-kind" value={nKind} onChange={setNKind}
                        options={[{ value: "advance", label: t("py13.kind.advance") }, { value: "loan", label: t("py13.kind.loan") }]} />
                    </Field>
                  </div>
                  <div style={{ width: 190 }}>
                    <Field id="py13-p" label={t("py13.new.principal")} error={nErr && nErr.k === "principal" ? t("py13.new.errPrincipal") : null}>
                      <Input id="py13-p" value={nPrincipal} onChange={(v) => { setNPrincipal(v); setNErr(null); }} inputMode="decimal" />
                    </Field>
                  </div>
                  <div style={{ width: 150 }}>
                    <Field id="py13-t" label={t("py13.new.tenure")} error={nErr && nErr.k === "tenure" ? t("py13.new.errTenure") : null}>
                      <Input id="py13-t" value={nTenure} onChange={(v) => { setNTenure(v); setNErr(null); }} inputMode="numeric" />
                    </Field>
                  </div>
                  <div style={{ width: 260, display: "flex", alignItems: "center", marginBottom: 20 }}>
                    <Switch id="py13-perq" checked={nKind === "advance"} onChange={() => null} label={t("py13.new.perq")} />
                  </div>
                  <div style={{ width: 220 }}>
                    <Field id="py13-start" label={t("py13.new.start")}>
                      <Select id="py13-start" value="sep" onChange={() => null}
                        options={[{ value: "sep", label: t("py13.new.startNext") }]} />
                    </Field>
                  </div>
                </div>
                <p style={ty("small", { color: c.inkMuted, margin: "0 0 6px" })}>
                  {t("py13.new.headroom", { name: t(cand.key), net: inr(cand.net), c: inr(cand.committed) })}
                </p>
                {nEmi != null ? <p style={ty("body", { color: c.ink, margin: "0 0 14px", fontWeight: 600 })}>{t("py13.new.emi", { amt: inr(nEmi) })}</p> : null}
                {nErr && nErr.k === "net" ? (
                  <div style={{ marginBottom: 14 }}>
                    <Panel tone="absent" glyph="alert" head={t("py13.new.errNetShort")}
                      body={t("py13.new.errNet", { name: t(cand.key), net: inr(cand.net), emi: inr(nEmi), left: inr(r2(cand.net - nEmi)) })} />
                  </div>
                ) : null}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button kind="primary" onClick={saveNew}>{t("py13.new.submit")}</Button>
                  <Button kind="quiet" onClick={() => { setNewOpen(false); setNErr(null); }}>{t("pyo.cancel")}</Button>
                </div>
                <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0", maxWidth: 720 })}>{t("py13.new.errLocked")}</p>
              </div>
            )}
          </Card>
        ) : null}

        {!LOANS.length ? (
          <Card icon="briefcase" iconTone="off" title={t("py13.title")}>
            <EmptyState head={t("py13.empty.head")} body={t("py13.empty.body")} />
          </Card>
        ) : (
        <Register
          title={t("py13.title")}
          sub={t("py13.hero.note", { n: num(LOANS_ACTIVE.length), run: RUN_ID })}
          action={<Button kind="secondary" size="sm" iconLeft="download">{t("pyo.export")}</Button>}
          chips={[
            <StatusMark key="a" role="present" glyph="check" word={t("pyo.st.active")} count={LOANS_ACTIVE.length} />,
            <StatusMark key="p" role="late" glyph="clock" word={t("pyo.st.awaiting")} count={LOANS.filter((l) => l.state === "pending").length} />,
            <StatusMark key="x" role="leave" glyph="signout" word={t("pyo.st.closed")} count={LOANS.filter((l) => l.state === "closed" || l.state === "foreclosed").length} />,
          ]}
          columns={cols}
          rows={LOANS.map((l) => ({
            id: l.id,
            highlight: sched === l.id || fc === l.id || skip === l.id,
            tone: (l.state === "closed" || l.state === "foreclosed") ? "dim" : undefined,
            cells: {
              person: (
                <span>
                  <span style={{ fontWeight: 600 }}>{t(l.personKey)}</span>
                  <span style={G3.fig("xs", { color: c.inkFaint, marginLeft: 8 })}>{l.staff}</span>
                  {rowNote(l) ? <span style={ty("caption", { color: c.inkFaint, display: "block", marginTop: 2, maxWidth: 340 })}>{rowNote(l)}</span> : null}
                </span>
              ),
              kind: (
                <span>
                  <span>{t(l.kind === "loan" ? "py13.kind.loan" : "py13.kind.advance")}</span>
                  {l.rate === 0 ? <span style={{ display: "block", marginTop: 4 }}><Chip bg={c.brassSoft} fg={c.brass}>{t("py13.perq")}</Chip></span> : null}
                </span>
              ),
              principal: l.state === "closed" || l.state === "foreclosed" ? "—" : inr(l.principal),
              emi: l.state === "closed" || l.state === "foreclosed" ? "—" : inr(loanEmi(l)),
              progress: t("py13.progress", { p: num(l.paid), t: num(l.tenure) }),
              out: l.state === "active" || l.state === "atExit" ? inr(loanOutstanding(l)) : "—",
              run: loanThisRun(l) ? inr(loanThisRun(l)) : "—",
              state: stateMark(l),
              act: (
                <ActionMenu
                  ariaLabel={t("py13.menu.aria", { name: t(l.personKey) })}
                  items={[
                    { key: "sched", icon: "list", label: t("py13.menu.schedule"), onSelect: () => { setFc(null); setSkip(null); setSched(sched === l.id ? null : l.id); } },
                    { key: "fc", icon: "lock", label: t("py13.menu.foreclose"), disabled: l.state !== "active",
                      reason: l.state !== "active" ? t("py13.menu.forecloseOff") : null,
                      onSelect: () => { setSched(null); setSkip(null); setFcStage("amount"); setFcAmt(String(loanOutstanding(l))); setFc(l.id); } },
                    { key: "skip", icon: "clock", label: t("py13.menu.skip"), disabled: !loanThisRun(l),
                      reason: !loanThisRun(l) ? t("py13.menu.skipOff") : null,
                      onSelect: () => { setSched(null); setFc(null); setSkipMode(null); setSkip(l.id); } },
                    { key: "waive", icon: "alert", label: t("py13.menu.waive"), disabled: !loanThisRun(l),
                      reason: !loanThisRun(l) ? t("py13.menu.waiveOff") : null,
                      onSelect: () => { setSched(null); setFc(null); setSkipMode("waive"); setSkip(l.id); } },
                    l.state === "atExit"
                      ? { key: "ff", icon: "signout", label: t("py13.menu.settlement"), onSelect: () => null }
                      : { key: "ap", icon: "check", label: t("py13.menu.approve"), disabled: true, reason: t("py13.menu.approveWhy") },
                  ]}
                />
              ),
            },
          }))}
          totals={{
            label: t("py13.total"),
            cells: {
              person: t("py13.total"),
              principal: inr(LOAN_PRINCIPAL_TOTAL),
              out: inr(LOAN_OUTSTANDING_TOTAL),
              run: inr(LOAN_RUN_TOTAL),
            },
          }}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", width: "100%" }}>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 620 })}>{t("py13.perqNote", { v: CFG_JUL.v })}</p>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 320 })}>{t("py13.exportNote")}</p>
            </div>
          }
        />
        )}

        {sched ? <LoanSchedule loan={LOANS.filter((l) => l.id === sched)[0]} onClose={() => setSched(null)} /> : null}

        {fc ? (
          <ForeclosePanel loan={LOANS.filter((l) => l.id === fc)[0]} amount={fcAmt} onAmount={setFcAmt}
            stage={fcStage} onStage={setFcStage}
            onDone={() => { setFc(null); setDone(t("pyo.justNow")); }} onCancel={() => setFc(null)} />
        ) : null}

        {skip ? (
          <Card icon="clock" iconTone="accent" title={t("py13.skip.title")}
            action={<Button kind="quiet" size="sm" onClick={() => setSkip(null)}>{t("pyo.cancel")}</Button>}>
            <p style={ty("small", { color: c.inkMuted, margin: "0 0 14px", maxWidth: 760 })}>
              {t("py13.skip.body", { name: t(LOANS.filter((l) => l.id === skip)[0].personKey) })}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button kind={skipMode === "defer" ? "primary" : "secondary"} onClick={() => setSkipMode("defer")}>{t("py13.skip.defer")}</Button>
              <Button kind={skipMode === "waive" ? "primary" : "secondary"} onClick={() => setSkipMode("waive")}>{t("py13.skip.waive")}</Button>
            </div>
            {skipMode === "waive" ? (
              <div style={{ marginTop: 14 }}>
                <Panel tone="late" glyph="alert" body={t("py13.skip.waiveSecond")} />
              </div>
            ) : null}
            {skipMode ? (
              <ReasonPrompt
                idBase="py13-skip"
                title={skipMode === "waive" ? t("py13.skip.waive") : t("py13.skip.defer")}
                body={t("py13.skip.body", { name: t(LOANS.filter((l) => l.id === skip)[0].personKey) })}
                options={["pyo.loan.p.medical", "pyo.loan.p.festival", "pyo.arr.src.correction"]}
                onConfirm={() => { setSkip(null); setDone(t("pyo.justNow")); }}
                onCancel={() => setSkip(null)}
              />
            ) : null}
          </Card>
        ) : null}

        {done ? (
          <Panel tone="present" glyph="check" body={t("pyo.recorded", { when: done })}>
            <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>{t("pyo.appendOnly")}</p>
          </Panel>
        ) : null}
      </div>
    );
  }

  function LoanSchedule({ loan, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const emi = loanEmi(loan);
    const interest = loanInterest(loan);
    /* the last instalment absorbs the rounding, as a real amortisation
       schedule does - otherwise the column footer would be a few paise
       away from the principal it claims to repay */
    const perInterest = r2(interest / loan.tenure);
    const perPrincipal = r2(emi - perInterest);
    const lastInterest = r2(interest - perInterest * (loan.tenure - 1));
    const lastPrincipal = r2(loan.principal - perPrincipal * (loan.tenure - 1));
    /* a deferral does not reduce what is owed: the schedule simply runs
       one month longer and that month carries no instalment. So the row
       list spans tenure plus deferrals, and only the months that really
       recover an instalment are numbered against the tenure. */
    const start = isoParts(loan.since);
    const rows = [];
    let taken = 0;
    let n = 0;
    for (let i = 0; i < loan.tenure + (loan.skipped || 0); i++) {
      const mm = start.m + i;
      const y = start.y + Math.floor((mm - 1) / 12);
      const m = ((mm - 1) % 12) + 1;
      const iso = y + "-" + (m < 10 ? "0" : "") + m + "-01";
      const deferred = !!loan.skipped && loan.skipIso === iso;
      const paid = !deferred && taken < loan.paid;
      const isThis = !deferred && loan.state === "active" && taken === loan.paid;
      if (!deferred) { taken += 1; n += 1; }
      rows.push({ i: deferred ? null : n, y: y, m: m, paid: paid, isThis: isThis, deferred: deferred });
    }
    return (
      <Card icon="list" iconTone="info"
        title={t("py13.sched.title", { name: t(loan.personKey) })}
        sub={t("py13.sched.sub", { id: loan.id, p: inr(loan.principal), i: inr(interest), r: inr(loanRepayable(loan)), t: t("pyo.monthsN", { n: num(loan.tenure) }) })}
        action={<Button kind="quiet" size="sm" onClick={onClose}>{t("py13.sched.close")}</Button>}>
        <MiniTable
          columns={[
            { key: "n", label: t("py13.sched.col.n"), mono: true, width: 60 },
            { key: "due", label: t("py13.sched.col.due"), width: 160 },
            { key: "p", label: t("py13.sched.col.principal"), align: "right", mono: true, width: 130 },
            { key: "i", label: t("py13.sched.col.interest"), align: "right", mono: true, width: 120 },
            { key: "emi", label: t("py13.sched.col.emi"), align: "right", mono: true, width: 130 },
            { key: "st", label: t("py13.sched.col.state"), width: 140 },
            { key: "where", label: t("py13.sched.col.where"), mono: true, width: 140 },
          ]}
          rows={rows.map((x) => ({
            id: x.i,
            dim: x.paid,
            highlight: x.isThis,
            cells: {
              n: x.i == null ? "—" : num(x.i),
              due: t("pyo.mon." + x.m) + " " + x.y,
              p: x.deferred ? "—" : inr(x.i === loan.tenure ? lastPrincipal : perPrincipal),
              i: x.deferred ? "—" : (interest ? inr(x.i === loan.tenure ? lastInterest : perInterest) : "—"),
              emi: x.deferred ? "—" : inr(x.i === loan.tenure ? r2(lastPrincipal + lastInterest) : emi),
              st: x.deferred
                ? <StatusMark role="late" glyph="clock" word={t("py13.sched.st.skipped")} />
                : x.paid
                ? <StatusMark role="off" glyph="check" word={t("py13.sched.st.paid")} />
                : x.isThis
                  ? <StatusMark role="present" glyph="check" word={t("py13.sched.st.this")} />
                  : <StatusMark role="off" glyph="clock" word={t("py13.sched.st.due")} />,
              where: x.isThis ? RUN_ID : x.paid ? "PR-" + x.y + "-" + (x.m < 10 ? "0" : "") + x.m : "—",
            },
          }))}
          total={{
            label: t("py13.sched.total"),
            cells: { n: "", due: t("py13.sched.total"), p: inr(loan.principal), i: interest ? inr(interest) : "—", emi: inr(loanRepayable(loan)) },
          }}
          note={loan.skipped ? t("py13.skipped", { mon: t("pyo.mon." + parseInt(loan.skipIso.split("-")[1], 10)) }) + " " + t(loan.skipReasonKey) : null}
        />
      </Card>
    );
  }

  function ForeclosePanel({ loan, amount, onAmount, stage, onStage, onDone, onCancel }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const out = loanOutstanding(loan);
    const val = parseFloat(amount);
    const short = val >= 0 && val < out ? r2(out - val) : 0;
    return (
      <Card icon="lock" iconTone="accent" title={t("py13.fc.title", { id: loan.id })}
        action={<Button kind="quiet" size="sm" onClick={onCancel}>{t("pyo.cancel")}</Button>}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 14px", maxWidth: 760 })}>
          {t("py13.fc.body", { name: t(loan.personKey), amt: inr(out) })}
        </p>
        <div style={{ width: 260 }}>
          <Field id="py13-fc" label={t("py13.fc.amount")}>
            <Input id="py13-fc" value={amount} onChange={onAmount} inputMode="decimal" />
          </Field>
        </div>
        {short > 0 ? (
          <Panel tone="absent" glyph="alert" body={t("py13.fc.short", { amt: inr(short) })} />
        ) : (
          <Panel tone="present" glyph="check" body={t("py13.fc.ok")} />
        )}
        {stage === "amount" ? (
          <div style={{ marginTop: 14 }}>
            <Button kind="primary" onClick={() => onStage("reason")}>{t("py13.menu.foreclose")}</Button>
          </div>
        ) : (
          <ReasonPrompt
            idBase="py13-fc-r"
            title={t("py13.menu.foreclose")}
            body={short > 0 ? t("py13.fc.short", { amt: inr(short) }) : t("py13.fc.ok")}
            options={["pyo.loan.p.medical", "pyo.arr.src.correction", "pyo.loan.p.festival"]}
            onConfirm={onDone}
            onCancel={onCancel}
          />
        )}
        {short > 0 ? <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0", maxWidth: 720 })}>{t("py13.skip.waiveSecond")}</p> : null}
      </Card>
    );
  }

  /* ============================================================
     19 . PY-14 — THE REIMBURSEMENT PAYOUT BATCH.
     ============================================================ */
  function ClaimsScreen() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [removed, setRemoved] = useState({});
    const [filter, setFilter] = useState("all");
    const [recall, setRecall] = useState(false);
    const [recalled, setRecalled] = useState(false);
    const [send, setSend] = useState(false);

    const live = CLAIMS.filter((cl) => !removed[cl.id]);
    const total = sum(live);
    const taxable = live.filter((cl) => CLAIM_CATS[cl.cat].taxable).reduce((s, cl) => s + cl.v, 0);
    const exempt = r2(total - taxable);
    const shown = live.filter((cl) => filter === "all" || cl.cat === filter);
    const removedN = Object.keys(removed).filter((k) => removed[k]).length;

    const catRows = CLAIM_ORDER.map((k) => {
      const rows = live.filter((cl) => cl.cat === k);
      return { key: k, n: rows.length, v: sum(rows) };
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: L.gap }}>
        <Card fill={c.brassSoft} border={c.brassBorder}>
          <div style={{ display: "flex", gap: 30, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ minWidth: 320, flex: 1 }}>
              <div style={ty("caption", { color: c.brass, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" })}>{BATCH.id}</div>
              <h2 style={ty("h1", { margin: "4px 0 0", color: c.ink })}>{t("py14.title")}</h2>
              <p style={ty("body", { color: c.ink, margin: "10px 0 0", maxWidth: 620 })}>{t("py14.q")}</p>
              <p style={ty("small", { color: c.inkMuted, margin: "6px 0 0", maxWidth: 620 })}>{t("py14.sub")}</p>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 12 }}>
                <StatusMark role={recalled ? "off" : "late"} glyph={recalled ? "arrow" : "clock"} word={recalled ? t("pyo.st.draft") : t("pyo.st.awaiting")} />
                <Chip bg={c.surface} fg={c.inkMuted} mono>{BATCH.runId}</Chip>
                <Chip bg={c.surface} fg={c.inkMuted}>{t("pyo.cfg.chip", { v: CFG_JUL.v })}</Chip>
              </div>
            </div>
            <div style={{ minWidth: 250, textAlign: "right" }}>
              <div style={ty("caption", { color: c.brass, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py14.hero.label")}</div>
              <Figure value={inr(total)} size={34} weight={700} color={c.ink} align="right" style={{ letterSpacing: "-0.015em", lineHeight: 1.15, marginTop: 4 }} />
              <div style={ty("caption", { color: c.inkMuted, marginTop: 6 })}>
                {t("py14.hero.note", { n: num(live.length), run: BATCH.runId, who: t("pyo.checker") })}
              </div>
            </div>
          </div>
        </Card>

        <Card icon="lock" iconTone="info" title={recalled ? t("pyo.st.draft") : t("py14.state", { who: t("pyo.checker"), when: stamp(t, BATCH.submittedIso, BATCH.submittedTime) })}>
          <SignOff maker={BATCH.maker} checker={BATCH.checker} madeIso={BATCH.createdIso} madeTime={BATCH.submittedTime} />
          <p style={ty("small", { color: c.inkMuted, margin: "14px 0 0", maxWidth: 780 })}>{t("py14.stateNote")}</p>
          <div style={{ marginTop: 16 }}>
            <AbsentNote head={t("py14.approve.absent")} body={t("py14.approve.absentWhy", { who: t("pyo.checker") })} icon="check" />
          </div>
          <div style={{ marginTop: 16 }}>
            {recalled ? (
              <div>
                <Panel tone="present" glyph="check" body={t("py14.recalled", { when: t("pyo.justNow"), who: t("pyo.checker") })} />
                {send ? (
                  <ConfirmPanel
                    title={t("py14.send")}
                    body={t("py14.sendPrompt", { n: num(live.length), amt: inr(total), who: t("pyo.checker"), role: t("pyo.roleChecker"), id: CHECKER.id })}
                    onConfirm={() => { setRecalled(false); setSend(false); }}
                    onCancel={() => setSend(false)}
                  />
                ) : (
                  <div style={{ marginTop: 14 }}>
                    <Button kind="primary" iconLeft="arrow" onClick={() => setSend(true)}>{t("py14.send")}</Button>
                  </div>
                )}
              </div>
            ) : recall ? (
              <ReasonPrompt
                idBase="py14-recall"
                title={t("py14.recall")}
                body={t("py14.recallPrompt", { who: t("pyo.checker") })}
                options={["pyo.arr.src.correction", "pyo.cat.med", "pyo.cat.lta"]}
                onConfirm={() => { setRecalled(true); setRecall(false); }}
                onCancel={() => setRecall(false)}
              />
            ) : (
              <Button kind="secondary" iconLeft="signout" onClick={() => setRecall(true)}>{t("py14.recall")}</Button>
            )}
          </div>
        </Card>

        <Card icon="payslip" iconTone="accent" title={t("py14.cat.total")} sub={t("py14.split.note")}>
          <MiniTable
            columns={[
              { key: "cat", label: t("py14.cat.col.cat") },
              { key: "n", label: t("py14.cat.col.n"), align: "right", mono: true, width: 100 },
              { key: "tax", label: t("py14.cat.col.tax") },
              { key: "v", label: t("py14.cat.col.v"), align: "right", mono: true, width: 150 },
            ]}
            rows={catRows.map((r) => ({
              id: r.key,
              cells: {
                cat: <span style={{ fontWeight: 600 }}>{t(CLAIM_CATS[r.key].labelKey)}</span>,
                n: num(r.n),
                tax: (
                  <span>
                    <Chip bg={CLAIM_CATS[r.key].taxable ? c.absentTint : c.presentTint} fg={CLAIM_CATS[r.key].taxable ? c.absentText : c.presentText}>{t(CLAIM_CATS[r.key].taxKey)}</Chip>
                    <span style={ty("caption", { color: c.inkFaint, display: "block", marginTop: 3, maxWidth: 420 })}>{t(CLAIM_CATS[r.key].noteKey)}</span>
                  </span>
                ),
                v: inr(r.v),
              },
            }))}
            total={{ label: t("py14.cat.total"), cells: { cat: t("py14.cat.total"), n: num(live.length), v: inr(total) } }}
          />
          <div style={{ marginTop: 18, maxWidth: 520, marginLeft: "auto" }}>
            <EqRow sign={"+"} label={t("py14.split.taxable")} value={taxable} />
            <EqRow sign={"+"} label={t("py14.split.exempt")} value={exempt} />
            <EqRow sign={"="} label={t("py14.cat.total")} value={total} strong rule note={t("pyo.money.reconciles")} />
          </div>
        </Card>

        {!shown.length ? (
          <Card icon="payslip" iconTone="off" title={t("py14.claims.title")}>
            <EmptyState head={t("py14.empty.head")} body={t("py14.empty.body")}
              action={<Button kind="secondary" onClick={() => setFilter("all")}>{t("py14.claims.all")}</Button>} />
          </Card>
        ) : (
        <Register
          title={t("py14.claims.title")}
          sub={t("py14.claims.sub", { n: num(live.length) })}
          action={<Button kind="secondary" size="sm" iconLeft="download">{t("py14.export")}</Button>}
          chips={[
            <div key="f" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label htmlFor="py14-filter" style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py14.claims.filter")}</label>
              <div style={{ width: 240 }}>
                <Select id="py14-filter" value={filter} onChange={setFilter}
                  options={[{ value: "all", label: t("py14.claims.all") }].concat(CLAIM_ORDER.map((k) => ({ value: k, label: t(CLAIM_CATS[k].labelKey) })))} />
              </div>
            </div>,
            <Chip key="s" bg={c.sunken} fg={c.inkMuted}>{t("py14.c.shown", { n: num(shown.length), t: num(live.length) })}</Chip>,
            removedN ? <StatusMark key="r" role="absent" glyph="alert" word={t("py14.c.removed", { n: num(removedN) })} /> : null,
          ].filter(Boolean)}
          columns={[
            { key: "id", label: t("py14.c.col.id"), mono: true, width: 110 },
            { key: "person", label: t("py14.c.col.person") },
            { key: "cat", label: t("py14.c.col.cat"), width: 200 },
            { key: "approved", label: t("py14.c.col.approved"), width: 150 },
            { key: "v", label: t("py14.c.col.v"), align: "right", mono: true, width: 130 },
            { key: "act", label: t("py14.c.col.act"), align: "right", width: 44 },
          ]}
          rows={shown.map((cl) => ({
            id: cl.id,
            cells: {
              id: cl.id,
              person: (
                <span>
                  <span style={{ fontWeight: 600 }}>{t(cl.personKey)}</span>
                  <span style={G3.fig("xs", { color: c.inkFaint, marginLeft: 8 })}>{cl.staff}</span>
                </span>
              ),
              cat: t(CLAIM_CATS[cl.cat].labelKey),
              approved: fmtDate(t, cl.approvedIso),
              v: inr(cl.v),
              act: (
                <ActionMenu
                  ariaLabel={t("py09.menu.aria", { name: t(cl.personKey) })}
                  items={[
                    { key: "rm", icon: "signout", label: t("py14.c.remove"), disabled: !recalled,
                      reason: !recalled ? t("py14.c.removeOff") : null,
                      onSelect: () => setRemoved(Object.assign({}, removed, { [cl.id]: true })) },
                  ]}
                />
              ),
            },
          }))}
          totals={{
            /* the footer sums what is LISTED, so it says what it summed:
               "the batch" only when the whole batch is on screen */
            label: filter === "all" ? t("py14.cat.total") : t(CLAIM_CATS[filter].labelKey),
            cells: {
              id: "",
              person: filter === "all" ? t("py14.cat.total") : t(CLAIM_CATS[filter].labelKey),
              v: inr(sum(shown)),
            },
          }}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", width: "100%" }}>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 620 })}>
                {t("py14.withdrawn", {
                  name: t(CLAIM_WITHDRAWN.personKey), id: CLAIM_WITHDRAWN.id,
                  amt: inr(CLAIM_WITHDRAWN.v), when: fmtDate(t, CLAIM_WITHDRAWN.withdrawnIso),
                })}
              </p>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 300 })}>{t("py14.exportNote")}</p>
            </div>
          }
        />
        )}

        {removedN ? (
          <Card icon="arrow" iconTone="off" title={t("py14.c.removed", { n: num(removedN) })}>
            <MiniTable
              columns={[
                { key: "id", label: t("py14.c.col.id"), mono: true, width: 110 },
                { key: "person", label: t("py14.c.col.person") },
                { key: "v", label: t("py14.c.col.v"), align: "right", mono: true, width: 130 },
                { key: "act", label: "", align: "right", width: 140 },
              ]}
              rows={CLAIMS.filter((cl) => removed[cl.id]).map((cl) => ({
                id: cl.id, dim: true,
                cells: {
                  id: cl.id, person: t(cl.personKey), v: inr(cl.v),
                  act: <LinkButton onClick={() => { const n = Object.assign({}, removed); delete n[cl.id]; setRemoved(n); }}>{t("py14.c.add")}</LinkButton>,
                },
              }))}
            />
          </Card>
        ) : null}

        <Card icon="signout" iconTone="off" title={t("py14.prev.title")}>
          <div style={{ marginBottom: 12 }}>
            <StatusMark role="absent" glyph="signout" word={t("pyo.st.sentBack")} />
          </div>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 12px", maxWidth: 780 })}>
            {t("py14.prev.body", {
              id: BATCH_PREV.id, sent: fmtDate(t, BATCH_PREV.submittedIso),
              who: t("pyo.checker"), back: fmtDate(t, BATCH_PREV.decidedIso), again: BATCH_PREV.resubAs,
            })}
          </p>
          <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: "12px 14px" }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py14.prev.reasonLabel")}</div>
            <p style={ty("small", { color: c.ink, margin: "4px 0 0" })}>{t(BATCH_PREV.reasonKey)}</p>
          </div>
          <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0" })}>{t("pyo.appendOnly")}</p>
        </Card>
      </div>
    );
  }

  /* ============================================================
     20 . PY-15 — THE ARREARS WORKBENCH.
     The whole point of the month table is the version column. A month
     that cannot be resolved is listed and excluded, and while it is
     excluded the posting cannot be sent.
     ============================================================ */
  function ArrearsScreen() {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [selId, setSelId] = useState(ARREARS[0].id);
    const [send, setSend] = useState(false);
    const [sent, setSent] = useState(false);
    const [supersede, setSupersede] = useState(false);
    const [done, setDone] = useState(null);
    const [source, setSource] = useState("");
    const [fromIso, setFromIso] = useState(ARREARS[0].rangeFromIso);
    const [toIso, setToIso] = useState(ARREARS[0].rangeToIso);
    const [people, setPeople] = useState(String(ARREARS[0].people));
    const [computed, setComputed] = useState(false);
    const [srcErr, setSrcErr] = useState(false);

    const sel = ARREARS.filter((a) => a.id === selId)[0] || ARREARS[0];
    const blocked = sel.excluded.length > 0;
    const isDraft = sel.state === "draft";
    const showSplit = !isDraft || computed;

    function compute() {
      if (!source) { setSrcErr(true); return; }
      setSrcErr(false);
      setComputed(true);
    }

    function stateMark(a) {
      if (a.state === "posted") return <StatusMark role="present" glyph="check" word={t("pyo.st.posted")} />;
      if (a.state === "awaiting") return <StatusMark role={a.stale ? "absent" : "late"} glyph={a.stale ? "alert" : "clock"} word={a.stale ? t("pyo.st.recompute") : t("pyo.st.awaiting")} />;
      return <StatusMark role="off" glyph="arrow" word={t("pyo.st.draft")} />;
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: L.gap }}>
        {!ARREARS.length ? (
          <Card icon="list" iconTone="off" title={t("py15.list.title")}>
            <EmptyState head={t("py15.empty.head")} body={t("py15.empty.body")} />
          </Card>
        ) : (
        <Register
          title={t("py15.title")}
          sub={t("py15.q") + " " + t("py15.sub")}
          action={<Button kind="secondary" size="sm" iconLeft="download">{t("py15.export")}</Button>}
          columns={[
            { key: "id", label: t("py15.l.col.id"), mono: true, width: 130 },
            { key: "src", label: t("py15.l.col.source"), width: 210 },
            { key: "people", label: t("py15.l.col.people"), align: "right", mono: true, width: 90 },
            { key: "range", label: t("py15.l.col.range"), width: 210 },
            { key: "gross", label: t("py15.l.col.gross"), align: "right", mono: true, width: 150 },
            { key: "state", label: t("py15.l.col.state"), width: 190 },
            { key: "act", label: "", align: "right", width: 100 },
          ]}
          rows={ARREARS.map((a) => ({
            id: a.id,
            highlight: a.id === selId,
            cells: {
              id: a.id,
              src: t(a.sourceKey),
              people: num(a.people),
              range: t("py15.range", { from: fmtDate(t, a.rangeFromIso), to: fmtDate(t, a.rangeToIso) }),
              gross: inr(arrGross(a)),
              state: stateMark(a),
              act: <LinkButton onClick={() => { setSelId(a.id); setSend(false); setSupersede(false); }}>{a.id === selId ? t("pyo.close") : t("pyo.open")}</LinkButton>,
            },
          }))}
          totals={{
            label: t("py15.m.total"),
            cells: { id: "", src: t("py15.m.total"), people: num(ARREARS.reduce((s, a) => s + a.people, 0)), gross: inr(ARREARS.reduce((s, a) => s + arrGross(a), 0)) },
          }}
          footer={<p style={ty("caption", { color: c.inkFaint, margin: 0 })}>{t("py15.exportNote")}</p>}
        />
        )}

        <Card icon="scan" iconTone="info" title={t("py15.detail.title", { id: sel.id })}
          sub={t("py15.range", { from: fmtDate(t, sel.rangeFromIso), to: fmtDate(t, sel.rangeToIso) })}>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginBottom: 16 }}>
            <Fact label={t("py15.l.col.source")} w={200}>
              {sel.state === "draft" ? (
                <div style={{ width: 210 }}>
                  <Select id="py15-src" value={source} onChange={(v) => { setSource(v); setComputed(false); setSrcErr(false); }}
                    options={[
                      { value: "", label: t("py15.create.sourceNone") },
                      { value: "pyo.arr.src.revision", label: t("pyo.arr.src.revision") },
                      { value: "pyo.arr.src.davda", label: t("pyo.arr.src.davda") },
                      { value: "pyo.arr.src.promotion", label: t("pyo.arr.src.promotion") },
                      { value: "pyo.arr.src.correction", label: t("pyo.arr.src.correction") },
                    ]} />
                </div>
              ) : <span style={ty("small", { color: c.ink })}>{t(sel.sourceKey)}</span>}
            </Fact>
            <Fact label={t("py15.l.col.people")} w={110}><Figure value={num(sel.people)} size="md" weight={600} color={c.ink} /></Fact>
            <Fact label={t("py15.postTarget")} w={160}>
              <span style={ty("small", { color: c.ink })}>{sel.target || "—"}</span>
            </Fact>
            <Fact label={t("py15.l.col.state")} w={180}>{stateMark(sel)}</Fact>
          </div>

          {isDraft ? (
            <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: "14px 16px", marginBottom: 18 }}>
              <div style={ty("small", { color: c.ink, fontWeight: 700, marginBottom: 10 })}>{t("py15.create")}</div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ width: 230 }}>
                  <Field id="py15-from" label={t("py15.create.from")}>
                    <Input id="py15-from" value={fromIso} onChange={(v) => { setFromIso(v); setComputed(false); }} />
                  </Field>
                </div>
                <div style={{ width: 230 }}>
                  <Field id="py15-to" label={t("py15.create.to")}>
                    <Input id="py15-to" value={toIso} onChange={(v) => { setToIso(v); setComputed(false); }} />
                  </Field>
                </div>
                <div style={{ width: 170 }}>
                  <Field id="py15-people" label={t("py15.create.people")}>
                    <Input id="py15-people" value={people} onChange={setPeople} inputMode="numeric" />
                  </Field>
                </div>
                <div style={{ marginBottom: 20, flex: 1, minWidth: 260 }}>
                  {source
                    ? <Button kind="primary" iconLeft="scan" onClick={compute}>{t("py15.compute")}</Button>
                    : <OffAction kind="primary" iconLeft="scan" label={t("py15.compute")} reason={t("py15.computeOff")} />}
                </div>
              </div>
              {srcErr ? <p role="alert" style={ty("small", { color: c.dangerText, margin: 0 })}>{t("py15.create.errSource")}</p> : null}
            </div>
          ) : null}

          {!showSplit ? (
            <EmptyState compact head={t("py15.notComputed.head")} body={t("py15.notComputed.body")} />
          ) : (
          <MiniTable
            columns={[
              { key: "m", label: t("py15.m.col.month"), width: 150 },
              { key: "cfg", label: t("py15.m.col.cfg"), mono: true, width: 120 },
              { key: "old", label: t("py15.m.col.old"), align: "right", mono: true, width: 140 },
              { key: "new", label: t("py15.m.col.new"), align: "right", mono: true, width: 150 },
              { key: "delta", label: t("py15.m.col.delta"), align: "right", mono: true, width: 130 },
              { key: "pf", label: t("py15.m.col.pf"), align: "right", mono: true, width: 130 },
              { key: "tds", label: t("py15.m.col.tds"), align: "right", mono: true, width: 120 },
              { key: "net", label: t("py15.m.col.net"), align: "right", mono: true, width: 140 },
            ]}
            rows={sel.months.map((x) => ({
              id: x.m,
              cells: {
                m: t("pyo.period", { mon: t("pyo.mon." + x.m) }),
                cfg: <Chip bg={c.accentSoft} fg={c.action} mono>{x.cfg.v}</Chip>,
                old: inr(x.old),
                new: inr(x.neu),
                delta: inr(monDelta(x)),
                pf: inr(x.pf),
                tds: inr(x.tds),
                net: inr(monNet(x)),
              },
            }))}
            total={{
              label: t("py15.m.total"),
              cells: {
                m: t("py15.m.total"),
                delta: inr(arrGross(sel)),
                pf: inr(sel.months.reduce((s, x) => s + x.pf, 0)),
                tds: inr(sel.months.reduce((s, x) => s + x.tds, 0)),
                net: inr(arrNet(sel)),
              },
            }}
            note={t("py15.pinNote", { d: cfgFrom(CFG_JUL) })}
          />
          )}

          {showSplit && sel.excluded.length ? (
            <div style={{ marginTop: 18 }}>
              <Panel tone="absent" glyph="alert" head={t("py15.excl.title")}
                body={t("py15.excl.body", { mon: t("pyo.mon." + sel.excluded[0].m) })}>
                <p style={ty("small", { color: c.ink, margin: "8px 0 0", maxWidth: 720 })}>{t(sel.excluded[0].reasonKey)}</p>
                <div style={{ marginTop: 10 }}>
                  <LinkButton>{t("py15.excl.resolve")}</LinkButton>
                </div>
                <p style={ty("caption", { color: c.inkMuted, margin: "10px 0 0", maxWidth: 720 })}>{t("py15.excl.blocks")}</p>
              </Panel>
            </div>
          ) : null}

          {sel.stale ? (
            <div style={{ marginTop: 18 }}>
              <Panel tone="absent" glyph="alert" head={t("py15.stale")} body={t("py15.staleBody", { who: t("pyo.checker") })}>
                <p style={ty("small", { color: c.ink, margin: "8px 0 0", maxWidth: 720 })}>{t(sel.staleCauseKey)}</p>
                <div style={{ marginTop: 12 }}>
                  <Button kind="secondary" size="sm" iconLeft="arrow" onClick={() => setDone(t("pyo.justNow"))}>{t("py15.recompute")}</Button>
                </div>
              </Panel>
            </div>
          ) : null}

          {sel.state === "posted" ? (
            <div style={{ marginTop: 18 }}>
              <Panel tone="present" glyph="check" body={t("py15.postedIn", { run: sel.target, when: fmtDate(t, sel.postedIso) })}>
                <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0", maxWidth: 720 })}>{t("py15.postBlocked", { run: "PR-2026-09" })}</p>
              </Panel>
            </div>
          ) : null}

          <div style={{ marginTop: 20 }}>
            <SignOff
              maker={sel.maker || MAKER} checker={sel.checker || CHECKER}
              madeIso={sel.createdIso}
              decidedIso={sel.state === "posted" ? sel.decidedIso : null}
            />
          </div>

          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            {isDraft && showSplit ? (
              blocked ? (
                <OffAction kind="primary" iconLeft="arrow" label={t("py15.send")}
                  reason={t("py15.sendOff", { n: num(sel.excluded.length) })} />
              ) : sent ? (
                <Panel tone="present" glyph="check" body={t("pyo.recorded", { when: t("pyo.justNow") })} />
              ) : send ? (
                <ConfirmPanel
                  title={t("py15.send")}
                  body={t("py15.sendPrompt", { amt: inr(arrGross(sel)), n: num(sel.months.length), p: num(sel.people), who: t("pyo.checker"), role: t("pyo.roleChecker"), id: CHECKER.id })}
                  onConfirm={() => { setSent(true); setSend(false); }}
                  onCancel={() => setSend(false)}
                />
              ) : (
                <Button kind="primary" iconLeft="arrow" onClick={() => setSend(true)}>{t("py15.send")}</Button>
              )
            ) : null}

            {sel.state === "awaiting" ? (
              <OffAction kind="primary" iconLeft="payroll" label={t("py15.post")} reason={t("py15.postOff", { who: t("pyo.checker") })} />
            ) : null}

            {sel.state === "posted" ? (
              supersede ? (
                <ReasonPrompt
                  idBase="py15-sup"
                  title={t("py15.supersede")}
                  body={t("py15.supersedePrompt", { id: sel.id })}
                  options={["pyo.arr.src.correction", "pyo.arr.src.revision", "pyo.arr.src.davda"]}
                  onConfirm={() => { setSupersede(false); setDone(t("pyo.justNow")); }}
                  onCancel={() => setSupersede(false)}
                />
              ) : (
                <Button kind="secondary" iconLeft="document" onClick={() => setSupersede(true)}>{t("py15.supersede")}</Button>
              )
            ) : null}

            <AbsentNote head={t("py15.approve.absent")} body={t("py15.approve.absentWhy", { who: t("pyo.checker") })} icon="check" />
          </div>

          {done ? <div style={{ marginTop: 16 }}><Panel tone="present" glyph="check" body={t("pyo.recorded", { when: done })} /></div> : null}
          <p style={ty("caption", { color: c.inkFaint, margin: "16px 0 0", maxWidth: 780 })}>{t("py15.computed", { when: stamp(t, sel.createdIso) })}</p>
        </Card>
      </div>
    );
  }

  /* ============================================================
     21 . PY-16 + PY-17 — EXITS AND THE SETTLEMENT.
     ============================================================ */
  function ExitsScreen() {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [filter, setFilter] = useState("open");
    const [campus, setCampus] = useState("all");
    const [selId, setSelId] = useState("FF-2026-015");
    const [flag, setFlag] = useState(false);

    const rows = EXITS.filter((e) => {
      if (filter === "open" && (e.state === "paid")) return false;
      if (campus !== "all" && e.campusKey !== campus) return false;
      return true;
    });
    const sel = EXITS.filter((e) => e.id === selId)[0]
      || rows.filter((e) => e.id)[0]
      || EXITS.filter((e) => e.id)[0];

    function clock(e) {
      const d = daysBetween(e.lwdIso, TODAY_ISO);
      return d >= 0 ? t("py16.clock.days", { n: num(d) }) : t("py16.clock.future", { n: num(-d) });
    }
    function stateMark(e) {
      if (e.state === "paid") return <StatusMark role="present" glyph="check" word={t("pyo.st.paid")} />;
      if (e.state === "approved") return <StatusMark role={e.overdue ? "absent" : "present"} glyph={e.overdue ? "alert" : "check"} word={e.overdue ? t("pyo.st.overdue") : t("pyo.st.approved")} />;
      if (e.state === "awaiting") return <StatusMark role="late" glyph="clock" word={t("pyo.st.awaiting")} />;
      if (e.state === "computed") return <StatusMark role="late" glyph="scan" word={t("pyo.st.computed")} />;
      if (e.provisional) return <StatusMark role="off" glyph="clock" word={t("pyo.st.provisional")} />;
      return <StatusMark role="off" glyph="arrow" word={t("pyo.st.notStarted")} />;
    }
    function netOf(e) {
      if (e.net != null) return inr(e.net);
      if (e.lines) return inr(sum(e.lines));
      if (e.live) return inr(sum(settlementLines(e, {})));
      return "—";
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: L.gap }}>
        <Card icon="signout" iconTone="accent" title={t("py16.title")} sub={t("py16.q")}>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 14px", maxWidth: 820 })}>{t("py16.scope")}</p>
          <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 820 })}>
            {t("py16.notStartedN", { n: num(EXITS_NOT_STARTED.length) })}
          </p>
        </Card>

        {!rows.length ? (
          <Card icon="signout" iconTone="off" title={t("py16.title")}>
            <EmptyState head={t("py16.empty.head")} body={t("py16.empty.body")}
              action={<Button kind="secondary" onClick={() => { setFilter("all"); setCampus("all"); }}>{t("py16.filter.all")}</Button>} />
          </Card>
        ) : (
        <Register
          title={t("py16.title")}
          sub={t("py16.clock.note")}
          action={<Button kind="secondary" size="sm" iconLeft="download">{t("py16.export")}</Button>}
          chips={[
            <div key="f" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label htmlFor="py16-filter" style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py16.filter.label")}</label>
              <div style={{ width: 210 }}>
                <Select id="py16-filter" value={filter} onChange={setFilter}
                  options={[{ value: "open", label: t("py16.filter.open") }, { value: "all", label: t("py16.filter.all") }]} />
              </div>
            </div>,
            <div key="cm" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label htmlFor="py16-campus" style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("py16.filter.campus")}</label>
              <div style={{ width: 200 }}>
                <Select id="py16-campus" value={campus} onChange={setCampus}
                  options={[{ value: "all", label: t("py16.filter.allCampus") }].concat(
                    ["pyo.camp.indira", "pyo.camp.white", "pyo.camp.hyd"].map((k) => ({ value: k, label: t(k) })))} />
              </div>
            </div>,
          ]}
          columns={[
            { key: "person", label: t("py16.col.person") },
            { key: "campus", label: t("py16.col.campus"), width: 140 },
            { key: "lwd", label: t("py16.col.lwd"), width: 160 },
            { key: "clock", label: t("py16.col.clock"), align: "right", mono: true, width: 120 },
            { key: "notice", label: t("py16.col.notice"), width: 150 },
            { key: "state", label: t("py16.col.state"), width: 170 },
            { key: "net", label: t("py16.col.net"), align: "right", mono: true, width: 150 },
            { key: "act", label: t("py16.col.act"), align: "right", width: 44 },
          ]}
          rows={rows.map((e) => ({
            id: e.staff,
            highlight: sel && e.id === sel.id,
            tone: e.state === "paid" ? "dim" : undefined,
            cells: {
              person: (
                <span>
                  <span style={{ fontWeight: 600 }}>{t(e.personKey)}</span>
                  <span style={G3.fig("xs", { color: c.inkFaint, marginLeft: 8 })}>{e.staff}</span>
                  <span style={ty("caption", { color: c.inkFaint, display: "block", marginTop: 2 })}>{t(e.groupKey)}</span>
                </span>
              ),
              campus: t(e.campusKey),
              lwd: fmtDate(t, e.lwdIso),
              clock: clock(e),
              notice: e.noticeContract == null
                ? "—"
                : noticeShortfall(e) === 0
                  ? <StatusMark role="present" glyph="check" word={t("py16.notice.full")} />
                  : <StatusMark role="late" glyph="alert" word={t("py16.notice.short", { n: num(noticeShortfall(e)) })} />,
              state: (
                <span>
                  {stateMark(e)}
                  {e.accessActive ? <span style={{ display: "block", marginTop: 5 }}><StatusMark role="absent" glyph="alert" word={t("py16.accessGap")} /></span> : null}
                  {e.state === "paid" ? <span style={ty("caption", { color: c.inkFaint, display: "block", marginTop: 4 })}>{t("py16.paidWith", { d: fmtDate(t, e.paidIso), run: e.paidWith })}</span> : null}
                </span>
              ),
              net: netOf(e),
              act: (
                <ActionMenu
                  ariaLabel={t("py16.menu.aria", { name: t(e.personKey) })}
                  items={[
                    e.id
                      ? { key: "open", icon: "document", label: t("py16.menu.open"), onSelect: () => setSelId(e.id) }
                      : { key: "start", icon: "arrow", label: t("py16.start"), disabled: !!e.blockerKey,
                          reason: e.blockerKey ? t("py16.startOff") : null, onSelect: () => null },
                    { key: "loan", icon: "briefcase", label: t("py16.menu.loan"),
                      disabled: !LOANS.filter((l) => l.staff === e.staff).length,
                      reason: LOANS.filter((l) => l.staff === e.staff).length ? null : t("py13.empty.head"),
                      onSelect: () => null },
                    { key: "access", icon: "lock", label: t("py16.menu.access"), disabled: !e.accessActive,
                      reason: e.accessActive ? null : t("py16.accessBody"), onSelect: () => setFlag(true) },
                  ]}
                />
              ),
            },
          }))}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", width: "100%" }}>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 560 })}>{t("py16.clock.note")}</p>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 300 })}>{t("py16.exportNote")}</p>
            </div>
          }
        />
        )}

        {/* one panel per person, not one per issue: the register above
            says WHERE each settlement has got to, and this says what is
            holding it there and what to do about it. A person with two
            problems gets one panel with two problems in it. */}
        <Card icon="alert" iconTone="brass" title={t("py16.holding")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {EXITS.filter((e) => e.blockerKey || e.provisional || e.accessActive || e.overdue).map((e) => {
              const tone = e.blockerKey || e.accessActive || e.overdue ? "absent" : "late";
              return (
                <Panel key={e.staff} tone={tone} glyph={e.provisional && !e.blockerKey ? "clock" : "alert"}
                  head={t(e.personKey) + " · " + e.staff + " · " + fmtDate(t, e.lwdIso)}>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    {e.blockerKey ? <li style={ty("small", { color: c.ink, marginBottom: 5 })}>{t(e.blockerKey)}</li> : null}
                    {e.accessActive ? <li style={ty("small", { color: c.ink, marginBottom: 5 })}>{t("py16.accessBody")}</li> : null}
                    {e.provisional ? <li style={ty("small", { color: c.ink, marginBottom: 5 })}>{t("py16.provisional")}</li> : null}
                    {e.overdue ? <li style={ty("small", { color: c.ink, marginBottom: 5 })}>{t("py16.overdue", { d: fmtDate(t, e.decidedIso) })}</li> : null}
                  </ul>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                    {e.blockerKey
                      ? <OffAction size="sm" label={t("py16.start")} reason={t("py16.startOff")} />
                      : e.provisional
                        ? <Button kind="secondary" size="sm" iconLeft="arrow">{t("py16.start")}</Button>
                        : null}
                    {e.accessActive
                      ? <Button kind="secondary" size="sm" iconLeft="lock" onClick={() => setFlag(true)}>{t("py16.accessFix")}</Button>
                      : null}
                    {e.overdue
                      ? <LinkButton onClick={() => setSelId(e.id)}>{t("py16.menu.open")}</LinkButton>
                      : null}
                  </div>
                  {e.accessActive && flag ? <div style={{ marginTop: 10 }}><Panel tone="present" glyph="check" body={t("pyo.recorded", { when: t("pyo.justNow") })} /></div> : null}
                </Panel>
              );
            })}
          </div>
        </Card>

        {sel ? <Settlement exit={sel} /> : <Card><EmptyState head={t("py17.pick")} /></Card>}
      </div>
    );
  }

  function Settlement({ exit }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const [waived, setWaived] = useState(false);
    const [waivePrompt, setWaivePrompt] = useState(false);
    const [exGratia, setExGratia] = useState(0);
    const [ovrLine, setOvrLine] = useState(null);
    const [ovrAmt, setOvrAmt] = useState("");
    const [send, setSend] = useState(false);
    const [sent, setSent] = useState(false);
    const [previewSingle, setPreviewSingle] = useState(false);

    const readOnly = !exit.live;
    const lines = exit.live
      ? settlementLines(exit, { noticeWaived: waived, exGratia: exGratia })
      : (exit.lines || []);
    const net = sum(lines);
    const negative = net < 0;
    const requireChecker = TENANT_FF_CHECKER_REQUIRED && !previewSingle;

    const noticeLine = lines.filter((l) => l.key === "pyo.ff.l.notice")[0];
    const computedNotice = exit.live ? r2(exit.monthlyGross / DAY_DIVISOR * noticeShortfall(exit)) : 0;

    function detailFor(l) {
      if (l.key === "pyo.ff.l.encash" && l.detail) {
        return t("py17.encashDetail", { n: num(l.detail.days), rate: inr(l.detail.rate), v: exit.cfg.v });
      }
      if (l.key === "pyo.ff.l.notice") {
        if (l.waived) return t("py17.waived", { who: t(MAKER.nameKey), amt: inr(computedNotice) });
        if (l.detail && l.detail.days === 0) return t("pyo.ff.noticeFull");
        if (l.detail) return t("py17.noticeDetail", { c: num(exit.noticeContract), s: num(exit.noticeServed), n: num(l.detail.days), rate: inr(l.detail.rate) });
        return l.noteKey ? t(l.noteKey) : null;
      }
      if (l.key === "pyo.ff.l.loan" && l.linkLoan) return t("py17.loanDetail", { id: l.linkLoan });
      if (l.key === "pyo.ff.l.exgratia" && exGratia) {
        return t("py17.overrideDone", { c: inr(0), o: inr(exGratia), who: t(MAKER.nameKey) });
      }
      if (l.key === "pyo.ff.l.reimb") return t("py17.reimbNote");
      if (l.refusedKey) return t(l.refusedKey, { svc: t(exit.serviceKey), v: exit.cfg.v });
      return l.noteKey ? t(l.noteKey) : null;
    }

    return (
      <Card icon="signout" iconTone="accent"
        title={t("py17.title")}
        sub={t("py17.q") + " " + t("py17.for", { name: t(exit.personKey), id: exit.staff })}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px", maxWidth: 780 })}>
          {t("py17.meta", {
            group: t(exit.groupKey), campus: t(exit.campusKey),
            lwd: fmtDate(t, exit.lwdIso), svc: t(exit.serviceKey || "pyo.ff.svc.zainab"),
          })}
        </p>

        {/* which maker-checker mode is in force — stated, never silent */}
        <div style={{ marginBottom: 18 }}>
          <Panel tone={requireChecker ? "leave" : "late"} glyph={requireChecker ? "lock" : "alert"}
            head={requireChecker ? t("py17.mode.required") : t("py17.mode.single")}
            body={requireChecker
              ? t("py17.mode.requiredBody", { who: t("pyo.checker"), role: t("pyo.roleChecker"), id: CHECKER.id })
              : t("py17.mode.singleBody")}>
            <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0", maxWidth: 760 })}>{t("py17.mode.narrow")}</p>
          </Panel>
          <div style={{ marginTop: 12, display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Switch id="py17-mode" checked={previewSingle} onChange={setPreviewSingle} label={t("py17.mode.preview")} />
            <p style={ty("caption", { color: c.inkFaint, margin: 0, flex: 1, minWidth: 250, maxWidth: 560 })}>{t("py17.mode.previewNote")}</p>
          </div>
        </div>

        <MiniTable
          columns={[
            { key: "line", label: t("py17.l.col.line") },
            { key: "src", label: t("py17.l.col.source") },
            { key: "v", label: t("py17.l.col.v"), align: "right", mono: true, width: 150 },
            { key: "act", label: t("py17.l.col.act"), align: "right", width: 44 },
          ]}
          rows={lines.map((l) => ({
            id: l.key,
            highlight: ovrLine === l.key,
            cells: {
              line: (
                <span>
                  <span style={{ fontWeight: 600 }}>{t(l.key)}</span>
                  {detailFor(l) ? <span style={ty("caption", { color: c.inkFaint, display: "block", marginTop: 3, maxWidth: 520 })}>{detailFor(l)}</span> : null}
                </span>
              ),
              src: l.srcKey ? t(l.srcKey) : "—",
              v: <span style={{ color: l.v < 0 ? c.absentText : c.ink, fontWeight: 600 }}>{inr(l.v)}</span>,
              act: readOnly ? null : (
                <ActionMenu
                  ariaLabel={t("py09.menu.aria", { name: t(l.key) })}
                  items={[
                    { key: "ovr", icon: "document", label: t("py17.override"), disabled: !l.discretionary,
                      reason: l.discretionary ? null : t("py17.overrideOff"),
                      onSelect: () => { setOvrAmt(String(Math.abs(l.v))); setOvrLine(l.key); } },
                    { key: "waive", icon: "alert", label: t("py17.waive"),
                      disabled: l.key !== "pyo.ff.l.notice" || waived || noticeShortfall(exit) === 0,
                      reason: (l.key !== "pyo.ff.l.notice" || noticeShortfall(exit) === 0) ? t("py17.waiveOff") : (waived ? t("py17.waived", { who: t(MAKER.nameKey), amt: inr(computedNotice) }) : null),
                      onSelect: () => setWaivePrompt(true) },
                  ]}
                />
              ),
            },
          }))}
          total={{
            label: negative ? t("py17.netRecover") : t("py17.net"),
            cells: { line: negative ? t("py17.netRecover") : t("py17.net"), v: inr(net) },
          }}
        />

        {negative ? (
          <div style={{ marginTop: 18 }}>
            <Panel tone="absent" glyph="alert" head={t("py17.negative")}
              body={t("py17.negativeBody", { name: t(exit.personKey), amt: inr(Math.abs(net)) })} />
          </div>
        ) : null}

        {waivePrompt && !waived ? (
          <ReasonPrompt
            idBase="py17-waive"
            title={t("py17.waiveTitle")}
            body={t("py17.waiveBody", { amt: inr(computedNotice) })}
            options={["pyo.loan.p.medical", "pyo.arr.src.correction", "pyo.ff.l.exgratia"]}
            onConfirm={() => { setWaived(true); setWaivePrompt(false); }}
            onCancel={() => setWaivePrompt(false)}
          />
        ) : null}

        {ovrLine ? (
          <ReasonPrompt
            idBase="py17-ovr"
            title={t("py17.overrideTitle", { line: t(ovrLine) })}
            body={t("py17.overrideBody")}
            options={["pyo.ff.l.exgratia", "pyo.arr.src.correction", "pyo.loan.p.medical"]}
            amountField amountLabel={t("py17.overrideAmount")} amountValue={ovrAmt} onAmount={setOvrAmt}
            onConfirm={() => {
              if (ovrLine === "pyo.ff.l.exgratia") setExGratia(r2(parseFloat(ovrAmt) || 0));
              setOvrLine(null);
            }}
            onCancel={() => setOvrLine(null)}
          />
        ) : null}

        <div style={{ marginTop: 20 }}>
          <SignOff
            maker={exit.maker || MAKER} checker={exit.checker || CHECKER}
            madeIso={exit.submittedIso || TODAY_ISO} madeTime={exit.submittedTime}
            decidedIso={exit.state === "approved" || exit.state === "paid" ? exit.decidedIso : null}
          />
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {readOnly ? (
            <Panel tone="leave" glyph="lock" body={t("py17.readonly", { who: t((exit.maker || MAKER).nameKey), checker: t("pyo.checker") })} />
          ) : sent ? (
            <Panel tone="present" glyph="check" body={t("pyo.recorded", { when: t("pyo.justNow") })} />
          ) : send ? (
            <ConfirmPanel
              title={requireChecker ? t("py17.send") : t("py17.complete")}
              body={requireChecker
                ? t("py17.sendPrompt", { name: t(exit.personKey), amt: inr(net), who: t("pyo.checker"), role: t("pyo.roleChecker"), id: CHECKER.id })
                : t("py17.completePrompt")}
              onConfirm={() => { setSent(true); setSend(false); }}
              onCancel={() => setSend(false)}
            >
              <p style={ty("small", { color: c.ink, margin: 0, maxWidth: 760 })}>{t("py17.access", { name: t(exit.personKey) })}</p>
            </ConfirmPanel>
          ) : (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button kind="primary" iconLeft={requireChecker ? "arrow" : "check"} onClick={() => setSend(true)}>
                {requireChecker ? t("py17.send") : t("py17.complete")}
              </Button>
              <Button kind="secondary" iconLeft="scan" onClick={() => null}>{t("py17.compute")}</Button>
              <Button kind="secondary" iconLeft="download" onClick={() => null}>{t("py17.export")}</Button>
            </div>
          )}

          {requireChecker ? (
            <AbsentNote head={t("py17.completeAbsent")} body={t("py17.completeAbsentWhy")} icon="lock" />
          ) : null}
          <AbsentNote head={t("py17.approve.absent")} body={t("py17.approve.absentWhy", { who: t("pyo.checker"), role: t("pyo.roleChecker"), id: CHECKER.id })} icon="check" />
          <OffAction label={t("py17.payslip")} reason={t("py17.payslipOff")} iconLeft="payslip" />
        </div>

        <p style={ty("caption", { color: c.inkFaint, margin: "16px 0 0", maxWidth: 780 })}>
          {t("py17.computed", { when: stamp(t, exit.submittedIso || TODAY_ISO), v: exit.cfg ? exit.cfg.v : CFG_JUL.v })}
          {" "}{t("py17.exportNote")}
        </p>
      </Card>
    );
  }

  /* ============================================================
     22 . PY-18 — REPORTS AND REGISTERS.
     Payroll's own registers only. Every one names its period, its
     run, its pinned version and the line that reconciles it. August
     is provisional and says so, on the card and on every export.
     ============================================================ */
  function ReportsScreen() {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [period, setPeriod] = useState("8");
    const [ran, setRan] = useState(null);

    const p = PERIODS.filter((x) => String(x.m) === period)[0] || PERIODS[PERIODS.length - 1];
    const provisional = p.state !== "disbursed";

    function reconText(r) {
      return t(r.reconKey, { n: num(p.heads) });
    }
    function scopeText(r) { return t("py18.scope." + r.scope); }

    const costRows = PERIODS.map((x, i) => {
      const prev = i > 0 ? PERIODS[i - 1] : null;
      return { x: x, delta: prev ? r2(x.net - prev.net) : null };
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: L.gap }}>
        <Card fill={c.brassSoft} border={c.brassBorder}>
          <div style={{ display: "flex", gap: 30, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ minWidth: 320, flex: 1 }}>
              <div style={ty("caption", { color: c.brass, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" })}>{t("py18.title")}</div>
              <h2 style={ty("h1", { margin: "4px 0 0", color: c.ink })}>{t("py18.provisional")}</h2>
              <p style={ty("body", { color: c.ink, margin: "12px 0 0", maxWidth: 660 })}>{t("py18.q")}</p>
              <p style={ty("small", { color: c.inkMuted, margin: "8px 0 0", maxWidth: 660 })}>{t("py18.provisionalBody", { run: RUN_ID })}</p>
            </div>
            <div style={{ minWidth: 220 }}>
              <label htmlFor="py18-period" style={ty("caption", { display: "block", color: c.brass, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 })}>{t("py18.periodLabel")}</label>
              <Select id="py18-period" value={period} onChange={(v) => { setPeriod(v); setRan(null); }}
                options={PERIODS.map((x) => ({ value: String(x.m), label: t("pyo.period", { mon: t("pyo.mon." + x.m) }) }))} />
              <div style={{ marginTop: 10 }}>
                {provisional
                  ? <StatusMark role="late" glyph="clock" word={t("py18.prov")} />
                  : <StatusMark role="present" glyph="check" word={t("py18.final")} />}
              </div>
            </div>
          </div>
        </Card>

        <Register
          title={t("py18.title")}
          sub={t("py18.sub")}
          columns={[
            { key: "rep", label: t("py18.col.report") },
            { key: "scope", label: t("py18.col.scope"), width: 160 },
            { key: "src", label: t("py18.col.source"), mono: true, width: 150 },
            { key: "cfg", label: t("py18.col.cfg"), mono: true, width: 120 },
            { key: "state", label: t("py18.col.state"), width: 150 },
            { key: "act", label: t("py18.col.act"), align: "right", width: 190 },
          ]}
          rows={REPORTS.map((r) => ({
            id: r.key,
            highlight: ran === r.key,
            cells: {
              rep: (
                <span>
                  <span style={{ fontWeight: 600 }}>{t(r.key)}</span>
                  <span style={ty("caption", { color: c.inkFaint, display: "block", marginTop: 3, maxWidth: 480 })}>{reconText(r)}</span>
                </span>
              ),
              scope: scopeText(r),
              src: r.scope === "session"
                ? PERIODS[0].run + " … " + PERIODS[PERIODS.length - 1].run
                : p.run,
              cfg: r.scope === "session" ? CFG_APR.v + " … " + CFG_JUL.v : p.cfg.v,
              state: provisional
                ? <StatusMark role="late" glyph="clock" word={t("py18.prov")} />
                : <StatusMark role="present" glyph="check" word={t("py18.final")} />,
              act: (
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <Button kind="secondary" size="sm" onClick={() => setRan(r.key)}>{t("py18.run")}</Button>
                  <ActionMenu
                    ariaLabel={t("py09.menu.aria", { name: t(r.key) })}
                    items={[
                      { key: "dl", icon: "download", label: t("py18.download"), onSelect: () => setRan(r.key) },
                      { key: "sch", icon: "clock", label: t("py18.schedule"), disabled: true, reason: t("py18.scheduleWhy") },
                      { key: "sv", icon: "list", label: t("py18.saveView"), disabled: true, reason: t("py18.saveViewWhy") },
                    ]}
                  />
                </span>
              ),
            },
          }))}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", width: "100%" }}>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 620 })}>
                {ran
                  ? t("py18.ran", {
                      name: t(ran), period: t("pyo.period", { mon: t("pyo.mon." + p.m) }), run: p.run,
                      cfg: p.cfg.v, recon: reconText(REPORTS.filter((r) => r.key === ran)[0]),
                    })
                  : t("py18.sub")}
              </p>
              <p style={ty("caption", { color: c.inkFaint, margin: 0, maxWidth: 300 })}>{t("pyo.exported")}</p>
            </div>
          }
        />

        <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 460 }}>
            <Card icon="payroll" iconTone="info" title={t("py18.cost.title")}>
              <MiniTable
                columns={[
                  { key: "per", label: t("py18.cost.col.period"), width: 140 },
                  { key: "run", label: t("py18.cost.col.run"), mono: true, width: 140 },
                  { key: "heads", label: t("py18.cost.col.heads"), align: "right", mono: true, width: 100 },
                  { key: "net", label: t("py18.cost.col.net"), align: "right", mono: true, width: 160 },
                  { key: "chg", label: t("py18.cost.col.change"), align: "right", mono: true, width: 150 },
                  { key: "cfg", label: t("py18.cost.col.cfg"), mono: true, width: 110 },
                ]}
                rows={costRows.map((r) => ({
                  id: r.x.run,
                  highlight: r.x.current,
                  cells: {
                    per: t("pyo.period", { mon: t("pyo.mon." + r.x.m) }),
                    run: r.x.run,
                    heads: num(r.x.heads),
                    net: inr(r.x.net),
                    chg: r.delta == null ? "—" : <span style={{ color: r.delta < 0 ? c.absentText : c.presentText, fontWeight: 600 }}>{(r.delta > 0 ? "+" : "") + inr(r.delta)}</span>,
                    cfg: r.x.cfg.v,
                  },
                }))}
                note={t("py18.cost.note", { a: CFG_APR.v, b: CFG_JUL.v })}
              />
            </Card>
          </div>
          <div style={{ flex: 1, minWidth: 340 }}>
            <Card icon="globe" iconTone="accent" title={t("py18.campus.title", { mon: t("pyo.mon." + PERIOD_MON) })}>
              <MiniTable
                columns={[
                  { key: "camp", label: t("py18.campus.col.campus") },
                  { key: "heads", label: t("py18.campus.col.heads"), align: "right", mono: true, width: 90 },
                  { key: "net", label: t("py18.campus.col.net"), align: "right", mono: true, width: 150 },
                ]}
                rows={CAMPUS_SPLIT.map((r) => ({ id: r.key, cells: { camp: t(r.key), heads: num(r.heads), net: inr(r.v) } }))}
                total={{ label: t("py18.campus.total"), cells: { camp: t("py18.campus.total"), heads: num(CAMPUS_HEADS), net: inr(CAMPUS_TOTAL) } }}
                note={t("py18.recon.campus")}
              />
            </Card>
          </div>
        </div>

        <Card icon="filing" iconTone="off" title={t("py18.scopeOfThis")}>
          <AbsentNote head={t("py18.filings.absent")} body={t("py18.filings.absentWhy")} icon="filing" />
        </Card>
      </div>
    );
  }

  /* ============================================================
     23 . THE PAGE. Six tabs, and exactly ONE TabPanel mounted at a
     time per tablist — the kit sets aria-controls only on the
     selected tab, so a second mounted panel would be a landmark with
     nothing pointing at it. The Variance & register tab and the
     Claims & arrears tab each open a SECOND, independent tablist
     inside their own panel; per-tablist that invariant still holds,
     and the page then legitimately shows two panels rather than one.
     ============================================================ */
  function PYOps({ role, onNavigate }) {
    const { t } = useLang();
    const [tab, setTab] = useState("var");
    const [inner, setInner] = useState("variance");
    const [adj, setAdj] = useState("claims");

    const items = [
      { key: "var", label: t("pyo.tab.var") },
      { key: "pay", label: t("pyo.tab.pay") },
      { key: "loans", label: t("pyo.tab.loans") },
      { key: "adj", label: t("pyo.tab.adj") },
      { key: "exits", label: t("pyo.tab.exits") },
      { key: "reports", label: t("pyo.tab.reports") },
    ];

    return (
      <Shell role={role} onNavigate={onNavigate} active="pyOps">
        <Tabs items={items} active={tab} onChange={setTab} ariaLabel={t("pyo.tabs.aria")} idBase="pyops" />
        <div style={{ marginTop: G3.layout.gap }}>
          {tab === "var" ? (
            <TabPanel idBase="pyops" tabKey="var">
              <Tabs
                items={[{ key: "variance", label: t("py09.title") }, { key: "register", label: t("py10.title") }]}
                active={inner} onChange={setInner} ariaLabel={t("pyo.tab.var")} idBase="pyops-var"
              />
              <div style={{ marginTop: G3.layout.gap }}>
                {inner === "variance"
                  ? <TabPanel idBase="pyops-var" tabKey="variance"><VarianceScreen /></TabPanel>
                  : <TabPanel idBase="pyops-var" tabKey="register"><RegisterScreen /></TabPanel>}
              </div>
            </TabPanel>
          ) : null}
          {tab === "pay" ? <TabPanel idBase="pyops" tabKey="pay"><PayPublishScreen /></TabPanel> : null}
          {tab === "loans" ? <TabPanel idBase="pyops" tabKey="loans"><LoansScreen /></TabPanel> : null}
          {tab === "adj" ? (
            <TabPanel idBase="pyops" tabKey="adj">
              <Tabs
                items={[{ key: "claims", label: t("py14.title") }, { key: "arrears", label: t("py15.title") }]}
                active={adj} onChange={setAdj} ariaLabel={t("pyo.tab.adj")} idBase="pyops-adj"
              />
              <div style={{ marginTop: G3.layout.gap }}>
                {adj === "claims"
                  ? <TabPanel idBase="pyops-adj" tabKey="claims"><ClaimsScreen /></TabPanel>
                  : <TabPanel idBase="pyops-adj" tabKey="arrears"><ArrearsScreen /></TabPanel>}
              </div>
            </TabPanel>
          ) : null}
          {tab === "exits" ? <TabPanel idBase="pyops" tabKey="exits"><ExitsScreen /></TabPanel> : null}
          {tab === "reports" ? <TabPanel idBase="pyops" tabKey="reports"><ReportsScreen /></TabPanel> : null}
        </div>
      </Shell>
    );
  }

  /* ============================================================
     24 . SELF-CHECKS. Cross-screen arithmetic is asserted, not
     promised: if any of these ever went false the page would still
     render, so the value is in reading them here beside the data they
     police. Every one is derived from the constants above.
     ============================================================ */
  const CHECKS = {
    runGross: Math.abs(RUN_GROSS - 31021350.0) < 0.005,
    runNet: Math.abs(RUN_NET - 25602850.0) < 0.005,
    netPayable: Math.abs(NET_PAYABLE - 25493750.0) < 0.005,
    heads: RUN_HEADS === 412,
    /* the loan register IS the run's loan deduction line */
    loanLine: Math.abs(LOAN_RUN_TOTAL - LOAN_LINE) < 0.005,
    /* AR-2026-08 IS the run's arrears earnings line */
    arrearLine: Math.abs(arrGross(ARREARS[2]) - ARREAR_LINE) < 0.005,
    /* the batch pages/accountant.jsx holds at its gate */
    batch: Math.abs(sum(CLAIMS) - 268450.0) < 0.005 && CLAIMS.length === 31,
    /* FF-2026-014's net, the settlement in that same gate */
    ff014: Math.abs(sum(EXITS[1].lines) - 417860.0) < 0.005,
    /* the bank file plus the supplementary file is July's whole net */
    bankFile: Math.abs(BANK_TOTAL + JULY_EXCLUDED_TOTAL - PREV_PAYABLE) < 0.005,
    /* the campus split is the run's net payable */
    campus: Math.abs(CAMPUS_TOTAL - NET_PAYABLE) < 0.005 && CAMPUS_HEADS === RUN_HEADS,
    /* an unpaid day costs the same rupees here as on every other screen */
    dayRate: Math.abs(UNPAID_DAY_REF - 3160.0) < 0.005,
    /* every variance row's two payslips add up to the two nets printed */
    variance: VAR_ROWS.every((r) =>
      (r.prev == null || Math.abs(r.prev.gross - r.prev.dedTotal - r.prev.net) < 0.005)
      && Math.abs(r.cur.gross - r.cur.dedTotal - r.cur.net) < 0.005),
    /* the payroll home board's F&F count is this file's not-started rows */
    ffCount: EXITS_NOT_STARTED.length === 2,
  };
  const ALL_CHECKS_PASS = Object.keys(CHECKS).every((k) => CHECKS[k]);

  /* ============================================================
     PROMOTION CANDIDATES for design/v3/kit.jsx (not added here —
     kit.jsx is outside this file's scope):
     . MiniTable      — a table INSIDE a card the caller already
                        opened. Every page in v3 has now written one;
                        this is the fourth independent copy.
     . EqRow / Ledger — the signed arithmetic column. Fifth copy
                        (payslips, payroll, accountant, hr-record).
     . ReasonPrompt   — reason code + note + a confirm that is never
                        hard-disabled. Sixth copy.
     . ConfirmPanel   — the restating confirm that names the person it
                        goes to. Pairs with ReasonPrompt; every
                        maker-checker screen needs both.
     . OffAction      — a control that is off with the reason in words
                        and a live announcement on click.
     . AbsentNote     — the other half: a control that is NOT drawn,
                        and why. The absent-vs-disabled rule needs a
                        component or it will keep being re-argued.
     . Panel          — a toned statement block, glyph plus word.
     . SignOff        — the two-person maker/checker block. Fourth
                        independent copy (payroll, accountant,
                        hr-record, here).
     . Fact           — a labelled read-out; the alternative to KPI
                        tiles.
     . RowCheck       — a register row's selection box for a bulk bar.
                        depthead.jsx has the other copy.
     ============================================================ */

  window.Pages3 = window.Pages3 || {};
  /* The shell-less screens, published so the role's OTHER modules can
     compose them instead of growing a second copy. Each one draws
     itself and nothing around itself: no rail, no crumb, no title, so
     whichever module owns it supplies its own frame. The data they
     close over stays private to this file, which is what keeps the
     arithmetic in CHECKS true wherever a screen is mounted. */
  /* The adjustments data layer, published so pages/py-adjust.jsx can
     rebuild those three surfaces without a second copy of the
     numbers. The CHECKS at the foot of this file still police them,
     so a figure cannot drift by being shown somewhere new. */
  /* The exits data layer, published for pages/py-exits.jsx. */
  /* THE SEED PLUS WHAT HR HAS RECORDED SINCE. The seed is the school's
     settlement history and the self-checks at the foot of this file
     police it, so it is never mutated — an HR-recorded exit is appended
     and arrives as NOT STARTED, which is the truth: payroll has been
     told it is coming and nobody has prepared it. */
  function allExits() {
    const X = window.NaveyaExits;
    return X ? EXITS.concat(X.rows()) : EXITS.slice();
  }
  function allNotStarted() {
    return allExits().filter(function (e) { return e.state === "notStarted"; });
  }

  window.Pages3.PYExitData = {
    EXITS: EXITS, EXITS_NOT_STARTED: EXITS_NOT_STARTED,
    allExits: allExits, allNotStarted: allNotStarted,
    settlementLines: settlementLines, noticeShortfall: noticeShortfall,
    TENANT_FF_CHECKER_REQUIRED: TENANT_FF_CHECKER_REQUIRED,
    NOTICE_DIVISOR: NOTICE_DIVISOR, ENCASH_DIVISOR: ENCASH_DIVISOR, GRATUITY_DIVISOR: GRATUITY_DIVISOR,
    TODAY_ISO: TODAY_ISO, daysBetween: daysBetween, fmtDate: fmtDate,
    LOANS: LOANS, loanOutstanding: loanOutstanding,
    MAKER: MAKER, CHECKER: CHECKER, HR_OFFICER: HR_OFFICER,
    CFG_JUL: CFG_JUL, RUN_ID: RUN_ID, r2: r2, sum: sum,
  };
  /* the run's own facts, for pages/py-run.jsx. The totals live here
     because GROUPS lives here, and a second copy of a run total is a
     second opinion about what a school is paying this month. */
  window.Pages3.PYRunData = {
    GROUPS: GROUPS, RUN_GROSS: RUN_GROSS, RUN_DED: RUN_DED, RUN_NET: RUN_NET,
    RUN_EMPLOYER: RUN_EMPLOYER, RUN_HEADS: RUN_HEADS,
    NET_PAYABLE: NET_PAYABLE, PAYEES: PAYEES, HELD_TOTAL: HELD_TOTAL,
    LOAN_LINE: LOAN_LINE, ARREAR_LINE: ARREAR_LINE,
    groupGross: groupGross, groupDed: groupDed, groupEmp: groupEmp,
    VAR_ROWS: VAR_ROWS, PERIODS: PERIODS, PREV_PAYABLE: PREV_PAYABLE,
    /* the gate and the arithmetic behind it: the registers module
       reads the same movement, and a second copy of a threshold is
       a second answer to "did this cross it" */
    PAY_POLICY: PAY_POLICY, VAR_UNMOVED: VAR_UNMOVED,
    varDelta: varDelta, varPct: varPct, crossedBy: crossedBy,
    MONTH_DAYS: MONTH_DAYS, MONTH_KEY: "pyo.mon.8",
    MAKER: MAKER, CHECKER: CHECKER, HR_OFFICER: HR_OFFICER,
    CFG_JUL: CFG_JUL, RUN_ID: RUN_ID, PREV_RUN_ID: PREV_RUN_ID,
    TODAY_ISO: TODAY_ISO, fmtDate: fmtDate, daysBetween: daysBetween,
    r2: r2, sum: sum,
  };
  /* ------------------------------------------------------------
     THE TWO THINGS AN OFFICER MAY DO TO ONE INSTALMENT.

     They are written here, with the register, rather than on the
     screen that offers them -- a decision about money belongs to the
     record it changes. Both are append-only in spirit: the loan
     remembers that it happened, and when, and why.
     ------------------------------------------------------------ */
  const adjListeners = [];
  function adjEmit() {
    adjListeners.forEach(function (fn) { fn(); });
    /* the roll prices people off this register, so it has to be
       rebuilt or the run would quote yesterday's instalment */
    if (window.NaveyaRoll && window.NaveyaRoll.reset) window.NaveyaRoll.reset();
  }
  function loanById(id) {
    return LOANS.filter(function (l) { return l.id === id; })[0] || null;
  }
  function deferInstalment(id, payload) {
    const l = loanById(id);
    if (!l || l.state !== "active") return false;
    l.skipped = (l.skipped || 0) + 1;
    l.skipIso = (payload && payload.on) || TODAY_ISO;
    l.skipNote = (payload && payload.note) || "";
    adjEmit();
    return true;
  }
  function waiveInstalment(id, payload) {
    const l = loanById(id);
    if (!l || l.state !== "active") return false;
    if (l.tenure - l.paid - (l.waived || 0) <= 0) return false;
    l.waived = (l.waived || 0) + 1;
    l.waiver = r2((l.waiver || 0) + loanEmi(l));
    l.waiveIso = (payload && payload.on) || TODAY_ISO;
    l.waiveNote = (payload && payload.note) || "";
    adjEmit();
    return true;
  }

  window.Pages3.PYAdjData = {
    LOANS: LOANS, LOANS_ACTIVE: LOANS_ACTIVE, LOAN_OPEN: LOAN_OPEN,
    loanById: loanById, deferInstalment: deferInstalment, waiveInstalment: waiveInstalment,
    subscribe: function (fn) {
      adjListeners.push(fn);
      return function () {
        const i = adjListeners.indexOf(fn);
        if (i >= 0) adjListeners.splice(i, 1);
      };
    },
    loanEmi: loanEmi, loanOutstanding: loanOutstanding, loanRepayable: loanRepayable,
    LOAN_RUN_TOTAL: LOAN_RUN_TOTAL, LOAN_OUTSTANDING_TOTAL: LOAN_OUTSTANDING_TOTAL,
    LOAN_PRINCIPAL_TOTAL: LOAN_PRINCIPAL_TOTAL, LOAN_CANDIDATES: LOAN_CANDIDATES,
    CLAIMS: CLAIMS, CLAIM_CATS: CLAIM_CATS, CLAIM_ORDER: CLAIM_ORDER,
    BATCH: BATCH, BATCH_PREV: BATCH_PREV,
    ARREARS: ARREARS, arrGross: arrGross, arrNet: arrNet, monDelta: monDelta, monNet: monNet,
    MAKER: MAKER, CHECKER: CHECKER, HR_OFFICER: HR_OFFICER,
    CFG_JUL: CFG_JUL, RUN_ID: RUN_ID, r2: r2, sum: sum,
  };
  window.Pages3.PYParts = {
    Variance: VarianceScreen, Register: RegisterScreen, PayPublish: PayPublishScreen,
    Loans: LoansScreen, Claims: ClaimsScreen, Arrears: ArrearsScreen,
    Exits: ExitsScreen, Reports: ReportsScreen,
  };
  window.Pages3.PYOps = PYOps;
  window.Pages3.PYOpsChecks = CHECKS;
  window.Pages3.PYOpsChecksPass = ALL_CHECKS_PASS;
})();
