/* @jsxRuntime classic */
/* ============================================================
   Naveya — the payroll runs · window.Pages3.PYRun

   WHAT THIS SCREEN IS NOW. A year of months, and for the month you
   pick, one row per campus: how many people, what it pays, how it is
   being run, where it has got to, and the one thing you can do about
   it. Opening a run LEAVES this screen for one of its own
   (pages/py-runopen.jsx) -- the designer's ruling, and the right
   shape: a run is a place you work in for an hour, not a panel that
   unfolds inside a list.

   STARTING A RUN IS A DECISION, NOT A BUTTON (designer, 2026-10-15):
   "when starting a payroll run the user gets prompted whether he
   wants the automated payroll on the system or a manual payroll run".

   So Start asks which, in two sentences each, and the answer is fixed
   for that run:

     On Naveya         the roll on screen -- ask HR, pay a bill, skip
                       an instalment -- and send when nothing blocks.
     In a spreadsheet  Naveya hands over every row; the school fills
                       it in wherever it fills it in and hands it back.

   AND ANY MONTH CAN BE STARTED. The strip used to offer Start on
   August alone, which made the other eleven months decoration. A
   month that has not been paid and has not been started can be
   started; a run opened ahead of its month says plainly that it is
   standing on today's people until that month has happened.

   WHERE THE STATE LIVES. Not here. v3/payrun-store.jsx holds every
   run and the work saved into it, so this list and the run screen
   cannot hold two opinions about what a campus owes.

   SPEC — docs/development-specification.md M10; screen-inventory PY-07.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useRef, useEffect } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, StatusMark, Icon,
    EmptyState, Modal, inr, num, campusLabel,
  } = UI;

  const R = window.NaveyaRoll;
  const ST = window.NaveyaPayRuns;
  const D = (window.Pages3 && window.Pages3.PYRunData) || null;
  const LIVE = R ? R.LIVE_MONTH : 8;

  function campusName(t, id) {
    return id === "yelahanka" ? t("pyr.c.yelahanka") : campusLabel(t, id);
  }

  addStrings({
    en: {
      "pyr.crumb": "Payroll",
      "pyr.entity": "Naveya Vidya Trust — Bengaluru",
      "pyr.title": "Payroll run",
      "pyr.cancel": "Cancel",
      "pyr.c.yelahanka": "Yelahanka",

      /* ---- months ---- */
      "pyr.mon.4": "April", "pyr.mon.5": "May", "pyr.mon.6": "June",
      "pyr.mon.7": "July", "pyr.mon.8": "August", "pyr.mon.9": "September",
      "pyr.mon.10": "October", "pyr.mon.11": "November", "pyr.mon.12": "December",
      "pyr.mon.13": "January", "pyr.mon.14": "February", "pyr.mon.15": "March",
      "pyr.ms.4": "Apr", "pyr.ms.5": "May", "pyr.ms.6": "Jun",
      "pyr.ms.7": "Jul", "pyr.ms.8": "Aug", "pyr.ms.9": "Sep",
      "pyr.ms.10": "Oct", "pyr.ms.11": "Nov", "pyr.ms.12": "Dec",
      "pyr.ms.13": "Jan", "pyr.ms.14": "Feb", "pyr.ms.15": "Mar",
      "pyr.my.paid": "Paid",
      "pyr.my.live": "This month",
      "pyr.my.ahead": "Not yet",
      "pyr.my.aria": "Payroll months",
      "pyr.my.back": "Earlier months",
      "pyr.my.fwd": "Later months",
      "pyr.my.range": "{a}–{b} {mon}",

      /* ---- the figures ---- */
      "pyr.band.head": "{mon} {y}",
      "pyr.list.line": "{n} on your desk · {done} sent or paid",
      "pyr.list.lineDone": "{done} of {all} sent or paid",

      /* ---- the list ---- */
      "pyr.list.sub": "One run per campus, each month.",
      "pyr.col.campus": "Campus",
      "pyr.col.people": "People",
      "pyr.col.pay": "To pay",
      "pyr.col.how": "How it is run",
      "pyr.col.where": "Where it is",
      "pyr.list.total": "All campuses",
      "pyr.st.none": "Not started",
      "pyr.st.checking": "Checking",
      "pyr.st.sent": "With accountant",
      "pyr.st.paid": "Paid",
      "pyr.st.blocked": "Cannot run",
      "pyr.mode.auto": "On Naveya",
      "pyr.mode.manual": "In a spreadsheet",
      "pyr.act.start": "Start",
      "pyr.act.open": "Open",
      "pyr.noGroup": "No pay group covers this campus yet.",
      "pyr.noGroup.fix": "Set up a pay group",
      "pyr.started": "{campus} started for {mon}.",

      /* ---- starting ---- */
      "pyr.go.title": "Start {campus} for {mon}",
      "pyr.go.body": "Pick how this run is done. It cannot be changed once the run has started.",
      "pyr.go.auto": "On Naveya",
      "pyr.go.auto.body": "Work the roll on screen: ask HR about a wrong row, pay a bill, skip an instalment, and send when nothing is left blocking.",
      "pyr.go.auto.for": "Best when Naveya already holds the attendance and the salaries.",
      "pyr.go.manual": "In a spreadsheet",
      "pyr.go.manual.body": "Naveya hands over every row. Fill the sheet in wherever you fill it in, upload it back, and send what it says.",
      "pyr.go.manual.for": "Best when the figures are settled somewhere else first.",
      "pyr.go.go": "Start the run",

      "pyr.none.body": "Try another month.",
    },
  });

  /* ============================================================
     SHELL
     ============================================================ */
  function Shell({ role, onNavigate, children }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "payrollOfficer"} active="pyRun" onNavigate={onNavigate} initials="SK" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto",
                        padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
              <p style={ty("caption", { margin: 0, color: c.inkFaint })}>
                <strong style={{ color: c.ink }}>{t("pyr.crumb")}</strong> · {t("pyr.entity")}
              </p>
              <ThemeToggle />
            </div>
            {children}
          </div>
        </main>
      </div>
    );
  }

  function Flash({ said }) {
    const { c } = useTheme();
    const { ty } = useLang();
    if (!said) return null;
    return (
      <div role="status" aria-live="polite" style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
        background: c.presentTint, border: "1px solid " + c.border,
        borderRadius: G3.r.md, padding: "11px 15px",
      }}>
        <span aria-hidden="true" style={{ display: "flex", color: c.presentText }}><Icon name="check" size={15} /></span>
        <span style={ty("small", { color: c.presentText, fontWeight: 600 })}>{said}</span>
      </div>
    );
  }

  /* ============================================================
     THE MONTHS

     Twelve cells, April to March, each saying what it is rather than
     only what it is called. The strip scrolls; the arrows move it
     three months at a time and rest on whole cards, and the month on
     the desk is scrolled into view when the screen opens.
     ============================================================ */
  function MonthStrip({ at, onPick }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const box = useRef(null);
    const cell = useRef({});
    /* a cell and its gap: every resting position is a multiple of it,
       so the strip never opens on half a month */
    const STEP = 140;

    useEffect(function () {
      const el = cell.current[at];
      const wrap = box.current;
      if (!el || !wrap) return;
      const want = el.offsetLeft - (wrap.clientWidth - el.clientWidth) / 2;
      wrap.scrollLeft = Math.max(0, Math.round(want / STEP) * STEP);
    }, []);

    function nudge(dir) {
      const wrap = box.current;
      if (!wrap) return;
      const k = Math.round(wrap.scrollLeft / STEP) + dir * 3;
      wrap.scrollLeft = Math.max(0, k * STEP);
    }

    const arrow = {
      border: "1px solid " + c.border, background: c.surface, color: c.inkMuted,
      width: 34, height: 34, borderRadius: "50%", cursor: "pointer", flex: "0 0 auto",
      display: "flex", alignItems: "center", justifyContent: "center",
    };

    return (
      <div style={{ display: "flex", alignItems: "stretch", gap: 10, marginBottom: 18 }}>
        <button type="button" aria-label={t("pyr.my.back")} onClick={function () { nudge(-1); }}
          style={Object.assign({ alignSelf: "center", transform: "rotate(180deg)" }, arrow)}>
          <Icon name="arrow" size={15} />
        </button>
        <div
          ref={box} role="tablist" aria-label={t("pyr.my.aria")}
          style={{ display: "flex", gap: 8, overflowX: "auto", scrollBehavior: "smooth", padding: "2px 2px 6px", flex: 1, minWidth: 0 }}
        >
          {R.MONTHS.map(function (mo) {
            const st = R.monthState(mo.m);
            const on = mo.m === at;
            const dim = st === "ahead";
            return (
              <button
                key={mo.m} type="button" role="tab" aria-selected={on ? "true" : "false"}
                ref={function (el) { cell.current[mo.m] = el; }}
                onClick={function () { onPick(mo.m); }}
                style={{
                  flex: "0 0 auto", width: 132, textAlign: "left", cursor: "pointer",
                  border: "1px solid " + (on ? c.accent : c.border),
                  borderBottom: "3px solid " + (on ? c.accent : "transparent"),
                  background: on ? c.accentSoft : dim ? c.alt : c.surface,
                  borderRadius: G3.r.md, padding: "10px 12px 9px",
                }}
              >
                <span style={ty("small", { display: "block", color: on ? c.accent : dim ? c.inkFaint : c.ink, fontWeight: 700 })}>
                  {t("pyr.ms." + mo.m)} {mo.y}
                </span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>
                  {t("pyr.my.range", { a: "1", b: String(mo.days), mon: t("pyr.ms." + mo.m) })}
                </span>
                <span style={ty("caption", {
                  display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6,
                  color: st === "paid" ? c.presentText : st === "live" ? c.lateText : c.inkFaint,
                  fontWeight: 600,
                })}>
                  <span aria-hidden="true" style={{ display: "flex" }}>
                    <Icon name={st === "paid" ? "check" : st === "live" ? "clock" : "arrow"} size={11} />
                  </span>
                  {t("pyr.my." + st)}
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" aria-label={t("pyr.my.fwd")} onClick={function () { nudge(1); }}
          style={Object.assign({ alignSelf: "center" }, arrow)}>
          <Icon name="arrow" size={15} />
        </button>
      </div>
    );
  }

  function stateMark(t, st) {
    if (st === "paid") return <StatusMark role="present" glyph="check" word={t("pyr.st.paid")} />;
    if (st === "sent") return <StatusMark role="leave" glyph="lock" word={t("pyr.st.sent")} />;
    if (st === "checking") return <StatusMark role="late" glyph="clock" word={t("pyr.st.checking")} />;
    if (st === "blocked") return <StatusMark role="missing" glyph="alert" word={t("pyr.st.blocked")} />;
    return <StatusMark role="off" glyph="arrow" word={t("pyr.st.none")} />;
  }

  /* ============================================================
     HOW A RUN IS DONE — asked once, at the start, and never again.

     Not a setting on a settings screen: it changes what the next hour
     of work looks like, so it is asked at the moment somebody commits
     to that hour, with both answers written out in full.
     ============================================================ */
  function StartPanel({ campus, month, onClose, onGo }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [mode, setMode] = useState("auto");

    const choices = [
      { k: "auto", icon: "payroll", head: t("pyr.go.auto"), body: t("pyr.go.auto.body"), who: t("pyr.go.auto.for") },
      { k: "manual", icon: "download", head: t("pyr.go.manual"), body: t("pyr.go.manual.body"), who: t("pyr.go.manual.for") },
    ];

    return (
      <Modal
        title={t("pyr.go.title", { campus: campusName(t, campus), mon: t("pyr.mon." + month) })}
        sub={t("pyr.go.body")}
        width={620}
        onClose={onClose}
        footer={
          <React.Fragment>
            <Button kind="primary" iconLeft="check" onClick={function () { onGo(mode); }}>{t("pyr.go.go")}</Button>
            <LinkButton onClick={onClose}>{t("pyr.cancel")}</LinkButton>
          </React.Fragment>
        }
      >
        <div role="radiogroup" aria-label={t("pyr.go.body")} style={{ display: "grid", gap: 12 }}>
          {choices.map(function (x) {
            const on = mode === x.k;
            return (
              <button
                key={x.k} type="button" role="radio" aria-checked={on ? "true" : "false"}
                onClick={function () { setMode(x.k); }}
                style={{
                  display: "flex", gap: 14, alignItems: "flex-start", textAlign: "left", cursor: "pointer",
                  border: "1px solid " + (on ? c.accent : c.border),
                  background: on ? c.accentSoft : c.surface,
                  borderRadius: G3.r.md, padding: "15px 17px",
                }}
              >
                <span aria-hidden="true" style={{
                  flex: "0 0 auto", width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: on ? c.surface : c.sunken, color: on ? c.accent : c.inkMuted,
                }}>
                  <Icon name={x.icon} size={16} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={ty("body", { display: "block", color: on ? c.accent : c.ink, fontWeight: 700 })}>{x.head}</span>
                  <span style={ty("small", { display: "block", color: c.inkMuted, marginTop: 4 })}>{x.body}</span>
                  <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 7 })}>{x.who}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Modal>
    );
  }

  /* ============================================================
     THE LIST
     ============================================================ */
  function PYRun({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [month, setMonth] = useState(function () {
      /* a run hands its month back when it is closed, so leaving
         September's run does not drop the reader into August */
      const h = window.Pages3 && window.Pages3.pyRunMonth;
      if (h) { window.Pages3.pyRunMonth = null; return h; }
      return LIVE;
    });
    const [said, setSaid] = useState(null);
    const [starting, setStarting] = useState(null);
    if (ST) ST.use();

    if (!R || !D || !ST) {
      return (
        <Shell role={role} onNavigate={onNavigate}>
          <Card><EmptyState head={t("pyr.title")} body={t("pyr.none.body")} /></Card>
        </Shell>
      );
    }

    function open(campus) {
      window.Pages3 = window.Pages3 || {};
      window.Pages3.pyRunAt = { campus: campus, month: month };
      onNavigate && onNavigate("pyRunOpen");
    }

    /* a month ahead of the live one has no roll of its own: its
       attendance has not happened, so the list counts today's people */
    const rm = month > LIVE ? LIVE : month;
    const live = R.CAMPUSES.filter(function (cm) { return !!cm.groups; });

    const rows = R.CAMPUSES.map(function (cm) {
      const can = !!cm.groups;
      const st = ST.stateOf(cm.id, month);
      const run = ST.get(cm.id, month);
      const heads = can ? R.totals(cm.id, rm).heads : (cm.roll || 0);
      return {
        id: cm.id,
        tone: can ? null : "dim",
        cells: {
          campus: (
            <span>
              <span style={ty("small", { display: "block", color: can ? c.ink : c.inkFaint, fontWeight: 700 })}>
                {campusName(t, cm.id)}
              </span>
              {!can ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t("pyr.noGroup")}</span>
              ) : null}
            </span>
          ),
          people: can && heads ? num(heads) : "—",
          pay: run ? inr(ST.payableOf(cm.id, month)) : "—",
          how: run ? <span style={ty("small", { color: c.inkMuted })}>{t("pyr.mode." + run.mode)}</span> : "—",
          where: stateMark(t, st),
          act: !can ? (
            <LinkButton onClick={function () { onNavigate && onNavigate("pyRules"); }}>{t("pyr.noGroup.fix")}</LinkButton>
          ) : run ? (
            <Button size="sm" iconRight="arrow" onClick={function () { open(cm.id); }}>{t("pyr.act.open")}</Button>
          ) : (
            <Button size="sm" kind="primary" iconLeft="plus" onClick={function () { setStarting(cm.id); }}>{t("pyr.act.start")}</Button>
          ),
        },
      };
    });

    const heads = live.reduce(function (s, cm) { return s + R.totals(cm.id, rm).heads; }, 0);
    const money = live.reduce(function (s, cm) {
      return ST.get(cm.id, month) ? s + ST.payableOf(cm.id, month) : s;
    }, 0);
    const done = live.filter(function (cm) {
      const st = ST.stateOf(cm.id, month); return st === "sent" || st === "paid";
    }).length;
    const mine = live.filter(function (cm) { return ST.stateOf(cm.id, month) === "checking"; }).length;
    const notStarted = live.length - done - mine;
    const mo = R.monthOf(month);

    return (
      <Shell role={role} onNavigate={onNavigate}>
        <h1 style={ty("h1", { margin: "0 0 6px", color: c.ink })}>{t("pyr.title")}</h1>
        <p style={ty("small", { margin: "0 0 18px", color: c.inkMuted })}>{t("pyr.list.sub")}</p>
        <Flash said={said} />
        <MonthStrip at={month} onPick={function (m) { setMonth(m); setSaid(null); }} />

        {/* no figure strip here. This table has three rows and a
            foot that already totals them; four figures above it would
            be the same numbers again, larger. */}
        <Register
          title={t("pyr.band.head", { mon: t("pyr.mon." + month), y: mo ? mo.y : "" })}
          sub={mine
            ? t("pyr.list.line", { n: num(mine), done: num(done) })
            : t("pyr.list.lineDone", { done: num(done), all: num(live.length) })}
          columns={[
            { key: "campus", label: t("pyr.col.campus") },
            { key: "people", label: t("pyr.col.people"), align: "right", mono: true, width: 110 },
            { key: "pay", label: t("pyr.col.pay"), align: "right", mono: true, width: 190 },
            { key: "how", label: t("pyr.col.how"), width: 160 },
            { key: "where", label: t("pyr.col.where"), width: 185 },
            { key: "act", label: "", align: "right", width: 130 },
          ]}
          rows={rows}
          totals={{
            label: t("pyr.list.total"),
            cells: { people: heads ? num(heads) : "—", pay: money ? inr(money) : "—" },
          }}
        />

        {starting ? (
          <StartPanel
            campus={starting} month={month}
            onClose={function () { setStarting(null); }}
            onGo={function (mode) {
              const id = starting;
              ST.start(id, month, mode);
              setStarting(null);
              setSaid(t("pyr.started", { campus: campusName(t, id), mon: t("pyr.mon." + month) }));
              open(id);
            }}
          />
        ) : null}
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.PYRun = PYRun;
  window.Pages3.PYRunStrings = true;
})();
