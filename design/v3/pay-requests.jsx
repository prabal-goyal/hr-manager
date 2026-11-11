/* @jsxRuntime classic */
/* ============================================================
   Naveya — pay requests · window.NaveyaPayRequests

   THE FOURTH CHANNEL. pay-handoff.jsx holds the three ways HR and
   payroll already talk about a person's standing pay: a new joiner
   awaiting a figure, an appraisal percentage awaiting a breakdown,
   and a change request against a salary HR may read but not edit.
   This file holds the fourth, which is everything a person ASKS FOR
   on top of their salary -- a reimbursement, a loan or advance, the
   hours they worked beyond their roster -- plus the rise, which is
   the same conversation seen from the other end.

   It is a separate file only because of volume. It is the same
   conversation, and it obeys the same split that file states:

     HR VERIFIES THE FACT.  PAYROLL SETS THE FIGURE.

   Concretely, and this is the whole of the module's logic:
     . a CLAIM       -- the employee states an amount and attaches a
                        bill. HR checks the bill and the policy; HR
                        cannot change the amount, because the amount
                        is the employee's statement. Payroll decides
                        the tax treatment and which batch pays it.
     . a LOAN        -- HR records the request and recommends. HR
                        cannot set a principal, a rate, an EMI or a
                        schedule; payroll sanctions and recovers.
     . OVERTIME      -- nobody types an hour. The hours are DERIVED
                        from the attendance ledger: punches against
                        the roster. HR verifies them against what was
                        actually asked of that person and may reduce
                        them with a reason. Payroll prices them --
                        the Code on Wages 2019 s.14 puts overtime at
                        not less than TWICE the normal rate of wages,
                        which is a statutory multiple read from the
                        pinned config, never a figure on this screen.
     . a RISE        -- HR records the percentage an appraisal agreed
                        on. Payroll turns the percentage into
                        components. This one already lives in
                        pay-handoff.jsx's PROPOSALS channel, so it is
                        ADAPTED here rather than copied: two copies
                        of a state is the one bug that file exists to
                        prevent.

   ONE CHAIN, FOUR SUBJECTS. Every request, whatever its kind, walks
   the same four stops -- RAISED, HR, PAYROLL, PAID -- so an operator
   learns the status vocabulary once and reads it everywhere. Two
   exits leave the chain: RETURNED (HR wants more from the employee,
   so it goes back a stop) and DECLINED (it stops, at the desk that
   stopped it, with a reason and a name).

   WHO IS NOT ELIGIBLE IS STATED, NOT HIDDEN. Teaching staff are not
   on hourly wages, so they earn no overtime. A teacher's detected
   hours still appear, declined with that reason written out, because
   a row that silently never existed is how a school ends up arguing
   about it in a corridor.

   SPEC — docs/development-specification.md M4 (requests), M10
   (reimbursements, loans), M9 (attendance → overtime), M11
   (appraisal). Screens: HR-40 register, HR-41 record.
   ============================================================ */
(function () {
  const UI = window.UI3;
  const { addStrings } = UI;
  const r2 = function (n) { return Math.round(n * 100) / 100; };

  const TODAY_ISO = "2026-10-08";
  const RUN_OPEN = "PR-2026-10";
  const RUN_LAST = "PR-2026-09";

  /* the four stops, in order. A request's `state` maps onto one. */
  const STOPS = ["raised", "hr", "payroll", "paid"];
  const STATE_STOP = {
    withHR: 1, withPayroll: 2, approved: 2, paid: 3,
    returned: 0, declined: null,
  };

  const HR_WHO = "pq.who.meera";
  const PY_WHO = "pq.who.sunita";

  /* ------------------------------------------------------------
     1 . CLAIMS. Reimbursements the employee submitted with a bill.
     The categories and their tax treatment are M10's, and they are
     the same five payroll's own register already knows -- the keys
     are shared on purpose, so HR's queue and payroll's batch are
     visibly about the same object.
     ------------------------------------------------------------ */
  const CLAIMS = [
    {
      id: "CL-0233", kind: "claim", personKey: "pyo.n.nandita", staff: "NAV-0252",
      groupKey: "pyo.pg.teach", campusKey: "pyo.camp.indira",
      raisedIso: "2026-10-05", raisedBy: "employee", state: "withHR",
      cat: "books", amount: 12000.0, capV: 15000.0,
      billIso: "2026-09-21", billNo: null, hasBill: false,
      flagKey: "pq.cl.flag.noBill",
    },
    {
      id: "CL-0232", kind: "claim", personKey: "pyo.n.girish", staff: "NAV-0291",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.white",
      raisedIso: "2026-10-03", raisedBy: "employee", state: "withHR",
      cat: "tel", amount: 1850.0, capV: 2000.0,
      billIso: "2026-09-30", billNo: "AIR/9921887", hasBill: true,
    },
    {
      id: "CL-0231", kind: "claim", personKey: "pyo.n.ananya", staff: "NAV-0142",
      groupKey: "pyo.pg.teach", campusKey: "pyo.camp.indira",
      raisedIso: "2026-10-01", raisedBy: "employee", state: "withHR",
      cat: "med", amount: 8400.0, capV: 15000.0,
      billIso: "2026-09-28", billNo: "MH/2026/4471", hasBill: true,
    },
    {
      id: "CL-0228", kind: "claim", personKey: "pyo.n.joseph", staff: "NAV-0301",
      groupKey: "pyo.pg.teach", campusKey: "pyo.camp.white",
      raisedIso: "2026-09-27", raisedBy: "employee", state: "withPayroll",
      cat: "lta", amount: 46200.0, capV: 40000.0,
      billIso: "2026-09-14", billNo: "IRCTC/8830412", hasBill: true,
      flagKey: "pq.cl.flag.overCap",
      hr: { byKey: HR_WHO, on: "2026-10-02", noteKey: "pq.cl.hrnote.overCap" },
    },
    {
      id: "CL-0225", kind: "claim", personKey: "pyo.n.rukmini", staff: "NAV-0195",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.indira",
      raisedIso: "2026-09-22", raisedBy: "employee", state: "approved",
      cat: "med", amount: 6900.0, capV: 15000.0,
      billIso: "2026-09-18", billNo: "APL/55120", hasBill: true,
      hr: { byKey: HR_WHO, on: "2026-09-24" },
      payroll: { byKey: PY_WHO, on: "2026-10-06", batch: RUN_OPEN },
    },
    {
      id: "CL-0219", kind: "claim", personKey: "pyo.n.peter", staff: "NAV-0239",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.hyd",
      raisedIso: "2026-09-02", raisedBy: "employee", state: "paid",
      cat: "fuel", amount: 5200.0, capV: 6000.0,
      billIso: "2026-08-30", billNo: "HP/70231", hasBill: true,
      hr: { byKey: HR_WHO, on: "2026-09-04" },
      payroll: { byKey: PY_WHO, on: "2026-09-10", batch: RUN_LAST },
      paidIso: "2026-09-30", paidWith: RUN_LAST,
    },
    {
      id: "CL-0214", kind: "claim", personKey: "pyo.n.devika", staff: "NAV-0349",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.white",
      raisedIso: "2026-09-19", raisedBy: "employee", state: "returned",
      cat: "med", amount: 3100.0, capV: 15000.0,
      billIso: "2026-09-11", billNo: "—", hasBill: true,
      returned: { byKey: HR_WHO, on: "2026-09-21", reasonKey: "pq.ret.r.illegible", note: "" },
    },
    {
      id: "CL-0210", kind: "claim", personKey: "pyo.n.salim", staff: "NAV-0281",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.indira",
      raisedIso: "2026-09-12", raisedBy: "employee", state: "declined",
      cat: "tel", amount: 2400.0, capV: 2000.0,
      billIso: "2026-09-01", billNo: "VI/41209", hasBill: true,
      declined: { at: "hr", byKey: HR_WHO, on: "2026-09-15", reasonKey: "pq.dec.r.notCovered", note: "" },
    },
  ];

  /* ------------------------------------------------------------
     2 . LOANS AND ADVANCES. The request, not the loan. A sanctioned
     one leaves this register and becomes an `LN-`/`AD-` in payroll's
     loan book -- `becomes` carries that identifier so the two can be
     read as one history rather than two lists.
     ------------------------------------------------------------ */
  const LOANS = [
    {
      id: "LR-0047", kind: "loan", personKey: "pyo.n.vandana", staff: "NAV-0217",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.white",
      raisedIso: "2026-10-06", raisedBy: "employee", state: "withHR",
      loanKind: "loan", purposeKey: "pyo.loan.p.medical",
      amountAsked: 150000.0, tenureAsked: 18,
      serviceYears: 6, monthlyGross: 61000.0,
      runningId: "LN-2026-002", runningOut: 148400.0,
      flagKey: "pq.ln.flag.running",
    },
    {
      id: "LR-0048", kind: "loan", personKey: "pyo.n.ananya", staff: "NAV-0142",
      groupKey: "pyo.pg.teach", campusKey: "pyo.camp.indira",
      raisedIso: "2026-10-08", raisedBy: "employee", state: "withHR",
      loanKind: "loan", purposeKey: "pyo.loan.p.education",
      amountAsked: 100000.0, tenureAsked: 12,
      serviceYears: 7, monthlyGross: 94800.0,
    },
    {
      id: "LR-0046", kind: "loan", personKey: "pyo.n.lakshmi", staff: "NAV-0322",
      groupKey: "pyo.pg.teach", campusKey: "pyo.camp.indira",
      raisedIso: "2026-10-04", raisedBy: "employee", state: "withHR",
      loanKind: "advance", purposeKey: "pyo.loan.p.festival",
      amountAsked: 40000.0, tenureAsked: 4,
      serviceYears: 9, monthlyGross: 74000.0,
    },
    {
      id: "LR-0045", kind: "loan", personKey: "pyo.n.mahesh", staff: "NAV-0209",
      groupKey: "pyo.pg.teach", campusKey: "pyo.camp.indira",
      raisedIso: "2026-09-29", raisedBy: "employee", state: "returned",
      loanKind: "advance", purposeKey: null,
      amountAsked: 25000.0, tenureAsked: 3,
      serviceYears: 4, monthlyGross: 68000.0,
      returned: { byKey: HR_WHO, on: "2026-10-01", reasonKey: "pq.ret.r.noPurpose", note: "" },
    },
    {
      id: "LR-0044", kind: "loan", personKey: "pyo.n.imran", staff: "NAV-0206",
      groupKey: "pyo.pg.visit", campusKey: "pyo.camp.indira",
      raisedIso: "2026-08-09", raisedBy: "hr", state: "withPayroll",
      loanKind: "loan", purposeKey: "pyo.loan.p.home",
      amountAsked: 200000.0, tenureAsked: 24,
      serviceYears: 11, monthlyGross: 82000.0,
      hr: { byKey: HR_WHO, on: "2026-08-11", recommendTenure: 24 },
      becomes: "LN-2026-041",
    },
    {
      id: "LR-0041", kind: "loan", personKey: "pyo.n.shalini", staff: "NAV-0308",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.indira",
      raisedIso: "2026-05-18", raisedBy: "employee", state: "paid",
      loanKind: "advance", purposeKey: "pyo.loan.p.festival",
      amountAsked: 72000.0, tenureAsked: 4,
      serviceYears: 7, monthlyGross: 59000.0,
      hr: { byKey: HR_WHO, on: "2026-05-20", recommendTenure: 4 },
      payroll: { byKey: PY_WHO, on: "2026-05-26", principal: 72000.0, tenure: 4, rate: 0, emi: 18000.0 },
      paidIso: "2026-06-01", paidWith: "PR-2026-06", becomes: "AD-2026-118",
    },
    {
      id: "LR-0038", kind: "loan", personKey: "pyo.n.ashok", staff: "NAV-0374",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.hyd",
      raisedIso: "2026-09-08", raisedBy: "employee", state: "declined",
      loanKind: "loan", purposeKey: "pyo.loan.p.education",
      amountAsked: 120000.0, tenureAsked: 12,
      serviceYears: 12, monthlyGross: 66000.0,
      runningId: "LN-2025-021", runningOut: 143500.0,
      hr: { byKey: HR_WHO, on: "2026-09-10", recommendTenure: 12 },
      declined: { at: "payroll", byKey: PY_WHO, on: "2026-09-16", reasonKey: "pq.dec.r.exposure", note: "" },
    },
  ];

  /* ------------------------------------------------------------
     3 . OVERTIME. Derived, never typed. `days` is the evidence --
     each day's punches against that day's roster -- and `detected`
     is their sum, so the figure on the row can always be opened and
     read back to the person it is about. `verified` is HR's, and it
     starts equal to detected: HR confirms or reduces, and a
     reduction carries a reason.
     ------------------------------------------------------------ */
  const OT = [
    {
      id: "OT-0923", kind: "ot", personKey: "pyo.n.lata", staff: "NAV-0177",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.white",
      raisedIso: "2026-10-01", raisedBy: "employee", state: "withHR",
      periodKey: "pq.ot.p.sep", rosterHrs: 192, eligible: true, source: "device",
      basicDa: 38000.0,
      detected: 22.0, verified: null,
      days: [
        { iso: "2026-09-03", inT: "08:05", outT: "19:40", roster: 8, over: 3.5 },
        { iso: "2026-09-09", inT: "08:00", outT: "20:10", roster: 8, over: 4.0 },
        { iso: "2026-09-16", inT: "08:10", outT: "18:55", roster: 8, over: 2.5 },
        { iso: "2026-09-19", inT: "07:55", outT: "20:30", roster: 8, over: 4.5 },
        { iso: "2026-09-24", inT: "08:00", outT: "19:20", roster: 8, over: 3.5 },
        { iso: "2026-09-27", inT: "08:05", outT: "20:00", roster: 8, over: 4.0 },
      ],
      flagKey: "pq.ot.flag.high",
    },
    {
      id: "OT-0922", kind: "ot", personKey: "pyo.n.farida", staff: "NAV-0388",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.indira",
      raisedIso: "2026-10-01", raisedBy: "employee", state: "withHR",
      periodKey: "pq.ot.p.sep", rosterHrs: 192, eligible: true, source: "device",
      basicDa: 36000.0,
      detected: 9.0, verified: null,
      days: [
        { iso: "2026-09-05", inT: "08:00", outT: "19:00", roster: 8, over: 3.0 },
        { iso: "2026-09-12", inT: "08:00", outT: "18:30", roster: 8, over: 2.5 },
        { iso: "2026-09-26", inT: "08:00", outT: "19:30", roster: 8, over: 3.5 },
      ],
    },
    {
      id: "OT-0921", kind: "ot", personKey: "pyo.n.kavita", staff: "NAV-0007",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.indira",
      raisedIso: "2026-10-01", raisedBy: "employee", state: "withHR",
      periodKey: "pq.ot.p.sep", rosterHrs: 192, eligible: true, source: "device",
      basicDa: 40000.0,
      detected: 14.5, verified: null,
      days: [
        { iso: "2026-09-02", inT: "08:00", outT: "18:45", roster: 8, over: 2.5 },
        { iso: "2026-09-08", inT: "07:50", outT: "19:20", roster: 8, over: 3.5 },
        { iso: "2026-09-15", inT: "08:00", outT: "18:30", roster: 8, over: 2.5 },
        { iso: "2026-09-22", inT: "08:00", outT: "19:00", roster: 8, over: 3.0 },
        { iso: "2026-09-29", inT: "08:05", outT: "18:50", roster: 8, over: 3.0 },
      ],
    },
    {
      id: "OT-0924", kind: "ot", personKey: "pyo.n.mahesh", staff: "NAV-0209",
      groupKey: "pyo.pg.teach", campusKey: "pyo.camp.indira",
      raisedIso: "2026-10-01", raisedBy: "employee", state: "declined",
      periodKey: "pq.ot.p.sep", rosterHrs: 184, eligible: false, source: "device",
      basicDa: 52000.0,
      detected: 10.0, verified: null,
      days: [
        { iso: "2026-09-04", inT: "08:00", outT: "19:00", roster: 8, over: 3.0 },
        { iso: "2026-09-11", inT: "08:00", outT: "19:30", roster: 8, over: 3.5 },
        { iso: "2026-09-18", inT: "08:00", outT: "19:30", roster: 8, over: 3.5 },
      ],
      declined: { at: "hr", byKey: HR_WHO, on: "2026-10-02", reasonKey: "pq.dec.r.notHourly", note: "" },
    },
    {
      id: "OT-0918", kind: "ot", personKey: "pyo.n.shalini", staff: "NAV-0308",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.indira",
      raisedIso: "2026-09-01", raisedBy: "employee", state: "withPayroll",
      periodKey: "pq.ot.p.aug", rosterHrs: 184, eligible: true, source: "device",
      basicDa: 44000.0,
      detected: 13.0, verified: 11.0,
      days: [
        { iso: "2026-08-06", inT: "08:00", outT: "19:00", roster: 8, over: 3.0 },
        { iso: "2026-08-13", inT: "08:00", outT: "20:00", roster: 8, over: 4.0 },
        { iso: "2026-08-20", inT: "08:00", outT: "19:00", roster: 8, over: 3.0 },
        { iso: "2026-08-27", inT: "08:00", outT: "19:00", roster: 8, over: 3.0 },
      ],
      hr: { byKey: HR_WHO, on: "2026-09-03", cutFrom: 13.0, reasonKey: "pq.ot.cut.notAsked" },
    },
    {
      id: "OT-0915", kind: "ot", personKey: "pyo.n.harpreet", staff: "NAV-0258",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.hyd",
      raisedIso: "2026-09-01", raisedBy: "employee", state: "approved",
      periodKey: "pq.ot.p.aug", rosterHrs: 184, eligible: true, source: "device",
      basicDa: 48000.0,
      detected: 8.0, verified: 8.0,
      days: [
        { iso: "2026-08-07", inT: "08:00", outT: "20:00", roster: 8, over: 4.0 },
        { iso: "2026-08-21", inT: "08:00", outT: "20:00", roster: 8, over: 4.0 },
      ],
      hr: { byKey: HR_WHO, on: "2026-09-02" },
      payroll: { byKey: PY_WHO, on: "2026-09-29", hourly: 230.77, multiple: 2, value: 3692.32, batch: RUN_OPEN },
    },
    {
      id: "OT-0908", kind: "ot", personKey: "pyo.n.devika", staff: "NAV-0349",
      groupKey: "pyo.pg.admin", campusKey: "pyo.camp.white",
      raisedIso: "2026-08-01", raisedBy: "employee", state: "paid",
      periodKey: "pq.ot.p.jul", rosterHrs: 184, eligible: true, source: "manual",
      basicDa: 42000.0,
      detected: 6.0, verified: 6.0,
      days: [
        { iso: "2026-07-10", inT: "08:00", outT: "19:00", roster: 8, over: 3.0 },
        { iso: "2026-07-24", inT: "08:00", outT: "19:00", roster: 8, over: 3.0 },
      ],
      hr: { byKey: HR_WHO, on: "2026-08-03" },
      payroll: { byKey: PY_WHO, on: "2026-08-28", hourly: 201.92, multiple: 2, value: 2423.04, batch: "PR-2026-08" },
      paidIso: "2026-08-31", paidWith: "PR-2026-08",
    },
  ];

  const ALL = CLAIMS.concat(LOANS).concat(OT);

  const listeners = [];
  function emit() { listeners.forEach(function (fn) { fn(); }); }
  let seq = 240;

  function daysBetween(aIso, bIso) {
    const a = new Date(aIso + "T00:00:00");
    const b = new Date(bIso + "T00:00:00");
    return Math.round((b - a) / 86400000);
  }

  /* ------------------------------------------------------------
     RISES. Adapted from pay-handoff's PROPOSALS, never copied. A
     rise enters at the payroll stop because recording the
     percentage IS HR's approval of it -- there is no draft a rise
     could sit in, and inventing one would be a lie on the strip.
     ------------------------------------------------------------ */
  function riseRows() {
    const H = window.NaveyaPayHandoff;
    if (!H) return [];
    return H.proposals().map(function (p) {
      const on = p.on ? isoOf(p.on) : TODAY_ISO;
      const row = {
        id: p.id, kind: "rise", personKey: p.nameKey, staff: p.staffId,
        groupKey: p.group === "admin" ? "pyo.pg.admin" : "pyo.pg.teach",
        campusKey: "pyo.camp.indira",
        raisedIso: on, raisedBy: "hr",
        pct: p.pct, currentGross: p.currentGross, apprId: p.apprId,
        targetGross: H.targetGross(p),
        hr: { byKey: HR_WHO, on: on },
        state: "withPayroll",
      };
      if (p.state === "settled" && p.settled) {
        row.state = "approved";
        row.payroll = {
          byKey: p.settled.byKey || PY_WHO, on: isoOf(p.settled.on),
          gross: p.settled.gross, effectiveFrom: p.settled.effectiveFrom,
        };
      }
      if (p.state === "declined" && p.declined) {
        row.state = "declined";
        row.declined = {
          at: "payroll", byKey: p.declined.byKey || PY_WHO,
          on: isoOf(p.declined.on), reasonKey: p.declined.reasonKey, note: p.declined.note || "",
        };
      }
      return row;
    });
  }
  function isoOf(d) {
    if (!d) return TODAY_ISO;
    if (typeof d === "string") return d;
    const p2 = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.y + "-" + p2(d.m) + "-" + p2(d.d);
  }

  const API = {
    TODAY_ISO: TODAY_ISO, RUN_OPEN: RUN_OPEN, RUN_LAST: RUN_LAST,
    STOPS: STOPS, STATE_STOP: STATE_STOP,
    HR_WHO: HR_WHO, PY_WHO: PY_WHO,
    r2: r2, daysBetween: daysBetween,

    kinds: function () { return ["claim", "loan", "ot", "rise"]; },
    all: function () { return ALL.concat(riseRows()); },
    byKind: function (k) {
      if (k === "rise") return riseRows();
      return ALL.filter(function (x) { return x.kind === k; });
    },
    byId: function (id) {
      return API.all().filter(function (x) { return x.id === id; })[0] || null;
    },

    /* where a request has got to, as an index into STOPS. null means
       it left the chain. */
    stop: function (r) { return STATE_STOP[r.state]; },
    isWithHR: function (r) { return r.state === "withHR"; },
    isOpen: function (r) { return r.state !== "paid" && r.state !== "declined"; },
    /* how long it has been sitting where it is */
    waitingDays: function (r) {
      const since = r.state === "withPayroll" && r.hr ? r.hr.on
        : r.state === "withHR" ? r.raisedIso
          : r.raisedIso;
      return Math.max(0, daysBetween(since, TODAY_ISO));
    },

    /* what the employee asked for, in rupees, where that is a
       meaningful question. Overtime has no rupee figure at HR's desk
       on purpose: the hours are the fact, the money is payroll's. */
    askedValue: function (r) {
      if (r.kind === "claim") return r.amount;
      if (r.kind === "loan") return r.amountAsked;
      return null;
    },
    otHours: function (r) { return r.verified == null ? r.detected : r.verified; },

    /* ---- HR's three acts --------------------------------------- */
    verify: function (id, payload) {
      const r = API.byId(id);
      if (!r || r.state !== "withHR") return false;
      const p = payload || {};
      r.hr = {
        byKey: HR_WHO, on: p.on || TODAY_ISO,
        noteKey: p.noteKey || null, note: p.note || "",
        recommendTenure: p.recommendTenure != null ? p.recommendTenure : undefined,
        cutFrom: p.cutFrom != null ? p.cutFrom : undefined,
        reasonKey: p.reasonKey || undefined,
      };
      if (r.kind === "ot") r.verified = p.verified != null ? p.verified : r.detected;
      r.state = "withPayroll";
      emit();
      return true;
    },

    sendBack: function (id, payload) {
      const r = API.byId(id);
      if (!r || r.state !== "withHR") return false;
      r.returned = {
        byKey: HR_WHO, on: (payload && payload.on) || TODAY_ISO,
        reasonKey: payload && payload.reasonKey, note: (payload && payload.note) || "",
      };
      r.state = "returned";
      emit();
      return true;
    },

    decline: function (id, payload) {
      const r = API.byId(id);
      if (!r || (r.state !== "withHR" && r.state !== "returned")) return false;
      r.declined = {
        at: "hr", byKey: HR_WHO, on: (payload && payload.on) || TODAY_ISO,
        reasonKey: payload && payload.reasonKey, note: (payload && payload.note) || "",
      };
      r.state = "declined";
      emit();
      return true;
    },

    /* HR records one on the employee's behalf -- the paper form that
       came to the desk, or the day a device missed. */
    add: function (payload) {
      seq += 1;
      const p = payload || {};
      const base = {
        id: (p.kind === "loan" ? "LR-0" : p.kind === "ot" ? "OT-0" : "CL-0") + seq,
        kind: p.kind, personKey: p.personKey, staff: p.staff,
        groupKey: p.groupKey, campusKey: p.campusKey || "pyo.camp.indira",
        raisedIso: p.raisedIso || TODAY_ISO, raisedBy: "hr", state: "withHR",
      };
      if (p.kind === "claim") {
        base.cat = p.cat; base.amount = p.amount; base.capV = p.capV || null;
        base.billIso = p.billIso || null; base.billNo = p.billNo || null;
        base.hasBill = p.hasBill !== false;
      } else if (p.kind === "loan") {
        base.loanKind = p.loanKind || "advance"; base.purposeKey = p.purposeKey;
        base.amountAsked = p.amountAsked; base.tenureAsked = p.tenureAsked;
        base.serviceYears = p.serviceYears || null; base.monthlyGross = p.monthlyGross || null;
      } else if (p.kind === "ot") {
        base.periodKey = p.periodKey || "pq.ot.p.sep"; base.rosterHrs = p.rosterHrs || 192;
        base.basicDa = p.basicDa != null ? p.basicDa : null;
        base.eligible = p.eligible !== false; base.source = "manual";
        base.detected = p.detected; base.verified = null; base.days = p.days || [];
      }
      ALL.push(base);
      emit();
      return base;
    },

    /* ---- payroll's two acts ------------------------------------
       The other end of the same chain. HR confirmed the fact; this
       is where the figure is set, and it is the ONLY place a rupee
       is decided on any of these objects.

       `payload` carries whatever that kind needs: a batch for a
       claim, principal/tenure/rate for a loan, the hourly rate and
       the statutory multiple for overtime. Nothing here recomputes
       what HR verified -- the hours, the amount claimed and the
       percentage are inputs, not suggestions. ------------------- */
    payrollApprove: function (id, payload) {
      const r = API.byId(id);
      if (!r || r.state !== "withPayroll") return false;
      const p = payload || {};
      /* A RISE IS NOT OURS TO MUTATE. riseRows() builds a fresh object
         on every read, so writing to the one byId() just handed back
         would vanish on the next render. The record lives in
         pay-handoff's PROPOSALS and the write goes there, which is
         also why Staff & salaries sees it without being told. */
      if (r.kind === "rise") {
        const H = window.NaveyaPayHandoff;
        if (!H) return false;
        const ok = H.settleProposal(id, {
          gross: p.gross, basic: p.basic, lines: p.lines || null,
          structureKey: p.structureKey, effectiveFrom: p.effectiveFrom,
          byKey: PY_WHO, on: p.on || TODAY_ISO,
        });
        if (ok) emit();
        return ok;
      }
      r.payroll = {
        byKey: PY_WHO, on: p.on || TODAY_ISO,
        batch: p.batch || RUN_OPEN,
        principal: p.principal, tenure: p.tenure, rate: p.rate, emi: p.emi,
        hourly: p.hourly, multiple: p.multiple, value: p.value,
        note: p.note || "",
      };
      r.state = "approved";
      emit();
      return true;
    },

    payrollDecline: function (id, payload) {
      const r = API.byId(id);
      if (!r || r.state !== "withPayroll") return false;
      if (r.kind === "rise") {
        const H = window.NaveyaPayHandoff;
        if (!H) return false;
        const ok = H.declineProposal(id, {
          reasonKey: (payload && payload.reasonKey) || "pq.dec.r.other",
          note: (payload && payload.note) || "",
          byKey: PY_WHO, on: (payload && payload.on) || TODAY_ISO,
        });
        if (ok) emit();
        return ok;
      }
      r.declined = {
        at: "payroll", byKey: PY_WHO, on: (payload && payload.on) || TODAY_ISO,
        reasonKey: payload && payload.reasonKey, note: (payload && payload.note) || "",
      };
      r.state = "declined";
      emit();
      return true;
    },

    /* the hourly rate an overtime line is priced on: basic and
       dearness pay over twenty-six working days and an eight-hour
       day. Null when the row has no pay on it -- a day HR entered by
       hand for somebody payroll has not priced yet -- and the screen
       says so rather than inventing a number. */
    otHourly: function (r) {
      if (!r || r.basicDa == null) return null;
      return r2(r.basicDa / 26 / 8);
    },
    OT_MULTIPLE: 2,

    /* what payroll owes each kind, in words, so the queue can say
       what the officer is actually being asked to decide */
    decisionKey: function (r) {
      if (r.kind === "claim") return "pq.dec.claim";
      if (r.kind === "loan") return "pq.dec.loan";
      if (r.kind === "ot") return "pq.dec.ot";
      return "pq.dec.rise";
    },

    /* the EMI a sanction implies. Flat, because the loan register's
       own schedule is flat: principal over tenure, interest on top
       where a rate is set. */
    emiFor: function (principal, tenure, rate) {
      if (!tenure) return 0;
      const interest = rate ? principal * (rate / 100) * (tenure / 12) : 0;
      return r2((principal + interest) / tenure);
    },

    subscribe: function (fn) {
      listeners.push(fn);
      return function () {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };

  function usePayRequests() {
    const [, bump] = React.useState(0);
    React.useEffect(function () {
      const offA = API.subscribe(function () { bump(function (n) { return n + 1; }); });
      const H = window.NaveyaPayHandoff;
      const offB = H ? H.subscribe(function () { bump(function (n) { return n + 1; }); }) : function () {};
      return function () { offA(); offB(); };
    }, []);
    return API;
  }
  API.usePayRequests = usePayRequests;

  addStrings({
    en: {
      "pq.who.meera": "Meera Iyer, HR",
      "pq.who.sunita": "Sunita Kulkarni, Payroll Officer",

      "pq.ot.p.jul": "July 2026",
      "pq.ot.p.aug": "August 2026",
      "pq.ot.p.sep": "September 2026",

      "pq.cl.flag.noBill": "No bill is attached. The policy needs one before this can go any further.",
      "pq.cl.flag.overCap": "Above the yearly cap for this category.",
      "pq.cl.hrnote.overCap": "Verified the travel, and it is genuine. The amount is over the cap, which is payroll's call, not mine.",
      "pq.ln.flag.running": "A loan is already running for this person.",
      "pq.ot.flag.high": "More than twenty hours in one month. Worth reading the days.",
      "pq.ot.cut.notAsked": "Two of the evenings were not asked for by the department.",

      "pq.ret.r.illegible": "The bill cannot be read",
      "pq.ret.r.noPurpose": "No purpose was stated",
      "pq.ret.r.noBill": "No bill attached",
      "pq.ret.r.wrongPerson": "Raised against the wrong person",
      "pq.ret.r.other": "Something else, written below",

      "pq.dec.r.notCovered": "Not covered by the policy",
      "pq.dec.r.notHourly": "Teaching staff are not on hourly wages, so no overtime arises",
      "pq.dec.r.exposure": "Too much is already outstanding against this person",
      "pq.dec.r.duplicate": "Already claimed once",
      "pq.dec.r.other": "Something else, written below",

      "pq.dec.claim": "Set the tax treatment and the batch that pays it",
      "pq.dec.loan": "Sanction a principal, a tenure and a rate",
      "pq.dec.ot": "Price the verified hours at the statutory multiple",
      "pq.dec.rise": "Turn the percentage into components",
    },
  });

  window.NaveyaPayRequests = API;
})();
