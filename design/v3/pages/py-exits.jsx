/* @jsxRuntime classic */
/* ============================================================
   Naveya — Exits & settlements · window.Pages3.PYExits

   WHAT THE RESEARCH CHANGED. Asked to find out how a staff exit is
   actually handled in pay terms, the useful finding was not the list
   of components -- the screen already had those -- but that an exit
   is not ONE deadline. Three statutory clocks start on the last
   working day and run at different speeds:

     . WAGES      within two working days of exit
                  (Code on Wages 2019, s.17(2))
     . GRATUITY   within thirty days
                  (Payment of Gratuity Act 1972)
     . EPF        fifteen to twenty working days

   The old screen compressed all of that into one "days since exit"
   figure, which cannot tell an officer the thing they need: WHICH
   clock is about to be breached. Somebody eleven days out is fine on
   gratuity and eight days late on wages, and the screen said neither.
   So the clocks lead the design, and "deadline" replaces "days".

   THE SECOND FINDING was arithmetic. Leave encashment and gratuity
   are priced on WORKING days -- the month less its weekly offs, which
   the Act and settled practice put at 26. Notice recovery is priced
   on a CALENDAR month, 30. pages/py-ops.jsx used 30 for all three,
   which understated encashment by about 15%. Corrected there, and
   every line on this screen now prints the divisor it used.

   WHY IT WAS HARD TO READ. The register carried eight columns, and
   three of them stacked: the person cell held name, staff number and
   pay group; the state cell held a status mark, an access-revocation
   warning and a paid-with note; two dropdowns sat in the chips slot.
   Everything was present and nothing was prominent.

   NOW: a band, a register of six columns where each cell says one
   thing, and the settlement on a screen of its own -- opened over the
   list, titled with the person's name, leading with what we owe, what
   they owe and the net, each line carrying the formula that produced
   it. Campus became a filter rather than a column. Notice shortfall
   left the register entirely: it is a settlement line, not a tracking
   fact, and it reads properly beside the figure it reduces.

   SPEC — docs/screen-inventory.md PY-16, PY-17; M12 Business rules;
   M12 amendment C (the tenant F&F checker setting).
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark,
    Icon, EmptyState, Field, Input, Select, ActionMenu, SideScreen, BackBar,
    Avatar, StackBar, Meter, inr, num, Band,
    CampusSwitch, campusLabel, campusOptions, inCampus, inCampusKey, campusOfCode, CAMPUS_ALL,
  } = UI;

  const X = (window.Pages3 && window.Pages3.PYExitData) || null;

  /* the three clocks, in days from the last working day */
  const CLOCKS = [
    { key: "wages", days: 2, tone: "chartRed" },
    { key: "epf", days: 20, tone: "chartBlue" },
    { key: "gratuity", days: 30, tone: "chartPurple" },
  ];

  addStrings({
    en: {
      "pyx.crumb": "Payroll",
      "pyx.entity": "Naveya Vidya Trust — Bengaluru",
      "pyx.title": "Exits & settlements",
      "pyx.maker": "Sunita Kulkarni",
      "pyx.roleMaker": "Payroll Officer",
      "pyx.back": "Back to exits",

      "pyx.band": "Where the settlements stand",
      "pyx.bandSub": "An exit starts three clocks: wages within two working days, EPF in fifteen to twenty, gratuity in thirty.",
      "pyx.seg.notStarted": "Not started",
      "pyx.seg.computed": "Computed",
      "pyx.seg.awaiting": "With the checker",
      "pyx.seg.approved": "Approved",
      "pyx.seg.paid": "Paid",
      "pyx.m.open": "open settlements",
      "pyx.m.owed": "owed to leavers",
      "pyx.m.late": "past a deadline",
      "pyx.m.lateNote": "Wages were due first",
      "pyx.m.lateNone": "Every clock still has time",
      "pyx.m.soonest": "soonest deadline",
      "pyx.m.worst": "most overdue",
      "pyx.m.soonestNote": "{who}, {what}",
      "pyx.m.days": "{n} days",
      "pyx.m.overdue": "{n} days over",

      "pyx.reg.title": "Exits",
      "pyx.reg.sub": "{n} shown. A row opens that person’s settlement, where every figure carries the formula that produced it.",
      "pyx.col.who": "Who is leaving",
      "pyx.col.lwd": "Last working day",
      "pyx.col.deadline": "Next deadline",
      "pyx.col.net": "Settlement",
      "pyx.col.state": "State",
      "pyx.col.act": "Actions",
      "pyx.f.show": "Show",
      "pyx.f.open": "Still open",
      "pyx.f.all": "Everyone",
      "pyx.f.late": "Past a deadline",
      "pyx.f.clear": "Clear filters",

      "pyx.st.notStarted": "Not started",
      "pyx.st.computed": "Computed",
      "pyx.st.awaiting": "With the checker",
      "pyx.st.approved": "Approved",
      "pyx.st.paid": "Paid",
      "pyx.st.provisional": "Provisional",
      "pyx.dl.left": "{what} in {n}d",
      "pyx.dl.over": "{what} {n}d late",
      "pyx.dl.today": "{what} today",
      "pyx.dl.future": "Leaves in {n}d",
      "pyx.dl.done": "All met",
      "pyx.clock.wages": "Wages",
      "pyx.clock.gratuity": "Gratuity",
      "pyx.clock.epf": "EPF",

      "pyx.act.open": "Open the settlement",
      "pyx.act.start": "Start the settlement",
      "pyx.act.startOff": "The service record is incomplete, so gratuity cannot be computed yet.",
      "pyx.act.access": "Access is still active",
      "pyx.act.accessOff": "Their account was deactivated on the last working day.",
      "pyx.export": "Export",

      "pyx.d.m.owe": "we owe",
      "pyx.d.m.recover": "we recover",
      "pyx.d.m.net": "net payable",
      "pyx.d.m.since": "since they left",
      "pyx.d.m.sinceNote": "{n} days",
      "pyx.d.clocks": "The three clocks",
      "pyx.d.clocksSub": "All three started on {lwd}. Each has its own statute and its own deadline.",
      "pyx.d.clockLeft": "{n} days left",
      "pyx.d.clockOver": "{n} days over",
      "pyx.d.clockMet": "Met",
      "pyx.d.wagesWhy": "Code on Wages 2019, s.17(2)",
      "pyx.d.gratuityWhy": "Payment of Gratuity Act 1972",
      "pyx.d.epfWhy": "EPFO withdrawal cycle",

      "pyx.d.owe": "What we owe them",
      "pyx.d.recover": "What we recover",
      "pyx.d.net": "Net payable",
      "pyx.d.netNote": "What leaves the bank once this is approved.",
      "pyx.d.col.line": "Line",
      "pyx.d.col.how": "How it is worked out",
      "pyx.d.col.amt": "Amount",
      "pyx.d.refused": "Not payable",
      "pyx.d.statutory": "Statutory",
      "pyx.d.discretionary": "Yours to decide",

      "pyx.d.facts": "Their service",
      "pyx.d.joined": "Joined",
      "pyx.d.left": "Last working day",
      "pyx.d.served": "Continuous service",
      "pyx.d.group": "Pay group",
      "pyx.d.campus": "Campus",
      "pyx.d.cfg": "Priced on config",

      "pyx.d.actions": "What you can do",
      "pyx.d.waive": "Waive the notice recovery",
      "pyx.d.waiveWhy": "They owe {v} for {n} unserved days. Waiving it is yours to decide and the checker reads the reason.",
      "pyx.d.unwaive": "Put the notice recovery back",
      "pyx.d.exgratia": "Add an ex-gratia amount",
      "pyx.d.exgratiaWhy": "A discretionary payment on top. Statutory lines cannot be overridden; this one can.",
      "pyx.d.send": "Send for approval",
      "pyx.d.sendWhy": "{checker} releases it. You cannot approve your own settlement.",
      "pyx.d.sendSingle": "Complete the settlement",
      "pyx.d.sendSingleWhy": "Your school allows single-person completion, so this will be recorded as completed by you alone.",
      "pyx.d.blocked": "This cannot be computed yet",
      "pyx.d.blockedWhy": "Gratuity is worked out from continuous service, and the service record has a gap. Computing now would produce a figure nobody could defend.",
      "pyx.d.withChecker": "With {who} since {on}",
      "pyx.d.withCheckerWhy": "You proposed it; they release it. Nothing changes here until they answer.",
      "pyx.d.paidOn": "Paid on {on} with run {run}",
      "pyx.d.accessGap": "Their account is still active",
      "pyx.d.accessGapWhy": "They left on {on}. Access should have been revoked that day — HR owns the account, so this asks them.",
      "pyx.d.accessGo": "Ask HR to revoke it",
      "pyx.d.accessAsked": "Asked HR to revoke the account.",

      "pyx.wv.title": "Waive the notice recovery",
      "pyx.wv.body": "They served {served} of {contract} days. Waiving gives up the {v} this would have recovered, and the settlement goes up by the same amount.",
      "pyx.wv.reason": "Why",
      "pyx.wv.reasonPh": "A sentence is enough.",
      "pyx.wv.go": "Waive it",
      "pyx.wv.done": "Notice recovery waived. The net is now {v}.",
      "pyx.eg.title": "Add an ex-gratia amount",
      "pyx.eg.body": "A discretionary payment on top of what is owed. It is not statutory, so it is yours to set and the checker reads it.",
      "pyx.eg.amount": "Amount",
      "pyx.eg.go": "Add it",
      "pyx.eg.done": "Ex-gratia of {v} added. The net is now {v2}.",
      "pyx.sd.title": "Send this settlement for approval",
      "pyx.sd.body": "{name}’s settlement comes to {v}. {checker} receives it and releases it; you cannot approve your own.",
      "pyx.sd.single": "Your school allows single-person completion. This will be recorded as completed by you alone, not as an approval.",
      "pyx.sd.go": "Send it",
      "pyx.sd.goSingle": "Complete it",
      "pyx.sd.done": "Sent to {checker}.",
      "pyx.cancel": "Cancel",
      "pyx.none": "No exits match these filters",
      "pyx.noneBody": "Clear the filters to see everyone who has left.",
    },
  });

  /* ------------------------------------------------------------
     THE CLOCKS. Everything about urgency on this screen derives
     from these three, so they are computed once, here, and the
     register and the record both read the same answer.
     ------------------------------------------------------------ */
  function clocksFor(e) {
    const elapsed = X.daysBetween(e.lwdIso, X.TODAY_ISO);   /* +ve once they have left */
    return CLOCKS.map(function (ck) {
      return {
        key: ck.key, tone: ck.tone, limit: ck.days,
        elapsed: elapsed,
        left: ck.days - elapsed,          /* -ve once breached */
        met: e.state === "paid",
      };
    });
  }
  /* the one an officer should act on: the breached clock that is
     furthest past, else the nearest one still running */
  function nextClock(e) {
    const all = clocksFor(e);
    if (e.state === "paid") return null;
    const over = all.filter(function (ck) { return ck.left < 0; });
    if (over.length) return over.sort(function (a, b) { return a.left - b.left; })[0];
    return all.sort(function (a, b) { return a.left - b.left; })[0];
  }
  function isLate(e) {
    const ck = nextClock(e);
    return !!ck && ck.left < 0;
  }
  function netOf(e) {
    if (e.net != null) return e.net;
    if (e.lines) return X.sum(e.lines);
    if (e.live) return X.sum(X.settlementLines(e, {}));
    return null;
  }

  const STATE_TONE = {
    notStarted: "chartSand", computed: "chartBlue", awaiting: "chartAmber",
    approved: "chartTeal", paid: "chartGreen",
  };
  function stateMark(t, e) {
    if (e.state === "paid") return <StatusMark role="present" glyph="check" word={t("pyx.st.paid")} />;
    if (e.state === "approved") return <StatusMark role="present" glyph="check" word={t("pyx.st.approved")} />;
    if (e.state === "awaiting") return <StatusMark role="late" glyph="clock" word={t("pyx.st.awaiting")} />;
    if (e.state === "computed") return <StatusMark role="leave" glyph="scan" word={t("pyx.st.computed")} />;
    return <StatusMark role="off" glyph="arrow" word={t("pyx.st.notStarted")} />;
  }

  function Shell({ role, onNavigate, title, q, back, chips, campus, onCampus, children }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "payrollOfficer"} active="pyExits" onNavigate={onNavigate} initials="SK" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("pyx.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
                <span>{t("pyx.entity")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
                <span>{campusLabel(t, campus)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {onCampus ? <CampusSwitch value={campus} onChange={onCampus} /> : null}
                <ThemeToggle />
              </div>
            </div>
            {back ? <div style={{ marginBottom: 14 }}><BackBar label={back.label} onBack={back.onBack} /></div> : null}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
              <div style={{ minWidth: 320, maxWidth: 780 }}>
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

  function Fact({ label, children, note }) {
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

  function Figures({ items }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface, padding: "16px 0", marginBottom: G3.layout.gap }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          {items.map(function (m, i) {
            return (
              <div key={m.k} style={{ minWidth: 0, borderInlineStart: i ? "1px solid " + c.rule : "none", paddingInline: 20 }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{m.label}</div>
                <div style={G3.fig(m.big ? "xl" : "lg", { color: c.ink, fontWeight: 700, marginTop: 5, lineHeight: 1.05 })}>{m.value}</div>
                <div style={{ marginTop: 8 }}>
                  <Meter frac={Math.max(0.02, Math.min(1, m.frac == null ? 1 : m.frac))} bar={m.tone} height={4} label={m.label} />
                </div>
                {m.note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 6 })}>{m.note}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function Note({ role, glyph, head, body, action }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <Card>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <StatusMark role={role} glyph={glyph} word={head} />
          <div style={{ minWidth: 0, flex: "1 1 320px" }}>
            <p style={ty("small", { color: c.ink, margin: 0, maxWidth: "74ch" })}>{body}</p>
            {action ? <div style={{ marginTop: 10 }}>{action}</div> : null}
          </div>
        </div>
      </Card>
    );
  }

  /* a filter is a label and a control on ONE line. Stacking the label
     above a 36px select made a 120px-tall bar out of two dropdowns. */
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
     THE REGISTER. Six columns, one fact each. Campus became a
     filter; notice shortfall moved into the settlement, where it
     sits beside the figure it reduces.
     ============================================================ */
  function ExitsList({ onOpen, campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [show, setShow] = useState("open");
    const [pick, setPick] = useState(null);
    /* an exit HR records while this screen is open belongs on it */
    if (window.NaveyaExits) window.NaveyaExits.useExits();

    const all = X.allExits();
    let rows = all.filter(function (e) {
      if (show === "open" && e.state === "paid") return false;
      if (show === "late" && !isLate(e)) return false;
      if (!inCampus(campus, campusOfCode(e.staff))) return false;
      if (pick && e.state !== pick) return false;
      return true;
    });

    const open = all.filter(function (e) { return e.state !== "paid"; });
    const owed = open.reduce(function (s, e) { const n = netOf(e); return s + (n && n > 0 ? n : 0); }, 0);
    const late = open.filter(isLate);
    const soonest = open.map(function (e) { return { e: e, ck: nextClock(e) }; })
      .filter(function (x) { return x.ck; })
      .sort(function (a, b) { return a.ck.left - b.ck.left; })[0];

    const states = ["notStarted", "computed", "awaiting", "approved", "paid"];
    const segments = states.filter(function (s) {
      return all.filter(function (e) { return e.state === s; }).length;
    }).map(function (s) {
      return {
        key: s, label: t("pyx.seg." + s),
        value: all.filter(function (e) { return e.state === s; }).length,
        color: c[STATE_TONE[s]] || c.accent,
      };
    });

    const metrics = [
      { k: "o", label: t("pyx.m.open"), value: num(open.length), tone: c.chartBlue },
      { k: "v", label: t("pyx.m.owed"), value: inr(owed), tone: c.chartTeal },
      { k: "l", label: t("pyx.m.late"), value: num(late.length),
        note: late.length ? t("pyx.m.lateNote") : t("pyx.m.lateNone"),
        tone: late.length ? (c.chartRed || c.danger) : (c.chartGreen || c.present) },
      /* once a clock has gone past, "soonest deadline" is the wrong
         noun for it -- the figure is how late the latest one already is */
      { k: "s", label: t(soonest && soonest.ck.left < 0 ? "pyx.m.worst" : "pyx.m.soonest"),
        value: soonest ? (soonest.ck.left < 0 ? t("pyx.m.overdue", { n: num(-soonest.ck.left) }) : t("pyx.m.days", { n: num(soonest.ck.left) })) : "—",
        note: soonest ? t("pyx.m.soonestNote", { who: t(soonest.e.personKey), what: t("pyx.clock." + soonest.ck.key) }) : null,
        tone: c.chartAmber || c.warn },
    ];

    function deadlineCell(e) {
      if (e.state === "paid") return <span style={ty("caption", { color: c.inkFaint })}>{t("pyx.dl.done")}</span>;
      const ck = nextClock(e);
      if (!ck) return "—";
      const what = t("pyx.clock." + ck.key);
      if (ck.elapsed < 0) return <StatusMark role="off" glyph="clock" word={t("pyx.dl.future", { n: num(-ck.elapsed) })} />;
      if (ck.left < 0) return <StatusMark role="danger" glyph="alert" word={t("pyx.dl.over", { what: what, n: num(-ck.left) })} />;
      if (ck.left === 0) return <StatusMark role="late" glyph="clock" word={t("pyx.dl.today", { what: what })} />;
      return <StatusMark role="late" glyph="clock" word={t("pyx.dl.left", { what: what, n: num(ck.left) })} />;
    }

    return (
      <div>
        <Band head={t("pyx.band")} sub={t("pyx.bandSub")} metrics={metrics} />

        {/* filters, out of the table header where they were cramped */}
        <div style={{
          display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center",
          marginBottom: G3.layout.gap, padding: "10px 16px",
          border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
        }}>
          <FilterPair id="pyx-show" label={t("pyx.f.show")} width={180}>
            <Select id="pyx-show" value={show} onChange={setShow} ariaLabel={t("pyx.f.show")} size="sm"
              options={[
                { value: "open", label: t("pyx.f.open") },
                { value: "late", label: t("pyx.f.late") },
                { value: "all", label: t("pyx.f.all") },
              ]} />
          </FilterPair>
          {(show !== "open" || pick) ? (
            <LinkButton onClick={function () { setShow("open"); setPick(null); }}>{t("pyx.f.clear")}</LinkButton>
          ) : null}
        </div>

        {!rows.length ? (
          <Card><EmptyState head={t("pyx.none")} body={t("pyx.noneBody")} action={<Button kind="secondary" size="sm" onClick={function () { setShow("all"); setPick(null); }}>{t("pyx.f.all")}</Button>} /></Card>
        ) : (
          <Register
            title={t("pyx.reg.title")}
            sub={t("pyx.reg.sub", { n: num(rows.length) })}
            onSelect={onOpen}
            columns={[
              { key: "who", label: t("pyx.col.who") },
              { key: "cmp", label: t("kit.campus.label"), width: 140 },
              { key: "lwd", label: t("pyx.col.lwd"), width: 150 },
              { key: "dl", label: t("pyx.col.deadline"), width: 190 },
              { key: "net", label: t("pyx.col.net"), align: "right", mono: true, width: 150, weight: 700 },
              { key: "state", label: t("pyx.col.state"), width: 160 },
              { key: "act", label: t("pyx.col.act"), align: "right", width: 60 },
            ]}
            rows={rows.map(function (e) {
              const n = netOf(e);
              return {
                id: e.staff,
                tone: e.state === "paid" ? "dim" : undefined,
                cells: {
                  who: (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                      <Avatar name={t(e.personKey)} size={26} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{t(e.personKey)}</div>
                        <div style={G3.fig("micro", { color: c.inkFaint })}>{e.staff}</div>
                      </div>
                    </div>
                  ),
                  cmp: campusLabel(t, campusOfCode(e.staff)),
                  lwd: X.fmtDate(t, e.lwdIso),
                  dl: deadlineCell(e),
                  net: n == null ? "—" : inr(n),
                  state: stateMark(t, e),
                  act: (
                    <span style={{ display: "flex", justifyContent: "flex-end" }} onClick={function (ev) { ev.stopPropagation(); }}>
                      <ActionMenu
                        ariaLabel={t(e.personKey)} size={30}
                        items={[
                          e.id
                            ? { key: "open", icon: "document", label: t("pyx.act.open"), onSelect: function () { onOpen(e.staff); } }
                            : { key: "start", icon: "arrow", label: t("pyx.act.start"),
                                disabled: !!e.blockerKey, reason: e.blockerKey ? t("pyx.act.startOff") : null,
                                onSelect: function () { onOpen(e.staff); } },
                          { key: "access", icon: "lock", label: t("pyx.act.access"),
                            disabled: !e.accessActive, reason: e.accessActive ? null : t("pyx.act.accessOff"),
                            onSelect: function () { onOpen(e.staff); } },
                        ]}
                      />
                    </span>
                  ),
                },
              };
            })}
          />
        )}
      </div>
    );
  }

  /* ============================================================
     THE SETTLEMENT, ON A SCREEN OF ITS OWN.

     Four figures, then the three clocks, then the two halves of the
     arithmetic -- what we owe them and what we recover -- each with
     the formula that produced it, then the net, then the actions.
     Reading down the page is reading the settlement in the order an
     officer would explain it out loud.
     ============================================================ */
  function SettlementRecord({ exit, onBack }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const [waived, setWaived] = useState(false);
    const [exGratia, setExGratia] = useState(0);
    const [panel, setPanel] = useState(null);     /* waive | exgratia | send */
    const [said, setSaid] = useState(null);       /* the one confirmation line */
    const [asked, setAsked] = useState(false);

    const e = exit;
    const live = !!e.live;
    const lines = live
      ? X.settlementLines(e, { noticeWaived: waived, exGratia: exGratia })
      : (e.lines || null);

    const short = e.noticeContract == null ? 0 : X.noticeShortfall(e);
    const computedNotice = live ? X.r2(e.monthlyGross / X.NOTICE_DIVISOR * short) : 0;

    const owe = lines ? lines.filter(function (l) { return l.v >= 0; }) : [];
    const rec = lines ? lines.filter(function (l) { return l.v < 0; }) : [];
    const oweTotal = X.sum(owe);
    const recTotal = X.sum(rec);
    const net = lines ? X.sum(lines) : (e.net != null ? e.net : 0);
    const clocks = clocksFor(e);
    const elapsed = X.daysBetween(e.lwdIso, X.TODAY_ISO);

    /* the formula, in words, for every line that has one */
    function how(l) {
      if (l.key === "pyo.ff.l.encash" && l.detail) {
        return t("py17.encashDetail", { n: num(l.detail.days), rate: inr(l.detail.rate), v: e.cfg ? e.cfg.v : "" });
      }
      if (l.key === "pyo.ff.l.notice") {
        if (l.waived) return t("py17.waived", { who: t(X.MAKER.nameKey), amt: inr(computedNotice) });
        if (l.detail && l.detail.days === 0) return t("pyo.ff.noticeFull");
        if (l.detail) return t("py17.noticeDetail", { c: num(e.noticeContract), s: num(e.noticeServed), n: num(l.detail.days), rate: inr(l.detail.rate) });
      }
      if (l.key === "pyo.ff.l.loan" && l.linkLoan) return t("py17.loanDetail", { id: l.linkLoan });
      if (l.key === "pyo.ff.l.reimb" && l.v === 0) return t("py17.reimbNote");
      if (l.refusedKey) return t(l.refusedKey, { svc: e.serviceKey ? t(e.serviceKey) : "—", v: e.cfg ? e.cfg.v : "" });
      if (l.noteKey) return t(l.noteKey);
      if (l.srcKey) return t(l.srcKey);
      return null;
    }
    function tag(l) {
      if (l.stat) return <Chip bg={c.sunken} fg={c.inkMuted}>{t("pyx.d.statutory")}</Chip>;
      if (l.discretionary) return <Chip bg={c.accentSoft} fg={c.accent}>{t("pyx.d.discretionary")}</Chip>;
      return null;
    }

    function LineTable({ head, rows, total, totalLabel, negate }) {
      if (!rows.length) return null;
      return (
        <Register
          title={head}
          columns={[
            { key: "line", label: t("pyx.d.col.line"), width: 220 },
            { key: "how", label: t("pyx.d.col.how") },
            { key: "amt", label: t("pyx.d.col.amt"), align: "right", mono: true, width: 150, weight: 600 },
          ]}
          rows={rows.map(function (l) {
            const zero = l.v === 0;
            return {
              id: l.key,
              tone: zero ? "dim" : undefined,
              cells: {
                line: (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600 }}>{t(l.key)}</span>
                    {tag(l)}
                  </span>
                ),
                how: <span style={{ color: c.inkMuted }}>{how(l)}</span>,
                amt: zero && l.refusedKey ? t("pyx.d.refused") : inr(negate ? -l.v : l.v),
              },
            };
          })}
          totals={{ label: totalLabel, cells: { amt: inr(negate ? -total : total) } }}
        />
      );
    }

    /* the two sides are measured against WHICHEVER IS LARGER, so the
       bars say which way the settlement leans. Measuring each against
       itself drew both of them full, which said nothing. */
    const scale = Math.max(oweTotal, -recTotal, 1);
    const figures = [
      { k: "o", label: t("pyx.d.m.owe"), value: inr(oweTotal), big: true,
tone: c.chartTeal },
      { k: "r", label: t("pyx.d.m.recover"), value: inr(-recTotal), big: true,
tone: c.chartSand },
      /* the label follows the sign: a negative settlement is not a
         negative payment, it is a receivable the other way round */
      { k: "n", label: net < 0 ? t("py17.netRecover") : t("pyx.d.m.net"),
        value: inr(net < 0 ? -net : net), big: true,
        note: net < 0 ? t("py17.negative") : t("pyx.d.netNote"),
tone: net < 0 ? c.chartAmber : c.chartGreen },
      { k: "s", label: t("pyx.d.m.since"), value: t("pyx.d.m.sinceNote", { n: num(Math.max(0, elapsed)) }),
tone: c.chartAmber },
    ];

    return (
      <div>
        {/* 1 . where the money landed */}
        <Figures items={figures} />

        {/* 2 . the three clocks, which is the thing the old screen could not say */}
        <div style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface, marginBottom: G3.layout.gap }}>
          <header style={{ padding: "16px 20px 0" }}>
            <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("pyx.d.clocks")}</h2>
            <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0", maxWidth: "84ch" })}>
              {t("pyx.d.clocksSub", { lwd: X.fmtDate(t, e.lwdIso) })}
            </p>
          </header>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", padding: "16px 0 18px" }}>
            {clocks.map(function (ck, i) {
              const over = !ck.met && ck.left < 0;
              const word = ck.met ? t("pyx.d.clockMet")
                : over ? t("pyx.d.clockOver", { n: num(-ck.left) })
                : t("pyx.d.clockLeft", { n: num(Math.max(0, ck.left)) });
              return (
                <div key={ck.key} style={{ minWidth: 0, borderInlineStart: i ? "1px solid " + c.rule : "none", paddingInline: 20 }}>
                  <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
                    {t("pyx.clock." + ck.key)}
                  </div>
                  <div style={G3.fig("lg", { color: c.ink, fontWeight: 700, marginTop: 5, lineHeight: 1.1 })}>
                    {t("pyx.d.m.sinceNote", { n: num(ck.limit) })}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Meter
                      frac={Math.max(0.03, Math.min(1, Math.max(0, ck.elapsed) / ck.limit))}
                      bar={ck.met ? c.chartGreen : over ? c.chartRed : c[ck.tone]}
                      height={5} label={t("pyx.clock." + ck.key)}
                    />
                  </div>
                  <div style={{ marginTop: 9 }}>
                    <StatusMark
                      role={ck.met ? "present" : over ? "danger" : "late"}
                      glyph={ck.met ? "check" : over ? "alert" : "clock"}
                      word={word}
                    />
                  </div>
                  <div style={ty("caption", { color: c.inkFaint, marginTop: 6 })}>
                    {t("pyx.d." + (ck.key === "wages" ? "wagesWhy" : ck.key === "epf" ? "epfWhy" : "gratuityWhy"))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3 . who they were, so the figures above have a subject */}
        <Card title={t("pyx.d.facts")}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px 22px" }}>
            <Fact label={t("pyx.d.joined")}>{X.fmtDate(t, e.joinedIso)}</Fact>
            <Fact label={t("pyx.d.left")}>{X.fmtDate(t, e.lwdIso)}</Fact>
            <Fact label={t("pyx.d.served")}>{e.serviceKey ? t(e.serviceKey) : "—"}</Fact>
            <Fact label={t("pyx.d.group")}>{t(e.groupKey)}</Fact>
            <Fact label={t("pyx.d.campus")}>{campusLabel(t, campusOfCode(e.staff))}</Fact>
            <Fact label={t("pyx.d.cfg")}>{e.cfg ? e.cfg.v : "—"}</Fact>
          </div>
        </Card>

        {/* 4 . the arithmetic, in two halves */}
        {lines ? (
          <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap, marginTop: G3.layout.gap }}>
            <LineTable head={t("pyx.d.owe")} rows={owe} total={oweTotal} totalLabel={t("pyx.d.owe")} />
            <LineTable head={t("pyx.d.recover")} rows={rec} total={recTotal} totalLabel={t("pyx.d.recover")} negate />

            {/* 5 . the net, as one figure, not a table row */}
            <div style={{
              border: "1px solid " + c.borderStrong, borderRadius: G3.r.md, background: c.surface,
              padding: "20px 22px", display: "flex", alignItems: "flex-end",
              justifyContent: "space-between", gap: 20, flexWrap: "wrap",
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
                  {net < 0 ? t("py17.netRecover") : t("pyx.d.net")}
                </div>
                <div style={G3.fig("xl", { color: c.ink, fontWeight: 700, marginTop: 4, lineHeight: 1 })}>
                  {inr(net < 0 ? -net : net)}
                </div>
              </div>
              <p style={ty("caption", { color: c.inkMuted, margin: 0, maxWidth: "48ch" })}>
                {net < 0 ? t("py17.negativeBody", { name: t(e.personKey), amt: inr(-net) }) : t("pyx.d.netNote")}
              </p>
            </div>
          </div>
        ) : null}

        {/* 6 . the state of play, and the actions it allows */}
        <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap, marginTop: G3.layout.gap }}>
          {said ? <Note role="present" glyph="check" head={said} body={t("pyo.recorded", { when: t("pyo.justNow") })} /> : null}

          {e.blockerKey ? (
            <Note role="danger" glyph="alert" head={t("pyx.d.blocked")} body={t("pyx.d.blockedWhy")} />
          ) : null}
          {e.provisional ? (
            <Note role="off" glyph="clock" head={t("pyx.st.provisional")} body={t("py16.provisional")} />
          ) : null}
          {e.state === "awaiting" ? (
            <Note role="late" glyph="clock"
              head={t("pyx.d.withChecker", { who: t(e.checker.nameKey), on: X.fmtDate(t, e.submittedIso) })}
              body={t("pyx.d.withCheckerWhy")} />
          ) : null}
          {e.state === "paid" ? (
            <Note role="present" glyph="check"
              head={t("pyx.d.paidOn", { on: X.fmtDate(t, e.paidIso), run: e.paidWith })}
              body={t("py17.access", { name: t(e.personKey) })} />
          ) : null}
          {e.accessActive ? (
            <Note role="danger" glyph="lock" head={t("pyx.d.accessGap")}
              body={t("pyx.d.accessGapWhy", { on: X.fmtDate(t, e.lwdIso) })}
              action={asked
                ? <StatusMark role="present" glyph="check" word={t("pyx.d.accessAsked")} />
                : <Button kind="secondary" size="sm" iconLeft="lock" onClick={function () { setAsked(true); }}>{t("pyx.d.accessGo")}</Button>} />
          ) : null}

          {live ? (
            <Card title={t("pyx.d.actions")}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <ActionRow
                  head={waived ? t("pyx.d.unwaive") : t("pyx.d.waive")}
                  body={short === 0 ? t("py17.waiveOff") : t("pyx.d.waiveWhy", { v: inr(computedNotice), n: num(short) })}
                  cta={waived
                    ? <Button kind="secondary" size="sm" onClick={function () { setWaived(false); setSaid(null); }}>{t("pyx.d.unwaive")}</Button>
                    : <Button kind="secondary" size="sm" disabled={short === 0} onClick={function () { setPanel("waive"); }}>{t("pyx.d.waive")}</Button>}
                />
                <ActionRow
                  head={t("pyx.d.exgratia")}
                  body={t("pyx.d.exgratiaWhy")}
                  cta={<Button kind="secondary" size="sm" onClick={function () { setPanel("exgratia"); }}>{t("pyx.eg.go")}</Button>}
                />
                <ActionRow
                  head={X.TENANT_FF_CHECKER_REQUIRED ? t("pyx.d.send") : t("pyx.d.sendSingle")}
                  body={X.TENANT_FF_CHECKER_REQUIRED
                    ? t("pyx.d.sendWhy", { checker: t(X.CHECKER.nameKey) })
                    : t("pyx.d.sendSingleWhy")}
                  cta={<Button onClick={function () { setPanel("send"); }}>
                    {X.TENANT_FF_CHECKER_REQUIRED ? t("pyx.sd.go") : t("pyx.sd.goSingle")}
                  </Button>}
                />
              </div>
            </Card>
          ) : null}

          <div>
            <Button kind="secondary" size="sm" iconLeft="download">{t("pyx.export")}</Button>
          </div>
        </div>

        {panel === "waive" ? (
          <WaivePanel exit={e} amount={computedNotice}
            onClose={function () { setPanel(null); }}
            onDone={function () {
              setWaived(true); setPanel(null);
              setSaid(t("pyx.wv.done", { v: inr(X.sum(X.settlementLines(e, { noticeWaived: true, exGratia: exGratia }))) }));
            }} />
        ) : null}
        {panel === "exgratia" ? (
          <ExGratiaPanel onClose={function () { setPanel(null); }}
            onDone={function (v) {
              setExGratia(v); setPanel(null);
              setSaid(t("pyx.eg.done", { v: inr(v), v2: inr(X.sum(X.settlementLines(e, { noticeWaived: waived, exGratia: v }))) }));
            }} />
        ) : null}
        {panel === "send" ? (
          <SendPanel exit={e} net={net}
            onClose={function () { setPanel(null); }}
            onDone={function () {
              setPanel(null);
              setSaid(t("pyx.sd.done", { checker: t(X.CHECKER.nameKey) }));
            }} />
        ) : null}
      </div>
    );
  }

  /* one action, its consequence, its control -- stacked so the reason
     is read before the button, which is the order they matter in */
  function ActionRow({ head, body, cta }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{
        display: "flex", gap: 18, alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap", paddingBottom: 14, borderBottom: "1px solid " + c.rule,
      }}>
        <div style={{ minWidth: 0, flex: "1 1 360px" }}>
          <div style={ty("small", { color: c.ink, fontWeight: 600 })}>{head}</div>
          <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0", maxWidth: "74ch" })}>{body}</p>
        </div>
        <div style={{ flexShrink: 0 }}>{cta}</div>
      </div>
    );
  }

  function WaivePanel({ exit, amount, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [why, setWhy] = useState("");
    return (
      <SideScreen
        title={t("pyx.wv.title")} sub={t(exit.personKey) + " · " + exit.staff}
        avatar={t(exit.personKey)} onClose={onClose} width={520}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", width: "100%" }}>
            <Button kind="secondary" onClick={onClose}>{t("pyx.cancel")}</Button>
            <Button onClick={onDone} disabled={!why.trim()}>{t("pyx.wv.go")}</Button>
          </div>
        }
      >
        <p style={ty("small", { color: c.ink, margin: "0 0 16px", maxWidth: "62ch" })}>
          {t("pyx.wv.body", { served: num(exit.noticeServed), contract: num(exit.noticeContract), v: inr(amount) })}
        </p>
        <Field id="pyx-wv-why" label={t("pyx.wv.reason")} hint={t("pyx.wv.reasonPh")}>
          <Input id="pyx-wv-why" value={why} onChange={setWhy} />
        </Field>
      </SideScreen>
    );
  }

  function ExGratiaPanel({ onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [amt, setAmt] = useState("");
    const v = Number(amt) || 0;
    return (
      <SideScreen
        title={t("pyx.eg.title")} onClose={onClose} width={480}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", width: "100%" }}>
            <Button kind="secondary" onClick={onClose}>{t("pyx.cancel")}</Button>
            <Button onClick={function () { onDone(v); }} disabled={v <= 0}>{t("pyx.eg.go")}</Button>
          </div>
        }
      >
        <p style={ty("small", { color: c.ink, margin: "0 0 16px", maxWidth: "62ch" })}>{t("pyx.eg.body")}</p>
        <Field id="pyx-eg-amt" label={t("pyx.eg.amount")}>
          <Input id="pyx-eg-amt" value={amt} onChange={setAmt} inputMode="numeric" placeholder="0" />
        </Field>
      </SideScreen>
    );
  }

  function SendPanel({ exit, net, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const need = X.TENANT_FF_CHECKER_REQUIRED;
    return (
      <SideScreen
        title={t("pyx.sd.title")} sub={t(exit.personKey) + " · " + exit.staff}
        avatar={t(exit.personKey)} onClose={onClose} width={520}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", width: "100%" }}>
            <Button kind="secondary" onClick={onClose}>{t("pyx.cancel")}</Button>
            <Button onClick={onDone}>{need ? t("pyx.sd.go") : t("pyx.sd.goSingle")}</Button>
          </div>
        }
      >
        <p style={ty("small", { color: c.ink, margin: "0 0 14px", maxWidth: "62ch" })}>
          {t("pyx.sd.body", { name: t(exit.personKey), v: inr(net), checker: t(X.CHECKER.nameKey) })}
        </p>
        {need ? null : (
          <p style={ty("caption", { color: c.inkMuted, margin: 0, maxWidth: "62ch" })}>{t("pyx.sd.single")}</p>
        )}
      </SideScreen>
    );
  }

  /* ============================================================
     THE CONTAINER. One screen key, two views: the list, and the one
     settlement the officer opened. Never both, because the whole
     fault with the old screen was everything at once.
     ============================================================ */
  function PYExits({ role, onNavigate }) {
    /* the officer holds both campuses; everything below answers this */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t } = useLang();
    const [openStaff, setOpenStaff] = useState(null);

    if (!X) return null;
    if (window.NaveyaExits) window.NaveyaExits.useExits();
    const sel = openStaff ? X.allExits().filter(function (e) { return e.staff === openStaff; })[0] : null;

    if (sel) {
      return (
        <Shell campus={campus} onCampus={setCampus}
          role={role} onNavigate={onNavigate}
          title={t(sel.personKey)}
          q={sel.staff + " · " + t(sel.groupKey) + " · " + t(sel.campusKey)}
          back={{ label: t("pyx.back"), onBack: function () { setOpenStaff(null); } }}
          chips={[
            <span key="s">{stateMark(t, sel)}</span>,
            sel.cfg ? <Chip key="v" bg={c.sunken} fg={c.inkMuted} mono>{sel.cfg.v}</Chip> : null,
          ]}
        >
          <SettlementRecord exit={sel} onBack={function () { setOpenStaff(null); }} />
        </Shell>
      );
    }
    return (
      <Shell campus={campus} onCampus={setCampus} role={role} onNavigate={onNavigate} title={t("pyx.title")}>
        <ExitsList campus={campus} onOpen={setOpenStaff} />
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.PYExits = PYExits;
  window.Pages3.PYExitsStrings = true;
})();

