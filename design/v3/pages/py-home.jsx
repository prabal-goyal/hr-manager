/* @jsxRuntime classic */
/* ============================================================
   Naveya — Home, the payroll officer's board · window.Pages3.PYHome

   THE ONE QUESTION THIS SCREEN ANSWERS: what needs me today?

   IT IS A BOARD, NOT A WORKLIST (designer, 2026-10-26: "I need a
   dashboard type home screen with sections and data"). Density is a
   function of role, not taste — a teacher's home is nearly empty and
   a payroll officer's is a board — so every section here opens on a
   figure and the SHAPE of it, and the words come after.

   WHAT WENT WRONG BEFORE, AND IS FIXED HERE

   1. A LANDING SCREEN MAY NOT HOLD AN OPINION A MODULE OWNS. The run
      section drew ONE trust-wide run, hard-coded to the stage
      "approval", and said "nothing changes while the accountant holds
      it". The run module says a run is PER CAMPUS: Indiranagar was
      still being checked on this officer's own desk while Whitefield
      had gone. The board was telling somebody there was nothing to do
      while ₹1.55 crore of their own work sat waiting. Every campus
      panel is now read from v3/payrun-store.jsx and v3/payroll-roll.jsx.
      (Its four invented step labels printed as raw keys — `pyr.s.*`
      exists nowhere in the product.)

   2. SIX PANELS, SIX LAYOUTS. A roster, a grouped list, a pair, a
      chip wall, a catalogue and a bar chart, all in one row, is not a
      dashboard — it is six dashboards. The board repeats THREE shapes
      and nothing else:

        a figure    what it is
        a gauge     how far through it is        (one bar, one whole)
        a split     what it is made of           (one bar, many parts)

   3. NO BOX IS A BUTTON (designer). A panel that lights up whole on
      hover says every pixel is a target and then goes where only one
      word of it named. Nothing on this screen is clickable except a
      LINK: text, underlined, with an arrow beside it.

   4. A BAR MAY ONLY COMPARE ONE KIND OF THING. The waiting list drew
      six independent bars whose lengths were counts, so one
      reimbursement was measured against three appraisal rises. There
      is ONE bar now and the six are parts of it, each row carrying
      its segment's colour.

   THE SECTIONS, in the order the morning goes:

     1. WHAT AUGUST COSTS the month in four figures and one split.
     2. THE RUN           one panel per campus: what it owes, how much
                          of its roll is ready, and what is blocking.
     3. WAITING ON YOU    one list across every module, oldest first,
                          over one split bar — beside the settlements
                          already past a statutory clock.
     4. THE REST          five panels of ONE shape, each with the
                          number that would make the officer open it.

   SPEC — docs/development-specification.md M10; screen-inventory
   PY-01, which requires that F&F appears here as a COUNT and never as
   a list of names.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Chip, StatusMark, Meter,
    Icon, EmptyState, inr, num,
    CampusSwitch, campusLabel, inCampus, campusOfCode, CAMPUS_ALL,
  } = UI;

  const D = (window.Pages3 && window.Pages3.PYRunData) || null;
  const A = (window.Pages3 && window.Pages3.PYAdjData) || null;
  const X = (window.Pages3 && window.Pages3.PYExitData) || null;
  const Q = window.NaveyaPayRequests || null;
  const H = window.NaveyaPayHandoff || null;
  const R = window.NaveyaRoll || null;
  const ST = window.NaveyaPayRuns || null;

  addStrings({
    en: {
      "pyh.crumb": "Payroll",
      "pyh.entity": "Naveya Vidya Trust — Bengaluru",
      /* A DESK IS NOT TITLED AFTER ITS OWNER. "Sunita’s desk" told
         Sunita something she knew and nobody else ever reads this
         screen; a greeting at least says what time it is (designer). */
      "pyh.hello.morning": "Good morning, {name}",
      "pyh.hello.afternoon": "Good afternoon, {name}",
      "pyh.hello.evening": "Good evening, {name}",
      "pyh.cfg": "Priced on {v}",
      "pyh.none": "Nothing to show",

      /* ---- 2 · the run, campus by campus ---- */
      "pyh.run.head": "The {mon} run",
      "pyh.run.sub": "Each campus runs its own {mon}. Work one until nothing on it is blocking, then send it to the accountant.",
      "pyh.run.all": "All months",
      "pyh.cp.people": "{n} people · {how}",
      "pyh.cp.peopleBare": "{n} people",
      "pyh.cp.ready": "Ready to pay",
      "pyh.cp.readyOf": "{a} of {b}",
      "pyh.cp.blocking": "{n} rows still blocking",
      "pyh.cp.blockingWho": "{hr} with HR, {mine} yours to answer",
      "pyh.cp.blockingMine": "all {n} yours to answer",
      "pyh.cp.blockingHr": "all {n} waiting on HR",
      "pyh.cp.clearNote": "Every row on the roll is ready to pay.",
      "pyh.cp.sent": "Nothing moves while the accountant holds it.",
      "pyh.cp.paid": "The money has left the bank.",
      "pyh.cp.noGroup": "No pay group covers this campus",
      "pyh.cp.noGroupNote": "Nothing can be run here until a pay group covers this campus.",
      "pyh.act.open": "Open the run",
      "pyh.act.start": "Start it",
      "pyh.act.setup": "Set up a pay group",

      /* ---- 3 · waiting on you ---- */
      "pyh.wait.head": "Waiting on you",
      "pyh.wait.unit": "waiting on you",
      "pyh.wait.note": "Across every module, longest standing first.",
      "pyh.wait.oldest": "Longest standing",
      "pyh.wait.days": "{n} days",
      "pyh.wait.today": "came in today",
      "pyh.wait.blocks": "blocks the run",
      "pyh.wait.none": "Nothing is waiting on you",
      "pyh.wait.noneBody": "Every queue on this desk is clear.",
      "pyh.w.claims": "Reimbursements verified by HR",
      "pyh.w.loans": "Loans and advances verified by HR",
      "pyh.w.ot": "Overtime verified by HR",
      "pyh.w.rises": "Appraisal rises recorded by HR",
      "pyh.w.unpriced": "People with no salary assigned",
      "pyh.w.exits": "Settlements not started",

      "pyh.late.head": "Past a deadline",
      "pyh.late.unit": "settlements",
      "pyh.late.note": "A statutory clock has already gone by on each of these.",
      "pyh.late.over": "{n} days over",
      "pyh.late.rule": "Wages are due within two working days of an exit, EPF in fifteen to twenty, gratuity in thirty.",
      "pyh.late.go": "Open exits",
      "pyh.late.clean": "Nothing is past a statutory deadline",
      "pyh.late.cleanNote": "Every settlement on the desk is still inside its clock.",

      /* ---- 4 · the desk's own registers, each its own panel ---- */
      "pyh.more": "View more",
      "pyh.more.aria": "View more — {what}",
      "pyh.mod.adjust": "Adjustments",
      "pyh.mod.adjustUnit": "running against the roll",
      "pyh.mod.adjustNote": "Instalments and back pay, settled one run at a time.",
      "pyh.mod.loans": "Loans",
      "pyh.mod.advances": "Advances",
      "pyh.mod.arrears": "Arrears",
      "pyh.mod.adjustFoot": "{v} of it comes off the {mon} run.",
      "pyh.mod.people": "Staff & salaries",
      "pyh.mod.peopleUnit": "on the roll",
      "pyh.mod.peopleNote": "Who is paid what, and what each one is priced on.",
      "pyh.mod.peopleFoot": "Each group is priced by its own rule; a person belongs to exactly one.",
      "pyh.mod.staffUnit": "{n} staff",
      "pyh.mod.exits": "Exits",
      "pyh.mod.exitsUnit": "settlements open",
      "pyh.mod.exitsNote": "From the last working day to the last rupee.",
      "pyh.mod.exitsFoot": "A settlement is closed only when the money has gone out.",
      "pyh.mod.rules": "Pay rules",
      "pyh.mod.rulesUnit": "pay groups",
      "pyh.mod.rulesNote": "What each kind of staff is priced by.",
      "pyh.mod.rulesFoot": "All three priced on {v}. Change a rule and the next run prices on the new one.",
    },
  });

  /* WHAT TIME IT IS IS THE ONE THING A LANDING SCREEN KNOWS THAT
     THE READER HAS NOT ALREADY TOLD IT. */
  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "pyh.hello.morning" : h < 17 ? "pyh.hello.afternoon" : "pyh.hello.evening";
  }

  const TODAY = (D && D.TODAY_ISO) || "2026-08-11";
  function daysSince(iso) {
    if (!iso) return 0;
    const a = iso.split("-"), b = TODAY.split("-");
    return Math.max(0, Math.round(
      (Date.UTC(+b[0], +b[1] - 1, +b[2]) - Date.UTC(+a[0], +a[1] - 1, +a[2])) / 86400000));
  }

  /* ============================================================
     THE ONLY WAY OFF THIS SCREEN (designer: "no full box hover state,
     only text next to an arrow icon to view more").

     The padding is the touch target and the equal negative margin
     gives it back to the layout, so the link sits on the baseline it
     reads on and is still 31px tall.
     ============================================================ */
  function GoLink({ label, aria, onClick }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <button
        type="button" onClick={onClick} aria-label={aria || label}
        style={ty("small", {
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "none", border: "none", padding: "6px 4px", margin: "-6px -4px",
          color: c.action, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
        })}
      >
        <span style={{ textDecoration: "underline", textUnderlineOffset: 3, textDecorationThickness: 1 }}>{label}</span>
        <span aria-hidden="true" style={{ display: "flex" }}><Icon name="arrow" size={13} /></span>
      </button>
    );
  }

  /* ---- the parts every panel on this board is built from ---- */

  function Panel({ span, label, children, style }) {
    const { c } = useTheme();
    return (
      <section aria-label={label} style={Object.assign({
        gridColumn: "span " + span, minWidth: 0,
        border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
        padding: "17px 19px 18px", display: "flex", flexDirection: "column",
      }, style || {})}>
        {children}
      </section>
    );
  }

  /* THE MARK WRAPS, THE NAME DOES NOT TRUNCATE. A campus is not
     "Whitefiel..." because a status pill wanted the room, so the head
     is a wrapping row and the mark drops under the name when the
     column is too narrow to hold both. */
  function PHead({ icon, tone, name, right }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 9, rowGap: 8, flexWrap: "wrap", marginBottom: 13,
      }}>
        <span aria-hidden="true" style={{
          width: 26, height: 26, borderRadius: G3.r.pill, flexShrink: 0,
          background: tone ? tone.tint : c.sunken, color: tone ? tone.fg : c.inkMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} size={15} />
        </span>
        <span style={ty("small", { color: c.ink, fontWeight: 700, minWidth: 0 })}>{name}</span>
        {right ? <span style={{ marginInlineStart: "auto", flexShrink: 0 }}>{right}</span> : null}
      </div>
    );
  }

  /* THE FIGURE, AND THE LINE THAT SAYS WHAT THE FIGURE CANNOT */
  function Fig({ v, unit, note, size, warn }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
          <span style={G3.fig(size || "xl", { color: warn ? c.dangerText : c.ink, fontWeight: 700, lineHeight: 1 })}>{v}</span>
          {unit ? <span style={ty("small", { color: c.inkMuted })}>{unit}</span> : null}
        </div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 6 })}>{note}</div> : null}
      </div>
    );
  }

  function Rule() {
    const { c } = useTheme();
    return <div style={{ borderTop: "1px solid " + c.rule, marginTop: 15 }} />;
  }

  /* HOW FAR THROUGH IT IS. One bar, one whole: a caption, the count
     against its total, and the meter under both. */
  function Gauge({ label, value, frac, bar, note, noteWarn }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ marginTop: 15 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <span style={ty("caption", { color: c.inkMuted })}>{label}</span>
          <span style={G3.fig("sm", { color: c.ink, fontWeight: 700, whiteSpace: "nowrap" })}>{value}</span>
        </div>
        <div style={{ marginTop: 6 }}>
          <Meter frac={frac} bar={bar} height={8} label={label} />
        </div>
        {note ? (
          <div style={ty("caption", { color: noteWarn ? c.lateText : c.inkFaint, marginTop: 8, fontWeight: noteWarn ? 600 : 400 })}>
            {note}
          </div>
        ) : null}
      </div>
    );
  }

  /* WHAT IT IS MADE OF. One bar, many parts, and every part is the
     same kind of thing -- which is the only way a stacked bar means
     anything. The rows beneath carry their segment's colour so the
     two read as one object. */
  function Split({ parts }) {
    const { c } = useTheme();
    const whole = parts.reduce(function (s, p) { return s + p.v; }, 0) || 1;
    return (
      <div
        role="img" aria-label={parts.map(function (p) { return p.label + " " + p.v; }).join(", ")}
        style={{ display: "flex", height: 10, borderRadius: G3.r.pill, overflow: "hidden", background: c.gutter, marginTop: 15 }}
      >
        {parts.map(function (p) {
          return <span key={p.k} aria-hidden="true" style={{ flex: p.v / whole, background: p.tone }} />;
        })}
      </div>
    );
  }

  /* WHAT THE SPLIT IS MADE OF, IN WORDS. A stacked bar with no names
     beside it is a decoration; the dot carries the segment's colour so
     the row and the bar are one object and the reader never has to
     match a legend to a chart by position. */
  function DotRows({ rows, right }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ marginTop: 4 }}>
        {rows.map(function (r, i) {
          return (
            <div key={r.k} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 0 8px", borderTop: i ? "1px solid " + c.rule : "none",
            }}>
              {r.tone ? (
                <span aria-hidden="true" style={{
                  width: 9, height: 9, borderRadius: G3.r.pill, flexShrink: 0, background: r.tone,
                }} />
              ) : null}
              <span style={ty("small", { color: c.ink, fontWeight: 600, flex: 1, minWidth: 0 })}>{r.label}</span>
              {r.side ? <span style={ty("caption", { color: c.inkFaint, flexShrink: 0 })}>{r.side}</span> : null}
              <span style={G3.fig("sm", {
                color: r.warn && r.v > 0 ? c.dangerText : c.ink, fontWeight: 700,
                flex: "0 0 " + (right || 44) + "px", textAlign: "end",
              })}>{r.display != null ? r.display : num(r.v)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  /* a line under a panel's figures -- the rule that governs them */
  function PFoot({ children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ borderTop: "1px solid " + c.rule, marginTop: 14, paddingTop: 11 }}>
        <span style={ty("caption", { color: c.inkFaint })}>{children}</span>
      </div>
    );
  }

  /* the one way onward, pinned to the bottom of a panel so five
     panels of different heights still line their links up */
  function Foot({ children }) {
    return (
      <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
        {children}
      </div>
    );
  }

  function Shell({ role, onNavigate, title, q, chips, campus, onCampus, children }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "payrollOfficer"} active="pyHome" onNavigate={onNavigate} initials="SK" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("pyh.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
                <span>{t("pyh.entity")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
                <span>{campusLabel(t, campus)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {onCampus ? <CampusSwitch value={campus} onChange={onCampus} /> : null}
                <ThemeToggle />
              </div>
            </div>
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

  /* A HEADING ONLY WHERE SEVERAL PANELS ARE ONE SUBJECT.

     The board used to bundle five unrelated registers under "the rest
     of the desk", which told the reader nothing except that the
     designer had run out of places to put them (designer, 2026-10-26:
     "do not categorise all the sections into this one section ...
     design the sections individually distinct"). A panel names
     itself; only the three campus panels need a heading above them,
     because they are three parts of ONE run. It spans the grid so the
     whole board stays on one set of columns. */
  function GridHead({ title, sub, go, first }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{
        gridColumn: "1 / -1", display: "flex", alignItems: "flex-end",
        justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        marginTop: first ? 0 : 8, marginBottom: -4,
      }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={ty("h3", { margin: 0, color: c.ink })}>{title}</h2>
          {sub ? <p style={ty("small", { margin: "4px 0 0", color: c.inkMuted })}>{sub}</p> : null}
        </div>
        {go || null}
      </div>
    );
  }

  /* ============================================================
     WHAT IS WAITING. The officer's morning is not organised by
     module -- it is organised by what has been sitting longest.
     ============================================================ */
  function here(campus, rows) {
    return rows.filter(function (r) {
      const code = r.staff || (r.e && r.e.staff) || r.id;
      return inCampus(campus, campusOfCode(code));
    });
  }

  function waitingRows(campus) {
    const out = [];
    function byBatchPending(kind) {
      return Q ? here(campus, Q.byKind(kind)).filter(function (r) { return r.state === "withPayroll"; }) : [];
    }
    function oldest(rows, pick) {
      return rows.reduce(function (m, r) { return Math.max(m, daysSince(pick(r))); }, 0);
    }
    function hrOn(r) { return r.hr ? r.hr.on : r.raisedIso; }

    [
      { k: "claims", kind: "claim", to: "pyAdjust", when: hrOn },
      { k: "loans", kind: "loan", to: "pyAdjust", when: hrOn },
      { k: "ot", kind: "ot", to: "pyAdjust", when: hrOn },
      { k: "rises", kind: "rise", to: "pyAdjust", when: function (r) { return r.raisedIso; } },
    ].forEach(function (q) {
      const rows = byBatchPending(q.kind);
      if (rows.length) out.push({ k: q.k, n: rows.length, to: q.to, days: oldest(rows, q.when) });
    });

    const unpriced = H ? here(campus, H.pending()) : [];
    if (unpriced.length) {
      out.push({ k: "unpriced", n: unpriced.length, to: "pyPeople", days: 0, urgent: true });
    }
    const notStarted = X ? here(campus, X.allNotStarted()) : [];
    if (notStarted.length) {
      out.push({ k: "exits", n: notStarted.length, to: "pyExits",
        days: oldest(notStarted, function (e) { return e.lwdIso; }), urgent: true });
    }
    return out.sort(function (a, b) { return b.days - a.days; });
  }

  /* the exits already past a statutory clock. Late is not pending
     and is not drawn as pending. */
  function lateExits(campus) {
    if (!X) return [];
    const CLOCKS = [
      { key: "wages", days: 2 }, { key: "epf", days: 20 }, { key: "gratuity", days: 30 },
    ];
    return here(campus, X.allExits()).filter(function (e) { return e.state !== "paid"; }).map(function (e) {
      const elapsed = X.daysBetween(e.lwdIso, X.TODAY_ISO);
      const over = CLOCKS.map(function (ck) { return { key: ck.key, over: elapsed - ck.days }; })
        .filter(function (x) { return x.over > 0; })
        .sort(function (a, b) { return b.over - a.over; })[0];
      return over ? { e: e, clock: over.key, over: over.over } : null;
    }).filter(Boolean).sort(function (a, b) { return b.over - a.over; });
  }

  function stateMark(t, st) {
    if (st === "paid") return <StatusMark role="present" glyph="check" word={t("pyr.st.paid")} />;
    if (st === "sent") return <StatusMark role="leave" glyph="lock" word={t("pyr.st.sent")} />;
    if (st === "checking") return <StatusMark role="late" glyph="clock" word={t("pyr.st.checking")} />;
    if (st === "blocked") return <StatusMark role="missing" glyph="alert" word={t("pyr.st.blocked")} />;
    return <StatusMark role="off" glyph="arrow" word={t("pyr.st.none")} />;
  }

  function campusName(t, id) {
    return id === "yelahanka" ? t("pyr.c.yelahanka") : campusLabel(t, id);
  }

  function PYHome({ role, onNavigate }) {
    /* the officer holds both campuses; everything below answers this */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t, ty } = useLang();
    Q && Q.usePayRequests();
    ST && ST.use();
    const go = function (k) { if (onNavigate) onNavigate(k); };

    if (!D || !R || !ST) {
      return (
        <Shell campus={campus} onCampus={setCampus} role={role} onNavigate={onNavigate} title={t("pyh.none")} q="">
          <Card><EmptyState head={t("pyh.none")} /></Card>
        </Shell>
      );
    }

    const month = R.LIVE_MONTH;
    const mo = R.monthOf(month);
    const monKey = "pyr.mon." + month;
    const waiting = waitingRows(campus);
    const late = lateExits(campus);
    const waitingTotal = waiting.reduce(function (s, r) { return s + r.n; }, 0);

    /* ---- every campus, and where its August stands ---- */
    const seen = R.CAMPUSES.filter(function (cm) { return inCampus(campus, cm.id); }).map(function (cm) {
      const st = ST.stateOf(cm.id, month);
      const run = ST.get(cm.id, month);
      const can = !!cm.groups;
      const rows = can ? R.roll(cm.id, month) : [];
      /* A ROW ONLY BLOCKS A RUN SOMEBODY CAN STILL CHANGE. A campus
         with the accountant has had its answers submitted, so
         re-running the check against an empty draft would report
         problems that are no longer anybody's to fix. */
      const live = st === "checking" || st === "none";
      const work = run && run.state === "checking" ? run.work : ST.emptyWork();
      const blocking = live ? rows.filter(function (r) { return ST.needsFix(r, work); }) : [];
      const hrN = blocking.filter(function (r) { return r.issue && r.issue.owner === "hr"; }).length;
      return {
        cm: cm, st: st, run: run, can: can, live: live,
        heads: can ? rows.length : (cm.roll || 0),
        totals: can ? R.totals(cm.id, month) : null,
        pay: run ? ST.payableOf(cm.id, month) : 0,
        blocking: blocking.length, hrN: hrN, mineN: blocking.length - hrN,
      };
    });

    const heads = seen.reduce(function (s, x) { return s + (x.can ? x.heads : 0); }, 0);

    function openRun(id) {
      window.Pages3 = window.Pages3 || {};
      window.Pages3.pyRunAt = { campus: id, month: month };
      go("pyRunOpen");
    }

    /* ---- EACH REGISTER ON THE DESK, AND THE SHAPE ITS OWN SUBJECT
         WANTS. Adjustments and the roll are populations, so each is a
         split; exits are a sequence, so they are a split in the order
         a settlement travels; pay rules are three named things, so
         they are three rows; registers are a readiness, so they are a
         gauge. Five panels, five questions, one vocabulary. ---- */

    /* what the school is recovering, by kind */
    const actives = A ? A.LOANS_ACTIVE : [];
    const adjParts = [
      { k: "loan", label: t("pyh.mod.loans"), tone: c.chartBlue,
        v: actives.filter(function (l) { return l.kind !== "advance"; }).length },
      { k: "adv", label: t("pyh.mod.advances"), tone: c.chartTeal,
        v: actives.filter(function (l) { return l.kind === "advance"; }).length },
      { k: "arr", label: t("pyh.mod.arrears"), tone: c.chartSand, v: A ? A.ARREARS.length : 0 },
    ].filter(function (p) { return p.v > 0; });
    const adjTotal = adjParts.reduce(function (n, p) { return n + p.v; }, 0);

    /* the roll, by the rule each person is priced by -- summed from
       the campuses in scope rather than from the trust-wide table, or
       the split would not move when the switch does */
    const GROUP_TONE = [c.chartBlue, c.chartTeal, c.chartPurple, c.chartSand];
    const groupMap = {};
    const groupParts = [];
    seen.forEach(function (x) {
      if (!x.can) return;
      R.byGroup(x.cm.id, month).forEach(function (g) {
        if (!groupMap[g.key]) {
          groupMap[g.key] = { k: g.key, label: t(g.nameKey), v: 0, tone: GROUP_TONE[groupParts.length % 4] };
          groupParts.push(groupMap[g.key]);
        }
        groupMap[g.key].v += g.heads;
      });
    });

    /* a settlement in the order it travels: started, computed, with
       the checker, approved -- "not started" is waiting, "approved" is
       done, and the two in between are plain stages */
    const EXIT_STAGES = [
      { k: "notStarted", tone: c.chartAmber }, { k: "computed", tone: c.chartBlue },
      { k: "awaiting", tone: c.chartPurple }, { k: "approved", tone: c.chartGreen },
    ];
    const openExits = X ? here(campus, X.allExits()).filter(function (e) { return e.state !== "paid"; }) : [];
    const exitParts = EXIT_STAGES.map(function (st) {
      return { k: st.k, label: t("pyx.st." + st.k), tone: st.tone,
        v: openExits.filter(function (e) { return e.state === st.k; }).length };
    }).filter(function (p) { return p.v > 0; });


    /* one colour per kind of waiting work, carried by the bar and by
       the dot on the row beneath it. Plain categories take plain
       colours; the one that stops a run takes the red. */
    const WAIT_TONE = {
      exits: c.chartPurple, claims: c.chartBlue, loans: c.chartTeal,
      ot: c.chartSand, rises: c.chartAmber, unpriced: c.chartRed,
    };

    return (
      <Shell campus={campus} onCampus={setCampus}
        role={role} onNavigate={onNavigate}
        title={t(greeting(), { name: t("pyo.maker").split(" ")[0] })}
        chips={[
          <Chip key="m" bg={c.sunken} fg={c.inkMuted}>{t(monKey) + " " + (mo ? mo.y : "")}</Chip>,
          <Chip key="c" bg={c.sunken} fg={c.inkMuted}>{t("pyh.cfg", { v: D.CFG_JUL.v })}</Chip>,
        ]}
      >
        {/* ONE GRID FOR THE WHOLE BOARD. Six columns, every panel on
            the same rhythm, so the edges line up down the page instead
            of each section finding its own width -- and a panel can be
            given the width its subject needs rather than the width its
            neighbours happen to have. */}
        <div style={{
          display: "grid", alignItems: "stretch", gap: G3.layout.gap,
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        }}>

          {/* ---- 2 · the run, campus by campus ---- */}
          <GridHead
            first
            title={t("pyh.run.head", { mon: t(monKey) })}
            sub={t("pyh.run.sub", { mon: t(monKey) })}
            go={<GoLink label={t("pyh.run.all")} onClick={function () { go("pyRun"); }} />}
          />
          {seen.map(function (x) {
            const name = campusName(t, x.cm.id);
            const ready = x.heads - x.blocking;
            return (
              <Panel key={x.cm.id} span={2} label={name}>
                <PHead icon="payroll" name={name} right={stateMark(t, x.st)} />
                <Fig
                  v={x.run ? inr(x.pay) : "—"}
                  note={x.run
                    ? t("pyh.cp.people", { n: num(x.heads), how: t("pyr.mode." + x.run.mode) })
                    : t("pyh.cp.peopleBare", { n: num(x.heads) })}
                />
                {/* A METER OF NOTHING IS NOT A METER. A campus with no pay
                    group has no roll to be ready, so it gets the reason
                    instead of an empty bar. */}
                {!x.can ? (
                  <div style={{
                    marginTop: 15, borderRadius: G3.r.sm, background: c.sunken, padding: "11px 13px",
                  }}>
                    <div style={ty("caption", { color: c.ink, fontWeight: 700 })}>{t("pyh.cp.noGroup")}</div>
                    <div style={ty("caption", { color: c.inkMuted, marginTop: 3 })}>{t("pyh.cp.noGroupNote")}</div>
                  </div>
                ) : x.live ? (
                  <Gauge
                    label={t("pyh.cp.ready")}
                    value={t("pyh.cp.readyOf", { a: num(ready), b: num(x.heads) })}
                    frac={x.heads ? ready / x.heads : 0}
                    bar={x.blocking ? c.chartAmber : c.chartGreen}
                    noteWarn={x.blocking > 0}
                    note={x.blocking
                      ? t("pyh.cp.blocking", { n: num(x.blocking) }) + " — " + (
                        x.hrN && x.mineN
                          ? t("pyh.cp.blockingWho", { hr: num(x.hrN), mine: num(x.mineN) })
                          : x.hrN ? t("pyh.cp.blockingHr", { n: num(x.hrN) })
                            : t("pyh.cp.blockingMine", { n: num(x.mineN) }))
                      : t("pyh.cp.clearNote")}
                  />
                ) : (
                  <Gauge
                    label={t("pyh.cp.ready")}
                    value={t("pyh.cp.readyOf", { a: num(x.heads), b: num(x.heads) })}
                    frac={1} bar={x.st === "paid" ? c.chartGreen : c.chartBlue}
                    note={t(x.st === "paid" ? "pyh.cp.paid" : "pyh.cp.sent")}
                  />
                )}
                <Foot>
                  {!x.can ? (
                    <GoLink label={t("pyh.act.setup")} onClick={function () { go("pyRules"); }} />
                  ) : x.run ? (
                    <GoLink label={t("pyh.act.open")} aria={t("pyh.act.open") + " — " + name}
                      onClick={function () { openRun(x.cm.id); }} />
                  ) : (
                    <GoLink label={t("pyh.act.start")} aria={t("pyh.act.start") + " — " + name}
                      onClick={function () { go("pyRun"); }} />
                  )}
                </Foot>
              </Panel>
            );
          })}

          {/* ---- 3 · what is waiting, and what is already late. No
               heading over these two: a panel that names itself does
               not need a label naming it again, and the two are not
               parts of one subject. ---- */}
          <Panel span={4} label={t("pyh.wait.head")}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <PHead icon="list" name={t("pyh.wait.head")} />
                <Fig v={num(waitingTotal)} unit={t("pyh.wait.unit")} note={t("pyh.wait.note")} />
              </div>
              {waiting.length ? (
                <div style={{ textAlign: "end", flexShrink: 0 }}>
                  <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
                    {t("pyh.wait.oldest")}
                  </div>
                  <div style={G3.fig("lg", {
                    color: waiting[0].days > 14 || waiting[0].urgent ? c.dangerText : c.ink,
                    fontWeight: 700, marginTop: 5, lineHeight: 1.1,
                  })}>
                    {waiting[0].days ? t("pyh.wait.days", { n: num(waiting[0].days) }) : t("pyh.wait.today")}
                  </div>
                  <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>{t("pyh.w." + waiting[0].k)}</div>
                </div>
              ) : null}
            </div>

            {waiting.length ? (
              <React.Fragment>
                <Split parts={waiting.map(function (r) {
                  return { k: r.k, label: t("pyh.w." + r.k), v: r.n, tone: WAIT_TONE[r.k] || c.chartBlue };
                })} />
                <div style={{ marginTop: 4 }}>
                  {waiting.map(function (r, i) {
                    const stale = r.days > 14 || r.urgent;
                    return (
                      <div key={r.k} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 0 9px", borderTop: i ? "1px solid " + c.rule : "none",
                      }}>
                        <span aria-hidden="true" style={{
                          width: 9, height: 9, borderRadius: G3.r.pill, flexShrink: 0,
                          background: WAIT_TONE[r.k] || c.chartBlue,
                        }} />
                        <span style={ty("small", { color: c.ink, fontWeight: 600, flex: 1, minWidth: 0 })}>
                          {t("pyh.w." + r.k)}
                        </span>
                        <span style={G3.fig("sm", { color: c.ink, fontWeight: 700, flex: "0 0 34px", textAlign: "end" })}>
                          {num(r.n)}
                        </span>
                        {/* A QUEUE WITH NO DATE MAY NOT CLAIM ONE. Nothing
                            records when somebody stopped having a salary. */}
                        <span style={ty("caption", {
                          color: stale ? c.dangerText : c.inkMuted, fontWeight: stale ? 700 : 400,
                          flex: "0 0 96px", textAlign: "end",
                        })}>
                          {r.days ? t("pyh.wait.days", { n: num(r.days) })
                            : t(r.urgent ? "pyh.wait.blocks" : "pyh.wait.today")}
                        </span>
                        <span style={{ flex: "0 0 152px", display: "flex", justifyContent: "flex-end" }}>
                          <GoLink
                            label={t("pyh.mod." + (r.to === "pyAdjust" ? "adjust" : r.to === "pyPeople" ? "people" : "exits"))}
                            aria={t("pyh.more.aria", { what: t("pyh.w." + r.k) })}
                            onClick={function () { go(r.to); }} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ) : (
              <div style={{ marginTop: 10 }}>
                <EmptyState compact head={t("pyh.wait.none")} body={t("pyh.wait.noneBody")} />
              </div>
            )}
          </Panel>

          <Panel span={2} label={t("pyh.late.head")}>
            <PHead icon="alert" name={t("pyh.late.head")}
              tone={late.length ? { tint: c.dangerTint, fg: c.dangerText } : { tint: c.presentTint, fg: c.presentText }} />
            {late.length ? (
              <React.Fragment>
                <Fig v={num(late.length)} unit={t("pyh.late.unit")} note={t("pyh.late.note")} warn />
                <div>
                  {late.slice(0, 4).map(function (x) {
                    return (
                      <div key={x.e.staff} style={{ marginTop: 13 }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                          <span style={ty("caption", { color: c.inkMuted, minWidth: 0 })}>
                            {t(x.e.personKey)} · {t("pyx.clock." + x.clock)}
                          </span>
                          <span style={G3.fig("xs", { color: c.dangerText, fontWeight: 700, whiteSpace: "nowrap" })}>
                            {t("pyh.late.over", { n: num(x.over) })}
                          </span>
                        </div>
                        <div style={{ marginTop: 5 }}>
                          <Meter frac={Math.min(1, x.over / 60)} bar={c.chartRed} height={7} label={t(x.e.personKey)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Rule />
                <div style={ty("caption", { color: c.inkFaint, marginTop: 11 })}>{t("pyh.late.rule")}</div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Fig v={num(0)} unit={t("pyh.late.unit")} note={t("pyh.late.cleanNote")} />
                <div style={ty("small", { color: c.presentText, fontWeight: 600, marginTop: 13 })}>
                  {t("pyh.late.clean")}
                </div>
              </React.Fragment>
            )}
            <Foot><GoLink label={t("pyh.late.go")} onClick={function () { go("pyExits"); }} /></Foot>
          </Panel>

          {/* ---- 4 · THE DESK'S OWN REGISTERS. Not "the rest" -- four
               different subjects, each in a panel of its own, each
               given the shape its question wants. ---- */}

          {/* what is being recovered, by kind */}
          <Panel span={3} label={t("pyh.mod.adjust")}>
            <PHead icon="list" name={t("pyh.mod.adjust")} />
            <Fig v={num(adjTotal)} unit={t("pyh.mod.adjustUnit")} note={t("pyh.mod.adjustNote")} size="lg" />
            {adjParts.length ? (
              <React.Fragment>
                <Split parts={adjParts} />
                <DotRows rows={adjParts} />
              </React.Fragment>
            ) : null}
            {A ? <PFoot>{t("pyh.mod.adjustFoot", { v: inr(A.LOAN_RUN_TOTAL), mon: t(monKey) })}</PFoot> : null}
            <Foot>
              <GoLink label={t("pyh.more")} aria={t("pyh.more.aria", { what: t("pyh.mod.adjust") })}
                onClick={function () { go("pyAdjust"); }} />
            </Foot>
          </Panel>

          {/* the roll, by the rule each person is priced by */}
          <Panel span={3} label={t("pyh.mod.people")}>
            <PHead icon="staff" name={t("pyh.mod.people")} />
            <Fig v={num(heads)} unit={t("pyh.mod.peopleUnit")} note={t("pyh.mod.peopleNote")} size="lg" />
            {groupParts.length ? (
              <React.Fragment>
                <Split parts={groupParts} />
                <DotRows rows={groupParts} right={54} />
              </React.Fragment>
            ) : null}
            <PFoot>{t("pyh.mod.peopleFoot")}</PFoot>
            <Foot>
              <GoLink label={t("pyh.more")} aria={t("pyh.more.aria", { what: t("pyh.mod.people") })}
                onClick={function () { go("pyPeople"); }} />
            </Foot>
          </Panel>

          {/* a settlement, in the order it travels */}
          <Panel span={3} label={t("pyh.mod.exits")}>
            <PHead icon="briefcase" name={t("pyh.mod.exits")} />
            <Fig v={num(openExits.length)} unit={t("pyh.mod.exitsUnit")} note={t("pyh.mod.exitsNote")} size="lg" />
            {exitParts.length ? (
              <React.Fragment>
                <Split parts={exitParts} />
                <DotRows rows={exitParts} />
              </React.Fragment>
            ) : null}
            <PFoot>{t("pyh.mod.exitsFoot")}</PFoot>
            <Foot>
              <GoLink label={t("pyh.more")} aria={t("pyh.more.aria", { what: t("pyh.mod.exits") })}
                onClick={function () { go("pyExits"); }} />
            </Foot>
          </Panel>

          {/* three named things, so three rows and no bar */}
          <Panel span={3} label={t("pyh.mod.rules")}>
            <PHead icon="payslip" name={t("pyh.mod.rules")} />
            <Fig v={num(D.GROUPS.length)} unit={t("pyh.mod.rulesUnit")} note={t("pyh.mod.rulesNote")} size="lg" />
            <div style={{ marginTop: 11 }}>
              <DotRows right={64} rows={D.GROUPS.map(function (g) {
                return {
                  k: g.key, label: t(g.nameKey), v: g.heads,
                  display: t("pyh.mod.staffUnit", { n: num(g.heads) }),
                };
              })} />
            </div>
            <PFoot>{t("pyh.mod.rulesFoot", { v: D.CFG_JUL.v })}</PFoot>
            <Foot>
              <GoLink label={t("pyh.more")} aria={t("pyh.more.aria", { what: t("pyh.mod.rules") })}
                onClick={function () { go("pyRules"); }} />
            </Foot>
          </Panel>

        </div>
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.PYHome = PYHome;
  window.Pages3.PYHomeStrings = true;
})();
