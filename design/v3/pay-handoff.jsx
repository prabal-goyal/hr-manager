/* @jsxRuntime classic */
/* ============================================================
   Naveya — the one place HR and Payroll talk · window.NaveyaPayHandoff

   WHY THIS FILE EXISTS. Until 2026-10-07 the HR operator typed a
   contracted monthly gross into the add-employee form, and typed the
   new figure into an appraisal when somebody got a rise. That put the
   single most sensitive number in the product in the hands of the one
   role that may not be trusted with it, and it meant two people could
   hold two different opinions of what somebody earns with nothing in
   the product to reconcile them.

   THE RULINGS (designer, 2026-10-07):
     . "the HR cant add the pay, the employee once created will be
       sent to payroll officer and then the pay details will be added
       by the payroll officer and then the same will be shown to the
       HR ... these 2 users should communicate in only this module."
     . "when a appraisal is recorded, the pay cannot be setup by the
       HR and updated, the Increase percentage is added and the same
       should be sent to the payroll officer in the proposed revisions
       where the Payroll officer should see what the salary has been
       increased to then the officer can manually change the full HRA
       and breakdown of detail to detail."

   REVERSED 2026-10-15. The designer has taken the figure back the
   other way: "the HR has to set a salary with breakdown in the HR
   module, then only the payroll officer can see the salaries. The
   payroll officer no longer sets the breakdown or the salaries, and
   all the salaries are first created by HR; later the payroll officer
   can see their details in staff salaries, and can send the salaries
   for correction to HR."

   SO THE SPLIT IS NOW: HR owns WHO AND WHAT THEY ARE PAID.
   PAYROLL owns WHAT THE MONTH DOES WITH IT, and asks HR when a
   salary looks wrong. The three channels below are unchanged in
   shape and reversed in direction -- which is why `remind` is what
   payroll does to HR, and `requestChange` comes FROM the officer.

   (Superseded, kept so the reversal is legible:)
     . HR creates the person and picks the PAY GROUP, because the
       group is a contract fact -- screen-inventory HR-20 requires
       `pay_group_id` with no default, and PY-05's precondition is
       "employee has a contract with a pay group".
     . HR records an appraisal and the PERCENTAGE agreed in it. A
       percentage is a judgement about a person, which is HR's work.
     . PAYROLL turns that percentage into components: which part is
       basic, what HRA follows from it, where the balance falls. That
       is PY-05 and PY-06, and it is the only place a rupee figure is
       decided.

   THREE CHANNELS, ONE OBJECT EACH, NO INBOX:
     1. AWAITING PAY   a person HR created whom payroll has not priced.
     2. PROPOSALS      an appraisal percentage waiting to become money.
     3. CHANGE REQUESTS HR cannot edit a salary, so when something on
        it looks wrong HR asks, in writing, against that person.

   None of these is a message. Each is a STATE both screens read, so
   the act that changes it on one desk changes what the other sees.
   If HR's record and payroll's register each kept their own copy,
   they would disagree the first time one was edited -- which is the
   whole bug this split exists to prevent.
   ============================================================ */
(function () {
  const UI = window.UI3;
  const { addStrings } = UI;
  const r2 = function (n) { return Math.round(n * 100) / 100; };

  /* ------------------------------------------------------------
     1 . AWAITING PAY. Seeded from the one genuinely unassigned
     person in pages/py-salary.jsx's dataset -- Ritika Chawla,
     NAV-0431, who joined on 1 September and whose ledger is empty.
     ------------------------------------------------------------ */
  const AWAITING = [
    {
      id: "NAV-0431",
      nameKey: "pys.n.ritika",
      desigKey: "pys.d.ritika",
      group: "teach",
      campusKey: "ph.campus.indiranagar",
      doj: { d: 1, m: 9, y: 2026 },
      createdByKey: "ph.who.meera",
      createdOn: { d: 28, m: 8, y: 2026 },
      reminders: [],
      assigned: null,
    },
  ];

  /* ------------------------------------------------------------
     2 . PROPOSALS. An appraisal that agreed a rise, carrying the
     PERCENTAGE and nothing else. `targetGross` is DERIVED, never
     stored, so the figure payroll opens with is arithmetic the
     screen can show rather than a number somebody typed.
     ------------------------------------------------------------ */
  const PROPOSALS = [
    {
      id: "PR-0007",
      staffId: "NAV-0142",
      nameKey: "pys.n.ananya",
      desigKey: "pys.d.ananya",
      group: "teach",
      apprId: "AP-0004",
      pct: 8,
      currentGross: 94800,
      byKey: "ph.who.anjali",
      on: { d: 5, m: 10, y: 2026 },
      state: "pending",
      settled: null,
      declined: null,
    },
    {
      id: "PR-0008",
      staffId: "NAV-0301",
      nameKey: "pys.n.joseph",
      desigKey: "pys.d.joseph",
      group: "teach",
      apprId: "AP-0011",
      pct: 6,
      currentGross: 76200,
      byKey: "ph.who.anjali",
      on: { d: 5, m: 10, y: 2026 },
      state: "pending",
      settled: null,
      declined: null,
    },
    {
      id: "PR-0009",
      staffId: "NAV-0007",
      nameKey: "pys.n.kavita",
      desigKey: "pys.d.kavita",
      group: "admin",
      apprId: "AP-0012",
      pct: 5,
      currentGross: 58000,
      byKey: "ph.who.meera",
      on: { d: 2, m: 10, y: 2026 },
      state: "pending",
      settled: null,
      declined: null,
    },
    {
      /* already dealt with, so the queue shows what "done" looks like
         without the officer having to act to find out */
      id: "PR-0006",
      staffId: "NAV-0122",
      nameKey: "pys.n.prakash",
      desigKey: "pys.d.prakash",
      group: "teach",
      apprId: "AP-0009",
      pct: 7,
      currentGross: 71000,
      byKey: "ph.who.anjali",
      on: { d: 18, m: 9, y: 2026 },
      state: "settled",
      settled: {
        gross: 75970, basic: 32000, structureKey: "teach3", lines: null,
        effectiveFrom: { d: 1, m: 10, y: 2026 },
        byKey: "ph.who.sunita", on: { d: 22, m: 9, y: 2026 },
        awaitingCheckerKey: "ph.who.rajiv",
      },
      declined: null,
    },
    {
      id: "PR-0005",
      staffId: "NAV-0209",
      nameKey: "pys.n.mahesh",
      desigKey: "pys.d.mahesh",
      group: "teach",
      apprId: "AP-0008",
      pct: 12,
      currentGross: 68400,
      byKey: "ph.who.anjali",
      on: { d: 14, m: 9, y: 2026 },
      state: "declined",
      settled: null,
      declined: {
        reasonKey: "pyp.pr.dec.r1", note: "",
        byKey: "ph.who.sunita", on: { d: 16, m: 9, y: 2026 },
      },
    },
  ];

  /* ------------------------------------------------------------
     3 . CHANGE REQUESTS. HR reads the whole breakdown and may edit
     none of it, so the only thing HR can do with a wrong figure is
     say so, against that person, in words.
     ------------------------------------------------------------ */
  const CHANGES = [];

  const listeners = [];
  function emit() { listeners.forEach(function (fn) { fn(); }); }
  let seq = 100;

  const API = {
    /* ---- awaiting pay ------------------------------------------ */
    all: function () { return AWAITING.slice(); },
    pending: function () { return AWAITING.filter(function (p) { return !p.assigned; }); },
    forId: function (id) { return AWAITING.filter(function (p) { return p.id === id; })[0] || null; },
    isPending: function (id) { const p = API.forId(id); return !!p && !p.assigned; },

    assign: function (id, payload) {
      const p = API.forId(id);
      if (!p || p.assigned) return false;
      p.assigned = {
        structureKey: payload.structureKey, group: payload.group,
        gross: payload.gross, basic: payload.basic, lines: payload.lines || null,
        effectiveFrom: payload.effectiveFrom, reason: payload.reason || "new",
        byKey: payload.byKey || "ph.who.sunita", on: payload.on || { d: 7, m: 10, y: 2026 },
        awaitingCheckerKey: payload.checkerKey || "ph.who.rajiv",
      };
      emit();
      return true;
    },

    /* PAYROLL -> HR since 2026-10-15: the officer chasing a salary
       that has not been set. */
    remind: function (id, byKey, on) {
      const p = API.forId(id);
      if (!p || p.assigned) return false;
      p.reminders.push({ byKey: byKey || "ph.who.sunita", on: on || { d: 15, m: 10, y: 2026 } });
      emit();
      return true;
    },

    /* ---- proposals --------------------------------------------- */
    proposals: function () { return PROPOSALS.slice(); },
    pendingProposals: function () { return PROPOSALS.filter(function (p) { return p.state === "pending"; }); },
    proposalById: function (id) { return PROPOSALS.filter(function (p) { return p.id === id; })[0] || null; },
    /* the newest proposal touching one person, settled or not --
       HR's appraisal row reads this to show where the rise got to */
    proposalFor: function (staffId) {
      const mine = PROPOSALS.filter(function (p) { return p.staffId === staffId; });
      return mine.length ? mine[mine.length - 1] : null;
    },

    /* what the percentage comes to, to the rupee. Payroll opens the
       breakdown on this and is free to land somewhere else. */
    targetGross: function (p) { return p ? r2(p.currentGross * (1 + p.pct / 100)) : 0; },

    /* HR'S side: an appraisal agreed a rise. No figure is accepted
       here -- only the percentage the conversation settled on. */
    proposeRevision: function (payload) {
      seq += 1;
      const p = {
        id: "PR-0" + seq,
        staffId: payload.staffId, nameKey: payload.nameKey, desigKey: payload.desigKey,
        group: payload.group || "teach", apprId: payload.apprId,
        pct: payload.pct, currentGross: payload.currentGross,
        byKey: payload.byKey || "ph.who.meera", on: payload.on || { d: 7, m: 10, y: 2026 },
        state: "pending", settled: null, declined: null,
      };
      PROPOSALS.push(p);
      emit();
      return p;
    },

    /* PAYROLL'S side: the percentage becomes components. `lines` is
       the whole breakdown as the officer left it, including anything
       they overrode, so HR sees what was actually decided and not a
       recomputation of it. */
    settleProposal: function (id, payload) {
      const p = API.proposalById(id);
      if (!p || p.state !== "pending") return false;
      p.state = "settled";
      p.settled = {
        gross: payload.gross, basic: payload.basic, lines: payload.lines || null,
        structureKey: payload.structureKey,
        effectiveFrom: payload.effectiveFrom,
        byKey: payload.byKey || "ph.who.sunita", on: payload.on || { d: 7, m: 10, y: 2026 },
        awaitingCheckerKey: payload.checkerKey || "ph.who.rajiv",
      };
      emit();
      return true;
    },

    declineProposal: function (id, payload) {
      const p = API.proposalById(id);
      if (!p || p.state !== "pending") return false;
      p.state = "declined";
      p.declined = {
        reasonKey: payload.reasonKey, note: payload.note || "",
        byKey: payload.byKey || "ph.who.sunita", on: payload.on || { d: 7, m: 10, y: 2026 },
      };
      emit();
      return true;
    },

    /* ---- change requests --------------------------------------- */
    changesFor: function (staffId) {
      return CHANGES.filter(function (x) { return x.staffId === staffId; });
    },
    openChanges: function () { return CHANGES.filter(function (x) { return !x.answered; }); },
    /* PAYROLL -> HR since 2026-10-15. The officer may not edit a
       salary, so a written request against the person is the whole of
       what they can do about a wrong one. */
    requestChange: function (staffId, payload) {
      seq += 1;
      CHANGES.push({
        id: "CR-0" + seq, staffId: staffId,
        topicKey: payload.topicKey, note: payload.note || "",
        byKey: payload.byKey || "ph.who.sunita", on: payload.on || { d: 15, m: 10, y: 2026 },
        answered: null,
      });
      emit();
      return true;
    },

    /* HR SETS THE SALARY. The same object `assign` always wrote, so
       every screen that already reads `assigned` reads this -- what
       changed is whose hand is on it. */
    setSalary: function (staffId, payload) {
      const p = API.forId(staffId);
      if (p) {
        p.assigned = {
          structureKey: payload.structureKey || null, group: p.group,
          gross: payload.gross, basic: payload.basic, lines: payload.lines || null,
          effectiveFrom: payload.effectiveFrom || { d: 1, m: 10, y: 2026 },
          reason: payload.reason || "new",
          byKey: payload.byKey || "ph.who.meera", on: payload.on || { d: 15, m: 10, y: 2026 },
          awaitingCheckerKey: null,
        };
      }
      /* answering every open question about this person: the salary
         has been looked at, which is what payroll asked for */
      CHANGES.forEach(function (x) {
        if (x.staffId === staffId && !x.answered) {
          x.answered = { byKey: payload.byKey || "ph.who.meera", on: payload.on || { d: 15, m: 10, y: 2026 } };
        }
      });
      emit();
      return true;
    },

    subscribe: function (fn) {
      listeners.push(fn);
      return function () {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };

  /* A hook so either screen re-reads when the other side acts. A
     version bump rather than a selector: the payloads are small and
     correctness matters more than renders here. */
  function useHandoff() {
    const [, bump] = React.useState(0);
    React.useEffect(function () {
      return API.subscribe(function () { bump(function (n) { return n + 1; }); });
    }, []);
    return API;
  }

  addStrings({
    en: {
      "ph.who.meera": "Meera Iyer, HR",
      "ph.who.sunita": "Sunita Kulkarni, Payroll Officer",
      "ph.who.rajiv": "Rajiv Menon, Accountant",
      "ph.who.anjali": "Anjali Deshpande, Head of Science",
      "ph.campus.indiranagar": "Indiranagar",
    },
  });

  API.useHandoff = useHandoff;
  API.r2 = r2;
  window.NaveyaPayHandoff = API;
})();
