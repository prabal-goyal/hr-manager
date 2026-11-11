/* @jsxRuntime classic */
/* ============================================================
   Naveya — Director · window.Pages3.DRHome / DRLeave

   DR-01 Director home        — "what is the trust's leave doing?"
   DR-02 Leave across the trust — "what needs my signature, and what
                                  is everyone else deciding?"

   WHO THIS IS. The director sits above the principal. Two things
   follow, and they are the whole design:

     1. He SEES every leave request in the trust, at every length,
        on both campuses. Visibility is not a decision.
     2. He DECIDES only the long ones — more than 15 days — and only
        after the head of department and the principal have both
        said yes. window.LeaveFlow owns that rule; this screen only
        reads it.

   WHAT IS DELIBERATELY ABSENT. No attendance. Not a board, not a
   register, not a late-arrival count. A director does not supervise
   a punch clock; the campus attendance board is the principal's
   screen (PR-02) and the department's is the head's (DH-03). The
   absence is stated once in words (dr.scope.note) rather than left
   as a puzzle — an empty rail slot teaches nothing.

   Nor is there leave of his own: the top of the chain has nobody to
   approve it, so kit.jsx does not give the role the self-service
   Leave item at all (absent, not disabled).
   ============================================================ */
(function () {
  const { useState, useMemo } = React;
  const G3 = window.G3;
  const UI = window.UI3;
  const LF = window.LeaveFlow;
  const {
    useTheme, useLang, addStrings, Rail, Motif, WelcomeBand, Card, CardHeader,
    Button, LinkButton, Select, Input, Chip, Icon, Meter, EmptyState, Tabs,
    ThemeToggle, Figure, MetricCell, MetricStrip, StatusMark, Tip, Band, num,
    CampusSwitch, campusKeyOf, inCampusKey, campusLabel, CAMPUS_ALL,
  } = UI;

  const TODAY_ISO = LF.TODAY_ISO;
  const WINDOW_FROM = TODAY_ISO;
  const WINDOW_TO = "2026-10-10";   /* today + 60 days */

  /* ============================================================
     WORDS
     ============================================================ */
  addStrings({
    en: {
      "dr.today": "Tuesday, 11 August 2026",
      "dr.toast.close": "Dismiss",
      "dr.scope": "Two campuses",

      "dr.home.kicker": "Tuesday, 11 August 2026",
      "dr.home.greeting": "Good morning, Arvind.",
      "dr.home.meta": "{trust} · {campuses}",
      "dr.home.figureLabel": "Waiting for your signature",
      "dr.home.figureNote": "Long leave only — 16 days or more",
      "dr.home.figureNoteNone": "Nothing is held up on you",

      "dr3.pageTitle": "The campuses today",
      "dr3.band.foot": "Read-only. A correction belongs to the head of department whose register it is.",
      "dr3.readOnly": "Read-only. Regularising any of these days is the department head's decision, on her own attendance screen.",
      "dr.att.title": "Attendance across the school",
      "dr.att.inLabel": "In school today",
      "dr.att.inNote": "of {total} on the roll · {late} arrived late",
      "dr.att.leaveLabel": "On approved leave",
      "dr.att.leaveNote": "approved in advance",
      "dr.att.absentLabel": "Absent today",
      "dr.att.absentNote": "no punch and no leave on record",
      "dr.att.awaitingLabel": "No reading yet",
      "dr.att.awaitingNote": "a gate reader is down at Indiranagar",
      "dr.att.ofN": "of {n}",
      "dr.att.barAria": "{campus}: {n} of {total} in school",

      "dr.away.title": "Who is away",
      "dr.away.sub": "Approved leave across both campuses",
      "dr.away.today": "Today",
      "dr.away.noneToday": "Nobody is on approved leave today.",
      "dr.away.coming": "Coming up",
      "dr.away.noneComing": "No approved leave ahead this month.",

      "dr.cel.sub": "Across the trust, over the next month",
      "dr.sign.title": "Waiting for your signature",
      "dr.sign.sub": "Both earlier signatures are already on these",
      "dr.sign.empty": "Nothing needs signing",
      "dr.sign.emptyBody": "Long leave reaches you only after the head of department and the principal have both approved it.",
      "dr.sign.open": "Open the request",
      "dr.sign.all": "Open the full register",
      "dr.sign.cleared": "Cleared by {head} and {principal}",
      "dr.sign.clearedPr": "Cleared by {principal}",
      "dr.sign.waiting": "Waiting {n} days",

      "dr.funnel.title": "Where every request is sitting",
      "dr.funnel.sub": "{n} still undecided across the trust",
      "dr.funnel.head": "With heads of department",
      "dr.funnel.principal": "With the principal",
      "dr.funnel.you": "With you",
      "dr.funnel.note": "You can open any of them. Only the last row is yours to answer.",

      "dr.rule.title": "How long decides who signs",
      "dr.rule.sub": "The same rule on every screen in Naveya",

      "dr.campus.title": "Leave on the books",
      "dr.campus.sub": "The next 60 days, approved and still climbing",
      "dr.campus.people": "{n} people",
      "dr.campus.days": "{n} days",
      "dr.campus.note": "Days between today and 10 October. A leave that runs past that date is counted only for the days inside it.",

      "dr.long.title": "Long absences ahead",
      "dr.long.sub": "16 days or more, whatever their state",
      "dr.long.empty": "No long leave on the books",
      "dr.long.state": "{state} · {days}",

      "dr.recent.title": "Recently settled",
      "dr.recent.sub": "The last word on each, and whose it was",
      "dr.recent.by": "{status} by {name}",

      "dr.lv.title": "Leave across the trust",
      "dr.lv.band": "Leave in flight across the trust",
      "dr.lv.bandSub": "What has reached you, what is still with a head of department or a principal, and what is settled.",
      "dr.lv.s.mine": "With you",
      "dr.lv.s.below": "Below you",
      "dr.lv.s.done": "Settled",
      "dr.lv.m.mine": "Waiting on you",
      "dr.lv.m.mineNote": "Past fifteen days, or a principal’s own leave.",
      "dr.lv.m.long": "Long leave",
      "dr.lv.m.longNote": "Over the threshold that brings a request to this desk.",
      "dr.lv.m.trust": "Across the trust",
      "dr.lv.m.trustNote": "Every request raised this session, on either campus.",
      "dr.lv.m.days": "Days asked for",
      "dr.lv.m.daysNote": "Across what is waiting on you.",
      "dr.lv.identity": "Arvind Bhatia · Director · {trust}",
      "dr.lv.tabs": "Leave views",
      "dr.lv.tab.mine": "Waiting for you",
      "dr.lv.tab.all": "Every request",
      "dr.lv.mine.title": "Your signature",
      "dr.lv.mine.sub": "{n} waiting · long leave, already cleared twice",
      "dr.lv.all.title": "Every request in the trust",
      "dr.lv.all.sub": "{shown} of {total} · oldest first",
      "dr.lv.mineEmpty": "Nothing is waiting on you",
      "dr.lv.mineEmptyBody": "When a request longer than 15 days clears the head of department and the principal, it appears here for your signature.",

      "dr.f.dept": "Department", "dr.f.deptAll": "Every department",
      "dr.f.state": "State", "dr.f.stateAll": "Every state",
      "dr.f.stage": "Sitting with", "dr.f.stageAll": "Anyone",
      "dr.f.search": "Search by name",
      "dr.f.long": "Long leave only",

      "dr.d.title": "Request {id}",
      "dr.d.applied": "Applied {date} · {age}",
      "dr.d.age0": "today", "dr.d.age": "{n} days ago",
      "dr.d.chain": "Where it stands",
      "dr.d.clash": "Who else is away then",
      "dr.d.clashNone": "Nobody else from that campus is away in those weeks.",
      "dr.d.clashRow": "{name} · {dates}",
      "dr.d.cost": "What it takes out",
      "dr.d.costLine": "{days}, {dept}, {campus}",
      "dr.d.costShort": "{n} days have no balance behind them",
      "dr.d.decision": "Your decision",
    },
  });

  /* ============================================================
     SMALL SHARED PIECES
     ============================================================ */
  /* The scope control lives HERE, in the strip, on every screen that
     is campus-scoped — one place, one control, so a reader never has
     to find out where this screen keeps it. The crumb then states the
     scope in words, because a pressed segment is easy to miss. */
  function TopStrip({ crumbKey, campus, onCampus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={ty("small", { color: c.inkMuted })}>
          <span style={{ color: c.ink, fontWeight: 700 }}>{t(crumbKey)}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
          <span>{t("lf.trust")}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
          <span>{onCampus ? campusLabel(t, campus) : t("dr.scope")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onCampus ? <CampusSwitch value={campus} onChange={onCampus} /> : null}
          <ThemeToggle />
        </div>
      </div>
    );
  }

  function Pills({ ariaLabel, items, value, onChange }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div role="group" aria-label={ariaLabel} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {items.map((it) => {
          const on = it.key === value;
          return (
            <button
              key={it.key} type="button" aria-pressed={on ? "true" : "false"}
              onClick={() => onChange(it.key)}
              style={ty("small", {
                cursor: "pointer", borderRadius: 999, height: G3.layout.controlH, padding: "0 15px",
                border: "1px solid " + (on ? c.accent : c.border),
                background: on ? c.accentSoft : "transparent",
                color: on ? c.accent : c.inkMuted, fontWeight: on ? 700 : 500,
              })}
            >
              {it.label}
              {it.count != null ? <span style={G3.fig("xs", { marginInlineStart: 7, color: on ? c.accent : c.inkFaint })}>{num(it.count)}</span> : null}
            </button>
          );
        })}
      </div>
    );
  }

  function Toast({ text, onClose }) {
    const { c, shadow } = useTheme();
    const { t, ty } = useLang();
    if (!text) return null;
    return ReactDOM.createPortal(
      <div
        role="status"
        style={{
          position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 26, zIndex: 3000,
          display: "flex", alignItems: "center", gap: 14, maxWidth: 560,
          background: c.rail, color: c.onRail, borderRadius: G3.r.lg,
          padding: "12px 16px", boxShadow: shadow(3),
        }}
      >
        <span style={ty("small", { fontWeight: 600 })}>{text}</span>
        <LinkButton onDark onClick={onClose}>{t("dr.toast.close")}</LinkButton>
      </div>,
      document.body
    );
  }

  /* ============================================================
     READS OVER THE STORE
     ============================================================ */
  function overlapDaysInWindow(req) {
    const from = req.from > WINDOW_FROM ? req.from : WINDOW_FROM;
    const to = req.to < WINDOW_TO ? req.to : WINDOW_TO;
    if (from > to) return 0;
    const d = Math.round((LF.parseISO(to) - LF.parseISO(from)) / 86400000) + 1;
    return req.half ? 0.5 : d;
  }
  function liveIn(reqs) {
    /* approved or still climbing — a declined request takes nobody out of a classroom */
    return reqs.filter((r) => { const s = LF.statusOf(r); return s === "approved" || s === "pending"; });
  }
  function clashesWith(reqs, req) {
    return liveIn(reqs).filter((r) =>
      r.id !== req.id &&
      r.person.campusKey === req.person.campusKey &&
      r.from <= req.to && r.to >= req.from);
  }
  function lastStageOf(req) {
    const done = req.stages.filter((s) => s.outcome);
    return done.length ? done[done.length - 1] : null;
  }

  /* ============================================================
     DR-01 · HOME
     ============================================================ */
  function SignCard({ reqs, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const mine = reqs.filter((r) => LF.isWaitingOn(r, "director"));
    return (
      <Card
        icon="filing" iconTone="accent"
        title={t("dr.sign.title")} sub={t("dr.sign.sub")}
        action={mine.length ? <LinkButton onClick={() => onNavigate("drLeave")}>{t("dr.sign.all")}</LinkButton> : null}
      >
        {mine.length === 0 ? (
          <EmptyState compact head={t("dr.sign.empty")} body={t("dr.sign.emptyBody")} />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {mine.map((r) => {
              const head = LF.decidedStage(r, "deptHead");
              const pr = LF.decidedStage(r, "principal");
              return (
                <div key={r.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "13px 15px", background: c.raised, border: "1px solid " + c.border, borderRadius: G3.r.lg }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <LF.PersonLine person={r.person} showCampus />
                    <div style={ty("small", { color: c.ink, marginTop: 7, fontWeight: 600 })}>
                      {LF.fmtRange(t, r.from, r.to)}
                      <span style={{ color: c.inkFaint, fontWeight: 500 }}> · {LF.daysWord(t, r.days, r.half)}</span>
                    </div>
                    <div style={ty("caption", { color: c.inkFaint, marginTop: 3 })}>
                      {head && pr
                        ? t("dr.sign.cleared", { head: t(head.holderNameKey), principal: t(pr.holderNameKey) })
                        : pr ? t("dr.sign.clearedPr", { principal: t(pr.holderNameKey) }) : ""}
                    </div>
                    <div style={ty("caption", { color: c.lateText, marginTop: 3, fontWeight: 600 })}>{t("dr.sign.waiting", { n: num(LF.ageOf(r)) })}</div>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 9 }}>
                    <LF.TypeChip code={r.type} />
                    <Button kind="secondary" size="sm" onClick={() => onNavigate("drLeave")}>{t("dr.sign.open")}</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    );
  }

  /* Attendance reaches this screen for the first time (designer,
     2026-09-24). It is READ-ONLY and it is a trust-level shape: two
     campuses, who is in, who is not, and the records that have not
     reported. The director does not open a register from here — the
     campus board is the principal's screen and the department's is
     the head's — so there is no drill-in, by design.

     Indiranagar's figures are the SAME ones principal.jsx draws on
     PR-01/PR-02; if the two disagreed, one of them would be lying. */
  const CD = window.CampusData;
  const TRUST = CD.CAMPUSES.map((x) => Object.assign({ key: x.key }, CD.totalsOf(x.key)));
  const TRUST_TOTAL = CD.trustTotals();

  const ATT_ROLE = { present: "present", late: "late", absent: "absent", leave: "leave", awaiting: "missing" };
  const ROLL_KEYS = ["present", "late", "absent", "leave", "awaiting"];

  function RollBar({ d, width }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const parts = ROLL_KEYS.map((k) => ({ key: k, n: d[k] || 0 })).filter((x) => x.n > 0);
    const label = t(d.label) + ": " + parts.map((x) => num(x.n) + " " + t("pr.shape." + x.key)).join(", ");
    return (
      <Tip
        label={label} width={230} grow={width === "100%"}
        body={
          <React.Fragment>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 7 })}>{t(d.label)}</div>
            {parts.map((x) => (
              <div key={x.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                <span aria-hidden="true" style={{
                  width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                  background: c[ATT_ROLE[x.key] + "Chart"] || c[ATT_ROLE[x.key]],
                  opacity: x.key === "awaiting" ? 0.5 : 1,
                }} />
                <Figure value={num(x.n)} size="sm" weight={700} color={c.ink} />
                <span style={ty("caption", { color: c.inkMuted })}>{t("pr.shape." + x.key)}</span>
              </div>
            ))}
          </React.Fragment>
        }
      >
        <span aria-hidden="true" style={{ width: width || 210, height: 12, borderRadius: G3.r.pill, background: c.gutter, display: "flex", overflow: "hidden" }}>
          {ROLL_KEYS.map((k) => (
            (d[k] || 0) > 0
              ? <span key={k} style={{
                  width: ((d[k] || 0) / d.total) * 100 + "%",
                  background: c[ATT_ROLE[k] + "Chart"] || c[ATT_ROLE[k]],
                  opacity: k === "awaiting" ? 0.5 : 1,
                }} />
              : null
          ))}
        </span>
      </Tip>
    );
  }

  function AttendanceCard({ campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const scope = campus === CAMPUS_ALL ? CD.SCOPE_ALL : campusKeyOf(campus);
    const T = CD.totalsOfScope(scope);
    const rows = TRUST.filter(function (x) { return inCampusKey(campus, x.key); });
    const inSchool = T.present + T.late;

    const facts = [
      { key: "in", label: t("dr.att.inLabel"), value: num(inSchool), n: inSchool, note: t("dr.att.inNote", { total: num(T.total), late: num(T.late) }), tone: c.chartGreen },
      { key: "leave", label: t("dr.att.leaveLabel"), value: num(T.leave), n: T.leave, note: t("dr.att.leaveNote"), tone: c.chartPurple },
      { key: "absent", label: t("dr.att.absentLabel"), value: num(T.absent), n: T.absent, note: t("dr.att.absentNote"), tone: c.chartRed, warn: T.absent > 0 },
      { key: "awaiting", label: t("dr.att.awaitingLabel"), value: num(T.awaiting), n: T.awaiting, note: t("dr.att.awaitingNote"), tone: c.chartAmber },
    ];

    return (
      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={ty("h2", { margin: 0, color: c.ink })}>{t("dr.att.title")}</h2>
          </div>
        </div>

        <MetricStrip
          pad={0} style={{ marginBottom: 22 }}
          metrics={facts.map(function (f) {
            return { k: f.key, label: f.label, value: f.value, n: f.n, tone: f.tone, warn: f.warn, note: f.note };
          })}
        />

        {/* one row per campus, and ONE measurement on it: how much of that
            roll is in school. The composition is the figures above; drawing
            it again in five colours nothing names was a puzzle, not a chart. */}
        <div style={{ display: "grid", gap: 12, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
          {rows.map(function (x) {
            return (
              <div key={x.key} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={ty("small", { flex: "0 0 160px", color: c.ink, fontWeight: 600 })}>{t(x.key)}</span>
                <span style={{ flex: 1, minWidth: 0, display: "block" }}>
                  <Meter
                    frac={x.total ? (x.present + x.late) / x.total : 0}
                    bar={c.chartGreen} height={8}
                    label={t("dr.att.barAria", { campus: t(x.key), n: num(x.present + x.late), total: num(x.total) })}
                  />
                </span>
                <span style={{ flex: "0 0 96px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <Figure value={num(x.present + x.late)} size="sm" weight={700} color={c.ink} />
                  <span style={ty("caption", { color: c.inkFaint })}>{" " + t("dr.att.ofN", { n: num(x.total) })}</span>
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  /* who is away across the trust today, from the shared queue — the
     same approved requests every other screen reads */
  function AwayCard({ reqs }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const today = reqs
      .filter((r) => LF.statusOf(r) === "approved" && r.from <= LF.TODAY_ISO && r.to >= LF.TODAY_ISO)
      .slice(0, 4);
    const soon = reqs
      .filter((r) => LF.statusOf(r) === "approved" && r.from > LF.TODAY_ISO)
      .sort((a, b) => (a.from < b.from ? -1 : 1))
      .slice(0, 3);

    return (
      <Card icon="leave" iconTone="leave" title={t("dr.away.title")} sub={t("dr.away.sub")}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("dr.away.today")}</div>
        {today.length === 0 ? (
          <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("dr.away.noneToday")}</p>
        ) : (
          <div>
            {today.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                <span style={{ flex: 1, minWidth: 0 }}><LF.PersonLine person={r.person} showCampus /></span>
                <span style={G3.fig("xs", { color: c.inkMuted, whiteSpace: "nowrap" })}>{LF.fmtRange(t, r.from, r.to)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("dr.away.coming")}</div>
          {soon.length === 0 ? (
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("dr.away.noneComing")}</p>
          ) : (
            <div>
              {soon.map((r, i) => (
                <div key={r.id} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: "9px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                  <span style={ty("small", { color: c.ink, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{t(r.person.nameKey)}</span>
                  <span style={G3.fig("xs", { color: c.inkMuted, whiteSpace: "nowrap" })}>{LF.fmtRange(t, r.from, r.to)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }

  function DRHome({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [campus, setCampus] = useState(CAMPUS_ALL);
    /* narrowed ONCE, here: every card below reads this list, so a card
       added later is in scope without being told about the switch */
    const reqs = LF.useRequests().filter(function (r) {
      return inCampusKey(campus, r.person.campusKey);
    });
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "director"} active="drHome" onNavigate={onNavigate} initials="AB" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip crumbKey="nav.drHome" campus={campus} onCampus={setCampus} />

            {/* a plain head, as on every other home */}
            <div style={{ marginBottom: L.gap }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("dr.home.greeting")}</h1>
              <p style={ty("body", { margin: "7px 0 0", color: c.inkMuted })}>
                {t("dr.home.meta", { trust: t("lf.trust"), campuses: campusLabel(t, campus) })}
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                {t("dr.home.kicker")}
              </p>
            </div>

            {/* FOUR things, and nothing else (designer, 2026-09-24):
                the trust's attendance, the leave he signs and the leave
                everyone is taking, the school calendar, and his staff's
                own dates. The funnel, the rule table, the campus-load
                split, the long-absence watch and the recently-settled
                list are gone — five restatements of one queue. */}
            <AttendanceCard campus={campus} />

            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", marginTop: L.gap }}>
              <div style={{ flex: "1.2 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                <SignCard reqs={reqs} onNavigate={onNavigate} />
                <AwayCard reqs={reqs} />
              </div>
              <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                {window.NaveyaHolidays && window.NaveyaHolidays.Card
                  ? React.createElement(window.NaveyaHolidays.Card, { onOpen: () => onNavigate("drLeave") })
                  : null}
                {LF.CelebrationsCard
                  ? React.createElement(LF.CelebrationsCard, { excludeId: "arvind", sub: t("dr.cel.sub") })
                  : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     DR-02 · LEAVE ACROSS THE TRUST
     ============================================================ */
  function RequestPanel({ req, reqs, onDone }) {
    const { t } = useLang();
    if (!req) return <LF.RequestPanel req={null} />;

    const clash = clashesWith(reqs, req);
    const cover = req.coverWith ? LF.personById(req.coverWith.who) : null;
    const facts = [
      { k: t("lf.fact.takes"), v: t("dr.d.costLine", { days: LF.daysWord(t, req.days, req.half), dept: t(LF.DEPTS[req.person.deptKey]), campus: t(req.person.campusKey) }) },
      { k: t("lf.fact.cover"), v: cover ? LF.coverLine(t, req) : t("lf.fact.coverNone"), tone: LF.coverState(req) === "declined" ? "absentText" : null },
      clash.length ? { k: t("lf.fact.away"), v: LF.awayText(t, clash) } : null,
      req.shortDays ? { k: t("lf.fact.unpaid"), v: LF.unpaidText(t, req.shortDays), tone: "penaltyText" } : null,
    ];

    return (
      <LF.RequestPanel
        req={req} you="director" facts={facts}
        decision={<LF.DecisionBox req={req} you="director" onDone={onDone} />}
      />
    );
  }

  function DRLeave({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const reqs0 = LF.useRequests();

    const [tab, setTab] = useState("mine");
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const [dept, setDept] = useState("all");
    const [state, setState] = useState("all");
    const [stage, setStage] = useState("all");
    const [search, setSearch] = useState("");
    const [longOnly, setLongOnly] = useState(false);
    const [openId, setOpenId] = useState(null);
    const [toast, setToast] = useState(null);

    /* the switch scopes the WHOLE screen — both tabs, the band and
       the panel — so the campus is no longer one filter among five
       that happens to apply to one of the two tables */
    const reqs = useMemo(function () {
      return reqs0.filter(function (r) { return inCampusKey(campus, r.person.campusKey); });
    }, [reqs0, campus]);
    const mine = reqs.filter((r) => LF.isWaitingOn(r, "director"));

    const all = useMemo(() => {
      const term = search.trim().toLowerCase();
      return reqs.filter((r) => {
        if (dept !== "all" && r.person.deptKey !== dept) return false;
        if (state !== "all" && LF.statusOf(r) !== state) return false;
        if (stage !== "all" && LF.waitingRole(r) !== stage) return false;
        if (longOnly && r.days <= LF.RULES.directorOver) return false;
        if (term && t(r.person.nameKey).toLowerCase().indexOf(term) === -1) return false;
        return true;
      }).sort((a, b) => {
        const pa = LF.statusOf(a) === "pending", pb = LF.statusOf(b) === "pending";
        if (pa !== pb) return pa ? -1 : 1;
        return LF.ageOf(b) - LF.ageOf(a);
      });
      // eslint-disable-next-line
    }, [reqs, dept, state, stage, search, longOnly, lang]);

    const rows = tab === "mine" ? mine : all;
    /* the panel opens on the first row of whatever tab you are on, so the
       screen never starts with an empty half */
    const fallback = rows.length ? rows[0] : null;
    const picked = openId ? reqs.filter((r) => r.id === openId)[0] : null;
    const shown = picked && rows.some((r) => r.id === picked.id) ? picked : fallback;

    const filters = (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ minWidth: 168 }}>
          <Select id="dr-dept" size="sm" value={dept} onChange={setDept}
            options={[{ value: "all", label: t("dr.f.deptAll") }].concat(Object.keys(LF.DEPTS).map((k) => ({ value: k, label: t(LF.DEPTS[k]) })))} />
        </div>
        <div style={{ minWidth: 152 }}>
          <Select id="dr-state" size="sm" value={state} onChange={setState}
            options={[{ value: "all", label: t("dr.f.stateAll") }, { value: "pending", label: t("lf.st.pending") }, { value: "approved", label: t("lf.st.approved") }, { value: "rejected", label: t("lf.st.rejected") }, { value: "cancelled", label: t("lf.st.cancelled") }]} />
        </div>
        <div style={{ minWidth: 172 }}>
          <Select id="dr-stage" size="sm" value={stage} onChange={setStage}
            options={[{ value: "all", label: t("dr.f.stageAll") }, { value: "deptHead", label: t("lf.st.withHead") }, { value: "principal", label: t("lf.st.withPrincipal") }, { value: "director", label: t("lf.st.withDirector") }]} />
        </div>
        <div style={{ minWidth: 176 }}>
          <Input id="dr-search" size="sm" value={search} onChange={setSearch} placeholder={t("dr.f.search")} />
        </div>
        <Pills
          ariaLabel={t("dr.f.long")} value={longOnly ? "long" : "any"} onChange={(k) => setLongOnly(k === "long")}
          items={[{ key: "any", label: t("dr.f.stateAll") }, { key: "long", label: t("dr.f.long") }]}
        />
      </div>
    );

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "director"} active="drLeave" onNavigate={onNavigate} initials="AB" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip crumbKey="nav.drLeave" campus={campus} onCampus={setCampus} />

            <div style={{ marginBottom: 18 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("dr.lv.title")}</h1>
              <div style={ty("small", { color: c.inkMuted, marginTop: 6 })}>{t("dr.lv.identity", { trust: t("lf.trust") })}</div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <Tabs
                ariaLabel={t("dr.lv.tabs")} idBase="dr-lv" active={tab} onChange={setTab}
                items={[
                  { key: "mine", label: t("dr.lv.tab.mine") + " · " + num(mine.length) },
                  { key: "all", label: t("dr.lv.tab.all") + " · " + num(reqs.length) },
                ]}
              />
            </div>

            <Band
              head={t("dr.lv.band")} sub={t("dr.lv.bandSub")}
              metrics={[
                { k: "mine", label: t("dr.lv.m.mine"), value: num(mine.length), n: mine.length,
                  note: t("dr.lv.m.mineNote"), tone: c.chartAmber, warn: mine.length > 0 },
                { k: "long", label: t("dr.lv.m.long"),
                  value: num(reqs.filter(function (r) { return r.days > LF.RULES.directorOver; }).length),
                  note: t("dr.lv.m.longNote"), tone: c.chartPurple },
                { k: "trust", label: t("dr.lv.m.trust"), value: num(reqs.length), n: reqs.length,
                  note: t("dr.lv.m.trustNote"), tone: c.chartBlue },
                { k: "days", label: t("dr.lv.m.days"),
                  value: num(mine.reduce(function (n, r) { return n + (r.days || 0); }, 0)),
                  note: t("dr.lv.m.daysNote"), tone: c.chartTeal },
              ]}
            />

            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
              <LF.QueueTable
                title={tab === "mine" ? t("dr.lv.mine.title") : t("dr.lv.all.title")}
                sub={tab === "mine" ? t("dr.lv.mine.sub", { n: num(mine.length) }) : t("dr.lv.all.sub", { shown: num(all.length), total: num(reqs.length) })}
                chips={tab === "all" ? filters : null}
                rows={rows} selected={shown ? shown.id : null} onSelect={setOpenId}
                you="director" showCampus
                emptyHead={tab === "mine" ? t("dr.lv.mineEmpty") : undefined}
                emptyBody={tab === "mine" ? t("dr.lv.mineEmptyBody") : undefined}
              />
              <RequestPanel req={shown} reqs={reqs} onDone={(outcome, message) => setToast(message)} />
            </div>
          </div>
        </main>
        <Toast text={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  /* ============================================================
     DR-03 · THE CAMPUSES TODAY

     The principal's board (PR-02) answers "where are the attendance
     problems on MY campus". A director has two, so this screen asks
     the question one level up: which campus, then which department,
     then who — with the campus picker as the first control rather
     than a filter buried in a table.

     He still decides nothing here. A correction belongs to the
     department head who owns the register; this screen says so and
     routes there rather than growing its own approve button.
     ============================================================ */
  function DRCampus({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const scope = campus === CAMPUS_ALL ? CD.SCOPE_ALL : campusKeyOf(campus);
    const depts = CD.departmentsOfScope(scope);
    const [openKey, setOpenKey] = useState(depts[0].key);
    const open = depts.filter((d) => d.key === openKey)[0] || depts[0];
    const T = CD.totalsOfScope(scope);
    const people = CD.exceptionsOfScope(scope, open.key);

    /* changing campus must not leave a department selected that the
       new scope does not have */
    function pickCampus(id) {
      setCampus(id);
      const next = CD.departmentsOfScope(id === CAMPUS_ALL ? CD.SCOPE_ALL : campusKeyOf(id));
      if (!next.some(function (d) { return d.key === openKey; })) setOpenKey(next[0].key);
    }

    const facts = [
      { key: "present", value: T.present, note: t("pr2.strip.presentNote", { pct: num(Math.round((T.present / T.total) * 100)) }), strong: true },
      { key: "late", value: T.late, note: t("pr2.strip.lateNote") },
      { key: "absent", value: T.absent, note: t("pr2.strip.absentNote") },
      { key: "leave", value: T.leave, note: t("pr2.strip.leaveNote") },
      { key: "awaiting", value: T.awaiting, note: t("pr2.strip.awaitingNote") },
    ];

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "director"} active="drCampus" onNavigate={onNavigate} initials="AB" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip crumbKey="nav.drCampus" campus={campus} onCampus={pickCampus} />

            <div style={{ marginBottom: L.gap }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("dr3.pageTitle")}</h1>
            </div>

            {/* the chosen scope. The legend that used to float at the
                top right was describing a chart that was not on the
                screen; now the chart is here and carries it. */}
            <Band
              head={campusLabel(t, campus)} sub={t("dr.home.kicker")}
              metrics={facts.map(function (f) {
                return {
                  k: f.key, label: t("pr.shape." + f.key), value: num(f.value), n: f.value, note: f.note,
                  tone: c[ATT_ROLE[f.key] + "Chart"] || c[ATT_ROLE[f.key]],
                  warn: f.key === "absent" && f.value > 0,
                };
              })}
              foot={t("dr3.band.foot")}
            />

            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", flexWrap: "wrap", marginTop: L.gap }}>
              <Card style={{ flex: "1 1 520px", minWidth: 0 }} title={t("pr2.board.title")} sub={t("pr2.board.sub")}>
                <div>
                  {depts.map((d, i) => {
                    const on = d.key === openKey;
                    const out = (d.absent + d.leave) / (d.total - d.awaiting);
                    return (
                      <button
                        key={d.key} type="button" onClick={() => setOpenKey(d.key)}
                        aria-pressed={on ? "true" : "false"}
                        aria-label={t("pr.matrix.viewDept", { dept: t(d.label) })}
                        style={{
                          display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                          border: "none", borderRadius: G3.r.md, cursor: "pointer",
                          background: on ? c.sel : "transparent",
                          padding: "12px 12px", marginInline: -12, width: "calc(100% + 24px)",
                          borderTop: i ? "1px solid " + c.rule : "none",
                        }}
                      >
                        <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                          <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(d.label)}</span>
                          <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>
                            {d.outage
                              ? t("pr2.board.outageLine", { n: num(d.awaiting) })
                              : t("pr2.board.line", { present: num(d.present + d.late), total: num(d.total) })}
                          </span>
                        </span>
                        <span style={{ flex: "0 0 auto" }}><RollBar d={d} width={210} /></span>
                        <span style={{ flex: "0 0 62px", textAlign: "right" }}>
                          <Figure value={num(Math.round(out * 100)) + "%"} size="sm" weight={700} color={out > 0.15 ? c.absentText : c.inkMuted} />
                          <span style={ty("caption", { display: "block", color: c.inkFaint })}>{t("pr2.board.out")}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card
                style={{ flex: "1 1 360px", minWidth: 0 }}
                icon="staff" iconTone="accent"
                title={t(open.label)}
                sub={t("pr2.people.sub", { present: num(open.present + open.late), total: num(open.total) })}
              >
                {open.outage ? (
                  <p style={ty("small", { margin: "0 0 14px", padding: "11px 13px", borderRadius: G3.r.md, background: c.missingTint, color: c.missingText, fontWeight: 600 })}>
                    {t("pr2.people.outage", { n: num(open.awaiting) })}
                  </p>
                ) : null}

                {people.length === 0 ? (
                  <EmptyState compact head={t("pr2.people.noneHead")} body={t("pr2.people.noneBody", { dept: t(open.label) })} />
                ) : (
                  <div>
                    {people.map((x, i) => (
                      <div key={x.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(x.key)}</span>
                          <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>
                            {t(x.desig)}{x.campusKey ? " \u00b7 " + t(x.campusKey) : ""}
                          </span>
                        </span>
                        {x.inTime ? <span style={G3.fig("sm", { color: c.ink, fontWeight: 600 })}>{x.inTime}</span> : null}
                        <StatusMark role={ATT_ROLE[x.status]} word={t("pr.shape." + x.status)} />
                      </div>
                    ))}
                  </div>
                )}
                <p style={ty("caption", { color: c.inkFaint, margin: "16px 0 0", paddingTop: 12, borderTop: "1px solid " + c.border })}>{t("dr3.readOnly")}</p>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.DRCampus = DRCampus;
  window.Pages3.DRHome = DRHome;
  window.Pages3.DRLeave = DRLeave;
})();
