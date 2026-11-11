/* @jsxRuntime classic */
/* ============================================================
   Naveya — what has been done to a run · window.NaveyaPayRuns

   WHY THIS FILE EXISTS. The run used to hold the officer's work in
   React state on the screen that drew it. Open a person's record and
   come back and it was still there; walk to Pay rules and back and it
   was gone. For a screen whose whole job is to collect decisions
   about money, that is not a bug to be fixed later -- it is the
   reason the designer asked for "a screen where anything done inside
   the payroll is saved".

   SO A RUN IS A RECORD, NOT A RENDER. It lives here, it is keyed by
   campus and month, and the screen edits a DRAFT of it. Nothing
   reaches the run until Save is pressed, and the screen says in words
   how many changes are waiting and offers to throw them away.

   TWO WAYS TO RUN A PAYROLL (designer, 2026-10-15): "when starting a
   payroll run the user gets prompted whether he wants the automated
   payroll on the system or a manual payroll run ... inside the manual
   one the user can download all data in excel format and then
   reupload and then send the payroll to the accountant."

   So a run carries a MODE, chosen when it is started and never after:

     auto    the officer works the roll on the screen -- asks HR,
             pays a bill, skips an instalment -- and sends.
     manual  the school keeps its own sheet. Naveya hands over every
             row, the officer fills it in wherever they fill it in,
             and hands it back. The run is then what the sheet says.

   The two are not two designs of one screen. They are two different
   jobs, and the only things they share are the heading, the money and
   the one button at the end.

   WHAT IS NOT HERE. The roll, the loans and the claims: those are
   facts about the school, and v3/payroll-roll.jsx owns them. This
   file owns only what somebody DID about them this month.
   ============================================================ */
(function () {
  const R = function () { return window.NaveyaRoll; };

  const listeners = [];
  function emit() { listeners.forEach(function (fn) { fn(); }); }

  function emptyWork() { return { marks: {}, claims: {}, loans: {}, advances: [], ot: {} }; }
  function key(campus, month) { return campus + "|" + month; }

  /* ------------------------------------------------------------
     WHERE THE YEAR STANDS WHEN THE PRODUCT OPENS.

     August is the month on the desk: Indiranagar is being checked,
     Whitefield has gone to the accountant. Every month before August
     was paid, and is derived rather than stored -- a closed run holds
     no draft and never will.
     ------------------------------------------------------------ */
  const RUNS = {
    "indiranagar|8": {
      campus: "indiranagar", month: 8, mode: "auto", state: "checking",
      work: emptyWork(), savedAt: { d: 10, m: 8, y: 2026 }, sheet: null,
    },
    "whitefield|8": {
      campus: "whitefield", month: 8, mode: "auto", state: "sent",
      work: emptyWork(), savedAt: { d: 10, m: 8, y: 2026 }, sheet: null,
    },
  };

  /* a month already paid is a run, it is simply one nobody can touch */
  function derivedPast(campus, month) {
    const roll = R();
    if (!roll || month >= roll.LIVE_MONTH) return null;
    const cm = roll.CAMPUS_OF[campus];
    if (!cm || !cm.groups) return null;
    return {
      campus: campus, month: month, mode: "auto", state: "paid",
      work: emptyWork(), savedAt: null, sheet: null, closed: true,
    };
  }

  /* ------------------------------------------------------------
     WHAT THE OFFICER'S DECISIONS DO TO A ROW.

     The roll is never written to. A row is priced by the school, and
     the run's decisions are laid OVER it -- so "put it back" is one
     delete, nothing can be half-undone, and two screens reading the
     same draft cannot disagree about what August costs.
     ------------------------------------------------------------ */
  function claimState(work, cl) {
    return (work && work.claims[cl.id]) || (cl.overdue ? "due" : "ready");
  }

  /* overtime sits where a bill sits: waiting until the officer puts
     it in a run, or moves it to the next one. A line HR has not
     verified is not the officer's to decide. */
  function otState(work, o) {
    if (o.state === "paid") return "paid";
    if (o.state === "approved") return "booked";
    if (!o.ready) return "withHr";
    return (work && work.ot && work.ot[o.id]) || "ready";
  }

  function priced(r, work) {
    const w = work || emptyWork();
    let add = 0, off = 0;
    (r.claims || []).forEach(function (cl) {
      if (w.claims[cl.id] === "in") add += cl.v;
    });
    (r.overtime || []).forEach(function (o) {
      if (o.value != null && w.ot && w.ot[o.id] === "in") add += o.value;
    });
    const lw = r.loan ? w.loans[r.id] : null;
    if (lw === "skip") add += r.loan.emi;
    if (lw === "settle") off += r.loan.balance - r.loan.emi;
    let adv = 0;
    w.advances.forEach(function (a) { if (a.staffId === r.id) adv += a.amount; });
    add += adv;
    return {
      net: r.net + add - off,
      added: add, taken: off, advance: adv,
      claimIn: (r.claims || []).reduce(function (s, cl) { return s + (w.claims[cl.id] === "in" ? cl.v : 0); }, 0),
      otIn: (r.overtime || []).reduce(function (s, o) {
        return s + (o.value != null && w.ot && w.ot[o.id] === "in" ? o.value : 0);
      }, 0),
      loanWork: lw || null,
    };
  }

  /* an issue is answered when the officer has done the thing it asks
     for -- not when they have clicked something near it */
  function settled(r, work) {
    const w = work || emptyWork();
    const mk = w.marks[r.id];
    if (mk) return mk;
    if (!r.issue) return null;
    if (r.issue.kind === "claimWaiting") {
      const due = (r.claims || []).filter(function (cl) { return cl.overdue; });
      const done = due.every(function (cl) { return w.claims[cl.id] === "in"; });
      return done && due.length ? { state: "fixed", whatKey: "pyo2.rc.a.pay" } : null;
    }
    if (r.issue.kind === "loanOverNet") {
      const lw = w.loans[r.id];
      return lw ? { state: "fixed", whatKey: lw === "skip" ? "pyo2.ln.a.skip" : "pyo2.ln.a.settle" } : null;
    }
    return null;
  }

  function needsFix(r, work) {
    return !!(r.issue && r.issue.blocks && !settled(r, work));
  }

  function runTotals(roll, work) {
    let net = 0, gross = 0, ded = 0, add = 0, off = 0, held = 0, cash = 0;
    roll.forEach(function (r) {
      const p = priced(r, work);
      gross += r.gross; ded += r.ded;
      if (r.heldKey) held += r.net;
      else {
        net += p.net; add += p.added; off += p.taken;
        /* money the run pays that was not earned as salary: a bill
           settled with this run, and an advance handed out */
        cash += p.claimIn + p.advance + p.otIn;
      }
    });
    /* the total is everything that leaves on payday, and deductions
       are what is left of it once people and holds are taken out --
       so the three parts can never add to more than the whole */
    const out = gross + cash;
    return {
      net: net, gross: gross, rawDed: ded, held: held,
      added: add, taken: off, cash: cash,
      out: out, ded: out - net - held,
    };
  }

  const API = {
    emptyWork: emptyWork,
    claimState: claimState, otState: otState, priced: priced, settled: settled,
    needsFix: needsFix, runTotals: runTotals,

    get: function (campus, month) {
      return RUNS[key(campus, month)] || derivedPast(campus, month) || null;
    },

    /* what a campus can do with a month, in one word, so no screen
       works it out twice */
    stateOf: function (campus, month) {
      const run = API.get(campus, month);
      if (run) return run.state;
      const roll = R();
      const cm = roll && roll.CAMPUS_OF[campus];
      if (!cm || !cm.groups) return "blocked";
      return "none";
    },

    /* STARTING. The mode is chosen here and is not a setting that can
       be changed afterwards: half a month done one way and half the
       other is not a payroll anybody could audit. */
    start: function (campus, month, mode) {
      const k = key(campus, month);
      if (RUNS[k]) return RUNS[k];
      RUNS[k] = {
        campus: campus, month: month, mode: mode === "manual" ? "manual" : "auto",
        state: "checking", work: emptyWork(), savedAt: null,
        sheet: mode === "manual" ? { step: "fresh", file: null, changed: null } : null,
      };
      emit();
      return RUNS[k];
    },

    /* SAVING. The draft the screen has been holding becomes the run.
       Nothing else writes `work`, so there is exactly one moment at
       which the officer's decisions take effect. */
    save: function (campus, month, work) {
      const run = RUNS[key(campus, month)];
      if (!run || run.state !== "checking") return false;
      run.work = {
        marks: Object.assign({}, work.marks),
        claims: Object.assign({}, work.claims),
        loans: Object.assign({}, work.loans),
        advances: (work.advances || []).slice(),
        ot: Object.assign({}, work.ot),
      };
      run.savedAt = { d: 15, m: 10, y: 2026 };
      emit();
      return true;
    },

    send: function (campus, month) {
      const run = RUNS[key(campus, month)];
      if (!run || run.state !== "checking") return false;
      run.state = "sent";
      emit();
      return true;
    },

    /* ---- the manual run's three steps ---- */
    markDownloaded: function (campus, month) {
      const run = RUNS[key(campus, month)];
      if (!run || !run.sheet) return false;
      if (run.sheet.step === "fresh") run.sheet.step = "out";
      run.sheet.downloadedAt = { d: 15, m: 10, y: 2026 };
      emit();
      return true;
    },
    uploadSheet: function (campus, month, fileName, changed) {
      const run = RUNS[key(campus, month)];
      if (!run || !run.sheet) return false;
      run.sheet.step = "in";
      run.sheet.file = fileName;
      run.sheet.changed = changed;
      run.savedAt = { d: 15, m: 10, y: 2026 };
      emit();
      return true;
    },
    clearSheet: function (campus, month) {
      const run = RUNS[key(campus, month)];
      if (!run || !run.sheet) return false;
      run.sheet.step = "out";
      run.sheet.file = null;
      run.sheet.changed = null;
      emit();
      return true;
    },

    /* how many decisions are sitting in a draft that is not the run */
    countWork: function (work) {
      if (!work) return 0;
      return Object.keys(work.claims || {}).length
        + Object.keys(work.loans || {}).length
        + Object.keys(work.marks || {}).length
        + Object.keys(work.ot || {}).length
        + ((work.advances || []).length);
    },
    same: function (a, b) {
      return API.countWork(a) === API.countWork(b)
        && JSON.stringify(a) === JSON.stringify(b);
    },

    /* what this campus will actually pay out, with whatever the
       officer has already saved taken into account */
    payableOf: function (campus, month) {
      const roll = R();
      if (!roll) return 0;
      const run = API.get(campus, month);
      const rows = roll.roll(campus, month > roll.LIVE_MONTH ? roll.LIVE_MONTH : month);
      const t = runTotals(rows, run && run.state === "checking" ? run.work : emptyWork());
      return t.net;
    },

    /* for a screen that wants to start from what is saved */
    draftOf: function (campus, month) {
      const run = API.get(campus, month);
      if (!run) return emptyWork();
      return {
        marks: Object.assign({}, run.work.marks),
        claims: Object.assign({}, run.work.claims),
        loans: Object.assign({}, run.work.loans),
        advances: run.work.advances.slice(),
        ot: Object.assign({}, run.work.ot || {}),
      };
    },

    reset: function () {
      Object.keys(RUNS).forEach(function (k) { delete RUNS[k]; });
      emit();
    },

    subscribe: function (fn) {
      listeners.push(fn);
      return function () {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };

  function usePayRuns() {
    const [, bump] = React.useState(0);
    React.useEffect(function () {
      return API.subscribe(function () { bump(function (n) { return n + 1; }); });
    }, []);
    return API;
  }

  window.NaveyaPayRuns = API;
  window.NaveyaPayRuns.use = usePayRuns;
})();
